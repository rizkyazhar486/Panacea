import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { normalizeAnatomySourceName } from '../lib/anatomySourceNodeRegistry'
import {
  BODY_SYSTEM_SOURCE_WAVE,
  resolveBodySystemSourceWave,
  type BodySystemId,
} from '../lib/bodySystemSourceWave'
import { body3dPixelRatio } from '../lib/body3dQuality'
import { muatAtlas, namaAtlas } from '../lib/anatomy/pemuatAtlas'

function materialFor(source: THREE.Material) {
  const cloned = source.clone()
  if ((cloned as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
    const standard = cloned as THREE.MeshStandardMaterial
    standard.transparent = true
    standard.opacity = 0.88
    standard.depthWrite = false
    standard.emissive.set(0x062f3b)
    standard.emissiveIntensity = 0.32
  }
  return cloned
}

/**
 * Create a render-owned projection without mutating the canonical GLTF scene.
 * Geometry stays loader-owned and read-only; only cloned materials are disposed.
 */
function projectMatchedSourceMeshes(
  atlasScene: THREE.Group,
  namaAsli: Map<THREE.Object3D, string>,
  names: ReadonlySet<string>,
) {
  const group = new THREE.Group()
  const bounds = new THREE.Box3()
  let matched = 0

  atlasScene.updateMatrixWorld(true)
  atlasScene.traverse((object) => {
    if (!(object as THREE.Mesh).isMesh) return
    const source = object as THREE.Mesh
    const sourceName = namaAtlas(namaAsli, source)
    if (!names.has(normalizeAnatomySourceName(sourceName))) return

    const sourceMaterials = Array.isArray(source.material) ? source.material : [source.material]
    const clonedMaterials = sourceMaterials.map(materialFor)
    const projected = new THREE.Mesh(
      source.geometry,
      Array.isArray(source.material) ? clonedMaterials : clonedMaterials[0],
    )
    projected.name = sourceName
    projected.matrix.copy(source.matrixWorld)
    projected.matrixAutoUpdate = false
    projected.frustumCulled = source.frustumCulled
    projected.renderOrder = source.renderOrder
    group.add(projected)
    bounds.expandByObject(projected)
    matched += 1
  })

  return { group, bounds, matched }
}

function disposeProjectedMaterials(group: THREE.Group) {
  group.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => material.dispose())
  })
}

interface BodyAllSystems3DProps {
  selectedSystemId?: BodySystemId
  onSystemChange?: (systemId: BodySystemId) => void
}

export default function BodyAllSystems3D({ selectedSystemId, onSystemChange }: BodyAllSystems3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const openTimerRef = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [rendererArmed, setRendererArmed] = useState(false)
  const [internalSystemId, setInternalSystemId] = useState<BodySystemId>('cardiovascular')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadedFiles, setLoadedFiles] = useState(0)
  const [loadedSourceFiles, setLoadedSourceFiles] = useState<string[]>([])
  const [failedFiles, setFailedFiles] = useState<string[]>([])

  const systemId = selectedSystemId ?? internalSystemId
  const systems = useMemo(() => resolveBodySystemSourceWave(), [])
  const selected = systems.find((system) => system.id === systemId) ?? systems[0]

  useEffect(() => () => {
    if (openTimerRef.current !== null) window.clearTimeout(openTimerRef.current)
  }, [])

  function selectSystem(nextSystemId: BodySystemId) {
    if (selectedSystemId === undefined) setInternalSystemId(nextSystemId)
    onSystemChange?.(nextSystemId)
  }

  function toggleOpen() {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (open) {
      setRendererArmed(false)
      setOpen(false)
      return
    }
    setOpen(true)
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null
      setRendererArmed(true)
    }, 120)
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
    renderer.domElement.style.touchAction = 'none'
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.74))
    const key = new THREE.DirectionalLight(0xdffaff, 1.18)
    key.position.set(2.5, 3.5, 4.5)
    scene.add(key)
    const cyanRim = new THREE.DirectionalLight(0x67e8f9, 0.42)
    cyanRim.position.set(-4, 1.5, -3)
    scene.add(cyanRim)
    const violetRim = new THREE.DirectionalLight(0xa78bfa, 0.25)
    violetRim.position.set(3, -1, -2)
    scene.add(violetRim)

    const mobile = window.matchMedia('(max-width: 640px)').matches
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = !mobile
    controls.enablePan = false
    controls.minDistance = 0.02
    controls.maxDistance = 1000

    const sourceBounds = new THREE.Box3()
    const projectedGroups: THREE.Group[] = []
    let disposed = false
    let raf = 0
    let inViewport = true
    let documentVisible = !document.hidden

    const renderFrame = () => {
      if (disposed || !inViewport || !documentVisible) return
      controls.update()
      renderer.render(scene, camera)
    }
    const renderLoop = () => {
      raf = 0
      if (disposed || !inViewport || !documentVisible) return
      renderFrame()
      raf = requestAnimationFrame(renderLoop)
    }
    const requestRender = () => {
      if (disposed || !inViewport || !documentVisible) return
      if (mobile) {
        if (raf) return
        raf = requestAnimationFrame(() => {
          raf = 0
          renderFrame()
        })
      } else if (!raf) {
        raf = requestAnimationFrame(renderLoop)
      }
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

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
      requestRender()
    }

    let completed = 0
    const finishOne = () => {
      completed += 1
      setLoadedFiles(completed)
      requestRender()
      if (completed === filesNeeded.length) {
        fitCamera()
        setLoading(false)
      }
    }

    for (const file of filesNeeded) {
      muatAtlas(file).then(({ scene: atlasScene, namaAsli }) => {
        if (disposed) return
        const names = resolvedByFile.get(file) ?? new Set<string>()
        const projection = projectMatchedSourceMeshes(atlasScene, namaAsli, names)
        if (projection.matched > 0) {
          projectedGroups.push(projection.group)
          scene.add(projection.group)
          sourceBounds.union(projection.bounds)
          setLoadedSourceFiles((current) => current.includes(file) ? current : [...current, file])
          requestRender()
        } else {
          setFailedFiles((current) => current.includes(file) ? current : [...current, file])
          setError((current) => current || 'A shipped source bundle loaded but none of its resolved source nodes were renderable. Missing anatomy stays blocked; no substitute geometry was created.')
        }
        finishOne()
      }).catch(() => {
        if (disposed) return
        setFailedFiles((current) => current.includes(file) ? current : [...current, file])
        setError((current) => current || 'One or more shipped anatomy bundles failed to load. Missing anatomy stays blocked; no substitute geometry was created.')
        finishOne()
      })
    }

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width < 2 || height < 2) return
      renderer.setPixelRatio(body3dPixelRatio(width, height, window.devicePixelRatio || 1, mobile))
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      requestRender()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    const onControlChange = () => requestRender()
    if (mobile) controls.addEventListener('change', onControlChange)

    const io = new IntersectionObserver(([entry]) => {
      inViewport = Boolean(entry?.isIntersecting)
      if (inViewport) requestRender()
      else stop()
    }, { rootMargin: '128px' })
    io.observe(container)

    const onVisibility = () => {
      documentVisible = !document.hidden
      if (documentVisible) requestRender()
      else stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    requestRender()

    return () => {
      disposed = true
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      if (mobile) controls.removeEventListener('change', onControlChange)
      controls.dispose()
      projectedGroups.forEach(disposeProjectedMaterials)
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [open, rendererArmed, selected])

  const represented = selected.targets.filter((target) => target.available && loadedSourceFiles.includes(target.file) && !failedFiles.includes(target.file))
  const unavailable = selected.targets.filter((target) => !target.available || failedFiles.includes(target.file))
  const sourceResolved = selected.targets.filter((target) => target.available).length

  return (
    <section className="overflow-hidden rounded-[26px] border border-white/[.09] bg-[linear-gradient(135deg,rgba(34,211,238,.055),rgba(255,255,255,.025)_42%,rgba(139,92,246,.045))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_70px_rgba(0,0,0,.2)] sm:p-4" aria-label="Eleven body systems source-backed 3D atlas">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/85">Whole-body system atlas</span>
            <span className="rounded-full border border-white/[.08] bg-black/25 px-2 py-1 text-[8px] font-black uppercase tracking-[.14em] text-white/45">11 systems · canonical GLB only</span>
          </div>
          <h3 className="mt-1.5 text-base font-black tracking-[-.02em] text-white sm:text-lg">See the body by system without inventing missing anatomy</h3>
          <p className="mt-1 max-w-3xl text-[10px] font-medium leading-relaxed text-white/48 sm:text-[11px]">
            Select a system first. The renderer resolves named structures against Panacea's shipped anatomy source index, loads only the required canonical bundles, and keeps unresolved or failed structures blocked instead of drawing substitutes.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={toggleOpen}
          className="min-h-11 shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/[.08] px-4 text-[10px] font-black text-cyan-100 transition hover:bg-cyan-300/[.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
        >
          {open ? 'Close system atlas' : 'Open system atlas'}
        </button>
      </div>

      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Body systems">
        {BODY_SYSTEM_SOURCE_WAVE.map((system) => {
          const active = system.id === systemId
          return (
            <button
              key={system.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectSystem(system.id)}
              className={`min-h-10 shrink-0 rounded-full border px-3 text-[9px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${active ? 'border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,.18),rgba(139,92,246,.12))] text-white' : 'border-white/[.07] bg-white/[.025] text-white/45 hover:bg-white/[.055] hover:text-white/75'}`}
            >
              {system.label}
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
        <div className="relative min-h-[340px] overflow-hidden rounded-[22px] border border-white/[.08] bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,.08),transparent_34%),radial-gradient(circle_at_62%_58%,rgba(139,92,246,.06),transparent_30%),#010207] sm:min-h-[430px]">
          {open ? (
            <div ref={containerRef} className="h-[340px] w-full sm:h-[430px]" aria-hidden="true" />
          ) : (
            <div className="grid h-[340px] place-items-center px-6 text-center sm:h-[430px]">
              <div>
                <div className="mx-auto h-16 w-16 rounded-full border border-cyan-300/15 bg-[radial-gradient(circle,rgba(34,211,238,.16),rgba(139,92,246,.04)_58%,transparent_70%)] shadow-[0_0_50px_rgba(34,211,238,.07)]" aria-hidden />
                <div className="mt-4 text-xs font-black text-white/70">Renderer is demand-loaded</div>
                <p className="mx-auto mt-1 max-w-md text-[10px] leading-relaxed text-white/35">Open it to load only the selected system's verified source bundles. This keeps the default Body Exposure view lighter on mobile.</p>
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <span className="rounded-full border border-white/[.08] bg-black/60 px-2.5 py-1 text-[8px] font-black uppercase tracking-[.14em] text-white/55 backdrop-blur-xl">{selected.label}</span>
            <span className="rounded-full border border-white/[.08] bg-black/60 px-2.5 py-1 text-[8px] font-bold text-white/35 backdrop-blur-xl">orbit · zoom</span>
          </div>
          {loading && <div role="status" className="absolute inset-x-3 bottom-3 rounded-xl border border-cyan-300/10 bg-black/75 px-3 py-2 text-[10px] font-bold text-cyan-100 backdrop-blur-xl">Loading canonical source bundles… {loadedFiles}</div>}
          {error && <div role="alert" className="absolute inset-x-3 bottom-3 rounded-xl border border-red-300/15 bg-red-950/85 px-3 py-2 text-[10px] font-bold text-red-100 backdrop-blur-xl">{error}</div>}
        </div>

        <aside className="space-y-2.5">
          <div className="rounded-[20px] border border-white/[.08] bg-white/[.025] p-3.5">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200/70">{selected.label}</div>
            <div className="mt-1 text-xl font-black tracking-[-.025em] text-white">{open ? represented.length : sourceResolved}/{selected.targets.length}</div>
            <div className="text-[10px] font-bold text-white/45">{open ? 'rendered source targets' : 'targets resolved in source index'}</div>
            <p className="mt-2 text-[9px] leading-relaxed text-white/32">Rendered counts require both exact source-name resolution and successful bundle loading. They do not claim full anatomical completeness or patient-specific validity.</p>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {selected.targets.map((target) => {
              const bundleFailed = failedFiles.includes(target.file)
              const bundleLoaded = loadedSourceFiles.includes(target.file)
              const renderedAvailable = target.available && bundleLoaded && !bundleFailed
              const indexAvailable = target.available
              return (
                <div key={target.id} className="rounded-[16px] border border-white/[.07] bg-black/20 p-2.5">
                  <div className="text-[10px] font-black text-white/75">{target.label}</div>
                  <div className={`mt-1 text-[8px] font-black ${renderedAvailable ? 'text-cyan-200/80' : indexAvailable && !open ? 'text-violet-200/70' : 'text-amber-200/75'}`}>
                    {renderedAvailable
                      ? `${target.names.length} exact source node${target.names.length === 1 ? '' : 's'}`
                      : bundleFailed
                        ? 'BLOCKED · bundle load failed'
                        : !indexAvailable
                          ? 'BLOCKED · source geometry unavailable'
                          : loading
                            ? 'Loading verified source bundle…'
                            : open
                              ? 'BLOCKED · bundle not rendered'
                              : `${target.names.length} source node${target.names.length === 1 ? '' : 's'} indexed`}
                  </div>
                  <div className="mt-1 truncate text-[8px] text-white/25">{target.file}</div>
                </div>
              )
            })}
          </div>

          {unavailable.length > 0 && (
            <p className="rounded-[16px] border border-amber-300/12 bg-amber-300/[.045] p-2.5 text-[9px] leading-relaxed text-amber-100/70">
              Missing or failed targets are deliberately not approximated. Compatible source geometry must resolve and load successfully before it can appear here.
            </p>
          )}
        </aside>
      </div>
    </section>
  )
}