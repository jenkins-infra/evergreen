const registerMiddleware = require('../src/middleware');

describe('express middleware', () => {
  // Stub function for the middleware
  let next = () => { };
  let callbacks = [];
  let app = {
    all: (route, fn) => callbacks.push(fn),
  };
  let applyMiddleware = (req, res, n) => {
    callbacks.forEach(fn => fn(req, res, n));
  };

  beforeEach(() => {
    callbacks = [];
    registerMiddleware(app);
  });

  describe('removing redundant slashes', () => {
    it('should not affect basic URLs', () => {
      let request = {
        url: '/chat/',
      };

      let before = request.url;
      applyMiddleware(request, undefined, next);
      expect(request.url).toBe(before);
    });

    it('should trim slashes on other URLs', () => {
      let request = {
        url: '//chat/',
      };
      applyMiddleware(request, undefined, next);
      expect(request.url).toBe('/chat/');
    });
  });

  it('add headers to the feathers object', () => {
    let request = {
      url: '/',
      feathers: {},
      headers: {
        'Content-Type' : 'application/json',
      },
    };
    applyMiddleware(request, undefined, next);

    expect(request).toHaveProperty('feathers.headers', request.headers);
  });
});
