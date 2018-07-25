'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('instances', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uuid: {
        allowNull: false,
        unique: true,
        type: Sequelize.UUID
      },
      timezone: {
        type: Sequelize.STRING
      },
      updateId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'updates',
          key: 'id'
        },
        onDelete: 'no action',
        onUpdate: 'no action'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      flavor: {
        defaultValue: 'docker-cloud',
        allowNull: false,
        type: Sequelize.STRING
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('instances');
  }
};
