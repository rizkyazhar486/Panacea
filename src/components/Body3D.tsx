import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ─────────────────────────────────────────────────────────────────────────────
// Model 3D anatomi NYATA — bukan bentuk geometris buatan sendiri (bola/kapsul/
// Lathe), dan bukan siluet 2D. Berkas .glb di /public/anatomy/*.glb diturunkan
// dari Z-Anatomy (atlas anatomi 3D open-source, sendiri diturunkan dari
// BodyParts3D), lisensi CC BY-SA 4.0 — lihat /public/anatomy/CREDITS.txt.
//
// Tiap tulang/otot/pembuluh/saraf/organ adalah NODE TERPISAH dengan nama asli
// (mis. "Rectus femoris muscle.l", "Femur.r") -- tidak digabung saat ekspor --
// supaya raycast klik bisa mengidentifikasi satu struktur spesifik, bukan
// cuma satu lapisan sistem. Warna materialnya diganti dari shader Blender asli
// (yang bergantung efek viewport Blender) ke warna PBR datar memakai konvensi
// atlas anatomi baku (otot=merah, arteri=merah, vena=biru, saraf=kuning,
// tulang=krem, dst).
// ─────────────────────────────────────────────────────────────────────────────

export interface AnatomyLayer {
  key: 'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid'
  label: string
  file: string
  defaultOn: boolean
}

export const ANATOMY_LAYERS: AnatomyLayer[] = [
  { key: 'surface', label: 'Skin', file: 'surface.glb', defaultOn: false },
  { key: 'skeletal', label: 'Skeleton', file: 'skeletal.glb', defaultOn: true },
  { key: 'muscular', label: 'Muscles', file: 'muscular.glb', defaultOn: true },
  { key: 'cardiovascular', label: 'Vessels', file: 'cardiovascular.glb', defaultOn: false },
  { key: 'nervous', label: 'Nerves', file: 'nervous.glb', defaultOn: false },
  { key: 'visceral', label: 'Organs', file: 'visceral.glb', defaultOn: false },
  { key: 'lymphoid', label: 'Lymphatic', file: 'lymphoid.glb', defaultOn: false },
]

/** "Rectus femoris muscle.l" -> "Rectus femoris muscle (left)" */
export function humanizeStructureName(raw: string): string {
  let n = raw
  if (n.endsWith('.l')) n = n.slice(0, -2) + ' (left)'
  else if (n.endsWith('.r')) n = n.slice(0, -2) + ' (right)'
  return n.charAt(0).toUpperCase() + n.slice(1)
}

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)

// GLTFLoader selalu men-sanitasi nama node lewat PropertyBinding.sanitizeNodeName
// (spasi -> "_", lalu buang karakter "[]. :/" termasuk titik pemisah ".l"/".r")
// supaya aman dipakai sebagai target animasi -- jadi object3D.name di scene
// yang sudah dimuat TIDAK LAGI sama dengan nama asli di file ("Femur.r" jadi
// "Femurr"). Nama asli (dengan spasi & titik utuh) diselamatkan ke
// userData.originalName lewat parser.associations sebelum informasi itu
// hilang, supaya identifikasi/pencarian tetap presisi ke nama anatomi nyata.
function restoreOriginalNames(gltf: import('three/examples/jsm/loaders/GLTFLoader.js').GLTF) {
  const nodes = gltf.parser.json.nodes as Array<{ name?: string }> | undefined
  if (!nodes) return
  gltf.scene.traverse((obj) => {
    const assoc = gltf.parser.associations.get(obj) as { nodes?: number } | undefined
    const nodeIndex = assoc?.nodes
    if (nodeIndex !== undefined && nodes[nodeIndex]?.name) {
      obj.userData.originalName = nodes[nodeIndex].name
    }
  })
}

const modelCache = new Map<string, Promise<THREE.Group>>()
function loadLayer(file: string): Promise<THREE.Group> {
  let p = modelCache.get(file)
  if (!p) {
    p = new Promise((resolve, reject) => {
      loader.load(
        `${import.meta.env.BASE_URL}anatomy/${file}`,
        (gltf) => {
          restoreOriginalNames(gltf)
          resolve(gltf.scene)
        },
        undefined,
        reject,
      )
    })
    modelCache.set(file, p)
  }
  return p
}

const HIGHLIGHT = new THREE.Color(0x00bf63)

// ─── Mode tampilan radiologi ────────────────────────────────────────────────
//
// Model 3D-nya diwarnai ulang meniru cara tiap modalitas pencitraan
// "melihat" jaringan. Ini RENDER, bukan hasil pindai: bentuk dan letaknya
// nyata (dari data BodyParts3D), tapi derajat keabuannya pendekatan, bukan
// ukuran atenuasi atau intensitas sinyal sungguhan. Karena itu tab citra di
// bawah viewer mengambil rontgen/CT/MRI ASLI dari arsip — yang ini untuk
// memahami ruang tiga dimensinya, yang itu untuk mengenali tampilan aslinya.
//
// Nilainya mengikuti perilaku fisik tiap modalitas, bukan selera warna:
//   - Rontgen: berkasnya menembus dan MENUMPUK, jadi lapisannya digambar
//     additive & tembus pandang — makin banyak jaringan bertumpuk, makin
//     terang. Tulang menyerap paling banyak, jadi paling jelas.
//   - CT: skala abu-abu mengikuti radiodensitas (tulang putih, otot abu
//     madya, lemak/rongga gelap).
//   - MRI: nyaris kebalikan CT. Tulang kortikal hampir tanpa sinyal (gelap),
//     jaringan lunak dan saraf justru paling terang; darah yang mengalir
//     memberi flow void yang gelap.
export type RenderMode = 'anatomy' | 'xray' | 'ct' | 'mri'

export const RENDER_MODES: Array<{ key: RenderMode; label: string; hint: string }> = [
  { key: 'anatomy', label: 'Anatomy', hint: 'True anatomical colours' },
  { key: 'xray', label: 'X-ray', hint: 'Overlapping tissue accumulates — bone reads brightest' },
  { key: 'ct', label: 'CT', hint: 'Greyscale by radiodensity — bone white, soft tissue mid-grey' },
  { key: 'mri', label: 'MRI', hint: 'Soft tissue and nerves bright; cortical bone nearly signal-free' },
]

type LayerKey = AnatomyLayer['key']

/** Warna per lapisan untuk tiap modalitas. */
const RADIOLOGY_TONES: Record<Exclude<RenderMode, 'anatomy'>, Record<LayerKey, { color: number; opacity: number }>> = {
  xray: {
    skeletal: { color: 0xdce8ff, opacity: 0.9 },
    muscular: { color: 0x8fa6cc, opacity: 0.14 },
    surface: { color: 0x7f93b8, opacity: 0.07 },
    cardiovascular: { color: 0xa8bce0, opacity: 0.24 },
    nervous: { color: 0x9aaed2, opacity: 0.16 },
    visceral: { color: 0xb0c2e4, opacity: 0.3 },
    lymphoid: { color: 0x93a7cb, opacity: 0.13 },
  },
  ct: {
    skeletal: { color: 0xf4f4f4, opacity: 1 },
    muscular: { color: 0x6e6e6e, opacity: 1 },
    surface: { color: 0x3a3a3a, opacity: 1 },
    cardiovascular: { color: 0x8c8c8c, opacity: 1 },
    nervous: { color: 0x707070, opacity: 1 },
    visceral: { color: 0x5d5d5d, opacity: 1 },
    lymphoid: { color: 0x585858, opacity: 1 },
  },
  mri: {
    skeletal: { color: 0x303030, opacity: 1 },
    muscular: { color: 0x9a9a9a, opacity: 1 },
    surface: { color: 0x6a6a6a, opacity: 1 },
    cardiovascular: { color: 0x484848, opacity: 1 },
    nervous: { color: 0xdcdcdc, opacity: 1 },
    visceral: { color: 0xbcbcbc, opacity: 1 },
    lymphoid: { color: 0xa8a8a8, opacity: 1 },
  },
}

const MODE_BACKGROUND: Record<RenderMode, number> = {
  anatomy: 0x0a0a0f,
  xray: 0x04060c,
  ct: 0x000000,
  mri: 0x000000,
}

// Materialnya dibuat sekali per (lapisan x modalitas) lalu dipakai bersama —
// puluhan ribu mesh tidak boleh masing-masing punya salinan sendiri. Sorotan
// hijau tetap presisi karena efek sorot mengkloning dulu sebelum mengubah.
const radiologyMaterialCache = new Map<string, THREE.MeshStandardMaterial>()
function radiologyMaterial(layer: LayerKey, mode: Exclude<RenderMode, 'anatomy'>): THREE.MeshStandardMaterial {
  const cacheKey = `${mode}:${layer}`
  let mat = radiologyMaterialCache.get(cacheKey)
  if (!mat) {
    const tone = RADIOLOGY_TONES[mode][layer]
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(tone.color),
      roughness: 0.95,
      metalness: 0,
      transparent: mode === 'xray',
      opacity: tone.opacity,
      // Rontgen menumpuk: berkas yang lolos beberapa lapis jaringan
      // menghasilkan gambar yang lebih terang, jadi additive tanpa menulis
      // depth supaya urutan gambar tidak menyembunyikan lapisan di belakang.
      blending: mode === 'xray' ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: mode !== 'xray',
      side: mode === 'xray' ? THREE.DoubleSide : THREE.FrontSide,
    })
    radiologyMaterialCache.set(cacheKey, mat)
  }
  return mat
}

interface Props {
  layers: Set<AnatomyLayer['key']>
  /** Node names (exact, e.g. "Rectus femoris muscle.l") to highlight in green — 0, 1 or many at once. */
  highlighted: string[]
  /**
   * Substring keywords (case-insensitive) matched against every structure's
   * real name — for organs split into many named parts (lungs, liver
   * segments, brain gyri) where listing every exact name isn't practical.
   * When set, matching structures are highlighted AND the camera zooms to
   * frame just that organ; clearing it restores the whole-body framing.
   */
  focusKeywords: string[] | null
  /** Imaging look applied to the model: true colour, or X-ray / CT / MRI. */
  renderMode: RenderMode
  /** Fires with the raw node name and a human-readable label when the user taps a structure. */
  onPick: (rawName: string, label: string) => void
}

export function Body3D({ layers, highlighted, focusKeywords, renderMode, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const groupsRef = useRef<Partial<Record<AnatomyLayer['key'], THREE.Group>>>({})
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const homeFramingRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3; minDistance: number; maxDistance: number } | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const lightsRef = useRef<{ ambient: THREE.AmbientLight; key: THREE.DirectionalLight; fill: THREE.DirectionalLight } | null>(null)
  const hasFitRef = useRef(false)
  const highlightedMeshesRef = useRef<Map<THREE.Mesh, { original: THREE.Color; matchedName: string }>>(new Map())
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
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
    rendererRef.current = renderer

    // Cahaya dijaga tetap moderat -- terlalu terang membuat channel merah
    // pada material otot "clip" ke putih lebih cepat dari channel hijau/biru,
    // sehingga merah pekat terlihat pudar jadi oranye/cokelat.
    const ambient = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xffffff, 0.65)
    key.position.set(2, 4, 3)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.25)
    fill.position.set(-3, 1, -2)
    scene.add(fill)
    lightsRef.current = { ambient, key, fill }

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

    // Raycast pada tap/klik (bukan drag-rotate) untuk mengidentifikasi satu
    // struktur spesifik yang disentuh pengguna.
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let downPos: { x: number; y: number } | null = null

    const toPointer = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    const onPointerDown = (e: PointerEvent) => { downPos = { x: e.clientX, y: e.clientY } }
    const onPointerUp = (e: PointerEvent) => {
      if (!downPos) return
      const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y)
      downPos = null
      if (moved > 6) return // drag-to-rotate, not a tap
      toPointer(e)
      raycaster.setFromCamera(pointer, camera)
      const targets = Object.values(groupsRef.current).filter((g): g is THREE.Group => !!g)
      const hits = raycaster.intersectObjects(targets, true)
      if (hits.length === 0) return
      let obj: THREE.Object3D | null = hits[0].object
      while (obj && !obj.userData.originalName) obj = obj.parent
      if (obj) {
        const rawName = obj.userData.originalName as string
        onPickRef.current(rawName, humanizeStructureName(rawName))
      }
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
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
            // Material anatomi asli disimpan di tiap mesh SEBELUM mode
            // radiologi sempat menggantinya, supaya kembali ke "Anatomy"
            // selalu memulihkan warna yang benar dan bukan salinan abu-abu.
            clone.traverse((child) => {
              if (child instanceof THREE.Mesh) child.userData.baseMaterial = child.material
              // Z-Anatomy menitipkan satu objek teks petunjuk ("HOW TO ...")
              // di tiap koleksi. Itu bukan struktur anatomi: ia bisa ikut
              // terkena raycast, dan pada mode rontgen yang additive ia malah
              // menyala terang di antara tungkai. Disembunyikan di semua mode.
              const name = child.userData.originalName as string | undefined
              if (name && name.startsWith('HOW TO')) child.visible = false
            })
            // Nama itu menempel di node induknya, bukan di mesh anaknya, jadi
            // node bernama itu sendiri juga perlu dipadamkan.
            clone.traverse((obj) => {
              const name = obj.userData.originalName as string | undefined
              if (name && name.startsWith('HOW TO')) obj.visible = false
            })
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
                homeFramingRef.current = {
                  position: camera.position.clone(),
                  target: center.clone(),
                  minDistance: controls.minDistance,
                  maxDistance: controls.maxDistance,
                }
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

  // Terapkan modalitas pencitraan ke seluruh mesh yang sedang tampil.
  //
  // Sorotan hijau dibersihkan lebih dulu: materialnya memang sedang diganti,
  // jadi catatan "warna emissive sebelumnya" milik material lama tidak lagi
  // menunjuk ke apa pun yang terpasang. Efek sorot di bawah ikut bergantung
  // pada renderMode, jadi sorotannya langsung dipasang ulang di atas material
  // yang baru.
  useEffect(() => {
    highlightedMeshesRef.current.clear()
    for (const def of ANATOMY_LAYERS) {
      const group = groupsRef.current[def.key]
      if (!group) continue
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        child.material =
          renderMode === 'anatomy'
            ? (child.userData.baseMaterial as THREE.Material)
            : radiologyMaterial(def.key, renderMode)
      })
    }
    rendererRef.current?.setClearColor(MODE_BACKGROUND[renderMode], 1)
    // Rontgen butuh cahaya lebih rata: bayangan terarah membuat tumpukan
    // jaringan terbaca sebagai bentuk padat bercahaya, bukan sebagai bayangan
    // yang saling menembus.
    const lights = lightsRef.current
    if (lights) {
      const flat = renderMode === 'xray'
      lights.ambient.intensity = flat ? 1.1 : 0.45
      lights.key.intensity = flat ? 0.15 : 0.65
      lights.fill.intensity = flat ? 0.1 : 0.25
    }
  }, [renderMode, loadingLayers])

  // Sorot (hijau) struktur yang sedang dipilih/ditarget, pulihkan warna
  // struktur yang sebelumnya disorot tapi sudah tidak lagi ada di daftar.
  //
  // Satu node bernama (mis. "Long head of biceps brachii.l") bisa berupa
  // Mesh langsung (mesh 1 primitif) ATAU Group berisi beberapa Mesh anak
  // tak-bernama (mesh multi-primitif) -- jadi pencocokan nama dilakukan di
  // level node manapun, lalu semua Mesh di BAWAHNYA (termasuk dirinya
  // sendiri) yang disorot. Nama node yang cocok disimpan bersama tiap mesh
  // supaya proses "lepas sorotan" tidak bergantung pada mesh.name (yang bisa
  // saja kosong untuk anak dari node multi-primitif).
  useEffect(() => {
    const exact = new Set(highlighted)
    const keywords = (focusKeywords ?? []).map((k) => k.toLowerCase())
    const matches = (name: string) => exact.has(name) || keywords.some((k) => name.toLowerCase().includes(k))
    const current = highlightedMeshesRef.current

    for (const [mesh, entry] of current) {
      if (!matches(entry.matchedName)) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.emissive.copy(entry.original)
        mat.emissiveIntensity = 0
        current.delete(mesh)
      }
    }

    const groups = Object.values(groupsRef.current).filter((g): g is THREE.Group => !!g)
    const focusBox = focusKeywords && focusKeywords.length > 0 ? new THREE.Box3() : null
    for (const group of groups) {
      group.traverse((obj) => {
        const originalName = obj.userData.originalName as string | undefined
        if (!originalName || !matches(originalName)) return
        if (focusBox) focusBox.expandByObject(obj)
        obj.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return
          if (current.has(child)) return
          const shared = child.material as THREE.MeshStandardMaterial
          if (!shared || !('emissive' in shared)) return
          // Materialnya BERBAGI satu instance dengan ratusan mesh lain
          // yang warnanya sama (mis. "Flat_Internal rotator" dipakai 232
          // otot) -- kalau emissive-nya diubah langsung, semua yang
          // berbagi material itu ikut menyala hijau, bukan cuma struktur
          // yang disentuh/ditarget. Kloning dulu supaya sorotan benar-benar
          // presisi.
          const mat = shared.clone()
          child.material = mat
          current.set(child, { original: mat.emissive.clone(), matchedName: originalName })
          mat.emissive = HIGHLIGHT.clone()
          mat.emissiveIntensity = 0.55
        })
      })
    }

    // Zoom kamera ke organ yang ditarget, atau kembali ke bingkai seluruh
    // tubuh kalau target organnya dibersihkan.
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    if (focusBox && !focusBox.isEmpty()) {
      const center = focusBox.getCenter(new THREE.Vector3())
      const size = focusBox.getSize(new THREE.Vector3())
      const radius = Math.max(size.length() * 0.5, 0.03)
      // Banyak organ target (jantung, paru, ginjal, hati) ada DI DALAM
      // rongga tubuh, di balik tulang rusuk/otot yang masih terlihat. Jarak
      // kamera dihitung dari ukuran organ itu sendiri saja akan menaruh
      // kamera di tengah dinding dada -- dikalikan lebih besar supaya kamera
      // tetap di luar jaringan yang menutupinya, bukan menembusnya.
      const dist = Math.max(radius * 8, 0.35)
      let dir = camera.position.clone().sub(controls.target)
      if (dir.lengthSq() < 1e-8) dir = new THREE.Vector3(0, 0.15, 1)
      dir.normalize()
      camera.position.copy(center.clone().add(dir.multiplyScalar(dist)))
      controls.target.copy(center)
      controls.minDistance = dist * 0.3
      controls.maxDistance = dist * 8
      controls.update()
    } else if (!focusKeywords && homeFramingRef.current) {
      const home = homeFramingRef.current
      camera.position.copy(home.position)
      controls.target.copy(home.target)
      controls.minDistance = home.minDistance
      controls.maxDistance = home.maxDistance
      controls.update()
    }
  }, [highlighted, focusKeywords, loadingLayers, renderMode])

  const isLoading = loadingLayers.size > 0

  return (
    <div className="relative h-[65vh] max-h-[780px] min-h-[460px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950">
      <div ref={containerRef} className="h-full w-full touch-none" />
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
