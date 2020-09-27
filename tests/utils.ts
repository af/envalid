import { cleanEnv, ValidatorSpec } from '..'

// Ensure that a given environment spec passes through all values from the given
// env object
export const assertPassthrough = (
  env: { [k: string]: string | number | boolean },
  spec: { [k: string]: ValidatorSpec<any> },
) => {
  expect(cleanEnv(env, spec)).toEqual(env)
}
