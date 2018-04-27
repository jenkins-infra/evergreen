'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
  return queryInterface.addColumn('channels', 'updateId',
    {
      allowNull: false,
      defaultValue: 0,
      type: Sequelize.INTEGER
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('channels', 'updateId', {});
  }
};
