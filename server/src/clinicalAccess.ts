import type { RequestHandler } from 'express'
import { getClinical, getSettings, clinicalAccessFor, type User, type Clinical } from './store.js'
import { plainObject, safeJson } from './security.js'

export function verifiedClinician(user: User): boolean {
  return user.role === 'dokter' && getSettings(user.id).strStatus === 'verified'
}

export function canAccessPatient(user: User, patientId: string, clinicianOnly = false): boolean {
  const access = clinicalAccessFor(patientId)
  if (!access) return false
  if (!clinicianOnly && access.patientUserId === user.id) return true
  return verifiedClinician(user) && access.practitionerIds.includes(user.id)
}

export function clinicalFor(user: User): Clinical {
  const data = getClinical()
  const patients = data.patients.filter(p => canAccessPatient(user, p.id))
  const ids = new Set(patients.map(p => p.id))
  const select = <T>(source: Record<string, T>) => Object.fromEntries(Object.entries(source).filter(([id]) => ids.has(id)))
  return { patients, vitals: select(data.vitals), supportive: select(data.supportive), records: select(data.records), education: select(data.education) }
}

export function clinicalWrite(field: string, clinicianOnly = false): RequestHandler {
  return (req, res, next) => {
    const user = (req as typeof req & { user: User }).user
    const id = req.body?.patientId
    const data = req.body?.[field]
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(id) || !plainObject(data) || !safeJson(data) || JSON.stringify(data).length > 128000 || (data.patientId !== undefined && data.patientId !== id)) return void res.status(400).json({ error: 'invalid_clinical_data' })
    if (!canAccessPatient(user, id, clinicianOnly)) return void res.status(403).json({ error: 'patient_access_denied' })
    next()
  }
}
