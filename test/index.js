var assert = require('assert');
var env = require('../index');


describe('validate()', function() {
    var basicSpec = { REQD: { required: true },
                      PARSED: { parse: function(x) { return x + 'foo'; } },
                      MYBOOL: { parse: env.toBoolean },
                      MYNUM: { parse: env.toNumber }
                    };
    it('throws an error if a required field is not present', function() {
        assert.throws(
            function() { env.validate({}, basicSpec); }, Error);    //FIXME: more precise error checking
    });

    it('works with a custom parse function', function() {
        var myEnv = env.validate({ REQD: 'asdf', PARSED: 'bar'}, basicSpec);
        assert.strictEqual(myEnv.PARSED, 'barfoo');
    });

    it('works with the env.toNumber() parser', function() {
        var myEnv = env.validate({ REQD: 'asdf', MYNUM: '123'}, basicSpec);
        assert.strictEqual(myEnv.MYNUM, 123);
    });

    it('works with the env.toBoolean() parser', function() {
        var myEnv = env.validate({ REQD: 'asdf', MYBOOL: 'true'}, basicSpec);
        assert.strictEqual(myEnv.MYBOOL, true);
    });
});


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
