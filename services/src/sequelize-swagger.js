/*
 * This module was originally created by @Nvveen:
 *  <https://github.com/Nvveen/feathers-swagger-sequelize>
 * and is licensed under the MIT license.
 *
 * All this does is helps map Models from sequelize into Swagger documentation
 * properly.
 */

const _ = require('lodash');

module.exports = function() {
  const app = this;
  // Check for swagger
  if (_.isNil(app.docs)) throw new Error('no swagger defined');
  // Iterate over the doc paths, find the service
  _(app.docs.paths)
    .keys()
    .map(path => ({ path, service: app.service(path) }))
    .filter(({ service }) => _.isObject(service) && !_.isNil(service.Model))
    .reduce((docs, { path, service }) => {
      const name = path.split('/')[1];
      docs.tags = _.map(docs.tags, t => {
        if (t.name === name && _.has(service, 'Model.options.description')) {
          t.description = service.Model.options.description;
        }
        return t;
      });
      docs.definitions[name] = _(service.Model.rawAttributes)
        .filter(a => !_.isNil(a.description))
        .reduce(
          (attrs, a) =>
            _.merge(attrs, {
              properties: {
                [a.fieldName]: {
                  type: getType(a.type.key),
                  description: a.description
                }
              }
            }),
          app.docs.definitions[name]
        );
      return docs;
    }, app.docs);
};

function getType(type) {
  switch (type) {
  case 'STRING':
  case 'CHAR':
  case 'TEXT':
  case 'BLOB':
  case 'DATE':
  case 'DATEONLY':
  case 'TIME':
  case 'NOW':
  case 'UUID':
    return 'string';
  case 'INTEGER':
  case 'BIGINT':
    return 'integer';
  case 'FLOAT':
  case 'DOUBLE':
  case 'DECIMAL':
    return 'number';
  case 'BOOLEAN':
    return 'boolean';
  case 'ARRAY':
    return 'array';
  case 'JSON':
    return 'object';
  default:
    return 'object';
  }
}
