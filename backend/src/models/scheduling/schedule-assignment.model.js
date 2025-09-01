// backend/src/models/scheduling/schedule-assignment.model.js
module.exports = (sequelize, DataTypes) => {
    const ScheduleAssignment = sequelize.define('ScheduleAssignment', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        schedule_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'schedules', key: 'id' }
        },
        emp_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'employees', key: 'emp_id' }
        },
        shift_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'position_shifts', key: 'shift_id' }
        },
        position_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'positions', key: 'pos_id' }
        },
        work_date: { type: DataTypes.DATEONLY, allowNull: false },
        status: {
            type: DataTypes.ENUM('scheduled', 'completed', 'absent', 'late'),
            defaultValue: 'scheduled'
        },
        assignment_type: {
            type: DataTypes.ENUM('regular', 'flexible'),
            defaultValue: 'regular',
            comment: 'Type of assignment: regular (normal) or flexible (using flexible shift)'
        },
        custom_start_time: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: 'Custom start time for flexible assignments (overrides shift start_time)'
        },
        custom_end_time: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: 'Custom end time for flexible assignments (overrides shift end_time)'
        },
        covering_for_emp_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'employees', key: 'emp_id' },
            comment: 'Employee ID this flexible assignment is covering for'
        },
        confirmed_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'When this flexible assignment was confirmed'
        },
        notes: { type: DataTypes.TEXT }
    }, {
        tableName: 'schedule_assignments',
        timestamps: true
    });

    // Virtual fields for effective work times
    ScheduleAssignment.prototype.getEffectiveStartTime = function() {
        return this.custom_start_time || (this.shift ? this.shift.start_time : null);
    };

    ScheduleAssignment.prototype.getEffectiveEndTime = function() {
        return this.custom_end_time || (this.shift ? this.shift.end_time : null);
    };

    ScheduleAssignment.prototype.getDisplayHours = function() {
        const startTime = this.getEffectiveStartTime();
        const endTime = this.getEffectiveEndTime();
        
        if (!startTime || !endTime) return '';

        // For flexible assignments with custom times, show custom hours
        if (this.assignment_type === 'flexible' && (this.custom_start_time || this.custom_end_time)) {
            return `${startTime.substring(0, 5)}-${endTime.substring(0, 5)}`;
        }

        return '';
    };

    ScheduleAssignment.prototype.isFlexibleAssignment = function() {
        return this.assignment_type === 'flexible';
    };

    return ScheduleAssignment;
};