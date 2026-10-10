// Rute HTTP hasil lab dan rujukan: validasi input + auth + pemetaan galat. Tanpa aturan bisnis.
import type { Express, Request, RequestHandler, Response } from 'express'
import { aktorDariPengguna } from './aktor.js'
import type { DepAktor, PenggunaHasil } from './aktor.js'
import * as svc from '../service/labResultsService.js'
import type { Galat, Konteks } from '../service/labResultsService.js'

const STATUS_HTTP: Record<Galat, number> = {
  'not-found': 404,
  forbidden: 403, 'role-not-permitted': 403, 'system-cannot-record': 403, 'clinician-not-authorized': 403, 'tenant-mismatch': 403,
  'stale-status': 409, 'not-allowed-step': 409,
  'invalid-input': 400, 'evidence-required': 400, 'invalid-timestamp': 400, 'unknown-status': 400, 'linked-result-invalid': 422,
  'time-before-last-entry': 409, 'trail-corrupt': 500,
}

export interface DepRute extends DepAktor {
  requireAuth: RequestHandler
  konteks: () => Konteks
  audit: (u: PenggunaHasil, aksi: string, target?: string) => void
}

export function pasangRuteHasilLab(app: Express, d: DepRute): void {
  const ambil = (req: Request, res: Response) => {
    const u = (req as Request & { user: PenggunaHasil }).user
    const a = aktorDariPengguna(u, d)
    if (!a) { res.status(403).json({ error: 'forbidden' }); return null }
    return { u, a }
  }
  const balas = <T>(res: Response, r: svc.Hasil<T>, aksi: string, u: PenggunaHasil, id: (v: T) => string, sukses = 200) => {
    if (!r.ok) { d.audit(u, `${aksi}.rejected:${r.reason}`); return res.status(STATUS_HTTP[r.reason]).json({ error: r.reason, ...(r.detail ? { detail: r.detail } : {}) }) }
    d.audit(u, aksi, id(r.value))
    return res.status(sukses).json(r.value)
  }
  const idParam = (req: Request) => String(req.params.id ?? '').slice(0, svc.MAKS_ID)
  const body = (req: Request) => (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, any>

  app.post('/api/lab-results', d.requireAuth, (req, res) => {
    const c = ambil(req, res); if (!c) return
    const b = body(req)
    balas(res, svc.terimaHasil(d.konteks(), c.a, { patientId: b.patientId, item: b.item, source: b.source }), 'labresult.received', c.u, (v) => v.id, 201)
  })
  app.get('/api/lab-results', d.requireAuth, (req, res) => {
    const c = ambil(req, res); if (!c) return
    const pid = typeof req.query.patientId === 'string' ? req.query.patientId : undefined
    res.json({ results: svc.daftarHasil(d.konteks(), c.a, pid) })
  })
  // Metrik didaftarkan sebelum '/:id' agar 'metrics' tidak dibaca sebagai id.
  app.get('/api/lab-results/metrics', d.requireAuth, (req, res) => {
    const c = ambil(req, res); if (!c) return
    const due = req.query.dueHours === undefined ? undefined : Number(req.query.dueHours)
    const r = svc.metrikPenutupan(d.konteks(), c.a, due === undefined ? {} : { dueHours: due })
    if (!r.ok) return res.status(STATUS_HTTP[r.reason]).json({ error: r.reason, ...(r.detail ? { detail: r.detail } : {}) })
    res.json(r.value)
  })
  app.get('/api/lab-results/:id', d.requireAuth, (req, res) => {
    const c = ambil(req, res); if (!c) return
    balas(res, svc.bacaHasil(d.konteks(), c.a, idParam(req)), 'labresult.read', c.u, (v) => v.id)
  })
  app.post('/api/lab-results/:id/advance', d.requireAuth, (req, res) => {
    const c = ambil(req, res); if (!c) return
    const b = body(req)
    balas(res, svc.majukanHasil(d.konteks(), c.a, idParam(req), { to: b.to, expectedStatus: b.expectedStatus, communication: b.communication }), 'labresult.advanced', c.u, (v) => `${v.id}->${v.status}`)
  })

  app.post('/api/referrals', d.requireAuth, (req, res) => {
    const c = ambil(req, res); if (!c) return
    const b = body(req)
    balas(res, svc.buatRujukan(d.konteks(), c.a, { patientId: b.patientId, kind: b.kind, reason: b.reason, toFacility: b.toFacility }), 'referral.created', c.u, (v) => v.id, 201)
  })
  app.get('/api/referrals', d.requireAuth, (req, res) => {
    const c = ambil(req, res); if (!c) return
    const pid = typeof req.query.patientId === 'string' ? req.query.patientId : undefined
    res.json({ referrals: svc.daftarRujukan(d.konteks(), c.a, pid) })
  })
  app.get('/api/referrals/:id', d.requireAuth, (req, res) => {
    const c = ambil(req, res); if (!c) return
    balas(res, svc.bacaRujukan(d.konteks(), c.a, idParam(req)), 'referral.read', c.u, (v) => v.id)
  })
  app.post('/api/referrals/:id/advance', d.requireAuth, (req, res) => {
    const c = ambil(req, res); if (!c) return
    const b = body(req)
    balas(res, svc.majukanRujukan(d.konteks(), c.a, idParam(req), { to: b.to, expectedStatus: b.expectedStatus, resultId: b.resultId, returnNote: b.returnNote, closeReason: b.closeReason }), 'referral.advanced', c.u, (v) => `${v.id}->${v.status}`)
  })
}
