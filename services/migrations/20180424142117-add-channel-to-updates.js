'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('updates', 'channel',
      {
        defaultValue: 'general',
        allowNull: false,
        type: Sequelize.STRING
      },
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('updates', 'channel', {});
  }
};
