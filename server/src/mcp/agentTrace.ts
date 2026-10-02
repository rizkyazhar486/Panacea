import type {
  AgentPermissionTier,
  AgentTaskIntent,
} from './agentOs.js'

export type AgentTraceOutcome = 'success' | 'error' | 'blocked'

export interface AgentTraceModel {
  provider: string
  model: string
  version?: string
}

export interface AgentRetrievalProvenance {
  source: string
  locator?: string
  authority?: string
}

export interface AgentToolTrace {
  id: string
  capabilityId: string
  toolName: string
  startedAt: string
  completedAt: string
  latencyMs: number
  outcome: AgentTraceOutcome
  errorCode?: string
  retrievalProvenance: readonly AgentRetrievalProvenance[]
}

export interface AgentUsageTrace {
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
}

export interface AgentEvaluationTrace {
  metric: string
  value: number
  threshold?: number
  passed?: boolean
}

export interface AgentFeedbackTrace {
  source: 'user' | 'human-reviewer' | 'automated-regression'
  signal: 'positive' | 'negative' | 'neutral'
  note?: string
}

export interface AgentExecutionTrace {
  traceId: string
  sessionId: string
  intent: AgentTaskIntent
  model: AgentTraceModel
  permissionTier: AgentPermissionTier
  selectedCapabilityIds: readonly string[]
  startedAt: string
  completedAt?: string
  status: 'running' | 'completed' | 'blocked'
  toolCalls: readonly AgentToolTrace[]
  usage?: AgentUsageTrace
  evaluations: readonly AgentEvaluationTrace[]
  feedback: readonly AgentFeedbackTrace[]
  safetyFlags: readonly string[]
  clinicalEscalation: boolean
  storesRawPrompt: false
  storesRawPhi: false
}

export interface CreateAgentExecutionTraceInput {
  traceId: string
  sessionId: string
  intent: AgentTaskIntent
  model: AgentTraceModel
  permissionTier: AgentPermissionTier
  selectedCapabilityIds: readonly string[]
  startedAt: string
}

const idText = (value: string, field: string): string => {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} must not be blank`)
  return normalized
}

const iso = (value: string, field: string): string => {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid timestamp`)
  return new Date(parsed).toISOString()
}

const finiteNonNegative = (value: number | undefined, field: string): number | undefined => {
  if (value === undefined) return undefined
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be a finite non-negative number`)
  return value
}

export function createAgentExecutionTrace(
  input: CreateAgentExecutionTraceInput,
): AgentExecutionTrace {
  return {
    traceId: idText(input.traceId, 'traceId'),
    sessionId: idText(input.sessionId, 'sessionId'),
    intent: input.intent,
    model: {
      provider: idText(input.model.provider, 'model.provider'),
      model: idText(input.model.model, 'model.model'),
      version: input.model.version?.trim() || undefined,
    },
    permissionTier: input.permissionTier,
    selectedCapabilityIds: [...new Set(input.selectedCapabilityIds.map((id) => idText(id, 'selectedCapabilityIds')))],
    startedAt: iso(input.startedAt, 'startedAt'),
    status: 'running',
    toolCalls: [],
    evaluations: [],
    feedback: [],
    safetyFlags: [],
    clinicalEscalation: false,
    storesRawPrompt: false,
    storesRawPhi: false,
  }
}

export function appendAgentToolTrace(
  trace: AgentExecutionTrace,
  tool: Omit<AgentToolTrace, 'latencyMs'>,
): AgentExecutionTrace {
  const startedAt = iso(tool.startedAt, 'tool.startedAt')
  const completedAt = iso(tool.completedAt, 'tool.completedAt')
  const latencyMs = Date.parse(completedAt) - Date.parse(startedAt)
  if (latencyMs < 0) throw new Error('tool.completedAt must not precede tool.startedAt')

  const next: AgentToolTrace = {
    ...tool,
    id: idText(tool.id, 'tool.id'),
    capabilityId: idText(tool.capabilityId, 'tool.capabilityId'),
    toolName: idText(tool.toolName, 'tool.toolName'),
    startedAt,
    completedAt,
    latencyMs,
    errorCode: tool.errorCode?.trim() || undefined,
    retrievalProvenance: tool.retrievalProvenance.map((source, index) => ({
      source: idText(source.source, `retrievalProvenance[${index}].source`),
      locator: source.locator?.trim() || undefined,
      authority: source.authority?.trim() || undefined,
    })),
  }

  return { ...trace, toolCalls: [...trace.toolCalls, next] }
}

export function finalizeAgentExecutionTrace(
  trace: AgentExecutionTrace,
  input: {
    completedAt: string
    status: 'completed' | 'blocked'
    usage?: AgentUsageTrace
    evaluations?: readonly AgentEvaluationTrace[]
    feedback?: readonly AgentFeedbackTrace[]
    safetyFlags?: readonly string[]
    clinicalEscalation?: boolean
  },
): AgentExecutionTrace {
  const completedAt = iso(input.completedAt, 'completedAt')
  if (Date.parse(completedAt) < Date.parse(trace.startedAt)) {
    throw new Error('completedAt must not precede trace.startedAt')
  }
  const usage = input.usage
    ? {
        inputTokens: finiteNonNegative(input.usage.inputTokens, 'usage.inputTokens'),
        outputTokens: finiteNonNegative(input.usage.outputTokens, 'usage.outputTokens'),
        costUsd: finiteNonNegative(input.usage.costUsd, 'usage.costUsd'),
      }
    : undefined

  const evaluations = (input.evaluations ?? []).map((evaluation, index) => {
    if (!Number.isFinite(evaluation.value)) throw new Error(`evaluations[${index}].value must be finite`)
    if (evaluation.threshold !== undefined && !Number.isFinite(evaluation.threshold)) {
      throw new Error(`evaluations[${index}].threshold must be finite`)
    }
    return {
      ...evaluation,
      metric: idText(evaluation.metric, `evaluations[${index}].metric`),
    }
  })

  return {
    ...trace,
    completedAt,
    status: input.status,
    usage,
    evaluations,
    feedback: [...(input.feedback ?? [])],
    safetyFlags: [...new Set((input.safetyFlags ?? []).map((flag) => idText(flag, 'safetyFlags')))],
    clinicalEscalation: input.clinicalEscalation ?? false,
  }
}

export const AGENT_TRACE_STORAGE_BOUNDARY =
  'Agent traces contain operational metadata, tool provenance, aggregate usage/evaluation and feedback only. Raw prompts, credentials and raw PHI are outside this schema. PostHog or another telemetry provider may receive an adapter projection when configured; the repository contract remains the canonical schema.'
