// backend/src/models/constraints/permanent-constraint.model.js
module.exports = (sequelize, DataTypes) => {
    const PermanentConstraint = sequelize.define('PermanentConstraint', {
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
            allowNull: true,
            references: {
                model: 'position_shifts',
                key: 'id'
            }
        },
        constraint_type: {
            type: DataTypes.ENUM('cannot_work', 'prefer_work'),
            allowNull: false
        },
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'employees',
                key: 'emp_id'
            }
        },
        approved_by_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        approved_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        deactivated_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'permanent_constraints',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });


    return PermanentConstraint;
};