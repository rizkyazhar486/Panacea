// Mekanika ventilator selama ECMO VV ("lung rest"). Deterministik, tanpa React.
//
// Mode tekanan (PCV) dengan asumsi ekuilibrasi penuh pada akhir inspirasi (tanpa aliran,
// tanpa auto-PEEP): VT = Crs·ΔP, Pplat = PEEP + ΔP (Amato 2015: ΔP = VT/Crs).
// Ventilasi alveolar = (VT − VD)·RR; ruang rugi VD adalah MASUKAN ILUSTRATIF, bukan diukur.
// Nilai ini mengisi `va` di mesin CO2 yang sama, sehingga istirahat paru menaikkan PaCO2
// kecuali sweep dinaikkan — arah yang dinyatakan ELSO VV 2021 (CO2 dikelola lewat sirkuit).
//
// Pemeriksaan "rest settings" memakai angka yang tercetak di ELSO VV 2021 (teks penuh, PMC8315725):
// plateau ≤ 25 cmH2O atau tekanan inspirasi ≤ 15 cmH2O di atas PEEP, dengan PEEP ≥ 10 cmH2O.
// ΔP tidak diberi ambang: Amato 2015 melaporkan asosiasi kontinu (RR 1,41 per ≈7 cmH2O), bukan batas.
// PEEP → pirau/rekrutmen dan tekanan intratoraks → aliran balik vena BELUM dimodelkan.

export interface PengaturanVentilator {
  crs: number        // komplians sistem respirasi, mL/cmH2O
  peep: number       // cmH2O
  pInspAtasPeep: number // tekanan inspirasi di atas PEEP (PCV), cmH2O
  rr: number         // napas/menit
  ruangRugiMl: number // ruang rugi, mL (ilustratif)
}

export interface KeadaanVentilator {
  sah: boolean
  vtMl: number
  pplat: number
  drivingPressure: number
  veLMenit: number
  vaLMenit: number
  istirahatElso: { pplatOk: boolean; pInspOk: boolean; peepOk: boolean; memenuhi: boolean }
}

export const VENTILATOR_ISTIRAHAT: PengaturanVentilator = { crs: 25, peep: 10, pInspAtasPeep: 10, rr: 10, ruangRugiMl: 150 }

export function mekanikaVentilator(v: PengaturanVentilator): KeadaanVentilator {
  const ok = [v.crs, v.peep, v.pInspAtasPeep, v.rr, v.ruangRugiMl].every(Number.isFinite) && v.crs > 0 && v.peep >= 0 && v.pInspAtasPeep >= 0 && v.rr >= 0 && v.ruangRugiMl >= 0
  if (!ok) return { sah: false, vtMl: NaN, pplat: NaN, drivingPressure: NaN, veLMenit: NaN, vaLMenit: NaN, istirahatElso: { pplatOk: false, pInspOk: false, peepOk: false, memenuhi: false } }
  const dp = v.pInspAtasPeep
  const vt = v.crs * dp
  const pplat = v.peep + dp
  const ve = (vt * v.rr) / 1000
  const va = (Math.max(0, vt - v.ruangRugiMl) * v.rr) / 1000
  const pplatOk = pplat <= 25, pInspOk = dp <= 15, peepOk = v.peep >= 10
  return { sah: true, vtMl: vt, pplat, drivingPressure: dp, veLMenit: ve, vaLMenit: va, istirahatElso: { pplatOk, pInspOk, peepOk, memenuhi: (pplatOk || pInspOk) && peepOk } }
}
