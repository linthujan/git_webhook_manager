'use strict';
const { Model } = require('sequelize');
const { defaultKeys, modelDefaults } = require('../sequelize');
module.exports = (sequelize, DataTypes) => {
  class RolePermission extends Model {
    static associate(models) {
      RolePermission.belongsTo(models.Role, {
        foreignKey: 'role_id',
        targetKey: 'role_id',
        as: 'role',
      })
      RolePermission.belongsTo(models.Permission, {
        foreignKey: 'permission_id',
        targetKey: 'permission_id',
        as: 'permission',
      })
    }
  }
  RolePermission.init({
    ...defaultKeys("role_permission_id"),
  }, modelDefaults(sequelize, 'role_permissions'));
  return RolePermission;
};