import * as THREE from 'three'

type Motion = { center: THREE.Vector3; base: THREE.Vector3; offset: THREE.Vector3; next: THREE.Vector3 }
const motions = new WeakMap<THREE.Object3D, Motion>()

// Pusat geometri atlas dapat jauh dari origin node; kompensasi mencegah organ bergeser.
export function scaleAnatomyAtCenter(object: THREE.Object3D, x: number, y = x, z = x) {
  if (![x, y, z].every((value) => Number.isFinite(value) && value > 0)) return
  let motion = motions.get(object)
  if (!motion) {
    const box = new THREE.Box3().setFromObject(object)
    if (box.isEmpty()) return
    motion = { center: object.worldToLocal(box.getCenter(new THREE.Vector3())), base: object.scale.clone(), offset: new THREE.Vector3(), next: new THREE.Vector3() }
    motions.set(object, motion)
  }
  motion.next.set(1 - x, 1 - y, 1 - z).multiply(motion.center).multiply(motion.base).applyQuaternion(object.quaternion)
  object.position.sub(motion.offset).add(motion.next)
  object.scale.set(motion.base.x * x, motion.base.y * y, motion.base.z * z)
  motion.offset.copy(motion.next)
}

export function isAnatomyPickable(object: THREE.Object3D, point: THREE.Vector3): boolean {
  if (!(object instanceof THREE.Mesh)) return false
  for (let parent: THREE.Object3D | null = object; parent; parent = parent.parent) {
    if (!parent.visible) return false
  }
  const materials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material]
  return materials.some((material) => material.visible && material.opacity >= 0.2 &&
    !(material.clippingPlanes?.some((plane) => plane.distanceToPoint(point) < 0)))
}
