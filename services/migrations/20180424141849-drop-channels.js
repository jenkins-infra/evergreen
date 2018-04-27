'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('channels').then((query) => {
      return queryInterface.removeColumn('instances', 'channelId');
    });
  },

  down: (queryInterface, Sequelize) => {
  }
};
