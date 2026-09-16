import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { StdioServerTransport } from '@modelcontextprotocol/server'
import { createPanaceaMcpServer } from './serverFactory.js'

export function defaultMcpRepoRoot(): string {
  return resolve(fileURLToPath(new URL('../../..', import.meta.url)))
}

export async function startStdioMcp(
  options: { repoRoot?: string } = {},
): Promise<void> {
  const repoRoot = resolve(options.repoRoot ?? defaultMcpRepoRoot())
  const server = createPanaceaMcpServer('stdio', { repoRoot })
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

function isEntrypoint(): boolean {
  const argv = process.argv[1]
  if (!argv) return false
  return import.meta.url === pathToFileURL(resolve(argv)).href
}

if (isEntrypoint()) {
  startStdioMcp().catch((error) => {
    const message = error instanceof Error ? error.message : 'unknown MCP stdio failure'
    process.stderr.write(`[panaceamed-mcp] ${message}\n`)
    process.exitCode = 1
  })
}
