'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add admin_work_sites_scope column for storing accessible work site IDs
        await queryInterface.addColumn('employees', 'admin_work_sites_scope', {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: null,
            comment: 'Array of work site IDs that this admin can manage. NULL means no admin rights, empty array means no sites.'
        });

        // Add is_super_admin column for delegation of super admin privileges
        await queryInterface.addColumn('employees', 'is_super_admin', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indicates if this admin has super admin privileges (can manage all sites and create admins)'
        });

        // Update existing user with id=1 to be super admin
        await queryInterface.sequelize.query(`
            UPDATE employees 
            SET is_super_admin = true 
            WHERE emp_id = 1
        `);

        // Update all existing admins (status='admin') to have status='active' 
        await queryInterface.sequelize.query(`
            UPDATE employees 
            SET status = 'active'
            WHERE status = 'admin'
        `);

        // Note: ENUM modification is tricky in some databases.
        // For now, we'll keep the 'admin' option in ENUM for compatibility
        // but the logic will use the 'role' field instead
    },

    async down(queryInterface, Sequelize) {
        // Restore 'admin' to status ENUM
        await queryInterface.changeColumn('employees', 'status', {
            type: Sequelize.ENUM('active', 'inactive', 'admin'),
            allowNull: false,
            defaultValue: 'active'
        });

        // Restore admin status for super admins
        await queryInterface.sequelize.query(`
            UPDATE employees 
            SET status = 'admin'
            WHERE is_super_admin = true OR role = 'admin'
        `);

        // Remove the new columns
        await queryInterface.removeColumn('employees', 'is_super_admin');
        await queryInterface.removeColumn('employees', 'admin_work_sites_scope');
    }
};