import assert from 'node:assert/strict'
import {
  newestSampleDate,
  parseHealthWebhookPayload,
  tanggalDiOffset,
} from '../src/healthWebhook'

assert.equal(tanggalDiOffset('2026-09-08 00:30:00 +0700'), '2026-09-08')
assert.equal(tanggalDiOffset('2026-09-08T23:45:00.123-0500'), '2026-09-08')
assert.equal(tanggalDiOffset('not-a-date'), null)

const mixedPayload = {
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

const parsedMixed = parseHealthWebhookPayload(mixedPayload)
assert.equal(
  parsedMixed.steps,
  3000,
  'cumulative metrics must use only samples from the newest valid phone-local day',
)
assert.equal(
  newestSampleDate(mixedPayload),
  '2026-09-08',
  'malformed timestamps must be ignored for newest-date selection',
)

const malformedOnlyPayload = {
  data: {
    metrics: [
      {
        name: 'step_count',
        units: 'count',
        data: [
          { qty: 120, date: 'bad-date-a' },
          { qty: 80, date: 'bad-date-b' },
          { qty: 50 },
        ],
      },
    ],
  },
}

assert.equal(
  parseHealthWebhookPayload(malformedOnlyPayload).steps,
  250,
  'when no valid timestamp exists, cumulative metrics preserve the documented sum-all fallback',
)
assert.equal(newestSampleDate(malformedOnlyPayload), null)
assert.deepEqual(parseHealthWebhookPayload(null), {})

console.log('Health webhook malformed-date regression checks passed.')