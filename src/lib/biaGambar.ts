import type { ImportResult } from './healthImport'

// ─────────────────────────────────────────────────────────────────────────────
// Membaca tangkapan layar laporan timbangan BIA (Moving Life, Xiaomi, dan yang
// sekelas) menjadi angka.
//
// Kenapa ini ada: aplikasi timbangan semacam itu sering TIDAK punya tombol
// ekspor sama sekali. Yang bisa dibawa keluar pengguna hanyalah tangkapan
// layar. Menolak gambar berarti menolak satu-satunya bentuk data yang mereka
// punya, lalu menyuruh mereka mengetik ulang delapan belas angka.
//
// Pembacaan hurufnya dikerjakan model penglihatan di server; berkas ini hanya
// mengubah teks hasil bacaan menjadi angka. Pemisahan itu disengaja: bagian
// yang paling mudah salah adalah pencocokan label, dan bagian itulah yang di
// sini bisa diuji tanpa jaringan, tanpa kunci AI, dan tanpa gambar.
//
// Dua hal yang dijaga:
//
//   1. SATUAN DIPERIKSA, BUKAN DIASUMSIKAN. "20.0%" dan "20.0kg" adalah dua
//      hal yang sangat berbeda pada laporan yang sama, dan salah satunya akan
//      menghasilkan berat badan 20 kg bila dibaca asal.
//   2. ANGKA DI LUAR NALAR DIBUANG. Model penglihatan sesekali salah membaca
//      satu digit; berat 571,5 kg lebih baik hilang daripada tersimpan.
// ─────────────────────────────────────────────────────────────────────────────

/** Batas masuk akal per field. Di luar ini, angkanya dianggap salah baca. */
const WAJAR: Record<string, [number, number]> = {
  weightKg: [20, 300],
  bmi: [8, 80],
  bodyFatPct: [2, 70],
  bodyWaterPct: [20, 80],
  skeletalMusclePct: [10, 80],
  bonePct: [1, 15],
  inorganicSaltKg: [0.5, 8],
  proteinPct: [5, 40],
  musclePct: [20, 95],
  muscleReserveCapacity: [0, 20],
  visceralFatIndex: [1, 60],
  subcutaneousFatKg: [1, 100],
  leanMassKg: [15, 200],
  bodyAge: [5, 120],
  bmrKcal: [600, 4000],
  amrKcal: [800, 8000],
  bodyScore: [0, 100],
}

type Satuan = 'kg' | '%' | 'kcal' | 'angka'

interface Aturan {
  kunci: keyof ImportResult
  /** Label seperti tertulis di laporan; dicocokkan tanpa peduli huruf/spasi. */
  label: RegExp
  satuan: Satuan
}

const ATURAN: Aturan[] = [
  { kunci: 'weightKg', label: /^weight$|^berat$/, satuan: 'kg' },
  { kunci: 'bmi', label: /^bmi$/, satuan: 'angka' },
  { kunci: 'bodyFatPct', label: /body\s*fat/, satuan: '%' },
  { kunci: 'bodyWaterPct', label: /body\s*water/, satuan: '%' },
  { kunci: 'bonePct', label: /^bone/, satuan: '%' },
  { kunci: 'inorganicSaltKg', label: /inorganic\s*salt|garam\s*anorganik/, satuan: 'kg' },
  { kunci: 'proteinPct', label: /^protein/, satuan: '%' },
  { kunci: 'skeletalMusclePct', label: /skeletal\s*muscle/, satuan: '%' },
  { kunci: 'musclePct', label: /^muscle\s*\(|^muscle$|^otot$/, satuan: '%' },
  { kunci: 'muscleReserveCapacity', label: /muscle\s*reserve/, satuan: 'angka' },
  { kunci: 'visceralFatIndex', label: /visceral\s*fat/, satuan: 'angka' },
  { kunci: 'subcutaneousFatKg', label: /subcutaneous\s*fat/, satuan: 'kg' },
  { kunci: 'leanMassKg', label: /lean\s*body\s*mass|lean\s*mass/, satuan: 'kg' },
  { kunci: 'bodyAge', label: /body\s*age|usia\s*tubuh/, satuan: 'angka' },
  { kunci: 'bmrKcal', label: /^bmr$|basal\s*metabolic/, satuan: 'kcal' },
  { kunci: 'amrKcal', label: /^amr$|activ\w*\s*metabolic/, satuan: 'kcal' },
  { kunci: 'bodyScore', label: /body\s*score/, satuan: 'angka' },
]

/** Satuan yang tertulis di sebelah angka, kalau ada. */
function satuanDari(sisa: string): Satuan | null {
  if (/^\s*%/.test(sisa)) return '%'
  if (/^\s*kg/i.test(sisa)) return 'kg'
  if (/^\s*kcal|^\s*kkal/i.test(sisa)) return 'kcal'
  return null
}

function masukAkal(kunci: string, n: number): boolean {
  const r = WAJAR[kunci]
  if (!r) return Number.isFinite(n)
  return Number.isFinite(n) && n >= r[0] && n <= r[1]
}

/**
 * Ubah teks hasil pembacaan tangkapan layar menjadi angka.
 *
 * Diberi teks bebas (tiap metrik biasanya satu baris: label, angka, satuan,
 * lalu label status seperti "Normal"/"Standard" yang diabaikan).
 */
export function bacaTeksBia(teks: string): ImportResult {
  const out: ImportResult = {}
  if (!teks) return out

  for (const baris of teks.split(/\r?\n/)) {
    const b = baris.trim()
    if (!b) continue
    for (const a of ATURAN) {
      if (out[a.kunci] !== undefined) continue
      // Label harus muncul di AWAL baris. Tanpa jangkar ini, "Fat control -4.0kg"
      // pada bagian Weight management ikut tertangkap sebagai lemak tubuh.
      const label = b.match(/^[^0-9]{2,40}?(?=[\s:]*[-+]?\d)/)
      if (!label) continue
      const bersih = label[0].replace(/[^a-z%() ]/gi, '').trim().toLowerCase()
      if (!a.label.test(bersih)) continue

      const angka = b.slice(label[0].length).match(/^[\s:]*([-+]?\d+(?:[.,]\d+)?)(.*)$/)
      if (!angka) continue
      const n = Number(angka[1].replace(',', '.'))
      const sat = satuanDari(angka[2])

      // Satuan yang tertulis dan bertentangan dengan yang diharapkan berarti
      // barisnya bukan yang kita cari — bukan alasan untuk menyimpan apa pun.
      if (sat && a.satuan !== 'angka' && sat !== a.satuan) continue
      if (sat && a.satuan === 'angka' && sat !== null && sat === '%') continue
      if (!masukAkal(a.kunci as string, n)) continue

      ;(out as Record<string, unknown>)[a.kunci] = n
      break
    }

    // Somatotipe adalah label, bukan angka.
    if (out.somatotype === undefined) {
      const m = b.match(/^\s*somatot[iy]pe?[\s:]*([A-Za-z][A-Za-z \-]{2,30})$/i)
      if (m) out.somatotype = m[1].trim()
    }
  }

  if (Object.keys(out).length) out.source = 'Smart scale'
  return out
}

/** Perintah untuk model penglihatan. Sengaja meminta teks apa adanya. */
export const PERINTAH_BACA =
  'Baca laporan komposisi tubuh pada gambar ini. Tuliskan ULANG setiap baris ' +
  'apa adanya dalam bentuk "Label: angka satuan", satu per baris, memakai ' +
  'label bahasa Inggris persis seperti yang tertulis di gambar (misalnya ' +
  '"Body Fat(%): 20.0%", "BMR: 1500kcal", "Somatotype: Standard"). Jangan ' +
  'menambahkan tafsiran, saran, satuan yang tidak tertulis, atau angka yang ' +
  'tidak terbaca. Kalau suatu baris tidak terbaca jelas, lewati saja.'
