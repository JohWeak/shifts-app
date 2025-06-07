// backend/src/migrations/002-fix-shift-columns.js
module.exports = {
    up: async (queryInterface, Sequelize) => {
        console.log('🔧 Fixing shift table columns...');

        try {
            // Проверить и удалить emp_id если он все еще есть
            const [results] = await queryInterface.sequelize.query(
                "SHOW COLUMNS FROM shifts WHERE Field = 'emp_id'"
            );

            if (results.length > 0) {
                console.log('📝 Removing remaining emp_id column...');
                await queryInterface.removeColumn('shifts', 'emp_id');
            }

            // Убедиться что все нужные колонки есть
            const [allColumns] = await queryInterface.sequelize.query("DESCRIBE shifts");
            const columnNames = allColumns.map(col => col.Field);

            if (!columnNames.includes('end_time')) {
                console.log('📝 Adding end_time column...');
                await queryInterface.addColumn('shifts', 'end_time', {
                    type: Sequelize.DataTypes.TIME,
                    allowNull: false,
                    defaultValue: '14:00:00'
                });
            }

            if (!columnNames.includes('min_employees')) {
                console.log('📝 Adding min_employees column...');
                await queryInterface.addColumn('shifts', 'min_employees', {
                    type: Sequelize.DataTypes.INTEGER,
                    defaultValue: 1
                });
            }

            console.log('✅ Shift table fixed!');

        } catch (error) {
            console.error('❌ Error fixing shift table:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Rollback logic
        await queryInterface.removeColumn('shifts', 'end_time');
        await queryInterface.removeColumn('shifts', 'min_employees');
    }
};