// Uji packet orkestrasi ChatGPT <-> Claude Code.
// State implementasi, pengujian, PR, merge, dan deployment wajib terpisah agar
// satu agent tidak bisa mengklaim tahap yang belum punya evidence.

import {
  createTaskPacket,
  createHandoffPacket,
  verifyCompletionEvidence,
} from '../src/mcp/orchestration.js'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

function throwsInvalid(nama: string, fn: () => unknown) {
  try {
    fn()
    ok(nama, false, 'tidak melempar error')
  } catch (error) {
    ok(
      nama,
      error instanceof Error && 'code' in error && (error as Error & { code?: string }).code === 'invalid_input',
      error instanceof Error ? error.message : String(error),
    )
  }
}

const task = createTaskPacket({
  taskId: 'mcp-a-001',
  objective: 'Build the Panaceamed MCP kernel',
  owner: 'claude-code',
  baseMainSha: '2aa72e35592d9616f8d84997c064c571b1bd1304',
  branch: 'feat/panacea-mcp-core-20260917',
  scopedPaths: ['server/src/mcp', 'server/uji'],
  acceptanceCriteria: ['Targeted MCP tests pass', 'No direct main mutation'],
  requiredChecks: ['npm run uji:mcp', 'npm run typecheck'],
  createdAt: '2026-09-17T00:00:00.000Z',
})

ok('task mempertahankan base main SHA', task.baseMainSha === '2aa72e35592d9616f8d84997c064c571b1bd1304')
ok('task mempertahankan owner', task.owner === 'claude-code')
ok('task punya scope non-kosong', task.scopedPaths.length === 2)
ok('updatedAt awal sama dengan createdAt', task.updatedAt === task.createdAt)

throwsInvalid('SHA pendek ditolak', () => createTaskPacket({ ...task, baseMainSha: 'abc123' }))
throwsInvalid('scope kosong ditolak', () => createTaskPacket({ ...task, scopedPaths: [] }))
throwsInvalid('acceptance criteria kosong ditolak', () => createTaskPacket({ ...task, acceptanceCriteria: [] }))
throwsInvalid('branch main ditolak untuk task implementasi', () => createTaskPacket({ ...task, branch: 'main' }))
throwsInvalid('path traversal ditolak', () => createTaskPacket({ ...task, scopedPaths: ['../secret'] }))

const handoff = createHandoffPacket({
  taskId: task.taskId,
  workCompleted: ['Kernel contract tests created'],
  changedPaths: ['server/uji/mcpCore.uji.ts'],
  checksRun: [{ name: 'MCP Phase A', status: 'passed', evidence: 'run:35160711698' }],
  observedFailures: [],
  unresolvedRisks: ['Official SDK transport not wired yet'],
  evidenceNotes: ['RED and GREEN were both observed in CI'],
  nextPermittedAction: 'Write the next failing orchestration test',
  createdAt: '2026-09-17T00:05:00.000Z',
})
ok('handoff menunjuk task yang sama', handoff.taskId === task.taskId)
ok('handoff menyimpan next permitted action', handoff.nextPermittedAction.includes('failing'))

const onlyImplemented = verifyCompletionEvidence({
  implemented: true,
  tested: false,
  prOpen: false,
  merged: false,
  deployed: false,
})
ok('implemented tidak otomatis tested', onlyImplemented.ok && onlyImplemented.state.tested === false)

const testedWithoutSha = verifyCompletionEvidence({
  implemented: true,
  tested: true,
  prOpen: false,
  merged: false,
  deployed: false,
})
ok('tested tanpa tested-head evidence ditolak', !testedWithoutSha.ok && testedWithoutSha.missingEvidence.includes('testedHeadSha'))

const mergedWithoutEvidence = verifyCompletionEvidence({
  implemented: true,
  tested: true,
  testedHeadSha: 'd05e50e276659818c2b6c2337d31106db0f951be',
  prOpen: true,
  prUrl: 'https://github.com/rizkyazhar486/Panacea/pull/1754',
  merged: true,
  deployed: false,
})
ok('merged tanpa merge evidence ditolak', !mergedWithoutEvidence.ok && mergedWithoutEvidence.missingEvidence.includes('mergeEvidence'))

const deployedWithoutEvidence = verifyCompletionEvidence({
  implemented: true,
  tested: true,
  testedHeadSha: 'd05e50e276659818c2b6c2337d31106db0f951be',
  prOpen: true,
  prUrl: 'https://github.com/rizkyazhar486/Panacea/pull/1754',
  merged: true,
  mergeEvidence: 'merge-sha:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  deployed: true,
})
ok('deployed tanpa deployment evidence ditolak', !deployedWithoutEvidence.ok && deployedWithoutEvidence.missingEvidence.includes('deploymentEvidence'))

const complete = verifyCompletionEvidence({
  implemented: true,
  tested: true,
  testedHeadSha: 'd05e50e276659818c2b6c2337d31106db0f951be',
  prOpen: true,
  prUrl: 'https://github.com/rizkyazhar486/Panacea/pull/1754',
  merged: true,
  mergeEvidence: 'merge-sha:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  deployed: true,
  deploymentEvidence: 'render-deploy:12345',
})
ok('completion dengan evidence lengkap diterima', complete.ok === true)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
