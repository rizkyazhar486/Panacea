import assert from 'node:assert/strict'
import {
  canRenderInGrossBody3D,
  nextScale,
  validateMultiscaleBridge,
  type MultiscaleBridge,
  type MultiscaleEvidenceRef,
} from '../../src/lib/bodyMultiscaleBridge.ts'

const evidence: MultiscaleEvidenceRef = {
  sourceId: 'fixture-authoritative-source',
  sourceVersion: '2026.09.01',
  locator: 'record:12345',
  citation: 'Deterministic fixture citation — not a biomedical claim.',
}

const pendingBridge: MultiscaleBridge = {
  nodes: [
    {
      id: 'fixture-organ', label: 'Fixture organ', scale: 'organ', representation: 'gross-geometry',
      evidence: [evidence], academicReview: { status: 'pending' }, patientSpecific: false,
      inferredFromFreeText: false, destination: 'body3d',
    },
    {
      id: 'fixture-tissue', label: 'Fixture tissue', scale: 'tissue', representation: 'cellular-reference',
      evidence: [evidence], academicReview: { status: 'pending' }, patientSpecific: false,
      inferredFromFreeText: false,
    },
    {
      id: 'fixture-cell', label: 'Fixture cell', scale: 'cell', representation: 'cellular-reference',
      evidence: [evidence], academicReview: { status: 'pending' }, patientSpecific: false,
      inferredFromFreeText: false, destination: 'cell-lab',
    },
    {
      id: 'fixture-organelle', label: 'Fixture organelle', scale: 'organelle', representation: 'subcellular-reference',
      evidence: [evidence], academicReview: { status: 'pending' }, patientSpecific: false,
      inferredFromFreeText: false, destination: 'cell-lab',
    },
    {
      id: 'fixture-molecule', label: 'Fixture molecule', scale: 'molecule', representation: 'molecular-structure',
      evidence: [evidence], academicReview: { status: 'pending' }, patientSpecific: false,
      inferredFromFreeText: false, destination: 'molecular-lab',
    },
    {
      id: 'fixture-protein', label: 'Fixture protein', scale: 'protein', representation: 'molecular-structure',
      evidence: [evidence], academicReview: { status: 'pending' }, patientSpecific: false,
      inferredFromFreeText: false, destination: 'molecular-lab',
    },
    {
      id: 'fixture-pathway', label: 'Fixture pathway', scale: 'pathway', representation: 'conceptual-pathway',
      evidence: [evidence], academicReview: { status: 'pending' }, patientSpecific: false,
      inferredFromFreeText: false, destination: 'genomics-lab',
    },
    {
      id: 'fixture-gene', label: 'Fixture gene', scale: 'gene', representation: 'sequence-reference',
      evidence: [evidence], academicReview: { status: 'pending' }, patientSpecific: false,
      inferredFromFreeText: false, destination: 'genomics-lab',
    },
  ],
  edges: [
    { from: 'fixture-organ', to: 'fixture-tissue', relation: 'contains', evidence: [evidence], academicReview: { status: 'pending' }, inferredFromFreeText: false },
    { from: 'fixture-tissue', to: 'fixture-cell', relation: 'has-cell-type', evidence: [evidence], academicReview: { status: 'pending' }, inferredFromFreeText: false },
    { from: 'fixture-cell', to: 'fixture-organelle', relation: 'has-compartment', evidence: [evidence], academicReview: { status: 'pending' }, inferredFromFreeText: false },
    { from: 'fixture-organelle', to: 'fixture-molecule', relation: 'contains-molecule', evidence: [evidence], academicReview: { status: 'pending' }, inferredFromFreeText: false },
    { from: 'fixture-cell', to: 'fixture-protein', relation: 'reference-link', evidence: [evidence], academicReview: { status: 'pending' }, inferredFromFreeText: false },
    { from: 'fixture-protein', to: 'fixture-pathway', relation: 'participates-in-pathway', evidence: [evidence], academicReview: { status: 'pending' }, inferredFromFreeText: false },
    { from: 'fixture-protein', to: 'fixture-gene', relation: 'encoded-by-gene', evidence: [evidence], academicReview: { status: 'pending' }, inferredFromFreeText: false },
  ],
}

const pending = validateMultiscaleBridge(pendingBridge)
assert.equal(pending.valid, true, pending.reasons.join(' | '))
assert.equal(pending.publicationReady, false, 'structurally valid pending-review reference graphs must not be called publication-ready')

const gross = pendingBridge.nodes.find((node) => node.id === 'fixture-organ')!
const protein = pendingBridge.nodes.find((node) => node.id === 'fixture-protein')!
assert.equal(canRenderInGrossBody3D(gross), true)
assert.equal(canRenderInGrossBody3D(protein), false, 'protein/molecular structures must never masquerade as gross Body3D anatomy')
assert.equal(nextScale('organ'), 'tissue')
assert.equal(nextScale('cell'), 'organelle')
assert.equal(nextScale('organelle'), 'molecule')
assert.equal(nextScale('gene'), null)

const badMolecularGeometry = structuredClone(pendingBridge)
const badProtein = badMolecularGeometry.nodes.find((node) => node.id === 'fixture-protein')!
badProtein.representation = 'gross-geometry'
assert.match(validateMultiscaleBridge(badMolecularGeometry).reasons.join(' '), /cannot use gross-geometry representation at protein scale/i)

const badVersion = structuredClone(pendingBridge)
const versionedProtein = badVersion.nodes.find((node) => node.id === 'fixture-protein')!
versionedProtein.evidence[0].sourceVersion = 'latest'
assert.match(validateMultiscaleBridge(badVersion).reasons.join(' '), /immutable, non-placeholder source version/i)

const missingEdgeEvidence = structuredClone(pendingBridge)
missingEdgeEvidence.edges[1].evidence = []
assert.match(validateMultiscaleBridge(missingEdgeEvidence).reasons.join(' '), /requires its own provenance-bearing cross-scale evidence/i)

const textInferred = structuredClone(pendingBridge)
textInferred.edges[0].inferredFromFreeText = true as false
assert.match(validateMultiscaleBridge(textInferred).reasons.join(' '), /cannot be inferred from free text/i)

const reviewed = structuredClone(pendingBridge)
const review = {
  status: 'recorded' as const,
  reviewer: 'Qualified Reviewer Fixture',
  credentials: 'Fixture credentials — deterministic test only',
  reviewedAt: '2026-09-09',
  scope: 'Fixture multiscale mapping only; not a real biomedical review.',
}
reviewed.nodes.forEach((node) => { node.academicReview = review })
reviewed.edges.forEach((edge) => { edge.academicReview = review })
const reviewedResult = validateMultiscaleBridge(reviewed)
assert.equal(reviewedResult.valid, true, reviewedResult.reasons.join(' | '))
assert.equal(reviewedResult.publicationReady, true)

const malformedReview = structuredClone(reviewed)
malformedReview.nodes[0].academicReview = { ...review, reviewedAt: 'not-a-date' }
assert.match(validateMultiscaleBridge(malformedReview).reasons.join(' '), /real ISO review date/i)

console.log('Body multiscale molecular bridge is fail-closed across organ → tissue → cell → organelle → molecule/protein → pathway/gene reference navigation.')
