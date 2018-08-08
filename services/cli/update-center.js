'use strict';

const fs = require('fs');

class UpdateCenter {
  constructor() {
  }

  static fromFile(fileName) {
    const data = JSON.parse(fs.readFileSync(fileName));

    /*
     * process the 'gav' to make the components independently useful
     */
    Object.values(data.plugins).forEach((plugin) => {
      const [group, artifact, version] = plugin.gav.split(':');
      plugin.groupId = group;
      plugin.artifactId = artifact;
    });
    let updates = new UpdateCenter();
    return Object.assign(updates, data);
  }
}

module.exports = UpdateCenter;
