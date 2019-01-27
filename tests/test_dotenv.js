const fs = require('fs')
const { createGroup, assert } = require('painless')
const { cleanEnv, str, num } = require('../src')
const test = createGroup()

test.beforeEach(() =>
    fs.writeFileSync(
        '.env',
        `
BAR=asdfasdf
MYNUM=4
`
    )
)
test.afterEach(() => fs.unlinkSync('.env'))

test('.env contents are cleaned', () => {
    const env = cleanEnv(
        { FOO: 'bar' },
        {
            FOO: str(),
            MYNUM: num()
        }
    )
    assert.deepEqual(env, { FOO: 'bar', BAR: 'asdfasdf', MYNUM: 4 })
})

test('can opt out of dotenv with dotEnvPath=null', () => {
    const env = cleanEnv({ FOO: 'bar' }, {}, { dotEnvPath: null })
    assert.deepEqual(env, { FOO: 'bar' })
})

test('can use a custom .env file name', () => {
    const path = '.custom-env'
    fs.writeFileSync(path, 'CUSTOM=hi')

    const env = cleanEnv({ FOO: 'bar' }, {}, { dotEnvPath: path })
    assert.deepEqual(env, { FOO: 'bar', CUSTOM: 'hi' })
    fs.unlinkSync(path)
})
