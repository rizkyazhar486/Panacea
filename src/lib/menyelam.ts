// ─────────────────────────────────────────────────────────────────────────────
// Catatan menyelam: kedalaman, jeda permukaan, dan waktu tunggu sebelum terbang.
//
// APLIKASI INI BUKAN KOMPUTER SELAM, DAN TIDAK BOLEH DIPAKAI SEBAGAI SATU.
// Aturan itu menentukan seluruh bentuk berkas ini, jadi ditulis di paling atas:
//
//   * TIDAK ada perhitungan dekompresi, tidak ada batas tanpa-dekompresi, dan
//     tidak ada jadwal berhenti. Semua itu bergantung pada model jaringan,
//     profil menyelam sesungguhnya (bukan sekadar kedalaman terdalam), gas yang
//     dipakai, suhu, dan usaha fisik — dan salah menghitungnya melukai orang
//     dengan cara yang tidak dapat ditarik kembali. Komputer selam di
//     pergelangan tangan Anda yang berwenang di sana, bukan telepon.
//   * Yang dikerjakan berkas ini hanya MENCATAT apa yang sudah terjadi dan
//     MENGHITUNG WAKTU dari kejadian itu: berapa lama sejak muncul ke
//     permukaan, dan berapa lama lagi sebelum aman naik pesawat.
//
// WAKTU TUNGGU SEBELUM TERBANG MEMAKAI ANJURAN DAN 12/18 JAM, dan sengaja
// memilih yang lebih lama bila ragu. Angka ini bukan jaminan — ia anjuran
// konsensus, dan penyelam yang merasa tidak enak badan tetap harus menunda
// meski waktunya sudah lewat.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_selam_v1'

export type JenisSelam = 'sekali' | 'berulang' | 'multihari'

export interface Selaman {
  id: string
  /** Waktu MUNCUL KE PERMUKAAN — inilah yang menjadi dasar semua hitungan waktu. */
  keluar: string
  /** Waktu turun; dipakai untuk lama selam bila ada. */
  masuk?: string
  kedalamanMaks: number
  kedalamanRata?: number
  lokasi?: string
  /** Jenis air menentukan pemberat dan daya apung, dan sering dicatat orang. */
  air?: 'laut' | 'tawar'
  suhuC?: number
  gas?: string
  catatan?: string
}

export function bacaSelaman(): Selaman[] {
  try {
    const raw = localStorage.getItem(KUNCI)
    const v = raw ? JSON.parse(raw) : []
    if (!Array.isArray(v)) return []
    return v
      .filter((s) => s && typeof s.id === 'string' && typeof s.keluar === 'string' && !Number.isNaN(Date.parse(s.keluar)))
      .sort((a, b) => Date.parse(b.keluar) - Date.parse(a.keluar))
  } catch {
    return []
  }
}

function tulis(l: Selaman[]) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(l.slice(0, 500)))
  } catch {
    /* penyimpanan penuh — nilai di layar tetap benar untuk sesi ini */
  }
}

export function simpanSelaman(s: Selaman): Selaman[] {
  const l = bacaSelaman().filter((x) => x.id !== s.id)
  l.unshift(s)
  l.sort((a, b) => Date.parse(b.keluar) - Date.parse(a.keluar))
  tulis(l)
  return l
}

export function hapusSelaman(id: string): Selaman[] {
  const l = bacaSelaman().filter((x) => x.id !== id)
  tulis(l)
  return l
}

/** Lama menyelam dalam menit, bila waktu turunnya dicatat. */
export function lamaMenit(s: Selaman): number | null {
  if (!s.masuk) return null
  const a = Date.parse(s.masuk)
  const b = Date.parse(s.keluar)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null
  return Math.round((b - a) / 60000)
}

export interface JedaPermukaan {
  menit: number
  /** Selaman berikutnya dianggap BERULANG bila jedanya kurang dari ini. */
  berulang: boolean
  teks: string
}

/**
 * Jeda permukaan sejak selaman terakhir.
 *
 * Selaman dalam 12 jam sesudah yang sebelumnya lazim disebut BERULANG, sebab
 * nitrogen sisa dari selaman pertama masih terhitung. Yang dilakukan di sini
 * hanya MENANDAI keadaan itu — bukan menghitung nitrogen sisanya.
 */
export function jedaPermukaan(terakhir: Selaman, sekarang = Date.now()): JedaPermukaan {
  const menit = Math.max(0, Math.round((sekarang - Date.parse(terakhir.keluar)) / 60000))
  const jam = Math.floor(menit / 60)
  const sisa = menit % 60
  return {
    menit,
    berulang: menit < 12 * 60,
    teks: jam > 0 ? `${jam}h ${sisa}m` : `${sisa}m`,
  }
}

export interface WaktuTerbang {
  /** Berapa jam lagi sampai boleh terbang; 0 berarti sudah lewat. */
  jamLagi: number
  /** Jam tunggu yang dipakai — 12 atau 18. */
  syaratJam: number
  /** Kenapa syaratnya sekian. */
  alasan: string
  bolehJam: string
  aman: boolean
}

/**
 * Waktu tunggu sebelum naik pesawat.
 *
 * Anjuran Divers Alert Network yang lazim dipakai: sedikitnya 12 jam sesudah
 * SATU selaman tanpa dekompresi, dan sedikitnya 18 jam sesudah beberapa
 * selaman dalam sehari atau menyelam beberapa hari berturut-turut. Bila
 * keadaannya tidak jelas, yang dipilih adalah yang LEBIH LAMA.
 */
export function waktuTerbang(riwayat: Selaman[], sekarang = Date.now()): WaktuTerbang | null {
  if (!riwayat.length) return null
  const terakhir = riwayat[0]
  const tKeluar = Date.parse(terakhir.keluar)
  if (!Number.isFinite(tKeluar)) return null

  // Berapa selaman dalam 24 jam sebelum selaman terakhir berakhir, dan apakah
  // ada selaman pada hari-hari sebelumnya secara berturut-turut.
  const dalam24 = riwayat.filter((s) => {
    const t = Date.parse(s.keluar)
    return Number.isFinite(t) && t <= tKeluar && t > tKeluar - 24 * 3600_000
  }).length
  const dalam72 = riwayat.filter((s) => {
    const t = Date.parse(s.keluar)
    return Number.isFinite(t) && t <= tKeluar && t > tKeluar - 72 * 3600_000
  }).length

  const banyak = dalam24 > 1 || dalam72 > 2
  const syaratJam = banyak ? 18 : 12
  const alasan = banyak
    ? dalam24 > 1
      ? `${dalam24} dives within 24 hours — the longer 18-hour guideline applies.`
      : `Dives on consecutive days (${dalam72} in 72 hours) — the longer 18-hour guideline applies.`
    : 'A single no-decompression dive — the 12-hour guideline applies.'

  const boleh = tKeluar + syaratJam * 3600_000
  const sisaMs = boleh - sekarang
  return {
    jamLagi: Math.max(0, Math.round((sisaMs / 3600_000) * 10) / 10),
    syaratJam,
    alasan,
    bolehJam: new Date(boleh).toISOString(),
    aman: sisaMs <= 0,
  }
}

export interface RingkasSelam {
  total: number
  terdalam: number
  totalMenit: number
  rataKedalaman: number | null
  terakhir: Selaman | null
  /** Jumlah selaman dalam 12 bulan terakhir — ukuran kemutakhiran pengalaman. */
  setahun: number
}

export function ringkasSelam(l: Selaman[], sekarang = Date.now()): RingkasSelam {
  const menit = l.map(lamaMenit).filter((m): m is number => m != null)
  const dalam = l.map((s) => s.kedalamanRata).filter((d): d is number => typeof d === 'number' && d > 0)
  return {
    total: l.length,
    terdalam: l.reduce((a, s) => Math.max(a, s.kedalamanMaks || 0), 0),
    totalMenit: menit.reduce((a, m) => a + m, 0),
    rataKedalaman: dalam.length ? Math.round((dalam.reduce((a, d) => a + d, 0) / dalam.length) * 10) / 10 : null,
    terakhir: l[0] ?? null,
    setahun: l.filter((s) => Date.parse(s.keluar) > sekarang - 365 * 86400_000).length,
  }
}

/**
 * Peringatan yang berdasar pada CATATAN, bukan pada model dekompresi.
 *
 * Tiap butir dapat diperiksa kebenarannya dari data yang dimasukkan sendiri,
 * dan tidak satu pun mengklaim tahu keadaan jaringan tubuh penyelam.
 */
export function peringatan(l: Selaman[], sekarang = Date.now()): string[] {
  const out: string[] = []
  if (!l.length) return out
  const t = waktuTerbang(l, sekarang)
  if (t && !t.aman) {
    out.push(`Do not fly for another ${t.jamLagi} h. ${t.alasan}`)
  }
  const terakhir = l[0]
  const jeda = jedaPermukaan(terakhir, sekarang)
  if (jeda.berulang) {
    out.push(`Surface interval ${jeda.teks}. A dive now counts as a repetitive dive — set your computer accordingly.`)
  }
  if (terakhir.kedalamanMaks >= 30) {
    out.push(`Last dive reached ${terakhir.kedalamanMaks} m. Below 30 m, gas consumption and narcosis both rise sharply, and no-decompression time shortens fast.`)
  }
  const jarak = (sekarang - Date.parse(terakhir.keluar)) / 86400_000
  if (jarak > 180 && l.length > 1) {
    out.push(`It has been ${Math.round(jarak)} days since your last dive. Most agencies suggest a refresher after about six months out of the water.`)
  }
  return out
}
