export type McpTransportKind = 'stdio' | 'http'

export type McpSideEffect = 'none' | 'local-read' | 'local-test'

export type McpClinicalRisk = 'none' | 'reference' | 'clinical-preview'

export type McpToolDomain =
  | 'system'
  | 'interoperability'
  | 'terminology'
  | 'evidence'
  | 'repo-qa'
  | 'orchestration'

export interface PanaceaToolDefinition {
  name: string
  title: string
  description: string
  domain: McpToolDomain
  transports: readonly McpTransportKind[]
  sideEffect: McpSideEffect
  clinicalRisk: McpClinicalRisk
  maxInputBytes: number
  timeoutMs: number
}

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; code: 'policy_denied' }

export type PanaceaMcpErrorCode =
  | 'invalid_input'
  | 'payload_too_large'
  | 'unsupported_message_type'
  | 'unsupported_code_system'
  | 'unmapped_terminology'
  | 'upstream_timeout'
  | 'upstream_unavailable'
  | 'policy_denied'
  | 'qa_profile_not_allowed'
  | 'clinical_action_not_exposed'
  | 'tool_not_found'
  | 'tool_timeout'
  | 'tool_failed'

export interface PanaceaMcpError {
  code: PanaceaMcpErrorCode
  message: string
  retryable?: boolean
}

export interface PanaceaToolContext {
  transport: McpTransportKind
  requestId: string
  signal?: AbortSignal
}

export type PanaceaToolResult<T = unknown> =
  | {
      ok: true
      data: T
      warnings?: string[]
      provenance?: Record<string, string>
    }
  | {
      ok: false
      error: PanaceaMcpError
      warnings?: string[]
    }
