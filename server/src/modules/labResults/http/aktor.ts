// Pemetaan pengguna server -> aktor siklus hidup. Fail closed: peran non-klinis (kontributor,
// verifikator) tidak punya akses data hasil. Owner BUKAN klinisi: ia dipetakan ke admin
// (tidak dapat meninjau), sesuai larangan memakai status owner untuk melewati kontrol klinis.
// Perawat dan lab hanya melihat pasien yang ditugaskan kepada mereka (hak akses minimum, tidak seluruh tenant).
import type { Actor } from '../domain/lifecycle.js'
import { TENANT_PRAKTIK } from '../service/labResultsService.js'

export interface PenggunaHasil { id: string; role: string }
export interface DepAktor { isOwner: (u: PenggunaHasil) => boolean; idPasienDiri: (userId: string) => string; pasienTertaut: (userId: string) => string[]; pasienDitugaskan: (userId: string) => string[] }

export function aktorDariPengguna(u: PenggunaHasil, d: DepAktor): Actor | null {
  const dasar = { actorId: u.id, tenantId: TENANT_PRAKTIK }
  if (u.role === 'dokter') return { ...dasar, role: 'clinician', authorizedClinician: true }
  if (u.role === 'admin' || d.isOwner(u)) return { ...dasar, role: 'admin' }
  // Staf (F1): hanya lewat penugasan eksplisit per pasien; tanpa penugasan, daftar kosong = tidak melihat apa pun.
  if (u.role === 'perawat') return { ...dasar, role: 'nurse', patientIds: d.pasienDitugaskan(u.id) }
  if (u.role === 'lab') return { ...dasar, role: 'lab-staff', patientIds: d.pasienDitugaskan(u.id) }
  if (u.role === 'pasien') return { ...dasar, role: 'patient', patientIds: [d.idPasienDiri(u.id), ...d.pasienTertaut(u.id)] }
  return null
}
