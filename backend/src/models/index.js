// backend/src/models/index.js
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db.config');
const {Sequelize} = require("sequelize");

const db = {};


function loadModelsRecursive(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            // Если это папка, вызываем эту же функцию для неё
            loadModelsRecursive(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.model.js')) {
            // Если это файл модели, импортируем его
            const model = require(fullPath)(sequelize, Sequelize.DataTypes);
            db[model.name] = model;

            // Логирование для наглядности (путь от папки 'models')
            const relativePath = path.relative(__dirname, fullPath);
            console.log(`✅ Loaded model: ${model.name} from /${relativePath}`);
        }
    }
}

// Запускаем рекурсивный обход, начиная с текущей директории (__dirname)
loadModelsRecursive(__dirname);

// Для будущего рефакторинга со связями внутри моделей
// После загрузки всех моделей, настраиваем ассоциации (связи)
// Object.keys(db).forEach(modelName => {
//     if (db[modelName].associate) {
//         db[modelName].associate(db);
//         console.log(`🔗 Associated model: ${modelName}`);
//     }
// });

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
        PositionShift,
        ShiftRequirement,
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

        // Добавляем many-to-many связь
        Employee.belongsToMany(Position, {
            through: 'employee_positions',
            foreignKey: 'emp_id',
            otherKey: 'position_id',
            as: 'positions'
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
    if (Employee && WorkSite) {
        Employee.belongsTo(WorkSite, {
            foreignKey: 'work_site_id',
            as: 'workSite'
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
        Position.belongsToMany(Employee, {
            through: 'employee_positions',
            foreignKey: 'position_id',
            otherKey: 'emp_id',
            as: 'employees'
        });
        Position.hasMany(Employee, {
            foreignKey: 'default_position_id',
            as: 'defaultEmployees'
        });
    }

    // Position и PositionShift associations
    if (Position && PositionShift) {
        Position.hasMany(PositionShift, {
            foreignKey: 'position_id',
            as: 'shifts'
        });

        PositionShift.belongsTo(Position, {
            foreignKey: 'position_id',
            as: 'position'
        });
    }

    // PositionShift и ShiftRequirement associations
    if (PositionShift && ShiftRequirement) {
        PositionShift.hasMany(ShiftRequirement, {
            foreignKey: 'position_shift_id',
            as: 'requirements'
        });

        ShiftRequirement.belongsTo(PositionShift, {
            foreignKey: 'position_shift_id',
            as: 'shift'
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
            WorkSite.hasMany(ScheduleSettings, {
                foreignKey: 'site_id',
                as: 'settings'
            });
        }
        if (Employee) {
            WorkSite.hasMany(Employee, {
                foreignKey: 'work_site_id',
                as: 'employees'
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