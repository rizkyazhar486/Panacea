// Buku besar studi validasi klinis di server (append-only, berantai SHA-256).
//
// Server hanya MENYIMPAN dan MENEGAKKAN batas: siapa penilai (identitas server,
// bukan payload), kredensial terverifikasi, satu penilaian per penilai per
// kasus, terikat protokol beku yang berlaku. Metrik dan laporan dihitung oleh
// kernel src/lib/validasiKlinis.ts di peramban, yang juga memeriksa ulang rantai
// ini secara independen. kanonik()/sidik() di sini HARUS identik dengan kernel;
// gerbang scripts/uji/validasi-ledger-kontrak.mts memastikannya.
import { createHash } from 'node:crypto'

export const AWAL_RANTAI = '0'.repeat(64)

export function kanonik(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(kanonik).join(',')}]`
  const o = v as Record<string, unknown>
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${kanonik(o[k])}`).join(',')}}`
}
export const sidik = (v: unknown) => createHash('sha256').update(kanonik(v)).digest('hex')

export type JenisCatatan = 'protokol' | 'kasus' | 'penilaian' | 'adjudikasi' | 'keselamatan'
export interface CatatanLedger { urutan: number; isi: { jenis: JenisCatatan; data: any }; sidikSebelum: string; sidik: string }

export function sambung(buku: readonly CatatanLedger[], isi: CatatanLedger['isi']): CatatanLedger {
  const sidikSebelum = buku.length ? buku[buku.length - 1].sidik : AWAL_RANTAI
  const urutan = buku.length
  return { urutan, isi, sidikSebelum, sidik: sidik({ urutan, isi, sidikSebelum }) }
}

export const protokolKini = (buku: readonly CatatanLedger[], id: string) => {
  const v = buku.filter((c) => c.isi.jenis === 'protokol' && c.isi.data.id === id).map((c) => c.isi.data)
  return v.length ? v.reduce((a, b) => (b.versi > a.versi ? b : a)) : undefined
}

const BAHAYA = ['none', 'minor', 'moderate', 'severe'] as const
const teks = (v: unknown, maks: number) => (typeof v === 'string' ? v.trim().slice(0, maks) : '')

export interface IdentitasPenilai { id: string; peran: 'physician'; kredensialRef: string; kredensialTerverifikasi: boolean; cakupan: string; konflikKepentingan: string }

/** Susun penilaian dari masukan klinisi; identitas & protokol dari server. */
export function susunPenilaian(buku: readonly CatatanLedger[], protokolId: string, masukan: any, penilai: IdentitasPenilai, kini: Date) {
  const p = protokolKini(buku, protokolId)
  if (!p) throw new Error('unknown study')
  const m = masukan ?? {}
  const kasusId = String(m.kasusId ?? '')
  if (!buku.some((c) => c.isi.jenis === 'kasus' && c.isi.data.id === kasusId && c.isi.data.protokolId === protokolId)) throw new Error('unknown case')
  if (!penilai.kredensialTerverifikasi) throw new Error('verified clinician credentials required')
  if (buku.some((c) => c.isi.jenis === 'penilaian' && c.isi.data.kasusId === kasusId && c.isi.data.penilai.id === penilai.id)) throw new Error('you already assessed this case; disagreements go to adjudication')
  if (typeof m.benar !== 'boolean') throw new Error('state whether the output is correct')
  const klaim = Number(m.klaimTakDidukung ?? 0)
  if (!Number.isInteger(klaim) || klaim < 0 || klaim > 100) throw new Error('unsupported-claim count must be a whole number 0-100')
  const bahaya = BAHAYA.includes(m.bahaya) ? m.bahaya : null
  if (!bahaya) throw new Error('choose a harm level')
  const waktuTinjauMs = Number(m.waktuTinjauMs)
  if (!Number.isFinite(waktuTinjauMs) || waktuTinjauMs < 0 || waktuTinjauMs > 6 * 3600e3) throw new Error('invalid review time')
  const override = m.override?.dilakukan === true ? { dilakukan: true, alasan: teks(m.override.alasan, 500) } : { dilakukan: false }
  if (override.dilakukan && !override.alasan) throw new Error('an override needs a reason')
  const omisi = (Array.isArray(m.omisi) ? m.omisi : []).slice(0, 20).map((o: unknown) => teks(o, 200)).filter(Boolean)
  return {
    kasusId, protokolSidik: sidik(p), penilai, waktu: kini.toISOString(), benar: m.benar, klaimTakDidukung: klaim,
    omisi, bahaya, override, waktuTinjauMs: Math.round(waktuTinjauMs), buta: true, ...(teks(m.catatan, 1000) ? { catatan: teks(m.catatan, 1000) } : {}),
  }
}

export function susunKeselamatan(masukan: any, pelapor: string, kini: Date, id: string) {
  const m = masukan ?? {}
  const deskripsi = teks(m.deskripsi, 2000)
  if (!deskripsi) throw new Error('describe the safety event')
  const jenis = m.jenis === 'harm' ? 'harm' : 'near-miss'
  const tingkat = BAHAYA.includes(m.tingkat) ? m.tingkat : 'minor'
  return { id, waktu: kini.toISOString(), jenis, tingkat, ...(m.kasusId ? { kasusId: String(m.kasusId).slice(0, 80) } : {}), deskripsi, pelapor }
}
