// ─────────────────────────────────────────────────────────────────────────────
// Buku ramalan — mencatat apa yang diramalkan aplikasi, lalu memeriksanya.
//
// MENGAPA INI ADA. Setiap aplikasi kesehatan meramalkan sesuatu: kesiapan hari
// ini, waktu pulih, perkiraan kesegaran besok. Tidak satu pun pernah kembali
// dan menunjukkan apakah ramalannya benar. Akibatnya pemakainya tidak punya
// cara mengetahui apakah model itu layak dipercaya untuk dirinya — dan pembuat
// aplikasinya pun tidak.
//
// Ketiadaan ini bukan kelalaian teknis. Menampilkan rapor ramalan berarti
// menunjukkan kapan model Anda keliru, dan itu merugikan secara dagang.
// Menampilkannya adalah pilihan yang berpihak pada pemakai, bukan pada
// tampilan.
//
// DUA ATURAN YANG MEMBUAT INI BUKAN SANDIWARA. Tanpa keduanya, "rapor ramalan"
// hanya menjadi pencocokan setelah kejadian, yang selalu terlihat bagus:
//
//   1. RAMALAN HANYA BOLEH DICATAT SEBELUM KEJADIANNYA. Ramalan untuk tanggal
//      D yang dicatat pada atau sesudah D ditolak. Tanpa aturan ini, seluruh
//      isinya adalah tebakan yang dibuat setelah jawabannya diketahui.
//
//   2. NILAI RAMALAN TIDAK PERNAH DAPAT DIUBAH. Sekali tercatat, ia terkunci.
//      Memperbarui ramalan lama agar mendekati kenyataan adalah cara paling
//      halus untuk membuat model apa pun tampak sempurna.
//
// Keduanya diperiksa di dalam kode, bukan diserahkan pada niat baik pemanggil.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_ramalan_v1'
/** Batas jumlah catatan supaya penyimpanan peramban tidak membengkak. */
const BATAS = 400

export interface Ramalan {
  /** Kunci unik: jenis + tanggal sasaran. Mencegah satu tanggal dicatat dua kali. */
  id: string
  /** Jenis besaran yang diramalkan, misalnya 'kesegaran'. */
  jenis: string
  /** Nama yang dibaca orang. */
  label: string
  /** Tanggal sasaran, format YYYY-MM-DD waktu setempat. */
  untuk: string
  /** Kapan ramalan ini dibuat. */
  dibuat: number
  /** Nilai yang diramalkan. Terkunci sejak dicatat. */
  ramalan: number
  satuan: string
  /** Model dan asumsi yang dipakai — supaya kekeliruan dapat ditelusuri. */
  model: string
  /** Selisih terkecil yang layak disebut meleset. */
  ambang: number
  /** Nilai yang benar-benar terjadi. Diisi belakangan. */
  sebenarnya?: number
  /** Kapan diisi. */
  diperiksa?: number
}

export function kunciTanggal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function baca(): Ramalan[] {
  try {
    const j = localStorage.getItem(KUNCI)
    if (!j) return []
    const a = JSON.parse(j)
    if (!Array.isArray(a)) return []
    // Bentuk tiap catatan diperiksa, bukan dipercaya. Satu catatan rusak dari
    // versi lama tidak boleh menjatuhkan seluruh halaman.
    return a.filter(
      (x) =>
        x && typeof x.id === 'string' && typeof x.untuk === 'string' &&
        typeof x.ramalan === 'number' && Number.isFinite(x.ramalan) &&
        typeof x.dibuat === 'number',
    )
  } catch {
    return []
  }
}

function tulis(a: Ramalan[]): void {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(a.slice(-BATAS)))
  } catch {
    // Penyimpanan penuh maupun ditolak. Buku ramalan bukan data yang wajib
    // ada; kegagalan menyimpannya tidak boleh mengganggu apa pun.
  }
}

export function semuaRamalan(): Ramalan[] {
  return baca()
}

/**
 * Catat sebuah ramalan.
 *
 * Ditolak diam-diam bila:
 *   * tanggal sasarannya sudah tiba maupun lewat — lihat aturan 1;
 *   * sudah ada ramalan untuk kunci yang sama — lihat aturan 2.
 *
 * Mengembalikan true hanya bila benar-benar tercatat.
 */
export function catatRamalan(r: Omit<Ramalan, 'id' | 'dibuat'>, sekarang = Date.now()): boolean {
  if (!Number.isFinite(r.ramalan)) return false

  // Aturan 1: hanya boleh mendahului kejadiannya.
  const hariIni = kunciTanggal(new Date(sekarang))
  if (r.untuk <= hariIni) return false

  const id = `${r.jenis}:${r.untuk}`
  const a = baca()
  // Aturan 2: tidak dapat ditimpa.
  if (a.some((x) => x.id === id)) return false

  a.push({ ...r, id, dibuat: sekarang })
  tulis(a)
  return true
}

/**
 * Isikan nilai yang sebenarnya terjadi.
 *
 * Hanya untuk ramalan yang tanggalnya sudah lewat dan belum pernah diperiksa.
 * Nilai yang sudah diperiksa tidak dapat diperbarui — memperbaruinya berarti
 * membuka pintu bagi penyesuaian setelah kejadian.
 */
export function periksaRamalan(jenis: string, untuk: string, sebenarnya: number, sekarang = Date.now()): boolean {
  if (!Number.isFinite(sebenarnya)) return false
  const a = baca()
  const i = a.findIndex((x) => x.id === `${jenis}:${untuk}`)
  if (i < 0) return false
  if (a[i].sebenarnya !== undefined) return false
  if (untuk >= kunciTanggal(new Date(sekarang))) return false
  a[i] = { ...a[i], sebenarnya, diperiksa: sekarang }
  tulis(a)
  return true
}

export interface RaporRamalan {
  jenis: string
  label: string
  satuan: string
  /** Jumlah ramalan yang sudah dapat dinilai. */
  jumlah: number
  /** Rerata besar kesalahan, tanpa memandang arah. */
  mae: number
  /**
   * Rerata kesalahan BESERTA ARAHNYA. Inilah yang paling berguna: nilai
   * positif berarti model ini cenderung meramalkan terlalu tinggi, dan
   * kecenderungan yang tetap jauh lebih mudah diperbaiki daripada kesalahan
   * yang acak.
   */
  bias: number
  /** Berapa banyak yang melesetnya masih di bawah ambang bermakna. */
  tepat: number
  /** Kesalahan terbesar yang pernah terjadi, untuk kejujuran. */
  terburuk: number
}

export function rapor(jenis: string): RaporRamalan | null {
  const a = baca().filter((x) => x.jenis === jenis && x.sebenarnya !== undefined)
  if (!a.length) return null
  const galat = a.map((x) => (x.sebenarnya as number) - x.ramalan)
  const mae = galat.reduce((s, g) => s + Math.abs(g), 0) / galat.length
  const bias = galat.reduce((s, g) => s + g, 0) / galat.length
  const tepat = a.filter((x, i) => Math.abs(galat[i]) < x.ambang).length
  const terburuk = galat.reduce((m, g) => (Math.abs(g) > Math.abs(m) ? g : m), 0)
  return {
    jenis,
    label: a[a.length - 1].label,
    satuan: a[a.length - 1].satuan,
    jumlah: a.length,
    mae: Math.round(mae * 10) / 10,
    bias: Math.round(bias * 10) / 10,
    tepat,
    terburuk: Math.round(terburuk * 10) / 10,
  }
}

/** Ramalan yang tanggalnya belum tiba. */
export function menunggu(jenis: string, sekarang = Date.now()): Ramalan[] {
  const hariIni = kunciTanggal(new Date(sekarang))
  return baca().filter((x) => x.jenis === jenis && x.sebenarnya === undefined && x.untuk > hariIni)
}

/**
 * Kalimat penilaian yang jujur, termasuk saat belum ada apa-apa untuk dinilai.
 *
 * Menampilkan ketepatan dari dua atau tiga ramalan akan memberi kesan model ini
 * sudah teruji, padahal dua ramalan tidak membuktikan apa pun. Ambangnya
 * ditetapkan pada tujuh, dan sebelum itu yang dikatakan adalah bahwa datanya
 * memang belum cukup.
 */
export function bacaRapor(r: RaporRamalan | null): string {
  if (!r) return 'No forecast has come due yet, so there is nothing to grade yet. This report card will fill in on its own.'
  if (r.jumlah < 7) {
    return `Only ${r.jumlah} forecast(s) gradable so far. Below seven, the accuracy figure doesn't mean anything yet and is deliberately not interpreted here.`
  }
  const arah = r.bias > 0 ? 'too low' : r.bias < 0 ? 'too high' : 'not skewed either way'
  const persen = Math.round((r.tepat / r.jumlah) * 100)
  return `Out of ${r.jumlah} forecasts, ${r.tepat} (${persen}%) missed by less than the meaningful threshold. Average error size ${r.mae} ${r.satuan || 'units'}, and forecasts tend to run ${arah} by ${Math.abs(r.bias)}. The worst error so far was ${r.terburuk}.`
}
