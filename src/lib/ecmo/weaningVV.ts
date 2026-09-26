// Latihan weaning VV mengikuti urutan ELSO VV 2021 (Tonna dkk.), Tabel 7:
//  1) turunkan FdO2 bertahap 1,0 → 0,21 sambil SpO2 > 92% atau PaO2 ≥ 70 mmHg;
//  2) turunkan sweep bertahap ke 1 L/menit dengan pH "dapat diterima";
//  3) uji tanpa sweep: PaO2 ≥ 70 mmHg dan pH dapat diterima.
// ELSO sengaja TIDAK menetapkan angka pH ("acceptable pH based on the patient's clinical
// condition"), jadi ambang pH adalah masukan pendidik yang ditampilkan, bukan konstanta.
// Menilai keadaan simulasi untuk latihan — bukan keputusan dekanulasi pasien.

import { simulasiVV, type MasukanVV, type KeadaanVV } from './mesin'

export type TahapWeaning = 'fdo2' | 'sweep' | 'tanpa-sweep'
export interface HasilTahap { tahap: TahapWeaning; judul: string; tercapai: boolean; syarat: string; nilai: string }

const oksigenasiCukup = (k: KeadaanVV) => k.status !== 'pasokan-o2-tak-cukup' && (k.sao2 > 0.92 || k.pao2 >= 70)

export function nilaiWeaningVV(m: MasukanVV, phMin: number, phMaks = 7.6): { keadaan: KeadaanVV; tahap: HasilTahap[]; siapDekanulasi: boolean } {
  const k = simulasiVV(m)
  // 'Dapat diterima' adalah rentang: asidosis maupun alkalosis dapat gagal.
  const dalamRentang = (ph: number) => Number.isFinite(ph) && ph >= phMin && ph <= phMaks
  const phOk = dalamRentang(k.co2.ph)
  const tanpaSweep = simulasiVV({ ...m, sweep: 0 })
  const pct = (x: number) => (Number.isFinite(x) ? `${Math.round(x * 100)}%` : '—')
  const tahap: HasilTahap[] = [
    { tahap: 'fdo2', judul: 'FdO₂ weaned to 0.21', tercapai: m.fdo2 <= 0.21 + 1e-9 && oksigenasiCukup(k),
      syarat: 'FdO₂ 0.21 with SpO₂ > 92% or PaO₂ ≥ 70 mmHg', nilai: `FdO₂ ${m.fdo2.toFixed(2)}, SaO₂ ${pct(k.sao2)}, PaO₂ ${Number.isFinite(k.pao2) ? k.pao2.toFixed(0) : '—'}` },
    { tahap: 'sweep', judul: 'Sweep weaned to ≤ 1 L/min', tercapai: m.sweep <= 1 + 1e-9 && phOk && oksigenasiCukup(k),
      syarat: `sweep ≤ 1 L/min with pH ${phMin.toFixed(2)}–${phMaks.toFixed(2)} (educator-set)`, nilai: `sweep ${m.sweep.toFixed(1)}, pH ${Number.isFinite(k.co2.ph) ? k.co2.ph.toFixed(2) : '—'}` },
    { tahap: 'tanpa-sweep', judul: 'Off-sweep trial', tercapai: oksigenasiCukup(tanpaSweep) && tanpaSweep.pao2 >= 70 && dalamRentang(tanpaSweep.co2.ph),
      syarat: `sweep 0: PaO₂ ≥ 70 mmHg and pH ${phMin.toFixed(2)}–${phMaks.toFixed(2)}`, nilai: tanpaSweep.status === 'pasokan-o2-tak-cukup' ? 'no O₂ steady state off sweep' : `PaO₂ ${tanpaSweep.pao2.toFixed(0)}, pH ${tanpaSweep.co2.ph.toFixed(2)}` },
  ]
  // Urutan ELSO: tahap berikut hanya bermakna bila tahap sebelumnya tercapai.
  for (let i = 1; i < tahap.length; i++) if (!tahap[i - 1].tercapai) tahap[i] = { ...tahap[i], tercapai: false }
  return { keadaan: k, tahap, siapDekanulasi: tahap.every((t) => t.tercapai) }
}
