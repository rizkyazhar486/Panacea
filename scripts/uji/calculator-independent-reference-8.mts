// C6 (bagian rekayasa), tahap 8: kafein tersisa saat tidur dan pra-skrining kelayakan donor darah.
// Acuan ditulis TERPISAH dari rumus terbitnya; batas pita kafein memakai aritmetika bilangan bulat (menit × 10 terhadap waktu paruh × 10)
// agar tidak bergantung pada pembulatan float. Bukti rekayasa, BUKAN tinjauan klinis; temuan dan konstanta tanpa sumber dicatat di
// docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md.
import assert from 'node:assert/strict'
import { close, hostileMatrix, mulberry32 } from './support/calculatorHarness.mts'
import {
  CAFFEINE_DRINKS, CAFFEINE_RANGES, DONATION_INTERVAL_WEEKS, DONATION_RANGES, bloodDonationScreen, caffeineAtBedtime, caffeineBand,
} from '../../src/domains/clinical-calculators/index.ts'

// Tabel ditulis ulang sebagai literal: mengubah tabel mesin tidak boleh ikut mengubah acuan.
assert.deepEqual(JSON.parse(JSON.stringify(CAFFEINE_RANGES)), { servings: { min: 0, max: 20 }, customMg: { min: 0, max: 2000 }, halfLifeH: { min: 1.5, max: 9.5 } }, 'caffeine ranges')
assert.deepEqual(CAFFEINE_DRINKS.map((d) => [d.label, d.mg]), [['Brewed coffee (240 ml)', 95], ['Espresso shot', 63], ['Black tea (240 ml)', 47], ['Green tea (240 ml)', 28], ['Energy drink (250 ml can)', 80], ['Cola (330 ml can)', 34]], 'drink table')
assert.deepEqual(Object.fromEntries(Object.entries(DONATION_RANGES).map(([k, v]) => [k, [v.min, v.max]])), { age: [5, 120], weightKg: [20, 250] }, 'donation ranges'); assert.equal(DONATION_INTERVAL_WEEKS, 12)

const rand = mulberry32(20261022)
const between = (min: number, max: number) => min + (max - min) * rand()
const N = 400
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const KOPI = 'Brewed coffee (240 ml)'

// ── 1. Kafein: sisa = dosis × 0,5^(jam/waktu paruh); pita > 25 % tinggi, > 12,5 % dekat, selebihnya rendah ──
for (let n = 0; n < N; n++) {
  const sv = Object.fromEntries(CAFFEINE_DRINKS.map((d) => [d.label, rand() < 0.5 ? Math.floor(between(0, 21)) : Number.NaN])), custom = rand() < 0.5 ? between(0, 2000) : Number.NaN, hl = between(1.5, 9.5)
  const a = Math.floor(between(0, 1440)), b = Math.floor(between(0, 1440))
  const r = caffeineAtBedtime({ servings: sv, customMg: custom, consumedAt: hhmm(a), bedtime: hhmm(b), halfLifeH: hl }); assert.equal(r.invalid.length, 0)
  const dose = CAFFEINE_DRINKS.reduce((s, d) => s + (Number.isNaN(sv[d.label]) ? 0 : sv[d.label] * d.mg), 0) + (Number.isNaN(custom) ? 0 : custom)
  const jam = (((b - a) % 1440) + 1440) % 1440 / 60, sisa = dose * Math.pow(0.5, jam / hl)
  close(r.totalDoseMg as number, dose, 'dose'); close(r.hoursUntilBed as number, jam, 'hours until bed'); close(r.remainingMg as number, sisa, 'remaining mg'); close(r.pctAtBed as number, dose > 0 ? (sisa / dose) * 100 : 0, 'percent')
  close(r.hoursTo12pct as number, 3 * hl, '3 half-lives'); assert.equal(r.curve.length, 17, 'curve covers 0–16 h'); close(r.curve[0], dose, 'curve starts at the dose'); close(r.curve[16], dose * Math.pow(0.5, 16 / hl), 'curve end')
}
// Batas pita persis, dengan bilangan bulat: tinggi ⇔ menit×10 < 120×(waktu paruh×10); dekat ⇔ menit×10 < 180×(waktu paruh×10). Dulu 1.224 dari 6.318
// kasus batas-tepat (mis. waktu paruh 1,6 jam, 3,2 jam sampai tidur = tepat 25 %) jatuh ke pita yang salah karena 25,000000000000007 > 25.
let batas = 0
for (let hl10 = 15; hl10 <= 95; hl10++) for (let start = 0; start < 1440; start += 23) {
  for (const k of [2, 3]) {
    const mins = k * 6 * hl10 // k × waktu paruh × 60 menit = k × hl10 × 6
    if (mins <= 0 || mins >= 1440) continue
    const tinggi = mins * 10 < 120 * hl10, dekat = mins * 10 < 180 * hl10, exact = tinggi ? 'high' : dekat ? 'near' : 'low'
    const r = caffeineAtBedtime({ servings: { [KOPI]: 1 }, customMg: 0, consumedAt: hhmm(start), bedtime: hhmm((start + mins) % 1440), halfLifeH: hl10 / 10 }); assert.equal(r.invalid.length, 0)
    assert.equal(r.band, exact, `band for half-life ${hl10 / 10} h, ${mins} min (k=${k}): pct ${r.pctAtBed}`); batas++
  }
}
assert.ok(batas > 3000, `the exact-boundary grid is large (${batas})`)
// Satu menit di setiap sisi batas tidak pernah salah kelas.
for (const [hl10, mins] of [[16, 191], [16, 192], [16, 193], [30, 359], [30, 360], [30, 361], [30, 539], [30, 540], [30, 541], [95, 1139], [95, 1140], [95, 1141]] as const) {
  const r = caffeineAtBedtime({ servings: { [KOPI]: 1 }, customMg: 0, consumedAt: '00:00', bedtime: hhmm(mins), halfLifeH: hl10 / 10 })
  assert.equal(r.band, mins * 10 < 120 * hl10 ? 'high' : mins * 10 < 180 * hl10 ? 'near' : 'low', `±1 min around the boundary: ${hl10 / 10} h half-life, ${mins} min`)
}
for (const [p, b] of [[100, 'high'], [25.0001, 'high'], [25, 'near'], [12.5001, 'near'], [12.5, 'low'], [0, 'low'], [25 + 7e-15, 'near'], [12.5 + 3e-15, 'low']] as const) assert.equal(caffeineBand(p), b, `band for ${p} %`)
{
  const base = { servings: { [KOPI]: 2 }, customMg: 0, consumedAt: '14:00', bedtime: '23:00', halfLifeH: 5 }
  const r = caffeineAtBedtime(base); close(r.totalDoseMg as number, 190, 'two coffees = 190 mg'); close(r.hoursUntilBed as number, 9, '9 h'); close(r.remainingMg as number, 190 * Math.pow(0.5, 9 / 5), 'worked case remaining'); assert.equal(r.band, 'high', '28.7 % remains at bedtime')
  assert.equal(caffeineAtBedtime({ ...base, bedtime: '01:00' }).hoursUntilBed, 11, 'bedtime after midnight wraps')
  assert.equal(caffeineAtBedtime({ ...base, bedtime: '14:00' }).hoursUntilBed, 0, 'REVIEWER ITEM: consumed at bedtime = 0 h (full dose), not 24 h')
  assert.deepEqual(caffeineAtBedtime({ ...base, servings: {}, customMg: Number.NaN }).totalDoseMg, 0, 'no drinks and a blank custom amount = a real 0 mg dose (documented as "did not drink")'); assert.equal(caffeineAtBedtime({ ...base, servings: {} }).band, 'low'); assert.equal(caffeineAtBedtime({ ...base, servings: {} }).pctAtBed, 0)
  for (const bad of ['', '24:00', '9:00', '12:60', '1200', null, undefined, 12, {}]) { assert.notEqual(caffeineAtBedtime({ ...base, consumedAt: bad as never }).invalid.length, 0, `consumedAt ${String(bad)}`); assert.notEqual(caffeineAtBedtime({ ...base, bedtime: bad as never }).invalid.length, 0, `bedtime ${String(bad)}`) }
  for (const bad of [-1, 21, Infinity, '2', null, undefined, {}, true]) assert.notEqual(caffeineAtBedtime({ ...base, servings: { [KOPI]: bad as never } }).invalid.length, 0, `servings ${String(bad)}`)
  for (const bad of [-1, 2001, Infinity, '5', null, undefined, {}, true]) assert.notEqual(caffeineAtBedtime({ ...base, customMg: bad as never }).invalid.length, 0, `customMg ${String(bad)}`)
  for (const label of ['toString', '__proto__', 'coffee', '', 'Brewed coffee']) { const r2 = caffeineAtBedtime({ ...base, servings: { [label]: 1 } }); assert.deepEqual(r2.invalid, [`unknown drink: ${label}`], `unknown drink ${label}`); assert.equal(r2.totalDoseMg, null) }
  hostileMatrix('caffeine half-life', { h: 5 }, (i) => caffeineAtBedtime({ ...base, halfLifeH: i.h as never }), (r) => (r as { invalid: unknown[] }).invalid.length === 0, ['h'], { h: { min: 1.5, max: 9.5 } })
}

// ── 2. Donor darah: usia 17–65, berat ≥ 50 kg, jeda 12 minggu, empat penanda penundaan ──
const NOW = '2026-10-17T10:00:00Z'
const dasar = { age: 30, weightKg: 60, lastDonation: '', now: NOW, pregnant: false, recentIllness: false, recentTattoo: false, chronicCondition: false }
const DAY = 86_400_000
const refDonor = (i: typeof dasar) => {
  const b: string[] = []
  if (i.age < 17) b.push('age-low'); if (i.age > 65) b.push('age-high'); if (i.weightKg < 50) b.push('weight')
  if (i.lastDonation !== '' && Date.parse(i.lastDonation) + 84 * DAY - Date.parse(i.now) > 0) b.push('interval')
  if (i.pregnant) b.push('pregnant'); if (i.recentIllness) b.push('ill'); if (i.recentTattoo) b.push('tattoo'); if (i.chronicCondition) b.push('chronic')
  return b
}
const kode = (blockers: readonly string[]) => blockers.map((t) => t.startsWith('Below the typical minimum donation') ? 'age-low' : t.startsWith('Above') ? 'age-high' : t.startsWith('Below the typical minimum weight') ? 'weight' : t.startsWith('Too soon') ? 'interval' : t.startsWith('Currently pregnant') ? 'pregnant' : t.startsWith('Currently feeling unwell') ? 'ill' : t.startsWith('Recent tattoo') ? 'tattoo' : 'chronic')
for (let n = 0; n < N * 2; n++) {
  const i = { ...dasar, age: Math.floor(between(5, 121)), weightKg: Math.floor(between(20, 251)), lastDonation: rand() < 0.3 ? '' : new Date(Date.parse(NOW) - Math.floor(between(0, 200)) * DAY).toISOString().slice(0, 10), pregnant: rand() < 0.2, recentIllness: rand() < 0.2, recentTattoo: rand() < 0.2, chronicCondition: rand() < 0.2 }
  const r = bloodDonationScreen(i); assert.deepEqual([r.missing.length, r.invalid.length], [0, 0]); assert.deepEqual(kode(r.blockers), refDonor(i), `blockers for ${JSON.stringify(i)}`); assert.equal(r.likelyEligible, refDonor(i).length === 0)
}
{
  const s = (o: object) => bloodDonationScreen({ ...dasar, ...o } as never)
  assert.equal(s({}).likelyEligible, true); assert.deepEqual([s({}).nextEligibleDate, s({}).daysUntilEligible], [null, null], 'never donated: no next date')
  for (const [age, ok] of [[16, false], [17, true], [65, true], [66, false]] as const) assert.equal(s({ age }).likelyEligible, ok, `age ${age}`); for (const [w, ok] of [[49, false], [49.9, false], [50, true]] as const) assert.equal(s({ weightKg: w }).likelyEligible, ok, `weight ${w}`)
  // Jeda 12 minggu persis: tanggal donor 84 hari sebelum "sekarang" pukul 10:00 → sudah lewat; 83 hari → belum.
  const hariLalu = (d: number) => new Date(Date.parse('2026-10-17T00:00:00Z') - d * DAY).toISOString().slice(0, 10)
  assert.equal(s({ lastDonation: hariLalu(84) }).likelyEligible, true, '84 days ago: eligible'); assert.equal(s({ lastDonation: hariLalu(83) }).likelyEligible, false, '83 days ago: too soon')
  const t = s({ lastDonation: hariLalu(83) }); assert.deepEqual([t.daysUntilEligible, t.nextEligibleDate], [1, '2026-10-18'], 'one day to go; next date is last + 84 days')
  const lewat = s({ lastDonation: hariLalu(84) }); assert.ok(Object.is(lewat.daysUntilEligible, 0), 'a mark passed at 10:00 reports 0 days, never -0')
  const hariIni = bloodDonationScreen({ ...dasar, lastDonation: '2026-10-17', now: '2026-10-17T00:00:00Z' } as never); assert.deepEqual([hariIni.invalid.length, hariIni.daysUntilEligible, hariIni.likelyEligible], [0, 84, false], 'a donation dated exactly now is not "in the future"')
  const tepat = bloodDonationScreen({ ...dasar, lastDonation: hariLalu(84), now: '2026-10-17T00:00:00Z' } as never); assert.deepEqual([tepat.likelyEligible, tepat.daysUntilEligible], [true, 0], 'exactly 12 weeks at 00:00: eligible, 0 days (not -0)'); assert.ok(Object.is(tepat.daysUntilEligible, 0))
  assert.equal(bloodDonationScreen({ ...dasar, lastDonation: hariLalu(84), now: '2026-10-16T23:59:59.999Z' } as never).likelyEligible, false, '1 ms before the 12-week mark: not yet')
  assert.deepEqual(s({ age: 16, weightKg: 40, pregnant: true, recentIllness: true, recentTattoo: true, chronicCondition: true }).blockers.length, 6, 'all blockers are listed together, none hides another')
  // Masukan tidak valid: tidak pernah menghasilkan kelayakan.
  const tak = (o: object) => { const r = s(o); assert.equal(r.likelyEligible, null); assert.deepEqual(r.blockers, []); return r }
  for (const k of ['age', 'weightKg']) { const r = tak({ [k]: Number.NaN }); assert.deepEqual([r.missing.length, r.invalid.length], [1, 0], `${k} NaN is missing`); for (const bad of [Infinity, -1, '5', null, undefined, {}, true]) assert.equal(tak({ [k]: bad }).invalid.length, 1, `${k}=${String(bad)}`) }
  for (const bad of ['2026-02-30', '2026-13-01', '2026-2-3', '17/10/2026', 'abc', '2026-10-18', '2099-01-01', ' 2026-01-01', 20261017, null, undefined, {}]) assert.equal(tak({ lastDonation: bad }).invalid.length, 1, `lastDonation ${String(bad)}`)
  for (const bad of ['', 'abc', null, undefined, 5, {}]) assert.ok(tak({ now: bad }).invalid.includes('current time is invalid'), `now ${String(bad)}`)
  for (const k of ['pregnant', 'recentIllness', 'recentTattoo', 'chronicCondition']) for (const bad of [0, 1, 'true', null, undefined, {}]) assert.equal(tak({ [k]: bad }).invalid.length, 1, `${k}=${String(bad)}`)
  hostileMatrix('bloodDonationScreen', dasar as Record<string, unknown>, (i) => bloodDonationScreen(i as never), (r) => (r as { likelyEligible: unknown }).likelyEligible !== null, ['age', 'weightKg'], { age: { min: 5, max: 120 }, weightKg: { min: 20, max: 250 } })
}
console.log('calculator-independent-reference-8: caffeine-at-bedtime and blood-donation screening match independently written references (integer-arithmetic band boundaries, 400+ seeded cases, 12-week boundary to the millisecond, hostile inputs)')
