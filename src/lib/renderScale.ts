// ─────────────────────────────────────────────────────────────────────────────
// KERAPATAN PIKSEL YANG MENYESUAIKAN DIRI.
//
// "Definisi tinggi" pada peramban berarti satu hal yang bisa dihitung: berapa
// piksel gambar yang benar-benar digambar untuk tiap piksel CSS. Ponsel masa
// kini punya kerapatan 3; membatasi render di 2 berarti menggambar sepertiga
// lebih sedikit piksel daripada yang mampu ditampilkan layarnya, lalu
// merentangkannya. Itulah yang terbaca sebagai "kurang tajam", dan tidak ada
// bahan atau tekstur yang bisa memperbaikinya.
//
// Tetapi menaikkan kerapatan begitu saja memindahkan masalahnya: dua juta
// segitiga pada kerapatan penuh membuat ponsel kelas menengah tersendat, dan
// gambar tajam yang tersendat lebih buruk daripada gambar sedikit lembut yang
// mulus.
//
// Karena itu kerapatannya MENYESUAIKAN DIRI: mulai dari kerapatan asli layar,
// ukur waktu bingkai yang sebenarnya, dan turunkan hanya kalau perangkatnya
// memang tidak sanggup. Aturannya murni perhitungan, jadi bisa diuji tanpa
// GPU sama sekali.
// ─────────────────────────────────────────────────────────────────────────────

export interface BatasSkala {
  /** Kerapatan terendah yang masih boleh dipakai. */
  minimum: number
  /** Kerapatan tertinggi; biasanya devicePixelRatio layarnya. */
  maksimum: number
  /** Anggaran waktu per bingkai, milidetik. 60 fps = 16,7 ms. */
  anggaranMs: number
}

export const BATAS_BAKU: BatasSkala = { minimum: 0.75, maksimum: 3, anggaranMs: 16.7 }

/**
 * Ambang naik dan turun sengaja TIDAK sama.
 *
 * Kalau keduanya sama, kerapatan akan berayun naik-turun tepat di ambang itu —
 * dan resolusi yang berkedip jauh lebih mengganggu daripada resolusi yang
 * tetap rendah. Jarak di antaranya adalah histeresis.
 */
export const AMBANG_TURUN = 1.35
export const AMBANG_NAIK = 0.7

export interface Keadaan {
  skala: number
  /** Berapa bingkai berturut-turut kondisinya terpenuhi. */
  hitung: number
}

export const keadaanAwal = (skala: number): Keadaan => ({ skala, hitung: 0 })

/**
 * Memutuskan kerapatan berikutnya dari waktu bingkai rata-rata.
 *
 * Perubahan hanya terjadi setelah beberapa bingkai berturut-turut sepakat.
 * Satu bingkai lambat bukan bukti perangkatnya lemah — ia bisa saja bingkai
 * saat tekstur diunggah, atau saat pengguna membuka tab lain.
 */
export function langkahSkala(
  keadaan: Keadaan, rataMs: number, batas: BatasSkala = BATAS_BAKU, butuhBingkai = 20,
): Keadaan {
  const { minimum, maksimum, anggaranMs } = batas
  const terlaluLambat = rataMs > anggaranMs * AMBANG_TURUN
  const sangatLega = rataMs < anggaranMs * AMBANG_NAIK

  if (terlaluLambat && keadaan.skala > minimum) {
    const hitung = keadaan.hitung >= 0 ? keadaan.hitung + 1 : 1
    if (hitung < butuhBingkai) return { skala: keadaan.skala, hitung }
    // Turun bertahap, bukan langsung ke dasar: satu langkah sering sudah cukup,
    // dan turun terlalu jauh membuang ketajaman yang sebenarnya mampu dicapai.
    return { skala: Math.max(minimum, Number((keadaan.skala - 0.25).toFixed(2))), hitung: 0 }
  }
  if (sangatLega && keadaan.skala < maksimum) {
    const hitung = keadaan.hitung <= 0 ? keadaan.hitung - 1 : -1
    if (-hitung < butuhBingkai) return { skala: keadaan.skala, hitung }
    return { skala: Math.min(maksimum, Number((keadaan.skala + 0.25).toFixed(2))), hitung: 0 }
  }
  // Di antara kedua ambang: tidak ada yang perlu diubah, dan hitungannya
  // direset supaya bukti lama tidak menumpuk sampai memicu perubahan.
  return { skala: keadaan.skala, hitung: 0 }
}

/** Rata-rata bergerak waktu bingkai. */
export class JamBingkai {
  private waktu: number[] = []
  constructor(private jendela = 30) {}
  catat(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0) return
    this.waktu.push(ms)
    if (this.waktu.length > this.jendela) this.waktu.shift()
  }
  get siap(): boolean { return this.waktu.length >= Math.min(10, this.jendela) }
  get rataMs(): number {
    if (!this.waktu.length) return 0
    return this.waktu.reduce((a, b) => a + b, 0) / this.waktu.length
  }
  bersihkan(): void { this.waktu = [] }
}

/**
 * Kerapatan awal yang masuk akal untuk satu perangkat.
 *
 * Dimulai dari kerapatan asli layarnya, tetapi tidak melebihi batas atas —
 * layar 4x pada model dua juta segitiga tidak realistis untuk perangkat mana
 * pun yang ada sekarang.
 */
export function skalaAwal(devicePixelRatio: number, batas: BatasSkala = BATAS_BAKU): number {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  return Math.min(batas.maksimum, Math.max(batas.minimum, dpr))
}
