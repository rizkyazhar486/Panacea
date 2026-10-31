// Simpan Mongo hanya mengirim yang berubah (hemat bandwidth keluar). Setiap aturan punya pasangan negatif
// yang membuktikan data yang BERUBAH tetap sampai ke Mongo — hemat tidak boleh berarti kehilangan tulis.
import assert from 'node:assert/strict'
import {
  simpanIrisan, muatIrisan, statistikTulisIrisan, setelUlangStatistikTulisIrisan, KOLEKSI_IRISAN, type DbIrisan, type KoleksiIrisan,
} from '../src/irisanPenyimpanan.js'

function dbHitung(opsi: { gagalBulkKe?: number } = {}) {
  const kontrol = { gagalSekarang: false }
  const kolom = new Map<string, Map<string, Record<string, unknown>>>()
  const log = { bulk: 0, hapus: 0, dokumenDikirim: 0 }
  let bulkKe = 0
  const ambil = (n: string) => { let p = kolom.get(n); if (!p) { p = new Map(); kolom.set(n, p) } return p }
  const db: DbIrisan = {
    collection(nama: string): KoleksiIrisan {
      const p = ambil(nama)
      return {
        async bulkWrite(ops: any[]) {
          bulkKe += 1
          log.bulk += 1
          if (opsi.gagalBulkKe === bulkKe || kontrol.gagalSekarang) throw new Error('putus')
          for (const op of ops) { log.dokumenDikirim += 1; p.set(String(op.updateOne.filter._id), { _id: String(op.updateOne.filter._id), ...op.updateOne.update.$set }) }
        },
        async deleteMany(f: any) { log.hapus += 1; const nin: string[] = f?._id?.$nin ?? []; for (const id of [...p.keys()]) if (!nin.includes(id)) p.delete(id) },
        find() { return { async toArray() { return [...p.values()].map((d) => ({ ...d })) } } },
        async createIndex() { return 'ok' },
      }
    },
  }
  return { db, log, kontrol, isi: (n: string) => [...ambil(n).values()] }
}

const keadaan = (): Record<string, unknown> => ({
  hrSeries: { 'a@x.id': { sampel: [[1, 60], [2, 61]] } },
  posts: [{ id: 'p1', teks: 'satu' }, { id: 'p2', teks: 'dua' }],
})
const WAKTU = new Date('2026-10-31T00:00:00.000Z')

// 1. positif: simpan pertama menulis semuanya, simpan identik kedua tidak mengirim dokumen sama sekali
{
  const h = dbHitung()
  setelUlangStatistikTulisIrisan()
  await simpanIrisan(h.db, keadaan(), WAKTU)
  const pertama = h.log.dokumenDikirim
  assert.ok(pertama > 0, 'simpan pertama harus menulis')
  await simpanIrisan(h.db, keadaan(), new Date('2026-10-31T01:00:00.000Z'))
  assert.equal(h.log.dokumenDikirim, pertama, 'simpan identik tidak boleh mengirim dokumen lagi (termasuk penanda versi berbeda cap waktu)')
  assert.equal(statistikTulisIrisan.dokumenDitulis, pertama)
  assert.ok(statistikTulisIrisan.dokumenDilewati >= pertama, 'dokumen yang dilewati harus terhitung')
}

// 2. negatif berpasangan: satu dokumen berubah -> tepat satu dokumen terkirim dan nilai baru ada di Mongo
{
  const h = dbHitung()
  await simpanIrisan(h.db, keadaan(), WAKTU)
  const sebelum = h.log.dokumenDikirim
  const baru = keadaan(); (baru.posts as any[])[1].teks = 'DUA-BERUBAH'
  await simpanIrisan(h.db, baru, WAKTU)
  assert.equal(h.log.dokumenDikirim - sebelum, 1, 'hanya dokumen yang berubah yang dikirim')
  const dimuat = await muatIrisan(h.db)
  assert.deepEqual((dimuat!.data.posts as any[]).map((p) => p.teks).sort(), ['DUA-BERUBAH', 'satu'])
}

// 3. dokumen dihapus: yatim harus dihapus dari Mongo (hapus tidak dilewati); tanpa penghapusan tidak ada deleteMany berulang
{
  const h = dbHitung()
  await simpanIrisan(h.db, keadaan(), WAKTU)
  const hapus0 = h.log.hapus
  await simpanIrisan(h.db, keadaan(), WAKTU)
  assert.equal(h.log.hapus, hapus0, 'tanpa perubahan himpunan id, tidak ada deleteMany')
  const susut = keadaan(); susut.posts = [(susut.posts as any[])[0]]
  await simpanIrisan(h.db, susut, WAKTU)
  assert.ok(h.log.hapus > hapus0, 'id yang hilang harus memicu deleteMany')
  assert.deepEqual(h.isi(KOLEKSI_IRISAN.posts).map((d) => d._id).sort(), ['p1'], 'dokumen yatim masih ada di Mongo')
}

// 4. kegagalan tulis: percobaan berikutnya mengirim ulang (cache tidak boleh meracuni), data akhirnya lengkap
{
  const h = dbHitung({ gagalBulkKe: 1 })
  await assert.rejects(() => simpanIrisan(h.db, keadaan(), WAKTU), /putus/)
  await simpanIrisan(h.db, keadaan(), WAKTU)
  const dimuat = await muatIrisan(h.db)
  assert.equal((dimuat!.data.posts as any[]).length, 2, 'setelah gagal, percobaan ulang harus menulis semuanya')
}

// 5. pasangan batas: B gagal ditulis lalu keadaan KEMBALI ke A. A tidak boleh dianggap "sudah tersimpan" karena Mongo
//    mungkin sudah menerima sebagian B; koleksi harus dikirim ulang penuh.
{
  const h = dbHitung()
  await simpanIrisan(h.db, keadaan(), WAKTU)
  const b = keadaan(); (b.posts as any[])[0].teks = 'B'
  h.kontrol.gagalSekarang = true
  await assert.rejects(() => simpanIrisan(h.db, b, WAKTU), /putus/)
  h.kontrol.gagalSekarang = false
  const sebelum = h.log.dokumenDikirim
  await simpanIrisan(h.db, keadaan(), WAKTU)
  assert.ok(h.log.dokumenDikirim > sebelum, 'setelah gagal, koleksi harus dikirim ulang walau isinya kembali ke nilai lama')
  const dimuat = await muatIrisan(h.db)
  assert.deepEqual((dimuat!.data.posts as any[]).map((p) => p.teks).sort(), ['dua', 'satu'])
}

// 6. isolasi objek DB: koneksi baru mulai dari kosong dan menulis ulang semuanya sekali
{
  const a = dbHitung(); const b = dbHitung()
  await simpanIrisan(a.db, keadaan(), WAKTU)
  await simpanIrisan(b.db, keadaan(), WAKTU)
  assert.equal(b.log.dokumenDikirim, a.log.dokumenDikirim, 'DB baru tidak boleh mewarisi cache DB lain')
}

// 7. perubahan pada kedalaman: urutan/_id bersarang ikut mengubah sidik (tidak ada perubahan yang terlewat)
{
  const h = dbHitung()
  await simpanIrisan(h.db, { posts: [{ id: 'p1', meta: { urutan: 1 } }] }, WAKTU)
  const n = h.log.dokumenDikirim
  await simpanIrisan(h.db, { posts: [{ id: 'p1', meta: { urutan: 2 } }] }, WAKTU)
  assert.equal(h.log.dokumenDikirim - n, 1, 'perubahan urutan bersarang harus terkirim')
}

console.log('mongoTulisHemat: ok')
