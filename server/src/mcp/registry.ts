import type { PanaceaToolDefinition } from './types.js'

const TOOL_DEFINITIONS: readonly PanaceaToolDefinition[] = Object.freeze([
  {
    name: 'panacea_capabilities',
    title: 'List Panaceamed MCP capabilities',
    description: 'Lists tools authorized for the current MCP transport.',
    domain: 'system',
    transports: ['stdio', 'http'],
    sideEffect: 'none',
    clinicalRisk: 'none',
    maxInputBytes: 1024,
    timeoutMs: 2_000,
  },
  {
    name: 'panacea_orchestration_create_task',
    title: 'Create an agent task packet',
    description: 'Builds a deterministic coordination packet for ChatGPT, Claude Code, or another explicit agent.',
    domain: 'orchestration',
    transports: ['stdio', 'http'],
    sideEffect: 'none',
    clinicalRisk: 'none',
    maxInputBytes: 16 * 1024,
    timeoutMs: 2_000,
  },
  {
    name: 'panacea_orchestration_create_handoff',
    title: 'Create an agent handoff packet',
    description: 'Builds a structured handoff containing work, checks, failures, risks, and next action.',
    domain: 'orchestration',
    transports: ['stdio', 'http'],
    sideEffect: 'none',
    clinicalRisk: 'none',
    maxInputBytes: 32 * 1024,
    timeoutMs: 2_000,
  },
  {
    name: 'panacea_orchestration_verify_completion',
    title: 'Verify completion evidence',
    description: 'Checks whether implemented, tested, PR, merge, and deployment claims have their required evidence.',
    domain: 'orchestration',
    transports: ['stdio', 'http'],
    sideEffect: 'none',
    clinicalRisk: 'none',
    maxInputBytes: 8 * 1024,
    timeoutMs: 2_000,
  },
  {
    name: 'panacea_repo_qa_plan',
    title: 'Plan allowlisted repository QA',
    description: 'Returns the fixed command plan for one approved local QA profile without executing it.',
    domain: 'repo-qa',
    transports: ['stdio'],
    sideEffect: 'local-read',
    clinicalRisk: 'none',
    maxInputBytes: 1024,
    timeoutMs: 2_000,
  },
  {
    name: 'panacea_repo_qa_run',
    title: 'Run allowlisted repository QA',
    description: 'Executes one approved local QA profile using fixed commands and shell:false.',
    domain: 'repo-qa',
    transports: ['stdio'],
    sideEffect: 'local-test',
    clinicalRisk: 'none',
    maxInputBytes: 1024,
    timeoutMs: 15 * 60_000,
  },
])

export function createPanaceaToolRegistry(): readonly PanaceaToolDefinition[] {
  return TOOL_DEFINITIONS
}

export function findPanaceaToolDefinition(name: string): PanaceaToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((definition) => definition.name === name)
}
