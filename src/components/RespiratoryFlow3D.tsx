import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RESPIRATORY_ATLAS_NODES } from '../lib/anatomy/respiratoryAtlas'
import { body3dPixelRatio } from '../lib/body3dQuality'
import { respiratoryFlowVisualState, type RespiratoryFlowPhase } from '../lib/respiratoryFlowVisual'

interface Props {
  phase: RespiratoryFlowPhase
  height?: number
}

const PARTICLES_PER_ROUTE = 2

function normalizeName(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sourceHintsFor(nodeId: string): readonly string[] {
  const node = RESPIRATORY_ATLAS_NODES.find((candidate) => candidate.id === nodeId)
  if (!node?.source?.files?.includes('visceral.glb')) return []
  return node.source.nodeHints
}

function sourceObjectFor(nodeId: string, byName: Map<string, THREE.Object3D>): THREE.Object3D | null {
  for (const hint of sourceHintsFor(nodeId)) {
    const match = byName.get(normalizeName(hint))
    if (match) return match
  }
  return null
}

function centerOf(object: THREE.Object3D | null): THREE.Vector3 | null {
  if (!object) return null
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return null
  return box.getCenter(new THREE.Vector3())
}

function routeCurve(
  trachea: THREE.Vector3 | null,
  main: THREE.Vector3 | null,
  segment: THREE.Vector3 | null,
): THREE.CatmullRomCurve3 | null {
  if (!trachea || !main || !segment) return null
  return new THREE.CatmullRomCurve3([trachea, main, segment], false, 'centripetal')
}

export function RespiratoryFlow3D({ phase, height = 340 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [routeCount, setRouteCount] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setError('This device could not start the respiratory 3D render.')
      setLoading(false)
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.dataset.respiratoryFlow3d = 'true'
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.78))
    const key = new THREE.DirectionalLight(0xdffaff, 1.2)
    key.position.set(2, 3, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x43d9ff, 0.5)
    rim.position.set(-3, 1, -2)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = 0.2
    controls.maxDistance = 20

    const resize = () => {
      const width = container.clientWidth
      const currentHeight = container.clientHeight
      if (width < 2 || currentHeight < 2) return
      const mobile = window.matchMedia('(max-width: 640px)').matches
      renderer.setPixelRatio(body3dPixelRatio(width, currentHeight, window.devicePixelRatio || 1, mobile))
      renderer.setSize(width, currentHeight)
      camera.aspect = width / currentHeight
      camera.updateProjectionMatrix()
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    const respiratoryHints = new Set(
      RESPIRATORY_ATLAS_NODES
        .filter((node) => node.source?.files?.includes('visceral.glb'))
        .flatMap((node) => node.source?.nodeHints ?? [])
        .filter(Boolean)
        .map(normalizeName),
    )

    const visibleMeshes: THREE.Mesh[] = []
    const lungMaterials: THREE.MeshStandardMaterial[] = []
    let particleMesh: THREE.InstancedMesh | null = null
    let particleGeometry: THREE.SphereGeometry | null = null
    let particleMaterial: THREE.MeshBasicMaterial | null = null
    let routes: THREE.CatmullRomCurve3[] = []
    let root: THREE.Group | null = null
    let disposed = false

    new GLTFLoader().load(
      `${import.meta.env.BASE_URL}anatomy/visceral.glb`,
      (gltf) => {
        if (disposed) return
        root = gltf.scene
        const byName = new Map<string, THREE.Object3D>()
        root.traverse((object) => {
          if (object.name) byName.set(normalizeName(object.name), object)
        })

        root.traverse((object) => {
          if (!(object as THREE.Mesh).isMesh) return
          const mesh = object as THREE.Mesh
          const normalized = normalizeName(mesh.name)
          const keep = respiratoryHints.has(normalized)
          mesh.visible = keep
          if (!keep) return

          const sourceMaterial = mesh.material as THREE.Material | THREE.Material[]
          if (Array.isArray(sourceMaterial)) {
            mesh.visible = false
            return
          }
          const cloned = sourceMaterial.clone()
          mesh.material = cloned
          visibleMeshes.push(mesh)

          if ((cloned as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            const material = cloned as THREE.MeshStandardMaterial
            material.transparent = true
            const lungLike = /lung|lobe/.test(normalized) && !/bronch/.test(normalized)
            if (lungLike) {
              material.opacity = 0.28
              material.depthWrite = false
              lungMaterials.push(material)
            } else {
              material.opacity = 0.86
              material.emissive.set(0x063f4d)
              material.emissiveIntensity = 0.22
            }
          }
        })
        scene.add(root)

        const trachea = centerOf(sourceObjectFor('resp:trachea', byName))
        const rightMain = centerOf(sourceObjectFor('resp:right-main-bronchus', byName))
        const leftMain = centerOf(sourceObjectFor('resp:left-main-bronchus', byName))
        routes = RESPIRATORY_ATLAS_NODES
          .filter((node) => node.id.startsWith('resp:segment:'))
          .map((node) => {
            const segment = centerOf(sourceObjectFor(node.id, byName))
            const main = node.laterality === 'right' ? rightMain : leftMain
            return routeCurve(trachea, main, segment)
          })
          .filter((curve): curve is THREE.CatmullRomCurve3 => Boolean(curve))

        const box = new THREE.Box3()
        for (const mesh of visibleMeshes) box.expandByObject(mesh)
        if (box.isEmpty()) {
          setError('The shipped respiratory source geometry could not be resolved.')
          setLoading(false)
          return
        }
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const span = Math.max(size.x, size.y, size.z, 0.05)
        controls.target.copy(center)
        camera.position.set(center.x + span * 0.22, center.y + span * 0.08, center.z + span * 2.15)
        camera.lookAt(center)

        if (routes.length) {
          particleGeometry = new THREE.SphereGeometry(span * 0.008, 8, 6)
          particleMaterial = new THREE.MeshBasicMaterial({ color: 0x4de4ff, transparent: true, opacity: 0.78, depthWrite: false })
          particleMesh = new THREE.InstancedMesh(particleGeometry, particleMaterial, routes.length * PARTICLES_PER_ROUTE)
          particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
          particleMesh.frustumCulled = false
          scene.add(particleMesh)
        }

        setRouteCount(routes.length)
        setLoading(false)
      },
      undefined,
      () => {
        if (!disposed) {
          setError('Could not load the shipped respiratory source geometry.')
          setLoading(false)
        }
      },
    )

    const clock = new THREE.Clock()
    const temp = new THREE.Object3D()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let inViewport = true
    let documentVisible = !document.hidden

    const render = () => {
      raf = 0
      if (!inViewport || !documentVisible) return
      const elapsed = reducedMotion ? 0 : clock.getElapsedTime()
      const visual = respiratoryFlowVisualState(elapsed, phaseRef.current)

      for (const material of lungMaterials) {
        material.emissive.setRGB(0.02, 0.22 * visual.lungEmphasis, 0.28 * visual.lungEmphasis)
        material.emissiveIntensity = 1
      }

      if (particleMesh && particleMaterial && routes.length) {
        particleMaterial.opacity = reducedMotion ? 0.28 : visual.particleOpacity
        let instance = 0
        for (const route of routes) {
          for (let offset = 0; offset < PARTICLES_PER_ROUTE; offset++) {
            const base = phaseRef.current === 'exchange'
              ? (offset + 1) / (PARTICLES_PER_ROUTE + 1)
              : (visual.progress + offset / PARTICLES_PER_ROUTE) % 1
            temp.position.copy(route.getPointAt(base))
            temp.scale.setScalar(phaseRef.current === 'exchange' ? 0.72 : 1)
            temp.updateMatrix()
            particleMesh.setMatrixAt(instance++, temp.matrix)
          }
        }
        particleMesh.instanceMatrix.needsUpdate = true
      }

      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }

    const start = () => {
      if (!raf && inViewport && documentVisible) raf = requestAnimationFrame(render)
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewport = Boolean(entry?.isIntersecting)
      if (inViewport) start()
      else stop()
    }, { rootMargin: '128px' })
    intersectionObserver.observe(container)
    const onVisibility = () => {
      documentVisible = !document.hidden
      if (documentVisible) start()
      else stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      disposed = true
      stop()
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      controls.dispose()
      particleGeometry?.dispose()
      particleMaterial?.dispose()
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        const material = mesh.material as THREE.Material | THREE.Material[]
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
        else material.dispose()
      })
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <figure className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-neutral-950">
      <div className="relative">
        <div ref={containerRef} style={{ height }} className="w-full" aria-hidden="true" />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-cyan-300/20 bg-black/60 px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-cyan-200 backdrop-blur">
          {phase} · {routeCount || '—'} source routes
        </div>
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center" role="status" aria-live="polite">
            <span className="text-xs font-semibold text-neutral-400">Loading respiratory source geometry…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4" role="alert">
            <span className="text-center text-xs font-semibold text-neutral-400">{error}</span>
          </div>
        )}
      </div>
      <figcaption className="border-t border-white/10 px-3 py-2 text-[9px] leading-relaxed text-neutral-400">
        Source-geometry directional cue from trachea through main and segmental bronchi. Particles indicate educational direction only—not measured airflow, pressure, ventilation, V/Q or patient physiology. Source meshes are not deformed to imitate breathing.
      </figcaption>
    </figure>
  )
}

export default RespiratoryFlow3D
