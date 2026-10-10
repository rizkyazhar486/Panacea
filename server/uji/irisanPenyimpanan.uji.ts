import assert from 'node:assert/strict'
import {
  VERSI_IRISAN, VERSI_IRISAN_LAMA, VERSI_IRISAN_AKUN, VERSI_IRISAN_POS, VERSI_IRISAN_PESANAN, VERSI_IRISAN_TRANSAKSI, VERSI_IRISAN_SERI, VERSI_IRISAN_PROFIL, VERSI_IRISAN_LENGKAP, dokumenInti, susunDokumen, gabungDokumen, pasangIrisan, simpanIrisan, muatIrisan, klinisKosong,
  KOLEKSI_IRISAN, type DbIrisan, type KoleksiIrisan,
} from '../src/irisanPenyimpanan.js'

function dbPalsu(): DbIrisan & { isi(nama: string): Record<string, unknown>[] } {
  const kolom = new Map<string, Map<string, Record<string, unknown>>>()
  const ambil = (nama: string) => {
    let peta = kolom.get(nama)
    if (!peta) { peta = new Map(); kolom.set(nama, peta) }
    return peta
  }
  return {
    collection(nama: string): KoleksiIrisan {
      const peta = ambil(nama)
      return {
        async bulkWrite(ops: any[]) {
          for (const op of ops) {
            const id = String(op.updateOne.filter._id)
            peta.set(id, { _id: id, ...op.updateOne.update.$set })
          }
        },
        async deleteMany(filter: any) {
          const nin: string[] = filter?._id?.$nin ?? []
          for (const id of [...peta.keys()]) if (!nin.includes(id)) peta.delete(id)
        },
        find() { return { async toArray() { return [...peta.values()].map((d) => ({ ...d })) } } },
        async createIndex() { return 'ok' },
      }
    },
    isi(nama: string) { return [...ambil(nama).values()] },
  }
}

const keadaan = {
  users: [{ id: 'u1' }],
  labLogs: { 'a@x.id': { log: { gdp: [{ id: 'g1', tanggal: '2026-09-01', nilai: 90 }] }, diperbaruiPada: '2026-09-02T00:00:00.000Z' } },
  labShares: [{ id: 'izin-1', pasienEmail: 'a@x.id', dokterEmail: 'd@x.id', dibuat: '2026-09-01T00:00:00.000Z', berakhir: '2026-10-01T00:00:00.000Z' }],
  labReviews: [{ id: 'tin-1', izinId: 'izin-1', pasienEmail: 'a@x.id', dokterEmail: 'd@x.id', tes: 'gdp', ditinjau: '2026-09-03T00:00:00.000Z' }],
  labAudit: [
    { waktu: '2026-09-01T00:00:00.000Z', pasienEmail: 'a@x.id', aktor: 'a@x.id', aksi: 'izin-dibuat', izinId: 'izin-1' },
    { waktu: '2026-09-01T00:00:00.000Z', pasienEmail: 'a@x.id', aktor: 'a@x.id', aksi: 'izin-dibuat', izinId: 'izin-1' },
  ],
  carePlans: [{ izinId: 'izin-1', pasienEmail: 'a@x.id', dokterEmail: 'd@x.id', dibuat: '2026-09-04T00:00:00.000Z', rencana: { id: 'rencana-1' } }],
  careReports: [{ pasienEmail: 'a@x.id', laporan: { id: 'daily-abcdef12', planId: 'rencana-1', jawaban: 'ya' } }],
}

const inti = dokumenInti(keadaan)
assert.deepEqual(inti, {}, 'dokumen inti masih membawa akun, dompet, rekam, atau lab')
for (const kunci of ['users', 'wallets', 'clinical', 'posts', 'settings', 'connect', 'orders', 'notifications', 'txs', 'hrSeries', 'sleepSeries', 'deviceWorkouts', 'hrNotifications', 'webhookDeliveries', 'healthProfiles', 'ringkasan', 'reminders', 'sportsFavorites', 'pushSubs', 'healthWebhookTokens', 'creatorSubs', 'manualTopups', 'applications', 'validasiLedger', 'feedback', 'meets', 'clubs', 'secondOpinions', 'facilityPrices', 'visitMemberships', 'audit', 'labLogs', 'labShares', 'labReviews', 'labAudit', 'carePlans', 'careReports']) {
  assert.equal(kunci in inti, false, `${kunci} tertinggal di dokumen inti`)
}

const besar = { ...keadaan, labLogs: { 'a@x.id': { log: { gdp: Array.from({ length: 100 }, (_, i) => ({ id: `g${i}`, tanggal: '2026-09-01', nilai: i + 1 })) }, diperbaruiPada: '2026-09-02T00:00:00.000Z' } } }
assert.ok(Buffer.byteLength(JSON.stringify(besar)) > Buffer.byteLength(JSON.stringify(dokumenInti(besar))) + 1000, 'log lab tidak mengurangi ukuran dokumen inti')

const db = dbPalsu()
assert.equal(await muatIrisan(db), null, 'tanpa penanda versi, koleksi parsial tidak boleh menggantikan dokumen lama')
await simpanIrisan(db, keadaan, new Date('2026-09-29T00:00:00.000Z'))
const muat = await muatIrisan(db)
assert.ok(muat)
assert.equal(muat!.lengkap, true)
assert.deepEqual(muat!.data, {
  labLogs: keadaan.labLogs,
  labShares: keadaan.labShares,
  labReviews: keadaan.labReviews,
  labAudit: keadaan.labAudit,
  carePlans: keadaan.carePlans,
  careReports: keadaan.careReports,
  users: keadaan.users,
  wallets: {},
  clinical: klinisKosong(),
  posts: [],
  settings: {},
  connect: { akun: {}, laporan: [], garam: '' },
  orders: [],
  notifications: {},
  txs: [],
  hrSeries: {},
  sleepSeries: {},
  deviceWorkouts: {},
  hrNotifications: {},
  webhookDeliveries: {},
  healthProfiles: {},
  ringkasan: {},
  reminders: {},
  sportsFavorites: {},
  pushSubs: {},
  healthWebhookTokens: {},
  creatorSubs: [],
  manualTopups: [],
  applications: [],
  validasiLedger: [],
  feedback: [],
  meets: [],
  clubs: [],
  secondOpinions: [],
  facilityPrices: [],
  visitMemberships: {},
  audit: [],
})
assert.equal(db.isi('irisan_meta')[0]?.versi, VERSI_IRISAN)
assert.equal(db.isi('lab_audit').length, 2, 'dua jejak audit identik tidak boleh dilipat menjadi satu')

const basi = { users: [{ id: 'u1' }], labLogs: { 'lama@x.id': { log: {}, diperbaruiPada: '2000-01-01T00:00:00.000Z' } }, labShares: [{ id: 'izin-basi' }] }
pasangIrisan(basi, muat!.data)
assert.deepEqual(basi.labLogs, keadaan.labLogs, 'salinan lama di dokumen state menimpa koleksi')
assert.equal(basi.labShares[0].id, 'izin-1')

const susut = { ...keadaan, labShares: [], labReviews: keadaan.labReviews }
await simpanIrisan(db, susut)
assert.equal(db.isi('lab_shares').length, 0, 'izin yang dicabut dari memori tertinggal di koleksi')
assert.equal((await muatIrisan(db))!.data.labReviews.length, 1, 'tinjauan yang tidak berubah hilang saat irisan lain menyusut')

const putus = dbPalsu()
const asli = putus.collection.bind(putus)
putus.collection = (nama: string) => {
  const col = asli(nama)
  return { ...col, bulkWrite: async () => { throw new Error('putus') } }
}
await assert.rejects(() => simpanIrisan(putus, keadaan), /putus/)
assert.equal(await muatIrisan(putus), null, 'kegagalan tulis menandai irisan sebagai sudah bermigrasi')

const dokumen = susunDokumen(keadaan)
assert.equal(dokumen.care_reports[0]._id, 'daily-abcdef12')
assert.ok(gabungDokumen(dokumen).labShares[0])

const klinis = {
  patients: [{ id: 'p1', nama: 'A' }, { id: 'p2', nama: 'B' }],
  vitals: { p1: [{ sbp: 120 }], p2: [{ sbp: 90 }] },
  supportive: { p1: [{ tes: 'gdp' }] },
  records: { p1: { keluhan: 'lemas' }, p2: { keluhan: 'batuk' } },
  education: { p2: { judul: 'batuk' } },
  recordEncounters: { p1: [{ id: 'e1' }] },
  recordHistory: {},
  encounters: { p1: [{ encounterId: 'k1' }] },
  tautan: { p1: { patientId: 'p1', userId: 'u1', ditautkanPada: '2026-09-05T00:00:00.000Z', kodeDari: 'dok' } },
  kodeTaut: [{ hash: 'abc123', patientId: 'p1', dibuatOleh: 'dok', dibuatPada: '2026-09-05T00:00:00.000Z', kedaluwarsa: '2026-09-12T00:00:00.000Z' }],
}
const akun = {
  users: [{ id: 'u1', email: 'a@x.id', name: 'A', role: 'pasien', createdAt: '2026-09-01T00:00:00.000Z' }],
  wallets: { u1: 25 },
  clinical: klinis,
}
const dbAkun = dbPalsu()
await simpanIrisan(dbAkun, akun)
const muatAkun = await muatIrisan(dbAkun)
assert.equal(muatAkun?.lengkap, true)
assert.deepEqual(muatAkun?.data.users, akun.users)
assert.deepEqual(muatAkun?.data.wallets, { u1: 25 })
assert.deepEqual(muatAkun?.data.clinical, klinis, 'rekam dua pasien bercampur atau tautan hilang')
assert.equal(dbAkun.isi('rekam_pasien').length, 2)
assert.equal(dbAkun.isi('rekam_pasien').some((d) => 'vitals' in d || 'record' in d || 'education' in d), false, 'larik atau rekam masih menempel di kepala pasien')
assert.equal(dbAkun.isi('butir_rekam').length, 5, 'setiap butir rekam belum punya dokumen sendiri')
assert.equal(dbAkun.isi('rekam_objek').length, 3, 'rekam dan edukasi belum lepas dari kepala pasien')
assert.equal(dbAkun.isi('akun')[0]?.email, 'a@x.id')

const yatim = { clinical: { patients: [], vitals: { 'p-yatim': [{ hr: 70 }] }, supportive: {}, records: {}, education: {} } }
await simpanIrisan(dbAkun, yatim)
const muatYatim = await muatIrisan(dbAkun)
assert.deepEqual(muatYatim?.data.clinical?.vitals, { 'p-yatim': [{ hr: 70 }] }, 'vital tanpa baris pasien hilang')
assert.equal(muatYatim?.data.clinical?.records.p1, undefined, 'rekam pasien yang dihapus tertinggal')
assert.equal(dbAkun.isi('rekam_pasien').length, 1)
assert.equal(dbAkun.isi('butir_rekam').length, 1, 'butir pasien yang dihapus tertinggal')
assert.equal(dbAkun.isi('rekam_objek').length, 0, 'rekam pasien yang dihapus tertinggal di objek')
assert.equal(dbAkun.isi('akun').length, 0, 'akun yang dihapus tertinggal di koleksi')

const lama = dbPalsu()
await simpanIrisan(lama, keadaan)
const meta = lama.isi(KOLEKSI_IRISAN.meta)[0]
meta.versi = VERSI_IRISAN_LAMA
lama.collection(KOLEKSI_IRISAN.meta).bulkWrite([{ updateOne: { filter: { _id: 'lab-care' }, update: { $set: { versi: VERSI_IRISAN_LAMA } }, upsert: true } }])
const muatLama = await muatIrisan(lama)
assert.equal(muatLama?.lengkap, false, 'versi lab-care-v1 terbaca sebagai akun sudah terpisah')
assert.equal(muatLama?.data.users, undefined)
assert.deepEqual(muatLama?.data.labShares, keadaan.labShares)
const memori = { ...keadaan, clinical: klinis, wallets: { u1: 25 } }
pasangIrisan(memori, muatLama!.data)
assert.equal(memori.users[0].id, 'u1', 'muat versi lama menghapus akun yang masih di dokumen inti')
assert.equal((memori.clinical as typeof klinis).patients.length, 2)

const garam = 'a'.repeat(64)
const ruang = {
  posts: [
    { id: 'pos-baru', authorEmail: 'a@x.id', caption: 'baru' },
    { id: 'pos-lama', authorEmail: 'b@x.id', caption: 'lama' },
  ],
  settings: { u1: { tema: 'gelap', ukuran: { teks: 16 } } },
  connect: {
    garam,
    akun: {
      'a@x.id': { email: 'a@x.id', status: 'terverifikasi', kredit: 100, radiusKm: 5, diblokir: ['c@x.id'] },
      'b@x.id': { email: 'b@x.id', status: 'menunggu', kredit: 90, radiusKm: 10, diblokir: [] },
    },
    laporan: [{ id: 'lap-1', pelaporEmail: 'a@x.id', terlaporEmail: 'b@x.id', alasan: 'spam', status: 'menunggu', pada: '2026-09-06T00:00:00.000Z' }],
  },
}
const dbRuang = dbPalsu()
await simpanIrisan(dbRuang, ruang)
const muatRuang = await muatIrisan(dbRuang)
assert.equal(muatRuang?.lengkap, true)
assert.deepEqual(muatRuang?.data.posts, ruang.posts, 'urutan pos berubah')
assert.deepEqual(muatRuang?.data.settings, ruang.settings)
assert.equal(muatRuang?.data.connect?.garam, garam, 'garam sidik telepon terganti')
assert.equal(muatRuang?.data.connect?.akun['a@x.id'] && (muatRuang.data.connect.akun['a@x.id'] as { diblokir: string[] }).diblokir[0], 'c@x.id')
assert.equal(Object.keys(muatRuang?.data.connect?.akun ?? {}).length, 2, 'akun Connect bercampur')
await simpanIrisan(dbRuang, { ...ruang, posts: [ruang.posts[1]] })
assert.equal(dbRuang.isi('pos').length, 1, 'pos yang dihapus tertinggal')
assert.equal(dbRuang.isi('connect_garam')[0]?.nilai, garam)

const dbAkunLama = dbPalsu()
await simpanIrisan(dbAkunLama, { ...ruang, users: [{ id: 'u1', email: 'a@x.id' }] })
await dbAkunLama.collection(KOLEKSI_IRISAN.meta).bulkWrite([{ updateOne: { filter: { _id: 'lab-care' }, update: { $set: { versi: VERSI_IRISAN_AKUN } }, upsert: true } }])
const muatAkunLama = await muatIrisan(dbAkunLama)
assert.equal(muatAkunLama?.lengkap, false, 'akun-rekam-v1 terbaca sebagai pos sudah terpisah')
assert.equal(muatAkunLama?.data.posts, undefined)
assert.equal(muatAkunLama?.data.connect, undefined)
const memoriRuang = { posts: ruang.posts, settings: ruang.settings, connect: ruang.connect, users: [{ id: 'dari-dokumen' }] }
pasangIrisan(memoriRuang, muatAkunLama!.data)
assert.equal(memoriRuang.posts.length, 2, 'muat versi akun menghapus pos yang masih di dokumen inti')
assert.equal(memoriRuang.connect.garam, garam)
assert.equal(memoriRuang.users[0].id, 'u1', 'muat versi akun tidak memasang akun dari koleksi')

const pesanan = {
  orders: [
    { id: 'ord-baru', userId: 'u1', amountPnc: 10, amountIdr: 10000, method: 'qris', status: 'pending', createdAt: '2026-09-07T00:00:00.000Z' },
    { id: 'ord-lama', userId: 'u2', amountPnc: 5, amountIdr: 5000, method: 'qris', status: 'paid', createdAt: '2026-09-06T00:00:00.000Z' },
  ],
  notifications: {
    u1: [{ id: 'n1', title: 'Baru', body: 'satu', at: '2026-09-07T00:00:00.000Z', read: false }],
    u2: [{ id: 'n1', title: 'Lain', body: 'dua', at: '2026-09-07T00:00:00.000Z', read: true }, { id: 'n0', title: 'Lebih dulu', body: 'nol', at: '2026-09-06T00:00:00.000Z', read: false }],
  },
}
const dbPesanan = dbPalsu()
await simpanIrisan(dbPesanan, pesanan)
const muatPesanan = await muatIrisan(dbPesanan)
assert.equal(muatPesanan?.lengkap, true)
assert.deepEqual(muatPesanan?.data.orders, pesanan.orders, 'urutan pesanan berubah')
assert.deepEqual(muatPesanan?.data.notifications, pesanan.notifications, 'notifikasi dua akun bercampur')
await simpanIrisan(dbPesanan, { ...pesanan, orders: [pesanan.orders[1]] })
assert.equal(dbPesanan.isi('pesanan').length, 1, 'pesanan yang dihapus tertinggal')
assert.deepEqual((await muatIrisan(dbPesanan))?.data.notifications?.u1, pesanan.notifications.u1, 'notifikasi hilang saat pesanan menyusut')

const dbPosLama = dbPalsu()
await simpanIrisan(dbPosLama, pesanan)
await dbPosLama.collection(KOLEKSI_IRISAN.meta).bulkWrite([{ updateOne: { filter: { _id: 'lab-care' }, update: { $set: { versi: VERSI_IRISAN_POS } }, upsert: true } }])
const muatPosLama = await muatIrisan(dbPosLama)
assert.equal(muatPosLama?.lengkap, false, 'pos-connect-v1 terbaca sebagai pesanan sudah terpisah')
assert.equal(muatPosLama?.data.orders, undefined)
const memoriPesanan = { orders: pesanan.orders, notifications: pesanan.notifications }
pasangIrisan(memoriPesanan, muatPosLama!.data)
assert.equal(memoriPesanan.orders.length, 2, 'muat versi pos menghapus pesanan yang masih di dokumen inti')

const buku = {
  txs: [
    { id: 'tx-baru', userId: 'u1', type: 'deposit', amountPnc: 25, note: 'Bonus', at: '2026-09-08T00:00:00.000Z' },
    { id: 'tx-lama', userId: 'u2', type: 'purchase', amountPnc: -10, note: 'Catatan', at: '2026-09-07T00:00:00.000Z', ref: 'ord-lama' },
  ],
}
const dbTx = dbPalsu()
await simpanIrisan(dbTx, buku)
const muatTx = await muatIrisan(dbTx)
assert.equal(muatTx?.lengkap, true)
assert.deepEqual(muatTx?.data.txs, buku.txs, 'urutan transaksi berubah')
await simpanIrisan(dbTx, { txs: [buku.txs[1]] })
assert.equal(dbTx.isi('transaksi').length, 1, 'transaksi yang dihapus tertinggal')
assert.equal((await muatIrisan(dbTx))?.data.txs?.[0].id, 'tx-lama')

const dbPesananLama = dbPalsu()
await simpanIrisan(dbPesananLama, buku)
await dbPesananLama.collection(KOLEKSI_IRISAN.meta).bulkWrite([{ updateOne: { filter: { _id: 'lab-care' }, update: { $set: { versi: VERSI_IRISAN_PESANAN } }, upsert: true } }])
const muatPesananLama = await muatIrisan(dbPesananLama)
assert.equal(muatPesananLama?.lengkap, false, 'pesanan-v1 terbaca sebagai transaksi sudah terpisah')
assert.equal(muatPesananLama?.data.txs, undefined)
const memoriTx = { txs: buku.txs }
pasangIrisan(memoriTx, muatPesananLama!.data)
assert.equal(memoriTx.txs.length, 2, 'muat versi pesanan menghapus transaksi yang masih di dokumen inti')

const dbTransaksiLama = dbPalsu()
await simpanIrisan(dbTransaksiLama, buku)
await dbTransaksiLama.collection(KOLEKSI_IRISAN.meta).bulkWrite([{ updateOne: { filter: { _id: 'lab-care' }, update: { $set: { versi: VERSI_IRISAN_TRANSAKSI } }, upsert: true } }])
const muatTransaksiLama = await muatIrisan(dbTransaksiLama)
assert.equal(muatTransaksiLama?.lengkap, false, 'transaksi-v1 terbaca sebagai deret perangkat sudah terpisah')
assert.equal(muatTransaksiLama?.data.hrSeries, undefined)

const seri = {
  hrSeries: {
    'a@x.id': [{ t: 2, bpm: 80, kind: 'latihan' }, { t: 1, bpm: 60, kind: 'istirahat' }],
    'b@x.id': [{ t: 3, bpm: 90, kind: 'latihan' }],
  },
  sleepSeries: { 'a@x.id': [{ date: '2026-09-07', totalH: 7 }, { date: '2026-09-08', totalH: 1 }] },
  deviceWorkouts: { 'a@x.id': [{ start: '2026-09-08 06:00:00 +0700', name: 'Run' }] },
  hrNotifications: { 'b@x.id': [{ start: '2026-09-08 01:00:00 +0700', heartNotification: 'high' }] },
  webhookDeliveries: { 'a@x.id': [{ at: '2026-09-08T00:00:00.000Z', metricGroups: [], workouts: 1, hrSamples: 2, sleepNights: 1, matched: ['hr'], newestSampleDate: '2026-09-08' }] },
}
const dbSeri = dbPalsu()
await simpanIrisan(dbSeri, seri)
const muatSeri = await muatIrisan(dbSeri)
assert.equal(muatSeri?.lengkap, true)
assert.deepEqual(muatSeri?.data.hrSeries, seri.hrSeries, 'deret denyut dua surel bercampur atau urutannya berubah')
assert.deepEqual(muatSeri?.data.sleepSeries, seri.sleepSeries)
assert.deepEqual(muatSeri?.data.deviceWorkouts, seri.deviceWorkouts)
assert.deepEqual(muatSeri?.data.hrNotifications, seri.hrNotifications)
assert.deepEqual(muatSeri?.data.webhookDeliveries, seri.webhookDeliveries)
await simpanIrisan(dbSeri, { ...seri, hrSeries: { 'b@x.id': seri.hrSeries['b@x.id'] } })
assert.equal(dbSeri.isi('sampel_denyut').length, 1, 'sampel denyut yang dihapus tertinggal')
assert.deepEqual((await muatIrisan(dbSeri))?.data.sleepSeries, seri.sleepSeries, 'tidur hilang saat denyut menyusut')

const memoriSeri = { hrSeries: seri.hrSeries, sleepSeries: seri.sleepSeries }
pasangIrisan(memoriSeri, muatTransaksiLama!.data)
assert.equal(memoriSeri.hrSeries['a@x.id'].length, 2, 'muat versi transaksi menghapus deret yang masih di dokumen inti')

const dbSeriLama = dbPalsu()
await simpanIrisan(dbSeriLama, seri)
await dbSeriLama.collection(KOLEKSI_IRISAN.meta).bulkWrite([{ updateOne: { filter: { _id: 'lab-care' }, update: { $set: { versi: VERSI_IRISAN_SERI } }, upsert: true } }])
const muatSeriLama = await muatIrisan(dbSeriLama)
assert.equal(muatSeriLama?.lengkap, false, 'seri-v1 terbaca sebagai profil sudah terpisah')
assert.equal(muatSeriLama?.data.healthProfiles, undefined)
assert.equal(muatSeriLama?.data.healthWebhookTokens, undefined)

const profil = {
  healthProfiles: {
    'a@x.id': { beratKg: 70, updatedAt: '2026-09-08T00:00:00.000Z' },
    'b@x.id': { beratKg: 62, updatedAt: '2026-09-07T00:00:00.000Z' },
  },
  ringkasan: { u1: { tanggal: '2026-09-08', proteinG: 40 } },
  reminders: { u1: [{ id: 'r1', medName: 'A', dose: '1', timeOfDay: '08:00', nextFireAt: '2026-09-09T01:00:00.000Z', active: true, createdAt: '2026-09-01T00:00:00.000Z' }, { id: 'r2', medName: 'B', dose: '1', timeOfDay: '20:00', nextFireAt: '2026-09-09T13:00:00.000Z', active: true, createdAt: '2026-09-02T00:00:00.000Z' }] },
  sportsFavorites: { u1: ['epl:Arsenal', 'epl:Liverpool'] },
  pushSubs: { u1: [{ endpoint: 'https://push.example/1' }, { endpoint: 'https://push.example/2' }] },
  healthWebhookTokens: { 'token-a': 'a@x.id', 'token-b': 'b@x.id' },
}
const dbProfil = dbPalsu()
await simpanIrisan(dbProfil, profil)
const muatProfil = await muatIrisan(dbProfil)
assert.equal(muatProfil?.lengkap, true)
assert.deepEqual(muatProfil?.data.healthProfiles, profil.healthProfiles, 'profil dua surel bercampur')
assert.deepEqual(muatProfil?.data.ringkasan, profil.ringkasan)
assert.deepEqual(muatProfil?.data.reminders, profil.reminders, 'urutan pengingat berubah')
assert.deepEqual(muatProfil?.data.sportsFavorites, profil.sportsFavorites)
assert.deepEqual(muatProfil?.data.pushSubs, profil.pushSubs)
assert.deepEqual(muatProfil?.data.healthWebhookTokens, profil.healthWebhookTokens, 'token webhook hilang atau tertukar')
await simpanIrisan(dbProfil, { ...profil, healthProfiles: { 'b@x.id': profil.healthProfiles['b@x.id'] }, healthWebhookTokens: { 'token-b': 'b@x.id' } })
assert.equal(dbProfil.isi('profil_kesehatan').length, 1, 'profil yang dihapus tertinggal')
assert.equal(dbProfil.isi('token_webhook').length, 1, 'token yang dicabut tertinggal')
assert.deepEqual((await muatIrisan(dbProfil))?.data.reminders, profil.reminders, 'pengingat hilang saat profil menyusut')

const memoriProfil = { healthProfiles: profil.healthProfiles, healthWebhookTokens: profil.healthWebhookTokens }
pasangIrisan(memoriProfil, muatSeriLama!.data)
assert.equal(memoriProfil.healthProfiles['a@x.id'].beratKg, 70, 'muat versi seri menghapus profil yang masih di dokumen inti')
assert.equal(memoriProfil.healthWebhookTokens['token-a'], 'a@x.id', 'muat versi seri mengganti token webhook')

const dbProfilLama = dbPalsu()
await simpanIrisan(dbProfilLama, profil)
await dbProfilLama.collection(KOLEKSI_IRISAN.meta).bulkWrite([{ updateOne: { filter: { _id: 'lab-care' }, update: { $set: { versi: VERSI_IRISAN_PROFIL } }, upsert: true } }])
const muatProfilLama = await muatIrisan(dbProfilLama)
assert.equal(muatProfilLama?.lengkap, false, 'profil-v1 terbaca sebagai sisa keadaan sudah terpisah')
assert.equal(muatProfilLama?.data.meets, undefined)
assert.equal(muatProfilLama?.data.validasiLedger, undefined)

const nol = '0'.repeat(64)
const satu = 'a'.repeat(64)
const dua = 'b'.repeat(64)
const bukuValidasi = [
  { urutan: 0, isi: { jenis: 'protokol', data: { id: 'studi' } }, sidikSebelum: nol, sidik: satu },
  { urutan: 1, isi: { jenis: 'kasus', data: { id: 'k1' } }, sidikSebelum: satu, sidik: dua },
]
const sisa = {
  creatorSubs: [
    { subscriberId: 'u1', authorEmail: 'a@x.id', at: '2026-09-01T00:00:00.000Z', expires: '2026-10-01T00:00:00.000Z' },
    { subscriberId: 'u1', authorEmail: 'b@x.id', at: '2026-09-02T00:00:00.000Z', expires: '2026-10-02T00:00:00.000Z' },
  ],
  manualTopups: [{ id: 'top-1', userId: 'u1', email: 'a@x.id', name: 'A', amountPnc: 10, amountIdr: 10000, status: 'pending', at: '2026-09-08T00:00:00.000Z' }],
  applications: [{ id: 'lam-1', userId: 'u2', email: 'b@x.id', name: 'B', role: 'dokter', status: 'pending', at: '2026-09-08T00:00:00.000Z' }],
  validasiLedger: bukuValidasi,
  feedback: [{ id: 'fb-1', userId: 'u1', userEmail: 'a@x.id', userName: 'A', kind: 'Suggestion', text: 'tambah', at: '2026-09-08T00:00:00.000Z', read: false }],
  meets: [{ id: 'meet-baru', title: 'Baru', hostEmail: 'a@x.id' }, { id: 'meet-lama', title: 'Lama', hostEmail: 'b@x.id' }],
  clubs: [{ id: 'klub-1', name: 'Lari', hostEmail: 'a@x.id', members: ['a@x.id'] }],
  secondOpinions: [{ id: 'op-1', patientEmail: 'a@x.id', patientName: 'A', status: 'pending_doctor', aiDraft: 'draf', createdAt: '2026-09-08T00:00:00.000Z' }],
  facilityPrices: [{ id: 'harga-1', facilityId: 'rs-1', currency: 'IDR', confidence: 'estimated', submittedByEmail: 'a@x.id', submittedByName: 'A', at: '2026-09-08T00:00:00.000Z' }],
  visitMemberships: { 'kunjungan-1': { id: 'kunjungan-1', patientUserId: 'u1', clinicianUserId: 'u2', status: 'scheduled', createdAt: '2026-09-08T00:00:00.000Z', updatedAt: '2026-09-08T00:00:00.000Z' } },
}
const dbSisa = dbPalsu()
await simpanIrisan(dbSisa, sisa)
const muatSisa = await muatIrisan(dbSisa)
assert.equal(muatSisa?.lengkap, true)
assert.deepEqual(muatSisa?.data.creatorSubs, sisa.creatorSubs, 'langganan kreator dua penulis bercampur')
assert.deepEqual(muatSisa?.data.manualTopups, sisa.manualTopups)
assert.deepEqual(muatSisa?.data.applications, sisa.applications)
assert.deepEqual(muatSisa?.data.validasiLedger, bukuValidasi, 'rantai buku validasi berubah')
assert.deepEqual(muatSisa?.data.feedback, sisa.feedback)
assert.deepEqual(muatSisa?.data.meets, sisa.meets, 'urutan pertemuan berubah')
assert.deepEqual(muatSisa?.data.clubs, sisa.clubs)
assert.deepEqual(muatSisa?.data.secondOpinions, sisa.secondOpinions)
assert.deepEqual(muatSisa?.data.facilityPrices, sisa.facilityPrices)
assert.deepEqual(muatSisa?.data.visitMemberships, sisa.visitMemberships, 'keanggotaan kunjungan hilang')
await simpanIrisan(dbSisa, { ...sisa, meets: [sisa.meets[1]], validasiLedger: [bukuValidasi[0]] })
assert.equal(dbSisa.isi('pertemuan').length, 1, 'pertemuan yang dihapus tertinggal')
assert.equal(dbSisa.isi('buku_validasi').length, 2, 'buku validasi yang lebih pendek menghapus catatan lama')
assert.deepEqual((await muatIrisan(dbSisa))?.data.validasiLedger, bukuValidasi, 'muat menghilangkan catatan validasi yang tidak boleh dipangkas')
assert.deepEqual((await muatIrisan(dbSisa))?.data.clubs, sisa.clubs, 'klub hilang saat pertemuan menyusut')

const memoriSisa = { meets: sisa.meets, validasiLedger: bukuValidasi }
pasangIrisan(memoriSisa, muatProfilLama!.data)
assert.equal(memoriSisa.meets.length, 2, 'muat versi profil menghapus pertemuan yang masih di dokumen inti')
assert.equal(memoriSisa.validasiLedger.length, 2, 'muat versi profil menghapus buku validasi yang masih di dokumen inti')

const jejak = {
  audit: [
    { id: 'jejak-baru', at: '2026-09-08T00:00:00.000Z', userId: 'u1', userEmail: 'a@x.id', action: 'baca', target: 'p1' },
    { id: 'jejak-lama', at: '2026-09-07T00:00:00.000Z', userId: 'u2', userEmail: 'b@x.id', action: 'ubah', target: 'p2' },
  ],
}
const dbJejak = dbPalsu()
await simpanIrisan(dbJejak, jejak)
const muatJejak = await muatIrisan(dbJejak)
assert.equal(muatJejak?.lengkap, true)
assert.deepEqual(muatJejak?.data.audit, jejak.audit, 'urutan jejak audit berubah')
await simpanIrisan(dbJejak, { audit: [jejak.audit[1]] })
assert.equal(dbJejak.isi('jejak_audit').length, 1, 'jejak audit yang dibuang dari batas tertinggal')

const dbLengkapLama = dbPalsu()
await simpanIrisan(dbLengkapLama, jejak)
await dbLengkapLama.collection(KOLEKSI_IRISAN.meta).bulkWrite([{ updateOne: { filter: { _id: 'lab-care' }, update: { $set: { versi: VERSI_IRISAN_LENGKAP } }, upsert: true } }])
const muatLengkapLama = await muatIrisan(dbLengkapLama)
assert.equal(muatLengkapLama?.lengkap, false, 'lengkap-v1 terbaca sebagai jejak audit sudah terpisah')
assert.equal(muatLengkapLama?.data.audit, undefined)
const memoriJejak = { audit: jejak.audit }
pasangIrisan(memoriJejak, muatLengkapLama!.data)
assert.equal(memoriJejak.audit.length, 2, 'muat versi lengkap menghapus jejak audit yang masih di dokumen inti')

// Hasil lab + rujukan (modul labResults) harus selamat dari simpan/muat irisan Mongo — di produksi, bidang
// klinis yang tidak terdaftar di irisan hilang saat restart (kunci 'clinical' dikeluarkan dari dokumen inti).
{
  const rekamHasil = { id: 'lab-1', tenantId: 'praktik', patientId: 'p1', status: 'closed', item: { name: 'Hemoglobin', value: 13.2, collectedAt: '2026-10-09' }, provenance: { source: 'manual-entry', recordedBy: 'd1', recordedAt: '2026-10-10T08:00:00.000Z' }, trail: [{ seq: 1, subjectId: 'lab-1', actorId: 'd1', role: 'clinician', at: '2026-10-10T08:01:00.000Z', from: 'received', to: 'pending_review', prevHash: '0'.repeat(64), hash: 'h1' }], communication: { channel: 'phone', note: 'ok', at: '2026-10-10T08:02:00.000Z', by: 'd1' } }
  const rekamRujukan = { id: 'ref-1', tenantId: 'praktik', patientId: 'p1', status: 'requested', kind: 'lab', reason: 'cek', toFacility: 'Lab X', trail: [] }
  const denganHasil = { clinical: { ...klinis, hasilLab: { 'lab-1': rekamHasil, 'lab-2': { ...rekamHasil, id: 'lab-2', patientId: 'p2', status: 'received', trail: [] } }, rujukanKlinis: { 'ref-1': rekamRujukan } } }
  const dbHasil = dbPalsu()
  await simpanIrisan(dbHasil, denganHasil)
  assert.equal(dbHasil.isi(KOLEKSI_IRISAN.hasilLab).length, 2, 'hasil lab tidak punya dokumen sendiri di irisan')
  assert.equal(dbHasil.isi(KOLEKSI_IRISAN.rujukanKlinis).length, 1, 'rujukan tidak punya dokumen sendiri di irisan')
  assert.equal(dbHasil.isi(KOLEKSI_IRISAN.hasilLab).find((d) => d._id === 'lab-1')?.patientId, 'p1', 'bidang tidak di tingkat atas, tidak bisa diindeks per pasien')
  const muatHasil = await muatIrisan(dbHasil)
  assert.equal(muatHasil?.lengkap, true)
  assert.deepEqual(muatHasil?.data.clinical?.hasilLab?.['lab-1'], rekamHasil, 'hasil lab berubah setelah simpan/muat (jejak audit harus utuh)')
  assert.deepEqual(muatHasil?.data.clinical?.rujukanKlinis, { 'ref-1': rekamRujukan })
  assert.equal(Object.keys(muatHasil?.data.clinical?.hasilLab ?? {}).length, 2)
  // Restart penuh: keadaan memori dipasang ulang dari irisan, lalu disimpan lagi tanpa kehilangan apa pun.
  const memori: Record<string, unknown> = {}
  pasangIrisan(memori, muatHasil!.data)
  await simpanIrisan(dbHasil, memori)
  assert.deepEqual((await muatIrisan(dbHasil))?.data.clinical?.hasilLab?.['lab-1'], rekamHasil, 'hasil lab hilang setelah satu siklus restart')
  // Negatif: simpanan tanpa hasil lab tidak memunculkan bidang kosong (bentuk lama utuh) dan tidak menghapus rekam lain.
  const dbTanpa = dbPalsu()
  await simpanIrisan(dbTanpa, { clinical: klinis })
  const tanpa = (await muatIrisan(dbTanpa))?.data.clinical
  assert.equal('hasilLab' in (tanpa ?? {}), false); assert.equal('rujukanKlinis' in (tanpa ?? {}), false)
  assert.deepEqual(tanpa, klinis)
  // Rekam yang dihapus dari memori ikut hilang dari irisan (tidak ada sisa yatim).
  const { 'lab-2': _hapus, ...sisa } = denganHasil.clinical.hasilLab
  await simpanIrisan(dbHasil, { clinical: { ...denganHasil.clinical, hasilLab: sisa } })
  assert.deepEqual(dbHasil.isi(KOLEKSI_IRISAN.hasilLab).map((d) => d._id), ['lab-1'])
}

console.log('irisanPenyimpanan: dokumen inti tidak lagi menyimpan keadaan')
