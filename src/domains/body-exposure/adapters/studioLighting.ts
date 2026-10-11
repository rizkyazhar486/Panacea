import * as THREE from 'three'
import { lightingSettings } from '../engine/presentationLighting.ts'

/** Small shadow-free rig; no new textures, mesh mutations or asset requests. */
export function createPresentationLighting(scene: THREE.Scene, camera: THREE.Camera,
  renderer: Pick<THREE.WebGLRenderer, 'toneMappingExposure'>) {
  const standard = new THREE.Group(); standard.name = 'panacea-standard-lighting'
  const studio = new THREE.Group(); studio.name = 'panacea-studio-lighting'
  const directional = (group: THREE.Group, color: number, intensity: number, position: [number, number, number]) => {
    const light = new THREE.DirectionalLight(color, intensity)
    light.position.set(...position)
    // Targets must be in the scene graph for camera-relative world transforms.
    group.add(light, light.target)
  }
  standard.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1410, 1.4))
  directional(standard, 0xfff4ea, 2.2, [-2, 3, 3])
  directional(standard, 0xcfe3ff, 1.2, [2, 2, -3])
  studio.add(new THREE.HemisphereLight(0xffffff, 0x242424, 0.4))
  directional(studio, 0xfff4ea, 2.2, [-2, 2, 3])
  // Hemispheric fill keeps the same light counts as standard: no shader
  // permutation rebuild on mode switch and no extra directional-light cost.
  directional(studio, 0xe5eeff, 1.3, [2, 1, -2])
  studio.visible = false
  scene.add(standard, studio)
  const rotation = new THREE.Quaternion()
  let active = 'standard', disposed = false
  return {
    apply(mode: unknown, exposureEV: unknown): boolean {
      const result = lightingSettings(mode, exposureEV)
      if (disposed || !result.ok) return false
      active = result.settings.mode
      standard.visible = active === 'standard'; studio.visible = active === 'studio'
      renderer.toneMappingExposure = result.multiplier
      scene.environmentIntensity = result.environmentIntensity
      return true
    },
    update(target: THREE.Vector3) {
      if (disposed || active !== 'studio') return
      studio.position.copy(target)
      studio.quaternion.copy(camera.getWorldQuaternion(rotation))
    },
    dispose() {
      scene.remove(standard, studio)
      disposed = true
    },
  }
}
