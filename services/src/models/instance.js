'use strict';

// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const instance = sequelizeClient.define('Instance', {
    uuid: DataTypes.UUID,
    timezone: DataTypes.STRING,
    channelId: DataTypes.BIGINT,
    updateId: DataTypes.BIGINT,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  });

  // eslint-disable-next-line no-unused-vars
  instance.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return instance;
};
