// Irisan yang keluar dari satu dokumen MongoDB `app`.
//
// lab-care-v1: log lab, izin, tinjauan, audit, rencana dan laporan cek harian.
// akun-rekam-v1: ditambah akun, dompet, dan rekam klinis per pasien.
// pos-connect-v1: ditambah pos, pengaturan per akun, dan Connect.
// pesanan-v1: ditambah pesanan dan kotak notifikasi per akun.
// transaksi-v1: ditambah buku transaksi.
// seri-v1: ditambah deret denyut, tidur, latihan perangkat, notifikasi denyut,
// dan kiriman webhook per surel.
// profil-v1: ditambah profil kesehatan, ringkasan harian, pengingat, favorit
// olahraga, langganan push, dan token webhook kesehatan.
// lengkap-v1: sisa keadaan (klub, pertemuan, lamaran, masukan, harga,
// keanggotaan kunjungan, langganan kreator, isi ulang, pendapat kedua, dan
// buku validasi) ikut keluar. Larik rekam pasien dan tiap sampel denyut juga
// satu dokumen. Buku validasi hanya ditambah, tidak pernah dihapus.
// tuntas-v1: jejak audit klinis ikut keluar. Berkas
// JSON lokal tetap menyimpan salinan lengkap. Garam Connect dan token webhook
// tidak boleh terganti saat muat.
//
// Penanda versi ditulis paling akhir. Versi lama tetap dapat dimuat, lalu
// simpan berikutnya menaikkannya. Tanpa penanda, dokumen `state` yang lama
// tetap sumber kebenaran.
import { createHash } from 'node:crypto'

export const VERSI_IRISAN_LAMA = 'lab-care-v1'
export const VERSI_IRISAN_AKUN = 'akun-rekam-v1'
export const VERSI_IRISAN_POS = 'pos-connect-v1'
export const VERSI_IRISAN_PESANAN = 'pesanan-v1'
export const VERSI_IRISAN_TRANSAKSI = 'transaksi-v1'
export const VERSI_IRISAN_SERI = 'seri-v1'
export const VERSI_IRISAN_PROFIL = 'profil-v1'
export const VERSI_IRISAN_LENGKAP = 'lengkap-v1'
export const VERSI_IRISAN = 'tuntas-v1'

export const KOLEKSI_IRISAN = {
  labLogs: 'lab_logs',
  labShares: 'lab_shares',
  labReviews: 'lab_reviews',
  labAudit: 'lab_audit',
  carePlans: 'care_plans',
  careReports: 'care_reports',
  users: 'akun',
  wallets: 'dompet',
  rekam: 'rekam_pasien',
  kodeTaut: 'kode_taut',
  tautan: 'tautan_pasien',
  hasilLab: 'hasil_lab',
  rujukanKlinis: 'rujukan_klinis',
  posts: 'pos',
  settings: 'pengaturan',
  connectAkun: 'connect_akun',
  connectLaporan: 'connect_laporan',
  connectGaram: 'connect_garam',
  orders: 'pesanan',
  notifications: 'notifikasi',
  txs: 'transaksi',
  hrSeries: 'seri_denyut',
  sleepSeries: 'seri_tidur',
  deviceWorkouts: 'latihan_perangkat',
  hrNotifications: 'notif_denyut',
  webhookDeliveries: 'kiriman_webhook',
  healthProfiles: 'profil_kesehatan',
  ringkasan: 'ringkasan',
  reminders: 'pengingat',
  sportsFavorites: 'favorit_olahraga',
  pushSubs: 'langganan_push',
  healthWebhookTokens: 'token_webhook',
  creatorSubs: 'langganan_kreator',
  manualTopups: 'isi_ulang',
  applications: 'lamaran',
  validasiLedger: 'buku_validasi',
  feedback: 'masukan',
  meets: 'pertemuan',
  clubs: 'klub',
  secondOpinions: 'pendapat_kedua',
  facilityPrices: 'harga_fasilitas',
  visitMemberships: 'keanggotaan_kunjungan',
  butirRekam: 'butir_rekam',
  rekamObjek: 'rekam_objek',
  hrSamples: 'sampel_denyut',
  audit: 'jejak_audit',
  meta: 'irisan_meta',
} as const

const KUNCI_LAB = ['labLogs', 'labShares', 'labReviews', 'labAudit', 'carePlans', 'careReports'] as const
const KUNCI_AKUN = ['users', 'wallets', 'clinical'] as const
const KUNCI_RUANG = ['posts', 'settings', 'connect'] as const
const KUNCI_PESANAN = ['orders', 'notifications'] as const
const KUNCI_TRANSAKSI = ['txs'] as const
const KUNCI_SERI = ['hrSeries', 'sleepSeries', 'deviceWorkouts', 'hrNotifications', 'webhookDeliveries'] as const
const KUNCI_PROFIL = ['healthProfiles', 'ringkasan', 'reminders', 'sportsFavorites', 'pushSubs', 'healthWebhookTokens'] as const
const KUNCI_SISA = ['creatorSubs', 'manualTopups', 'applications', 'validasiLedger', 'feedback', 'meets', 'clubs', 'secondOpinions', 'facilityPrices', 'visitMemberships', 'audit'] as const
const KUNCI_IRISAN = [...KUNCI_LAB, ...KUNCI_AKUN, ...KUNCI_RUANG, ...KUNCI_PESANAN, ...KUNCI_TRANSAKSI, ...KUNCI_SERI, ...KUNCI_PROFIL, ...KUNCI_SISA] as const
type KunciIrisan = (typeof KUNCI_IRISAN)[number]

export interface LogLabTersimpan {
  log: Record<string, { id: string; tanggal: string; nilai: number }[]>
  diperbaruiPada: string
}

export interface KlinisTersimpan {
  patients: Record<string, unknown>[]
  vitals: Record<string, unknown>
  supportive: Record<string, unknown>
  records: Record<string, unknown>
  education: Record<string, unknown>
  recordEncounters: Record<string, unknown>
  recordHistory: Record<string, unknown>
  encounters: Record<string, unknown>
  tautan: Record<string, unknown>
  kodeTaut: Record<string, unknown>[]
  /** Hasil lab dan rujukan (modul labResults): satu dokumen per rekam; hanya ada bila ada isinya. */
  hasilLab?: Record<string, unknown>
  rujukanKlinis?: Record<string, unknown>
}

export interface IrisanData {
  labLogs: Record<string, LogLabTersimpan>
  labShares: Record<string, unknown>[]
  labReviews: Record<string, unknown>[]
  labAudit: Record<string, unknown>[]
  carePlans: Record<string, unknown>[]
  careReports: Record<string, unknown>[]
  users?: Record<string, unknown>[]
  wallets?: Record<string, number>
  clinical?: KlinisTersimpan
  posts?: Record<string, unknown>[]
  settings?: Record<string, unknown>
  connect?: { akun: Record<string, unknown>; laporan: Record<string, unknown>[]; garam: string }
  orders?: Record<string, unknown>[]
  notifications?: Record<string, unknown[]>
  txs?: Record<string, unknown>[]
  hrSeries?: Record<string, unknown[]>
  sleepSeries?: Record<string, unknown[]>
  deviceWorkouts?: Record<string, unknown[]>
  hrNotifications?: Record<string, unknown[]>
  webhookDeliveries?: Record<string, unknown[]>
  healthProfiles?: Record<string, unknown>
  ringkasan?: Record<string, unknown>
  reminders?: Record<string, unknown[]>
  sportsFavorites?: Record<string, unknown[]>
  pushSubs?: Record<string, unknown[]>
  healthWebhookTokens?: Record<string, string>
  creatorSubs?: Record<string, unknown>[]
  manualTopups?: Record<string, unknown>[]
  applications?: Record<string, unknown>[]
  validasiLedger?: Record<string, unknown>[]
  feedback?: Record<string, unknown>[]
  meets?: Record<string, unknown>[]
  clubs?: Record<string, unknown>[]
  secondOpinions?: Record<string, unknown>[]
  facilityPrices?: Record<string, unknown>[]
  visitMemberships?: Record<string, unknown>
  audit?: Record<string, unknown>[]
}

export interface HasilMuatIrisan {
  data: IrisanData
  lengkap: boolean
}

interface DokumenIrisan {
  _id: string
  urutan?: number
  [kunci: string]: unknown
}

export interface KoleksiIrisan {
  bulkWrite(ops: unknown[]): Promise<unknown>
  deleteMany(filter: unknown): Promise<unknown>
  find(filter?: unknown): { toArray(): Promise<Record<string, unknown>[]> }
  createIndex?(kunci: Record<string, number>): Promise<unknown>
}

export interface DbIrisan {
  collection(nama: string): KoleksiIrisan
}

const INDEKS: Record<string, Record<string, number>[]> = {
  [KOLEKSI_IRISAN.labShares]: [{ pasienEmail: 1 }, { dokterEmail: 1 }],
  [KOLEKSI_IRISAN.labReviews]: [{ pasienEmail: 1 }],
  [KOLEKSI_IRISAN.labAudit]: [{ pasienEmail: 1 }],
  [KOLEKSI_IRISAN.carePlans]: [{ pasienEmail: 1 }, { dokterEmail: 1 }],
  [KOLEKSI_IRISAN.careReports]: [{ pasienEmail: 1 }, { 'laporan.planId': 1 }],
  [KOLEKSI_IRISAN.users]: [{ email: 1 }],
  [KOLEKSI_IRISAN.kodeTaut]: [{ patientId: 1 }],
  [KOLEKSI_IRISAN.tautan]: [{ userId: 1 }],
  [KOLEKSI_IRISAN.hasilLab]: [{ patientId: 1 }, { status: 1 }],
  [KOLEKSI_IRISAN.rujukanKlinis]: [{ patientId: 1 }, { status: 1 }],
  [KOLEKSI_IRISAN.posts]: [{ authorEmail: 1 }],
  [KOLEKSI_IRISAN.connectAkun]: [{ status: 1 }],
  [KOLEKSI_IRISAN.connectLaporan]: [{ pelaporEmail: 1 }, { terlaporEmail: 1 }],
  [KOLEKSI_IRISAN.orders]: [{ userId: 1 }, { status: 1 }],
  [KOLEKSI_IRISAN.notifications]: [{ userId: 1 }],
  [KOLEKSI_IRISAN.txs]: [{ userId: 1 }, { at: 1 }],
  [KOLEKSI_IRISAN.healthWebhookTokens]: [{ email: 1 }],
  [KOLEKSI_IRISAN.butirRekam]: [{ patientId: 1, bidang: 1 }],
  [KOLEKSI_IRISAN.rekamObjek]: [{ patientId: 1 }],
  [KOLEKSI_IRISAN.hrSamples]: [{ email: 1 }],
  [KOLEKSI_IRISAN.applications]: [{ email: 1 }, { status: 1 }],
  [KOLEKSI_IRISAN.feedback]: [{ userId: 1 }],
  [KOLEKSI_IRISAN.meets]: [{ hostEmail: 1 }],
  [KOLEKSI_IRISAN.clubs]: [{ hostEmail: 1 }],
  [KOLEKSI_IRISAN.secondOpinions]: [{ patientEmail: 1 }],
  [KOLEKSI_IRISAN.facilityPrices]: [{ facilityId: 1 }],
  [KOLEKSI_IRISAN.manualTopups]: [{ userId: 1 }, { status: 1 }],
  [KOLEKSI_IRISAN.audit]: [{ userId: 1 }, { at: 1 }],
}

const KOLEKSI_LAB = [
  KOLEKSI_IRISAN.labLogs, KOLEKSI_IRISAN.labShares, KOLEKSI_IRISAN.labReviews,
  KOLEKSI_IRISAN.labAudit, KOLEKSI_IRISAN.carePlans, KOLEKSI_IRISAN.careReports,
] as const

function sidik(teks: string): string {
  return createHash('sha256').update(teks).digest('hex')
}

function kanon(nilai: unknown): string {
  if (Array.isArray(nilai)) return `[${nilai.map(kanon).join(',')}]`
  if (nilai && typeof nilai === 'object') {
    const objek = nilai as Record<string, unknown>
    const kunci = Object.keys(objek).filter((k) => k !== '_id' && k !== 'urutan').sort()
    return `{${kunci.map((k) => `${JSON.stringify(k)}:${kanon(objek[k])}`).join(',')}}`
  }
  return JSON.stringify(nilai) ?? 'null'
}

function salinData<T>(nilai: T): T {
  return JSON.parse(JSON.stringify(nilai))
}

function idUnik(dasar: string, terlihat: Map<string, number>): string {
  const n = terlihat.get(dasar) ?? 0
  terlihat.set(dasar, n + 1)
  return n === 0 ? dasar : `${dasar}:${n}`
}

function dokumenDaftar(butir: unknown[] | undefined, idDasar: (item: Record<string, unknown>) => string): DokumenIrisan[] {
  const terlihat = new Map<string, number>()
  return (butir ?? []).map((item, urutan) => {
    const objek = (item && typeof item === 'object' ? item : { nilai: item }) as Record<string, unknown>
    const dasar = idDasar(objek) || sidik(kanon(objek))
    const { _id: _buang, urutan: _urutan, ...bidang } = objek
    return { ...(salinData(bidang) as Record<string, unknown>), _id: idUnik(dasar, terlihat), urutan }
  })
}

function peta(nilai: unknown): Record<string, unknown> {
  return nilai && typeof nilai === 'object' && !Array.isArray(nilai) ? nilai as Record<string, unknown> : {}
}

export function klinisKosong(): KlinisTersimpan {
  return {
    patients: [], vitals: {}, supportive: {}, records: {}, education: {},
    recordEncounters: {}, recordHistory: {}, encounters: {}, tautan: {}, kodeTaut: [],
  }
}

export function dokumenInti<T extends Record<string, unknown>>(keadaan: T): Omit<T, KunciIrisan> {
  const salinan = { ...keadaan }
  for (const kunci of KUNCI_IRISAN) delete salinan[kunci]
  return salinan
}

const BIDANG_LARIK = ['vitals', 'supportive', 'recordEncounters', 'recordHistory', 'encounters'] as const
const BIDANG_OBJEK: [string, string][] = [['records', 'record'], ['education', 'education']]

function kelompokPasien(clinical: Record<string, unknown>): Map<string, { baris: unknown; index: number }[]> {
  const patients = Array.isArray(clinical.patients) ? clinical.patients as Record<string, unknown>[] : []
  const kelompok = new Map<string, { baris: unknown; index: number }[]>()
  patients.forEach((p, index) => {
    const id = p && typeof p === 'object' && p.id != null && String(p.id) !== ''
      ? String(p.id)
      : `anon:${sidik(kanon(p))}`
    const daftar = kelompok.get(id) ?? []
    daftar.push({ baris: p, index })
    kelompok.set(id, daftar)
  })
  for (const kunci of [...BIDANG_LARIK, ...BIDANG_OBJEK.map(([k]) => k)]) {
    for (const id of Object.keys(peta(clinical[kunci]))) {
      if (!kelompok.has(id)) kelompok.set(id, [])
    }
  }
  return kelompok
}

function susunRekam(clinical: Record<string, unknown> | undefined): DokumenIrisan[] {
  const kelompok = kelompokPasien(clinical ?? {})
  let urutanYatim = 1_000_000
  return [...kelompok.entries()].map(([id, baris]) => ({
    _id: id,
    urutan: baris.length ? Math.min(...baris.map((b) => b.index)) : urutanYatim++,
    pasien: baris.sort((a, b) => a.index - b.index).map((b) => salinData(b.baris)),
  }))
}

function susunButir(clinical: Record<string, unknown> | undefined): DokumenIrisan[] {
  const c = clinical ?? {}
  const terlihat = new Map<string, number>()
  const hasil: DokumenIrisan[] = []
  for (const bidang of BIDANG_LARIK) {
    for (const [patientId, isi] of Object.entries(peta(c[bidang]))) {
      if (!patientId || !Array.isArray(isi)) continue
      isi.forEach((item, urutan) => {
        const objek = (item && typeof item === 'object' ? item : { nilai: item }) as Record<string, unknown>
        const idItem = objek.id != null && String(objek.id) !== '' ? String(objek.id) : sidik(kanon(objek))
        hasil.push({
          _id: idUnik(`${patientId}\n${bidang}\n${idItem}`, terlihat),
          patientId,
          bidang,
          urutan,
          nilai: salinData(objek),
        })
      })
    }
  }
  return hasil
}

function susunObjek(clinical: Record<string, unknown> | undefined): DokumenIrisan[] {
  const c = clinical ?? {}
  const hasil: DokumenIrisan[] = []
  for (const [kunci, bidang] of BIDANG_OBJEK) {
    for (const [patientId, isi] of Object.entries(peta(c[kunci]))) {
      if (!patientId) continue
      hasil.push({ _id: `${patientId}\n${bidang}`, patientId, bidang, nilai: salinData(isi) })
    }
  }
  return hasil
}

export function susunDokumen(keadaan: Record<string, unknown>): Record<string, DokumenIrisan[]> {
  const log = (keadaan.labLogs ?? {}) as Record<string, LogLabTersimpan>
  const labLogs = Object.entries(log).map(([email, isi]) => ({
    _id: email,
    log: salinData(isi.log),
    diperbaruiPada: isi.diperbaruiPada,
  }))
  const wallets = peta(keadaan.wallets)
  const clinical = peta(keadaan.clinical)
  const settings = peta(keadaan.settings)
  const connect = peta(keadaan.connect)
  const garam = typeof connect.garam === 'string' ? connect.garam : ''
  const notifikasi: DokumenIrisan[] = []
  for (const [userId, daftar] of Object.entries(peta(keadaan.notifications))) {
    if (!Array.isArray(daftar)) continue
    daftar.forEach((item, urutan) => {
      const objek = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      const id = String(objek.id ?? '')
      const { _id: _buang, urutan: _urutan, userId: _user, ...bidang } = objek
      notifikasi.push({
        ...(salinData(bidang) as Record<string, unknown>),
        _id: id ? `${userId}\n${id}` : `${userId}\n${sidik(kanon(objek))}`,
        urutan,
        userId,
      })
    })
  }
  return {
    [KOLEKSI_IRISAN.labLogs]: labLogs,
    [KOLEKSI_IRISAN.labShares]: dokumenDaftar(keadaan.labShares as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.labReviews]: dokumenDaftar(keadaan.labReviews as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.labAudit]: dokumenDaftar(keadaan.labAudit as unknown[] | undefined, (i) => sidik(kanon(i))),
    [KOLEKSI_IRISAN.carePlans]: dokumenDaftar(
      keadaan.carePlans as unknown[] | undefined,
      (i) => `${String(i.pasienEmail ?? '')}\n${String(i.dokterEmail ?? '')}\n${String(i.dibuat ?? '')}`,
    ),
    [KOLEKSI_IRISAN.careReports]: dokumenDaftar(keadaan.careReports as unknown[] | undefined, (i) => {
      const laporan = i.laporan as { id?: unknown } | undefined
      const id = laporan && typeof laporan.id === 'string' ? laporan.id : ''
      return /^[A-Za-z0-9_-]{8,80}$/.test(id) ? id : sidik(kanon(i))
    }),
    [KOLEKSI_IRISAN.users]: dokumenDaftar(keadaan.users as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.wallets]: Object.entries(wallets).map(([id, saldo]) => ({ _id: id, saldo: Number(saldo) })),
    [KOLEKSI_IRISAN.rekam]: susunRekam(clinical),
    [KOLEKSI_IRISAN.kodeTaut]: dokumenDaftar(clinical.kodeTaut as unknown[] | undefined, (i) => String(i.hash ?? '')),
    [KOLEKSI_IRISAN.tautan]: Object.entries(peta(clinical.tautan)).map(([id, isi]) => ({
      _id: id,
      ...(salinData(isi) as Record<string, unknown>),
    })),
    [KOLEKSI_IRISAN.hasilLab]: dokumenRekamPerId(clinical.hasilLab),
    [KOLEKSI_IRISAN.rujukanKlinis]: dokumenRekamPerId(clinical.rujukanKlinis),
    [KOLEKSI_IRISAN.posts]: dokumenDaftar(keadaan.posts as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.settings]: Object.entries(settings).map(([id, nilai]) => ({ _id: id, nilai: salinData(nilai) })),
    [KOLEKSI_IRISAN.connectAkun]: Object.entries(peta(connect.akun)).map(([email, isi]) => ({
      _id: email,
      ...(salinData(isi) as Record<string, unknown>),
    })),
    [KOLEKSI_IRISAN.connectLaporan]: dokumenDaftar(connect.laporan as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.connectGaram]: garam.length >= 32 ? [{ _id: 'garam', nilai: garam }] : [],
    [KOLEKSI_IRISAN.orders]: dokumenDaftar(keadaan.orders as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.notifications]: notifikasi,
    [KOLEKSI_IRISAN.txs]: dokumenDaftar(keadaan.txs as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.hrSamples]: dokumenSampel(keadaan.hrSeries),
    [KOLEKSI_IRISAN.sleepSeries]: dokumenPeta(keadaan.sleepSeries, 'malam'),
    [KOLEKSI_IRISAN.deviceWorkouts]: dokumenPeta(keadaan.deviceWorkouts, 'sesi'),
    [KOLEKSI_IRISAN.hrNotifications]: dokumenPeta(keadaan.hrNotifications, 'butir'),
    [KOLEKSI_IRISAN.webhookDeliveries]: dokumenPeta(keadaan.webhookDeliveries, 'kiriman'),
    [KOLEKSI_IRISAN.healthProfiles]: dokumenNilai(keadaan.healthProfiles),
    [KOLEKSI_IRISAN.ringkasan]: dokumenNilai(keadaan.ringkasan),
    [KOLEKSI_IRISAN.reminders]: dokumenPeta(keadaan.reminders, 'butir'),
    [KOLEKSI_IRISAN.sportsFavorites]: dokumenPeta(keadaan.sportsFavorites, 'butir'),
    [KOLEKSI_IRISAN.pushSubs]: dokumenPeta(keadaan.pushSubs, 'butir'),
    [KOLEKSI_IRISAN.healthWebhookTokens]: dokumenToken(keadaan.healthWebhookTokens),
    [KOLEKSI_IRISAN.creatorSubs]: dokumenDaftar(keadaan.creatorSubs as unknown[] | undefined, (i) => `${String(i.subscriberId ?? '')}\n${String(i.authorEmail ?? '')}`),
    [KOLEKSI_IRISAN.manualTopups]: dokumenDaftar(keadaan.manualTopups as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.applications]: dokumenDaftar(keadaan.applications as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.validasiLedger]: dokumenLedger(keadaan.validasiLedger),
    [KOLEKSI_IRISAN.feedback]: dokumenDaftar(keadaan.feedback as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.meets]: dokumenDaftar(keadaan.meets as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.clubs]: dokumenDaftar(keadaan.clubs as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.secondOpinions]: dokumenDaftar(keadaan.secondOpinions as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.facilityPrices]: dokumenDaftar(keadaan.facilityPrices as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.visitMemberships]: dokumenNilai(keadaan.visitMemberships),
    [KOLEKSI_IRISAN.audit]: dokumenDaftar(keadaan.audit as unknown[] | undefined, (i) => String(i.id ?? '')),
    [KOLEKSI_IRISAN.butirRekam]: susunButir(peta(keadaan.clinical)),
    [KOLEKSI_IRISAN.rekamObjek]: susunObjek(peta(keadaan.clinical)),
  }
}

/** Satu dokumen per rekam (id = _id) dengan bidangnya di tingkat atas agar bisa diindeks per pasien/status. */
function dokumenRekamPerId(nilai: unknown): DokumenIrisan[] {
  return Object.entries(peta(nilai)).flatMap(([id, isi]) => (
    id && isi && typeof isi === 'object' && !Array.isArray(isi) ? [{ ...(salinData(isi) as Record<string, unknown>), _id: id }] : []
  ))
}

function dokumenSampel(nilai: unknown): DokumenIrisan[] {
  const terlihat = new Map<string, number>()
  const hasil: DokumenIrisan[] = []
  for (const [email, isi] of Object.entries(peta(nilai))) {
    if (!email || !Array.isArray(isi)) continue
    isi.forEach((sampel, urutan) => {
      const objek = (sampel && typeof sampel === 'object' ? sampel : { nilai: sampel }) as Record<string, unknown>
      const dasar = `${email}\n${String(objek.t ?? '')}\n${String(objek.kind ?? '')}`
      hasil.push({ _id: idUnik(dasar, terlihat), email, urutan, sampel: salinData(objek) })
    })
  }
  return hasil
}

function dokumenLedger(nilai: unknown): DokumenIrisan[] {
  if (!Array.isArray(nilai)) return []
  return nilai.flatMap((item) => {
    if (!item || typeof item !== 'object' || !Number.isInteger((item as { urutan?: unknown }).urutan)) return []
    const c = item as Record<string, unknown>
    return [{ _id: String(c.urutan), urutan: c.urutan as number, isi: salinData(c.isi), sidikSebelum: c.sidikSebelum, sidik: c.sidik }]
  })
}

function dokumenNilai(nilai: unknown): DokumenIrisan[] {
  return Object.entries(peta(nilai)).flatMap(([id, isi]) => (id ? [{ _id: id, nilai: salinData(isi) }] : []))
}

function dokumenToken(nilai: unknown): DokumenIrisan[] {
  return Object.entries(peta(nilai)).flatMap(([token, email]) => (
    token && typeof email === 'string' && email ? [{ _id: token, email }] : []
  ))
}

function dokumenPeta(nilai: unknown, bidang: string): DokumenIrisan[] {
  return Object.entries(peta(nilai)).flatMap(([email, isi]) => {
    if (!email || !Array.isArray(isi)) return []
    return [{ _id: email, [bidang]: salinData(isi) }]
  })
}

function tanpaMeta(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id: _buang, urutan: _urutan, ...bidang } = doc
  return bidang
}

function urut(dokumen: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...dokumen].sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0))
}

function gabungLab(koleksi: Record<string, Record<string, unknown>[]>): IrisanData {
  const labLogs: Record<string, LogLabTersimpan> = {}
  for (const doc of koleksi[KOLEKSI_IRISAN.labLogs] ?? []) {
    const email = String(doc._id ?? '')
    if (!email) continue
    labLogs[email] = { log: (doc.log ?? {}) as LogLabTersimpan['log'], diperbaruiPada: String(doc.diperbaruiPada ?? '') }
  }
  return {
    labLogs,
    labShares: urut(koleksi[KOLEKSI_IRISAN.labShares] ?? []).map(tanpaMeta),
    labReviews: urut(koleksi[KOLEKSI_IRISAN.labReviews] ?? []).map(tanpaMeta),
    labAudit: urut(koleksi[KOLEKSI_IRISAN.labAudit] ?? []).map(tanpaMeta),
    carePlans: urut(koleksi[KOLEKSI_IRISAN.carePlans] ?? []).map(tanpaMeta),
    careReports: urut(koleksi[KOLEKSI_IRISAN.careReports] ?? []).map(tanpaMeta),
  }
}

function rekamPerId(dokumen: Record<string, unknown>[]): Record<string, unknown> {
  const hasil: Record<string, unknown> = {}
  for (const doc of dokumen) {
    const id = String(doc._id ?? '')
    if (id) hasil[id] = tanpaMeta(doc)
  }
  return hasil
}

function gabungKlinis(koleksi: Record<string, Record<string, unknown>[]>): KlinisTersimpan {
  const klinis = klinisKosong()
  const pakaiButir = Object.prototype.hasOwnProperty.call(koleksi, KOLEKSI_IRISAN.butirRekam)
  const pakaiObjek = Object.prototype.hasOwnProperty.call(koleksi, KOLEKSI_IRISAN.rekamObjek)
  const rekam = [...(koleksi[KOLEKSI_IRISAN.rekam] ?? [])].sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0) || String(a._id).localeCompare(String(b._id)))
  for (const doc of rekam) {
    const id = String(doc._id ?? '')
    if (!id) continue
    for (const baris of (doc.pasien as unknown[] | undefined) ?? []) {
      if (baris && typeof baris === 'object') klinis.patients.push(baris as Record<string, unknown>)
    }
    const isi = (kunci: string, tujuan: Record<string, unknown>) => {
      if (kunci in doc && doc[kunci] != null) tujuan[id] = doc[kunci] as unknown
    }
    if (!pakaiButir) {
      isi('vitals', klinis.vitals)
      isi('supportive', klinis.supportive)
      isi('recordEncounters', klinis.recordEncounters)
      isi('recordHistory', klinis.recordHistory)
      isi('encounters', klinis.encounters)
    }
    if (!pakaiObjek) {
      isi('record', klinis.records)
      isi('education', klinis.education)
    }
  }
  if (pakaiButir) {
    const butir = [...(koleksi[KOLEKSI_IRISAN.butirRekam] ?? [])].sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0) || String(a._id).localeCompare(String(b._id)))
    for (const doc of butir) {
      const id = String(doc.patientId ?? '')
      const bidang = String(doc.bidang ?? '')
      const tujuan = bidang === 'vitals' ? klinis.vitals : bidang === 'supportive' ? klinis.supportive : bidang === 'recordEncounters' ? klinis.recordEncounters : bidang === 'recordHistory' ? klinis.recordHistory : bidang === 'encounters' ? klinis.encounters : null
      if (!id || !tujuan) continue
      const daftar = Array.isArray(tujuan[id]) ? tujuan[id] as unknown[] : []
      daftar.push(doc.nilai)
      tujuan[id] = daftar
    }
  }
  if (pakaiObjek) {
    for (const doc of koleksi[KOLEKSI_IRISAN.rekamObjek] ?? []) {
      const id = String(doc.patientId ?? '')
      const bidang = String(doc.bidang ?? '')
      if (!id) continue
      if (bidang === 'record') klinis.records[id] = doc.nilai
      if (bidang === 'education') klinis.education[id] = doc.nilai
    }
  }
  for (const doc of koleksi[KOLEKSI_IRISAN.tautan] ?? []) {
    const id = String(doc._id ?? '')
    if (id) klinis.tautan[id] = tanpaMeta(doc)
  }
  klinis.kodeTaut = urut(koleksi[KOLEKSI_IRISAN.kodeTaut] ?? []).map(tanpaMeta)
  // Bidang opsional: hanya dipasang bila ada isinya, sehingga simpanan lama tanpa koleksi ini tidak berubah bentuk.
  const hasilLab = rekamPerId(koleksi[KOLEKSI_IRISAN.hasilLab] ?? [])
  if (Object.keys(hasilLab).length) klinis.hasilLab = hasilLab
  const rujukanKlinis = rekamPerId(koleksi[KOLEKSI_IRISAN.rujukanKlinis] ?? [])
  if (Object.keys(rujukanKlinis).length) klinis.rujukanKlinis = rujukanKlinis
  return klinis
}

function gabungAkun(koleksi: Record<string, Record<string, unknown>[]>): Pick<IrisanData, 'users' | 'wallets' | 'clinical'> {
  const wallets: Record<string, number> = {}
  for (const doc of koleksi[KOLEKSI_IRISAN.wallets] ?? []) {
    const id = String(doc._id ?? '')
    if (id) wallets[id] = Number(doc.saldo)
  }
  return {
    users: urut(koleksi[KOLEKSI_IRISAN.users] ?? []).map(tanpaMeta),
    wallets,
    clinical: gabungKlinis(koleksi),
  }
}

function gabungRuang(koleksi: Record<string, Record<string, unknown>[]>): Pick<IrisanData, 'posts' | 'settings' | 'connect'> {
  const settings: Record<string, unknown> = {}
  for (const doc of koleksi[KOLEKSI_IRISAN.settings] ?? []) {
    const id = String(doc._id ?? '')
    if (id) settings[id] = doc.nilai
  }
  const akun: Record<string, unknown> = {}
  for (const doc of koleksi[KOLEKSI_IRISAN.connectAkun] ?? []) {
    const email = String(doc._id ?? '')
    if (!email) continue
    const isi = tanpaMeta(doc)
    if (!isi.email) isi.email = email
    akun[email] = isi
  }
  const garamDoc = (koleksi[KOLEKSI_IRISAN.connectGaram] ?? []).find((d) => d._id === 'garam')
  return {
    posts: urut(koleksi[KOLEKSI_IRISAN.posts] ?? []).map(tanpaMeta),
    settings,
    connect: {
      akun,
      laporan: urut(koleksi[KOLEKSI_IRISAN.connectLaporan] ?? []).map(tanpaMeta),
      garam: typeof garamDoc?.nilai === 'string' ? garamDoc.nilai : '',
    },
  }
}

function gabungPeta(dokumen: Record<string, unknown>[], bidang: string): Record<string, unknown[]> {
  const hasil: Record<string, unknown[]> = {}
  for (const doc of dokumen) {
    const email = String(doc._id ?? '')
    if (!email) continue
    hasil[email] = Array.isArray(doc[bidang]) ? doc[bidang] as unknown[] : []
  }
  return hasil
}

function gabungSeri(koleksi: Record<string, Record<string, unknown>[]>): Pick<IrisanData, 'hrSeries' | 'sleepSeries' | 'deviceWorkouts' | 'hrNotifications' | 'webhookDeliveries'> {
  return {
    hrSeries: gabungPeta(koleksi[KOLEKSI_IRISAN.hrSeries] ?? [], 'sampel'),
    sleepSeries: gabungPeta(koleksi[KOLEKSI_IRISAN.sleepSeries] ?? [], 'malam'),
    deviceWorkouts: gabungPeta(koleksi[KOLEKSI_IRISAN.deviceWorkouts] ?? [], 'sesi'),
    hrNotifications: gabungPeta(koleksi[KOLEKSI_IRISAN.hrNotifications] ?? [], 'butir'),
    webhookDeliveries: gabungPeta(koleksi[KOLEKSI_IRISAN.webhookDeliveries] ?? [], 'kiriman'),
  }
}

function gabungNilai(dokumen: Record<string, unknown>[]): Record<string, unknown> {
  const hasil: Record<string, unknown> = {}
  for (const doc of dokumen) {
    const id = String(doc._id ?? '')
    if (id) hasil[id] = doc.nilai
  }
  return hasil
}

function gabungToken(dokumen: Record<string, unknown>[]): Record<string, string> {
  const hasil: Record<string, string> = {}
  for (const doc of dokumen) {
    const token = String(doc._id ?? '')
    if (token && typeof doc.email === 'string' && doc.email) hasil[token] = doc.email
  }
  return hasil
}

function gabungSampel(dokumen: Record<string, unknown>[]): Record<string, unknown[]> {
  const hasil: Record<string, unknown[]> = {}
  const urutSampel = [...dokumen].sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0) || String(a._id).localeCompare(String(b._id)))
  for (const doc of urutSampel) {
    const email = String(doc.email ?? '')
    if (!email) continue
    ;(hasil[email] ??= []).push(doc.sampel)
  }
  return hasil
}

function gabungLedger(dokumen: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...dokumen]
    .sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0))
    .map((doc) => ({ urutan: doc.urutan, isi: doc.isi, sidikSebelum: doc.sidikSebelum, sidik: doc.sidik }))
}

function gabungSisa(koleksi: Record<string, Record<string, unknown>[]>): Pick<IrisanData, 'creatorSubs' | 'manualTopups' | 'applications' | 'validasiLedger' | 'feedback' | 'meets' | 'clubs' | 'secondOpinions' | 'facilityPrices' | 'visitMemberships' | 'audit'> {
  return {
    creatorSubs: urut(koleksi[KOLEKSI_IRISAN.creatorSubs] ?? []).map(tanpaMeta),
    manualTopups: urut(koleksi[KOLEKSI_IRISAN.manualTopups] ?? []).map(tanpaMeta),
    applications: urut(koleksi[KOLEKSI_IRISAN.applications] ?? []).map(tanpaMeta),
    validasiLedger: gabungLedger(koleksi[KOLEKSI_IRISAN.validasiLedger] ?? []),
    feedback: urut(koleksi[KOLEKSI_IRISAN.feedback] ?? []).map(tanpaMeta),
    meets: urut(koleksi[KOLEKSI_IRISAN.meets] ?? []).map(tanpaMeta),
    clubs: urut(koleksi[KOLEKSI_IRISAN.clubs] ?? []).map(tanpaMeta),
    secondOpinions: urut(koleksi[KOLEKSI_IRISAN.secondOpinions] ?? []).map(tanpaMeta),
    facilityPrices: urut(koleksi[KOLEKSI_IRISAN.facilityPrices] ?? []).map(tanpaMeta),
    visitMemberships: gabungNilai(koleksi[KOLEKSI_IRISAN.visitMemberships] ?? []),
    audit: urut(koleksi[KOLEKSI_IRISAN.audit] ?? []).map(tanpaMeta),
  }
}

function gabungProfil(koleksi: Record<string, Record<string, unknown>[]>): Pick<IrisanData, 'healthProfiles' | 'ringkasan' | 'reminders' | 'sportsFavorites' | 'pushSubs' | 'healthWebhookTokens'> {
  return {
    healthProfiles: gabungNilai(koleksi[KOLEKSI_IRISAN.healthProfiles] ?? []),
    ringkasan: gabungNilai(koleksi[KOLEKSI_IRISAN.ringkasan] ?? []),
    reminders: gabungPeta(koleksi[KOLEKSI_IRISAN.reminders] ?? [], 'butir'),
    sportsFavorites: gabungPeta(koleksi[KOLEKSI_IRISAN.sportsFavorites] ?? [], 'butir'),
    pushSubs: gabungPeta(koleksi[KOLEKSI_IRISAN.pushSubs] ?? [], 'butir'),
    healthWebhookTokens: gabungToken(koleksi[KOLEKSI_IRISAN.healthWebhookTokens] ?? []),
  }
}

function gabungTransaksi(koleksi: Record<string, Record<string, unknown>[]>): Pick<IrisanData, 'txs'> {
  return { txs: urut(koleksi[KOLEKSI_IRISAN.txs] ?? []).map(tanpaMeta) }
}

function gabungPesanan(koleksi: Record<string, Record<string, unknown>[]>): Pick<IrisanData, 'orders' | 'notifications'> {
  const notifications: Record<string, unknown[]> = {}
  const butir = [...(koleksi[KOLEKSI_IRISAN.notifications] ?? [])].sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0))
  for (const doc of butir) {
    const userId = String(doc.userId ?? '')
    if (!userId) continue
    const isi = tanpaMeta(doc)
    delete isi.userId
    ;(notifications[userId] ??= []).push(isi)
  }
  return {
    orders: urut(koleksi[KOLEKSI_IRISAN.orders] ?? []).map(tanpaMeta),
    notifications,
  }
}

export function gabungDokumen(koleksi: Record<string, Record<string, unknown>[]>): IrisanData {
  const dasar = { ...gabungLab(koleksi), ...gabungAkun(koleksi), ...gabungRuang(koleksi), ...gabungPesanan(koleksi), ...gabungTransaksi(koleksi), ...gabungSeri(koleksi), ...gabungProfil(koleksi), ...gabungSisa(koleksi) }
  if (Object.prototype.hasOwnProperty.call(koleksi, KOLEKSI_IRISAN.hrSamples)) dasar.hrSeries = gabungSampel(koleksi[KOLEKSI_IRISAN.hrSamples] ?? [])
  if (Object.prototype.hasOwnProperty.call(koleksi, KOLEKSI_IRISAN.butirRekam) || Object.prototype.hasOwnProperty.call(koleksi, KOLEKSI_IRISAN.rekamObjek)) dasar.clinical = gabungKlinis(koleksi)
  return dasar
}

export function pasangIrisan(keadaan: Record<string, unknown>, irisan: IrisanData): void {
  keadaan.labLogs = irisan.labLogs
  keadaan.labShares = irisan.labShares
  keadaan.labReviews = irisan.labReviews
  keadaan.labAudit = irisan.labAudit
  keadaan.carePlans = irisan.carePlans
  keadaan.careReports = irisan.careReports
  if (irisan.users) keadaan.users = irisan.users
  if (irisan.wallets) keadaan.wallets = irisan.wallets
  if (irisan.clinical) keadaan.clinical = irisan.clinical
  if (irisan.posts) keadaan.posts = irisan.posts
  if (irisan.settings) keadaan.settings = irisan.settings
  if (irisan.connect) keadaan.connect = irisan.connect
  if (irisan.orders) keadaan.orders = irisan.orders
  if (irisan.notifications) keadaan.notifications = irisan.notifications
  if (irisan.txs) keadaan.txs = irisan.txs
  if (irisan.hrSeries) keadaan.hrSeries = irisan.hrSeries
  if (irisan.sleepSeries) keadaan.sleepSeries = irisan.sleepSeries
  if (irisan.deviceWorkouts) keadaan.deviceWorkouts = irisan.deviceWorkouts
  if (irisan.hrNotifications) keadaan.hrNotifications = irisan.hrNotifications
  if (irisan.webhookDeliveries) keadaan.webhookDeliveries = irisan.webhookDeliveries
  if (irisan.healthProfiles) keadaan.healthProfiles = irisan.healthProfiles
  if (irisan.ringkasan) keadaan.ringkasan = irisan.ringkasan
  if (irisan.reminders) keadaan.reminders = irisan.reminders
  if (irisan.sportsFavorites) keadaan.sportsFavorites = irisan.sportsFavorites
  if (irisan.pushSubs) keadaan.pushSubs = irisan.pushSubs
  if (irisan.healthWebhookTokens) keadaan.healthWebhookTokens = irisan.healthWebhookTokens
  if (irisan.creatorSubs) keadaan.creatorSubs = irisan.creatorSubs
  if (irisan.manualTopups) keadaan.manualTopups = irisan.manualTopups
  if (irisan.applications) keadaan.applications = irisan.applications
  if (irisan.validasiLedger) keadaan.validasiLedger = irisan.validasiLedger
  if (irisan.feedback) keadaan.feedback = irisan.feedback
  if (irisan.meets) keadaan.meets = irisan.meets
  if (irisan.clubs) keadaan.clubs = irisan.clubs
  if (irisan.secondOpinions) keadaan.secondOpinions = irisan.secondOpinions
  if (irisan.facilityPrices) keadaan.facilityPrices = irisan.facilityPrices
  if (irisan.visitMemberships) keadaan.visitMemberships = irisan.visitMemberships
  if (irisan.audit) keadaan.audit = irisan.audit
}

async function tulisTambah(col: KoleksiIrisan, dokumen: DokumenIrisan[]): Promise<void> {
  if (!dokumen.length) return
  await col.bulkWrite(dokumen.map((d) => {
    const { _id, ...bidang } = d
    return { updateOne: { filter: { _id }, update: { $set: bidang }, upsert: true } }
  }))
}

async function tulisKoleksi(col: KoleksiIrisan, dokumen: DokumenIrisan[]): Promise<void> {
  const ids = dokumen.map((d) => d._id)
  if (dokumen.length) {
    await col.bulkWrite(dokumen.map((d) => {
      const { _id, ...bidang } = d
      return { updateOne: { filter: { _id }, update: { $set: bidang }, upsert: true } }
    }))
  }
  await col.deleteMany({ _id: { $nin: ids } })
}

/** Tulis koleksi dulu, penanda versi paling akhir. */
export async function simpanIrisan(db: DbIrisan, keadaan: Record<string, unknown>, kini = new Date()): Promise<void> {
  const dokumen = susunDokumen(keadaan)
  for (const [nama, isi] of Object.entries(dokumen)) {
    if (nama === KOLEKSI_IRISAN.validasiLedger) {
      if (Array.isArray(keadaan.validasiLedger)) await tulisTambah(db.collection(nama), isi)
      continue
    }
    await tulisKoleksi(db.collection(nama), isi)
  }
  await tulisKoleksi(db.collection(KOLEKSI_IRISAN.meta), [{ _id: 'lab-care', urutan: 0, versi: VERSI_IRISAN, at: kini.toISOString() }])
}

async function bacaKoleksi(db: DbIrisan, nama: string): Promise<Record<string, unknown>[]> {
  return db.collection(nama).find({}).toArray()
}

export async function muatIrisan(db: DbIrisan): Promise<HasilMuatIrisan | null> {
  const meta = await bacaKoleksi(db, KOLEKSI_IRISAN.meta)
  const penanda = meta.find((d) => d._id === 'lab-care') ?? meta[0]
  if (!penanda) return null
  const versi = String(penanda.versi ?? '')
  if (versi !== VERSI_IRISAN && versi !== VERSI_IRISAN_LENGKAP && versi !== VERSI_IRISAN_PROFIL && versi !== VERSI_IRISAN_SERI && versi !== VERSI_IRISAN_TRANSAKSI && versi !== VERSI_IRISAN_PESANAN && versi !== VERSI_IRISAN_POS && versi !== VERSI_IRISAN_AKUN && versi !== VERSI_IRISAN_LAMA) {
    throw new Error(`irisan versi ${versi} tidak dikenal`)
  }
  const koleksi: Record<string, Record<string, unknown>[]> = {}
  for (const nama of KOLEKSI_LAB) koleksi[nama] = await bacaKoleksi(db, nama)
  const lab = gabungLab(koleksi)
  if (versi === VERSI_IRISAN_LAMA) return { data: lab, lengkap: false }
  for (const nama of [KOLEKSI_IRISAN.users, KOLEKSI_IRISAN.wallets, KOLEKSI_IRISAN.rekam, KOLEKSI_IRISAN.kodeTaut, KOLEKSI_IRISAN.tautan]) {
    koleksi[nama] = await bacaKoleksi(db, nama)
  }
  const akun = { ...lab, ...gabungAkun(koleksi) }
  if (versi === VERSI_IRISAN_AKUN) return { data: akun, lengkap: false }
  for (const nama of [KOLEKSI_IRISAN.posts, KOLEKSI_IRISAN.settings, KOLEKSI_IRISAN.connectAkun, KOLEKSI_IRISAN.connectLaporan, KOLEKSI_IRISAN.connectGaram]) {
    koleksi[nama] = await bacaKoleksi(db, nama)
  }
  const ruang = { ...akun, ...gabungRuang(koleksi) }
  if (versi === VERSI_IRISAN_POS) return { data: ruang, lengkap: false }
  for (const nama of [KOLEKSI_IRISAN.orders, KOLEKSI_IRISAN.notifications]) koleksi[nama] = await bacaKoleksi(db, nama)
  const pesanan = { ...ruang, ...gabungPesanan(koleksi) }
  if (versi === VERSI_IRISAN_PESANAN) return { data: pesanan, lengkap: false }
  koleksi[KOLEKSI_IRISAN.txs] = await bacaKoleksi(db, KOLEKSI_IRISAN.txs)
  const transaksi = { ...pesanan, ...gabungTransaksi(koleksi) }
  if (versi === VERSI_IRISAN_TRANSAKSI) return { data: transaksi, lengkap: false }
  for (const nama of [KOLEKSI_IRISAN.hrSeries, KOLEKSI_IRISAN.sleepSeries, KOLEKSI_IRISAN.deviceWorkouts, KOLEKSI_IRISAN.hrNotifications, KOLEKSI_IRISAN.webhookDeliveries]) {
    koleksi[nama] = await bacaKoleksi(db, nama)
  }
  const seri = { ...transaksi, ...gabungSeri(koleksi) }
  if (versi === VERSI_IRISAN_SERI) return { data: seri, lengkap: false }
  for (const nama of [KOLEKSI_IRISAN.healthProfiles, KOLEKSI_IRISAN.ringkasan, KOLEKSI_IRISAN.reminders, KOLEKSI_IRISAN.sportsFavorites, KOLEKSI_IRISAN.pushSubs, KOLEKSI_IRISAN.healthWebhookTokens]) {
    koleksi[nama] = await bacaKoleksi(db, nama)
  }
  const profil = { ...seri, ...gabungProfil(koleksi) }
  if (versi === VERSI_IRISAN_PROFIL) return { data: profil, lengkap: false }
  for (const nama of [KOLEKSI_IRISAN.creatorSubs, KOLEKSI_IRISAN.manualTopups, KOLEKSI_IRISAN.applications, KOLEKSI_IRISAN.validasiLedger, KOLEKSI_IRISAN.feedback, KOLEKSI_IRISAN.meets, KOLEKSI_IRISAN.clubs, KOLEKSI_IRISAN.secondOpinions, KOLEKSI_IRISAN.facilityPrices, KOLEKSI_IRISAN.visitMemberships, KOLEKSI_IRISAN.butirRekam, KOLEKSI_IRISAN.rekamObjek, KOLEKSI_IRISAN.hrSamples, KOLEKSI_IRISAN.hasilLab, KOLEKSI_IRISAN.rujukanKlinis]) {
    koleksi[nama] = await bacaKoleksi(db, nama)
  }
  const sisa = { ...profil, ...gabungSisa(koleksi) }
  sisa.hrSeries = gabungSampel(koleksi[KOLEKSI_IRISAN.hrSamples] ?? [])
  sisa.clinical = gabungKlinis(koleksi)
  delete sisa.audit
  if (versi === VERSI_IRISAN_LENGKAP) return { data: sisa, lengkap: false }
  koleksi[KOLEKSI_IRISAN.audit] = await bacaKoleksi(db, KOLEKSI_IRISAN.audit)
  sisa.audit = urut(koleksi[KOLEKSI_IRISAN.audit] ?? []).map(tanpaMeta)
  return { data: sisa, lengkap: true }
}

export async function pastikanIndeksIrisan(db: DbIrisan): Promise<void> {
  for (const [nama, daftar] of Object.entries(INDEKS)) {
    const col = db.collection(nama)
    if (!col.createIndex) continue
    for (const kunci of daftar) await col.createIndex(kunci)
  }
}
