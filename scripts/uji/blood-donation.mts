import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bloodDonationScreen, DONATION_RANGES, DONATION_INTERVAL_WEEKS } from '../../src/domains/clinical-calculators/index.ts'

const NOW = '2026-10-09T12:00:00.000Z'
const base = { age: 30, weightKg: 60, lastDonation: '', now: NOW, pregnant: false, recentIllness: false, recentTattoo: false, chronicCondition: false }
type In = Parameters<typeof bloodDonationScreen>[0]
const run = (o: Partial<In> = {}) => bloodDonationScreen({ ...base, ...o })

// Positif: dewasa sehat, belum pernah donor → mungkin layak, tanpa penghalang.
const ok = run(); assert.equal(ok.likelyEligible, true); assert.deepEqual(ok.blockers, []); assert.equal(ok.nextEligibleDate, null); assert.equal(ok.daysUntilEligible, null)
assert.equal(DONATION_INTERVAL_WEEKS, 12)
// Batas usia (17–65) dan berat (50), berpasangan.
assert.equal(run({ age: 16 }).blockers[0], 'Below the typical minimum donation age (17).'); assert.equal(run({ age: 17 }).likelyEligible, true)
assert.equal(run({ age: 65 }).likelyEligible, true); assert.match(run({ age: 66 }).blockers[0], /^Above the typical routine maximum age \(65\)/)
assert.equal(run({ weightKg: 49.9 }).blockers[0], 'Below the typical minimum weight (50 kg).'); assert.equal(run({ weightKg: 50 }).likelyEligible, true)
// Jeda 12 minggu: 2026-07-17 + 84 hari = 2026-10-09 → sudah boleh (0 hari); sehari kemudian masih terlalu cepat.
const pas = run({ lastDonation: '2026-07-17' }); assert.equal(pas.likelyEligible, true); assert.equal(pas.nextEligibleDate, '2026-10-09'); assert.equal(pas.daysUntilEligible, 0)
assert.ok(Object.is(pas.daysUntilEligible, 0), 'bukan -0')
const cepat = run({ lastDonation: '2026-07-18' }); assert.equal(cepat.likelyEligible, false); assert.equal(cepat.nextEligibleDate, '2026-10-10'); assert.equal(cepat.daysUntilEligible, 1)
assert.deepEqual(cepat.blockers, ['Too soon since your last donation — typically 12 weeks are required between whole-blood donations.'])
// Batas waktu tepat: jatuh tempo 2026-10-10T00:00Z; tepat saat itu = 0 hari (boleh), 1 ms sebelumnya = 1 hari (belum).
assert.equal(run({ lastDonation: '2026-07-18', now: '2026-10-10T00:00:00.000Z' }).likelyEligible, true)
assert.equal(run({ lastDonation: '2026-07-18', now: '2026-10-09T23:59:59.999Z' }).likelyEligible, false)
// Tiap penanda penundaan memunculkan alasannya sendiri; semuanya sekaligus tercantum berurutan.
assert.match(run({ pregnant: true }).blockers[0], /^Currently pregnant/); assert.match(run({ recentIllness: true }).blockers[0], /^Currently feeling unwell/)
assert.match(run({ recentTattoo: true }).blockers[0], /^Recent tattoo/); assert.match(run({ chronicCondition: true }).blockers[0], /^An uncontrolled chronic condition/)
assert.equal(run({ age: 16, weightKg: 40, lastDonation: '2026-09-01', pregnant: true, recentIllness: true, recentTattoo: true, chronicCondition: true }).blockers.length, 7) // usia<17, berat<50, jeda, dan 4 penanda (usia>65 tidak bisa bersamaan dengan usia<17)
assert.deepEqual(run(), run())

// Kosong → bernama, TANPA "Likely eligible" (dulu usia 30/60 kg bawaan) dan tanpa alasan "di bawah usia minimum" (dulu usia kosong = 0).
const kosong = run({ age: NaN, weightKg: NaN })
assert.deepEqual(kosong.missing, ['age', 'weight']); assert.equal(kosong.likelyEligible, null); assert.deepEqual(kosong.blockers, [])
assert.deepEqual(run({ age: NaN }).missing, ['age']); assert.equal(run({ age: NaN }).likelyEligible, null)
// Di luar rentang / tak sahih ditolak dengan alasan; tanpa keputusan.
assert.deepEqual(run({ age: 500 }).invalid, ['age must be 5–120 years']); assert.equal(run({ age: 500 }).likelyEligible, null)
assert.deepEqual(run({ weightKg: 5000 }).invalid, ['weight must be 20–250 kg']); assert.deepEqual(run({ age: -1 }).invalid, ['age must be 5–120 years'])
for (const bad of [Infinity, 0]) assert.equal(run({ age: bad }).likelyEligible, null, `age ${bad}`)
assert.equal(run({ age: '30' as unknown as number }).likelyEligible, null)
assert.deepEqual(run({ lastDonation: '17/07/2026' }).invalid, ['last donation date must be a valid YYYY-MM-DD date']); assert.deepEqual(run({ lastDonation: '2026-02-30' }).invalid, ['last donation date must be a valid YYYY-MM-DD date'])
assert.deepEqual(run({ lastDonation: '2026-10-10' }).invalid, ['last donation date cannot be in the future']); assert.equal(run({ lastDonation: '2026-10-09' }).invalid.length, 0) // hari ini sah
assert.equal(run({ lastDonation: '2026-10-09', now: '2026-10-09T00:00:00.000Z' }).invalid.length, 0) // tepat sama dengan waktu sekarang sah (batas >)
assert.equal(run({ lastDonation: '2026-10-09', now: '2026-10-08T23:59:59.999Z' }).invalid.length, 1) // 1 ms sebelum: di masa depan
for (const bentuk of ['Oct 9 2026', '2026-1-9', '2026-10-09T00:00:00Z', ' 2026-10-09']) assert.equal(run({ lastDonation: bentuk }).invalid.length, 1, bentuk) // bukan YYYY-MM-DD baku
assert.deepEqual(run({ now: 'bukan-waktu' }).invalid, ['current time is invalid']); assert.deepEqual(run({ lastDonation: 5 as unknown as string }).invalid, ['last donation date must be text'])
assert.deepEqual(run({ pregnant: 1 as unknown as boolean }).invalid, ['pregnant must be yes or no']); assert.equal(run({ pregnant: 1 as unknown as boolean }).likelyEligible, null)
// Batas rentang literal: diterima; ±1 ditolak.
for (const [k, lo, hi] of [['age', 5, 120], ['weightKg', 20, 250]] as const) {
  assert.equal(run({ [k]: lo }).invalid.length, 0, `${k} ${lo}`); assert.equal(run({ [k]: hi }).invalid.length, 0, `${k} ${hi}`)
  assert.equal(run({ [k]: lo - 1 }).invalid.length, 1, `${k} ${lo - 1}`); assert.equal(run({ [k]: hi + 1 }).invalid.length, 1, `${k} ${hi + 1}`)
}
assert.deepEqual([DONATION_RANGES.age.max, DONATION_RANGES.weightKg.min], [120, 20])

const page = readFileSync(new URL('../../src/pages/bodyhub/BloodDonation.tsx', import.meta.url), 'utf8')
const kode = page.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
assert.ok(/bloodDonationScreen\(\{/.test(kode) && /parseNumberField\(ageText\)/.test(kode), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(kode) && !/\bgetDemo\s*\(/.test(kode), '`|| 0` atau getDemo() kembali')
assert.ok(/getDemoTersimpan/.test(kode) && /hasil\.likelyEligible === null/.test(kode) && /hasil\.invalid\.length > 0/.test(kode), 'gerbang hasil/penolakan hilang')
assert.ok(/timeZone: 'UTC'/.test(kode), 'tanggal berikutnya tidak dikunci ke UTC')
console.log('blood-donation: batas 17/65/50, jeda 12 minggu tepat, kosong ≠ 0 tanpa "Likely eligible", di luar rentang gagal tertutup')
