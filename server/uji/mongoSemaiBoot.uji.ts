// Restart tidak mengirim ulang isi Mongo yang terbukti sudah sama. Setiap kasus hemat berpasangan dengan kasus yang
// membuktikan data yang berbeda/yatim tetap ditulis/dihapus: menghemat tidak boleh berarti melewatkan tulis.
import assert from 'node:assert/strict'
import {
  simpanIrisan, muatIrisan, pasangIrisan, semaiSidikTulis, semaiSidikInti, kanonLengkap, KOLEKSI_IRISAN, type DbIrisan, type KoleksiIrisan,
} from '../src/irisanPenyimpanan.js'

type Kolom = Map<string, Map<string, Record<string, unknown>>>
/** Objek DB baru di atas data Mongo yang SAMA: meniru proses yang restart (cache tulis per-objek mulai kosong). */
function dbDi(kolom: Kolom) {
  const log = { dokumenDikirim: 0, hapus: 0 }
  const ambil = (n: string) => { let p = kolom.get(n); if (!p) { p = new Map(); kolom.set(n, p) } return p }
  const db: DbIrisan = {
    collection(nama: string): KoleksiIrisan {
      const p = ambil(nama)
      return {
        async bulkWrite(ops: any[]) { for (const op of ops) { log.dokumenDikirim++; p.set(String(op.updateOne.filter._id), { _id: String(op.updateOne.filter._id), ...op.updateOne.update.$set }) } },
        async deleteMany(f: any) { log.hapus++; const nin: string[] = f?._id?.$nin ?? []; for (const id of [...p.keys()]) if (!nin.includes(id)) p.delete(id) },
        find() { return { async toArray() { return [...p.values()].map((d) => structuredClone(d)) } } },
        async createIndex() { return 'ok' },
      }
    },
  }
  return { db, log }
}
const keadaan = (): Record<string, unknown> => ({
  hrSeries: { 'a@x.id': { sampel: [[1, 60], [2, 61]] } },
  posts: [{ id: 'p1', teks: 'satu' }, { id: 'p2', teks: 'dua' }],
})
const WAKTU = new Date('2026-10-31T00:00:00.000Z')

/** Proses pertama menulis; "restart" = objek DB baru, muat, pasang ke keadaan kosong (seperti store.ts). */
async function mulaiRestart(ubahMongo?: (k: Kolom) => void) {
  const kolom: Kolom = new Map()
  const pertama = dbDi(kolom)
  await simpanIrisan(pertama.db, keadaan(), WAKTU)
  const primaDikirim = pertama.log.dokumenDikirim
  ubahMongo?.(kolom)
  const baru = dbDi(kolom)
  const irisan = await muatIrisan(baru.db)
  assert.ok(irisan, 'irisan harus termuat')
  const state: Record<string, unknown> = {}
  pasangIrisan(state, irisan!.data)
  return { kolom, ...baru, state, primaDikirim }
}

// 1. positif: setelah restart + semai, simpan keadaan yang sama tidak mengirim satu dokumen pun
{
  const r = await mulaiRestart()
  const hasil = semaiSidikTulis(r.db, r.state, true)
  assert.ok(hasil.dokumen > 0 && hasil.koleksi > 0, 'harus ada dokumen yang disemai')
  await simpanIrisan(r.db, r.state, WAKTU)
  assert.equal(r.log.dokumenDikirim, 0, 'restart + keadaan sama: nol dokumen terkirim')
  assert.equal(r.log.hapus, 0, 'tidak ada yatim -> tidak ada deleteMany')
}

// 2. pasangan negatif: tanpa semai, restart mengirim ulang semuanya (membuktikan semai-lah yang menghemat)
{
  const r = await mulaiRestart()
  await simpanIrisan(r.db, r.state, WAKTU)
  assert.ok(r.primaDikirim > 0)
  assert.equal(r.log.dokumenDikirim, r.primaDikirim, 'tanpa semai restart mengirim ulang persis sebanyak penulisan pertama')
}

// 3. pasangan negatif: boleh=false (irisan tidak lengkap) tidak menyemai apa pun
{
  const r = await mulaiRestart()
  assert.deepEqual(semaiSidikTulis(r.db, r.state, false), { koleksi: 0, dokumen: 0 })
  await simpanIrisan(r.db, r.state, WAKTU)
  assert.equal(r.log.dokumenDikirim, r.primaDikirim, 'tanpa izin semai, semua dikirim ulang')
}

// 4. satu dokumen berubah setelah dimuat: hanya dokumen itu terkirim dan nilai barunya sampai ke Mongo
{
  const r = await mulaiRestart()
  semaiSidikTulis(r.db, r.state, true)
  const posts = r.state.posts as { id: string; teks: string }[]
  posts.find((p) => p.id === 'p2')!.teks = 'DUA-BERUBAH'
  const sebelum = r.log.dokumenDikirim
  await simpanIrisan(r.db, r.state, WAKTU)
  assert.equal(r.log.dokumenDikirim - sebelum, 1, 'tepat satu dokumen terkirim')
  assert.equal([...r.kolom.get(KOLEKSI_IRISAN.posts)!.values()].find((d) => d.teks === 'DUA-BERUBAH') !== undefined, true, 'nilai baru ada di Mongo')
}

// 5. dokumen di Mongo BEDA dari yang akan ditulis (urutan tersimpan lain; urutan relatif sama sehingga keadaan termuat sama):
// tidak disemai, jadi ditulis ulang dan Mongo kembali sama dengan keadaan
{
  const r = await mulaiRestart((k) => { const p = k.get(KOLEKSI_IRISAN.posts)!; p.get('p1')!.urutan = 7; p.get('p2')!.urutan = 8 })
  semaiSidikTulis(r.db, r.state, true)
  const sebelum = r.log.dokumenDikirim
  await simpanIrisan(r.db, r.state, WAKTU)
  assert.equal(r.log.dokumenDikirim - sebelum, 2, 'kedua dokumen yang berbeda dikirim ulang, yang sama dilewati')
  assert.deepEqual([...r.kolom.get(KOLEKSI_IRISAN.posts)!.values()].map((d) => d.urutan).sort(), [0, 1], 'Mongo kembali sama dengan keadaan')
}

// 5b. pasangan: dokumen yang terbukti sama tetap dilewati walau berdampingan dengan yang berbeda
{
  const r = await mulaiRestart((k) => { k.get(KOLEKSI_IRISAN.posts)!.get('p2')!.urutan = 9 })
  semaiSidikTulis(r.db, r.state, true)
  const sebelum = r.log.dokumenDikirim
  await simpanIrisan(r.db, r.state, WAKTU)
  assert.equal(r.log.dokumenDikirim - sebelum, 1, 'hanya dokumen yang berbeda yang dikirim')
}

// 6. yatim di Mongo (id tidak ada di keadaan): disemai sebagai yatim sehingga simpan pertama MENGHAPUSNYA
{
  const kolom: Kolom = new Map()
  await simpanIrisan(dbDi(kolom).db, keadaan(), WAKTU)
  kolom.get(KOLEKSI_IRISAN.posts)!.set('p3', { _id: 'p3', id: 'p3', teks: 'yatim', urutan: 9 })
  const baru = dbDi(kolom)
  const irisan = await muatIrisan(baru.db)
  const state: Record<string, unknown> = { posts: [{ id: 'p1', teks: 'satu' }, { id: 'p2', teks: 'dua' }], hrSeries: keadaan().hrSeries }
  void irisan
  semaiSidikTulis(baru.db, state, true)
  await simpanIrisan(baru.db, state, WAKTU)
  assert.ok(baru.log.hapus >= 1, 'yatim harus memicu deleteMany')
  assert.equal(kolom.get(KOLEKSI_IRISAN.posts)!.has('p3'), false, 'dokumen yatim terhapus dari Mongo')
}

// 7. bacaan dilepas setelah satu pemakaian: pemanggilan kedua tidak menyemai ulang dari data basi
{
  const r = await mulaiRestart()
  assert.ok(semaiSidikTulis(r.db, r.state, true).dokumen > 0)
  assert.deepEqual(semaiSidikTulis(r.db, r.state, true), { koleksi: 0, dokumen: 0 })
}

// 8. tanpa muat sebelumnya tidak ada bacaan: tidak menyemai (tidak pernah mengira Mongo sudah berisi)
{
  const baru = dbDi(new Map())
  assert.deepEqual(semaiSidikTulis(baru.db, keadaan(), true), { koleksi: 0, dokumen: 0 })
}

// 9. dokumen inti: disemai hanya dengan bukti identik; sidik sama dengan yang dihitung simpanMongo
{
  const inti = { connect: { garam: 'g' }, profil: { a: 1 } }
  const jejak = kanonLengkap({ profil: { a: 1 }, connect: { garam: 'g' } }) // urutan kunci beda, isi sama
  const hasil = semaiSidikInti(jejak, inti, true)
  assert.match(hasil ?? '', /^[0-9a-f]{64}$/, 'inti identik (urutan kunci tak berpengaruh) disemai')
  const { createHash } = await import('node:crypto')
  assert.equal(hasil, createHash('sha256').update(JSON.stringify(inti)).digest('hex'), 'sidik setara dengan perhitungan simpanMongo')
  // pasangan negatif: tepat satu syarat berbeda tiap kasus
  assert.equal(semaiSidikInti(jejak, { ...inti, profil: { a: 2 } }, true), null, 'isi berbeda -> tidak disemai')
  assert.equal(semaiSidikInti(jejak, { ...inti, ekstra: 1 }, true), null, 'kunci tambahan -> tidak disemai')
  assert.equal(semaiSidikInti(jejak, inti, false), null, 'irisan tidak lengkap -> tidak disemai')
  assert.equal(semaiSidikInti(null, inti, true), null, 'versi/dokumen tersimpan tidak sah -> tidak disemai')
}
console.log('mongoSemaiBoot: lulus')
