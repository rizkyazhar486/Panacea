// Pelacak progres pekanan: perbandingan minggu ke minggu.
//
// Yang diminta layar ini bukan "tampilkan angka" melainkan BANDINGKAN: apa
// yang membaik, apa yang memburuk, dan apa yang sebenarnya diam saja. Tiga
// pertanyaan itu keputusan tentang ARAH, dan arah hanya punya arti kalau
// perubahannya lebih besar daripada derau alat ukurnya.
//
// SATU HAL YANG MEMBEDAKAN BERKAS INI DARI PELACAK KEBANYAKAN: setiap ukuran
// membawa AMBANG BERARTI-nya sendiri. Berat badan bergerak satu kilogram
// hanya karena air dan isi usus; menyebut itu "progres" mengajari orang
// mengejar derau. Di bawah ambang itu jawabannya "flat", bukan panah kecil.

export type ArahProgres = 'membaik' | 'memburuk' | 'datar'

export interface UkuranProgres {
  id: string
  label: string
  satuan: string
  /** Arah yang dianggap membaik. */
  baik: 'naik' | 'turun'
  /**
   * Perubahan terkecil yang layak disebut perubahan, dalam satuan di atas.
   * Bukan selera: di bawah ini, alat ukur atau tubuh sehari-hari sudah
   * menjelaskan seluruh selisihnya.
   */
  ambang: number
  /** Dari mana angkanya berasal, supaya tidak ada yang mengira ini terukur otomatis. */
  asal: 'diisi sendiri' | 'dari catatan latihan'
}

export const UKURAN: readonly UkuranProgres[] = [
  { id: 'berat', label: 'Weight', satuan: 'kg', baik: 'turun', ambang: 0.5, asal: 'diisi sendiri' },
  { id: 'pinggang', label: 'Waist', satuan: 'cm', baik: 'turun', ambang: 1, asal: 'diisi sendiri' },
  { id: 'kekuatan', label: 'Strength', satuan: 'kg total', baik: 'naik', ambang: 2.5, asal: 'diisi sendiri' },
  { id: 'energi', label: 'Energy', satuan: '/10', baik: 'naik', ambang: 1, asal: 'diisi sendiri' },
  { id: 'tidur', label: 'Sleep', satuan: 'h/night', baik: 'naik', ambang: 0.5, asal: 'diisi sendiri' },
  { id: 'konsistensi', label: 'Sessions', satuan: '/week', baik: 'naik', ambang: 1, asal: 'dari catatan latihan' },
  { id: 'protein', label: 'Protein', satuan: 'g/day', baik: 'naik', ambang: 10, asal: 'diisi sendiri' },
]

/** Satu pekan. Nilai yang tidak diisi TETAP tidak ada; nol adalah nol. */
export interface PekanProgres {
  /** ISO tanggal Senin pekan itu. */
  pekan: string
  nilai: Partial<Record<string, number>>
}

export interface BandingPekan {
  ukuran: UkuranProgres
  kini: number | null
  lalu: number | null
  delta: number | null
  arah: ArahProgres | null
  /** Deret yang benar-benar ada, untuk grafiknya. */
  deret: { pekan: string; nilai: number }[]
}

function isoSenin(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const hari = (t.getUTCDay() + 6) % 7
  t.setUTCDate(t.getUTCDate() - hari)
  return t.toISOString().slice(0, 10)
}

export function kunciPekan(tanggal: Date | string): string {
  return isoSenin(typeof tanggal === 'string' ? new Date(tanggal) : tanggal)
}

/**
 * Arah perubahan, dengan ambang berarti.
 *
 * Perhatikan urutannya: ambang diperiksa LEBIH DAHULU daripada tandanya.
 * Membalik urutan itu membuat setiap selisih sekecil apa pun mendapat panah,
 * dan panah adalah klaim.
 */
export function arahPerubahan(u: UkuranProgres, lalu: number, kini: number): ArahProgres {
  const delta = kini - lalu
  if (Math.abs(delta) < u.ambang) return 'datar'
  const naik = delta > 0
  return (u.baik === 'naik') === naik ? 'membaik' : 'memburuk'
}

export function bandingkan(pekan: readonly PekanProgres[]): BandingPekan[] {
  const urut = [...pekan].sort((a, b) => (a.pekan < b.pekan ? -1 : 1))
  return UKURAN.map((u) => {
    const deret = urut
      .map((p) => ({ pekan: p.pekan, nilai: p.nilai[u.id] }))
      .filter((x): x is { pekan: string; nilai: number } => typeof x.nilai === 'number' && Number.isFinite(x.nilai))
    const kini = deret.length ? deret[deret.length - 1].nilai : null
    const lalu = deret.length > 1 ? deret[deret.length - 2].nilai : null
    const delta = kini !== null && lalu !== null ? +(kini - lalu).toFixed(2) : null
    const arah = kini !== null && lalu !== null ? arahPerubahan(u, lalu, kini) : null
    return { ukuran: u, kini, lalu, delta, arah, deret }
  })
}

/**
 * Ringkasan "apa yang berhasil, apa yang bermasalah".
 *
 * Hanya dari ukuran yang PUNYA dua pekan. Sebuah ukuran yang baru diisi
 * sekali tidak boleh muncul di kedua daftar, karena belum ada perbandingan
 * apa pun yang bisa dibuat tentangnya.
 */
export function ringkas(banding: readonly BandingPekan[]): {
  berhasil: BandingPekan[]
  bermasalah: BandingPekan[]
  datar: BandingPekan[]
  belumCukup: BandingPekan[]
} {
  return {
    berhasil: banding.filter((b) => b.arah === 'membaik'),
    bermasalah: banding.filter((b) => b.arah === 'memburuk'),
    datar: banding.filter((b) => b.arah === 'datar'),
    belumCukup: banding.filter((b) => b.arah === null),
  }
}

export const BATAS_PROGRES: readonly string[] = [
  'Every figure here is what you typed, plus the session count read from your training log. Nothing is measured by this app.',
  'A change smaller than the threshold for that measure is reported as flat, not as progress — body weight alone moves about half a kilogram on water and gut contents.',
  'Week-to-week movement in one person is not evidence of cause. This compares your numbers to your own earlier numbers; it does not tell you why they moved.',
  'This is general fitness tracking, not a clinical assessment, and not appropriate as a substitute for care during pregnancy, an eating disorder, or any condition where weight or intake is clinically managed.',
]
