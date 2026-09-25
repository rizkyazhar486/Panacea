// Penulisan penyimpanan yang tidak diam-diam kehilangan data.
//
// Store saat ini menyimpan SELURUH keadaan sebagai satu berkas / satu dokumen
// MongoDB. Sampai skema basis data sungguhan ada, tiga jalur kehilangan data
// ditutup di sini:
// 1. tulis berkas atomik (tmp → rename): server mati di tengah menulis tidak
//    meninggalkan data.json terpotong;
// 2. berkas rusak dipindahkan ke samping (.corrupt-<waktu>), bukan ditimpa
//    keadaan kosong pada simpan berikutnya;
// 3. kegagalan simpan MongoDB dan ukuran dokumen yang mendekati batas 16 MB
//    dicatat dan tampak di /api/health, bukan ditelan `.catch(() => {})`.
import { renameSync, writeFileSync } from 'node:fs'

export const BATAS_DOKUMEN_MONGO = 16 * 1024 * 1024
export const AMBANG_PERINGATAN = 12 * 1024 * 1024

export interface StatusSimpan {
  terakhirBerhasil: string | null
  terakhirGagal: string | null
  galatTerakhir: string | null
  gagalBeruntun: number
  ukuranTerakhirByte: number
  mendekatiBatas: boolean
  berkasRusakDipindah: string | null
}

export const status: StatusSimpan = {
  terakhirBerhasil: null, terakhirGagal: null, galatTerakhir: null, gagalBeruntun: 0,
  ukuranTerakhirByte: 0, mendekatiBatas: false, berkasRusakDipindah: null,
}

export function tulisAtomik(jalur: string, isi: string): void {
  const tmp = `${jalur}.${process.pid}.tmp`
  writeFileSync(tmp, isi)
  renameSync(tmp, jalur)
}

/** Pindahkan berkas yang tidak dapat diurai supaya tidak tertimpa keadaan kosong. */
export function amankanBerkasRusak(jalur: string, kini = new Date()): string | null {
  const tujuan = `${jalur}.corrupt-${kini.toISOString().replace(/[:.]/g, '-')}`
  try { renameSync(jalur, tujuan); status.berkasRusakDipindah = tujuan; return tujuan } catch { return null }
}

export function catatBerhasil(ukuranByte: number, kini = new Date()): void {
  status.terakhirBerhasil = kini.toISOString(); status.gagalBeruntun = 0
  status.ukuranTerakhirByte = ukuranByte; status.mendekatiBatas = ukuranByte >= AMBANG_PERINGATAN
}

export function catatGagal(e: unknown, kini = new Date()): void {
  status.terakhirGagal = kini.toISOString(); status.gagalBeruntun++
  status.galatTerakhir = (e as Error)?.message?.slice(0, 200) ?? String(e)
}

/** Sehat bila tidak ada kegagalan beruntun dan dokumen belum mendekati batas. */
export const penyimpananSehat = () => status.gagalBeruntun === 0 && !status.mendekatiBatas
