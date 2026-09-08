import assert from 'node:assert/strict'
import {
  newestSampleDate,
  parseHealthWebhookPayload,
  tanggalDiOffset,
} from '../src/healthWebhook'

// Regression lock for phone-local dates and malformed timestamps.
// A malformed date must never outrank a valid local calendar day simply
// because its text sorts later lexicographically.
assert.equal(tanggalDiOffset('2026-09-08 00:30:00 +0700'), '2026-09-08')
assert.equal(tanggalDiOffset('2026-09-08T23:45:00.123-0500'), '2026-09-08')
assert.equal(tanggalDiOffset('not-a-date'), null)

const payload = {
  data: {
    metrics: [
      {
        name: 'step_count',
        units: 'count',
        data: [
          { qty: 1000, date: '2026-09-07 08:00:00 +0700' },
          { qty: 2200, date: '2026-09-08 08:00:00 +0700' },
          { qty: 800, date: '2026-09-08 20:00:00 +0700' },
          { qty: 999999, date: 'zzzz-not-a-date' },
        ],
      },
    ],
  },
}

const parsed = parseHealthWebhookPayload(payload)
assert.equal(
  parsed.steps,
  3000,
  'cumulative metrics must use only samples from the newest valid phone-local day',
)
assert.equal(
  newestSampleDate(payload),
  '2026-09-08',
  'malformed timestamps must be ignored for newest-date selection',
)

assert.deepEqual(parseHealthWebhookPayload(null), {})

console.log('Health webhook malformed-date regression checks passed.')
