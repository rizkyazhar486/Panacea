import assert from 'node:assert/strict'
import {
  AgentRoutingError,
  routeAgentTask,
  type AgentCapability,
} from '../src/mcp/agentOs.js'

const capabilities: AgentCapability[] = [
  {
    id: 'repo-suite',
    roles: ['repository-context', 'repo-validation'],
    permissionTier: 'read-analyze',
    overlapFamily: 'repository',
    priority: 20,
  },
  {
    id: 'repo-reader',
    roles: ['repository-context'],
    permissionTier: 'read-analyze',
    overlapFamily: 'repository-reader',
    priority: 1,
  },
  {
    id: 'literature-discovery-primary',
    roles: ['literature-discovery'],
    permissionTier: 'read-analyze',
    overlapFamily: 'literature-discovery',
    priority: 1,
  },
  {
    id: 'literature-discovery-secondary',
    roles: ['literature-discovery'],
    permissionTier: 'read-analyze',
    overlapFamily: 'literature-discovery',
    priority: 2,
  },
  {
    id: 'citation-verifier',
    roles: ['citation-verification'],
    permissionTier: 'read-analyze',
    overlapFamily: 'literature-verification',
    priority: 1,
  },
  {
    id: 'body-renderer',
    roles: ['body-3d'],
    permissionTier: 'reversible-draft',
    overlapFamily: 'body-3d',
    priority: 1,
  },
  {
    id: 'model-evaluator',
    roles: ['model-evaluation'],
    permissionTier: 'read-analyze',
    overlapFamily: 'model-evaluation',
  },
  {
    id: 'model-governance',
    roles: ['model-governance'],
    permissionTier: 'read-analyze',
    overlapFamily: 'model-governance',
  },
  {
    id: 'architecture-reader',
    roles: ['architecture-analysis'],
    permissionTier: 'read-analyze',
    overlapFamily: 'architecture',
  },
  {
    id: 'browser',
    roles: ['browser-operation'],
    permissionTier: 'privileged-external-action',
    overlapFamily: 'browser',
  },
  {
    id: 'analytics',
    roles: ['product-analytics'],
    permissionTier: 'read-analyze',
    overlapFamily: 'analytics',
  },
]

const feature = routeAgentTask({ intent: 'feature', capabilities })
assert.deepEqual(feature.selectedCapabilityIds, ['repo-suite'])
assert.equal(feature.permissionTier, 'read-analyze')
assert.equal(feature.requiresExplicitAuthorization, false)

const evidence = routeAgentTask({ intent: 'medical-evidence', capabilities })
assert.deepEqual(evidence.selectedCapabilityIds, ['literature-discovery-primary', 'citation-verifier'])
assert.equal(
  evidence.rationale.some((item) => item.code === 'independent_verification'),
  true,
)

const body = routeAgentTask({ intent: 'body-3d', capabilities })
assert.deepEqual(body.selectedCapabilityIds, ['repo-suite', 'body-renderer'])
assert.equal(body.permissionTier, 'reversible-draft')

const browser = routeAgentTask({ intent: 'browser-action', capabilities })
assert.deepEqual(browser.selectedCapabilityIds, ['browser'])
assert.equal(browser.permissionTier, 'privileged-external-action')
assert.equal(browser.requiresExplicitAuthorization, true)

const analytics = routeAgentTask({ intent: 'analytics', capabilities })
assert.deepEqual(analytics.selectedCapabilityIds, ['analytics'])

assert.throws(
  () =>
    routeAgentTask({
      intent: 'medical-evidence',
      capabilities: capabilities.filter((capability) => capability.id !== 'citation-verifier'),
    }),
  (error) =>
    error instanceof AgentRoutingError &&
    /independent citation-verification/.test(error.message),
)

assert.throws(
  () =>
    routeAgentTask({
      intent: 'feature',
      capabilities: [
        ...capabilities,
        {
          id: 'repo-suite',
          roles: ['repository-context'],
          permissionTier: 'read-analyze',
        },
      ],
    }),
  (error) => error instanceof AgentRoutingError && /duplicate capability id/.test(error.message),
)

const explicitlyEscalated = routeAgentTask({
  intent: 'feature',
  capabilities,
  requestedPermissionTier: 'scoped-reversible-write',
})
assert.equal(explicitlyEscalated.permissionTier, 'scoped-reversible-write')

console.log('MCP Agent OS capability router: ok')
