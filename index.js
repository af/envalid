var env = process.env;
var specs = {};


exports.validate = function validate(envInput, specInput) {
    env = envInput || {};
    specs = specInput || {};
    // TODO: validate here
};

exports.get = function get(name, defaultVal) {
    return env[name] || defaultVal;
};

exports.set = function(name, value) {
    // TODO: validate value
    process.env[name] = env[name] = value;
};

Object.defineProperty(exports, 'isProduction', { get: function() { return process.env.NODE_ENV === 'production'; }});
Object.defineProperty(exports, 'isDev', { get: function() { return process.env.NODE_ENV === 'development'; }});
Object.defineProperty(exports, 'isTesting', { get: function() { return process.env.NODE_ENV === 'test'; }});
