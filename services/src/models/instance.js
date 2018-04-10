'use strict';
const Sequelize     = require('sequelize');
const DataTypes     = Sequelize.DataTypes;

const createChannel = require('./channel');

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const instance = sequelizeClient.define('instances', {
    uuid: DataTypes.UUID,
    timezone: DataTypes.STRING,
    channelId: DataTypes.BIGINT,
    updateId: DataTypes.BIGINT,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  });

  // eslint-disable-next-line no-unused-vars
  instance.associate = function (models) {
    instance.belongsTo(createChannel(app));
  };

  return instance;
};
