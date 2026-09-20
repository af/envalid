/**
 * Minimal host patches for Alpine QuickJS (`qjs`) when using envalid.
 * Apply before cleanEnv / url() (not required before import envalid).
 * See docs/runtime-globals.md and https://github.com/af/envalid/issues/253
 */
import * as std from 'std'

const root = globalThis

const log = (...args) => {
  std.err.puts(args.map(String).join(' ') + '\n')
}

const consoleRef = typeof root.console === 'object' && root.console !== null ? root.console : {}
root.console = consoleRef

for (const method of ['error', 'warn', 'info', 'log']) {
  if (typeof consoleRef[method] !== 'function') {
    consoleRef[method] = log
  }
}

if (typeof root.URL !== 'function') {
  root.URL = class URL {
    constructor(input) {
      const value = String(input)
      if (!/^[a-zA-Z][a-zA-Z\d+.-]*:\/\/\S+$/.test(value)) {
        throw new TypeError('Invalid URL')
      }
      this.href = value
    }
    toString() {
      return this.href
    }
  }
}
