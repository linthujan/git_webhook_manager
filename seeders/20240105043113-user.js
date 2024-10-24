'use strict';
const { Role } = require('../models');
const { v4 } = require('uuid');
const bcrypt = require('bcrypt');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const users = [];
      const adminRole = await Role.findOne({ where: { name: "admin" } });

      users.push({
        user_id: v4(),
        first_name: "sms",
        last_name: "manager",
        mobile: "0242220888",
        email: "sms@kelaxa.com",
        password_hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
        is_verified: true,
        per_sms_price: 0,
        mask: 'kelaxa',
        role_id: adminRole.dataValues.role_id,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await queryInterface.bulkInsert('users', users, {});
    } catch (error) {
      console.log(error);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
