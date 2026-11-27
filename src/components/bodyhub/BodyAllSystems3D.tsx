import { useEffect, useMemo, useRef, useState } from 'react'
import { Fold } from '../../shared/ui/Fold'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { normalizeAnatomySourceName } from '../../lib/anatomySourceNodeRegistry'
import {
  BODY_SYSTEM_SOURCE_WAVE,
  resolveBodySystemSourceWave,
  type BodySystemId,
} from '../../lib/bodySystemSourceWave'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { createBodyRenderScheduler } from '../../lib/bodyRenderScheduler'
import { bodyStructureCameraFocus } from '../../lib/bodyStructureCameraFocus'
import { createBodyWebglContextLifecycle } from '../../lib/bodyWebglContextLifecycle'
import { bodySemanticScaleFromRelativeZoom, type BodySemanticScale } from '../../lib/bodySemanticZoom'
import { muatAtlas, namaAtlas } from '../../lib/anatomy/pemuatAtlas'

type Sim4DMode = 'live' | 'exercise' | 'future-optimal' | 'future-sedentary'

const SIM_4D_PRESETS: ReadonlyArray<{
  id: Sim4DMode
  label: string
  breathHz: number
  pulseHz: number
  emissiveHex: number
}> = [
  { id: 'live', label: 'Live 4D', breathHz: 0.25, pulseHz: 1.15, emissiveHex: 0x09313d },
  { id: 'exercise', label: 'Exercise 2.2×', breathHz: 0.55, pulseHz: 2.4, emissiveHex: 0xb45309 },
  { id: 'future-optimal', label: '+5Y Optimal', breathHz: 0.2, pulseHz: 0.98, emissiveHex: 0x047857 },
  { id: 'future-sedentary', label: '+5Y Sedentary', breathHz: 0.32, pulseHz: 1.45, emissiveHex: 0xbe123c },
]

function materialFor(source: THREE.Material, role: 'selected' | 'context' = 'selected') {
  const cloned = source.clone()
  if (role === 'context') {
    cloned.transparent = true
    cloned.opacity = 0.14
    cloned.depthWrite = false
    cloned.side = THREE.FrontSide
  } else {
    cloned.transparent = false
    cloned.opacity = 1
    cloned.depthWrite = true
    cloned.side = THREE.FrontSide
  }
  if ((cloned as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
    const standard = cloned as THREE.MeshStandardMaterial
    standard.emissive.set(role === 'context' ? 0x031219 : 0x09313d)
    standard.emissiveIntensity = role === 'context' ? 0.08 : 0.24
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
            : 0.14
          material.transparent = true
          material.opacity = contextOpacity
          material.depthWrite = false
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
          : 1
        if (selected && !hit) {
          material.transparent = true
          material.opacity = 0.24
          material.depthWrite = false
        } else {
          material.transparent = false
          material.opacity = baseOpacity
          material.depthWrite = true
        }
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
    projected.renderOrder = role === 'context' ? 2 : 1
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
  const stageHostRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const openTimerRef = useRef<number | null>(null)
  const motionKickRef = useRef<(() => void) | null>(null)
  // Auto-renders when mounted without a click wall; offscreen IntersectionObserver pauses idle demand-loaded WebGL frames.
  const [open, setOpen] = useState(true)
  const [rendererArmed, setRendererArmed] = useState(true)
  const [internalSystemId, setInternalSystemId] = useState<BodySystemId>('cardiovascular')
  const [simMode, setSimMode] = useState<Sim4DMode>('live')
  const [motionOn, setMotionOn] = useState(() => (
    typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ))
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
  const selectedStructureRef = useRef<string | null | undefined>(selectedStructureName)
  const simConfigRef = useRef({ simMode, motionOn })
  simConfigRef.current = { simMode, motionOn }
  selectedStructureRef.current = selectedStructureName
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

  useEffect(() => {
    motionKickRef.current?.()
  }, [simMode, motionOn])

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
    if (!open) setOpen(true)
    setRendererArmed(true)
  }

  // Fokus dari luar: simpan sebagai tertunda; terapkan segera bila adegan siap,
  // atau setelah semua bundel sumber selesai dimuat.
  useEffect(() => {
    if (!focusRequest?.name) return
    pendingFocusRef.current = focusRequest.name
    setFocusStatus({ name: focusRequest.name, framed: false, attempted: false })
    if (!open || !rendererArmed) { openAtlas(); return }
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
    setRendererArmed(true)
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.domElement.dataset.bodyAllSystems3d = 'true'
    renderer.domElement.style.touchAction = 'none'
    container.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = envRT.texture

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
    const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = !mobile
    controls.enablePan = false
    controls.minDistance = 0.02
    controls.maxDistance = 1000

    const sourceBounds = new THREE.Box3()
    const projectedGroups: THREE.Group[] = []
    let floorRing: THREE.Mesh | null = null
    let userInteracting = false
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
        const cfg = simConfigRef.current
        const animateLive = cfg.motionOn && !prefersReducedMotion() && projectedGroups.length > 0
        if (animateLive) {
          const preset = SIM_4D_PRESETS.find((item) => item.id === cfg.simMode) ?? SIM_4D_PRESETS[0]
          const t = performance.now() * 0.001
          const breathScale = 1 + 0.006 * Math.sin(2 * Math.PI * preset.breathHz * t)
          const pulseIntensity = 0.2 + 0.22 * (0.5 + 0.5 * Math.sin(2 * Math.PI * preset.pulseHz * t))
          const lockSelection = Boolean(selectedStructureRef.current)
          for (const g of projectedGroups) {
            g.scale.set(breathScale, 1 + (breathScale - 1) * 0.25, breathScale)
            if (!lockSelection) {
              g.traverse((obj) => {
                const mesh = obj as THREE.Mesh
                if (!mesh.isMesh || mesh.userData.panaceaContext === true) return
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                for (const mat of mats) {
                  if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                    const std = mat as THREE.MeshStandardMaterial
                    std.emissive.setHex(preset.emissiveHex)
                    std.emissiveIntensity = pulseIntensity
                  }
                }
              })
            }
          }
          if (!userInteracting) scene.rotation.y = (scene.rotation.y + 0.0018) % (Math.PI * 2)
        } else {
          for (const g of projectedGroups) g.scale.set(1, 1, 1)
        }
        controls.update()
        renderer.render(scene, camera)
        if (animateLive) requestRender()
      },
    })
    const requestRender = () => renderScheduler.request()
    const stop = () => renderScheduler.stop()
    motionKickRef.current = requestRender
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
      camera.position.set(center.x + span * 0.16, center.y + span * 0.04, center.z + span * 1.74)
      camera.near = Math.max(span * 0.0005, 0.0001)
      camera.far = Math.max(span * 200, 1000)
      camera.updateProjectionMatrix()
      controls.minDistance = Math.max(span * 0.008, camera.near * 4)
      fittedCameraDistance = camera.position.distanceTo(center)
      renderer.domElement.dataset.jarakTubuh = fittedCameraDistance.toFixed(4)
      camera.lookAt(center)
      if (!floorRing) {
        floorRing = new THREE.Mesh(
          new THREE.RingGeometry(span * 0.18, span * 0.24, 48),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
        )
        floorRing.rotation.x = -Math.PI / 2
        scene.add(floorRing)
      }
      floorRing.position.set(center.x, sourceBounds.min.y, center.z)
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

    const onControlStart = () => {
      userInteracting = true
    }
    const onControlChange = () => {
      emitSemanticZoom()
      requestRender()
    }
    controls.addEventListener('start', onControlStart)
    controls.addEventListener('change', onControlChange)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let pointerStartX = 0
    let pointerStartY = 0
    const onPointerDown = (event: PointerEvent) => {
      userInteracting = true
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
      if (!pose) return
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
    }, { rootMargin: '640px' })
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
      motionKickRef.current = null
      renderScheduler.dispose()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      controls.removeEventListener('start', onControlStart)
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
      if (floorRing) {
        floorRing.geometry.dispose()
        ;(floorRing.material as THREE.Material).dispose()
      }
      envRT.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [open, rendererArmed, selected])

  const represented = selected.targets.filter((target) => target.available && loadedSourceFiles.includes(target.file) && !failedFiles.includes(target.file))
  const unavailable = selected.targets.filter((target) => !target.available || failedFiles.includes(target.file))

  return (
    <section
      ref={stageHostRef}
      className="dark overflow-hidden rounded-[26px] border border-white/[.12] bg-[#02050b] p-3 text-white shadow-[0_18px_70px_rgba(0,0,0,.28)] sm:p-4"
      aria-label="Eleven body systems source-backed 4D atlas"
      aria-describedby="body-atlas-provenance"
    >
      <p id="body-atlas-provenance" className="sr-only">
        Start from a source-backed whole-body surface, then inspect the selected system inside it; unresolved or failed structures remain blocked instead of being replaced with invented anatomy.
      </p>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Body systems">
        {BODY_SYSTEM_SOURCE_WAVE.map((system) => {
          const active = system.id === systemId
          return (
            <button
              key={system.id}
              type="button"
              role="tab"
              data-pmd-native="true"
              aria-selected={active}
              onClick={() => selectSystem(system.id)}
              className={`min-h-[44px] shrink-0 rounded-full border px-3.5 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${
                active
                  ? 'border-emerald-300 bg-emerald-400 text-neutral-950'
                  : 'border-white/15 bg-white/[.06] text-slate-200 hover:bg-white/[.12] hover:text-white'
              }`}
            >
              {system.label}
            </button>
          )
        })}
      </div>

      <div className="relative mt-2 h-[380px] overflow-hidden rounded-[22px] border border-white/[.10] bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,.09),transparent_42%),radial-gradient(circle_at_62%_58%,rgba(139,92,246,.07),transparent_38%),#010308] sm:h-[500px]">
        {open ? (
          <div ref={containerRef} className="h-full w-full" aria-hidden="true" />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <div className="text-xs font-black text-white">3D renderer paused</div>
              <p className="mx-auto mt-1 max-w-md text-[11px] text-slate-300">Resume to interact with the live 11-system Z-Anatomy 4D stage.</p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-cyan-100 backdrop-blur-xl">
            {selected.label} · 1:1 Reference
          </span>
          <button
            type="button"
            data-pmd-native="true"
            aria-expanded={open}
            onClick={toggleOpen}
            className="pointer-events-auto shrink-0 whitespace-nowrap min-h-[44px] min-w-[44px] rounded-full border border-white/20 bg-black/75 px-3.5 text-[11px] font-black text-white backdrop-blur-xl transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          >
            {open ? 'Pause 3D' : 'Resume 3D'}
          </button>
        </div>

        {selectedStructureName && (
          <div className="pointer-events-none absolute left-3 top-14 max-w-[72%] truncate rounded-full border border-cyan-300/30 bg-cyan-950/90 px-3 py-1.5 text-[11px] font-black text-cyan-100 backdrop-blur-xl">
            Selected · {selectedStructureName}
          </div>
        )}

        {focusStatus?.attempted && focusStatus.name === selectedStructureName && (
          <div data-fokus-kamera={focusStatus.framed ? 'framed' : 'not-rendered'} className="pointer-events-none absolute left-3 top-[5.5rem] max-w-[72%] truncate rounded-full border border-white/20 bg-black/80 px-3 py-1.5 text-[11px] font-black text-white">
            {focusStatus.framed ? 'Camera framed on this structure' : 'Not rendered in this system view — not framed'}
          </div>
        )}

        <div className="pointer-events-none absolute bottom-2.5 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-white/15 bg-black/70 px-3 py-1 text-[10px] font-bold text-slate-200 backdrop-blur-xl">
          Simulated educational 4D physiology · reference Z-Anatomy
        </div>

        {loading && (
          <div role="status" className="absolute right-3 bottom-12 rounded-full border border-cyan-300/25 bg-black/85 px-3.5 py-1.5 text-[11px] font-bold text-cyan-100 backdrop-blur-xl">
            Loading canonical 3D bundles… {loadedFiles}
          </div>
        )}
        {error && (
          <div role="alert" className="absolute inset-x-3 bottom-12 rounded-xl border border-red-300/25 bg-red-950/90 px-3 py-2 text-[11px] font-bold text-red-100 backdrop-blur-xl">
            {error}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5" role="group" aria-label="4D physiological state">
        {SIM_4D_PRESETS.map((preset) => {
          const active = simMode === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              data-pmd-native="true"
              aria-pressed={active}
              onClick={() => setSimMode(preset.id)}
              className={`min-h-[44px] rounded-full border px-3.5 text-[11px] font-black transition ${
                active
                  ? 'border-cyan-300 bg-cyan-400 text-neutral-950'
                  : 'border-white/15 bg-white/[.06] text-slate-200 hover:bg-white/[.12]'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
        <button
          type="button"
          data-pmd-native="true"
          aria-pressed={motionOn}
          onClick={() => setMotionOn((v) => !v)}
          className={`ml-auto min-h-[44px] min-w-[44px] rounded-full border px-3.5 text-[11px] font-black transition ${
            motionOn
              ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
              : 'border-white/15 bg-white/[.06] text-slate-200 hover:bg-white/[.12]'
          }`}
        >
          {motionOn ? 'Motion: On' : 'Motion: Paused'}
        </button>
      </div>

      <div className="mt-2.5">
        <Fold label="Sources">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-200">
            <span>{selected.label}: {represented.length}/{selected.targets.length} rendered source targets</span>
            <span className="text-slate-300">Zero synthetic substitution</span>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {selected.targets.map((target) => {
              const bundleFailed = failedFiles.includes(target.file)
              const bundleLoaded = loadedSourceFiles.includes(target.file)
              const renderedAvailable = target.available && bundleLoaded && !bundleFailed
              const indexAvailable = target.available
              return (
                <div key={target.id} className="rounded-[16px] border border-white/10 bg-white/[.04] p-2.5">
                  <div className="text-[11px] font-black text-white">{target.label}</div>
                  <div className={`mt-1 text-[10px] font-black ${renderedAvailable ? 'text-cyan-200' : indexAvailable && !open ? 'text-violet-200' : 'text-amber-200'}`}>
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
                  <div className="mt-1 truncate text-[10px] text-slate-300">{target.file}</div>
                </div>
              )
            })}
          </div>
        </Fold>
        {unavailable.length > 0 && (
          <p className="mt-2 rounded-[14px] border border-amber-300/25 bg-amber-300/[.08] p-2.5 text-[11px] leading-relaxed text-amber-100">
            Missing or failed targets are deliberately not approximated with synthetic substitute geometry.
          </p>
        )}
      </div>
    </section>
  )
}