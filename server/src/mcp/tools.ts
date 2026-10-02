import { Buffer } from 'node:buffer'
import { createPanaceaToolRegistry, findPanaceaToolDefinition } from './registry.js'
import { authorizeTool } from './policy.js'
import {
  createTaskPacket,
  createHandoffPacket,
  verifyCompletionEvidence,
  PacketValidationError,
  type AgentOwner,
  type CompletionEvidenceInput,
  type CreateHandoffPacketInput,
  type CreateTaskPacketInput,
  type HandoffCheck,
} from './orchestration.js'
import {
  buildQaInvocation,
  runQaProfile,
  RepoQaError,
  type QaProfileName,
} from './repoQa.js'
import {
  buildObservationBundlePreview,
  buildSatusehatPreview,
  fhirMcpCapabilities,
  hl7v2ToFhirPreview,
  inspectFhirResource,
  parseHl7v2Preview,
  type ObservationBundlePreviewInput,
  type SatusehatPreviewInput,
} from './interoperability.js'
import {
  crosswalkTerminologyPreview,
  resolveTerminology,
  searchTerminology,
  type TerminologyCrosswalkInput,
  type TerminologyResolveInput,
  type TerminologySearchInput,
} from './terminology.js'
import type {
  PanaceaMcpError,
  PanaceaToolContext,
  PanaceaToolDefinition,
  PanaceaToolResult,
} from './types.js'

class ToolInputError extends Error {
  readonly code = 'invalid_input' as const

  constructor(message: string) {
    super(message)
    this.name = 'ToolInputError'
  }
}

class ToolTimeoutError extends Error {
  readonly code = 'tool_timeout' as const

  constructor(toolName: string) {
    super(`${toolName} exceeded its execution timeout`)
    this.name = 'ToolTimeoutError'
  }
}

function objectInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ToolInputError('Tool input must be an object')
  }
  return input as Record<string, unknown>
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new ToolInputError(`${field} must be a non-empty string`)
  return value.trim()
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined
  return requiredString(value, field)
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new ToolInputError(`${field} must be an array of strings`)
  }
  return value as string[]
}

function booleanField(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new ToolInputError(`${field} must be boolean`)
  return value
}

function ownerField(value: unknown): AgentOwner {
  if (value === 'chatgpt' || value === 'claude-code' || value === 'other') return value
  throw new ToolInputError('owner must be chatgpt, claude-code, or other')
}

function handoffChecks(value: unknown): HandoffCheck[] {
  if (!Array.isArray(value)) throw new ToolInputError('checksRun must be an array')
  return value.map((item, index) => {
    const record = objectInput(item)
    const status = record.status
    if (status !== 'passed' && status !== 'failed' && status !== 'not-run') {
      throw new ToolInputError(`checksRun[${index}].status is invalid`)
    }
    return {
      name: requiredString(record.name, `checksRun[${index}].name`),
      status,
      evidence: optionalString(record.evidence, `checksRun[${index}].evidence`),
    }
  })
}

function taskInput(input: unknown): CreateTaskPacketInput {
  const value = objectInput(input)
  return {
    taskId: requiredString(value.taskId, 'taskId'),
    objective: requiredString(value.objective, 'objective'),
    owner: ownerField(value.owner),
    baseMainSha: requiredString(value.baseMainSha, 'baseMainSha'),
    branch: requiredString(value.branch, 'branch'),
    scopedPaths: stringArray(value.scopedPaths, 'scopedPaths'),
    acceptanceCriteria: stringArray(value.acceptanceCriteria, 'acceptanceCriteria'),
    requiredChecks: stringArray(value.requiredChecks, 'requiredChecks'),
    createdAt: optionalString(value.createdAt, 'createdAt'),
  }
}

function handoffInput(input: unknown): CreateHandoffPacketInput {
  const value = objectInput(input)
  return {
    taskId: requiredString(value.taskId, 'taskId'),
    workCompleted: stringArray(value.workCompleted, 'workCompleted'),
    changedPaths: stringArray(value.changedPaths, 'changedPaths'),
    checksRun: handoffChecks(value.checksRun),
    observedFailures: stringArray(value.observedFailures, 'observedFailures'),
    unresolvedRisks: stringArray(value.unresolvedRisks, 'unresolvedRisks'),
    evidenceNotes: stringArray(value.evidenceNotes, 'evidenceNotes'),
    nextPermittedAction: requiredString(value.nextPermittedAction, 'nextPermittedAction'),
    createdAt: optionalString(value.createdAt, 'createdAt'),
  }
}

function completionInput(input: unknown): CompletionEvidenceInput {
  const value = objectInput(input)
  return {
    implemented: booleanField(value.implemented, 'implemented'),
    tested: booleanField(value.tested, 'tested'),
    testedHeadSha: optionalString(value.testedHeadSha, 'testedHeadSha'),
    prOpen: booleanField(value.prOpen, 'prOpen'),
    prUrl: optionalString(value.prUrl, 'prUrl'),
    merged: booleanField(value.merged, 'merged'),
    mergeEvidence: optionalString(value.mergeEvidence, 'mergeEvidence'),
    deployed: booleanField(value.deployed, 'deployed'),
    deploymentEvidence: optionalString(value.deploymentEvidence, 'deploymentEvidence'),
  }
}

function qaProfile(input: unknown): QaProfileName {
  const value = objectInput(input)
  return requiredString(value.profile, 'profile') as QaProfileName
}

function serializedInputBytes(input: unknown): number {
  try {
    const encoded = JSON.stringify(input)
    if (encoded === undefined) throw new ToolInputError('Tool input is not JSON serializable')
    return Buffer.byteLength(encoded, 'utf8')
  } catch (error) {
    if (error instanceof ToolInputError) throw error
    throw new ToolInputError('Tool input is not JSON serializable')
  }
}

function requireRepoRoot(context: PanaceaToolContext): string {
  if (!context.repoRoot) throw new ToolInputError('Local MCP host must provide repoRoot')
  return context.repoRoot
}

async function executeHandler(
  definition: PanaceaToolDefinition,
  input: unknown,
  context: PanaceaToolContext,
): Promise<unknown> {
  switch (definition.name) {
    case 'panacea_capabilities':
      return {
        transport: context.transport,
        tools: createPanaceaToolRegistry()
          .filter((tool) => authorizeTool(tool, context.transport).allowed)
          .map((tool) => ({
            name: tool.name,
            title: tool.title,
            description: tool.description,
            domain: tool.domain,
            sideEffect: tool.sideEffect,
            clinicalRisk: tool.clinicalRisk,
            maxInputBytes: tool.maxInputBytes,
            timeoutMs: tool.timeoutMs,
          })),
      }
    case 'panacea_orchestration_create_task':
      return createTaskPacket(taskInput(input))
    case 'panacea_orchestration_create_handoff':
      return createHandoffPacket(handoffInput(input))
    case 'panacea_orchestration_verify_completion':
      return verifyCompletionEvidence(completionInput(input))
    case 'panacea_fhir_capabilities':
      return fhirMcpCapabilities()
    case 'panacea_fhir_build_observation_bundle_preview':
      return buildObservationBundlePreview(
        objectInput(input) as unknown as ObservationBundlePreviewInput,
      )
    case 'panacea_fhir_inspect_resource': {
      const value = objectInput(input)
      return inspectFhirResource('resource' in value ? value.resource : value)
    }
    case 'panacea_fhir_satusehat_preview':
      return buildSatusehatPreview(
        objectInput(input) as unknown as SatusehatPreviewInput,
      )
    case 'panacea_hl7v2_parse_preview':
      return parseHl7v2Preview(requiredString(objectInput(input).message, 'message'))
    case 'panacea_hl7v2_to_fhir_preview':
      return hl7v2ToFhirPreview(requiredString(objectInput(input).message, 'message'))
    case 'panacea_terminology_search':
      return searchTerminology(
        objectInput(input) as unknown as TerminologySearchInput,
      )
    case 'panacea_terminology_resolve':
      return resolveTerminology(
        objectInput(input) as unknown as TerminologyResolveInput,
      )
    case 'panacea_terminology_crosswalk_preview':
      return crosswalkTerminologyPreview(
        objectInput(input) as unknown as TerminologyCrosswalkInput,
      )
    case 'panacea_repo_qa_plan':
      return buildQaInvocation(qaProfile(input), requireRepoRoot(context))
    case 'panacea_repo_qa_run':
      return runQaProfile(qaProfile(input), { repoRoot: requireRepoRoot(context) })
    default:
      throw new ToolInputError(`No handler is registered for ${definition.name}`)
  }
}

function errorFrom(error: unknown): PanaceaMcpError {
  if (error instanceof PacketValidationError) {
    return { code: 'invalid_input', message: error.message }
  }
  if (error instanceof RepoQaError) {
    return { code: error.code, message: error.message }
  }
  if (error instanceof ToolInputError || error instanceof ToolTimeoutError) {
    return { code: error.code, message: error.message }
  }
  return {
    code: 'tool_failed',
    message: error instanceof Error ? error.message : 'Unknown MCP tool failure',
  }
}

async function withTimeout<T>(toolName: string, timeoutMs: number, operation: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ToolTimeoutError(toolName)), timeoutMs)
  })
  try {
    return await Promise.race([operation, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function executePanaceaTool(
  name: string,
  input: unknown,
  context: PanaceaToolContext,
): Promise<PanaceaToolResult> {
  const definition = findPanaceaToolDefinition(name)
  if (!definition) {
    return { ok: false, error: { code: 'tool_not_found', message: `Unknown Panaceamed MCP tool: ${name}` } }
  }

  const policy = authorizeTool(definition, context.transport)
  if (!policy.allowed) {
    return { ok: false, error: { code: policy.code, message: `${name} is not allowed on ${context.transport}` } }
  }

  try {
    const bytes = serializedInputBytes(input)
    if (bytes > definition.maxInputBytes) {
      return {
        ok: false,
        error: {
          code: 'payload_too_large',
          message: `${name} input is ${bytes} bytes; maximum is ${definition.maxInputBytes}`,
        },
      }
    }

    const data = await withTimeout(
      name,
      definition.timeoutMs,
      executeHandler(definition, input, context),
    )
    return { ok: true, data }
  } catch (error) {
    return { ok: false, error: errorFrom(error) }
  }
}
