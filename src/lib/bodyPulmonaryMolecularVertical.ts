import {
  canRenderInGrossBody3D,
  validateMultiscaleBridge,
  type MultiscaleBridge,
  type MultiscaleEvidenceRef,
} from './bodyMultiscaleBridge'
import { validateEvidenceSourceForScale } from './bodyMultiscaleSourcePolicy'

const pendingReview = { status: 'pending' } as const

const hpaSftpcLung: MultiscaleEvidenceRef = {
  sourceId: 'human_protein_atlas',
  sourceVersion: '25.1',
  locator: 'ENSG00000168484-SFTPC/tissue/lung; alveolar cells type II=High',
  citation: 'Human Protein Atlas v25.1, SFTPC tissue expression in lung.',
}

const hpaSftpcSingleCell: MultiscaleEvidenceRef = {
  sourceId: 'human_protein_atlas',
  sourceVersion: '25.1',
  locator: 'ENSG00000168484-SFTPC/single+cell; cell type=Alveolar cells type 2',
  citation: 'Human Protein Atlas v25.1, SFTPC single-cell type expression.',
}

const hpaSftpcProtein: MultiscaleEvidenceRef = {
  sourceId: 'human_protein_atlas',
  sourceVersion: '25.1',
  locator: 'ENSG00000168484-SFTPC; protein expression and localization summary',
  citation: 'Human Protein Atlas v25.1, SFTPC protein expression summary.',
}

const reactomeSftpcLamellarBody: MultiscaleEvidenceRef = {
  sourceId: 'reactome',
  sourceVersion: '97',
  locator: 'R-HSA-5683717; species=Homo sapiens; compartment=lamellar body',
  citation: 'Reactome v97, SFTPC [lamellar body], stable identifier R-HSA-5683717.',
}

const reactomeSurfactantMetabolism: MultiscaleEvidenceRef = {
  sourceId: 'reactome',
  sourceVersion: '97',
  locator: 'R-HSA-5683826; species=Homo sapiens; pathway=Surfactant metabolism',
  citation: 'Reactome v97, Surfactant metabolism, stable identifier R-HSA-5683826.',
}

const ensemblSftpc: MultiscaleEvidenceRef = {
  sourceId: 'ensembl_rest_api',
  sourceVersion: '115',
  locator: 'ENSG00000168484; species=Homo sapiens; assembly=GRCh38; release=115',
  citation: 'Ensembl release 115, human GRCh38 reference gene ENSG00000168484 (SFTPC).',
}

/**
 * First production-shaped pulmonary molecular vertical.
 *
 * It intentionally omits an organelle node even though Reactome records SFTPC
 * in a lamellar-body compartment: the current scale-source policy does not yet
 * admit Reactome as organelle evidence. The omission is deliberate and
 * fail-closed; no substitute subcellular geometry or location is fabricated.
 *
 * The protein node is also not rendered as a molecular structure because the
 * evidence in this vertical supports expression/identity, not an experimental
 * SFTPC structure. A future PDB-backed structure can promote that representation
 * only through the normal source-policy + academic-review gates.
 */
export const PULMONARY_SFTPC_MOLECULAR_VERTICAL: MultiscaleBridge = {
  nodes: [
    {
      id: 'pulmonary-sftpc-lung-tissue',
      label: 'Lung tissue reference',
      scale: 'tissue',
      representation: 'cellular-reference',
      evidence: [hpaSftpcLung],
      academicReview: pendingReview,
      patientSpecific: false,
      inferredFromFreeText: false,
      destination: 'cell-lab',
    },
    {
      id: 'pulmonary-sftpc-alveolar-type-2-cell',
      label: 'Alveolar cell type 2',
      scale: 'cell',
      representation: 'cellular-reference',
      evidence: [hpaSftpcSingleCell],
      academicReview: pendingReview,
      patientSpecific: false,
      inferredFromFreeText: false,
      destination: 'cell-lab',
    },
    {
      id: 'pulmonary-sftpc-protein',
      label: 'Surfactant protein C (SFTPC)',
      scale: 'protein',
      representation: 'not-represented',
      evidence: [hpaSftpcProtein],
      academicReview: pendingReview,
      patientSpecific: false,
      inferredFromFreeText: false,
    },
    {
      id: 'pulmonary-surfactant-metabolism-pathway',
      label: 'Surfactant metabolism',
      scale: 'pathway',
      representation: 'conceptual-pathway',
      evidence: [reactomeSurfactantMetabolism],
      academicReview: pendingReview,
      patientSpecific: false,
      inferredFromFreeText: false,
      destination: 'molecular-lab',
    },
    {
      id: 'pulmonary-sftpc-gene',
      label: 'SFTPC gene',
      scale: 'gene',
      representation: 'sequence-reference',
      evidence: [ensemblSftpc],
      academicReview: pendingReview,
      patientSpecific: false,
      inferredFromFreeText: false,
      destination: 'genomics-lab',
    },
  ],
  edges: [
    {
      from: 'pulmonary-sftpc-lung-tissue',
      to: 'pulmonary-sftpc-alveolar-type-2-cell',
      relation: 'has-cell-type',
      evidence: [hpaSftpcLung, hpaSftpcSingleCell],
      academicReview: pendingReview,
      inferredFromFreeText: false,
    },
    {
      from: 'pulmonary-sftpc-alveolar-type-2-cell',
      to: 'pulmonary-sftpc-protein',
      relation: 'reference-link',
      evidence: [hpaSftpcSingleCell, hpaSftpcProtein],
      academicReview: pendingReview,
      inferredFromFreeText: false,
    },
    {
      from: 'pulmonary-sftpc-protein',
      to: 'pulmonary-surfactant-metabolism-pathway',
      relation: 'participates-in-pathway',
      evidence: [reactomeSftpcLamellarBody, reactomeSurfactantMetabolism],
      academicReview: pendingReview,
      inferredFromFreeText: false,
    },
    {
      from: 'pulmonary-sftpc-protein',
      to: 'pulmonary-sftpc-gene',
      relation: 'encoded-by-gene',
      evidence: [hpaSftpcProtein, ensemblSftpc],
      academicReview: pendingReview,
      inferredFromFreeText: false,
    },
  ],
}

export const PULMONARY_SFTPC_WITHHELD_GAPS = [
  {
    scale: 'organelle' as const,
    label: 'Lamellar body',
    reason: 'Reactome v97 records SFTPC in the lamellar-body compartment, but the current organelle source policy only accepts Human Protein Atlas subcellular localization. HPA v25.1 reports SFTPC subcellular location as unavailable, so this node stays withheld.',
    evidence: reactomeSftpcLamellarBody,
  },
  {
    scale: 'molecule' as const,
    label: 'Pulmonary surfactant lipid species',
    reason: 'No single small-molecule identity is substituted for the heterogeneous pulmonary surfactant lipid mixture. A molecule node requires an exact compound/component identity and its own provenance.',
    evidence: null,
  },
] as const

export function validatePulmonarySftpcVertical() {
  const bridge = validateMultiscaleBridge(PULMONARY_SFTPC_MOLECULAR_VERTICAL)
  const sourceReasons: string[] = []

  for (const node of PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes) {
    for (const evidence of node.evidence) {
      const source = validateEvidenceSourceForScale(node.scale, evidence)
      if (!source.valid) sourceReasons.push(...source.reasons.map((reason) => `${node.id}: ${reason}`))
    }
  }

  return {
    valid: bridge.valid && sourceReasons.length === 0,
    publicationReady: bridge.publicationReady && sourceReasons.length === 0,
    reasons: [...new Set([...bridge.reasons, ...sourceReasons])],
  }
}

export function pulmonarySftpcGrossRenderEligible() {
  return PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes.some(canRenderInGrossBody3D)
}
