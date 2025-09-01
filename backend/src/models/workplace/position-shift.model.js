// backend/src/models/scheduling/position-shift.model.js
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    let PositionShift;
    PositionShift = sequelize.define('PositionShift', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        position_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'positions',
                key: 'pos_id'
            }
        },
        shift_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        duration_hours: {
            type: DataTypes.VIRTUAL,
            get() {
                const start = this.start_time;
                const end = this.end_time;
                if (!start || !end) return 0;

                // Parse times
                const [startHour, startMin] = start.split(':').map(Number);
                const [endHour, endMin] = end.split(':').map(Number);

                let duration;
                if (endHour >= startHour) {
                    // Same day shift
                    duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                } else {
                    // Overnight shift
                    duration = (24 * 60 - (startHour * 60 + startMin)) + (endHour * 60 + endMin);
                }

                return duration / 60; // Return hours
            }
        },
        is_night_shift: {
            type: DataTypes.VIRTUAL,
            get() {
                const start = this.start_time;
                const end = this.end_time;
                if (!start || !end) return false;

                const [startHour] = start.split(':').map(Number);
                const [endHour] = end.split(':').map(Number);

                // Night shift if starts at 22:00 or later, or ends at 6:00 or earlier
                return startHour >= 22 || endHour <= 6;
            }
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        sort_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        color: {
            type: DataTypes.STRING(7),
            defaultValue: '#6c757d',
            validate: {
                is: /^#[0-9A-F]{6}$/i
            }
        },
        is_flexible: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: 'Whether this is a flexible shift that can span multiple regular shifts'
        },
        spans_shifts: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'JSON array of position_shift IDs that this flexible shift spans/covers'
        },
        calculated_duration_hours: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: true,
            comment: 'Stored duration in hours for flexible shifts'
        }
    }, {
        tableName: 'position_shifts',
        timestamps: true
    });

    // Static methods for flexible shift calculations
    PositionShift.hasTimeOverlap = function(start1, end1, start2, end2) {
        // Convert times to minutes from start of day for comparison
        const toMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        
        let flex_start = toMinutes(start1);
        let flex_end = toMinutes(end1);
        let shift_start = toMinutes(start2);
        let shift_end = toMinutes(end2);
        
        // Handle overnight shifts (end < start means crossing midnight)
        if (flex_end < flex_start) {
            flex_end += 24 * 60; // Add 24 hours
        }
        
        if (shift_end < shift_start) {
            shift_end += 24 * 60; // Add 24 hours
        }
        
        // Check for any time overlap
        return Math.max(flex_start, shift_start) < Math.min(flex_end, shift_end);
    };

    PositionShift.calculateSpanningShifts = function(flexibleStartTime, flexibleEndTime, regularShifts) {
        const spans = [];
        
        regularShifts.forEach(shift => {
            if (this.hasTimeOverlap(flexibleStartTime, flexibleEndTime, shift.start_time, shift.end_time)) {
                spans.push(shift.id);
            }
        });
        
        return spans;
    };

    // Instance method to calculate and update spans_shifts
    PositionShift.prototype.updateSpanningShifts = async function(regularShifts = null) {
        if (!this.is_flexible) return;
        
        if (!regularShifts) {
            // Get all regular shifts for the same position
            regularShifts = await PositionShift.findAll({
                where: {
                    position_id: this.position_id,
                    is_active: true,
                    is_flexible: false,
                    id: { [Op.ne]: this.id }
                }
            });
        }
        
        const spans = PositionShift.calculateSpanningShifts(
            this.start_time,
            this.end_time,
            regularShifts
        );
        
        this.spans_shifts = spans;
        this.calculated_duration_hours = this.duration_hours;
        
        return spans;
    };

    // Validation method for flexible shifts
    PositionShift.validateFlexibleShift = function(start_time, end_time, position_id, excludeId = null) {
        const errors = [];
        
        // Calculate duration
        const [startHour, startMin] = start_time.split(':').map(Number);
        const [endHour, endMin] = end_time.split(':').map(Number);
        
        let duration;
        if (endHour >= startHour) {
            duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        } else {
            duration = (24 * 60 - (startHour * 60 + startMin)) + (endHour * 60 + endMin);
        }
        const durationHours = duration / 60;
        
        // Validate maximum duration (12 hours as per legal constraints)
        if (durationHours > 12) {
            errors.push('Flexible shift duration cannot exceed 12 hours');
        }
        
        // Validate minimum duration (1 hour)
        if (durationHours < 1) {
            errors.push('Flexible shift duration must be at least 1 hour');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            durationHours
        };
    };

    return PositionShift;
};