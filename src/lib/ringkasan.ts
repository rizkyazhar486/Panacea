import { api, backendEnabled } from './api'
import { getVitals } from './healthVitals'
import { ambilLab } from './lab'
import { ambilSuplemen, sudahDiminum, hariSejak } from './kebiasaanHarian'

// ─────────────────────────────────────────────────────────────────────────────
// Ringkasan harian yang dititipkan ke server — SESEDIKIT MUNGKIN.
//
// MENGAPA ADA. Sebagian data hidup hanya di perangkat: catatan makan, hasil lab
// yang diketik sendiri, jam kopi terakhir, jendela puasa. Itu memang disengaja
// dan tidak diubah. Tetapi notifikasi dikirim server, sehingga aturan seperti
// "protein baru 40 g pada pukul lima sore" mustahil tanpa satu ringkasan kecil
// yang dititipkan ke sana.
//
// APA YANG TIDAK IKUT, dan ini yang menentukan bentuk berkas ini:
//   · Tidak ada nama makanan. Yang dikirim jumlah kalori dan gram protein.
//   · Tidak ada NILAI hasil lab. Yang dikirim hanya TANGGAL pemeriksaannya,
//     karena yang dibutuhkan aturan cuma umurnya.
//   · Tidak ada isi catatan harian. Yang dikirim hanya "hari ini ada catatan
//     atau tidak".
// Server juga memangkas ulang isinya (RINGKASAN_DIIZINKAN di store.ts), jadi
// batas ini tidak bergantung pada kejujuran pengirimnya saja.
//
// DIKIRIM PALING SERING SEKALI PER JAM. Aplikasi ini dibuka berkali-kali
// sehari, dan mengirim ringkasan tiap kali dibuka hanya menghabiskan kuota
// orang untuk angka yang sama.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI_JEDA = 'pmd_ringkasan_kirim_v1'
const JEDA_MS = 60 * 60_000

interface Ringkasan {
  tanggal: string
  kkal?: number
  proteinG?: number
  beratKg?: number
  puasaMulai?: number
  kopiTerakhir?: number
  labTerakhir?: Record<string, string>
  catatanHariIni?: boolean
  tenaga?: number
  airMl?: number
  cahayaHariIni?: boolean
  suplemenBelum?: number
  hariSejakPanas?: number
}

function tanggalLokal(d = new Date()): string {
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function bacaAngka(kunci: string): number | undefined {
  try {
    const v = Number(JSON.parse(localStorage.getItem(kunci) || 'null'))
    return Number.isFinite(v) && v > 0 ? v : undefined
  } catch { return undefined }
}

export function susunRingkasan(): Ringkasan {
  const hariIni = tanggalLokal()
  const r: Ringkasan = { tanggal: hariIni }

  // Gizi hari ini, dari simpanan aplikasi utama.
  try {
    const st = JSON.parse(localStorage.getItem('panaceamed.state.v3') || '{}')
    let kkal = 0
    let protein = 0
    let ada = false
    for (const f of st.foods ?? []) {
      if (f?.date !== hariIni) continue
      ada = true
      kkal += Number(f.kcal) || 0
      protein += Number(f.protein) || 0
    }
    if (ada) { r.kkal = Math.round(kkal); r.proteinG = Math.round(protein) }
    const w = st.wellness?.[hariIni]
    r.catatanHariIni = Boolean(w)
    if (typeof w?.tenaga === 'number') r.tenaga = w.tenaga
    if (typeof w?.waterMl === 'number') r.airMl = Math.round(w.waterMl)
    r.cahayaHariIni = Boolean(w?.sunDone)
  } catch { /* simpanan rusak — ringkasan tetap dikirim tanpa bagian ini */ }

  const berat = getVitals().weightKg
  if (typeof berat === 'number' && berat > 0) r.beratKg = Math.round(berat * 10) / 10

  r.puasaMulai = bacaAngka('pmd_puasa_v1')
  r.kopiTerakhir = bacaAngka('pmd_kopi_v1')

  // Hanya TANGGAL pemeriksaan terakhir tiap jenis, tanpa nilainya.
  try {
    const lab = ambilLab()
    const peta: Record<string, string> = {}
    for (const [jenis, daftar] of Object.entries(lab)) {
      const akhir = daftar[daftar.length - 1]
      if (akhir?.tanggal) peta[jenis] = akhir.tanggal
    }
    if (Object.keys(peta).length) r.labTerakhir = peta
  } catch { /* abaikan */ }

  try {
    const daftar = ambilSuplemen()
    if (daftar.length) r.suplemenBelum = daftar.length - sudahDiminum().length
    const panas = hariSejak('panas')
    if (panas != null) r.hariSejakPanas = panas
  } catch { /* abaikan */ }

  return r
}

/**
 * Kirim bila sudah lewat sejam sejak terakhir, atau bila dipaksa.
 *
 * Kegagalan diabaikan diam-diam: ringkasan ini hanya membuat notifikasi lebih
 * tepat, dan kegagalannya tidak boleh mengganggu apa pun yang sedang dilakukan
 * pemakainya.
 */
export async function kirimRingkasan(paksa = false): Promise<boolean> {
  if (!backendEnabled) return false
  try {
    const terakhir = Number(localStorage.getItem(KUNCI_JEDA) || 0)
    if (!paksa && Number.isFinite(terakhir) && Date.now() - terakhir < JEDA_MS) return false
    await api.simpanRingkasan(susunRingkasan() as unknown as Record<string, unknown>)
    localStorage.setItem(KUNCI_JEDA, String(Date.now()))
    return true
  } catch {
    return false
  }
}
