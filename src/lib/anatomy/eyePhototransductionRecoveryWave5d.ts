import { EYE_PHOTOTRANSDUCTION_WAVE5C_NODES } from './eyePhototransductionWave5c'

export type EyeRecoveryScale = 'gene' | 'protein-entity' | 'reaction'

export interface EyeRecoveryNode {
  id: string
  label: string
  scale: EyeRecoveryScale
  externalIdentifier: string
  representation: 'molecular-reference-only' | 'conceptual-reaction'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  inferredFromFreeText: false
  publicationReady: false
}

export interface EyeRecoveryEvidence {
  source: 'Reactome' | 'NCBI Gene'
  locator: string
  sourceVersion: string
  versionSemantics: 'annotation-release' | 'retrieval-date'
  retrievedOn: '2026-09-09'
  citation: string
}

export interface EyeRecoveryEdge {
  id: string
  from: string
  to: string
  relation: 'gene-reference' | 'protein-reference' | 'member-of-recovery' | 'calcium-control-context' | 'deactivation-context'
  evidence: EyeRecoveryEvidence
  patientSpecific: false
  inferredFromFreeText: false
  publicationReady: false
}

const N = (
  id: string,
  label: string,
  scale: EyeRecoveryScale,
  externalIdentifier: string,
  representation: EyeRecoveryNode['representation'] = 'molecular-reference-only',
): EyeRecoveryNode => ({
  id,
  label,
  scale,
  externalIdentifier,
  representation,
  reviewStatus: 'academic-review-pending',
  patientSpecific: false,
  inferredFromFreeText: false,
  publicationReady: false,
})

const reactomeEvidence = (locator: string, citation: string): EyeRecoveryEvidence => ({
  source: 'Reactome',
  locator,
  sourceVersion: 'retrieved-2026-09-09',
  versionSemantics: 'retrieval-date',
  retrievedOn: '2026-09-09',
  citation,
})

const ncbiEvidence = (locator: string, citation: string): EyeRecoveryEvidence => ({
  source: 'NCBI Gene',
  locator,
  sourceVersion: 'RS_2025_08;GRCh38.p14',
  versionSemantics: 'annotation-release',
  retrievedOn: '2026-09-09',
  citation,
})

const E = (
  id: string,
  from: string,
  to: string,
  relation: EyeRecoveryEdge['relation'],
  evidence: EyeRecoveryEvidence,
): EyeRecoveryEdge => ({
  id,
  from,
  to,
  relation,
  evidence,
  patientSpecific: false,
  inferredFromFreeText: false,
  publicationReady: false,
})

export const EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_NODES: readonly EyeRecoveryNode[] = [
  N('rcvrn-gene', 'RCVRN gene', 'gene', 'NCBI-Gene:5957;Ensembl:ENSG00000109047'),
  N('slc24a1-gene', 'SLC24A1 gene', 'gene', 'NCBI-Gene:9187;Ensembl:ENSG00000074621'),
  N('rcvrn-cytosol', 'RCVRN in cytosol', 'protein-entity', 'Reactome:R-HSA-62913'),
  N('rcvrn-ca2-inhibits-grk1', 'RCVRN:Ca2+ binds to and inhibits GRK1', 'reaction', 'Reactome:R-HSA-3229213', 'conceptual-reaction'),
  N('grk1-phosphorylates-mii', 'GRK1,4,7 phosphorylate MII to p-MII', 'reaction', 'Reactome:R-HSA-2581474', 'conceptual-reaction'),
  N('gnat1-gtp-hydrolysis', 'GNAT1-GTP hydrolyses its bound GTP to GDP', 'reaction', 'Reactome:R-HSA-2584246', 'conceptual-reaction'),
  N('slc24a1-calcium-exchange', 'SLC24A1 exchanges 4Na+ for Ca2+, K+', 'reaction', 'Reactome:R-HSA-2514891', 'conceptual-reaction'),
] as const

export const EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_EDGES: readonly EyeRecoveryEdge[] = [
  E('rcvrn-gene-reference', 'rcvrn-gene', 'rcvrn-cytosol', 'gene-reference', ncbiEvidence('GeneID:5957;Ensembl:ENSG00000109047', 'NCBI Gene identifies human RCVRN (recoverin).')),
  E('slc24a1-gene-reference', 'slc24a1-gene', 'slc24a1-calcium-exchange', 'gene-reference', ncbiEvidence('GeneID:9187;Ensembl:ENSG00000074621', 'NCBI Gene identifies human SLC24A1 (NCKX1), a retinal sodium/calcium-potassium exchanger.')),
  E('rcvrn-protein-reference', 'rcvrn-cytosol', 'rcvrn-ca2-inhibits-grk1', 'protein-reference', reactomeEvidence('R-HSA-62913->R-HSA-3229213', 'Reactome places human RCVRN in the RCVRN:Ca2+ / GRK1 inhibitory reaction.')),
  E('rcvrn-recovery-context', 'rcvrn-ca2-inhibits-grk1', 'recovery-cascade', 'calcium-control-context', reactomeEvidence('R-HSA-3229213->R-HSA-2514859', 'Reactome places RCVRN:Ca2+ inhibition of GRK1 within inactivation, recovery and regulation of phototransduction.')),
  E('grk1-recovery-context', 'grk1-phosphorylates-mii', 'recovery-cascade', 'deactivation-context', reactomeEvidence('R-HSA-2581474->R-HSA-2514859', 'Reactome places GRK-mediated MII phosphorylation within phototransduction recovery and regulation.')),
  E('gnat1-recovery-context', 'gnat1-gtp-hydrolysis', 'recovery-cascade', 'deactivation-context', reactomeEvidence('R-HSA-2584246->R-HSA-2514859', 'Reactome places GNAT1-GTP hydrolysis within phototransduction recovery and regulation.')),
  E('slc24a1-activation-context', 'slc24a1-calcium-exchange', 'activation-cascade', 'calcium-control-context', reactomeEvidence('R-HSA-2514891->R-HSA-2485179', 'Reactome places SLC24A1-mediated ion exchange within activation of the human phototransduction cascade.')),
] as const

export const EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_BOUNDARY =
  'Reference-only recovery and calcium-control catalog. Do not infer calcium concentration, voltage, current, kinetic constants, adaptation magnitude, patient phenotype, pathogenicity, treatment relevance, or spatial coordinates.'

const wave5cIds = new Set(EYE_PHOTOTRANSDUCTION_WAVE5C_NODES.map((node) => node.id))

export function validateEyePhototransductionRecoveryWave5d(
  nodes: readonly EyeRecoveryNode[] = EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_NODES,
  edges: readonly EyeRecoveryEdge[] = EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_EDGES,
): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const item of nodes) {
    if (ids.has(item.id)) errors.push(`duplicate-node:${item.id}`)
    ids.add(item.id)
    if (!item.externalIdentifier.trim() || !item.label.trim()) errors.push(`identity:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
    if (item.patientSpecific || item.inferredFromFreeText || item.publicationReady) errors.push(`unsafe-node:${item.id}`)
  }

  const edgeIds = new Set<string>()
  for (const item of edges) {
    if (edgeIds.has(item.id)) errors.push(`duplicate-edge:${item.id}`)
    edgeIds.add(item.id)
    if (!ids.has(item.from) && !wave5cIds.has(item.from)) errors.push(`from:${item.id}:${item.from}`)
    if (!ids.has(item.to) && !wave5cIds.has(item.to)) errors.push(`to:${item.id}:${item.to}`)
    if (!item.evidence.locator.trim() || !item.evidence.sourceVersion.trim() || !item.evidence.citation.trim()) errors.push(`evidence:${item.id}`)
    if (item.patientSpecific || item.inferredFromFreeText || item.publicationReady) errors.push(`unsafe-edge:${item.id}`)
  }

  if (!wave5cIds.has('recovery-cascade')) errors.push('missing-wave5c-anchor:recovery-cascade')
  if (!wave5cIds.has('activation-cascade')) errors.push('missing-wave5c-anchor:activation-cascade')
  return errors
}
