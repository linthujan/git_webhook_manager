'use strict';
const { Model } = require('sequelize');
const { defaultKeys, modelDefaults } = require('../sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    static associate(models) {
    }
  }
  Project.init({
    ...defaultKeys("project_id"),
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM(['FRONTEND', 'BACKEND']),
      allowNull: false,
    },
    branch: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    repository_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    git_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    command: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
  }, modelDefaults(sequelize, 'projects'));
  return Project;
};