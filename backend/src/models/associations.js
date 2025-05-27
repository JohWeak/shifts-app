// backend/src/models/associations.js
const {
    Employee,
    WorkSite,
    Position,
    Shift,
    Schedule,
    WorkDay,
    SchedulePeriod,
    ScheduleSettings,
    ConstraintType,
    ScheduleAssignment,
    LegalConstraint,
} = require('./index');

// Core relationships
WorkSite.hasMany(Position, {
    foreignKey: 'site_id',
    as: 'positions',
    onDelete: 'CASCADE'
});
Position.belongsTo(WorkSite, {
    foreignKey: 'site_id',
    as: 'workSite'
});

// Position and WorkDay relationships
Position.hasMany(WorkDay, {
    foreignKey: 'pos_id',
    as: 'workDays',
    onDelete: 'CASCADE'
});
WorkDay.belongsTo(Position, {
    foreignKey: 'pos_id',
    as: 'position'
});

// Employee and Constraint relationships
Employee.hasMany(ConstraintType, {
    foreignKey: 'emp_id',
    as: 'constraintTypes',
    onDelete: 'CASCADE'
});
ConstraintType.belongsTo(Employee, {
    foreignKey: 'emp_id',
    as: 'employee'
});

// Employee and Shift relationships
Employee.hasMany(Shift, {
    foreignKey: 'emp_id',
    as: 'shifts',
    onDelete: 'SET NULL'
});
Shift.belongsTo(Employee, {
    foreignKey: 'emp_id',
    as: 'employee'
});

// Shift and Constraint relationships
Shift.hasMany(ConstraintType, {
    foreignKey: 'shift_id',
    as: 'constraintTypes',
    onDelete: 'CASCADE'
});
ConstraintType.belongsTo(Shift, {
    foreignKey: 'shift_id',
    as: 'shift'
});

// Admin approval relationships
Employee.hasMany(ConstraintType, {
    foreignKey: 'approved_by',
    as: 'approvedConstraints'
});
ConstraintType.belongsTo(Employee, {
    foreignKey: 'approved_by',
    as: 'approver'
});

// WorkSite and Schedule relationships
WorkSite.hasMany(Schedule, {
    foreignKey: 'site_id',
    as: 'schedules',
    onDelete: 'CASCADE'
});
Schedule.belongsTo(WorkSite, {
    foreignKey: 'site_id',
    as: 'workSite'
});

// Schedule period relationships
WorkSite.hasMany(SchedulePeriod, {
    foreignKey: 'site_id',
    as: 'schedulePeriods'
});
SchedulePeriod.belongsTo(WorkSite, {
    foreignKey: 'site_id',
    as: 'workSite'
});

// Schedule settings relationships
WorkSite.hasOne(ScheduleSettings, {
    foreignKey: 'site_id',
    as: 'scheduleSettings'
});
ScheduleSettings.belongsTo(WorkSite, {
    foreignKey: 'site_id',
    as: 'workSite'
});

// Creator and approver relationships for schedule periods
Employee.hasMany(SchedulePeriod, {
    foreignKey: 'created_by',
    as: 'createdSchedulePeriods'
});
Employee.hasMany(SchedulePeriod, {
    foreignKey: 'approved_by',
    as: 'approvedSchedulePeriods'
});

SchedulePeriod.belongsTo(Employee, {
    foreignKey: 'created_by',
    as: 'creator'
});
SchedulePeriod.belongsTo(Employee, {
    foreignKey: 'approved_by',
    as: 'approver'
});

// Schedule Assignment relationships
Schedule.hasMany(ScheduleAssignment, {
    foreignKey: 'schedule_id',
    as: 'assignments',
    onDelete: 'CASCADE'
});
ScheduleAssignment.belongsTo(Schedule, {
    foreignKey: 'schedule_id',
    as: 'schedule'
});

Employee.hasMany(ScheduleAssignment, {
    foreignKey: 'emp_id',
    as: 'scheduleAssignments',
    onDelete: 'CASCADE'
});
ScheduleAssignment.belongsTo(Employee, {
    foreignKey: 'emp_id',
    as: 'employee'
});

Shift.hasMany(ScheduleAssignment, {
    foreignKey: 'shift_id',
    as: 'scheduleAssignments',
    onDelete: 'CASCADE'
});
ScheduleAssignment.belongsTo(Shift, {
    foreignKey: 'shift_id',
    as: 'shift'
});

Position.hasMany(ScheduleAssignment, {
    foreignKey: 'position_id',
    as: 'scheduleAssignments',
    onDelete: 'CASCADE'
});
ScheduleAssignment.belongsTo(Position, {
    foreignKey: 'position_id',
    as: 'position'
});

// Update exports to include ScheduleAssignment
module.exports = {
    Employee,
    WorkSite,
    Position,
    Shift,
    Schedule,
    WorkDay,
    SchedulePeriod,
    ScheduleSettings,
    ConstraintType,
    LegalConstraint,
    ScheduleAssignment
};