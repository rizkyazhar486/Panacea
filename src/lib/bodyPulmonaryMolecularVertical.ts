import {
  canRenderInGrossBody3D,
  validateMultiscaleBridge,
  type MultiscaleBridge,
  type MultiscaleEvidenceRef,
  type WithheldScale,
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

// Tiga skala teratas (tubuh utuh, sistem, organ) kosong karena SATU sebab yang sama dan dapat
// dibuktikan dari repositori: aset anatominya ada, tetapi tidak ada revisi sumber, id aset, atau
// hash isi yang dipin. Kebijakan sumber skala-skala ini mensyaratkan id struktur/aset yang persis
// dan revisi sumber (bodyMultiscaleSourcePolicy.ts), jadi simpulnya tidak dibuat. Model organ di
// /public/organs sengaja TIDAK dipakai: dibangkitkan AI (src/lib/organModels.ts), bukan bukti
// anatomi kasar. Gate skala-kosong-dijelaskan menjaga premis ini: bila revisi sumber kelak dipin
// di CREDITS, gate itu gagal dan catatan ini harus diganti simpul sungguhan.
export const PULMONARY_SFTPC_WITHHELD_GAPS: readonly WithheldScale[] = [
  {
    scale: 'whole-body',
    label: 'Whole-body reference figure',
    kind: 'not-yet-modeled',
    reason: 'VERTICAL GAP — NOT YET MODELED: the full-body figure (public/anatomy: skeletal, muscular, cardiovascular, nervous and visceral layers) is derived from Z-Anatomy (CC BY-SA 4.0), but the repository records no pinned source revision, asset id or content hash for it. The whole-body source policy requires an exact atlas structure id and a source revision, so no whole-body node is created.',
    evidence: null,
  },
  {
    scale: 'system',
    label: 'Respiratory system',
    kind: 'not-yet-modeled',
    reason: 'VERTICAL GAP — NOT YET MODELED: the respiratory module (public/atlas/respirasi.glb: airway tree to segmental bronchi, diaphragm, chest wall) is packaged from BodyParts3D 4.0 via ashemag/human-atlas, but no packaging revision, asset id or content hash is pinned in the repository. The system-scale source policy requires an exact structure id and a source revision, so no system node is created.',
    evidence: null,
  },
  {
    scale: 'organ',
    label: 'Lungs and pleura',
    kind: 'not-yet-modeled',
    reason: 'VERTICAL GAP — NOT YET MODELED: lung and pleura gross anatomy ships as public/atlas/paru.glb from Z-Anatomy (CC BY-SA 4.0), but only the upstream repository is named; no pinned source revision, asset id or content hash is recorded. The organ-scale source policy requires an exact organ/asset id and a source revision, so no organ node is created. The AI-generated lung model in /organs is an approximation and is not accepted as gross-anatomy evidence.',
    evidence: null,
  },
  {
    scale: 'organelle',
    label: 'Lamellar body',
    kind: 'withheld-by-policy',
    reason: 'Reactome v97 records SFTPC in the lamellar-body compartment, but the current organelle source policy only accepts Human Protein Atlas subcellular localization. HPA v25.1 reports SFTPC subcellular location as unavailable, so this node stays withheld.',
    evidence: reactomeSftpcLamellarBody,
  },
  {
    scale: 'molecule',
    label: 'Pulmonary surfactant lipid species',
    kind: 'withheld-by-policy',
    reason: 'No single small-molecule identity is substituted for the heterogeneous pulmonary surfactant lipid mixture. A molecule node requires an exact compound/component identity and its own provenance.',
    evidence: null,
  },
]

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
