import assert from 'node:assert/strict'
import { BODY_PATHOPHYSIOLOGY_NETWORK } from '../../src/lib/bodyPathophysiologyNetwork.ts'
import { BODY_PHARMACOLOGY_MECHANISM_NETWORK } from '../../src/lib/bodyPharmacologyMechanismNetwork.ts'
import { BODY_MECHANISM_CAUSAL_BRIDGE } from '../../src/lib/bodyMechanismCausalBridge.ts'
import {
  BODY_EVIDENCE_CLAIM_LEDGER,
  BODY_EVIDENCE_PROVENANCE_BOUNDARY,
  BODY_EVIDENCE_SOURCE_LEDGER,
  getBodyEvidenceClaim,
  getBodyEvidenceCoverageStats,
  getBodyEvidenceSource,
  listBodyEvidenceClaimsByKind,
  listBodyEvidenceClaimsForPharmacology,
  listBodyEvidenceClaimsForScenario,
} from '../../src/lib/bodyEvidenceProvenance.ts'

const expectedClaims = BODY_PATHOPHYSIOLOGY_NETWORK.length + BODY_PHARMACOLOGY_MECHANISM_NETWORK.length + BODY_MECHANISM_CAUSAL_BRIDGE.length
assert.equal(BODY_EVIDENCE_CLAIM_LEDGER.length, expectedClaims, 'evidence ledger must cover all biomedical claim families in this wave')
assert.equal(new Set(BODY_EVIDENCE_CLAIM_LEDGER.map((claim) => claim.id)).size, BODY_EVIDENCE_CLAIM_LEDGER.length, 'evidence claim ids must be unique')
assert.equal(new Set(BODY_EVIDENCE_SOURCE_LEDGER.map((source) => source.pmid)).size, BODY_EVIDENCE_SOURCE_LEDGER.length, 'PMID source ledger must be deduplicated')

for (const claim of BODY_EVIDENCE_CLAIM_LEDGER) {
  assert.ok(claim.label.length >= 8, `${claim.id} needs an auditable label`)
  assert.ok(claim.summary.length >= 60, `${claim.id} needs an explanatory summary`)
  assert.ok(claim.evidencePmids.length >= 1, `${claim.id} must remain evidence anchored`)
  assert.equal(new Set(claim.evidencePmids).size, claim.evidencePmids.length, `${claim.id} must not duplicate PMIDs`)
  assert.ok(claim.derivation.length >= 70, `${claim.id} needs explicit provenance derivation`)
  assert.ok(claim.boundary.length >= 100, `${claim.id} needs an interpretation boundary`)
  for (const pmid of claim.evidencePmids) {
    const source = getBodyEvidenceSource(pmid)
    assert.ok(source.usedByClaimIds.includes(claim.id), `${pmid} must backlink to claim ${claim.id}`)
  }
  assert.equal(getBodyEvidenceClaim(claim.id).id, claim.id)
}

for (const source of BODY_EVIDENCE_SOURCE_LEDGER) {
  assert.match(source.pmid, /^\d{7,8}$/, `${source.pmid} must be a canonical PubMed id`)
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`, `${source.pmid} must retain canonical PubMed URL`)
  assert.ok(source.title.length >= 8, `${source.pmid} needs a title`)
  assert.ok(source.year >= 1990 && source.year <= 2100, `${source.pmid} needs a plausible publication year`)
  assert.ok(source.usedByClaimIds.length >= 1, `${source.pmid} must be used by at least one claim`)
  assert.ok(source.roles.length >= 1, `${source.pmid} must retain at least one evidence-role explanation`)
}

assert.equal(listBodyEvidenceClaimsByKind('pathophysiology').length, BODY_PATHOPHYSIOLOGY_NETWORK.length)
assert.equal(listBodyEvidenceClaimsByKind('pharmacology').length, BODY_PHARMACOLOGY_MECHANISM_NETWORK.length)
assert.equal(listBodyEvidenceClaimsByKind('causal-intersection').length, BODY_MECHANISM_CAUSAL_BRIDGE.length)

for (const scenario of BODY_PATHOPHYSIOLOGY_NETWORK) {
  const claims = listBodyEvidenceClaimsForScenario(scenario.id)
  assert.ok(claims.some((claim) => claim.id === `pathophysiology:${scenario.id}`), `${scenario.id} must expose its direct evidence record`)
  const expectedCausalCount = BODY_MECHANISM_CAUSAL_BRIDGE.filter((link) => link.scenarioId === scenario.id).length
  assert.equal(claims.filter((claim) => claim.kind === 'causal-intersection').length, expectedCausalCount, `${scenario.id} causal provenance count must match bridge links`)
}

for (const mechanism of BODY_PHARMACOLOGY_MECHANISM_NETWORK) {
  const claims = listBodyEvidenceClaimsForPharmacology(mechanism.id)
  assert.ok(claims.some((claim) => claim.id === `pharmacology:${mechanism.id}`), `${mechanism.id} must expose its direct evidence record`)
  const expectedCausalCount = BODY_MECHANISM_CAUSAL_BRIDGE.filter((link) => link.pharmacologyMechanismId === mechanism.id).length
  assert.equal(claims.filter((claim) => claim.kind === 'causal-intersection').length, expectedCausalCount, `${mechanism.id} causal provenance count must match bridge links`)
}

const statinSource = getBodyEvidenceSource('24657242')
assert.ok(statinSource.usedByClaimIds.includes('pharmacology:statin-hmgcr'), 'statin review must backlink to the statin mechanism record')
assert.ok(statinSource.usedByClaimIds.some((id) => id.startsWith('causal-intersection:')), 'statin review should expose inherited reuse in causal interpretations')

const stats = getBodyEvidenceCoverageStats()
assert.equal(stats.totalClaims, expectedClaims)
assert.equal(stats.evidenceAnchoredClaims, expectedClaims, 'every current biomedical claim record should carry at least one PMID anchor')
assert.equal(stats.coverageFraction, 1, 'current provenance coverage must be complete')
assert.equal(stats.uniquePubMedSources, BODY_EVIDENCE_SOURCE_LEDGER.length)
assert.deepEqual(stats.claimCounts, {
  pathophysiology: BODY_PATHOPHYSIOLOGY_NETWORK.length,
  pharmacology: BODY_PHARMACOLOGY_MECHANISM_NETWORK.length,
  'causal-intersection': BODY_MECHANISM_CAUSAL_BRIDGE.length,
})

assert.throws(() => getBodyEvidenceClaim('invented:claim'), /Unknown Body Exposure evidence claim/)
assert.throws(() => getBodyEvidenceSource('00000000'), /Unknown Body Exposure PMID/)

assert.match(BODY_EVIDENCE_PROVENANCE_BOUNDARY, /provenance QA only/i)
assert.match(BODY_EVIDENCE_PROVENANCE_BOUNDARY, /not evidence grades/i)
assert.match(BODY_EVIDENCE_PROVENANCE_BOUNDARY, /effect sizes/i)
assert.match(BODY_EVIDENCE_PROVENANCE_BOUNDARY, /diagnostic probabilities/i)
assert.match(BODY_EVIDENCE_PROVENANCE_BOUNDARY, /patient-specific clinical conclusions/i)

console.log(`body evidence provenance: ${stats.totalClaims} claim records / ${stats.uniquePubMedSources} unique PMIDs / ${Math.round(stats.coverageFraction * 100)}% metadata coverage validated without evidence-grade semantics`)
