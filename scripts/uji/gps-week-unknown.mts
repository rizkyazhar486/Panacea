// C2: total GPS 7 hari tidak menghitung sesi rusak sebagai 0.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { gpsWeek: gw } = await import('../../src/components/foryou/gpsWeekly.ts')
const now = Date.parse('2026-10-16T12:00:00Z')
const a = (hari: number, extra: Record<string, unknown> = {}) => ({ at: new Date(now - hari * 864e5).toISOString(), distKm: 5, durSec: 1800, ...extra })
assert.deepEqual(gw([a(1), a(2)], now), { distanceKm: 10, movingSec: 3600, count: 2 })
assert.deepEqual(gw([], now), { distanceKm: 0, movingSec: 0, count: 0 }, 'tanpa sesi: nol sungguhan')
assert.deepEqual(gw([a(1, { distKm: 0, durSec: 0 })], now), { distanceKm: 0, movingSec: 0, count: 1 }, 'nol tercatat tetap 0')
for (const bad of [undefined, NaN, Infinity, -1, '5', null]) {
  const r = gw([a(1), a(2, { distKm: bad, durSec: bad })], now)
  assert.equal(r.distanceKm, null, `jarak ${String(bad)} → tidak diketahui`); assert.equal(r.movingSec, null, `durasi ${String(bad)} → tidak diketahui`); assert.equal(r.count, 2)
}
let r = gw([a(1, { durSec: NaN })], now); assert.equal(r.distanceKm, 5, 'jarak valid tetap dihitung'); assert.equal(r.movingSec, null)
r = gw([a(1), a(20, { distKm: NaN }), a(-1, { distKm: NaN }), { at: 'bukan tanggal', distKm: NaN, durSec: NaN } as any], now)
assert.deepEqual(r, { distanceKm: 5, movingSec: 1800, count: 1 }, 'di luar jendela / tanggal rusak tidak dihitung')
const w = readFileSync('src/components/foryou/ForYouSocialPulse.tsx', 'utf8')
assert.match(w, /gpsWeek\(activities, Date\.now\(\)\)/); assert.match(w, /summary\.distanceKm === null \? '—'/); assert.match(w, /summary\.movingSec === null \? '— moving'/)
assert.doesNotMatch(w, /Number\.isFinite\(activity\.distKm\) \? activity\.distKm : 0/)
console.log('gps-week-unknown: ok')
