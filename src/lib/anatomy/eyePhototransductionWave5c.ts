export type EyePhototransductionScale = 'gene' | 'pathway' | 'reaction'

export interface EyePhototransductionNode {
  id: string
  label: string
  scale: EyePhototransductionScale
  externalIdentifier: string
  representation: 'molecular-reference-only' | 'conceptual-pathway'
  reviewStatus: 'academic-review-pending'
  patientSpecific: false
  inferredFromFreeText: false
  publicationReady: false
}

export interface EyePhototransductionEvidence {
  source: 'Reactome' | 'NCBI Gene'
  locator: string
  sourceVersion: string
  versionSemantics: 'annotation-release' | 'retrieval-date'
  retrievedOn: '2026-09-09'
  citation: string
}

export interface EyePhototransductionEdge {
  id: string
  from: string
  to: string
  relation:
    | 'member-of-pathway'
    | 'activation-context'
    | 'hydrolysis-context'
    | 'recovery-context'
    | 'gene-reference'
  evidence: EyePhototransductionEvidence
  patientSpecific: false
  inferredFromFreeText: false
  publicationReady: false
}

const node = (
  id: string,
  label: string,
  scale: EyePhototransductionScale,
  externalIdentifier: string,
  representation: EyePhototransductionNode['representation'] = 'molecular-reference-only',
): EyePhototransductionNode => ({
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

const reactomeEvidence = (locator: string, citation: string): EyePhototransductionEvidence => ({
  source: 'Reactome',
  locator,
  sourceVersion: 'retrieved-2026-09-09',
  versionSemantics: 'retrieval-date',
  retrievedOn: '2026-09-09',
  citation,
})

const ncbiEvidence = (locator: string, citation: string): EyePhototransductionEvidence => ({
  source: 'NCBI Gene',
  locator,
  sourceVersion: 'RS_2025_08;GRCh38.p14',
  versionSemantics: 'annotation-release',
  retrievedOn: '2026-09-09',
  citation,
})

const edge = (
  id: string,
  from: string,
  to: string,
  relation: EyePhototransductionEdge['relation'],
  evidence: EyePhototransductionEvidence,
): EyePhototransductionEdge => ({
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
 * Wave 5C is a reference-only molecular signaling catalog for human visual
 * phototransduction. It stores authoritative pathway/reaction/gene identities
 * and explicitly does not model patient state, mutation effects, kinetics,
 * concentrations, membrane voltage, spectral response, or synthetic geometry.
 */
export const EYE_PHOTOTRANSDUCTION_WAVE5C_NODES: readonly EyePhototransductionNode[] = [
  node('visual-phototransduction', 'Visual phototransduction', 'pathway', 'Reactome:R-HSA-2187338', 'conceptual-pathway'),
  node('phototransduction-cascade', 'The phototransduction cascade', 'pathway', 'Reactome:R-HSA-2514856', 'conceptual-pathway'),
  node('activation-cascade', 'Activation of the phototransduction cascade', 'pathway', 'Reactome:R-HSA-2485179', 'conceptual-pathway'),
  node('pde6-hydrolysis', 'PDE6 hydrolyses cGMP to GMP', 'reaction', 'Reactome:R-HSA-74059', 'conceptual-pathway'),
  node('recovery-cascade', 'Inactivation, recovery and regulation of the phototransduction cascade', 'pathway', 'Reactome:R-HSA-2514859', 'conceptual-pathway'),
  node('gnat1-gene', 'GNAT1 gene', 'gene', 'NCBI-Gene:2779;Ensembl:ENSG00000114349'),
  node('pde6a-gene', 'PDE6A gene', 'gene', 'NCBI-Gene:5145;Ensembl:ENSG00000132915'),
  node('pde6b-gene', 'PDE6B gene', 'gene', 'NCBI-Gene:5158;Ensembl:ENSG00000133256'),
  node('cnga1-gene', 'CNGA1 gene', 'gene', 'NCBI-Gene:1259;Ensembl:ENSG00000198515'),
  node('grk1-gene', 'GRK1 gene', 'gene', 'NCBI-Gene:6011;Ensembl:ENSG00000185974'),
  node('sag-gene', 'SAG gene', 'gene', 'NCBI-Gene:6295;Ensembl:ENSG00000130561'),
] as const

export const EYE_PHOTOTRANSDUCTION_WAVE5C_EDGES: readonly EyePhototransductionEdge[] = [
  edge(
    'cascade-member-of-visual',
    'phototransduction-cascade',
    'visual-phototransduction',
    'member-of-pathway',
    reactomeEvidence('R-HSA-2514856->R-HSA-2187338', 'Reactome places The phototransduction cascade within Visual phototransduction in Homo sapiens.'),
  ),
  edge(
    'activation-member-of-cascade',
    'activation-cascade',
    'phototransduction-cascade',
    'activation-context',
    reactomeEvidence('R-HSA-2485179->R-HSA-2514856', 'Reactome places Activation of the phototransduction cascade within The phototransduction cascade in Homo sapiens.'),
  ),
  edge(
    'pde6-hydrolysis-member-of-activation',
    'pde6-hydrolysis',
    'activation-cascade',
    'hydrolysis-context',
    reactomeEvidence('R-HSA-74059->R-HSA-2485179', 'Reactome records PDE6 hydrolysis of cGMP to GMP within activation of human visual phototransduction.'),
  ),
  edge(
    'recovery-member-of-cascade',
    'recovery-cascade',
    'phototransduction-cascade',
    'recovery-context',
    reactomeEvidence('R-HSA-2514859->R-HSA-2514856', 'Reactome places inactivation, recovery and regulation within the human phototransduction cascade.'),
  ),
  edge('gnat1-reference', 'gnat1-gene', 'activation-cascade', 'gene-reference', ncbiEvidence('GeneID:2779;Ensembl:ENSG00000114349', 'NCBI Gene identifies human GNAT1, the rod transducin alpha-subunit gene.')),
  edge('pde6a-reference', 'pde6a-gene', 'pde6-hydrolysis', 'gene-reference', ncbiEvidence('GeneID:5145;Ensembl:ENSG00000132915', 'NCBI Gene identifies human PDE6A, encoding the rod PDE6 alpha subunit.')),
  edge('pde6b-reference', 'pde6b-gene', 'pde6-hydrolysis', 'gene-reference', ncbiEvidence('GeneID:5158;Ensembl:ENSG00000133256', 'NCBI Gene identifies human PDE6B, encoding the rod PDE6 beta subunit.')),
  edge('cnga1-reference', 'cnga1-gene', 'activation-cascade', 'gene-reference', ncbiEvidence('GeneID:1259;Ensembl:ENSG00000198515', 'NCBI Gene identifies human CNGA1 as a phototransduction-associated cGMP-gated channel subunit gene.')),
  edge('grk1-reference', 'grk1-gene', 'recovery-cascade', 'gene-reference', ncbiEvidence('GeneID:6011;Ensembl:ENSG00000185974', 'NCBI Gene identifies human GRK1, which phosphorylates rhodopsin and initiates deactivation.')),
  edge('sag-reference', 'sag-gene', 'recovery-cascade', 'gene-reference', ncbiEvidence('GeneID:6295;Ensembl:ENSG00000130561', 'NCBI Gene identifies human SAG visual arrestin, involved in desensitization of the photoactivated cascade.')),
] as const

export const EYE_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY =
  'Reference-only human phototransduction catalog. Do not infer patient expression, mutation effect, pathogenicity, kinetic constants, molecular abundance, membrane voltage, spectral response, treatment relevance, or gross/subcellular coordinates.'

export function validateEyePhototransductionWave5c(
  nodes: readonly EyePhototransductionNode[] = EYE_PHOTOTRANSDUCTION_WAVE5C_NODES,
  edges: readonly EyePhototransductionEdge[] = EYE_PHOTOTRANSDUCTION_WAVE5C_EDGES,
): string[] {
  const errors: string[] = []
  const nodeIds = new Set<string>()

  for (const item of nodes) {
    if (nodeIds.has(item.id)) errors.push(`duplicate-node:${item.id}`)
    nodeIds.add(item.id)
    if (!item.label.trim() || !item.externalIdentifier.trim()) errors.push(`identity:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
    if (item.patientSpecific || item.inferredFromFreeText || item.publicationReady) errors.push(`unsafe-node:${item.id}`)
  }

  const edgeIds = new Set<string>()
  for (const item of edges) {
    if (edgeIds.has(item.id)) errors.push(`duplicate-edge:${item.id}`)
    edgeIds.add(item.id)
    if (!nodeIds.has(item.from)) errors.push(`from:${item.id}:${item.from}`)
    if (!nodeIds.has(item.to)) errors.push(`to:${item.id}:${item.to}`)
    if (!item.evidence.locator.trim() || !item.evidence.sourceVersion.trim() || !item.evidence.citation.trim()) errors.push(`evidence:${item.id}`)
    if (item.patientSpecific || item.inferredFromFreeText || item.publicationReady) errors.push(`unsafe-edge:${item.id}`)
  }

  const expectedReactome = ['R-HSA-2187338', 'R-HSA-2514856', 'R-HSA-2485179', 'R-HSA-74059', 'R-HSA-2514859']
  for (const stableId of expectedReactome) {
    if (!nodes.some((item) => item.externalIdentifier === `Reactome:${stableId}`)) errors.push(`missing-reactome:${stableId}`)
  }

  return errors
}
