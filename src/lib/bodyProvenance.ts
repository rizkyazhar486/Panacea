export type BodyProvenanceClass =
  | 'source-backed'
  | 'derived'
  | 'schematic'
  | 'synthetic-simulation'
  | 'experimental-concept'
  | 'blocked'

export type BodyEvidenceLevel = 'unknown' | 'educational' | 'reviewed' | 'validated-source'

export interface BodyProvenanceRecord {
  id: string
  label: string
  provenance: BodyProvenanceClass
  evidence: BodyEvidenceLevel
  source?: string
  sourceRef?: string
  derivedFrom?: readonly string[]
  notes?: string
  clinicallyAuthoritative: false
}

export interface BodyProvenanceBadge {
  label: string
  tone: 'cyan' | 'violet' | 'amber' | 'gray' | 'red'
  short: string
  description: string
}

export const BODY_PROVENANCE_BADGES: Readonly<Record<BodyProvenanceClass, BodyProvenanceBadge>> = {
  'source-backed': {
    label: 'Source-backed anatomy',
    tone: 'cyan',
    short: 'SOURCE',
    description: 'Rendered from an approved anatomy source asset or explicitly mapped source node.',
  },
  derived: {
    label: 'Derived teaching layer',
    tone: 'violet',
    short: 'DERIVED',
    description: 'Computed or transformed from other source-backed or reviewed teaching data.',
  },
  schematic: {
    label: 'Schematic',
    tone: 'amber',
    short: 'SCHEMATIC',
    description: 'Illustrative educational representation; geometry or scale may be simplified.',
  },
  'synthetic-simulation': {
    label: 'Synthetic simulation',
    tone: 'violet',
    short: 'SIM',
    description: 'Interactive synthetic behavior intended for learning or product prototyping, not patient prediction.',
  },
  'experimental-concept': {
    label: 'Experimental concept',
    tone: 'gray',
    short: 'EXPERIMENT',
    description: 'Creative product concept that has not been validated as anatomy, physiology, diagnosis, or treatment behavior.',
  },
  blocked: {
    label: 'Unavailable',
    tone: 'red',
    short: 'BLOCKED',
    description: 'Required source or validation is unavailable. The system should fail closed instead of inventing substitute anatomy.',
  },
}

export function bodyProvenanceBadge(provenance: BodyProvenanceClass) {
  return BODY_PROVENANCE_BADGES[provenance]
}

export function bodyProvenanceRecord(input: Omit<BodyProvenanceRecord, 'clinicallyAuthoritative'>): BodyProvenanceRecord {
  return { ...input, clinicallyAuthoritative: false }
}

export function sourceBackedBodyRecord(id: string, label: string, source: string, sourceRef?: string): BodyProvenanceRecord {
  return bodyProvenanceRecord({
    id,
    label,
    provenance: 'source-backed',
    evidence: 'validated-source',
    source,
    sourceRef,
  })
}

export function schematicBodyRecord(id: string, label: string, notes?: string): BodyProvenanceRecord {
  return bodyProvenanceRecord({
    id,
    label,
    provenance: 'schematic',
    evidence: 'educational',
    notes,
  })
}

export function syntheticBodyRecord(id: string, label: string, notes?: string): BodyProvenanceRecord {
  return bodyProvenanceRecord({
    id,
    label,
    provenance: 'synthetic-simulation',
    evidence: 'educational',
    notes,
  })
}

export function experimentalBodyRecord(id: string, label: string, notes?: string): BodyProvenanceRecord {
  return bodyProvenanceRecord({
    id,
    label,
    provenance: 'experimental-concept',
    evidence: 'unknown',
    notes,
  })
}

export function blockedBodyRecord(id: string, label: string, notes?: string): BodyProvenanceRecord {
  return bodyProvenanceRecord({
    id,
    label,
    provenance: 'blocked',
    evidence: 'unknown',
    notes,
  })
}

export function derivedBodyRecord(
  id: string,
  label: string,
  derivedFrom: readonly string[],
  notes?: string,
): BodyProvenanceRecord {
  return bodyProvenanceRecord({
    id,
    label,
    provenance: 'derived',
    evidence: 'educational',
    derivedFrom,
    notes,
  })
}

export function bodyProvenanceCanRender(record: BodyProvenanceRecord) {
  return record.provenance !== 'blocked'
}

export function bodyProvenanceRequiresDisclaimer(record: BodyProvenanceRecord) {
  return record.provenance === 'schematic' || record.provenance === 'synthetic-simulation' || record.provenance === 'experimental-concept'
}

export function bodyProvenanceSourceChain(records: readonly BodyProvenanceRecord[], id: string) {
  const byId = new Map(records.map((record) => [record.id, record]))
  const result: BodyProvenanceRecord[] = []
  const visited = new Set<string>()
  const queue = [id]

  while (queue.length) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)
    const record = byId.get(currentId)
    if (!record) continue
    result.push(record)
    for (const parent of record.derivedFrom ?? []) queue.push(parent)
  }

  return result
}

export function bodyProvenanceAudit(records: readonly BodyProvenanceRecord[]) {
  const counts = Object.fromEntries(Object.keys(BODY_PROVENANCE_BADGES).map((key) => [key, records.filter((record) => record.provenance === key).length]))
  const blocked = records.filter((record) => record.provenance === 'blocked')
  const missingSourceRefs = records.filter((record) => record.provenance === 'source-backed' && !record.sourceRef && !record.source)
  const derivedWithMissingParents = records.filter((record) => record.derivedFrom?.some((id) => !records.some((candidate) => candidate.id === id)))
  return {
    total: records.length,
    counts,
    blocked,
    missingSourceRefs,
    derivedWithMissingParents,
    pass: missingSourceRefs.length === 0 && derivedWithMissingParents.length === 0,
  }
}

export const BODY_PROVENANCE_RULES = [
  'Source-backed means a real approved source asset or source mapping exists.',
  'Schematic content must be labeled as schematic when geometry, scale, or behavior is illustrative.',
  'Synthetic simulations must never be presented as patient prediction.',
  'Experimental concepts may be visually ambitious but are not evidence claims.',
  'Missing anatomy fails closed as blocked rather than silently substituting invented anatomy.',
  'Derived content keeps references to its upstream records.',
] as const
