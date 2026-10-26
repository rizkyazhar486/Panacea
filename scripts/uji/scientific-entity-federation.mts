import assert from 'node:assert/strict'
import { buildFederationId, mayInferCausationFromAssociation, mergeFederatedScientificEntities, structureEvidenceLabel, type FederatedScientificEntity } from '../../src/lib/science/scientificEntityFederation'

const id = buildFederationId('protein', 'LRRK2', [
  { sourceId: 'uniprot', nativeId: 'Q5S007', version: 'v1' },
  { sourceId: 'rcsb-pdb', nativeId: '8P6R' },
])
assert.equal(id, 'protein:rcsb-pdb:8P6R')

const merged = mergeFederatedScientificEntities([
  {
    federationId: 'protein:uniprot:Q5S007',
    domain: 'protein',
    label: 'LRRK2',
    sourceIds: [{ sourceId: 'uniprot', nativeId: 'Q5S007', version: 'v1' }],
    aliases: ['dardarin'],
    evidence: ['association', 'predicted-structure'],
    contradictions: [],
  },
  {
    federationId: 'protein:uniprot:Q5S007',
    domain: 'protein',
    label: 'LRRK2',
    sourceIds: [{ sourceId: 'rcsb-pdb', nativeId: '8P6R' }],
    aliases: ['LRRK2'],
    evidence: ['experimental-structure'],
    contradictions: ['construct-specific state'],
  },
])
assert.equal(merged.length, 1)
assert.equal(merged[0].sourceIds.length, 2)
assert.equal(structureEvidenceLabel(merged[0]), 'mixed')
assert.ok(merged[0].contradictions.includes('construct-specific state'))
assert.equal(mayInferCausationFromAssociation(), false)

// Fallback identity must be collision-resistant: distinct Unicode labels are
// distinct scientific entities and must never share a federation key.
const alphaId = buildFederationId('protein', 'α-synuclein', [])
const betaId = buildFederationId('protein', 'β-synuclein', [])
assert.notEqual(alphaId, betaId)
assert.ok(alphaId.startsWith('protein:label:'))
assert.ok(betaId.startsWith('protein:label:'))
// Normalization stays deterministic and case-insensitive.
assert.equal(buildFederationId('protein', 'Α-SYNUCLEIN', []), alphaId)
// Delimiter injection cannot forge an identity component boundary.
assert.notEqual(buildFederationId('protein:a', 'x', []), buildFederationId('protein', 'a:x', []))
// ASCII anchored ids keep their established format.
assert.equal(id, 'protein:rcsb-pdb:8P6R')
// A lone surrogate is malformed input: sanitized to U+FFFD, never a throw.
let loneSurrogateId = ''
assert.doesNotThrow(() => {
  loneSurrogateId = buildFederationId('protein', 'x\uD800y', [])
})
assert.ok(loneSurrogateId.includes('%EF%BF%BD'))
// 'label' is a reserved namespace: a source named 'label' cannot forge a
// fallback-looking anchored key, so it derives label identity instead.
const labelSourceForgery = buildFederationId('protein', 'anything', [{ sourceId: 'label', nativeId: 'foo' }])
assert.equal(labelSourceForgery, buildFederationId('protein', 'anything', []))
assert.notEqual(labelSourceForgery, buildFederationId('protein', 'foo', []))

const makeBlankIdEntity = (label: string): FederatedScientificEntity => ({
  federationId: ' \t',
  domain: 'protein',
  label,
  sourceIds: [],
  aliases: [],
  evidence: [],
  contradictions: [],
})
// A whitespace-only supplied federationId is derived, never used as a merge key.
const blankMerged = mergeFederatedScientificEntities([makeBlankIdEntity('α-synuclein'), makeBlankIdEntity('β-synuclein')])
assert.equal(blankMerged.length, 2)
assert.ok(blankMerged.every((entity) => entity.federationId.trim() !== ''))
assert.notEqual(blankMerged[0].federationId, blankMerged[1].federationId)
assert.deepEqual(blankMerged.flatMap((entity) => entity.contradictions), [])
// An empty supplied id derives the same fallback as buildFederationId.
const derived = mergeFederatedScientificEntities([{ ...makeBlankIdEntity('α-synuclein'), federationId: '' }])
assert.equal(derived[0].federationId, alphaId)
// A non-string supplied id is malformed input: also derives the fallback.
const nonStringId = mergeFederatedScientificEntities([{ ...makeBlankIdEntity('α-synuclein'), federationId: 123 } as unknown as FederatedScientificEntity])
assert.equal(nonStringId[0].federationId, alphaId)
// Supplied ids are trimmed before use, so padded duplicates still merge.
const paddedMerged = mergeFederatedScientificEntities([
  { ...makeBlankIdEntity('LRRK2'), federationId: '  protein:uniprot:Q5S007 ' },
  { ...makeBlankIdEntity('LRRK2'), federationId: 'protein:uniprot:Q5S007' },
])
assert.equal(paddedMerged.length, 1)
assert.equal(paddedMerged[0].federationId, 'protein:uniprot:Q5S007')

console.log('scientific-entity-federation: ok')
