'use strict';
const { Model } = require('sequelize');
const { defaultKeys, modelDefaults } = require('../sequelize');
module.exports = (sequelize, DataTypes) => {
  class Setting extends Model { }
  Setting.init({
    ...defaultKeys("setting_id"),
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, modelDefaults(sequelize, 'settings'));
  return Setting;
};