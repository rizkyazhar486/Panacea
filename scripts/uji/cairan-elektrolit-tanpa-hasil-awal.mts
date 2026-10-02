import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// TIGA TERAKHIR DARI PENYISIRAN, DAN YANG SATU MENGELUARKAN VOLUME.
//
// FluidCalculators memuat lima sub-kalkulator, masing-masing dengan kalimat
// siap salin, dan kelimanya terbuka sudah terisi: rumatan pada 70 kg,
// resusitasi pada 70 kg (Parkland 4 x 70 x 20% = 5600 mL beserta laju per
// jam), natrium terkoreksi dari Na 130 dengan glukosa 400, laju koreksi dari
// Na 120, dan defisit kalium dari K 3,0.
//
// FeNa terbuka pada UNa 20 / PCr 2,0 / PNa 140 / UCr 60 = 0,48%, di bawah 1 --
// sebuah DIAGNOSIS BANDING, "prerenal azotemia likely", tanpa satu sampel pun.
//
// LDL terbuka pada TC 200 / HDL 50 / TG 150 = 120 mg/dL, sebuah hasil lipid
// lengkap dengan pitanya.
// ─────────────────────────────────────────────────────────────────────────────

const baca = (n: string) => readFileSync(new URL(`../../src/pages/${n}`, import.meta.url), 'utf8')
const kodeDari = (s: string) => s.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*')).join('\n')

// ── FeNa (Espinel 1976) ────────────────────────────────────────────────────
const fena = baca('FenaCalculator.tsx')
const fenaKode = kodeDari(fena)
for (const b of ['useState(20)', 'useState(2.0)', 'useState(140)', 'useState(60)']) {
  assert.ok(!fenaKode.includes(b), `a laboratory default is back in FeNa: ${b}`)
}
assert.ok(/const result = lengkap \? interpret\(fena\) : null/.test(fenaKode),
  'FeNa still names a differential diagnosis without a paired urine and plasma sample')
// "Sedang memakai diuretik" adalah jawaban, bukan pengukuran.
assert.ok(/const \[onDiuretics, setOnDiuretics\] = useState\(false\)/.test(fenaKode),
  'the diuretic question was made unanswered; unticked means no, and it changes how the result is read')
// Rumus ditulis ulang: FeNa = (UNa x PCr) / (PNa x UCr) x 100.
const hitungFena = (una: number, pcr: number, pna: number, ucr: number) => (una * pcr) / (pna * ucr) * 100
assert.ok(Math.abs(hitungFena(20, 2.0, 140, 60) - 0.476) < 0.001,
  'the old defaults no longer give 0.48%; re-read this gate')
assert.ok(hitungFena(20, 2.0, 140, 60) < 1, 'the old defaults no longer fall in the prerenal band; re-read this gate')
assert.ok(/\(urineNa \* plasmaCr\) \/ denom \* 100/.test(fenaKode), 'the page no longer applies the FeNa formula')

// ── LDL (Friedewald 1972) ──────────────────────────────────────────────────
const ldl = baca('LdlCalculator.tsx')
const ldlKode = kodeDari(ldl)
for (const b of ['useState(200)', 'useState(50)', 'useState(150)']) {
  assert.ok(!ldlKode.includes(b), `a lipid default is back in the LDL calculator: ${b}`)
}
assert.ok(/const band = lengkap \? ldlBand\(ldl\) : null/.test(ldlKode), 'LDL still bands a value computed from nothing')
assert.ok(/totalChol - hdl - tg \/ 5/.test(ldlKode), 'the page no longer applies Friedewald')
// Peringatan TG >= 400 harus bertahan: ia benar dan penting.
assert.ok(/tg >= 400/.test(ldlKode), 'the Friedewald validity limit at TG >= 400 was dropped')

// ── FluidCalculators ───────────────────────────────────────────────────────
const cairan = baca('FluidCalculators.tsx')
const cairanKode = kodeDari(cairan)
for (const b of ['useState(70)', 'useState(20)', 'useState(130)', 'useState(400)', 'useState(120)', 'useState(3.0)']) {
  assert.ok(!cairanKode.includes(b), `a starting body or laboratory value is back in FluidCalculators: ${b}`)
}
for (const penjaga of ['adaBerat', 'bisaHitung', 'adaNaTerkoreksi', 'adaLajuNa', 'adaDefisitK']) {
  assert.ok(cairanKode.includes(penjaga), `a sub-calculator lost its guard: ${penjaga}`)
}
// Kelima kalimat siap salin harus berada di belakang penjaganya.
const salin = cairan.split('\n').filter((b) => /<CopyNote/.test(b))
assert.equal(salin.length, 5, `expected five copyable summaries, found ${salin.length}`)
for (const b of salin) {
  assert.ok(/ada[A-Z]\w*|bisaHitung/.test(b), `a fluid summary can be copied with nothing entered: ${b.trim().slice(0, 90)}`)
}
// Pemilih skenario BUKAN pengukuran: ia memilih rumus. Nilai awalnya sah.
assert.ok(/useState<'adult-sepsis' \| 'peds-shock' \| 'burns'>\('adult-sepsis'\)/.test(cairanKode),
  'the scenario selector was made unanswered; it chooses which formula to use, not a fact about the patient')

// Parkland ditulis ulang: 4 mL x kg x %TBSA.
const parkland = (kg: number, tbsa: number) => 4 * kg * tbsa
assert.equal(parkland(70, 20), 5600, 'the old defaults no longer give 5600 mL; re-read this gate')
assert.ok(/4 \* weightKg \* tbsaPct/.test(cairanKode), 'the page no longer applies the Parkland formula')

console.log('cairan-elektrolit-tanpa-hasil-awal: ok')
