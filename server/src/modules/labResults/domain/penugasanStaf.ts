// Penugasan staf (perawat, laboratorium) ke pasien — hak akses minimum untuk F1 (usulan R3). Murni, tanpa HTTP/penyimpanan.
// Akun staf yang belum diverifikasi diperlakukan sebagai pasien oleh effectiveRoleForRequest, jadi di sini hanya peran + status verifikasi
// yang diperiksa. Penugasan memberi akses ke SATU pasien; tidak ada akses tenant-lebar bagi staf.
export const PERAN_STAF = ['perawat', 'lab'] as const
export type PeranStaf = (typeof PERAN_STAF)[number]
export const MAKS_ID_PENUGASAN = 128

export interface PenugasanStaf { staffId: string; patientId: string; oleh: string; pada: string }
export type AlasanTolak = 'invalid-input' | 'staff-not-found' | 'staff-role-invalid' | 'staff-not-verified'

/** Kunci "staf|pasien": '|' ditolak pada id supaya dua pasangan berbeda tidak pernah menghasilkan kunci sama. */
export const kunciPenugasan = (staffId: string, patientId: string): string => `${staffId}|${patientId}`

const idSahih = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAKS_ID_PENUGASAN && v === v.trim() && !v.includes('|')

export function validasiPenugasan(
  m: { staffId?: unknown; patientId?: unknown },
  staff: { role: string; verified: boolean } | undefined,
): { ok: true; staffId: string; patientId: string } | { ok: false; alasan: AlasanTolak } {
  if (!idSahih(m.staffId) || !idSahih(m.patientId)) return { ok: false, alasan: 'invalid-input' }
  if (!staff) return { ok: false, alasan: 'staff-not-found' }
  if (!(PERAN_STAF as readonly string[]).includes(staff.role)) return { ok: false, alasan: 'staff-role-invalid' }
  if (!staff.verified) return { ok: false, alasan: 'staff-not-verified' }
  return { ok: true, staffId: m.staffId, patientId: m.patientId }
}

/** Pasien yang boleh dilayani staf ini; peta tanpa entri → daftar kosong (deny-by-default). */
export const pasienDitugaskan = (peta: Readonly<Record<string, PenugasanStaf>>, staffId: string): string[] =>
  Object.values(peta).filter((p) => p.staffId === staffId).map((p) => p.patientId).sort()
