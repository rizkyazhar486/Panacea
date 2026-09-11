import assert from 'node:assert/strict'
import {
  extractHeartRateSeries,
  extractSleepSessions,
  newestSampleDate,
  parseHealthWebhookPayload,
  tanggalDiOffset,
} from '../src/healthWebhook.js'

assert.equal(tanggalDiOffset('2026-09-08 00:30:00 +0700'), '2026-09-08')
assert.equal(tanggalDiOffset('2026-09-08T00:30:00.123+05:30'), '2026-09-08')
assert.equal(tanggalDiOffset('not-a-date'), null)

const summaryPayload = {
  data: {
    metrics: [
      {
        name: 'weight_body_mass',
        units: 'lb',
        data: [
          { qty: 220, date: '2026-09-07 08:00:00 +0700' },
          { qty: 200, date: '2026-09-08 08:00:00 +0700' },
        ],
      },
      {
        name: 'step_count',
        units: 'count',
        data: [
          { qty: 5000, date: '2026-09-07 20:00:00 +0700' },
          { qty: 1000, date: '2026-09-08 08:00:00 +0700' },
          { qty: 2500, date: '2026-09-08 20:00:00 +0700' },
        ],
      },
      {
        name: 'walking_running_distance',
        units: 'mi',
        data: [
          { qty: 4, date: '2026-09-07 18:00:00 +0700' },
          { qty: 1, date: '2026-09-08 09:00:00 +0700' },
          { qty: 2, date: '2026-09-08 18:00:00 +0700' },
        ],
      },
      {
        name: 'blood_oxygen_saturation',
        units: '%',
        data: [{ qty: 0.97, date: '2026-09-08 07:00:00 +0700' }],
      },
      {
        name: 'sleep_analysis',
        units: 'min',
        data: [
          { asleep: 390, date: '2026-09-07 06:30:00 +0700' },
          { asleep: 420, date: '2026-09-08 06:30:00 +0700' },
        ],
      },
    ],
  },
}

const parsed = parseHealthWebhookPayload(summaryPayload)
assert.equal(parsed.weightKg, 90.72, 'latest body weight should be selected and converted from lb to kg')
assert.equal(parsed.steps, 3500, 'daily cumulative metrics must sum only the newest local day')
assert.equal(parsed.distanceKm, 4.83, 'distance must sum the newest day then convert miles to kilometres')
assert.equal(parsed.spo2Pct, 97, 'ratio-form oxygen saturation must normalize to percent')
assert.equal(parsed.sleepH, 7, 'sleep minutes must normalize to hours')
assert.deepEqual(parseHealthWebhookPayload(null), {})
assert.deepEqual(parseHealthWebhookPayload({ data: { metrics: 'invalid' } }), {})

assert.equal(
  newestSampleDate({
    data: {
      metrics: [{
        name: 'heart_rate',
        data: [
          { qty: 70, date: '2026-09-07 23:50:00 +0700' },
          { qty: 72, date: '2026-09-08 00:10:00 +0700' },
        ],
      }],
    },
  }),
  '2026-09-08',
  'history date must follow the newest sample date carried by the phone payload',
)

const heartRateSeries = extractHeartRateSeries({
  data: {
    metrics: [
      {
        name: 'heart_rate',
        data: [
          { qty: 82, date: '2026-09-08 08:05:00 +0700' },
          { Avg: 78.4, Min: 70, Max: 88, date: '2026-09-08 08:00:00 +0700' },
          { qty: 0, date: '2026-09-08 08:10:00 +0700' },
        ],
      },
      {
        name: 'resting_heart_rate',
        data: [{ qty: 58, date: '2026-09-08 06:00:00 +0700' }],
      },
    ],
    workouts: [{
      heartRateData: [{ qty: 145, date: '2026-09-08 09:00:00 +0700' }],
    }],
  },
})

assert.equal(heartRateSeries.length, 4)
assert.deepEqual(heartRateSeries.map((sample) => sample.kind), ['resting', 'heart_rate', 'heart_rate', 'workout'])
assert.deepEqual(heartRateSeries.map((sample) => sample.bpm), [58, 78, 82, 145])
assert.equal(heartRateSeries[1].lo, 70)
assert.equal(heartRateSeries[1].hi, 88)
assert.ok(heartRateSeries.every((sample, index, all) => index === 0 || all[index - 1].t <= sample.t))

const sleepSessions = extractSleepSessions({
  data: {
    metrics: [{
      name: 'sleep_analysis',
      units: 'min',
      data: [{
        sleepStart: '2026-09-07 23:30:00 +0700',
        sleepEnd: '2026-09-08 06:30:00 +0700',
        asleep: 420,
        deep: 90,
        rem: 120,
        core: 180,
        awake: 30,
        inBed: 450,
        source: 'Apple Watch',
      }],
    }],
  },
})

assert.equal(sleepSessions.length, 1)
assert.deepEqual(sleepSessions[0], {
  date: '2026-09-08',
  start: '2026-09-07T16:30:00.000Z',
  end: '2026-09-07T23:30:00.000Z',
  totalH: 7,
  deepH: 1.5,
  remH: 2,
  coreH: 3,
  awakeH: 0.5,
  inBedH: 7.5,
  source: 'Apple Watch',
})

console.log('Health webhook parsing, unit, timezone, HR-series, and sleep-session invariants verified.')
