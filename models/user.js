'use strict';
const { Model } = require('sequelize');
const { defaultKeys, modelDefaults } = require('../sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, {
        foreignKey: 'role_id',
        targetKey: 'role_id',
        as: 'role',
      });
    }
  }
  User.init({
    ...defaultKeys("user_id"),
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING({ length: 12 }),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    mask: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.VIRTUAL,
      set(val) {
        this.setDataValue('password_hash', bcrypt.hashSync(val, 10));
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp_code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    otp_expiry_at: {
      type: 'TIMESTAMP',
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    per_sms_price: {
      type: DataTypes.DOUBLE(25, 2),
      allowNull: false,
    },
  }, modelDefaults(sequelize, 'users'));
  return User;
};