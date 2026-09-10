import type { AtlasManifest, AtlasSystemId } from './atlasKernel'

export type OrganCoverageStatus = 'shipped' | 'partial' | 'reference-only' | 'missing'

export interface RequiredOrganCoverage {
  id: string
  label: string
  system: AtlasSystemId
  acceptedNodeIds: readonly string[]
}

export interface OrganCoverageEntry extends RequiredOrganCoverage {
  status: OrganCoverageStatus
  matchedNodeId?: string
}

export interface OrganCoverageReport {
  complete: boolean
  shipped: number
  partial: number
  referenceOnly: number
  missing: number
  entries: readonly OrganCoverageEntry[]
}

/**
 * Macro-organ coverage contract for Body Exposure.
 *
 * This is intentionally an engineering completeness ledger, not a claim that a
 * listed node is anatomically reviewed or patient-specific. A requirement is
 * complete only when at least one accepted canonical atlas node exists at organ
 * scale and its geometry is shipped. Smaller-scale or reference-only nodes never
 * satisfy an organ requirement.
 */
export const REQUIRED_MACRO_ORGANS: readonly RequiredOrganCoverage[] = [
  { id: 'skin', label: 'Skin', system: 'surface', acceptedNodeIds: ['surface:skin'] },
  { id: 'axial-skeleton', label: 'Axial skeleton', system: 'skeletal', acceptedNodeIds: ['msk:spine', 'msk:axial-skeleton'] },
  { id: 'appendicular-skeleton', label: 'Appendicular skeleton', system: 'skeletal', acceptedNodeIds: ['msk:appendicular-skeleton'] },
  { id: 'major-joints', label: 'Major synovial joints', system: 'articular', acceptedNodeIds: ['msk:major-joints'] },
  { id: 'skeletal-muscle', label: 'Skeletal muscle organ set', system: 'muscular', acceptedNodeIds: ['msk:skeletal-muscle-set'] },

  { id: 'heart', label: 'Heart', system: 'cardiovascular', acceptedNodeIds: ['cv:heart'] },
  { id: 'arterial-tree', label: 'Systemic arterial tree', system: 'cardiovascular', acceptedNodeIds: ['cv:aorta', 'cv:systemic-arterial-tree'] },
  { id: 'venous-tree', label: 'Systemic venous tree', system: 'cardiovascular', acceptedNodeIds: ['cv:systemic-venous-tree'] },

  { id: 'spleen', label: 'Spleen', system: 'lymphatic', acceptedNodeIds: ['lymph:spleen'] },
  { id: 'thymus', label: 'Thymus', system: 'lymphatic', acceptedNodeIds: ['lymph:thymus'] },
  { id: 'lymph-node-network', label: 'Lymph node network', system: 'lymphatic', acceptedNodeIds: ['lymph:nodes'] },
  { id: 'lymphatic-vessels', label: 'Lymphatic vessel network', system: 'lymphatic', acceptedNodeIds: ['lymph:vessels'] },

  { id: 'brain', label: 'Brain', system: 'nervous', acceptedNodeIds: ['neuro:brain'] },
  { id: 'spinal-cord', label: 'Spinal cord', system: 'nervous', acceptedNodeIds: ['neuro:spinal-cord'] },
  { id: 'peripheral-nerves', label: 'Peripheral nerve network', system: 'nervous', acceptedNodeIds: ['neuro:peripheral-nerves'] },

  { id: 'nasal-cavity', label: 'Nasal cavity', system: 'respiratory', acceptedNodeIds: ['resp:nasal-cavity'] },
  { id: 'pharynx', label: 'Pharynx', system: 'respiratory', acceptedNodeIds: ['resp:pharynx'] },
  { id: 'larynx', label: 'Larynx', system: 'respiratory', acceptedNodeIds: ['resp:larynx'] },
  { id: 'trachea', label: 'Trachea', system: 'respiratory', acceptedNodeIds: ['resp:trachea'] },
  { id: 'lungs', label: 'Lungs', system: 'respiratory', acceptedNodeIds: ['resp:lungs', 'resp:right-lung', 'resp:left-lung'] },

  { id: 'oral-cavity', label: 'Oral cavity', system: 'digestive', acceptedNodeIds: ['gi:oral-cavity'] },
  { id: 'salivary-glands', label: 'Major salivary glands', system: 'digestive', acceptedNodeIds: ['gi:salivary-glands'] },
  { id: 'esophagus', label: 'Esophagus', system: 'digestive', acceptedNodeIds: ['gi:esophagus'] },
  { id: 'stomach', label: 'Stomach', system: 'digestive', acceptedNodeIds: ['gi:stomach'] },
  { id: 'liver', label: 'Liver', system: 'digestive', acceptedNodeIds: ['gi:liver'] },
  { id: 'gallbladder', label: 'Gallbladder', system: 'digestive', acceptedNodeIds: ['gi:gallbladder'] },
  { id: 'pancreas', label: 'Pancreas', system: 'digestive', acceptedNodeIds: ['gi:pancreas'] },
  { id: 'small-intestine', label: 'Small intestine', system: 'digestive', acceptedNodeIds: ['gi:small-intestine'] },
  { id: 'large-intestine', label: 'Large intestine', system: 'digestive', acceptedNodeIds: ['gi:large-intestine'] },

  { id: 'kidneys', label: 'Kidneys', system: 'urinary', acceptedNodeIds: ['urinary:kidneys'] },
  { id: 'ureters', label: 'Ureters', system: 'urinary', acceptedNodeIds: ['urinary:ureters'] },
  { id: 'urinary-bladder', label: 'Urinary bladder', system: 'urinary', acceptedNodeIds: ['urinary:bladder'] },
  { id: 'urethra', label: 'Urethra', system: 'urinary', acceptedNodeIds: ['urinary:urethra'] },

  { id: 'hypothalamus', label: 'Hypothalamus', system: 'endocrine', acceptedNodeIds: ['endo:hypothalamus'] },
  { id: 'pituitary', label: 'Pituitary gland', system: 'endocrine', acceptedNodeIds: ['endo:pituitary'] },
  { id: 'pineal', label: 'Pineal gland', system: 'endocrine', acceptedNodeIds: ['endo:pineal'] },
  { id: 'thyroid', label: 'Thyroid gland', system: 'endocrine', acceptedNodeIds: ['endo:thyroid'] },
  { id: 'parathyroids', label: 'Parathyroid glands', system: 'endocrine', acceptedNodeIds: ['endo:parathyroids'] },
  { id: 'adrenals', label: 'Adrenal glands', system: 'endocrine', acceptedNodeIds: ['endo:adrenals'] },

  { id: 'male-reproductive', label: 'Male reproductive organ set', system: 'reproductive', acceptedNodeIds: ['repro:male-organs'] },
  { id: 'female-reproductive', label: 'Female reproductive organ set', system: 'reproductive', acceptedNodeIds: ['repro:female-organs'] },

  { id: 'eyes', label: 'Eyes', system: 'sensory', acceptedNodeIds: ['sensory:eyes', 'eye:globe'] },
  { id: 'ears', label: 'Auditory and vestibular organs', system: 'sensory', acceptedNodeIds: ['sensory:ears', 'ear:inner-ear'] },

  { id: 'major-fascial-planes', label: 'Major fascial planes', system: 'fascial', acceptedNodeIds: ['fascia:major-planes'] },
] as const

function classifyGeometry(status: string | undefined): OrganCoverageStatus {
  if (status === 'shipped') return 'shipped'
  if (status === 'partial') return 'partial'
  if (status === 'reference-only') return 'reference-only'
  return 'missing'
}

export function buildOrganCoverageReport(manifest: AtlasManifest): OrganCoverageReport {
  const nodesById = new Map(manifest.nodes.map((node) => [node.id, node]))
  const entries: OrganCoverageEntry[] = REQUIRED_MACRO_ORGANS.map((requirement) => {
    const matched = requirement.acceptedNodeIds
      .map((id) => nodesById.get(id))
      .find((node) => node?.scale === 'organ')

    return {
      ...requirement,
      matchedNodeId: matched?.id,
      status: matched ? classifyGeometry(matched.geometryStatus) : 'missing',
    }
  })

  const shipped = entries.filter((entry) => entry.status === 'shipped').length
  const partial = entries.filter((entry) => entry.status === 'partial').length
  const referenceOnly = entries.filter((entry) => entry.status === 'reference-only').length
  const missing = entries.filter((entry) => entry.status === 'missing').length

  return {
    complete: shipped === entries.length,
    shipped,
    partial,
    referenceOnly,
    missing,
    entries,
  }
}
