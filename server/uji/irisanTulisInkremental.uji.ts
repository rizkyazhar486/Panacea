// Tulis inkremental irisan MongoDB: hanya dokumen yang berubah yang dikirim, hasil akhir identik dengan tulis penuh.
// Tanpa jaringan, tanpa jam nyata: koleksi palsu di memori mencatat setiap operasi.
import assert from 'node:assert/strict'
import { simpanIrisan, muatIrisan, buatJejakTulis, KOLEKSI_IRISAN, type DbIrisan, type KoleksiIrisan } from '../src/irisanPenyimpanan.js'

type Op = { koleksi: string; jenis: 'tulis' | 'hapus-nin' | 'hapus-in'; ids: string[] }

function dbPalsu(opsi: { gagalTulis?: Set<string>; gagalHapus?: Set<string> } = {}) {
  const kolom = new Map<string, Map<string, Record<string, unknown>>>()
  const log: Op[] = []
  const ambil = (nama: string) => { let p = kolom.get(nama); if (!p) { p = new Map(); kolom.set(nama, p) } return p }
  const db: DbIrisan = {
    collection(nama: string): KoleksiIrisan {
      const peta = ambil(nama)
      return {
        async bulkWrite(ops: any[]) {
          if (opsi.gagalTulis?.has(nama)) throw new Error(`tulis ${nama} putus`)
          log.push({ koleksi: nama, jenis: 'tulis', ids: ops.map((o) => String(o.updateOne.filter._id)) })
          for (const o of ops) peta.set(String(o.updateOne.filter._id), { _id: String(o.updateOne.filter._id), ...o.updateOne.update.$set })
        },
        async deleteMany(filter: any) {
          if (opsi.gagalHapus?.has(nama)) throw new Error(`hapus ${nama} putus`)
          const nin: string[] | undefined = filter?._id?.$nin
          const inn: string[] | undefined = filter?._id?.$in
          if (nin) { log.push({ koleksi: nama, jenis: 'hapus-nin', ids: [...nin].map(String) }); for (const id of [...peta.keys()]) if (!nin.map(String).includes(id)) peta.delete(id) }
          if (inn) { log.push({ koleksi: nama, jenis: 'hapus-in', ids: [...inn].map(String) }); for (const id of inn) peta.delete(String(id)) }
        },
        find() { return { async toArray() { return [...peta.values()].map((d) => structuredClone(d)) } } },
        async createIndex() { return 'ok' },
      }
    },
  }
  const isi = () => Object.fromEntries([...kolom.entries()].filter(([n]) => n !== KOLEKSI_IRISAN.meta).map(([n, p]) => [n, [...p.values()].sort((a, b) => String(a._id).localeCompare(String(b._id)))]))
  return { db, log, isi, ambil }
}

const kini = new Date('2026-10-31T00:00:00.000Z')
const keadaan = () => ({
  users: [{ id: 'u1', email: 'a@x.id' }, { id: 'u2', email: 'b@x.id' }],
  labShares: [{ id: 'izin-1', pasienEmail: 'a@x.id', dokterEmail: 'd@x.id', dibuat: '2026-09-01T00:00:00.000Z', berakhir: '2026-12-01T00:00:00.000Z' }, { id: 'izin-2', pasienEmail: 'b@x.id', dokterEmail: 'd@x.id', dibuat: '2026-09-02T00:00:00.000Z', berakhir: '2026-12-01T00:00:00.000Z' }],
  labAudit: [{ waktu: '2026-09-01T00:00:00.000Z', pasienEmail: 'a@x.id', aktor: 'a@x.id', aksi: 'izin-dibuat', izinId: 'izin-1' }],
  validasiLedger: [{ urutan: 1, isi: { a: 1 }, sidikSebelum: '0', sidik: 's1' }],
})
const tulisan = (log: Op[], dari = 0) => log.slice(dari).filter((o) => o.jenis === 'tulis' && o.koleksi !== KOLEKSI_IRISAN.meta)
const jumlahDitulis = (log: Op[], dari = 0) => tulisan(log, dari).reduce((n, o) => n + o.ids.length, 0)

// ── positif: simpan kedua tanpa perubahan tidak mengirim satu dokumen pun ────────
{
  const { db, log } = dbPalsu(); const jejak = buatJejakTulis()
  await simpanIrisan(db, keadaan(), kini, jejak)
  const awal = jumlahDitulis(log)
  assert.equal(awal, 6, 'tulisan pertama harus penuh (2 akun + 2 izin + 1 audit + 1 buku)')
  const tanda = log.length
  await simpanIrisan(db, keadaan(), kini, jejak)
  assert.equal(jumlahDitulis(log, tanda), 0, 'dokumen yang tidak berubah dikirim ulang')
  assert.equal(log.slice(tanda).some((o) => o.jenis !== 'tulis' && o.koleksi !== KOLEKSI_IRISAN.meta), false, 'simpan tanpa perubahan tidak boleh menghapus apa pun')
  assert.deepEqual(jejak.statistik, { simpan: 2, ditulis: 6, dilewati: 6, dihapus: 0, byteDitulis: jejak.statistik.byteDitulis })
  assert.ok(jejak.statistik.byteDitulis > 0)
  const byteAwal = jejak.statistik.byteDitulis
  await simpanIrisan(db, keadaan(), kini, jejak)
  assert.equal(jejak.statistik.byteDitulis, byteAwal, 'byte bertambah padahal tidak ada perubahan')
}

// ── satu perubahan -> tepat satu dokumen ditulis, di koleksi itu saja ───────────
{
  const { db, log } = dbPalsu(); const jejak = buatJejakTulis()
  await simpanIrisan(db, keadaan(), kini, jejak)
  const tanda = log.length
  const ubah = keadaan(); ubah.labShares[1] = { ...ubah.labShares[1], berakhir: '2026-11-15T00:00:00.000Z' }
  await simpanIrisan(db, ubah, kini, jejak)
  assert.deepEqual(tulisan(log, tanda).map((o) => [o.koleksi, o.ids.length]), [[KOLEKSI_IRISAN.labShares, 1]])
}

// ── penghapusan -> hanya id yang hilang, lewat $in (bukan $nin dengan daftar penuh) ─
{
  const { db, log, ambil } = dbPalsu(); const jejak = buatJejakTulis()
  await simpanIrisan(db, keadaan(), kini, jejak)
  const tanda = log.length
  const susut = keadaan(); susut.labShares = [susut.labShares[0]]
  await simpanIrisan(db, susut, kini, jejak)
  const hapus = log.slice(tanda).filter((o) => o.jenis !== 'tulis' && o.koleksi !== KOLEKSI_IRISAN.meta)
  assert.equal(hapus.length, 1)
  assert.equal(hapus[0].jenis, 'hapus-in')
  assert.equal(hapus[0].koleksi, KOLEKSI_IRISAN.labShares)
  assert.equal(hapus[0].ids.length, 1)
  assert.equal(ambil(KOLEKSI_IRISAN.labShares).size, 1, 'izin yang dicabut tertinggal di koleksi')
  assert.equal(jejak.statistik.dihapus, 1)
}

// ── tulisan pertama tetap membersihkan dokumen liar (perilaku lama $nin dipertahankan) ─
{
  const { db, ambil } = dbPalsu(); const jejak = buatJejakTulis()
  ambil(KOLEKSI_IRISAN.labShares).set('liar', { _id: 'liar', id: 'liar' })
  await simpanIrisan(db, keadaan(), kini, jejak)
  assert.equal(ambil(KOLEKSI_IRISAN.labShares).has('liar'), false, 'dokumen liar dari proses lama tidak dibersihkan')
}

// ── kegagalan tulis: sidik tidak diperbarui, perubahan diulang pada simpan berikutnya ─
{
  const gagal = new Set<string>()
  const { db, log, ambil } = dbPalsu({ gagalTulis: gagal }); const jejak = buatJejakTulis()
  await simpanIrisan(db, keadaan(), kini, jejak)
  const ubah = keadaan(); ubah.labShares[0] = { ...ubah.labShares[0], berakhir: '2026-11-01T00:00:00.000Z' }
  gagal.add(KOLEKSI_IRISAN.labShares)
  await assert.rejects(() => simpanIrisan(db, ubah, kini, jejak), /tulis lab_shares putus|putus/)
  gagal.clear()
  const tanda = log.length
  await simpanIrisan(db, ubah, kini, jejak)
  assert.deepEqual(tulisan(log, tanda).map((o) => [o.koleksi, o.ids.length]), [[KOLEKSI_IRISAN.labShares, 1]], 'perubahan yang gagal ditulis hilang')
  assert.equal((ambil(KOLEKSI_IRISAN.labShares).get(String((await import('../src/irisanPenyimpanan.js')).susunDokumen(ubah)[KOLEKSI_IRISAN.labShares][0]._id)) as Record<string, unknown>)?.berakhir, '2026-11-01T00:00:00.000Z')
}

// ── kegagalan hapus: id yang hilang dicoba lagi pada simpan berikutnya ──────────
{
  const gagal = new Set<string>()
  const { db, ambil } = dbPalsu({ gagalHapus: gagal }); const jejak = buatJejakTulis()
  await simpanIrisan(db, keadaan(), kini, jejak)
  const susut = keadaan(); susut.labShares = [susut.labShares[0]]
  gagal.add(KOLEKSI_IRISAN.labShares)
  await assert.rejects(() => simpanIrisan(db, susut, kini, jejak), /putus/)
  assert.equal(ambil(KOLEKSI_IRISAN.labShares).size, 2)
  gagal.clear()
  await simpanIrisan(db, susut, kini, jejak)
  assert.equal(ambil(KOLEKSI_IRISAN.labShares).size, 1, 'penghapusan yang gagal tidak diulang')
}

// ── buku validasi tetap tambah-saja: entri yang hilang dari memori TIDAK dihapus ──
{
  const { db, log, ambil } = dbPalsu(); const jejak = buatJejakTulis()
  const k = keadaan()
  await simpanIrisan(db, k, kini, jejak)
  const tanda = log.length
  await simpanIrisan(db, { ...k, validasiLedger: [{ urutan: 2, isi: { b: 2 }, sidikSebelum: 's1', sidik: 's2' }] }, kini, jejak)
  assert.equal(ambil(KOLEKSI_IRISAN.validasiLedger).size, 2, 'buku tambah-saja kehilangan entri')
  assert.equal(log.slice(tanda).some((o) => o.koleksi === KOLEKSI_IRISAN.validasiLedger && o.jenis !== 'tulis'), false)
  assert.deepEqual(tulisan(log, tanda).filter((o) => o.koleksi === KOLEKSI_IRISAN.validasiLedger).map((o) => o.ids), [['2']])
}

// ── kesetaraan: urutan simpan inkremental berakhir dengan isi yang sama persis dengan tulis penuh ─
{
  const a = dbPalsu(); const b = dbPalsu(); const jejak = buatJejakTulis()
  const langkah = [keadaan(), (() => { const s = keadaan(); s.labShares = [s.labShares[1]]; return s })(), (() => { const s = keadaan(); s.users.push({ id: 'u3', email: 'c@x.id' }); return s })()]
  for (const s of langkah) { await simpanIrisan(a.db, s, kini, jejak); await simpanIrisan(b.db, s, kini) }
  assert.deepEqual(a.isi(), b.isi(), 'isi koleksi berbeda dari tulis penuh')
  assert.deepEqual((await muatIrisan(a.db))!.data, (await muatIrisan(b.db))!.data, 'hasil muat berbeda dari tulis penuh')
  assert.ok(jumlahDitulis(a.log) < jumlahDitulis(b.log), 'tulis inkremental tidak mengurangi dokumen yang dikirim')
}

// ── berpasangan: tanpa jejak, perilaku lama (semua dokumen ditulis setiap kali) tidak berubah ─
{
  const { db, log } = dbPalsu()
  await simpanIrisan(db, keadaan(), kini)
  const tanda = log.length
  await simpanIrisan(db, keadaan(), kini)
  assert.equal(jumlahDitulis(log, tanda), 6, 'jalur tanpa jejak berubah perilaku')
}

console.log('irisanTulisInkremental: simpan tanpa perubahan mengirim 0 dokumen; perubahan, penghapusan, kegagalan dan buku tambah-saja setara dengan tulis penuh')
