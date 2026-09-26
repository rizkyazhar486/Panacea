import assert from 'node:assert/strict'
import { PARATHYROID_EDUCATION_EDGES, PARATHYROID_EDUCATION_NODES, PARATHYROID_SYSTEM_ID, validateParathyroidEducationGraph } from '../../src/lib/bodyParathyroidEducation.ts'
import { PARATHYROID_EVIDENCE, PARATHYROID_SOURCE_CHECKED_RELATIONSHIPS, validateParathyroidEvidence } from '../../src/lib/bodyParathyroidEvidence.ts'

assert.equal(PARATHYROID_SYSTEM_ID, 'endocrine')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(PARATHYROID_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validateParathyroidEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of PARATHYROID_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of PARATHYROID_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }

const evidenceAudit = validateParathyroidEvidence()
assert.deepEqual(evidenceAudit.unresolvedEvidence, [])
assert.deepEqual(evidenceAudit.invalidClaimScopes, [])
assert.deepEqual(evidenceAudit.falseHumanReview, [])
assert.deepEqual(evidenceAudit.boundaryMissing, [])
assert.equal(PARATHYROID_EVIDENCE.length, 1)
assert.equal(PARATHYROID_EVIDENCE[0].sourceId, 'pubmed-29597231')
assert.equal(PARATHYROID_EVIDENCE[0].reviewState, 'source-checked')
assert.notEqual(PARATHYROID_EVIDENCE[0].reviewState, 'human-reviewed')
assert.equal(PARATHYROID_SOURCE_CHECKED_RELATIONSHIPS[0].id, 'parathyroid-calcium-pth-feedback')
assert.ok(PARATHYROID_SOURCE_CHECKED_RELATIONSHIPS[0].sourceIds.includes('pubmed-29597231'))
assert.match(PARATHYROID_SOURCE_CHECKED_RELATIONSHIPS[0].teachingClaim, /calcium-sensing receptor/i)
assert.match(PARATHYROID_SOURCE_CHECKED_RELATIONSHIPS[0].boundary, /no person-level/i)

console.log('body-parathyroid-education: placeholder graph plus source-checked physiology boundary OK')
