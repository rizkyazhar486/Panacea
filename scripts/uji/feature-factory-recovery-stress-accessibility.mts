import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/pages/Readiness.tsx', 'utf8')

assert.match(source, /aria-label="Subjective sleep quality from 1 to 5"/)
assert.match(source, /aria-pressed=\{\(today\.sleepQ \?\? 0\) === quality\}/)
assert.match(source, /aria-label=\{`Sleep quality \$\{quality\} of 5`\}/)
assert.match(source, /aria-pressed=\{selected\}/)
assert.match(source, /aria-label="Session RPE"/)
assert.match(source, /aria-valuetext=\{`\$\{wRpe\} of 10`\}/)
assert.match(source, /aria-label=\{`Remove workout \$\{index \+ 1\}`\}/)
assert.match(source, /ariaLabel=\{label\}/)

// Accessibility hardening must not blur the scientific boundary of the surface.
assert.match(source, /without a synthetic readiness score/)
assert.match(source, /does not map it to a proprietary strain scale or derive a recommended training target/)
assert.match(source, /does not diagnose, forecast, prescribe training/)

console.log('Recovery/readiness interactive controls expose deterministic accessible names and state without changing scientific boundaries.')
