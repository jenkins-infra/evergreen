'use strict';
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const version = sequelizeClient.define('versions', {
    uuid: DataTypes.STRING,
    manifest: DataTypes.JSON,
    manifestSchemaVersion: DataTypes.INTEGER,
    checksum: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });

  // eslint-disable-next-line no-unused-vars
  version.associate = function(models) {
  };

  return version;
};
