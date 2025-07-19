// backend/src/models/constraints/permanent-constraint-request.model.js
module.exports = (sequelize, DataTypes) => {
    const PermanentConstraintRequest = sequelize.define('PermanentConstraintRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        emp_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'employees',
                key: 'emp_id'
            }
        },
        day_of_week: {
            type: DataTypes.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
            allowNull: false
        },
        shift_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'position_shifts',
                key: 'id'
            }
        },
        constraint_type: {
            type: DataTypes.ENUM('cannot_work', 'prefer_work'),
            allowNull: false
        },
        reason: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        },
        admin_response: {
            type: DataTypes.TEXT
        },
        requested_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        reviewed_at: {
            type: DataTypes.DATE
        },
        reviewed_by: {
            type: DataTypes.INTEGER,
            references: {
                model: 'employees',
                key: 'emp_id'
            }
        }
    }, {
        tableName: 'permanent_constraint_requests',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return PermanentConstraintRequest;
};