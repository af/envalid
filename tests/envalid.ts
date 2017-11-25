import { cleanEnv, makeValidator, str, bool, num, json, url, email, Spec, Specs } from '..'

interface Env {
    foo: string
}

// Test cleanEnv
cleanEnv({})
const env = cleanEnv<Env>({})
const foo: string = env.foo
const isDev: boolean = env.isDev
const isProduction: boolean = env.isProduction
const isTest: boolean = env.isTest
cleanEnv(
    {},
    {},
    {
        dotEnvPath: null,
        reporter: (errors, e) => {
            const errorMessage: string = errors[0].message
            const errorName: string = errors[0].name
        },
        strict: false,
        transformer: envToTransform => {}
    }
)

// Test validator specs
const spec: Specs = {
    foo: str({
        desc: 'description',
        default: ''
    }),
    bool: bool({}),
    num: num({
        choices: [1, 2, 3]
    }),
    json: json({
        devDefault: { foo: 'bar' }
    }),
    url: url(),
    email: email({
        example: 'example',
        docs: 'http://example.com'
    })
}
spec[0]._parse('test')
spec[0].type === 'test'
cleanEnv({}, spec)

const inferredEnv = cleanEnv(
    {},
    {
        foo: str({
            desc: 'description',
            default: ''
        }),
        bool: bool({}),
        num: num({
            choices: [1, 2, 3]
        }),
        json: json({
            devDefault: { foo: 'bar' }
        }),
        url: url(),
        email: email({
            example: 'example',
            docs: 'http://example.com'
        })
    }
)

const inferredUrl: string = inferredEnv.url

// Custom validator
const validator = makeValidator<Number>((input: string) => 3.33, 'CUSTOM_TYPE')
validator({
    default: 3.33,
    desc: 'Test Validator'
})
