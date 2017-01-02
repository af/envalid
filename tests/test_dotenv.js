const fs = require('fs')
const { createGroup, assert } = require('painless')
const { cleanEnv, str, num } = require('..')
const test = createGroup()

test.beforeEach(() => fs.writeFileSync('.env', `
BAR=asdfasdf
MYNUM=4
`))
test.afterEach(() => fs.unlinkSync('.env'))


test('.env contents are cleaned', () => {
    const env = cleanEnv({ FOO: 'bar' }, {
        FOO: str(),
        MYNUM: num()
    })
    assert.deepEqual(env, { FOO: 'bar', BAR: 'asdfasdf', MYNUM: 4 })
})

test('.env test in strict mode', () => {
    const opts = { strict: true }
    const env = cleanEnv({ FOO: 'bar', BAZ: 'baz' }, {
        MYNUM: num()
    }, opts)
    assert.deepEqual(env, { MYNUM: 4 })
})
