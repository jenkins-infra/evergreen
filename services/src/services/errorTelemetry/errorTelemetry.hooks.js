class ErrorTelemetryHooks {
  constructor() {
  }

  getHooks() {
    return {
      before: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
      },
      after: {},
      error: {},
    };
  }
}

module.exports = new ErrorTelemetryHooks();
