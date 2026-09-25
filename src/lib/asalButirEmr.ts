// Label asal per butir AI-EMR. Fail closed: butir tanpa asal (data lama) atau
// bersumber AI tampil sebagai draf AI; "doctor-verified" hanya bila server mencap
// verifiedById. Asal itu sendiri dicap server (server/src/rekamKlinis.ts).
import type { PlanItem, ProblemEntry } from './types.ts'

export function labelAsalMasalah(m: Pick<ProblemEntry, 'source' | 'carriedFrom'>): string {
  const asal = m.source === 'Dokter' ? 'doctor-written' : 'AI draft'
  return m.carriedFrom ? `${asal} · carried from previous visit` : asal
}

export function labelAsalRencana(b: Pick<PlanItem, 'source' | 'status' | 'verifiedById'>): string {
  if (b.status === 'ditolak') return 'rejected'
  if (b.status === 'diverifikasi') return b.verifiedById ? 'doctor-verified' : 'verified · verifier not recorded'
  return b.source === 'Dokter' ? 'doctor proposal · not verified' : 'AI suggestion · not verified'
}
