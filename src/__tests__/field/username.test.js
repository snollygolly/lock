import Immutable from 'immutable';

describe('field/username', () => {
  let username;
  let dbConnection;
  beforeEach(() => {
    jest.resetModules();

    jest.mock('field/index', () => ({
      setField: jest.fn()
    }));

    jest.mock('field/email', () => ({
      validateEmail: s => s
    }));

    jest.mock('connection/database', () => ({
      databaseConnection: m => m
    }));

    username = require('field/username');
    dbConnection = Immutable.fromJS({
      validation: null
    });
  });
  describe('usernameLooksLikeEmail()', () => {
    it('checks for @', () => {
      expect(username.usernameLooksLikeEmail('t@t.com')).toBe(true);
      expect(username.usernameLooksLikeEmail('tt.com')).toBe(false);
    });
  });
  describe('getUsernameValidation()', () => {
    it(`returns database connection's username validation`, () => {
      expect(
        username.getUsernameValidation(
          Immutable.fromJS({
            validation: {
              username: { min: 1, max: 2 }
            }
          })
        )
      ).toMatchSnapshot();
    });
    it(`returns null there's no db connection username validation`, () => {
      expect(username.getUsernameValidation(dbConnection)).toBe(null);
    });
  });
  describe('setUsername()', () => {
    it(`doesn't trim the username when the value doesn't contain a @`, () => {
      username.setUsername(dbConnection, ' a-username ', 'username', true);
      const { mock } = require('field/index').setField;
      expect(mock.calls.length).toBe(1);
      expect(mock.calls[0]).toMatchSnapshot();
    });
    it(`trims username when the value contains a @ and a .`, () => {
      username.setUsername(dbConnection, 'another@username.com', 'username', true);
      const { mock } = require('field/index').setField;
      expect(mock.calls.length).toBe(1);
      expect(mock.calls[0]).toMatchSnapshot();
    });
    it(`calls setField`, () => {
      username.setUsername(dbConnection, 'a-username', 'username', true);
      const { mock } = require('field/index').setField;
      expect(mock.calls.length).toBe(1);
      expect(mock.calls[0]).toMatchSnapshot();
    });
    describe('field validation', () => {
      it('validates when usernameStyle is `email`', () => {
        const email = 'a@a.com';
        username.setUsername(dbConnection, email, 'email', true);
        const { mock } = require('field/index').setField;
        expect(mock.calls[0][3](email)).toBe(email);
      });
      it('validates when usernameStyle is `username`', () => {
        const theUsername = 'the_user';
        username.setUsername(dbConnection, theUsername, 'username', true);
        const { mock } = require('field/index').setField;
        expect(mock.calls[0][3](theUsername)).toBe(true);
      });
      it('validates when username looks like an email', () => {
        const email = 'a@a.com';
        username.setUsername(dbConnection, email, null, true);
        const { mock } = require('field/index').setField;
        expect(mock.calls[0][3](email)).toBe(email);
      });
      it('validates when username does not look like an email', () => {
        const theUsername = 'the_user';
        username.setUsername(dbConnection, theUsername, null, true);
        const { mock } = require('field/index').setField;
        expect(mock.calls[0][3](theUsername)).toBe(true);
      });
      it('defaults usernameStyle to `username`', () => {
        const theUsername = 'the_user';
        username.setUsername(dbConnection, theUsername, undefined, true);
        const { mock } = require('field/index').setField;
        expect(mock.calls[0][3](theUsername)).toBe(true);
      });
      it('defaults validateUsernameFormat to `true`', () => {
        const theUsername = 'the_user';
        username.setUsername(dbConnection, theUsername, 'username', undefined);
        const { mock } = require('field/index').setField;
        expect(mock.calls[0][3](theUsername)).toBe(true);
      });
      describe('when in username mode', () => {
        const expectToFailWith = theUsername => {
          username.setUsername(dbConnection, theUsername, 'username', true);
          const { mock } = require('field/index').setField;
          expect(mock.calls[0][3](theUsername)).toBe(false);
        };
        const expectToSuccedWith = theUsername => {
          username.setUsername(dbConnection, theUsername, 'username', true);
          const { mock } = require('field/index').setField;
          expect(mock.calls[0][3](theUsername)).toBe(true);
        };
        describe('validates if the username is not empty', () => {
          it('when `validateUsernameFormat` is true but there is no db connection validation', () => {
            const theUsername = '';
            username.setUsername(dbConnection, theUsername, 'username', true);
            const { mock } = require('field/index').setField;
            expect(mock.calls[0][3](theUsername)).toBe(false);
          });
          it('when `validateUsernameFormat` is false and there is db connection validation', () => {
            const theUsername = '';
            const customDbConnection = Immutable.fromJS({
              validation: {
                username: { min: 1, max: 2 }
              }
            });
            username.setUsername(customDbConnection, theUsername, 'username', false);
            const { mock } = require('field/index').setField;
            expect(mock.calls[0][3](theUsername)).toBe(false);
          });
        });
        describe('with a db connection validation', () => {
          beforeEach(() => {
            dbConnection = Immutable.fromJS({
              validation: {
                username: { min: 3, max: 5 }
              }
            });
          });
          it('validates min length', () => {
            expectToFailWith('aa');
          });
          it('validates max length', () => {
            expectToFailWith('aaaaaa');
          });
          it('validates invalid chars', () => {
            const invalidChars = `{}[],;?/\\!@#$%¨&*()¹²³\`~^´ªº§£¢¬<>|"' `.split('');
            invalidChars.forEach(i => expectToFailWith(`aa${i}`));
          });
          it('accepts letters, numbers, `_`, `-`, `+` and `.`', () => {
            const validChars = `_-+.`.split('');
            validChars.forEach(i => expectToSuccedWith(`aa${i}`));
          });
        });
      });
    });
  });
});
