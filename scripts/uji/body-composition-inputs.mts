import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEF, PERLU_UBIN, VERSI_SIMPAN, bacaTersimpan, biometrikUntukDibagikan, kurangKomposisi, sahDiisi, serialisasi, terapkan, yangKurang,
} from '../../src/pages/bodyhub/bodyCompositionInputs.ts'

// Pengguna baru: tidak ada kolom diisi, jadi tidak ada hasil, tidak ada yang dibagikan, tidak ada yang disimpan.
const kosong = bacaTersimpan(null)
assert.equal(kosong.diisi.size, 0, 'a new user has filled nothing')
assert.deepEqual(biometrikUntukDibagikan(kosong), {}, 'nothing invented is shared with the Health Profile')
assert.deepEqual(serialisasi(kosong), { _v: VERSI_SIMPAN }, 'nothing but the version marker is stored')
assert.deepEqual(kurangKomposisi(kosong), ['weight', 'height', 'age', 'sex', 'waist', 'neck'], 'the score lists exactly what is missing')
for (const [ubin, perlu] of Object.entries(PERLU_UBIN)) assert.equal(yangKurang(kosong.diisi, perlu).length, perlu.length, `${ubin} shows nothing for a new user`)

// Format lama (semua kolom tersimpan): hanya nilai yang berbeda dari angka bawaan dipercaya.
const lamaPenuh = bacaTersimpan({ ...DEF })
assert.equal(lamaPenuh.diisi.size, 0, 'a legacy record that is all defaults carries no user input')
const lamaSebagian = bacaTersimpan({ ...DEF, w: 82.5, waist: 91, g: 'F' })
assert.deepEqual([...lamaSebagian.diisi].sort(), ['g', 'w', 'waist'])
assert.equal(lamaSebagian.b.w, 82.5); assert.equal(lamaSebagian.b.h, DEF.h, 'an unfilled field keeps its neutral default for the formulas only')

// Format baru: kunci yang ada = kolom yang diisi, termasuk nilai yang sama dengan angka bawaan (pengguna memang mengetiknya).
const baru = bacaTersimpan({ _v: VERSI_SIMPAN, w: 70, h: 170 })
assert.deepEqual([...baru.diisi].sort(), ['h', 'w'], 'a typed value equal to the default still counts in the new format')

// Pulang-pergi: yang disimpan hanya yang diisi.
const sesudahKetik = terapkan(terapkan(kosong, { w: 64, h: 168, age: 33, g: 'F' }), { waist: 76, neck: 32, hip: 98 })
assert.deepEqual(kurangKomposisi(sesudahKetik), [], 'with everything the score needs, nothing is missing')
const simpan = serialisasi(sesudahKetik)
assert.deepEqual(Object.keys(simpan).sort(), ['_v', 'age', 'g', 'h', 'hip', 'neck', 'w', 'waist'])
assert.deepEqual([...bacaTersimpan(simpan).diisi].sort(), [...sesudahKetik.diisi].sort(), 'what is stored reads back as exactly the same filled set')
assert.deepEqual(biometrikUntukDibagikan(sesudahKetik), { weightKg: 64 }, 'only the filled biometric is shared')

// Sumber lemak: massa lemak InBody menggantikan lingkar; pinggul hanya dituntut untuk perempuan.
const pria = terapkan(kosong, { w: 80, h: 180, age: 40, g: 'M', waist: 90, neck: 40 })
assert.deepEqual(kurangKomposisi(pria), [], 'men do not need a hip measurement')
assert.deepEqual(kurangKomposisi(terapkan(pria, { g: 'F' })), ['hip'], 'women do')
assert.deepEqual(kurangKomposisi(terapkan(kosong, { w: 80, h: 180, age: 40, g: 'M', bfm: 18 })), [], 'InBody fat mass replaces the tape measurements')

// Mengosongkan kolom mencabut statusnya dan mengembalikan angka netral.
const dikosongkan = terapkan(sesudahKetik, { w: undefined })
assert.equal(dikosongkan.diisi.has('w'), false); assert.equal(dikosongkan.b.w, DEF.w)
assert.ok(kurangKomposisi(dikosongkan).includes('weight'), 'clearing a field takes the score away again')

// Nol: 0 sah untuk stres/anxietas/mood (tidak stres), tetapi 0 berat badan atau HRV adalah kosong.
assert.equal(sahDiisi('stress', 0), true); assert.equal(sahDiisi('w', 0), false); assert.equal(sahDiisi('hrv', 0), false)
assert.equal(sahDiisi('bmd', -1.5), true, 'a negative T-score is a real measurement'); assert.equal(sahDiisi('bmd', 0), false)

// Data simpanan rusak atau bermusuhan tidak melempar dan tidak menandai apa pun sebagai diisi.
for (const rusak of ['x', 5, true, [], [1, 2], { w: 'berat' }, { w: NaN }, { w: Infinity }, { w: -3 }, { g: 'X' }, { caffeineCutoff: '25:99' }, JSON.parse('{"__proto__":{"w":99},"constructor":{"w":99}}')]) {
  const s = bacaTersimpan(rusak)
  assert.equal(s.diisi.size, 0, `untrusted stored data ${JSON.stringify(rusak)} fills nothing`)
  assert.equal(s.b.w, DEF.w)
}
assert.equal(({} as Record<string, unknown>).w, undefined, 'the prototype was not polluted')
// Properti warisan (bukan milik sendiri) tidak dipercaya, walau JSON.parse tidak pernah menghasilkannya.
assert.equal(bacaTersimpan(Object.create({ w: 99, _v: VERSI_SIMPAN })).diisi.size, 0, 'inherited properties fill nothing')
// Kunci asing pada patch diabaikan.
assert.equal(terapkan(kosong, { constructor: 5, nope: 1 } as never).diisi.size, 0)
// Regresi halaman: tidak lagi menyimpan atau membagikan angka bawaan, dan hasil menunggu masukannya.
const hal = readFileSync(new URL('../../src/pages/bodyhub/BodyComposition.tsx', import.meta.url), 'utf8')
assert.ok(!/JSON\.stringify\(b\)/.test(hal), 'the page no longer stores the whole default-filled state')
assert.ok(hal.includes('serialisasi(masukan)'), 'the page stores only the filled fields')
assert.ok(!/pushBiometrics\(\{ vo2max: b\.vo2/.test(hal), 'the page no longer pushes default biometrics to the shared Health Profile')
assert.ok(hal.includes('pushBiometrics(biometrikUntukDibagikan(masukan))'), 'the page shares only filled biometrics')
assert.ok(hal.includes('kurangKomposisi(masukan)') && hal.includes('kurangSkor.length === 0'), 'the score and body type wait for their inputs')
assert.match(hal, /\{kurangSkor\.length === 0 \? \(\s*<>\s*<div className="text-4xl font-extrabold text-brand-dark">\{d\.score\}/, 'the headline score is rendered only when nothing is missing')
assert.match(hal, /\{kurangUbin\('mental'\)\.length === 0 && \(/, 'the mental quick screen is rendered only when stress, anxiety and mood are filled')
assert.match(hal, /kurangSkor\.length === 0\s*\? <BodyTypeGrid/, 'the body type grid is rendered only when nothing is missing')
assert.ok(hal.includes("High anxiety/stress score or low mood"), 'the high-risk message is still present for real input')
assert.ok(!hal.includes("value={b.g} onChange"), 'the sex select no longer shows an unchosen default as chosen')

console.log('body-composition-inputs: a new user has nothing filled or shared; only typed values are stored, read back and used; legacy defaults are not trusted; hostile data fills nothing; passed')
