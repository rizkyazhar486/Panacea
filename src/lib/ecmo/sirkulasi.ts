// Sirkulasi berparameter-tergumpal, berbasis waktu (deterministik).
//
// Bilik kiri/kanan: elastans berubah-waktu (bentuk yang sama dengan hemodinamik.ts:
// P = e(t)·Ees·(V−V0) + (1−e(t))·Ped(V)). Pembuluh: kompartemen R–C. Katup: dioda
// dengan resistans kecil. Aorta dibagi proksimal (akar/arkus: koroner, kepala,
// lengan) dan distal (desendens: viseral, ginjal, tungkai), sehingga titik
// return ECMO perifer (femoral → distal) dan sentral (aorta asenden → proksimal)
// benar-benar berbeda geometrinya.
//
// Pompa sentrifugal: RPM menentukan HEAD, bukan aliran. Aliran = hasil
// keseimbangan head dengan beda tekanan pasien dan resistans sirkuit/kanula.
//
// Parameter ILUSTRATIF, dikalibrasi ke target dewasa normal (MAP, CO, CVP, PCWP)
// yang diuji; bukan hasil fitting data pasien. Status di bukti.ts.

import { tekananPasif, tekananAkhirSistolik, BILIK_RUJUKAN, type ParameterBilik } from '../hemodinamik'

export type KonfigurasiVA = 'tanpa' | 'VA-perifer' | 'VA-sentral'

export interface ParameterSirkulasi {
  hr: number                      // denyut/menit
  lv: ParameterBilik              // hanya ees, v0, kekakuanPasif, eksponenPasif dipakai
  rv: ParameterBilik
  svr: number                     // mmHg·s/mL, total sistemik
  pvr: number                     // mmHg·s/mL
  volumeDarah: number             // mL total
  ecmo: { konfigurasi: KonfigurasiVA; rpm: number }
}

const RV_RUJUKAN: ParameterBilik = { ...BILIK_RUJUKAN, ees: 0.55, v0: 10, kekakuanPasif: 0.25, eksponenPasif: 0.022 }

export const SIRKULASI_NORMAL: ParameterSirkulasi = {
  hr: 75, lv: BILIK_RUJUKAN, rv: RV_RUJUKAN, svr: 1.15, pvr: 0.09, volumeDarah: 5000,
  ecmo: { konfigurasi: 'tanpa', rpm: 0 },
}

// Kompartemen: komplians (mL/mmHg) dan volume tanpa-tekanan (mL). Ilustratif.
const C = { ao1: 0.45, ao2: 1.0, sv: 50, pa: 4.0, pv: 16 }
const VU = { ao1: 180, ao2: 520, sv: 2850, pa: 90, pv: 600 }
const R_AO = 0.012           // arkus → desendens
const FRAKSI_ATAS = 0.3      // proporsi konduktans sistemik dari aorta proksimal (koroner+kepala+lengan)
const R_KATUP = 0.003
// Pompa: H = A·(rpm/1000)² − B·Q², Q dalam L/menit; kanula+oksigenator R_SIRK (mmHg per L/menit).
const POMPA = { A: 7.5, B: 1.2, R_SIRK: 8 }

export function aliranPompa(rpm: number, pMasuk: number, pKeluar: number): number {
  const head = POMPA.A * (rpm / 1000) ** 2
  // Drainase kolaps bila tekanan vena sangat rendah (suck-down): resistans drainase melonjak.
  const rSirk = POMPA.R_SIRK * (1 + 4 * Math.max(0, 2 - pMasuk) ** 2)
  const beban = head - (pKeluar - pMasuk)
  if (beban <= 0) return 0 // aliran balik pompa tidak dimodelkan: dinyatakan nol, bukan ditebak
  return (-rSirk + Math.sqrt(rSirk * rSirk + 4 * POMPA.B * beban)) / (2 * POMPA.B)
}

function aktivasi(tDalamSiklus: number, periode: number): number {
  const ts = 0.16 + 0.2 * periode // durasi sistolik (ilustratif, memendek saat HR naik)
  return tDalamSiklus < ts ? Math.sin((Math.PI * tDalamSiklus) / ts) : 0
}

const pBilik = (v: number, e: number, p: ParameterBilik) => e * tekananAkhirSistolik(v, p) + (1 - e) * tekananPasif(v, p)

export interface HasilSirkulasi {
  sah: boolean
  alasan?: string
  map: number; sbp: number; dbp: number; pulsePressure: number
  cvp: number; pcwp: number; papMean: number
  lvedv: number; lvesv: number; sv: number; ef: number
  rvedv: number
  coAsli: number        // L/menit melalui katup aorta
  qEcmo: number         // L/menit
  aliranArkusKeDistal: number // L/menit; negatif = aliran retrograd mencapai arkus
  fraksiBukaKatupAorta: number
  lingkarLV: Array<{ v: number; p: number }>
  gelombangArteri: number[]   // tekanan aorta proksimal, satu siklus
  denyut: number              // jumlah siklus sampai periodik
  volumeTotal: number         // harus sama dengan volumeDarah (kekekalan massa)
}

export function simulasiSirkulasi(p: ParameterSirkulasi, maksDenyut = 60, dt = 0.0005): HasilSirkulasi {
  const gagal = (alasan: string): HasilSirkulasi => ({ sah: false, alasan, map: NaN, sbp: NaN, dbp: NaN, pulsePressure: NaN, cvp: NaN, pcwp: NaN, papMean: NaN, lvedv: NaN, lvesv: NaN, sv: NaN, ef: NaN, rvedv: NaN, coAsli: NaN, qEcmo: NaN, aliranArkusKeDistal: NaN, fraksiBukaKatupAorta: NaN, lingkarLV: [], gelombangArteri: [], denyut: 0, volumeTotal: NaN })
  if (!(p.hr >= 20 && p.hr <= 220) || !(p.svr > 0) || !(p.pvr > 0) || !(p.volumeDarah > 2000) || !(p.lv.ees >= 0) || !(p.rv.ees >= 0)) return gagal('parameter di luar rentang')

  const periode = 60 / p.hr, langkah = Math.round(periode / dt)
  const rAtas = p.svr / FRAKSI_ATAS, rBawah = p.svr / (1 - FRAKSI_ATAS)
  // Keadaan awal: bilik 120/100 mL, sisa volume dibagi proporsional ke volume tanpa-tekanan + sedikit tekanan.
  const s = { lv: 120, rv: 130, ao1: VU.ao1 + 80 * C.ao1, ao2: VU.ao2 + 80 * C.ao2, pa: VU.pa + 15 * C.pa, pv: VU.pv + 8 * C.pv, sv: 0 }
  s.sv = p.volumeDarah - (s.lv + s.rv + s.ao1 + s.ao2 + s.pa + s.pv)
  if (s.sv < VU.sv * 0.5) return gagal('volume darah terlalu kecil untuk model')

  let rekaman = { lvMin: Infinity, lvMax: -Infinity, rvMax: -Infinity, pAoMin: Infinity, pAoMax: -Infinity, sumPao: 0, sumCvp: 0, sumPcwp: 0, sumPap: 0, volAorta: 0, volEcmo: 0, volArkus: 0, buka: 0, lingkar: [] as Array<{ v: number; p: number }>, gel: [] as number[] }
  let sebelum: typeof rekaman | null = null
  let denyut = 0
  for (; denyut < maksDenyut; denyut++) {
    rekaman = { lvMin: Infinity, lvMax: -Infinity, rvMax: -Infinity, pAoMin: Infinity, pAoMax: -Infinity, sumPao: 0, sumCvp: 0, sumPcwp: 0, sumPap: 0, volAorta: 0, volEcmo: 0, volArkus: 0, buka: 0, lingkar: [], gel: [] }
    for (let i = 0; i < langkah; i++) {
      const e = aktivasi(i * dt, periode)
      const pLv = pBilik(s.lv, e, p.lv), pRv = pBilik(s.rv, e, p.rv)
      const pAo1 = (s.ao1 - VU.ao1) / C.ao1, pAo2 = (s.ao2 - VU.ao2) / C.ao2
      const pSv = (s.sv - VU.sv) / C.sv, pPa = (s.pa - VU.pa) / C.pa, pPv = (s.pv - VU.pv) / C.pv
      const qMitral = Math.max(0, (pPv - pLv) / R_KATUP)
      const qAorta = Math.max(0, (pLv - pAo1) / R_KATUP)
      const qTrikuspid = Math.max(0, (pSv - pRv) / R_KATUP)
      const qPulmonal = Math.max(0, (pRv - pPa) / R_KATUP)
      const qArkus = (pAo1 - pAo2) / R_AO
      const qAtas = (pAo1 - pSv) / rAtas, qBawah = (pAo2 - pSv) / rBawah
      const qParu = (pPa - pPv) / p.pvr
      let qE = 0
      if (p.ecmo.konfigurasi !== 'tanpa' && p.ecmo.rpm > 0) qE = aliranPompa(p.ecmo.rpm, pSv, p.ecmo.konfigurasi === 'VA-perifer' ? pAo2 : pAo1) * 1000 / 60 // mL/s
      const keAo1 = p.ecmo.konfigurasi === 'VA-sentral' ? qE : 0, keAo2 = p.ecmo.konfigurasi === 'VA-perifer' ? qE : 0
      s.lv += dt * (qMitral - qAorta)
      s.ao1 += dt * (qAorta - qArkus - qAtas + keAo1)
      s.ao2 += dt * (qArkus - qBawah + keAo2)
      s.sv += dt * (qAtas + qBawah - qTrikuspid - qE)
      s.rv += dt * (qTrikuspid - qPulmonal)
      s.pa += dt * (qPulmonal - qParu)
      s.pv += dt * (qParu - qMitral)
      for (const v of Object.values(s)) if (!Number.isFinite(v) || v < 0) return gagal('integrasi tidak stabil (volume negatif atau tak hingga)')
      rekaman.lvMin = Math.min(rekaman.lvMin, s.lv); rekaman.lvMax = Math.max(rekaman.lvMax, s.lv); rekaman.rvMax = Math.max(rekaman.rvMax, s.rv)
      rekaman.pAoMin = Math.min(rekaman.pAoMin, pAo1); rekaman.pAoMax = Math.max(rekaman.pAoMax, pAo1)
      rekaman.sumPao += pAo1; rekaman.sumCvp += pSv; rekaman.sumPcwp += pPv; rekaman.sumPap += pPa
      rekaman.volAorta += qAorta * dt; rekaman.volEcmo += qE * dt; rekaman.volArkus += qArkus * dt
      if (qAorta > 0) rekaman.buka++
      if (i % 10 === 0) { rekaman.lingkar.push({ v: s.lv, p: pLv }); rekaman.gel.push(pAo1) }
    }
    if (sebelum && Math.abs(rekaman.sumPao - sebelum.sumPao) / langkah < 0.02 && Math.abs(rekaman.lvMax - sebelum.lvMax) < 0.05 && Math.abs(rekaman.sumCvp - sebelum.sumCvp) / langkah < 0.01) break
    sebelum = rekaman
  }
  const n = langkah, keLmin = 60 / periode / 1000
  const sv = rekaman.volAorta
  return {
    sah: true,
    map: rekaman.sumPao / n, sbp: rekaman.pAoMax, dbp: rekaman.pAoMin, pulsePressure: rekaman.pAoMax - rekaman.pAoMin,
    cvp: rekaman.sumCvp / n, pcwp: rekaman.sumPcwp / n, papMean: rekaman.sumPap / n,
    lvedv: rekaman.lvMax, lvesv: rekaman.lvMin, sv, ef: rekaman.lvMax > 0 ? sv / rekaman.lvMax : NaN, rvedv: rekaman.rvMax,
    coAsli: rekaman.volAorta * keLmin, qEcmo: rekaman.volEcmo * keLmin, aliranArkusKeDistal: rekaman.volArkus * keLmin,
    fraksiBukaKatupAorta: rekaman.buka / n, lingkarLV: rekaman.lingkar, gelombangArteri: rekaman.gel, denyut: denyut + 1,
    volumeTotal: s.lv + s.rv + s.ao1 + s.ao2 + s.pa + s.pv + s.sv,
  }
}

/** Syok kardiogenik ilustratif (kriteria yang dipakai De Lazzari 2025: SBP < 90, PCWP > 15, CI < 2,2):
 *  Ees LV 30% normal + retensi volume kompensatorik 350 mL. */
export const SKENARIO_SYOK_KARDIOGENIK: ParameterSirkulasi = { ...SIRKULASI_NORMAL, lv: { ...BILIK_RUJUKAN, ees: BILIK_RUJUKAN.ees * 0.3 }, volumeDarah: 5350 }

/** Syok kardiogenik ilustratif: kontraktilitas LV turun. */
export function denganKontraktilitas(p: ParameterSirkulasi, fraksiEes: number): ParameterSirkulasi {
  return { ...p, lv: { ...p.lv, ees: p.lv.ees * fraksiEes } }
}

export interface LangkahHemo { besaran: string; dari: number; ke: number; satuan: string }
/** Rantai sebab hemodinamik dari dua hasil simulasi (hanya besaran yang berubah). */
export function jelaskanHemodinamik(pA: ParameterSirkulasi, a: HasilSirkulasi, pB: ParameterSirkulasi, b: HasilSirkulasi): LangkahHemo[] {
  const r: LangkahHemo[] = []
  const tambah = (besaran: string, x: number, y: number, satuan: string, tol: number, d = 1) => { if (Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) > tol) r.push({ besaran, dari: Number(x.toFixed(d)), ke: Number(y.toFixed(d)), satuan }) }
  tambah('LV contractility (Ees)', pA.lv.ees, pB.lv.ees, 'mmHg/mL', 1e-9, 2)
  tambah('Pump speed', pA.ecmo.rpm, pB.ecmo.rpm, 'rpm', 0.5, 0)
  tambah('Blood volume', pA.volumeDarah, pB.volumeDarah, 'mL', 0.5, 0)
  tambah('SVR', pA.svr, pB.svr, 'mmHg·s/mL', 1e-9, 2)
  tambah('ECMO flow (from pump head vs pressures)', a.qEcmo, b.qEcmo, 'L/min', 0.02, 2)
  tambah('Mean arterial pressure', a.map, b.map, 'mmHg', 0.5, 0)
  tambah('LV end-systolic volume', a.lvesv, b.lvesv, 'mL', 0.5, 0)
  tambah('PCWP (left-sided filling)', a.pcwp, b.pcwp, 'mmHg', 0.2, 1)
  tambah('Pulse pressure', a.pulsePressure, b.pulsePressure, 'mmHg', 0.5, 0)
  tambah('Native LV output', a.coAsli, b.coAsli, 'L/min', 0.02, 2)
  return r
}
