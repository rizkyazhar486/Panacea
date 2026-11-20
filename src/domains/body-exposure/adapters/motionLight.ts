// Puts the whole-body simulation onto the 3D atlas as LIGHT. Geometry is never touched: no scale, position or
// morph changes (atlas meshes are evidence-bearing reference anatomy; see the MotionState note in Body3D).
//
// A layer's meshes share materials, so lighting the heart through a shared material would light every vessel.
// tagMotionMeshes gives each curated mesh a material of its own per (motion group, source material); the viewer's
// highlight and dissection code keep working because the clone becomes the mesh's baseMaterial.

import * as THREE from 'three'
import type { AtlasLayerId } from '../engine/atlas-stage/stageLayers.ts'
import type { BodyMotionFrame } from '../engine/body-motion/bodyMotion.ts'
import { motionGroupFor, type MotionGroup } from '../engine/body-motion/motionGroups.ts'

/** Display tints per group. Display only; never shown as a value. */
const MOTION_TINT: Readonly<Record<MotionGroup, THREE.Color>> = {
  heart: new THREE.Color('#ff3355'),
  greatVessels: new THREE.Color('#ff5a5a'),
  lungs: new THREE.Color('#4fc3ff'),
  kidneys: new THREE.Color('#ffae42'),
}
/** Largest emissive added at intensity 1 (display only). */
const MOTION_GLOW_MAX = 0.75

const BASE_EMISSIVE = 'body3dMotionBaseEmissive'
const GROUP = 'body3dMotionGroup'
const MATERIALS = 'body3dMotionMaterials'

export function motionIntensity(group: MotionGroup, f: BodyMotionFrame): number {
  switch (group) {
    case 'heart': return f.heartGlow
    case 'lungs': return f.lungGlow
    case 'greatVessels': return f.vesselPulse
    case 'kidneys': return f.renalGlow
  }
}

/** Tags the curated meshes of one loaded layer and returns how many meshes each group lights. */
export function tagMotionMeshes(layer: AtlasLayerId, root: THREE.Object3D): Readonly<Record<MotionGroup, number>> {
  const counts: Record<MotionGroup, number> = { heart: 0, lungs: 0, kidneys: 0, greatVessels: 0 }
  const own = new Map<string, THREE.MeshStandardMaterial>()
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || Array.isArray(obj.material)) return
    if (!(obj.material instanceof THREE.MeshStandardMaterial)) return
    const chain: unknown[] = []
    for (let o: THREE.Object3D | null = obj; o; o = o === root ? null : o.parent) chain.push(o.userData.originalName)
    const group = motionGroupFor(layer, chain)
    if (!group) return
    const source = obj.material
    const key = `${group}:${source.uuid}`
    let material = own.get(key)
    if (!material) {
      material = source.clone()
      material.userData = { ...source.userData, [GROUP]: group, [BASE_EMISSIVE]: source.emissive.clone() }
      own.set(key, material)
    }
    obj.material = material
    obj.userData.baseMaterial = material
    counts[group]++
  })
  const materials = [...own.values()]
  root.userData[MATERIALS] = materials
  const owned = (root.userData.body3dOwnedMaterials as THREE.Material[] | undefined) ?? []
  root.userData.body3dOwnedMaterials = [...owned, ...materials]
  return counts
}

const scratch = new THREE.Color()
/** Applies one frame of light to a tagged layer; null restores every motion material to its source emissive. */
export function applyMotionLight(root: THREE.Object3D, frame: BodyMotionFrame | null): void {
  const materials = root.userData[MATERIALS] as THREE.MeshStandardMaterial[] | undefined
  if (!materials) return
  for (const m of materials) {
    const base = m.userData[BASE_EMISSIVE] as THREE.Color
    m.emissive.copy(base)
    if (!frame) continue
    const group = m.userData[GROUP] as MotionGroup
    const k = Math.min(1, Math.max(0, motionIntensity(group, frame)))
    m.emissive.add(scratch.copy(MOTION_TINT[group]).multiplyScalar(MOTION_GLOW_MAX * k))
  }
}
