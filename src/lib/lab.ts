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
      bersih[jenis] = daftar.filter((b) => b && typeof b.tanggal === 'string' && typeof b.nilai === 'number' && Number.isFinite(b.nilai))
    }
    return bersih
  } catch {
    return {}
  }
}

function simpan(s: Simpanan) {
  try { localStorage.setItem(KUNCI, JSON.stringify(s)) } catch { /* kuota */ }
  try { window.dispatchEvent(new Event('panacea:lab')) } catch { /* ignore */ }
}

export function tambahLab(jenis: string, tanggal: string, nilai: number): void {
  const s = ambilLab()
  const daftar = s[jenis] ?? []
  daftar.push({ id: `${jenis}-${Date.now()}`, tanggal, nilai })
  daftar.sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  // Seratus butir per jenis sudah lebih dari seumur hidup pemeriksaan tahunan.
  s[jenis] = daftar.slice(-100)
  simpan(s)
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
