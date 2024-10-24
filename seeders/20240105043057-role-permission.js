'use strict';
const { v4 } = require('uuid');
const { Role, Permission } = require('../models');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const role_permissions = [];

      const adminRole = await Role.findOne({ where: { name: "admin" } });
      const permissions = await Permission.findAll();

      for (let i = 0; i < permissions.length; i++) {
        role_permissions.push({
          role_permission_id: v4(),
          role_id: adminRole.dataValues.role_id,
          permission_id: permissions[i].dataValues.permission_id,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      await queryInterface.bulkInsert('role_permissions', role_permissions, {});
    } catch (error) {
      console.log(error);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permissions', null, {});
  }
};
