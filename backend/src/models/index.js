// backend/src/models/index.js
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db.config');
const {Sequelize} = require("sequelize");

const db = {};

function loadModelsRecursive(directory) {
    const entries = fs.readdirSync(directory, {withFileTypes: true});

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

// Добавляем Sequelize в db объект
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Определяем все ассоциации здесь
const defineAssociations = () => {
    const {
        Employee,
        WorkSite,
        Position,
        Schedule,
        ScheduleAssignment,
        ScheduleSettings,
        EmployeeConstraint,
        EmployeeQualification,
        PositionShift,
        ShiftRequirement,
        LegalConstraint,
        SchedulePeriod,
        Workday,
        PermanentConstraintRequest,
        PermanentConstraint
    } = db;

    // =============================
    // EMPLOYEE ASSOCIATIONS
    // =============================
    if (Employee) {
        // Employee -> Position (default position)
        if (Position) {
            Employee.belongsTo(Position, {
                foreignKey: 'default_position_id',
                as: 'defaultPosition'
            });

            // Employee <-> Position (many-to-many через employee_positions)
            Employee.belongsToMany(Position, {
                through: 'employee_positions',
                foreignKey: 'emp_id',
                otherKey: 'position_id',
                as: 'positions'
            });
        }

        // Employee -> WorkSite
        if (WorkSite) {
            Employee.belongsTo(WorkSite, {
                foreignKey: 'work_site_id',
                as: 'workSite'
            });
        }

        // Employee -> EmployeeConstraint[]
        if (EmployeeConstraint) {
            Employee.hasMany(EmployeeConstraint, {
                foreignKey: 'emp_id',
                as: 'constraints'
            });
        }

        // Employee -> ScheduleAssignment[]
        if (ScheduleAssignment) {
            Employee.hasMany(ScheduleAssignment, {
                foreignKey: 'emp_id',
                as: 'assignments'
            });
        }

        // Employee -> EmployeeQualification[]
        if (EmployeeQualification) {
            Employee.hasMany(EmployeeQualification, {
                foreignKey: 'emp_id',
                as: 'qualifications'
            });
        }

        // Employee -> PermanentConstraintRequest[]
        if (PermanentConstraintRequest) {
            Employee.hasMany(PermanentConstraintRequest, {
                foreignKey: 'emp_id',
                as: 'permanentRequests'
            });
        }

        // Employee -> PermanentConstraint[]
        if (PermanentConstraint) {
            Employee.hasMany(PermanentConstraint, {
                foreignKey: 'emp_id',
                as: 'permanentConstraints'
            });
        }
    }

    // =============================
    // WORKSITE ASSOCIATIONS
    // =============================
    if (WorkSite) {
        // WorkSite -> Employee[]
        if (Employee) {
            WorkSite.hasMany(Employee, {
                foreignKey: 'work_site_id',
                as: 'employees'
            });
        }

        // WorkSite -> Position[]
        if (Position) {
            WorkSite.hasMany(Position, {
                foreignKey: 'site_id',
                as: 'positions'
            });
        }

        // WorkSite -> Schedule[]
        if (Schedule) {
            WorkSite.hasMany(Schedule, {
                foreignKey: 'site_id',
                as: 'schedules'
            });
        }

        // WorkSite -> ScheduleSettings[]
        if (ScheduleSettings) {
            WorkSite.hasMany(ScheduleSettings, {
                foreignKey: 'site_id',
                as: 'settings'
            });
        }
    }

    // =============================
    // POSITION ASSOCIATIONS
    // =============================
    if (Position) {
        // Position -> WorkSite
        if (WorkSite) {
            Position.belongsTo(WorkSite, {
                foreignKey: 'site_id',
                as: 'workSite'
            });
        }

        // Position <-> Employee (many-to-many через employee_positions)
        if (Employee) {
            Position.belongsToMany(Employee, {
                through: 'employee_positions',
                foreignKey: 'position_id',
                otherKey: 'emp_id',
                as: 'employees'
            });

            // Position -> Employee[] (сотрудники с этой позицией по умолчанию)
            Position.hasMany(Employee, {
                foreignKey: 'default_position_id',
                as: 'defaultEmployees'
            });
        }

        // Position -> PositionShift[]
        if (PositionShift) {
            Position.hasMany(PositionShift, {
                foreignKey: 'position_id',
                as: 'shifts'
            });
        }
    }

    // =============================
    // POSITION SHIFT ASSOCIATIONS
    // =============================
    if (PositionShift) {
        // PositionShift -> Position
        if (Position) {
            PositionShift.belongsTo(Position, {
                foreignKey: 'position_id',
                as: 'position'
            });
        }

        // PositionShift -> ShiftRequirement[]
        if (ShiftRequirement) {
            PositionShift.hasMany(ShiftRequirement, {
                foreignKey: 'position_shift_id',
                as: 'requirements'
            });
        }
    }

    // =============================
    // SHIFT REQUIREMENT ASSOCIATIONS
    // =============================
    if (ShiftRequirement && PositionShift) {
        ShiftRequirement.belongsTo(PositionShift, {
            foreignKey: 'position_shift_id',
            as: 'shift'
        });
    }

    // =============================
    // SCHEDULE ASSOCIATIONS
    // =============================
    if (Schedule) {
        // Schedule -> WorkSite
        if (WorkSite) {
            Schedule.belongsTo(WorkSite, {
                foreignKey: 'site_id',
                as: 'workSite'
            });
        }

        // Schedule -> ScheduleAssignment[]
        if (ScheduleAssignment) {
            Schedule.hasMany(ScheduleAssignment, {
                foreignKey: 'schedule_id',
                as: 'assignments',
                onDelete: 'CASCADE'
            });
        }
    }

    // =============================
    // SCHEDULE ASSIGNMENT ASSOCIATIONS
    // =============================
    if (ScheduleAssignment) {
        // ScheduleAssignment -> Schedule
        if (Schedule) {
            ScheduleAssignment.belongsTo(Schedule, {
                foreignKey: 'schedule_id',
                as: 'schedule'
            });
        }

        // ScheduleAssignment -> Employee
        if (Employee) {
            ScheduleAssignment.belongsTo(Employee, {
                foreignKey: 'emp_id',
                as: 'employee'
            });
        }

        // ScheduleAssignment -> Position
        if (Position) {
            ScheduleAssignment.belongsTo(Position, {
                foreignKey: 'position_id',
                as: 'position'
            });
        }

        // ScheduleAssignment -> PositionShift (NOT Shift!)
        if (PositionShift) {
            ScheduleAssignment.belongsTo(PositionShift, {
                foreignKey: 'shift_id',
                as: 'shift'
            });
        }
    }

    // =============================
    // EMPLOYEE CONSTRAINT ASSOCIATIONS
    // =============================
    if (EmployeeConstraint) {
        // EmployeeConstraint -> Employee
        if (Employee) {
            EmployeeConstraint.belongsTo(Employee, {
                foreignKey: 'emp_id',
                as: 'employee'
            });
        }

        // EmployeeConstraint -> PositionShift (NOT Shift!)
        if (PositionShift) {
            EmployeeConstraint.belongsTo(PositionShift, {
                foreignKey: 'shift_id',
                as: 'shift'
            });
        }
    }

    // =============================
    // EMPLOYEE QUALIFICATION ASSOCIATIONS
    // =============================
    if (EmployeeQualification && Employee) {
        EmployeeQualification.belongsTo(Employee, {
            foreignKey: 'emp_id',
            as: 'employee'
        });
    }

    // =============================
    // SCHEDULE SETTINGS ASSOCIATIONS
    // =============================
    if (ScheduleSettings && WorkSite) {
        ScheduleSettings.belongsTo(WorkSite, {
            foreignKey: 'site_id',
            as: 'workSite'
        });
    }
    // =============================
    // PERMANENT CONSTRAINT REQUEST ASSOCIATIONS
    // =============================
    if (PermanentConstraintRequest) {
        // PermanentConstraintRequest -> Employee
        if (Employee) {
            PermanentConstraintRequest.belongsTo(Employee, {
                foreignKey: 'emp_id',
                as: 'employee'
            });

            PermanentConstraintRequest.belongsTo(Employee, {
                foreignKey: 'reviewed_by',
                as: 'reviewer'
            });
        }
    }
    // =============================
    // PERMANENT CONSTRAINT ASSOCIATIONS
    // =============================
    if (PermanentConstraint) {
        if (Employee) {
            // Constraint owner
            PermanentConstraint.belongsTo(Employee, {
                foreignKey: 'emp_id',
                as: 'employee'
            });

            // Constraint approver
            PermanentConstraint.belongsTo(Employee, {
                foreignKey: 'approved_by',
                as: 'approver'
            });
        }

        if (PositionShift) {
            PermanentConstraint.belongsTo(PositionShift, {
                foreignKey: 'shift_id',
                as: 'shift'
            });
        }
    }
};

// Вызываем функцию определения ассоциаций
defineAssociations();

module.exports = db;