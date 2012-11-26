var env = {};
var specs = {};


// TODO: choices support
// TODO: regex support
// TODO: recommended/required support
//

exports.validate = function validate(envInput, specInput) {
    var validatedEnv = {};
    var errors = {};
    specs = specInput || {};

    Object.keys(specInput).forEach(function(k) {
        var itemSpec = specInput[k];
        var identityFn = function(x) { return x; };
        var parser = itemSpec.parse || identityFn;
        var inputValue = envInput[k];

        if (itemSpec.required && inputValue === undefined) errors[k] = k + ' is a required field';
        if (inputValue !== undefined) validatedEnv[k] = parser(envInput[k]);
    });
    if (Object.keys(errors).length) throw new Error('Validation errors');   // FIXME: better error message
    env = validatedEnv;
    return validatedEnv;
};

exports.toNumber = function toNumber(input) {
    return parseInt(input, 10);
}

// Expects an env var to be either 'true' or 'false', and returns a corresponding boolean.
// If any other value is provided, throws an error.
exports.toBoolean = function toBoolean(input) {
    if (input === 'true') return true;
    else if (input === 'false') return false;
    else throw new Error(input + ' does not look like a boolean');
}

exports.get = function get(name, defaultVal) {
    return env[name] || defaultVal;
};

exports.set = function(name, value) {
    var spec = specs[name];
    if (spec && spec.parse) {
        value = spec.parse(value);
    }
    process.env[name] = env[name] = value;
};

// Simple boolean properties to make checking NODE_ENV a bit more readable:
Object.defineProperty(exports, 'isProduction', { get: function() { return process.env.NODE_ENV === 'production'; }});
Object.defineProperty(exports, 'isDev', { get: function() { return process.env.NODE_ENV === 'development'; }});
Object.defineProperty(exports, 'isTesting', { get: function() { return process.env.NODE_ENV === 'test'; }});
