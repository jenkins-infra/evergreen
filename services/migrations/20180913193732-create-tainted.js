'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('tainteds', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uuid: {
        type: Sequelize.UUID
      },
      updateId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'updates',
          key: 'id'
        },
      },
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
        type: Sequelize.DATE
      }
    }).then(() => {
      return queryInterface.addConstraint('tainteds',
        ['uuid', 'updateId'],
        {
          type: 'UNIQUE',
          name: 'uuid_updateid_uniq',
        },
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('tainteds');
  }
};
