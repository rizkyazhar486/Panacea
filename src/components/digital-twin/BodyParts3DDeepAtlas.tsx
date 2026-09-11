import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

type SystemId = 'skeletal' | 'muscular' | 'arterial' | 'venous' | 'nervous' | 'digestive' | 'respiratory' | 'urinary' | 'reproductive' | 'lymphatic' | 'endocrine' | 'integumentary' | 'connective' | 'sensory' | 'cardiac'

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
  { id: 'skeletal', label: 'Skeleton', description: 'Bones and supporting skeletal framework.', color: '#e2d9ba' },
  { id: 'muscular', label: 'Muscles', description: 'Skeletal muscles and movement apparatus.', color: '#a85b50' },
  { id: 'connective', label: 'Connective tissue', description: 'Cartilage, ligaments and other connective structures.', color: '#aec3bb' },
  { id: 'integumentary', label: 'Body surface', description: 'External body-surface reference.', color: '#ba9b7d' },
  { id: 'cardiac', label: 'Heart', description: 'Cardiac structures.', color: '#b96760' },
  { id: 'arterial', label: 'Arteries', description: 'Arterial circulation.', color: '#c05245' },
  { id: 'venous', label: 'Veins', description: 'Venous circulation.', color: '#527c9f' },
  { id: 'nervous', label: 'Nervous', description: 'Central and peripheral nervous structures represented by BodyParts3D.', color: '#d8b565' },
  { id: 'sensory', label: 'Sensory organs', description: 'Special-sense structures represented in the source atlas.', color: '#b0c8ce' },
  { id: 'respiratory', label: 'Respiratory', description: 'Airway and respiratory structures.', color: '#b98991' },
  { id: 'digestive', label: 'Digestive', description: 'Digestive tract and accessory structures.', color: '#b8916b' },
  { id: 'urinary', label: 'Urinary', description: 'Kidneys and urinary tract structures.', color: '#b47961' },
  { id: 'lymphatic', label: 'Lymphatic', description: 'Lymphatic and lymphoid structures represented in the source.', color: '#879f7c' },
  { id: 'endocrine', label: 'Endocrine', description: 'Endocrine structures represented in the source.', color: '#c5a09a' },
  { id: 'reproductive', label: 'Reproductive', description: 'Adult male reference reproductive structures.', color: '#bda098' },
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
  const isGzipPayload = compressed && signature[0] === 0x1f && signature[1] === 0x8b
  const canDecompress = typeof DecompressionStream !== 'undefined'
  const buffer = isGzipPayload && canDecompress
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
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2) * 1.12
  camera.near = Math.max(radius / 1200, 0.0001)
  camera.far = Math.max(radius * 30, distance * 12)
  camera.position.set(sphere.center.x + distance * 0.18, sphere.center.y + distance * 0.06, sphere.center.z + distance)
  controls.target.copy(sphere.center)
  controls.minDistance = radius * 0.06
  controls.maxDistance = radius * 18
  camera.updateProjectionMatrix()
  controls.update()
}

function formatMb(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(bytes > 10_000_000 ? 0 : 1)} MB`
}

function DeepScene({ atlas, load, onProgress, onError }: { atlas: Atlas; load: LoadMode; onProgress: (value: number) => void; onError: (message: string) => void }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    let frame = 0
    mount.innerHTML = ''

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x070a0d)
    const camera = new THREE.PerspectiveCamera(32, 1, 0.001, 100)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.25 : 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.04).texture
    room.dispose()
    pmrem.dispose()
    scene.environment = environment
    scene.add(new THREE.HemisphereLight(0xffffff, 0x17202a, 1.35))
    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    key.position.set(-2, 4, 3)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xcfe1ff, 1.4)
    rim.position.set(2, 2, -3)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = true

    const root = new THREE.Group()
    scene.add(root)
    const disposables: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    const system = load.kind === 'system' ? load.system : load.part.system
    const color = SYSTEMS.find((item) => item.id === system)?.color ?? '#b5c0c8'
    const material = new THREE.MeshStandardMaterial({ color, metalness: 0.02, roughness: 0.55, side: THREE.DoubleSide, transparent: system === 'integumentary', opacity: system === 'integumentary' ? 0.22 : 1 })
    materials.push(material)

    async function build() {
      try {
        onProgress(1)
        if (load.kind === 'part') {
          const buffer = await fetchChunk(atlas, load.part.chunk)
          if (disposed) return
          const geometry = geometryFromPart(load.part, buffer)
          disposables.push(geometry)
          const mesh = new THREE.Mesh(geometry, material)
          mesh.name = load.part.name
          root.add(mesh)
          fitCamera(camera, controls, root)
          onProgress(100)
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
        const geometries = parts.map((part) => geometryFromPart(part, chunks.get(part.chunk)!))
        disposables.push(...geometries)
        const merged = mergeGeometries(geometries, false)
        if (!merged) throw new Error('Could not assemble selected anatomy system.')
        disposables.push(merged)
        const mesh = new THREE.Mesh(merged, material)
        mesh.name = SYSTEMS.find((item) => item.id === load.system)?.label ?? load.system
        root.add(mesh)
        fitCamera(camera, controls, root)
        onProgress(100)
      } catch (reason) {
        if (!disposed) onError(reason instanceof Error ? reason.message : 'Deep anatomy failed to load.')
      }
    }
    void build()

    const animate = () => {
      if (disposed) return
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      ro.disconnect()
      controls.dispose()
      disposables.forEach((geometry) => geometry.dispose())
      materials.forEach((item) => item.dispose())
      environment.dispose()
      renderer.dispose()
      mount.innerHTML = ''
    }
  }, [atlas, load, onError, onProgress])

  return <div ref={mountRef} className="h-[clamp(420px,68vh,780px)] w-full" aria-label="BodyParts3D source anatomy viewer" />
}

export function BodyParts3DDeepAtlas() {
  const [activated, setActivated] = useState(false)
  const [atlas, setAtlas] = useState<Atlas | null>(null)
  const [state, setState] = useState<'idle' | 'manifest' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [system, setSystem] = useState<SystemId>('skeletal')
  const [query, setQuery] = useState('')
  const [load, setLoad] = useState<LoadMode | null>(null)
  const [progress, setProgress] = useState(0)

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
    if (!clean) return parts.slice(0, 36)
    return parts.filter((part) => `${part.name} ${part.conceptId}`.toLowerCase().includes(clean)).slice(0, 80)
  }, [parts, query])
  const selectedChunks = useMemo(() => atlas ? [...new Set(parts.map((part) => part.chunk))] : [], [atlas, parts])
  const estimatedBytes = useMemo(() => atlas ? selectedChunks.reduce((sum, index) => sum + (atlas.chunks[index].gzipBytes ?? atlas.chunks[index].bytes), 0) : 0, [atlas, selectedChunks])
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)

  if (!activated) {
    return (
      <section className="rounded-[30px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.17em] text-amber-700 dark:text-amber-300">Deep anatomy · BodyParts3D 4.0 · on demand</div>
            <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">2,234 source meshes · 15 anatomical systems · 3,432 named concepts.</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">This deeper adult-male reference atlas is deliberately not loaded during app launch. Activate it only when you need whole-body skeleton, muscles, connective tissue, vessels, nerves and organ-system source geometry.</p>
          </div>
          <button onClick={() => void activate()} className="shrink-0 rounded-full bg-neutral-950 px-4 py-3 text-[10px] font-black text-white dark:bg-white dark:text-neutral-950">Load deep anatomy</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[8px] font-bold text-neutral-400"><a href={SOURCE_REPO} target="_blank" rel="noreferrer" className="underline">Human Atlas source ↗</a><a href={ATTRIBUTION} target="_blank" rel="noreferrer" className="underline">BodyParts3D attribution · CC BY 4.0 ↗</a><span>Application source: MIT</span><span>Educational reference · not patient anatomy</span></div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <div className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.17em] text-amber-700 dark:text-amber-300">Deep source anatomy</div>
            <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">BodyParts3D 4.0</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Adult male reference anatomy. Geometry is simplified for browser use but source identity is preserved by the upstream atlas. Select one structure for a lighter load, or explicitly load an entire system.</p>
          </div>
          {atlas && <div className="text-[9px] font-black text-neutral-400">{atlas.parts.length.toLocaleString()} meshes · {atlas.concepts.length.toLocaleString()} concepts · {atlas.triangles.toLocaleString()} triangles</div>}
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {SYSTEMS.map((item) => (
            <button key={item.id} onClick={() => { setSystem(item.id); setLoad(null); setQuery('') }} className={`min-w-[150px] shrink-0 rounded-2xl border p-3 text-left ${item.id === system ? 'border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="text-[10px] font-black text-neutral-950 dark:text-white">{item.label}</div>
              <div className="mt-1 line-clamp-2 text-[8px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.description}</div>
            </button>
          ))}
        </div>
      </div>

      {state === 'manifest' ? <div className="p-10 text-center text-sm font-semibold text-neutral-500">Loading BodyParts3D manifest…</div> : state === 'error' ? <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[10px] text-rose-800 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-100">{error}</div> : atlas ? (
        <div className="grid xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="border-b border-neutral-200 p-3 dark:border-white/10 xl:border-b-0 xl:border-r">
            <form onSubmit={(event: FormEvent) => event.preventDefault()}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${SYSTEMS.find((item) => item.id === system)?.label.toLowerCase()}…`} className="h-11 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 text-[10px] font-semibold outline-none focus:border-amber-400 dark:border-white/10 dark:bg-white/[.03] dark:text-white" />
            </form>
            <div className="mt-3 flex items-center justify-between text-[8px] font-black uppercase tracking-wide text-neutral-400"><span>{parts.length} meshes</span><span>{selectedChunks.length} chunks · ~{formatMb(estimatedBytes)}</span></div>
            {isIOS && estimatedBytes > 15_000_000 && <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-[8px] leading-relaxed text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">Large system load on iPhone. Prefer selecting one structure below; full-system loading remains manual.</div>}
            <button onClick={() => { setError(''); setProgress(0); setLoad({ kind: 'system', system }) }} className="mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-3 text-[9px] font-black text-white dark:bg-white dark:text-neutral-950">Load entire {SYSTEMS.find((item) => item.id === system)?.label} · ~{formatMb(estimatedBytes)}</button>
            <div className="mt-3 max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
              {filtered.map((part) => (
                <button key={part.id} onClick={() => { setError(''); setProgress(0); setLoad({ kind: 'part', part }) }} className={`w-full rounded-xl border p-2.5 text-left ${load?.kind === 'part' && load.part.id === part.id ? 'border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
                  <div className="line-clamp-2 text-[9px] font-black text-neutral-900 dark:text-white">{part.name}</div>
                  <div className="mt-1 truncate text-[7px] text-neutral-400">{part.conceptId} · chunk {part.chunk}</div>
                </button>
              ))}
            </div>
          </aside>

          <div className="relative min-h-[460px] bg-[#070a0d]">
            {load ? (
              <DeepScene atlas={atlas} load={load} onProgress={setProgress} onError={setError} />
            ) : (
              <div className="grid min-h-[460px] place-items-center p-8 text-center"><div><div className="text-4xl">🫀</div><div className="mt-3 text-sm font-black text-white">Choose a source structure or load a system.</div><p className="mt-1 max-w-md text-[10px] leading-relaxed text-white/45">Structure loading is the safer default on mobile because it typically requires only one binary chunk.</p></div></div>
            )}
            {load && progress < 100 && !error && <div className="absolute inset-x-4 top-4 z-20 rounded-full border border-white/10 bg-black/55 p-1 backdrop-blur-xl"><div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${Math.max(2, progress)}%` }} /></div>}
            {error && <div className="absolute inset-x-4 bottom-4 z-30 rounded-2xl border border-rose-300/20 bg-black/75 p-3 text-[9px] text-rose-100 backdrop-blur-xl">{error}</div>}
          </div>
        </div>
      ) : null}

      <div className="border-t border-neutral-200 p-3 text-[8px] leading-relaxed text-neutral-400 dark:border-white/10">BodyParts3D © Database Center for Life Science, CC BY 4.0. Upstream adaptation: ashemag/human-atlas (MIT application code). Adult male reference; not every human variation or structure is represented. Panacea loads this layer only on demand.</div>
    </section>
  )
}

export default BodyParts3DDeepAtlas
