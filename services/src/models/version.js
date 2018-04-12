'use strict';
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const version = sequelizeClient.define('versions', {
    uuid: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    core: DataTypes.STRING,
    checksum: DataTypes.STRING,
    manifest: DataTypes.JSON,
    manifestSchemaVersion: DataTypes.INTEGER
  });

  // eslint-disable-next-line no-unused-vars
  version.associate = function(models) {
  };
  return version;
};
