'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('updates', 'tainted',
      {
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('updates', 'tainted', {});
  }
};
