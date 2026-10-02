import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/pages/Readiness.tsx', 'utf8')

assert.doesNotMatch(source, /function recoveryScore\s*\(/)
assert.doesNotMatch(source, /function strainTarget\s*\(/)
assert.doesNotMatch(source, /ready to perform/i)
assert.doesNotMatch(source, /optimal strain target/i)
assert.doesNotMatch(source, /Sleep Need Tonight/i)
assert.doesNotMatch(source, /Sleep Debt \(7 days\)/i)
assert.doesNotMatch(source, /WHOOP-style/i)
assert.match(source, /without a synthetic readiness score/i)
assert.match(source, /personal descriptive summaries/i)
assert.match(source, /not population reference ranges, diagnostic thresholds, readiness classifications, or treatment\/training recommendations/i)
assert.match(source, /session RPE × recorded minutes/i)
assert.match(source, /RPE·min is displayed only as the arithmetic product/i)
assert.match(source, /does not map it to a proprietary strain scale/i)
assert.match(source, /no composite score is synthesized/i)
assert.match(source, /Absence of data is not interpreted as recovery, illness, stress, permission denial, or device failure/i)

console.log('Readiness surface is descriptive-only and does not synthesize recovery or training-prescription scores.')
