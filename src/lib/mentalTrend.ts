// ─────────────────────────────────────────────────────────────────────────────
// RIWAYAT PENAPISAN JIWA — PHQ-9 dan GAD-7 dari waktu ke waktu.
//
// Sampai sekarang kedua penapis itu dihitung lalu hilang begitu halamannya
// ditutup. Untuk penapisan sesaat itu cukup; untuk keadaan jiwa tidak, karena
// yang bermakna secara klinis bukan skor tunggal melainkan PERUBAHANNYA. PHQ-9
// bernilai 14 tidak berarti apa-apa sendirian: ia kabar buruk bila bulan lalu
// 6, dan kabar baik bila bulan lalu 22.
//
// Perubahan ditafsirkan memakai selisih terkecil yang dianggap bermakna secara
// klinis pada makalah aslinya — 5 titik untuk PHQ-9 (Löwe 2004) dan 4 titik
// untuk GAD-7 (Toussaint 2020). Ambang inilah yang membedakan perbaikan
// sungguhan dari naik-turun biasa; tanpanya, setiap goyangan dua titik akan
// dilaporkan sebagai kemajuan, dan itu membuat alatnya berbohong dengan halus.
//
// Yang TIDAK dilakukan di sini: mengubah skor jiwa menjadi "tahun penuaan".
// Depresi memang berhubungan dengan mortalitas, tetapi koefisien untuk
// mengubah satu titik PHQ-9 menjadi sekian tahun umur biologis tidak ada di
// makalah mana pun — mengarangnya persis kesalahan yang dihindari seluruh
// mesin longevity di aplikasi ini.
// ─────────────────────────────────────────────────────────────────────────────

export type Alat = 'phq9' | 'gad7'

export interface Catatan {
  alat: Alat
  skor: number
  /** ISO. */
  waktu: string
  /** PHQ-9 butir 9 — pikiran menyakiti diri. Disimpan terpisah karena tidak pernah boleh larut ke dalam total. */
  butir9?: number
}

export const MAKSIMAL: Record<Alat, number> = { phq9: 27, gad7: 21 }
/** Selisih terkecil yang bermakna secara klinis. */
export const MCID: Record<Alat, number> = { phq9: 5, gad7: 4 }

export interface Pita { label: string; tingkat: 0 | 1 | 2 | 3 | 4 }

export function pita(alat: Alat, skor: number): Pita {
  if (alat === 'phq9') {
    if (skor <= 4) return { label: 'Minimal', tingkat: 0 }
    if (skor <= 9) return { label: 'Mild', tingkat: 1 }
    if (skor <= 14) return { label: 'Moderate', tingkat: 2 }
    if (skor <= 19) return { label: 'Moderately severe', tingkat: 3 }
    return { label: 'Severe', tingkat: 4 }
  }
  if (skor <= 4) return { label: 'Minimal', tingkat: 0 }
  if (skor <= 9) return { label: 'Mild', tingkat: 1 }
  if (skor <= 14) return { label: 'Moderate', tingkat: 2 }
  return { label: 'Severe', tingkat: 4 }
}

export const KUNCI_RIWAYAT = 'pmd_jiwa_riwayat_v1'
const BATAS = 200

export function bacaRiwayat(): Catatan[] {
  try {
    const mentah = JSON.parse(localStorage.getItem(KUNCI_RIWAYAT) || '[]')
    if (!Array.isArray(mentah)) return []
    return mentah.filter(sah)
  } catch { return [] }
}

function sah(c: unknown): c is Catatan {
  if (!c || typeof c !== 'object') return false
  const x = c as Catatan
  return (x.alat === 'phq9' || x.alat === 'gad7')
    && typeof x.skor === 'number' && Number.isFinite(x.skor)
    && x.skor >= 0 && x.skor <= MAKSIMAL[x.alat]
    && typeof x.waktu === 'string' && !Number.isNaN(Date.parse(x.waktu))
}

/** Menyimpan satu hasil. Catatan lama tidak pernah ditimpa — riwayatlah isinya. */
export function simpan(c: Catatan): Catatan[] {
  if (!sah(c)) return bacaRiwayat()
  const semua = [...bacaRiwayat(), c]
    .sort((a, b) => Date.parse(a.waktu) - Date.parse(b.waktu))
    .slice(-BATAS)
  try { localStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(semua)) } catch { /* abaikan */ }
  return semua
}

export function riwayatAlat(semua: Catatan[], alat: Alat): Catatan[] {
  return semua.filter((c) => c.alat === alat).sort((a, b) => Date.parse(a.waktu) - Date.parse(b.waktu))
}

export interface Perubahan {
  terbaru: Catatan
  sebelumnya?: Catatan
  selisih?: number
  /** Apakah selisihnya melewati ambang bermakna klinis. */
  bermakna: boolean
  arah: 'membaik' | 'memburuk' | 'tetap' | 'baru'
  kalimat: string
  hariAntara?: number
}

/**
 * Membandingkan hasil terbaru dengan yang sebelumnya.
 *
 * Perubahan di bawah ambang MCID sengaja disebut "tidak melewati ambang", bukan
 * "stabil" atau "membaik sedikit". Selisih tiga titik pada PHQ-9 memang tidak
 * bisa dibedakan dari naik-turun biasa, dan mengatakannya apa adanya lebih
 * berguna daripada memberi kabar baik yang tidak ditopang apa pun.
 */
export function perubahan(semua: Catatan[], alat: Alat): Perubahan | null {
  const r = riwayatAlat(semua, alat)
  if (!r.length) return null
  const terbaru = r[r.length - 1]
  const sebelumnya = r.length > 1 ? r[r.length - 2] : undefined
  const nama = alat === 'phq9' ? 'PHQ-9' : 'GAD-7'
  if (!sebelumnya) {
    return {
      terbaru, bermakna: false, arah: 'baru',
      kalimat: `First ${nama} recorded. A single score says less than the change between two — take it again in two to four weeks.`,
    }
  }
  const selisih = terbaru.skor - sebelumnya.skor
  const hariAntara = Math.round((Date.parse(terbaru.waktu) - Date.parse(sebelumnya.waktu)) / 86400000)
  const bermakna = Math.abs(selisih) >= MCID[alat]
  const arah = !bermakna ? 'tetap' : selisih < 0 ? 'membaik' : 'memburuk'
  const besar = Math.abs(selisih)
  const kalimat = !bermakna
    ? `${selisih === 0 ? 'No change' : `${besar} point${besar > 1 ? 's' : ''} ${selisih < 0 ? 'lower' : 'higher'}`} than ${hariAntara} days ago — below the ${MCID[alat]}-point change considered clinically meaningful for ${nama}, so this is within ordinary variation.`
    : selisih < 0
      ? `Down ${besar} points over ${hariAntara} days — past the ${MCID[alat]}-point threshold considered a meaningful improvement on ${nama}.`
      : `Up ${besar} points over ${hariAntara} days — past the ${MCID[alat]}-point threshold considered a meaningful worsening on ${nama}. Worth telling someone.`
  return { terbaru, sebelumnya, selisih, bermakna, arah, kalimat, hariAntara }
}

/**
 * Apakah butir 9 PHQ-9 pernah positif dalam catatan terbaru.
 *
 * Dipisahkan dari skor total dengan sengaja: seseorang bisa mendapat PHQ-9
 * bernilai 6 — "ringan" — sambil menjawab butir 9 dengan positif, dan total
 * yang terdengar menenangkan itu justru menutupi satu-satunya jawaban yang
 * menuntut tindakan hari itu juga.
 */
export function butir9Terbaru(semua: Catatan[]): boolean {
  const r = riwayatAlat(semua, 'phq9')
  const t = r[r.length - 1]
  return !!t && (t.butir9 ?? 0) > 0
}

/** Titik untuk grafik sederhana: nilai dinormalkan 0..1 terhadap maksimal alatnya. */
export function titikGrafik(semua: Catatan[], alat: Alat): Array<{ x: number; y: number; skor: number; waktu: string }> {
  const r = riwayatAlat(semua, alat)
  if (r.length < 2) return r.map((c) => ({ x: 0, y: c.skor / MAKSIMAL[alat], skor: c.skor, waktu: c.waktu }))
  const t0 = Date.parse(r[0].waktu)
  const rentang = Math.max(1, Date.parse(r[r.length - 1].waktu) - t0)
  return r.map((c) => ({
    x: (Date.parse(c.waktu) - t0) / rentang,
    y: c.skor / MAKSIMAL[alat],
    skor: c.skor,
    waktu: c.waktu,
  }))
}
