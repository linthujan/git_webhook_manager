'use strict';
const { defaultKeys, migrationDefaults } = require('../sequelize');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      ...defaultKeys("role_id"),
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      ...migrationDefaults(),
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('roles');
  }
};