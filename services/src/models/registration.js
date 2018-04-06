'use strict';
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const reg = sequelizeClient.define('registrations', {
    uuid: DataTypes.UUID,
    pubKey: DataTypes.STRING,
    curve: DataTypes.STRING,
    createdAt: DataTypes.DATE
  });

  // eslint-disable-next-line no-unused-vars
  reg.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return reg;
};
