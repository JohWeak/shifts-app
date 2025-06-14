// backend/src/models/index.js

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const db = {};

// --- ШАГ 1: Импортируем все фабрики моделей ---
// Мы не вызываем их, а просто импортируем сами функции.
const employeeModelFactory = require('./core/employee.model');
const worksiteModelFactory = require('./core/worksite.model');
const employeeQualificationModelFactory = require('./core/employee-qualification.model');
const positionModelFactory = require('./scheduling/position.model');
const shiftModelFactory = require('./scheduling/shift.model');
const scheduleModelFactory = require('./scheduling/schedule.model');
const scheduleSettingsModelFactory = require('./scheduling/schedule-settings.model');
const scheduleAssignmentModelFactory = require('./scheduling/schedule-assignment.model');
const employeeConstraintModelFactory = require('./constraints/employee-constraint.model');
const legalConstraintModelFactory = require('./constraints/legal-constraint.model');

// --- ШАГ 2: Определяем все модели, вызывая фабрики ---
// Теперь все модели существуют как объекты Sequelize.
db.Employee = employeeModelFactory(sequelize, DataTypes);
db.WorkSite = worksiteModelFactory(sequelize, DataTypes);
db.EmployeeQualification = employeeQualificationModelFactory(sequelize, DataTypes);
db.Position = positionModelFactory(sequelize, DataTypes);
db.Shift = shiftModelFactory(sequelize, DataTypes);
db.Schedule = scheduleModelFactory(sequelize, DataTypes);
db.ScheduleSettings = scheduleSettingsModelFactory(sequelize, DataTypes);
db.ScheduleAssignment = scheduleAssignmentModelFactory(sequelize, DataTypes);
db.EmployeeConstraint = employeeConstraintModelFactory(sequelize, DataTypes);
db.LegalConstraint = legalConstraintModelFactory(sequelize, DataTypes);

// --- ШАГ 3: Устанавливаем все связи (ассоциации) ---
// Этот код гарантирует, что `associate` вызывается тогда, когда ВСЕ
// модели (db.Employee, db.WorkSite, db.Schedule и т.д.) уже определены.

// Employee
db.Employee.belongsTo(db.Position, { foreignKey: 'default_position_id', as: 'defaultPosition' });
db.Employee.hasMany(db.EmployeeConstraint, { foreignKey: 'emp_id', as: 'constraints', onDelete: 'CASCADE' });
db.Employee.hasMany(db.ScheduleAssignment, { foreignKey: 'emp_id', as: 'scheduleAssignments', onDelete: 'CASCADE' });
db.Employee.hasMany(db.EmployeeQualification, { foreignKey: 'emp_id', as: 'qualifications', onDelete: 'CASCADE' });

// WorkSite
db.WorkSite.hasMany(db.Position, { foreignKey: 'site_id', as: 'positions', onDelete: 'CASCADE' });
db.WorkSite.hasMany(db.Schedule, { foreignKey: 'site_id', as: 'schedules', onDelete: 'CASCADE' });
db.WorkSite.hasOne(db.ScheduleSettings, { foreignKey: 'site_id', as: 'scheduleSettings' });

// Position
db.Position.belongsTo(db.WorkSite, { foreignKey: 'site_id', as: 'workSite' });
db.Position.hasMany(db.Employee, { foreignKey: 'default_position_id', as: 'defaultEmployees' });
db.Position.hasMany(db.ScheduleAssignment, { foreignKey: 'position_id', as: 'scheduleAssignments', onDelete: 'CASCADE' });

// Shift
db.Shift.hasMany(db.EmployeeConstraint, { foreignKey: 'shift_id', as: 'constraints', onDelete: 'CASCADE' });
db.Shift.hasMany(db.ScheduleAssignment, { foreignKey: 'shift_id', as: 'scheduleAssignments', onDelete: 'CASCADE' });

// Schedule
db.Schedule.belongsTo(db.WorkSite, { foreignKey: 'site_id', as: 'workSite' });
db.Schedule.hasMany(db.ScheduleAssignment, { foreignKey: 'schedule_id', as: 'assignments', onDelete: 'CASCADE' });

// ScheduleAssignment (связи "belongsTo")
db.ScheduleAssignment.belongsTo(db.Schedule, { foreignKey: 'schedule_id', as: 'schedule' });
db.ScheduleAssignment.belongsTo(db.Employee, { foreignKey: 'emp_id', as: 'employee' });
db.ScheduleAssignment.belongsTo(db.Shift, { foreignKey: 'shift_id', as: 'shift' });
db.ScheduleAssignment.belongsTo(db.Position, { foreignKey: 'position_id', as: 'position' });

// EmployeeConstraint (связи "belongsTo")
db.EmployeeConstraint.belongsTo(db.Employee, { foreignKey: 'emp_id', as: 'employee' });
db.EmployeeConstraint.belongsTo(db.Shift, { foreignKey: 'shift_id', as: 'shift' });

// EmployeeQualification (связи "belongsTo")
db.EmployeeQualification.belongsTo(db.Employee, { foreignKey: 'emp_id', as: 'employee' });

// ScheduleSettings (связи "belongsTo")
db.ScheduleSettings.belongsTo(db.WorkSite, { foreignKey: 'site_id', as: 'workSite' });

// --- ШАГ 4: Экспортируем готовый объект db ---
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;