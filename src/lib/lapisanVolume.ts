// Lapisan permukaan untuk volume DICOM: beberapa jaringan sekaligus, masing-
// masing dengan rentang, warna dan opasitasnya sendiri (kulit tembus pandang di
// atas tulang). Rujukan antarmukanya: KaloLumen (lihat rujukanKaloLumen.ts) —
// tidak ada kode, aset atau angka yang diambil dari sana.
//
// Rentang awal DITURUNKAN dari KELAS_JARINGAN (rentang HU khas fisika CT), bukan
// diketik ulang, dan hanya sah untuk CT. Untuk MRI (nilai relatif) tidak ada
// skala mutlak, jadi rentang awalnya berupa pecahan jendela yang harus disetel
// pemakai — tidak diberi nama jaringan yang tidak bisa dijamin.
import { KELAS_JARINGAN } from './pencitraanVolumetrik'
import { ambangKeTekstur, type JendelaVolume } from './volumeTekstur'

export const MAKS_LAPISAN = 3

export interface LapisanVolume {
  nama: string
  /** Dalam satuan volume: HU untuk CT, nilai relatif untuk MRI. */
  bawah: number
  atas: number
  /** Warna #rrggbb. */
  warna: string
  /** 0..1 — opasitas permukaan lapisan ini. */
  opasitas: number
  aktif: boolean
}

const kelas = (awal: string) => {
  const k = KELAS_JARINGAN.find((x) => x.nama.startsWith(awal))
  if (!k) throw new Error(`tissue class ${awal} missing from KELAS_JARINGAN`)
  return k
}

/** Lapisan awal untuk CT, dari kelas HU yang bersumber. Titik awal, bukan segmentasi. */
export function lapisanAwalCt(): LapisanVolume[] {
  const lemak = kelas('Fat'), hati = kelas('Liver'), spons = kelas('Cancellous'), korteks = kelas('Cortical'), kontras = kelas('Contrast')
  return [
    { nama: 'Soft tissue & skin', bawah: lemak.min, atas: hati.maks, warna: '#e8b8a0', opasitas: 0.25, aktif: true },
    { nama: 'Bone', bawah: spons.min, atas: korteks.maks, warna: '#f2ecd8', opasitas: 1, aktif: true },
    { nama: 'Contrast vessels (only if contrast was given)', bawah: kontras.min, atas: kontras.maks, warna: '#d0463c', opasitas: 0.9, aktif: false },
  ]
}

/** MRI: tanpa skala mutlak — pecahan jendela, tanpa nama jaringan. */
export function lapisanAwalRelatif(j: JendelaVolume): LapisanVolume[] {
  const r = j.atas - j.bawah
  return [
    { nama: 'Layer 1', bawah: j.bawah + 0.15 * r, atas: j.bawah + 0.45 * r, warna: '#e8b8a0', opasitas: 0.3, aktif: true },
    { nama: 'Layer 2', bawah: j.bawah + 0.45 * r, atas: j.atas, warna: '#f2ecd8', opasitas: 1, aktif: true },
    { nama: 'Layer 3', bawah: j.bawah + 0.3 * r, atas: j.bawah + 0.6 * r, warna: '#6aa7d8', opasitas: 0.8, aktif: false },
  ]
}

export interface UniformLapisan {
  jumlah: number
  /** Per lapisan [bawah, atas] dalam ruang tekstur 0..1. */
  rentang: [number, number][]
  warna: [number, number, number][]
  opasitas: number[]
}

const hexKeRgb = (h: string): [number, number, number] => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h)
  if (!m) return [1, 1, 1]
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
}

/**
 * Lapisan aktif → uniform shader. Lapisan dengan rentang terbalik/kosong atau di
 * luar jendela tekstur seluruhnya dibuang (tidak digambar), bukan dipaksa masuk.
 */
export function lapisanKeUniform(lapisan: readonly LapisanVolume[], jendela: JendelaVolume): UniformLapisan {
  const pakai = lapisan.filter((l) => l.aktif && Number.isFinite(l.bawah) && Number.isFinite(l.atas) && l.bawah < l.atas)
    .map((l) => ({ l, r: [ambangKeTekstur(l.bawah, jendela), ambangKeTekstur(l.atas, jendela)] as [number, number] }))
    .filter(({ r }) => r[1] > r[0])
    .slice(0, MAKS_LAPISAN)
  const isi = <T,>(xs: T[], kosong: T) => [...xs, ...Array(MAKS_LAPISAN - xs.length).fill(kosong)]
  return {
    jumlah: pakai.length,
    rentang: isi(pakai.map((p) => p.r), [2, 2] as [number, number]),
    warna: isi(pakai.map((p) => hexKeRgb(p.l.warna)), [0, 0, 0] as [number, number, number]),
    opasitas: isi(pakai.map((p) => Math.min(1, Math.max(0, p.l.opasitas))), 0),
  }
}
