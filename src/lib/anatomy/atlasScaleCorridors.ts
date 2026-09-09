import type { AtlasManifest, AtlasScale, AtlasSystemId } from './atlasKernel'
import { atlasNodeById } from './atlasKernel'

export interface AtlasScaleCorridor {
  id: string
  system: AtlasSystemId
  /** Broad -> narrow educational navigation sequence. */
  nodeIds: readonly string[]
  purpose: string
}

const SCALE_ORDER: readonly AtlasScale[] = ['organism', 'region', 'organ', 'suborgan', 'tissue', 'microstructure']
const rank = (scale: AtlasScale) => SCALE_ORDER.indexOf(scale)

/**
 * Curated educational corridors. They do not modify canonical parent/child
 * anatomy and do not claim physical adjacency. Their only purpose is to avoid
 * large semantic zoom jumps in a multiscale viewer.
 */
export const WHOLE_BODY_SCALE_CORRIDORS: readonly AtlasScaleCorridor[] = [
  { id: 'corridor:surface-barrier', system: 'surface', nodeIds: ['system:surface', 'he:skin-envelope', 'he:epidermis'], purpose: 'Whole integument -> epidermal barrier bioscale bridge.' },
  { id: 'corridor:skeletal-matrix', system: 'skeletal', nodeIds: ['system:skeletal', 'he:thoracic-cage'], purpose: 'Whole skeleton -> representative bone organ context.' },
  { id: 'corridor:articular-cartilage', system: 'articular', nodeIds: ['system:articular', 'he:knee-complex', 'he:synovial-membrane'], purpose: 'Joint system -> representative joint -> tissue context.' },
  { id: 'corridor:muscle-contractile', system: 'muscular', nodeIds: ['system:muscular', 'he:diaphragm-muscle', 'he:sarcomere-unit'], purpose: 'Muscular system -> muscle organ -> contractile microstructure.' },
  { id: 'corridor:cardiac-energy', system: 'cardiovascular', nodeIds: ['system:cardiovascular', 'cv:heart', 'he:coronary-microvascular-bed'], purpose: 'Cardiovascular system -> heart -> microvascular context.' },
  { id: 'corridor:lymphatic-endothelium', system: 'lymphatic', nodeIds: ['system:lymphatic', 'he:thoracic-duct', 'he:lymphatic-capillary'], purpose: 'Lymphatic system -> collecting structure -> capillary context.' },
  { id: 'corridor:cortex-neuron', system: 'nervous', nodeIds: ['system:nervous', 'neuro:brain', 'he:cerebral-cortex'], purpose: 'Nervous system -> brain -> cortical tissue.' },
  { id: 'corridor:alveolar-gas-exchange', system: 'respiratory', nodeIds: ['system:respiratory', 'resp:lungs', 'he:pulmonary-acinus', 'he:alveolar-blood-gas-barrier'], purpose: 'Respiratory system -> lungs -> acinus -> gas-exchange microstructure.' },
  { id: 'corridor:hepatic-metabolism', system: 'digestive', nodeIds: ['system:digestive', 'gi:liver', 'he:hepatic-lobule'], purpose: 'Digestive system -> liver -> lobular microstructure.' },
  { id: 'corridor:glomerular-filtration', system: 'urinary', nodeIds: ['system:urinary', 'urinary:kidneys', 'he:nephron', 'he:glomerulus'], purpose: 'Urinary system -> kidney -> nephron -> glomerulus.' },
  { id: 'corridor:islet-secretory', system: 'endocrine', nodeIds: ['system:endocrine', 'he:pancreatic-islet'], purpose: 'Endocrine system -> pancreatic islet bioscale bridge.' },
  { id: 'corridor:spermatogenic', system: 'reproductive', nodeIds: ['system:reproductive', 'he:male-ductal-system', 'he:seminiferous-tubule'], purpose: 'Reproductive system -> male ductal context -> seminiferous microstructure.' },
  { id: 'corridor:retinal-phototransduction', system: 'sensory', nodeIds: ['system:sensory', 'he:ocular-globe', 'he:retina', 'he:retinal-photoreceptor-unit'], purpose: 'Sensory system -> eye -> retina -> photoreceptor microstructure.' },
  { id: 'corridor:fascial-matrix', system: 'fascial', nodeIds: ['system:fascial', 'he:deep-fascia'], purpose: 'Fascial system -> deep fascial tissue bioscale bridge.' },
] as const

export interface AtlasScaleCorridorEdge {
  fromId: string
  toId: string
  corridorId: string
  weight: number
}

export function buildAtlasScaleCorridorEdges(manifest: AtlasManifest): AtlasScaleCorridorEdge[] {
  const edges: AtlasScaleCorridorEdge[] = []
  for (const corridor of WHOLE_BODY_SCALE_CORRIDORS) {
    for (let i = 1; i < corridor.nodeIds.length; i += 1) {
      const fromId = corridor.nodeIds[i - 1]
      const toId = corridor.nodeIds[i]
      if (!atlasNodeById(manifest, fromId) || !atlasNodeById(manifest, toId)) continue
      edges.push({ fromId, toId, corridorId: corridor.id, weight: 0.22 })
    }
  }
  return edges
}

export function validateAtlasScaleCorridors(manifest: AtlasManifest): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  for (const corridor of WHOLE_BODY_SCALE_CORRIDORS) {
    if (ids.has(corridor.id)) issues.push(`Duplicate scale corridor id: ${corridor.id}`)
    ids.add(corridor.id)
    if (corridor.nodeIds.length < 2) issues.push(`Scale corridor must contain at least two nodes: ${corridor.id}`)

    let previousRank = -1
    for (const nodeId of corridor.nodeIds) {
      const node = atlasNodeById(manifest, nodeId)
      if (!node) {
        issues.push(`Scale corridor references missing atlas node: ${corridor.id}:${nodeId}`)
        continue
      }
      if (node.system !== corridor.system) issues.push(`Scale corridor crosses systems: ${corridor.id}:${nodeId}:${node.system}`)
      const currentRank = rank(node.scale)
      if (currentRank < previousRank) issues.push(`Scale corridor becomes broader: ${corridor.id}:${nodeId}`)
      previousRank = Math.max(previousRank, currentRank)
    }
  }
  return [...new Set(issues)]
}
