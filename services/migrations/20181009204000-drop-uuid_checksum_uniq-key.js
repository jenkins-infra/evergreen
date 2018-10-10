'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('versions', 'uuid_checksum_uniq');
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint('versions',
      ['uuid', 'checksum'],
      {
        type: 'UNIQUE',
        name: 'uuid_checksum_uniq',
      }
    );
  }
};
