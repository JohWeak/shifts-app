// backend/src/models/index.js
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db.config');
const {Sequelize} = require("sequelize");

const db = {};


// Функция для загрузки моделей из папки
function loadModelsFromFolder(folderPath, folderName) {
    fs.readdirSync(folderPath)
        .filter(file => file.endsWith('.model.js'))
        .forEach(file => {
            const modelPath = path.join(folderPath, file);
            const model = require(modelPath)(sequelize, Sequelize.DataTypes);
            db[model.name] = model;
            console.log(`Loaded model: ${model.name} from ${folderName}/${file}`);
        });
}

// Загружаем модели из каждой папки
['core', 'scheduling', 'constraints'].forEach(folder => {
    const folderPath = path.join(__dirname, folder);
    if (fs.existsSync(folderPath)) {
        loadModelsFromFolder(folderPath, folder);
    }
});

// Добавляем Sequelize в db объект
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Определяем все ассоциации здесь
const defineAssociations = () => {
    const {
        Employee,
        WorkSite,
        Position,
        Shift,
        Schedule,
        ScheduleAssignment,
        ScheduleSettings,
        EmployeeConstraint,
        EmployeeQualification,
        LegalConstraint,
        SchedulePeriod,
        Workday
    } = db;

    // Employee associations
    if (Employee && Position) {
        Employee.belongsTo(Position, {
            foreignKey: 'default_position_id',
            as: 'defaultPosition'
        });
    }

    if (Employee && EmployeeConstraint) {
        Employee.hasMany(EmployeeConstraint, {
            foreignKey: 'emp_id',
            as: 'constraints'
        });
    }

    if (Employee && ScheduleAssignment) {
        Employee.hasMany(ScheduleAssignment, {
            foreignKey: 'emp_id',
            as: 'assignments'
        });
    }

    // Position associations
    if (Position && WorkSite) {
        Position.belongsTo(WorkSite, {
            foreignKey: 'site_id',
            as: 'workSite'
        });
    }

    if (Position && Employee) {
        Position.hasMany(Employee, {
            foreignKey: 'default_position_id',
            as: 'employees'
        });
    }

    // Schedule associations
    if (Schedule && WorkSite) {
        Schedule.belongsTo(WorkSite, {
            foreignKey: 'site_id',
            as: 'workSite'
        });
    }

    if (Schedule && ScheduleAssignment) {
        Schedule.hasMany(ScheduleAssignment, {
            foreignKey: 'schedule_id',
            as: 'assignments',
            onDelete: 'CASCADE'
        });
    }

    // ScheduleAssignment associations
    if (ScheduleAssignment) {
        if (Schedule) {
            ScheduleAssignment.belongsTo(Schedule, {
                foreignKey: 'schedule_id',
                as: 'schedule'
            });
        }

        if (Employee) {
            ScheduleAssignment.belongsTo(Employee, {
                foreignKey: 'emp_id',
                as: 'employee'
            });
        }

        if (Shift) {
            ScheduleAssignment.belongsTo(Shift, {
                foreignKey: 'shift_id',
                as: 'shift'
            });
        }

        if (Position) {
            ScheduleAssignment.belongsTo(Position, {
                foreignKey: 'position_id',
                as: 'position'
            });
        }
    }

    // ScheduleSettings associations
    if (ScheduleSettings && WorkSite) {
        ScheduleSettings.belongsTo(WorkSite, {
            foreignKey: 'site_id',
            as: 'workSite'
        });
    }

    // EmployeeConstraint associations
    if (EmployeeConstraint) {
        if (Employee) {
            EmployeeConstraint.belongsTo(Employee, {
                foreignKey: 'emp_id',
                as: 'employee'
            });
        }

        if (Shift) {
            EmployeeConstraint.belongsTo(Shift, {
                foreignKey: 'shift_id',
                as: 'shift'
            });
        }
    }

    // WorkSite associations
    if (WorkSite) {
        if (Schedule) {
            WorkSite.hasMany(Schedule, {
                foreignKey: 'site_id',
                as: 'schedules'
            });
        }

        if (Position) {
            WorkSite.hasMany(Position, {
                foreignKey: 'site_id',
                as: 'positions'
            });
        }

        if (ScheduleSettings) {
            WorkSite.hasOne(ScheduleSettings, {
                foreignKey: 'site_id',
                as: 'settings'
            });
        }
    }

    if (EmployeeQualification && Employee) {
        EmployeeQualification.belongsTo(Employee, {
            foreignKey: 'emp_id',
            as: 'employee'
        });

        Employee.hasMany(EmployeeQualification, {
            foreignKey: 'emp_id',
            as: 'qualifications'
        });
    }
};

// Вызываем функцию определения ассоциаций
defineAssociations();

module.exports = db;