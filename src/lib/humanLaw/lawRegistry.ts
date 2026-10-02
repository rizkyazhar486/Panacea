export type HumanLawStatus =
  | 'generated'
  | 'candidate'
  | 'reproduced'
  | 'mechanistically-supported'
  | 'externally-validated'
  | 'accepted'
  | 'rejected'
  | 'deprecated'
  | 'unresolved'
  | 'context-specific'
  | 'superseded'
  | 'scope-restricted'

export type HumanLawScope = 'individual' | 'subpopulation' | 'universal'

export interface HumanLawOntologyRef {
  namespace: string
  version: string
  conceptIds: readonly string[]
}

export interface HumanLawEvidenceBundle {
  sourceEventIds: readonly string[]
  predictionIds: readonly string[]
  comparisonIds: readonly string[]
  externalEvidenceRefs: readonly string[]
  counterexampleRefs: readonly string[]
}

export interface HumanLawProvenance {
  createdAt: string
  createdBy: {
    kind: 'model' | 'human' | 'workflow'
    id: string
  }
  modelId: string
  modelVersion: string
  codeCommitSha: string
  datasetRefs: readonly string[]
  transformationRefs: readonly string[]
}

export interface HumanLawRecord {
  id: string
  version: string
  title: string
  expression: string
  scope: HumanLawScope
  subjectId?: string
  population: string
  ontologyRefs: readonly HumanLawOntologyRef[]
  assumptions: readonly string[]
  units: Readonly<Record<string, string>>
  parameterIds: readonly string[]
  status: HumanLawStatus
  evidence: HumanLawEvidenceBundle
  provenance: HumanLawProvenance
}

export interface HumanLawStatusEvent {
  from: HumanLawStatus | null
  to: HumanLawStatus
  changedAt: string
  changedBy: string
  reason: string
  evidenceRefs: readonly string[]
}

export interface HumanLawRegistry {
  revision: number
  lawsById: Readonly<Record<string, HumanLawRecord>>
  statusHistoryByLawId: Readonly<Record<string, readonly HumanLawStatusEvent[]>>
  supersededByLawId: Readonly<Record<string, string>>
}

export interface HumanLawInsertResult {
  registry: HumanLawRegistry
  status: 'inserted' | 'duplicate'
}

function nonBlank(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} must not be blank`)
  return normalized
}

function parseIso(value: string, field: string): string {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${field} must be a valid ISO timestamp`)
  return value
}

function uniqueRefs(values: readonly string[], field: string): string[] {
  const normalized = values.map((value, index) => nonBlank(value, `${field}[${index}]`))
  const seen = new Set<string>()
  for (const value of normalized) {
    if (seen.has(value)) throw new Error(`${field} contains duplicate reference ${value}`)
    seen.add(value)
  }
  return normalized
}

function normalizeOntologyRefs(refs: readonly HumanLawOntologyRef[]): HumanLawOntologyRef[] {
  if (!refs.length) throw new Error('ontologyRefs must not be empty')
  return refs.map((ref, index) => {
    if (!ref.conceptIds.length) throw new Error(`ontologyRefs[${index}].conceptIds must not be empty`)
    return {
      namespace: nonBlank(ref.namespace, `ontologyRefs[${index}].namespace`),
      version: nonBlank(ref.version, `ontologyRefs[${index}].version`),
      conceptIds: uniqueRefs(ref.conceptIds, `ontologyRefs[${index}].conceptIds`),
    }
  })
}

function normalizeUnits(units: Readonly<Record<string, string>>): Record<string, string> {
  const normalized: Record<string, string> = {}
  for (const [rawName, rawUnit] of Object.entries(units)) {
    const name = nonBlank(rawName, 'units key')
    if (typeof rawUnit !== 'string') throw new Error(`units.${name} must be a string`)
    normalized[name] = nonBlank(rawUnit, `units.${name}`)
  }
  return normalized
}

function normalizeEvidence(evidence: HumanLawEvidenceBundle): HumanLawEvidenceBundle {
  return {
    sourceEventIds: uniqueRefs(evidence.sourceEventIds, 'sourceEventIds'),
    predictionIds: uniqueRefs(evidence.predictionIds, 'predictionIds'),
    comparisonIds: uniqueRefs(evidence.comparisonIds, 'comparisonIds'),
    externalEvidenceRefs: uniqueRefs(evidence.externalEvidenceRefs, 'externalEvidenceRefs'),
    counterexampleRefs: uniqueRefs(evidence.counterexampleRefs, 'counterexampleRefs'),
  }
}

function normalizeProvenance(provenance: HumanLawProvenance): HumanLawProvenance {
  const codeCommitSha = nonBlank(provenance.codeCommitSha, 'codeCommitSha')
  if (!/^[0-9a-f]{40}$/i.test(codeCommitSha)) {
    throw new Error('codeCommitSha must be exactly 40 hexadecimal characters')
  }
  return {
    createdAt: parseIso(provenance.createdAt, 'createdAt'),
    createdBy: {
      kind: provenance.createdBy.kind,
      id: nonBlank(provenance.createdBy.id, 'createdBy.id'),
    },
    modelId: nonBlank(provenance.modelId, 'modelId'),
    modelVersion: nonBlank(provenance.modelVersion, 'modelVersion'),
    codeCommitSha,
    datasetRefs: uniqueRefs(provenance.datasetRefs, 'datasetRefs'),
    transformationRefs: uniqueRefs(provenance.transformationRefs, 'transformationRefs'),
  }
}

function normalizeLaw(input: HumanLawRecord): HumanLawRecord {
  if (input.status !== 'generated') throw new Error('initial status must be generated')
  const scope = input.scope
  let subjectId: string | undefined
  if (scope === 'individual') {
    if (typeof input.subjectId !== 'string') throw new Error('subjectId is required for individual law')
    subjectId = nonBlank(input.subjectId, 'subjectId')
  } else if (input.subjectId !== undefined) {
    throw new Error('subjectId is only allowed for individual law')
  }

  return {
    id: nonBlank(input.id, 'id'),
    version: nonBlank(input.version, 'version'),
    title: nonBlank(input.title, 'title'),
    expression: nonBlank(input.expression, 'expression'),
    scope,
    ...(subjectId ? { subjectId } : {}),
    population: nonBlank(input.population, 'population'),
    ontologyRefs: normalizeOntologyRefs(input.ontologyRefs),
    assumptions: input.assumptions.map((value, index) => nonBlank(value, `assumptions[${index}]`)),
    units: normalizeUnits(input.units),
    parameterIds: uniqueRefs(input.parameterIds, 'parameterIds'),
    status: 'generated',
    evidence: normalizeEvidence(input.evidence),
    provenance: normalizeProvenance(input.provenance),
  }
}

function sameLaw(a: HumanLawRecord, b: HumanLawRecord): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function createHumanLawRegistry(): HumanLawRegistry {
  return {
    revision: 0,
    lawsById: {},
    statusHistoryByLawId: {},
    supersededByLawId: {},
  }
}

export function registerHumanLaw(
  registry: HumanLawRegistry,
  law: HumanLawRecord,
): HumanLawInsertResult {
  const normalized = normalizeLaw(law)
  const existing = registry.lawsById[normalized.id]
  if (existing) {
    if (!sameLaw(existing, normalized)) throw new Error(`conflicting law id ${normalized.id}`)
    return { registry, status: 'duplicate' }
  }

  const initialEvent: HumanLawStatusEvent = {
    from: null,
    to: 'generated',
    changedAt: normalized.provenance.createdAt,
    changedBy: normalized.provenance.createdBy.id,
    reason: 'registered',
    evidenceRefs: [],
  }

  return {
    status: 'inserted',
    registry: {
      ...registry,
      revision: registry.revision + 1,
      lawsById: { ...registry.lawsById, [normalized.id]: normalized },
      statusHistoryByLawId: {
        ...registry.statusHistoryByLawId,
        [normalized.id]: [initialEvent],
      },
    },
  }
}


export interface HumanLawTransitionInput {
  to: HumanLawStatus
  changedAt: string
  changedBy: string
  reason: string
  evidenceRefs: readonly string[]
}

const terminalStatuses = new Set<HumanLawStatus>([
  'rejected',
  'deprecated',
  'unresolved',
  'context-specific',
  'superseded',
  'scope-restricted',
])

const allowedTransitions: Readonly<Record<HumanLawStatus, readonly HumanLawStatus[]>> = {
  generated: ['candidate', 'rejected', 'unresolved', 'context-specific', 'scope-restricted'],
  candidate: ['reproduced', 'rejected', 'unresolved', 'context-specific', 'scope-restricted'],
  reproduced: ['mechanistically-supported', 'rejected', 'unresolved', 'context-specific', 'scope-restricted'],
  'mechanistically-supported': ['externally-validated', 'rejected', 'unresolved', 'context-specific', 'scope-restricted'],
  'externally-validated': ['accepted', 'rejected', 'unresolved', 'context-specific', 'scope-restricted'],
  accepted: ['deprecated', 'superseded', 'scope-restricted'],
  rejected: [],
  deprecated: [],
  unresolved: [],
  'context-specific': [],
  superseded: [],
  'scope-restricted': [],
}

const evidenceRequiredStatuses = new Set<HumanLawStatus>([
  'reproduced',
  'mechanistically-supported',
  'externally-validated',
  'accepted',
])

export function transitionHumanLaw(
  registry: HumanLawRegistry,
  lawId: string,
  input: HumanLawTransitionInput,
): HumanLawRegistry {
  const id = nonBlank(lawId, 'lawId')
  const law = registry.lawsById[id]
  if (!law) throw new Error(`unknown law id ${id}`)
  if (terminalStatuses.has(law.status)) throw new Error(`law ${id} is in terminal status ${law.status}`)
  if (input.to === 'superseded') {
    throw new Error('superseded transition must use supersedeHumanLaw to preserve lineage')
  }
  if (!allowedTransitions[law.status].includes(input.to)) {
    throw new Error(`invalid transition ${law.status} -> ${input.to}`)
  }

  const changedAt = parseIso(input.changedAt, 'changedAt')
  const changedBy = nonBlank(input.changedBy, 'changedBy')
  const reason = nonBlank(input.reason, 'reason')
  const evidenceRefs = uniqueRefs(input.evidenceRefs, 'evidenceRefs')
  if (evidenceRequiredStatuses.has(input.to) && evidenceRefs.length === 0) {
    throw new Error(`transition to ${input.to} requires evidence`)
  }

  const history = registry.statusHistoryByLawId[id]
  if (!history?.length) throw new Error(`law ${id} has no status history`)
  const latest = history[history.length - 1]
  if (Date.parse(changedAt) < Date.parse(latest.changedAt)) {
    throw new Error('changedAt must not be before the latest status transition')
  }

  const event: HumanLawStatusEvent = {
    from: law.status,
    to: input.to,
    changedAt,
    changedBy,
    reason,
    evidenceRefs,
  }
  const updatedLaw: HumanLawRecord = { ...law, status: input.to }

  return {
    ...registry,
    revision: registry.revision + 1,
    lawsById: { ...registry.lawsById, [id]: updatedLaw },
    statusHistoryByLawId: {
      ...registry.statusHistoryByLawId,
      [id]: [...history, event],
    },
  }
}


export interface HumanLawSupersessionInput {
  lawId: string
  replacementLawId: string
  changedAt: string
  changedBy: string
  reason: string
  evidenceRefs: readonly string[]
}

function assertSupersessionDoesNotCycle(
  registry: HumanLawRegistry,
  sourceId: string,
  replacementId: string,
): void {
  const visited = new Set<string>()
  let current: string | undefined = replacementId
  while (current) {
    if (current === sourceId) throw new Error('supersession cycle detected')
    if (visited.has(current)) throw new Error('supersession cycle detected')
    visited.add(current)
    const next: string | undefined = registry.supersededByLawId[current]
    if (next && !registry.lawsById[next]) {
      throw new Error(`supersession lineage references unknown law ${next}`)
    }
    current = next
  }
}

export function supersedeHumanLaw(
  registry: HumanLawRegistry,
  input: HumanLawSupersessionInput,
): HumanLawRegistry {
  const lawId = nonBlank(input.lawId, 'lawId')
  const replacementLawId = nonBlank(input.replacementLawId, 'replacementLawId')
  const source = registry.lawsById[lawId]
  if (!source) throw new Error(`unknown law id ${lawId}`)
  const replacement = registry.lawsById[replacementLawId]
  if (!replacement) throw new Error(`unknown replacement law id ${replacementLawId}`)
  if (lawId === replacementLawId) throw new Error('law cannot supersede itself')
  if (source.status !== 'accepted') throw new Error(`source law ${lawId} must be accepted before supersession`)
  if (replacement.status !== 'accepted') {
    throw new Error(`replacement law ${replacementLawId} must be accepted before supersession`)
  }
  if (registry.supersededByLawId[lawId]) throw new Error(`law ${lawId} is already superseded`)

  const changedAt = parseIso(input.changedAt, 'changedAt')
  const changedBy = nonBlank(input.changedBy, 'changedBy')
  const reason = nonBlank(input.reason, 'reason')
  const evidenceRefs = uniqueRefs(input.evidenceRefs, 'evidenceRefs')
  if (evidenceRefs.length === 0) throw new Error('supersession requires evidence')

  const history = registry.statusHistoryByLawId[lawId]
  if (!history?.length) throw new Error(`law ${lawId} has no status history`)
  const latest = history[history.length - 1]
  if (Date.parse(changedAt) < Date.parse(latest.changedAt)) {
    throw new Error('changedAt must not be before the latest status transition')
  }

  assertSupersessionDoesNotCycle(registry, lawId, replacementLawId)

  const event: HumanLawStatusEvent = {
    from: 'accepted',
    to: 'superseded',
    changedAt,
    changedBy,
    reason,
    evidenceRefs,
  }

  return {
    ...registry,
    revision: registry.revision + 1,
    lawsById: {
      ...registry.lawsById,
      [lawId]: { ...source, status: 'superseded' },
    },
    statusHistoryByLawId: {
      ...registry.statusHistoryByLawId,
      [lawId]: [...history, event],
    },
    supersededByLawId: {
      ...registry.supersededByLawId,
      [lawId]: replacementLawId,
    },
  }
}

export function getHumanLawLineage(
  registry: HumanLawRegistry,
  lawId: string,
): readonly string[] {
  const start = nonBlank(lawId, 'lawId')
  if (!registry.lawsById[start]) throw new Error(`unknown law id ${start}`)

  const lineage: string[] = []
  const visited = new Set<string>()
  let current: string | undefined = start

  while (current) {
    if (visited.has(current)) throw new Error('supersession cycle detected')
    if (!registry.lawsById[current]) {
      throw new Error(`supersession lineage references unknown law ${current}`)
    }
    visited.add(current)
    lineage.push(current)
    const next: string | undefined = registry.supersededByLawId[current]
    if (registry.lawsById[current].status === 'superseded' && !next) {
      throw new Error(`superseded law ${current} has missing supersession edge`)
    }
    current = next
  }

  return lineage
}
