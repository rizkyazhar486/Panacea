import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { HUFNER, KELARUTAN_PLASMA, kandunganOksigen } from '../../src/lib/hemodinamik.ts'
import {
  DEFAULT_OXYGEN_CONTENT_CONVENTION,
  OXYGEN_CONTENT_CONVENTIONS,
  oxygenContentConvention,
  oxygenContentMlDl,
} from '../../src/lib/physiology/oxygenContentConventions.ts'

assert.equal(DEFAULT_OXYGEN_CONTENT_CONVENTION, 'panacea-clinical-effective-v1')
const hemodynamicSource = readFileSync('src/lib/hemodinamik.ts', 'utf8')
assert.match(hemodynamicSource, /oxygenContentConvention/, 'hemodinamik.ts must consume the canonical oxygen-content convention registry')
assert.doesNotMatch(hemodynamicSource, /export const HUFNER\s*=\s*1\.34/, 'HUFNER must not remain a duplicated literal in hemodinamik.ts')
const clinical = oxygenContentConvention(DEFAULT_OXYGEN_CONTENT_CONVENTION)
assert.equal(clinical.executable, true)
assert.equal(clinical.hufnerMlO2PerGHb, HUFNER)
assert.equal(clinical.dissolvedMlO2PerDlPerMmHg, KELARUTAN_PLASMA)
assert.equal(clinical.hbWorkingUnit, 'g/dL')

const ca = oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: 15, unit: 'g/dL' }, 0.98, 100)
assert.ok(Math.abs(ca - kandunganOksigen(15, 0.98, 100)) < 1e-12)
assert.ok(Math.abs(oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: 150, unit: 'g/L' }, 0.98, 100) - ca) < 1e-12)
assert.ok(Math.abs(ca - 19.998) < 1e-12)

const theoretical = oxygenContentConvention('theoretical-hufner-v1')
assert.equal(theoretical.hufnerMlO2PerGHb, 1.39)
assert.equal(theoretical.dissolvedMlO2PerDlPerMmHg, 0.0031)
assert.ok(oxygenContentMlDl('theoretical-hufner-v1', { value: 15, unit: 'g/dL' }, 0.98, 100) > ca)

const elso = oxygenContentConvention('elso-vv-2021-verbatim')
assert.equal(elso.executable, false)
assert.equal(elso.sourcePrintedHbUnit, 'g/L')
assert.match(elso.unitIssue ?? '', /inconsistent/i)
assert.throws(() => oxygenContentMlDl('elso-vv-2021-verbatim', { value: 12, unit: 'g/dL' }, 0.9, 80), /non-executable/)

assert.equal(new Set(OXYGEN_CONTENT_CONVENTIONS.map((x) => x.id)).size, OXYGEN_CONTENT_CONVENTIONS.length)
assert.throws(() => oxygenContentConvention('unknown' as never), /unknown oxygen-content convention/)
for (const bad of [
  () => oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: -1, unit: 'g/dL' }, 0.98, 100),
  () => oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: 15, unit: 'g/dL' }, -0.1, 100),
  () => oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: 15, unit: 'g/dL' }, 1.1, 100),
  () => oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, { value: 15, unit: 'g/dL' }, 0.98, -1),
]) assert.throws(bad, /oxygen-content input/)


// SATU sumber untuk koefisien kandungan O2. Konvensi (1.34 vs 1.39, kelarutan 0.003 vs 0.0031/0.0034) dipilih
// secara eksplisit di registri; salinan literal di tempat lain tidak ikut berubah dan membuat satu layar
// menampilkan angka berbeda dari layar lain untuk pasien yang sama. Yang dilarang adalah ARITMATIKA berliteral
// (`1.34 *`, `* 0.003`), bukan teks rumus yang ditampilkan ke pengguna (memakai ×).
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

// 1.34 sebagai pengali selalu kapasitas Hb. 0.003 terlalu umum (mis. jari-jari geometri 3D), jadi hanya dihitung
// bila barisnya juga bermuatan O2 (pO2, PaO2, partial, O2).
const KAPASITAS_HB = /(?<![\w.])1\.34\s*\*|\*\s*1\.34(?![\d.])/
const KELARUTAN = /(?<![\w.])0\.003\s*\*|\*\s*0\.003(?![\d])/
const KONTEKS_O2 = /po2|pao2|pvo2|partial|o2/i
export function barisBerliteral(source: string): string[] {
  return source
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line) && (KAPASITAS_HB.test(line) || (KELARUTAN.test(line) && KONTEKS_O2.test(line))))
}

// Kontrol positif: pemindai benar-benar melihat aritmatika berliteral, dan membiarkan komentar serta teks rumus.
assert.equal(barisBerliteral('const c = 1.34 * hb * s + 0.003 * po2').length, 1)
assert.equal(barisBerliteral('const k = hb * 1.34').length, 1)
assert.equal(barisBerliteral('const d = 0.003 * po2').length, 1)
assert.equal(barisBerliteral('const d = (caO2 - 0.003 * pao2) / x').length, 1)
assert.equal(barisBerliteral('return 0.003 * partialPressure').length, 1)
// Pasangan: angka yang sama tanpa muatan O2 (jari-jari geometri) bukan rumus oksigen.
assert.equal(barisBerliteral('const r = 0.012 + (strand % 3) * 0.003').length, 0, '0.003 tanpa konteks O2 tidak dihitung')
assert.equal(barisBerliteral('// CaO2 = 1.34 * Hb * SaO2').length, 0, 'komentar tidak dihitung')
assert.equal(barisBerliteral(" * C_O2 = 1.34 * Hb").length, 0, 'komentar blok tidak dihitung')
assert.equal(barisBerliteral("expression: 'CaO₂ ≈ 1.34 × Hb × SaO₂ + 0.003 × PaO₂'").length, 0, 'teks rumus untuk pengguna tidak dihitung')
assert.equal(barisBerliteral('const x = 11.34 * y + 10.003 * z').length, 0, 'bagian dari angka lain tidak dihitung')

const KANONIK = join('src', 'lib', 'physiology', 'oxygenContentConventions.ts')
const pelanggar: string[] = []
for (const rel of readdirSync('src', { recursive: true }) as string[]) {
  if (!/\.tsx?$/.test(rel)) continue
  const path = join('src', rel)
  if (path === KANONIK) continue
  for (const line of barisBerliteral(readFileSync(path, 'utf8'))) pelanggar.push(`${path}: ${line.trim()}`)
}
assert.deepEqual(pelanggar, [], `koefisien kandungan O2 harus datang dari registri konvensi, bukan literal:\n  ${pelanggar.join('\n  ')}`)

// Setiap modul yang dimigrasikan benar-benar membaca registri (sepasang dengan pagar hemodinamik.ts di atas).
for (const modul of [
  'src/lib/advancedPhysiology.ts',
  'src/lib/microphysiology.ts',
  'src/lib/bodySim.ts',
  'src/components/digital-twin/ClinicalPhysiologyMechanisms.tsx',
]) {
  assert.match(readFileSync(modul, 'utf8'), /oxygenContentConventions/, `${modul} harus memakai registri konvensi kanonik`)
}

console.log('oxygen-content-conventions: unit-explicit registry, legacy compatibility, theoretical variant, ELSO verbatim fail-closed')
