# Runtime globals (WinterTC and minimal hosts)

Envalid expects a few web-platform globals:

- `URL` — when you use the built-in `url()` validator
- `console` / `console.error` — when you use the default reporter

[WinterTC’s Minimum Common Web API](https://min-common-api.proposal.wintertc.org/)
requires both `URL` and `globalThis.console`. The `console` object is defined by the
[WHATWG Console Standard](https://console.spec.whatwg.org/), which includes
`console.error`. Runtimes that aim to be web-interoperable (Node, Bun, Deno,
browsers, Cloudflare Workers, …) already provide these, so no shim is needed.

Smaller engines that do **not** target that baseline — for example Alpine
[QuickJS](https://bellard.org/quickjs/) (`qjs`) used to validate env at container
entrypoint without shipping Node — may be missing pieces. See
[#253](https://github.com/af/envalid/issues/253).

## When Envalid needs them

| Global | When needed |
| --- | --- |
| `console.error` | Default reporter (at failure). Not needed if you pass your own `reporter` / `null`. |
| `URL` | Only if you use the built-in `url()` validator (`new URL(x)`). |

Importing `envalid` itself does not require these globals (the default logger binds
`console.error` lazily). They must exist before you call `cleanEnv` with `url()`,
and before the default reporter runs.

## Workable shim (QuickJS)

A copy-paste starting point for Alpine QuickJS lives at
[`example/quickjs-host-shim.mjs`](../example/quickjs-host-shim.mjs). Apply it
before `cleanEnv` / `url()` if your host is missing pieces (it need not run before
`import 'envalid'`). Adapt the `console` and `URL` stubs to your engine (other
hosts can no-op or map to `print` / native logging instead of QuickJS `std`).

The shim fills `console.*` for the default reporter; you can omit that part if you
always pass a custom `reporter`.

```js
import { cleanEnv, str, url } from 'envalid'
import './quickjs-host-shim.mjs' // before cleanEnv / url(); order vs envalid import does not matter
import * as std from 'std'

const env = cleanEnv(
  /* your env object */,
  { API_URL: url(), NAME: str() },
  {
    // Custom reporter: default throws outside Node; std.exit fails closed at entrypoint
    reporter: ({ errors }) => {
      std.err.puts('Invalid environment:\n' + Object.keys(errors).join(', ') + '\n')
      std.exit(1)
    },
  },
)
```

## Notes

- Envalid does **not** ship a QuickJS stdlib integration or a full URL implementation.
- With a custom reporter, you typically only need a `URL` polyfill when using `url()`.
- Default reporter still calls `console.error` and, in Node, `process.exit(1)`.
