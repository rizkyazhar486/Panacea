import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile(new URL('../../src/pages/HealthProfile.tsx', import.meta.url), 'utf8')

assert.match(page, /role="status" aria-live="polite" className="mx-auto max-w-2xl[^>]*>Loading health data…<\/div>/,
  'Loading state must remain announced without stealing focus.')
assert.match(page, /id="health-data-source-label"/,
  'The visible Data Source label must keep a stable programmatic id.')
assert.match(page, /role="group" aria-labelledby="health-data-source-label"/,
  'Data-source choices must remain a named control group.')
assert.match(page, /type="button" aria-pressed=\{p\.source === s\}/,
  'Each data-source button must expose its selected state.')
assert.match(page, /focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand\/40 focus-visible:ring-offset-2/,
  'Keyboard focus must remain visibly distinguishable on source/export controls.')
assert.match(page, /\{note && <span role="status" aria-live="polite"/,
  'Import progress/result copy must remain a polite live status.')
assert.match(page, /<span role="status" aria-live="polite">\s*\{savedAt \?/,
  'Save state must remain a polite live status.')
assert.match(page, /\{err && <span role="alert"/,
  'Import/save failures must remain announced as alerts.')
assert.match(page, /role="img"\s*aria-label=\{`Recorded health trend chart with \$\{history\.length\} saved records/,
  'The recorded-data trend chart must keep a concise accessible summary.')
assert.match(page, /<span aria-hidden="true" className="h-2 w-2 rounded-full"/,
  'Decorative legend dots must remain hidden from assistive technology.')
assert.match(page, /ariaLabel=\{label\}/,
  'Numeric health fields must retain their explicit accessible names.')
assert.doesNotMatch(page, /onKeyDown|tabIndex=\{-1\}/,
  'Native button/input keyboard semantics must not be replaced with a custom keyboard trap.')

console.log('Health Profile accessibility guards preserve named source state, live async status, alert semantics, visible keyboard focus, field names and non-interpretive chart accessibility.')
