'use strict';

const indexName = 'fk-instances-updateid';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint('instances', ['updateId'], {
      type: 'FOREIGN KEY',
      name: indexName,
      references: {
        table: 'updates',
        field: 'id',
      },
      onDelete: 'no action',
      onUpdate: 'no action',
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('instances', indexName)
  }
};
