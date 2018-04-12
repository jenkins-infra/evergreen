'use strict';

const indexName = 'instances-uuid';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('instances',
      {
        fields: [
          'uuid'
        ],
        name: indexName,
        unique: true,
        type: Sequelize.UNIQUE
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('instances', indexName, {});
  }
};
