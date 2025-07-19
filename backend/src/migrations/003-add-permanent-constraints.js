// backend/src/migrations/003-add-permanent-constraints.js
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create permanent_constraint_requests table
        await queryInterface.createTable('permanent_constraint_requests', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            emp_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'employees',
                    key: 'emp_id'
                }
            },
            day_of_week: {
                type: Sequelize.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
                allowNull: false
            },
            shift_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'position_shifts',
                    key: 'id'
                }
            },
            constraint_type: {
                type: Sequelize.ENUM('cannot_work', 'prefer_work'),
                allowNull: false
            },
            reason: {
                type: Sequelize.TEXT
            },
            status: {
                type: Sequelize.ENUM('pending', 'approved', 'rejected'),
                defaultValue: 'pending'
            },
            admin_response: {
                type: Sequelize.TEXT
            },
            requested_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            reviewed_at: {
                type: Sequelize.DATE
            },
            reviewed_by: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'employees',
                    key: 'emp_id'
                }
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Create permanent_constraints table
        await queryInterface.createTable('permanent_constraints', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            emp_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'employees',
                    key: 'emp_id'
                }
            },
            day_of_week: {
                type: Sequelize.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
                allowNull: false
            },
            shift_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'position_shifts',
                    key: 'id'
                }
            },
            constraint_type: {
                type: Sequelize.ENUM('cannot_work', 'prefer_work'),
                allowNull: false
            },
            approved_by: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'employees',
                    key: 'emp_id'
                }
            },
            approved_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Add expires_at to employee_constraints for temporary constraints
        await queryInterface.addColumn('employee_constraints', 'expires_at', {
            type: Sequelize.DATE,
            allowNull: true
        });

        // Add indexes
        await queryInterface.addIndex('permanent_constraint_requests', ['emp_id', 'status']);
        await queryInterface.addIndex('permanent_constraints', ['emp_id', 'is_active']);
        await queryInterface.addIndex('employee_constraints', ['expires_at']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('permanent_constraints');
        await queryInterface.dropTable('permanent_constraint_requests');
        await queryInterface.removeColumn('employee_constraints', 'expires_at');
    }
};