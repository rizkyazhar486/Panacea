// Reference Change Value (RCV) — apakah selisih dua hasil lab berurutan lebih
// besar daripada derau analitik + variasi biologis intra-individu?
//
// Sumber rumus (bukan angka karangan):
//  - Fraser CG, Harris EK. Generation and application of data on biological
//    variation in clinical chemistry. Crit Rev Clin Lab Sci 1989;27:409-437.
//    RCV simetris = √2 · Z · √(CVa² + CVi²)
//  - Fokkema MR et al. Reference change values for brain natriuretic peptides
//    revisited. Clin Chem 2006;52:1602-1603 (RCV log-normal asimetris):
//    σ = √ln(CV² + 1);  RCV± = exp(± Z·√2·σ) − 1
//
// CVa dan CVi per analit TIDAK ditulis di sini: pemanggil wajib menyuplai
// keduanya beserta sumbernya (mis. basis data EFLM). Tanpa itu, hasilnya
// "tidak-diketahui" — lebih baik kosong daripada tebakan (CLAUDE.md §8).
//
// Ini sinyal pemantauan, bukan diagnosis.

/** Z dua-sisi yang lazim dipakai pada RCV (Fraser): 1,96 = 95%, 2,576 = 99%. */
export const Z_RCV_95 = 1.96
export const Z_RCV_99 = 2.576

export interface VariasiAnalit {
  /** CV analitik (%), dari kontrol mutu laboratorium. */
  cvAnalitikPersen: number
  /** CV biologis intra-individu (%), dari basis data variasi biologis. */
  cvIntraIndividuPersen: number
  /** Sumber kedua angka di atas; wajib agar angkanya dapat diperiksa. */
  sumber: string
}

export type HasilRcv =
  | { ok: false; alasan: 'cv-tidak-valid' | 'sumber-kosong' | 'z-tidak-valid' | 'nilai-tidak-valid' }
  | {
      ok: true
      /** Batas perubahan relatif (%) — simetris, Fraser 1989. */
      rcvSimetrisPersen: number
      /** Batas perubahan relatif (%) ke atas/bawah — log-normal, Fokkema 2006. */
      rcvNaikPersen: number
      rcvTurunPersen: number
      sumber: string
    }

const valid = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

export function hitungRcv(v: VariasiAnalit, z: number = Z_RCV_95): HasilRcv {
  if (!valid(z) || z <= 0) return { ok: false, alasan: 'z-tidak-valid' }
  if (!valid(v.cvAnalitikPersen) || !valid(v.cvIntraIndividuPersen) || v.cvAnalitikPersen < 0 || v.cvIntraIndividuPersen < 0) {
    return { ok: false, alasan: 'cv-tidak-valid' }
  }
  if (!v.sumber || !v.sumber.trim()) return { ok: false, alasan: 'sumber-kosong' }
  const cv = Math.hypot(v.cvAnalitikPersen, v.cvIntraIndividuPersen)
  const sigma = Math.sqrt(Math.log((cv / 100) ** 2 + 1))
  const f = z * Math.SQRT2 * sigma
  return {
    ok: true,
    rcvSimetrisPersen: Math.SQRT2 * z * cv,
    rcvNaikPersen: (Math.exp(f) - 1) * 100,
    rcvTurunPersen: (Math.exp(-f) - 1) * 100,
    sumber: v.sumber,
  }
}

export type PenilaianPerubahan = 'melebihi-rcv' | 'dalam-rcv' | 'tidak-diketahui'

/**
 * Bandingkan dua hasil berurutan (nilai positif, satuan sama) dengan RCV
 * log-normal. Fail-closed: input/variasi tak valid → 'tidak-diketahui'.
 */
export function nilaiPerubahan(sebelumnya: number, terakhir: number, v: VariasiAnalit, z: number = Z_RCV_95): PenilaianPerubahan {
  if (!valid(sebelumnya) || !valid(terakhir) || sebelumnya <= 0 || terakhir <= 0) return 'tidak-diketahui'
  const r = hitungRcv(v, z)
  if (!r.ok) return 'tidak-diketahui'
  const perubahan = (terakhir / sebelumnya - 1) * 100
  return perubahan > r.rcvNaikPersen || perubahan < r.rcvTurunPersen ? 'melebihi-rcv' : 'dalam-rcv'
}
