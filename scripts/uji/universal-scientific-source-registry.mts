import assert from 'node:assert/strict'
import {
  UNIVERSAL_SCIENTIFIC_COVERAGE_BOUNDARY,
  UNIVERSAL_SCIENTIFIC_SOURCE_REGISTRY,
  coverageFraction,
  mayClaimSourceComplete,
  sourceById,
  type ScientificDomain,
} from '../../src/lib/science/universalScientificSourceRegistry'

const requiredDomains: ScientificDomain[] = [
  'element',
  'isotope',
  'compound',
  'drug',
  'gene',
  'variant',
  'protein',
  'amino-acid',
  'peptide',
  'metabolite',
  'lipid',
  'carbohydrate',
  'nucleic-acid',
  'pathway',
  'reaction',
  'target',
  'interaction',
  'disease-association',
  'molecular-structure',
]

const seen = new Set<string>()
for (const source of UNIVERSAL_SCIENTIFIC_SOURCE_REGISTRY) {
  assert.ok(source.id && !seen.has(source.id), `duplicate/empty source id: ${source.id}`)
  seen.add(source.id)
  assert.ok(source.sourceUrl.startsWith('https://'), `${source.id} requires https source URL`)
  assert.ok(source.versionPolicy.length > 20, `${source.id} requires explicit version policy`)
  assert.ok(source.accessBoundary.length > 20, `${source.id} requires access/license boundary`)
  assert.ok(source.evidenceBoundary.length > 20, `${source.id} requires evidence boundary`)
  assert.notEqual(source.integrationState, 'active-verified', `${source.id} must not be activated without an adapter-specific verification wave`)
}

const represented = new Set(UNIVERSAL_SCIENTIFIC_SOURCE_REGISTRY.flatMap((source) => source.domains))
for (const domain of requiredDomains) {
  if (domain === 'element' || domain === 'isotope' || domain === 'pathway' || domain === 'reaction') continue
  assert.ok(represented.has(domain), `registry lacks source candidate for ${domain}`)
}

assert.equal(sourceById('rcsb-pdb')?.structureEvidence, 'experimental')
assert.equal(sourceById('alphafold-db')?.structureEvidence, 'predicted')
assert.match(sourceById('clinvar')?.evidenceBoundary ?? '', /Conflicting classifications/i)
assert.match(UNIVERSAL_SCIENTIFIC_COVERAGE_BOUNDARY, /must not claim/i)
assert.match(UNIVERSAL_SCIENTIFIC_COVERAGE_BOUNDARY, /every scientific database/i)

assert.equal(coverageFraction({ sourceId: 'x', indexedEntities: 50, exposedEntities: 100, measuredAt: '2026-09-13', sourceVersion: 'v1' }), 0.5)
assert.equal(coverageFraction({ sourceId: 'x', indexedEntities: 120, exposedEntities: 100, measuredAt: '2026-09-13', sourceVersion: 'v1' }), 1)
assert.equal(coverageFraction({ sourceId: 'x', indexedEntities: 1, exposedEntities: null, measuredAt: '2026-09-13', sourceVersion: null }), null)
assert.equal(mayClaimSourceComplete({ sourceId: 'x', indexedEntities: 100, exposedEntities: 100, measuredAt: '2026-09-13', sourceVersion: null }), false)
assert.equal(mayClaimSourceComplete({ sourceId: 'x', indexedEntities: 100, exposedEntities: 100, measuredAt: '2026-09-13', sourceVersion: 'v1' }), true)

console.log('universal-scientific-source-registry: ok')
