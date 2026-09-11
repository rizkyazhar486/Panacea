import type { BiologicalScale, MultiscaleEvidenceRef } from './bodyMultiscaleBridge'

export type MultiscaleSourceRole =
  | 'gross-anatomy'
  | 'tissue-cell-atlas'
  | 'protein-expression-localization'
  | 'experimental-molecular-structure'
  | 'small-molecule-identity'
  | 'pathway-knowledgebase'
  | 'gene-sequence-reference'

export interface MultiscaleSourcePolicyRule {
  scale: BiologicalScale
  acceptedRoles: readonly MultiscaleSourceRole[]
  preferredSourceIds: readonly string[]
  requiredLocatorContext: readonly string[]
  interpretationBoundary: string
}

export const MULTISCALE_SOURCE_POLICY: readonly MultiscaleSourcePolicyRule[] = [
  { scale: 'whole-body', acceptedRoles: ['gross-anatomy'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], requiredLocatorContext: ['exact asset or atlas structure id', 'source revision', 'license/provenance record'], interpretationBoundary: 'Gross reference geometry is not patient-specific anatomy.' },
  { scale: 'system', acceptedRoles: ['gross-anatomy'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], requiredLocatorContext: ['exact system/structure id', 'source revision'], interpretationBoundary: 'System grouping does not create missing geometry or prove functional state.' },
  { scale: 'organ', acceptedRoles: ['gross-anatomy'], preferredSourceIds: ['z_anatomy', 'hubmap_hra', 'nih_3d'], requiredLocatorContext: ['exact organ/asset id', 'source revision'], interpretationBoundary: 'Organ geometry alone cannot establish tissue composition, disease, or patient morphology.' },
  { scale: 'tissue', acceptedRoles: ['tissue-cell-atlas', 'protein-expression-localization'], preferredSourceIds: ['cellxgene_census', 'human_protein_atlas', 'hubmap_hra'], requiredLocatorContext: ['tissue ontology/atlas id', 'dataset/release id', 'study or atlas section'], interpretationBoundary: 'Reference tissue annotations are study/atlas context, not a histology result from the user.' },
  { scale: 'cell', acceptedRoles: ['tissue-cell-atlas', 'protein-expression-localization'], preferredSourceIds: ['cellxgene_census', 'human_protein_atlas'], requiredLocatorContext: ['cell-type ontology id', 'dataset/release id', 'assay or atlas section'], interpretationBoundary: 'Cell-type labels and expression aggregates are reference observations and must retain study/assay context.' },
  { scale: 'organelle', acceptedRoles: ['protein-expression-localization'], preferredSourceIds: ['human_protein_atlas'], requiredLocatorContext: ['gene/protein id', 'subcellular atlas section', 'release id'], interpretationBoundary: 'Subcellular localization evidence is not a measured 3D coordinate inside a rendered patient cell.' },
  { scale: 'molecule', acceptedRoles: ['small-molecule-identity', 'experimental-molecular-structure'], preferredSourceIds: ['pubchem', 'rcsb-pdb'], requiredLocatorContext: ['compound/component id', 'record/entry version or revision'], interpretationBoundary: 'A molecular structure or conformer is an identity/structure reference, not proof of concentration, binding, or activity in a patient.' },
  { scale: 'protein', acceptedRoles: ['experimental-molecular-structure', 'protein-expression-localization'], preferredSourceIds: ['rcsb-pdb', 'human_protein_atlas'], requiredLocatorContext: ['PDB/entity/assembly or gene/protein id', 'method/atlas section', 'release/revision'], interpretationBoundary: 'Experimental structure, expression, and localization are separate evidence classes and must not be collapsed into one certainty score.' },
  { scale: 'pathway', acceptedRoles: ['pathway-knowledgebase'], preferredSourceIds: ['reactome'], requiredLocatorContext: ['stable pathway/reaction id', 'species', 'database release'], interpretationBoundary: 'Pathway membership is curated biological context, not a diagnosis, treatment indication, or measured pathway activity.' },
  { scale: 'gene', acceptedRoles: ['gene-sequence-reference'], preferredSourceIds: ['ensembl_rest_api'], requiredLocatorContext: ['stable gene/transcript id', 'species', 'assembly', 'release'], interpretationBoundary: 'Reference sequence and computational consequence annotations are not clinical pathogenicity classifications.' },
] as const

const policyByScale = new Map(MULTISCALE_SOURCE_POLICY.map((rule) => [rule.scale, rule]))

export function sourcePolicyForScale(scale: BiologicalScale) {
  return policyByScale.get(scale) ?? null
}

export interface MultiscaleSourcePolicyValidation { valid: boolean; reasons: string[] }

/** Source suitability only: this never establishes that two records are biologically linked. */
export function validateEvidenceSourceForScale(scale: BiologicalScale, evidence: MultiscaleEvidenceRef): MultiscaleSourcePolicyValidation {
  const reasons: string[] = []
  const policy = sourcePolicyForScale(scale)
  if (!policy) return { valid: false, reasons: [`No source policy exists for ${scale}.`] }
  if (!policy.preferredSourceIds.includes(evidence.sourceId)) reasons.push(`${evidence.sourceId} is not an approved reference source for ${scale} scale.`)
  if (!evidence.sourceVersion.trim()) reasons.push(`${scale} evidence requires a pinned source version.`)
  if (!evidence.locator.trim()) reasons.push(`${scale} evidence requires a specific source locator.`)
  if (!evidence.citation.trim()) reasons.push(`${scale} evidence requires a citation.`)
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] }
}

export function requiredSourceContextForScale(scale: BiologicalScale) {
  return sourcePolicyForScale(scale)?.requiredLocatorContext ?? []
}
