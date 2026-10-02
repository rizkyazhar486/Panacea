import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Penanda sekali-sehari/cooldown pengingat HARUS ditulis di dalam lambda commit milik
// deliverThenCommitAlertState (kirim dulu, tandai sesudahnya). Penulisan langsung sebelum
// notify() menekan semua percobaan ulang bila penulisan notifikasi gagal. Gerbang ini
// struktural: ia mencegah pola lama kembali di salah satu pemeriksa.

const TARGETS: Array<[file: string, keys: string[]]> = [
  ['src/healthAlerts.ts', ['hrZoneLastAlertAt', 'sleepLastFiredOn', 'latihanLastFiredOn']],
  ['src/index.ts', ['cekHarianLastFiredOn']],
  ['src/salat.ts', ['salatLastFired']],
]

export function stampWrites(source: string, key: string) {
  const all = [...source.matchAll(new RegExp(`saveSettings\\([^)]*\\b${key}\\b`, 'g'))].length
  const wrapped = [...source.matchAll(new RegExp(`\\(\\) => saveSettings\\([^)]*\\b${key}\\b`, 'g'))].length
  return { all, wrapped }
}

for (const [file, keys] of TARGETS) {
  const src = readFileSync(file, 'utf8')
  assert.match(src, /deliverThenCommitAlertState\(/, `${file} must use deliverThenCommitAlertState`)
  for (const key of keys) {
    const { all, wrapped } = stampWrites(src, key)
    assert.ok(all >= 1, `${file}: expected a write of ${key}`)
    assert.equal(wrapped, all, `${file}: every write of ${key} must be inside the deliverThenCommitAlertState commit lambda, not before notify()`)
  }
}

// Pasangan negatif: pola lama harus terdeteksi oleh pemeriksa gerbang ini sendiri.
const old = `saveSettings(userId, { sleepLastFiredOn: localDate })\nawait notify(userId, {})`
assert.deepEqual(stampWrites(old, 'sleepLastFiredOn'), { all: 1, wrapped: 0 }, 'the old stamp-before-notify shape must read as unwrapped')
const fixed = `deliverThenCommitAlertState(() => notify(userId, {}), () => saveSettings(userId, { sleepLastFiredOn: localDate }))`
assert.deepEqual(stampWrites(fixed, 'sleepLastFiredOn'), { all: 1, wrapped: 1 }, 'the fixed shape must read as wrapped')

console.log('Alert stamps are committed after delivery in healthAlerts, daily check-in and prayer reminders.')
