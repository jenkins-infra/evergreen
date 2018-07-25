'use strict';
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const version = sequelizeClient.define('versions', {
    uuid: {
      allowNull: false,
      type: DataTypes.UUID,
      description: 'An evergreen-client\'s generated from registration UUID',
    },
    manifest: {
      type: DataTypes.JSON,
      description: 'Version manifest in the format described in JEP-307',
    },
    manifestSchemaVersion: {
      type: DataTypes.INTEGER,
      description: 'Schema version for the "Version Manifest" (e.g. 1)',
    },
    checksum: {
      type: DataTypes.STRING,
      description: 'MD5 checksum of the version manifest for easy sorting and comparison',
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  });

  // eslint-disable-next-line no-unused-vars
  version.associate = function(models) {
  };

  return version;
};
