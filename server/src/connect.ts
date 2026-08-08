import { createHash, randomBytes } from 'node:crypto'
import type { Role } from './store.js'
import { kotaDariTeks, jarakKm } from './kota.js'
import { normalizePhone } from './otp.js'

// ─────────────────────────────────────────────────────────────────────────────
// Connect — verifikasi, kredit kepercayaan, pelaporan dan pemblokiran.
//
// Berkas ini memegang data paling sensitif di seluruh aplikasi, jadi tiga
// keputusan berikut dibuat sadar dan ditulis di sini agar tidak diubah tanpa
// memahami akibatnya.
//
// 1. IDENTITAS DIIKAT KE NOMOR TELEPON. NIK TIDAK DIPAKAI DI MANA PUN.
//    Pemakaian NIK oleh pihak swasta diatur UU Adminduk 24/2013 dan menuntut
//    kerja sama resmi dengan Dukcapil, yang tidak dimiliki produk ini. Karena
//    itu NIK tidak diminta, tidak disidik, dan tidak disimpan — bukan sekadar
//    "belum", melainkan keputusan yang tidak akan diubah tanpa perjanjian
//    Dukcapil yang sah lebih dulu.
//
//    NOMOR TIDAK DIBUKTIKAN LEWAT OTP — pemilik memutuskan demikian. Artinya
//    nomor yang diketik hanya membuktikan pemohon TAHU nomor itu, sama
//    lemahnya dengan NIK dulu. Pemeriksaan bentrok mencegah satu nomor dipakai
//    dua akun, tetapi tidak mencegah seseorang memakai nomor orang lain.
//    Penahan akun ganda yang sebenarnya kini ada di dua tempat: keharusan satu
//    akun media sosial hanya untuk satu akun Connect (lihat kunciSosial), dan
//    tinjauan manual pemilik atas selfie berpose. Nomor telepon gratis dibuat
//    berapa pun banyaknya; akun media sosial dengan riwayat unggahan dan
//    koneksi tidak bisa dikarang mendadak dalam jumlah banyak, jadi justru
//    itulah saringan yang paling menahan — dan ia tidak berbiaya.
//
//    Yang disimpan tetap hanya sidik ber-garam dan empat digit terakhir.
//    Nomor utuhnya tidak disimpan di data verifikasi, jadi basis data yang
//    bocor tidak memberi penyerang daftar nomor untuk dihubungi.
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
  pendidikanTerakhir: string
  tempatTinggal: string
  /** Tautan profil media sosial untuk dicocokkan pemilik. */
  sosialMedia: string[]
  /** URL selfie berpose (jari membentuk huruf P). */
  selfieUrl: string
  /** Empat digit terakhir nomor telepon — untuk pemilik mengenali, bukan menghubungi. */
  teleponAkhir: string
  /** Sidik nomor telepon ber-garam. Tidak bisa dikembalikan ke nomor aslinya. */
  teleponSidik: string
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
  /** Bukti persetujuan per tujuan (UU PDP Pasal 20-22). */
  persetujuan: CatatanPersetujuan[]
  /** Sidik nomor telepon yang didaftarkan. Tidak dibuktikan lewat OTP. */
  teleponSidik?: string
  /** Empat digit terakhirnya, untuk pemilik mengenali saat meninjau. */
  teleponAkhir?: string
  /** Kapan nomor itu didaftarkan. */
  teleponPada?: string
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
  if (data.akun) {
    db.akun = data.akun
    // Akun yang tersimpan sebelum pencatatan persetujuan ada belum punya
    // fieldnya. Diisi larik kosong agar pembacaan tidak melempar; kosong juga
    // jujur secara hukum — memang belum ada bukti persetujuan untuk akun itu.
    for (const a of Object.values(db.akun)) if (!Array.isArray(a.persetujuan)) a.persetujuan = []
  }
  if (Array.isArray(data.laporan)) db.laporan = data.laporan
  // Garam WAJIB bertahan: garam baru membuat semua sidik lama tidak cocok,
  // sehingga pemeriksaan akun ganda diam-diam berhenti bekerja.
  if (typeof data.garam === 'string' && data.garam.length >= 32) db.garam = data.garam
}
export function isiConnect(): DbConnect { return db }

function uid(): string { return randomBytes(9).toString('hex') }

/** Sidik nomor telepon. Tidak dapat dikembalikan; hanya mendeteksi akun ganda. */
export function sidikTelepon(telepon: string): string {
  const bersih = telepon.replace(/\D/g, '')
  return createHash('sha256').update(db.garam + '|tel|' + bersih).digest('hex')
}

export function akunConnect(email: string): AkunConnect {
  let a = db.akun[email]
  if (!a) {
    a = {
      email, status: 'belum', kredit: KREDIT_AWAL, pelanggaran: [], persetujuan: [],
      radiusKm: 25, diblokir: [], dibuat: new Date().toISOString(),
    }
    db.akun[email] = a
  }
  return a
}

export interface HasilAjuan { ok: boolean; galat?: string }

// ─── Persetujuan menurut UU PDP 27/2022 ──────────────────────────────────────
//
// Verifikasi Connect memproses dua jenis DATA PRIBADI SPESIFIK (Pasal 4 ayat 2):
// data biometrik — selfie wajah — dan data orientasi seksual. Untuk keduanya
// undang-undang menuntut lebih dari sekadar tombol "Saya setuju" di bawah satu
// blok syarat dan ketentuan:
//
//   * Pasal 20-22: persetujuan harus SAH, yaitu diberikan secara tegas untuk
//     TUJUAN YANG SPESIFIK, dan pengendali harus dapat MEMBUKTIKANNYA. Karena
//     itu tiap tujuan dicatat terpisah beserta waktunya dan versi pemberitahuan
//     yang dibaca pengguna saat itu — persetujuan atas teks yang sudah berubah
//     bukan persetujuan atas teks yang sekarang.
//   * Pasal 9: subjek data berhak MENARIK persetujuan. Penarikan harus semudah
//     pemberiannya, jadi ia tidak disembunyikan di balik permintaan surel.
//   * Pasal 16 ayat 2: data yang diproses harus TERBATAS DAN SPESIFIK, sah
//     menurut hukum, dan transparan. Inilah alasan kolom agama dihapus: ia
//     dikumpulkan dan disimpan, tetapi tidak dipakai oleh apa pun. Data yang
//     tidak dipakai tidak boleh diminta.
//   * Pasal 43: data wajib dihapus setelah masa retensi berakhir atau tujuannya
//     tercapai. Tujuan selfie adalah satu kali pencocokan wajah oleh pemilik.
//     Setelah putusan diambil, tujuannya tercapai dan selfie dihapus.
//
// NIK sengaja tidak ada dalam daftar tujuan ini, karena NIK tidak diminta
// sama sekali. Lihat catatan nomor 1 di kepala berkas.

/** Versi pemberitahuan privasi. Naikkan bila teksnya berubah bermakna. */
export const VERSI_PEMBERITAHUAN = '2026-08-07'

export type TujuanPersetujuan =
  | 'biometrik_selfie'      // data pribadi spesifik: biometrik
  | 'orientasi_seksual'     // data pribadi spesifik
  | 'telepon_sidik'         // nomor telepon terbukti lewat OTP (disidik, tidak disimpan)

export interface CatatanPersetujuan {
  tujuan: TujuanPersetujuan
  pada: string
  versiPemberitahuan: string
  dicabutPada?: string
}

export const TUJUAN_WAJIB: TujuanPersetujuan[] = ['biometrik_selfie', 'orientasi_seksual', 'telepon_sidik']

export function catatPersetujuan(email: string, tujuan: TujuanPersetujuan[]): void {
  const a = akunConnect(email)
  const pada = new Date().toISOString()
  for (const t of tujuan) {
    const lama = a.persetujuan.find((p) => p.tujuan === t && !p.dicabutPada)
    if (lama && lama.versiPemberitahuan === VERSI_PEMBERITAHUAN) continue
    a.persetujuan.push({ tujuan: t, pada, versiPemberitahuan: VERSI_PEMBERITAHUAN })
  }
}

export function persetujuanAktif(email: string): TujuanPersetujuan[] {
  const a = db.akun[email]
  if (!a) return []
  return a.persetujuan.filter((p) => !p.dicabutPada).map((p) => p.tujuan)
}

/**
 * Penarikan persetujuan (Pasal 9 huruf f).
 *
 * Menarik persetujuan atas biometrik, orientasi, atau NIK berarti dasar hukum
 * untuk memproses data verifikasi hilang seluruhnya — dan tanpa data verifikasi
 * akun tidak bisa berstatus terverifikasi. Karena itu penarikan mengembalikan
 * akun ke status 'belum' dan MENGHAPUS data verifikasinya, bukan sekadar
 * menandainya. Catatan persetujuan sendiri tetap disimpan dengan tanggal
 * pencabutan, karena itulah bukti bahwa penarikan dihormati.
 */
export function tarikPersetujuan(email: string): HasilAjuan {
  const a = db.akun[email]
  if (!a) return { ok: false, galat: 'tidak_ada_akun' }
  const pada = new Date().toISOString()
  for (const p of a.persetujuan) if (!p.dicabutPada) p.dicabutPada = pada
  delete a.data
  // Ikatan nomor ikut dilepas: dasar untuk menyimpan sidiknya adalah persetujuan
  // yang baru saja ditarik. Nomornya bebas dipakai akun lain setelah ini.
  delete a.teleponSidik
  delete a.teleponAkhir
  delete a.teleponPada
  a.status = 'belum'
  a.alasanTolak = undefined
  return { ok: true }
}



// ─── Media sosial yang diterima untuk pencocokan ─────────────────────────────
//
// Hanya LinkedIn, Facebook, dan Instagram. Batasan ini bukan soal selera:
// pencocokan wajah hanya berarti bila halaman pembandingnya sulit dikarang
// mendadak. Ketiganya punya riwayat unggahan, daftar teman atau koneksi, dan
// tanggal bergabung yang terlihat — pemilik bisa menilai apakah akunnya hidup
// atau baru dibuat kemarin. Tautan bebas ke situs mana pun tidak memberi itu:
// pemohon bisa memasang foto siapa saja di halaman yang ia kuasai sendiri.
//
// Host dicek dari hasil parse URL, bukan dari `includes`. "instagram.com.jahat.id"
// mengandung "instagram.com" tetapi bukan Instagram.
export const PLATFORM_SOSIAL = {
  linkedin: { label: 'LinkedIn', host: ['linkedin.com'], contoh: 'https://linkedin.com/in/nama-anda' },
  facebook: { label: 'Facebook', host: ['facebook.com', 'fb.com', 'm.facebook.com'], contoh: 'https://facebook.com/nama.anda' },
  instagram: { label: 'Instagram', host: ['instagram.com'], contoh: 'https://instagram.com/namaanda' },
} as const

export type PlatformSosial = keyof typeof PLATFORM_SOSIAL

/** Platform dari sebuah URL, atau null bila bukan salah satu dari ketiganya. */
export function platformDariUrl(url: string): PlatformSosial | null {
  let host: string
  try {
    const u = new URL(url.trim())
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    host = u.hostname.toLowerCase().replace(/^www\./, '')
  } catch { return null }

  for (const [id, p] of Object.entries(PLATFORM_SOSIAL)) {
    // Cocok persis, atau subdomain sah (id.linkedin.com) — bukan sekadar berisi.
    if (p.host.some((h) => host === h || host.endsWith('.' + h))) return id as PlatformSosial
  }
  return null
}

/**
 * Ikat nomor telepon ke akun Connect.
 *
 * PEMBUKTIAN LEWAT OTP DIHAPUS ATAS PERMINTAAN PEMILIK. Nomor kini cukup
 * diketik. Akibatnya harus dipahami siapa pun yang membaca berkas ini:
 *
 *   Nomor yang diketik hanya membuktikan pemohon TAHU nomor itu, bukan bahwa
 *   ia MEMEGANGNYA. Karena itu pemeriksaan bentrok di bawah tidak lagi
 *   menegakkan "satu orang satu akun" — ia hanya mencegah nomor yang sama
 *   dipakai dua kali. Seseorang yang mengetik nomor orang lain tetap lolos,
 *   dan lebih buruk, ia dapat "membakar" nomor orang lain sehingga pemilik
 *   asli nomor itu tidak bisa lagi memakainya.
 *
 * Yang menahan akun ganda sekarang tinggal tinjauan pemilik atas selfie
 * berpose dan akun media sosial. Halaman tinjauan menyatakan ini apa adanya
 * supaya pemilik tidak mengira nomornya sudah terjamin.
 */
export function ikatTelepon(email: string, telepon: string): HasilAjuan {
  // Dinormalkan DI SINI, bukan hanya di rutenya. "081234567890" dan
  // "+6281234567890" adalah nomor yang sama; tanpa normalisasi keduanya
  // menghasilkan sidik berbeda dan satu orang bisa membuat dua akun — persis
  // aturan yang seharusnya ditegakkan fungsi ini. Menyandarkannya pada
  // pemanggil berarti aturannya hilang begitu ada pemanggil kedua.
  const e164 = normalizePhone(telepon)
  if (!e164) return { ok: false, galat: 'telepon_tidak_sah' }
  const bersih = e164.replace(/\D/g, '')
  if (bersih.length < 9) return { ok: false, galat: 'telepon_tidak_sah' }
  const sidik = sidikTelepon(bersih)

  // Mencegah nomor yang sama terpakai dua kali. Tanpa OTP ini BUKAN jaminan
  // satu orang satu akun — lihat catatan di atas.
  const bentrok = Object.values(db.akun).find(
    (x) => x.email !== email && x.teleponSidik === sidik && x.status !== 'ditolak')
  if (bentrok) return { ok: false, galat: 'telepon_sudah_dipakai' }

  const a = akunConnect(email)
  a.teleponSidik = sidik
  a.teleponAkhir = bersih.slice(-4)
  a.teleponPada = new Date().toISOString()
  return { ok: true }
}

/**
 * Kunci identitas sebuah profil media sosial: platform + nama pengguna.
 *
 * Dipakai menegakkan bahwa satu akun media sosial hanya boleh dipakai satu akun
 * Connect. Tanpa OTP berbayar, INILAH penahan akun ganda yang paling kuat yang
 * dimiliki sistem — dan ia gratis. Nomor telepon bebas dibuat berapa pun
 * banyaknya; akun Instagram atau LinkedIn yang punya riwayat unggahan dan
 * koneksi tidak bisa dikarang mendadak dalam jumlah banyak.
 *
 * Normalisasi harus cukup agresif, karena satu orang yang ingin membuat dua
 * akun akan mencoba variasi yang paling jelas lebih dulu:
 *
 *   https://instagram.com/Budi/
 *   https://www.instagram.com/budi?hl=id
 *   https://m.facebook.com/budi#about
 *
 * Ketiganya harus menghasilkan kunci yang sama. Kueri, fragmen, garis miring
 * penutup, awalan www/m, dan besar-kecil huruf semuanya dibuang. Facebook
 * "profile.php?id=123" ditangani khusus karena identitasnya justru ada di
 * kuerinya.
 */
export function kunciSosial(url: string): string | null {
  const platform = platformDariUrl(url)
  if (!platform) return null
  let u: URL
  try { u = new URL(url.trim()) } catch { return null }

  // Facebook lama menaruh identitas di kueri, bukan di jalur.
  if (platform === 'facebook') {
    const id = u.searchParams.get('id')
    if (id && /^\d+$/.test(id)) return 'facebook|' + id
  }

  const jalur = u.pathname
    .toLowerCase()
    .replace(/\/+$/, '')       // garis miring penutup
    .replace(/^\/+/, '')       // garis miring pembuka
    .replace(/^@/, '')         // sebagian orang menempel @
  if (!jalur) return null

  // LinkedIn selalu berbentuk in/nama atau company/nama; sisanya ambil segmen
  // pertama saja supaya /budi/reels/123 tetap satu orang yang sama.
  const bagian = jalur.split('/').filter(Boolean)
  const nama = platform === 'linkedin' ? bagian.slice(0, 2).join('/') : bagian[0]
  return nama ? `${platform}|${nama}` : null
}

export function ajukanVerifikasi(
  email: string,
  masuk: Omit<DataVerifikasi, 'teleponSidik' | 'teleponAkhir'> & {
    /** Nomor telepon, diketik pemohon. Tidak dibuktikan lewat OTP. */
    telepon?: string
    /** Tujuan yang disetujui pengguna secara tegas, satu per satu. */
    persetujuan?: TujuanPersetujuan[]
  },
): HasilAjuan {
  const a = akunConnect(email)
  // Tanpa persetujuan tegas atas ketiga tujuan, tidak ada dasar hukum memproses
  // biometrik dan orientasi seksual — jadi ajuan ditolak SEBELUM datanya
  // disentuh, bukan disimpan dulu lalu dinilai belakangan.
  const setuju = new Set(masuk.persetujuan ?? [])
  if (!TUJUAN_WAJIB.every((t) => setuju.has(t))) return { ok: false, galat: 'persetujuan_belum_lengkap' }
  if (a.status === 'terverifikasi') return { ok: false, galat: 'sudah_terverifikasi' }
  // Nomor diikat di sini, sebelum data lain disimpan, supaya nomor yang sudah
  // terpakai ditolak tanpa menyimpan apa pun.
  if (masuk.telepon) {
    const t = ikatTelepon(email, masuk.telepon)
    if (!t.ok) return t
  }
  if (!a.teleponSidik || !a.teleponAkhir) return { ok: false, galat: 'telepon_wajib' }
  if (!masuk.selfieUrl) return { ok: false, galat: 'selfie_wajib' }
  const tautan = (masuk.sosialMedia ?? []).map((s) => s.trim()).filter(Boolean)
  if (!tautan.length) return { ok: false, galat: 'sosial_media_wajib' }
  if (tautan.some((t) => platformDariUrl(t) === null)) {
    return { ok: false, galat: 'sosial_media_tidak_dikenal' }
  }
  // Satu akun media sosial hanya untuk satu akun Connect. Diperiksa terhadap
  // akun lain yang belum ditolak — ajuan yang sudah ditolak tidak boleh
  // mengunci akun media sosial orang selamanya.
  const kunciSaya = tautan.map(kunciSosial).filter((k): k is string => !!k)
  const bentrokSosial = Object.values(db.akun).some((x) =>
    x.email !== email && x.status !== 'ditolak' &&
    (x.data?.sosialMedia ?? []).some((s) => {
      const k = kunciSosial(s)
      return !!k && kunciSaya.includes(k)
    }))
  if (bentrokSosial) return { ok: false, galat: 'sosial_media_sudah_dipakai' }
  if (!masuk.nama?.trim()) return { ok: false, galat: 'nama_wajib' }
  if (!(masuk.umur >= 18)) return { ok: false, galat: 'umur_minimal_18' }

  a.data = {
    ...masuk,
    sosialMedia: tautan,
    teleponSidik: a.teleponSidik,
    teleponAkhir: a.teleponAkhir,
  } as DataVerifikasi
  // Nomor mentah tidak boleh ikut tersimpan lewat sebaran objek di atas —
  // yang disimpan hanya sidik dan empat digit terakhirnya.
  delete (a.data as unknown as Record<string, unknown>).telepon
  // Daftar persetujuan: tempatnya di a.persetujuan sebagai catatan
  // bertanggal, bukan disalin mentah ke dalam data verifikasi.
  delete (a.data as unknown as Record<string, unknown>).persetujuan
  // Persetujuan dicatat hanya setelah semua pemeriksaan lolos, supaya tidak ada
  // bukti persetujuan untuk pemrosesan yang sebenarnya tidak pernah terjadi.
  catatPersetujuan(email, TUJUAN_WAJIB)
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
  // Tujuan selfie adalah satu kali pencocokan wajah oleh pemilik. Putusan sudah
  // diambil, jadi tujuannya tercapai dan data biometriknya tidak boleh disimpan
  // lebih lama (UU PDP Pasal 43). Ini berlaku baik untuk yang disetujui maupun
  // yang ditolak — penolakan bukan alasan menyimpan wajah orang.
  if (a.data) a.data.selfieUrl = ''
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
    persetujuan: a.persetujuan,
    teleponAkhir: a.teleponAkhir,
    teleponTerdaftar: !!a.teleponSidik,
    versiPemberitahuan: VERSI_PEMBERITAHUAN,
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

// ── Deck: siapa yang muncul untuk siapa ──────────────────────────────────────
//
// Sampai sekarang radius tersimpan tetapi tidak menyaring apa pun. Ini yang
// menyaringnya. Urutan pemeriksaan dipilih supaya yang paling murah dan paling
// menentukan berjalan lebih dulu, dan supaya tidak ada jalan pintas: setiap
// calon harus lolos SEMUA saringan.
//
//   1. Diri sendiri tidak muncul.
//   2. Hanya akun terverifikasi. Verifikasi adalah seluruh alasan fitur ini ada.
//   3. Blokir dua arah — yang memblokir maupun yang diblokir sama-sama hilang.
//      Ini yang membuat "tidak bisa dihubungi" berarti benar-benar tidak
//      terlihat, bukan sekadar tidak bisa dikirimi pesan.
//   4. Kredit di bawah ambang bahaya tidak diedarkan. Akun yang sedang dalam
//      penilaian tidak pantas dipertemukan dengan orang baru.
//   5. Orientasi harus saling cocok — dihitung di server dan tidak pernah
//      dikirim ke klien, karena orientasi adalah data pribadi spesifik.
//   6. Jarak antar-pusat-kota harus di dalam radius KEDUANYA. Radius yang
//      dipasang seseorang membatasi siapa yang ia lihat sekaligus siapa yang
//      melihat dia; kalau hanya satu arah, radius lebar sepihak akan menembus
//      batas yang dipasang orang lain.
//
// Kota yang tidak dikenali tidak dianggap "jarak nol". Orang tanpa letak yang
// bisa dipastikan tetap muncul, tetapi ditandai jarak null, supaya kesalahan
// data tidak diam-diam menjadi klaim kedekatan yang salah.

export interface KartuDeck {
  email: string
  nama: string
  umur: number
  pekerjaan: string
  pendidikan: string
  kota: string
  jarakKm: number | null
  kredit: number
}

/** Apakah dua orientasi saling menerima. Dihitung hanya di server. */
function saling(a: Preferensi, b: Preferensi): boolean {
  // Model sederhana yang tidak berpura-pura lengkap: biseksual menerima semua,
  // sisanya harus sama. Ini disengaja konservatif — memasangkan orang di luar
  // preferensinya lebih merugikan daripada menampilkan calon lebih sedikit.
  if (a === 'biseksual' || b === 'biseksual') return true
  return a === b
}

export function dek(email: string, batas = 50): KartuDeck[] {
  const saya = db.akun[email]
  if (!saya?.data || saya.status !== 'terverifikasi') return []
  const kotaSaya = kotaDariTeks(saya.data.tempatTinggal)

  const hasil: KartuDeck[] = []
  for (const lain of Object.values(db.akun)) {
    if (lain.email === email) continue
    if (lain.status !== 'terverifikasi' || !lain.data) continue
    if (terblokir(email, lain.email)) continue
    if (lain.kredit <= KREDIT_BAHAYA) continue
    if (!saling(saya.data.preferensi, lain.data.preferensi)) continue

    const kotaLain = kotaDariTeks(lain.data.tempatTinggal)
    let jarak: number | null = null
    if (kotaSaya && kotaLain) {
      jarak = Math.round(jarakKm(kotaSaya.lat, kotaSaya.lon, kotaLain.lat, kotaLain.lon))
      // Radius keduanya harus dipenuhi, bukan hanya radius si peminta.
      if (jarak > saya.radiusKm || jarak > lain.radiusKm) continue
    }

    const p = profilPublik(lain.email)
    if (!p) continue
    hasil.push({ ...p, jarakKm: jarak })
  }

  // Yang terdekat lebih dulu; yang letaknya tidak diketahui di belakang.
  hasil.sort((a, b) => (a.jarakKm ?? Infinity) - (b.jarakKm ?? Infinity))
  return hasil.slice(0, Math.max(1, Math.min(200, batas)))
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
