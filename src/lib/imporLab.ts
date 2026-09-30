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
  hba1c: ['hba1c', 'hb a1c', 'hemoglobin a1c', 'glycated hemoglobin'],
  gdp: ['glukosa puasa', 'gula darah puasa', 'fasting glucose', 'fasting blood glucose', 'gdp'],
  apob: ['apolipoprotein b', 'apo b', 'apob'],
  ldl: ['kolesterol ldl', 'ldl cholesterol', 'ldl-c', 'ldl'],
  hdl: ['kolesterol hdl', 'hdl cholesterol', 'hdl-c', 'hdl'],
  tg: ['trigliserida', 'triglyceride', 'triglycerides', 'trigliserid'],
  egfr: ['egfr', 'laju filtrasi glomerulus'],
  kreatinin: ['kreatinin', 'creatinine'],
  sgot: ['sgot', 'ast'],
  sgpt: ['sgpt', 'alt'],
  tsh: ['tsh'],
  vitd: ['vitamin d', '25-oh', '25(oh)d'],
  b12: ['vitamin b12', 'cobalamin', 'b12'],
  ferritin: ['feritin', 'ferritin'],
  crp: ['hs-crp', 'hscrp', 'high sensitivity crp'],
  albumin: ['albumin'],
  mcv: ['mcv'],
  rdw: ['rdw-cv', 'rdw'],
  alp: ['alkali fosfatase', 'alkaline phosphatase', 'alp'],
  wbc: ['leukosit', 'leukocytes', 'white blood cell', 'wbc'],
  limfosit: ['limfosit', 'lymphocytes', 'lymphocyte'],
  hb: ['hemoglobin', 'haemoglobin', 'hb'],
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
  'ml/min/1.73m²': ['ml/min/1.73m2', 'ml/min/1,73m2', 'ml/menit/1.73m2', 'ml/min/1.73m²'],
  'miu/l': ['miu/l', 'uiu/ml', 'µiu/ml', 'miu/l'],
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
