'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('connections', 'uuid', {type: Sequelize.UUID,allowNull: false});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('connections', 'uuid', {type: Sequelize.UUID,allowNull: true});
  }
};
