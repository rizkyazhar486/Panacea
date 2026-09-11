import assert from 'node:assert/strict'
import { REQUIRED_MACRO_ORGANS, buildOrganCoverageReport } from '../../src/lib/anatomy/organCoverageGate.ts'

assert.ok(REQUIRED_MACRO_ORGANS.length >= 40, 'organ coverage ledger must remain broad enough to prevent false completeness')
assert.equal(new Set(REQUIRED_MACRO_ORGANS.map((entry) => entry.id)).size, REQUIRED_MACRO_ORGANS.length, 'organ coverage ids must be unique')

for (const entry of REQUIRED_MACRO_ORGANS) {
  assert.ok(entry.label.trim().length > 0, `${entry.id} requires a human-readable label`)
  assert.ok(entry.acceptedNodeIds.length > 0, `${entry.id} requires at least one canonical atlas node candidate`)
  assert.equal(new Set(entry.acceptedNodeIds).size, entry.acceptedNodeIds.length, `${entry.id} accepted node ids must be unique`)
}

const synthetic = {
  id: 'synthetic-organ-coverage-test',
  revision: 'test',
  nodes: REQUIRED_MACRO_ORGANS.flatMap((entry, index) => {
    if (index === 0) {
      return [{
        id: entry.acceptedNodeIds[0], label: entry.label, system: entry.system,
        regions: ['whole-body'], laterality: 'not-applicable', scale: 'organ',
        source: { mode: 'specific-fallback', nodeHints: [entry.label] },
        geometryStatus: 'partial', educationalPriority: 1,
        provenance: { sourceId: 'test', sourceRevision: 'test', license: 'test', sourceLocator: 'test', reviewStatus: 'academic-review-required', reviewerScope: 'test' },
      }]
    }
    if (index === 1) return []
    if (index === 2) {
      return [{
        id: entry.acceptedNodeIds[0], label: entry.label, system: entry.system,
        regions: ['whole-body'], laterality: 'not-applicable', scale: 'suborgan',
        source: { mode: 'specific-fallback', nodeHints: [entry.label] },
        geometryStatus: 'shipped', educationalPriority: 1,
        provenance: { sourceId: 'test', sourceRevision: 'test', license: 'test', sourceLocator: 'test', reviewStatus: 'academic-review-required', reviewerScope: 'test' },
      }]
    }
    return [{
      id: entry.acceptedNodeIds[0], label: entry.label, system: entry.system,
      regions: ['whole-body'], laterality: 'not-applicable', scale: 'organ',
      source: { mode: 'specific-fallback', nodeHints: [entry.label] },
      geometryStatus: 'shipped', educationalPriority: 1,
      provenance: { sourceId: 'test', sourceRevision: 'test', license: 'test', sourceLocator: 'test', reviewStatus: 'academic-review-required', reviewerScope: 'test' },
    }]
  }),
} as const

const report = buildOrganCoverageReport(synthetic as never)
assert.equal(report.complete, false, 'partial, wrong-scale or missing organ coverage must fail closed')
assert.equal(report.partial, 1, 'partial geometry must remain visible as a blocker')
assert.equal(report.missing, 1, 'missing canonical organ must remain visible as a blocker')
assert.equal(report.wrongScale, 1, 'known canonical IDs at the wrong biological scale must not be misreported as missing')
assert.equal(report.referenceOnly, 0)
assert.equal(report.shipped, REQUIRED_MACRO_ORGANS.length - 3)
assert.equal(report.entries.length, REQUIRED_MACRO_ORGANS.length)

const wrongScaleEntry = report.entries[2]
assert.ok(wrongScaleEntry)
assert.equal(wrongScaleEntry.status, 'wrong-scale')
assert.equal(wrongScaleEntry.matchedNodeId, REQUIRED_MACRO_ORGANS[2]?.acceptedNodeIds[0])
assert.equal(wrongScaleEntry.matchedNodeScale, 'suborgan')

const allShipped = {
  ...synthetic,
  nodes: REQUIRED_MACRO_ORGANS.map((entry) => ({
    id: entry.acceptedNodeIds[0], label: entry.label, system: entry.system,
    regions: ['whole-body'], laterality: 'not-applicable', scale: 'organ',
    source: { mode: 'specific-fallback', nodeHints: [entry.label] },
    geometryStatus: 'shipped', educationalPriority: 1,
    provenance: { sourceId: 'test', sourceRevision: 'test', license: 'test', sourceLocator: 'test', reviewStatus: 'academic-review-required', reviewerScope: 'test' },
  })),
} as const

const complete = buildOrganCoverageReport(allShipped as never)
assert.equal(complete.complete, true, 'only all-shipped organ coverage may pass')
assert.equal(complete.shipped, REQUIRED_MACRO_ORGANS.length)
assert.equal(complete.partial, 0)
assert.equal(complete.referenceOnly, 0)
assert.equal(complete.wrongScale, 0)
assert.equal(complete.missing, 0)

console.log(`body-organ-coverage-gate: ok (${REQUIRED_MACRO_ORGANS.length} required macro-organ entries; wrong-scale identities fail closed separately from missing anatomy)`)
