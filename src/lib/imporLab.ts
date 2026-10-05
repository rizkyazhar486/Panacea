// Impor teks lembar hasil lab (disalin dari PDF/portal lab) → kandidat butir lab.
//
// Deterministik, tanpa AI: nama tes dicocokkan dengan alias eksplisit, angka
// pertama setelah nama diambil sebagai hasil, satuan pada baris harus SAMA
// dengan satuan jenis lab di aplikasi (kalau berbeda: ditandai, tidak diimpor —
// konversi diam-diam lebih berbahaya daripada meminta pengguna mengetik), dan
// rentang "a - b" pada baris yang sama dibaca sebagai rentang rujukan lab itu.
// Hasilnya hanya KANDIDAT: pengguna mencentang setiap angka sebelum disimpan.
import { JENIS_LAB, type JenisLab } from './lab.ts'

/** Alias nama tes seperti yang lazim tercetak pada lembar lab (ID/EN). Urutan: yang lebih spesifik dulu. */
export const ALIAS_LAB: Readonly<Record<string, readonly string[]>> = {
  hba1c: ['hba1c', 'hb a1c', 'hemoglobin a1c', 'glycated hemoglobin', 'glycohemoglobin'],
  gdp: ['glukosa puasa', 'gula darah puasa', 'fasting glucose', 'fasting blood glucose', 'fasting blood sugar', 'gdp', 'fbs'],
  apob: ['apolipoprotein b', 'apo b', 'apob'],
  ldl: ['kolesterol ldl', 'ldl cholesterol', 'ldl-c', 'ldl chol', 'ldl'],
  hdl: ['kolesterol hdl', 'hdl cholesterol', 'hdl-c', 'hdl chol', 'hdl'],
  tg: ['trigliserida', 'triglyceride', 'triglycerides', 'trigliserid', 'tg'],
  // After LDL/HDL in JENIS_LAB so "Kolesterol LDL/HDL" never steals total.
  chol: ['kolesterol total', 'total cholesterol', 'cholesterol total', 'chol total', 'total chol'],
  egfr: ['egfr', 'estimated gfr', 'estimated glomerular filtration', 'laju filtrasi glomerulus'],
  kreatinin: ['kreatinin', 'creatinine', 'creat'],
  sgot: ['sgot', 'ast', 'aspartate aminotransferase'],
  sgpt: ['sgpt', 'alt', 'alanine aminotransferase'],
  tsh: ['tsh', 'thyroid stimulating hormone', 'thyroid-stimulating hormone'],
  vitd: ['25-oh vitamin d', '25 oh vitamin d', 'vitamin d 25', 'vitamin d', '25-oh', '25(oh)d'],
  b12: ['vitamin b12', 'cobalamin', 'vit b12', 'b12'],
  ferritin: ['feritin', 'ferritin'],
  crp: ['hs-crp', 'hscrp', 'high sensitivity crp', 'c-reactive protein', 'crp'],
  asamUrat: ['asam urat', 'uric acid', 'urate'],
  albumin: ['albumin'],
  mcv: ['mcv', 'mean corpuscular volume'],
  rdw: ['rdw-cv', 'rdw'],
  alp: ['alkali fosfatase', 'alkaline phosphatase', 'alp'],
  wbc: ['leukosit', 'leukocytes', 'white blood cell', 'white blood cells', 'wbc'],
  limfosit: ['limfosit', 'lymphocytes', 'lymphocyte', 'lym'],
  trombosit: ['trombosit', 'platelet', 'platelets', 'plt'],
  natrium: ['natrium', 'sodium'],
  kalium: ['kalium', 'potassium'],
  kalsium: ['kalsium', 'calcium'],
  fosfor: ['fosfor', 'phosphorus', 'phosphate'],
  folat: ['folat', 'folate', 'folic acid'],
  bilirubin: ['bilirubin total', 'total bilirubin', 'bilirubin'],
  homosistein: ['homocysteine', 'homosistein'],
  inr: ['international normalized ratio', 'inr'],
  kortisol: ['cortisol', 'kortisol'],
  bun: ['blood urea nitrogen', 'bun', 'ureum'],
  ggt: ['gamma-glutamyl transferase', 'gamma gt', 'ggt'],
  hb: ['hemoglobin', 'haemoglobin', 'hgb', 'hb'],
}

export interface KandidatLab {
  jenisId: string
  nama: string
  nilai: number
  satuanDiLembar: string | null
  rujukanBawah?: number
  rujukanAtas?: number
  baris: string
  masalah: 'satuan-berbeda' | 'satuan-tidak-terbaca' | null
}

const normal = (s: string) => s.toLowerCase().replace(/µ/g, 'u').replace(/\s+/g, '')
// Satuan setara secara penulisan (bukan konversi): hanya variasi ejaan simbol.
const SATUAN_SETARA: Readonly<Record<string, readonly string[]>> = {
  '10³/µl': ['10^3/ul', '10³/ul', '10*3/ul', 'ribu/ul', 'x10^3/ul', 'x10³/ul', '10^9/l', '10³/µl'],
  '×10⁹/l': ['x10^9/l', '10^9/l', 'x10⁹/l', '×10^9/l', '10*9/l', 'ribu/ul', '10^3/ul'],
  'ml/min/1.73m²': ['ml/min/1.73m2', 'ml/min/1,73m2', 'ml/menit/1.73m2', 'ml/min/1.73m²'],
  'miu/l': ['miu/l', 'uiu/ml', 'µiu/ml', 'miu/l'],
  'ng/ml': ['ng/ml', 'ug/l', 'µg/l'],
  'pg/ml': ['pg/ml', 'ng/l'],
  'meq/l': ['meq/l', 'mmol/l', 'meq/l'],
}
export function satuanCocok(lembar: string, jenis: JenisLab): boolean {
  const a = normal(lembar), b = normal(jenis.satuan)
  if (a === b) return true
  const grup = SATUAN_SETARA[b] ?? SATUAN_SETARA[jenis.satuan.toLowerCase()]
  return !!grup?.some((x) => normal(x) === a)
}

const ANGKA = /(\d+(?:[.,]\d+)?)/
function baca(t: string): number { return Number(t.replace(',', '.')) }

export function uraikanLembarLab(teks: string): KandidatLab[] {
  const hasil: KandidatLab[] = []
  const sudah = new Set<string>()
  for (const barisMentah of teks.split(/\r?\n/)) {
    const baris = barisMentah.replace(/\t/g, ' ').trim()
    if (!baris) continue
    const kecil = baris.toLowerCase()
    for (const j of JENIS_LAB) {
      if (sudah.has(j.id)) continue
      const alias = (ALIAS_LAB[j.id] ?? []).find((a) => new RegExp(`(^|[^a-z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(kecil))
      if (!alias) continue
      // Nama lebih spesifik yang sudah cocok (mis. "hemoglobin a1c") mengalahkan "hemoglobin".
      if (j.id === 'hb' && /a1c/.test(kecil)) continue
      const sisa = baris.slice(kecil.indexOf(alias) + alias.length)
      const m = sisa.match(ANGKA)
      if (!m) continue
      const nilai = baca(m[1])
      if (!(nilai > 0)) continue
      const setelah = sisa.slice((m.index ?? 0) + m[0].length)
      const satuanM = setelah.match(/^\s*([a-zA-Zµ%³^*0-9./,²]+(?:\/[a-zA-Z0-9.,²³µ]+)*)/)
      const satuanDiLembar = satuanM && /[a-zA-Z%µ]/.test(satuanM[1]) ? satuanM[1] : null
      const rentang = setelah.match(/(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)/)
      const rb = rentang ? baca(rentang[1]) : undefined
      const ra = rentang ? baca(rentang[2]) : undefined
      hasil.push({
        jenisId: j.id, nama: j.nama, nilai, satuanDiLembar,
        ...(rb !== undefined && ra !== undefined && rb < ra ? { rujukanBawah: rb, rujukanAtas: ra } : {}),
        baris,
        masalah: satuanDiLembar === null ? 'satuan-tidak-terbaca' : satuanCocok(satuanDiLembar, j) ? null : 'satuan-berbeda',
      })
      sudah.add(j.id)
      break
    }
  }
  return hasil
}

/**
 * Vision prompt for lab-report photos. OCR drafts plain text only; parsing and
 * confirm-before-save stay in uraikanLembarLab / ImporLembarLab.
 */
export const PERINTAH_BACA_LEMBAR_LAB =
  'Read the laboratory results table in this image. Transcribe each result line ' +
  'exactly as printed, one line per test, in the form "Test name  value  unit  ' +
  'reference range" when those fields are visible. Preserve numbers, units, and ' +
  'ranges as written (including Indonesian commas as decimals). Do not invent ' +
  'missing values, convert units, diagnose, or add advice. Skip unreadable lines ' +
  'and any patient name or address.'

