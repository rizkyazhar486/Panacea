import { createHash, randomBytes } from 'node:crypto'
import type { Role } from './store.js'

// ─────────────────────────────────────────────────────────────────────────────
// Connect — verifikasi, kredit kepercayaan, pelaporan dan pemblokiran.
//
// Berkas ini memegang data paling sensitif di seluruh aplikasi, jadi tiga
// keputusan berikut dibuat sadar dan ditulis di sini agar tidak diubah tanpa
// memahami akibatnya.
//
// 1. NIK TIDAK PERNAH DISIMPAN UTUH.
//    Yang disimpan hanya sidik (hash) ber-garam dan empat digit terakhir.
//    Tujuan NIK di sini adalah "satu orang, satu akun" — dan sidik memenuhi
//    tujuan itu sepenuhnya: NIK yang sama selalu menghasilkan sidik yang sama,
//    jadi pendaftaran ganda tetap ketahuan. Yang hilang hanyalah kemampuan
//    membaca kembali nomornya, dan itu justru intinya: basis data yang bocor
//    tidak bisa memberi nomor kependudukan siapa pun kepada penyerang.
//    Verifikasi identitas dikerjakan lewat selfie berpose dan pencocokan media
//    sosial, bukan lewat menatap angka NIK.
//
// 2. AGAMA DAN ORIENTASI SEKSUAL TIDAK PERNAH KELUAR KE PENGGUNA LAIN.
//    Keduanya adalah data pribadi spesifik menurut UU PDP 27/2022. Di
//    Indonesia, daftar yang menautkan nama, alamat dan orientasi seksual bukan
//    sekadar masalah privasi — ia bisa membahayakan keselamatan orang. Karena
//    itu keduanya dipakai HANYA di dalam mesin pencocokan di server, tidak
//    pernah ikut dalam profil publik, hasil pencarian, atau kartu deck.
//
// 3. PENGHAPUSAN OTOMATIS TIDAK PERNAH DIAM-DIAM.
//    Akun di bawah ambang dijadwalkan dihapus, bukan langsung dilenyapkan,
//    dan alasannya tercatat. Data yang hilang tanpa jejak tidak bisa
//    dipertanggungjawabkan bila keputusannya ternyata keliru.
// ─────────────────────────────────────────────────────────────────────────────

export type StatusVerifikasi = 'belum' | 'menunggu' | 'terverifikasi' | 'ditolak'
export type Preferensi = 'straight' | 'gay' | 'lesbian' | 'biseksual'

/** Ambang kredit kepercayaan. Ditetapkan pemilik, bukan ditebak sistem. */
export const KREDIT_AWAL = 100
export const KREDIT_BAHAYA = 80
export const KREDIT_HAPUS = 70

export interface DataVerifikasi {
  nama: string
  tempatLahir: string
  tanggalLahir: string        // yyyy-mm-dd
  umur: number
  pekerjaan: string
  status: string              // lajang / menikah / dst
  preferensi: Preferensi
  agama: string
  pendidikanTerakhir: string
  tempatTinggal: string
  /** Tautan profil media sosial untuk dicocokkan pemilik. */
  sosialMedia: string[]
  /** URL selfie berpose (jari membentuk huruf P). */
  selfieUrl: string
  /** Empat digit terakhir NIK — untuk pemilik mencocokkan, bukan menyimpan. */
  nikAkhir: string
  /** Sidik NIK ber-garam. Tidak bisa dikembalikan ke nomor aslinya. */
  nikSidik: string
}

export interface Pelanggaran {
  id: string
  pada: string
  alasan: string
  poin: number                // ditentukan pemilik
  olehEmail: string
}

export interface Laporan {
  id: string
  pada: string
  pelaporEmail: string
  terlaporEmail: string
  alasan: string
  catatan?: string
  status: 'menunggu' | 'ditindak' | 'ditolak'
  /** Diisi saat pemilik memutuskan. */
  putusan?: { pada: string; poin: number; catatan?: string }
}

export interface AkunConnect {
  email: string
  status: StatusVerifikasi
  data?: DataVerifikasi
  alasanTolak?: string
  kredit: number
  pelanggaran: Pelanggaran[]
  /** Radius pencarian dalam km, ditentukan pengguna sendiri. */
  radiusKm: number
  /** Email yang diblokir oleh akun ini. Berlaku di semua perangkat. */
  diblokir: string[]
  /** Dijadwalkan hapus karena kredit di bawah ambang. */
  hapusPada?: string
  dibuat: string
}

interface DbConnect {
  akun: Record<string, AkunConnect>
  laporan: Laporan[]
  garam: string
}

const db: DbConnect = { akun: {}, laporan: [], garam: randomBytes(32).toString('hex') }

/** Muat keadaan dari penyimpanan luar (dipanggil store utama saat boot). */
export function muatConnect(data: Partial<DbConnect> | undefined) {
  if (!data) return
  if (data.akun) db.akun = data.akun
  if (Array.isArray(data.laporan)) db.laporan = data.laporan
  // Garam WAJIB bertahan: garam baru membuat semua sidik NIK lama tidak cocok,
  // sehingga pemeriksaan akun ganda diam-diam berhenti bekerja.
  if (typeof data.garam === 'string' && data.garam.length >= 32) db.garam = data.garam
}
export function isiConnect(): DbConnect { return db }

function uid(): string { return randomBytes(9).toString('hex') }

/** Sidik NIK. Tidak bisa dikembalikan; hanya untuk mendeteksi akun ganda. */
export function sidikNik(nik: string): string {
  const bersih = nik.replace(/\D/g, '')
  return createHash('sha256').update(db.garam + '|' + bersih).digest('hex')
}

export function akunConnect(email: string): AkunConnect {
  let a = db.akun[email]
  if (!a) {
    a = {
      email, status: 'belum', kredit: KREDIT_AWAL, pelanggaran: [],
      radiusKm: 25, diblokir: [], dibuat: new Date().toISOString(),
    }
    db.akun[email] = a
  }
  return a
}

export interface HasilAjuan { ok: boolean; galat?: string }

/** NIK Indonesia: 16 digit. */
export function nikSah(nik: string): boolean {
  return /^\d{16}$/.test(nik.replace(/\D/g, ''))
}

export function ajukanVerifikasi(
  email: string,
  masuk: Omit<DataVerifikasi, 'nikSidik' | 'nikAkhir'> & { nik: string },
): HasilAjuan {
  const a = akunConnect(email)
  if (a.status === 'terverifikasi') return { ok: false, galat: 'sudah_terverifikasi' }
  if (!nikSah(masuk.nik)) return { ok: false, galat: 'nik_tidak_sah' }
  if (!masuk.selfieUrl) return { ok: false, galat: 'selfie_wajib' }
  if (!masuk.sosialMedia?.filter(Boolean).length) return { ok: false, galat: 'sosial_media_wajib' }
  if (!masuk.nama?.trim()) return { ok: false, galat: 'nama_wajib' }
  if (!(masuk.umur >= 18)) return { ok: false, galat: 'umur_minimal_18' }

  const sidik = sidikNik(masuk.nik)
  // Satu orang, satu akun — diperiksa lewat sidik, tanpa menyimpan nomornya.
  const bentrok = Object.values(db.akun).find(
    (x) => x.email !== email && x.data?.nikSidik === sidik && x.status !== 'ditolak')
  if (bentrok) return { ok: false, galat: 'nik_sudah_dipakai' }

  const nikBersih = masuk.nik.replace(/\D/g, '')
  a.data = {
    ...masuk,
    nikSidik: sidik,
    nikAkhir: nikBersih.slice(-4),
  } as DataVerifikasi
  // Nomor mentah tidak boleh ikut tersimpan lewat sebaran objek di atas.
  delete (a.data as unknown as Record<string, unknown>).nik
  a.status = 'menunggu'
  a.alasanTolak = undefined
  return { ok: true }
}

/** Bentuk yang boleh dilihat pemilik saat meninjau. Tanpa NIK utuh. */
export function ajuanMenunggu(): { email: string; data: DataVerifikasi; dibuat: string }[] {
  return Object.values(db.akun)
    .filter((a) => a.status === 'menunggu' && a.data)
    .map((a) => ({ email: a.email, data: a.data as DataVerifikasi, dibuat: a.dibuat }))
}

export function putuskanVerifikasi(email: string, setuju: boolean, alasan?: string): HasilAjuan {
  const a = db.akun[email]
  if (!a || a.status !== 'menunggu') return { ok: false, galat: 'tidak_ada_ajuan' }
  a.status = setuju ? 'terverifikasi' : 'ditolak'
  if (!setuju) a.alasanTolak = alasan?.trim() || 'Tidak memenuhi syarat verifikasi.'
  return { ok: true }
}

// ── Kredit kepercayaan ───────────────────────────────────────────────────────

export interface HasilKredit { kredit: number; bahaya: boolean; dijadwalkanHapus: boolean }

/** Kurangi kredit. Poinnya ditentukan pemilik, bukan tabel tetap. */
export function kurangiKredit(email: string, poin: number, alasan: string, olehEmail: string): HasilKredit {
  const a = akunConnect(email)
  const p = Math.max(0, Math.round(poin))
  a.pelanggaran.unshift({ id: uid(), pada: new Date().toISOString(), alasan, poin: p, olehEmail })
  a.kredit = Math.max(0, a.kredit - p)
  // Dijadwalkan, bukan langsung dilenyapkan: keputusan yang keliru masih bisa
  // ditarik, dan alasannya tetap tercatat.
  if (a.kredit < KREDIT_HAPUS && !a.hapusPada) {
    a.hapusPada = new Date(Date.now() + 7 * 86400_000).toISOString()
  }
  return { kredit: a.kredit, bahaya: a.kredit <= KREDIT_BAHAYA, dijadwalkanHapus: !!a.hapusPada }
}

/** Kembalikan kredit — dipakai bila laporan ternyata tidak benar. */
export function pulihkanKredit(email: string, poin: number): HasilKredit {
  const a = akunConnect(email)
  a.kredit = Math.min(KREDIT_AWAL, a.kredit + Math.max(0, Math.round(poin)))
  if (a.kredit >= KREDIT_HAPUS) a.hapusPada = undefined
  return { kredit: a.kredit, bahaya: a.kredit <= KREDIT_BAHAYA, dijadwalkanHapus: !!a.hapusPada }
}

// ── Pelaporan ────────────────────────────────────────────────────────────────

export function laporkan(pelaporEmail: string, terlaporEmail: string, alasan: string, catatan?: string): HasilAjuan {
  if (pelaporEmail === terlaporEmail) return { ok: false, galat: 'tidak_bisa_lapor_diri' }
  if (!alasan?.trim()) return { ok: false, galat: 'alasan_wajib' }
  // Satu laporan menunggu per pasangan, supaya antrean pemilik tidak dibanjiri.
  const ada = db.laporan.find((l) => l.pelaporEmail === pelaporEmail && l.terlaporEmail === terlaporEmail && l.status === 'menunggu')
  if (ada) return { ok: false, galat: 'sudah_dilaporkan' }
  db.laporan.unshift({
    id: uid(), pada: new Date().toISOString(),
    pelaporEmail, terlaporEmail, alasan: alasan.trim(), catatan: catatan?.trim() || undefined,
    status: 'menunggu',
  })
  return { ok: true }
}

export function laporanMenunggu(): Laporan[] {
  return db.laporan.filter((l) => l.status === 'menunggu')
}

/** Pemilik memutuskan. Poin 0 berarti laporan ditolak tanpa hukuman. */
export function putuskanLaporan(id: string, poin: number, olehEmail: string, catatan?: string): HasilAjuan {
  const l = db.laporan.find((x) => x.id === id)
  if (!l || l.status !== 'menunggu') return { ok: false, galat: 'tidak_ada_laporan' }
  const p = Math.max(0, Math.round(poin))
  l.status = p > 0 ? 'ditindak' : 'ditolak'
  l.putusan = { pada: new Date().toISOString(), poin: p, catatan: catatan?.trim() || undefined }
  if (p > 0) kurangiKredit(l.terlaporEmail, p, `Laporan: ${l.alasan}`, olehEmail)
  return { ok: true }
}

// ── Pemblokiran ──────────────────────────────────────────────────────────────

/**
 * Blokir berlaku pada AKUN, bukan pada perangkat atau percakapan.
 *
 * Karena itu ia otomatis berlaku di semua perangkat yang masuk ke akun itu, dan
 * berlaku dua arah: yang memblokir tidak melihat yang diblokir, dan sebaliknya.
 * Blokir satu arah hanya memindahkan gangguan ke sisi lain.
 */
export function blokir(email: string, targetEmail: string): HasilAjuan {
  if (email === targetEmail) return { ok: false, galat: 'tidak_bisa_blokir_diri' }
  const a = akunConnect(email)
  if (!a.diblokir.includes(targetEmail)) a.diblokir.push(targetEmail)
  return { ok: true }
}

export function bukaBlokir(email: string, targetEmail: string): HasilAjuan {
  const a = akunConnect(email)
  a.diblokir = a.diblokir.filter((x) => x !== targetEmail)
  return { ok: true }
}

/** Apakah dua akun saling terhalang — dipakai deck, pesan, dan feed sosial. */
export function terblokir(a: string, b: string): boolean {
  const x = db.akun[a]
  const y = db.akun[b]
  return !!(x?.diblokir.includes(b) || y?.diblokir.includes(a))
}

// ── Radius ───────────────────────────────────────────────────────────────────

export function setelRadius(email: string, km: number): number {
  const a = akunConnect(email)
  a.radiusKm = Math.max(1, Math.min(500, Math.round(km)))
  return a.radiusKm
}

/** Ringkasan yang aman ditampilkan kepada pemilik akun itu sendiri. */
export function ringkasanSaya(email: string) {
  const a = akunConnect(email)
  return {
    status: a.status,
    alasanTolak: a.alasanTolak,
    kredit: a.kredit,
    bahaya: a.kredit <= KREDIT_BAHAYA,
    hapusPada: a.hapusPada,
    radiusKm: a.radiusKm,
    diblokir: a.diblokir,
    pelanggaran: a.pelanggaran,
    ambang: { awal: KREDIT_AWAL, bahaya: KREDIT_BAHAYA, hapus: KREDIT_HAPUS },
  }
}

/**
 * Profil publik — bentuk yang boleh dilihat pengguna LAIN.
 *
 * Agama, orientasi, NIK, tanggal lahir lengkap dan tempat tinggal persis tidak
 * pernah ikut. Yang keluar hanya yang memang perlu untuk memutuskan apakah
 * ingin berkenalan.
 */
export function profilPublik(email: string): {
  email: string; nama: string; umur: number; pekerjaan: string
  pendidikan: string; kota: string; terverifikasi: boolean; kredit: number
} | null {
  const a = db.akun[email]
  if (!a?.data || a.status !== 'terverifikasi') return null
  return {
    email: a.email,
    nama: a.data.nama,
    umur: a.data.umur,
    pekerjaan: a.data.pekerjaan,
    pendidikan: a.data.pendidikanTerakhir,
    // Kota saja, bukan alamat.
    kota: (a.data.tempatTinggal || '').split(',')[0]?.trim() ?? '',
    terverifikasi: true,
    kredit: a.kredit,
  }
}

/** Akun yang sudah lewat tenggat penghapusan. Dipanggil tugas berkala. */
export function jatuhTempoHapus(sekarang = Date.now()): string[] {
  return Object.values(db.akun)
    .filter((a) => a.hapusPada && Date.parse(a.hapusPada) <= sekarang)
    .map((a) => a.email)
}

export function hapusAkunConnect(email: string) {
  delete db.akun[email]
  db.laporan = db.laporan.filter((l) => l.terlaporEmail !== email && l.pelaporEmail !== email)
}

export function bolehDilihat(pelihatEmail: string, targetEmail: string): boolean {
  if (terblokir(pelihatEmail, targetEmail)) return false
  const t = db.akun[targetEmail]
  return t?.status === 'terverifikasi'
}

export type { Role }
