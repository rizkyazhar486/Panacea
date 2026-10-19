// Kapabilitas langkah hasil lab per peran (F1). Murni. Ini CERMIN matriks server (server/src/modules/labResults/domain/definitions.ts)
// hanya untuk memutuskan tombol mana yang ditampilkan; server tetap satu-satunya otoritas dan menolak langkah yang tidak diizinkan.
import type { ResultStatus } from './labResultQueue'

export type PeranMeja = 'dokter' | 'perawat' | 'lab'

const BOLEH: Record<PeranMeja, readonly ResultStatus[]> = {
  lab: ['pending_review'],
  perawat: ['pending_review', 'communicated', 'closed'],
  dokter: ['pending_review', 'reviewed', 'communicated', 'closed'],
}

/** Peran meja kerja dari peran akun; null = bukan peran yang punya meja hasil lab (fail-closed). */
export const peranMeja = (role: unknown, isOwner: boolean): PeranMeja | null =>
  isOwner || role === 'dokter' ? 'dokter' : role === 'perawat' ? 'perawat' : role === 'lab' ? 'lab' : null

/** Boleh menampilkan tombol untuk masuk ke status `to`? Owner dipetakan ke dokter hanya untuk tampilan; server tetap menolak owner yang bukan klinisi. */
export const bolehLangkah = (peran: PeranMeja | null, to: ResultStatus | null): boolean => peran !== null && to !== null && BOLEH[peran].includes(to)
