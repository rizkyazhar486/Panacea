import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ANATOMY_LAYERS, humanizeStructureName, type AnatomyLayer } from '../Body3D'

type LayerKey = AnatomyLayer['key']
type RenderQuality = 'balanced' | 'cinematic'
type TissueKind =
  | 'skin'
  | 'bone'
  | 'cartilage'
  | 'muscle'
  | 'tendon'
  | 'ligament'
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

interface TissueProfile {
  label: string
  color: number
  roughness: number
  clearcoat: number
  clearcoatRoughness: number
  sheen: number
  transmission?: number
  thickness?: number
}

const TISSUE: Record<TissueKind, TissueProfile> = {
  skin: { label: 'Skin / superficial soft tissue', color: 0xc98e79, roughness: 0.58, clearcoat: 0.12, clearcoatRoughness: 0.52, sheen: 0.18, transmission: 0.035, thickness: 0.6 },
  bone: { label: 'Cortical / cancellous bone', color: 0xd7cfbb, roughness: 0.72, clearcoat: 0.025, clearcoatRoughness: 0.8, sheen: 0.02 },
  cartilage: { label: 'Articular cartilage', color: 0xc7d7d8, roughness: 0.34, clearcoat: 0.2, clearcoatRoughness: 0.32, sheen: 0.08, transmission: 0.02, thickness: 0.12 },
  muscle: { label: 'Skeletal muscle', color: 0x8c2f37, roughness: 0.48, clearcoat: 0.04, clearcoatRoughness: 0.62, sheen: 0.34 },
  tendon: { label: 'Tendon / aponeurosis / fascia', color: 0xd6c4a5, roughness: 0.57, clearcoat: 0.055, clearcoatRoughness: 0.58, sheen: 0.12 },
  ligament: { label: 'Ligament', color: 0xcbb99b, roughness: 0.6, clearcoat: 0.04, clearcoatRoughness: 0.64, sheen: 0.1 },
  artery: { label: 'Arterial vessel', color: 0xb3222a, roughness: 0.42, clearcoat: 0.16, clearcoatRoughness: 0.42, sheen: 0.2 },
  vein: { label: 'Venous vessel', color: 0x31598f, roughness: 0.44, clearcoat: 0.13, clearcoatRoughness: 0.46, sheen: 0.17 },
  nerve: { label: 'Peripheral / central nervous tissue', color: 0xd3b54a, roughness: 0.52, clearcoat: 0.04, clearcoatRoughness: 0.66, sheen: 0.13 },
  brain: { label: 'Brain / neural parenchyma', color: 0xc99a9c, roughness: 0.5, clearcoat: 0.055, clearcoatRoughness: 0.58, sheen: 0.18 },
  heart: { label: 'Myocardium', color: 0x8f2832, roughness: 0.43, clearcoat: 0.08, clearcoatRoughness: 0.5, sheen: 0.28 },
  lung: { label: 'Pulmonary parenchyma', color: 0xb78387, roughness: 0.63, clearcoat: 0.03, clearcoatRoughness: 0.74, sheen: 0.12 },
  liver: { label: 'Liver parenchyma', color: 0x6f2b27, roughness: 0.49, clearcoat: 0.075, clearcoatRoughness: 0.55, sheen: 0.18 },
  kidney: { label: 'Renal parenchyma', color: 0x7d3535, roughness: 0.5, clearcoat: 0.07, clearcoatRoughness: 0.57, sheen: 0.17 },
  gut: { label: 'Gastrointestinal wall', color: 0xb67876, roughness: 0.53, clearcoat: 0.065, clearcoatRoughness: 0.58, sheen: 0.18 },
  fat: { label: 'Adipose tissue', color: 0xd8bc73, roughness: 0.62, clearcoat: 0.025, clearcoatRoughness: 0.72, sheen: 0.08 },
  lymph: { label: 'Lymphatic tissue', color: 0x769b64, roughness: 0.53, clearcoat: 0.045, clearcoatRoughness: 0.62, sheen: 0.12 },
  viscera: { label: 'Visceral soft tissue', color: 0x9e6661, roughness: 0.53, clearcoat: 0.055, clearcoatRoughness: 0.6, sheen: 0.15 },
}

const DEFAULT_LAYERS = new Set<LayerKey>(['skeletal', 'muscular', 'visceral'])
const DEFAULT_OPACITY: Record<LayerKey, number> = {
  surface: 0.36,
  skeletal: 1,
  muscular: 0.98,
  cardiovascular: 1,
  nervous: 1,
  visceral: 0.98,
  lymphoid: 0.92,
}

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
const modelCache = new Map<string, Promise<THREE.Group>>()
const materialCache = new Map<string, THREE.MeshPhysicalMaterial>()

function restoreOriginalNames(gltf: import('three/examples/jsm/loaders/GLTFLoader.js').GLTF) {
  const nodes = gltf.parser.json.nodes as Array<{ name?: string }> | undefined
  if (!nodes) return
  gltf.scene.traverse((obj) => {
    const association = gltf.parser.associations.get(obj) as { nodes?: number } | undefined
    const index = association?.nodes
    if (index !== undefined && nodes[index]?.name) obj.userData.originalName = nodes[index].name
  })
}

function loadModel(file: string, progress?: (fraction: number) => void): Promise<THREE.Group> {
  const existing = modelCache.get(file)
  if (existing) return existing
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

function structureName(obj: THREE.Object3D): string {
  let current: THREE.Object3D | null = obj
  while (current) {
    const name = current.userData.originalName as string | undefined
    if (name) return name
    current = current.parent
  }
  return obj.name || 'Anatomical structure'
}

function classifyTissue(layer: LayerKey, rawName: string): TissueKind {
  const name = rawName.toLowerCase()
  if (layer === 'surface') return name.includes('fat') || name.includes('adip') ? 'fat' : 'skin'
  if (layer === 'skeletal') {
    if (name.includes('cartilage') || name.includes('meniscus') || name.includes('disc')) return 'cartilage'
    if (name.includes('ligament')) return 'ligament'
    return 'bone'
  }
  if (layer === 'muscular') {
    if (name.includes('ligament')) return 'ligament'
    if (name.includes('tendon') || name.includes('aponeuros') || name.includes('fascia')) return 'tendon'
    return 'muscle'
  }
  if (layer === 'cardiovascular') {
    if (name.includes('heart') || name.includes('atrium') || name.includes('ventricle') || name.includes('myocard')) return 'heart'
    if (name.includes('vein') || name.includes('vena') || name.includes('venous') || name.includes('sinus')) return 'vein'
    return 'artery'
  }
  if (layer === 'nervous') {
    if (name.includes('brain') || name.includes('cerebr') || name.includes('cerebell') || name.includes('medulla') || name.includes('pons')) return 'brain'
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

function realisticMaterial(kind: TissueKind, opacity: number, quality: RenderQuality) {
  const key = `${kind}:${opacity.toFixed(2)}:${quality}`
  const cached = materialCache.get(key)
  if (cached) return cached
  const profile = TISSUE[kind]
  const color = new THREE.Color(profile.color)
  const sheenColor = color.clone().lerp(new THREE.Color(0xffffff), 0.38)
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: profile.roughness,
    metalness: 0,
    clearcoat: profile.clearcoat * (quality === 'cinematic' ? 1.2 : 1),
    clearcoatRoughness: profile.clearcoatRoughness,
    sheen: profile.sheen,
    sheenRoughness: 0.62,
    sheenColor,
    transmission: profile.transmission ?? 0,
    thickness: profile.thickness ?? 0,
    ior: kind === 'skin' || kind === 'cartilage' ? 1.4 : 1.38,
    transparent: opacity < 0.999 || (profile.transmission ?? 0) > 0,
    opacity,
    depthWrite: opacity > 0.52,
    side: kind === 'skin' ? THREE.DoubleSide : THREE.FrontSide,
  })
  material.envMapIntensity = quality === 'cinematic' ? 0.95 : 0.72
  materialCache.set(key, material)
  return material
}

function setFrom<T>(source: Set<T>, item: T, on: boolean) {
  const next = new Set(source)
  if (on) next.add(item)
  else next.delete(item)
  return next
}

export function RealisticAnatomyAtlas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const groupsRef = useRef<Partial<Record<LayerKey, THREE.Group>>>({})
  const desiredLayersRef = useRef(DEFAULT_LAYERS)
  const animationRef = useRef<{ heart: THREE.Object3D[]; lungs: THREE.Object3D[] }>({ heart: [], lungs: [] })
  const firstFitRef = useRef(false)
  const [layers, setLayers] = useState<Set<LayerKey>>(() => new Set(DEFAULT_LAYERS))
  const [opacity, setOpacity] = useState<Record<LayerKey, number>>(DEFAULT_OPACITY)
  const [quality, setQuality] = useState<RenderQuality>('cinematic')
  const [motion, setMotion] = useState(true)
  const [selected, setSelected] = useState<{ raw: string; label: string; tissue: TissueKind } | null>(null)
  const [loading, setLoading] = useState<Record<string, number>>({})
  const [failed, setFailed] = useState<Set<LayerKey>>(new Set())
  const [fatal, setFatal] = useState('')

  desiredLayersRef.current = layers

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100)
    camera.position.set(0, 1.2, 3.3)
    cameraRef.current = camera

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      setFatal('This device could not create the WebGL renderer required by the realistic atlas.')
      return
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.045).texture
    scene.environment = environment
    room.dispose()
    pmrem.dispose()

    const hemi = new THREE.HemisphereLight(0xf4f7ff, 0x241814, 1.15)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xfff4e8, 2.1)
    key.position.set(3.2, 4.8, 4.2)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xc7dcff, 0.92)
    fill.position.set(-3.5, 1.8, 2.1)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xd9e9ff, 1.15)
    rim.position.set(-1.8, 3.4, -4.6)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.rotateSpeed = 0.62
    controls.minDistance = 0.25
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
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let down: { x: number; y: number } | null = null
    const onDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY } }
    const onUp = (event: PointerEvent) => {
      if (!down) return
      const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y)
      down = null
      if (moved > 7) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const groups = Object.values(groupsRef.current).filter((group): group is THREE.Group => Boolean(group))
      const hit = raycaster.intersectObjects(groups, true)[0]
      if (!hit) return
      const raw = structureName(hit.object)
      const layer = hit.object.userData.layerKey as LayerKey | undefined
      setSelected({ raw, label: humanizeStructureName(raw), tissue: classifyTissue(layer ?? 'visceral', raw) })
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    const clock = new THREE.Clock()
    let frame = 0
    const render = () => {
      const t = clock.getElapsedTime()
      if (motion) {
        const heartPulse = 1 - Math.max(0, Math.sin(t * Math.PI * 2 * 1.15)) * 0.035
        for (const obj of animationRef.current.heart) {
          const base = obj.userData.realisticBaseScale as THREE.Vector3 | undefined
          if (base) obj.scale.set(base.x * heartPulse, base.y * heartPulse, base.z * heartPulse)
        }
        const breath = 1 + (Math.sin(t * Math.PI * 2 * 0.23) * 0.5 + 0.5) * 0.028
        for (const obj of animationRef.current.lungs) {
          const base = obj.userData.realisticBaseScale as THREE.Vector3 | undefined
          if (base) obj.scale.set(base.x * breath, base.y * breath, base.z * breath)
        }
      }
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      controls.dispose()
      environment.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement)
      sceneRef.current = null
      rendererRef.current = null
      controlsRef.current = null
      groupsRef.current = {}
      animationRef.current = { heart: [], lungs: [] }
      firstFitRef.current = false
    }
  }, [motion])

  useEffect(() => {
    const renderer = rendererRef.current
    const container = containerRef.current
    const camera = cameraRef.current
    if (!renderer || !container || !camera) return
    const ratio = quality === 'cinematic' ? 2 : 1.35
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, ratio))
    renderer.setSize(Math.max(container.clientWidth, 1), Math.max(container.clientHeight, 1), false)
    camera.aspect = Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1)
    camera.updateProjectionMatrix()
  }, [quality])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    for (const definition of ANATOMY_LAYERS) {
      const want = layers.has(definition.key)
      const current = groupsRef.current[definition.key]
      if (want && !current) {
        setLoading((state) => ({ ...state, [definition.key]: 0 }))
        loadModel(definition.file, (fraction) => setLoading((state) => ({ ...state, [definition.key]: fraction })))
          .then((source) => {
            if (!desiredLayersRef.current.has(definition.key)) return
            const clone = source.clone(true)
            clone.traverse((obj) => {
              const raw = obj.userData.originalName as string | undefined
              if (raw?.startsWith('HOW TO')) obj.visible = false
              if (raw && (raw.toLowerCase().includes('heart') || raw.toLowerCase().includes('atrium') || raw.toLowerCase().includes('ventricle'))) {
                obj.userData.realisticBaseScale = obj.scale.clone()
                animationRef.current.heart.push(obj)
              }
              if (raw && (raw.toLowerCase().includes('lung') || raw.toLowerCase().includes('bronch'))) {
                obj.userData.realisticBaseScale = obj.scale.clone()
                animationRef.current.lungs.push(obj)
              }
              if (!(obj instanceof THREE.Mesh)) return
              const name = structureName(obj)
              const tissue = classifyTissue(definition.key, name)
              obj.userData.layerKey = definition.key
              obj.userData.tissueKind = tissue
              if (!obj.geometry.getAttribute('normal')) obj.geometry.computeVertexNormals()
              obj.material = realisticMaterial(tissue, opacity[definition.key], quality)
              obj.frustumCulled = true
            })
            groupsRef.current[definition.key] = clone
            scene.add(clone)
            setLoading((state) => {
              const next = { ...state }
              delete next[definition.key]
              return next
            })
            setFailed((state) => {
              const next = new Set(state)
              next.delete(definition.key)
              return next
            })

            const camera = cameraRef.current
            const controls = controlsRef.current
            if (!firstFitRef.current && camera && controls) {
              const box = new THREE.Box3().setFromObject(clone)
              if (!box.isEmpty()) {
                const center = box.getCenter(new THREE.Vector3())
                const size = box.getSize(new THREE.Vector3())
                const distance = Math.max(size.y * 1.58, 1)
                camera.position.set(center.x, center.y + size.y * 0.035, center.z + distance)
                camera.near = Math.max(distance / 140, 0.01)
                camera.far = distance * 18
                camera.updateProjectionMatrix()
                controls.target.copy(center)
                controls.minDistance = distance * 0.12
                controls.maxDistance = distance * 4
                controls.update()
                firstFitRef.current = true
              }
            }
          })
          .catch(() => {
            modelCache.delete(definition.file)
            setLoading((state) => {
              const next = { ...state }
              delete next[definition.key]
              return next
            })
            setFailed((state) => new Set(state).add(definition.key))
          })
      } else if (!want && current) {
        scene.remove(current)
        delete groupsRef.current[definition.key]
        animationRef.current.heart = animationRef.current.heart.filter((obj) => obj.parent !== null)
        animationRef.current.lungs = animationRef.current.lungs.filter((obj) => obj.parent !== null)
      }
    }
  }, [layers, opacity, quality])

  useEffect(() => {
    for (const definition of ANATOMY_LAYERS) {
      const group = groupsRef.current[definition.key]
      if (!group) continue
      group.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return
        const name = structureName(obj)
        const tissue = classifyTissue(definition.key, name)
        obj.material = realisticMaterial(tissue, opacity[definition.key], quality)
      })
    }
  }, [opacity, quality])

  const activeLoads = Object.entries(loading)

  return (
    <div className="space-y-4 pb-8">
      <header className="overflow-hidden rounded-3xl border border-white/10 bg-[#070b10] p-5 text-white shadow-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">PanaceaMed · Realistic Anatomy Atlas</div>
            <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">Human anatomy with tissue-aware physical rendering.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">
              The geometry remains the open Z-Anatomy / BodyParts3D atlas; this mode improves visual realism with organ-specific PBR materials, studio environment lighting, translucent superficial tissue and exact named-structure picking. Visual realism is not a substitute for patient imaging or histologic validation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setQuality('balanced')} className={`rounded-full border px-4 py-2 text-xs font-black ${quality === 'balanced' ? 'border-cyan-300 bg-cyan-300 text-black' : 'border-white/15 bg-white/5'}`}>Balanced</button>
            <button onClick={() => setQuality('cinematic')} className={`rounded-full border px-4 py-2 text-xs font-black ${quality === 'cinematic' ? 'border-cyan-300 bg-cyan-300 text-black' : 'border-white/15 bg-white/5'}`}>Cinematic</button>
            <button onClick={() => setMotion((value) => !value)} className={`rounded-full border px-4 py-2 text-xs font-black ${motion ? 'border-rose-300 bg-rose-300 text-black' : 'border-white/15 bg-white/5'}`}>{motion ? '4D motion ON' : '4D motion OFF'}</button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
          <div className="text-sm font-black text-ink dark:text-white">Tissue layers</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">Reveal or fade systems instead of flattening them into one opaque model.</p>
          <div className="mt-4 space-y-3">
            {ANATOMY_LAYERS.map((definition) => {
              const enabled = layers.has(definition.key)
              return (
                <div key={definition.key} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span className="text-xs font-black text-ink dark:text-white">{definition.label}</span>
                    <input type="checkbox" checked={enabled} onChange={(event) => setLayers((state) => setFrom(state, definition.key, event.target.checked))} className="h-4 w-4 accent-cyan-500" />
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input aria-label={`${definition.label} opacity`} disabled={!enabled} type="range" min="0.08" max="1" step="0.02" value={opacity[definition.key]} onChange={(event) => setOpacity((state) => ({ ...state, [definition.key]: Number(event.target.value) }))} className="min-w-0 flex-1 accent-cyan-500 disabled:opacity-30" />
                    <span className="w-9 text-right text-[10px] font-bold tabular-nums text-neutral-500">{Math.round(opacity[definition.key] * 100)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
          {failed.size > 0 && <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-[11px] text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">Could not load: {[...failed].join(', ')}.</div>}
        </aside>

        <main className="min-w-0">
          <div className="relative min-h-[620px] overflow-hidden rounded-3xl border border-white/10 bg-[#080b10] shadow-2xl" style={{ backgroundImage: 'radial-gradient(circle at 50% 35%, rgba(80,102,120,.24), rgba(8,11,16,.98) 56%, #05070a 100%)' }}>
            <div ref={containerRef} className="h-[72vh] min-h-[620px] w-full touch-none" />
            <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white/65 backdrop-blur">PBR tissue render · educational atlas</div>
            {activeLoads.length > 0 && (
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/70 p-3 text-white backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-wide text-white/60">Streaming anatomy</div>
                {activeLoads.map(([key, fraction]) => (
                  <div key={key} className="mt-2">
                    <div className="flex justify-between text-[10px]"><span>{ANATOMY_LAYERS.find((layer) => layer.key === key)?.label ?? key}</span><span>{Math.round(fraction * 100)}%</span></div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.round(fraction * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
            {fatal && <div className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-white/70">{fatal}</div>}
          </div>
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <div className="text-sm font-black text-ink dark:text-white">Selected structure</div>
            {selected ? (
              <div className="mt-3">
                <div className="text-lg font-black text-ink dark:text-white">{selected.label}</div>
                <div className="mt-2 inline-flex rounded-full border border-cyan-300/40 bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">{TISSUE[selected.tissue].label}</div>
                <p className="mt-3 break-words text-[11px] leading-relaxed text-neutral-500">Atlas node: {selected.raw}</p>
              </div>
            ) : <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">Tap a bone, muscle, vessel, nerve or organ. Rotation gestures do not trigger selection.</p>}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <div className="text-sm font-black text-ink dark:text-white">What changed</div>
            <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              <p><strong>Physical materials:</strong> bone, cartilage, muscle, tendon, ligament, arteries, veins, nerves and major viscera use different optical profiles.</p>
              <p><strong>Environment:</strong> ACES tone mapping plus a generated studio environment improves depth and surface response without external HDR assets.</p>
              <p><strong>Transparency:</strong> superficial layers can be faded while preserving spatial context.</p>
              <p><strong>4D:</strong> heart and lung structures receive subtle educational motion where named meshes are available.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-[11px] leading-relaxed text-amber-950 dark:bg-amber-300/10 dark:text-amber-100">
            <strong>Precision boundary.</strong> Better shading cannot invent anatomy missing from the source mesh. Scan-derived microvasculature, retinal layers, fascicles, trabeculae or cellular structures require validated higher-resolution assets and their own provenance.
          </section>
        </aside>
      </div>
    </div>
  )
}

export default RealisticAnatomyAtlas
