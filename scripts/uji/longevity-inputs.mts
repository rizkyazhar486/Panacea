import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DEF, bacaIsi, hitungSkor, pillarsOf, tandai } from '../../src/pages/bodyhub/longevityScoring.ts'

const skorPilar = (d: typeof DEF, isi: Parameters<typeof pillarsOf>[1], id: string) => pillarsOf(d, isi).find((p) => p.id === id)!.score

// Pengguna baru: tidak ada yang diisi, jadi tidak ada skor dan jelas apa yang kurang.
assert.deepEqual(bacaIsi(null), {})
assert.deepEqual(hitungSkor(DEF, {}), { score: null, bAge: null, kurang: ['age', 'sex'] })

// Regresi dari peramban nyata: dua pilar sungguhan (VO2max 45, detak istirahat 58) + angka bawaan memberi skor 82
// dan "usia biologis 27,5, 2,5 tahun lebih muda" dari usia 30 yang tak pernah diketik. Sekarang tidak ada skor.
const duaPilar = { ...DEF, vo2: 45, rhr: 58 }
assert.equal(hitungSkor(duaPilar, {}).score, null, 'two real pillars plus defaults give no score')
assert.equal(hitungSkor(duaPilar, { age: true, g: true }).score, null, 'two pillars are still not enough even with age and sex')
assert.equal(skorPilar(duaPilar, {}, 'sleep'), 0, 'the default 7 h sleep is not a filled pillar')
assert.equal(skorPilar(duaPilar, {}, 'life'), 0, 'the default lifestyle answers are not a filled pillar')
assert.ok(skorPilar(DEF, {}, 'sleep') === 0 && skorPilar(DEF, {}, 'life') === 0)

// Pilar bernorma usia/jenis kelamin tidak dinilai dengan norma bawaan; yang tak bergantung usia tetap dinilai.
for (const id of ['vo2', 'grip', 'chair', 'whr']) assert.equal(skorPilar({ ...DEF, vo2: 45, grip: 40, chair30: 20, whr: 0.85 }, {}, id), 0, `${id} needs age and sex`)
assert.ok(skorPilar({ ...DEF, vo2: 45 }, { age: true, g: true }, 'vo2') > 0, 'with age and sex the pillar is scored')
assert.ok(skorPilar({ ...DEF, rhr: 58, balance: 20 }, {}, 'rhr') > 0 && skorPilar({ ...DEF, balance: 20 }, {}, 'bal') > 0, 'age-independent pillars are scored from the measurement alone')
assert.equal(skorPilar({ ...DEF, whr: 0.85 }, { age: true }, 'whr'), 0, 'waist-hip ratio also needs sex')

// Merokok dan alkohol keduanya harus dijawab agar pilar gaya hidup dihitung.
assert.equal(skorPilar(DEF, { smoke: true }, 'life'), 0)
assert.equal(skorPilar(DEF, { alcohol: true }, 'life'), 0)
assert.ok(skorPilar(DEF, { smoke: true, alcohol: true }, 'life') > 0)
assert.equal(skorPilar({ ...DEF, sleepH: 7 }, { sleepH: true }, 'sleep') > 0, true, 'a typed 7 h counts once the user typed it')
assert.deepEqual(tandai({}, { sleepH: 0 }), { sleepH: true }, 'explicit zero sleep remains an answered measurement')
assert.deepEqual(bacaIsi({ sleepH: 0, isi: { sleepH: true } }), { sleepH: true }, 'zero sleep survives storage reload')
assert.equal(skorPilar({ ...DEF, sleepH: 0 }, { sleepH: true }, 'sleep'), 0, 'the existing zero-sleep score is preserved')

// Skor muncul bila ada >= 4 pilar nyata DAN usia + jenis kelamin nyata.
const empat = { ...DEF, vo2: 45, rhr: 58, grip: 40, chair30: 20 }
assert.equal(hitungSkor(empat, { age: true, g: true }).score != null, true, 'four real pillars with age and sex give a score')
assert.equal(hitungSkor(empat, { g: true }).score, null); assert.deepEqual(hitungSkor(empat, { g: true }).kurang, ['age'])
assert.equal(hitungSkor(empat, { age: true }).score, null); assert.deepEqual(hitungSkor(empat, { age: true }).kurang, ['sex'])
// Empat pilar yang tak bergantung usia (detak istirahat, keseimbangan, tidur, gaya hidup) belum cukup tanpa usia dan jenis kelamin nyata.
const tanpaNorma = { ...DEF, rhr: 58, balance: 20, sleepH: 7.5 }
const isiTanpaNorma = { sleepH: true, smoke: true, alcohol: true } as const
assert.equal(pillarsOf(tanpaNorma, isiTanpaNorma).filter((p) => p.score > 0).length, 4, 'fixture: four real, age-independent pillars')
assert.deepEqual(hitungSkor(tanpaNorma, isiTanpaNorma), { score: null, bAge: null, kurang: ['age', 'sex'] }, 'no score and no biological age without a real age and sex')
assert.equal(hitungSkor(tanpaNorma, { ...isiTanpaNorma, age: true, g: true }).score != null, true, 'with age and sex the same four pillars score')
const tigaNyata = { ...DEF, vo2: 45, rhr: 58, sleepH: 7.5, age: 41, g: 'F' as const }
const isiTiga = { age: true, g: true, sleepH: true } as const
assert.equal(hitungSkor(tigaNyata, isiTiga).score, null, 'sleep typed by the user is the third pillar, still not enough')
const empatNyata = hitungSkor({ ...tigaNyata, balance: 20 }, isiTiga)
assert.equal(empatNyata.score != null && empatNyata.bAge != null, true, 'a fourth real pillar activates the score')
assert.deepEqual(empatNyata, hitungSkor({ ...tigaNyata, balance: 20 }, isiTiga), 'deterministic')

// Format lama (tanpa penanda): hanya nilai yang berbeda dari bawaan dipercaya.
assert.deepEqual(bacaIsi({ ...DEF }), {}, 'a legacy record of pure defaults fills nothing')
assert.deepEqual(Object.keys(bacaIsi({ ...DEF, age: 45, g: 'F', smoke: 'former', alcohol: 2, sleepH: 6 })).sort(), ['age', 'alcohol', 'g', 'sleepH', 'smoke'])
// Format baru: penanda dipercaya, termasuk nilai yang sama dengan bawaan, tetapi hanya bila nilainya sah.
assert.deepEqual(Object.keys(bacaIsi({ ...DEF, isi: { age: true, sleepH: true } })).sort(), ['age', 'sleepH'])
assert.deepEqual(bacaIsi({ ...DEF, age: 'x', isi: { age: true } }), {}, 'a flag on an invalid value is ignored')
assert.deepEqual(bacaIsi({ ...DEF, isi: { age: 'ya', g: 1 } }), {}, 'only strict true counts')

// tandai: nilai sah menandai, kosong/tak sah mencabut, kunci asing diabaikan.
assert.deepEqual(tandai({}, { age: 40, g: 'M', sleepH: 6.5, smoke: 'never', alcohol: 0 }), { age: true, g: true, sleepH: true, smoke: true, alcohol: true }, 'a typed 0 for alcohol (none) is an answer')
assert.deepEqual(tandai({ age: true, g: true }, { age: undefined }), { g: true }, 'clearing a field removes its flag')
assert.deepEqual(tandai({ age: true }, { age: 0 }), {}); assert.deepEqual(tandai({}, { age: -3, g: 'X', sleepH: NaN }), {})
assert.deepEqual(tandai({}, { nope: 1, constructor: 5 } as never), {})

// Data simpanan rusak atau bermusuhan tidak melempar dan tidak mengisi apa pun.
for (const rusak of ['x', 5, true, [], [1], { isi: [] }, { isi: 'age' }]) assert.deepEqual(bacaIsi(rusak), {}, `untrusted ${JSON.stringify(rusak)} fills nothing`)
assert.deepEqual(bacaIsi(Object.create({ isi: { age: true }, age: 40 })), {}, 'inherited properties are not trusted')
// Kunci __proto__ dari JSON hanyalah properti biasa: tidak memalsukan penanda dan tidak mencemari prototipe; usia 40 sahnya tetap dihitung.
assert.deepEqual(bacaIsi(JSON.parse('{"__proto__":{"isi":{"g":true}},"age":40}')), { age: true })
assert.equal(({} as Record<string, unknown>).isi, undefined, 'the prototype was not polluted')

// Regresi halaman: tidak menyimpan/membagikan angka bawaan, dan skor menunggu usia + jenis kelamin.
const hal = readFileSync(new URL('../../src/pages/bodyhub/Longevity.tsx', import.meta.url), 'utf8')
assert.ok(hal.includes('JSON.stringify({ ...d, isi })'), 'the stored record carries the filled-flags')
assert.ok(!/pushBiometrics\(\{ vo2max: d\.vo2, restingHr: d\.rhr, sleepH: d\.sleepH \}\)/.test(hal), 'the page no longer shares the default 7 h sleep with the Health Profile')
assert.ok(hal.includes('sleepH: isi.sleepH ? d.sleepH : undefined'), 'only typed sleep is shared')
assert.ok(hal.includes("value={isi.g ? d.g : ''}"), 'sex starts unselected')
assert.ok(hal.includes('nilai={isi.age ? d.age : undefined}'), 'age starts blank')
assert.ok(!/type="number" value=\{d\.age\}/.test(hal), 'the age field no longer shows the default as typed')
assert.ok(hal.includes('usia={isi.age && isi.g ? d.age : 0}'), 'the evidence panel does not compare against an invented age')
assert.ok(hal.includes("{isi.age ? d.age : '—'}"), 'chronological age is not printed from the default')
assert.ok(hal.includes("value={isi.smoke ? d.smoke : ''}") && hal.includes("value={isi.alcohol ? d.alcohol : ''}"), 'smoking and alcohol start unanswered')
assert.ok(hal.includes('const vo2Proj60 = isi.age &&'), 'projections need a real age')
console.log('longevity-inputs: no score from defaults or from two pillars; age, sex, sleep and lifestyle count only when entered; legacy defaults not trusted; hostile data fills nothing; passed')
