// backend/src/migrations/003-add-permanent-constraints.js
module.exports = {
    up: async (queryInterface, Sequelize) => {
        console.log('Creating permanent constraints tables...');

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
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            day_of_week: {
                type: Sequelize.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
                allowNull: false
            },
            shift_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'position_shifts',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE'
            },
            constraint_type: {
                type: Sequelize.ENUM('cannot_work', 'prefer_work'),
                allowNull: false
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'approved', 'rejected'),
                defaultValue: 'pending',
                allowNull: false
            },
            admin_response: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            requested_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            reviewed_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            reviewed_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'employees',
                    key: 'emp_id'
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE'
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
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            day_of_week: {
                type: Sequelize.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
                allowNull: false
            },
            shift_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'position_shifts',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE'
            },
            constraint_type: {
                type: Sequelize.ENUM('cannot_work', 'prefer_work'),
                allowNull: false
            },
            approved_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'employees',
                    key: 'emp_id'
                },
                onDelete: 'RESTRICT',
                onUpdate: 'CASCADE'
            },
            approved_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
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
        const [columns] = await queryInterface.sequelize.query(
            "SHOW COLUMNS FROM employee_constraints LIKE 'expires_at'"
        );

        if (columns.length === 0) {
            await queryInterface.addColumn('employee_constraints', 'expires_at', {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'When temporary constraint expires'
            });
        }

        // Add indexes
        await queryInterface.addIndex('permanent_constraint_requests', ['emp_id', 'status'], {
            name: 'idx_pcr_emp_status'
        });
        await queryInterface.addIndex('permanent_constraints', ['emp_id', 'is_active'], {
            name: 'idx_pc_emp_active'
        });
        await queryInterface.addIndex('employee_constraints', ['expires_at'], {
            name: 'idx_ec_expires'
        });

        console.log('✅ Permanent constraints tables created successfully');
    },

    down: async (queryInterface, Sequelize) => {
        console.log('Rolling back permanent constraints tables...');

        // Remove indexes
        await queryInterface.removeIndex('employee_constraints', 'idx_ec_expires');
        await queryInterface.removeIndex('permanent_constraints', 'idx_pc_emp_active');
        await queryInterface.removeIndex('permanent_constraint_requests', 'idx_pcr_emp_status');

        // Remove column
        await queryInterface.removeColumn('employee_constraints', 'expires_at');

        // Drop tables
        await queryInterface.dropTable('permanent_constraints');
        await queryInterface.dropTable('permanent_constraint_requests');

        console.log('✅ Rollback completed');
    }
};