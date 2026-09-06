// ─────────────────────────────────────────────────────────────────────────────
// TATA LETAK ORGANEL DI DALAM SEL.
//
// Model sel tiga dimensi hampir selalu digambar dengan organel ditaruh
// sekenanya, dan hasilnya mengajarkan dua hal yang salah sekaligus: bahwa
// ukuran organel sebanding dengan yang terlihat, dan bahwa letaknya tidak
// berarti apa-apa. Keduanya keliru — mitokondria berkumpul di tempat ATP
// dipakai, dan Golgi selalu berada di sisi tertentu dari inti.
//
// Karena itu penempatannya dihitung, bukan digambar: ukuran diambil dari
// diameter nyata tiap organel dalam mikrometer, penempatannya menghindari
// inti, dan hasilnya DETERMINISTIK. Determinisme itu penting — sel yang
// menyusun ulang dirinya setiap kali komponennya digambar ulang membuat
// pembelajar mengira letaknya memang acak.
//
// Jumlah yang digambar jelas lebih sedikit daripada jumlah sebenarnya: sepuluh
// juta ribosom tidak bisa dirender, dan pura-pura menggambarnya akan menjadi
// kebohongan yang mahal. Yang digambar adalah cuplikan, dan jumlah aslinya
// tetap disebutkan di layar.
// ─────────────────────────────────────────────────────────────────────────────

/** Diameter sel hewan tipikal, µm. Semua ukuran lain relatif terhadap ini. */
export const DIAMETER_SEL_UM = 20
export const RADIUS_SEL = DIAMETER_SEL_UM / 2
/** Inti menempati kira-kira sepertiga diameter sel. */
export const RADIUS_INTI = 3

export interface Penempatan {
  kunci: string
  x: number
  y: number
  z: number
  /** Jari-jari dalam satuan µm, dari ukuran nyata organelnya. */
  radius: number
  /** Putaran acak-tetap supaya bentuk memanjang tidak semuanya sejajar. */
  putaran: number
}

/**
 * Pembangkit acak yang sama hasilnya setiap kali (mulberry32).
 *
 * Math.random tidak dipakai justru karena ia benar: sel yang berubah susunan
 * setiap kali komponennya dirender akan terlihat seperti kesalahan, dan lebih
 * buruk lagi, mengajarkan bahwa susunan organel memang tidak berarti.
 */
export function acakTetap(benih: number): () => number {
  let a = benih >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Permintaan {
  kunci: string
  jumlah: number
  /** Diameter organel, µm. */
  diameterUm: number
  /** Jarak minimum dari pusat sel; dipakai agar organel tidak masuk ke inti. */
  jarakMinimal?: number
  /** Jarak maksimum dari pusat; Golgi berkumpul dekat inti, bukan di tepi. */
  jarakMaksimal?: number
}

/**
 * Menempatkan organel di dalam sitoplasma — di luar inti, di dalam membran.
 *
 * Penolakan sederhana dipakai alih-alih pengepakan sempurna: yang dibutuhkan
 * bukan susunan optimal, melainkan susunan yang TIDAK menembus inti dan tidak
 * menonjol keluar membran. Keduanya kesalahan yang langsung terlihat salah
 * oleh siapa pun yang pernah melihat sel.
 */
export function tempatkan(permintaan: Permintaan[], benih = 20260906): Penempatan[] {
  const acak = acakTetap(benih)
  const hasil: Penempatan[] = []
  for (const p of permintaan) {
    const radius = p.diameterUm / 2
    const minimal = p.jarakMinimal ?? RADIUS_INTI + radius
    const maksimal = p.jarakMaksimal ?? RADIUS_SEL - radius
    for (let i = 0; i < p.jumlah; i++) {
      // Titik acak seragam di dalam cangkang bola. Pangkat sepertiga penting:
      // tanpa itu organel menumpuk di dekat inti dan tepi luar tampak kosong.
      const u = acak()
      const jarak = Math.cbrt(minimal ** 3 + u * (maksimal ** 3 - minimal ** 3))
      const kosinusTheta = 2 * acak() - 1
      const sinTheta = Math.sqrt(Math.max(0, 1 - kosinusTheta * kosinusTheta))
      const phi = acak() * Math.PI * 2
      hasil.push({
        kunci: p.kunci,
        x: jarak * sinTheta * Math.cos(phi),
        y: jarak * kosinusTheta,
        z: jarak * sinTheta * Math.sin(phi),
        radius,
        putaran: acak() * Math.PI * 2,
      })
    }
  }
  return hasil
}

/** Berapa banyak yang digambar dibandingkan berapa yang sebenarnya ada. */
export function cuplikan(jumlahAsli: number, maksimalGambar: number): { digambar: number; kalimat: string } {
  const digambar = Math.min(jumlahAsli, maksimalGambar)
  return {
    digambar,
    kalimat: digambar < jumlahAsli
      ? `Showing ${digambar} of roughly ${jumlahAsli.toLocaleString()} — a sample, not the full count`
      : `All ${digambar} shown`,
  }
}

/** Semua penempatan berada di dalam membran dan di luar inti. */
export function sahSecaraRuang(p: Penempatan): boolean {
  const jarak = Math.hypot(p.x, p.y, p.z)
  return jarak - p.radius >= RADIUS_INTI - 1e-9 && jarak + p.radius <= RADIUS_SEL + 1e-9
}
