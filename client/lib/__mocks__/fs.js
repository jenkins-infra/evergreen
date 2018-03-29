'use strict';

console.log('Using a memfs filesystem...');

const memfs = require('memfs');
const vol = new memfs.Volume();
const fs = memfs.createFsFromVolume(vol);

module.exports = fs;
module.exports.volume = vol;
