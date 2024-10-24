'use strict';
const { defaultKeys, migrationDefaults, relationShip } = require('../sequelize');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_permissions', {
      ...defaultKeys("role_permission_id"),
      role_id: relationShip({
        modelName: "roles",
        key: "role_id"
      }),
      permission_id: relationShip({
        modelName: "permissions",
        key: "permission_id"
      }),
      ...migrationDefaults(),
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('role_permissions');
  }
};