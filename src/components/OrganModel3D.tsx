import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { OrganModel } from '../lib/organModels'

// Penampil satu organ dari dekat. Lihat src/lib/organModels.ts untuk asal
// modelnya dan kenapa bagiannya ditandai titik, bukan lewat raycast nama.

interface Props {
  organ: OrganModel
  /** Hotspot yang sedang dipilih, kalau ada. */
  selected?: string | null
  onSelect?: (hotspotId: string | null) => void
}

export function OrganModel3D({ organ, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [pct, setPct] = useState(0)
  const [fatal, setFatal] = useState('')
  // Posisi layar tiap hotspot, dihitung ulang tiap frame. Titiknya digambar
  // sebagai HTML di atas kanvas, bukan sebagai objek 3D: teksnya jadi tetap
  // tajam, bisa dibaca pembaca layar, dan sasaran sentuhnya cukup besar di
  // ponsel tanpa ikut membesar saat model diperbesar.
  const [layar, setLayar] = useState<Record<string, { x: number; y: number; depan: boolean }>>({})
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setFatal('This device could not start 3D graphics (WebGL).')
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
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
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.7

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    let group: THREE.Group | null = null
    const loader = new GLTFLoader()
    loader.load(
      `${import.meta.env.BASE_URL}organs/${organ.id}.glb`,
      (gltf) => {
        group = gltf.scene
        // Model dinormalkan ke ukuran & titik pusat yang sama, karena berkas
        // aslinya tidak sepakat soal skala — tanpa ini ginjal bisa datang
        // sebesar otak.
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
        setLoading(false)
      },
      (ev) => { if (ev.total > 0) setPct(ev.loaded / ev.total) },
      () => { setFatal('Could not load this organ model.'); setLoading(false) },
    )

    const onContextLost = (e: Event) => {
      e.preventDefault()
      setFatal('The browser dropped the 3D context, usually because memory ran low.')
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)

    // Berhenti berputar begitu pengguna menyentuh — memutar sendiri itu
    // undangan, bukan sesuatu yang harus dilawan saat orang mau mengarahkan.
    const stopAuto = () => { controls.autoRotate = false }
    renderer.domElement.addEventListener('pointerdown', stopAuto)

    const v = new THREE.Vector3()
    let raf = 0
    function animate() {
      controls.update()
      renderer.render(scene, camera)
      // Proyeksikan tiap hotspot ke koordinat layar.
      if (group) {
        const w = container!.clientWidth
        const h = container!.clientHeight
        const next: Record<string, { x: number; y: number; depan: boolean }> = {}
        for (const spot of organ.hotspots) {
          v.set(spot.position[0], spot.position[1], spot.position[2])
          group.localToWorld(v)
          const jarakKamera = v.distanceTo(camera.position)
          v.project(camera)
          next[spot.id] = {
            x: ((v.x + 1) / 2) * w,
            y: ((1 - v.y) / 2) * h,
            // Titik di sisi belakang organ diredupkan supaya tidak tampak
            // mengambang di depan padahal ada di baliknya.
            depan: jarakKamera < camera.position.length() + 0.4,
          }
        }
        setLayar(next)
      }
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('pointerdown', stopAuto)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [organ])

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950">
      <div ref={containerRef} className="h-full w-full touch-none" />

      {organ.hotspots.map((spot) => {
        const pos = layar[spot.id]
        if (!pos || loading || fatal) return null
        const aktif = selected === spot.id
        return (
          <button
            key={spot.id}
            onClick={() => onSelectRef.current?.(aktif ? null : spot.id)}
            style={{ left: pos.x, top: pos.y, opacity: pos.depan ? 1 : 0.35 }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition ${
              aktif ? 'h-5 w-5 border-white bg-brand' : 'h-3.5 w-3.5 border-white/90'
            }`}
            aria-label={spot.ta}
          >
            <span className="sr-only">{spot.ta}</span>
            {!aktif && <span className="block h-full w-full rounded-full" style={{ background: spot.color }} />}
          </button>
        )
      })}

      {loading && !fatal && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl bg-black/60 px-3 py-2 text-center">
            <span className="text-xs font-semibold text-white">Loading {organ.label.toLowerCase()}…</span>
            <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round(pct * 100)}%` }} />
            </div>
          </div>
        </div>
      )}
      {fatal && (
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <p className="text-center text-xs leading-relaxed text-neutral-500">{fatal}</p>
        </div>
      )}
      {!loading && !fatal && (
        <p className="pointer-events-none absolute bottom-1.5 left-0 right-0 text-center text-[10px] text-neutral-500">
          Drag to rotate · tap a marker to name the part
        </p>
      )}
    </div>
  )
}

export default OrganModel3D
