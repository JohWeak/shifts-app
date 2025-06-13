// backend/src/models/index.js
const sequelize = require('../config/db.config');
const { DataTypes } = require('sequelize');

const db = {};

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

// Импорт всех моделей
db.Employee = require('./core/employee.model')(sequelize, DataTypes);
db.WorkSite = require('./core/worksite.model')(sequelize, DataTypes);
db.EmployeeQualification = require('./core/employee-qualification.model')(sequelize, DataTypes);

db.Position = require('./scheduling/position.model')(sequelize, DataTypes);
db.Shift = require('./scheduling/shift.model')(sequelize, DataTypes);
db.Schedule = require('./scheduling/schedule.model')(sequelize, DataTypes);
db.ScheduleSettings = require('./scheduling/schedule-settings.model')(sequelize, DataTypes);
db.ScheduleAssignment = require('./scheduling/schedule-assignment.model')(sequelize, DataTypes);
// WorkDay и SchedulePeriod пока не используются активно, можно будет добавить позже, если понадобятся

db.EmployeeConstraint = require('./constraints/employee-constraint.model')(sequelize, DataTypes);
db.LegalConstraint = require('./constraints/legal-constraint.model')(sequelize, DataTypes);

// Установка связей (ассоциаций)
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;