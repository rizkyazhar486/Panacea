import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { naegele } from '../../src/domains/clinical-calculators/index.ts'

const DAY = 86_400_000
const at = (iso: string, extraMs = 0) => Date.parse(`${iso}T00:00:00Z`) + extraMs
const ok = (lmp: string, cycle: number, now: number) => { const r = naegele(lmp, cycle, now); assert.ok(r.ok, `${lmp} ${cycle}`); return r.ok ? r.data : (undefined as never) }

// Valor tangan: HPHT 2026-01-10 + 280 hari = 2026-10-17; 63 hari kemudian = 9 minggu 0 hari.
assert.deepEqual(ok('2026-01-10', 28, at('2026-10-17')), { eddIso: '2026-10-17', gestationalAge: { weeks: 40, days: 0 }, gestationalAgeHidden: null })
assert.deepEqual(ok('2026-01-10', 28, at('2026-03-14')).gestationalAge, { weeks: 9, days: 0 })
assert.deepEqual(ok('2026-01-10', 28, at('2026-03-14', 13 * 3_600_000)).gestationalAge, { weeks: 9, days: 0 }, 'jam dalam hari tidak menggeser hari')
assert.deepEqual(ok('2026-01-10', 28, at('2026-03-20')).gestationalAge, { weeks: 9, days: 6 })

// INVARIAN: pada hari EDD, UK tepat 40 minggu 0 hari untuk siklus berapa pun (halaman lama gagal ini untuk siklus ≠ 28).
for (let cycle = 20; cycle <= 60; cycle++) {
  const edd = ok('2026-01-10', cycle, at('2026-12-31')).eddIso
  const pada = ok('2026-01-10', cycle, at(edd))
  assert.deepEqual(pada.gestationalAge, { weeks: 40, days: 0 }, `siklus ${cycle}, EDD ${edd}`)
  assert.equal(new Date(`${edd}T00:00:00Z`).getTime() - at('2026-01-10'), (280 + cycle - 28) * DAY, `selisih EDD siklus ${cycle}`)
}
// Regresi terhadap halaman lama (oracle = rumus lama): identik untuk siklus 28, berbeda hanya karena tanda koreksi untuk siklus lain.
const lama = (lmp: string, cycle: number, now: number) => {
  const adj = cycle - 28
  return { edd: new Date(at(lmp) + (280 + adj) * DAY).toISOString().slice(0, 10), gaDays: Math.floor((now - at(lmp)) / DAY) + adj }
}
for (const now of [at('2026-02-01'), at('2026-06-30'), at('2026-10-17')]) {
  const o = lama('2026-01-10', 28, now), n = ok('2026-01-10', 28, now)
  assert.equal(n.eddIso, o.edd); assert.equal(n.gestationalAge!.weeks * 7 + n.gestationalAge!.days, o.gaDays)
}
// Jejak cacat lama: siklus 35 → UK lama pada hari EDD 294 hari (bukan 280); siklus 21 → 266.
assert.equal(lama('2026-01-10', 35, at(lama('2026-01-10', 35, 0).edd)).gaDays, 294)
assert.equal(lama('2026-01-10', 21, at(lama('2026-01-10', 21, 0).edd)).gaDays, 266)
assert.equal(ok('2026-01-10', 35, at('2026-10-24')).eddIso, '2026-10-24') // EDD sama dengan yang lama; hanya UK yang dikoreksi
// Pasangan: hanya siklus berbeda → EDD bergeser tepat selisih siklus.
assert.equal(ok('2026-01-10', 35, at('2026-12-31')).eddIso, '2026-10-24'); assert.equal(ok('2026-01-10', 21, at('2026-12-31')).eddIso, '2026-10-10')

// Hasil tidak bergantung zona waktu peramban (halaman lama bergantung).
const zonaAsli = process.env.TZ
const hasil = ['America/Los_Angeles', 'Asia/Jakarta', 'Pacific/Kiritimati', 'UTC'].map((tz) => { process.env.TZ = tz; return JSON.stringify(naegele('2026-03-01', 30, at('2026-05-10', 23 * 3_600_000))) })
if (zonaAsli === undefined) delete process.env.TZ; else process.env.TZ = zonaAsli
assert.equal(new Set(hasil).size, 1, 'zona waktu tidak boleh mengubah hasil')

// Validasi HPHT: format, kalender nyata, rentang tahun, bukan di masa depan.
const GL = { ok: false, reason: 'LMP must be a real date (YYYY-MM-DD) between 1900 and 2100' }
for (const bad of ['', '2026-02-31', '2026-13-01', '2026-00-10', '2026-1-1', '10/01/2026', 'abc', '2026-01-10T00:00', ' 2026-01-10', '1899-12-31', '2101-01-01', '2026-04-31']) {
  assert.deepEqual(naegele(bad, 28, at('2026-10-01')), GL, `HPHT ${JSON.stringify(bad)}`)
}
for (const salah of [undefined, null, 20260110, {}] as unknown as string[]) assert.deepEqual(naegele(salah, 28, at('2026-10-01')), GL)
assert.equal(naegele('2024-02-29', 28, at('2026-10-01')).ok, true, 'tahun kabisat sah')
assert.deepEqual(naegele('2025-02-29', 28, at('2026-10-01')), GL, 'bukan tahun kabisat')
// "Hari ini" adalah hari UTC: sama dengan hari ini diterima (UK 0), satu milidetik melewati tengah malam berikutnya masih sah, besok ditolak.
assert.deepEqual(ok('2026-10-01', 28, at('2026-10-01', DAY - 1)).gestationalAge, { weeks: 0, days: 0 })
assert.deepEqual(naegele('2026-10-02', 28, at('2026-10-01', DAY - 1)), { ok: false, reason: 'LMP cannot be in the future' })
assert.equal(naegele('2026-10-02', 28, at('2026-10-02')).ok, true)
// Siklus: batas diterima, satu langkah di luar ditolak; harus bilangan bulat.
const GC = { ok: false, reason: 'Cycle length must be a whole number of 20–60 days' }
for (const c of [20, 60]) assert.equal(naegele('2026-01-10', c, at('2026-03-01')).ok, true, `siklus ${c}`)
for (const c of [19, 61, 0, -28, 28.5, NaN, Infinity, +'']) assert.deepEqual(naegele('2026-01-10', c, at('2026-03-01')), GC, `siklus ${c}`)
for (const salah of [undefined, null, '28'] as unknown as number[]) assert.equal(naegele('2026-01-10', salah, at('2026-03-01')).ok, false)
assert.deepEqual(naegele('2026-01-10', 28, NaN), { ok: false, reason: 'Current time is unavailable' })
assert.equal('data' in (naegele('', 28, 0) as object), false)
// Jebakan nyata halaman lama: siklus kosong → 0 → EDD mundur 28 hari dan UK maju 28 hari.
assert.equal(lama('2026-01-10', +'', at('2026-01-10')).gaDays, -28)
assert.deepEqual(naegele('2026-01-10', +'', at('2026-01-10')), GC)

// UK disembunyikan dengan alasan yang benar: negatif (siklus panjang, HPHT baru) vs melewati batas tampilan 45 minggu.
assert.deepEqual(ok('2026-10-01', 60, at('2026-10-01')), { eddIso: '2027-08-09', gestationalAge: null, gestationalAgeHidden: 'not-started' })
assert.deepEqual(ok('2026-10-01', 20, at('2026-10-01')).gestationalAge, { weeks: 1, days: 1 }) // 0 − (−8) = 8 hari
const batas = at('2026-01-10', 315 * DAY)
assert.deepEqual(ok('2026-01-10', 28, batas).gestationalAge, { weeks: 45, days: 0 })
assert.deepEqual(ok('2026-01-10', 28, batas + DAY), { eddIso: '2026-10-17', gestationalAge: null, gestationalAgeHidden: 'beyond-limit' })
assert.equal(ok('1900-01-01', 28, at('2026-10-01')).gestationalAgeHidden, 'beyond-limit')
assert.deepEqual(naegele('2026-01-10', 28, at('2026-06-01')), naegele('2026-01-10', 28, at('2026-06-01')), 'deterministik')

// Halaman memakai fungsi kanonik, jam disuntik, dan tidak menghitung ulang.
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /naegele\(lmp, cycleLen, nowMs\)/)
assert.match(halaman, /useState\(\(\) => Date\.now\(\)\)/)
assert.match(halaman, /result\?\.ok &&/); assert.match(halaman, /!result\.ok &&/); assert.match(halaman, /\{result\.reason\}/)
assert.match(halaman, /timeZone: 'UTC'/)
assert.doesNotMatch(halaman, /280 \+ cycleAdj/, 'rumus Naegele tidak boleh disalin ke halaman')
assert.doesNotMatch(halaman, /edd\.setDate/, 'aritmetika tanggal lokal tidak boleh kembali')
console.log('naegele-gestational-age: EDD, GA == 40w0d at EDD for every cycle, timezone-independent, calendar validation, hidden-GA reasons')
