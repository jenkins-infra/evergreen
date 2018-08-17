/*
 * Simple express handler for generating a dynamic home page
 */
module.exports = (app) => {
  return async (req, res) => {
    const sequelize = app.get('sequelizeClient');
    const Instance = app.get('models').instance;
    const instances = await Instance.findAll({
      attributes: [[sequelize.fn('COUNT', sequelize.col('id')), 'num_instances']]
    });

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
        instances: instances,
        connections: app.channel('anonymous').length,
      });
    });
  };
};
