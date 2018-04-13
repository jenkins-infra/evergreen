/*
 * The supervisor module is responsible for interactions with the supervisord
 * XML-RPC API: http://supervisord.org/api.html
 */

const xmlrpc = require('xmlrpc');
const client = xmlrpc.createClient('http://localhost:9001/RPC2');

var self = module.exports = {
    isRunning: () => {
        return new Promise((resolve, reject) => {
            client.methodCall('supervisor.getState', null, (e, v) => {
                if (e) { reject(e) }
                resolve((v.statename == 'RUNNING'));
            });
        });
    },

    printState: (name) => {
        return new Promise((resolve, reject) => {
            client.methodCall('supervisor.getProcessInfo', [name], (error, value) => {
                if (error) { reject(error) }
                console.log(value);
                resolve(value.statename == 'RUNNING');
            });
        });
    },

    isProcessRunning: (name, callback) => {
        return new Promise((resolve, reject) => {
            client.methodCall('supervisor.getProcessInfo', [name], (error, value) => {
                if (error) { reject(error); }
                console.log('isProcessRunning');
                resolve((value.statename == 'RUNNING'));
            });
        });
    },

    startProcess: (name) => {
        return new Promise((resolve, reject) => {
            client.methodCall('supervisor.startProcess', [name], (error, value) => {
                if (error) { reject(error); }
                resolve();
            });
        });
    },

    stopProcess: (name) => {
        return new Promise((resolve, reject) => {
            client.methodCall('supervisor.stopProcess', [name], (error, value) => {
                if (error) { reject(error) }
                console.log('stopped');
                resolve();
            });
        });
    },

    restartProcess: async (name) => {
        console.log('restartProcess:begin');
        if (await self.isProcessRunning(name)) {
            await self.stopProcess(name);
        }
        console.log('restartprocess:then');
        return self.startProcess(name);
        console.log('restartProcess:end');
    }
};
