import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateJetLagInput, JETLAG_RANGES, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const base = { tzAsal: 7, tzTujuan: 1, jamBangunBiasa: '06:00', hariPersiapan: 3 }
type In = Parameters<typeof validateJetLagInput>[0]
const run = (o: Partial<In> = {}) => validateJetLagInput({ ...base, ...o })
const tolak = (o: Partial<In>, pesan: string) => {
  const r = run(o)
  assert.equal(r.ok, false, JSON.stringify(o))
  if (!r.ok) assert.deepEqual(r.reasons, [pesan])
}
const TZ_A = 'origin time zone must be a number from −12 to +14'
const TZ_T = 'destination time zone must be a number from −12 to +14'
const JAM = 'usual wake time must be a valid HH:MM time'
const HARI = 'preparation days must be a whole number from 0 to 4'

// Positif: masukan sah lewat apa adanya (tanpa pembulatan/penggantian).
const ok = run(); assert.equal(ok.ok, true); if (ok.ok) assert.deepEqual(ok.value, base)
assert.deepEqual(run(), run())

// Negatif: kolom kosong = NaN dari parseNumberField → ditolak, BUKAN UTC+0 (regresi `Number('') || 0`).
assert.ok(Number.isNaN(parseNumberField('')) && Number.isNaN(parseNumberField('  ')))
tolak({ tzAsal: parseNumberField('') }, TZ_A); tolak({ tzTujuan: parseNumberField('') }, TZ_T); tolak({ hariPersiapan: parseNumberField('') }, HARI)
tolak({ tzAsal: 'abc' }, TZ_A); tolak({ tzTujuan: null }, TZ_T); tolak({ tzAsal: Infinity }, TZ_A); tolak({ tzTujuan: -Infinity }, TZ_T)
// Regresi: zona waktu 99 dulu lolos; jam bangun rusak dulu diganti diam-diam 07.00.
tolak({ tzTujuan: 99 }, TZ_T); tolak({ jamBangunBiasa: 'pagi' }, JAM); tolak({ jamBangunBiasa: '' }, JAM); tolak({ jamBangunBiasa: 600 }, JAM)
// Batas berpasangan (literal, bukan konstanta, agar mutan penggeser konstanta gagal): tepat di batas sah, ±1 langkah ditolak.
for (const v of [-12, 14, 5.5]) assert.equal(run({ tzAsal: v }).ok, true, `tz ${v}`)
for (const v of [-12.5, 14.5]) tolak({ tzAsal: v }, TZ_A)
for (const v of [0, 4]) assert.equal(run({ hariPersiapan: v }).ok, true, `hari ${v}`)
for (const v of [-1, 5, 2.5]) tolak({ hariPersiapan: v }, HARI)
for (const t of ['00:00', '23:59']) assert.equal(run({ jamBangunBiasa: t }).ok, true, t)
for (const t of ['24:00', '23:60', '6:00', '06:0']) tolak({ jamBangunBiasa: t }, JAM)
// Banyak pelanggaran dilaporkan bersama, urut tetap.
const banyak = run({ tzAsal: 99, jamBangunBiasa: 'x', hariPersiapan: 9 }); assert.equal(banyak.ok, false); if (!banyak.ok) assert.deepEqual(banyak.reasons, [TZ_A, JAM, HARI])
assert.deepEqual([JETLAG_RANGES.timeZone.min, JETLAG_RANGES.timeZone.max, JETLAG_RANGES.prepDays.min, JETLAG_RANGES.prepDays.max], [-12, 14, 0, 4])

// Wiring halaman: mesin domain memberi gerbang rencana; `|| 0` tidak boleh kembali.
const page = readFileSync(new URL('../../src/pages/clinical/ClinicalTrackers.tsx', import.meta.url), 'utf8')
assert.ok(/validateJetLagInput\(\{/.test(page) && /cek\.ok \? rencanaJetLag\(cek\.value\) : null/.test(page), 'halaman tidak memakai validator jet lag')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
console.log('jetlag-inputs: kosong/NaN/Infinity/99/jam rusak ditolak beralasan, batas −12/+14 & 0–4 berpasangan, wiring halaman')
