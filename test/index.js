var assert = require('assert');
var env = require('../index');


describe('get()', function() {
    var basicSpec = { MYVAR: { required: true } };
    var randomKey = 'RANDOMKEY123456';
    process.env[randomKey] = 'HELLO MOCHA';

    it('does not work before validation has happened', function() {
        assert.equal(env.get(randomKey), undefined);

        // Accepts a default argument that will still work for unvalidated vars:
        assert.equal(env.get(randomKey, 'defaultStr'), 'defaultStr');
    });

    it('works after validation has occurred', function() {
        env.validate({ MYVAR: 'ASDF' }, basicSpec);
        assert.equal(env.get('MYVAR'), 'ASDF');

        // We can still not access env vars that are not in the validation spec:
        assert.equal(env.get(randomKey), undefined);
        assert.equal(env.get(randomKey, 'defaultStr'), 'defaultStr');
    });
});

describe('NODE_ENV helpers', function() {
    it('work for "production"', function() {
        process.env.NODE_ENV = 'production';
        assert.equal(env.isProduction, true);
        assert.equal(env.isTesting, false);
        assert.equal(env.isDev, false);
    });

    it('work for "test"', function() {
        process.env.NODE_ENV = 'test';
        assert.equal(env.isProduction, false);
        assert.equal(env.isTesting, true);
        assert.equal(env.isDev, false);
    });

    it('work for "development"', function() {
        process.env.NODE_ENV = 'development';
        assert.equal(env.isProduction, false);
        assert.equal(env.isTesting, false);
        assert.equal(env.isDev, true);
    });
});
