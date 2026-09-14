import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { body3dPixelRatio } from '../lib/body3dQuality'
import { folderModel, type OrganModel } from '../lib/organModels'

interface Props {
  organ: OrganModel
  selected?: string | null
  onSelect?: (hotspotId: string | null) => void
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.geometry.dispose()
    const material = mesh.material as THREE.Material | THREE.Material[]
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
    else material.dispose()
  })
}

export function OrganModel3D({ organ, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [pct, setPct] = useState(0)
  const [fatal, setFatal] = useState('')
  const [layar, setLayar] = useState<Record<string, { x: number; y: number; depan: boolean }>>({})
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setLoading(true)
    setPct(0)
    setFatal('')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setFatal('This device could not start 3D graphics (WebGL).')
      setLoading(false)
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.domElement.dataset.organModel3d = 'true'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(2, 3, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffffff, 0.4)
    rim.position.set(-3, 1, -3)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotateSpeed = 0.7

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w < 2 || h < 2) return
      const mobile = window.matchMedia('(max-width: 640px)').matches
      renderer.setPixelRatio(body3dPixelRatio(w, h, window.devicePixelRatio || 1, mobile))
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    let group: THREE.Group | null = null
    let disposed = false
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      `${import.meta.env.BASE_URL}${folderModel(organ)}/${organ.id}.glb`,
      (gltf) => {
        if (disposed) {
          disposeObject3D(gltf.scene)
          return
        }
        group = gltf.scene
        const box = new THREE.Box3().setFromObject(group)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const skala = 2.6 / Math.max(size.x, size.y, size.z, 0.001)
        group.scale.setScalar(skala)
        group.position.set(-center.x * skala, -center.y * skala, -center.z * skala)
        scene.add(group)
        camera.position.set(0, 0.4, 4.6)
        controls.target.set(0, 0, 0)
        controls.update()
        let jumlahMesh = 0
        group.traverse((object) => { if ((object as THREE.Mesh).isMesh) jumlahMesh += 1 })
        renderer.domElement.dataset.organMesh = String(jumlahMesh)
        setLoading(false)
      },
      (event) => { if (!disposed && event.total > 0) setPct(event.loaded / event.total) },
      () => {
        if (disposed) return
        setFatal('Could not load this organ model.')
        setLoading(false)
      },
    )

    let raf = 0
    let inViewport = true
    let documentVisible = !document.hidden

    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      stop()
      setFatal('The browser dropped the 3D context, usually because memory ran low.')
      setLoading(false)
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)

    const stopAuto = () => { controls.autoRotate = false }
    renderer.domElement.addEventListener('pointerdown', stopAuto)

    const vector = new THREE.Vector3()
    function animate() {
      raf = 0
      if (!inViewport || !documentVisible || disposed) return
      controls.update()
      renderer.render(scene, camera)
      if (group) {
        const w = container.clientWidth
        const h = container.clientHeight
        const next: Record<string, { x: number; y: number; depan: boolean }> = {}
        for (const spot of organ.hotspots) {
          vector.set(spot.position[0], spot.position[1], spot.position[2])
          group.localToWorld(vector)
          const jarakKamera = vector.distanceTo(camera.position)
          vector.project(camera)
          next[spot.id] = {
            x: ((vector.x + 1) / 2) * w,
            y: ((1 - vector.y) / 2) * h,
            depan: jarakKamera < camera.position.length() + 0.4,
          }
        }
        setLayar(next)
      }
      raf = requestAnimationFrame(animate)
    }

    const start = () => {
      if (!raf && inViewport && documentVisible && !disposed) raf = requestAnimationFrame(animate)
    }

    const io = new IntersectionObserver(([entry]) => {
      inViewport = Boolean(entry?.isIntersecting)
      if (inViewport) start()
      else stop()
    }, { rootMargin: '128px' })
    io.observe(container)

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
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('pointerdown', stopAuto)
      controls.dispose()
      disposeObject3D(scene)
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement)
    }
  }, [organ])

  return (
    <div
      className="relative h-[300px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950"
      role="region"
      aria-label={`${organ.label} source 3D model`}
      aria-busy={loading}
    >
      <div ref={containerRef} className="h-full w-full touch-none" aria-hidden="true" />

      {organ.hotspots.map((spot) => {
        const pos = layar[spot.id]
        if (!pos || loading || fatal) return null
        const aktif = selected === spot.id
        return (
          <button
            key={spot.id}
            type="button"
            onClick={() => onSelectRef.current?.(aktif ? null : spot.id)}
            style={{ left: pos.x, top: pos.y, opacity: pos.depan ? 1 : 0.35 }}
            className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={spot.ta}
            aria-pressed={aktif}
          >
            <span
              aria-hidden="true"
              className={`block rounded-full border-2 border-white transition ${aktif ? 'h-5 w-5 bg-brand' : 'h-3.5 w-3.5'}`}
              style={!aktif ? { background: spot.color } : undefined}
            />
          </button>
        )
      })}

      {loading && !fatal && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status" aria-live="polite">
          <div className="rounded-xl bg-black/60 px-3 py-2 text-center">
            <span className="text-xs font-semibold text-white">Loading {organ.label.toLowerCase()}…</span>
            <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round(pct * 100)}%` }} />
            </div>
          </div>
        </div>
      )}
      {fatal && (
        <div className="absolute inset-0 flex items-center justify-center p-5" role="alert">
          <p className="text-center text-xs leading-relaxed text-neutral-500">{fatal}</p>
        </div>
      )}
      {!loading && !fatal && (
        <p className="pointer-events-none absolute bottom-1.5 left-0 right-0 text-center text-[10px] text-neutral-500" aria-live="polite">
          3D ready · drag to rotate · tap a marker to name the part
        </p>
      )}
    </div>
  )
}

export default OrganModel3D
