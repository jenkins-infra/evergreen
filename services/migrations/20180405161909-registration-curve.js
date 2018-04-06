'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('registrations', 'curve',
      {
        allowNull: false,
        type: Sequelize.STRING
      },
      {
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('registrations', 'curve', {});
  }
};
