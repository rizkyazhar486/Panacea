import { CARDIO_CONDITIONS, type CardioCondition } from './cardioPathology'
import { SYSTEM_CONDITIONS, type SystemCondition } from './specialtyPathology'
import { ATLAS_PARTS, ATLAS_MODULE_INFO } from './systemAtlas.gen'
import { CARDIO_PARTS } from './cardioAtlas.gen'
import { DRUG_TARGETS } from './drugTargets'
import { MOLECULE_BY_ID } from './molecules.gen'

// ─────────────────────────────────────────────────────────────────────────────
// PENCARIAN SATU KOTAK untuk seluruh atlas.
//
// Atlas ini sudah memuat 23 modul, 827 struktur bernama, 155 keadaan klinis dan
// 34 obat. Pada ukuran itu, isinya ada tapi TIDAK BISA DITEMUKAN: orang harus
// sudah tahu penyakitnya ada di modul mana sebelum bisa membukanya — persis
// masalah yang sama dengan kotak pencarian yang dulu dihindari pada figur 3D.
//
// Yang dicari bukan hanya judul. Seseorang mengetik "chest pain", "batu",
// "zona transisi", atau "LAD"; ketiganya harus menemukan sesuatu, jadi ringkasan,
// mekanisme, temuan, dan nama struktur ikut diindeks. Yang TIDAK dilakukan:
// mengarang kecocokan. Kalau tidak ada yang cocok, hasilnya kosong dan layar
// mengatakannya.
// ─────────────────────────────────────────────────────────────────────────────

export type JenisHasil = 'kondisi' | 'struktur' | 'obat'

export interface HasilCari {
  jenis: JenisHasil
  /** id keadaan, nama struktur, atau id obat. */
  id: string
  label: string
  /** Baris kedua: modul, jenis jaringan, atau target molekul. */
  sub: string
  /** Modul tempatnya berada; 'cardio' untuk ruang kardiovaskular. */
  module: string
  skor: number
}

const NAMA_MODUL: Record<string, string> = {
  ...Object.fromEntries(Object.entries(ATLAS_MODULE_INFO).map(([k, v]) => [k, v.label])),
  cardio: 'Cardio lab',
}

/**
 * Skor kecocokan satu bidang. Kecocokan di AWAL judul bernilai jauh lebih
 * tinggi daripada kecocokan di tengah paragraf mekanisme — kalau tidak,
 * mengetik "asma" akan memunculkan sepuluh penyakit yang kebetulan menyebut
 * asma di dalam pembahasannya sebelum asma itu sendiri.
 */
function skorTeks(teks: string | undefined, q: string, bobot: number): number {
  if (!teks) return 0
  const t = teks.toLowerCase()
  const i = t.indexOf(q)
  if (i < 0) return 0
  if (i === 0) return bobot * 3
  // Awal kata bernilai lebih tinggi daripada tengah kata: "kolik" cocok pada
  // "kolik renal", bukan pada "melankolik".
  return /\s|[-(/]/.test(t[i - 1]) ? bobot * 2 : bobot
}

function skorKondisi(k: CardioCondition | SystemCondition, q: string): number {
  return (
    skorTeks(k.label, q, 100) +
    skorTeks(k.ringkas, q, 25) +
    skorTeks(k.lesi.map((l) => l.struktur).join(' '), q, 20) +
    skorTeks(k.hilir.join(' '), q, 10) +
    skorTeks(k.temuan.join(' '), q, 8) +
    skorTeks(k.mekanisme, q, 5) +
    skorTeks(k.skdi.join(' '), q, 40)
  )
}

export function cariAtlas(kueri: string, maks = 24): HasilCari[] {
  const q = kueri.trim().toLowerCase()
  if (q.length < 2) return []
  const out: HasilCari[] = []

  for (const k of SYSTEM_CONDITIONS) {
    const skor = skorKondisi(k, q)
    if (skor > 0) out.push({ jenis: 'kondisi', id: k.id, label: k.label, sub: NAMA_MODUL[k.module] ?? k.module, module: k.module, skor })
  }
  for (const k of CARDIO_CONDITIONS) {
    const skor = skorKondisi(k, q)
    if (skor > 0) out.push({ jenis: 'kondisi', id: k.id, label: k.label, sub: 'Cardio lab', module: 'cardio', skor })
  }
  for (const p of ATLAS_PARTS) {
    const skor = skorTeks(p.name, q, 60)
    if (skor > 0) out.push({ jenis: 'struktur', id: p.name, label: p.name, sub: `${NAMA_MODUL[p.module] ?? p.module} · ${p.kind}`, module: p.module, skor })
  }
  for (const p of CARDIO_PARTS) {
    const skor = skorTeks(p.name, q, 60)
    if (skor > 0) out.push({ jenis: 'struktur', id: p.name, label: p.name, sub: `Cardio lab · ${p.kind}`, module: 'cardio', skor })
  }
  for (const d of DRUG_TARGETS) {
    const nama = MOLECULE_BY_ID[d.id]?.name ?? d.id
    const skor = skorTeks(nama, q, 80) + skorTeks(d.katalog, q, 60) + skorTeks(d.target, q, 50) + skorTeks(d.aksi, q, 5)
    if (skor > 0) out.push({ jenis: 'obat', id: d.id, label: nama, sub: d.target, module: 'molekul', skor })
  }

  // Struktur yang sama muncul di beberapa modul (ginjal ada di nefrologi dan
  // urogenital). Yang ditampilkan cukup satu — yang skornya tertinggi.
  const terbaik = new Map<string, HasilCari>()
  for (const h of out) {
    const kunci = `${h.jenis}:${h.id.toLowerCase()}`
    const ada = terbaik.get(kunci)
    if (!ada || h.skor > ada.skor) terbaik.set(kunci, h)
  }

  return [...terbaik.values()]
    .sort((a, b) => (b.skor - a.skor) || a.label.localeCompare(b.label))
    .slice(0, maks)
}

/** Berapa banyak yang bisa dicari — dipakai untuk menerangkan cakupannya. */
export function cakupanAtlas(): { kondisi: number; struktur: number; obat: number; modul: number } {
  return {
    kondisi: SYSTEM_CONDITIONS.length + CARDIO_CONDITIONS.length,
    struktur: ATLAS_PARTS.length + CARDIO_PARTS.length,
    obat: DRUG_TARGETS.length,
    modul: Object.keys(ATLAS_MODULE_INFO).length + 1,
  }
}
