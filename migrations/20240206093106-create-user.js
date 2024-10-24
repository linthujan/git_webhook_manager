'use strict';
const { defaultKeys, migrationDefaults, relationShip } = require('../sequelize');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      ...defaultKeys("user_id"),
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mobile: {
        type: Sequelize.STRING({ length: 12 }),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mask: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      otp_code: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      otp_expiry_at: {
        type: 'TIMESTAMP',
        allowNull: true,
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      per_sms_price: {
        type: Sequelize.DOUBLE(25, 2),
        allowNull: false,
      },
      role_id: relationShip({
        modelName: "roles",
        key: "role_id",
      }),
      ...migrationDefaults(),
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};