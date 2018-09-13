'use strict';

const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const tainted = sequelizeClient.define('tainted', {
    uuid: {
      allowNull: false,
      description: 'An evergreen-client\'s generated from registration UUID',
      type: DataTypes.UUID,
    },
    updateId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      description: 'Current `updates` level for the instance',
    },
    createdAt: {
      type:  DataTypes.DATE,
    },
    updatedAt: {
      type:  DataTypes.DATE
    },
  });

  // eslint-disable-next-line no-unused-vars
  tainted.associate = function (models) {
    tainted.belongsTo(models.updates);
  };

  return tainted;
};
