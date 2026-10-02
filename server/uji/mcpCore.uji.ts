// Uji kontrak inti MCP Panaceamed.
// Test ini sengaja ditulis sebelum implementasi agar policy transport dan audit
// metadata terbukti gagal dulu bila kernel belum ada atau dilonggarkan.

import { authorizeTool } from '../src/mcp/policy.js'
import { buildAuditRecord } from '../src/mcp/audit.js'
import type { PanaceaToolDefinition } from '../src/mcp/types.js'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const qaTool: PanaceaToolDefinition = {
  name: 'panacea_repo_qa_run',
  title: 'Run allowlisted repository QA',
  description: 'Runs one named repository QA profile on a local development machine.',
  domain: 'repo-qa',
  transports: ['stdio'],
  sideEffect: 'local-test',
  clinicalRisk: 'none',
  maxInputBytes: 2048,
  timeoutMs: 120_000,
}

const localDecision = authorizeTool(qaTool, 'stdio')
ok('local-test tool diizinkan melalui stdio', localDecision.allowed === true)

const remoteDecision = authorizeTool(qaTool, 'http')
ok(
  'local-test tool ditolak melalui HTTP',
  remoteDecision.allowed === false && remoteDecision.code === 'policy_denied',
)

const audit = buildAuditRecord({
  requestId: 'req-001',
  toolName: 'panacea_fhir_inspect_resource',
  transport: 'http',
  input: {
    bearer: 'SECRET-TOKEN-DO-NOT-STORE',
    patient: { name: 'PATIENT-NAME-DO-NOT-STORE', identifier: 'PATIENT-ID-DO-NOT-STORE' },
    observation: { value: 'CLINICAL-VALUE-DO-NOT-STORE' },
  },
  outcome: 'success',
  startedAt: '2026-09-17T00:00:00.000Z',
  finishedAt: '2026-09-17T00:00:00.050Z',
})

const serialized = JSON.stringify(audit)
ok('audit menyimpan nama tool', audit.toolName === 'panacea_fhir_inspect_resource')
ok('audit menyimpan ukuran input', audit.inputSummary.bytes > 0)
ok('audit tidak menyimpan bearer value', !serialized.includes('SECRET-TOKEN-DO-NOT-STORE'))
ok('audit tidak menyimpan nama pasien', !serialized.includes('PATIENT-NAME-DO-NOT-STORE'))
ok('audit tidak menyimpan identifier pasien', !serialized.includes('PATIENT-ID-DO-NOT-STORE'))
ok('audit tidak menyimpan nilai klinis mentah', !serialized.includes('CLINICAL-VALUE-DO-NOT-STORE'))
ok('audit hanya merangkum bentuk object', audit.inputSummary.kind === 'object')
ok('audit dapat menyimpan daftar key tanpa value', audit.inputSummary.keys?.includes('patient') === true)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
