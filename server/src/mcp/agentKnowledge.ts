export type AgentKnowledgeKind =
  | 'decision'
  | 'failure-lesson'
  | 'architecture-constraint'
  | 'unresolved-strategy'

export type AgentKnowledgeEvidenceAuthority =
  | 'system-of-record'
  | 'runtime-observation'
  | 'official-documentation'
  | 'structured-evidence'
  | 'secondary-source'
  | 'model-inference'

export interface AgentKnowledgeEvidenceRef {
  authority: AgentKnowledgeEvidenceAuthority
  ref: string
  note?: string
}

export interface DurableAgentKnowledgeRecord {
  id: string
  kind: AgentKnowledgeKind
  title: string
  summary: string
  evidence: readonly AgentKnowledgeEvidenceRef[]
  createdAt: string
  updatedAt: string
  durability: 'durable'
  repositorySourceOfTruth: true
  containsRawPhi: false
  containsCredentials: false
}

export interface CreateDurableAgentKnowledgeInput {
  id: string
  kind: AgentKnowledgeKind
  title: string
  summary: string
  evidence?: readonly AgentKnowledgeEvidenceRef[]
  createdAt: string
  updatedAt?: string
  containsRawPhi?: boolean
  containsCredentials?: boolean
}

export interface AgentEvidenceClaim<T = unknown> {
  authority: AgentKnowledgeEvidenceAuthority
  source: string
  value: T
}

export type AgentEvidenceResolution<T = unknown> =
  | {
      status: 'resolved'
      selected: AgentEvidenceClaim<T>
      competing: readonly AgentEvidenceClaim<T>[]
    }
  | {
      status: 'conflict'
      strongest: readonly AgentEvidenceClaim<T>[]
      lowerAuthority: readonly AgentEvidenceClaim<T>[]
    }

const AUTHORITY_RANK: Record<AgentKnowledgeEvidenceAuthority, number> = {
  'system-of-record': 0,
  'runtime-observation': 1,
  'official-documentation': 2,
  'structured-evidence': 3,
  'secondary-source': 4,
  'model-inference': 5,
}

const SECRET_PATTERN =
  /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{12,}|\bBearer\s+[A-Za-z0-9._~-]{12,}|\b(?:password|passwd|client_secret|api[_-]?key)\s*[:=])/i

function text(value: string, field: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) throw new Error(`${field} must not be blank`)
  return normalized
}

function timestamp(value: string, field: string): string {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid timestamp`)
  return new Date(parsed).toISOString()
}

function evidenceRef(value: AgentKnowledgeEvidenceRef, index: number): AgentKnowledgeEvidenceRef {
  return {
    authority: value.authority,
    ref: text(value.ref, `evidence[${index}].ref`),
    note: value.note?.replace(/\s+/g, ' ').trim() || undefined,
  }
}

/**
 * Creates a repository-owned durable knowledge record.
 *
 * Callers must explicitly attest that no raw PHI or credentials are present.
 * The compact shape deliberately has no arbitrary payload field, raw prompt,
 * transcript, token, secret, or patient-data slot. External memory systems may
 * mirror this record, but they are adapters rather than Panacea's source of truth.
 */
export function createDurableAgentKnowledgeRecord(
  input: CreateDurableAgentKnowledgeInput,
): DurableAgentKnowledgeRecord {
  if (input.containsRawPhi === true) throw new Error('raw PHI must not enter durable agent knowledge')
  if (input.containsCredentials === true) throw new Error('credentials must not enter durable agent knowledge')

  const id = text(input.id, 'id')
  const title = text(input.title, 'title')
  const summary = text(input.summary, 'summary')
  if (SECRET_PATTERN.test(`${title} ${summary}`)) {
    throw new Error('credential-like content must not enter durable agent knowledge')
  }

  const createdAt = timestamp(input.createdAt, 'createdAt')
  const updatedAt = timestamp(input.updatedAt ?? input.createdAt, 'updatedAt')
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    throw new Error('updatedAt must not be earlier than createdAt')
  }

  return Object.freeze({
    id,
    kind: input.kind,
    title,
    summary,
    evidence: Object.freeze((input.evidence ?? []).map(evidenceRef)),
    createdAt,
    updatedAt,
    durability: 'durable',
    repositorySourceOfTruth: true,
    containsRawPhi: false,
    containsCredentials: false,
  })
}

/**
 * Resolves evidence by authority instead of averaging contradictory facts.
 * Equal-authority conflicting values remain an explicit conflict.
 */
export function resolveAgentEvidenceConflict<T>(
  claims: readonly AgentEvidenceClaim<T>[],
): AgentEvidenceResolution<T> {
  if (!claims.length) throw new Error('at least one evidence claim is required')
  const normalized = claims.map((claim, index) => ({
    ...claim,
    source: text(claim.source, `claims[${index}].source`),
  }))
  const bestRank = Math.min(...normalized.map((claim) => AUTHORITY_RANK[claim.authority]))
  const strongest = normalized.filter((claim) => AUTHORITY_RANK[claim.authority] === bestRank)
  const lowerAuthority = normalized.filter((claim) => AUTHORITY_RANK[claim.authority] !== bestRank)

  const firstSerialized = JSON.stringify(strongest[0].value)
  const disagree = strongest.some((claim) => JSON.stringify(claim.value) !== firstSerialized)
  if (disagree) {
    return {
      status: 'conflict',
      strongest,
      lowerAuthority,
    }
  }

  return {
    status: 'resolved',
    selected: strongest[0],
    competing: [...strongest.slice(1), ...lowerAuthority],
  }
}
