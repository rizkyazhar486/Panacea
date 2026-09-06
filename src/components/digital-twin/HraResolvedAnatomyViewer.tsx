import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { resolveHraTerms, type HraResolvedRecord } from '../../lib/hraResolver'

type Props = {
  terms: string[]
  title: string
  description?: string
  maxResults?: number
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function fitCamera(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  const radius = Math.max(sphere.radius, 0.001)
  const fov = THREE.MathUtils.degToRad(camera.fov)
  const distance = radius / Math.sin(fov / 2) * 1.15
  camera.near = Math.max(radius / 1000, 0.0001)
  camera.far = Math.max(distance * 12, radius * 20)
  camera.position.set(sphere.center.x + distance * 0.12, sphere.center.y + distance * 0.05, sphere.center.z + distance)
  camera.updateProjectionMatrix()
  controls.target.copy(sphere.center)
  controls.minDistance = radius * 0.08
  controls.maxDistance = radius * 12
  controls.update()
}

function formatBytes(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} kB`
  return `${(bytes / 1_000_000).toFixed(bytes > 10_000_000 ? 0 : 1)} MB`
}

export function HraResolvedAnatomyViewer({ terms, title, description, maxResults = 12 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const normalizedTerms = useMemo(() => unique(terms).slice(0, 16), [terms])
  const [records, setRecords] = useState<HraResolvedRecord[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const [picked, setPicked] = useState('')

  useEffect(() => {
    let cancelled = false
    setState('loading')
    resolveHraTerms(normalizedTerms, maxResults)
      .then((result) => {
        if (cancelled) return
        setRecords(result)
        const firstRenderable = result.find((record) => record.renderable && record.model)
        setSelectedKey(firstRenderable ? `${firstRenderable.release}|${firstRenderable.model!.name}` : '')
        setState(result.length ? 'ready' : 'empty')
      })
      .catch(() => {
        if (cancelled) return
        setRecords([])
        setSelectedKey('')
        setState('error')
      })
    return () => { cancelled = true }
  }, [normalizedTerms, maxResults])

  const renderable = useMemo(() => records.filter((record) => record.renderable && record.model), [records])
  const selected = useMemo(() => renderable.find((record) => `${record.release}|${record.model!.name}` === selectedKey) ?? renderable[0], [renderable, selectedKey])

  useEffect(() => {
    const mount = mountRef.current
    const model = selected?.model
    if (!mount || !model) return

    let disposed = false
    setPicked('')
    mount.innerHTML = ''

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x070a0d)
    const camera = new THREE.PerspectiveCamera(30, 1, 0.001, 10000)
    camera.position.set(0, 0, 3)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.04
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment
    scene.add(new THREE.HemisphereLight(0xf4f7fb, 0x0c1014, 1.5))
    const key = new THREE.DirectionalLight(0xffffff, 2.5)
    key.position.set(3.5, 5, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xbcdcf5, 1.05)
    fill.position.set(-4, 2, 3)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffe0d0, 0.85)
    rim.position.set(2, 4, -5)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.075
    controls.enablePan = true

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

    const world = new THREE.Group()
    scene.add(world)
    let loadedRoot: THREE.Object3D | null = null

    const loader = new GLTFLoader()
    loader.load(
      model.downloadUrl,
      (gltf) => {
        if (disposed) return
        loadedRoot = gltf.scene
        gltf.scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh) || !object.material) return
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) {
            if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
              material.envMapIntensity = 0.9
              material.metalness = Math.min(material.metalness ?? 0, 0.04)
              material.roughness = Math.max(material.roughness ?? 0.4, 0.26)
            }
          }
        })
        world.add(gltf.scene)
        fitCamera(camera, controls, gltf.scene)
      },
      undefined,
      () => { if (!disposed) setPicked('Source GLB failed to load in this browser session.') },
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
      const hit = raycaster.intersectObject(loadedRoot, true)[0]?.object
      if (hit) setPicked(hit.name || 'Anatomical mesh')
    }
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    let frame = 0
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
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      world.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry?.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((material) => material.dispose())
      })
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      mount.innerHTML = ''
    }
  }, [selected])

  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#090d11]">
      <div className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Resolved HRA source geometry</div>
            <h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{title}</h3>
            {description && <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{description}</p>}
          </div>
          <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[9px] font-black text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">Static source model · no auto-spin · no pulse</div>
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
          <div ref={mountRef} className="min-h-[440px] bg-[#070a0d]" aria-label={`HRA 3D model of ${selected.label}`} />
          <aside className="border-t border-neutral-200 p-4 dark:border-white/10 lg:border-l lg:border-t-0 sm:p-5">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-neutral-400">Source structure</div>
            <div className="mt-1 text-base font-black text-neutral-950 dark:text-white">{selected.label}</div>
            <div className="mt-1 text-[9px] font-semibold text-cyan-700 dark:text-cyan-300">HRA {selected.release}</div>
            <dl className="mt-4 space-y-3 text-[10px]">
              <div><dt className="font-black uppercase tracking-wide text-neutral-400">Ontology</dt><dd className="mt-1 break-all font-semibold text-neutral-700 dark:text-neutral-300">{selected.ontologyId || '—'}</dd></div>
              <div><dt className="font-black uppercase tracking-wide text-neutral-400">GLB</dt><dd className="mt-1 break-all font-semibold text-neutral-700 dark:text-neutral-300">{selected.model.name}</dd></div>
              <div><dt className="font-black uppercase tracking-wide text-neutral-400">Size</dt><dd className="mt-1 font-semibold text-neutral-700 dark:text-neutral-300">{formatBytes(selected.model.size)}</dd></div>
              <div><dt className="font-black uppercase tracking-wide text-neutral-400">GitHub SHA</dt><dd className="mt-1 break-all font-mono text-[9px] text-neutral-500">{selected.model.sha || '—'}</dd></div>
              {picked && <div><dt className="font-black uppercase tracking-wide text-neutral-400">Picked mesh</dt><dd className="mt-1 break-all font-semibold text-neutral-700 dark:text-neutral-300">{picked}</dd></div>}
            </dl>
            <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-neutral-950 px-3 py-2 text-[9px] font-black text-white dark:bg-white dark:text-neutral-950">Open HRA source ↗</a>
            <p className="mt-4 text-[9px] leading-relaxed text-neutral-400">This viewer preserves the upstream GLB geometry and materials. It does not morph anatomy according to a hypothesis, intervention, workout or patient state.</p>
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
