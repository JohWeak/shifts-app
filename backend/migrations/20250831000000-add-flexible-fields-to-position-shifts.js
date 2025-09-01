'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add flexible shift support fields to position_shifts
    await queryInterface.addColumn('position_shifts', 'is_flexible', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether this is a flexible shift that can span multiple regular shifts'
    });

    await queryInterface.addColumn('position_shifts', 'spans_shifts', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'JSON array of position_shift IDs that this flexible shift spans/covers'
    });

    // Add computed duration_hours field (will be calculated in application logic)
    // Note: duration_hours already exists as virtual field, adding calculated_duration_hours for storage
    await queryInterface.addColumn('position_shifts', 'calculated_duration_hours', {
      type: Sequelize.DECIMAL(4, 2),
      allowNull: true,
      comment: 'Stored duration in hours for flexible shifts'
    });

    // Create index for flexible shifts queries
    await queryInterface.addIndex('position_shifts', ['is_flexible'], {
      name: 'idx_position_shifts_is_flexible'
    });

    await queryInterface.addIndex('position_shifts', ['position_id', 'is_flexible'], {
      name: 'idx_position_shifts_position_flexible'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('position_shifts', 'idx_position_shifts_position_flexible');
    await queryInterface.removeIndex('position_shifts', 'idx_position_shifts_is_flexible');

    // Remove columns
    await queryInterface.removeColumn('position_shifts', 'calculated_duration_hours');
    await queryInterface.removeColumn('position_shifts', 'spans_shifts');
    await queryInterface.removeColumn('position_shifts', 'is_flexible');
  }
};