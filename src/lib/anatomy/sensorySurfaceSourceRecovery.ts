import { INDEKS_TUBUH, type StrukturTubuh } from '../bodyIndex.gen'

/**
 * Source-recovery lane for sensory/ENT + integumentary/surface anatomy.
 *
 * This module deliberately does not create geometry. It only promotes geometry
 * that is already present in the generated shipped-source index. Missing
 * structures remain explicit source gaps until a licensed, provenance-complete
 * asset is added and re-indexed.
 */

export type RecoveryDomain = 'sensory-ent' | 'integumentary-surface'
export type RecoveryStatus = 'SOURCE_BACKED' | 'SOURCE_GAP' | 'AMBIGUOUS' | 'ZERO_GEOMETRY'

export interface RecoveryTarget {
  id: string
  label: string
  domain: RecoveryDomain
  exactNames: readonly string[]
  allowedLayers: readonly StrukturTubuh['l'][]
  laterality: 'bilateral-or-midline' | 'any'
}

export interface RecoveredTarget extends RecoveryTarget {
  status: RecoveryStatus
  sourceNodes: readonly StrukturTubuh[]
  blocker: string | null
}

export const SENSORY_ENT_TARGETS: readonly RecoveryTarget[] = [
  {
    id: 'olfactory-nerve',
    label: 'Olfactory nerve (CN I)',
    domain: 'sensory-ent',
    exactNames: ['Olfactory nerve (I)', 'Olfactory nerve'],
    allowedLayers: ['nervous'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'optic-nerve',
    label: 'Optic nerve (CN II)',
    domain: 'sensory-ent',
    exactNames: ['Optic nerve (II)', 'Optic nerve'],
    allowedLayers: ['nervous'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'trigeminal-nerve',
    label: 'Trigeminal nerve (CN V)',
    domain: 'sensory-ent',
    exactNames: ['Trigeminal nerve (V)', 'Trigeminal nerve'],
    allowedLayers: ['nervous'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'facial-nerve',
    label: 'Facial nerve (CN VII)',
    domain: 'sensory-ent',
    exactNames: ['Facial nerve (VII)', 'Facial nerve'],
    allowedLayers: ['nervous'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'vestibulocochlear-nerve',
    label: 'Vestibulocochlear nerve (CN VIII)',
    domain: 'sensory-ent',
    exactNames: ['Vestibulocochlear nerve (VIII)', 'Vestibulocochlear nerve'],
    allowedLayers: ['nervous'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'glossopharyngeal-nerve',
    label: 'Glossopharyngeal nerve (CN IX)',
    domain: 'sensory-ent',
    exactNames: ['Glossopharyngeal nerve (IX)', 'Glossopharyngeal nerve'],
    allowedLayers: ['nervous'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'vagus-nerve',
    label: 'Vagus nerve (CN X)',
    domain: 'sensory-ent',
    exactNames: ['Vagus nerve (X)', 'Vagus nerve'],
    allowedLayers: ['nervous'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'tongue',
    label: 'Tongue',
    domain: 'sensory-ent',
    exactNames: ['Tongue'],
    allowedLayers: ['visceral', 'muscular'],
    laterality: 'any',
  },
  {
    id: 'parotid-gland',
    label: 'Parotid gland',
    domain: 'sensory-ent',
    exactNames: ['Parotid gland', '(Accessory parotid gland)'],
    allowedLayers: ['visceral'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'submandibular-gland',
    label: 'Submandibular gland',
    domain: 'sensory-ent',
    exactNames: ['Submandibular gland'],
    allowedLayers: ['visceral'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'sublingual-gland',
    label: 'Sublingual gland',
    domain: 'sensory-ent',
    exactNames: ['Sublingual gland'],
    allowedLayers: ['visceral'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'epiglottis',
    label: 'Epiglottis',
    domain: 'sensory-ent',
    exactNames: ['Epiglottis'],
    allowedLayers: ['visceral', 'skeletal'],
    laterality: 'any',
  },
  {
    id: 'cochlea',
    label: 'Cochlea',
    domain: 'sensory-ent',
    exactNames: ['Cochlea'],
    allowedLayers: ['visceral', 'skeletal', 'nervous'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'semicircular-canals',
    label: 'Semicircular canals',
    domain: 'sensory-ent',
    exactNames: ['Semicircular canals', 'Semicircular canal'],
    allowedLayers: ['visceral', 'skeletal'],
    laterality: 'bilateral-or-midline',
  },
  {
    id: 'tympanic-membrane',
    label: 'Tympanic membrane',
    domain: 'sensory-ent',
    exactNames: ['Tympanic membrane'],
    allowedLayers: ['visceral', 'surface'],
    laterality: 'bilateral-or-midline',
  },
] as const

function exactMatches(target: RecoveryTarget): StrukturTubuh[] {
  const names = new Set(target.exactNames)
  return INDEKS_TUBUH.filter(
    (node) =>
      node.t > 0 &&
      target.allowedLayers.includes(node.l) &&
      (names.has(node.n) || names.has(node.b)),
  )
}

function sideSet(nodes: readonly StrukturTubuh[]): Set<StrukturTubuh['s']> {
  return new Set(nodes.map((node) => node.s))
}

export function recoverTarget(target: RecoveryTarget): RecoveredTarget {
  const allExact = INDEKS_TUBUH.filter((node) => {
    const names = new Set(target.exactNames)
    return names.has(node.n) || names.has(node.b)
  })

  if (allExact.length === 0) {
    return {
      ...target,
      status: 'SOURCE_GAP',
      sourceNodes: [],
      blocker: `No exact shipped source node for: ${target.exactNames.join(' | ')}`,
    }
  }

  const withGeometry = allExact.filter((node) => node.t > 0)
  if (withGeometry.length === 0) {
    return {
      ...target,
      status: 'ZERO_GEOMETRY',
      sourceNodes: [],
      blocker: 'Exact source identity exists but carries zero indexed triangles.',
    }
  }

  const eligible = exactMatches(target)
  if (eligible.length === 0) {
    return {
      ...target,
      status: 'AMBIGUOUS',
      sourceNodes: [],
      blocker: `Exact identity exists outside the allowed source layer: ${[...new Set(withGeometry.map((n) => n.l))].join(', ')}`,
    }
  }

  if (target.laterality === 'bilateral-or-midline') {
    const sides = sideSet(eligible)
    const lateralitySatisfied = sides.has('tengah') || (sides.has('kiri') && sides.has('kanan'))
    if (!lateralitySatisfied) {
      return {
        ...target,
        status: 'AMBIGUOUS',
        sourceNodes: eligible,
        blocker: 'Exact geometry is present but expected bilateral/midline coverage is incomplete.',
      }
    }
  }

  return { ...target, status: 'SOURCE_BACKED', sourceNodes: eligible, blocker: null }
}

export const SENSORY_ENT_RECOVERY: readonly RecoveredTarget[] = SENSORY_ENT_TARGETS.map(recoverTarget)

/** Every shipped surface-layer mesh is recoverable without semantic guessing. */
export const SHIPPED_SURFACE_MESHES: readonly StrukturTubuh[] = INDEKS_TUBUH.filter(
  (node) => node.l === 'surface' && node.t > 0,
)

export const SENSORY_SURFACE_RECOVERY_SUMMARY = Object.freeze({
  sensoryTargets: SENSORY_ENT_RECOVERY.length,
  sensorySourceBacked: SENSORY_ENT_RECOVERY.filter((target) => target.status === 'SOURCE_BACKED').length,
  sensoryBlocked: SENSORY_ENT_RECOVERY.filter((target) => target.status !== 'SOURCE_BACKED').length,
  shippedSurfaceMeshes: SHIPPED_SURFACE_MESHES.length,
  shippedSurfaceTriangles: SHIPPED_SURFACE_MESHES.reduce((sum, node) => sum + node.t, 0),
})

export const SENSORY_SURFACE_PROVENANCE = Object.freeze({
  source: 'Z-Anatomy',
  license: 'CC BY-SA 4.0',
  creditsPath: 'public/anatomy/CREDITS.txt',
  generatedIndexPath: 'src/lib/bodyIndex.gen.ts',
  policy:
    'Render eligibility requires an exact shipped-source identity, an allowed source layer, positive indexed triangle count, and required laterality. Missing geometry is never synthesized or substituted.',
})

/**
 * Publication/renderer boundary:
 * RenderEligible = ExactSourceIdentity ∧ AllowedLayer ∧ TriangleCount>0 ∧ LateralitySatisfied.
 */
export function isRenderEligible(target: RecoveredTarget): boolean {
  return target.status === 'SOURCE_BACKED' && target.sourceNodes.length > 0
}
