// Which atlas meshes light up with which part of the whole-body simulation. Pure data and one lookup.
// The meshes are never deformed (see bodyMotion.ts and the MotionState note in Body3D); only their light changes.
//
// Curated by EXACT atlas node name, per source layer, never by keyword: "lung" also appears in bronchus and
// segmental-artery names, and a pleura or a pulmonary vein must not breathe as if it were parenchyma. Several
// organs in the Z-Anatomy export are unnamed meshes under a named parent (the lung lobes, the right kidney), so the
// lookup walks the mesh's own name first and then its ancestors, and the first exact hit wins.
//
// scripts/uji/body-motion-groups.mts reads the shipped GLB files and fails if any name here stops existing, so an
// asset update cannot silently freeze an organ.

import type { AtlasLayerId } from '../atlas-stage/stageLayers.ts'

export type MotionGroup = 'heart' | 'lungs' | 'kidneys' | 'greatVessels'

export const MOTION_GROUP_NODES: Readonly<Record<MotionGroup, { readonly layer: AtlasLayerId; readonly names: readonly string[] }>> = {
  heart: { layer: 'cardiovascular', names: ['Left atrium', 'Right atrium', 'Left ventricle', 'Right ventricle'] },
  greatVessels: { layer: 'cardiovascular', names: ['Ascending aorta', 'Aortic arch', 'Thoracic aorta', 'Abdominal aorta', 'Pulmonary trunk'] },
  lungs: {
    layer: 'visceral',
    names: ['Superior lobe of left lung', 'Inferior lobe of left lung', 'Superior lobe of right lung', 'Middle lobe of right lung', 'Inferior lobe of right lung'],
  },
  kidneys: { layer: 'visceral', names: ['Kidney.l', 'Kidney.r'] },
}

const LOOKUP: ReadonlyMap<string, MotionGroup> = new Map(
  (Object.entries(MOTION_GROUP_NODES) as [MotionGroup, { layer: AtlasLayerId; names: readonly string[] }][])
    .flatMap(([group, { layer, names }]) => names.map((name) => [`${layer}\u0000${name}`, group] as const)),
)

/**
 * The motion group of a mesh, from its own name followed by its ancestors' names (nearest first).
 * Unknown layer, empty chain or no exact match → null: the mesh stays still rather than guessing.
 */
export function motionGroupFor(layer: AtlasLayerId | null, nameChain: readonly unknown[]): MotionGroup | null {
  if (!layer || !Array.isArray(nameChain)) return null
  for (const name of nameChain) {
    if (typeof name !== 'string' || !name) continue
    const hit = LOOKUP.get(`${layer}\u0000${name}`)
    if (hit) return hit
  }
  return null
}
