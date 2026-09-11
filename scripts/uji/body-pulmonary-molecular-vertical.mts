import assert from 'node:assert/strict'
import {
  PULMONARY_SFTPC_MOLECULAR_VERTICAL,
  PULMONARY_SFTPC_WITHHELD_GAPS,
  pulmonarySftpcGrossRenderEligible,
  validatePulmonarySftpcVertical,
} from '../../src/lib/bodyPulmonaryMolecularVertical.ts'
import { validateMultiscaleBridge } from '../../src/lib/bodyMultiscaleBridge.ts'
import { validateEvidenceSourceForScale } from '../../src/lib/bodyMultiscaleSourcePolicy.ts'

const validation = validatePulmonarySftpcVertical()
assert.equal(validation.valid, true, validation.reasons.join(' | '))
assert.equal(validation.publicationReady, false, 'Pending academic review must block publication readiness.')
assert.equal(pulmonarySftpcGrossRenderEligible(), false, 'Molecular/cellular reference nodes must never self-promote into gross Body3D geometry.')

assert.deepEqual(
  PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes.map((node) => node.scale),
  ['tissue', 'cell', 'protein', 'pathway', 'gene'],
)
assert.equal(PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes.some((node) => node.scale === 'organelle'), false)
assert.equal(PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes.some((node) => node.scale === 'molecule'), false)
assert.equal(PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes.every((node) => node.patientSpecific === false), true)
assert.equal(PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes.every((node) => node.inferredFromFreeText === false), true)
assert.equal(PULMONARY_SFTPC_MOLECULAR_VERTICAL.edges.every((edge) => edge.inferredFromFreeText === false), true)

const nodeByScale = new Map(PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes.map((node) => [node.scale, node]))
assert.equal(nodeByScale.get('tissue')?.evidence[0]?.sourceVersion, '25.1')
assert.equal(nodeByScale.get('cell')?.evidence[0]?.sourceVersion, '25.1')
assert.equal(nodeByScale.get('pathway')?.evidence[0]?.sourceVersion, '97')
assert.equal(nodeByScale.get('gene')?.evidence[0]?.sourceVersion, '115')
assert.match(nodeByScale.get('gene')?.evidence[0]?.locator ?? '', /ENSG00000168484/)
assert.match(nodeByScale.get('gene')?.evidence[0]?.locator ?? '', /GRCh38/)
assert.match(nodeByScale.get('pathway')?.evidence[0]?.locator ?? '', /R-HSA-5683826/)

const proteinNode = nodeByScale.get('protein')
assert.equal(proteinNode?.representation, 'not-represented', 'Expression evidence cannot masquerade as an experimental protein structure.')

const cellProteinEdge = PULMONARY_SFTPC_MOLECULAR_VERTICAL.edges.find(
  (edge) => edge.from === 'pulmonary-sftpc-alveolar-type-2-cell' && edge.to === 'pulmonary-sftpc-protein',
)
assert.equal(cellProteinEdge?.relation, 'reference-link', 'Cell→protein skips organelle/molecule scales and must be explicit reference linkage.')

const organelleGap = PULMONARY_SFTPC_WITHHELD_GAPS.find((gap) => gap.scale === 'organelle')
assert.ok(organelleGap)
assert.match(organelleGap.reason, /current organelle source policy only accepts Human Protein Atlas/i)
assert.match(organelleGap.reason, /subcellular location as unavailable/i)
assert.match(organelleGap.evidence?.locator ?? '', /R-HSA-5683717/)

const reactomeAsOrganelle = validateEvidenceSourceForScale('organelle', {
  sourceId: 'reactome',
  sourceVersion: '97',
  locator: 'R-HSA-5683717; species=Homo sapiens; compartment=lamellar body',
  citation: 'Deterministic fixture derived from the recorded Reactome stable identifier.',
})
assert.equal(reactomeAsOrganelle.valid, false, 'Reactome must remain rejected for organelle scale until source policy is deliberately expanded.')
assert.match(reactomeAsOrganelle.reasons.join(' '), /not an approved reference source for organelle scale/i)

const moleculeGap = PULMONARY_SFTPC_WITHHELD_GAPS.find((gap) => gap.scale === 'molecule')
assert.ok(moleculeGap)
assert.equal(moleculeGap.evidence, null)
assert.match(moleculeGap.reason, /No single small-molecule identity is substituted/i)

const floatingPathwayVersion = structuredClone(PULMONARY_SFTPC_MOLECULAR_VERTICAL)
floatingPathwayVersion.nodes.find((node) => node.scale === 'pathway')!.evidence[0].sourceVersion = 'latest'
const floatingValidation = validateMultiscaleBridge(floatingPathwayVersion)
assert.equal(floatingValidation.valid, false)
assert.match(floatingValidation.reasons.join(' '), /immutable, non-placeholder source version/i)

const fakeGrossProtein = structuredClone(PULMONARY_SFTPC_MOLECULAR_VERTICAL)
fakeGrossProtein.nodes.find((node) => node.scale === 'protein')!.representation = 'gross-geometry' as never
const fakeGrossValidation = validateMultiscaleBridge(fakeGrossProtein)
assert.equal(fakeGrossValidation.valid, false)
assert.match(fakeGrossValidation.reasons.join(' '), /cannot use gross-geometry representation at protein scale/i)

console.log('Pulmonary SFTPC molecular vertical is provenance-pinned, review-pending, non-patient-specific, and fail-closed across withheld organelle/molecule gaps.')
