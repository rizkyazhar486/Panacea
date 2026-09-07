import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { keburaman, geserBuka, KEDALAMAN, type KunciLapisan } from '../lib/dissection'

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
  let n = raw
  if (n.endsWith('.l')) n = n.slice(0, -2) + ' (left)'
  else if (n.endsWith('.r')) n = n.slice(0, -2) + ' (right)'
  return n.charAt(0).toUpperCase() + n.slice(1)
}

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)

function restoreOriginalNames(gltf: import('three/examples/jsm/loaders/GLTFLoader.js').GLTF) {
  const nodes = gltf.parser.json.nodes as Array<{ name?: string }> | undefined
  if (!nodes) return
  gltf.scene.traverse((obj) => {
    const assoc = gltf.parser.associations.get(obj) as { nodes?: number } | undefined
    const nodeIndex = assoc?.nodes
    if (nodeIndex !== undefined && nodes[nodeIndex]?.name) obj.userData.originalName = nodes[nodeIndex].name
  })
}

const modelCache = new Map<string, Promise<THREE.Group>>()
function loadLayer(file: string, onProgress?: (pct: number) => void): Promise<THREE.Group> {
  let promise = modelCache.get(file)
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      loader.load(
        `${import.meta.env.BASE_URL}anatomy/${file}`,
        (gltf) => {
          restoreOriginalNames(gltf)
          resolve(gltf.scene)
        },
        (event) => {
          if (event.total > 0 && onProgress) onProgress(event.loaded / event.total)
        },
        (error) => reject(error instanceof Error ? error : new Error(String(error))),
      )
    })
    modelCache.set(file, promise)
  }
  return promise
}

const HIGHLIGHT = new THREE.Color(0x00bf63)

export type RenderMode = 'anatomy' | 'xray' | 'ct' | 'mriT1' | 'mriT2'
export type SlicePlane = 'none' | 'axial' | 'coronal' | 'sagittal'
export interface CtWindow { key: string; label: string; width: number; level: number }

export const CT_WINDOWS: CtWindow[] = [
  { key: 'soft', label: 'Soft tissue', width: 400, level: 40 },
  { key: 'lung', label: 'Lung', width: 1500, level: -600 },
  { key: 'bone', label: 'Bone', width: 2000, level: 400 },
]

export const RENDER_MODES: Array<{ key: RenderMode; label: string; hint: string }> = [
  { key: 'anatomy', label: 'Anatomy', hint: 'True anatomical colours' },
  { key: 'xray', label: 'X-ray', hint: 'Beam attenuation accumulates through overlapping tissue — dense bone absorbs most' },
  { key: 'ct', label: 'CT', hint: 'Hounsfield units mapped through a real CT window — change the window to change what you can see' },
  { key: 'mriT1', label: 'MRI T1', hint: 'Fat bright, fluid dark, cortical bone signal-void — the anatomy sequence' },
  { key: 'mriT2', label: 'MRI T2', hint: 'Fluid bright — the sequence that shows oedema and most pathology' },
]

type LayerKey = AnatomyLayer['key']
interface TissueProperty { hu: number; t1: number; t2: number; mu: number }

const TISSUE: Record<LayerKey, TissueProperty> = {
  skeletal: { hu: 800, t1: 0.12, t2: 0.08, mu: 1.0 },
  muscular: { hu: 45, t1: 0.42, t2: 0.35, mu: 0.28 },
  surface: { hu: -60, t1: 0.85, t2: 0.55, mu: 0.16 },
  cardiovascular: { hu: 50, t1: 0.38, t2: 0.30, mu: 0.30 },
  nervous: { hu: 35, t1: 0.55, t2: 0.62, mu: 0.24 },
  visceral: { hu: 55, t1: 0.48, t2: 0.58, mu: 0.32 },
  lymphoid: { hu: 40, t1: 0.40, t2: 0.68, mu: 0.26 },
}

function windowHu(hu: number, window: CtWindow): number {
  const low = window.level - window.width / 2
  const high = window.level + window.width / 2
  if (hu <= low) return 0
  if (hu >= high) return 1
  return (hu - low) / (high - low)
}

const MODE_BACKGROUND: Record<RenderMode, number> = {
  anatomy: 0x0a0a0f,
  xray: 0x04060c,
  ct: 0x000000,
  mriT1: 0x000000,
  mriT2: 0x000000,
}

const radiologyMaterialCache = new Map<string, THREE.MeshStandardMaterial>()
function radiologyMaterial(
  layer: LayerKey,
  mode: Exclude<RenderMode, 'anatomy'>,
  window: CtWindow,
  clip: THREE.Plane | null,
): THREE.MeshStandardMaterial {
  const cacheKey = `${mode}:${layer}:${mode === 'ct' ? window.key : '-'}:${clip ? 'clip' : 'full'}`
  let material = radiologyMaterialCache.get(cacheKey)
  if (material) return material

  const tissue = TISSUE[layer]
  let grey: number
  let opacity = 1
  if (mode === 'ct') grey = windowHu(tissue.hu, window)
  else if (mode === 'mriT1') grey = tissue.t1
  else if (mode === 'mriT2') grey = tissue.t2
  else {
    grey = 1
    opacity = Math.min(tissue.mu * 0.9, 0.95)
  }

  const value = Math.max(0, Math.min(1, grey))
  material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(value, value, value),
    roughness: 1,
    metalness: 0,
    transparent: mode === 'xray',
    opacity,
    blending: mode === 'xray' ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: mode !== 'xray',
    side: mode === 'xray' || clip ? THREE.DoubleSide : THREE.FrontSide,
    clippingPlanes: clip ? [clip] : null,
  })
  radiologyMaterialCache.set(cacheKey, material)
  return material
}

/**
 * Physiological state is deliberately kept separate from anatomy geometry.
 * The previous implementation scaled organs, vessels and muscles every frame,
 * which made precise meshes behave like balloons. These values now remain a
 * signal layer for teaching and simulator context while the source anatomy is
 * kept geometrically stable.
 */
export interface MotionState {
  heartRate: number
  respRate: number
  contractionRate: number
  peristalsisRate?: number
}

export const MOTION_OFF: MotionState = { heartRate: 0, respRate: 0, contractionRate: 0, peristalsisRate: 0 }
export const MOTION_REST: MotionState = { heartRate: 70, respRate: 14, contractionRate: 0, peristalsisRate: 8 }
export const MOTION_EXERCISE: MotionState = { heartRate: 160, respRate: 40, contractionRate: 30, peristalsisRate: 3 }

interface Props {
  layers: Set<AnatomyLayer['key']>
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

function gradientTexture(top: number, bottom: number): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`
  gradient.addColorStop(0, hex(top))
  gradient.addColorStop(1, hex(bottom))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 2, 256)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
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
  const groupsRef = useRef<Partial<Record<AnatomyLayer['key'], THREE.Group>>>({})
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const homeFramingRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3; minDistance: number; maxDistance: number } | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const lightsRef = useRef<{ ambient: THREE.AmbientLight; key: THREE.DirectionalLight; fill: THREE.DirectionalLight; rim: THREE.DirectionalLight } | null>(null)
  const clipRef = useRef<THREE.Plane | null>(null)
  const backgroundRef = useRef<THREE.Texture | null>(null)
  const bodyBoxRef = useRef<THREE.Box3 | null>(null)
  const hasFitRef = useRef(false)
  const visibleRef = useRef(true)
  const pageVisibleRef = useRef(typeof document === 'undefined' ? true : document.visibilityState === 'visible')
  const highlightedMeshesRef = useRef<Map<THREE.Mesh, { original: THREE.Color; matchedName: string }>>(new Map())
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set())
  const [failedLayers, setFailedLayers] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [fatal, setFatal] = useState('')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100)
    camera.position.set(0, 1.3, 3.4)
    cameraRef.current = camera

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      setFatal('This device could not start 3D graphics. Open lightweight mode or reload after closing other graphics-heavy tabs.')
      return
    }

    const mobile = window.matchMedia('(max-width: 767px)').matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.35 : 2))
    renderer.setClearColor(0x0a0a0f, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.localClippingEnabled = true
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = environment.texture
    scene.environmentIntensity = 0.4
    pmrem.dispose()

    backgroundRef.current = gradientTexture(0x141922, 0x05070b)
    scene.background = backgroundRef.current

    const ambient = new THREE.AmbientLight(0xffffff, 0.32)
    const key = new THREE.DirectionalLight(0xffffff, 0.85)
    key.position.set(2, 4, 3)
    const fill = new THREE.DirectionalLight(0xffffff, 0.25)
    fill.position.set(-3, 1, -2)
    const rim = new THREE.DirectionalLight(0xdce8ff, 0.55)
    rim.position.set(-1.5, 2.5, -4)
    scene.add(ambient, key, fill, rim)
    lightsRef.current = { ambient, key, fill, rim }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 0.3
    controls.maxDistance = 12
    controls.target.set(0, 1, 0)
    controls.update()
    controlsRef.current = controls

    const resize = () => {
      const width = Math.max(container.clientWidth, 1)
      const height = Math.max(container.clientHeight, 1)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry?.isIntersecting ?? true },
      { rootMargin: '160px 0px', threshold: 0.01 },
    )
    intersectionObserver.observe(container)

    const onVisibilityChange = () => {
      pageVisibleRef.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let downPos: { x: number; y: number } | null = null

    const toPointer = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
    const onPointerDown = (event: PointerEvent) => { downPos = { x: event.clientX, y: event.clientY } }
    const onPointerUp = (event: PointerEvent) => {
      if (!downPos) return
      const moved = Math.hypot(event.clientX - downPos.x, event.clientY - downPos.y)
      downPos = null
      if (moved > 6) return
      toPointer(event)
      raycaster.setFromCamera(pointer, camera)
      const targets = Object.values(groupsRef.current).filter((group): group is THREE.Group => !!group)
      const hits = raycaster.intersectObjects(targets, true)
      if (!hits.length) return
      let object: THREE.Object3D | null = hits[0].object
      while (object && !object.userData.originalName) object = object.parent
      if (object) {
        const rawName = object.userData.originalName as string
        onPickRef.current(rawName, humanizeStructureName(rawName))
      }
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    const onContextLost = (event: Event) => {
      event.preventDefault()
      setFatal('The browser paused 3D because graphics memory ran low. Reload or use fewer anatomy layers.')
    }
    const onContextRestored = () => setFatal('')
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)

    let raf = 0
    const animate = () => {
      if (visibleRef.current && pageVisibleRef.current) {
        controls.update()
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
      controls.dispose()
      environment.dispose()
      backgroundRef.current?.dispose()
      backgroundRef.current = null
      renderer.dispose()
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement)
      sceneRef.current = null
      rendererRef.current = null
      controlsRef.current = null
      cameraRef.current = null
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    for (const definition of ANATOMY_LAYERS) {
      const wanted = layers.has(definition.key)
      const current = groupsRef.current[definition.key]

      if (wanted && !current) {
        setLoadingLayers((state) => new Set(state).add(definition.key))
        loadLayer(definition.file, (pct) => setProgress((state) => ({ ...state, [definition.key]: pct })))
          .then((source) => {
            const clone = source.clone(true)
            clone.traverse((child) => {
              if (child instanceof THREE.Mesh) child.userData.baseMaterial = child.material
              const name = child.userData.originalName as string | undefined
              if (name?.startsWith('HOW TO')) child.visible = false
            })
            groupsRef.current[definition.key] = clone
            scene.add(clone)
            setFailedLayers((state) => {
              const next = new Set(state)
              next.delete(definition.key)
              return next
            })
            setLoadingLayers((state) => {
              const next = new Set(state)
              next.delete(definition.key)
              return next
            })

            const camera = cameraRef.current
            const controls = controlsRef.current
            if (!hasFitRef.current && camera && controls) {
              const box = new THREE.Box3().setFromObject(clone)
              if (!box.isEmpty()) {
                const center = box.getCenter(new THREE.Vector3())
                const size = box.getSize(new THREE.Vector3())
                const height = Math.max(size.y, 0.1)
                const distance = height * 1.7
                camera.position.set(
                  center.x + distance * 0.26,
                  center.y + height * 0.06,
                  center.z + distance * 0.96,
                )
                camera.near = Math.max(distance / 100, 0.01)
                camera.far = distance * 20
                camera.updateProjectionMatrix()
                controls.target.copy(center)
                controls.minDistance = distance * 0.15
                controls.maxDistance = distance * 4
                controls.update()
                hasFitRef.current = true
                bodyBoxRef.current = box.clone()
                homeFramingRef.current = {
                  position: camera.position.clone(),
                  target: center.clone(),
                  minDistance: controls.minDistance,
                  maxDistance: controls.maxDistance,
                }
              }
            }
          })
          .catch(() => {
            setLoadingLayers((state) => {
              const next = new Set(state)
              next.delete(definition.key)
              return next
            })
            setFailedLayers((state) => new Set(state).add(definition.key))
            modelCache.delete(definition.file)
          })
      } else if (!wanted && current) {
        scene.remove(current)
        delete groupsRef.current[definition.key]
      }
    }
  }, [layers])

  useEffect(() => {
    const box = bodyBoxRef.current
    if (slicePlane === 'none' || renderMode === 'anatomy' || renderMode === 'xray' || !box) {
      clipRef.current = null
    } else {
      const normal =
        slicePlane === 'axial' ? new THREE.Vector3(0, -1, 0)
        : slicePlane === 'coronal' ? new THREE.Vector3(0, 0, -1)
        : new THREE.Vector3(-1, 0, 0)
      const low = slicePlane === 'axial' ? box.min.y : slicePlane === 'coronal' ? box.min.z : box.min.x
      const high = slicePlane === 'axial' ? box.max.y : slicePlane === 'coronal' ? box.max.z : box.max.x
      const at = low + (high - low) * Math.max(0, Math.min(1, slicePos))
      clipRef.current = new THREE.Plane(normal, at)
    }

    highlightedMeshesRef.current.clear()
    for (const definition of ANATOMY_LAYERS) {
      const group = groupsRef.current[definition.key]
      if (!group) continue
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        child.material = renderMode === 'anatomy'
          ? (child.userData.baseMaterial as THREE.Material)
          : radiologyMaterial(definition.key, renderMode, ctWindow, clipRef.current)
      })
    }

    rendererRef.current?.setClearColor(MODE_BACKGROUND[renderMode], 1)
    const lights = lightsRef.current
    if (lights) {
      const xray = renderMode === 'xray'
      lights.ambient.intensity = xray ? 1.1 : 0.32
      lights.key.intensity = xray ? 0.15 : 0.85
      lights.fill.intensity = xray ? 0.1 : 0.25
      lights.rim.intensity = xray ? 0 : 0.55
    }
    const scene = sceneRef.current
    if (scene) {
      const anatomy = renderMode === 'anatomy'
      scene.environmentIntensity = anatomy ? 0.4 : 0
      scene.background = anatomy ? backgroundRef.current : null
    }
  }, [renderMode, ctWindow, slicePlane, slicePos, loadingLayers])

  useEffect(() => {
    const box = bodyBoxRef.current
    if (!box) return
    const center = box.getCenter(new THREE.Vector3())
    const world = new THREE.Vector3()

    for (const definition of ANATOMY_LAYERS) {
      const group = groupsRef.current[definition.key]
      if (!group) continue
      const key = definition.key as KunciLapisan
      const opacity = keburaman(key, dissect)
      const depth = KEDALAMAN[key]

      group.traverse((object) => {
        const name = object.userData.originalName as string | undefined
        if (name && !object.userData.originalPosition) {
          object.userData.originalPosition = object.position.clone()
          object.getWorldPosition(world)
          object.userData.originalWorldCenter = world.clone()
        }
        if (name && object.userData.originalPosition) {
          const original = object.userData.originalPosition as THREE.Vector3
          const worldCenter = object.userData.originalWorldCenter as THREE.Vector3
          const displacement = geserBuka(
            { x: worldCenter.x, y: worldCenter.y, z: worldCenter.z },
            { x: center.x, y: center.y, z: center.z },
            unfold,
            depth,
          )
          object.position.set(original.x + displacement.x, original.y + displacement.y, original.z + displacement.z)
        }

        if (object instanceof THREE.Mesh) {
          const source = object.material as THREE.Material | THREE.Material[]
          const materials = Array.isArray(source) ? source : [source]
          for (const material of materials) {
            if (!material) continue
            material.transparent = opacity < 0.999
            material.opacity = opacity
            material.depthWrite = opacity >= 0.999
            material.needsUpdate = true
          }
        }
      })
    }
  }, [unfold, dissect, layers, loadingLayers, renderMode])

  useEffect(() => {
    const exact = new Set(highlighted)
    const keywords = (focusKeywords ?? []).map((value) => value.toLowerCase())
    const matches = (name: string) => exact.has(name) || keywords.some((keyword) => name.toLowerCase().includes(keyword))
    const current = highlightedMeshesRef.current

    for (const [mesh, entry] of current) {
      if (!matches(entry.matchedName)) {
        const material = mesh.material as THREE.MeshStandardMaterial
        if (material.emissive) {
          material.emissive.copy(entry.original)
          material.emissiveIntensity = 0
        }
        current.delete(mesh)
      }
    }

    const groups = Object.values(groupsRef.current).filter((group): group is THREE.Group => !!group)
    const focusBox = focusKeywords?.length ? new THREE.Box3() : null
    for (const group of groups) {
      group.traverse((object) => {
        const originalName = object.userData.originalName as string | undefined
        if (!originalName || !matches(originalName)) return
        if (focusBox) focusBox.expandByObject(object)
        object.traverse((child) => {
          if (!(child instanceof THREE.Mesh) || current.has(child)) return
          const shared = child.material as THREE.MeshStandardMaterial
          if (!shared || !('emissive' in shared)) return
          const material = shared.clone()
          child.material = material
          current.set(child, { original: material.emissive.clone(), matchedName: originalName })
          material.emissive = HIGHLIGHT.clone()
          material.emissiveIntensity = 0.55
        })
      })
    }

    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    if (focusBox && !focusBox.isEmpty()) {
      const center = focusBox.getCenter(new THREE.Vector3())
      const size = focusBox.getSize(new THREE.Vector3())
      const radius = Math.max(size.length() * 0.5, 0.03)
      const distance = Math.max(radius * 8, 0.35)
      let direction = camera.position.clone().sub(controls.target)
      if (direction.lengthSq() < 1e-8) direction = new THREE.Vector3(0, 0.15, 1)
      direction.normalize()
      camera.position.copy(center.clone().add(direction.multiplyScalar(distance)))
      controls.target.copy(center)
      controls.minDistance = distance * 0.3
      controls.maxDistance = distance * 8
      controls.update()
    } else if (!focusKeywords && homeFramingRef.current) {
      const home = homeFramingRef.current
      camera.position.copy(home.position)
      controls.target.copy(home.target)
      controls.minDistance = home.minDistance
      controls.maxDistance = home.maxDistance
      controls.update()
    }
  }, [highlighted, focusKeywords, loadingLayers, renderMode])

  const isLoading = loadingLayers.size > 0
  const hasPhysiologySignal = motion.heartRate > 0 || motion.respRate > 0 || motion.contractionRate > 0 || (motion.peristalsisRate ?? 0) > 0

  return (
    <div className="relative -mx-5 -mt-5 mb-3 h-[68vh] max-h-[820px] min-h-[480px] overflow-hidden rounded-t-2xl bg-gradient-to-b from-neutral-900 to-neutral-950">
      <div ref={containerRef} className="h-full w-full touch-none" />

      {hasPhysiologySignal && !fatal && (
        <div className="pointer-events-none absolute right-2 top-2 max-w-[210px] rounded-xl border border-white/10 bg-black/55 px-2.5 py-2 text-right backdrop-blur-sm">
          <div className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-300">Physiology signal</div>
          <div className="mt-0.5 text-[10px] font-semibold leading-relaxed text-white/90">
            {motion.heartRate > 0 && <span>HR {Math.round(motion.heartRate)}/min</span>}
            {motion.respRate > 0 && <span>{motion.heartRate > 0 ? ' · ' : ''}RR {Math.round(motion.respRate)}/min</span>}
            {motion.contractionRate > 0 && <span> · tempo {Math.round(motion.contractionRate)}/min</span>}
          </div>
          <div className="mt-0.5 text-[9px] leading-snug text-white/55">Educational state only · source anatomy geometry preserved</div>
        </div>
      )}

      {fatal && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/95 p-5">
          <div className="max-w-sm text-center">
            <div className="text-sm font-black text-white">3D viewer unavailable</div>
            <p className="mt-1 text-xs leading-relaxed text-neutral-300">{fatal}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 min-h-10 rounded-full bg-white px-4 text-xs font-black text-neutral-950"
            >
              Reload viewer
            </button>
          </div>
        </div>
      )}

      {!fatal && isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-56 rounded-xl bg-black/70 px-3 py-2.5 text-center">
            <span className="text-xs font-semibold text-white">Loading anatomy…</span>
            {[...loadingLayers].map((key) => {
              const definition = ANATOMY_LAYERS.find((layer) => layer.key === key)
              const pct = Math.round((progress[key] ?? 0) * 100)
              return (
                <div key={key} className="mt-1.5">
                  <div className="flex justify-between text-[10px] text-neutral-300">
                    <span>{definition?.label ?? key}</span><span>{pct}%</span>
                  </div>
                  <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {failedLayers.size > 0 && (
        <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-red-950/85 px-2.5 py-1.5 text-[11px] text-red-200">
          Couldn’t load: {[...failedLayers].map((key) => ANATOMY_LAYERS.find((layer) => layer.key === key)?.label ?? key).join(', ')} — check the connection and toggle that layer off and on to retry.
        </div>
      )}

      {!fatal && !isLoading && failedLayers.size === 0 && layers.size === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5">
          <p className="text-center text-xs text-neutral-400">Every layer is switched off. Turn on Skeleton or Muscles below to see the body.</p>
        </div>
      )}
    </div>
  )
}

export default Body3D
