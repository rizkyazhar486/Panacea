// Daya kritis dua titik (Monod-Scherrer): CP = (P1·t1 − P2·t2)/(t1 − t2).
// Dulu `Number.isFinite(cp) ? cp : 0` menampilkan "0 W" untuk waktu yang sama atau kosong; sekarang tidak ada jawaban (NaN → "—").
export function criticalPower2Point(p1: number, t1: number, p2: number, t2: number): number {
  const valid = [p1, t1, p2, t2].every((x) => Number.isFinite(x) && x > 0) && t1 !== t2
  if (!valid) return NaN
  const cp = (p1 * t1 - p2 * t2) / (t1 - t2)
  return Number.isFinite(cp) && cp > 0 ? cp : NaN
}
