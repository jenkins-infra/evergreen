'use strict';
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const update = sequelizeClient.define('updates', {
    commit: {
      type: DataTypes.STRING,
      description: 'Commit SHA1 of the source file for the Update Level',
    },
    channel:  {
      type: DataTypes.STRING,
    },
    manifest: {
      type: DataTypes.JSON,
      description: 'JSON serialized format of an `ingest.yaml`',
    },
    tainted:  {
      type: DataTypes.BOOLEAN,
    },
    createdAt: {
      type:  DataTypes.DATE,
    },
    updatedAt: {
      type:  DataTypes.DATE
    },
  });

  // eslint-disable-next-line no-unused-vars
  update.associate = function (models) {
  };

  return update;
};
