'use strict';

// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const connection = sequelizeClient.define('connection', {
    uuid: DataTypes.UUID,
    lastConnectedAt: DataTypes.DATE
  });

  // eslint-disable-next-line no-unused-vars
  connection.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return connection;
};
