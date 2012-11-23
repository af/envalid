var assert = require('assert');
var env = require('../index');


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
