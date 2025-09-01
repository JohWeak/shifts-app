'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add assignment type to differentiate regular, flexible, and backup assignments
    await queryInterface.addColumn('schedule_assignments', 'assignment_type', {
      type: Sequelize.ENUM('regular', 'flexible'),
      defaultValue: 'regular',
      comment: 'Type of assignment: regular (normal) or flexible (using flexible shift)',
      after: 'status'
    });

    // Add custom hours for flexible assignments
    await queryInterface.addColumn('schedule_assignments', 'custom_start_time', {
      type: Sequelize.TIME,
      allowNull: true,
      comment: 'Custom start time for flexible assignments (overrides shift start_time)',
      after: 'assignment_type'
    });

    await queryInterface.addColumn('schedule_assignments', 'custom_end_time', {
      type: Sequelize.TIME,
      allowNull: true,
      comment: 'Custom end time for flexible assignments (overrides shift end_time)',
      after: 'custom_start_time'
    });

    // Add reference to which employee this might be covering for
    await queryInterface.addColumn('schedule_assignments', 'covering_for_emp_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'emp_id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      comment: 'Employee ID this flexible assignment is covering for',
      after: 'custom_end_time'
    });

    // Add confirmed timestamp for flexible assignments
    await queryInterface.addColumn('schedule_assignments', 'confirmed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When this flexible assignment was confirmed',
      after: 'covering_for_emp_id'
    });

    // Create indexes for performance
    await queryInterface.addIndex('schedule_assignments', ['assignment_type'], {
      name: 'idx_schedule_assignments_type'
    });
    
    await queryInterface.addIndex('schedule_assignments', ['covering_for_emp_id', 'work_date'], {
      name: 'idx_schedule_assignments_covering_date'
    });

    // Update existing assignments to be 'regular' type
    await queryInterface.sequelize.query(
      "UPDATE schedule_assignments SET assignment_type = 'regular' WHERE assignment_type IS NULL"
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('schedule_assignments', 'idx_schedule_assignments_covering_date');
    await queryInterface.removeIndex('schedule_assignments', 'idx_schedule_assignments_type');

    // Remove columns
    await queryInterface.removeColumn('schedule_assignments', 'confirmed_at');
    await queryInterface.removeColumn('schedule_assignments', 'covering_for_emp_id');
    await queryInterface.removeColumn('schedule_assignments', 'custom_end_time');
    await queryInterface.removeColumn('schedule_assignments', 'custom_start_time');
    await queryInterface.removeColumn('schedule_assignments', 'assignment_type');
  }
};