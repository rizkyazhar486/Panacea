// Latihan uji penurunan aliran VA mengikuti Aissaoui dkk. 2011 (Intensive Care Med, n = 51, satu pusat):
// aliran ECMO diturunkan ke < 1,5 L/menit; semua pasien yang berhasil disapih memiliki pada aliran
// minimal: VTI aorta ≥ 10 cm, LVEF > 20–25%, dan TDSa lateral mitral ≥ 6 cm/detik.
// - LVEF dan VTI dihitung dari sirkulasi yang sama (VTI = isi sekuncup / luas LVOT).
// - TDSa (kecepatan Doppler jaringan) TIDAK dapat dihasilkan model ini → alat ini tidak pernah
//   menyatakan pasien "siap disapih"; ia hanya melaporkan kriteria yang dapat dihitung.
// - "Tolerated trial" tidak diberi angka oleh sumber: ambang MAP adalah masukan pendidik.
// - LVEF: batas atas rentang terbitan (25%) dipakai sebagai ambang konservatif.

import { simulasiSirkulasi, type ParameterSirkulasi, type HasilSirkulasi } from './sirkulasi'

export interface OpsiWeaningVA { qTarget: number; diameterLvotCm: number; mapMin: number }
export const OPSI_WEANING_VA: OpsiWeaningVA = { qTarget: 1.5, diameterLvotCm: 2.0, mapMin: 60 }

export interface KriteriaVA { id: 'aliran' | 'map' | 'lvef' | 'vti' | 'tdsa'; judul: string; nilai: string; status: 'tercapai' | 'tidak' | 'tidak-disimulasikan' }

export function ujiPenurunanAliranVA(p: ParameterSirkulasi, o: OpsiWeaningVA = OPSI_WEANING_VA): { rpm: number; h: HasilSirkulasi; vti: number; kriteria: KriteriaVA[]; dapatDinyatakanSiap: false } {
  // RPM tertinggi yang memberi aliran < qTarget (aliran naik monoton dengan RPM).
  let lo = 0, hi = Math.max(p.ecmo.rpm, 1000)
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; const q = simulasiSirkulasi({ ...p, ecmo: { ...p.ecmo, rpm: mid } }, 30).qEcmo; if (q < o.qTarget - 0.1) lo = mid; else hi = mid }
  const rpm = Math.round(lo)
  const h = simulasiSirkulasi({ ...p, ecmo: { ...p.ecmo, rpm } })
  const luasLvot = Math.PI * (o.diameterLvotCm / 2) ** 2
  const vti = h.sah ? h.sv / luasLvot : NaN
  const ok = (b: boolean): KriteriaVA['status'] => (b ? 'tercapai' : 'tidak')
  const kriteria: KriteriaVA[] = [
    { id: 'aliran', judul: `ECMO flow < ${o.qTarget} L/min`, nilai: `${h.qEcmo.toFixed(2)} L/min at ${rpm} rpm`, status: ok(h.sah && h.qEcmo < o.qTarget) },
    { id: 'map', judul: `Trial tolerated: MAP ≥ ${o.mapMin} mmHg (educator-set)`, nilai: `MAP ${h.map.toFixed(0)}`, status: ok(h.sah && h.map >= o.mapMin) },
    { id: 'lvef', judul: 'LVEF > 25% (upper end of published 20–25%)', nilai: `LVEF ${(h.ef * 100).toFixed(0)}%`, status: ok(h.sah && h.ef > 0.25) },
    { id: 'vti', judul: 'Aortic VTI ≥ 10 cm', nilai: `VTI ${vti.toFixed(1)} cm (LVOT ${o.diameterLvotCm.toFixed(1)} cm assumed)`, status: ok(vti >= 10) },
    { id: 'tdsa', judul: 'Lateral mitral TDSa ≥ 6 cm/s', nilai: 'tissue Doppler not produced by this model', status: 'tidak-disimulasikan' },
  ]
  return { rpm, h, vti, kriteria, dapatDinyatakanSiap: false }
}
