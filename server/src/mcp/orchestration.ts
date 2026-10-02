export type AgentOwner = 'chatgpt' | 'claude-code' | 'other'

export class PacketValidationError extends Error {
  readonly code = 'invalid_input' as const
  readonly field: string

  constructor(field: string, message: string) {
    super(message)
    this.name = 'PacketValidationError'
    this.field = field
  }
}

export interface CreateTaskPacketInput {
  taskId: string
  objective: string
  owner: AgentOwner
  baseMainSha: string
  branch: string
  scopedPaths: string[]
  acceptanceCriteria: string[]
  requiredChecks: string[]
  createdAt?: string
}

export interface TaskPacket {
  taskId: string
  objective: string
  owner: AgentOwner
  baseMainSha: string
  branch: string
  scopedPaths: string[]
  acceptanceCriteria: string[]
  requiredChecks: string[]
  createdAt: string
  updatedAt: string
}

export interface HandoffCheck {
  name: string
  status: 'passed' | 'failed' | 'not-run'
  evidence?: string
}

export interface CreateHandoffPacketInput {
  taskId: string
  workCompleted: string[]
  changedPaths: string[]
  checksRun: HandoffCheck[]
  observedFailures: string[]
  unresolvedRisks: string[]
  evidenceNotes: string[]
  nextPermittedAction: string
  createdAt?: string
}

export interface HandoffPacket extends Omit<CreateHandoffPacketInput, 'createdAt'> {
  createdAt: string
}

export interface CompletionEvidenceInput {
  implemented: boolean
  tested: boolean
  testedHeadSha?: string
  prOpen: boolean
  prUrl?: string
  merged: boolean
  mergeEvidence?: string
  deployed: boolean
  deploymentEvidence?: string
}

export interface CompletionState {
  implemented: boolean
  tested: boolean
  prOpen: boolean
  merged: boolean
  deployed: boolean
}

export type CompletionVerification =
  | { ok: true; state: CompletionState }
  | { ok: false; state: CompletionState; missingEvidence: string[]; code: 'invalid_input' }

const SHA40 = /^[0-9a-f]{40}$/i

function text(value: string, field: string): string {
  const cleaned = value.trim()
  if (!cleaned) throw new PacketValidationError(field, `${field} must not be empty`)
  return cleaned
}

function iso(value: string | undefined, field: string): string {
  if (value === undefined) return new Date().toISOString()
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new PacketValidationError(field, `${field} must be an ISO timestamp`)
  return new Date(parsed).toISOString()
}

function stringList(values: string[], field: string, allowEmpty = false): string[] {
  if (!Array.isArray(values) || (!allowEmpty && values.length === 0)) {
    throw new PacketValidationError(field, `${field} must contain at least one item`)
  }
  return values.map((value, index) => text(value, `${field}[${index}]`))
}

function repoPath(value: string, field: string): string {
  const cleaned = text(value, field).replace(/\\/g, '/')
  if (cleaned.startsWith('/') || cleaned.split('/').some((part) => part === '..')) {
    throw new PacketValidationError(field, `${field} must be repository-relative without traversal`)
  }
  return cleaned.replace(/^\.\//, '')
}

function sha(value: string, field: string): string {
  const cleaned = text(value, field)
  if (!SHA40.test(cleaned)) throw new PacketValidationError(field, `${field} must be a 40-character git SHA`)
  return cleaned.toLowerCase()
}

export function createTaskPacket(input: CreateTaskPacketInput): TaskPacket {
  const branch = text(input.branch, 'branch')
  if (branch === 'main' || branch === 'master') {
    throw new PacketValidationError('branch', 'implementation tasks may not target main/master directly')
  }
  const createdAt = iso(input.createdAt, 'createdAt')
  return {
    taskId: text(input.taskId, 'taskId'),
    objective: text(input.objective, 'objective'),
    owner: input.owner,
    baseMainSha: sha(input.baseMainSha, 'baseMainSha'),
    branch,
    scopedPaths: stringList(input.scopedPaths, 'scopedPaths').map((path, index) => repoPath(path, `scopedPaths[${index}]`)),
    acceptanceCriteria: stringList(input.acceptanceCriteria, 'acceptanceCriteria'),
    requiredChecks: stringList(input.requiredChecks, 'requiredChecks'),
    createdAt,
    updatedAt: createdAt,
  }
}

export function createHandoffPacket(input: CreateHandoffPacketInput): HandoffPacket {
  const checksRun = Array.isArray(input.checksRun)
    ? input.checksRun.map((check, index) => ({
        name: text(check.name, `checksRun[${index}].name`),
        status: check.status,
        evidence: check.evidence?.trim() || undefined,
      }))
    : []

  return {
    taskId: text(input.taskId, 'taskId'),
    workCompleted: stringList(input.workCompleted, 'workCompleted', true),
    changedPaths: stringList(input.changedPaths, 'changedPaths', true).map((path, index) => repoPath(path, `changedPaths[${index}]`)),
    checksRun,
    observedFailures: stringList(input.observedFailures, 'observedFailures', true),
    unresolvedRisks: stringList(input.unresolvedRisks, 'unresolvedRisks', true),
    evidenceNotes: stringList(input.evidenceNotes, 'evidenceNotes', true),
    nextPermittedAction: text(input.nextPermittedAction, 'nextPermittedAction'),
    createdAt: iso(input.createdAt, 'createdAt'),
  }
}

export function verifyCompletionEvidence(input: CompletionEvidenceInput): CompletionVerification {
  const state: CompletionState = {
    implemented: input.implemented,
    tested: input.tested,
    prOpen: input.prOpen,
    merged: input.merged,
    deployed: input.deployed,
  }
  const missingEvidence: string[] = []

  if (input.tested && (!input.testedHeadSha || !SHA40.test(input.testedHeadSha.trim()))) {
    missingEvidence.push('testedHeadSha')
  }
  if (input.prOpen && !input.prUrl?.trim()) missingEvidence.push('prUrl')
  if (input.merged && !input.mergeEvidence?.trim()) missingEvidence.push('mergeEvidence')
  if (input.deployed && !input.deploymentEvidence?.trim()) missingEvidence.push('deploymentEvidence')

  if (missingEvidence.length) {
    return { ok: false, state, missingEvidence, code: 'invalid_input' }
  }
  return { ok: true, state }
}
