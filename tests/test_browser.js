const path = require('path')
const pkg = require('../package')
const { createGroup, assert } = require('painless')

const test = createGroup()

test('smoke test to ensure the browser export works', () => {
    // Make sure we get the browser file.
    const { cleanEnv, str } = require(path.join(__dirname, '..', pkg.browser))
    const env = cleanEnv(
        {},
        {
            FOO: str({ default: 'asdf' })
        }
    )
    assert.deepEqual(env, { FOO: 'asdf' })
})
