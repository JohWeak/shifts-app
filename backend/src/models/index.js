// backend/src/models/index.js

const {Sequelize, DataTypes} = require('sequelize');
const sequelize = require('../config/db.config');

const db = {};

console.log('--- [MODELS] STARTING INITIALIZATION ---');

try {
    const modelFactories = [
        {name: 'Employee', factory: require('./core/employee.model')},
        {name: 'WorkSite', factory: require('./core/worksite.model')},
        {name: 'EmployeeQualification', factory: require('./core/employee-qualification.model')},
        {name: 'Position', factory: require('./scheduling/position.model')},
        {name: 'Shift', factory: require('./scheduling/shift.model')},
        {name: 'Schedule', factory: require('./scheduling/schedule.model')},
        {name: 'ScheduleSettings', factory: require('./scheduling/schedule-settings.model')},
        {name: 'ScheduleAssignment', factory: require('./scheduling/schedule-assignment.model')},
        {name: 'EmployeeConstraint', factory: require('./constraints/employee-constraint.model')},
        {name: 'LegalConstraint', factory: require('./constraints/legal-constraint.model')},
    ];

    modelFactories.forEach(item => {
        console.log(`[MODELS] Loading model: ${item.name}`);
        if (typeof item.factory !== 'function') {
            // Эта проверка сразу покажет проблемный файл
            throw new Error(`Model factory for ${item.name} is not a function! Check the export in the model file.`);
        }
        const model = item.factory(sequelize, DataTypes);
        db[model.name] = model;
        console.log(`[MODELS] -> ${model.name} loaded.`);
    });

    console.log('[MODELS] All models loaded. Establishing associations...');

// --- ШАГ 3: Устанавливаем все связи (ассоциации) ---
// Этот код гарантирует, что `associate` вызывается тогда, когда ВСЕ
// модели (db.Employee, db.WorkSite, db.Schedule и т.д.) уже определены.

// Employee
    db.Employee.belongsTo(db.Position, {foreignKey: 'default_position_id', as: 'defaultPosition'});
    db.Employee.hasMany(db.EmployeeConstraint, {foreignKey: 'emp_id', as: 'constraints', onDelete: 'CASCADE'});
    db.Employee.hasMany(db.ScheduleAssignment, {foreignKey: 'emp_id', as: 'scheduleAssignments', onDelete: 'CASCADE'});
    db.Employee.hasMany(db.EmployeeQualification, {foreignKey: 'emp_id', as: 'qualifications', onDelete: 'CASCADE'});

// WorkSite
    db.WorkSite.hasMany(db.Position, {foreignKey: 'site_id', as: 'positions', onDelete: 'CASCADE'});
    db.WorkSite.hasMany(db.Schedule, {foreignKey: 'site_id', as: 'schedules', onDelete: 'CASCADE'});
    db.WorkSite.hasOne(db.ScheduleSettings, {foreignKey: 'site_id', as: 'scheduleSettings'});

// Position
    db.Position.belongsTo(db.WorkSite, {foreignKey: 'site_id', as: 'workSite'});
    db.Position.hasMany(db.Employee, {foreignKey: 'default_position_id', as: 'defaultEmployees'});
    db.Position.hasMany(db.ScheduleAssignment, {
        foreignKey: 'position_id',
        as: 'scheduleAssignments',
        onDelete: 'CASCADE'
    });

// Shift
    db.Shift.hasMany(db.EmployeeConstraint, {foreignKey: 'shift_id', as: 'constraints', onDelete: 'CASCADE'});
    db.Shift.hasMany(db.ScheduleAssignment, {foreignKey: 'shift_id', as: 'scheduleAssignments', onDelete: 'CASCADE'});

// Schedule
    db.Schedule.belongsTo(db.WorkSite, {foreignKey: 'site_id', as: 'workSite'});
    db.Schedule.hasMany(db.ScheduleAssignment, {foreignKey: 'schedule_id', as: 'assignments', onDelete: 'CASCADE'});

// ScheduleAssignment (связи "belongsTo")
    db.ScheduleAssignment.belongsTo(db.Schedule, {foreignKey: 'schedule_id', as: 'schedule'});
    db.ScheduleAssignment.belongsTo(db.Employee, {foreignKey: 'emp_id', as: 'employee'});
    db.ScheduleAssignment.belongsTo(db.Shift, {foreignKey: 'shift_id', as: 'shift'});
    db.ScheduleAssignment.belongsTo(db.Position, {foreignKey: 'position_id', as: 'position'});

// EmployeeConstraint (связи "belongsTo")
    db.EmployeeConstraint.belongsTo(db.Employee, {foreignKey: 'emp_id', as: 'employee'});
    db.EmployeeConstraint.belongsTo(db.Shift, {foreignKey: 'shift_id', as: 'shift'});

// EmployeeQualification (связи "belongsTo")
    db.EmployeeQualification.belongsTo(db.Employee, {foreignKey: 'emp_id', as: 'employee'});

// ScheduleSettings (связи "belongsTo")
    db.ScheduleSettings.belongsTo(db.WorkSite, {foreignKey: 'site_id', as: 'workSite'});

    console.log('[MODELS] --- ASSOCIATIONS ESTABLISHED ---');

} catch (e) {
    console.error('!!!!!! [MODELS] FATAL ERROR DURING MODEL INITIALIZATION !!!!!!');
    console.error(e);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;