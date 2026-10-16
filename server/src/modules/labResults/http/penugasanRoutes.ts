// Rute penugasan staf (perawat, lab) ke pasien — F1/R3. Validasi + otorisasi + pemetaan galat; aturan ada di domain/penugasanStaf.
// Yang boleh menugaskan/mencabut: klinisi terverifikasi (peran efektif 'dokter') atau owner. Staf hanya dapat melihat penugasannya sendiri.
import type { Express, Request, RequestHandler } from 'express'
import { kunciPenugasan, pasienDitugaskan, PERAN_STAF, validasiPenugasan } from '../domain/penugasanStaf.js'
import type { PenugasanStaf } from '../domain/penugasanStaf.js'

export interface PenggunaPenugasan { id: string; role: string }
export interface DepPenugasan {
  requireAuth: RequestHandler
  isOwner: (u: PenggunaPenugasan) => boolean
  /** Staf terdaftar + status verifikasi profesional (strStatus), atau undefined bila akun tidak ada. */
  cariStaf: (id: string) => { role: string; verified: boolean } | undefined
  repo: { all: () => Record<string, PenugasanStaf>; put: (kunci: string, p: PenugasanStaf) => void; hapus: (kunci: string) => boolean }
  now: () => Date
  audit: (u: PenggunaPenugasan, aksi: string, target?: string) => void
}

export function pasangRutePenugasanStaf(app: Express, d: DepPenugasan): void {
  const pengguna = (req: Request) => (req as Request & { user: PenggunaPenugasan }).user
  const bolehMenugaskan = (u: PenggunaPenugasan) => u.role === 'dokter' || d.isOwner(u)
  const dicadangkan = (v: unknown) => typeof v === 'string' && v in Object.prototype

  app.post('/api/staff-assignments', d.requireAuth, (req, res) => {
    const u = pengguna(req)
    if (!bolehMenugaskan(u)) { d.audit(u, 'staffassign.rejected:forbidden'); return res.status(403).json({ error: 'forbidden' }) }
    const b = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>
    const staf = typeof b.staffId === 'string' ? d.cariStaf(b.staffId) : undefined
    const v = validasiPenugasan(b, staf)
    if (!v.ok || dicadangkan(v.ok ? v.patientId : undefined)) {
      const alasan = v.ok ? 'invalid-input' : v.alasan
      d.audit(u, `staffassign.rejected:${alasan}`)
      return res.status(alasan === 'staff-not-found' ? 404 : alasan === 'invalid-input' ? 400 : 409).json({ error: alasan })
    }
    const rec: PenugasanStaf = { staffId: v.staffId, patientId: v.patientId, oleh: u.id, pada: d.now().toISOString() }
    d.repo.put(kunciPenugasan(v.staffId, v.patientId), rec)
    d.audit(u, 'staffassign.assigned', `${v.staffId}>${v.patientId}`)
    res.status(201).json(rec)
  })

  app.delete('/api/staff-assignments/:staffId/:patientId', d.requireAuth, (req, res) => {
    const u = pengguna(req)
    if (!bolehMenugaskan(u)) { d.audit(u, 'staffassign.revoke.rejected:forbidden'); return res.status(403).json({ error: 'forbidden' }) }
    const staffId = String(req.params.staffId ?? ''), patientId = String(req.params.patientId ?? '')
    if (dicadangkan(staffId) || dicadangkan(patientId) || staffId.includes('|') || patientId.includes('|')) return res.status(400).json({ error: 'invalid-input' })
    if (!d.repo.hapus(kunciPenugasan(staffId, patientId))) return res.status(404).json({ error: 'not-found' })
    d.audit(u, 'staffassign.revoked', `${staffId}>${patientId}`)
    res.json({ ok: true })
  })

  // Daftar penugasan: staf melihat miliknya; klinisi/owner melihat per pasien (?patientId=) agar bisa mencabut.
  app.get('/api/staff-assignments', d.requireAuth, (req, res) => {
    const u = pengguna(req)
    if ((PERAN_STAF as readonly string[]).includes(u.role)) return res.json({ assignments: Object.values(d.repo.all()).filter((p) => p.staffId === u.id) })
    if (!bolehMenugaskan(u)) return res.status(403).json({ error: 'forbidden' })
    const pid = typeof req.query.patientId === 'string' ? req.query.patientId : ''
    if (!pid || dicadangkan(pid)) return res.status(400).json({ error: 'invalid-input' })
    res.json({ assignments: Object.values(d.repo.all()).filter((p) => p.patientId === pid) })
  })
}

export { pasienDitugaskan }
