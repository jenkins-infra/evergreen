'use strict';
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const error_log = sequelizeClient.define('error_logs', {
    log: DataTypes.STRING
  });
  // eslint-disable-next-line no-unused-vars
  error_log.associate = function(models) {
    // associations can be defined here
  };
  return error_log;
};
