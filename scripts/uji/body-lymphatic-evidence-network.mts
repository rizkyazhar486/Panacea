import assert from 'node:assert/strict'
import { LYMPHATIC_EDUCATION_NETWORK, getLymphaticRelationships } from '../../src/lib/bodyLymphaticEducationNetwork.ts'

assert.equal(LYMPHATIC_EDUCATION_NETWORK.systemId, 'lymphatic')
assert.equal(LYMPHATIC_EDUCATION_NETWORK.patientSpecific, false)
assert.equal(LYMPHATIC_EDUCATION_NETWORK.clinicalDecisionSupport, false)
assert.ok(LYMPHATIC_EDUCATION_NETWORK.sources.every((source) => /^\d+$/.test(source.pmid)))
assert.ok(LYMPHATIC_EDUCATION_NETWORK.sources.some((source) => source.pmid === '32707093'))
assert.ok(LYMPHATIC_EDUCATION_NETWORK.relationships.some((edge) => edge.kind === 'fluid-homeostasis'))
assert.ok(LYMPHATIC_EDUCATION_NETWORK.relationships.some((edge) => edge.kind === 'immune-trafficking'))
assert.ok(LYMPHATIC_EDUCATION_NETWORK.relationships.some((edge) => edge.kind === 'pathophysiology'))
assert.ok(LYMPHATIC_EDUCATION_NETWORK.relationships.every((edge) => edge.sourcePmids.length > 0))
assert.ok(LYMPHATIC_EDUCATION_NETWORK.relationships.every((edge) => edge.educationalOnly === true))
assert.deepEqual(getLymphaticRelationships('lymph-node').map((edge) => edge.id), ['afferent-to-node', 'node-to-efferent'])
assert.deepEqual(getLymphaticRelationships('unknown-structure'), [])

console.log('body lymphatic evidence network: ok')
