const app        = require('../../src/app');
const createAuth = require('../../src/services/authentication/authentication.class');

describe('Authentication class', () => {
  let auth = createAuth({app: app});

  describe('create()', () => {
    it('with a uuid, should create a JWT', () => {
      let data = {
        uuid: 'xkcd',
      };
      expect(auth.create(data, {})).toBeTruthy();
    });
  });
});
