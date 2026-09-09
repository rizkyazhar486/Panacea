export type RodPhototransductionNodeKind = 'gene' | 'complex' | 'reaction'

export interface RodPhototransductionNode {
  id: string
  label: string
  kind: RodPhototransductionNodeKind
  stableIdentifier: string
  source: 'NCBI Gene' | 'Reactome'
  sourceVersion: string
  retrievedOn: '2026-09-09'
  representation: 'molecular-reference-only' | 'conceptual-pathway-only'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  inferredFromFreeText: false
  publicationReady: false
}

export interface RodPhototransductionEdge {
  id: string
  from: string
  to: string
  relation: 'gene-participates-in-reference-cascade' | 'complex-participates-in-reaction' | 'reaction-precedes-reference-reaction'
  evidence: {
    source: 'NCBI Gene' | 'Reactome'
    locator: string
    sourceVersion: string
    retrievedOn: '2026-09-09'
    citation: string
  }
  patientSpecific: false
  inferredFromFreeText: false
  publicationReady: false
}

const node = (
  id: string,
  label: string,
  kind: RodPhototransductionNodeKind,
  stableIdentifier: string,
  source: RodPhototransductionNode['source'],
  sourceVersion: string,
  representation: RodPhototransductionNode['representation'],
): RodPhototransductionNode => ({
  id,
  label,
  kind,
  stableIdentifier,
  source,
  sourceVersion,
  retrievedOn: '2026-09-09',
  representation,
  reviewStatus: 'academic-review-pending',
  patientSpecific: false,
  inferredFromFreeText: false,
  publicationReady: false,
})

const edge = (
  id: string,
  from: string,
  to: string,
  relation: RodPhototransductionEdge['relation'],
  evidence: RodPhototransductionEdge['evidence'],
): RodPhototransductionEdge => ({
  id,
  from,
  to,
  relation,
  evidence,
  patientSpecific: false,
  inferredFromFreeText: false,
  publicationReady: false,
})

/**
 * Wave 5C is a provenance-pinned REFERENCE graph for the human rod
 * phototransduction activation cascade. It is not a kinetic simulation and
 * must not be used to infer patient retinal function, disease, mutation
 * effects, abundance, activation magnitude, timing, treatment response,
 * spectral phenotype, or gross-anatomy coordinates.
 */
export const EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_NODES: readonly RodPhototransductionNode[] = [
  node(
    'gnat1-gene',
    'GNAT1 gene',
    'gene',
    'NCBI-Gene:2779;Ensembl:ENSG00000114349',
    'NCBI Gene',
    'record-updated-2026-08-12',
    'molecular-reference-only',
  ),
  node(
    'pde6b-gene',
    'PDE6B gene',
    'gene',
    'NCBI-Gene:5158;Ensembl:ENSG00000133256',
    'NCBI Gene',
    'record-updated-2026-08-12',
    'molecular-reference-only',
  ),
  node(
    'transducin-beta-gamma-complex',
    'GNB1:GNGT1 transducin beta-gamma complex',
    'complex',
    'Reactome:R-HSA-74061',
    'Reactome',
    'retrieved-2026-09-09',
    'molecular-reference-only',
  ),
  node(
    'gt-dissociation-reaction',
    'Gt-GTP dissociates to GNAT1-GTP and GNB1:GNGT1',
    'reaction',
    'Reactome:R-HSA-2485182',
    'Reactome',
    'retrieved-2026-09-09',
    'conceptual-pathway-only',
  ),
  node(
    'gnat1-pde6-activation-reaction',
    'GNAT1-GTP binds PDE6 and activates it',
    'reaction',
    'Reactome:R-HSA-74065',
    'Reactome',
    'retrieved-2026-09-09',
    'conceptual-pathway-only',
  ),
] as const

export const EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_EDGES: readonly RodPhototransductionEdge[] = [
  edge('gnat1-gene-cascade', 'gnat1-gene', 'gt-dissociation-reaction', 'gene-participates-in-reference-cascade', {
    source: 'NCBI Gene',
    locator: 'GeneID:2779;Ensembl:ENSG00000114349',
    sourceVersion: 'record-updated-2026-08-12',
    retrievedOn: '2026-09-09',
    citation: 'NCBI Gene 2779 identifies human GNAT1, the rod transducin alpha-subunit gene.',
  }),
  edge('pde6b-gene-cascade', 'pde6b-gene', 'gnat1-pde6-activation-reaction', 'gene-participates-in-reference-cascade', {
    source: 'NCBI Gene',
    locator: 'GeneID:5158;Ensembl:ENSG00000133256',
    sourceVersion: 'record-updated-2026-08-12',
    retrievedOn: '2026-09-09',
    citation: 'NCBI Gene 5158 identifies human PDE6B, a catalytic beta subunit gene of rod cGMP phosphodiesterase.',
  }),
  edge('beta-gamma-in-dissociation', 'transducin-beta-gamma-complex', 'gt-dissociation-reaction', 'complex-participates-in-reaction', {
    source: 'Reactome',
    locator: 'R-HSA-2485182;R-HSA-74061',
    sourceVersion: 'retrieved-2026-09-09',
    retrievedOn: '2026-09-09',
    citation: 'Reactome R-HSA-2485182 records Gt-GTP dissociation to GNAT1-GTP and GNB1:GNGT1; R-HSA-74061 identifies the beta-gamma complex.',
  }),
  edge('dissociation-before-pde6-activation', 'gt-dissociation-reaction', 'gnat1-pde6-activation-reaction', 'reaction-precedes-reference-reaction', {
    source: 'Reactome',
    locator: 'R-HSA-2485182 -> R-HSA-74065',
    sourceVersion: 'retrieved-2026-09-09',
    retrievedOn: '2026-09-09',
    citation: 'Reactome places both reactions in activation of the human phototransduction cascade, with GNAT1-GTP available before its PDE6-binding reaction.',
  }),
] as const

export const EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY =
  'Reference-only human rod phototransduction graph. Do not infer patient retinal activity, reaction kinetics, molecular abundance, activation magnitude, mutation/pathogenicity, diagnosis, treatment response, spectral phenotype, or gross Body3D coordinates.'

export function validateEyeRodPhototransductionWave5c(
  nodes: readonly RodPhototransductionNode[] = EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_NODES,
  edges: readonly RodPhototransductionEdge[] = EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_EDGES,
): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const item of nodes) {
    if (ids.has(item.id)) errors.push(`duplicate-node:${item.id}`)
    ids.add(item.id)
    if (!item.label.trim() || !item.stableIdentifier.trim() || !item.sourceVersion.trim()) errors.push(`identity:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
    if (item.patientSpecific || item.inferredFromFreeText || item.publicationReady) errors.push(`unsafe-node:${item.id}`)
    if (item.kind === 'reaction' && item.representation !== 'conceptual-pathway-only') errors.push(`reaction-representation:${item.id}`)
  }

  const edgeIds = new Set<string>()
  for (const item of edges) {
    if (edgeIds.has(item.id)) errors.push(`duplicate-edge:${item.id}`)
    edgeIds.add(item.id)
    if (!ids.has(item.from)) errors.push(`from:${item.id}:${item.from}`)
    if (!ids.has(item.to)) errors.push(`to:${item.id}:${item.to}`)
    if (!item.evidence.locator.trim() || !item.evidence.sourceVersion.trim() || !item.evidence.citation.trim()) errors.push(`evidence:${item.id}`)
    if (item.patientSpecific || item.inferredFromFreeText || item.publicationReady) errors.push(`unsafe-edge:${item.id}`)
  }

  const requiredStableIds = [
    'NCBI-Gene:2779;Ensembl:ENSG00000114349',
    'NCBI-Gene:5158;Ensembl:ENSG00000133256',
    'Reactome:R-HSA-74061',
    'Reactome:R-HSA-2485182',
    'Reactome:R-HSA-74065',
  ]
  const stableIds = new Set(nodes.map((item) => item.stableIdentifier))
  for (const stableId of requiredStableIds) if (!stableIds.has(stableId)) errors.push(`required-stable-id:${stableId}`)

  return errors
}
