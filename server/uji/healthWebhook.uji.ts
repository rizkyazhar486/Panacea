import assert from 'node:assert/strict'
import {
  extractHeartRateSeries,
  extractSleepSessions,
  newestSampleDate,
  parseHealthWebhookPayload,
  tanggalDiOffset,
} from '../src/healthWebhook'

// Calendar dates must follow the offset embedded by the phone, not server UTC.
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
          // A malformed timestamp must never become the "newest" day merely
          // because its first characters sort after an ISO date.
          { qty: 999999, date: 'zzzz-not-a-date' },
        ],
      },
      {
        name: 'weight_body_mass',
        units: 'lb',
        data: [{ qty: 220.462262, date: '2026-09-08 07:00:00 +0700' }],
      },
      {
        name: 'blood_oxygen_saturation',
        units: '%',
        data: [{ qty: 0.97, date: '2026-09-08 07:30:00 +0700' }],
      },
      {
        name: 'sleep_analysis',
        units: 'min',
        data: [
          {
            date: '2026-09-08 06:20:00 +0700',
            asleep: 420,
            totalSleep: 420,
          },
        ],
      },
      {
        name: 'sleeping_breathing_disturbances',
        units: 'events/hr',
        data: [{ qty: 2.5, date: '2026-09-08 06:20:00 +0700' }],
      },
    ],
    workouts: [
      {
        heartRateData: [
          { qty: 142.4, date: '2026-09-08 06:59:58 +0700' },
          { Avg: 151.2, Min: 130, Max: 168, date: '2026-09-08 07:00:05 +0700' },
          { qty: -1, date: '2026-09-08 07:00:10 +0700' },
        ],
      },
    ],
  },
}

const parsed = parseHealthWebhookPayload(payload)
assert.equal(parsed.steps, 3000, 'only valid samples from the newest valid local day are cumulative')
assert.ok(Math.abs((parsed.weightKg ?? 0) - 100) < 0.02, 'imperial weight converts to kilograms')
assert.equal(parsed.spo2Pct, 97, 'ratio oxygen saturation converts to percentage')
assert.equal(parsed.sleepH, 7, 'sleep minutes convert to hours')
assert.equal(parsed.gangguanNapasTidur, 2.5, 'non-stage sleep metrics remain catalog metrics')
assert.equal(newestSampleDate(payload), '2026-09-08', 'malformed timestamps are ignored for newest-date selection')

const hrPayload = {
  data: {
    metrics: [
      {
        name: 'heart_rate',
        units: 'bpm',
        data: [
          { qty: 70.4, date: '2026-09-08 07:00:20 +0700' },
          { Avg: 65.6, Min: 60.2, Max: 72.8, date: '2026-09-08 07:00:00 +0700' },
          { qty: 0, date: '2026-09-08 07:00:30 +0700' },
          { qty: 99, date: 'bad-date' },
        ],
      },
      {
        name: 'resting_heart_rate',
        units: 'bpm',
        data: [{ qty: 58.2, date: '2026-09-08 06:00:00 +0700' }],
      },
    ],
    workouts: payload.data.workouts,
  },
}

const hr = extractHeartRateSeries(hrPayload)
assert.deepEqual(hr.map((x) => x.kind), ['resting', 'heart_rate', 'workout', 'workout', 'heart_rate'])
assert.deepEqual(hr.map((x) => x.bpm), [58, 66, 142, 151, 70])
assert.equal(hr[1].lo, 60)
assert.equal(hr[1].hi, 73)
assert.ok(hr.every((x, i) => i === 0 || x.t >= hr[i - 1].t), 'HR series is chronological')

const sleep = extractSleepSessions({
  data: {
    metrics: [
      {
        name: 'sleep_analysis',
        units: 'min',
        data: [
          {
            date: '2026-09-08 06:20:00 +0700',
            sleepStart: '2026-09-07 23:10:00 +0700',
            sleepEnd: '2026-09-08 06:20:00 +0700',
            asleep: 420,
            deep: 90,
            rem: 100,
            core: 230,
            awake: 20,
            inBed: 440,
            source: 'Apple Watch',
          },
          {
            date: 'bad-date',
            totalSleep: 500,
          },
        ],
      },
    ],
  },
})
assert.equal(sleep.length, 1)
assert.equal(sleep[0].date, '2026-09-08', 'night is named by local end date')
assert.equal(sleep[0].totalH, 7)
assert.equal(sleep[0].deepH, 1.5)
assert.equal(sleep[0].remH, 1.7)
assert.equal(sleep[0].coreH, 3.8)
assert.equal(sleep[0].source, 'Apple Watch')
assert.equal(sleep[0].start, '2026-09-07T16:10:00.000Z')
assert.equal(sleep[0].end, '2026-09-07T23:20:00.000Z')

assert.deepEqual(parseHealthWebhookPayload(null), {})
assert.deepEqual(extractHeartRateSeries({}), [])
assert.deepEqual(extractSleepSessions({}), [])

console.log('Health webhook parsing regression checks passed.')
