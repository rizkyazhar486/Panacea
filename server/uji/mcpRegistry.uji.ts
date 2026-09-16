// Uji registry tool MCP Panaceamed.
// Registry adalah satu-satunya pintu dispatch: policy, batas payload, dan transport
// harus diperiksa sebelum handler apa pun dijalankan.

import { readFileSync } from 'node:fs'
import { createPanaceaToolRegistry } from '../src/mcp/registry.js'
import { executePanaceaTool } from '../src/mcp/tools.js'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const registry = createPanaceaToolRegistry()
const names = registry.map((tool) => tool.name)
ok('nama tool unik', new Set(names).size === names.length)
ok('registry berisi capability discovery', names.includes('panacea_capabilities'))
ok('registry berisi orchestration create task', names.includes('panacea_orchestration_create_task'))
ok('registry berisi repo QA plan', names.includes('panacea_repo_qa_plan'))
ok('registry berisi repo QA run', names.includes('panacea_repo_qa_run'))
ok('setiap tool punya transport', registry.every((tool) => tool.transports.length > 0))
ok('setiap tool punya payload limit', registry.every((tool) => tool.maxInputBytes > 0))
ok('setiap tool punya timeout', registry.every((tool) => tool.timeoutMs > 0))
ok('setiap tool punya risk metadata', registry.every((tool) => Boolean(tool.domain && tool.sideEffect && tool.clinicalRisk)))

const httpCapabilities = await executePanaceaTool(
  'panacea_capabilities',
  {},
  { transport: 'http', requestId: 'cap-http' },
)
ok('HTTP capability discovery berhasil', httpCapabilities.ok)
if (httpCapabilities.ok) {
  const data = httpCapabilities.data as { tools: Array<{ name: string }> }
  ok('HTTP tidak melihat repo QA run', !data.tools.some((tool) => tool.name === 'panacea_repo_qa_run'))
  ok('HTTP tidak melihat repo QA plan', !data.tools.some((tool) => tool.name === 'panacea_repo_qa_plan'))
  ok('HTTP melihat orchestration pure tool', data.tools.some((tool) => tool.name === 'panacea_orchestration_create_task'))
}

const deniedRemoteQa = await executePanaceaTool(
  'panacea_repo_qa_run',
  { profile: 'server_typecheck' },
  { transport: 'http', requestId: 'qa-http' },
)
ok('HTTP repo QA run fail-closed', !deniedRemoteQa.ok && deniedRemoteQa.error.code === 'policy_denied')

const unknown = await executePanaceaTool(
  'panacea_totally_unknown',
  {},
  { transport: 'stdio', requestId: 'unknown' },
)
ok('unknown tool fail-closed', !unknown.ok && unknown.error.code === 'tool_not_found')

const tooLarge = await executePanaceaTool(
  'panacea_capabilities',
  { padding: 'x'.repeat(10_000) },
  { transport: 'http', requestId: 'large' },
)
ok('payload terlalu besar ditolak sebelum handler', !tooLarge.ok && tooLarge.error.code === 'payload_too_large')

const qaPlan = await executePanaceaTool(
  'panacea_repo_qa_plan',
  { profile: 'server_typecheck' },
  { transport: 'stdio', requestId: 'plan', repoRoot: '/workspace/Panacea' },
)
ok('stdio repo QA plan berhasil dengan host repoRoot', qaPlan.ok)
if (qaPlan.ok) {
  const data = qaPlan.data as { steps: Array<{ executable: string; args: string[]; cwd: string }> }
  ok('QA plan command fixed', data.steps[0].executable === 'npm' && data.steps[0].args.join(' ') === 'run typecheck')
  ok('QA plan menggunakan host repoRoot', data.steps[0].cwd === '/workspace/Panacea/server')
}

const qaPlanNoRoot = await executePanaceaTool(
  'panacea_repo_qa_plan',
  { profile: 'server_typecheck' },
  { transport: 'stdio', requestId: 'plan-no-root' },
)
ok('QA plan tanpa host repoRoot ditolak', !qaPlanNoRoot.ok && qaPlanNoRoot.error.code === 'invalid_input')

const readme = readFileSync(new URL('../src/mcp/README.md', import.meta.url), 'utf8')
ok('README menyatakan remote MCP default off', readme.includes('Remote MCP is disabled by default'))
ok('README menyatakan tidak ada patient-record retrieval', readme.includes('No patient-record retrieval'))
ok('README menyatakan tidak ada arbitrary shell', readme.includes('No arbitrary shell'))
ok('README menyatakan tidak ada direct push main', readme.includes('No direct push to main'))

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
