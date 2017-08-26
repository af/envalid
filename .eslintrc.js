const [OFF, WARN, ERR] = [0, 1, 2]

module.exports = {
    extends: 'eslint:recommended',
    plugins: ['prettier'],
    parserOptions: {
        impliedStrict: true,
        sourceType: 'module',
        ecmaVersion: 7
    },
    env: {
        es6: true,
        node: true,
        browser: true
    },
    globals: {},
    rules: {
        // Possible errors & best practices
        complexity: [WARN, 7],
        // "consistent-return": ERR,
        'dot-notation': WARN,
        eqeqeq: [ERR, 'allow-null'],
        'linebreak-style': [ERR, 'unix'],
        'no-empty': WARN,
        'no-else-return': OFF,
        'no-extra-bind': ERR,
        // "no-magic-numbers": [ERR, { "ignore": [0, 1, 2, -1] }],
        'no-param-reassign': WARN,
        'no-throw-literal': WARN,
        'no-warning-comments': WARN,
        'no-unexpected-multiline': ERR,
        radix: [WARN, 'as-needed'],
        'wrap-iife': [WARN, 'outside'],
        yoda: ERR,

        // Variables
        'init-declarations': [WARN, 'always'],
        'no-redeclare': WARN,
        'no-shadow': WARN,
        'no-undef-init': ERR,
        'no-use-before-define': WARN,

        // Node/commonjs
        'callback-return': WARN,
        'handle-callback-err': ERR,

        // Style
        camelcase: [ERR, { properties: 'never' }],
        'comma-dangle': OFF,
        'max-depth': [ERR, 4],
        'max-nested-callbacks': [WARN, 4],
        'new-cap': OFF,
        'no-bitwise': OFF, // Could enable later, but we do use bitwise ops in a few places
        'no-case-declarations': OFF,
        'no-console': WARN,
        'no-lonely-if': WARN,
        'no-new-object': ERR,
        'no-restricted-syntax': [ERR, 'WithStatement'],
        'no-unneeded-ternary': ERR,
        'no-unused-vars': [WARN, { vars: 'all', args: 'none' }], // Should be err, but can trigger on commented-out code
        'object-curly-spacing': [OFF, 'always'],
        'one-var': [WARN, 'never'],
        'spaced-comment': [ERR, 'always'],

        // ES6
        // Any rules here set to OFF are things to turn on eventually
        'no-confusing-arrow': ERR,
        'no-const-assign': ERR,
        'no-dupe-class-members': ERR,
        'no-var': ERR,
        'object-shorthand': OFF,
        'prefer-arrow-callback': OFF,
        'prefer-const': WARN,
        'prefer-spread': OFF,
        'prefer-template': OFF,

        // JSDoc
        // "require-jsdoc": OFF,
        // "valid-jsdoc": WARN
        'prettier/prettier': [ERR, { singleQuote: true, semi: false, printWidth: 100, tabWidth: 4 }]
    }
}
