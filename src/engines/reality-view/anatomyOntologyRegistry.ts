import { Z_ANATOMY_CLEAR_INDONESIAN_ATLAS } from '../../domains/body-exposure/data/zAnatomyClearIndonesianAtlas.ts'
import { CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES } from '../../domains/one-os/omnicausalisRecursiveDiscoveryAndKnowledgeGraphEngine.ts'
import { INDEKS_TUBUH, type StrukturTubuh } from '../../lib/bodyIndex.gen.ts'
import type { AnatomicalSystemId } from '../../types/realityView.ts'

export interface MeshOntologyBinding {
  readonly meshId: string
  readonly layer: StrukturTubuh['l']
  readonly canonicalOntologyId: string
  readonly snomedCtId: string
  readonly zAnatomyAtlasCardId: string | null
  readonly indonesianLabel: string
  readonly englishLabel: string
  readonly systemId: AnatomicalSystemId
  readonly knowledgeGraphNodeKey: string
  readonly knowledgeGraphEdgeIds: readonly string[]
  readonly selectable: true
  readonly optionalIcd11Tm1Code?: string
}

export interface UnmappedMeshResolution {
  readonly meshId: string
  readonly selectable: false
  readonly binding: null
}

export interface MappedMeshResolution {
  readonly meshId: string
  readonly selectable: true
  readonly binding: MeshOntologyBinding
}

export type MeshResolutionResult = MappedMeshResolution | UnmappedMeshResolution

interface SeedBinding {
  readonly meshId: string
  readonly layer: StrukturTubuh['l']
  readonly canonicalOntologyId: string
  readonly snomedCtId: string
  readonly zAnatomyAtlasCardId: string | null
  readonly indonesianLabel: string
  readonly englishLabel: string
  readonly systemId: AnatomicalSystemId
  readonly knowledgeGraphNodeKey: string
  readonly optionalIcd11Tm1Code?: string
}

const ATLAS_BY_ID = new Map(Z_ANATOMY_CLEAR_INDONESIAN_ATLAS.map((card) => [card.id, card]))
const INDEKS_BY_NAME = new Map(INDEKS_TUBUH.map((entry) => [entry.n, entry]))

function resolveKnowledgeGraphEdges(nodeKey: string, canonicalOntologyId: string): readonly string[] {
  const prefix = canonicalOntologyId.toUpperCase()
  const key = nodeKey.toUpperCase()
  const matched = CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES
    .filter((edge) =>
      edge.sourceNodeId.toUpperCase() === key
      || edge.targetNodeId.toUpperCase() === key
      || edge.sourceNodeId.toUpperCase().startsWith(`${prefix}_`)
      || edge.targetNodeId.toUpperCase().startsWith(`${prefix}_`))
    .map((edge) => edge.edgeId)
  return Object.freeze(matched)
}

/**
 * Deterministic 1:1 anatomical ontology seeds covering all 10 canonical
 * AnatomicalSystemId systems. Every meshId MUST exist verbatim in
 * INDEKS_TUBUH (shipped Z-Anatomy GLB assets) — zero fuzzy matching.
 */
const CANONICAL_MESH_SEEDS: readonly SeedBinding[] = [
  // 1. Cardiovascular
  {
    meshId: 'Left ventricle', layer: 'cardiovascular', canonicalOntologyId: 'FMA:7101', snomedCtId: 'SCTID:87878005',
    zAnatomyAtlasCardId: 'heart-cardiovascular-pump', indonesianLabel: 'Ventrikel kiri jantung',
    englishLabel: 'Left ventricle', systemId: 'cardiovascular', knowledgeGraphNodeKey: 'FMA:7101_LEFT_VENTRICLE',
    optionalIcd11Tm1Code: 'SF50',
  },
  {
    meshId: 'Right ventricle', layer: 'cardiovascular', canonicalOntologyId: 'FMA:7098', snomedCtId: 'SCTID:53085002',
    zAnatomyAtlasCardId: 'heart-cardiovascular-pump', indonesianLabel: 'Ventrikel kanan jantung',
    englishLabel: 'Right ventricle', systemId: 'cardiovascular', knowledgeGraphNodeKey: 'FMA:7088_HEART',
    optionalIcd11Tm1Code: 'SF50',
  },
  {
    meshId: 'Anterior interventricular artery', layer: 'cardiovascular', canonicalOntologyId: 'FMA:3862', snomedCtId: 'SCTID:59438005',
    zAnatomyAtlasCardId: 'heart-cardiovascular-pump', indonesianLabel: 'Arteri koroner desendens anterior kiri (LAD)',
    englishLabel: 'Anterior interventricular artery (LAD)', systemId: 'cardiovascular', knowledgeGraphNodeKey: 'FMA:3862_LAD_CORONARY_ARTERY',
  },
  {
    meshId: 'Ascending aorta', layer: 'cardiovascular', canonicalOntologyId: 'FMA:3736', snomedCtId: 'SCTID:54247002',
    zAnatomyAtlasCardId: 'heart-cardiovascular-pump', indonesianLabel: 'Aorta asendens',
    englishLabel: 'Ascending aorta', systemId: 'cardiovascular', knowledgeGraphNodeKey: 'FMA:7088_HEART',
  },

  // 2. Respiratory
  {
    meshId: 'Trachea', layer: 'visceral', canonicalOntologyId: 'UBERON:0003126', snomedCtId: 'SCTID:44567001',
    zAnatomyAtlasCardId: 'lungs-bronchial-alveolar', indonesianLabel: 'Trakea (saluran napas utama)',
    englishLabel: 'Trachea', systemId: 'respiratory', knowledgeGraphNodeKey: 'PHYSIOLOGY:ARTERIAL_OXYGEN_CONTENT_CAO2',
    optionalIcd11Tm1Code: 'SF60',
  },
  {
    meshId: 'Inferior lobe of left lung', layer: 'visceral', canonicalOntologyId: 'FMA:7195', snomedCtId: 'SCTID:41224006',
    zAnatomyAtlasCardId: 'lungs-bronchial-alveolar', indonesianLabel: 'Lobus inferior paru kiri',
    englishLabel: 'Inferior lobe of left lung', systemId: 'respiratory', knowledgeGraphNodeKey: 'PHYSIOLOGY:ARTERIAL_OXYGEN_CONTENT_CAO2',
    optionalIcd11Tm1Code: 'SF60',
  },
  {
    meshId: 'Inferior lobe of right lung', layer: 'visceral', canonicalOntologyId: 'FMA:7370', snomedCtId: 'SCTID:266005',
    zAnatomyAtlasCardId: 'lungs-bronchial-alveolar', indonesianLabel: 'Lobus inferior paru kanan',
    englishLabel: 'Inferior lobe of right lung', systemId: 'respiratory', knowledgeGraphNodeKey: 'PHYSIOLOGY:ARTERIAL_OXYGEN_CONTENT_CAO2',
  },
  {
    meshId: 'Diaphragm', layer: 'muscular', canonicalOntologyId: 'FMA:13295', snomedCtId: 'SCTID:5798000',
    zAnatomyAtlasCardId: 'lungs-bronchial-alveolar', indonesianLabel: 'Diafragma torakoabdominal',
    englishLabel: 'Diaphragm', systemId: 'respiratory', knowledgeGraphNodeKey: 'PHYSIOLOGY:ARTERIAL_OXYGEN_CONTENT_CAO2',
  },

  // 3. Nervous
  {
    meshId: 'White matter of telencephalon.l', layer: 'nervous', canonicalOntologyId: 'FMA:50801', snomedCtId: 'SCTID:12738006',
    zAnatomyAtlasCardId: 'brain-cerebrovascular-cns', indonesianLabel: 'Substansia alba telensefalon kiri',
    englishLabel: 'Left cerebral white matter', systemId: 'nervous', knowledgeGraphNodeKey: 'FMA:6219_VAGUS_NERVE_CN_X',
  },
  {
    meshId: 'Vagus nerve (X).l', layer: 'nervous', canonicalOntologyId: 'FMA:6219', snomedCtId: 'SCTID:88882009',
    zAnatomyAtlasCardId: 'brain-cerebrovascular-cns', indonesianLabel: 'Saraf vagus kiri (N. X)',
    englishLabel: 'Left vagus nerve (CN X)', systemId: 'nervous', knowledgeGraphNodeKey: 'FMA:6219_VAGUS_NERVE_CN_X',
  },
  {
    meshId: 'White matter of spinal cord', layer: 'nervous', canonicalOntologyId: 'FMA:7647', snomedCtId: 'SCTID:2748008',
    zAnatomyAtlasCardId: 'brain-cerebrovascular-cns', indonesianLabel: 'Medula spinalis (substansia alba)',
    englishLabel: 'Spinal cord white matter', systemId: 'nervous', knowledgeGraphNodeKey: 'FMA:6219_VAGUS_NERVE_CN_X',
  },
  {
    meshId: 'Cochlea.l', layer: 'nervous', canonicalOntologyId: 'FMA:52780', snomedCtId: 'SCTID:80169004',
    zAnatomyAtlasCardId: 'ear-cochleovestibular-ent', indonesianLabel: 'Koklea telinga kiri',
    englishLabel: 'Left cochlea', systemId: 'nervous', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },

  // 4. Musculoskeletal
  {
    meshId: 'External abdominal oblique muscle.l', layer: 'muscular', canonicalOntologyId: 'FMA:13335', snomedCtId: 'SCTID:244845005',
    zAnatomyAtlasCardId: 'external-oblique-abdomen', indonesianLabel: 'Otot obliquus externus abdominis kiri',
    englishLabel: 'Left external abdominal oblique muscle', systemId: 'musculoskeletal', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },
  {
    meshId: 'Rectus abdominis muscle.l', layer: 'muscular', canonicalOntologyId: 'FMA:9628', snomedCtId: 'SCTID:244844009',
    zAnatomyAtlasCardId: 'external-oblique-abdomen', indonesianLabel: 'Otot rektus abdominis kiri',
    englishLabel: 'Left rectus abdominis muscle', systemId: 'musculoskeletal', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },
  {
    meshId: 'Femur.l', layer: 'skeletal', canonicalOntologyId: 'FMA:9611', snomedCtId: 'SCTID:71341001',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Tulang femur kiri',
    englishLabel: 'Left femur', systemId: 'musculoskeletal', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },
  {
    meshId: 'Body of sternum', layer: 'skeletal', canonicalOntologyId: 'FMA:7485', snomedCtId: 'SCTID:56873002',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Korpus sternum',
    englishLabel: 'Body of sternum', systemId: 'musculoskeletal', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },

  // 5. Gastrointestinal
  {
    meshId: 'Liver', layer: 'visceral', canonicalOntologyId: 'FMA:7197', snomedCtId: 'SCTID:10200004',
    zAnatomyAtlasCardId: 'liver-hepatobiliary-pancreas', indonesianLabel: 'Hati (Hepar)',
    englishLabel: 'Liver', systemId: 'gastrointestinal', knowledgeGraphNodeKey: 'ENZYME:CYP2C19_HEPATOCYTE',
    optionalIcd11Tm1Code: 'SF70',
  },
  {
    meshId: 'Stomach', layer: 'visceral', canonicalOntologyId: 'FMA:7148', snomedCtId: 'SCTID:69695003',
    zAnatomyAtlasCardId: 'liver-hepatobiliary-pancreas', indonesianLabel: 'Lambung (Gaster)',
    englishLabel: 'Stomach', systemId: 'gastrointestinal', knowledgeGraphNodeKey: 'ENZYME:CYP2C19_HEPATOCYTE',
    optionalIcd11Tm1Code: 'SF80',
  },
  {
    meshId: 'Gallbladder', layer: 'visceral', canonicalOntologyId: 'FMA:7202', snomedCtId: 'SCTID:28231008',
    zAnatomyAtlasCardId: 'liver-hepatobiliary-pancreas', indonesianLabel: 'Kandung empedu (Vesica biliaris)',
    englishLabel: 'Gallbladder', systemId: 'gastrointestinal', knowledgeGraphNodeKey: 'ENZYME:CYP2C19_HEPATOCYTE',
  },

  // 6. Renal
  {
    meshId: 'Kidney.l', layer: 'visceral', canonicalOntologyId: 'FMA:7205', snomedCtId: 'SCTID:18639004',
    zAnatomyAtlasCardId: 'kidneys-nephron-urinary', indonesianLabel: 'Ginjal kiri (Ren sinister)',
    englishLabel: 'Left kidney', systemId: 'renal', knowledgeGraphNodeKey: 'UNIPROT:P31639_SLC5A2_SGLT2',
    optionalIcd11Tm1Code: 'SF90',
  },
  {
    meshId: 'Kidney.r', layer: 'visceral', canonicalOntologyId: 'FMA:7204', snomedCtId: 'SCTID:9846003',
    zAnatomyAtlasCardId: 'kidneys-nephron-urinary', indonesianLabel: 'Ginjal kanan (Ren dexter)',
    englishLabel: 'Right kidney', systemId: 'renal', knowledgeGraphNodeKey: 'UNIPROT:P31639_SLC5A2_SGLT2',
    optionalIcd11Tm1Code: 'SF90',
  },
  {
    meshId: 'Urinary bladder', layer: 'visceral', canonicalOntologyId: 'FMA:15900', snomedCtId: 'SCTID:89837001',
    zAnatomyAtlasCardId: 'kidneys-nephron-urinary', indonesianLabel: 'Kandung kemih (Vesica urinaria)',
    englishLabel: 'Urinary bladder', systemId: 'renal', knowledgeGraphNodeKey: 'UNIPROT:P31639_SLC5A2_SGLT2',
  },

  // 7. Endocrine
  {
    meshId: 'Pancreas', layer: 'visceral', canonicalOntologyId: 'FMA:7198', snomedCtId: 'SCTID:15776009',
    zAnatomyAtlasCardId: 'pancreas-endocrine-exocrine', indonesianLabel: 'Pankreas (endokrin & eksokrin)',
    englishLabel: 'Pancreas', systemId: 'endocrine', knowledgeGraphNodeKey: 'PATHWAY:AMPK_KINASE',
  },
  {
    meshId: 'Thyroid gland', layer: 'visceral', canonicalOntologyId: 'FMA:9603', snomedCtId: 'SCTID:69748006',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Kelenjar tiroid',
    englishLabel: 'Thyroid gland', systemId: 'endocrine', knowledgeGraphNodeKey: 'HORMONE:ANGIOTENSIN_II',
  },
  {
    meshId: 'Suprarenal gland.l', layer: 'visceral', canonicalOntologyId: 'FMA:15633', snomedCtId: 'SCTID:23451007',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Kelenjar adrenal kiri',
    englishLabel: 'Left adrenal gland', systemId: 'endocrine', knowledgeGraphNodeKey: 'HORMONE:ANGIOTENSIN_II',
  },
  {
    meshId: 'Adenohypophysis', layer: 'visceral', canonicalOntologyId: 'FMA:74627', snomedCtId: 'SCTID:62818001',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Hipofisis anterior (Adenohipofisis)',
    englishLabel: 'Anterior pituitary (Adenohypophysis)', systemId: 'endocrine', knowledgeGraphNodeKey: 'HORMONE:ANGIOTENSIN_II',
  },

  // 8. Immune / Lymphatic
  {
    meshId: 'Spleen', layer: 'lymphoid', canonicalOntologyId: 'FMA:7196', snomedCtId: 'SCTID:78961009',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Limpa (Lien)',
    englishLabel: 'Spleen', systemId: 'immune_lymphatic', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
    optionalIcd11Tm1Code: 'SF57',
  },
  {
    meshId: 'Left lobe of thymus', layer: 'lymphoid', canonicalOntologyId: 'FMA:9607', snomedCtId: 'SCTID:9875009',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Lobus kiri timus',
    englishLabel: 'Left lobe of thymus', systemId: 'immune_lymphatic', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },

  // 9. Integumentary
  {
    meshId: 'Umbilical region.l', layer: 'surface', canonicalOntologyId: 'FMA:61584', snomedCtId: 'SCTID:90290004',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Permukaan kulit regio umbilikalis kiri',
    englishLabel: 'Left umbilical surface region', systemId: 'integumentary', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },
  {
    meshId: 'Zygomatic region.l', layer: 'surface', canonicalOntologyId: 'FMA:24742', snomedCtId: 'SCTID:88824007',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Permukaan kulit regio zigomatika kiri',
    englishLabel: 'Left zygomatic surface region', systemId: 'integumentary', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },

  // 10. Reproductive
  {
    meshId: 'Prostate', layer: 'visceral', canonicalOntologyId: 'FMA:9600', snomedCtId: 'SCTID:41216001',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Kelenjar prostat',
    englishLabel: 'Prostate gland', systemId: 'reproductive', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },
  {
    meshId: 'Testis.l', layer: 'visceral', canonicalOntologyId: 'FMA:7214', snomedCtId: 'SCTID:63239009',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Testis kiri',
    englishLabel: 'Left testis', systemId: 'reproductive', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },
  {
    meshId: 'Mammary region.l', layer: 'surface', canonicalOntologyId: 'FMA:24815', snomedCtId: 'SCTID:76752008',
    zAnatomyAtlasCardId: null, indonesianLabel: 'Regio mammae kiri',
    englishLabel: 'Left mammary region', systemId: 'reproductive', knowledgeGraphNodeKey: 'ASSET:Z_ANATOMY_GLB_LAYERS',
  },
]

function buildOntologyMap(): ReadonlyMap<string, MeshOntologyBinding> {
  const map = new Map<string, MeshOntologyBinding>()
  for (const seed of CANONICAL_MESH_SEEDS) {
    const shipped = INDEKS_BY_NAME.get(seed.meshId)
    if (!shipped || shipped.l !== seed.layer) continue
    const atlasCard = seed.zAnatomyAtlasCardId ? ATLAS_BY_ID.get(seed.zAnatomyAtlasCardId) ?? null : null
    const edges = resolveKnowledgeGraphEdges(seed.knowledgeGraphNodeKey, seed.canonicalOntologyId)
    map.set(seed.meshId, Object.freeze({
      meshId: seed.meshId,
      layer: seed.layer,
      canonicalOntologyId: seed.canonicalOntologyId,
      snomedCtId: seed.snomedCtId,
      zAnatomyAtlasCardId: atlasCard ? atlasCard.id : null,
      indonesianLabel: seed.indonesianLabel,
      englishLabel: seed.englishLabel,
      systemId: seed.systemId,
      knowledgeGraphNodeKey: seed.knowledgeGraphNodeKey,
      knowledgeGraphEdgeIds: edges,
      selectable: true,
      optionalIcd11Tm1Code: seed.optionalIcd11Tm1Code,
    }))
  }
  return map
}

/** Strict O(1) 1:1 meshId -> canonical ontology binding map. Zero fuzzy matching. */
export const MESH_TO_ONTOLOGY_MAP: ReadonlyMap<string, MeshOntologyBinding> = buildOntologyMap()

export const REGISTERED_CANONICAL_MESH_COUNT = CANONICAL_MESH_SEEDS.length

/**
 * Deterministic O(1) lookup for raycasted 3D meshes.
 * Unmapped / decorative / shell meshes cleanly resolve to `{ selectable: false }`
 * without fuzzy matching or runtime throws.
 */
export function resolveMeshOntology(meshId: string): MeshResolutionResult {
  if (typeof meshId !== 'string' || meshId.length === 0) {
    return { meshId: '', selectable: false, binding: null }
  }
  const binding = MESH_TO_ONTOLOGY_MAP.get(meshId)
  if (!binding) return { meshId, selectable: false, binding: null }
  return { meshId, selectable: true, binding }
}

/**
 * Returns optional WHO ICD-11 Ch. 26 / TM1 dual-coding semantic metadata without
 * ever mutating meshId, geometry transforms, or clinical safety locks.
 */
export function projectTm1DualCodingMetadata(
  meshId: string,
  dualCodingTm1Enabled: boolean,
): { readonly meshId: string; readonly canonicalOntologyId: string | null; readonly icd11Tm1Code?: string } {
  const res = resolveMeshOntology(meshId)
  if (!res.selectable) return { meshId, canonicalOntologyId: null }
  return {
    meshId: res.binding.meshId,
    canonicalOntologyId: res.binding.canonicalOntologyId,
    ...(dualCodingTm1Enabled && res.binding.optionalIcd11Tm1Code
      ? { icd11Tm1Code: res.binding.optionalIcd11Tm1Code }
      : {}),
  }
}

export function listBindingsBySystem(systemId: AnatomicalSystemId): readonly MeshOntologyBinding[] {
  return [...MESH_TO_ONTOLOGY_MAP.values()].filter((b) => b.systemId === systemId)
}
