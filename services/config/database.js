/*
 * This module exists to dynamically construct the right configuration for the
 * sequelize command line tool for migrations.
 */

const fs   = require('fs');
const path = require('path');

const nodeEnv = process.env.NODE_ENV || 'development';

let connectorConfig = null;
let connectorConfigFile = path.join(__dirname, `${nodeEnv}.json`);

if (fs.existsSync(connectorConfigFile)) {
  connectorConfig = JSON.parse(fs.readFileSync(connectorConfigFile));
}
else {
  connectorConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'default.json')));
}

module.exports =  {};
module.exports[nodeEnv] = {
  'url' : process.env.DB_CONNECTION_STRING || connectorConfig['postgres'],
  'dialect' : 'postgresql',
};
