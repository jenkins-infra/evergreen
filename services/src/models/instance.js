'use strict';
const Sequelize     = require('sequelize');
const DataTypes     = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const instance = sequelizeClient.define('instances', {
    uuid: {
      allowNull: false,
      type: DataTypes.UUID,
      description: 'An evergreen-client\'s generated from registration UUID',
    },
    timezone: {
      type: DataTypes.STRING,
      description: 'Timezone for the evergreen-client, e.g. America/Los_Angeles',
    },
    flavor: {
      type: DataTypes.STRING,
      description: 'Flavor describing the instance, e.g. `docker-cloud`',
    },
    updateId: {
      type: DataTypes.BIGINT,
      description: 'Current `updates` level for the instance',
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE
    },
  });

  instance.associate = function (models) {
    instance.belongsTo(models.updates);
  };

  return instance;
};
