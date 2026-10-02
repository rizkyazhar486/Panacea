import type { Express, Request } from 'express'
import { requireAuth } from './auth.js'
import {
  addAudit,
  getVisitMembership,
  listVisitMembershipsForUser,
  saveVisitMembership,
  uid,
  type User,
} from './store.js'

type AuthenticatedRequest = Request & { user: User }

function doctor(req: Request): User | null {
  const user = (req as AuthenticatedRequest).user
  return user?.role === 'dokter' ? user : null
}

export function mountVisitRoutes(app: Express) {
  app.get('/api/visits', requireAuth, (req, res) => {
    const user = (req as AuthenticatedRequest).user
    res.json({ visits: listVisitMembershipsForUser(user.id) })
  })

  app.post('/api/visits', requireAuth, (req, res) => {
    const clinician = doctor(req)
    if (!clinician) return res.status(403).json({ error: 'doctor_required' })

    const patientUserId = String(req.body?.patientUserId ?? '').trim()
    const visitId = String(req.body?.visitId ?? '').trim() || uid()
    if (!patientUserId) return res.status(400).json({ error: 'patientUserId_required' })

    try {
      const visit = saveVisitMembership({
        id: visitId,
        patientUserId,
        clinicianUserId: clinician.id,
        status: 'scheduled',
        startsAt: typeof req.body?.startsAt === 'string' ? req.body.startsAt : undefined,
        endsAt: typeof req.body?.endsAt === 'string' ? req.body.endsAt : undefined,
      })
      addAudit(clinician, 'visit_membership_created', visit.id)
      res.status(201).json({ visit })
    } catch (error) {
      res.status(400).json({ error: 'invalid_visit_membership', detail: (error as Error).message })
    }
  })

  for (const transition of ['active', 'ended'] as const) {
    const action = transition === 'active' ? 'activate' : 'end'
    app.post(`/api/visits/:id/${action}`, requireAuth, (req, res) => {
      const clinician = doctor(req)
      if (!clinician) return res.status(403).json({ error: 'doctor_required' })
      const current = getVisitMembership(req.params.id)
      if (!current) return res.status(404).json({ error: 'visit_not_found' })
      if (current.clinicianUserId !== clinician.id) {
        return res.status(403).json({ error: 'not_assigned_clinician' })
      }

      try {
        const visit = saveVisitMembership({
          ...current,
          status: transition,
          updatedAt: new Date().toISOString(),
        })
        addAudit(clinician, `visit_membership_${transition}`, visit.id)
        res.json({ visit })
      } catch (error) {
        res.status(409).json({ error: 'invalid_visit_transition', detail: (error as Error).message })
      }
    })
  }
}
