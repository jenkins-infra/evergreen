'use strict';
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const reg = sequelizeClient.define('registrations', {
    uuid: {
      type: DataTypes.UUID,
    },
    pubKey: {
      type: DataTypes.STRING,
      description: 'Client-side generated ECDH hex encoded public key',
    },
    curve: {
      type: DataTypes.STRING,
      description: 'ECC curve associated with the ECDSA keypair (only `secp256k1` supported)',
    },
    createdAt: {
      type: DataTypes.DATE
    },
  });

  // eslint-disable-next-line no-unused-vars
  reg.associate = function (models) {
  };

  return reg;
};
