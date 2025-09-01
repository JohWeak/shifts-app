'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns already exist before adding
    const tableDescription = await queryInterface.describeTable('position_shifts');
    
    if (!tableDescription.spans_shifts) {
      await queryInterface.addColumn('position_shifts', 'spans_shifts', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'JSON array of position_shift IDs that this flexible shift spans/covers'
      });
    }

    if (!tableDescription.calculated_duration_hours) {
      await queryInterface.addColumn('position_shifts', 'calculated_duration_hours', {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true,
        comment: 'Stored duration in hours for flexible shifts'
      });
    }

    // Add indexes if they don't exist
    try {
      await queryInterface.addIndex('position_shifts', ['is_flexible'], {
        name: 'idx_position_shifts_is_flexible'
      });
    } catch (e) {
      // Index might already exist
      console.log('Index idx_position_shifts_is_flexible might already exist');
    }
    
    try {
      await queryInterface.addIndex('position_shifts', ['position_id', 'is_flexible'], {
        name: 'idx_position_shifts_position_flexible'
      });
    } catch (e) {
      // Index might already exist
      console.log('Index idx_position_shifts_position_flexible might already exist');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    try {
      await queryInterface.removeIndex('position_shifts', 'idx_position_shifts_position_flexible');
    } catch (e) {
      // Index might not exist
    }
    
    try {
      await queryInterface.removeIndex('position_shifts', 'idx_position_shifts_is_flexible');
    } catch (e) {
      // Index might not exist
    }

    // Remove columns
    await queryInterface.removeColumn('position_shifts', 'calculated_duration_hours');
    await queryInterface.removeColumn('position_shifts', 'spans_shifts');
  }
};