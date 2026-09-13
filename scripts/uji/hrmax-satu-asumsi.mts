import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hrMaxPerkiraan, hrMaxFromAge, hrMaksimum } from '../../src/lib/workoutImport.ts'
import { DEMO_DEFAULT } from '../../src/lib/profile.ts'

// Angka 30 itu tadinya tertulis DUA BELAS KALI di seluruh src, sebagai
// `demo.age || 30` atau `demo.age > 0 ? demo.age : 30`. Dua belas salinan
// sebuah asumsi berarti dua belas tempat yang bisa berubah sendiri-sendiri,
// dan tidak satu pun menjelaskan bahwa 30 bukan usia siapa pun.

// ── 1. Angkanya HARUS sama persis dengan salinan yang digantikan ───────────
//
// Ini syarat migrasinya: yang berpindah adalah tempat tinggal asumsinya,
// bukan nilai yang dilihat orang.
assert.equal(hrMaxPerkiraan({}), hrMaxFromAge(DEMO_DEFAULT.age, DEMO_DEFAULT.sex))
assert.equal(hrMaxPerkiraan({ age: 26, sex: 'M' }), hrMaxFromAge(26, 'M'))
assert.equal(hrMaxPerkiraan({ age: 41, sex: 'F' }), hrMaxFromAge(41, 'F'))
for (const buruk of [0, -1, Number.NaN, undefined]) {
  assert.equal(hrMaxPerkiraan({ age: buruk as number }), hrMaxFromAge(DEMO_DEFAULT.age, DEMO_DEFAULT.sex),
    `usia ${String(buruk)} harus jatuh ke nilai bawaan yang sama seperti sebelumnya`)
}
// Dan asalnya tetap bisa ditanyakan, itulah gunanya pindah ke sini.
assert.equal(hrMaksimum([], {}).asal, 'asumsi-usia')
assert.equal(hrMaksimum([], { age: 26, sex: 'M' }).asal, 'perkiraan-usia')

// ── 2. Polanya tidak boleh kembali ────────────────────────────────────────
function telusuri(dir: string): string[] {
  const keluar: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) keluar.push(...telusuri(p))
    else if (/\.tsx?$/.test(e.name)) keluar.push(p)
  }
  return keluar
}

const semua = telusuri('src')
assert.ok(semua.length > 300, `hanya ${semua.length} berkas terbaca; penelusurannya mungkin rusak`)

const pelanggar: string[] = []
for (const p of semua) {
  if (p.endsWith('lib/workoutImport.ts')) continue  // satu-satunya rumah sah asumsinya
  const isi = readFileSync(p, 'utf8')
  for (const baris of isi.split('\n')) {
    if (!/hrMaxFromAge\s*\(/.test(baris)) continue
    // Usia yang dijatuhkan diam-diam ke sebuah angka: `|| 30`, `?? 30`, `: 30`.
    if (/\|\|\s*\d+|\?\?\s*\d+|\?\s*[\w.]+\s*:\s*\d+/.test(baris)) {
      pelanggar.push(`${p.replace('src/', '')}: ${baris.trim().slice(0, 90)}`)
    }
  }
}
assert.deepEqual(pelanggar, [],
  'a silent numeric age fallback next to hrMaxFromAge puts the assumption back into the call site, ' +
  'where nothing explains that the number is nobody’s age:\n  ' + pelanggar.join('\n  '))

// ── 3. Pemanggil yang sudah dimigrasikan memakai jalur bersumber ──────────
const dimigrasikan = [
  'components/WidgetBeranda.tsx', 'components/PapanWidget.tsx', 'components/UbinRingHarian.tsx',
  'components/UbinLangsung.tsx', 'components/UbinLanjutan.tsx', 'components/digital-twin/Workout4DLab.tsx',
  'pages/BodyBattery.tsx', 'pages/AnalisisPro.tsx', 'pages/HeartRateLog.tsx', 'pages/PapanAtlet.tsx',
]
for (const rel of dimigrasikan) {
  const isi = readFileSync(join('src', rel), 'utf8')
  assert.match(isi, /hrMaxPerkiraan\(getDemoTersimpan\(\)\)/,
    `${rel}: must take the estimate from stored demographics, not from getDemo()'s blended defaults`)
}

console.log(
  `HRmax assumption: one home instead of ${dimigrasikan.length + 2}, identical numbers, provenance still askable, ` +
  'and a silent numeric age fallback beside hrMaxFromAge is now refused across src.',
)
