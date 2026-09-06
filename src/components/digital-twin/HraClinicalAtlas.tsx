import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type LayerKey = 'skin' | 'vasculature' | 'heart' | 'lung' | 'liver' | 'kidneyL' | 'kidneyR' | 'brain'
type LayerState = 'idle' | 'loading' | 'ready' | 'error'

type LayerSpec = {
  key: LayerKey
  label: string
  file: string
  system: string
  detail: string
  defaultOn?: boolean
  opacity?: number
}

const HRA_BASE = 'https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/v1.2/models/'
const HRA_LIBRARY = 'https://humanatlas.io/3d-reference-library'
const HRA_REPO = 'https://github.com/hubmapconsortium/ccf-releases/tree/main/v1.2/models'

const LAYERS: LayerSpec[] = [
  { key: 'skin', label: 'Skin / body envelope', file: 'VH_M_Skin.glb', system: 'Integumentary', detail: 'Visible Human male reference skin used as the spatial envelope.', defaultOn: true, opacity: 0.16 },
  { key: 'vasculature', label: 'Blood vasculature', file: 'VH_M_Blood_Vasculature.glb', system: 'Cardiovascular', detail: 'Whole-body reference vascular geometry.', defaultOn: true },
  { key: 'heart', label: 'Heart', file: 'VH_M_Heart.glb', system: 'Cardiovascular', detail: 'HRA reference heart aligned to the common coordinate framework.', defaultOn: true },
  { key: 'lung', label: 'Lungs', file: 'VH_M_Lung.glb', system: 'Respiratory', detail: 'HRA reference lung geometry.', defaultOn: true },
  { key: 'liver', label: 'Liver', file: 'VH_M_Liver.glb', system: 'Digestive', detail: 'HRA reference liver geometry.' },
  { key: 'kidneyL', label: 'Left kidney', file: 'VH_M_Kidney_L.glb', system: 'Urinary', detail: 'HRA left kidney reference object.' },
  { key: 'kidneyR', label: 'Right kidney', file: 'VH_M_Kidney_R.glb', system: 'Urinary', detail: 'HRA right kidney reference object.' },
  { key: 'brain', label: 'Brain', file: 'Allen_M_Brain.glb', system: 'Nervous', detail: 'Allen male brain reference object distributed with the HRA release.' },
]

const loader = new GLTFLoader()
const cache = new Map<string, Promise<THREE.Group>>()

function loadModel(file: string) {
  const existing = cache.get(file)
  if (existing) return existing
  const promise = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(`${HRA_BASE}${file}`, (gltf) => resolve(gltf.scene), undefined, reject)
  })
  cache.set(file, promise)
  return promise
}

function cleanName(value: string) {
  return value
    .replace(/^VH_[MF]_?/i, '')
    .replace(/^Allen_[MF]_?/i, '')
    .replace(/_[LR]$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .trim()
}

function cloneForDisplay(base: THREE.Group, spec: LayerSpec) {
  const group = base.clone(true)
  group.name = spec.label
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.castShadow = false
    object.receiveShadow = false
    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => material.clone())
    } else if (object.material) {
      object.material = object.material.clone()
    }
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      if (!material) continue
      if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
        material.envMapIntensity = 0.72
        material.metalness = Math.min(material.metalness ?? 0, 0.04)
        material.roughness = Math.max(material.roughness ?? 0.48, 0.32)
      }
      if (spec.opacity !== undefined) {
        material.transparent = true
        material.opacity = spec.opacity
        material.depthWrite = false
        material.side = THREE.DoubleSide
      }
    }
  })
  return group
}

function fitCamera(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object)
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return 1
  const radius = sphere.radius
  controls.target.copy(sphere.center)
  camera.near = Math.max(radius / 500, 0.001)
  camera.far = radius * 25
  camera.position.set(sphere.center.x, sphere.center.y + radius * 0.02, sphere.center.z + radius * 2.65)
  camera.updateProjectionMatrix()
  controls.update()
  return radius
}

export function HraClinicalAtlas() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const worldRef = useRef<THREE.Group | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const groupsRef = useRef<Partial<Record<LayerKey, THREE.Group>>>({})
  const radiusRef = useRef(1)
  const fittedRef = useRef(false)
  const [enabled, setEnabled] = useState<Set<LayerKey>>(() => new Set(LAYERS.filter((item) => item.defaultOn).map((item) => item.key)))
  const [status, setStatus] = useState<Partial<Record<LayerKey, LayerState>>>({})
  const [selected, setSelected] = useState<{ name: string; layer: string } | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x080b0e)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(31, 1, 0.001, 10000)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    const hemi = new THREE.HemisphereLight(0xeef4ff, 0x15191d, 1.6)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 2.6)
    key.position.set(3, 5, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xb9d9ff, 1.2)
    fill.position.set(-4, 2, 3)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffe0cf, 1.0)
    rim.position.set(1, 4, -5)
    scene.add(rim)

    const world = new THREE.Group()
    world.name = 'HRA common coordinate framework'
    scene.add(world)
    worldRef.current = world

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = true
    controls.minDistance = 0.01
    controls.maxDistance = 10000
    controlsRef.current = controls

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointerUp = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(Object.values(groupsRef.current).filter(Boolean) as THREE.Object3D[], true)
      const hit = hits[0]?.object
      if (!hit) return
      let parent: THREE.Object3D | null = hit
      let layer = ''
      while (parent) {
        if (LAYERS.some((item) => item.label === parent?.name)) {
          layer = parent.name
          break
        }
        parent = parent.parent
      }
      setSelected({ name: cleanName(hit.name || parent?.name || 'Anatomical structure'), layer })
    }
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    let frame = 0
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      pmrem.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
      sceneRef.current = null
      worldRef.current = null
      cameraRef.current = null
      controlsRef.current = null
      groupsRef.current = {}
      fittedRef.current = false
    }
  }, [])

  useEffect(() => {
    const world = worldRef.current
    if (!world) return

    for (const spec of LAYERS) {
      const existing = groupsRef.current[spec.key]
      if (existing) existing.visible = enabled.has(spec.key)
      if (!enabled.has(spec.key) || existing || status[spec.key] === 'loading') continue

      setStatus((current) => ({ ...current, [spec.key]: 'loading' }))
      void loadModel(spec.file)
        .then((base) => {
          if (!worldRef.current) return
          const group = cloneForDisplay(base, spec)
          group.visible = true
          worldRef.current.add(group)
          groupsRef.current[spec.key] = group
          setStatus((current) => ({ ...current, [spec.key]: 'ready' }))

          if (spec.key === 'skin' && !fittedRef.current && cameraRef.current && controlsRef.current) {
            radiusRef.current = fitCamera(cameraRef.current, controlsRef.current, group)
            fittedRef.current = true
          } else if (!fittedRef.current && cameraRef.current && controlsRef.current) {
            radiusRef.current = fitCamera(cameraRef.current, controlsRef.current, worldRef.current)
            fittedRef.current = true
          }
        })
        .catch(() => setStatus((current) => ({ ...current, [spec.key]: 'error' })))
    }
  }, [enabled, status])

  function toggleLayer(key: LayerKey) {
    setEnabled((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function view(direction: 'front' | 'back' | 'left' | 'right') {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const r = Math.max(radiusRef.current, 1) * 2.65
    const target = controls.target
    if (direction === 'front') camera.position.set(target.x, target.y, target.z + r)
    if (direction === 'back') camera.position.set(target.x, target.y, target.z - r)
    if (direction === 'left') camera.position.set(target.x - r, target.y, target.z)
    if (direction === 'right') camera.position.set(target.x + r, target.y, target.z)
    camera.lookAt(target)
    controls.update()
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-[#080b0e] shadow-[0_24px_70px_rgba(0,0,0,.22)] dark:border-white/10">
      <header className="border-b border-white/10 bg-[#0c1116] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-300">Human Reference Atlas · HuBMAP</div>
            <h2 className="mt-1 text-[18px] font-black tracking-[-.025em] text-white sm:text-[22px]">Reference anatomy in the HRA common coordinate framework</h2>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-white/55">Official HRA GLB reference objects are loaded from the HuBMAP CCF release. Source materials are preserved rather than replaced with cartoon colors.</p>
          </div>
          <div className="flex gap-2">
            <a href={HRA_LIBRARY} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-[9px] font-black text-white/75">HRA library ↗</a>
            <a href={HRA_REPO} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-[9px] font-black text-white/75">Source repo ↗</a>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_240px]">
        <aside className="order-2 border-t border-white/10 bg-[#0b0f13] p-3 lg:order-1 lg:border-r lg:border-t-0">
          <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/35">Reference layers</div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto lg:block lg:space-y-1.5 lg:overflow-visible">
            {LAYERS.map((item) => {
              const on = enabled.has(item.key)
              const state = status[item.key] ?? 'idle'
              return (
                <button key={item.key} type="button" onClick={() => toggleLayer(item.key)} className={`w-[180px] shrink-0 rounded-2xl border p-3 text-left transition lg:w-full ${on ? 'border-cyan-400/25 bg-cyan-400/[.08]' : 'border-white/[.07] bg-white/[.025]'}`}>
                  <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black text-white">{item.label}</span><span className={`h-2 w-2 rounded-full ${state === 'error' ? 'bg-rose-400' : state === 'loading' ? 'animate-pulse bg-amber-300' : on ? 'bg-cyan-300' : 'bg-white/20'}`} /></div>
                  <div className="mt-1 text-[8px] font-bold uppercase tracking-wide text-white/35">{item.system}</div>
                  <p className="mt-1.5 line-clamp-2 text-[9px] leading-relaxed text-white/48">{item.detail}</p>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="order-1 relative lg:order-2">
          <div ref={mountRef} className="h-[clamp(520px,72vh,840px)] w-full" aria-label="Interactive HuBMAP Human Reference Atlas 3D anatomy viewer" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-black/50 p-1 backdrop-blur-xl">
            {(['front', 'back', 'left', 'right'] as const).map((item) => <button key={item} onClick={() => view(item)} className="rounded-full px-3 py-2 text-[9px] font-black capitalize text-white/75 hover:bg-white/10 hover:text-white">{item}</button>)}
          </div>
        </div>

        <aside className="order-3 border-t border-white/10 bg-[#0b0f13] p-4 lg:border-l lg:border-t-0">
          <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/35">Selected structure</div>
          {selected ? (
            <div className="mt-3">
              <div className="text-[17px] font-black leading-tight text-white">{selected.name}</div>
              {selected.layer && <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-cyan-300">{selected.layer}</div>}
              <p className="mt-3 text-[10px] leading-relaxed text-white/55">Selection comes from the mesh hierarchy in the HRA reference object. Use the live evidence panel below for terminology and literature lookup.</p>
            </div>
          ) : (
            <p className="mt-3 text-[10px] leading-relaxed text-white/45">Tap a visible mesh to inspect its source structure name. Drag to orbit and use the layer controls to expose deeper anatomy.</p>
          )}

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/35">Provenance</div>
            <p className="mt-2 text-[9px] leading-relaxed text-white/48">HuBMAP Human Reference Atlas / CCF release v1.2. Reference objects are distributed under CC BY 4.0; the Allen brain object is included in the HRA release with its source attribution.</p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default HraClinicalAtlas
