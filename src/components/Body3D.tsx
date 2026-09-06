import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Shared Body Exposure renderer.
 *
 * IMPORTANT VISUAL CONTRACT
 * - Macro anatomy always comes from the real named GLB meshes in /public/anatomy.
 * - No sphere/capsule stand-ins are used for heart, lung, vessel, nerve or organ anatomy.
 * - Motion is deliberately subtle and only deforms the real anatomical meshes.
 * - Educational renders never claim to be patient imaging.
 */
export interface AnatomyLayer {
  key: 'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid'
  label: string
  file: string
  defaultOn: boolean
}

export const ANATOMY_LAYERS: AnatomyLayer[] = [
  { key: 'surface', label: 'Skin', file: 'surface.glb', defaultOn: false },
  { key: 'skeletal', label: 'Skeleton', file: 'skeletal.glb', defaultOn: true },
  { key: 'muscular', label: 'Muscles', file: 'muscular.glb', defaultOn: true },
  { key: 'cardiovascular', label: 'Vessels', file: 'cardiovascular.glb', defaultOn: false },
  { key: 'nervous', label: 'Nerves', file: 'nervous.glb', defaultOn: false },
  { key: 'visceral', label: 'Organs', file: 'visceral.glb', defaultOn: false },
  { key: 'lymphoid', label: 'Lymphatic', file: 'lymphoid.glb', defaultOn: false },
]

export function humanizeStructureName(raw: string): string {
  let n = raw.replaceAll('_', ' ')
  if (n.endsWith('.l')) n = `${n.slice(0, -2)} (left)`
  else if (n.endsWith('.r')) n = `${n.slice(0, -2)} (right)`
  return n.charAt(0).toUpperCase() + n.slice(1)
}

export type RenderMode = 'anatomy' | 'xray' | 'ct' | 'mriT1' | 'mriT2'
export type SlicePlane = 'none' | 'axial' | 'coronal' | 'sagittal'

export interface CtWindow {
  key: string
  label: string
  width: number
  level: number
}

export const CT_WINDOWS: CtWindow[] = [
  { key: 'soft', label: 'Soft tissue', width: 400, level: 40 },
  { key: 'lung', label: 'Lung', width: 1500, level: -600 },
  { key: 'bone', label: 'Bone', width: 2000, level: 400 },
]

export const RENDER_MODES: Array<{ key: RenderMode; label: string; hint: string }> = [
  { key: 'anatomy', label: 'Anatomy', hint: 'Named anatomical mesh with tissue-specific PBR material' },
  { key: 'xray', label: 'X-ray', hint: 'Educational attenuation-style projection of the anatomy mesh' },
  { key: 'ct', label: 'CT', hint: 'Educational HU-windowed mesh section; not patient DICOM' },
  { key: 'mriT1', label: 'MRI T1', hint: 'Educational relative tissue-signal section; not patient MRI' },
  { key: 'mriT2', label: 'MRI T2', hint: 'Educational relative tissue-signal section; not patient MRI' },
]

export interface MotionState {
  heartRate: number
  respRate: number
  contractionRate: number
  peristalsisRate?: number
}

export const MOTION_OFF: MotionState = { heartRate: 0, respRate: 0, contractionRate: 0, peristalsisRate: 0 }
export const MOTION_REST: MotionState = { heartRate: 70, respRate: 14, contractionRate: 0, peristalsisRate: 8 }
export const MOTION_EXERCISE: MotionState = { heartRate: 160, respRate: 40, contractionRate: 30, peristalsisRate: 3 }

type LayerKey = AnatomyLayer['key']
type TissueKind =
  | 'skin'
  | 'bone'
  | 'cartilage'
  | 'muscle'
  | 'tendon'
  | 'artery'
  | 'vein'
  | 'nerve'
  | 'brain'
  | 'heart'
  | 'lung'
  | 'liver'
  | 'kidney'
  | 'gut'
  | 'fat'
  | 'lymph'
  | 'viscera'

interface Props {
  layers: Set<LayerKey>
  highlighted: string[]
  focusKeywords: string[] | null
  renderMode: RenderMode
  ctWindow: CtWindow
  slicePlane: SlicePlane
  slicePos: number
  motion: MotionState
  unfold: number
  dissect: number
  onPick: (rawName: string, label: string) => void
}

interface TissueRecipe {
  color: number
  roughness: number
  clearcoat: number
  clearcoatRoughness: number
  sheen: number
  transmission?: number
  thickness?: number
}

const TISSUE: Record<TissueKind, TissueRecipe> = {
  skin: { color: 0xc38c79, roughness: 0.58, clearcoat: 0.11, clearcoatRoughness: 0.5, sheen: 0.16, transmission: 0.045, thickness: 0.65 },
  bone: { color: 0xd8d0bc, roughness: 0.7, clearcoat: 0.025, clearcoatRoughness: 0.82, sheen: 0.02 },
  cartilage: { color: 0xc4d6d9, roughness: 0.32, clearcoat: 0.18, clearcoatRoughness: 0.3, sheen: 0.08, transmission: 0.03, thickness: 0.14 },
  muscle: { color: 0x8b2935, roughness: 0.46, clearcoat: 0.055, clearcoatRoughness: 0.55, sheen: 0.3 },
  tendon: { color: 0xd5c4a5, roughness: 0.56, clearcoat: 0.045, clearcoatRoughness: 0.6, sheen: 0.1 },
  artery: { color: 0xb72b34, roughness: 0.4, clearcoat: 0.14, clearcoatRoughness: 0.4, sheen: 0.18 },
  vein: { color: 0x315e99, roughness: 0.43, clearcoat: 0.12, clearcoatRoughness: 0.44, sheen: 0.16 },
  nerve: { color: 0xd8bb4e, roughness: 0.5, clearcoat: 0.04, clearcoatRoughness: 0.64, sheen: 0.12 },
  brain: { color: 0xc79a9d, roughness: 0.5, clearcoat: 0.05, clearcoatRoughness: 0.58, sheen: 0.16 },
  heart: { color: 0x8d2732, roughness: 0.42, clearcoat: 0.07, clearcoatRoughness: 0.48, sheen: 0.26 },
  lung: { color: 0xb8898d, roughness: 0.62, clearcoat: 0.025, clearcoatRoughness: 0.72, sheen: 0.1 },
  liver: { color: 0x6f2c28, roughness: 0.47, clearcoat: 0.065, clearcoatRoughness: 0.54, sheen: 0.16 },
  kidney: { color: 0x7c3838, roughness: 0.49, clearcoat: 0.06, clearcoatRoughness: 0.56, sheen: 0.16 },
  gut: { color: 0xb77b78, roughness: 0.52, clearcoat: 0.055, clearcoatRoughness: 0.57, sheen: 0.16 },
  fat: { color: 0xd8bc75, roughness: 0.6, clearcoat: 0.02, clearcoatRoughness: 0.7, sheen: 0.07 },
  lymph: { color: 0x779b65, roughness: 0.52, clearcoat: 0.04, clearcoatRoughness: 0.61, sheen: 0.1 },
  viscera: { color: 0x9f6863, roughness: 0.51, clearcoat: 0.05, clearcoatRoughness: 0.58, sheen: 0.14 },
}

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
const modelCache = new Map<string, Promise<THREE.Group>>()
const anatomyMaterialCache = new Map<string, THREE.MeshPhysicalMaterial>()
const radiologyMaterialCache = new Map<string, THREE.MeshStandardMaterial>()
const HIGHLIGHT = new THREE.Color(0x34f39a)

function restoreOriginalNames(gltf: import('three/examples/jsm/loaders/GLTFLoader.js').GLTF) {
  const nodes = gltf.parser.json.nodes as Array<{ name?: string }> | undefined
  if (!nodes) return
  gltf.scene.traverse((object) => {
    const association = gltf.parser.associations.get(object) as { nodes?: number } | undefined
    const index = association?.nodes
    if (index !== undefined && nodes[index]?.name) object.userData.originalName = nodes[index].name
  })
}

function loadLayer(file: string, progress?: (value: number) => void): Promise<THREE.Group> {
  const cached = modelCache.get(file)
  if (cached) return cached
  const promise = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      `${import.meta.env.BASE_URL}anatomy/${file}`,
      (gltf) => {
        restoreOriginalNames(gltf)
        resolve(gltf.scene)
      },
      (event) => {
        if (event.total > 0) progress?.(event.loaded / event.total)
      },
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
    )
  })
  modelCache.set(file, promise)
  return promise
}

function rawName(object: THREE.Object3D): string {
  let current: THREE.Object3D | null = object
  while (current) {
    const original = current.userData.originalName as string | undefined
    if (original) return original
    current = current.parent
  }
  return object.name || 'Anatomical structure'
}

function classifyTissue(layer: LayerKey, nameRaw: string): TissueKind {
  const name = nameRaw.toLowerCase()
  if (layer === 'surface') return name.includes('fat') || name.includes('adip') ? 'fat' : 'skin'
  if (layer === 'skeletal') {
    if (name.includes('cartilage') || name.includes('meniscus') || name.includes('disc')) return 'cartilage'
    if (name.includes('ligament') || name.includes('tendon')) return 'tendon'
    return 'bone'
  }
  if (layer === 'muscular') {
    if (name.includes('tendon') || name.includes('fascia') || name.includes('aponeuros')) return 'tendon'
    return 'muscle'
  }
  if (layer === 'cardiovascular') {
    if (name.includes('heart') || name.includes('atrium') || name.includes('ventricle') || name.includes('myocard')) return 'heart'
    if (name.includes('vein') || name.includes('vena') || name.includes('venous') || name.includes('sinus')) return 'vein'
    return 'artery'
  }
  if (layer === 'nervous') {
    if (name.includes('brain') || name.includes('cerebr') || name.includes('cerebell') || name.includes('pons') || name.includes('medulla')) return 'brain'
    return 'nerve'
  }
  if (layer === 'lymphoid') return 'lymph'
  if (name.includes('lung') || name.includes('bronch')) return 'lung'
  if (name.includes('liver') || name.includes('hepatic')) return 'liver'
  if (name.includes('kidney') || name.includes('renal')) return 'kidney'
  if (name.includes('heart') || name.includes('atrium') || name.includes('ventricle')) return 'heart'
  if (name.includes('brain') || name.includes('cerebr') || name.includes('cerebell')) return 'brain'
  if (name.includes('stomach') || name.includes('duodenum') || name.includes('jejun') || name.includes('ileum') || name.includes('colon') || name.includes('rectum') || name.includes('intestin')) return 'gut'
  if (name.includes('fat') || name.includes('adip')) return 'fat'
  return 'viscera'
}

function anatomyMaterial(kind: TissueKind, opacity: number): THREE.MeshPhysicalMaterial {
  const rounded = Math.round(opacity * 20) / 20
  const key = `${kind}:${rounded.toFixed(2)}`
  const cached = anatomyMaterialCache.get(key)
  if (cached) return cached
  const recipe = TISSUE[kind]
  const color = new THREE.Color(recipe.color)
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: recipe.roughness,
    metalness: 0,
    clearcoat: recipe.clearcoat,
    clearcoatRoughness: recipe.clearcoatRoughness,
    sheen: recipe.sheen,
    sheenColor: color.clone().lerp(new THREE.Color(0xffffff), 0.38),
    sheenRoughness: 0.62,
    transmission: recipe.transmission ?? 0,
    thickness: recipe.thickness ?? 0,
    ior: kind === 'skin' || kind === 'cartilage' ? 1.4 : 1.37,
    transparent: rounded < 0.99 || (recipe.transmission ?? 0) > 0,
    opacity: rounded,
    depthWrite: rounded > 0.5,
    side: kind === 'skin' ? THREE.DoubleSide : THREE.FrontSide,
  })
  material.envMapIntensity = 0.9
  anatomyMaterialCache.set(key, material)
  return material
}

const RADIOLOGY_PHYSICS: Record<LayerKey, { hu: number; t1: number; t2: number; attenuation: number }> = {
  surface: { hu: -60, t1: 0.85, t2: 0.55, attenuation: 0.16 },
  skeletal: { hu: 800, t1: 0.12, t2: 0.08, attenuation: 1 },
  muscular: { hu: 45, t1: 0.42, t2: 0.35, attenuation: 0.28 },
  cardiovascular: { hu: 50, t1: 0.38, t2: 0.3, attenuation: 0.3 },
  nervous: { hu: 35, t1: 0.55, t2: 0.62, attenuation: 0.24 },
  visceral: { hu: 55, t1: 0.48, t2: 0.58, attenuation: 0.32 },
  lymphoid: { hu: 40, t1: 0.4, t2: 0.68, attenuation: 0.26 },
}

function huToDisplay(hu: number, window: CtWindow) {
  const low = window.level - window.width / 2
  const high = window.level + window.width / 2
  if (hu <= low) return 0
  if (hu >= high) return 1
  return (hu - low) / window.width
}

function radiologyMaterial(layer: LayerKey, mode: Exclude<RenderMode, 'anatomy'>, window: CtWindow): THREE.MeshStandardMaterial {
  const key = `${layer}:${mode}:${window.key}`
  const cached = radiologyMaterialCache.get(key)
  if (cached) return cached
  const physics = RADIOLOGY_PHYSICS[layer]
  let intensity = 1
  let opacity = 1
  if (mode === 'ct') intensity = huToDisplay(physics.hu, window)
  else if (mode === 'mriT1') intensity = physics.t1
  else if (mode === 'mriT2') intensity = physics.t2
  else {
    intensity = 1
    opacity = Math.min(0.96, 0.08 + physics.attenuation * 0.72)
  }
  const v = Math.max(0.015, Math.min(1, intensity))
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(v, v, v),
    roughness: 0.92,
    metalness: 0,
    transparent: mode === 'xray',
    opacity,
    depthWrite: mode !== 'xray',
    blending: mode === 'xray' ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: THREE.DoubleSide,
  })
  radiologyMaterialCache.set(key, material)
  return material
}

function layerOpacity(layer: LayerKey, dissect: number): number {
  const order: Record<LayerKey, number> = {
    surface: 0,
    muscular: 1,
    cardiovascular: 2,
    nervous: 2.2,
    lymphoid: 2.4,
    visceral: 3,
    skeletal: 4,
  }
  const threshold = Math.max(0, Math.min(6, dissect)) * 0.72
  const depth = order[layer]
  if (threshold <= depth - 0.25) return 1
  if (threshold <= depth + 0.55) return 0.34
  return layer === 'surface' ? 0.06 : 0.1
}

const UNFOLD_DIRECTION: Record<LayerKey, THREE.Vector3> = {
  surface: new THREE.Vector3(0, 0, 0.7),
  skeletal: new THREE.Vector3(0.9, 0, 0),
  muscular: new THREE.Vector3(-0.8, 0, 0.18),
  cardiovascular: new THREE.Vector3(0, 0, -0.9),
  nervous: new THREE.Vector3(0.2, 0.75, 0),
  visceral: new THREE.Vector3(0, -0.6, 0.45),
  lymphoid: new THREE.Vector3(0.75, 0.28, -0.25),
}

function makeGradientBackground() {
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#02060b')
  gradient.addColorStop(0.46, '#07131b')
  gradient.addColorStop(1, '#010205')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function exactOrKeyword(name: string, exact: Set<string>, keywords: string[]) {
  const lower = name.toLowerCase()
  return exact.has(name) || keywords.some((keyword) => lower.includes(keyword))
}

function hiddenInstruction(name: string) {
  const lower = name.toLowerCase()
  return lower.includes('how to') || lower.includes('instruction') || lower.includes('read me')
}

export function Body3D({
  layers,
  highlighted,
  focusKeywords,
  renderMode,
  ctWindow,
  slicePlane,
  slicePos,
  motion,
  unfold,
  dissect,
  onPick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const groupsRef = useRef<Partial<Record<LayerKey, THREE.Group>>>({})
  const desiredLayersRef = useRef(layers)
  const sceneBoundsRef = useRef(new THREE.Box3())
  const sceneSizeRef = useRef(1)
  const firstFitRef = useRef(false)
  const motionRef = useRef(motion)
  const highlightRef = useRef<Array<{ mesh: THREE.Mesh; base: THREE.Material; baseScale: THREE.Vector3 }>>([])
  const animatedRef = useRef<{ heart: THREE.Object3D[]; lungs: THREE.Object3D[] }>({ heart: [], lungs: [] })
  const animationFrameRef = useRef(0)
  const [loading, setLoading] = useState<Record<string, number>>({})
  const [failed, setFailed] = useState<Set<LayerKey>>(new Set())
  const [selected, setSelected] = useState('')

  desiredLayersRef.current = layers
  motionRef.current = motion

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const background = makeGradientBackground()
    scene.background = background
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(35, 1, 0.001, 10000)
    camera.position.set(2.4, 1.1, 4.6)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.localClippingEnabled = true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.75))
    renderer.setSize(Math.max(container.clientWidth, 1), Math.max(container.clientHeight, 1), false)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = environment.texture
    scene.environmentIntensity = 0.82

    const hemi = new THREE.HemisphereLight(0xdcefff, 0x25160f, 1.45)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    key.position.set(4, 5, 5)
    key.castShadow = true
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x8ecfff, 1.05)
    fill.position.set(-4, 1.5, 3)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffd9bd, 1.15)
    rim.position.set(2, 2, -5)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.075
    controls.rotateSpeed = 0.62
    controls.zoomSpeed = 0.72
    controls.panSpeed = 0.55
    controls.minDistance = 0.05
    controls.maxDistance = 10000
    controlsRef.current = controls

    const resize = () => {
      const width = Math.max(container.clientWidth, 1)
      const height = Math.max(container.clientHeight, 1)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.75))
      renderer.setSize(width, height, false)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const pick = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const roots = Object.values(groupsRef.current).filter(Boolean) as THREE.Object3D[]
      const hits = raycaster.intersectObjects(roots, true)
      const hit = hits.find((item) => item.object.visible && item.object instanceof THREE.Mesh)
      if (!hit) return
      const name = rawName(hit.object)
      if (hiddenInstruction(name)) return
      const label = humanizeStructureName(name)
      setSelected(label)
      onPick(name, label)
    }
    renderer.domElement.addEventListener('pointerup', pick)

    const clock = new THREE.Clock()
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      const state = motionRef.current

      // Real mesh motion only. No substitute spheres and no vessel inflation.
      if (state.heartRate > 0) {
        const phase = (t * state.heartRate / 60) % 1
        const pulse = Math.exp(-Math.pow((phase - 0.14) / 0.095, 2))
        const scale = 1 + pulse * 0.012
        for (const object of animatedRef.current.heart) {
          const base = object.userData.__baseScale as THREE.Vector3 | undefined
          if (base) object.scale.set(base.x * scale, base.y * scale, base.z * scale)
        }
      }
      if (state.respRate > 0) {
        const breath = (1 + Math.sin(t * state.respRate / 60 * Math.PI * 2 - Math.PI / 2)) / 2
        for (const object of animatedRef.current.lungs) {
          const base = object.userData.__baseScale as THREE.Vector3 | undefined
          if (base) object.scale.set(base.x * (1 + breath * 0.004), base.y * (1 + breath * 0.013), base.z * (1 + breath * 0.009))
        }
      }
      if (state.contractionRate > 0) {
        const phase = (t * state.contractionRate / 60) % 1
        const contraction = phase < 0.33
          ? Math.sin((phase / 0.33) * Math.PI / 2)
          : Math.cos(((phase - 0.33) / 0.67) * Math.PI / 2)
        for (const item of highlightRef.current) {
          const k = 1 + contraction * 0.018
          item.mesh.scale.set(item.baseScale.x * k, item.baseScale.y * (2 - k), item.baseScale.z * k)
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerup', pick)
      controls.dispose()
      environment.dispose()
      pmrem.dispose()
      background.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      scene.clear()
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
      controlsRef.current = null
      groupsRef.current = {}
      animatedRef.current = { heart: [], lungs: [] }
      firstFitRef.current = false
    }
  }, [onPick])

  const fitCamera = (box: THREE.Box3, animate = false) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls || box.isEmpty()) return
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z, 0.001)
    const fov = THREE.MathUtils.degToRad(camera.fov)
    const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.35
    const currentDirection = camera.position.clone().sub(controls.target).normalize()
    const direction = currentDirection.lengthSq() > 0.1 ? currentDirection : new THREE.Vector3(0.45, 0.12, 1).normalize()
    const nextPosition = center.clone().add(direction.multiplyScalar(distance))
    if (animate) {
      camera.position.lerp(nextPosition, 0.72)
      controls.target.lerp(center, 0.72)
    } else {
      camera.position.copy(nextPosition)
      controls.target.copy(center)
    }
    controls.minDistance = Math.max(maxDim * 0.08, 0.01)
    controls.maxDistance = maxDim * 8
    camera.near = Math.max(distance / 500, 0.001)
    camera.far = Math.max(distance * 30, 100)
    camera.updateProjectionMatrix()
    controls.update()
  }

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    let cancelled = false

    for (const definition of ANATOMY_LAYERS) {
      const wanted = layers.has(definition.key)
      const existing = groupsRef.current[definition.key]
      if (existing) {
        existing.visible = wanted
        continue
      }
      if (!wanted) continue

      setLoading((current) => ({ ...current, [definition.key]: 0.01 }))
      loadLayer(definition.file, (fraction) => {
        if (cancelled) return
        setLoading((current) => ({ ...current, [definition.key]: Math.max(0.01, Math.min(1, fraction)) }))
      }).then((source) => {
        if (cancelled || !sceneRef.current) return
        const clone = source.clone(true)
        clone.name = `anatomy:${definition.key}`
        clone.visible = desiredLayersRef.current.has(definition.key)
        clone.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return
          const name = rawName(object)
          if (hiddenInstruction(name)) {
            object.visible = false
            return
          }
          if (!object.geometry.getAttribute('normal')) object.geometry.computeVertexNormals()
          object.castShadow = false
          object.receiveShadow = false
          object.userData.__layer = definition.key
          object.userData.__tissue = classifyTissue(definition.key, name)
          object.userData.__baseScale = object.scale.clone()
          const lower = name.toLowerCase()
          if (definition.key === 'visceral' || definition.key === 'cardiovascular') {
            if (lower.includes('heart') || lower.includes('atrium') || lower.includes('ventricle') || lower.includes('myocard')) animatedRef.current.heart.push(object)
          }
          if (definition.key === 'visceral' && (lower.includes('lung') || lower.includes('bronch'))) animatedRef.current.lungs.push(object)
        })
        groupsRef.current[definition.key] = clone
        sceneRef.current.add(clone)
        setLoading((current) => {
          const next = { ...current }
          delete next[definition.key]
          return next
        })
        setFailed((current) => {
          const next = new Set(current)
          next.delete(definition.key)
          return next
        })

        const visibleRoots = Object.values(groupsRef.current).filter((group) => group?.visible) as THREE.Object3D[]
        const bounds = new THREE.Box3()
        visibleRoots.forEach((root) => bounds.expandByObject(root))
        if (!bounds.isEmpty()) {
          sceneBoundsRef.current.copy(bounds)
          sceneSizeRef.current = Math.max(bounds.getSize(new THREE.Vector3()).length(), 0.001)
          if (!firstFitRef.current) {
            fitCamera(bounds)
            firstFitRef.current = true
          }
        }
      }).catch(() => {
        if (cancelled) return
        setLoading((current) => {
          const next = { ...current }
          delete next[definition.key]
          return next
        })
        setFailed((current) => new Set(current).add(definition.key))
      })
    }

    return () => { cancelled = true }
  }, [layers])

  useEffect(() => {
    desiredLayersRef.current = layers
    for (const definition of ANATOMY_LAYERS) {
      const group = groupsRef.current[definition.key]
      if (group) group.visible = layers.has(definition.key)
    }
    const bounds = new THREE.Box3()
    Object.values(groupsRef.current).forEach((group) => {
      if (group?.visible) bounds.expandByObject(group)
    })
    if (!bounds.isEmpty()) {
      sceneBoundsRef.current.copy(bounds)
      sceneSizeRef.current = Math.max(bounds.getSize(new THREE.Vector3()).length(), 0.001)
    }
  }, [layers])

  useEffect(() => {
    const size = sceneSizeRef.current
    for (const definition of ANATOMY_LAYERS) {
      const group = groupsRef.current[definition.key]
      if (!group) continue
      const offset = UNFOLD_DIRECTION[definition.key].clone().multiplyScalar(Math.max(0, unfold) * size * 0.035)
      group.position.copy(offset)
      const opacity = layerOpacity(definition.key, dissect)
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || !object.visible) return
        const tissue = (object.userData.__tissue as TissueKind | undefined) ?? classifyTissue(definition.key, rawName(object))
        object.material = renderMode === 'anatomy'
          ? anatomyMaterial(tissue, opacity)
          : radiologyMaterial(definition.key, renderMode, ctWindow)
      })
    }
  }, [renderMode, ctWindow, dissect, unfold, layers])

  useEffect(() => {
    const renderer = rendererRef.current
    const scene = sceneRef.current
    if (!renderer || !scene) return
    const background = scene.background
    if (renderMode === 'anatomy') {
      if (!(background instanceof THREE.Texture)) scene.background = makeGradientBackground()
      renderer.toneMappingExposure = 1.08
      scene.environmentIntensity = 0.82
    } else {
      if (background instanceof THREE.Texture) background.dispose()
      scene.background = new THREE.Color(0x000000)
      renderer.toneMappingExposure = renderMode === 'xray' ? 1.25 : 1
      scene.environmentIntensity = renderMode === 'xray' ? 0.15 : 0.25
    }
  }, [renderMode])

  useEffect(() => {
    const bounds = sceneBoundsRef.current
    if (bounds.isEmpty()) return
    let plane: THREE.Plane | null = null
    if (slicePlane !== 'none' && renderMode !== 'anatomy' && renderMode !== 'xray') {
      const min = bounds.min
      const max = bounds.max
      const p = Math.max(0, Math.min(1, slicePos))
      if (slicePlane === 'axial') {
        const y = THREE.MathUtils.lerp(min.y, max.y, p)
        plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), y)
      } else if (slicePlane === 'coronal') {
        const z = THREE.MathUtils.lerp(min.z, max.z, p)
        plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), z)
      } else {
        const x = THREE.MathUtils.lerp(min.x, max.x, p)
        plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), x)
      }
    }
    for (const definition of ANATOMY_LAYERS) {
      const group = groupsRef.current[definition.key]
      if (!group) continue
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        const material = object.material
        const materials = Array.isArray(material) ? material : [material]
        materials.forEach((item) => {
          item.clippingPlanes = plane ? [plane] : null
          item.clipIntersection = false
          item.needsUpdate = true
        })
      })
    }
  }, [slicePlane, slicePos, renderMode, layers])

  useEffect(() => {
    // Restore any previous per-mesh highlight clone to its shared PBR material.
    for (const item of highlightRef.current) {
      const layer = item.mesh.userData.__layer as LayerKey | undefined
      const tissue = item.mesh.userData.__tissue as TissueKind | undefined
      if (layer && tissue) item.mesh.material = anatomyMaterial(tissue, layerOpacity(layer, dissect))
      item.mesh.scale.copy(item.baseScale)
    }
    highlightRef.current = []

    if (renderMode !== 'anatomy') return
    const exact = new Set(highlighted)
    const keywords = (focusKeywords ?? []).map((keyword) => keyword.toLowerCase())
    if (!exact.size && !keywords.length) return

    const focusBox = new THREE.Box3()
    for (const group of Object.values(groupsRef.current)) {
      if (!group?.visible) continue
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || !object.visible) return
        const name = rawName(object)
        if (!exactOrKeyword(name, exact, keywords)) return
        const shared = object.material
        if (!(shared instanceof THREE.MeshStandardMaterial || shared instanceof THREE.MeshPhysicalMaterial)) return
        const clone = shared.clone()
        clone.emissive = HIGHLIGHT.clone()
        clone.emissiveIntensity = 0.24
        if ('clearcoat' in clone) clone.clearcoat = Math.max((clone as THREE.MeshPhysicalMaterial).clearcoat, 0.12)
        object.material = clone
        const baseScale = (object.userData.__baseScale as THREE.Vector3 | undefined)?.clone() ?? object.scale.clone()
        highlightRef.current.push({ mesh: object, base: shared, baseScale })
        focusBox.expandByObject(object)
      })
    }
    if (keywords.length && !focusBox.isEmpty()) fitCamera(focusBox, true)
  }, [highlighted, focusKeywords, renderMode, dissect, layers])

  const resetCamera = () => {
    const bounds = sceneBoundsRef.current
    if (!bounds.isEmpty()) fitCamera(bounds)
  }

  const loadingEntries = Object.entries(loading)

  return (
    <div className="relative h-full min-h-[520px] w-full overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0" aria-label="Interactive high-fidelity anatomical 3D viewer" />

      <div className="pointer-events-none absolute left-3 top-3 max-w-[78%] rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-white backdrop-blur-xl">
        <div className="text-[8px] font-black uppercase tracking-[.18em] text-cyan-200">Scientific 3D mesh · cinematic tissue PBR</div>
        <div className="mt-1 text-[9px] leading-relaxed text-white/45">Z-Anatomy / BodyParts3D reference geometry · not patient imaging</div>
        {selected && <div className="mt-1 text-[10px] font-black text-white/80">Selected: {selected}</div>}
      </div>

      <button onClick={resetCamera} className="absolute right-3 top-3 rounded-full border border-white/12 bg-black/45 px-3 py-2 text-[9px] font-black text-white/70 backdrop-blur-xl hover:bg-black/65">Reset view</button>

      {loadingEntries.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl border border-white/10 bg-black/60 p-3 text-white backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-wide text-white/55">
            <span>Loading anatomical meshes</span>
            <span>{loadingEntries.map(([key, value]) => `${key} ${Math.round(value * 100)}%`).join(' · ')}</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-cyan-300 transition-[width]" style={{ width: `${Math.round(Math.max(...loadingEntries.map(([, value]) => value)) * 100)}%` }} />
          </div>
        </div>
      )}

      {failed.size > 0 && (
        <div className="absolute bottom-3 left-3 rounded-xl border border-rose-300/20 bg-rose-950/70 px-3 py-2 text-[9px] font-bold text-rose-100 backdrop-blur-xl">
          Could not load: {[...failed].join(', ')}
        </div>
      )}
    </div>
  )
}

export default Body3D
