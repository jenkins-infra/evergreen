const FeathersSequelize = require('feathers-sequelize');

/*
 * This class exist mostly as a wrapper around the feathers-sequelize service
 * for the Update model.
 */
class Update extends FeathersSequelize.Service {
  constructor(options) {
    super(options);

    /*
     * Undefining some APIs which we don't want/need.
     */
    this.update = undefined;
    this.patch = undefined;
    this.remove = undefined;
  }
}

module.exports = (options) => { return new Update(options); };
