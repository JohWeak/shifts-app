// backend/src/models/scheduling/position-shift.model.js
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
        }
    }, {
        tableName: 'position_shifts',
        timestamps: true
    });

    return PositionShift;
};