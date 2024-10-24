'use strict';
const { Model } = require('sequelize');
const { defaultKeys, modelDefaults } = require('../sequelize');
module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      Permission.hasMany(models.RolePermission, {
        foreignKey: 'permission_id',
        sourceKey: 'permission_id',
        as: 'rolePermission',
      })
      Permission.belongsToMany(models.Role, {
        through: models.RolePermission,
        sourceKey: 'permission_id',
        foreignKey: 'permission_id',
        as: 'roles',
      })
    }
  }
  Permission.init({
    ...defaultKeys("permission_id"),
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  }, modelDefaults(sequelize, 'permissions'));
  return Permission;
};