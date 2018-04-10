/*
 * The Status class is largely responsible for shuffling objects in and out of
 * the database in order to present a fairly consistent view of "Status" to
 * API clients
 */
const createService = require('feathers-sequelize');
const logger = require('winston');

class Status {
  constructor (options) {
    this.options = options || {};
    this.instance = createService({
      name: 'instance',
      Model: options.models.instance
    });
    this.channel = createService({
      name: 'channel',
      Model: options.models.channel
    });
  }

  async get(uuid, params) {
    logger.debug('Status.get()', uuid, params);

    const query = {query: { uuid: uuid }};

    return this.find(query).then((records) => {
      if (records.length > 1) {
        logger.error(`Multiple records found for ${uuid}`, records);
      }
      return records[0];
    });
  }

  /*
   * Create the proper Instance records in the database
   *
   * This will function will also create the necessary relations for the new
   * Instance
   */
  async create(data, params) {
    return this.channel.find({query: {name: 'general'}}).then((channels) => {
      if (channels.length < 1) {
        throw new Error('While creating a Status, failed to find the general Channel!');
      }

      data.channelId = channels[0].id;
      return this.instance.create(data,params);
    });
  }

  async remove(id, params) {
    return this.instance.remove(id, params);
  }

  async find(params) {
    return this.instance.find(params);
  }
}

module.exports = function(options) { return new Status(options); };
module.exports.Status = Status;
