'use strict';
const { defaultKeys, migrationDefaults } = require('../sequelize');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      ...defaultKeys("setting_id"),
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      value: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      ...migrationDefaults(),
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('settings');
  }
};