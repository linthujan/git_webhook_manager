'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

console.log("Environment :", env);
console.log("Database host :", config.host);
console.log("Database name :", config.database);

const sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  log: true,
});

fs.readdirSync(__dirname).filter(file => {
  return (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js' &&
    file.indexOf('.test.js') === -1
  );
}).forEach(file => {
  const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
});

db.User = require("../models/user")(sequelize, Sequelize.DataTypes)
db.Setting = require("../models/setting")(sequelize, Sequelize.DataTypes)
db.Role = require("../models/role")(sequelize, Sequelize.DataTypes)
db.Permission = require("../models/permission")(sequelize, Sequelize.DataTypes)
db.RolePermission = require("../models/role_permission")(sequelize, Sequelize.DataTypes)
db.Project = require("../models/project")(sequelize, Sequelize.DataTypes)

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// sequelize.sync({ force: true }).then(() => {
//   console.log('All models were synchronized successfully.');
// });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
