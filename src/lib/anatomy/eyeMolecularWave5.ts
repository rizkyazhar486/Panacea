import { EYE_CELL_ORGANELLE_WAVE4 } from './eyeCellOrganelleWave4'

export type EyeWave5Scale = 'molecule' | 'protein' | 'gene' | 'sequence-reference' | 'pathway-context'
export type EyeWave5ReviewStatus = 'academic-review-pending'
export type EyeWave5Relation =
  | 'localized-to'
  | 'binds'
  | 'encoded-by'
  | 'has-reviewed-transcript'
  | 'translates-to-reviewed-protein'
  | 'participates-in-pathway-context'

export interface EyeWave5Evidence {
  source: 'Reactome' | 'UniProtKB' | 'NCBI Gene'
  locator: string
  sourceVersion: string
  versionSemantics: 'database-release' | 'annotation-release' | 'retrieval-date'
  retrievedOn: '2026-09-09'
  citation: string
}

export interface EyeWave5Node {
  id: string
  label: string
  scale: EyeWave5Scale
  externalIdentifier: string
  representation: 'molecular-reference-only'
  reviewStatus: EyeWave5ReviewStatus
  patientSpecific: false
  inferredFromFreeText: false
  publicationReady: false
}

export interface EyeWave5Edge {
  id: string
  from: string
  to: string
  relation: EyeWave5Relation
  evidence: EyeWave5Evidence
  patientSpecific: false
  inferredFromFreeText: false
  publicationReady: false
}

const N = (id: string, label: string, scale: EyeWave5Scale, externalIdentifier: string): EyeWave5Node => ({
  id,
  label,
  scale,
  externalIdentifier,
  representation: 'molecular-reference-only',
  reviewStatus: 'academic-review-pending',
  patientSpecific: false,
  inferredFromFreeText: false,
  publicationReady: false,
})

const E = (
  id: string,
  from: string,
  to: string,
  relation: EyeWave5Relation,
  evidence: EyeWave5Evidence,
): EyeWave5Edge => ({
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
 * Eye Wave 5 begins with one evidence-dense vertical exemplar: rod outer-segment
 * disc membrane -> rhodopsin molecular identity -> RHO gene / reviewed sequence
 * references -> visual-phototransduction pathway context.
 *
 * This is NOT evidence of patient expression, pathogenicity, treatment relevance,
 * molecular abundance, conformational state, activation state, or patient-specific
 * localization. It must never be promoted into gross Body3D geometry.
 */
export const EYE_MOLECULAR_WAVE5_NODES: readonly EyeWave5Node[] = [
  N('rho-chromophore-11cis-retinal', '11-cis-retinal chromophore context', 'molecule', 'NCBI-Gene:6010 ligand context'),
  N('rho-protein', 'Rhodopsin', 'protein', 'UniProtKB:P08100'),
  N('rho-reactome-entity', 'RHO in photoreceptor disc membrane', 'pathway-context', 'Reactome:R-HSA-419802'),
  N('rho-gene', 'RHO rhodopsin gene', 'gene', 'NCBI-Gene:6010;Ensembl:ENSG00000163914'),
  N('rho-reviewed-transcript', 'RHO reviewed transcript', 'sequence-reference', 'RefSeq:NM_000539.3'),
  N('rho-reviewed-protein-sequence', 'Rhodopsin reviewed protein sequence', 'sequence-reference', 'RefSeq:NP_000530.1'),
] as const

export const EYE_MOLECULAR_WAVE5_EDGES: readonly EyeWave5Edge[] = [
  E('rho-localized-disc', 'rho-protein', 'rod-outer-segment-discs', 'localized-to', {
    source: 'Reactome',
    locator: 'R-HSA-419802',
    sourceVersion: 'retrieved-2026-09-09',
    versionSemantics: 'retrieval-date',
    retrievedOn: '2026-09-09',
    citation: 'Reactome R-HSA-419802: RHO [photoreceptor disc membrane], Homo sapiens.',
  }),
  E('rho-binds-11cis-retinal', 'rho-chromophore-11cis-retinal', 'rho-protein', 'binds', {
    source: 'NCBI Gene',
    locator: 'GeneID:6010',
    sourceVersion: 'RS_2025_08;GRCh38.p14',
    versionSemantics: 'annotation-release',
    retrievedOn: '2026-09-09',
    citation: 'NCBI Gene 6010 states rhodopsin binds 11-cis retinal and is activated by light.',
  }),
  E('rho-encoded-by-gene', 'rho-protein', 'rho-gene', 'encoded-by', {
    source: 'UniProtKB',
    locator: 'P08100',
    sourceVersion: 'retrieved-2026-09-09',
    versionSemantics: 'retrieval-date',
    retrievedOn: '2026-09-09',
    citation: 'UniProtKB P08100 is reviewed human Rhodopsin, gene RHO, 348 amino acids.',
  }),
  E('rho-gene-reviewed-transcript', 'rho-gene', 'rho-reviewed-transcript', 'has-reviewed-transcript', {
    source: 'NCBI Gene',
    locator: 'GeneID:6010;RefSeq:NM_000539.3',
    sourceVersion: 'RS_2025_08;GRCh38.p14',
    versionSemantics: 'annotation-release',
    retrievedOn: '2026-09-09',
    citation: 'NCBI Gene 6010 lists reviewed RefSeq transcript NM_000539.3.',
  }),
  E('rho-transcript-reviewed-protein', 'rho-reviewed-transcript', 'rho-reviewed-protein-sequence', 'translates-to-reviewed-protein', {
    source: 'NCBI Gene',
    locator: 'NM_000539.3->NP_000530.1',
    sourceVersion: 'RS_2025_08;GRCh38.p14',
    versionSemantics: 'annotation-release',
    retrievedOn: '2026-09-09',
    citation: 'NCBI Gene 6010 maps NM_000539.3 to reviewed rhodopsin protein NP_000530.1.',
  }),
  E('rho-visual-phototransduction-context', 'rho-protein', 'rho-reactome-entity', 'participates-in-pathway-context', {
    source: 'Reactome',
    locator: 'R-HSA-419802',
    sourceVersion: 'retrieved-2026-09-09',
    versionSemantics: 'retrieval-date',
    retrievedOn: '2026-09-09',
    citation: 'Reactome R-HSA-419802 places RHO in human Visual phototransduction and the canonical rod retinoid cycle.',
  }),
] as const

export const EYE_WAVE5_SCIENTIFIC_BOUNDARY =
  'Reference-only molecular bridge. Do not infer patient expression, abundance, mutation, pathogenicity, treatment relevance, activation state, conformation, molecular coordinates, or gross-anatomy geometry.'

const externalParentIds = new Set(EYE_CELL_ORGANELLE_WAVE4.map((item) => item.id))

export function validateEyeMolecularWave5(
  nodes: readonly EyeWave5Node[] = EYE_MOLECULAR_WAVE5_NODES,
  edges: readonly EyeWave5Edge[] = EYE_MOLECULAR_WAVE5_EDGES,
): string[] {
  const errors: string[] = []
  const nodeIds = new Set<string>()

  for (const node of nodes) {
    if (nodeIds.has(node.id)) errors.push(`duplicate-node:${node.id}`)
    nodeIds.add(node.id)
    if (!node.label.trim() || !node.externalIdentifier.trim()) errors.push(`node-identity:${node.id}`)
    if (node.representation !== 'molecular-reference-only') errors.push(`representation:${node.id}`)
    if (node.reviewStatus !== 'academic-review-pending') errors.push(`review:${node.id}`)
    if (node.patientSpecific || node.inferredFromFreeText || node.publicationReady) errors.push(`unsafe-node:${node.id}`)
  }

  const edgeIds = new Set<string>()
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) errors.push(`duplicate-edge:${edge.id}`)
    edgeIds.add(edge.id)
    if (!nodeIds.has(edge.from) && !externalParentIds.has(edge.from)) errors.push(`edge-from:${edge.id}:${edge.from}`)
    if (!nodeIds.has(edge.to) && !externalParentIds.has(edge.to)) errors.push(`edge-to:${edge.id}:${edge.to}`)
    if (!edge.evidence.locator.trim() || !edge.evidence.sourceVersion.trim() || !edge.evidence.citation.trim()) errors.push(`evidence:${edge.id}`)
    if (edge.evidence.retrievedOn !== '2026-09-09') errors.push(`retrieval:${edge.id}`)
    if (edge.patientSpecific || edge.inferredFromFreeText || edge.publicationReady) errors.push(`unsafe-edge:${edge.id}`)
  }

  for (const required of ['rho-protein', 'rho-gene', 'rho-reviewed-transcript', 'rho-reviewed-protein-sequence', 'rho-reactome-entity']) {
    if (!nodeIds.has(required)) errors.push(`required:${required}`)
  }
  if (!externalParentIds.has('rod-outer-segment-discs')) errors.push('wave4-anchor:rod-outer-segment-discs')
  return errors
}
