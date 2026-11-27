import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { traceCenterline, type Centerline, type SegmentSurface, type Vec3 } from '../../../lib/endoskopi/garisTengah'

export type ScopeRouteId = 'colonoscopy' | 'upper-gi' | 'bronchoscopy'
export type LumenKind = 'colon' | 'rectum' | 'oesophagus' | 'gastric' | 'duodenum' | 'trachea' | 'bronchus'

export interface ScopeRoute {
  id: ScopeRouteId
  label: string
  short: string
  systemId: 'digestive' | 'respiratory'
  /** Reference-atlas file and the source it is derived from. */
  file: string
  source: string
  start: 'lowest' | 'highest'
  /** Segments in the order the scope meets them. */
  segments: { id: string; label: string; kind: LumenKind }[]
}

export const SCOPE_ROUTES: readonly ScopeRoute[] = [
  {
    id: 'colonoscopy',
    label: 'Colonoscopy',
    short: 'Colon',
    systemId: 'digestive',
    file: 'adult_female.digestive.LOD2.glb',
    source: 'NLM Visible Human female · HuBMAP CCF, CC BY 4.0',
    start: 'lowest',
    segments: [
      { id: 'ADULT.FEMALE.DIGESTIVE.RECTUM', label: 'Rectum', kind: 'rectum' },
      { id: 'ADULT.FEMALE.DIGESTIVE.SIGMOID_COLON', label: 'Sigmoid colon', kind: 'colon' },
      { id: 'ADULT.FEMALE.DIGESTIVE.DESCENDING_COLON', label: 'Descending colon', kind: 'colon' },
      { id: 'ADULT.FEMALE.DIGESTIVE.SPLENIC_FLEXURE_OF_COLON', label: 'Splenic flexure', kind: 'colon' },
      { id: 'ADULT.FEMALE.DIGESTIVE.TRANSVERSE_COLON', label: 'Transverse colon', kind: 'colon' },
      { id: 'ADULT.FEMALE.DIGESTIVE.HEPATIC_FLEXURE_OF_COLON', label: 'Hepatic flexure', kind: 'colon' },
      { id: 'ADULT.FEMALE.DIGESTIVE.ASCENDING_COLON', label: 'Ascending colon', kind: 'colon' },
      { id: 'ADULT.FEMALE.DIGESTIVE.CAECUM', label: 'Caecum', kind: 'colon' },
    ],
  },
  {
    id: 'upper-gi',
    label: 'Upper GI endoscopy',
    short: 'Upper GI',
    systemId: 'digestive',
    file: 'adult_male.digestive.LOD2.glb',
    source: 'Z-Anatomy / BodyParts3D (DBCLS), CC BY-SA 4.0',
    start: 'highest',
    segments: [
      { id: 'ADULT.MALE.DIGESTIVE.OESOPHAGUS', label: 'Oesophagus', kind: 'oesophagus' },
      { id: 'ADULT.MALE.DIGESTIVE.STOMACH', label: 'Stomach', kind: 'gastric' },
      { id: 'ADULT.MALE.DIGESTIVE.DUODENUM', label: 'Duodenum', kind: 'duodenum' },
    ],
  },
  {
    id: 'bronchoscopy',
    label: 'Bronchoscopy',
    short: 'Airway',
    systemId: 'respiratory',
    file: 'adult_female.respiratory.LOD2.glb',
    source: 'NLM Visible Human female · HuBMAP CCF, CC BY 4.0',
    start: 'highest',
    segments: [
      { id: 'ADULT.FEMALE.RESPIRATORY.TRACHEA', label: 'Trachea', kind: 'trachea' },
      { id: 'ADULT.FEMALE.RESPIRATORY.MAIN_LOBAR_BRONCHUS.R', label: 'Right main bronchus', kind: 'bronchus' },
    ],
  },
] as const

export interface LoadedRoute {
  route: ScopeRoute
  centerline: Centerline
  /** Source meshes of the route, world transforms baked, for the map. */
  organ: THREE.Group
}

const cache = new Map<ScopeRouteId, Promise<LoadedRoute>>()

export function loadScopeRoute(route: ScopeRoute): Promise<LoadedRoute> {
  const hit = cache.get(route.id)
  if (hit) return hit
  const job = (async () => {
    await MeshoptDecoder.ready
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}bodyexposure/${route.file}`)
    gltf.scene.updateMatrixWorld(true)
    const byId = new Map<string, THREE.Object3D>()
    gltf.scene.traverse((o) => { const id = o.userData?.panacea_structure_id; if (id) byId.set(id, o) })

    const organ = new THREE.Group()
    const surfaces: SegmentSurface[] = route.segments.map((segment) => {
      const node = byId.get(segment.id)
      if (!node) throw new Error(`${segment.id} is missing from ${route.file}`)
      const points: Vec3[] = []
      const v = new THREE.Vector3()
      node.traverse((m) => {
        const mesh = m as THREE.Mesh
        if (!mesh.isMesh) return
        // Atlas positions are meshopt-quantized (normalized Int16); transforming
        // in place would write world floats back into integers, so copy to Float32.
        const source = mesh.geometry.attributes.position!
        const world = new Float32Array(source.count * 3)
        for (let i = 0; i < source.count; i++) {
          v.fromBufferAttribute(source, i).applyMatrix4(mesh.matrixWorld)
          world.set([v.x, v.y, v.z], i * 3)
          points.push([v.x, v.y, v.z])
        }
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(world, 3))
        if (mesh.geometry.index) geometry.setIndex(mesh.geometry.index.clone())
        organ.add(new THREE.Mesh(geometry))
      })
      return { id: segment.id, label: segment.label, points }
    })
    return { route, centerline: traceCenterline(surfaces, route.start), organ }
  })()
  cache.set(route.id, job)
  job.catch(() => cache.delete(route.id))
  return job
}
