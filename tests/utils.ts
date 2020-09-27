import { cleanEnv, ValidatorSpec } from '..'

// Ensure that a given environment spec passes through all values from the given
// env object
export const assertPassthrough = <T>(env: T, spec: { [k in keyof T]: ValidatorSpec<any> }) => {
  expect(cleanEnv(env, spec)).toEqual(env)
}
