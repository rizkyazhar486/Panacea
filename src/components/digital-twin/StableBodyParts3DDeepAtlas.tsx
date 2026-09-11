import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

type SystemId = 'skeletal' | 'muscular' | 'arterial' | 'venous' | 'nervous' | 'digestive' | 'respiratory' | 'urinary' | 'reproductive' | 'lymphatic' | 'endocrine' | 'integumentary' | 'connective' | 'sensory' | 'cardiac'
type Quality = 'balanced' | 'hd'

type Part = {
  id: string
  name: string
  conceptId: string
  system: SystemId
  chunk: number
  positions: number
  normals: number
  indices: number
  vertexCount: number
  indexCount: number
  bounds: [number[], number[]]
}

type Concept = { id: string; name: string; elements: string[] }
type AtlasChunk = { url: string; bytes: number; gzip?: string; gzipBytes?: number }
type Atlas = { version: string; sex?: 'male'; source?: string; scope?: string; parts: Part[]; concepts: Concept[]; chunks: AtlasChunk[]; triangles: number }
type LoadMode = { kind: 'system'; system: SystemId } | { kind: 'part'; part: Part }

const SOURCE_REPO = 'https://github.com/ashemag/human-atlas'
const ATTRIBUTION = `${SOURCE_REPO}/blob/main/public/ATTRIBUTION.md`
const RAW_BASE = 'https://raw.githubusercontent.com/ashemag/human-atlas/main/public/models/'
const MANIFEST_URL = `${RAW_BASE}atlas.json`

const SYSTEMS: { id: SystemId; label: string; description: string; color: string }[] = [
  { id: 'skeletal', label: 'Skeleton', description: 'Bones and skeletal framework.', color: '#ded4b6' },
  { id: 'muscular', label: 'Muscles', description: 'Skeletal muscles and movement apparatus.', color: '#9f5148' },
  { id: 'connective', label: 'Connective tissue', description: 'Cartilage, ligaments and connective structures.', color: '#a8beb7' },
  { id: 'integumentary', label: 'Body surface', description: 'External body-surface reference.', color: '#b3977c' },
  { id: 'cardiac', label: 'Heart', description: 'Cardiac structures.', color: '#ad5a54' },
  { id: 'arterial', label: 'Arteries', description: 'Arterial circulation.', color: '#ba4b40' },
  { id: 'venous', label: 'Veins', description: 'Venous circulation.', color: '#527a9a' },
  { id: 'nervous', label: 'Nervous', description: 'Central and peripheral nervous structures.', color: '#cfad63' },
  { id: 'sensory', label: 'Sensory organs', description: 'Special-sense structures represented by the atlas.', color: '#adc4ca' },
  { id: 'respiratory', label: 'Respiratory', description: 'Airway and respiratory structures.', color: '#b17f88' },
  { id: 'digestive', label: 'Digestive', description: 'Digestive tract and accessory structures.', color: '#b08a67' },
  { id: 'urinary', label: 'Urinary', description: 'Kidneys and urinary tract.', color: '#aa735d' },
  { id: 'lymphatic', label: 'Lymphatic', description: 'Lymphatic and lymphoid structures.', color: '#819977' },
  { id: 'endocrine', label: 'Endocrine', description: 'Endocrine structures represented in source.', color: '#bd9994' },
  { id: 'reproductive', label: 'Reproductive', description: 'Adult male reference reproductive structures.', color: '#b59690' },
]

let atlasPromise: Promise<Atlas> | null = null
const chunkCache = new Map<number, Promise<ArrayBuffer>>()

function fetchAtlas() {
  if (atlasPromise) return atlasPromise
  atlasPromise = fetch(MANIFEST_URL, { cache: 'force-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`BodyParts3D manifest unavailable (${response.status}).`)
      return response.json() as Promise<Atlas>
    })
    .catch((error) => {
      atlasPromise = null
      throw error
    })
  return atlasPromise
}

function remoteAsset(path: string) {
  return `${RAW_BASE}${path.replace(/^\/?models\//, '').replace(/^\//, '')}`
}

async function decodeChunk(response: Response, expectedBytes: number, compressed: boolean) {
  if (!response.ok) throw new Error(`Anatomy chunk failed (${response.status}).`)
  const payload = await response.arrayBuffer()
  const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength))
  const gzipPayload = compressed && signature[0] === 0x1f && signature[1] === 0x8b
  const buffer = gzipPayload && typeof DecompressionStream !== 'undefined'
    ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
    : payload
  if (buffer.byteLength !== expectedBytes) throw new Error('Anatomy chunk was incomplete or encoded unexpectedly.')
  return buffer
}

function fetchChunk(atlas: Atlas, index: number) {
  const cached = chunkCache.get(index)
  if (cached) return cached
  const chunk = atlas.chunks[index]
  const useGzip = Boolean(chunk.gzip && typeof DecompressionStream !== 'undefined')
  const path = useGzip ? chunk.gzip! : chunk.url
  const promise = fetch(remoteAsset(path), { cache: 'force-cache' })
    .then((response) => decodeChunk(response, chunk.bytes, useGzip))
    .catch((error) => {
      chunkCache.delete(index)
      throw error
    })
  chunkCache.set(index, promise)
  return promise
}

function geometryFromPart(part: Part, buffer: ArrayBuffer) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buffer, part.positions, part.vertexCount * 3), 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Int16Array(buffer, part.normals, part.vertexCount * 3), 3, true))
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer, part.indices, part.indexCount), 1))
  geometry.boundingBox = new THREE.Box3(new THREE.Vector3().fromArray(part.bounds[0]), new THREE.Vector3().fromArray(part.bounds[1]))
  geometry.computeBoundingSphere()
  return geometry
}

function fitCamera(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  const radius = Math.max(sphere.radius, 0.001)
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2) * 1.18
  camera.near = Math.max(radius / 1200, 0.0001)
  camera.far = Math.max(radius * 30, distance * 12)
  camera.position.set(sphere.center.x + distance * 0.15, sphere.center.y + distance * 0.04, sphere.center.z + distance)
  controls.target.copy(sphere.center)
  controls.minDistance = radius * 0.08
  controls.maxDistance = radius * 15
  camera.updateProjectionMatrix()
  controls.update()
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function pixelRatio(quality: Quality) {
  if (isIOS()) return quality === 'hd' ? 1.45 : 1.05
  return quality === 'hd' ? 1.8 : 1.35
}

function formatMb(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(bytes > 10_000_000 ? 0 : 1)} MB`
}

function StableScene({ atlas, load, quality, onProgress, onError }: {
  atlas: Atlas
  load: LoadMode
  quality: Quality
  onProgress: (value: number) => void
  onError: (message: string) => void
}) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    let resizeObserver: ResizeObserver | null = null
    mount.innerHTML = ''

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x070a0d)
    const camera = new THREE.PerspectiveCamera(32, 1, 0.001, 10000)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch {
      onError('Interactive 3D is unavailable in this browser session.')
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatio(quality)))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02
    renderer.domElement.style.touchAction = 'none'
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.04).texture
    room.dispose()
    pmrem.dispose()
    scene.environment = environment
    scene.add(new THREE.HemisphereLight(0xffffff, 0x17202a, 1.30))
    const key = new THREE.DirectionalLight(0xffffff, 2.25)
    key.position.set(-2, 4, 3)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xcfe1ff, 0.85)
    fill.position.set(3, 2, -2)
    scene.add(fill)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = false
    controls.enablePan = true

    const root = new THREE.Group()
    scene.add(root)
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []

    const render = () => {
      if (!disposed) renderer.render(scene, camera)
    }
    controls.addEventListener('change', render)

    const resize = () => {
      if (disposed) return
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      render()
    }
    resize()
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(mount)
    } else {
      window.addEventListener('resize', resize)
    }

    const system = load.kind === 'system' ? load.system : load.part.system
    const color = SYSTEMS.find((item) => item.id === system)?.color ?? '#b5c0c8'
    const material = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.01,
      roughness: system === 'skeletal' ? 0.62 : 0.48,
      clearcoat: system === 'cardiac' || system === 'muscular' ? 0.04 : 0,
      side: THREE.DoubleSide,
      transparent: system === 'integumentary',
      opacity: system === 'integumentary' ? 0.20 : 1,
      depthWrite: system !== 'integumentary',
    })
    materials.push(material)

    async function build() {
      try {
        onProgress(1)
        if (load.kind === 'part') {
          const buffer = await fetchChunk(atlas, load.part.chunk)
          if (disposed) return
          const geometry = geometryFromPart(load.part, buffer)
          geometries.push(geometry)
          const mesh = new THREE.Mesh(geometry, material)
          mesh.name = load.part.name
          root.add(mesh)
          fitCamera(camera, controls, root)
          onProgress(100)
          render()
          return
        }

        const parts = atlas.parts.filter((part) => part.system === load.system)
        const chunkIndexes = [...new Set(parts.map((part) => part.chunk))]
        const chunks = new Map<number, ArrayBuffer>()
        for (let index = 0; index < chunkIndexes.length; index += 1) {
          const chunkIndex = chunkIndexes[index]
          chunks.set(chunkIndex, await fetchChunk(atlas, chunkIndex))
          if (disposed) return
          onProgress(Math.max(2, Math.round(((index + 1) / chunkIndexes.length) * 72)))
        }
        const partsGeometry = parts.map((part) => geometryFromPart(part, chunks.get(part.chunk)!))
        geometries.push(...partsGeometry)
        const merged = mergeGeometries(partsGeometry, false)
        if (!merged) throw new Error('Could not assemble selected anatomy system.')
        geometries.push(merged)
        const mesh = new THREE.Mesh(merged, material)
        mesh.name = SYSTEMS.find((item) => item.id === load.system)?.label ?? load.system
        root.add(mesh)
        fitCamera(camera, controls, root)
        onProgress(100)
        render()
      } catch (reason) {
        if (!disposed) onError(reason instanceof Error ? reason.message : 'Deep anatomy failed to load.')
      }
    }
    void build()

    const onContextLost = (event: Event) => {
      event.preventDefault()
      if (!disposed) onError('The browser released this WebGL context. Close another heavy 3D view and re-open this structure.')
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      window.removeEventListener('resize', resize)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      controls.removeEventListener('change', render)
      controls.dispose()
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((item) => item.dispose())
      environment.dispose()
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      mount.innerHTML = ''
    }
  }, [atlas, load, onError, onProgress, quality])

  return <div ref={mountRef} className="h-[clamp(420px,66vh,740px)] w-full" aria-label="Stable BodyParts3D source anatomy viewer" />
}

export function StableBodyParts3DDeepAtlas() {
  const [activated, setActivated] = useState(false)
  const [atlas, setAtlas] = useState<Atlas | null>(null)
  const [state, setState] = useState<'idle' | 'manifest' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [system, setSystem] = useState<SystemId>('skeletal')
  const [query, setQuery] = useState('')
  const [load, setLoad] = useState<LoadMode | null>(null)
  const [progress, setProgress] = useState(0)
  const [quality, setQuality] = useState<Quality>('balanced')

  async function activate() {
    setActivated(true)
    if (atlas) return
    setState('manifest')
    setError('')
    try {
      const next = await fetchAtlas()
      setAtlas(next)
      setState('ready')
    } catch (reason) {
      setState('error')
      setError(reason instanceof Error ? reason.message : 'BodyParts3D manifest could not be loaded.')
    }
  }

  const parts = useMemo(() => atlas?.parts.filter((part) => part.system === system) ?? [], [atlas, system])
  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return parts.slice(0, 42)
    return parts.filter((part) => `${part.name} ${part.conceptId}`.toLowerCase().includes(clean)).slice(0, 90)
  }, [parts, query])
  const selectedChunks = useMemo(() => atlas ? [...new Set(parts.map((part) => part.chunk))] : [], [atlas, parts])
  const estimatedBytes = useMemo(() => atlas ? selectedChunks.reduce((sum, index) => sum + (atlas.chunks[index].gzipBytes ?? atlas.chunks[index].bytes), 0) : 0, [atlas, selectedChunks])

  if (!activated) {
    return (
      <section className="rounded-[22px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-4xl">
            <div className="text-[8px] font-medium uppercase tracking-[.13em] text-amber-700 dark:text-amber-300">Deep anatomy · on demand</div>
            <h3 className="mt-1 text-[15px] font-semibold text-neutral-950 dark:text-white">2,234 source meshes · 15 systems · 3,432 named concepts</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              BodyParts3D remains the deep source atlas. It stays unloaded until requested, and once loaded the viewer redraws only during interaction instead of running a permanent animation loop.
            </p>
          </div>
          <button type="button" onClick={() => void activate()} className="shrink-0 rounded-full bg-neutral-950 px-4 py-2.5 text-[10px] font-semibold text-white dark:bg-white dark:text-neutral-950">Load deep anatomy</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[8px] font-medium text-neutral-400">
          <a href={SOURCE_REPO} target="_blank" rel="noreferrer" className="underline">Human Atlas source ↗</a>
          <a href={ATTRIBUTION} target="_blank" rel="noreferrer" className="underline">BodyParts3D attribution · CC BY 4.0 ↗</a>
          <span>Educational reference · not patient-specific anatomy</span>
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <header className="border-b border-neutral-200 p-4 dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[8px] font-medium uppercase tracking-[.13em] text-amber-700 dark:text-amber-300">BodyParts3D source anatomy</div>
            <h3 className="mt-1 text-[15px] font-semibold text-neutral-950 dark:text-white">Deep structure viewer</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Select a single structure for the stable mobile default. Full-system loading remains available when explicitly requested.</p>
          </div>
          <div className="flex items-center gap-2">
            {atlas && <span className="hidden text-[8px] font-medium text-neutral-400 sm:inline">{atlas.parts.length.toLocaleString()} meshes · {atlas.triangles.toLocaleString()} triangles</span>}
            <button type="button" onClick={() => setQuality((value) => value === 'hd' ? 'balanced' : 'hd')} className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold ${quality === 'hd' ? 'border-amber-400 bg-amber-100 text-amber-950 dark:bg-amber-300' : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}>{quality === 'hd' ? 'HD on' : 'HD'}</button>
          </div>
        </div>

        <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {SYSTEMS.map((item) => (
            <button key={item.id} type="button" onClick={() => { setSystem(item.id); setLoad(null); setQuery(''); setError('') }} className={`min-w-[135px] shrink-0 rounded-xl border px-3 py-2.5 text-left ${item.id === system ? 'border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <span className="block text-[10px] font-semibold text-neutral-950 dark:text-white">{item.label}</span>
              <span className="mt-1 line-clamp-2 block text-[8px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.description}</span>
            </button>
          ))}
        </div>
      </header>

      {state === 'manifest' ? (
        <div className="p-9 text-center text-[12px] font-medium text-neutral-500">Loading BodyParts3D manifest…</div>
      ) : state === 'error' ? (
        <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[9px] text-rose-800 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-100">{error}</div>
      ) : atlas ? (
        <div className="grid xl:grid-cols-[305px_minmax(0,1fr)]">
          <aside className="border-b border-neutral-200 p-3 dark:border-white/10 xl:border-b-0 xl:border-r">
            <form onSubmit={(event: FormEvent) => event.preventDefault()}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${SYSTEMS.find((item) => item.id === system)?.label.toLowerCase()}…`} className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-[10px] font-medium outline-none focus:border-amber-400 dark:border-white/10 dark:bg-white/[.03] dark:text-white" />
            </form>
            <div className="mt-2 flex items-center justify-between text-[8px] font-medium text-neutral-400"><span>{parts.length} meshes</span><span>{selectedChunks.length} chunks · ~{formatMb(estimatedBytes)}</span></div>
            {isIOS() && estimatedBytes > 15_000_000 && <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-[8px] leading-relaxed text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">Large full-system load on iPhone. Prefer one named structure below.</div>}
            <button type="button" onClick={() => { setError(''); setProgress(0); setLoad({ kind: 'system', system }) }} className="mt-2.5 w-full rounded-xl border border-neutral-300 bg-neutral-100 px-3 py-2.5 text-[9px] font-semibold text-neutral-800 dark:border-white/10 dark:bg-white/10 dark:text-white">Load entire {SYSTEMS.find((item) => item.id === system)?.label} · ~{formatMb(estimatedBytes)}</button>
            <div className="mt-2.5 max-h-[470px] space-y-1 overflow-y-auto pr-1">
              {filtered.map((part) => (
                <button key={part.id} type="button" onClick={() => { setError(''); setProgress(0); setLoad({ kind: 'part', part }) }} className={`w-full rounded-xl border p-2.5 text-left ${load?.kind === 'part' && load.part.id === part.id ? 'border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
                  <span className="line-clamp-2 block text-[9px] font-semibold text-neutral-900 dark:text-white">{part.name}</span>
                  <span className="mt-1 block truncate text-[7px] text-neutral-400">{part.conceptId} · chunk {part.chunk}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="relative min-h-[450px] bg-[#070a0d]">
            {load ? (
              <StableScene atlas={atlas} load={load} quality={quality} onProgress={setProgress} onError={setError} />
            ) : (
              <div className="grid min-h-[450px] place-items-center p-8 text-center">
                <div>
                  <div className="text-[13px] font-semibold text-white">Choose one named source structure</div>
                  <p className="mt-1 max-w-md text-[9px] leading-relaxed text-white/45">Single-structure loading is the mobile-safe default and keeps anatomy specific rather than stacking an entire body system.</p>
                </div>
              </div>
            )}
            {load && progress < 100 && !error && <div className="absolute inset-x-4 top-4 z-20 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-lg"><div className="h-1.5 rounded-full bg-amber-400 transition-[width]" style={{ width: `${Math.max(2, progress)}%` }} /></div>}
            {error && <div className="absolute inset-x-4 bottom-4 z-30 rounded-xl border border-rose-300/20 bg-black/80 p-3 text-[9px] text-rose-100 backdrop-blur-lg">{error}</div>}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default StableBodyParts3DDeepAtlas
