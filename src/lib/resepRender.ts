// Resep render volume yang dapat direproduksi.
//
// Riset yang dapat diulang butuh tiga hal: DATA yang sama, PARAMETER yang sama,
// dan PERANGKAT LUNAK yang sama. Resep ini mencatat ketiganya:
// - data: SHA-256 setiap berkas masukan (terurut), UID seri, dimensi volume;
// - parameter: mode, ambang, lapisan, potongan, penghalusan, pajanan;
// - perangkat lunak: VERSI_RENDERER — dinaikkan setiap kali arti shader berubah,
//   sehingga resep tidak pernah mengaku identik piksel lintas matematika render.
// Resep TIDAK memuat piksel, nama pasien, atau tag identitas apa pun; hanya sidik.
// UID seri juga TIDAK ditulis panel: di PACS rumah sakit UID dapat ditelusuri ke
// pasien, sedangkan resep dimaksudkan untuk dibagikan. Sidik berkas sudah cukup.
import type { LapisanVolume } from './lapisanVolume'

export const FORMAT_RESEP = 'panacea-volume-recipe'
export const VERSI_RESEP = 1
/** Naikkan bila shader/komposit/konversi ambang berubah artinya. */
export const VERSI_RENDERER = 'volume-layers-1'

export type ModeResep = 'volume' | 'permukaan' | 'keduanya' | 'radiograf' | 'lapisan'
const MODE: readonly ModeResep[] = ['volume', 'permukaan', 'keduanya', 'radiograf', 'lapisan']

export interface DataResep {
  jumlahBerkas: number
  /** SHA-256 heksadesimal tiap berkas, TERURUT supaya urutan pemilihan tidak berpengaruh. */
  sha256: string[]
  seriesUid?: string
  modalitas: string
  voxel: [number, number, number]
  fisikMm: [number, number, number]
}
export interface ParameterResep {
  mode: ModeResep
  ambangBawah: number
  ambangAtas: number
  kepekatan: number
  pajanan: number
  potong: [number, number, number]
  halus: number
  lapisan: LapisanVolume[]
}
export interface ResepRender {
  format: typeof FORMAT_RESEP
  versi: typeof VERSI_RESEP
  renderer: string
  dibuat: string
  data: DataResep
  parameter: ParameterResep
  batas: string
}

export const BATAS_RESEP = 'Research/education recipe. Reproduces a rendering of the same files with the same renderer version; it is not a clinical measurement or finding.'

export async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function buatResep(data: DataResep, parameter: ParameterResep, kini: Date): ResepRender {
  return {
    format: FORMAT_RESEP, versi: VERSI_RESEP, renderer: VERSI_RENDERER, dibuat: kini.toISOString(),
    data: { ...data, sha256: [...data.sha256].sort() }, parameter, batas: BATAS_RESEP,
  }
}

const angka = (v: unknown, min: number, maks: number): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > maks) throw new Error('recipe has an out-of-range number')
  return v
}
const tiga = (v: unknown, min: number, maks: number): [number, number, number] => {
  if (!Array.isArray(v) || v.length !== 3) throw new Error('recipe triple is malformed')
  return [angka(v[0], min, maks), angka(v[1], min, maks), angka(v[2], min, maks)]
}

/** Validasi berkas resep dari luar. Menolak, tidak menebak. */
export function bacaResep(json: unknown): ResepRender {
  const r = (json ?? {}) as Record<string, any>
  if (r.format !== FORMAT_RESEP) throw new Error('not a Panacea volume recipe')
  if (r.versi !== VERSI_RESEP) throw new Error(`unsupported recipe version ${String(r.versi)}`)
  const d = r.data ?? {}, p = r.parameter ?? {}
  if (!Array.isArray(d.sha256) || d.sha256.length > 5000 || !d.sha256.every((h: unknown) => typeof h === 'string' && /^[0-9a-f]{64}$/.test(h))) throw new Error('recipe file fingerprints are malformed')
  if (!MODE.includes(p.mode)) throw new Error('recipe render mode is unknown')
  const lapisan = Array.isArray(p.lapisan) ? p.lapisan.slice(0, 3).map((l: any) => ({
    nama: String(l?.nama ?? '').slice(0, 60), bawah: angka(l?.bawah, -1e6, 1e6), atas: angka(l?.atas, -1e6, 1e6),
    warna: /^#[0-9a-f]{6}$/i.test(l?.warna) ? l.warna : '#ffffff', opasitas: angka(l?.opasitas, 0, 1), aktif: l?.aktif === true,
  })) : []
  return {
    format: FORMAT_RESEP, versi: VERSI_RESEP, renderer: String(r.renderer ?? ''), dibuat: String(r.dibuat ?? ''),
    data: {
      jumlahBerkas: angka(d.jumlahBerkas, 1, 5000), sha256: [...d.sha256].sort(),
      seriesUid: typeof d.seriesUid === 'string' ? d.seriesUid.slice(0, 64) : undefined,
      modalitas: String(d.modalitas ?? '').slice(0, 8), voxel: tiga(d.voxel, 1, 4096), fisikMm: tiga(d.fisikMm, 0, 1e5),
    },
    parameter: {
      mode: p.mode, ambangBawah: angka(p.ambangBawah, -1e6, 1e6), ambangAtas: angka(p.ambangAtas, -1e6, 1e6),
      kepekatan: angka(p.kepekatan, 0, 1), pajanan: angka(p.pajanan, 0, 10), potong: tiga(p.potong, 0, 1),
      halus: angka(p.halus, 1, 4), lapisan,
    },
    batas: BATAS_RESEP,
  }
}

export type Kecocokan =
  | { status: 'identik' }
  | { status: 'data-berbeda'; alasan: string[] }
  | { status: 'renderer-berbeda'; alasan: string[] }

/** Apakah data yang sedang dimuat sama persis dengan data resep, dan renderernya sama? */
export function cocokkanResep(resep: ResepRender, sekarang: Pick<DataResep, 'sha256' | 'seriesUid'>): Kecocokan {
  const a = [...resep.data.sha256].sort(), b = [...sekarang.sha256].sort()
  const alasan: string[] = []
  if (a.length !== b.length) alasan.push(`recipe used ${a.length} files, ${b.length} are loaded`)
  const hilang = a.filter((h) => !b.includes(h)).length
  const tambahan = b.filter((h) => !a.includes(h)).length
  if (hilang) alasan.push(`${hilang} recipe file${hilang > 1 ? 's are' : ' is'} not among the loaded files`)
  if (tambahan) alasan.push(`${tambahan} loaded file${tambahan > 1 ? 's are' : ' is'} not in the recipe`)
  if (resep.data.seriesUid && sekarang.seriesUid && resep.data.seriesUid !== sekarang.seriesUid) alasan.push('series UID differs')
  if (alasan.length) return { status: 'data-berbeda', alasan }
  if (resep.renderer !== VERSI_RENDERER) return { status: 'renderer-berbeda', alasan: [`recipe renderer ${resep.renderer || 'unknown'}, this app ${VERSI_RENDERER}`] }
  return { status: 'identik' }
}
