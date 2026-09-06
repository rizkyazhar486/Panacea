import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { SEBAR_PERISTALTIK } from '../lib/motionWave'
import { keburaman, geserBuka, KEDALAMAN, type KunciLapisan } from '../lib/dissection'

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
function loadLayer(file: string, onProgress?: (pct: number) => void): Promise<THREE.Group> {
  let p = modelCache.get(file)
  if (!p) {
    p = new Promise((resolve, reject) => {
      loader.load(
        `${import.meta.env.BASE_URL}anatomy/${file}`,
        (gltf) => {
          restoreOriginalNames(gltf)
          resolve(gltf.scene)
        },
        // Berkasnya besar (cardiovascular.glb saja 12 MB). Tanpa laporan
        // kemajuan, unduhan lambat di jaringan seluler TIDAK BISA DIBEDAKAN
        // dari kerusakan: keduanya sama-sama kotak hitam yang diam.
        (ev) => { if (ev.total > 0 && onProgress) onProgress(ev.loaded / ev.total) },
        (err) => reject(err instanceof Error ? err : new Error(String(err))),
      )
    })
    modelCache.set(file, p)
  }
  return p
}

const HIGHLIGHT = new THREE.Color(0x00bf63)

function batasSatu(x: number) { return Math.max(0, Math.min(1, x)) }

function isDescendantOf(obj: THREE.Object3D, ancestor: THREE.Object3D): boolean {
  let p: THREE.Object3D | null = obj
  while (p) { if (p === ancestor) return true; p = p.parent }
  return false
}

// ─── Mode tampilan radiologi ────────────────────────────────────────────────
//
// KENAPA VERSI PERTAMA TIDAK BENAR, dan apa yang diperbaiki.
//
// Versi pertama sekadar mewarnai permukaan model dengan abu-abu pilihan lalu
// menyebutnya CT dan MRI. Hasilnya tampak "seperti radiologi" tapi tidak dapat
// dipakai: CT dan MRI TIDAK PERNAH dilihat sebagai permukaan tiga dimensi
// berwarna abu — keduanya dibaca sebagai POTONGAN LINTANG, irisan demi irisan.
// Menampilkan cangkang 3D abu-abu mengajarkan bentuk yang salah tentang
// bagaimana modalitas itu sebenarnya dipakai.
//
// Dua perbaikan, keduanya mengubah isinya, bukan gayanya:
//
//   1. NILAI KEABUANNYA SEKARANG BERASAL DARI ANGKA FISIS, bukan selera.
//      Untuk CT dipakai UNIT HOUNSFIELD nyata tiap jaringan (udara -1000,
//      lemak -100, air 0, otot +40, darah +45, tulang spongiosa +300, tulang
//      kortikal +1000) lalu dipetakan lewat WINDOWING — window width & level
//      yang sama seperti di konsol CT sungguhan. Karena itu ada pilihan
//      window: soft tissue (W400/L40), lung (W1500/L-600), bone (W2000/L400).
//      Mengubah window mengubah gambarnya persis seperti di stasiun kerja
//      radiologi, dan itulah keterampilan yang sebenarnya dilatih.
//      Untuk MRI dipakai INTENSITAS SINYAL relatif pada T1 dan T2 — dan
//      keduanya dipisah, karena "MRI" tanpa menyebut pembobotan tidak berarti
//      apa-apa: cairan gelap di T1 dan terang di T2, dan itu justru inti
//      pembacaannya.
//
//   2. ADA BIDANG POTONG. Mode CT dan MRI memotong model dengan bidang
//      aksial/koronal/sagital yang bisa digeser, memakai clipping plane —
//      sehingga yang dilihat adalah PENAMPANG pada ketinggian tertentu, cara
//      citra itu benar-benar dibaca.
//
// Yang tetap tidak berubah dan tetap dikatakan di layar: ini RENDER dari data
// mesh, bukan hasil pindai. Nilainya benar secara relatif dan diambil dari
// tabel baku, tetapi ia tidak mengukur pasien mana pun. Citra modalitas asli
// tetap disediakan lewat tab gambar.
export type RenderMode = 'anatomy' | 'xray' | 'ct' | 'mriT1' | 'mriT2'

/** Bidang potong untuk CT/MRI — cara citra lintang sungguhan dibaca. */
export type SlicePlane = 'none' | 'axial' | 'coronal' | 'sagittal'

/** Window CT: lebar & titik tengah dalam unit Hounsfield, seperti di konsol. */
export interface CtWindow { key: string; label: string; width: number; level: number }

export const CT_WINDOWS: CtWindow[] = [
  { key: 'soft', label: 'Soft tissue', width: 400, level: 40 },
  { key: 'lung', label: 'Lung', width: 1500, level: -600 },
  { key: 'bone', label: 'Bone', width: 2000, level: 400 },
]

export const RENDER_MODES: Array<{ key: RenderMode; label: string; hint: string }> = [
  { key: 'anatomy', label: 'Anatomy', hint: 'True anatomical colours' },
  { key: 'xray', label: 'X-ray', hint: 'Beam attenuation accumulates through overlapping tissue — dense bone absorbs most' },
  { key: 'ct', label: 'CT', hint: 'Hounsfield units mapped through a real CT window — change the window to change what you can see' },
  { key: 'mriT1', label: 'MRI T1', hint: 'Fat bright, fluid dark, cortical bone signal-void — the anatomy sequence' },
  { key: 'mriT2', label: 'MRI T2', hint: 'Fluid bright — the sequence that shows oedema and most pathology' },
]

type LayerKey = AnatomyLayer['key']

// Sifat fisis tiap lapisan jaringan. Angkanya nilai baku yang lazim dikutip
// di radiologi, bukan hasil pengukuran aplikasi ini.
//
//   hu : unit Hounsfield rata-rata (CT). Udara -1000, air 0 menurut definisi.
//   t1 : intensitas sinyal relatif pada MRI T1 (0 = void, 1 = paling terang).
//   t2 : intensitas sinyal relatif pada MRI T2.
//   mu : atenuasi relatif untuk rontgen — seberapa banyak berkas diserap.
interface SifatJaringan { hu: number; t1: number; t2: number; mu: number }

const JARINGAN: Record<LayerKey, SifatJaringan> = {
  // Tulang kortikal paling padat, jadi paling putih di CT — sekaligus nyaris
  // tanpa sinyal di MRI. Dua fakta yang tampak bertentangan sampai orang tahu
  // MRI membaca proton air bergerak, bukan kepadatan.
  skeletal: { hu: 800, t1: 0.12, t2: 0.08, mu: 1.0 },
  muscular: { hu: 45, t1: 0.42, t2: 0.35, mu: 0.28 },
  // Kulit & lemak subkutan: HU negatif, dan lemak TERANG di T1 — itulah yang
  // menjadikan lemak patokan pertama saat membaca T1.
  surface: { hu: -60, t1: 0.85, t2: 0.55, mu: 0.16 },
  cardiovascular: { hu: 50, t1: 0.38, t2: 0.30, mu: 0.30 },
  nervous: { hu: 35, t1: 0.55, t2: 0.62, mu: 0.24 },
  visceral: { hu: 55, t1: 0.48, t2: 0.58, mu: 0.32 },
  lymphoid: { hu: 40, t1: 0.40, t2: 0.68, mu: 0.26 },
}

/**
 * Windowing CT — persis operasi yang dikerjakan konsol CT.
 *
 * Nilai di bawah (level − width/2) menjadi hitam, di atas (level + width/2)
 * menjadi putih, di antaranya linear. Inilah sebabnya SATU pindaian yang sama
 * bisa memperlihatkan paru ATAU tulang tergantung window-nya: datanya tidak
 * berubah, rentang yang ditampilkan yang berubah. Keterampilan itu yang
 * dilatih di sini, bukan sekadar "gambarnya abu-abu".
 */
function windowHu(hu: number, w: CtWindow): number {
  const bawah = w.level - w.width / 2
  const atas = w.level + w.width / 2
  if (hu <= bawah) return 0
  if (hu >= atas) return 1
  return (hu - bawah) / (atas - bawah)
}

const MODE_BACKGROUND: Record<RenderMode, number> = {
  anatomy: 0x0a0a0f,
  xray: 0x04060c,
  ct: 0x000000,
  mriT1: 0x000000,
  mriT2: 0x000000,
}

// Material dibuat sekali per (lapisan x modalitas x window) lalu dipakai
// bersama — puluhan ribu mesh tidak boleh punya salinan masing-masing.
// Sorotan hijau tetap presisi karena efek sorot mengkloning dulu.
const radiologyMaterialCache = new Map<string, THREE.MeshStandardMaterial>()

function radiologyMaterial(
  layer: LayerKey,
  mode: Exclude<RenderMode, 'anatomy'>,
  win: CtWindow,
  clip: THREE.Plane | null,
): THREE.MeshStandardMaterial {
  const cacheKey = `${mode}:${layer}:${mode === 'ct' ? win.key : '-'}:${clip ? 'clip' : 'full'}`
  let mat = radiologyMaterialCache.get(cacheKey)
  if (!mat) {
    const j = JARINGAN[layer]
    // Keabuannya DIHITUNG dari sifat jaringan, tidak dipilih dengan mata.
    let abu: number
    let opacity = 1
    if (mode === 'ct') {
      abu = windowHu(j.hu, win)
    } else if (mode === 'mriT1') {
      abu = j.t1
    } else if (mode === 'mriT2') {
      abu = j.t2
    } else {
      // Rontgen: yang menentukan bukan keabuan permukaan melainkan seberapa
      // banyak berkas diserap, jadi atenuasi dipakai sebagai OPASITAS pada
      // penggambaran additive. Tumpukan jaringan otomatis menjadi lebih
      // terang, persis seperti berkas yang menembus lebih banyak materi.
      abu = 1
      opacity = Math.min(j.mu * 0.9, 0.95)
    }
    const v = Math.max(0, Math.min(1, abu))
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(v, v, v),
      roughness: 1,
      metalness: 0,
      transparent: mode === 'xray',
      opacity,
      blending: mode === 'xray' ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: mode !== 'xray',
      // Bidang potong membuat permukaan dalam ikut terlihat, jadi kedua sisi
      // wajah harus digambar — kalau tidak, penampangnya tampak berlubang.
      side: mode === 'xray' || clip ? THREE.DoubleSide : THREE.FrontSide,
      clippingPlanes: clip ? [clip] : null,
    })
    radiologyMaterialCache.set(cacheKey, mat)
  }
  return mat
}

// ─── Gerak fisiologis ───────────────────────────────────────────────────────
//
// Model ini TIDAK punya rangka animasi (armature), jadi ia tidak bisa berjalan
// atau mengangkat beban — itu butuh bone weighting, pekerjaan tersendiri.
// Yang BISA dilakukan, dan yang sebenarnya paling menjelaskan faal, adalah
// menggerakkan struktur pada tempatnya menurut irama sungguhannya:
//
//   - Jantung berdenyut pada laju denyut yang dipilih (istirahat vs latihan),
//     dengan sistol yang cepat dan diastol yang lebih lambat — bukan sinus
//     simetris, karena pengisian memang memakan waktu lebih lama daripada
//     pengosongan.
//   - Paru & diafragma mengembang pada laju napas yang dipilih.
//   - Otot yang sedang ditargetkan berkontraksi pada tempo latihan, dengan
//     fase eksentrik yang lebih lambat daripada konsentrik — sebagaimana
//     angkatan yang dilakukan dengan benar.
//
// Amplitudonya kecil dan sengaja: ini menandai IRAMA dan mana yang bergerak,
// bukan mensimulasikan perubahan volume yang sebenarnya.
export interface MotionState {
  /** Denyut jantung per menit. 0 mematikan gerak jantung. */
  heartRate: number
  /** Napas per menit. 0 mematikan gerak paru. */
  respRate: number
  /** Repetisi per menit untuk otot yang disorot. 0 mematikan. */
  contractionRate: number
  /**
   * Gelombang peristaltik saluran cerna, per menit. 0 mematikan.
   *
   * Ini gerak yang paling sering keliru dibayangkan orang: usus tidak
   * meremas seluruhnya bersamaan, melainkan MENJALARKAN gelombang dari
   * lambung ke arah anus. Karena itu tiap ruas diberi selisih fase menurut
   * letaknya di sepanjang saluran — selisih fase itulah peristaltiknya, dan
   * meremas serempak justru menggambarkan hal yang salah.
   */
  peristalsisRate?: number
}

export const MOTION_OFF: MotionState = { heartRate: 0, respRate: 0, contractionRate: 0, peristalsisRate: 0 }
// Peristaltik istirahat ~3/menit di lambung dan ~8-12/menit di usus halus;
// dipakai satu nilai madya karena modelnya tidak memisahkan keduanya.
export const MOTION_REST: MotionState = { heartRate: 70, respRate: 14, contractionRate: 0, peristalsisRate: 8 }
// Saat olahraga aliran darah dialihkan dari usus ke otot dan motilitasnya
// TURUN — itulah sebab kram dan mual saat berlari sesudah makan. Angkanya
// sengaja lebih kecil daripada saat istirahat, bukan lebih besar.
export const MOTION_EXERCISE: MotionState = { heartRate: 160, respRate: 40, contractionRate: 30, peristalsisRate: 3 }

const KATA_JANTUNG = ['atrium', 'ventricle', 'heart', 'papillary muscle']
const KATA_PARU = [' lung', 'lung ', 'bronch', 'alveol', 'diaphragm']
// Saluran cerna, dari lambung sampai rektum. Ureter ikut karena ia juga
// mendorong isinya dengan gelombang, bukan mengalirkannya pasif.
const KATA_CERNA = ['stomach', 'duodenum', 'jejunum', 'ileum', 'colon', 'caecum', 'cecum', 'sigmoid', 'rectum', 'ureter']
// Arteri besar. Denyutnya MENYUSUL denyut jantung, tidak serentak dengannya.
const KATA_ARTERI = ['artery', 'arteria', 'aorta', 'trunk']

function cocokSalahSatu(nama: string, kata: string[]): boolean {
  const n = nama.toLowerCase()
  return kata.some((k) => n.includes(k))
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
  /** CT window (width/level in Hounsfield units). Ignored outside CT. */
  ctWindow: CtWindow
  /** Cross-sectional cut — how CT and MRI are actually read. */
  slicePlane: SlicePlane
  /** Slice position, 0..1 across the body along that axis. */
  slicePos: number
  /** Physiological motion — heartbeat, breathing, muscle contraction. */
  motion: MotionState
  /**
   * Membuka tubuh: tiap struktur bergeser RADIAL menjauhi sumbu tubuh sejauh
   * ini (dalam satuan dunia). Nol berarti tubuh utuh.
   */
  unfold: number
  /**
   * Kedalaman diseksi 0..6 — sejauh mana lapisan luar dipudarkan supaya yang
   * di bawahnya terlihat. Bukan penghapusan: lapisan luar tetap disisakan
   * samar sebagai orientasi.
   */
  dissect: number
  /** Fires with the raw node name and a human-readable label when the user taps a structure. */
  onPick: (rawName: string, label: string) => void
}

export function Body3D({ layers, highlighted, focusKeywords, renderMode, ctWindow, slicePlane, slicePos, motion, unfold, dissect, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const groupsRef = useRef<Partial<Record<AnatomyLayer['key'], THREE.Group>>>({})
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const homeFramingRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3; minDistance: number; maxDistance: number } | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const lightsRef = useRef<{ ambient: THREE.AmbientLight; key: THREE.DirectionalLight; fill: THREE.DirectionalLight } | null>(null)
  const clipRef = useRef<THREE.Plane | null>(null)
  const bodyBoxRef = useRef<THREE.Box3 | null>(null)
  // Gerak dibaca dari ref di dalam loop render, bukan lewat dependency effect:
  // mengubah laju denyut tidak boleh membangun ulang scene.
  const motionRef = useRef(motion)
  motionRef.current = motion
  // Struktur yang ikut bergerak, dikumpulkan sekali tiap lapisan dimuat —
  // menelusuri ribuan node tiap frame akan menghabiskan anggaran frame.
  const animatedRef = useRef<{
    heart: THREE.Object3D[]
    lungs: THREE.Object3D[]
    /** Ruas saluran cerna beserta fase relatifnya (0..1) menurut letaknya. */
    gut: Array<{ obj: THREE.Object3D; fase: number }>
    /** Arteri beserta jeda denyutnya dari jantung, dalam detik. */
    artery: Array<{ obj: THREE.Object3D; jeda: number }>
  }>({ heart: [], lungs: [], gut: [], artery: [] })
  const hasFitRef = useRef(false)
  const highlightedMeshesRef = useRef<Map<THREE.Mesh, { original: THREE.Color; matchedName: string }>>(new Map())
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set())
  const [failedLayers, setFailedLayers] = useState<Set<string>>(new Set())
  // Kemajuan unduhan per lapisan, 0..1.
  const [progress, setProgress] = useState<Record<string, number>>({})
  // Kegagalan yang membuat viewer TIDAK BISA menampilkan apa pun. Sebelumnya
  // keadaan ini berakhir sebagai kotak hitam diam tanpa satu pun keterangan —
  // pengguna melihat layar kosong dan tidak punya cara tahu apa yang salah.
  const [fatal, setFatal] = useState<string>('')

  // Inisialisasi Three.js sekali saja (renderer/kamera/kontrol bertahan
  // selama komponen hidup; hanya lapisan model yang berubah-ubah).
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100)
    camera.position.set(0, 1.3, 3.4)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    } catch (e) {
      // Peramban tanpa WebGL, atau GPU yang menolak membuat konteks karena
      // tekanan memori — lazim di ponsel kelas menengah. Dulu ini melempar
      // dan seluruh efek berhenti diam-diam.
      setFatal(
        'This device could not start 3D graphics (WebGL). Try closing other tabs and reloading, or open the page on another browser.',
      )
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0a0a0f, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    // Clipping lokal per-material harus dinyalakan eksplisit; tanpa ini
    // clippingPlanes pada material diabaikan diam-diam.
    renderer.localClippingEnabled = true
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

    // Konteks WebGL bisa DICABUT peramban saat memori menipis — sangat lazim
    // di ponsel dengan model sebesar ini. Kalau tidak ditangani, gambarnya
    // membeku lalu menghitam tanpa keterangan apa pun.
    const onContextLost = (e: Event) => {
      e.preventDefault()
      setFatal('The browser dropped the 3D context, usually because memory ran low. Turn off some layers and reload.')
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)

    let raf = 0
    const jam = new THREE.Clock()
    function animate() {
      const t = jam.getElapsedTime()
      const m = motionRef.current

      // Denyut jantung. Siklusnya SENGAJA tidak simetris: sistol menempati
      // kira-kira sepertiga awal siklus dan berlangsung cepat, sisanya
      // diastol yang mengisi lebih lambat — itu bentuk siklus jantung yang
      // sebenarnya, dan sinus biasa akan menggambarkannya keliru.
      if (m.heartRate > 0 && animatedRef.current.heart.length) {
        const fase = (t * m.heartRate / 60) % 1
        const kontraksi = fase < 0.33
          ? Math.sin((fase / 0.33) * Math.PI)          // sistol: cepat
          : -0.15 * Math.sin(((fase - 0.33) / 0.67) * Math.PI) // diastol: mengisi
        const k = 1 - kontraksi * 0.07
        for (const o of animatedRef.current.heart) {
          const dasar = o.userData.baseScale as THREE.Vector3 | undefined
          if (dasar) o.scale.set(dasar.x * k, dasar.y * k, dasar.z * k)
        }
      }

      // Napas. Inspirasi aktif dan lebih pendek, ekspirasi pasif dan lebih
      // panjang — perbandingan I:E kira-kira 1:2 saat istirahat.
      if (m.respRate > 0 && animatedRef.current.lungs.length) {
        const fase = (t * m.respRate / 60) % 1
        const kembang = fase < 0.4
          ? Math.sin((fase / 0.4) * (Math.PI / 2))
          : Math.cos(((fase - 0.4) / 0.6) * (Math.PI / 2))
        const k = 1 + kembang * 0.05
        for (const o of animatedRef.current.lungs) {
          const dasar = o.userData.baseScale as THREE.Vector3 | undefined
          if (dasar) o.scale.set(dasar.x * k, dasar.y * k, dasar.z * k)
        }
      }

      // Peristaltik: SATU gelombang yang menjalar, bukan seluruh usus meremas
      // bersamaan. Tiap ruas memakai fase yang sama tapi digeser menurut
      // letaknya di sepanjang saluran, sehingga yang terlihat adalah
      // gelombang berjalan dari lambung ke arah rektum — yang memang itulah
      // peristaltik. Meremas serempak akan menggambarkan hal yang keliru.
      if ((m.peristalsisRate ?? 0) > 0 && animatedRef.current.gut.length) {
        const laju = (m.peristalsisRate ?? 0) / 60
        for (const g of animatedRef.current.gut) {
          const dasar = g.obj.userData.baseScale as THREE.Vector3 | undefined
          if (!dasar) continue
          // Gelombangnya sempit: hanya sebagian kecil saluran yang sedang
          // meremas pada satu saat, sisanya melebar menerima isinya.
          const fase = ((t * laju) - g.fase * SEBAR_PERISTALTIK) % 1
          const remas = fase > 0 && fase < 0.25 ? Math.sin((fase / 0.25) * Math.PI) : 0
          const k = 1 - remas * 0.12
          g.obj.scale.set(dasar.x * k, dasar.y * k, dasar.z * k)
        }
      }

      // Denyut arteri MENYUSUL denyut jantung, tidak serentak dengannya.
      // Gelombang nadi merambat sekitar 5 m/detik, jadi arteri di tungkai
      // berdenyut puluhan milidetik sesudah aorta. Jeda itu dihitung dari
      // jarak sebenarnya tiap pembuluh ke jantung.
      if (m.heartRate > 0 && animatedRef.current.artery.length) {
        const periode = 60 / m.heartRate
        for (const a of animatedRef.current.artery) {
          const dasar = a.obj.userData.baseScale as THREE.Vector3 | undefined
          if (!dasar) continue
          const fase = (((t - a.jeda) % periode) + periode) % periode / periode
          // Naik cepat, turun perlahan — bentuk gelombang nadi, bukan sinus.
          const nadi = fase < 0.2 ? Math.sin((fase / 0.2) * Math.PI) : 0
          const k = 1 + nadi * 0.035
          a.obj.scale.set(dasar.x * k, dasar.y * k, dasar.z * k)
        }
      }

      // Otot yang sedang disorot berkontraksi pada tempo latihan. Fase
      // konsentrik cepat, eksentrik dua kali lebih lambat — tempo angkatan
      // yang dianjurkan, bukan getaran hias.
      if (m.contractionRate > 0) {
        const fase = (t * m.contractionRate / 60) % 1
        const kontraksi = fase < 0.33
          ? Math.sin((fase / 0.33) * (Math.PI / 2))
          : Math.cos(((fase - 0.33) / 0.67) * (Math.PI / 2))
        const k = 1 + kontraksi * 0.06
        for (const [mesh] of highlightedMeshesRef.current) {
          const dasar = mesh.userData.baseScale as THREE.Vector3 | undefined
          if (dasar) mesh.scale.set(dasar.x * k, dasar.y * k, dasar.z * k)
        }
      }

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
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
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
        loadLayer(def.file, (pct) => setProgress((p) => ({ ...p, [def.key]: pct })))
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
            // Struktur yang ikut berdenyut/bernapas dikumpulkan sekarang, dan
            // skala awalnya disimpan supaya animasinya selalu kembali ke
            // ukuran asli, bukan mengecil sedikit demi sedikit tiap siklus.
            clone.traverse((obj) => {
              const nama = obj.userData.originalName as string | undefined
              if (!nama) return
              if (cocokSalahSatu(nama, KATA_JANTUNG)) {
                obj.userData.baseScale = obj.scale.clone()
                animatedRef.current.heart.push(obj)
              } else if (cocokSalahSatu(nama, KATA_PARU)) {
                obj.userData.baseScale = obj.scale.clone()
                animatedRef.current.lungs.push(obj)
              } else if (cocokSalahSatu(nama, KATA_CERNA)) {
                obj.userData.baseScale = obj.scale.clone()
                // Fase ditentukan KETINGGIAN ruas itu di tubuh. Saluran cerna
                // berjalan dari atas (lambung) ke bawah (rektum), jadi tinggi
                // adalah pendekatan yang layak untuk urutan sepanjang saluran
                // tanpa perlu tahu topologi ususnya. Nilainya diisi setelah
                // kotak batas tubuh diketahui, di bawah.
                animatedRef.current.gut.push({ obj, fase: 0 })
              } else if (cocokSalahSatu(nama, KATA_ARTERI)) {
                obj.userData.baseScale = obj.scale.clone()
                animatedRef.current.artery.push({ obj, jeda: 0 })
              }
            })
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
                bodyBoxRef.current = box.clone()

                // Fase peristaltik dan jeda denyut arteri dihitung SEKALI di
                // sini, saat ukuran tubuh sudah diketahui — bukan tiap frame.
                const pusat = new THREE.Vector3()
                const kotak = new THREE.Box3()
                const tinggiTubuh = Math.max(size.y, 0.1)
                for (const g of animatedRef.current.gut) {
                  kotak.setFromObject(g.obj).getCenter(pusat)
                  // 0 di ujung atas saluran, 1 di ujung bawah.
                  g.fase = batasSatu((box.max.y - pusat.y) / tinggiTubuh)
                }
                // Jeda denyut = jarak dari jantung dibagi kecepatan rambat
                // gelombang nadi. Pada aorta ia sekitar 5 m/detik, jadi denyut
                // di pergelangan kaki tiba puluhan milidetik SESUDAH di dada.
                // Itulah sebabnya nadi diraba, bukan dilihat serentak.
                const jantung = new THREE.Vector3(center.x, center.y + tinggiTubuh * 0.18, center.z)
                const PWV = 5
                const skalaMeter = 1.7 / tinggiTubuh
                for (const a of animatedRef.current.artery) {
                  kotak.setFromObject(a.obj).getCenter(pusat)
                  a.jeda = (pusat.distanceTo(jantung) * skalaMeter) / PWV
                }
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
            // Berkas yang gagal dibuang dari cache supaya percobaan berikutnya
            // benar-benar mengunduh lagi, bukan memakai ulang promise yang
            // sudah gagal selamanya.
            modelCache.delete(def.file)
          })
      } else if (!want && have) {
        scene.remove(have)
        delete groupsRef.current[def.key]
        // Daftar animasi menyimpan referensi ke objek lapisan ini; kalau tidak
        // dibuang, ia tetap dianimasikan setelah lepas dari scene dan
        // menahan memorinya.
        const masih = (o: THREE.Object3D) => o.parent !== null && !isDescendantOf(o, have)
        animatedRef.current.heart = animatedRef.current.heart.filter(masih)
        animatedRef.current.gut = animatedRef.current.gut.filter((g) => masih(g.obj))
        animatedRef.current.artery = animatedRef.current.artery.filter((a) => masih(a.obj))
        animatedRef.current.lungs = animatedRef.current.lungs.filter(masih)
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
    // Bidang potong dibangun dulu, karena material di bawah memerlukannya.
    // Normal & jarak dihitung dari kotak batas tubuh yang sebenarnya, bukan
    // dari angka tetap — supaya posisi 0..1 berarti "dari ujung ke ujung
    // tubuh", bukan "dari titik nol dunia".
    const box = bodyBoxRef.current
    if (slicePlane === 'none' || renderMode === 'anatomy' || renderMode === 'xray' || !box) {
      clipRef.current = null
    } else {
      const min = box.min
      const max = box.max
      // Aksial memotong mendatar (sumbu Y), koronal depan-belakang (Z),
      // sagital kiri-kanan (X) — konvensi radiologi baku.
      const normal =
        slicePlane === 'axial' ? new THREE.Vector3(0, -1, 0)
        : slicePlane === 'coronal' ? new THREE.Vector3(0, 0, -1)
        : new THREE.Vector3(-1, 0, 0)
      const lo = slicePlane === 'axial' ? min.y : slicePlane === 'coronal' ? min.z : min.x
      const hi = slicePlane === 'axial' ? max.y : slicePlane === 'coronal' ? max.z : max.x
      const at = lo + (hi - lo) * Math.max(0, Math.min(1, slicePos))
      // Plane didefinisikan sebagai normal·x + constant > 0 = sisi yang
      // DIPERTAHANKAN. Karena ketiga normal menunjuk ke arah negatif sumbunya,
      // syarat itu menjadi (koordinat < at) untuk ketiganya — jadi constant
      // sama dengan posisi potongnya, tanpa kasus khusus per bidang.
      clipRef.current = new THREE.Plane(normal, at)
    }
    highlightedMeshesRef.current.clear()
    for (const def of ANATOMY_LAYERS) {
      const group = groupsRef.current[def.key]
      if (!group) continue
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        child.material =
          renderMode === 'anatomy'
            ? (child.userData.baseMaterial as THREE.Material)
            : radiologyMaterial(def.key, renderMode, ctWindow, clipRef.current)
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
  }, [renderMode, ctWindow, slicePlane, slicePos, loadingLayers])

  // ── Membuka tubuh dan kedalaman diseksi ───────────────────────────────────
  //
  // Dua hal dikerjakan di satu tempat karena keduanya menyentuh mesh yang
  // sama: pergeseran radial ("unfold") dan keburaman per lapisan.
  //
  // Posisi asli tiap node disimpan sekali di userData sebelum digeser. Tanpa
  // itu, menggeser dari posisi yang sudah tergeser akan menumpuk kesalahan
  // dan tubuh perlahan terbang berantakan — kesalahan yang tidak melempar
  // galat apa pun, hanya membuat anatominya salah.
  useEffect(() => {
    const kotak = bodyBoxRef.current
    if (!kotak) return
    const pusat = kotak.getCenter(new THREE.Vector3())
    const sementara = new THREE.Vector3()

    for (const def of ANATOMY_LAYERS) {
      const group = groupsRef.current[def.key]
      if (!group) continue
      const kunci = def.key as KunciLapisan
      const buram = keburaman(kunci, dissect)
      const dalam = KEDALAMAN[kunci]

      group.traverse((obj) => {
        // Node bernama adalah satuan anatomi; itulah yang digeser, bukan tiap
        // primitif di bawahnya — menggeser primitif akan mencabik satu organ
        // menjadi kepingan yang tidak berarti apa-apa.
        const nama = obj.userData.originalName as string | undefined
        if (nama && !obj.userData.posisiAsli) {
          obj.userData.posisiAsli = obj.position.clone()
          obj.getWorldPosition(sementara)
          obj.userData.pusatDunia = sementara.clone()
        }
        if (nama && obj.userData.posisiAsli) {
          const asal = obj.userData.posisiAsli as THREE.Vector3
          const pd = obj.userData.pusatDunia as THREE.Vector3
          const g = geserBuka(
            { x: pd.x, y: pd.y, z: pd.z },
            { x: pusat.x, y: pusat.y, z: pusat.z },
            unfold, dalam,
          )
          obj.position.set(asal.x + g.x, asal.y + g.y, asal.z + g.z)
        }

        if (obj instanceof THREE.Mesh) {
          const bahan = obj.material as THREE.Material | THREE.Material[]
          const daftar = Array.isArray(bahan) ? bahan : [bahan]
          for (const b of daftar) {
            if (!b) continue
            b.transparent = buram < 0.999
            b.opacity = buram
            // Struktur separuh tembus yang tetap menulis kedalaman akan
            // menutupi apa pun di belakangnya — persis lapisan yang sedang
            // dibuka supaya terlihat.
            b.depthWrite = buram >= 0.999
            b.needsUpdate = true
          }
        }
      })
    }
  }, [unfold, dissect, layers, loadingLayers, renderMode])

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
        // Sorotan lepas -> ukurannya dikembalikan, kalau tidak otot yang
        // sempat berkontraksi akan tertinggal membesar selamanya.
        const dasar = mesh.userData.baseScale as THREE.Vector3 | undefined
        if (dasar) mesh.scale.copy(dasar)
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
          // Skala dasar disimpan supaya animasi kontraksi punya titik pulang.
          if (!child.userData.baseScale) child.userData.baseScale = child.scale.clone()
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
      {/* Kegagalan yang membuat viewer tidak bisa menampilkan apa pun. Ini
          menggantikan kotak hitam diam: layar kosong tanpa keterangan membuat
          orang mengira aplikasinya rusak seluruhnya, padahal penyebabnya
          biasanya memori atau jaringan dan bisa mereka atasi sendiri. */}
      {fatal && (
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <p className="text-center text-xs leading-relaxed text-neutral-300">{fatal}</p>
        </div>
      )}
      {!fatal && isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-56 rounded-xl bg-black/70 px-3 py-2.5 text-center">
            <span className="text-xs font-semibold text-white">Loading anatomy…</span>
            {/* Persentase nyata, bukan pemintal. Lapisan pembuluh darah saja
                12 MB — di jaringan seluler itu puluhan detik, dan tanpa angka
                yang bergerak orang menyimpulkan aplikasinya menggantung. */}
            {[...loadingLayers].map((k) => {
              const def = ANATOMY_LAYERS.find((l) => l.key === k)
              const pct = Math.round((progress[k] ?? 0) * 100)
              return (
                <div key={k} className="mt-1.5">
                  <div className="flex justify-between text-[10px] text-neutral-300">
                    <span>{def?.label ?? k}</span><span>{pct}%</span>
                  </div>
                  <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {failedLayers.size > 0 && (
        <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-red-950/85 px-2.5 py-1.5 text-[11px] text-red-200">
          Couldn’t load: {[...failedLayers].map((k) => ANATOMY_LAYERS.find((l) => l.key === k)?.label ?? k).join(', ')} —
          check the connection and toggle the layer off and on to retry.
        </div>
      )}
      {/* Tidak error, tidak memuat, tapi juga tidak ada yang tampil: keadaan
          inilah yang dulu jadi kotak hitam misterius. */}
      {!fatal && !isLoading && failedLayers.size === 0 && layers.size === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5">
          <p className="text-center text-xs text-neutral-400">
            Every layer is switched off. Turn on Skeleton or Muscles below to see the body.
          </p>
        </div>
      )}
    </div>
  )
}

export default Body3D
