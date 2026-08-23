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
    sumber: 'ADA: <5,7% normal; 5,7–6,4% prediabetes; ≥6,5% diabetes',
    catatan: 'Meleset pada anemia, hemoglobinopati, dan kehamilan.',
  },
  {
    id: 'gdp', nama: 'Glukosa puasa', satuan: 'mg/dL', bawah: 70, atas: 100,
    sumber: 'ADA: 100–125 mg/dL prediabetes; ≥126 mg/dL diabetes (dua kali pemeriksaan)',
  },
  {
    id: 'apob', nama: 'ApoB', satuan: 'mg/dL', atas: 90,
    sumber: 'Konsensus EAS: ApoB menghitung jumlah partikel aterogenik; sasaran bergantung risiko masing-masing orang',
    catatan: 'Sasaran pada risiko tinggi jauh lebih rendah — ditentukan dokter.',
  },
  {
    id: 'ldl', nama: 'LDL', satuan: 'mg/dL', atas: 100,
    sumber: 'Sasaran bergantung risiko kardiovaskular masing-masing orang',
  },
  {
    id: 'hdl', nama: 'HDL', satuan: 'mg/dL', bawah: 40,
    sumber: 'Rendah bila <40 mg/dL (pria) atau <50 mg/dL (wanita)',
  },
  {
    id: 'tg', nama: 'Trigliserida', satuan: 'mg/dL', atas: 150,
    sumber: 'Puasa 9–12 jam; ≥150 mg/dL dianggap tinggi',
  },
  {
    id: 'egfr', nama: 'eGFR', satuan: 'mL/mnt/1,73m²', bawah: 90,
    sumber: 'KDIGO: <60 selama ≥3 bulan menandai penyakit ginjal kronik',
  },
  {
    id: 'kreatinin', nama: 'Kreatinin', satuan: 'mg/dL', bawah: 0.6, atas: 1.3,
    sumber: 'Rentang lazim dewasa; bergantung massa otot',
  },
  { id: 'sgot', nama: 'SGOT (AST)', satuan: 'U/L', atas: 40, sumber: 'Rentang lazim dewasa' },
  { id: 'sgpt', nama: 'SGPT (ALT)', satuan: 'U/L', atas: 41, sumber: 'Rentang lazim dewasa' },
  { id: 'tsh', nama: 'TSH', satuan: 'mIU/L', bawah: 0.4, atas: 4.0, sumber: 'Rentang lazim dewasa tidak hamil' },
  { id: 'vitd', nama: 'Vitamin D (25-OH)', satuan: 'ng/mL', bawah: 20, atas: 50, sumber: 'IOM: <20 ng/mL defisiensi' },
  { id: 'b12', nama: 'Vitamin B12', satuan: 'pg/mL', bawah: 200, atas: 900, sumber: 'Rentang lazim; metformin jangka panjang menurunkannya' },
  { id: 'ferritin', nama: 'Feritin', satuan: 'ng/mL', bawah: 30, atas: 300, sumber: 'Rendah menandakan cadangan besi habis; tinggi dapat berarti radang' },
  { id: 'hb', nama: 'Hemoglobin', satuan: 'g/dL', bawah: 12, atas: 17, sumber: 'WHO: anemia bila <13 (pria) atau <12 g/dL (wanita)' },
  { id: 'crp', nama: 'hs-CRP', satuan: 'mg/L', atas: 3, sumber: 'AHA/CDC: <1 risiko rendah, 1–3 sedang, >3 tinggi (bukan saat infeksi akut)' },
  { id: 'asamUrat', nama: 'Asam urat', satuan: 'mg/dL', atas: 7, sumber: 'Rentang lazim; gout dapat terjadi pada kadar normal' },
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
