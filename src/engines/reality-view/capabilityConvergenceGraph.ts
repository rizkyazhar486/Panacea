import {
  CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES,
  type MultiscaleKnowledgeGraphEdge,
} from '../../domains/one-os/omnicausalisRecursiveDiscoveryAndKnowledgeGraphEngine.ts'
import {
  ALPHA_GENOME_ATLAS_BOUNDARY,
  ALPHA_GENOME_SEED_RECORDS,
  type GenomeAtlasRecord,
} from '../../lib/alphaGenomeAtlas.ts'
import { ORGANEL, type Organel } from '../../lib/cellBio.ts'
import { DRUG_TARGETS, type DrugTarget } from '../../lib/drugTargets.ts'
import { FEATURE_MAP, type FeatureMapNode } from '../../lib/navigation/featureMap.ts'
import { SUPER_PAGES, type SuperPageDefinition, type SuperPageId } from '../../lib/superPages.ts'
import type { AnatomicalSystemId } from '../../types/realityView.ts'
import {
  listBindingsBySystem,
  MESH_TO_ONTOLOGY_MAP,
  type MeshOntologyBinding,
} from './anatomyOntologyRegistry.ts'
import {
  DEMOGRAPHIC_COHORTS,
  type DemographicCohortId,
} from './demographicManifold.ts'
import {
  evaluateEducationalPkPdSnapshot,
  MULTIORGAN_SCENARIO_SPECS,
  type EducationalPkPdResult,
  type MultiorganScenarioSpec,
} from './etCausalisMultiorganEngine.ts'

export type SpatialRegistrationStatus =
  | 'spatial_registered_glb'
  | 'conceptual_composite_not_co_registered'
  | 'separate_reference_individual'
  | 'conceptual_reference'

export interface CohortAssetBundle {
  readonly cohortId: DemographicCohortId
  readonly label: string
  readonly shellAssetKey: string
  readonly primarySurfaceGlbPath: string
  readonly primaryIndexJsonPath: string
  readonly secondaryGlbPaths: readonly string[]
  readonly spatialRegistration: SpatialRegistrationStatus
  readonly provenanceNote: string
}

export interface MultiscaleFtuProfile {
  readonly tissueUnitLabel: string
  readonly histologyMicroarchitecture: string
  readonly primaryCellTypes: readonly string[]
  readonly spatialRegistration: 'conceptual_reference'
}

export interface LinkedDrugPkPdProfile {
  readonly target: DrugTarget
  readonly sampleDoseMg: number
  readonly educationalPkPd: EducationalPkPdResult
}

export interface MultiscaleVerticalChain {
  readonly scale1_organ: MeshOntologyBinding
  readonly scale1_spatialRegistration: 'spatial_registered_glb'
  readonly scale2_tissue_ftu: MultiscaleFtuProfile
  readonly scale3_cell: readonly string[]
  readonly scale4_organelles: readonly Organel[]
  readonly scale5_drugs_targets: readonly LinkedDrugPkPdProfile[]
  readonly scale6_genes: readonly GenomeAtlasRecord[]
  readonly scale6_genomicBoundary: string
  readonly scale7_knowledge_graph: readonly MultiscaleKnowledgeGraphEdge[]
  readonly scale8_superpage_links: readonly SuperPageLinkNode[]
}

export interface SuperPageLinkNode {
  readonly id: string
  readonly categoryId: SuperPageId
  readonly categoryLabel: string
  readonly label: string
  readonly cue: string
  readonly to: string
}

export interface OrganConvergenceBundle {
  readonly binding: MeshOntologyBinding
  readonly verticalChain: MultiscaleVerticalChain
  readonly relatedScenarios: readonly MultiorganScenarioSpec[]
  readonly superPageLinks: readonly SuperPageLinkNode[]
}

const FETAL_REFERENCE_GLBS: readonly string[] = Object.freeze([
  'public/bodyexposure/fetus.respiratory.LOD3.glb',
  'public/bodyexposure/fetus.digestive.LOD3.glb',
  'public/bodyexposure/fetus.urinary.LOD3.glb',
])

export function resolveCohortAssetBundle(cohortId: DemographicCohortId): CohortAssetBundle {
  const spec = DEMOGRAPHIC_COHORTS[cohortId] ?? DEMOGRAPHIC_COHORTS.YAD_M
  const primarySurfaceGlbPath = `public/bodyexposure/${spec.shellAssetKey}.surface.LOD3.glb`
  const primaryIndexJsonPath = `public/bodyexposure/${spec.shellAssetKey}.index.json`

  if (cohortId === 'MAT_PREG') {
    return Object.freeze({
      cohortId,
      label: spec.label,
      shellAssetKey: spec.shellAssetKey,
      primarySurfaceGlbPath,
      primaryIndexJsonPath,
      secondaryGlbPaths: FETAL_REFERENCE_GLBS,
      spatialRegistration: 'conceptual_composite_not_co_registered' as const,
      provenanceNote: 'Maternal adult_female shell paired conceptually with SVRTK 25-28w fetal organ atlas (not co-registered MRI of one subject).',
    })
  }

  if (cohortId.startsWith('GER_') || cohortId.startsWith('LON_')) {
    const tsdPrefix = spec.biologicalSex === 'male'
      ? 'public/bodyexposure/tsd_s0327_older_adult_male.skeletal.LOD3.glb'
      : 'public/bodyexposure/tsd_s0196_older_adult_female.skeletal.LOD3.glb'
    return Object.freeze({
      cohortId,
      label: spec.label,
      shellAssetKey: spec.shellAssetKey,
      primarySurfaceGlbPath,
      primaryIndexJsonPath,
      secondaryGlbPaths: Object.freeze([tsdPrefix]),
      spatialRegistration: 'separate_reference_individual' as const,
      provenanceNote: 'ICRP Publication 145 reference shell paired with TotalSegmentator older-adult torso CT anatomy.',
    })
  }

  return Object.freeze({
    cohortId,
    label: spec.label,
    shellAssetKey: spec.shellAssetKey,
    primarySurfaceGlbPath,
    primaryIndexJsonPath,
    secondaryGlbPaths: Object.freeze([]),
    spatialRegistration: 'spatial_registered_glb' as const,
    provenanceNote: 'Direct Z-Anatomy / HuBMAP / ICRP Publication 156 reference shell geometry.',
  })
}

const FTU_BY_SYSTEM: Readonly<Record<AnatomicalSystemId, MultiscaleFtuProfile>> = {
  cardiovascular: {
    tissueUnitLabel: 'Ventricular sarcomere, Purkinje fiber & coronary capillary bed',
    histologyMicroarchitecture: 'Branched striated cardiomyocytes coupled by connexin-43 intercalated discs',
    primaryCellTypes: ['Ventricular cardiomyocyte', 'Sinoatrial nodal cell', 'Vascular endothelial cell'],
    spatialRegistration: 'conceptual_reference',
  },
  respiratory: {
    tissueUnitLabel: 'Alveolar-capillary gas-exchange unit (acinar lobule)',
    histologyMicroarchitecture: 'Thin alveolar septum uniting type I pneumocytes with pulmonary capillary endothelium',
    primaryCellTypes: ['Type I pneumocyte', 'Type II surfactant pneumocyte', 'Alveolar macrophage'],
    spatialRegistration: 'conceptual_reference',
  },
  nervous: {
    tissueUnitLabel: 'Cortical microcircuit, tripartite synapse & neurovascular unit',
    histologyMicroarchitecture: 'Myelinated axon tracts with oligodendrocyte wraps and astrocytic endfeet',
    primaryCellTypes: ['Pyramidal projection neuron', 'Astrocyte', 'Oligodendrocyte'],
    spatialRegistration: 'conceptual_reference',
  },
  musculoskeletal: {
    tissueUnitLabel: 'Motor-unit skeletal fascicle & osteon (Haversian canal)',
    histologyMicroarchitecture: 'Multinucleated sarcomeric myofibers anchored to mineralized lamellar bone',
    primaryCellTypes: ['Type I/IIa skeletal myocyte', 'Osteoblast', 'Osteocyte'],
    spatialRegistration: 'conceptual_reference',
  },
  gastrointestinal: {
    tissueUnitLabel: 'Hexagonal hepatic lobule, gastric gland & intestinal villus',
    histologyMicroarchitecture: 'Zone 1-3 hepatocyte plates bordering fenestrated sinusoids & bile canaliculi',
    primaryCellTypes: ['Hepatocyte', 'Kupffer macrophage', 'Gastric parietal cell'],
    spatialRegistration: 'conceptual_reference',
  },
  renal: {
    tissueUnitLabel: 'Nephron (glomerulus, loop of Henle, juxtaglomerular apparatus)',
    histologyMicroarchitecture: 'Fenestrated glomerular capillary tuft enveloped by podocyte foot processes',
    primaryCellTypes: ['Podocyte', 'Proximal tubular epithelial cell', 'Macula densa cell'],
    spatialRegistration: 'conceptual_reference',
  },
  endocrine: {
    tissueUnitLabel: 'Islet of Langerhans, thyroid follicle & HPT endocrine lobule',
    histologyMicroarchitecture: 'Fenestrated endocrine cords wired to portal microvasculature for pulsatile hormone feedback',
    primaryCellTypes: ['Pancreatic beta cell', 'Thyroid follicular cell', 'Adrenocortical zona fasciculata cell'],
    spatialRegistration: 'conceptual_reference',
  },
  immune_lymphatic: {
    tissueUnitLabel: 'Lymphoid germinal center & splenic periarteriolar lymphoid sheath',
    histologyMicroarchitecture: 'Reticular fibrovascular stroma compartmentalizing B-cell follicles and T-cell zones',
    primaryCellTypes: ['Naive & memory T lymphocyte', 'Follicular B cell', 'Follicular dendritic cell'],
    spatialRegistration: 'conceptual_reference',
  },
  integumentary: {
    tissueUnitLabel: 'Epidermal-dermal rete unit & pilosebaceous thermoregulatory bed',
    histologyMicroarchitecture: 'Stratified keratinized epidermis over dermal papillary microvessels & eccrine coils',
    primaryCellTypes: ['Basal keratinocyte', 'Melanocyte', 'Langerhans dendritic cell'],
    spatialRegistration: 'conceptual_reference',
  },
  reproductive: {
    tissueUnitLabel: 'Prostatic tubuloalveolar acinus, seminiferous tubule & mammary lobule',
    histologyMicroarchitecture: 'Hormone-responsive secretory epithelium supported by fibromuscular stroma',
    primaryCellTypes: ['Secretory luminal epithelial cell', 'Leydig / steroidogenic cell', 'Myoepithelial cell'],
    spatialRegistration: 'conceptual_reference',
  },
}

const SYSTEM_ORGAN_KEYS: Readonly<Record<AnatomicalSystemId, readonly string[]>> = {
  cardiovascular: ['heart'],
  respiratory: ['lungs', 'pharynx', 'nasal-septum'],
  nervous: ['brain', 'spinal-cord', 'ear', 'peripheral-nerves'],
  musculoskeletal: ['skeleton'],
  gastrointestinal: ['liver', 'stomach', 'small-intestine', 'large-intestine', 'gallbladder'],
  renal: ['kidneys', 'bladder'],
  endocrine: ['pancreas', 'thyroid', 'adrenal'],
  immune_lymphatic: ['lungs', 'skin', 'kidneys'],
  integumentary: ['skin', 'nasal-septum'],
  reproductive: ['prostate', 'testis', 'breast', 'kidneys'],
}

const SYSTEM_ORGANELLE_KEYS: Readonly<Record<AnatomicalSystemId, readonly string[]>> = {
  cardiovascular: ['mitokondria', 'ser', 'membran'],
  respiratory: ['mitokondria', 'membran', 'rer'],
  nervous: ['membran', 'sitoskeleton', 'mitokondria'],
  musculoskeletal: ['mitokondria', 'ser', 'sitoskeleton'],
  gastrointestinal: ['ser', 'peroksisom', 'mitokondria'],
  renal: ['mitokondria', 'membran', 'lisosom'],
  endocrine: ['rer', 'golgi', 'mitokondria'],
  immune_lymphatic: ['lisosom', 'rer', 'golgi'],
  integumentary: ['sitoskeleton', 'nukleus', 'lisosom'],
  reproductive: ['ser', 'nukleus', 'golgi'],
}

const SYSTEM_GENE_KEYWORDS: Readonly<Record<AnatomicalSystemId, readonly string[]>> = {
  cardiovascular: ['heart', 'electrophysiology', 'cardiovascular', 'lipid-metabolism'],
  respiratory: ['respiratory', 'DNA-repair', 'cell-cycle'],
  nervous: ['brain', 'neurodegeneration', 'lipid-metabolism'],
  musculoskeletal: ['cell-cycle', 'DNA-repair'],
  gastrointestinal: ['gastrointestinal', 'lipid-metabolism', 'pancreas'],
  renal: ['cell-cycle', 'multi-system'],
  endocrine: ['pancreas', 'lipid-metabolism'],
  immune_lymphatic: ['cell-cycle', 'DNA-repair'],
  integumentary: ['DNA-repair', 'cell-cycle'],
  reproductive: ['breast', 'ovary', 'reproductive'],
}

const FEATURE_NODE_INDEX = new Map<string, { readonly categoryId: SuperPageId; readonly node: FeatureMapNode }>(
  SUPER_PAGES.flatMap((page) => FEATURE_MAP[page.id].map((node) => [node.id, { categoryId: page.id, node }] as const)),
)

const SUPER_PAGE_BY_ID = new Map<SuperPageId, SuperPageDefinition>(SUPER_PAGES.map((p) => [p.id, p]))

const FEATURE_LINK_IDS_BY_SYSTEM: Readonly<Record<AnatomicalSystemId, readonly string[]>> = {
  cardiovascular: ['body-exposure', 'electrophysiology', 'organ-vitality', 'bio-simulators', 'clinical-hub'],
  respiratory: ['body-exposure', 'body-explorer', 'bio-simulators', 'calculators', 'scan'],
  nervous: ['body-explorer', 'radiology', 'med-study', 'clinical-hub', 'health-simulator'],
  musculoskeletal: ['fitness-hub', 'training', 'recovery', 'body-exposure', 'scan'],
  gastrointestinal: ['lab-decoder', 'organ-vitality', 'emr', 'health-simulator', 'body-exposure'],
  renal: ['calculators', 'clinical-scores', 'lab-decoder', 'organ-vitality', 'health-data'],
  endocrine: ['longevity', 'health-simulator', 'bio-simulators', 'lab-decoder', 'health-data'],
  immune_lymphatic: ['body-exposure', 'med-study', 'knowledge', 'clinical-hub', 'health-data'],
  integumentary: ['body-exposure', 'wellness', 'scan', 'clinical-hub', 'profile'],
  reproductive: ['body-exposure', 'genome-lab', 'clinical-hub', 'emr', 'med-study'],
}

export function resolveSystemSuperPageLinks(systemId: AnatomicalSystemId): readonly SuperPageLinkNode[] {
  const ids = FEATURE_LINK_IDS_BY_SYSTEM[systemId] ?? FEATURE_LINK_IDS_BY_SYSTEM.cardiovascular
  const links: SuperPageLinkNode[] = []
  for (const id of ids) {
    const hit = FEATURE_NODE_INDEX.get(id)
    if (!hit) continue
    const cat = SUPER_PAGE_BY_ID.get(hit.categoryId)
    links.push(Object.freeze({
      id: hit.node.id,
      categoryId: hit.categoryId,
      categoryLabel: cat?.shortLabel ?? hit.categoryId,
      label: hit.node.label,
      cue: hit.node.cue,
      to: hit.node.to,
    }))
  }
  return Object.freeze(links)
}

export function resolveMultiscaleVerticalChain(meshId: string): MultiscaleVerticalChain | null {
  const binding = MESH_TO_ONTOLOGY_MAP.get(meshId)
  if (!binding) return null

  const ftu = FTU_BY_SYSTEM[binding.systemId]
  const organelleKeys = new Set(SYSTEM_ORGANELLE_KEYS[binding.systemId])
  const organelles = ORGANEL.filter((o) => organelleKeys.has(o.kunci))

  const organKeys = new Set(SYSTEM_ORGAN_KEYS[binding.systemId])
  const matchedDrugs = DRUG_TARGETS
    .filter((d) => d.sites.some((s) => organKeys.has(s)) || d.efekSamping.some((s) => organKeys.has(s)))
    .slice(0, 4)
  const fallbackDrugs = matchedDrugs.length > 0 ? matchedDrugs : DRUG_TARGETS.slice(0, 2)
  const scale5_drugs_targets: LinkedDrugPkPdProfile[] = fallbackDrugs.map((target, idx) => {
    const sampleDoseMg = idx === 0 ? 40 : 25
    return Object.freeze({
      target,
      sampleDoseMg,
      educationalPkPd: evaluateEducationalPkPdSnapshot({
        doseMg: sampleDoseMg,
        volumeOfDistributionL: 32,
        clearanceLPerHour: 4.5,
        elapsedHours: 4,
        kdMgL: 0.45,
        hillN: 1.0,
      }),
    })
  })

  const geneTags = new Set(SYSTEM_GENE_KEYWORDS[binding.systemId])
  const matchedGenes = ALPHA_GENOME_SEED_RECORDS.filter((g) => g.bodySystems.some((s) => geneTags.has(s)))
  const scale6_genes = matchedGenes.length > 0 ? matchedGenes : [ALPHA_GENOME_SEED_RECORDS[0]]

  const kgEdgeIdSet = new Set(binding.knowledgeGraphEdgeIds)
  const matchedKg = CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES.filter((e) => kgEdgeIdSet.has(e.edgeId))
  const scale7_knowledge_graph = matchedKg.length > 0 ? matchedKg : CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES.slice(0, 2)

  return Object.freeze({
    scale1_organ: binding,
    scale1_spatialRegistration: 'spatial_registered_glb',
    scale2_tissue_ftu: ftu,
    scale3_cell: ftu.primaryCellTypes,
    scale4_organelles: Object.freeze(organelles),
    scale5_drugs_targets: Object.freeze(scale5_drugs_targets),
    scale6_genes: Object.freeze(scale6_genes),
    scale6_genomicBoundary: ALPHA_GENOME_ATLAS_BOUNDARY,
    scale7_knowledge_graph: Object.freeze(scale7_knowledge_graph),
    scale8_superpage_links: resolveSystemSuperPageLinks(binding.systemId),
  })
}

export function resolveOrganConvergenceBundle(meshId: string): OrganConvergenceBundle | null {
  const verticalChain = resolveMultiscaleVerticalChain(meshId)
  if (!verticalChain) return null

  const sysBindings = new Set(listBindingsBySystem(verticalChain.scale1_organ.systemId).map((b) => b.meshId))
  const related = MULTIORGAN_SCENARIO_SPECS.filter((s) => s.primaryMeshId === meshId || sysBindings.has(s.primaryMeshId))
  const relatedScenarios = related.length > 0 ? related : MULTIORGAN_SCENARIO_SPECS.slice(0, 3)

  return Object.freeze({
    binding: verticalChain.scale1_organ,
    verticalChain,
    relatedScenarios: Object.freeze(relatedScenarios),
    superPageLinks: verticalChain.scale8_superpage_links,
  })
}
