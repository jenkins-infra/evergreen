'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('versions', 'checksum',
      {
        allowNull: false,
        type: Sequelize.STRING
      },
      {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('versions', 'checksum', {});
  }
};
