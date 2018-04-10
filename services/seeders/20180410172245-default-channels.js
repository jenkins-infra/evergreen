'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('channels', [
        {
          name: 'canary',
          createdAt: Sequelize.fn('NOW'),
          updatedAt: Sequelize.fn('NOW')
        },
        {
          name: 'beta',
          createdAt: Sequelize.fn('NOW'),
          updatedAt: Sequelize.fn('NOW')
        },
        {
          name: 'general',
          createdAt: Sequelize.fn('NOW'),
          updatedAt: Sequelize.fn('NOW')
        }
    ], {});
  },

  down: (queryInterface, Sequelize) => {
    /* No sense having a 'down', if we don't have channels, we don't really
     * have a functioning distribution system
     */
  }
};
