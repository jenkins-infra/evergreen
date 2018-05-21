const fs = require('fs');

class ErrorTelemetryService {
  constructor() {
  }
  create(data) {
    // Should be impossible because it passed the hooks step
    if(!data) {
      return Promise.reject({status:'KO'});
    }

    // FIXME: TBD where, what and how to actually send data
    const toWrite = `${new Date()} => ${JSON.stringify(data)}\n\n`;
    fs.appendFileSync('/tmp/blah', toWrite);

    return Promise.resolve({status:'OK'});
  }
}

module.exports = function() { return new ErrorTelemetryService(); };
module.exports.ErrorTelemetryService = ErrorTelemetryService;
