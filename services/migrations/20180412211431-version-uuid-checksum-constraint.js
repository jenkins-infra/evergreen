'use strict';

const constraintName = 'uuid_checksum_uniq';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint('versions',
      ['uuid', 'checksum'],
      {
        type: 'UNIQUE',
        name: constraintName,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('versions', constraintName);
  }
};
