'use strict';
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const channel = sequelizeClient.define('channels', {
    name: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  });

  // eslint-disable-next-line no-unused-vars
  channel.associate = function (models) {
  };

  return channel;
};
