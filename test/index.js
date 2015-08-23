var assert = require('assert');
var env = require('../index');

var validationErrors = {};
env.onError = function(e) { validationErrors = e; };

describe('validate()', function() {
    var basicSpec = { REQD: { required: true, help: 'Required variable' },
                      PARSED: { parse: function(x) { return x + 'foo'; } },
                      CHOICEVAR: { choices: ['one', 'two', 'three'] },
                      WITHDEFAULT: { default: 'defaultvalue' },
                      REGEXVAR: { regex: /number\d/, default: 'number0' },
                      JSONVAR: { parse: JSON.parse },
                      MYBOOL: { parse: env.toBoolean },
                      MYNUM: { parse: env.toNumber }
                    };
    it('throws an error if a required field is not present', function() {
        env.validate({}, basicSpec);
        assert.strictEqual(Object.keys(validationErrors).length, 1);
        assert.strictEqual(validationErrors.REQD, 'Required variable');
    });

    it('validates from a set of choices if given', function() {
        env.validate({ REQD: 'asdf', CHOICEVAR: 'asdf'}, basicSpec);
        assert.strictEqual(Object.keys(validationErrors).length, 1);
        assert.strictEqual(validationErrors.CHOICEVAR, '');

        var myEnv = env.validate({ REQD: 'asdf', CHOICEVAR: 'two'}, basicSpec);
        assert.strictEqual(myEnv.CHOICEVAR, 'two');
        assert.strictEqual(env.get('CHOICEVAR'), 'two');
    });

    it('validates against a regex if one is provided', function() {
        env.validate({ REQD: 'asdf', REGEXVAR: 'fail'}, basicSpec);
        assert.strictEqual(Object.keys(validationErrors).length, 1);
        assert.strictEqual(validationErrors.REGEXVAR, '');

        var myEnv = env.validate({ REQD: 'asdf', REGEXVAR: 'number4'}, basicSpec);
        assert.strictEqual(myEnv.REGEXVAR, 'number4');
        assert.strictEqual(env.get('REGEXVAR'), 'number4');
    });

    it('works with a custom parse function', function() {
        var myEnv = env.validate({ REQD: 'asdf', PARSED: 'bar'}, basicSpec);
        assert.strictEqual(myEnv.PARSED, 'barfoo');
    });

    it('works with JSON.parse', function() {
        var myEnv = env.validate({ REQD: 'asdf', JSONVAR: '{"foo": 123, "bar": "baz"}'}, basicSpec);
        assert.strictEqual(myEnv.JSONVAR.foo, 123);
        assert.strictEqual(myEnv.JSONVAR.bar, 'baz');
    });


    it('works with the env.toNumber() parser', function() {
        var myEnv = env.validate({ REQD: 'asdf', MYNUM: '123'}, basicSpec);
        assert.strictEqual(myEnv.MYNUM, 123);

        // If a non-number was entered, toNumber should throw:
        env.validate({ REQD: 'asdf', MYNUM: 'asdf12'}, basicSpec);
        assert.strictEqual(Object.keys(validationErrors).length, 1);
        assert.strictEqual(validationErrors.MYNUM, '');
    });

    it('works with the env.toBoolean() parser', function() {
        var myEnv = env.validate({ REQD: 'asdf', MYBOOL: 'true'}, basicSpec);
        assert.strictEqual(myEnv.MYBOOL, true);
    });

    it('sets default values', function() {
        var env1 = env.validate({ REQD: 'asdf' }, basicSpec);
        assert.strictEqual(env1.WITHDEFAULT, 'defaultvalue');

        // The default value isn't returned if we specify one:
        var env2 = env.validate({ REQD: 'asdf', REGEXVAR: 'number7' }, basicSpec);
        assert.strictEqual(env2.REGEXVAR, 'number7');

        // Passing an invalid value still triggers validation:
        assert.strictEqual(validationErrors.REGEXVAR, undefined);
        env.validate({ REQD: 'asdf', REGEXVAR: 'failme' }, basicSpec);
        assert.strictEqual(validationErrors.REGEXVAR, '');
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

    it('works with explicitly set false values', function() {
        env.validate({ MYVAR: 'false' }, { MYVAR: {parse: env.toBoolean }});
        assert.strictEqual(env.get('MYVAR', true), false);
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
