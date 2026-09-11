import { EYE_CELL_ORGANELLE_WAVE4 } from './eyeCellOrganelleWave4'

export type ConeOpsinScale = 'protein' | 'gene' | 'sequence-reference' | 'pathway-context'
export type ConeOpsinCrossDatabaseStatus = 'verified-reference-link' | 'blocked-pending-exact-stable-id'

export interface ConeOpsinNode {
  id: string
  label: string
  scale: ConeOpsinScale
  externalIdentifier: string
  crossDatabaseStatus: ConeOpsinCrossDatabaseStatus
  representation: 'molecular-reference-only'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  inferredFromFreeText: false
  publicationReady: false
}

export interface ConeOpsinEvidence {
  source: 'Reactome' | 'UniProtKB' | 'NCBI Gene'
  locator: string
  sourceVersion: string
  versionSemantics: 'annotation-release' | 'retrieval-date'
  retrievedOn: '2026-09-09'
  citation: string
}

export interface ConeOpsinEdge {
  id: string
  from: string
  to: string
  relation: 'localized-to' | 'encoded-by' | 'has-reviewed-sequence' | 'participates-in-cone-phototransduction-context'
  evidence: ConeOpsinEvidence
  patientSpecific: false
  inferredFromFreeText: false
  publicationReady: false
}

const N = (
  id: string,
  label: string,
  scale: ConeOpsinScale,
  externalIdentifier: string,
  crossDatabaseStatus: ConeOpsinCrossDatabaseStatus = 'verified-reference-link',
): ConeOpsinNode => ({
  id,
  label,
  scale,
  externalIdentifier,
  crossDatabaseStatus,
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
  relation: ConeOpsinEdge['relation'],
  evidence: ConeOpsinEvidence,
): ConeOpsinEdge => ({
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
 * Wave 5B expands the molecular eye atlas to cone opsin references.
 * L- and S-opsin receive exact protein / Reactome / gene anchors.
 * M-opsin remains gene-level only until an exact human protein + Reactome stable
 * identity is independently pinned; the catalog must not infer that link.
 *
 * No spectral peak, phenotype, disease, mutation, abundance, activation state,
 * treatment relevance, or patient-specific expression is inferred here.
 */
export const EYE_CONE_OPSIN_WAVE5B_NODES: readonly ConeOpsinNode[] = [
  N('opn1lw-protein', 'Long-wave-sensitive opsin 1', 'protein', 'UniProtKB:P04000'),
  N('opn1lw-reactome', 'OPN1LW in photoreceptor disc membrane', 'pathway-context', 'Reactome:R-HSA-419769'),
  N('opn1lw-gene', 'OPN1LW gene', 'gene', 'NCBI-Gene:5956;Ensembl:ENSG00000102076'),
  N('opn1lw-reviewed-transcript', 'OPN1LW reviewed transcript', 'sequence-reference', 'RefSeq:NM_020061.6'),
  N('opn1lw-reviewed-protein-sequence', 'OPN1LW reviewed protein sequence', 'sequence-reference', 'RefSeq:NP_064445.2'),

  N('opn1sw-protein', 'Short-wave-sensitive opsin 1', 'protein', 'UniProtKB:P03999'),
  N('opn1sw-reactome', 'OPN1SW in photoreceptor disc membrane', 'pathway-context', 'Reactome:R-HSA-419772'),
  N('opn1sw-gene', 'OPN1SW gene', 'gene', 'NCBI-Gene:611;Ensembl:ENSG00000128617'),

  N(
    'opn1mw-gene',
    'OPN1MW gene',
    'gene',
    'NCBI-Gene:2652;Ensembl:ENSG00000268221',
    'blocked-pending-exact-stable-id',
  ),
] as const

export const EYE_CONE_OPSIN_WAVE5B_EDGES: readonly ConeOpsinEdge[] = [
  E('opn1lw-localized-disc', 'opn1lw-protein', 'cone-outer-segment-discs', 'localized-to', {
    source: 'Reactome',
    locator: 'R-HSA-419769',
    sourceVersion: 'retrieved-2026-09-09',
    versionSemantics: 'retrieval-date',
    retrievedOn: '2026-09-09',
    citation: 'Reactome R-HSA-419769: OPN1LW [photoreceptor disc membrane], Homo sapiens.',
  }),
  E('opn1lw-encoded-by', 'opn1lw-protein', 'opn1lw-gene', 'encoded-by', {
    source: 'NCBI Gene',
    locator: 'GeneID:5956;Ensembl:ENSG00000102076',
    sourceVersion: 'RS_2025_08;GRCh38.p14',
    versionSemantics: 'annotation-release',
    retrievedOn: '2026-09-09',
    citation: 'NCBI Gene 5956 identifies human OPN1LW and Ensembl ENSG00000102076.',
  }),
  E('opn1lw-reviewed-sequence', 'opn1lw-gene', 'opn1lw-reviewed-transcript', 'has-reviewed-sequence', {
    source: 'NCBI Gene',
    locator: 'NM_020061.6->NP_064445.2',
    sourceVersion: 'RS_2025_08;GRCh38.p14',
    versionSemantics: 'annotation-release',
    retrievedOn: '2026-09-09',
    citation: 'NCBI Gene 5956 lists reviewed NM_020061.6 mapping to NP_064445.2 and UniProtKB P04000.',
  }),
  E('opn1lw-cone-pathway-context', 'opn1lw-protein', 'opn1lw-reactome', 'participates-in-cone-phototransduction-context', {
    source: 'Reactome',
    locator: 'R-HSA-419769',
    sourceVersion: 'retrieved-2026-09-09',
    versionSemantics: 'retrieval-date',
    retrievedOn: '2026-09-09',
    citation: 'Reactome places OPN1LW in human visual phototransduction and the cone retinoid cycle.',
  }),

  E('opn1sw-localized-disc', 'opn1sw-protein', 'cone-outer-segment-discs', 'localized-to', {
    source: 'Reactome',
    locator: 'R-HSA-419772',
    sourceVersion: 'retrieved-2026-09-09',
    versionSemantics: 'retrieval-date',
    retrievedOn: '2026-09-09',
    citation: 'Reactome R-HSA-419772: OPN1SW [photoreceptor disc membrane], Homo sapiens.',
  }),
  E('opn1sw-encoded-by', 'opn1sw-protein', 'opn1sw-gene', 'encoded-by', {
    source: 'NCBI Gene',
    locator: 'GeneID:611;Ensembl:ENSG00000128617',
    sourceVersion: 'RS_2025_08',
    versionSemantics: 'annotation-release',
    retrievedOn: '2026-09-09',
    citation: 'NCBI Gene 611 identifies human OPN1SW and Ensembl ENSG00000128617.',
  }),
  E('opn1sw-cone-pathway-context', 'opn1sw-protein', 'opn1sw-reactome', 'participates-in-cone-phototransduction-context', {
    source: 'Reactome',
    locator: 'R-HSA-419772',
    sourceVersion: 'retrieved-2026-09-09',
    versionSemantics: 'retrieval-date',
    retrievedOn: '2026-09-09',
    citation: 'Reactome places OPN1SW in human visual phototransduction and the cone retinoid cycle.',
  }),
] as const

export const EYE_CONE_OPSIN_WAVE5B_BOUNDARY =
  'Reference-only cone molecular catalog. Do not infer spectral maxima, color phenotype, mutation, pathogenicity, patient expression, abundance, activation state, treatment relevance, or synthetic molecular geometry.'

const externalIds = new Set(EYE_CELL_ORGANELLE_WAVE4.map((item) => item.id))

export function validateEyeConeOpsinWave5b(
  nodes: readonly ConeOpsinNode[] = EYE_CONE_OPSIN_WAVE5B_NODES,
  edges: readonly ConeOpsinEdge[] = EYE_CONE_OPSIN_WAVE5B_EDGES,
): string[] {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const node of nodes) {
    if (ids.has(node.id)) errors.push(`duplicate-node:${node.id}`)
    ids.add(node.id)
    if (!node.label.trim() || !node.externalIdentifier.trim()) errors.push(`identity:${node.id}`)
    if (node.representation !== 'molecular-reference-only') errors.push(`representation:${node.id}`)
    if (node.reviewStatus !== 'academic-review-pending') errors.push(`review:${node.id}`)
    if (node.patientSpecific || node.inferredFromFreeText || node.publicationReady) errors.push(`unsafe-node:${node.id}`)
  }

  const edgeIds = new Set<string>()
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) errors.push(`duplicate-edge:${edge.id}`)
    edgeIds.add(edge.id)
    if (!ids.has(edge.from) && !externalIds.has(edge.from)) errors.push(`from:${edge.id}:${edge.from}`)
    if (!ids.has(edge.to) && !externalIds.has(edge.to)) errors.push(`to:${edge.id}:${edge.to}`)
    if (!edge.evidence.locator.trim() || !edge.evidence.sourceVersion.trim() || !edge.evidence.citation.trim()) errors.push(`evidence:${edge.id}`)
    if (edge.patientSpecific || edge.inferredFromFreeText || edge.publicationReady) errors.push(`unsafe-edge:${edge.id}`)
  }

  if (!externalIds.has('cone-outer-segment-discs')) errors.push('wave4-anchor:cone-outer-segment-discs')
  if (nodes.find((node) => node.id === 'opn1mw-gene')?.crossDatabaseStatus !== 'blocked-pending-exact-stable-id') {
    errors.push('opn1mw-cross-database-must-remain-blocked')
  }
  return errors
}
