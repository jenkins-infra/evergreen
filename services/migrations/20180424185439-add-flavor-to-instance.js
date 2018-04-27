'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('instances', 'flavor',
      {
        defaultValue: 'docker',
        allowNull: false,
        type: Sequelize.STRING
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('instances', 'flavor', {});
  }
};
