import assert from 'node:assert/strict'
import { buildOrganCoverageReport } from '../../src/lib/anatomy/organCoverageGate.ts'
import type { AtlasGeometryStatus, AtlasManifest, AtlasNode } from '../../src/lib/anatomy/atlasKernel.ts'

function organ(id: string, geometryStatus: AtlasGeometryStatus): AtlasNode {
  return {
    id,
    label: id,
    system: 'sensory',
    regions: ['head'],
    laterality: 'paired',
    scale: 'organ',
    source: { mode: 'specific-fallback', nodeHints: [id] },
    provenance: {
      sourceId: 'test-source',
      sourceRevision: 'test-revision-1',
      license: 'test',
      sourceLocator: 'test',
      reviewStatus: 'academic-review-required',
    },
    geometryStatus,
    educationalPriority: 0.5,
  }
}

const manifest: AtlasManifest = {
  id: 'organ-coverage-ranking-regression',
  revision: '1',
  nodes: [
    organ('sensory:ears', 'partial'),
    organ('ear:inner-ear', 'shipped'),
  ],
}

const report = buildOrganCoverageReport(manifest)
const ears = report.entries.find((entry) => entry.id === 'ears')
assert.ok(ears, 'ears coverage requirement must exist')
assert.equal(
  ears.status,
  'shipped',
  'a partial first alias must not mask a later shipped accepted organ candidate',
)
assert.equal(
  ears.matchedNodeId,
  'ear:inner-ear',
  'coverage must report the strongest accepted organ candidate',
)

const partialOnly = buildOrganCoverageReport({
  ...manifest,
  nodes: [organ('sensory:ears', 'partial')],
}).entries.find((entry) => entry.id === 'ears')
assert.equal(partialOnly?.status, 'partial')
assert.equal(partialOnly?.matchedNodeId, 'sensory:ears')

const wrongScale: AtlasManifest = {
  ...manifest,
  nodes: [{ ...organ('ear:inner-ear', 'shipped'), scale: 'suborgan' }],
}
const missing = buildOrganCoverageReport(wrongScale).entries.find((entry) => entry.id === 'ears')
assert.equal(missing?.status, 'missing', 'non-organ candidates must not satisfy macro-organ coverage')
assert.equal(missing?.matchedNodeId, undefined)

console.log('organ coverage: strongest accepted organ candidate wins without weakening scale or geometry gates')
