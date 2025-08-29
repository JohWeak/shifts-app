'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('employees', 'locale', {
            type: Sequelize.STRING(5),
            allowNull: false,
            defaultValue: 'en',
            after: 'last_name',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('employees', 'locale');
    },
};