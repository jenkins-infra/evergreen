'use strict';
const Sequelize     = require('sequelize');
const DataTypes     = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const instance = sequelizeClient.define('instances', {
    uuid: DataTypes.UUID,
    timezone: DataTypes.STRING,
    updateId: DataTypes.BIGINT,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  });

  instance.associate = function (models) {
    instance.belongsTo(models.updates);
  };

  return instance;
};
