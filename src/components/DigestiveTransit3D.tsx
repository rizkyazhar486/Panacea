import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { body3dPixelRatio } from '../lib/body3dQuality'
import {
  DIGESTIVE_SEQUENCE,
  digestiveTransitVisualState,
  type DigestiveStage,
} from '../lib/digestiveTransitVisual'

interface Props {
  focus: DigestiveStage
  running: boolean
  height?: number
}

type DigestiveGroupId = DigestiveStage | 'liver' | 'gallbladder' | 'pancreas'

const GROUP_TOKENS: Record<DigestiveGroupId, readonly string[]> = {
  esophagus: ['esophagus', 'oesophagus'],
  stomach: ['stomach'],
  duodenum: ['duodenum'],
  'small-bowel': ['jejunum', 'ileum', 'small intestine'],
  colon: ['colon', 'caecum', 'cecum', 'large intestine', 'sigmoid'],
  rectum: ['rectum'],
  liver: ['liver'],
  gallbladder: ['gallbladder', 'gall bladder'],
  pancreas: ['pancreas'],
}

const SEQUENCE_SET = new Set<DigestiveGroupId>(DIGESTIVE_SEQUENCE)

function normalizeName(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function groupForName(name: string): DigestiveGroupId | null {
  const normalized = normalizeName(name)
  for (const [group, tokens] of Object.entries(GROUP_TOKENS) as Array<[DigestiveGroupId, readonly string[]]>) {
    if (tokens.some((token) => normalized.includes(token))) return group
  }
  return null
}

function centerOf(object: THREE.Object3D): THREE.Vector3 | null {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return null
  return box.getCenter(new THREE.Vector3())
}

function averageCenter(meshes: readonly THREE.Mesh[]): THREE.Vector3 | null {
  const centers = meshes
    .map((mesh) => centerOf(mesh))
    .filter((center): center is THREE.Vector3 => Boolean(center))
  if (!centers.length) return null
  const average = new THREE.Vector3()
  for (const center of centers) average.add(center)
  return average.multiplyScalar(1 / centers.length)
}

export function DigestiveTransit3D({ focus, running, height = 350 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const focusRef = useRef(focus)
  const runningRef = useRef(running)
  focusRef.current = focus
  runningRef.current = running

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resolvedCount, setResolvedCount] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setError('This device could not start the digestive 3D render.')
      setLoading(false)
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.dataset.digestiveTransit3d = 'true'
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.82))
    const key = new THREE.DirectionalLight(0xfff2dc, 1.2)
    key.position.set(2, 3, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x63e6be, 0.45)
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

    const meshesByGroup = new Map<DigestiveGroupId, THREE.Mesh[]>()
    const materialsByGroup = new Map<DigestiveGroupId, THREE.MeshStandardMaterial[]>()
    let route: THREE.CatmullRomCurve3 | null = null
    let routeStagePoints: THREE.Vector3[] = []
    let particle: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null = null
    let root: THREE.Group | null = null
    let disposed = false

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      `${import.meta.env.BASE_URL}anatomy/visceral.glb`,
      (gltf) => {
        if (disposed) return
        root = gltf.scene

        root.traverse((object) => {
          if (!(object as THREE.Mesh).isMesh) return
          const mesh = object as THREE.Mesh
          const group = groupForName(mesh.name)
          mesh.visible = Boolean(group)
          if (!group) return

          const sourceMaterial = mesh.material as THREE.Material | THREE.Material[]
          if (Array.isArray(sourceMaterial)) {
            mesh.visible = false
            return
          }
          const cloned = sourceMaterial.clone()
          mesh.material = cloned
          const list = meshesByGroup.get(group) ?? []
          list.push(mesh)
          meshesByGroup.set(group, list)

          if ((cloned as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            const material = cloned as THREE.MeshStandardMaterial
            material.transparent = true
            material.depthWrite = false
            material.opacity = SEQUENCE_SET.has(group) ? 0.72 : 0.22
            const materials = materialsByGroup.get(group) ?? []
            materials.push(material)
            materialsByGroup.set(group, materials)
          }
        })

        scene.add(root)

        const sequenceCenters = DIGESTIVE_SEQUENCE.map((stage) => averageCenter(meshesByGroup.get(stage) ?? []))
        const resolved = sequenceCenters.filter(Boolean).length
        setResolvedCount(resolved)

        routeStagePoints = sequenceCenters.filter((point): point is THREE.Vector3 => Boolean(point))
        if (routeStagePoints.length >= 2) {
          route = new THREE.CatmullRomCurve3(routeStagePoints, false, 'centripetal')
        }

        const box = new THREE.Box3()
        for (const meshes of meshesByGroup.values()) {
          for (const mesh of meshes) box.expandByObject(mesh)
        }
        if (box.isEmpty()) {
          setError('The shipped visceral source geometry did not expose the expected digestive structures.')
          setLoading(false)
          return
        }

        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const span = Math.max(size.x, size.y, size.z, 0.05)
        controls.target.copy(center)
        camera.position.set(center.x + span * 0.34, center.y + span * 0.08, center.z + span * 2.3)
        camera.lookAt(center)

        if (route) {
          const geometry = new THREE.SphereGeometry(span * 0.013, 12, 8)
          const material = new THREE.MeshBasicMaterial({
            color: 0xffd166,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
          })
          particle = new THREE.Mesh(geometry, material)
          particle.renderOrder = 20
          scene.add(particle)
        }

        setLoading(false)
      },
      undefined,
      () => {
        if (!disposed) {
          setError('Could not load the shipped visceral source geometry.')
          setLoading(false)
        }
      },
    )

    const clock = new THREE.Clock()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let visualElapsed = 0
    let previous = 0
    let raf = 0
    let inViewport = true
    let documentVisible = !document.hidden

    const render = () => {
      raf = 0
      if (!inViewport || !documentVisible) return

      const now = clock.getElapsedTime()
      const delta = previous ? Math.min(0.1, Math.max(0, now - previous)) : 0
      previous = now
      if (runningRef.current && !reducedMotion) visualElapsed += delta

      const visual = digestiveTransitVisualState(visualElapsed)
      const active = focusRef.current
      for (const [group, materials] of materialsByGroup) {
        const selected = group === active
        const routeActive = runningRef.current && SEQUENCE_SET.has(group) && group === visual.activeStage
        for (const material of materials) {
          material.opacity = selected ? 0.96 : SEQUENCE_SET.has(group) ? 0.48 : 0.16
          material.emissive.set(selected ? 0x0f6f55 : routeActive ? 0x7d4b00 : 0x000000)
          material.emissiveIntensity = selected ? 0.72 : routeActive ? 0.5 : 0
        }
      }

      if (particle && route) {
        const t = runningRef.current && !reducedMotion ? visual.progress : 0
        particle.position.copy(route.getPointAt(t))
        particle.visible = runningRef.current && !reducedMotion && routeStagePoints.length >= 2
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
    <figure className="overflow-hidden rounded-2xl border border-amber-300/20 bg-neutral-950">
      <div className="relative">
        <div ref={containerRef} style={{ height }} className="w-full" aria-hidden="true" />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-amber-300/20 bg-black/60 px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-amber-100 backdrop-blur">
          digestive source · {resolvedCount || '—'}/{DIGESTIVE_SEQUENCE.length} route stages
        </div>
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center" role="status" aria-live="polite">
            <span className="text-xs font-semibold text-neutral-400">Loading digestive source geometry…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4" role="alert">
            <span className="text-center text-xs font-semibold text-neutral-400">{error}</span>
          </div>
        )}
      </div>
      <figcaption className="border-t border-white/10 px-3 py-2 text-[9px] leading-relaxed text-neutral-400">
        Organ surfaces come from the shipped visceral GLB. The moving dot is only a normalized orientation cue between resolved organ centres—not a reconstructed lumen, measured peristalsis, transit time, motility study, imaging result or patient-specific physiology. Missing source structures are not fabricated.
      </figcaption>
    </figure>
  )
}

export default DigestiveTransit3D
