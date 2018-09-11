/*
 * Simple express handler for generating a dynamic home page
 */
const fs = require('fs');

module.exports = (app) => {
  return async (req, res) => {
    const sequelize = app.get('sequelizeClient');
    const Instance = app.get('models').instance;
    const instances = await Instance.findAll({
      attributes: [
        'updateId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'num_instances'],
      ],
      group: ['updateId']
    });

    let levels = {};
    instances.map(r => levels[r.get('updateId')] = r.get('num_instances'));

    app.service('update').find({
      query: {
        $limit: 5,
        $sort: {
          createdAt: -1,
        }
      },
    }).then((updates) => {
      res.render('index', {
        updates: updates,
        levels: levels,
        instances: instances,
        connections: app.channel('anonymous').length,
        commit: fs.readFileSync('./commit.txt'),
      });
    });
  };
};
