import { tanggalKalenderSah } from './tanggal.ts'

// Hasil laboratorium yang dimasukkan sendiri, beserta rentang rujukannya.
//
// MENGAPA TERPISAH DARI VITALS. Angka dari perangkat masuk sendiri berkali-kali
// sehari; hasil lab masuk beberapa kali setahun dan setiap butirnya punya
// TANGGAL PENGAMBILAN yang penting — HbA1c bulan lalu bukan HbA1c hari ini, dan
// menimpanya seperti bacaan jam tangan akan menghapus justru yang paling
// berharga: perjalanannya dari tahun ke tahun.
//
// RENTANG RUJUKAN DITULIS APA ADANYA BESERTA SUMBERNYA, dan tiga hal sengaja
// TIDAK dilakukan:
//   1. Tidak ada penilaian "sehat" atau "sakit". Nilai di luar rentang bisa
//      wajar (atlet, kehamilan, obat tertentu), dan nilai di dalam rentang
//      tidak menyingkirkan penyakit.
//   2. Tidak ada angka yang dihitung mundur dari yang lain. LDL yang dihitung
//      dengan Friedewald meleset pada trigliserida tinggi, dan menampilkannya
//      seolah hasil ukur menyembunyikan itu.
//   3. Tidak ada rentang yang diseragamkan antar-laboratorium. Setiap lab
//      punya rentangnya sendiri menurut alat dan populasinya; yang dipakai di
//      sini adalah rentang yang lazim dipakai di Indonesia, dan pemakainya
//      diingatkan membandingkan dengan yang tertera di lembar hasilnya.

export interface ButirLab {
  id: string
  /** yyyy-mm-dd */
  tanggal: string
  nilai: number
  /** Rentang rujukan yang TERCETAK di lembar hasil lab ini (opsional). Setiap
   *  lab punya rentangnya sendiri; bila ada, ini yang dipakai, bukan rentang umum. */
  rujukanBawah?: number
  rujukanAtas?: number
}

export interface JenisLab {
  id: string
  nama: string
  satuan: string
  /** Rentang rujukan lazim; kosong bila memang tidak ada rentang tunggal. */
  bawah?: number
  atas?: number
  /** Arah yang umumnya diinginkan — hanya untuk mengurutkan grafik, bukan penilaian. */
  sumber: string
  catatan?: string
}

export const JENIS_LAB: JenisLab[] = [
  {
    id: 'hba1c', nama: 'HbA1c', satuan: '%', atas: 5.7,
    sumber: 'ADA: <5.7% normal; 5.7–6.4% prediabetes; ≥6.5% diabetes',
    catatan: 'Unreliable in anaemia, haemoglobinopathies, and pregnancy.',
  },
  {
    id: 'gdp', nama: 'Fasting glucose', satuan: 'mg/dL', bawah: 70, atas: 100,
    sumber: 'ADA: 100–125 mg/dL prediabetes; ≥126 mg/dL diabetes (on two tests)',
  },
  {
    id: 'apob', nama: 'ApoB', satuan: 'mg/dL', atas: 90,
    sumber: 'EAS consensus: ApoB counts atherogenic particles; the target depends on each person’s risk',
    catatan: 'Targets in high-risk people are far lower — set by a doctor.',
  },
  {
    id: 'ldl', nama: 'LDL', satuan: 'mg/dL', atas: 100,
    sumber: 'The target depends on each person’s cardiovascular risk',
  },
  {
    id: 'hdl', nama: 'HDL', satuan: 'mg/dL', bawah: 40,
    sumber: 'Low below 40 mg/dL (men) or 50 mg/dL (women)',
  },
  {
    id: 'tg', nama: 'Triglycerides', satuan: 'mg/dL', atas: 150,
    sumber: 'Fast for 9–12 hours; ≥150 mg/dL counts as high',
  },
  {
    id: 'chol', nama: 'Total cholesterol', satuan: 'mg/dL', atas: 200,
    sumber: 'Usual desirable <200 mg/dL; individual targets depend on cardiovascular risk',
    catatan: 'Not a substitute for LDL, ApoB or non-HDL when those are available.',
  },
  {
    id: 'egfr', nama: 'eGFR', satuan: 'mL/min/1.73m²', bawah: 90,
    sumber: 'KDIGO: <60 for ≥3 months marks chronic kidney disease',
  },
  {
    id: 'kreatinin', nama: 'Creatinine', satuan: 'mg/dL', bawah: 0.6, atas: 1.3,
    sumber: 'Usual adult range; depends on muscle mass',
  },
  { id: 'sgot', nama: 'SGOT (AST)', satuan: 'U/L', atas: 40, sumber: 'Usual adult range' },
  { id: 'sgpt', nama: 'SGPT (ALT)', satuan: 'U/L', atas: 41, sumber: 'Usual adult range' },
  { id: 'tsh', nama: 'TSH', satuan: 'mIU/L', bawah: 0.4, atas: 4.0, sumber: 'Usual range for non-pregnant adults' },
  { id: 'vitd', nama: 'Vitamin D (25-OH)', satuan: 'ng/mL', bawah: 20, atas: 50, sumber: 'IOM: <20 ng/mL is deficiency' },
  { id: 'b12', nama: 'Vitamin B12', satuan: 'pg/mL', bawah: 200, atas: 900, sumber: 'Usual range; long-term metformin lowers it' },
  { id: 'ferritin', nama: 'Ferritin', satuan: 'ng/mL', bawah: 30, atas: 300, sumber: 'Low means iron stores are depleted; high can mean inflammation' },
  { id: 'hb', nama: 'Hemoglobin', satuan: 'g/dL', bawah: 12, atas: 17, sumber: 'WHO: anaemia below 13 g/dL (men) or 12 g/dL (women)' },
  { id: 'crp', nama: 'hs-CRP', satuan: 'mg/L', atas: 3, sumber: 'AHA/CDC: <1 low risk, 1–3 moderate, >3 high (not during acute infection)' },
  { id: 'asamUrat', nama: 'Uric acid', satuan: 'mg/dL', atas: 7, sumber: 'Usual range; gout can occur at normal levels' },
  // Enam penanda berikut melengkapi sembilan masukan PhenoAge (Levine 2018)
  // bersama glukosa puasa, kreatinin dan hs-CRP di atas, sehingga usia
  // biologis bisa dihitung dari riwayat lab yang sama, per tanggal ambil darah.
  { id: 'albumin', nama: 'Albumin', satuan: 'g/dL', bawah: 3.5, atas: 5.0, sumber: 'Usual adult range; varies by laboratory' },
  { id: 'mcv', nama: 'MCV', satuan: 'fL', bawah: 80, atas: 100, sumber: 'Usual adult range; varies by laboratory' },
  { id: 'rdw', nama: 'RDW', satuan: '%', bawah: 11.5, atas: 14.5, sumber: 'Usual adult range (RDW-CV); varies by analyser' },
  { id: 'alp', nama: 'Alkaline phosphatase', satuan: 'U/L', bawah: 44, atas: 147, sumber: 'Usual adult range; higher in adolescents and pregnancy' },
  { id: 'wbc', nama: 'White blood cells', satuan: '10³/µL', bawah: 4.0, atas: 11.0, sumber: 'Usual adult range; varies by laboratory' },
  { id: 'limfosit', nama: 'Lymphocytes', satuan: '%', bawah: 20, atas: 40, sumber: 'Usual adult differential; varies by laboratory' },
  { id: 'trombosit', nama: 'Platelets', satuan: '×10⁹/L', bawah: 150, atas: 450, sumber: 'Usual adult range; varies by laboratory' },
  {
    id: 'natrium', nama: 'Sodium', satuan: 'mEq/L', bawah: 135, atas: 145,
    sumber: 'Usual adult serum range; interpret with volume status',
  },
  {
    id: 'kalium', nama: 'Potassium', satuan: 'mEq/L', bawah: 3.5, atas: 5.0,
    sumber: 'Usual adult serum range; critical when markedly abnormal',
  },
  // Rentang di bawah sama dengan yang sudah ditampilkan tracker Nutrition,
  // supaya dua permukaan tidak memakai angka rujukan yang berbeda.
  { id: 'kalsium', nama: 'Calcium', satuan: 'mg/dL', bawah: 8.5, atas: 10.5, sumber: 'Usual adult serum range; varies by laboratory' },
  { id: 'fosfor', nama: 'Phosphorus', satuan: 'mg/dL', bawah: 2.5, atas: 4.5, sumber: 'Usual adult serum range; varies by laboratory' },
  { id: 'folat', nama: 'Folate', satuan: 'ng/mL', bawah: 3, atas: 20, sumber: 'Usual adult serum range; varies by laboratory' },
  { id: 'bilirubin', nama: 'Bilirubin', satuan: 'mg/dL', bawah: 0.1, atas: 1.2, sumber: 'Usual adult total bilirubin range; varies by laboratory' },
  { id: 'homosistein', nama: 'Homocysteine', satuan: 'µmol/L', bawah: 5, atas: 15, sumber: 'Usual adult range; varies by laboratory' },
  { id: 'inr', nama: 'INR', satuan: 'ratio', bawah: 0.8, atas: 1.2, sumber: 'Usual range without anticoagulant therapy; a treatment target is set by a clinician' },
  {
    id: 'kortisol', nama: 'Cortisol', satuan: 'µg/dL', bawah: 6, atas: 23,
    sumber: 'Usual serum range used by the Nutrition tracker; varies by laboratory and time of day',
    catatan: 'Not a stimulation-test result and not a diagnosis.',
  },
  { id: 'bun', nama: 'Blood urea nitrogen', satuan: 'mg/dL', bawah: 7, atas: 20, sumber: 'Usual adult range used by the Nutrition hemodialysis tracker; varies by laboratory' },
  { id: 'ggt', nama: 'GGT', satuan: 'U/L', bawah: 5, atas: 40, sumber: 'Usual adult range used by the Nutrition tracker; varies by laboratory' },
]

const KUNCI = 'pmd_lab_v1'

type Simpanan = Record<string, ButirLab[]>

export function ambilLab(): Simpanan {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI) || '{}')
    if (!d || typeof d !== 'object') return {}
    const bersih: Simpanan = {}
    for (const [jenis, daftar] of Object.entries(d as Simpanan)) {
      if (!Array.isArray(daftar)) continue
      bersih[jenis] = daftar.filter((b) => b && tanggalKalenderSah(b.tanggal) && typeof b.nilai === 'number' && Number.isFinite(b.nilai))
    }
    return bersih
  } catch {
    return {}
  }
}

// Cap waktu perubahan lokal terakhir — dasar sinkronisasi "yang terakhir
// menang" dengan server (lihat labSync.ts dan server/src/labLog.ts).
export const KUNCI_DIPERBARUI = 'pmd_lab_diperbarui_v1'

export function labDiperbaruiPada(): string | null {
  try { return localStorage.getItem(KUNCI_DIPERBARUI) } catch { return null }
}

function tulis(s: Simpanan, cap: string) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(s))
    localStorage.setItem(KUNCI_DIPERBARUI, cap)
  } catch { /* kuota */ }
}

function simpan(s: Simpanan) {
  tulis(s, new Date().toISOString())
  try { window.dispatchEvent(new CustomEvent('panacea:lab', { detail: { asal: 'lokal' } })) } catch { /* ignore */ }
}

/** Ganti seluruh log dengan salinan server; tidak dianggap perubahan lokal. */
export function gantiDariServer(s: Simpanan, cap: string): void {
  tulis(s, cap)
  try { window.dispatchEvent(new CustomEvent('panacea:lab', { detail: { asal: 'server' } })) } catch { /* ignore */ }
}

export function tambahLab(jenis: string, tanggal: string, nilai: number, rujukan?: { bawah?: number; atas?: number }): void {
  if (!tanggalKalenderSah(tanggal)) return
  const s = ambilLab()
  const daftar = s[jenis] ?? []
  daftar.push({
    id: `${jenis}-${Date.now()}`, tanggal, nilai,
    ...(rujukan?.bawah != null ? { rujukanBawah: rujukan.bawah } : {}),
    ...(rujukan?.atas != null ? { rujukanAtas: rujukan.atas } : {}),
  })
  daftar.sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  // Seratus butir per jenis sudah lebih dari seumur hidup pemeriksaan tahunan.
  s[jenis] = daftar.slice(-100)
  simpan(s)
}

/**
 * Set one analyte for one blood-draw date (replace same date, else append).
 * Used by PhenoAge / Biological Age so edits join the account-synced lab log
 * instead of a parallel browser-only sheet.
 */
export function tetapkanLabPadaTanggal(jenis: string, tanggal: string, nilai: number): void {
  if (!(nilai > 0) || !tanggalKalenderSah(tanggal)) return
  if (!JENIS_LAB.some((j) => j.id === jenis)) return
  const s = ambilLab()
  const daftar = [...(s[jenis] ?? [])]
  const i = daftar.findIndex((b) => b.tanggal === tanggal)
  if (i >= 0) daftar[i] = { ...daftar[i], nilai }
  else daftar.push({ id: `${jenis}-${Date.now()}`, tanggal, nilai })
  daftar.sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  s[jenis] = daftar.slice(-100)
  simpan(s)
}

/**
 * Nutrition page camelCase keys → synced lab-log jenis ids.
 * Keys without a JENIS_LAB entry stay local to Nutrition (explicit skip).
 */
export const KUNCI_NUTRISI_KE_JENIS_LAB: Readonly<Record<string, string>> = {
  glucose: 'gdp',
  hba1c: 'hba1c',
  totalCholesterol: 'chol',
  ldl: 'ldl',
  hdl: 'hdl',
  triglycerides: 'tg',
  creatinine: 'kreatinin',
  gfr: 'egfr',
  alt: 'sgpt',
  ast: 'sgot',
  hemoglobin: 'hb',
  wbc: 'wbc',
  crp: 'crp',
  albumin: 'albumin',
  vitD: 'vitd',
  uricAcid: 'asamUrat',
  platelet: 'trombosit',
  ferritin: 'ferritin',
  vitB12: 'b12',
  tsh: 'tsh',
  mcv: 'mcv',
  rdw: 'rdw',
  alp: 'alp',
  apoB: 'apob',
  sodium: 'natrium',
  potassium: 'kalium',
  calcium: 'kalsium',
  phosphorus: 'fosfor',
  folate: 'folat',
  bilirubin: 'bilirubin',
  homocysteine: 'homosistein',
  inr: 'inr',
  cortisol: 'kortisol',
  bun: 'bun',
  ggt: 'ggt',
}

/** Nutrition protocols sometimes type platelets or WBC per µL. Those magnitudes must not enter the ×10⁹/L or 10³/µL catalog. */
const SKALA_MAKS_KATALOG: Readonly<Record<string, number>> = {
  trombosit: 5000,
  wbc: 500,
}

const JENIS_LAB_KE_NUTRISI: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(Object.entries(KUNCI_NUTRISI_KE_JENIS_LAB).map(([k, v]) => [v, k])),
)

/**
 * Project Nutrition weekly-tracker values into the account-synced lab log.
 * Unknown keys and non-positive values are skipped — never invented.
 */
export function proyeksikanNilaiNutrisiKeLabKanonic(
  tanggal: string,
  values: Record<string, number>,
): { written: string[]; skipped: string[] } {
  const written: string[] = []
  const skipped: string[] = []
  if (!tanggalKalenderSah(tanggal) || !values || typeof values !== 'object') {
    return { written, skipped: Object.keys(values ?? {}) }
  }
  for (const [kunci, mentah] of Object.entries(values)) {
    const jenis = KUNCI_NUTRISI_KE_JENIS_LAB[kunci]
    if (!jenis) { skipped.push(kunci); continue }
    if (typeof mentah !== 'number' || !Number.isFinite(mentah) || !(mentah > 0)) {
      skipped.push(kunci)
      continue
    }
    const skalaMaks = SKALA_MAKS_KATALOG[jenis]
    if (skalaMaks != null && mentah > skalaMaks) {
      skipped.push(kunci)
      continue
    }
    tetapkanLabPadaTanggal(jenis, tanggal, mentah)
    written.push(kunci)
  }
  return { written, skipped }
}

/** Read synced lab values for a draw date as Nutrition camelCase keys. */
export function nilaiNutrisiDariLabKanonic(tanggal: string, opts: { tepat?: boolean } = {}): Record<string, number> {
  const keluar: Record<string, number> = {}
  if (!tanggalKalenderSah(tanggal)) return keluar
  for (const [jenis, kunci] of Object.entries(JENIS_LAB_KE_NUTRISI)) {
    const daftar = ambilLab()[jenis] ?? []
    const n = opts.tepat
      ? daftar.find((b) => b.tanggal === tanggal && b.nilai > 0)?.nilai
      : nilaiLabPadaTanggal(jenis, tanggal)
    if (n != null && n > 0) keluar[kunci] = n
  }
  return keluar
}

export interface BarisLabNutrisi {
  date: string
  values: Record<string, number>
}

/**
 * Merge Nutrition-local weekly rows with the account lab log.
 * Mapped analytes use the account value for that exact draw date.
 * Keys without a catalog id stay on the Nutrition row.
 */
export function gabungLabNutrisiDenganKanonic(lokal: readonly BarisLabNutrisi[]): BarisLabNutrisi[] {
  const perTanggal = new Map<string, Record<string, number>>()
  for (const row of lokal) {
    if (!row?.date || !tanggalKalenderSah(row.date)) continue
    perTanggal.set(row.date, { ...(row.values ?? {}) })
  }
  for (const daftar of Object.values(ambilLab())) {
    for (const b of daftar ?? []) {
      if (!b?.tanggal || !tanggalKalenderSah(b.tanggal) || !(b.nilai > 0)) continue
      if (!perTanggal.has(b.tanggal)) perTanggal.set(b.tanggal, {})
    }
  }
  const keluar: BarisLabNutrisi[] = []
  for (const [date, values] of perTanggal) {
    const kanonic = nilaiNutrisiDariLabKanonic(date, { tepat: true })
    const sisa: Record<string, number> = {}
    for (const [kunci, nilai] of Object.entries(values)) {
      if (KUNCI_NUTRISI_KE_JENIS_LAB[kunci] && kanonic[kunci] != null) continue
      if (typeof nilai === 'number' && Number.isFinite(nilai)) sisa[kunci] = nilai
    }
    keluar.push({ date, values: { ...sisa, ...kanonic } })
  }
  return keluar.sort((a, b) => b.date.localeCompare(a.date))
}

/** Latest value on an exact draw date, else the newest prior value. */
export function nilaiLabPadaTanggal(jenis: string, tanggal: string): number | undefined {
  const daftar = ambilLab()[jenis] ?? []
  const exact = daftar.find((b) => b.tanggal === tanggal && b.nilai > 0)
  if (exact) return exact.nilai
  const prior = [...daftar].filter((b) => b.tanggal <= tanggal && b.nilai > 0).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0]
  return prior?.nilai
}

export function hapusLab(jenis: string, id: string): void {
  const s = ambilLab()
  s[jenis] = (s[jenis] ?? []).filter((b) => b.id !== id)
  if (!s[jenis].length) delete s[jenis]
  simpan(s)
}

/** Jenis yang sudah punya isi, terbaru dahulu. */
export function jenisTerisi(): { jenis: JenisLab; butir: ButirLab[] }[] {
  const s = ambilLab()
  return JENIS_LAB
    .filter((j) => (s[j.id] ?? []).length > 0)
    .map((j) => ({ jenis: j, butir: s[j.id] }))
}

/**
 * Berapa lama sejak pemeriksaan terakhir, dalam hari — dipakai untuk
 * mengingatkan bahwa hasil setahun lalu bukan gambaran hari ini.
 */
export function umurHari(butir: ButirLab[]): number | null {
  if (!butir.length) return null
  const t = Date.parse(butir[butir.length - 1].tanggal)
  if (Number.isNaN(t)) return null
  return Math.floor((Date.now() - t) / 864e5)
}

// ── Pemeriksaan masukan sebelum disimpan ──────────────────────────────────
// Satu angka yang salah masuk ke riwayat merusak tiga hal sekaligus: garis
// dasar pribadi, tren, dan PhenoAge — dan hasilnya tetap TAMPAK meyakinkan.
// Kesalahan paling lazim bukan salah ketik digit, melainkan salah SATUAN
// (glukosa 5,4 mmol/L diketik ke kolom mg/dL). Ambang "periksa satuan" di sini
// diturunkan dari rentang rujukan yang sudah tercatat di JENIS_LAB (di bawah
// sepersepuluh batas bawah atau di atas sepuluh kali batas atas); tidak ada
// angka klinis baru yang ditambahkan. Ini penjaga masukan, bukan penilaian.
export type HasilPeriksaLab =
  | { ok: false; alasan: string }
  | { ok: true; nilai: number; periksaSatuan: string | null }

export const FAKTOR_CURIGA_SATUAN = 10

export function periksaMasukanLab(jenis: JenisLab, teks: string, tanggal: string, hariIniISO: string): HasilPeriksaLab {
  const bersih = teks.trim().replace(',', '.')
  if (!bersih) return { ok: false, alasan: 'Enter the result value.' }
  if (!/^\d+(\.\d+)?$/.test(bersih)) return { ok: false, alasan: 'Use a plain number, e.g. 5.4 — no units or symbols.' }
  const nilai = Number(bersih)
  if (!Number.isFinite(nilai) || nilai <= 0) return { ok: false, alasan: 'The value must be greater than zero.' }
  if (!tanggalKalenderSah(tanggal)) {
    return { ok: false, alasan: 'Choose the date the blood was taken.' }
  }
  if (tanggal > hariIniISO) return { ok: false, alasan: 'The collection date cannot be in the future.' }
  if (tanggal < '1900-01-01') return { ok: false, alasan: 'Check the collection date.' }

  let periksaSatuan: string | null = null
  if (typeof jenis.bawah === 'number' && nilai < jenis.bawah / FAKTOR_CURIGA_SATUAN) {
    periksaSatuan = `${nilai} ${jenis.satuan} is far below the usual range (${jenis.bawah}–${jenis.atas ?? '…'}). Is your lab sheet in a different unit?`
  } else if (typeof jenis.atas === 'number' && nilai > jenis.atas * FAKTOR_CURIGA_SATUAN) {
    periksaSatuan = `${nilai} ${jenis.satuan} is far above the usual range (${jenis.bawah ?? '…'}–${jenis.atas}). Is your lab sheet in a different unit?`
  }
  return { ok: true, nilai, periksaSatuan }
}

/** Rentang rujukan lab (opsional) — kosong boleh; bila diisi harus angka > 0 dan bawah < atas. */
export function periksaRujukanLab(bawahTeks: string, atasTeks: string): { ok: true; bawah?: number; atas?: number } | { ok: false; alasan: string } {
  const baca = (t: string) => { const b = t.trim().replace(',', '.'); return b === '' ? undefined : /^\d+(\.\d+)?$/.test(b) ? Number(b) : NaN }
  const bawah = baca(bawahTeks), atas = baca(atasTeks)
  if (Number.isNaN(bawah) || Number.isNaN(atas)) return { ok: false, alasan: 'Reference range: use plain numbers as printed on your report.' }
  if ((bawah !== undefined && bawah < 0) || (atas !== undefined && atas <= 0)) return { ok: false, alasan: 'Reference range must be positive.' }
  if (bawah !== undefined && atas !== undefined && bawah >= atas) return { ok: false, alasan: 'Reference range: the low value must be below the high value.' }
  return { ok: true, ...(bawah !== undefined ? { bawah } : {}), ...(atas !== undefined ? { atas } : {}) }
}

/** Rentang yang berlaku untuk satu butir: dari lembar lab bila ada, selain itu rentang umum. */
export function rentangUntuk(b: ButirLab, j: JenisLab): { bawah?: number; atas?: number; dariLab: boolean } {
  if (b.rujukanBawah != null || b.rujukanAtas != null) return { bawah: b.rujukanBawah, atas: b.rujukanAtas, dariLab: true }
  return { bawah: j.bawah, atas: j.atas, dariLab: false }
}
