import * as THREE from 'three'

export interface ThreeOwnedResourceDisposalReport {
  geometries: number
  materials: number
  textures: number
}

/**
 * Dispose GPU resources owned exclusively by one transient Three.js scene tree.
 *
 * Use this only when the caller owns the loaded Object3D and none of its geometry,
 * materials, or textures are shared with a concurrently mounted scene. Resources
 * are deduplicated before disposal because GLTF meshes may share primitives,
 * materials, and textures.
 */
export function disposeOwnedObject3DResources(root: THREE.Object3D): ThreeOwnedResourceDisposalReport {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()

  root.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh) return

    if (mesh.geometry) geometries.add(mesh.geometry)
    const materialList = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const material of materialList) {
      if (!material) continue
      materials.add(material)
      for (const value of Object.values(material)) {
        if (value && typeof value === 'object' && (value as THREE.Texture).isTexture) {
          textures.add(value as THREE.Texture)
        }
      }
    }
  })

  for (const texture of textures) texture.dispose()
  for (const material of materials) material.dispose()
  for (const geometry of geometries) geometry.dispose()

  return {
    geometries: geometries.size,
    materials: materials.size,
    textures: textures.size,
  }
}
