/*
 * The supervisor module is responsible for interactions with the supervisord
 * XML-RPC API: http://supervisord.org/api.html
 */

import xmlrpc from 'xmlrpc';
import * as logger from 'winston'

const client = xmlrpc.createClient('http://localhost:9001/RPC2');

export default class Supervisord {
  protected readonly client : xmlrpc.Client;

  constructor() {
  }

  static isRunning() {
    return new Promise((resolve, reject) => {
      client.methodCall('supervisor.getState', null, (e, v) => {
        if (e) {
          return reject(e);
        }
        return resolve((v.statename == 'RUNNING'));
      });
    });
  }

  static printState(name) {
    return new Promise((resolve, reject) => {
      client.methodCall('supervisor.getProcessInfo', [name], (e, value) => {
        if (e) {
          return reject(e);
        }
        return resolve(value.statename == 'RUNNING');
      });
    });
  }

  static isProcessRunning(name) {
    return new Promise((resolve, reject) => {
      client.methodCall('supervisor.getProcessInfo', [name], (e, value) => {
        if (e) {
          return reject(e);
        }
        return resolve((value.statename == 'RUNNING'));
      });
    });
  }

  static startProcess(name) {
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

  static stopProcess(name) {
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

  static async restartProcess(name) {
    logger.info(`[supervisord] Restarting ${name} process`);
    if (await this.isProcessRunning(name)) {
      await this.stopProcess(name);
    }
    return this.startProcess(name);
  }
}
