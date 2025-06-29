import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/example/*.js', ...coverageConfigDefaults.exclude],
      thresholds: {
        functions: 98,
        lines: 98
      }
    },
  },
})
