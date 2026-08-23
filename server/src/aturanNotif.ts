import { getSettings, saveSettings, getHealthProfile } from './store.js'
import { notify } from './push.js'
import { lingkunganKota } from './lingkungan.js'

// ─────────────────────────────────────────────────────────────────────────────
// Mesin aturan notifikasi.
//
// MENGAPA MESIN, BUKAN PENJADWAL KE-50. Pengingat tidur, latihan, dan salat
// masing-masing punya penjadwalnya sendiri, dan bentuknya sama persis:
// diperiksa tiap menit, jendela toleransi, penjaga sekali sehari. Menyalin
// bentuk itu lima puluh kali berarti lima puluh tempat yang bisa salah
// sendiri-sendiri. Di sini kondisinya saja yang ditulis; sisanya diurus mesin.
//
// TIGA PENJAGA YANG LEBIH PENTING DARIPADA ISINYA:
//
//   1. KUOTA HARIAN. Aplikasi yang mengirim dua puluh notifikasi sehari akan
//      dimatikan notifikasinya dalam tiga hari — dan sesudah itu pengingat obat
//      pun tidak sampai. Bawaannya enam per hari, dapat diubah pemakainya.
//   2. JAM SENYAP. Tidak ada yang dikirim tengah malam kecuali memang tentang
//      tidur. Bawaannya 22.00-06.00 waktu setempat.
//   3. SATU PER DETAK. Sekali jalan paling banyak satu notifikasi terkirim,
//      supaya tiga syarat yang kebetulan terpenuhi bersamaan tidak berubah
//      menjadi tiga getaran beruntun.
//
// APA YANG TIDAK PERNAH DIKIRIM MESIN INI, sama seperti aturan yang berlaku
// pada widget: klaim yang tidak terukur ("usia biologis Anda turun", "autofagi
// dimulai", "telomer memendek"), dan anjuran memulai obat atau suplemen.
// Kondisi yang tidak dapat dihitung dari data yang benar-benar ada tidak
// ditulis sebagai aturan, betapapun bagus kalimatnya.
// ─────────────────────────────────────────────────────────────────────────────

export type Kategori = 'pemulihan' | 'latihan' | 'vital' | 'lingkungan'

/** Kunci setelan yang menyalakan tiap kategori. Bawaannya mati. */
export const PREF_KATEGORI: Record<Kategori, string> = {
  pemulihan: 'notifPemulihan',
  latihan: 'notifLatihanPintar',
  vital: 'notifVital',
  lingkungan: 'notifLingkungan',
}

interface Baris { date: string; [k: string]: unknown }

export interface Konteks {
  userId: string
  email: string
  prefs: Record<string, any>
  /** Riwayat harian dari perangkat, terlama dahulu. */
  riwayat: Baris[]
  /** Baris hari ini bila ada. */
  hariIni: Baris | null
  menitLokal: number
  tanggalLokal: string
}

export interface Kabar { judul: string; badan: string; url: string }

export interface Aturan {
  id: string
  kategori: Kategori
  /** Jendela jam lokal [dari, sampai) dalam menit; kosong berarti kapan saja. */
  jendela?: [number, number]
  /** Jarak minimum antar-pengiriman aturan ini, dalam hari. */
  jeda: number
  nilai: (k: Konteks) => Kabar | null
}

const J = (jam: number) => jam * 60

function angka(b: Baris | null | undefined, kunci: string): number | null {
  const v = b?.[kunci]
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** Median nilai `kunci` pada n baris terakhir yang memuatnya. */
function biasa(riwayat: Baris[], kunci: string, n = 14): number | null {
  const nilai: number[] = []
  for (const b of riwayat.slice(-n)) {
    const v = angka(b, kunci)
    if (v != null && v > 0) nilai.push(v)
  }
  if (nilai.length < 5) return null // di bawah lima titik, "kebiasaan" belum ada
  nilai.sort((a, b) => a - b)
  const t = Math.floor(nilai.length / 2)
  return nilai.length % 2 ? nilai[t] : (nilai[t - 1] + nilai[t]) / 2
}

function jumlah(riwayat: Baris[], kunci: string, n: number): number {
  let s = 0
  for (const b of riwayat.slice(-n)) s += angka(b, kunci) ?? 0
  return s
}

/**
 * Daftar aturan.
 *
 * Tiap kalimat menyebut ANGKANYA dan PEMBANDINGNYA, karena notifikasi yang
 * hanya berkata "kesiapan Anda rendah" tidak dapat dibantah oleh yang
 * membacanya — dan pemberitahuan kesehatan yang tidak dapat diperiksa adalah
 * pemberitahuan yang lama-lama diabaikan.
 */
export const ATURAN: Aturan[] = [
  {
    id: 'hrvTurun',
    kategori: 'pemulihan',
    jendela: [J(6), J(10)],
    jeda: 2,
    nilai: (k) => {
      const kini = angka(k.hariIni, 'hrvMs')
      const b = biasa(k.riwayat, 'hrvMs')
      if (kini == null || b == null || kini >= b * 0.85) return null
      return {
        judul: 'HRV di bawah kebiasaan',
        badan: `HRV semalam ${Math.round(kini)} ms, kebiasaan Anda ${Math.round(b)} ms. Hari seperti ini biasanya lebih cocok untuk sesi ringan daripada sesi keras — tetapi Anda yang paling tahu penyebabnya.`,
        url: './#/tubuh?t=jantung',
      }
    },
  },
  {
    id: 'rhrNaik',
    kategori: 'pemulihan',
    jendela: [J(6), J(10)],
    jeda: 2,
    nilai: (k) => {
      const kini = angka(k.hariIni, 'restingHr')
      const b = biasa(k.riwayat, 'restingHr')
      if (kini == null || b == null || kini < b + 5) return null
      return {
        judul: 'Denyut istirahat naik',
        badan: `${Math.round(kini)} bpm pagi ini, kebiasaan Anda ${Math.round(b)} bpm. Kenaikan lima bpm atau lebih sering menyertai kurang tidur, alkohol, latihan berat kemarin, atau awal infeksi.`,
        url: './#/tubuh?t=jantung',
      }
    },
  },
  {
    id: 'napasNaik',
    kategori: 'pemulihan',
    jendela: [J(6), J(10)],
    jeda: 2,
    nilai: (k) => {
      const kini = angka(k.hariIni, 'respRate')
      const b = biasa(k.riwayat, 'respRate')
      if (kini == null || b == null || kini < b + 2) return null
      return {
        judul: 'Laju napas semalam naik',
        badan: `${kini.toFixed(1)} napas/menit, kebiasaan Anda ${b.toFixed(1)}. Bila disertai demam atau badan pegal, istirahat lebih dulu.`,
        url: './#/tubuh',
      }
    },
  },
  {
    id: 'suhuNaik',
    kategori: 'pemulihan',
    jendela: [J(6), J(10)],
    jeda: 1,
    nilai: (k) => {
      const kini = angka(k.hariIni, 'bodyTempC')
      const b = biasa(k.riwayat, 'bodyTempC')
      if (kini == null || b == null || kini < b + 0.4) return null
      return {
        judul: 'Suhu tubuh di atas kebiasaan',
        badan: `${kini.toFixed(1)} °C, kebiasaan Anda ${b.toFixed(1)} °C. Sensor pergelangan tangan mengukur suhu kulit — bila terasa tidak enak badan, ukur dengan termometer.`,
        url: './#/tubuh',
      }
    },
  },
  {
    id: 'spo2Rendah',
    kategori: 'vital',
    jendela: [J(6), J(11)],
    jeda: 7,
    nilai: (k) => {
      // Dua malam berturut-turut, bukan satu: bacaan tunggal yang rendah pada
      // sensor pergelangan tangan terlalu sering salah untuk dijadikan kabar.
      const dua = k.riwayat.slice(-2).map((b) => angka(b, 'spo2Pct')).filter((v): v is number => v != null)
      if (dua.length < 2 || dua.some((v) => v >= 92)) return null
      return {
        judul: 'Saturasi rendah dua malam',
        badan: `SpO₂ ${dua.map((v) => Math.round(v)).join('% dan ')}%. Sensor pergelangan tangan bukan alat diagnosis, tetapi dua malam di bawah 92% pantas diperiksa dengan oksimeter jari, dan bila berulang dibicarakan dengan dokter.`,
        url: './#/tubuh',
      }
    },
  },
  {
    id: 'utangTidur',
    kategori: 'pemulihan',
    jendela: [J(20), J(22)],
    jeda: 3,
    nilai: (k) => {
      const b = biasa(k.riwayat, 'sleepH')
      if (b == null) return null
      const tujuh = k.riwayat.slice(-7).map((x) => angka(x, 'sleepH')).filter((v): v is number => v != null && v > 0)
      if (tujuh.length < 4) return null
      const utang = tujuh.reduce((a, v) => a + (v - b), 0)
      if (utang > -3) return null
      return {
        judul: 'Utang tidur menumpuk',
        badan: `Tujuh malam terakhir ${Math.abs(utang).toFixed(1)} jam lebih pendek daripada kebiasaan Anda (${b.toFixed(1)} jam). Tidur lebih awal malam ini lebih menolong daripada tidur lebih siang besok.`,
        url: './#/pola-tidur',
      }
    },
  },
  {
    id: 'tidurPendek',
    kategori: 'pemulihan',
    jendela: [J(7), J(11)],
    jeda: 2,
    nilai: (k) => {
      const kini = angka(k.hariIni, 'sleepH')
      const b = biasa(k.riwayat, 'sleepH')
      if (kini == null || b == null || kini > b - 1.5) return null
      return {
        judul: 'Semalam jauh lebih pendek',
        badan: `${kini.toFixed(1)} jam, kebiasaan Anda ${b.toFixed(1)} jam. Yang paling menolong hari ini: cahaya matahari pagi, dan tidak menggeser jam tidur malam nanti.`,
        url: './#/pola-tidur',
      }
    },
  },
  {
    id: 'latihanSepi',
    kategori: 'latihan',
    jendela: [J(16), J(19)],
    jeda: 3,
    nilai: (k) => {
      const tiga = k.riwayat.slice(-3)
      if (tiga.length < 3) return null
      const adaLatihan = tiga.some((b) => (angka(b, 'exerciseMin') ?? 0) > 0)
      if (adaLatihan) return null
      return {
        judul: 'Tiga hari tanpa sesi tercatat',
        badan: 'Belum ada menit latihan tercatat tiga hari terakhir. Sesi ringan dua puluh menit sudah menghitung — yang menumpuk manfaatnya keteraturan, bukan beratnya.',
        url: './#/latihan',
      }
    },
  },
  {
    id: 'menitPekanKurang',
    kategori: 'latihan',
    jendela: [J(9), J(12)],
    jeda: 7,
    nilai: (k) => {
      // Hanya pada hari Jumat waktu setempat: masih ada dua hari untuk mengejar.
      const hari = new Date(`${k.tanggalLokal}T00:00:00Z`).getUTCDay()
      if (hari !== 5) return null
      const menit = jumlah(k.riwayat, 'exerciseMin', 7)
      if (menit >= 150 || menit === 0) return null
      return {
        judul: `${Math.round(menit)} menit pekan ini`,
        badan: `Anjuran WHO 150 menit aktivitas sedang per pekan; kurang ${Math.round(150 - menit)} menit lagi. Akhir pekan biasanya tempat paling mudah menutupnya.`,
        url: './#/latihan',
      }
    },
  },
  {
    id: 'langkahTertinggal',
    kategori: 'latihan',
    jendela: [J(17), J(19)],
    jeda: 2,
    nilai: (k) => {
      const kini = angka(k.hariIni, 'steps')
      const b = biasa(k.riwayat, 'steps')
      if (kini == null || b == null || kini >= b * 0.5) return null
      return {
        judul: 'Langkah hari ini di bawah biasanya',
        badan: `${Math.round(kini).toLocaleString('id-ID')} langkah, biasanya Anda ${Math.round(b).toLocaleString('id-ID')}. Jalan dua puluh menit sesudah makan malam sudah menutup sebagian besar selisihnya.`,
        url: './#/tubuh',
      }
    },
  },
  {
    id: 'pekanBaik',
    kategori: 'latihan',
    jendela: [J(19), J(21)],
    jeda: 7,
    nilai: (k) => {
      const hari = new Date(`${k.tanggalLokal}T00:00:00Z`).getUTCDay()
      if (hari !== 0) return null
      const menit = jumlah(k.riwayat, 'exerciseMin', 7)
      if (menit < 150) return null
      return {
        judul: `${Math.round(menit)} menit pekan ini`,
        badan: 'Anjuran mingguan terpenuhi. Yang paling menentukan bukan satu pekan ini, melainkan berapa pekan berturut-turut seperti ini.',
        url: './#/latihan',
      }
    },
  },
  {
    id: 'tekananTinggi',
    kategori: 'vital',
    jendela: [J(8), J(20)],
    jeda: 3,
    nilai: (k) => {
      const sis = angka(k.hariIni, 'systolic')
      const dia = angka(k.hariIni, 'diastolic')
      if (sis == null || dia == null) return null
      if (sis < 140 && dia < 90) return null
      return {
        judul: `Tekanan darah ${Math.round(sis)}/${Math.round(dia)}`,
        badan: 'Satu bacaan bukan diagnosis. Ukur lagi sesudah duduk tenang lima menit, dua kali sehari selama sepekan, lalu bawa catatannya ke dokter — itulah cara hipertensi ditetapkan.',
        url: './#/tubuh',
      }
    },
  },
  {
    id: 'beratNaik',
    kategori: 'vital',
    jendela: [J(8), J(11)],
    jeda: 14,
    nilai: (k) => {
      const kini = angka(k.hariIni, 'weightKg')
      const lama = k.riwayat.slice(-30, -20).map((b) => angka(b, 'weightKg')).filter((v): v is number => v != null)
      if (kini == null || lama.length < 3) return null
      const dulu = lama.reduce((a, b) => a + b, 0) / lama.length
      if (kini < dulu * 1.02) return null
      return {
        judul: 'Berat naik dibanding bulan lalu',
        badan: `${kini.toFixed(1)} kg, sebulan lalu sekitar ${dulu.toFixed(1)} kg. Timbangan naik-turun setiap hari karena air dan isi usus; yang dibaca di sini rata-ratanya, bukan satu penimbangan.`,
        url: './#/tubuh',
      }
    },
  },
  {
    id: 'belumTersinkron',
    kategori: 'vital',
    jendela: [J(10), J(12)],
    jeda: 7,
    nilai: (k) => {
      if (!k.riwayat.length) return null
      const terakhir = k.riwayat[k.riwayat.length - 1]?.date
      if (typeof terakhir !== 'string') return null
      const selisih = Math.floor((Date.parse(`${k.tanggalLokal}T00:00:00Z`) - Date.parse(`${terakhir}T00:00:00Z`)) / 864e5)
      if (!Number.isFinite(selisih) || selisih < 5 || selisih > 40) return null
      return {
        judul: 'Data perangkat berhenti masuk',
        badan: `Bacaan terakhir ${selisih} hari lalu. Grafik dan pembanding kebiasaan berhenti ikut bergerak selama data tidak masuk.`,
        url: './#/health-data',
      }
    },
  },
]

/** Aturan lingkungan dipisah karena perlu memanggil layanan luar. */
async function aturanLingkungan(k: Konteks): Promise<{ id: string; kabar: Kabar } | null> {
  if (k.prefs[PREF_KATEGORI.lingkungan] !== true) return null
  if (k.menitLokal < J(6) || k.menitLokal >= J(10)) return null
  const kota = String(k.prefs.salatKota || k.prefs.kota || 'Jakarta')
  const l = await lingkunganKota(kota)
  if (l.error) return null

  if (typeof l.aqi === 'number' && l.aqi > 80) {
    return {
      id: 'udaraBuruk',
      kabar: {
        judul: `Udara ${kota} buruk pagi ini`,
        badan: `European AQI ${Math.round(l.aqi)}${typeof l.pm25 === 'number' ? `, PM2,5 ${l.pm25.toFixed(0)} µg/m³` : ''}. Latihan berat di luar ruangan menarik lebih banyak udara ke paru; pertimbangkan memindahkannya ke dalam ruangan.`,
        url: './#/tubuh',
      },
    }
  }
  if (typeof l.uvMaks === 'number' && l.uvMaks >= 8) {
    return {
      id: 'uvTinggi',
      kabar: {
        judul: `Indeks UV hari ini sampai ${l.uvMaks.toFixed(0)}`,
        badan: 'Termasuk sangat tinggi. Bila berlatih di luar antara pukul 10 dan 16, pakai tabir surya, topi, dan cari teduh di sela sesi.',
        url: './#/tubuh',
      },
    }
  }
  return null
}

/** Jam senyap: [mulai, selesai) waktu setempat. Bawaan 22.00-06.00. */
function sedangSenyap(prefs: Record<string, any>, menit: number): boolean {
  const mulai = Number.isFinite(prefs.notifSenyapMulai) ? Number(prefs.notifSenyapMulai) : J(22)
  const selesai = Number.isFinite(prefs.notifSenyapSelesai) ? Number(prefs.notifSenyapSelesai) : J(6)
  if (mulai === selesai) return false
  return mulai < selesai ? menit >= mulai && menit < selesai : menit >= mulai || menit < selesai
}

export interface HasilJalan { terkirim: string | null; alasan: string }

export async function jalankanAturanNotif(userId: string, email: string): Promise<HasilJalan> {
  const prefs = getSettings(userId)

  const adaKategoriHidup = Object.values(PREF_KATEGORI).some((p) => prefs[p] === true)
  if (!adaKategoriHidup) return { terkirim: null, alasan: 'mati' }

  const offset = Number(prefs.tzOffsetMin) || 0
  const lokal = new Date(Date.now() + offset * 60_000)
  const menitLokal = lokal.getUTCHours() * 60 + lokal.getUTCMinutes()
  const tanggalLokal = lokal.toISOString().slice(0, 10)

  if (sedangSenyap(prefs, menitLokal)) return { terkirim: null, alasan: 'senyap' }

  // Kuota harian.
  const kuota = Number.isFinite(prefs.notifKuota) ? Math.max(1, Math.min(20, Number(prefs.notifKuota))) : 6
  const hitung = prefs.notifHitung ?? {}
  const terpakai = hitung.tanggal === tanggalLokal ? Number(hitung.n) || 0 : 0
  if (terpakai >= kuota) return { terkirim: null, alasan: 'kuota' }

  const profil = getHealthProfile(email)
  const riwayat: Baris[] = Array.isArray(profil.history) ? (profil.history as Baris[]) : []
  const hariIni = riwayat.length ? riwayat[riwayat.length - 1] : null

  const k: Konteks = { userId, email, prefs, riwayat, hariIni, menitLokal, tanggalLokal }
  const terakhir: Record<string, string> = prefs.notifTerakhir ?? {}

  const bolehKirim = (id: string, jeda: number): boolean => {
    const t = terakhir[id]
    if (!t) return true
    const selisih = (Date.parse(`${tanggalLokal}T00:00:00Z`) - Date.parse(`${t}T00:00:00Z`)) / 864e5
    return !Number.isFinite(selisih) || selisih >= jeda
  }

  const kirim = async (id: string, kabar: Kabar, prefKey: string) => {
    saveSettings(userId, {
      notifTerakhir: { ...terakhir, [id]: tanggalLokal },
      notifHitung: { tanggal: tanggalLokal, n: terpakai + 1 },
    })
    await notify(userId, { title: kabar.judul, body: kabar.badan, url: kabar.url, tag: id }, prefKey).catch(() => {})
  }

  for (const a of ATURAN) {
    if (prefs[PREF_KATEGORI[a.kategori]] !== true) continue
    if (a.jendela && (menitLokal < a.jendela[0] || menitLokal >= a.jendela[1])) continue
    if (!bolehKirim(a.id, a.jeda)) continue
    let kabar: Kabar | null = null
    try { kabar = a.nilai(k) } catch { kabar = null }
    if (!kabar) continue
    await kirim(a.id, kabar, PREF_KATEGORI[a.kategori])
    return { terkirim: a.id, alasan: 'terkirim' }
  }

  const ling = await aturanLingkungan(k).catch(() => null)
  if (ling && bolehKirim(ling.id, 1)) {
    await kirim(ling.id, ling.kabar, PREF_KATEGORI.lingkungan)
    return { terkirim: ling.id, alasan: 'terkirim' }
  }

  return { terkirim: null, alasan: 'tidak-ada-syarat-terpenuhi' }
}
