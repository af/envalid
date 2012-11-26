var assert = require('assert');
var env = require('../index');


describe('get()', function() {
    var basicSpec = { MYVAR: { required: true } };
    var randomKey = 'RANDOMKEY123456';
    process.env[randomKey] = 'HELLO MOCHA';

    it('does not work before validation has happened', function() {
        assert.strictEqual(env.get(randomKey), undefined);

        // Accepts a default argument that will still work for unvalidated vars:
        assert.strictEqual(env.get(randomKey, 'defaultStr'), 'defaultStr');
    });

    it('works after validation has occurred', function() {
        env.validate({ MYVAR: 'ASDF' }, basicSpec);
        assert.strictEqual(env.get('MYVAR'), 'ASDF');

        // We can still not access env vars that are not in the validation spec:
        assert.strictEqual(env.get(randomKey), undefined);
        assert.strictEqual(env.get(randomKey, 'defaultStr'), 'defaultStr');
    });
});

describe('set()', function() {
    var basicSpec = { SETVAR2: { required: true, parse: env.toNumber } };

    it('sets env vars that do not have validation set up', function() {
        assert.strictEqual(env.get('SET_TEST_VAR'), undefined);
        assert.strictEqual(process.env.SET_TEST_VAR, undefined);

        env.set('SET_TEST_VAR', 'asdf');
        assert.strictEqual(env.get('SET_TEST_VAR'), 'asdf');
        assert.strictEqual(process.env.SET_TEST_VAR, 'asdf');
    });

    it('ensures that variables are validated when passed in', function() {
        process.env.SETVAR2 = '23';
        env.validate(process.env, basicSpec);
        assert.strictEqual(env.get('SETVAR2'), 23);

        env.set('SETVAR2', '43');
        assert.strictEqual(env.get('SETVAR2'), 43);
        assert.strictEqual(process.env.SETVAR2, '43');  // process.env always converts to strings
    });
});


describe('NODE_ENV helpers', function() {
    it('work for "production"', function() {
        process.env.NODE_ENV = 'production';
        assert.strictEqual(env.isProduction, true);
        assert.strictEqual(env.isTesting, false);
        assert.strictEqual(env.isDev, false);
    });

    it('work for "test"', function() {
        process.env.NODE_ENV = 'test';
        assert.strictEqual(env.isProduction, false);
        assert.strictEqual(env.isTesting, true);
        assert.strictEqual(env.isDev, false);
    });

    it('work for "development"', function() {
        process.env.NODE_ENV = 'development';
        assert.strictEqual(env.isProduction, false);
        assert.strictEqual(env.isTesting, false);
        assert.strictEqual(env.isDev, true);
    });
});
