import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { resolveHraTerms, type HraResolvedRecord } from '../../lib/hraResolver'

type Props = {
  terms: string[]
  title: string
  description?: string
  maxResults?: number
}

type ViewApi = {
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  root: THREE.Object3D
  render: () => void
  focus: (term: string) => boolean
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function normalizeLookup(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function boundingSphere(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return null
  return box.getBoundingSphere(new THREE.Sphere())
}

function fitCamera(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D, padding = 1.15) {
  const sphere = boundingSphere(object)
  if (!sphere) return
  const radius = Math.max(sphere.radius, 0.001)
  const fov = THREE.MathUtils.degToRad(camera.fov)
  const distance = radius / Math.sin(fov / 2) * padding
  camera.near = Math.max(radius / 1000, 0.0001)
  camera.far = Math.max(distance * 16, radius * 24)
  camera.position.set(sphere.center.x + distance * 0.12, sphere.center.y + distance * 0.05, sphere.center.z + distance)
  camera.updateProjectionMatrix()
  controls.target.copy(sphere.center)
  controls.minDistance = Math.max(radius * 0.06, 0.0001)
  controls.maxDistance = Math.max(radius * 20, distance * 8)
  controls.update()
}

function formatBytes(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} kB`
  return `${(bytes / 1_000_000).toFixed(bytes > 10_000_000 ? 0 : 1)} MB`
}

function rendererPixelRatio() {
  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  return Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.65)
}

function meshLabel(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object
  while (current) {
    const label = current.name?.trim()
    if (label && !/^mesh(_|\d|$)/i.test(label)) return label
    current = current.parent
  }
  return object.name || 'Anatomical mesh'
}

function bestMeshForTerm(root: THREE.Object3D, term: string) {
  const wanted = normalizeLookup(term)
  if (!wanted) return null
  const wantedTokens = wanted.split(' ').filter((token) => token.length > 2)
  const candidates: Array<{ mesh: THREE.Mesh; score: number }> = []

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const haystack = normalizeLookup(`${object.name} ${object.parent?.name || ''}`)
    if (!haystack) return
    let score = 0
    if (haystack === wanted) score += 100
    if (haystack.includes(wanted)) score += 60
    for (const token of wantedTokens) if (haystack.includes(token)) score += 8
    if (score > 0) candidates.push({ mesh: object, score })
  })

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]?.mesh ?? null
}

export function HraResolvedAnatomyViewer({ terms, title, description, maxResults = 12 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const viewApiRef = useRef<ViewApi | null>(null)
  const termsKey = terms.map((value) => value.trim()).filter(Boolean).join('\u001f')
  const normalizedTerms = useMemo(() => unique(termsKey.split('\u001f')).slice(0, 16), [termsKey])
  const [records, setRecords] = useState<HraResolvedRecord[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const [picked, setPicked] = useState('')
  const [viewerError, setViewerError] = useState('')

  useEffect(() => {
    let cancelled = false
    setState('loading')
    resolveHraTerms(normalizedTerms, maxResults)
      .then((result) => {
        if (cancelled) return
        setRecords(result)
        const firstRenderable = result.find((record) => record.renderable && record.model)
        setSelectedKey((current) => {
          if (current && result.some((record) => record.renderable && record.model && `${record.release}|${record.model.name}` === current)) return current
          return firstRenderable ? `${firstRenderable.release}|${firstRenderable.model!.name}` : ''
        })
        setState(result.length ? 'ready' : 'empty')
      })
      .catch(() => {
        if (cancelled) return
        setRecords([])
        setSelectedKey('')
        setState('error')
      })
    return () => { cancelled = true }
  }, [termsKey, maxResults])

  const renderable = useMemo(() => records.filter((record) => record.renderable && record.model), [records])
  const selected = useMemo(
    () => renderable.find((record) => `${record.release}|${record.model!.name}` === selectedKey) ?? renderable[0],
    [renderable, selectedKey],
  )
  const selectedModelUrl = selected?.model?.downloadUrl ?? ''
  const focusTerm = normalizedTerms[0] ?? ''

  useEffect(() => {
    const api = viewApiRef.current
    if (!api || !focusTerm) return
    api.focus(focusTerm)
  }, [focusTerm])

  useEffect(() => {
    const mount = mountRef.current
    const model = selected?.model
    if (!mount || !model || !selectedModelUrl) return

    let disposed = false
    let observer: ResizeObserver | null = null
    let loadedRoot: THREE.Object3D | null = null
    let pickedHelper: THREE.BoxHelper | null = null
    setPicked('')
    setViewerError('')
    mount.innerHTML = ''
    viewApiRef.current = null

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x070a0d)
    const camera = new THREE.PerspectiveCamera(30, 1, 0.001, 10000)
    camera.position.set(0, 0, 3)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch {
      setViewerError('Interactive 3D is unavailable in this browser session. Source anatomy metadata remains available.')
      return () => { mount.innerHTML = '' }
    }

    renderer.setPixelRatio(rendererPixelRatio())
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02
    renderer.domElement.style.touchAction = 'none'
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.04).texture
    room.dispose()
    scene.environment = environment
    scene.add(new THREE.HemisphereLight(0xf4f7fb, 0x0c1014, 1.45))
    const key = new THREE.DirectionalLight(0xffffff, 2.35)
    key.position.set(3.5, 5, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xbcdcf5, 0.95)
    fill.position.set(-4, 2, 3)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffe0d0, 0.75)
    rim.position.set(2, 4, -5)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = false
    controls.enablePan = true

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
      observer = new ResizeObserver(resize)
      observer.observe(mount)
    } else {
      window.addEventListener('resize', resize)
    }

    const world = new THREE.Group()
    world.name = 'HRA source anatomy'
    scene.add(world)

    const clearHelper = () => {
      if (!pickedHelper) return
      scene.remove(pickedHelper)
      pickedHelper.geometry.dispose()
      ;(pickedHelper.material as THREE.Material).dispose()
      pickedHelper = null
    }

    const inspectMesh = (mesh: THREE.Object3D, refocus: boolean) => {
      clearHelper()
      pickedHelper = new THREE.BoxHelper(mesh, 0x62ddff)
      pickedHelper.renderOrder = 50
      scene.add(pickedHelper)
      setPicked(meshLabel(mesh))
      if (refocus) fitCamera(camera, controls, mesh, 1.8)
      render()
    }

    const focus = (term: string) => {
      if (!loadedRoot) return false
      const mesh = bestMeshForTerm(loadedRoot, term)
      if (!mesh) return false
      inspectMesh(mesh, true)
      return true
    }

    const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      selectedModelUrl,
      (gltf) => {
        if (disposed) return
        loadedRoot = gltf.scene
        gltf.scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh) || !object.material) return
          object.frustumCulled = true
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) {
            if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
              material.envMapIntensity = 0.85
              material.metalness = Math.min(material.metalness ?? 0, 0.035)
              material.roughness = Math.max(material.roughness ?? 0.4, 0.28)
            }
          }
        })
        world.add(gltf.scene)
        fitCamera(camera, controls, gltf.scene)
        viewApiRef.current = { camera, controls, root: gltf.scene, render, focus }
        if (focusTerm) focus(focusTerm)
        render()
      },
      undefined,
      () => {
        if (!disposed) {
          setViewerError('Source GLB failed to load in this browser session. Try another source model or reload this atlas view.')
          render()
        }
      },
    )

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointerUp = (event: PointerEvent) => {
      if (!loadedRoot) return
      const rect = renderer.domElement.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(loadedRoot, true).find((item) => item.object instanceof THREE.Mesh)?.object
      if (hit) inspectMesh(hit, false)
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      if (!disposed) setViewerError('WebGL context was released by the browser. Close another 3D view or reload this atlas view.')
    }

    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)

    return () => {
      disposed = true
      viewApiRef.current = null
      observer?.disconnect()
      window.removeEventListener('resize', resize)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      controls.removeEventListener('change', render)
      controls.dispose()
      clearHelper()
      world.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry?.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((material) => material.dispose())
      })
      environment.dispose()
      pmrem.dispose()
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      mount.innerHTML = ''
    }
  // Rebuild WebGL only when the actual GLB changes. A cornea→iris→lens selection
  // within the same eye source focuses a mesh instead of reparsing the whole organ.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModelUrl])

  function orient(view: 'front' | 'side' | 'back' | 'reset') {
    const api = viewApiRef.current
    if (!api) return
    if (view === 'reset') {
      setPicked('')
      fitCamera(api.camera, api.controls, api.root)
      api.render()
      return
    }
    const sphere = boundingSphere(api.root)
    if (!sphere) return
    const radius = Math.max(sphere.radius, 0.001)
    const fov = THREE.MathUtils.degToRad(api.camera.fov)
    const distance = radius / Math.sin(fov / 2) * 1.15
    const direction = view === 'front'
      ? new THREE.Vector3(0, 0, 1)
      : view === 'back'
        ? new THREE.Vector3(0, 0, -1)
        : new THREE.Vector3(1, 0, 0)
    api.controls.target.copy(sphere.center)
    api.camera.position.copy(sphere.center).addScaledVector(direction, distance)
    api.camera.lookAt(sphere.center)
    api.controls.update()
    api.render()
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <div className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Resolved HRA source geometry</div>
            <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{title}</h3>
            {description && <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{description}</p>}
          </div>
          <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[9px] font-black text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">One GLB · submesh focus · redraw on interaction</div>
        </div>

        {renderable.length > 1 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {renderable.map((record) => {
              const key = `${record.release}|${record.model!.name}`
              return (
                <button key={key} onClick={() => setSelectedKey(key)} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black ${key === `${selected?.release}|${selected?.model?.name}` ? 'border-cyan-500 bg-cyan-50 text-cyan-900 dark:bg-cyan-300/10 dark:text-cyan-100' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'}`}>
                  {record.label} · {record.release}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selected?.model ? (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="relative min-h-[440px] bg-[#070a0d]">
            <div ref={mountRef} className="absolute inset-0" aria-label={`HRA 3D model of ${selected.label}`} />
            <div className="pointer-events-none absolute left-3 top-3 rounded-xl bg-black/45 px-2.5 py-2 text-[9px] font-semibold text-white/80 backdrop-blur">Drag rotate · pinch/scroll zoom · tap structure inspect</div>
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 sm:right-auto">
              {(['front', 'side', 'back', 'reset'] as const).map((view) => (
                <button key={view} type="button" onClick={() => orient(view)} className="rounded-full border border-white/15 bg-black/55 px-3 py-2 text-[9px] font-bold capitalize text-white backdrop-blur hover:bg-black/70">{view}</button>
              ))}
            </div>
            {viewerError && (
              <div className="absolute inset-0 grid place-items-center bg-[#070a0d] p-6 text-center">
                <div>
                  <div className="text-sm font-black text-white">3D renderer unavailable</div>
                  <p className="mt-2 max-w-md text-[10px] leading-relaxed text-white/55">{viewerError}</p>
                </div>
              </div>
            )}
          </div>
          <aside className="border-t border-neutral-200 p-4 dark:border-white/10 lg:border-l lg:border-t-0 sm:p-5">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-neutral-400">Source structure</div>
            <div className="mt-1 text-base font-black text-neutral-950 dark:text-white">{selected.label}</div>
            <div className="mt-1 text-[9px] font-semibold text-cyan-700 dark:text-cyan-300">HRA {selected.release}</div>
            <dl className="mt-4 space-y-3 text-[10px]">
              <div><dt className="font-black uppercase tracking-wide text-neutral-400">Ontology</dt><dd className="mt-1 break-all font-semibold text-neutral-700 dark:text-neutral-300">{selected.ontologyId || '—'}</dd></div>
              <div><dt className="font-black uppercase tracking-wide text-neutral-400">GLB</dt><dd className="mt-1 break-all font-semibold text-neutral-700 dark:text-neutral-300">{selected.model.name}</dd></div>
              <div><dt className="font-black uppercase tracking-wide text-neutral-400">Size</dt><dd className="mt-1 font-semibold text-neutral-700 dark:text-neutral-300">{formatBytes(selected.model.size)}</dd></div>
              <div><dt className="font-black uppercase tracking-wide text-neutral-400">GitHub SHA</dt><dd className="mt-1 break-all font-mono text-[9px] text-neutral-500">{selected.model.sha || '—'}</dd></div>
              {picked && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-2.5 dark:border-cyan-300/20 dark:bg-cyan-300/10"><dt className="font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Inspected mesh</dt><dd className="mt-1 break-all font-semibold text-neutral-800 dark:text-neutral-100">{picked}</dd></div>}
            </dl>
            <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-neutral-950 px-3 py-2 text-[9px] font-black text-white dark:bg-white dark:text-neutral-950">Open HRA source ↗</a>
            <p className="mt-4 text-[9px] leading-relaxed text-neutral-400">This viewer preserves upstream HRA geometry. Structure changes within the same organ focus matching source meshes without reloading the whole GLB. Panacea does not invent patient-specific anatomy.</p>
          </aside>
        </div>
      ) : (
        <div className="grid min-h-[260px] place-items-center p-6 text-center">
          <div>
            <div className="text-sm font-black text-neutral-800 dark:text-white">{state === 'loading' ? 'Resolving HRA geometry…' : 'No browser-loadable HRA GLB resolved'}</div>
            <p className="mt-2 max-w-lg text-[10px] leading-relaxed text-neutral-500">{state === 'error' ? 'The source index request failed.' : 'Panacea keeps mapping-only results as metadata instead of rendering substitute anatomy.'}</p>
          </div>
        </div>
      )}
    </section>
  )
}
