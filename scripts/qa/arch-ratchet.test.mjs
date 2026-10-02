import test from 'node:test'; import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { detectImpure, evaluate, stripComments, scanRepo, BASELINE_PATH, IMPURE_PATTERNS } from '../arch/ratchet.mjs'

const kosong = () => ({ flatLib: [], flatServer: [], impure: Object.fromEntries(Object.keys(IMPURE_PATTERNS).map((k) => [k, []])) })

// positif: tiap pola terdeteksi
test('positif: mendeteksi Date.now', () => assert.deepEqual(detectImpure('const t = Date.now()'), ['Date.now']))
test('positif: mendeteksi new Date() tanpa argumen', () => assert.deepEqual(detectImpure('const d = new Date()'), ['new Date()']))
test('positif: mendeteksi Math.random', () => assert.deepEqual(detectImpure('x = Math.random() * 2'), ['Math.random']))
test('positif: mendeteksi fetch langsung', () => assert.deepEqual(detectImpure('await fetch(url)'), ['fetch']))
test('positif: mendeteksi window dan document', () => assert.deepEqual(detectImpure('window.innerWidth; document.title'), ['window', 'document']))
test('positif: kode murni tidak terdeteksi', () => assert.deepEqual(detectImpure('export const f = (now: Date) => now.getTime()'), []))

// negatif / false positive: bukan pelanggaran
test('negatif: kata "window." di akhir kalimat dalam string bukan akses DOM', () =>
  assert.deepEqual(detectImpure("const s = 'in a bounded remodeling window.'; const d = 'see the document.'"), []))
test('positif: window.<pengenal> tetap terdeteksi walau di tengah ekspresi', () =>
  assert.deepEqual(detectImpure('const w = window.innerWidth'), ['window']))
test('negatif: new Date(argumen) bukan jam sistem', () => assert.deepEqual(detectImpure('new Date(2026, 8, 29)'), []))
test('negatif: method .fetch( bukan fetch global', () => assert.deepEqual(detectImpure('repo.fetch(id)'), []))
test('negatif: identifier berakhiran window bukan window global', () => assert.deepEqual(detectImpure('myWindow.size; subdocument.x'), []))
test('negatif: kata di komentar baris dan blok tidak dihitung', () =>
  assert.deepEqual(detectImpure('// Date.now() jangan\n/* window.x */\nconst a = 1'), []))
test('negatif: URL di string tidak memakan kode setelahnya', () =>
  assert.deepEqual(detectImpure("const u = 'https://a.b'; Date.now()"), ['Date.now']))
test('batas: stripComments mempertahankan kode di baris yang sama sebelum //', () =>
  assert.match(stripComments('const a = Date.now() // jam'), /Date\.now\(\)/))

// evaluate: ratchet
test('positif: keadaan sama dengan baseline lolos tanpa temuan', () => {
  const b = { ...kosong(), flatLib: ['a.ts'] }
  assert.deepEqual(evaluate(structuredClone(b), b), { ok: true, baru: [], usang: [] })
})
test('negatif: berkas lib datar baru ditolak dan disebut namanya', () => {
  const b = { ...kosong(), flatLib: ['a.ts'] }
  const hasil = evaluate({ ...b, flatLib: ['a.ts', 'baru.ts'] }, b)
  assert.equal(hasil.ok, false)
  assert.deepEqual(hasil.baru, ['flatLib: baru.ts'])
})
test('negatif: berkas server datar baru ditolak', () => {
  const hasil = evaluate({ ...kosong(), flatServer: ['x.ts'] }, kosong())
  assert.deepEqual(hasil.baru, ['flatServer: x.ts'])
})
test('negatif: pola tak-murni di berkas baru ditolak', () => {
  const sekarang = kosong(); sekarang.impure['Date.now'] = ['domains/a/engine.ts']
  const hasil = evaluate(sekarang, kosong())
  assert.equal(hasil.ok, false)
  assert.deepEqual(hasil.baru, ['impure[Date.now]: domains/a/engine.ts'])
})
test('negatif: berkas lama yang memakai pola BARU ditolak', () => {
  const base = kosong(); base.impure['Date.now'] = ['a.ts']
  const sekarang = structuredClone(base); sekarang.impure.fetch = ['a.ts']
  assert.deepEqual(evaluate(sekarang, base).baru, ['impure[fetch]: a.ts'])
})
// pasangan: hanya beda pada satu berkas
test('batas: baseline yang sama lolos, ditambah satu berkas gagal', () => {
  const base = { ...kosong(), flatLib: ['a.ts'] }
  assert.equal(evaluate(structuredClone(base), base).ok, true)
  assert.equal(evaluate({ ...base, flatLib: ['a.ts', 'b.ts'] }, base).ok, false)
})
test('batas: entri usang (sudah dibersihkan) tidak menggagalkan tapi dilaporkan', () => {
  const base = { ...kosong(), flatLib: ['a.ts', 'b.ts'] }
  const hasil = evaluate({ ...base, flatLib: ['a.ts'] }, base)
  assert.equal(hasil.ok, true)
  assert.deepEqual(hasil.usang, ['flatLib: b.ts'])
})
test('negatif: baseline tanpa kunci impure memperlakukan semua pelanggaran sebagai baru', () => {
  const sekarang = kosong(); sekarang.impure.window = ['x.ts']
  assert.equal(evaluate(sekarang, { flatLib: [], flatServer: [] }).ok, false)
})
test('determinisme: dua evaluasi identik', () => {
  const s = { ...kosong(), flatLib: ['b.ts', 'a.ts'] }
  assert.deepEqual(evaluate(s, kosong()), evaluate(s, kosong()))
})

// integrasi: repo nyata tidak melanggar baseline yang tercatat
test('positif: repo saat ini tidak punya pelanggaran di luar baseline', () => {
  const hasil = evaluate(scanRepo(), JSON.parse(readFileSync(BASELINE_PATH, 'utf8')))
  assert.deepEqual(hasil.baru, [])
})
