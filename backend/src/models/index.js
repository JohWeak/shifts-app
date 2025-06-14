// backend/src/models/index.js

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const db = {};

// Явно импортируем и определяем каждую модель
db.Employee = require('./core/employee.model')(sequelize, DataTypes);
db.WorkSite = require('./core/worksite.model')(sequelize, DataTypes);
db.EmployeeQualification = require('./core/employee-qualification.model')(sequelize, DataTypes);
db.Position = require('./scheduling/position.model')(sequelize, DataTypes);
db.Shift = require('./scheduling/shift.model')(sequelize, DataTypes);
db.Schedule = require('./scheduling/schedule.model')(sequelize, DataTypes);
db.ScheduleSettings = require('./scheduling/schedule-settings.model')(sequelize, DataTypes);
db.ScheduleAssignment = require('./scheduling/schedule-assignment.model')(sequelize, DataTypes);
db.EmployeeConstraint = require('./constraints/employee-constraint.model')(sequelize, DataTypes);
db.LegalConstraint = require('./constraints/legal-constraint.model')(sequelize, DataTypes);

// Проверяем, что все модели определились
console.log('[DEBUG] Keys in db object after definition:', Object.keys(db));

// --- ШАГ 2: Устанавливаем все связи ---
// Теперь db.WorkSite, db.Schedule и т.д. гарантированно существуют.

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

// ScheduleAssignment
db.ScheduleAssignment.belongsTo(db.Schedule, { foreignKey: 'schedule_id', as: 'schedule' });
db.ScheduleAssignment.belongsTo(db.Employee, { foreignKey: 'emp_id', as: 'employee' });
db.ScheduleAssignment.belongsTo(db.Shift, { foreignKey: 'shift_id', as: 'shift' });
db.ScheduleAssignment.belongsTo(db.Position, { foreignKey: 'position_id', as: 'position' });

// EmployeeConstraint
db.EmployeeConstraint.belongsTo(db.Employee, { foreignKey: 'emp_id', as: 'employee' });
db.EmployeeConstraint.belongsTo(db.Shift, { foreignKey: 'shift_id', as: 'shift' });

// EmployeeQualification
db.EmployeeQualification.belongsTo(db.Employee, { foreignKey: 'emp_id', as: 'employee' });

// ScheduleSettings
db.ScheduleSettings.belongsTo(db.WorkSite, { foreignKey: 'site_id', as: 'workSite' });

// --- ШАГ 3: Экспортируем готовый объект db ---
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;