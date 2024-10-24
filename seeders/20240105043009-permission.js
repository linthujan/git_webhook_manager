'use strict';
const { v4 } = require('uuid');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const permissions = [];
    const permissionList = ["transaction", "setting", "user", "member", "permission", "role", "saving_account", "loan_account", "loan_application", 'loan_payment', "overview"];

    for (let i = 0; i < permissionList.length; i++) {
      const permission = permissionList[i];

      if (permission == "overview") {
        permissions.push({
          permission_id: v4(),
          name: `${permission}.view`,
          created_at: new Date(),
          updated_at: new Date(),
        });
        continue;
      }
      if (permission == "permission" || permission == "setting") {
        permissions.push({
          permission_id: v4(),
          name: `${permission}.view`,
          created_at: new Date(),
          updated_at: new Date(),
        }, {
          permission_id: v4(),
          name: `${permission}.edit`,
          created_at: new Date(),
          updated_at: new Date(),
        });
        continue;
      }

      permissions.push({
        permission_id: v4(),
        name: `${permission}.create`,
        created_at: new Date(),
        updated_at: new Date(),
      }, {
        permission_id: v4(),
        name: `${permission}.view`,
        created_at: new Date(),
        updated_at: new Date(),
      }, {
        permission_id: v4(),
        name: `${permission}.edit`,
        created_at: new Date(),
        updated_at: new Date(),
      }, {
        permission_id: v4(),
        name: `${permission}.delete`,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
    await queryInterface.bulkInsert('permissions', permissions, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
