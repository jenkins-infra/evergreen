const path = require('path');
const glob = require('glob');

/*
 * Populate module.exports with a constructed model using the given +app+
 */
module.exports = function(app) {
  let models = {};
  glob.sync(path.join(__dirname, '*.js')).forEach((file) => {
    const name = path.basename(file, '.js');
    if (name != 'index') {
      models[name] = require(path.resolve(file))(app);
    }
  });
  app.set('models', models);
  return models;
};
