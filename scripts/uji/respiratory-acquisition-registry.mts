import assert from 'node:assert/strict'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'
import { assessRespiratorySourceCoverage } from '../../src/lib/anatomy/respiratoryAtlasGap.ts'
import {
  RESPIRATORY_ACQUISITION_CANDIDATES,
  buildRespiratoryAcquisitionPlan,
  unresolvedRespiratoryProductionGaps,
} from '../../src/lib/anatomy/respiratoryAcquisitionRegistry.ts'

for (const candidate of RESPIRATORY_ACQUISITION_CANDIDATES) {
  assert.equal(candidate.automaticImportAllowed, false, `${candidate.id} must never auto-import third-party anatomy.`)
  assert.equal(candidate.requiresAssetLevelProvenance, true)
  assert.equal(candidate.requiresQualifiedHumanReview, true)
}

const totalSegmentator = RESPIRATORY_ACQUISITION_CANDIDATES.find((candidate) => candidate.id === 'totalsegmentator-total-lung-lobes')
assert.ok(totalSegmentator)
assert.equal(totalSegmentator.licenseStatus, 'verified-open')
assert.equal(totalSegmentator.license, 'Apache-2.0 for the openly available total task, per upstream repository documentation')
assert.equal(totalSegmentator.productionUse, 'candidate')
assert.equal(totalSegmentator.requiresInputDataRightsCheck, true)

for (const lobeId of [
  'right-upper-lobe',
  'right-middle-lobe',
  'right-lower-lobe',
  'left-upper-lobe',
  'left-lower-lobe',
]) {
  assert.ok(totalSegmentator.targetStructureIds.includes(lobeId), `TotalSegmentator candidate must cover ${lobeId}.`)
}

const medRad = RESPIRATORY_ACQUISITION_CANDIDATES.find((candidate) => candidate.id === 'med-rad-lung-fissure-research')
assert.ok(medRad)
assert.equal(medRad.licenseStatus, 'verified-noncommercial')
assert.equal(medRad.productionUse, 'research-only')
assert.match(medRad.license ?? '', /CC BY-NC-SA 4\.0/i)

const fissureSeg = RESPIRATORY_ACQUISITION_CANDIDATES.find((candidate) => candidate.id === 'fissureseg-stanford-research-lead')
assert.ok(fissureSeg)
assert.equal(fissureSeg.licenseStatus, 'unverified')
assert.equal(fissureSeg.productionUse, 'blocked')
assert.equal(fissureSeg.license, null)

const gapReport = assessRespiratorySourceCoverage(INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT)
const plan = buildRespiratoryAcquisitionPlan(gapReport)
assert.equal(plan.length, gapReport.missing)

const currentMissing = plan.map((entry) => entry.structureId)
assert.deepEqual(currentMissing, [
  'right-horizontal-fissure',
  'right-oblique-fissure',
  'left-oblique-fissure',
  'visceral-pleura',
  'parietal-pleura',
])

// Present shipped lobes need review, not reacquisition. Preserve the acquisition
// branch with an empty source snapshot so missing lobes still have a lawful lead.
const emptySourcePlan = buildRespiratoryAcquisitionPlan(assessRespiratorySourceCoverage([]))
for (const lobeId of totalSegmentator.targetStructureIds) {
  assert.equal(gapReport.entries.find((entry) => entry.structureId === lobeId)?.coverage, 'source-node-present')
  assert.equal(plan.some((entry) => entry.structureId === lobeId), false, `${lobeId} must not be reacquired when its source exists.`)
  const entry = emptySourcePlan.find((candidate) => candidate.structureId === lobeId)
  assert.ok(entry)
  assert.equal(entry.unresolvedForProduction, false, `${lobeId} should have a licensed segmentation-tool acquisition candidate.`)
  assert.ok(entry.productionCandidateIds.includes('totalsegmentator-total-lung-lobes'))
}

const unresolved = unresolvedRespiratoryProductionGaps(plan)
assert.deepEqual(unresolved, [
  'right-horizontal-fissure',
  'right-oblique-fissure',
  'left-oblique-fissure',
  'visceral-pleura',
  'parietal-pleura',
])

for (const fissureId of ['right-horizontal-fissure', 'right-oblique-fissure', 'left-oblique-fissure']) {
  const entry = plan.find((candidate) => candidate.structureId === fissureId)
  assert.ok(entry)
  assert.equal(entry.productionCandidateIds.length, 0)
  assert.ok(entry.researchOnlyCandidateIds.includes('med-rad-lung-fissure-research'))
  assert.ok(entry.blockedCandidateIds.includes('fissureseg-stanford-research-lead'))
}

for (const pleuraId of ['visceral-pleura', 'parietal-pleura']) {
  const entry = plan.find((candidate) => candidate.structureId === pleuraId)
  assert.ok(entry)
  assert.deepEqual(entry.candidates, [], `${pleuraId} must not inherit a generic or lobe acquisition candidate.`)
  assert.deepEqual(entry.productionCandidateIds, [])
  assert.deepEqual(entry.researchOnlyCandidateIds, [])
  assert.deepEqual(entry.blockedCandidateIds, [])
  assert.equal(entry.unresolvedForProduction, true)
}

console.log(JSON.stringify({
  respiratoryAcquisition: {
    missingNamedStructures: plan.length,
    licensedProductionCandidatesAvailableFor: plan.filter((entry) => !entry.unresolvedForProduction).map((entry) => entry.structureId),
    unresolvedProductionStructures: unresolved,
    nonCommercialResearchReference: 'UNC-Robotics/Med-RAD',
    blockedUntilLicenseVerified: 'Devanish31/fissureSeg',
  },
}, null, 2))
