'use strict';
const { v4 } = require('uuid');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [];
    roles.push({
      role_id: v4(),
      name: "admin",
      created_at: new Date(),
      updated_at: new Date(),
    }, {
      role_id: v4(),
      name: "staff",
      created_at: new Date(),
      updated_at: new Date(),
    }, {
      role_id: v4(),
      name: "user",
      created_at: new Date(),
      updated_at: new Date(),
    });
    await queryInterface.bulkInsert('roles', roles, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
