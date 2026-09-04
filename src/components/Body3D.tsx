import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ─────────────────────────────────────────────────────────────────────────────
// Model 3D anatomi NYATA — bukan lagi bentuk geometris buatan sendiri (bola/
// kapsul/Lathe). Berkas .glb di /public/anatomy/*.glb diturunkan dari Z-Anatomy
// (proyek atlas anatomi 3D open-source, sendiri diturunkan dari BodyParts3D),
// lisensi CC BY-SA 4.0 — lihat /public/anatomy/CREDITS.txt untuk atribusi
// lengkap dan syarat lisensinya. Rangka, otot, pembuluh darah, saraf, dan organ
// benar-benar model anatomi yang dipahat, bukan pendekatan bentuk sederhana.
//
// Shader asli file sumbernya memakai efek Blender (rim light, ambient
// occlusion berbasis viewport) yang tidak bisa direproduksi identik di web,
// jadi tiap struktur diwarnai ulang jadi warna PBR datar memakai konvensi
// atlas anatomi baku (otot=merah, arteri=merah, vena=biru, saraf=kuning,
// tulang=krem, dst) — lihat alat/ekspor di riwayat sesi ini untuk detail.
//
// Karena geometri digabung per-material saat ekspor (supaya ukuran berkas
// tetap wajar untuk web/mobile — total ~18MB terbagi 5 lapisan), model ini
// TIDAK mendukung klik untuk mengidentifikasi satu otot/pembuluh spesifik;
// yang bisa dipilih hanya lapisan sistemnya (rangka/otot/pembuluh/saraf/
// organ). Untuk identifikasi per-region, pakai tampilan silhouette 2D.
// ─────────────────────────────────────────────────────────────────────────────

export interface AnatomyLayer {
  key: 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral'
  label: string
  file: string
  defaultOn: boolean
}

export const ANATOMY_LAYERS: AnatomyLayer[] = [
  { key: 'skeletal', label: 'Skeleton', file: 'skeletal.glb', defaultOn: true },
  { key: 'muscular', label: 'Muscles', file: 'muscular.glb', defaultOn: true },
  { key: 'cardiovascular', label: 'Vessels', file: 'cardiovascular.glb', defaultOn: false },
  { key: 'nervous', label: 'Nerves', file: 'nervous.glb', defaultOn: false },
  { key: 'visceral', label: 'Organs', file: 'visceral.glb', defaultOn: false },
]

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)

const modelCache = new Map<string, Promise<THREE.Group>>()
function loadLayer(file: string): Promise<THREE.Group> {
  let p = modelCache.get(file)
  if (!p) {
    p = new Promise((resolve, reject) => {
      loader.load(
        `${import.meta.env.BASE_URL}anatomy/${file}`,
        (gltf) => resolve(gltf.scene),
        undefined,
        reject,
      )
    })
    modelCache.set(file, p)
  }
  return p
}

export function Body3D({ layers }: { layers: Set<AnatomyLayer['key']> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const groupsRef = useRef<Partial<Record<AnatomyLayer['key'], THREE.Group>>>({})
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const hasFitRef = useRef(false)
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set())
  const [failedLayers, setFailedLayers] = useState<Set<string>>(new Set())

  // Inisialisasi Three.js sekali saja (renderer/kamera/kontrol bertahan
  // selama komponen hidup; hanya lapisan model yang berubah-ubah).
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100)
    camera.position.set(0, 1.3, 3.4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0a0a0f, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)

    // Cahaya dijaga tetap moderat -- terlalu terang membuat channel merah
    // pada material otot "clip" ke putih lebih cepat dari channel hijau/biru,
    // sehingga merah pekat terlihat pudar jadi oranye/cokelat.
    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
    const key = new THREE.DirectionalLight(0xffffff, 0.65)
    key.position.set(2, 4, 3)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.25)
    fill.position.set(-3, 1, -2)
    scene.add(fill)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.minDistance = 0.3
    controls.maxDistance = 12
    controls.target.set(0, 1.0, 0)
    controls.update()
    cameraRef.current = camera
    controlsRef.current = controls
    hasFitRef.current = false

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

    let raf = 0
    function animate() {
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
      sceneRef.current = null
    }
  }, [])

  // Muat/lepas lapisan sesuai toggle yang dipilih pengguna.
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    for (const def of ANATOMY_LAYERS) {
      const want = layers.has(def.key)
      const have = groupsRef.current[def.key]
      if (want && !have) {
        setLoadingLayers((s) => new Set(s).add(def.key))
        loadLayer(def.file)
          .then((group) => {
            const clone = group.clone(true)
            groupsRef.current[def.key] = clone
            scene.add(clone)
            setLoadingLayers((s) => { const n = new Set(s); n.delete(def.key); return n })
            // Bingkai kamera sekali saja berdasar bounding box lapisan
            // pertama yang termuat (semua lapisan berbagi ruang koordinat
            // tubuh yang sama), supaya tampilan tidak melompat tiap toggle.
            const camera = cameraRef.current
            const controls = controlsRef.current
            if (!hasFitRef.current && camera && controls) {
              const box = new THREE.Box3().setFromObject(clone)
              if (!box.isEmpty()) {
                const center = box.getCenter(new THREE.Vector3())
                const size = box.getSize(new THREE.Vector3())
                const height = Math.max(size.y, 0.1)
                const dist = height * 1.7
                camera.position.set(center.x, center.y + height * 0.05, center.z + dist)
                camera.near = Math.max(dist / 100, 0.01)
                camera.far = dist * 20
                camera.updateProjectionMatrix()
                controls.target.copy(center)
                controls.minDistance = dist * 0.15
                controls.maxDistance = dist * 4
                controls.update()
                hasFitRef.current = true
              }
            }
          })
          .catch(() => {
            setLoadingLayers((s) => { const n = new Set(s); n.delete(def.key); return n })
            setFailedLayers((s) => new Set(s).add(def.key))
          })
      } else if (!want && have) {
        scene.remove(have)
        delete groupsRef.current[def.key]
      }
    }
  }, [layers])

  const isLoading = loadingLayers.size > 0

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950">
      <div ref={containerRef} className="h-full w-full" />
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">Loading anatomy…</span>
        </div>
      )}
      {failedLayers.size > 0 && (
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-lg bg-red-950/80 px-2.5 py-1.5 text-[11px] text-red-200">
          Couldn't load: {[...failedLayers].join(', ')}
        </div>
      )}
    </div>
  )
}

export default Body3D
