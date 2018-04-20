'use strict';
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const update = sequelizeClient.define('updates', {
    commit: DataTypes.STRING,
    manifest: DataTypes.JSON,
    tainted: DataTypes.BOOLEAN,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  });

  // eslint-disable-next-line no-unused-vars
  update.associate = function (models) {
  };

  return update;
};
