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
        // Store constraints as JSON array
        constraints: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'Array of {day_of_week, shift_id, constraint_type}'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        },
        admin_response: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        requested_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
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