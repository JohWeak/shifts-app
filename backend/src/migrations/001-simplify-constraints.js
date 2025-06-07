// backend/src/migrations/001-simplify-constraints.js
const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        console.log('🔄 Starting database optimization migration...');

        // 1. Удаляем избыточную таблицу constraints
        console.log('📝 Dropping unused constraints table...');
        await queryInterface.dropTable('constraints');

        // 2. Удаляем неиспользуемые таблицы
        console.log('📝 Dropping unused work_days table...');
        await queryInterface.dropTable('work_days');

        console.log('📝 Dropping unused schedule_periods table...');
        await queryInterface.dropTable('schedule_periods');

        // 3. Создаем новую упрощенную таблицу employee_constraints
        console.log('📝 Creating optimized employee_constraints table...');
        await queryInterface.createTable('employee_constraints', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            emp_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'employees', key: 'emp_id' },
                onDelete: 'CASCADE'
            },
            constraint_type: {
                type: DataTypes.ENUM('cannot_work', 'prefer_work'),
                allowNull: false
            },
            applies_to: {
                type: DataTypes.ENUM('specific_date', 'day_of_week'),
                allowNull: false
            },
            target_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
                comment: 'For specific date constraints'
            },
            day_of_week: {
                type: DataTypes.ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
                allowNull: true,
                comment: 'For recurring weekly constraints'
            },
            shift_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'shifts', key: 'shift_id' },
                onDelete: 'CASCADE'
            },
            is_permanent: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                comment: 'True for admin-set permanent constraints'
            },
            status: {
                type: DataTypes.ENUM('active', 'expired'),
                defaultValue: 'active'
            },
            reason: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Reason for permanent constraints'
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // 4. Добавляем индексы для производительности
        console.log('📝 Adding performance indexes...');
        await queryInterface.addIndex('employee_constraints', ['emp_id', 'target_date'], {
            name: 'idx_emp_date'
        });
        await queryInterface.addIndex('employee_constraints', ['emp_id', 'day_of_week'], {
            name: 'idx_emp_day_of_week'
        });
        await queryInterface.addIndex('employee_constraints', ['constraint_type', 'applies_to'], {
            name: 'idx_constraint_type_applies'
        });

        // 5. Мигрируем данные из constraint_types в employee_constraints
        console.log('📝 Migrating data from constraint_types...');
        await queryInterface.sequelize.query(`
            INSERT INTO employee_constraints (
                emp_id, constraint_type, applies_to, target_date, 
                day_of_week, shift_id, is_permanent, status, reason, created_at, updated_at
            )
            SELECT 
                emp_id, 
                type as constraint_type,
                applies_to,
                start_date as target_date,
                day_of_week,
                shift_id,
                is_permanent,
                CASE 
                    WHEN status = 'approved' THEN 'active'
                    ELSE 'expired'
                END as status,
                reason,
                createdAt as created_at,
                updatedAt as updated_at
            FROM constraint_types 
            WHERE status = 'approved' AND type IN ('cannot_work', 'prefer_work')
        `);

        // 6. Удаляем старую таблицу constraint_types
        console.log('📝 Dropping old constraint_types table...');
        await queryInterface.dropTable('constraint_types');

        // 7. Оптимизируем таблицу shifts (убираем emp_id)
        console.log('📝 Optimizing shifts table...');
        await queryInterface.removeColumn('shifts', 'emp_id');

        // 8. Добавляем недостающие поля в shifts
        await queryInterface.addColumn('shifts', 'end_time', {
            type: DataTypes.TIME,
            allowNull: false,
            defaultValue: '14:00:00',
            comment: 'Calculated end time'
        });

        await queryInterface.addColumn('shifts', 'min_employees', {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: 'Minimum employees required'
        });

        // 9. Создаем таблицу employee_qualifications
        console.log('📝 Creating employee_qualifications table...');
        await queryInterface.createTable('employee_qualifications', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            emp_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'employees', key: 'emp_id' },
                onDelete: 'CASCADE'
            },
            qualification_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            level: {
                type: DataTypes.ENUM('basic', 'intermediate', 'advanced'),
                defaultValue: 'basic'
            },
            certified_date: {
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            expires_date: {
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        console.log('✅ Database optimization migration completed!');
    },

    down: async (queryInterface, Sequelize) => {
        // Rollback logic - восстанавливаем старую структуру
        console.log('🔄 Rolling back database optimization...');

        await queryInterface.dropTable('employee_qualifications');
        await queryInterface.dropTable('employee_constraints');

        // Восстанавливаем constraint_types (упрощенно)
        await queryInterface.createTable('constraint_types', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            type: { type: DataTypes.ENUM('cannot_work', 'prefer_work', 'neutral', 'permanent_schedule'), allowNull: false },
            emp_id: { type: DataTypes.INTEGER, allowNull: false },
            shift_id: { type: DataTypes.INTEGER, allowNull: true },
            // ... другие поля из старой структуры
        });

        console.log('✅ Rollback completed!');
    }
};