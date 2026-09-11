import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import {
  HRA_LIBRARY,
  HRA_MAPPING_CSV,
  HRA_MODELS_REPOSITORY,
  HRA_PRESETS,
  fetchHraRepositoryFiles,
  fetchHraStructureIndex,
  rawHraModelUrl,
  searchHraStructures,
  type HraPresetKey,
  type HraRepositoryFile,
  type HraSex,
  type HraStructureRecord,
} from '../../lib/hraRepository'

type LayerState = 'idle' | 'loading' | 'ready' | 'error'
type SelectedStructure = {
  name: string
  file: string
  ontologyId?: string
  representationOf?: string
}

const loader = new GLTFLoader()
const modelCache = new Map<string, Promise<THREE.Group>>()

function loadModel(fileName: string, url: string) {
  const existing = modelCache.get(fileName)
  if (existing) return existing
  const promise = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject)
  })
  modelCache.set(fileName, promise)
  return promise
}

function cleanName(value: string) {
  return value
    .replace(/^VH_[MF]_?/i, '')
    .replace(/^Allen_[MF]_?/i, '')
    .replace(/^NIH_[MF]_?/i, '')
    .replace(/^SBU_[MF]_?/i, '')
    .replace(/_[LR]$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .trim()
}

function cloneForDisplay(base: THREE.Group, fileName: string) {
  const group = base.clone(true)
  group.name = fileName
  group.userData.hraFile = fileName
  const skin = /_Skin\.glb$/i.test(fileName)

  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.material) return
    object.castShadow = false
    object.receiveShadow = false
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
        material.envMapIntensity = 0.85
        material.metalness = Math.min(material.metalness ?? 0, 0.04)
        material.roughness = Math.max(material.roughness ?? 0.42, 0.28)
      }
      if (skin) {
        material.transparent = true
        material.opacity = 0.14
        material.depthWrite = false
        material.side = THREE.DoubleSide
      }
    }
  })
  return group
}

function formatBytes(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} kB`
  return `${(bytes / 1_000_000).toFixed(bytes > 10_000_000 ? 0 : 1)} MB`
}

function modelLabel(fileName: string) {
  return cleanName(fileName.replace(/\.glb$/i, ''))
}

export function HraClinicalAtlas() {
  const mountRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<THREE.Group | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const groupsRef = useRef<Record<string, THREE.Group>>({})
  const activeFilesRef = useRef<Set<string>>(new Set(HRA_PRESETS[0].files.male))
  const pendingRef = useRef<Map<string, Promise<void>>>(new Map())
  const radiusRef = useRef(1)

  const [sex, setSex] = useState<HraSex>('male')
  const [preset, setPreset] = useState<HraPresetKey>('overview')
  const [activeFiles, setActiveFiles] = useState<Set<string>>(() => new Set(HRA_PRESETS[0].files.male))
  const [status, setStatus] = useState<Record<string, LayerState>>({})
  const [selected, setSelected] = useState<SelectedStructure | null>(null)
  const [catalog, setCatalog] = useState<HraRepositoryFile[]>([])
  const [structureCount, setStructureCount] = useState(0)
  const [sourceState, setSourceState] = useState<'loading' | 'ready' | 'partial' | 'error'>('loading')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<HraStructureRecord[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const currentPreset = useMemo(() => HRA_PRESETS.find((item) => item.key === preset) ?? HRA_PRESETS[0], [preset])
  const layerFiles = useMemo(() => {
    const names = new Set([...currentPreset.files[sex], ...activeFiles])
    return [...names]
  }, [currentPreset, sex, activeFiles])
  const catalogByName = useMemo(() => new Map(catalog.map((item) => [item.name, item])), [catalog])

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([fetchHraRepositoryFiles(), fetchHraStructureIndex()]).then(([files, structures]) => {
      if (cancelled) return
      if (files.status === 'fulfilled') setCatalog(files.value)
      if (structures.status === 'fulfilled') setStructureCount(structures.value.length)
      if (files.status === 'fulfilled' && structures.status === 'fulfilled') setSourceState('ready')
      else if (files.status === 'fulfilled' || structures.status === 'fulfilled') setSourceState('partial')
      else setSourceState('error')
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    activeFilesRef.current = activeFiles
  }, [activeFiles])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x070a0d)

    const camera = new THREE.PerspectiveCamera(30, 1, 0.001, 10000)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.04
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment

    const hemi = new THREE.HemisphereLight(0xf3f7fb, 0x101317, 1.45)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 2.7)
    key.position.set(3.5, 5.5, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xb8d8f2, 1.15)
    fill.position.set(-4, 2, 3)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffdfcf, 1.0)
    rim.position.set(2, 4, -5)
    scene.add(rim)

    const world = new THREE.Group()
    world.name = 'HuBMAP HRA common coordinate framework'
    scene.add(world)
    worldRef.current = world

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.075
    controls.enablePan = true
    controls.minDistance = 0.001
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
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointerUp = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const roots = Object.entries(groupsRef.current)
        .filter(([fileName]) => activeFilesRef.current.has(fileName))
        .map(([, group]) => group)
      const hit = raycaster.intersectObjects(roots, true)[0]?.object
      if (!hit) return
      let parent: THREE.Object3D | null = hit
      let file = ''
      while (parent) {
        if (typeof parent.userData.hraFile === 'string') {
          file = parent.userData.hraFile
          break
        }
        parent = parent.parent
      }
      setSelected({ name: cleanName(hit.name || parent?.name || 'Anatomical structure'), file })
    }
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    camera.position.set(0, 0, 3)
    controls.target.set(0, 0, 0)
    controls.update()

    let frame = 0
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
      worldRef.current = null
      cameraRef.current = null
      controlsRef.current = null
      groupsRef.current = {}
      pendingRef.current.clear()
    }
  }, [])

  function fitVisible() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    const box = new THREE.Box3()
    let found = false
    for (const [fileName, group] of Object.entries(groupsRef.current)) {
      if (!activeFilesRef.current.has(fileName) || !group.visible) continue
      const childBox = new THREE.Box3().setFromObject(group)
      if (childBox.isEmpty()) continue
      box.union(childBox)
      found = true
    }
    if (!found || box.isEmpty()) return

    const sphere = box.getBoundingSphere(new THREE.Sphere())
    if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return
    radiusRef.current = sphere.radius
    controls.target.copy(sphere.center)
    camera.near = Math.max(sphere.radius / 700, 0.0005)
    camera.far = Math.max(sphere.radius * 30, 10)
    camera.position.set(sphere.center.x, sphere.center.y + sphere.radius * 0.035, sphere.center.z + sphere.radius * 2.75)
    camera.updateProjectionMatrix()
    controls.update()
  }

  useEffect(() => {
    const world = worldRef.current
    if (!world) return
    let cancelled = false

    for (const [fileName, group] of Object.entries(groupsRef.current)) {
      group.visible = activeFiles.has(fileName)
    }

    const tasks = [...activeFiles].map((fileName) => {
      const existing = groupsRef.current[fileName]
      if (existing) {
        existing.visible = true
        return Promise.resolve()
      }
      const pending = pendingRef.current.get(fileName)
      if (pending) return pending

      setStatus((current) => ({ ...current, [fileName]: 'loading' }))
      const sourceFile = catalogByName.get(fileName)
      const task = loadModel(fileName, sourceFile?.downloadUrl || rawHraModelUrl(fileName))
        .then((base) => {
          const currentWorld = worldRef.current
          if (!currentWorld) return
          const group = cloneForDisplay(base, fileName)
          group.visible = activeFilesRef.current.has(fileName)
          currentWorld.add(group)
          groupsRef.current[fileName] = group
          setStatus((current) => ({ ...current, [fileName]: 'ready' }))
        })
        .catch(() => {
          modelCache.delete(fileName)
          setStatus((current) => ({ ...current, [fileName]: 'error' }))
        })
        .finally(() => pendingRef.current.delete(fileName))
      pendingRef.current.set(fileName, task)
      return task
    })

    void Promise.allSettled(tasks).then(() => {
      if (!cancelled) window.requestAnimationFrame(fitVisible)
    })
    return () => { cancelled = true }
  }, [activeFiles, catalogByName])

  function choosePreset(next: HraPresetKey) {
    const nextPreset = HRA_PRESETS.find((item) => item.key === next) ?? HRA_PRESETS[0]
    setPreset(next)
    setActiveFiles(new Set(nextPreset.files[sex]))
    setSelected(null)
  }

  function chooseSex(next: HraSex) {
    setSex(next)
    setActiveFiles(new Set(currentPreset.files[next]))
    setSelected(null)
  }

  function toggleFile(fileName: string) {
    setActiveFiles((current) => {
      const next = new Set(current)
      if (next.has(fileName)) next.delete(fileName)
      else next.add(fileName)
      return next
    })
  }

  function view(direction: 'front' | 'back' | 'left' | 'right') {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const radius = Math.max(radiusRef.current, 0.001) * 2.75
    const target = controls.target
    if (direction === 'front') camera.position.set(target.x, target.y, target.z + radius)
    if (direction === 'back') camera.position.set(target.x, target.y, target.z - radius)
    if (direction === 'left') camera.position.set(target.x - radius, target.y, target.z)
    if (direction === 'right') camera.position.set(target.x + radius, target.y, target.z)
    camera.lookAt(target)
    controls.update()
  }

  async function submitSearch(event: FormEvent) {
    event.preventDefault()
    const clean = query.trim()
    if (!clean) return
    setSearching(true)
    setSearchError('')
    try {
      setResults(await searchHraStructures(clean, 60))
    } catch (error) {
      setResults([])
      setSearchError(error instanceof Error ? error.message : 'HRA structure search failed.')
    } finally {
      setSearching(false)
    }
  }

  function inspectRecord(record: HraStructureRecord, add = false) {
    setActiveFiles((current) => add ? new Set([...current, record.model.name]) : new Set([record.model.name]))
    setSelected({
      name: record.label,
      file: record.model.name,
      ontologyId: record.ontologyId,
      representationOf: record.representationOf,
    })
  }

  const selectedFile = selected ? catalogByName.get(selected.file) : undefined

  return (
    <section className="overflow-hidden rounded-[30px] border border-neutral-200 bg-[#070a0d] text-white shadow-[0_28px_90px_rgba(0,0,0,.24)] dark:border-white/10">
      <header className="border-b border-white/10 bg-[#0b0f13] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-300">HuBMAP Human Reference Atlas · source-backed 3D</div>
            <h2 className="mt-1 text-[20px] font-black tracking-[-.035em] sm:text-[28px]">Clinical anatomy viewer built from the HRA repository</h2>
            <p className="mt-2 max-w-3xl text-[10px] leading-relaxed text-white/55">The viewer loads the original HRA GLB objects from GitHub, indexes the published ASCT+B → 3D mapping CSV, and keeps source file and ontology identity visible. It does not replace source anatomy with procedural spheres or decorative organs.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[8px] font-black uppercase tracking-[.11em]">
            <span className={`rounded-full border px-2.5 py-1.5 ${sourceState === 'ready' ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : sourceState === 'error' ? 'border-rose-300/25 bg-rose-300/10 text-rose-200' : 'border-amber-300/25 bg-amber-300/10 text-amber-200'}`}>{sourceState === 'ready' ? 'Repository API ready' : sourceState === 'error' ? 'Repository API unavailable' : 'Loading repository API'}</span>
            <span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1.5 text-white/55">{catalog.length || '—'} GLB files</span>
            <span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1.5 text-white/55">{structureCount || '—'} mapped structures</span>
          </div>
        </div>

        <form onSubmit={submitSearch} className="mt-4 flex max-w-3xl gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search HRA structure: mitral valve, meniscus, femur, retina, kidney cortex…" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[.055] px-3.5 py-3 text-[11px] font-semibold text-white outline-none placeholder:text-white/28 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/10" aria-label="Search HRA mapped anatomy" />
          <button disabled={searching || !query.trim()} className="rounded-2xl bg-white px-4 py-3 text-[10px] font-black text-neutral-950 disabled:opacity-40">{searching ? 'Searching HRA…' : 'Search atlas'}</button>
        </form>
        {searchError && <div className="mt-2 max-w-3xl rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-[9px] font-semibold text-rose-100">{searchError}</div>}

        <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {HRA_PRESETS.map((item) => <button key={item.key} type="button" onClick={() => choosePreset(item.key)} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black transition ${preset === item.key ? 'border-cyan-300/40 bg-cyan-300/12 text-cyan-100' : 'border-white/10 bg-white/[.035] text-white/55 hover:bg-white/[.07] hover:text-white'}`}>{item.label}</button>)}
          <span className="mx-1 h-7 w-px shrink-0 self-center bg-white/10" />
          {(['male', 'female'] as HraSex[]).map((item) => <button key={item} type="button" onClick={() => chooseSex(item)} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black capitalize ${sex === item ? 'border-white bg-white text-neutral-950' : 'border-white/10 text-white/45'}`}>{item} reference</button>)}
        </div>
      </header>

      {results.length > 0 && (
        <div className="border-b border-white/10 bg-[#0a0e12] px-4 py-3 sm:px-5">
          <div className="mb-2 flex items-center justify-between gap-3"><div className="text-[9px] font-black uppercase tracking-[.14em] text-white/35">HRA mapping results · {results.length}</div><button onClick={() => setResults([])} className="text-[9px] font-black text-white/40 hover:text-white">Clear</button></div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {results.map((record, index) => (
              <article key={`${record.ontologyId}-${record.model.name}-${index}`} className="w-[250px] shrink-0 rounded-[18px] border border-white/[.08] bg-white/[.035] p-3">
                <div className="text-[10px] font-black leading-snug text-white/90">{record.label}</div>
                <div className="mt-1 font-mono text-[8px] text-cyan-200/70">{record.ontologyId || 'No ontology ID in mapping row'}</div>
                <div className="mt-2 truncate text-[8px] font-semibold text-white/32">{record.model.name}</div>
                <div className="mt-2 flex gap-1.5"><button type="button" onClick={() => inspectRecord(record)} className="rounded-full bg-white px-2.5 py-1.5 text-[8px] font-black text-neutral-950">Inspect 3D</button><button type="button" onClick={() => inspectRecord(record, true)} className="rounded-full border border-white/10 px-2.5 py-1.5 text-[8px] font-black text-white/60">Add layer</button></div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="grid xl:grid-cols-[235px_minmax(0,1fr)_270px]">
        <aside className="order-2 border-t border-white/10 bg-[#0a0e12] p-3 xl:order-1 xl:border-r xl:border-t-0">
          <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/35">Reference objects</div>
          <p className="mt-1 text-[9px] leading-relaxed text-white/30">{currentPreset.detail}</p>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto xl:block xl:space-y-1.5 xl:overflow-visible">
            {layerFiles.map((fileName) => {
              const on = activeFiles.has(fileName)
              const itemState = status[fileName] ?? 'idle'
              const file = catalogByName.get(fileName)
              return (
                <button key={fileName} type="button" onClick={() => toggleFile(fileName)} className={`w-[190px] shrink-0 rounded-[18px] border p-3 text-left transition xl:w-full ${on ? 'border-cyan-300/25 bg-cyan-300/[.07]' : 'border-white/[.07] bg-white/[.02]'}`}>
                  <div className="flex items-start justify-between gap-2"><span className="text-[10px] font-black text-white/85">{modelLabel(fileName)}</span><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${itemState === 'error' ? 'bg-rose-400' : itemState === 'loading' ? 'animate-pulse bg-amber-300' : on ? 'bg-cyan-300' : 'bg-white/20'}`} /></div>
                  <div className="mt-1 truncate font-mono text-[7px] text-white/28">{fileName}</div>
                  <div className="mt-1 text-[8px] font-bold text-white/25">{file ? formatBytes(file.size) : 'Repository metadata loading'}</div>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="order-1 relative min-h-[560px] bg-black xl:order-2 xl:min-h-[720px]">
          <div ref={mountRef} className="absolute inset-0" aria-label="Interactive HuBMAP HRA 3D anatomy viewer" role="application" />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
            <div className="rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-[8px] font-black uppercase tracking-[.12em] text-white/55 backdrop-blur-xl">Drag rotate · wheel/pinch zoom · tap structure</div>
            <div className="rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-[8px] font-black text-white/45 backdrop-blur-xl">Original HRA GLB materials</div>
          </div>
          <div className="absolute inset-x-3 bottom-3 flex justify-center">
            <div className="flex flex-wrap justify-center gap-1 rounded-full border border-white/10 bg-black/60 p-1.5 backdrop-blur-xl">
              {(['front', 'back', 'left', 'right'] as const).map((direction) => <button key={direction} onClick={() => view(direction)} className="rounded-full px-3 py-2 text-[9px] font-black capitalize text-white/65 hover:bg-white/10 hover:text-white">{direction}</button>)}
              <span className="mx-1 h-7 w-px self-center bg-white/10" />
              <button onClick={fitVisible} className="rounded-full px-3 py-2 text-[9px] font-black text-cyan-200 hover:bg-cyan-300/10">Fit active anatomy</button>
            </div>
          </div>
        </div>

        <aside className="order-3 border-t border-white/10 bg-[#0a0e12] p-4 xl:border-l xl:border-t-0">
          <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/35">Inspection</div>
          {selected ? (
            <div className="mt-3">
              <div className="text-[18px] font-black leading-tight tracking-[-.025em] text-white">{selected.name}</div>
              {selected.ontologyId && <div className="mt-2 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/[.07] px-2.5 py-1 font-mono text-[8px] text-cyan-200">{selected.ontologyId}</div>}
              <div className="mt-4 rounded-[18px] border border-white/[.08] bg-white/[.025] p-3">
                <div className="text-[8px] font-black uppercase tracking-[.12em] text-white/30">Source GLB</div>
                <div className="mt-1 break-all font-mono text-[9px] leading-relaxed text-white/65">{selected.file || 'Selected mesh inside HRA object'}</div>
                {selectedFile && <div className="mt-1 text-[8px] text-white/30">{formatBytes(selectedFile.size)} · SHA {selectedFile.sha.slice(0, 10)}</div>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedFile && <a href={selectedFile.htmlUrl} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-2 text-[9px] font-black text-neutral-950">Source file ↗</a>}
                {selected.representationOf?.startsWith('http') && <a href={selected.representationOf} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black text-white/65">Ontology ↗</a>}
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-[20px] border border-dashed border-white/12 bg-white/[.02] p-4 text-[10px] leading-relaxed text-white/38">Tap a rendered structure or search the HRA mapping above. The selected mesh keeps its originating GLB file visible.</div>
          )}

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/35">Provenance</div>
            <div className="mt-2 space-y-2 text-[9px] leading-relaxed text-white/42">
              <p><b className="text-white/65">Geometry:</b> HuBMAP HRA / CCF release v1.2 GLB repository.</p>
              <p><b className="text-white/65">Structure index:</b> published ASCT+B 3D Models Mapping CSV.</p>
              <p><b className="text-white/65">Viewer:</b> Three.js only displays and selects source geometry; it does not invent anatomy.</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={HRA_LIBRARY} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-2 text-[8px] font-black text-white/55">HRA library ↗</a>
              <a href={HRA_MODELS_REPOSITORY} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-2 text-[8px] font-black text-white/55">GitHub models ↗</a>
              <a href={HRA_MAPPING_CSV} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-2 text-[8px] font-black text-white/55">Mapping CSV ↗</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
