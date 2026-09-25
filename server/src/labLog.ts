// Riwayat lab pribadi di server — agar hasil lab tidak hilang saat pengguna
// ganti telepon atau membersihkan peramban.
//
// Batas yang dijaga:
// - Kepemilikan: log disimpan per email pengguna yang TERAUTENTIKASI; tidak ada
//   id pengguna di jalur/payload, jadi tidak ada jalan membaca log orang lain.
// - Validasi di batas kepercayaan: klien tidak dipercaya. Setiap butir harus
//   bertanggal ambil darah yang sah (bukan masa depan), bernilai hingga > 0.
// - Sinkronisasi "yang terakhir menang" per log utuh dengan cap waktu klien.
//   Menggabung per butir akan menghidupkan kembali hasil yang sudah dihapus
//   di perangkat lain — lebih buruk daripada kehilangan suntingan serentak.
// Server tidak menafsirkan angka lab; ia hanya menyimpan apa yang dicatat.

export interface ButirLabServer { id: string; tanggal: string; nilai: number }
export type LogLab = Record<string, ButirLabServer[]>
export interface LogLabTersimpan { log: LogLab; diperbaruiPada: string }

export const MAKS_JENIS = 80
export const MAKS_BUTIR_PER_JENIS = 100
const ID_JENIS = /^[a-z0-9_-]{1,32}$/
const ID_BUTIR = /^[A-Za-z0-9_-]{1,64}$/
const TANGGAL = /^\d{4}-\d{2}-\d{2}$/

export function validasiLogLab(masukan: unknown, sekarang: Date): LogLab {
  if (!masukan || typeof masukan !== 'object' || Array.isArray(masukan)) throw new Error('lab log must be an object')
  const entri = Object.entries(masukan as Record<string, unknown>)
  if (entri.length > MAKS_JENIS) throw new Error('too many lab types')
  // Satu hari toleransi untuk zona waktu: "hari ini" di Jakarta bisa masih kemarin di UTC.
  const batas = new Date(sekarang.getTime() + 864e5).toISOString().slice(0, 10)
  const keluar: LogLab = {}
  for (const [jenis, daftar] of entri) {
    if (!ID_JENIS.test(jenis) || jenis === '__proto__' || jenis === 'constructor' || jenis === 'prototype') throw new Error(`invalid lab type id`)
    if (!Array.isArray(daftar)) throw new Error(`lab type ${jenis} must be a list`)
    if (daftar.length > MAKS_BUTIR_PER_JENIS) throw new Error(`too many results for ${jenis}`)
    const bersih: ButirLabServer[] = []
    for (const b of daftar) {
      const x = b as Partial<ButirLabServer>
      if (!x || typeof x.id !== 'string' || !ID_BUTIR.test(x.id)) throw new Error(`invalid result id in ${jenis}`)
      if (typeof x.tanggal !== 'string' || !TANGGAL.test(x.tanggal) || Number.isNaN(Date.parse(`${x.tanggal}T00:00:00Z`))) throw new Error(`invalid date in ${jenis}`)
      if (x.tanggal > batas || x.tanggal < '1900-01-01') throw new Error(`date out of range in ${jenis}`)
      if (typeof x.nilai !== 'number' || !Number.isFinite(x.nilai) || x.nilai <= 0) throw new Error(`invalid value in ${jenis}`)
      bersih.push({ id: x.id, tanggal: x.tanggal, nilai: x.nilai })
    }
    if (bersih.length) keluar[jenis] = bersih.sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  }
  return keluar
}

/** Cap waktu klien harus sah dan tidak di masa depan melebihi 5 menit. */
export function validasiCapWaktu(t: unknown, sekarang: Date): string {
  if (typeof t !== 'string' || Number.isNaN(Date.parse(t))) throw new Error('invalid updatedAt')
  if (Date.parse(t) > sekarang.getTime() + 5 * 60e3) throw new Error('updatedAt is in the future')
  return new Date(Date.parse(t)).toISOString()
}

/** Terima tulisan klien hanya bila lebih baru dari yang tersimpan. */
export function terimaTulisan(tersimpan: LogLabTersimpan | undefined, baru: LogLabTersimpan): { diterima: boolean; hasil: LogLabTersimpan } {
  if (tersimpan && Date.parse(tersimpan.diperbaruiPada) > Date.parse(baru.diperbaruiPada)) return { diterima: false, hasil: tersimpan }
  return { diterima: true, hasil: baru }
}
