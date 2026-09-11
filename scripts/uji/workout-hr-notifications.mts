import assert from 'node:assert/strict'
import { parseHrNotifications } from '../../src/lib/workoutImport.ts'

const parsed = parseHrNotifications(JSON.stringify({
  data: {
    heartRateNotifications: [
      {
        heartNotification: 'High Heart Rate',
        start: '2026-07-31 21:30:15 +0700',
        threshold: 120,
        heartRateData: [
          { Avg: 121 },
          { Max: 134 },
          { Avg: -3 },
          { Avg: null },
        ],
      },
      {
        heartNotification: 'Low Heart Rate',
        start: '2026-07-30 06:15:00 +0700',
        threshold: -10,
        heartRateData: [{ avg: 39 }],
      },
      {
        heartNotification: 'Irregular Rhythm Notification',
        start: '2026-07-29T12:00:00+07:00',
        heartRateData: [{ qty: 88 }, { qty: 91 }],
      },
      {
        heartNotification: 'High Heart Rate',
        start: 'not-a-date',
        threshold: 150,
        heartRateData: [{ Avg: 170 }],
      },
    ],
  },
}))

assert.equal(parsed.length, 3, 'notification with invalid timestamp must be dropped')
assert.deepEqual(parsed.map((n) => n.jenis), ['tinggi', 'rendah', 'iramaTidakTeratur'])

assert.equal(parsed[0].mulai, '2026-07-31T14:30:15.000Z')
assert.equal(parsed[0].ambang, 120)
assert.equal(parsed[0].puncakBpm, 134)
assert.equal(parsed[0].sampel, 2)

assert.equal(parsed[1].mulai, '2026-07-29T23:15:00.000Z')
assert.equal(parsed[1].ambang, undefined, 'non-positive threshold must not be exposed')
assert.equal(parsed[1].puncakBpm, 39)
assert.equal(parsed[1].sampel, 1)

assert.equal(parsed[2].mulai, '2026-07-29T05:00:00.000Z')
assert.equal(parsed[2].puncakBpm, 91)
assert.equal(parsed[2].sampel, 2)

assert.deepEqual(parseHrNotifications('{broken-json'), [])
assert.deepEqual(parseHrNotifications(JSON.stringify({ data: {} })), [])

console.log('HR notification parser rejects invalid dates and preserves valid high/low/irregular events.')
