'use strict';

// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const connection = sequelizeClient.define('connections', {
    uuid: {
      allowNull: false,
      type: DataTypes.UUID,
      description: 'An evergreen-client\'s generated from registration UUID',
    },
    lastConnectedAt: {
      type: DataTypes.DATE
    },
  });

  // eslint-disable-next-line no-unused-vars
  connection.associate = function (models) {
  };

  return connection;
};
