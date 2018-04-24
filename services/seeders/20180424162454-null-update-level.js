'use strict';

/*
 * This seed just creates a null Update Level which is a special case to
 * indicate that the registered instance has no updates whatsoever yet
 */

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('updates', [
      {
        commit: '',
        channel: 'general',
        manifest: '{}',
        tainted: false,
        createdAt: Sequelize.fn('NOW'),
        updatedAt: Sequelize.fn('NOW')
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
  }
};
