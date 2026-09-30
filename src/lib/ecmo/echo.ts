// Representasi echo SKEMATIS dari keadaan sirkulasi yang sama (bukan citra ultrasound).
// - Rongga LV digambar dari volume simulasi per sampel: luas penampang ∝ V^(2/3) (penskalaan
//   geometris benda serupa), jadi ukuran gambar mengikuti volume, bukan animasi berulang.
// - Katup aorta "membuka" hanya pada sampel dengan aliran aorta > 0.
// - Doppler LVOT: v(t) = Q_aorta(t) / luas LVOT (mL/s ÷ cm² = cm/s); VTI = Σ v·Δt.
//   Konsistensi diuji: VTI integral = isi sekuncup / luas LVOT.

import type { HasilSirkulasi } from './sirkulasi'

export interface BingkaiEcho { skalaRongga: number; katupBuka: boolean; kecepatan: number }
export interface Echo { bingkai: BingkaiEcho[]; vtiIntegral: number; kecepatanPuncak: number; dtSampel: number }

export function bangunEcho(h: HasilSirkulasi, diameterLvotCm = 2.0): Echo | null {
  if (!h.sah || h.lingkarLV.length === 0 || h.aliranAorta.length !== h.lingkarLV.length) return null
  const luas = Math.PI * (diameterLvotCm / 2) ** 2
  const vMaks = Math.max(...h.lingkarLV.map((t) => t.v))
  const bingkai = h.lingkarLV.map((t, i) => ({
    skalaRongga: Math.cbrt((t.v / vMaks) ** 2),   // (V/Vmaks)^(2/3)
    katupBuka: h.aliranAorta[i] > 1e-6,
    kecepatan: h.aliranAorta[i] / luas,
  }))
  const vtiIntegral = bingkai.reduce((s, b) => s + b.kecepatan * h.dtSampel, 0)
  return { bingkai, vtiIntegral, kecepatanPuncak: Math.max(...bingkai.map((b) => b.kecepatan)), dtSampel: h.dtSampel }
}

/** Indeks bingkai animasi, selalu 0..n-1 (stempel waktu rAF bisa mendahului waktu mulai). */
export function indeksBingkai(t: number, mulai: number, dtSampel: number, n: number): number {
  if (!(n > 0) || !(dtSampel > 0) || !Number.isFinite(t - mulai)) return 0
  const k = Math.floor((t - mulai) / 1000 / dtSampel)
  return ((k % n) + n) % n
}
