import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { qtc, qtcBand, QTC_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const run = (qtMs: number, hr: number, sex: unknown = 'M') => qtc({ qtMs, hr, sex })
const close = (a: number | null, b: number, e = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < e, `${a} vs ${b}`)

// Pada 60 bpm RR = 1 s → semua rumus kembali ke QT (Hodges: +0).
const s60 = run(400, 60); close(s60.bazett, 400); close(s60.fridericia, 400); close(s60.framingham, 400); close(s60.hodges, 400)
// Nilai tangan, HR 100 → RR 0.6 s; QT 360: Bazett 360/√0.6; Fridericia 360/∛0.6; Framingham 360 + 154×0.4; Hodges 360 + 1.75×40.
const h = run(360, 100)
close(h.bazett, 360 / Math.sqrt(0.6)); close(h.fridericia, 360 / Math.cbrt(0.6)); close(h.framingham, 360 + 154 * 0.4); close(h.hodges, 430)
assert.ok(h.bazett! > h.fridericia!) // Bazett mengoreksi berlebih pada HR tinggi — sifat yang dinyatakan halaman
const l = run(440, 50) // HR rendah: RR 1.2
close(l.hodges, 440 + 1.75 * -10); close(l.framingham, 440 + 154 * (1 - 1.2))
assert.deepEqual(run(400, 60), run(400, 60))

// Pita: ≥500 risiko tinggi (kedua jenis kelamin); L memanjang ≥450, borderline ≥430; P memanjang ≥470, borderline ≥450.
const cases: [number, 'M' | 'F', string, string][] = [
  [429.9, 'M', 'Normal', 'brand'], [430, 'M', 'Borderline', 'low'], [449.9, 'M', 'Borderline', 'low'], [450, 'M', 'Prolonged', 'critical'], [499.9, 'M', 'Prolonged', 'critical'], [500, 'M', 'High risk — markedly prolonged', 'critical'],
  [449.9, 'F', 'Normal', 'brand'], [450, 'F', 'Borderline', 'low'], [469.9, 'F', 'Borderline', 'low'], [470, 'F', 'Prolonged', 'critical'], [499.9, 'F', 'Prolonged', 'critical'], [500, 'F', 'High risk — markedly prolonged', 'critical'],
]
for (const [v, sex, label, tone] of cases) { assert.equal(qtcBand(v, sex).label, label, `${v} ${sex}`); assert.equal(qtcBand(v, sex).tone, tone, `${v} ${sex}`) }
// Pasangan: hanya jenis kelamin yang berbeda memindahkan 440 ms antara Borderline dan Normal.
assert.equal(run(440, 60, 'M').band?.label, 'Borderline'); assert.equal(run(440, 60, 'F').band?.label, 'Normal')
assert.notEqual(run(440, 60, 'M').band?.label, run(440, 60, 'F').band?.label)
// Pita memakai Bazett, bukan rumus lain: QT 360 @ 100 bpm → Bazett 464.8 (Prolonged, L) sedangkan Fridericia 426.8 akan 'Normal'.
const hi = run(360, 100); close(hi.bazett, 360 / Math.sqrt(0.6)); assert.equal(hi.band?.label, 'Prolonged'); assert.equal(qtcBand(hi.fridericia!, 'M').label, 'Normal')

// Kosong → bernama; tanpa angka/pita (dulu 0 → rumus dengan RR 0).
const kosong = run(NaN, NaN); assert.deepEqual(kosong.missing, ['QT interval', 'heart rate']); assert.equal(kosong.bazett, null); assert.equal(kosong.band, null); assert.equal(kosong.hodges, null)
assert.deepEqual(run(400, NaN).missing, ['heart rate']); assert.equal(run(400, NaN).bazett, null); assert.deepEqual(run(NaN, 60).missing, ['QT interval'])
// Regresi: QT 90000 / HR 1 lolos "> 0" dulu; kini ditolak dengan alasan, tanpa nilai apa pun.
assert.deepEqual(run(90000, 60).invalid, ['QT interval must be 200–700 ms']); assert.equal(run(90000, 60).bazett, null)
assert.deepEqual(run(400, 1).invalid, ['heart rate must be 30–200 bpm']); assert.equal(run(400, 1).band, null); assert.equal(run(400, 1).hodges, null)
for (const bad of [Infinity, -1, 0]) assert.equal(run(bad, 60).bazett, null, `QT ${bad}`)
assert.equal(run('400' as unknown as number, 60).bazett, null)
// Jenis kelamin tak sah ditolak; tidak ada angka.
assert.deepEqual(run(400, 60, 'X').invalid, ['sex must be M or F']); assert.equal(run(400, 60, 'X').bazett, null); assert.equal(qtc({ qtMs: 400, hr: 60, sex: undefined }).bazett, null) // (helper run() mengganti undefined dengan 'M', jadi panggil mesin langsung)
// Batas rentang diterima; ± ditolak (pasangan per kolom).
for (const [k, r] of Object.entries(QTC_RANGES)) {
  const f = (v: number) => (k === 'qtMs' ? run(v, 60) : run(400, v))
  assert.notEqual(f(r.min).bazett, null, `${k} min`); assert.notEqual(f(r.max).bazett, null, `${k} max`)
  assert.equal(f(r.min - 0.1).bazett, null, `${k} <min`); assert.equal(f(r.max + 0.1).bazett, null, `${k} >max`)
}

const page = readFileSync(new URL('../../src/pages/clinical/scores/QTcCalculator.tsx', import.meta.url), 'utf8')
assert.ok(/qtc\(\{ qtMs, hr, sex \}\)/.test(page) && /parseNumberField\(qtText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
console.log('qtc: empat rumus (nilai tangan, 60 bpm identik), pita per jenis kelamin di ambang, kosong/di luar rentang/jenis kelamin tak sah gagal tertutup')
