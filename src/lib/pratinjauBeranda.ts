import { kunciTanggal } from './ramalan'
import { getVitals } from './healthVitals'
import { getWorkouts } from './workoutStore'
import { statusSingkat } from './pelatih'
import { hrMaxFromAge } from './workoutImport'
import type { FoodEntry, SleepLog } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Pratinjau fitur untuk beranda — isi fitur, bukan pintu ke fitur.
//
// MASALAH YANG DIPECAHKAN. Kisi lambang memberi tahu sebuah fitur ADA, tetapi
// tidak memberi tahu apa pun tentang keadaan pemakainya. Akibatnya setiap
// pertanyaan sesederhana "berapa tidur saya semalam" tetap menuntut satu
// ketukan dan satu pemuatan halaman, dan pertanyaan yang harus dibayar dengan
// dua langkah akhirnya tidak ditanyakan sama sekali.
//
// ATURAN YANG MEMBUAT KARTU INI TIDAK BERBOHONG. Ketiganya dijaga di dalam
// kode, bukan diserahkan pada kehati-hatian pemanggil:
//
//   1. TIDAK ADA ANGKA YANG DIKARANG. Bila datanya tidak ada, kartunya berkata
//      datanya tidak ada — bukan menampilkan 0, bukan "—", dan bukan contoh.
//      Nol yang sebenarnya berarti "belum diisi" mengajarkan orang bahwa angka
//      di aplikasi ini boleh diabaikan, dan sesudah itu angka yang benar pun
//      ikut diabaikan.
//
//   2. TIAP ANGKA MEMBAWA UMURNYA. "58 bpm" tanpa keterangan kapan diukur
//      terbaca sebagai keadaan sekarang, padahal bisa berasal dari enam hari
//      lalu. Yang lama ditandai sebagai lama.
//
//   3. TIDAK ADA PENILAIAN BAIK/BURUK DI KARTU. Ruang sebesar ini tidak cukup
//      untuk menyebut populasi pembanding maupun ragam hariannya, dan penilaian
//      tanpa keduanya adalah persis yang dibongkar oleh halaman rentang rujukan.
//      Kartu menyatakan nilainya; penilaiannya ada di halaman yang punya ruang
//      untuk mempertanggungjawabkannya.
// ─────────────────────────────────────────────────────────────────────────────

export interface Pratinjau {
  /** Kunci tetap, dipakai React dan pengujian. */
  id: string
  /** Nama wilayahnya, sependek mungkin. */
  wilayah: string
  ke: string
  /** Nilai utama. Kosong berarti belum ada data — lihat aturan 1. */
  nilai: string
  satuan?: string
  /** Satu kalimat: apa arti angka itu, atau apa yang perlu dilakukan. */
  garis: string
  /** Umur data, bila layak disebut. Lihat aturan 2. */
  umur?: string
  nada: string
  /**
   * Deret nilai terakhir untuk grafik kecil — TERLAMA di depan, terbaru di
   * belakang. Kosong bila riwayatnya kurang dari dua titik.
   *
   * ATURAN KEEMPAT, LAHIR DARI GRAFIK INI. Grafik kecil sangat mudah
   * berbohong: dua titik sudah cukup menggambar garis yang terlihat seperti
   * kecenderungan, padahal dua pengukuran hanya dapat berbeda, tidak dapat
   * menunjukkan arah. Karena itu garisnya baru digambar pada MINIMAL EMPAT
   * titik, dan sumbunya tidak pernah dipotong — grafik yang dasarnya bukan nol
   * membesar-besarkan perubahan kecil, dan itu persis cara grafik dipakai untuk
   * menakut-nakuti.
   */
  deret?: number[]
  /**
   * Selisih terhadap awal deret, dalam persen, beserta jangkanya. Hanya diisi
   * bila deretnya cukup panjang. Naik atau turun DITAMPILKAN APA ADANYA tanpa
   * warna hijau-merah: pada berat badan turun belum tentu baik, pada denyut
   * istirahat naik belum tentu buruk, dan ubin sekecil ini tidak punya ruang
   * untuk mempertanggungjawabkan penilaian semacam itu (aturan 3).
   */
  tren?: { persen: number; jangka: string }
}

const CUKUP_TITIK = 4

/**
 * Bangun deret dan trennya dari pasangan tanggal-nilai.
 *
 * Satu nilai per hari (yang terakhir pada hari itu), diurutkan menaik, dan
 * dipotong pada `maks` hari terakhir. Mengembalikan undefined bila titiknya
 * kurang dari empat — lihat alasannya pada medan `deret`.
 */
function bangunDeret(
  titik: { tanggal: string; nilai: number }[],
  jangka: string,
  maks = 14,
): { deret?: number[]; tren?: { persen: number; jangka: string } } {
  const perHari = new Map<string, number>()
  for (const t of titik) {
    if (!t.tanggal || typeof t.nilai !== 'number' || !Number.isFinite(t.nilai)) continue
    perHari.set(t.tanggal, t.nilai)
  }
  const urut = [...perHari.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-maks)
  if (urut.length < CUKUP_TITIK) return {}
  const deret = urut.map(([, v]) => v)
  const awal = deret[0]
  const akhir = deret[deret.length - 1]
  if (!awal) return { deret }
  return { deret, tren: { persen: Math.round(((akhir - awal) / awal) * 100), jangka } }
}

const HARI = 86400_000

function selisihHari(tanggal: string, sekarang: number): number | null {
  const t = Date.parse(`${tanggal}T12:00:00`)
  if (Number.isNaN(t)) return null
  return Math.round((sekarang - t) / HARI)
}

/**
 * Umur data dalam kata-kata, dan null bila memang hari ini.
 *
 * Menandai data hari ini dengan "hari ini" membuat setiap kartu memikul satu
 * baris yang tidak menambah keterangan apa pun; yang perlu menonjol justru
 * data yang SUDAH TUA.
 */
function umurKata(hari: number | null): string | undefined {
  if (hari === null || hari <= 0) return undefined
  if (hari === 1) return 'yesterday'
  if (hari < 7) return `${hari} days ago`
  if (hari < 30) return `${Math.floor(hari / 7)} week${Math.floor(hari / 7) === 1 ? '' : 's'} ago`
  return 'over a month ago'
}

export interface BahanPratinjau {
  foods: FoodEntry[]
  sleepLogs: SleepLog[]
  umur?: number
  sekarang?: number
}

/** Latihan: kesegaran bila modelnya punya cukup bahan, kalau tidak jumlah sesi. */
function pratinjauLatihan(umurTahun: number, sekarang: number): Pratinjau {
  const w = getWorkouts()
  if (!w.length) {
    return {
      id: 'latihan', wilayah: 'Training', ke: '/latihan', nilai: '', garis: 'No sessions saved yet. Connect a device or log one.',
      nada: 'text-emerald-600 dark:text-emerald-400',
    }
  }
  const v = getVitals()
  const teramati = w.reduce((a, x) => Math.max(a, x.maxHr ?? 0), 0)
  const sex = (v.sex === 'F' ? 'F' : 'M') as 'M' | 'F'
  const k = {
    hrMax: Math.max(teramati, hrMaxFromAge(umurTahun, sex)),
    hrRest: typeof v.restingHr === 'number' && v.restingHr > 0 ? v.restingHr : 60,
    sex,
  }
  const st = statusSingkat(w, k, sekarang)
  const terakhir = w
    .map((x) => Date.parse(x.mulai))
    .filter((t) => !Number.isNaN(t))
    .reduce((a, t) => Math.max(a, t), 0)
  const hari = terakhir ? Math.floor((sekarang - terakhir) / HARI) : null
  if (!st) {
    return {
      id: 'latihan', wilayah: 'Training', ke: '/latihan', nilai: String(w.length), satuan: 'sessions',
      garis: 'Saved, but not yet enough to compute freshness.',
      umur: umurKata(hari), nada: 'text-emerald-600 dark:text-emerald-400',
    }
  }
  return {
    id: 'latihan', wilayah: 'Training', ke: '/latihan',
    nilai: String(Math.round(st.kesegaran)), satuan: 'fresh',
    // Tanpa "bagus"/"kurang": lihat aturan 3.
    garis: 'Fitness minus fatigue, from the training-load model.',
    umur: umurKata(hari),
    nada: 'text-emerald-600 dark:text-emerald-400',
  }
}

function pratinjauGizi(foods: FoodEntry[], sekarang: number): Pratinjau {
  const hariIni = kunciTanggal(new Date(sekarang))
  const kcal = foods.filter((f) => f.date === hariIni).reduce((a, f) => a + (f.kcal || 0), 0)
  if (!foods.length) {
    return {
      id: 'gizi', wilayah: 'Nutrition', ke: '/nutrition', nilai: '',
      garis: 'No food logged yet. Log one to begin.',
      nada: 'text-amber-600 dark:text-amber-400',
    }
  }
  if (kcal === 0) {
    // Nol yang JUJUR: ada riwayat, tetapi hari ini memang belum dicatat.
    // Dibedakan dari nol yang berarti "tidak ada data" — lihat aturan 1.
    return {
      id: 'gizi', wilayah: 'Nutrition', ke: '/nutrition', nilai: '',
      garis: 'Nothing logged today.',
      nada: 'text-amber-600 dark:text-amber-400',
    }
  }
  const porsi = foods.filter((f) => f.date === hariIni).length
  // Kalori DIJUMLAHKAN per hari lebih dahulu; memakai tiap catatan sebagai satu
  // titik akan menggambar garis yang naik-turun mengikuti jam makan, bukan
  // mengikuti asupan hariannya.
  const perHari = new Map<string, number>()
  for (const f of foods) if (f.date) perHari.set(f.date, (perHari.get(f.date) ?? 0) + (f.kcal || 0))
  return {
    id: 'gizi', wilayah: 'Nutrition', ke: '/nutrition', nilai: String(Math.round(kcal)), satuan: 'kcal',
    garis: `From ${porsi} ${porsi === 1 ? 'entry' : 'entries'} today.`,
    nada: 'text-amber-600 dark:text-amber-400',
    ...bangunDeret([...perHari.entries()].map(([tanggal, nilai]) => ({ tanggal, nilai })), '14 days'),
  }
}

function pratinjauTidur(logs: SleepLog[], sekarang: number): Pratinjau {
  const urut = [...logs].filter((l) => typeof l.hours === 'number').sort((a, b) => (a.date < b.date ? 1 : -1))
  const t = urut[0]
  if (!t) {
    return {
      id: 'tidur', wilayah: 'Sleep', ke: '/recovery', nilai: '',
      garis: 'No sleep logged yet.',
      nada: 'text-indigo-600 dark:text-indigo-400',
    }
  }
  const hari = selisihHari(t.date, sekarang)
  // Satu digit di belakang koma sudah melampaui ketelitian yang mungkin: waktu
  // tidur yang dilaporkan sendiri meleset dalam hitungan puluhan menit.
  const jam = Math.round(t.hours * 10) / 10
  return {
    id: 'tidur', wilayah: 'Sleep', ke: '/recovery', nilai: String(jam), satuan: 'hours',
    garis: urut.length > 1 ? `Latest of ${urut.length} nights.` : 'Your first entry.',
    umur: umurKata(hari),
    nada: 'text-indigo-600 dark:text-indigo-400',
    ...bangunDeret(logs.map((l) => ({ tanggal: l.date, nilai: l.hours as number })), '14 nights'),
  }
}

function pratinjauTubuh(sekarang: number): Pratinjau {
  const v = getVitals()
  // Nama medannya measuredAt/syncedAt, bukan updatedAt — dibaca dari sumber
  // yang sama dengan vitalsAge() supaya keduanya tidak pernah berselisih.
  const iso = typeof v.measuredAt === 'string' ? v.measuredAt : typeof v.syncedAt === 'string' ? v.syncedAt : null
  const t = iso ? Date.parse(iso) : NaN
  const hari = Number.isNaN(t) ? null : Math.floor((sekarang - t) / HARI)
  if (typeof v.restingHr === 'number' && v.restingHr > 0) {
    return {
      id: 'tubuh', wilayah: 'Body', ke: '/tubuh', nilai: String(v.restingHr), satuan: 'bpm resting',
      garis: 'Your most recent resting heart rate.',
      umur: umurKata(hari),
      nada: 'text-rose-600 dark:text-rose-400',
    }
  }
  if (v.systolic && v.diastolic) {
    return {
      id: 'tubuh', wilayah: 'Body', ke: '/tubuh', nilai: `${v.systolic}/${v.diastolic}`, satuan: 'mmHg',
      garis: 'One blood-pressure reading, not a diagnosis.',
      umur: umurKata(hari),
      nada: 'text-rose-600 dark:text-rose-400',
    }
  }
  return {
    id: 'tubuh', wilayah: 'Body', ke: '/tubuh', nilai: '',
    garis: 'No vitals saved yet.',
    nada: 'text-rose-600 dark:text-rose-400',
  }
}

/**
 * Empat pratinjau, selalu dalam urutan yang sama.
 *
 * URUTANNYA SENGAJA TETAP, tidak diurutkan menurut "yang paling perlu
 * diperhatikan". Kartu yang berpindah tempat menurut keadaan menghancurkan
 * ingatan letak: orang menghafal posisi jauh lebih cepat daripada membaca
 * label, dan tata letak yang berubah-ubah memaksa setiap kunjungan dimulai
 * dengan membaca ulang seluruhnya.
 */
export function pratinjauBeranda(b: BahanPratinjau): Pratinjau[] {
  const sekarang = b.sekarang ?? Date.now()
  const umur = b.umur && b.umur > 0 ? b.umur : 30
  return [
    pratinjauLatihan(umur, sekarang),
    pratinjauGizi(b.foods ?? [], sekarang),
    pratinjauTidur(b.sleepLogs ?? [], sekarang),
    pratinjauTubuh(sekarang),
  ]
}
