// Backward-compatible multi-encounter persistence for AI-EMR.
//
// Existing UI code expects clinical.records[patientId] to be one record. Keep
// that field as a "last written/current encounter" pointer, while preserving
// every encounter under recordEncounters[patientId], keyed by stable record.id.
// This lets old clients keep working without collapsing a patient's visits.

export interface SimpananEncounter {
  records: Record<string, any>
  recordEncounters?: Record<string, any[]>
  recordHistory?: Record<string, any[]>
}

function idRekam(record: any): string {
  const id = typeof record?.id === 'string' ? record.id.trim() : ''
  if (!id) throw new Error('record.id is required for encounter persistence')
  return id
}

function cocokPasien(patientId: string, record: any): void {
  if (record?.patientId !== patientId) throw new Error('record.patientId must match patientId')
}

/**
 * Read all encounters newest-update first. Legacy stores are projected as a
 * one-item encounter list until the first multi-encounter write migrates them.
 */
export function daftarEncounter(c: SimpananEncounter, patientId: string): any[] {
  const list = c.recordEncounters?.[patientId] ?? []
  const latestLegacy = c.records?.[patientId]
  const byId = new Map<string, any>()

  for (const record of list) {
    try { byId.set(idRekam(record), record) } catch { /* ignore malformed historical row */ }
  }
  if (latestLegacy) {
    try {
      const id = idRekam(latestLegacy)
      if (!byId.has(id)) byId.set(id, latestLegacy)
    } catch { /* legacy malformed row remains available through records only */ }
  }

  return [...byId.values()].sort((a, b) => {
    const ta = Date.parse(String(a?.updatedAt ?? a?.createdAt ?? ''))
    const tb = Date.parse(String(b?.updatedAt ?? b?.createdAt ?? ''))
    const na = Number.isFinite(ta) ? ta : 0
    const nb = Number.isFinite(tb) ? tb : 0
    return nb - na
  })
}

export function ambilEncounter(c: SimpananEncounter, patientId: string, recordId?: string): any | undefined {
  if (!recordId) return c.records?.[patientId]
  const id = recordId.trim()
  if (!id) return undefined
  return daftarEncounter(c, patientId).find((r) => r?.id === id)
}

/**
 * Upsert exactly one encounter and preserve the legacy latest-pointer.
 * Signed-version archives are tagged with recordId so revisions from separate
 * encounters cannot be mistaken for one another.
 */
export function simpanEncounter(c: SimpananEncounter, patientId: string, record: any, arsip?: any): void {
  const id = idRekam(record)
  cocokPasien(patientId, record)

  const current = daftarEncounter(c, patientId)
  const next = current.filter((r) => r?.id !== id)
  next.push(record)

  c.recordEncounters ??= {}
  c.recordEncounters[patientId] = next.sort((a, b) => {
    const ta = Date.parse(String(a?.updatedAt ?? a?.createdAt ?? ''))
    const tb = Date.parse(String(b?.updatedAt ?? b?.createdAt ?? ''))
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0)
  })

  // Compatibility pointer: this intentionally follows the last successful
  // write, not wall-clock sort, so existing save/read flows remain deterministic.
  c.records[patientId] = record

  if (arsip) {
    c.recordHistory ??= {}
    c.recordHistory[patientId] ??= []
    c.recordHistory[patientId].push({ ...arsip, recordId: id })
  }
}

export function daftarRiwayatEncounter(c: SimpananEncounter, patientId: string, recordId?: string): any[] {
  const history = c.recordHistory?.[patientId] ?? []
  if (!recordId) return history
  return history.filter((r) => r?.recordId === recordId || r?.id === recordId)
}
