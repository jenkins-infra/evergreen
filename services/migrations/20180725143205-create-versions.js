'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('versions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uuid: {
        allowNull: false,
        type: Sequelize.STRING
      },
      manifest: {
        type: Sequelize.JSON
      },
      manifestSchemaVersion: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      checksum: {
        allowNull: false,
        type: Sequelize.STRING
      }
    }).then(() => {
      return queryInterface.addConstraint('versions',
        ['uuid', 'checksum'],
        {
          type: 'UNIQUE',
          name: 'uuid_checksum_uniq',
        }
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('versions');
  }
};
