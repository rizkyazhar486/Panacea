import assert from 'node:assert/strict'
import { MULTISCALE_SOURCE_POLICY, requiredSourceContextForScale, sourcePolicyForScale, validateEvidenceSourceForScale } from '../../src/lib/bodyMultiscaleSourcePolicy.ts'

assert.equal(MULTISCALE_SOURCE_POLICY.length, 10)
assert.deepEqual(sourcePolicyForScale('cell')?.preferredSourceIds, ['cellxgene_census', 'human_protein_atlas'])
assert.deepEqual(sourcePolicyForScale('organelle')?.preferredSourceIds, ['human_protein_atlas'])
assert.deepEqual(sourcePolicyForScale('protein')?.preferredSourceIds, ['rcsb-pdb', 'human_protein_atlas'])
assert.deepEqual(sourcePolicyForScale('pathway')?.preferredSourceIds, ['reactome'])
assert.deepEqual(sourcePolicyForScale('gene')?.preferredSourceIds, ['ensembl_rest_api'])
assert.ok(requiredSourceContextForScale('gene').includes('assembly'))
assert.ok(requiredSourceContextForScale('protein').some((item) => /PDB\/entity\/assembly/i.test(item)))
assert.ok(requiredSourceContextForScale('cell').some((item) => /cell-type ontology/i.test(item)))

assert.equal(validateEvidenceSourceForScale('protein', { sourceId: 'rcsb-pdb', sourceVersion: '2026-09-09-entry-revision', locator: 'PDB:1ABC/entity:1/assembly:1', citation: 'Fixture PDB citation; deterministic test only.' }).valid, true)
assert.equal(validateEvidenceSourceForScale('organelle', { sourceId: 'human_protein_atlas', sourceVersion: '25.1', locator: 'ENSG00000000000/subcellular-location', citation: 'Fixture HPA citation; deterministic test only.' }).valid, true)

const wrongGrossSource = validateEvidenceSourceForScale('organ', { sourceId: 'reactome', sourceVersion: 'release-99', locator: 'R-HSA-000000', citation: 'Fixture only.' })
assert.equal(wrongGrossSource.valid, false)
assert.match(wrongGrossSource.reasons.join(' '), /not an approved reference source for organ scale/i)

const wrongGeneSource = validateEvidenceSourceForScale('gene', { sourceId: 'rcsb-pdb', sourceVersion: 'revision-1', locator: 'PDB:1ABC', citation: 'Fixture only.' })
assert.equal(wrongGeneSource.valid, false)
assert.match(wrongGeneSource.reasons.join(' '), /not an approved reference source for gene scale/i)

for (const policy of MULTISCALE_SOURCE_POLICY) {
  assert.ok(policy.preferredSourceIds.length > 0, `${policy.scale} must retain at least one explicit preferred source.`)
  assert.ok(policy.requiredLocatorContext.length > 0, `${policy.scale} must declare source locator context.`)
  assert.ok(policy.interpretationBoundary.length > 40, `${policy.scale} must retain an interpretation boundary.`)
}

const corpus = JSON.stringify(MULTISCALE_SOURCE_POLICY).toLowerCase()
for (const forbidden of ['patient-specific anatomy confirmed', 'pathway proves diagnosis', 'vep proves pathogenic', 'expression proves treatment']) assert.equal(corpus.includes(forbidden), false)

console.log('Molecular multiscale source policy separates gross anatomy, cell atlas, protein structure/expression, pathways, and gene sequence evidence.')
