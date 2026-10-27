import type { Mask } from './types.ts'

// ponytail: presets cover the common cases; a custom fn signature is the escape hatch.
// Unknown/misspelled presets fail safe (full redaction) rather than leaking.
const presets: Record<string, (value: unknown) => string> = {
  all: () => '****',
  last4: (value: unknown) => {
    const s = String(value)
    return s.length <= 4 ? '****' : `****${s.slice(-4)}`
  },
}

/** Render a value the way it's allowed to appear in logs. */
export const applyMask = (value: unknown, mask: Mask): string => {
  if (typeof mask === 'function') return mask(value)
  return (presets[mask] ?? presets.all)(value)
}

/**
 * Render `: "<value>"` for a validator error message. Without a mask the raw value is
 * shown (backward compatible); with a mask, the masked form is shown instead.
 */
export const displayValue = (value: unknown, mask?: Mask): string =>
  `: "${mask ? applyMask(value, mask) : String(value)}"`

/**
 * Render `: "<masked>"` only when a mask is set, otherwise nothing. Used by validators
 * whose messages must never contain the raw value (url, json).
 */
export const displayMasked = (value: unknown, mask?: Mask): string =>
  mask ? `: "${applyMask(value, mask)}"` : ''

/**
 * Best-effort redaction for validators that render their own message and don't use
 * `displayValue`. Only replaces a *quoted* occurrence of the raw value, so short values
 * can't corrupt surrounding text (e.g. an input of "a" must not eat the "a" in "Invalid").
 */
export const redactError = (err: unknown, input: unknown, mask: Mask): unknown => {
  const raw = String(input)
  if (!raw) return err
  const from = `"${raw}"`
  const to = `"${applyMask(input, mask)}"`
  if (err instanceof Error) {
    err.message = err.message.split(from).join(to)
    return err
  }
  if (typeof err === 'string') return err.split(from).join(to)
  return err
}

