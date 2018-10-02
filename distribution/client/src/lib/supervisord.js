/*
 * The supervisor module is responsible for interactions with the supervisord
 * XML-RPC API: http://supervisord.org/api.html
 */

const xmlrpc = require('xmlrpc');
const client = xmlrpc.createClient('http://localhost:9001/RPC2');
const logger = require('winston');

class Supervisord {
  constructor() {
  }

  isRunning() {
    return new Promise((resolve, reject) => {
      client.methodCall('supervisor.getState', null, (e, v) => {
        if (e) {
          return reject(e);
        }
        return resolve((v.statename == 'RUNNING'));
      });
    });
  }

  printState(name) {
    return new Promise((resolve, reject) => {
      client.methodCall('supervisor.getProcessInfo', [name], (e, value) => {
        if (e) {
          return reject(e);
        }
        return resolve(value.statename == 'RUNNING');
      });
    });
  }

  isProcessRunning(name) {
    return new Promise((resolve, reject) => {
      client.methodCall('supervisor.getProcessInfo', [name], (e, value) => {
        if (e) {
          return reject(e);
        }
        return resolve((value.statename == 'RUNNING'));
      });
    });
  }

  startProcess(name) {
    logger.info(`[supervisord] Starting ${name} process`);
    return new Promise((resolve, reject) => {
      client.methodCall('supervisor.startProcess', [name], (e, value) => {
        if (e) {
          return reject(e);
        }
        return resolve(value);
      });
    });
  }

  stopProcess(name) {
    logger.info(`[supervisord] Stopping ${name} process`);
    return new Promise((resolve, reject) => {
      client.methodCall('supervisor.stopProcess', [name], (e, value) => {
        if (e) {
          return reject(e);
        }
        return resolve(value);
      });
    });
  }

  async restartProcess(name) {
    logger.info(`[supervisord] Restarting ${name} process`);
    if (await this.isProcessRunning(name)) {
      await this.stopProcess(name);
    }
    return this.startProcess(name);
  }
}

module.exports = new Supervisord();
