// Mode konferensi: tampilan besar dari panel & skenario yang SAMA (tidak ada keadaan terpisah).
// Skala dipilih agar panel selebar ≤ 720 px CSS tetap muat di layar; tidak pernah memperkecil
// (< 1) dan tidak lebih dari 1,8× supaya teks tidak pecah pada proyektor resolusi rendah.
export const LEBAR_PANEL_PRESENTASI = 720
export function skalaPresentasi(lebarLayar: number): number {
  if (!Number.isFinite(lebarLayar) || lebarLayar <= 0) return 1
  return Math.min(1.8, Math.max(1, (lebarLayar - 32) / LEBAR_PANEL_PRESENTASI))
}
