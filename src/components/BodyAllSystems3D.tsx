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
import { createBodyRenderScheduler } from '../lib/bodyRenderScheduler'
import { bodyStructureCameraFocus } from '../lib/bodyStructureCameraFocus'
import { createBodyWebglContextLifecycle } from '../lib/bodyWebglContextLifecycle'
import { bodySemanticScaleFromRelativeZoom, type BodySemanticScale } from '../lib/bodySemanticZoom'
import { muatAtlas, namaAtlas } from '../lib/anatomy/pemuatAtlas'

function materialFor(source: THREE.Material, role: 'selected' | 'context' = 'selected') {
  const cloned = source.clone()
  cloned.transparent = true
  cloned.opacity = role === 'context' ? 0.13 : 0.9
  cloned.depthWrite = false
  if ((cloned as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
    const standard = cloned as THREE.MeshStandardMaterial
    standard.emissive.set(role === 'context' ? 0x031219 : 0x062f3b)
    standard.emissiveIntensity = role === 'context' ? 0.08 : 0.32
    standard.userData.panaceaBaseEmissiveIntensity = standard.emissiveIntensity
  }
  cloned.userData.panaceaBaseOpacity = cloned.opacity
  return cloned
}

function applyProjectedSelection(groups: readonly THREE.Group[], selectedName?: string | null) {
  const selected = selectedName ? normalizeAnatomySourceName(selectedName) : ''
  for (const group of groups) {
    group.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (!mesh.isMesh) return
      const hit = selected !== '' && normalizeAnatomySourceName(mesh.name) === selected
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of materials) {
        if (mesh.userData.panaceaContext === true) {
          const contextOpacity = typeof material.userData.panaceaBaseOpacity === 'number'
            ? material.userData.panaceaBaseOpacity
            : 0.13
          material.transparent = true
          material.opacity = contextOpacity
          if ((material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            const standard = material as THREE.MeshStandardMaterial
            standard.emissiveIntensity = typeof standard.userData.panaceaBaseEmissiveIntensity === 'number'
              ? standard.userData.panaceaBaseEmissiveIntensity
              : 0.08
          }
          material.needsUpdate = true
          continue
        }
        const baseOpacity = typeof material.userData.panaceaBaseOpacity === 'number'
          ? material.userData.panaceaBaseOpacity
          : material.opacity
        material.transparent = true
        material.opacity = selected ? (hit ? Math.max(baseOpacity, 0.98) : Math.min(baseOpacity, 0.22)) : baseOpacity
        if ((material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const standard = material as THREE.MeshStandardMaterial
          const baseEmissive = typeof standard.userData.panaceaBaseEmissiveIntensity === 'number'
            ? standard.userData.panaceaBaseEmissiveIntensity
            : standard.emissiveIntensity
          standard.emissiveIntensity = selected ? (hit ? Math.max(baseEmissive, 1.05) : Math.min(baseEmissive, 0.12)) : baseEmissive
        }
        material.needsUpdate = true
      }
    })
  }
}

/**
 * Create a render-owned projection without mutating the canonical GLTF scene.
 * Geometry stays loader-owned and read-only; only cloned materials are disposed.
 */
function projectMatchedSourceMeshes(
  atlasScene: THREE.Group,
  namaAsli: Map<THREE.Object3D, string>,
  names: ReadonlySet<string>,
  contextNames: ReadonlySet<string> = new Set<string>(),
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
    const normalizedSourceName = normalizeAnatomySourceName(sourceName)
    const role = contextNames.has(normalizedSourceName) ? 'context' : 'selected'
    const clonedMaterials = sourceMaterials.map((material) => materialFor(material, role))
    const projected = new THREE.Mesh(
      source.geometry,
      Array.isArray(source.material) ? clonedMaterials : clonedMaterials[0],
    )
    projected.name = sourceName
    projected.userData.panaceaContext = role === 'context'
    projected.matrix.copy(source.matrixWorld)
    projected.matrixAutoUpdate = false
    // three r185: updateWorldMatrix() tidak menghitung ulang matrixWorld untuk
    // objek matrixAutoUpdate=false; tanpa updateMatrixWorld(true) batas memakai
    // matriks identitas (kubus ±1 terkuantisasi) — kamera membingkai kotak yang salah.
    projected.updateMatrixWorld(true)
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

export interface BodySemanticZoomState {
  scale: BodySemanticScale
  relativeZoom: number
}

interface BodyAllSystems3DProps {
  selectedSystemId?: BodySystemId
  onSystemChange?: (systemId: BodySystemId) => void
  onSemanticZoomChange?: (state: BodySemanticZoomState) => void
  selectedStructureName?: string | null
  onStructureSelect?: (sourceName: string) => void
  /** Permintaan fokus dari luar (mis. temuan AI-EMR): buka atlas bila tertutup,
   *  lalu bingkai kamera pada mesh sumber dengan nama PERSIS itu. Tidak ada mesh -> tidak ada fokus. */
  focusRequest?: { name: string; nonce: number } | null
}

export default function BodyAllSystems3D({
  selectedSystemId,
  onSystemChange,
  onSemanticZoomChange,
  selectedStructureName,
  onStructureSelect,
  focusRequest = null,
}: BodyAllSystems3DProps) {
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
  const semanticZoomCallbackRef = useRef(onSemanticZoomChange)
  const structureSelectCallbackRef = useRef(onStructureSelect)
  const selectionApplierRef = useRef<((name?: string | null) => void) | null>(null)
  const focusApplierRef = useRef<((name: string) => boolean) | null>(null)
  const pendingFocusRef = useRef<string | null>(null)
  const [focusStatus, setFocusStatus] = useState<{ name: string; framed: boolean; attempted: boolean } | null>(null)

  useEffect(() => {
    semanticZoomCallbackRef.current = onSemanticZoomChange
  }, [onSemanticZoomChange])

  useEffect(() => {
    structureSelectCallbackRef.current = onStructureSelect
  }, [onStructureSelect])

  useEffect(() => {
    selectionApplierRef.current?.(selectedStructureName)
  }, [selectedStructureName])

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

  function openAtlas() {
    if (open) return
    setOpen(true)
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null
      setRendererArmed(true)
    }, 120)
  }

  // Fokus dari luar: simpan sebagai tertunda; terapkan segera bila adegan siap,
  // atau setelah semua bundel sumber selesai dimuat.
  useEffect(() => {
    if (!focusRequest?.name) return
    pendingFocusRef.current = focusRequest.name
    setFocusStatus({ name: focusRequest.name, framed: false, attempted: false })
    if (!open) { openAtlas(); return }
    if (focusApplierRef.current?.(focusRequest.name)) {
      pendingFocusRef.current = null
      setFocusStatus({ name: focusRequest.name, framed: true, attempted: true })
    } else if (focusApplierRef.current && !loading) {
      // Adegan sudah dimuat penuh dan mesh itu tidak ada: katakan terus terang.
      pendingFocusRef.current = null
      setFocusStatus({ name: focusRequest.name, framed: false, attempted: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest])

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
    selectionApplierRef.current = (name) => {
      applyProjectedSelection(projectedGroups, name)
      requestRender()
    }
    // Cari mesh sumber dengan nama PERSIS (dinormalisasi) lalu bingkai kamera.
    focusApplierRef.current = (name) => {
      const cari = normalizeAnatomySourceName(name)
      let mesh: THREE.Mesh | undefined
      for (const g of projectedGroups) g.traverse((o) => { const m = o as THREE.Mesh; if (!mesh && m.isMesh && m.userData.panaceaContext !== true && normalizeAnatomySourceName(m.name) === cari) mesh = m })
      if (!mesh) return false
      applyProjectedSelection(projectedGroups, name)
      bingkaiMesh(mesh)
      return true
    }
    let fittedCameraDistance = 0
    let lastSemanticScale: BodySemanticScale = 'whole-body'
    let lastRelativeZoom = 1
    let disposed = false
    let inViewport = true
    let documentVisible = !document.hidden
    let contextAvailable = true

    const renderScheduler = createBodyRenderScheduler({
      canRender: () => !disposed && inViewport && documentVisible && contextAvailable,
      requestFrame: (callback) => requestAnimationFrame(callback),
      cancelFrame: (frameId) => cancelAnimationFrame(frameId),
      renderFrame: () => {
        // OrbitControls emits another change while damping is still settling,
        // which requests only the next necessary frame.
        controls.update()
        renderer.render(scene, camera)
      },
    })
    const requestRender = () => renderScheduler.request()
    const stop = () => renderScheduler.stop()
    const contextLifecycle = createBodyWebglContextLifecycle({
      onLost: () => {
        contextAvailable = false
        stop()
        setLoading(false)
        setError('Graphics context was lost. The 3D atlas is paused until this device restores it.')
      },
      onRestored: () => {
        contextAvailable = true
        setError('')
        requestRender()
      },
    })
    const onContextLost = (event: Event) => contextLifecycle.handleLost(event)
    const onContextRestored = () => contextLifecycle.handleRestored()
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)

    const resolvedByFile = new Map<string, Set<string>>()
    const contextNamesByFile = new Map<string, Set<string>>()
    for (const target of selected.targets) {
      const fileNames = resolvedByFile.get(target.file) ?? new Set<string>()
      for (const name of target.names) fileNames.add(normalizeAnatomySourceName(name))
      resolvedByFile.set(target.file, fileNames)
    }

    // Whole-body-first spatial context. The compatible Z-Anatomy surface
    // bundle stays faintly visible around internal systems so the user starts
    // from a complete human envelope instead of a floating organ. The surface
    // is source-backed, shares the same reference space, and is never used as
    // a substitute for deeper skin histology.
    if (selected.id !== 'integumentary-surface') {
      const surfaceSystem = systems.find((system) => system.id === 'integumentary-surface')
      const surfaceTarget = surfaceSystem?.targets.find((target) => target.file === 'surface.glb')
      if (surfaceTarget?.available) {
        const fileNames = resolvedByFile.get(surfaceTarget.file) ?? new Set<string>()
        const contextNames = contextNamesByFile.get(surfaceTarget.file) ?? new Set<string>()
        for (const name of surfaceTarget.names) {
          const normalized = normalizeAnatomySourceName(name)
          fileNames.add(normalized)
          contextNames.add(normalized)
        }
        resolvedByFile.set(surfaceTarget.file, fileNames)
        contextNamesByFile.set(surfaceTarget.file, contextNames)
      }
    }

    const filesNeeded = [...resolvedByFile.keys()]
    if (filesNeeded.length === 0) {
      setError('No source-backed bundle is available for this system. Missing anatomy remains blocked.')
      setLoading(false)
    }

    const emitSemanticZoom = () => {
      if (!fittedCameraDistance) return
      const cameraDistance = Math.max(camera.position.distanceTo(controls.target), 0.000001)
      const relativeZoom = Math.max(0.1, Math.min(256, fittedCameraDistance / cameraDistance))
      const scale = bodySemanticScaleFromRelativeZoom(relativeZoom)
      if (scale === lastSemanticScale && Math.abs(relativeZoom - lastRelativeZoom) < 0.2) return
      lastSemanticScale = scale
      lastRelativeZoom = relativeZoom
      semanticZoomCallbackRef.current?.({ scale, relativeZoom })
    }

    const fitCamera = () => {
      if (sourceBounds.isEmpty()) return
      const center = sourceBounds.getCenter(new THREE.Vector3())
      const size = sourceBounds.getSize(new THREE.Vector3())
      const span = Math.max(size.x, size.y, size.z, 0.05)
      controls.target.copy(center)
      camera.position.set(center.x + span * 0.25, center.y + span * 0.08, center.z + span * 2.25)
      camera.near = Math.max(span * 0.0005, 0.0001)
      camera.far = Math.max(span * 200, 1000)
      camera.updateProjectionMatrix()
      controls.minDistance = Math.max(span * 0.008, camera.near * 4)
      fittedCameraDistance = camera.position.distanceTo(center)
      renderer.domElement.dataset.jarakTubuh = fittedCameraDistance.toFixed(4)
      camera.lookAt(center)
      semanticZoomCallbackRef.current?.({ scale: 'whole-body', relativeZoom: 1 })
      lastSemanticScale = 'whole-body'
      lastRelativeZoom = 1
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
        const tertunda = pendingFocusRef.current
        if (tertunda) {
          pendingFocusRef.current = null
          setFocusStatus({ name: tertunda, framed: Boolean(focusApplierRef.current?.(tertunda)), attempted: true })
        }
      }
    }

    for (const file of filesNeeded) {
      muatAtlas(file).then(({ scene: atlasScene, namaAsli }) => {
        if (disposed) return
        const names = resolvedByFile.get(file) ?? new Set<string>()
        const projection = projectMatchedSourceMeshes(
          atlasScene,
          namaAsli,
          names,
          contextNamesByFile.get(file) ?? new Set<string>(),
        )
        if (projection.matched > 0) {
          projectedGroups.push(projection.group)
          scene.add(projection.group)
          sourceBounds.union(projection.bounds)
          applyProjectedSelection(projectedGroups, selectedStructureName)
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

    const onControlChange = () => {
      emitSemanticZoom()
      requestRender()
    }
    controls.addEventListener('change', onControlChange)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let pointerStartX = 0
    let pointerStartY = 0
    const onPointerDown = (event: PointerEvent) => {
      pointerStartX = event.clientX
      pointerStartY = event.clientY
    }
    const pickStructure = (event: PointerEvent | MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return undefined
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObjects(projectedGroups, true).find((entry) => {
        const candidate = entry.object as THREE.Mesh
        return candidate.isMesh && candidate.userData.panaceaContext !== true
      })?.object as THREE.Mesh | undefined
    }
    const onPointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) > 7) return
      const mesh = pickStructure(event)
      if (!mesh?.name) return
      structureSelectCallbackRef.current?.(mesh.name)
      applyProjectedSelection(projectedGroups, mesh.name)
      requestRender()
    }
    const onDoubleClick = (event: MouseEvent) => {
      const mesh = pickStructure(event)
      if (!mesh) return
      bingkaiMesh(mesh)
    }
    function bingkaiMesh(mesh: THREE.Mesh) {
      // Paksa matrixWorld (lihat catatan r185 di projectMatchedSourceMeshes).
      mesh.updateMatrixWorld(true)
      const bounds = new THREE.Box3().setFromObject(mesh, true)
      if (bounds.isEmpty()) return
      const pose = bodyStructureCameraFocus(
        {
          min: { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
          max: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z },
        },
        { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      )
      controls.target.set(pose.target.x, pose.target.y, pose.target.z)
      camera.position.set(pose.position.x, pose.position.y, pose.position.z)
      camera.lookAt(controls.target)
      controls.update()
      // Terukur untuk uji: jarak kamera->target setelah dibingkai (lebih kecil dari seluruh tubuh).
      renderer.domElement.dataset.jarakKamera = camera.position.distanceTo(controls.target).toFixed(4)
      renderer.domElement.dataset.bentangStruktur = pose.span.toFixed(4)
      emitSemanticZoom()
      requestRender()
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('dblclick', onDoubleClick)

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
      renderScheduler.dispose()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      controls.removeEventListener('change', onControlChange)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('dblclick', onDoubleClick)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
      contextLifecycle.dispose()
      selectionApplierRef.current = null
      focusApplierRef.current = null
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
            Start from a source-backed whole-body surface, then inspect the selected system inside it; unresolved or failed structures remain blocked instead of being replaced with invented anatomy.
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
            <span className="rounded-full border border-white/[.08] bg-black/60 px-2.5 py-1 text-[8px] font-bold text-white/35 backdrop-blur-xl">surface context · tap · zoom</span>
          </div>
          {selectedStructureName && (
            <div className="pointer-events-none absolute left-3 top-12 max-w-[72%] truncate rounded-full border border-cyan-300/20 bg-cyan-950/80 px-2.5 py-1 text-[8px] font-black text-cyan-100 backdrop-blur-xl">
              Selected · {selectedStructureName}
            </div>
          )}
          {focusStatus?.attempted && focusStatus.name === selectedStructureName && (
            <div data-fokus-kamera={focusStatus.framed ? 'framed' : 'not-rendered'} className="pointer-events-none absolute left-3 top-[4.5rem] max-w-[72%] truncate rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[8px] font-black text-white/70">
              {focusStatus.framed ? 'Camera framed on this structure' : 'Not rendered in this system view — not framed'}
            </div>
          )}
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