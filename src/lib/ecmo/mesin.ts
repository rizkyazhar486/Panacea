// Mesin fisiologi ECMO (keadaan tunak, deterministik, tanpa React/Three.js).
//
// Arah kausal: masukan (pengaturan ECMO + keadaan pasien) → neraca massa → keadaan.
// Tampilan hanya membaca `KeadaanVV` / `KeadaanVA`; tidak ada angka yang ditulis
// langsung ke layar. Setiap aturan menunjuk ke `MODEL` di bukti.ts.
//
// BATAS (juga ditampilkan di UI): edukasi, bukan tata laksana pasien; keadaan tunak,
// bukan dinamika detik-ke-detik; kardiovaskular berparameter-tergumpal (P-V, beban
// LV) BELUM disimulasikan dan tidak dipalsukan.

import { tekananAlveolar, TETAPAN_GAS } from '../gasAlveolar'
import { kandunganO2, po2DariKandungan, saturasiDariPO2, hantaranO2 } from './oksigen'

export interface PengaturanGas {
  fdo2: number          // fraksi O2 gas sapu, 0.21-1
  sweep: number         // L/menit
  fungsiMembran: number // 0-1 (1 = membran sehat)
}
export interface PasienDasar {
  hb: number            // g/dL
  vo2: number           // mL/menit
  shunt: number         // fraksi pirau paru asli 0-1
  fio2: number          // ventilator
  va: number            // ventilasi alveolar paru asli, L/menit
  hco3: number          // mmol/L (dipertahankan tetap)
  rq?: number
}
export interface MasukanVV extends PengaturanGas, PasienDasar {
  co: number            // curah jantung pasien, L/menit
  qEcmo: number         // aliran pompa, L/menit
  jarakKanulaCm: number // jarak lubang drainase-return
}
export interface MasukanVA extends PengaturanGas, PasienDasar {
  qLv: number           // curah LV asli (antegrad), L/menit
  qEcmo: number         // aliran ECMO retrograd (femoral), L/menit
}

export type Status = 'tunak' | 'aliran-drainase-terbatas' | 'pasokan-o2-tak-cukup' | 'masukan-tidak-sah'

const R_ALV = 0.863 // konstanta persamaan ventilasi alveolar (mmHg·L/mL, BTPS/STPD)

function sah(...xs: number[]) { return xs.every((x) => Number.isFinite(x)) }

export function fraksiResirkulasi(jarakCm: number, qEcmo: number, co: number): number {
  if (!(co > 0) || !(qEcmo > 0)) return 0
  const geometri = 0.6 / (1 + Math.exp((jarakCm - 8) / 2.5))
  return geometri * (0.4 + 0.6 * Math.min(1, qEcmo / co))
}

export interface KeadaanCO2 { paco2: number; ph: number; vco2Produksi: number; vco2Membran: number; vco2Paru: number; aliranOtakRelatif: number }

export function keadaanCO2(p: PasienDasar & PengaturanGas, qEcmo: number): KeadaanCO2 {
  const rq = p.rq ?? 0.8
  const vco2 = rq * p.vo2
  const k = 7 // mL/menit per mmHg pada sweep & aliran jenuh (ilustratif: sweep 3, Q 4, VA 1 → PaCO2 ≈ 40)
  const membran = p.sweep > 0 ? k * p.fungsiMembran * (p.sweep / (p.sweep + 1.5)) * (qEcmo / (qEcmo + 1)) : 0
  const paru = p.va / R_ALV
  const paco2 = vco2 / (paru + membran)
  const ph = 6.1 + Math.log10(p.hco3 / (0.03 * paco2))
  // Arah aliran darah otak terhadap PaCO2: proporsional di rentang fisiologis, dipotong di tepi (arah, bukan kuantitas).
  const aliranOtakRelatif = Math.min(2, Math.max(0.5, paco2 / 40))
  return { paco2, ph, vco2Produksi: vco2, vco2Membran: membran * paco2, vco2Paru: paru * paco2, aliranOtakRelatif }
}

function membranO2(cPre: number, hb: number, g: PengaturanGas, pb: number) {
  const pPre = po2DariKandungan(cPre, hb)
  const pGas = g.fdo2 * (pb - TETAPAN_GAS.PH2O_37C)
  const pPost = g.sweep > 0 ? pPre + g.fungsiMembran * (pGas - pPre) : pPre
  return { pPre, pPost, cPost: kandunganO2(hb, saturasiDariPO2(pPost), pPost) }
}

export interface KeadaanVV {
  status: Status
  resirkulasi: number
  resirkulasiDariSaturasi: number
  qEfektif: number
  rasioEfektifTerhadapCO: number
  sao2: number; pao2: number; cao2: number
  svo2: number; cvo2: number
  sPre: number; pPre: number; sPost: number; pPost: number
  do2: number; vo2: number; oer: number; do2PerVo2: number
  vo2Ecmo: number
  co2: KeadaanCO2
}

export function simulasiVV(m: MasukanVV, pb = TETAPAN_GAS.PATM_LAUT): KeadaanVV {
  const kosong = (status: Status): KeadaanVV => ({ status, resirkulasi: NaN, resirkulasiDariSaturasi: NaN, qEfektif: NaN, rasioEfektifTerhadapCO: NaN, sao2: NaN, pao2: NaN, cao2: NaN, svo2: NaN, cvo2: NaN, sPre: NaN, pPre: NaN, sPost: NaN, pPost: NaN, do2: NaN, vo2: NaN, oer: NaN, do2PerVo2: NaN, vo2Ecmo: NaN, co2: keadaanCO2({ ...m, va: Math.max(m.va, 0.1) }, 0) })
  if (!sah(m.co, m.qEcmo, m.hb, m.vo2, m.shunt, m.fio2, m.va, m.fdo2, m.sweep, m.fungsiMembran, m.jarakKanulaCm) || m.co <= 0 || m.hb <= 0 || m.vo2 <= 0 || m.qEcmo < 0 || m.shunt < 0 || m.shunt > 1 || m.fungsiMembran < 0 || m.fungsiMembran > 1) return kosong('masukan-tidak-sah')

  const co2 = keadaanCO2(m, m.qEcmo)
  const pAlv = tekananAlveolar({ fio2: m.fio2, paco2: co2.paco2, patm: pb })
  const cKap = kandunganO2(m.hb, saturasiDariPO2(pAlv), pAlv)
  const R = fraksiResirkulasi(m.jarakKanulaCm, m.qEcmo, m.co)
  let qEff = m.qEcmo * (1 - R)
  let status: Status = 'tunak'
  if (qEff > m.co) { qEff = m.co; status = 'aliran-drainase-terbatas' }

  let cv = 12, ca = 0, cPost = 0, pPre = 0, pPost = 0, cPre = 0
  for (let i = 0; i < 400; i++) {
    cPost = cv
    for (let j = 0; j < 60; j++) { cPre = R * cPost + (1 - R) * cv; const r = membranO2(cPre, m.hb, m, pb); cPost = r.cPost; pPre = r.pPre; pPost = r.pPost }
    const cPa = (qEff * cPost + (m.co - qEff) * cv) / m.co
    ca = (1 - m.shunt) * cKap + m.shunt * cPa
    const cvBaru = ca - m.vo2 / (10 * m.co)
    if (cvBaru <= 0) return { ...kosong('pasokan-o2-tak-cukup'), co2 }
    if (Math.abs(cvBaru - cv) < 1e-10) { cv = cvBaru; break }
    cv = cvBaru
  }
  const pa = po2DariKandungan(ca, m.hb), pv = po2DariKandungan(cv, m.hb)
  const sa = saturasiDariPO2(pa), sv = saturasiDariPO2(pv), sPre = saturasiDariPO2(pPre), sPost = saturasiDariPO2(pPost)
  const do2 = hantaranO2(m.co, ca)
  return {
    status, resirkulasi: R,
    resirkulasiDariSaturasi: sPost - sv > 1e-6 ? (sPre - sv) / (sPost - sv) : NaN,
    qEfektif: qEff, rasioEfektifTerhadapCO: qEff / m.co,
    sao2: sa, pao2: pa, cao2: ca, svo2: sv, cvo2: cv, sPre, pPre, sPost, pPost,
    do2, vo2: m.vo2, oer: m.vo2 / do2, do2PerVo2: do2 / m.vo2,
    vo2Ecmo: 10 * m.qEcmo * (cPost - cPre), co2,
  }
}

// ── VA perifer: partisi aliran aorta ───────────────────────────────────────────
export interface CabangAorta { id: string; nama: string; fraksi: number; organ: string }
/** Urutan dari akar aorta ke distal. Fraksi ILUSTRATIF (model 'partisi-aorta-va'), jumlah = 1. */
export const CABANG_AORTA: readonly CabangAorta[] = [
  { id: 'koroner', nama: 'Coronary arteries', fraksi: 0.05, organ: 'heart' },
  { id: 'brakiosefal', nama: 'Brachiocephalic (right arm, right carotid)', fraksi: 0.12, organ: 'brain / right radial' },
  { id: 'karotis-kiri', nama: 'Left common carotid', fraksi: 0.07, organ: 'brain' },
  { id: 'subklavia-kiri', nama: 'Left subclavian (left arm)', fraksi: 0.05, organ: 'left radial' },
  { id: 'viseral', nama: 'Coeliac / mesenteric', fraksi: 0.30, organ: 'liver / gut' },
  { id: 'ginjal', nama: 'Renal arteries', fraksi: 0.20, organ: 'kidneys' },
  { id: 'iliaka', nama: 'Iliac / femoral', fraksi: 0.21, organ: 'legs' },
]

export interface KeadaanCabang { id: string; fraksiAsli: number; kandungan: number; saturasi: number; po2: number; hantaranO2: number }
export interface KeadaanVA {
  status: Status
  cabang: KeadaanCabang[]
  titikCampur: string | null   // id cabang tempat aliran bertemu; null bila satu sumber memasok semua
  fraksiAsliTotal: number      // proporsi aliran sistemik dari LV (penentu pulsatilitas, arah)
  cLv: number; sLv: number; cPost: number; sPost: number; cvo2: number; svo2: number
  do2: number; vo2: number; oer: number
  co2: KeadaanCO2
  belumDisimulasikan: string[]
}

export const BELUM_VA = [
  'LV unloading devices (IABP, Impella, venting, septostomy)',
  'Drainage-site effect (RA vs femoral): venous compartment is merged, so central VA does not show the RV/PCWP unloading reported in lumped-model literature',
  'Differential CO2 between the two circulations',
  'Central VA-ECMO geometry',
  'Limb ischemia from arterial cannula size',
]

export function simulasiVA(m: MasukanVA, pb = TETAPAN_GAS.PATM_LAUT): KeadaanVA {
  const qTot = m.qLv + m.qEcmo
  const co2 = keadaanCO2(m, m.qEcmo)
  const gagal = (status: Status): KeadaanVA => ({ status, cabang: [], titikCampur: null, fraksiAsliTotal: NaN, cLv: NaN, sLv: NaN, cPost: NaN, sPost: NaN, cvo2: NaN, svo2: NaN, do2: NaN, vo2: m.vo2, oer: NaN, co2, belumDisimulasikan: BELUM_VA })
  if (!sah(m.qLv, m.qEcmo, m.hb, m.vo2, m.shunt, m.fio2) || m.qLv < 0 || m.qEcmo < 0 || qTot <= 0 || m.hb <= 0 || m.vo2 <= 0 || m.shunt < 0 || m.shunt > 1) return gagal('masukan-tidak-sah')

  const pAlv = tekananAlveolar({ fio2: m.fio2, paco2: co2.paco2, patm: pb })
  const cKap = kandunganO2(m.hb, saturasiDariPO2(pAlv), pAlv)
  // Fraksi pasokan asli per cabang: aliran antegrad mengisi dari akar.
  let kum = 0
  const fAsli = CABANG_AORTA.map((c) => {
    const a = kum * qTot, b = (kum + c.fraksi) * qTot; kum += c.fraksi
    return Math.max(0, Math.min(b, m.qLv) - a) / (b - a)
  })
  let cv = 12, cLv = 0, cPost = 0, cabang: KeadaanCabang[] = []
  for (let i = 0; i < 400; i++) {
    cLv = (1 - m.shunt) * cKap + m.shunt * cv
    cPost = membranO2(cv, m.hb, m, pb).cPost
    cabang = CABANG_AORTA.map((c, k) => {
      const kand = fAsli[k] * cLv + (1 - fAsli[k]) * cPost
      const po2 = po2DariKandungan(kand, m.hb)
      return { id: c.id, fraksiAsli: fAsli[k], kandungan: kand, saturasi: saturasiDariPO2(po2), po2, hantaranO2: 10 * c.fraksi * qTot * kand }
    })
    const cRata = cabang.reduce((s, c, k) => s + CABANG_AORTA[k].fraksi * c.kandungan, 0)
    const cvBaru = cRata - m.vo2 / (10 * qTot)
    if (cvBaru <= 0) return gagal('pasokan-o2-tak-cukup')
    if (Math.abs(cvBaru - cv) < 1e-10) { cv = cvBaru; break }
    cv = cvBaru
  }
  const campur = cabang.find((c) => c.fraksiAsli > 1e-9 && c.fraksiAsli < 1 - 1e-9)
    ?? (m.qLv > 0 && m.qEcmo > 0 ? cabang.find((c, k) => k > 0 && c.fraksiAsli < 0.5 && cabang[k - 1].fraksiAsli > 0.5) : undefined)
  const do2 = cabang.reduce((s, c) => s + c.hantaranO2, 0)
  return {
    status: 'tunak', cabang, titikCampur: campur?.id ?? null, fraksiAsliTotal: m.qLv / qTot,
    cLv, sLv: saturasiDariPO2(po2DariKandungan(cLv, m.hb)), cPost, sPost: saturasiDariPO2(po2DariKandungan(cPost, m.hb)),
    cvo2: cv, svo2: saturasiDariPO2(po2DariKandungan(cv, m.hb)), do2, vo2: m.vo2, oer: m.vo2 / do2, co2, belumDisimulasikan: BELUM_VA,
  }
}

// ── Penjelasan kausal dari transisi keadaan ───────────────────────────────────
export interface LangkahSebab { besaran: string; dari: number; ke: number; satuan: string }

const f = (x: number, d = 2) => Number.isFinite(x) ? Number(x.toFixed(d)) : NaN
const langkah = (besaran: string, dari: number, ke: number, satuan: string, d = 2): LangkahSebab => ({ besaran, dari: f(dari, d), ke: f(ke, d), satuan })
const berubah = (a: number, b: number, tol: number) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) > tol

/** Rantai sebab untuk VV: hanya langkah yang benar-benar berubah di keadaan yang dimasukkan. */
export function jelaskanVV(mA: MasukanVV, a: KeadaanVV, mB: MasukanVV, b: KeadaanVV): LangkahSebab[] {
  const r: LangkahSebab[] = []
  const masukan: Array<[keyof MasukanVV, string, string]> = [['sweep', 'Sweep gas', 'L/min'], ['fdo2', 'FdO₂', ''], ['qEcmo', 'Pump flow', 'L/min'], ['co', 'Cardiac output', 'L/min'], ['jarakKanulaCm', 'Cannula distance', 'cm'], ['hb', 'Hemoglobin', 'g/dL'], ['vo2', 'VO₂', 'mL/min'], ['shunt', 'Native shunt', ''], ['fungsiMembran', 'Membrane function', ''], ['va', 'Alveolar ventilation', 'L/min']]
  for (const [k, n, s] of masukan) if (berubah(mA[k] as number, mB[k] as number, 1e-9)) r.push(langkah(n, mA[k] as number, mB[k] as number, s))
  if (berubah(a.co2.vco2Membran, b.co2.vco2Membran, 0.5)) r.push(langkah('Membrane CO₂ removal', a.co2.vco2Membran, b.co2.vco2Membran, 'mL/min', 0))
  if (berubah(a.co2.paco2, b.co2.paco2, 0.05)) { r.push(langkah('PaCO₂', a.co2.paco2, b.co2.paco2, 'mmHg', 1)); r.push(langkah('pH', a.co2.ph, b.co2.ph, '', 2)); r.push(langkah('Cerebral blood flow (relative, direction only)', a.co2.aliranOtakRelatif, b.co2.aliranOtakRelatif, '×', 2)) }
  if (berubah(a.resirkulasi, b.resirkulasi, 0.002)) r.push(langkah('Recirculation fraction', a.resirkulasi, b.resirkulasi, ''))
  if (berubah(a.rasioEfektifTerhadapCO, b.rasioEfektifTerhadapCO, 0.002)) r.push(langkah('Effective ECMO flow / CO', a.rasioEfektifTerhadapCO, b.rasioEfektifTerhadapCO, ''))
  if (berubah(a.sPost, b.sPost, 0.001)) r.push(langkah('Post-oxygenator SO₂', a.sPost, b.sPost, ''))
  if (berubah(a.sao2, b.sao2, 0.001)) r.push(langkah('SaO₂', a.sao2, b.sao2, ''))
  if (berubah(a.cao2, b.cao2, 0.01)) r.push(langkah('CaO₂', a.cao2, b.cao2, 'mL/dL', 1))
  if (berubah(a.do2, b.do2, 1)) r.push(langkah('DO₂', a.do2, b.do2, 'mL/min', 0))
  if (berubah(a.oer, b.oer, 0.002)) r.push(langkah('O₂ extraction', a.oer, b.oer, ''))
  if (berubah(a.svo2, b.svo2, 0.001)) r.push(langkah('SvO₂', a.svo2, b.svo2, ''))
  return r
}

export function jelaskanVA(mA: MasukanVA, a: KeadaanVA, mB: MasukanVA, b: KeadaanVA): LangkahSebab[] {
  const r: LangkahSebab[] = []
  const masukan: Array<[keyof MasukanVA, string, string]> = [['qLv', 'Native LV output', 'L/min'], ['qEcmo', 'ECMO flow', 'L/min'], ['shunt', 'Native shunt', ''], ['fio2', 'Ventilator FiO₂', ''], ['sweep', 'Sweep gas', 'L/min'], ['fdo2', 'FdO₂', ''], ['hb', 'Hemoglobin', 'g/dL'], ['vo2', 'VO₂', 'mL/min']]
  for (const [k, n, s] of masukan) if (berubah(mA[k] as number, mB[k] as number, 1e-9)) r.push(langkah(n, mA[k] as number, mB[k] as number, s))
  if (berubah(a.sLv, b.sLv, 0.001)) r.push(langkah('Saturation of native LV blood', a.sLv, b.sLv, ''))
  if (berubah(a.fraksiAsliTotal, b.fraksiAsliTotal, 0.002)) r.push(langkah('Native share of systemic flow (pulsatility direction)', a.fraksiAsliTotal, b.fraksiAsliTotal, ''))
  const ia = CABANG_AORTA.findIndex((c) => c.id === a.titikCampur), ib = CABANG_AORTA.findIndex((c) => c.id === b.titikCampur)
  const nama = (id: string | null) => CABANG_AORTA.find((c) => c.id === id)?.nama.split(' (')[0] ?? 'none'
  if (ia !== ib) r.push({ besaran: `Mixing point: ${nama(a.titikCampur)} → ${nama(b.titikCampur)}`, dari: ia, ke: ib, satuan: 'branch index from aortic root' })
  for (const id of ['koroner', 'brakiosefal', 'iliaka']) {
    const x = a.cabang.find((c) => c.id === id), y = b.cabang.find((c) => c.id === id)
    if (x && y && berubah(x.saturasi, y.saturasi, 0.001)) r.push(langkah(`SO₂ in ${CABANG_AORTA.find((c) => c.id === id)!.nama}`, x.saturasi, y.saturasi, ''))
  }
  return r
}
