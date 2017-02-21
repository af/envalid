const { createGroup } = require('painless')
const tt = require('typescript-definition-tester')
const test = createGroup()

test('Typescript declaration', (done) => {
    tt.compileDirectory(
        __dirname,
        (fileName) => fileName.indexOf('.ts') > -1,
        () => done()
    )
})
