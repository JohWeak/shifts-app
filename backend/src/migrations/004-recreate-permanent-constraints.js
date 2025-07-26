// backend/src/migrations/004-recreate-permanent-constraints.js
module.exports = {
    up: async (queryInterface, Sequelize) => {
        console.log('Recreating permanent constraint requests table...');

        // Удаляем старую таблицу
        await queryInterface.dropTable('permanent_constraint_requests');

        // Создаем новую таблицу с правильной структурой
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
            constraints: {
                type: Sequelize.JSON,
                allowNull: false,
                comment: 'Array of {day_of_week, shift_id, constraint_type}'
            },
            message: {
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

        // Создаем индексы для оптимизации запросов
        await queryInterface.addIndex('permanent_constraint_requests', ['emp_id', 'status']);
        await queryInterface.addIndex('permanent_constraint_requests', ['status', 'requested_at']);

        console.log('Permanent constraint requests table recreated successfully');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('permanent_constraint_requests');
    }
};