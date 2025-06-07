// backend/src/models/associations.js (исправленная версия)
const {
    Employee,
    WorkSite,
    Position,
    Shift,
    Schedule,
    ScheduleSettings,
    ScheduleAssignment,
    EmployeeConstraint,
    EmployeeQualification,
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

// Employee and Constraint relationships
Employee.hasMany(EmployeeConstraint, {
    foreignKey: 'emp_id',
    as: 'constraints',
    onDelete: 'CASCADE'
});
EmployeeConstraint.belongsTo(Employee, {
    foreignKey: 'emp_id',
    as: 'employee'
});

// Employee and Qualifications relationships
Employee.hasMany(EmployeeQualification, {
    foreignKey: 'emp_id',
    as: 'qualifications',
    onDelete: 'CASCADE'
});
EmployeeQualification.belongsTo(Employee, {
    foreignKey: 'emp_id',
    as: 'employee'
});

// УБИРАЕМ эти связи - теперь назначения только через ScheduleAssignment!
// Employee.hasMany(Shift, { ... }) - УДАЛЕНО
// Shift.belongsTo(Employee, { ... }) - УДАЛЕНО

// Shift and Constraint relationships
Shift.hasMany(EmployeeConstraint, {
    foreignKey: 'shift_id',
    as: 'constraints',
    onDelete: 'CASCADE'
});
EmployeeConstraint.belongsTo(Shift, {
    foreignKey: 'shift_id',
    as: 'shift'
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

// Schedule settings relationships
WorkSite.hasOne(ScheduleSettings, {
    foreignKey: 'site_id',
    as: 'scheduleSettings'
});
ScheduleSettings.belongsTo(WorkSite, {
    foreignKey: 'site_id',
    as: 'workSite'
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

module.exports = {
    Employee,
    WorkSite,
    Position,
    Shift,
    Schedule,
    ScheduleSettings,
    ScheduleAssignment,
    EmployeeConstraint,
    EmployeeQualification,
    LegalConstraint
};