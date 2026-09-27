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
  return refs.map((ref, index) => ({
    namespace: nonBlank(ref.namespace, `ontologyRefs[${index}].namespace`),
    version: nonBlank(ref.version, `ontologyRefs[${index}].version`),
    conceptIds: uniqueRefs(ref.conceptIds, `ontologyRefs[${index}].conceptIds`),
  }))
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
