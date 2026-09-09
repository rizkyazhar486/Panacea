import {
  WHOLE_BODY_REGIONS,
  type AtlasRegionKey,
  type AtlasStructureTarget,
  type GeometryProvenance,
} from '../wholeBodyAtlasBlueprint'

export type HighEndAtlasSystemKey =
  | 'integumentary'
  | 'skeletal'
  | 'muscular'
  | 'cardiovascular'
  | 'respiratory'
  | 'nervous'
  | 'digestive'
  | 'urinary'
  | 'endocrine'
  | 'lymphatic'
  | 'reproductive'
  | 'connective'
  | 'multisystem'

export type HighEndAtlasLaterality = 'left' | 'right' | 'midline' | 'bilateral' | 'not-applicable' | 'variable'
export type HighEndAtlasReviewStatus = 'pending' | 'recorded'
export type HighEndAtlasLevel = 'body' | 'system' | 'region' | 'organ' | 'lobe' | 'segment' | 'tissue' | 'structure' | 'microstructure' | 'cellular'
export type HighEndAtlasRenderClass = 'surface' | 'bone' | 'muscle' | 'vessel' | 'nerve' | 'viscus' | 'lymphatic' | 'microstructure' | 'overlay'

export interface HighEndAtlasEvidenceRef {
  id: string
  url: string
  role: 'anatomy-reference' | 'ontology' | 'geometry-source' | 'interaction-reference'
  versionOrAccessDate: string
}

export interface HighEndAtlasStructure {
  id: string
  label: string
  aliases: readonly string[]
  system: HighEndAtlasSystemKey
  region: AtlasRegionKey | 'whole-body'
  laterality: HighEndAtlasLaterality
  level: HighEndAtlasLevel
  parentId: string | null
  sourceNodeHints: readonly string[]
  geometryProvenance: GeometryProvenance
  renderClass: HighEndAtlasRenderClass
  clinicalImportance: number
  reviewStatus: HighEndAtlasReviewStatus
  evidenceRefs: readonly HighEndAtlasEvidenceRef[]
  tags: readonly string[]
}

export interface AtlasOntologyValidation {
  valid: boolean
  errors: readonly string[]
}

const SYSTEMS: readonly HighEndAtlasSystemKey[] = [
  'integumentary',
  'skeletal',
  'muscular',
  'cardiovascular',
  'respiratory',
  'nervous',
  'digestive',
  'urinary',
  'endocrine',
  'lymphatic',
  'reproductive',
  'connective',
  'multisystem',
]

const TARGET_SYSTEM_OVERRIDES: Readonly<Record<string, HighEndAtlasSystemKey>> = {
  'cranial-skeleton': 'skeletal',
  'facial-muscles': 'muscular',
  'carotid-jugular': 'cardiovascular',
  'cranial-nerves': 'nervous',
  'thoracic-cage': 'skeletal',
  'heart-great-vessels': 'cardiovascular',
  'lungs-airway': 'respiratory',
  'intercostal-bundle': 'multisystem',
  'abdominal-wall': 'muscular',
  hepatobiliary: 'digestive',
  'stomach-bowel': 'digestive',
  'aorta-branches': 'cardiovascular',
  'pelvic-ring': 'skeletal',
  'pelvic-floor': 'muscular',
  'pelvic-viscera': 'multisystem',
  'shoulder-complex': 'skeletal',
  'rotator-cuff': 'muscular',
  'brachial-plexus': 'nervous',
  'hand-tendons': 'muscular',
  'hip-complex': 'skeletal',
  'knee-complex': 'skeletal',
  'lower-limb-muscles': 'muscular',
  'sciatic-tibial-fibular': 'nervous',
  'vertebral-column': 'skeletal',
  paraspinals: 'muscular',
  'spinal-cord-roots': 'nervous',
}

const SYSTEM_RENDER_CLASS: Readonly<Record<HighEndAtlasSystemKey, HighEndAtlasRenderClass>> = {
  integumentary: 'surface',
  skeletal: 'bone',
  muscular: 'muscle',
  cardiovascular: 'vessel',
  respiratory: 'viscus',
  nervous: 'nerve',
  digestive: 'viscus',
  urinary: 'viscus',
  endocrine: 'viscus',
  lymphatic: 'lymphatic',
  reproductive: 'viscus',
  connective: 'overlay',
  multisystem: 'overlay',
}

function targetSystem(target: AtlasStructureTarget): HighEndAtlasSystemKey {
  const explicit = TARGET_SYSTEM_OVERRIDES[target.id]
  if (explicit) return explicit
  if (target.layer === 'skeletal') return 'skeletal'
  if (target.layer === 'muscular') return 'muscular'
  if (target.layer === 'cardiovascular') return 'cardiovascular'
  if (target.layer === 'nervous') return 'nervous'
  if (target.layer === 'lymphoid') return 'lymphatic'
  if (target.layer === 'surface') return 'integumentary'
  return 'multisystem'
}

function normalizeAliases(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

export const HIGH_END_ATLAS_SYSTEM_ROOTS: readonly HighEndAtlasStructure[] = SYSTEMS.map((system) => ({
  id: `system-${system}`,
  label: system.replace(/(^|-)([a-z])/g, (_match, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`),
  aliases: [],
  system,
  region: 'whole-body',
  laterality: 'not-applicable',
  level: 'system',
  parentId: 'human-body',
  sourceNodeHints: [],
  geometryProvenance: 'not-represented',
  renderClass: SYSTEM_RENDER_CLASS[system],
  clinicalImportance: 1,
  reviewStatus: 'pending',
  evidenceRefs: [],
  tags: ['system-root'],
}))

export const HIGH_END_ATLAS_BODY_ROOT: HighEndAtlasStructure = {
  id: 'human-body',
  label: 'Human body',
  aliases: ['whole body'],
  system: 'multisystem',
  region: 'whole-body',
  laterality: 'not-applicable',
  level: 'body',
  parentId: null,
  sourceNodeHints: [],
  geometryProvenance: 'not-represented',
  renderClass: 'overlay',
  clinicalImportance: 1,
  reviewStatus: 'pending',
  evidenceRefs: [],
  tags: ['atlas-root'],
}

export const HIGH_END_ATLAS_BLUEPRINT_NODES: readonly HighEndAtlasStructure[] = WHOLE_BODY_REGIONS.flatMap((region) =>
  region.structures.map((target) => {
    const system = targetSystem(target)
    return {
      id: `target-${target.id}`,
      label: target.label,
      aliases: normalizeAliases(target.nodeHints),
      system,
      region: region.key,
      laterality: 'variable' as const,
      level: target.level,
      parentId: `system-${system}`,
      sourceNodeHints: normalizeAliases(target.nodeHints),
      geometryProvenance: target.provenance,
      renderClass: SYSTEM_RENDER_CLASS[system],
      clinicalImportance: target.level === 'organ' ? 1 : target.level === 'microstructure' ? 0.8 : 0.9,
      reviewStatus: 'pending' as const,
      evidenceRefs: [],
      tags: ['whole-body-blueprint', region.key, target.layer],
    }
  }),
)

export const HIGH_END_WHOLE_BODY_ONTOLOGY_BASE: readonly HighEndAtlasStructure[] = [
  HIGH_END_ATLAS_BODY_ROOT,
  ...HIGH_END_ATLAS_SYSTEM_ROOTS,
  ...HIGH_END_ATLAS_BLUEPRINT_NODES,
]

export function buildHighEndAtlasOntology(extraNodes: readonly HighEndAtlasStructure[] = []) {
  return [...HIGH_END_WHOLE_BODY_ONTOLOGY_BASE, ...extraNodes]
}

export function indexHighEndAtlasOntology(nodes: readonly HighEndAtlasStructure[]) {
  return new Map(nodes.map((node) => [node.id, node] as const))
}

export function atlasChildrenOf(nodes: readonly HighEndAtlasStructure[], parentId: string) {
  return nodes.filter((node) => node.parentId === parentId)
}

export function atlasAncestorsOf(nodes: readonly HighEndAtlasStructure[], nodeId: string) {
  const index = indexHighEndAtlasOntology(nodes)
  const ancestors: HighEndAtlasStructure[] = []
  const seen = new Set<string>()
  let current = index.get(nodeId)
  while (current?.parentId) {
    if (seen.has(current.parentId)) break
    seen.add(current.parentId)
    const parent = index.get(current.parentId)
    if (!parent) break
    ancestors.push(parent)
    current = parent
  }
  return ancestors
}

export function validateHighEndAtlasOntology(nodes: readonly HighEndAtlasStructure[]): AtlasOntologyValidation {
  const errors: string[] = []
  const ids = new Set<string>()
  const index = indexHighEndAtlasOntology(nodes)

  for (const node of nodes) {
    if (!node.id.trim()) errors.push('Atlas node id must not be blank.')
    if (ids.has(node.id)) errors.push(`Duplicate atlas node id: ${node.id}`)
    ids.add(node.id)
    if (node.parentId && !index.has(node.parentId)) errors.push(`Missing parent ${node.parentId} for ${node.id}`)
    if (node.clinicalImportance < 0 || node.clinicalImportance > 1) errors.push(`clinicalImportance must be 0..1 for ${node.id}`)
    if (node.sourceNodeHints.some((hint) => !hint.trim())) errors.push(`Blank source-node hint on ${node.id}`)
    if (new Set(node.sourceNodeHints).size !== node.sourceNodeHints.length) errors.push(`Duplicate source-node hint on ${node.id}`)
  }

  for (const node of nodes) {
    const chain = new Set<string>([node.id])
    let cursor = node
    while (cursor.parentId) {
      if (chain.has(cursor.parentId)) {
        errors.push(`Atlas hierarchy cycle detected from ${node.id} via ${cursor.parentId}`)
        break
      }
      chain.add(cursor.parentId)
      const parent = index.get(cursor.parentId)
      if (!parent) break
      cursor = parent
    }
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] }
}
