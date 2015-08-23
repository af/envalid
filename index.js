var env = {};
var specs = {};


var EnvError = exports.EnvError = function EnvError() {};

// Validate a single field. Expects a field name, string value,
// and an object literal "spec" that indicates which kinds of checks
// should be run on the input value.
function checkField(name, value, spec) {
    var identityFn = function(x) { return x; };
    var parser = spec.parse || identityFn;
    var outputValue;

    if (spec.required && value === undefined) throw new EnvError(name + ' is a required field');

    // Run further validation on this field only if a value was provided:
    if (value !== undefined) {
        // Regex validation happens before the string is parsed:
        if (spec.regex && !spec.regex.test(value)) {
            throw new EnvError(name + ' does not match regex ' + spec.regex);
        }

        // Run the input value through a parse function to get its final value:
        outputValue = parser(value);

        // Validate from a list of choices if that option was provided:
        if (spec.choices) {
            var isAChoice = spec.choices.some(function(val) { return val === outputValue; });
            if (!isAChoice) throw new EnvError(value + ' is not a valid choice for ' + name);
        }
    }
    return outputValue;
}

exports.validate = function validate(envInput, specInput) {
    var validatedEnv = {};
    var errors = {};
    var recommendedFields = {};
    specs = specInput || {};

    // Validate each field in the spec, catching any validation errors that might have arisen:
    Object.keys(specInput).forEach(function(k) {
        var itemSpec = specInput[k];
        var inputValue = envInput[k];
        if (itemSpec.preset && itemSpec.required) {
            errors[k] = 'Preset conflicts with required';
            return;
        }
        if (itemSpec.recommended && inputValue === undefined) {
            recommendedFields[k] = itemSpec.help || '';
        }
        if (itemSpec.preset && typeof inputValue === 'undefined') {
            inputValue = itemSpec.preset;
        }
        try {
            validatedEnv[k] = checkField(k, inputValue, itemSpec);
        } catch (err) { errors[k] = itemSpec.help || ''; }  // FIXME separate msg for reqd/invalid values
    });

    // If we are missing required or recommended fields, invoke the corresponding handler:
    if (Object.keys(recommendedFields).length) exports.onRecommend && exports.onRecommend(recommendedFields);
    if (Object.keys(errors).length) exports.onError && exports.onError(errors);

    // Return the validated env and save its current state in the module:
    env = validatedEnv;
    return validatedEnv;
};

exports.onError = function onError(errors) {
    var errMessage = '* ERROR! These required env vars are missing or invalid:\n';
    for (var key in errors) errMessage += (key + ': ' + errors[key] + '\n');
    console.error(errMessage);
    process.exit(1);
};

exports.onRecommend = function onRecommend(recs) {
    var warning = '* Missing Recommended env vars:\n';
    for (var k in recs) warning += (k + ': ' + recs[k] + '\n');
    console.warn(warning);
};


exports.toNumber = function toNumber(input) {
    var value = parseFloat(input);
    if (isNaN(value)) throw new EnvError(input + ' is not a number');
    else return value;
}

// Expects an env var to be either 'true' or 'false', and returns a corresponding boolean.
// If any other value is provided, throws an error.
exports.toBoolean = function toBoolean(input) {
    if (input === 'true') return true;
    else if (input === 'false') return false;
    else throw new EnvError(input + ' does not look like a boolean');
}


// Get an env var that has passed validation.
exports.get = function get(name, defaultVal) {
    var val = env[name];
    var found = val !== null && val !== undefined;
    return found ? val : defaultVal;
};

// Set an env var, after validating it.
// This method will throw an error if the given value doesn't pass validation
exports.set = function(name, value) {
    var spec = specs[name];
    if (spec) value = checkField(name, value, spec);
    process.env[name] = env[name] = value;
};


// Simple boolean properties to make checking NODE_ENV a bit more readable:
Object.defineProperty(exports, 'isProduction', { get: function() { return process.env.NODE_ENV === 'production'; }});
Object.defineProperty(exports, 'isDev', { get: function() { return process.env.NODE_ENV === 'development'; }});
Object.defineProperty(exports, 'isTesting', { get: function() { return process.env.NODE_ENV === 'test'; }});
