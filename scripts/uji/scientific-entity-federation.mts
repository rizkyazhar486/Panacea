import assert from 'node:assert/strict'
import { buildFederationId, mayInferCausationFromAssociation, mergeFederatedScientificEntities, structureEvidenceLabel } from '../../src/lib/science/scientificEntityFederation'

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

console.log('scientific-entity-federation: ok')
