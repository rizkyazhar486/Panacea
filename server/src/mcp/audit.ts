import { Buffer } from 'node:buffer'
import type { McpTransportKind } from './types.js'

export interface McpInputSummary {
  kind: 'null' | 'array' | 'object' | 'string' | 'number' | 'boolean' | 'other'
  bytes: number
  keys?: string[]
  itemCount?: number
}

export interface BuildAuditRecordInput {
  requestId: string
  toolName: string
  transport: McpTransportKind
  input: unknown
  outcome: 'success' | 'error'
  errorCode?: string
  startedAt: string
  finishedAt: string
}

export interface McpAuditRecord {
  requestId: string
  toolName: string
  transport: McpTransportKind
  inputSummary: McpInputSummary
  outcome: 'success' | 'error'
  errorCode?: string
  startedAt: string
  finishedAt: string
  durationMs: number | null
}

function serializedBytes(value: unknown): number {
  try {
    const serialized = JSON.stringify(value)
    return typeof serialized === 'string' ? Buffer.byteLength(serialized, 'utf8') : 0
  } catch {
    return 0
  }
}

function summarizeInput(input: unknown): McpInputSummary {
  const bytes = serializedBytes(input)
  if (input === null) return { kind: 'null', bytes }
  if (Array.isArray(input)) return { kind: 'array', bytes, itemCount: input.length }

  switch (typeof input) {
    case 'object':
      return {
        kind: 'object',
        bytes,
        keys: Object.keys(input as Record<string, unknown>).slice(0, 50).sort(),
      }
    case 'string':
      return { kind: 'string', bytes }
    case 'number':
      return { kind: 'number', bytes }
    case 'boolean':
      return { kind: 'boolean', bytes }
    default:
      return { kind: 'other', bytes }
  }
}

function durationMs(startedAt: string, finishedAt: string): number | null {
  const start = Date.parse(startedAt)
  const finish = Date.parse(finishedAt)
  if (!Number.isFinite(start) || !Number.isFinite(finish) || finish < start) return null
  return finish - start
}

export function buildAuditRecord(input: BuildAuditRecordInput): McpAuditRecord {
  return {
    requestId: input.requestId,
    toolName: input.toolName,
    transport: input.transport,
    inputSummary: summarizeInput(input.input),
    outcome: input.outcome,
    errorCode: input.errorCode,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    durationMs: durationMs(input.startedAt, input.finishedAt),
  }
}
