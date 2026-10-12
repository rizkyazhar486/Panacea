// Validasi pengingat obat. Penjadwal hanya menembakkan pengingat yang nextFireAt-nya tanggal sah; nilai tak sah dulu
// diterima 200 lalu dilewati diam-diam, sehingga pasien mengira pengingat aktif padahal tidak pernah berbunyi.
// Murni: tanpa DOM/jaringan. Gagal-tertutup dengan pesan yang bisa ditampilkan.

export const MAKS_NAMA_OBAT = 120
export const MAKS_DOSIS = 60
/** Batas kewajaran, bukan aturan klinis: jadwal pertama tidak boleh lebih dari setahun dari sekarang. */
const RENTANG_MS = 366 * 864e5

export interface PengingatMasuk { medName: string; dose: string; timeOfDay: string; nextFireAt: string }
export type TambalPengingat = Partial<PengingatMasuk & { active: boolean }>

const JAM = /^([01]\d|2[0-3]):[0-5]\d$/

function teks(nilai: unknown, label: string, maks: number, wajib: boolean): string {
  if (nilai === undefined || nilai === null || nilai === '') {
    if (wajib) throw new Error(`${label} is required`)
    return ''
  }
  if (typeof nilai !== 'string') throw new Error(`${label} must be text`)
  const bersih = nilai.trim()
  if (wajib && !bersih) throw new Error(`${label} is required`)
  if (bersih.length > maks) throw new Error(`${label} must be ${maks} characters or fewer`)
  return bersih
}

function jam(nilai: unknown): string {
  if (typeof nilai !== 'string' || !JAM.test(nilai)) throw new Error('time of day must be HH:MM')
  return nilai
}

/** Tanggal ISO sah dalam rentang wajar, dinormalkan ke ISO UTC. */
function saatSah(nilai: unknown, sekarang: Date): string {
  if (typeof nilai !== 'string' || nilai.trim() === '') throw new Error('next reminder time is required')
  const t = Date.parse(nilai)
  if (!Number.isFinite(t)) throw new Error('next reminder time must be a valid date and time')
  if (Math.abs(t - sekarang.getTime()) > RENTANG_MS) throw new Error('next reminder time must be within a year of now')
  return new Date(t).toISOString()
}

export function validasiPengingatBaru(masukan: unknown, sekarang: Date): PengingatMasuk {
  if (!masukan || typeof masukan !== 'object' || Array.isArray(masukan)) throw new Error('invalid reminder')
  const m = masukan as Record<string, unknown>
  return {
    medName: teks(m.medName, 'medication name', MAKS_NAMA_OBAT, true),
    dose: teks(m.dose, 'dose', MAKS_DOSIS, false),
    timeOfDay: jam(m.timeOfDay),
    nextFireAt: saatSah(m.nextFireAt, sekarang),
  }
}

/** Hanya kolom yang boleh diubah klien; id, createdAt dan kolom asing tidak pernah ikut tersimpan. */
export function validasiTambalPengingat(masukan: unknown, sekarang: Date): TambalPengingat {
  if (!masukan || typeof masukan !== 'object' || Array.isArray(masukan)) throw new Error('invalid reminder update')
  const m = masukan as Record<string, unknown>
  const keluar: TambalPengingat = {}
  if ('medName' in m) keluar.medName = teks(m.medName, 'medication name', MAKS_NAMA_OBAT, true)
  if ('dose' in m) keluar.dose = teks(m.dose, 'dose', MAKS_DOSIS, false)
  if ('timeOfDay' in m) keluar.timeOfDay = jam(m.timeOfDay)
  if ('nextFireAt' in m) keluar.nextFireAt = saatSah(m.nextFireAt, sekarang)
  if ('active' in m) {
    if (typeof m.active !== 'boolean') throw new Error('active must be true or false')
    keluar.active = m.active
  }
  if (Object.keys(keluar).length === 0) throw new Error('nothing to update')
  return keluar
}
