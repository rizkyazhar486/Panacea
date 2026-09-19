import assert from 'node:assert/strict'
import {
  createDurableAgentKnowledgeRecord,
  resolveAgentEvidenceConflict,
} from '../src/mcp/agentKnowledge.js'
import {
  appendAgentToolTrace,
  createAgentExecutionTrace,
  finalizeAgentExecutionTrace,
} from '../src/mcp/agentTrace.js'

const record = createDurableAgentKnowledgeRecord({
  id: 'decision-1',
  kind: 'architecture-constraint',
  title: 'One longitudinal source of truth',
  summary: 'AI-EMR projections reuse the canonical longitudinal event state rather than creating a second patient store.',
  evidence: [{ authority: 'system-of-record', ref: 'src/lib/panaceaLongitudinalState.ts' }],
  createdAt: '2026-09-19T08:00:00Z',
})
assert.equal(record.repositorySourceOfTruth, true)
assert.equal(record.containsRawPhi, false)
assert.equal(record.containsCredentials, false)
assert.equal(Object.isFrozen(record), true)

assert.throws(
  () => createDurableAgentKnowledgeRecord({
    id: 'unsafe-phi',
    kind: 'decision',
    title: 'Unsafe',
    summary: 'Do not persist this',
    createdAt: '2026-09-19T08:00:00Z',
    containsRawPhi: true,
  }),
  /raw PHI/,
)
assert.throws(
  () => createDurableAgentKnowledgeRecord({
    id: 'unsafe-secret',
    kind: 'failure-lesson',
    title: 'Leaked key',
    summary: 'api_key=super-secret-value-that-must-not-persist',
    createdAt: '2026-09-19T08:00:00Z',
  }),
  /credential-like/,
)

const authoritative = resolveAgentEvidenceConflict([
  { authority: 'secondary-source', source: 'blog', value: 'old' },
  { authority: 'system-of-record', source: 'runtime-db', value: 'current' },
])
assert.equal(authoritative.status, 'resolved')
if (authoritative.status === 'resolved') assert.equal(authoritative.selected.value, 'current')

const conflict = resolveAgentEvidenceConflict([
  { authority: 'official-documentation', source: 'official-a', value: 'A' },
  { authority: 'official-documentation', source: 'official-b', value: 'B' },
])
assert.equal(conflict.status, 'conflict')

let trace = createAgentExecutionTrace({
  traceId: 'trace-1',
  sessionId: 'session-1',
  intent: 'medical-evidence',
  model: { provider: 'openai', model: 'test-model', version: '1' },
  permissionTier: 'read-analyze',
  selectedCapabilityIds: ['literature', 'citation-verifier'],
  startedAt: '2026-09-19T08:00:00Z',
})
trace = appendAgentToolTrace(trace, {
  id: 'tool-1',
  capabilityId: 'literature',
  toolName: 'search',
  startedAt: '2026-09-19T08:00:01Z',
  completedAt: '2026-09-19T08:00:03Z',
  outcome: 'success',
  retrievalProvenance: [{ source: 'PubMed', locator: 'PMID:123', authority: 'structured-evidence' }],
})
assert.equal(trace.toolCalls[0].latencyMs, 2000)

trace = finalizeAgentExecutionTrace(trace, {
  completedAt: '2026-09-19T08:00:05Z',
  status: 'completed',
  usage: { inputTokens: 100, outputTokens: 50, costUsd: 0.01 },
  evaluations: [{ metric: 'groundedness', value: 1, threshold: 0.9, passed: true }],
  feedback: [{ source: 'automated-regression', signal: 'positive' }],
  safetyFlags: ['clinical-evidence'],
  clinicalEscalation: true,
})
assert.equal(trace.status, 'completed')
assert.equal(trace.toolCalls.length, 1)
assert.equal(trace.storesRawPrompt, false)
assert.equal(trace.storesRawPhi, false)
assert.equal(trace.clinicalEscalation, true)

console.log('MCP Agent OS durable knowledge, evidence precedence, and trace schema: ok')
