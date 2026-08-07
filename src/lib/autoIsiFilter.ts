// ─────────────────────────────────────────────────────────────────────────────
// Saringan nilai untuk auto-isi.
//
// Sengaja tanpa dependensi apa pun (tidak mengimpor api/penyimpanan), supaya
// bisa diuji langsung tanpa lingkungan browser. Aturan penerimaan angka adalah
// bagian paling berisiko dari auto-isi — angka rusak yang menyebar ke seluruh
// aplikasi jauh lebih sulit disadari daripada kolom yang kosong.
// ─────────────────────────────────────────────────────────────────────────────

/** Kunci demografi yang juga dipakai kalkulator lewat getDemo(). */
export const KE_DEMO = ['weightKg', 'heightCm', 'age', 'restingHr', 'vo2max', 'hrvMs', 'sleepH'] as const

/**
 * Batas wajar per metrik. Bukan untuk menilai kesehatan, melainkan untuk
 * menolak angka yang jelas rusak — misalnya berat 0 kg dari metrik kosong, atau
 * tinggi 1.75 yang lolos tanpa konversi satuan. Angka rusak yang menyebar ke
 * seluruh aplikasi jauh lebih sulit disadari daripada kolom kosong.
 */
const MASUK_AKAL: Record<string, [number, number]> = {
  weightKg: [20, 400],
  heightCm: [80, 250],
  bodyFatPct: [2, 70],
  leanMassKg: [15, 200],
  heartRate: [25, 240],
  restingHr: [25, 150],
  hrvMs: [1, 400],
  vo2max: [10, 100],
  spo2Pct: [50, 100],
  respRate: [4, 60],
  systolic: [60, 260],
  diastolic: [30, 180],
  bodyTempC: [30, 45],
  sleepH: [0.5, 20],
  bmi: [8, 80],
}

export function nilaiWajar(kunci: string, nilai: unknown): nilai is number {
  if (typeof nilai !== 'number' || !Number.isFinite(nilai) || nilai <= 0) return false
  const batas = MASUK_AKAL[kunci]
  if (!batas) return true
  return nilai >= batas[0] && nilai <= batas[1]
}

/** Ambil hanya angka yang lolos saringan dari blob profil apa pun. */
export function saringProfil(profil: Record<string, unknown>): Record<string, number> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(profil ?? {})) {
    if (k === 'history') continue
    if (nilaiWajar(k, v)) out[k] = v
  }
  return out as Record<string, number>
}

