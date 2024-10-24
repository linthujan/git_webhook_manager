'use strict';
const { Model } = require('sequelize');
const { defaultKeys, modelDefaults } = require('../sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.hasMany(models.RolePermission, {
        foreignKey: 'role_id',
        sourceKey: 'role_id',
        as: 'rolePermission',
      })
      Role.belongsToMany(models.Permission, {
        through: models.RolePermission,
        sourceKey: 'role_id',
        foreignKey: 'role_id',
        as: 'permissions',
      })
      Role.hasMany(models.User, {
        foreignKey: 'role_id',
        sourceKey: 'role_id',
        as: 'users',
      })
    }
  }
  Role.init({
    ...defaultKeys("role_id"),
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  }, modelDefaults(sequelize, 'roles'));
  return Role;
};