import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { normalizeAnatomySourceName } from '../lib/anatomySourceNodeRegistry'
import {
  BODY_SYSTEM_SOURCE_WAVE,
  resolveBodySystemSourceWave,
  type BodySystemId,
} from '../lib/bodySystemSourceWave'
import { body3dPixelRatio } from '../lib/body3dQuality'

function materialFor(source: THREE.Material) {
  const cloned = source.clone()
  if ((cloned as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
    const standard = cloned as THREE.MeshStandardMaterial
    standard.transparent = true
    standard.opacity = 0.9
    standard.depthWrite = false
    standard.emissive.set(0x083c35)
    standard.emissiveIntensity = 0.34
    return standard
  }
  return cloned
}

export default function BodyAllSystems3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const openTimerRef = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [rendererArmed, setRendererArmed] = useState(false)
  const [systemId, setSystemId] = useState<BodySystemId>('cardiovascular')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadedFiles, setLoadedFiles] = useState(0)
  const [loadedSourceFiles, setLoadedSourceFiles] = useState<string[]>([])
  const [failedFiles, setFailedFiles] = useState<string[]>([])

  const systems = useMemo(() => resolveBodySystemSourceWave(), [])
  const selected = systems.find((system) => system.id === systemId) ?? systems[0]

  useEffect(() => () => {
    if (openTimerRef.current !== null) window.clearTimeout(openTimerRef.current)
  }, [])

  const toggleOpen = () => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (open) {
      setRendererArmed(false)
      setOpen(false)
      return
    }

    // Commit the lightweight disclosure interaction first, then start Three.js
    // in a separate browser task. On constrained mobile/SwiftShader runners,
    // constructing a WebGLRenderer in the same interaction turn can keep the
    // click dispatch busy long enough for automation (and users) to perceive a
    // frozen button even though the control itself is healthy.
    setOpen(true)
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null
      setRendererArmed(true)
    }, 0)
  }

  useEffect(() => {
    if (!open || !rendererArmed) return
    const container = containerRef.current
    if (!container) return

    setLoading(true)
    setError('')
    setLoadedFiles(0)
    setLoadedSourceFiles([])
    setFailedFiles([])

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 1000)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setError('This device could not start the whole-body WebGL renderer.')
      setLoading(false)
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.dataset.bodyAllSystems3d = 'true'
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.78))
    const key = new THREE.DirectionalLight(0xffffff, 1.15)
    key.position.set(2.5, 3.5, 4.5)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x5eead4, 0.35)
    rim.position.set(-4, 1.5, -3)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false

    const sourceBounds = new THREE.Box3()
    let disposed = false

    const resolvedByFile = new Map<string, Set<string>>()
    for (const target of selected.targets) {
      const fileNames = resolvedByFile.get(target.file) ?? new Set<string>()
      for (const name of target.names) fileNames.add(normalizeAnatomySourceName(name))
      resolvedByFile.set(target.file, fileNames)
    }

    const filesNeeded = [...resolvedByFile.keys()]
    if (filesNeeded.length === 0) {
      setError('No source-backed bundle is available for this system. Missing anatomy remains blocked.')
      setLoading(false)
    }

    const fitCamera = () => {
      if (sourceBounds.isEmpty()) return
      const center = sourceBounds.getCenter(new THREE.Vector3())
      const size = sourceBounds.getSize(new THREE.Vector3())
      const span = Math.max(size.x, size.y, size.z, 0.05)
      controls.target.copy(center)
      camera.position.set(center.x + span * 0.25, center.y + span * 0.08, center.z + span * 2.25)
      camera.lookAt(center)
    }

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    let completed = 0

    const finishOne = () => {
      completed += 1
      setLoadedFiles(completed)
      if (completed === filesNeeded.length) {
        fitCamera()
        setLoading(false)
      }
    }

    for (const file of filesNeeded) {
      loader.load(`${import.meta.env.BASE_URL}anatomy/${file}`, (gltf) => {
        if (disposed) return
        const names = resolvedByFile.get(file) ?? new Set<string>()
        let matched = 0
        gltf.scene.traverse((object) => {
          if (!(object as THREE.Mesh).isMesh) return
          const mesh = object as THREE.Mesh
          const represented = names.has(normalizeAnatomySourceName(mesh.name))
          mesh.visible = represented
          if (!represented) return
          matched += 1
          const raw = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          const cloned = raw.map(materialFor)
          mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0]
          sourceBounds.expandByObject(mesh)
        })
        if (matched > 0) {
          scene.add(gltf.scene)
          setLoadedSourceFiles((current) => current.includes(file) ? current : [...current, file])
        } else {
          gltf.scene.traverse((object) => {
            const mesh = object as THREE.Mesh
            if (!mesh.isMesh) return
            mesh.geometry.dispose()
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            materials.forEach((material) => material.dispose())
          })
          setFailedFiles((current) => current.includes(file) ? current : [...current, file])
          setError((current) => current || 'A shipped source bundle loaded but none of the resolved source nodes were renderable. Missing renders remain blocked; no replacement geometry was created.')
        }
        finishOne()
      }, undefined, () => {
        if (disposed) return
        setFailedFiles((current) => current.includes(file) ? current : [...current, file])
        setError((current) => current || 'One or more shipped anatomy source bundles failed to load. Missing renders remain blocked; no replacement geometry was created.')
        finishOne()
      })
    }

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width < 2 || height < 2) return
      const mobile = window.matchMedia('(max-width: 640px)').matches
      renderer.setPixelRatio(body3dPixelRatio(width, height, window.devicePixelRatio || 1, mobile))
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    let raf = 0
    let inViewport = true
    let documentVisible = !document.hidden
    const render = () => {
      raf = 0
      if (!inViewport || !documentVisible) return
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }
    const start = () => { if (!raf && inViewport && documentVisible) raf = requestAnimationFrame(render) }
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0 }
    const io = new IntersectionObserver(([entry]) => {
      inViewport = Boolean(entry?.isIntersecting)
      inViewport ? start() : stop()
    }, { rootMargin: '128px' })
    io.observe(container)
    const onVisibility = () => {
      documentVisible = !document.hidden
      documentVisible ? start() : stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      disposed = true
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      controls.dispose()
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((material) => material.dispose())
      })
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [open, rendererArmed, selected])

  const represented = selected.targets.filter((target) => target.available && loadedSourceFiles.includes(target.file) && !failedFiles.includes(target.file))
  const unavailable = selected.targets.filter((target) => !target.available || failedFiles.includes(target.file))

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/[.04]" aria-label="All body systems source-backed 3D">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Whole-body simultaneous wave</div>
          <h4 className="mt-1 text-sm font-black text-neutral-950 dark:text-white">All major systems · one source-backed WebGL explorer</h4>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">Only source bundles required by the active system are loaded on mobile. Every target resolves against the shipped GLB source index first; unresolved structures stay unavailable with no replacement geometry, inferred anatomy, patient geometry or academic-review claim.</p>
        </div>
        <button type="button" aria-expanded={open} onClick={toggleOpen} className="min-h-11 rounded-xl border border-emerald-300 bg-white px-4 text-[10px] font-black text-emerald-800 dark:bg-white/5 dark:text-emerald-200">{open ? 'Close all-system 3D' : 'Open all-system 3D'}</button>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Body systems">
        {BODY_SYSTEM_SOURCE_WAVE.map((system) => (
          <button key={system.id} type="button" role="tab" aria-selected={system.id === systemId} onClick={() => setSystemId(system.id)} className={`min-h-9 shrink-0 rounded-full border px-3 text-[9px] font-black ${system.id === systemId ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300'}`}>{system.label}</button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-[1.1fr_.9fr]">
        <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 dark:border-white/10">
          {open ? <div ref={containerRef} className="h-[360px] w-full sm:h-[430px]" aria-hidden="true" /> : <div className="flex h-[360px] items-center justify-center px-6 text-center text-xs font-bold text-neutral-500">Open the renderer to lazy-load only the active system's shipped anatomy GLBs.</div>}
          {loading && <div role="status" className="absolute inset-x-3 top-3 rounded-xl bg-black/70 px-3 py-2 text-[10px] font-bold text-white">Loading source bundles… {loadedFiles}</div>}
          {error && <div role="alert" className="absolute inset-x-3 bottom-3 rounded-xl bg-red-950/90 px-3 py-2 text-[10px] font-bold text-red-100">{error}</div>}
        </div>

        <div className="space-y-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.035]">
            <div className="text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{selected.label}</div>
            <div className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{represented.length}/{selected.targets.length} source targets represented</div>
            <p className="mt-1 text-[9px] leading-relaxed text-neutral-500">Counts require source-name resolution plus a successfully loaded source bundle for the active system with matching renderable nodes; they do not claim anatomical completeness or human academic validation.</p>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            {selected.targets.map((target) => {
              const bundleFailed = failedFiles.includes(target.file)
              const bundleLoaded = loadedSourceFiles.includes(target.file)
              const renderedAvailable = target.available && bundleLoaded && !bundleFailed
              return (
                <div key={target.id} className="rounded-xl border border-neutral-200 bg-white p-2.5 dark:border-white/10 dark:bg-white/[.035]">
                  <div className="text-[10px] font-black text-neutral-900 dark:text-white">{target.label}</div>
                  <div className={`mt-1 text-[9px] font-bold ${renderedAvailable ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>{renderedAvailable ? `${target.names.length} exact source node(s)` : bundleFailed ? 'BLOCKED · source bundle failed to load' : !target.available ? 'BLOCKED · source geometry unavailable' : loading ? 'Loading verified source bundle…' : 'BLOCKED · source bundle not loaded'}</div>
                  <div className="mt-1 truncate text-[8px] text-neutral-400">{target.file}</div>
                </div>
              )
            })}
          </div>
          {unavailable.length > 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[9px] leading-relaxed text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/[.06] dark:text-amber-200">Missing or failed source targets are deliberately not approximated. Compatible licensed geometry must load successfully before they can be counted as rendered.</p>}
        </div>
      </div>
    </section>
  )
}
