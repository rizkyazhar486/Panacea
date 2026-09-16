import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'
import { createPanaceaToolRegistry } from './registry.js'
import { authorizeTool } from './policy.js'
import { executePanaceaTool } from './tools.js'
import type { McpTransportKind } from './types.js'

export interface PanaceaMcpServerOptions {
  repoRoot?: string
}

const checkSchema = z.object({
  name: z.string(),
  status: z.enum(['passed', 'failed', 'not-run']),
  evidence: z.string().optional(),
})

const schemaByTool = {
  panacea_capabilities: z.object({}),
  panacea_orchestration_create_task: z.object({
    taskId: z.string(),
    objective: z.string(),
    owner: z.enum(['chatgpt', 'claude-code', 'other']),
    baseMainSha: z.string(),
    branch: z.string(),
    scopedPaths: z.array(z.string()),
    acceptanceCriteria: z.array(z.string()),
    requiredChecks: z.array(z.string()),
    createdAt: z.string().optional(),
  }),
  panacea_orchestration_create_handoff: z.object({
    taskId: z.string(),
    workCompleted: z.array(z.string()),
    changedPaths: z.array(z.string()),
    checksRun: z.array(checkSchema),
    observedFailures: z.array(z.string()),
    unresolvedRisks: z.array(z.string()),
    evidenceNotes: z.array(z.string()),
    nextPermittedAction: z.string(),
    createdAt: z.string().optional(),
  }),
  panacea_orchestration_verify_completion: z.object({
    implemented: z.boolean(),
    tested: z.boolean(),
    testedHeadSha: z.string().optional(),
    prOpen: z.boolean(),
    prUrl: z.string().optional(),
    merged: z.boolean(),
    mergeEvidence: z.string().optional(),
    deployed: z.boolean(),
    deploymentEvidence: z.string().optional(),
  }),
  panacea_repo_qa_plan: z.object({
    profile: z.enum([
      'server_typecheck',
      'mcp_targeted_tests',
      'root_validators',
      'root_build',
      'server_full_tests',
    ]),
  }),
  panacea_repo_qa_run: z.object({
    profile: z.enum([
      'server_typecheck',
      'mcp_targeted_tests',
      'root_validators',
      'root_build',
      'server_full_tests',
    ]),
  }),
} as const

function schemaFor(name: keyof typeof schemaByTool) {
  return schemaByTool[name]
}

function mcpResult(result: Awaited<ReturnType<typeof executePanaceaTool>>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    ...(result.ok ? {} : { isError: true }),
  }
}

export function createPanaceaMcpServer(
  transport: McpTransportKind,
  options: PanaceaMcpServerOptions = {},
): McpServer {
  const server = new McpServer({ name: 'panaceamed-mcp', version: '0.1.0' })

  for (const definition of createPanaceaToolRegistry()) {
    if (!authorizeTool(definition, transport).allowed) continue
    const name = definition.name as keyof typeof schemaByTool
    const inputSchema = schemaFor(name)

    server.registerTool(
      definition.name,
      {
        description: definition.description,
        inputSchema,
      },
      async (input) => {
        const result = await executePanaceaTool(definition.name, input, {
          transport,
          requestId: randomUUID(),
          repoRoot: transport === 'stdio' ? options.repoRoot : undefined,
        })
        return mcpResult(result)
      },
    )
  }

  return server
}
