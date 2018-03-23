/* eslint-disable no-unused-vars */
const rsasign = require('jsrsasign');
const logger = require('winston');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  async find (params) {
    return [];
  }

  async get (id, params) {
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  async create (data, params) {
    //> let k = new jwt.crypto.ECDSA({curve: 'secp256r1'});runtests
    if (Array.isArray(data)) {
      return await Promise.all(data.map(current => this.create(current)));
    }

    let ec = new rsasign.crypto.ECDSA({curve: 'secp256r1'});
    ec.generateKeyPairHex();
    logger.info('ECDSA keys generated, pubkeyhex:', ec.pubKeyHex);
    // Header
    var oHeader = {alg: 'ES256', typ: 'JWT'};
    // Payload
    var oPayload = {};
    var tNow = rsasign.jws.IntDate.get('now');
    var tEnd = rsasign.jws.IntDate.get('now + 1day');
    //oPayload.iss = 'http://foo.com';
    oPayload.sub = 'mailto:mike@foo.com';
    oPayload.uuid = 'myuidgoeshere';
    //oPayload.nbf = tNow;
    //oPayload.iat = tNow;
    //oPayload.exp = tEnd;
    //oPayload.jti = 'id123456';
    //oPayload.aud = 'http://foo.com/employee';
    // Sign JWT, password=616161
    var sHeader = JSON.stringify(oHeader);
    var sPayload = JSON.stringify(oPayload);
    var sJWT = rsasign.jws.JWS.sign(null, sHeader, sPayload, ec, '');
    logger.info('jwt', sJWT);

    return data;
  }

  async update (id, data, params) {
    return data;
  }

  async patch (id, data, params) {
    return data;
  }

  async remove (id, params) {
    return { id };
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
