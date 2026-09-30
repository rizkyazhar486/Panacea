import assert from 'node:assert/strict'
import { routeAgentTask, type AgentCapability } from '../src/mcp/agentOs.js'

const capabilities: AgentCapability[] = [
  { id: 'repo-suite', roles: ['repository-context', 'repo-validation'], permissionTier: 'read-analyze', overlapFamily: 'repo', priority: 1 },
  { id: 'literature', roles: ['literature-discovery'], permissionTier: 'read-analyze', overlapFamily: 'lit-search', priority: 1 },
  { id: 'citation', roles: ['citation-verification'], permissionTier: 'read-analyze', overlapFamily: 'lit-verify', priority: 1 },
  { id: 'body', roles: ['body-3d'], permissionTier: 'reversible-draft', overlapFamily: 'body', priority: 1 },
]

const golden = [
  { name: 'feature', intent: 'feature', expected: ['repo-suite'], permission: 'read-analyze' },
  { name: 'bug', intent: 'bug', expected: ['repo-suite'], permission: 'read-analyze' },
  { name: 'medical evidence', intent: 'medical-evidence', expected: ['literature', 'citation'], permission: 'read-analyze' },
  { name: 'Body 3D', intent: 'body-3d', expected: ['repo-suite', 'body'], permission: 'reversible-draft' },
]

for (const fixture of golden) {
  const decision = routeAgentTask({ intent: fixture.intent, capabilities })
  assert.deepEqual(decision.selectedCapabilityIds, fixture.expected, `${fixture.name} route regressed`)
  assert.equal(decision.permissionTier, fixture.permission, `${fixture.name} permission regressed`)
  assert.equal(decision.requiresExplicitAuthorization, false)
  assert.ok(decision.rationale.length >= 3)
}

console.log('MCP Agent OS golden routing cases: feature, bug, medical-evidence, Body/3D ok')
