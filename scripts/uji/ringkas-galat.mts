import assert from 'node:assert/strict'
import { ringkasGalat, MAKS_PESAN_GALAT, MAKS_RUTE_GALAT } from '../../src/shared/kernel/ringkasGalat.ts'

// Positif: Error biasa memberi "Nama: pesan" dan rute tanpa '#'.
assert.deepEqual(ringkasGalat(new TypeError('x is undefined'), '#/harian'), { pesan: 'TypeError: x is undefined', rute: '/harian' })
// Positif: string dilempar langsung.
assert.deepEqual(ringkasGalat('boom', '/emr'), { pesan: 'boom', rute: '/emr' })

// Negatif: nilai bukan Error tidak melempar dan tidak menghasilkan teks kosong.
for (const nilai of [null, undefined, '', '   ', 0, false]) {
  const r = ringkasGalat(nilai, '#/')
  assert.ok(r.pesan.length > 0, `pesan kosong untuk ${String(nilai)}`)
}
assert.equal(ringkasGalat(null, '#/').pesan, 'unknown error')
assert.equal(ringkasGalat(undefined, '#/').pesan, 'unknown error')
assert.equal(ringkasGalat('   ', '#/').pesan, 'unknown error')
// Negatif: objek yang toString-nya melempar tidak menjatuhkan layar galat.
const berbahaya = { toString() { throw new Error('jangan') } }
assert.equal(ringkasGalat(berbahaya, '#/').pesan, 'unknown error')
// Negatif: Symbol (String(Symbol()) valid tapi tidak boleh melempar) dan rute bukan string.
assert.equal(typeof ringkasGalat(Symbol('s'), '#/').pesan, 'string')
for (const rute of [undefined, null, 5, {}, []]) assert.equal(ringkasGalat(new Error('e'), rute).rute, '/')

// Batas: tepat MAKS tidak dipotong, MAKS+1 dipotong ke MAKS.
assert.equal(ringkasGalat('a'.repeat(MAKS_PESAN_GALAT), '#/').pesan.length, MAKS_PESAN_GALAT)
assert.equal(ringkasGalat('a'.repeat(MAKS_PESAN_GALAT + 1), '#/').pesan.length, MAKS_PESAN_GALAT)
assert.equal(ringkasGalat('e', '#/' + 'r'.repeat(MAKS_RUTE_GALAT)).rute.length, MAKS_RUTE_GALAT)

// Privasi: query dan fragmen parameter dibuang dari rute; karakter kontrol/baris baru dipadatkan.
assert.equal(ringkasGalat('e', '#/emr?patient=123&nama=Budi').rute, '/emr')
assert.equal(ringkasGalat('baris1\nbaris2\t\u0007x', '#/').pesan, 'baris1 baris2 x')
// Berpasangan: hanya query yang berbeda -> rute yang sama (aturan itu yang membuang query).
assert.equal(ringkasGalat('e', '#/emr').rute, ringkasGalat('e', '#/emr?x=1').rute)

// Determinisme.
assert.deepEqual(ringkasGalat(new Error('d'), '#/a?b'), ringkasGalat(new Error('d'), '#/a?b'))
console.log('ringkas-galat: positif, negatif tanpa melempar, batas 200/120, privasi rute, determinisme; passed')
