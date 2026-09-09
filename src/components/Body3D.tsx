import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { keburaman, geserBuka, KEDALAMAN, type KunciLapisan } from '../lib/dissection'
import {
  Body3dLayerLoadGeneration,
  body3dDissectionMaterialState,
  body3dPixelRatio,
  body3dSliceCoordinate,
} from '../lib/body3dQuality'
import {
  clearAnatomySourceNodes,
  publishAnatomySourceNodes,
  publishAnatomySourceSelection,
} from '../lib/anatomySourceNodeRegistry'
import { createBodyAtlasRuntimeRootLifecycle } from '../lib/bodyAtlasRuntimeRootLifecycle'

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
        // Berkasnya besar. Tanpa laporan kemajuan, unduhan lambat di jaringan
        // seluler tidak bisa dibedakan dari viewer yang rusak.
        (ev) => { if (ev.total > 0 && onProgress) onProgress(ev.loaded / ev.total) },
        (err) => reject(err instanceof Error ? err : new Error(String(err))),
      )
    })
    modelCache.set(file, p)
  }
  return p
}

const HIGHLIGHT = new THREE.Color(0x00bf63)

function isDescendantOf(obj: THREE.Object3D, ancestor: THREE.Object3D): boolean {
  let p: THREE.Object3D | null = obj
  while (p) {
    if (p === ancestor) return true
    p = p.parent
  }
  return false
}

// ─── Mode tampilan radiologi ────────────────────────────────────────────────
// CT/MRI di sini adalah render pendidikan dari mesh anatomi, bukan data pindai
// pasien. Windowing dan sifat jaringan dibuat fisik/relatif agar interaksi
// mengajarkan konsep radiologi tanpa menyamarkannya sebagai citra klinis asli.
export type RenderMode = 'anatomy' | 'xray' | 'ct' | 'mriT1' | 'mriT2'
export type SlicePlane = 'none' | 'axial' | 'coronal' | 'sagittal'
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
interface SifatJaringan { hu: number; t1: number; t2: number; mu: number }

const JARINGAN: Record<LayerKey, SifatJaringan> = {
  skeletal: { hu: 800, t1: 0.12, t2: 0.08, mu: 1.0 },
  muscular: { hu: 45, t1: 0.42, t2: 0.35, mu: 0.28 },
  surface: { hu: -60, t1: 0.85, t2: 0.55, mu: 0.16 },
  cardiovascular: { hu: 50, t1: 0.38, t2: 0.30, mu: 0.30 },
  nervous: { hu: 35, t1: 0.55, t2: 0.62, mu: 0.24 },
  visceral: { hu: 55, t1: 0.48, t2: 0.58, mu: 0.32 },
  lymphoid: { hu: 40, t1: 0.40, t2: 0.68, mu: 0.26 },
}

/** Windowing CT dalam unit Hounsfield. */
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

// Material radiologi dibagi per layer/mode untuk menahan draw-state/memory.
// Plane clipping-nya stabil dan diperbarui in-place, sehingga cache tidak
// menyimpan posisi slice lama.
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
    let abu: number
    let opacity = 1
    if (mode === 'ct') abu = windowHu(j.hu, win)
    else if (mode === 'mriT1') abu = j.t1
    else if (mode === 'mriT2') abu = j.t2
    else {
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
      side: mode === 'xray' || clip ? THREE.DoubleSide : THREE.FrontSide,
      clippingPlanes: clip ? [clip] : null,
    })
    mat.userData.body3dBaseOpacity = opacity
    radiologyMaterialCache.set(cacheKey, mat)
  }
  return mat
}

// MotionState tetap menjadi kontrak UI/physiology. Source anatomy is
// evidence-bearing geometry: mesh jantung, paru, pembuluh, usus, dan otot tidak
// di-scale untuk menyimulasikan faal. Animasi deformasi baru boleh kembali jika
// tersedia rig/morph target yang memang dibuat dan divalidasi untuk struktur itu.
export interface MotionState {
  heartRate: number
  respRate: number
  contractionRate: number
  peristalsisRate?: number
}

export const MOTION_OFF: MotionState = { heartRate: 0, respRate: 0, contractionRate: 0, peristalsisRate: 0 }
export const MOTION_REST: MotionState = { heartRate: 70, respRate: 14, contractionRate: 0, peristalsisRate: 8 }
export const MOTION_EXERCISE: MotionState = { heartRate: 160, respRate: 40, contractionRate: 30, peristalsisRate: 3 }

interface Props {
  layers: Set<AnatomyLayer['key']>
  highlighted: string[]
  focusKeywords: string[] | null
  renderMode: RenderMode
  ctWindow: CtWindow
  slicePlane: SlicePlane
  slicePos: number
  motion: MotionState
  unfold: number
  dissect: number
  onPick: (rawName: string, label: string) => void
}

function latarGradasi(atas: number, bawah: number): THREE.Texture {
  const k = document.createElement('canvas')
  k.width = 2
  k.height = 256
  const ctx = k.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`
  g.addColorStop(0, hex(atas))
  g.addColorStop(1, hex(bawah))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 2, 256)
  const t = new THREE.CanvasTexture(k)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function cloneLayerMaterials(root: THREE.Group) {
  // Object3D.clone(true) tetap berbagi material dengan modelCache. Dissection
  // mengubah opacity/depthWrite, jadi setiap viewer perlu material lokal tanpa
  // menduplikasi material yang sama ratusan kali di satu layer.
  const lokal = new Map<THREE.Material, THREE.Material>()
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    const sumber = Array.isArray(obj.material) ? obj.material : [obj.material]
    const salinan = sumber.map((material) => {
      const existing = lokal.get(material)
      if (existing) return existing
      const copy = material.clone()
      copy.userData = { ...material.userData, body3dBaseOpacity: material.opacity }
      lokal.set(material, copy)
      return copy
    })
    obj.material = Array.isArray(obj.material) ? salinan : salinan[0]
    obj.userData.baseMaterial = obj.material
  })
  root.userData.body3dOwnedMaterials = [...lokal.values()]
}

function disposeLayerMaterials(root: THREE.Group) {
  const owned = root.userData.body3dOwnedMaterials as THREE.Material[] | undefined
  if (!owned) return
  for (const material of owned) material.dispose()
  root.userData.body3dOwnedMaterials = []
}

export function Body3D({
  layers,
  highlighted,
  focusKeywords,
  renderMode,
  ctWindow,
  slicePlane,
  slicePos,
  motion: _motion,
  unfold,
  dissect,
  onPick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const groupsRef = useRef<Partial<Record<AnatomyLayer['key'], THREE.Group>>>({})
  const layersRef = useRef(layers)
  layersRef.current = layers
  const loadGenerationRef = useRef(new Body3dLayerLoadGeneration())
  const [runtimeRootLifecycle] = useState(() => createBodyAtlasRuntimeRootLifecycle('Body3D'))
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const homeFramingRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3; minDistance: number; maxDistance: number } | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const lightsRef = useRef<{ ambient: THREE.AmbientLight; key: THREE.DirectionalLight; fill: THREE.DirectionalLight; tepi: THREE.DirectionalLight } | null>(null)
  const clipRef = useRef<THREE.Plane>(new THREE.Plane())
  const latarRef = useRef<THREE.Texture | null>(null)
  const bodyBoxRef = useRef<THREE.Box3 | null>(null)
  const requestRenderRef = useRef<() => void>(() => undefined)
  const hasFitRef = useRef(false)
  const highlightedMeshesRef = useRef<Map<THREE.Mesh, { baseMaterial: THREE.Material; matchedName: string }>>(new Map())
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set())
  const [failedLayers, setFailedLayers] = useState<Set<string>>(new Set())
  const [retryNonce, setRetryNonce] = useState(0)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [fatal, setFatal] = useState<string>('')

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
    } catch {
      setFatal('This device could not start 3D graphics (WebGL). Try closing other tabs and reloading, or open the page on another browser.')
      return
    }
    renderer.setClearColor(0x0a0a0f, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.localClippingEnabled = true
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Procedural environment memberi bentuk PBR tanpa download HDR tambahan.
    // RoomEnvironment sendiri hanya dibutuhkan saat PMREM dibangun; geometri
    // sementaranya langsung dilepas setelah render target terbentuk.
    const pmrem = new THREE.PMREMGenerator(renderer)
    const ruang = new RoomEnvironment()
    const lingkungan = pmrem.fromScene(ruang, 0.04)
    ruang.dispose()
    scene.environment = lingkungan.texture
    scene.environmentIntensity = 0.4
    pmrem.dispose()

    latarRef.current = latarGradasi(0x141922, 0x05070b)
    scene.background = latarRef.current

    const ambient = new THREE.AmbientLight(0xffffff, 0.32)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xffffff, 0.85)
    key.position.set(2, 4, 3)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.25)
    fill.position.set(-3, 1, -2)
    scene.add(fill)
    const tepi = new THREE.DirectionalLight(0xdce8ff, 0.55)
    tepi.position.set(-1.5, 2.5, -4)
    scene.add(tepi)
    lightsRef.current = { ambient, key, fill, tepi }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.minDistance = 0.3
    controls.maxDistance = 12
    controls.target.set(0, 1.0, 0)
    controls.update()
    cameraRef.current = camera
    controlsRef.current = controls
    hasFitRef.current = false

    let raf = 0
    let inViewport = true
    let documentVisible = !document.hidden

    // Tidak ada loop 60-fps saat tubuh diam. OrbitControls tanpa damping
    // mengirim event "change" saat drag/zoom; perubahan React lain memanggil
    // requestRenderRef. Ini mempertahankan detail tinggi tanpa membakar GPU
    // hanya untuk menggambar frame identik berulang kali.
    function requestRender() {
      if (raf !== 0 || !inViewport || !documentVisible) return
      raf = requestAnimationFrame(() => {
        raf = 0
        if (!inViewport || !documentVisible) return
        controls.update()
        renderer.render(scene, camera)
      })
    }

    function stopRendering() {
      if (raf === 0) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    requestRenderRef.current = requestRender
    controls.addEventListener('change', requestRender)

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w < 2 || h < 2) return
      const smallViewport = window.matchMedia('(max-width: 640px)').matches
      const pixelRatio = body3dPixelRatio(w, h, window.devicePixelRatio || 1, smallViewport)
      if (Math.abs(renderer.getPixelRatio() - pixelRatio) > 0.001) renderer.setPixelRatio(pixelRatio)
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      requestRender()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

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
      if (moved > 6) return
      toPointer(e)
      raycaster.setFromCamera(pointer, camera)
      const targets = Object.values(groupsRef.current).filter((g): g is THREE.Group => !!g)
      const hits = raycaster.intersectObjects(targets, true)
      if (hits.length === 0) return
      const hitObject = hits[0].object
      let obj: THREE.Object3D | null = hitObject
      while (obj && !obj.userData.originalName) obj = obj.parent
      if (obj) {
        const rawName = obj.userData.originalName as string
        const sourceLayer = ANATOMY_LAYERS.find((def) => {
          const group = groupsRef.current[def.key]
          return Boolean(group && isDescendantOf(hitObject, group))
        })
        publishAnatomySourceSelection(rawName, sourceLayer?.file)
        onPickRef.current(rawName, humanizeStructureName(rawName))
      }
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    const onContextLost = (e: Event) => {
      e.preventDefault()
      stopRendering()
      setFatal('The browser dropped the 3D context, usually because memory ran low. Turn off some layers and reload.')
    }
    const onContextRestored = () => {
      setFatal('')
      requestRender()
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)

    // Heavy WebGL work juga tidak dijadwalkan ketika viewer keluar layar.
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        inViewport = entry?.isIntersecting ?? true
        if (inViewport && documentVisible) requestRender()
        else stopRendering()
      },
      { rootMargin: '128px 0px', threshold: 0.01 },
    )
    visibilityObserver.observe(container)

    const onVisibilityChange = () => {
      documentVisible = !document.hidden
      if (documentVisible && inViewport) requestRender()
      else stopRendering()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    requestRender()

    return () => {
      requestRenderRef.current = () => undefined
      stopRendering()
      controls.removeEventListener('change', requestRender)
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
      controls.dispose()

      for (const [mesh, entry] of highlightedMeshesRef.current) {
        const active = mesh.material as THREE.Material
        if (active !== entry.baseMaterial) active.dispose()
      }
      highlightedMeshesRef.current.clear()
      runtimeRootLifecycle.dispose()
      for (const group of Object.values(groupsRef.current)) {
        if (group) disposeLayerMaterials(group)
      }
      for (const def of ANATOMY_LAYERS) clearAnatomySourceNodes(def.file)
      groupsRef.current = {}

      lingkungan.dispose()
      latarRef.current?.dispose()
      latarRef.current = null
      scene.environment = null
      scene.background = null
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement)
      rendererRef.current = null
      controlsRef.current = null
      cameraRef.current = null
      sceneRef.current = null
      bodyBoxRef.current = null
      homeFramingRef.current = null
      lightsRef.current = null
      hasFitRef.current = false
    }
  }, [])

  // Muat/lepas layer dengan generation token. Promise lama tidak boleh memasang
  // mesh jika pengguna sudah mematikan layer atau request baru sudah dimulai.
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    for (const def of ANATOMY_LAYERS) {
      const want = layers.has(def.key)
      const have = groupsRef.current[def.key]
      if (want && !have) {
        const generation = loadGenerationRef.current.begin(def.key)
        setFailedLayers((s) => { const n = new Set(s); n.delete(def.key); return n })
        setProgress((p) => ({ ...p, [def.key]: 0 }))
        setLoadingLayers((s) => new Set(s).add(def.key))
        loadLayer(def.file, (pct) => {
          if (!loadGenerationRef.current.isCurrent(def.key, generation)) return
          setProgress((p) => ({ ...p, [def.key]: pct }))
        })
          .then((group) => {
            if (
              sceneRef.current !== scene
              || !layersRef.current.has(def.key)
              || !loadGenerationRef.current.isCurrent(def.key, generation)
            ) return

            const clone = group.clone(true)
            cloneLayerMaterials(clone)
            const sourceNodeNames: string[] = []
            clone.traverse((obj) => {
              const name = obj.userData.originalName as string | undefined
              if (!name) return
              if (name.startsWith('HOW TO')) {
                obj.visible = false
                return
              }
              sourceNodeNames.push(name)
            })
            publishAnatomySourceNodes(def.file, sourceNodeNames)
            groupsRef.current[def.key] = clone
            runtimeRootLifecycle.publish(def.file, clone)
            scene.add(clone)
            setFailedLayers((s) => { const n = new Set(s); n.delete(def.key); return n })
            setProgress((p) => ({ ...p, [def.key]: 1 }))

            // Bingkai kamera sekali saja berdasarkan layer pertama. Semua
            // layer Z-Anatomy berbagi koordinat tubuh yang sama.
            const camera = cameraRef.current
            const controls = controlsRef.current
            if (!hasFitRef.current && camera && controls) {
              const box = new THREE.Box3().setFromObject(clone)
              if (!box.isEmpty()) {
                const center = box.getCenter(new THREE.Vector3())
                const size = box.getSize(new THREE.Vector3())
                const height = Math.max(size.y, 0.1)
                const dist = height * 1.7
                camera.position.set(
                  center.x + dist * 0.26,
                  center.y + height * 0.06,
                  center.z + dist * 0.96,
                )
                camera.near = Math.max(dist / 100, 0.01)
                camera.far = dist * 20
                camera.updateProjectionMatrix()
                controls.target.copy(center)
                controls.minDistance = dist * 0.15
                controls.maxDistance = dist * 4
                controls.update()
                hasFitRef.current = true
                bodyBoxRef.current = box.clone()
                homeFramingRef.current = {
                  position: camera.position.clone(),
                  target: center.clone(),
                  minDistance: controls.minDistance,
                  maxDistance: controls.maxDistance,
                }
              }
            }
            requestRenderRef.current()
          })
          .catch(() => {
            if (
              loadGenerationRef.current.isCurrent(def.key, generation)
              && layersRef.current.has(def.key)
            ) {
              setFailedLayers((s) => new Set(s).add(def.key))
            }
            modelCache.delete(def.file)
          })
          .finally(() => {
            if (!loadGenerationRef.current.isCurrent(def.key, generation)) return
            setLoadingLayers((s) => { const n = new Set(s); n.delete(def.key); return n })
          })
      } else if (!want) {
        loadGenerationRef.current.invalidate(def.key)
        setLoadingLayers((s) => { const n = new Set(s); n.delete(def.key); return n })
        setFailedLayers((s) => { const n = new Set(s); n.delete(def.key); return n })
        clearAnatomySourceNodes(def.file)
        runtimeRootLifecycle.clear(def.file)
        if (!have) continue

        for (const [mesh, entry] of highlightedMeshesRef.current) {
          if (!isDescendantOf(mesh, have)) continue
          const active = mesh.material as THREE.Material
          if (active !== entry.baseMaterial) active.dispose()
          highlightedMeshesRef.current.delete(mesh)
        }

        scene.remove(have)
        delete groupsRef.current[def.key]
        disposeLayerMaterials(have)
        requestRenderRef.current()
      }
    }
  }, [layers, retryNonce])

  // Terapkan modalitas radiologi. Plane yang sama diperbarui in-place supaya
  // cache material selalu membaca posisi slice slider terbaru.
  useEffect(() => {
    const box = bodyBoxRef.current
    let clip: THREE.Plane | null = null
    if (slicePlane !== 'none' && renderMode !== 'anatomy' && renderMode !== 'xray' && box) {
      const normal =
        slicePlane === 'axial' ? new THREE.Vector3(0, -1, 0)
        : slicePlane === 'coronal' ? new THREE.Vector3(0, 0, -1)
        : new THREE.Vector3(-1, 0, 0)
      clip = clipRef.current
      clip.set(normal, body3dSliceCoordinate(box, slicePlane, slicePos))
    }

    // Render mode mengganti material seluruh mesh; clone highlight lama harus
    // dilepas dulu supaya tidak menjadi orphan GPU resource.
    for (const [mesh, entry] of highlightedMeshesRef.current) {
      const active = mesh.material as THREE.Material
      if (active !== entry.baseMaterial) active.dispose()
    }
    highlightedMeshesRef.current.clear()

    for (const def of ANATOMY_LAYERS) {
      const group = groupsRef.current[def.key]
      if (!group) continue
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        child.material =
          renderMode === 'anatomy'
            ? (child.userData.baseMaterial as THREE.Material | THREE.Material[])
            : radiologyMaterial(def.key, renderMode, ctWindow, clip)
      })
    }

    rendererRef.current?.setClearColor(MODE_BACKGROUND[renderMode], 1)
    const lights = lightsRef.current
    if (lights) {
      const flat = renderMode === 'xray'
      lights.ambient.intensity = flat ? 1.1 : 0.32
      lights.key.intensity = flat ? 0.15 : 0.85
      lights.fill.intensity = flat ? 0.1 : 0.25
      lights.tepi.intensity = flat ? 0 : 0.55
    }
    const sc = sceneRef.current
    if (sc) {
      const anatomi = renderMode === 'anatomy'
      sc.environmentIntensity = anatomi ? 0.4 : 0
      sc.background = anatomi ? latarRef.current : null
    }
    requestRenderRef.current()
  }, [renderMode, ctWindow, slicePlane, slicePos, loadingLayers])

  // Membuka tubuh dan kedalaman diseksi. Opacity X-ray tidak boleh ditimpa:
  // dissection mengalikan opacity dasar modalitas dan menjaga depthWrite=false.
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
            unfold,
            dalam,
          )
          obj.position.set(asal.x + g.x, asal.y + g.y, asal.z + g.z)
        }

        if (obj instanceof THREE.Mesh) {
          const entry = highlightedMeshesRef.current.get(obj)
          const active = Array.isArray(obj.material) ? obj.material : [obj.material]
          const daftar = entry && entry.baseMaterial !== obj.material
            ? [...active, entry.baseMaterial]
            : active
          for (const b of daftar) {
            if (!b) continue
            const baseOpacity =
              typeof b.userData.body3dBaseOpacity === 'number'
                ? b.userData.body3dBaseOpacity as number
                : b.opacity
            const state = body3dDissectionMaterialState(renderMode, baseOpacity, buram)
            b.transparent = state.transparent
            b.opacity = state.opacity
            b.depthWrite = state.depthWrite
            b.needsUpdate = true
          }
        }
      })
    }
    requestRenderRef.current()
  }, [unfold, dissect, layers, loadingLayers, renderMode])

  // Sorot struktur pilihan dengan material clone lokal. Saat sorotan dilepas,
  // material dasar dipasang kembali dan clone langsung didispose.
  useEffect(() => {
    const exact = new Set(highlighted)
    const keywords = (focusKeywords ?? []).map((k) => k.toLowerCase())
    const matches = (name: string) => exact.has(name) || keywords.some((k) => name.toLowerCase().includes(k))
    const current = highlightedMeshesRef.current

    for (const [mesh, entry] of current) {
      if (!matches(entry.matchedName)) {
        const active = mesh.material as THREE.Material
        mesh.material = entry.baseMaterial
        if (active !== entry.baseMaterial) active.dispose()
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
          const mat = shared.clone()
          child.material = mat
          current.set(child, { baseMaterial: shared, matchedName: originalName })
          mat.emissive = HIGHLIGHT.clone()
          mat.emissiveIntensity = 0.55
        })
      })
    }

    const camera = cameraRef.current
    const controls = controlsRef.current
    if (camera && controls) {
      if (focusBox && !focusBox.isEmpty()) {
        const center = focusBox.getCenter(new THREE.Vector3())
        const size = focusBox.getSize(new THREE.Vector3())
        const radius = Math.max(size.length() * 0.5, 0.03)
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
    }
    requestRenderRef.current()
  }, [highlighted, focusKeywords, loadingLayers, renderMode])

  const isLoading = loadingLayers.size > 0
  // Initial anatomy load may cover the empty viewer, but once at least one
  // real layer is already rendered, later layer downloads stay compact so the
  // existing anatomy remains visible and usable on slow/mobile connections.
  const hasLoadedLayer = ANATOMY_LAYERS.some((def) => Boolean(groupsRef.current[def.key]))

  return (
    <div className="relative -mx-5 -mt-5 mb-3 h-[68vh] max-h-[820px] min-h-[480px] overflow-hidden rounded-t-2xl bg-gradient-to-b from-neutral-900 to-neutral-950">
      <div ref={containerRef} className="h-full w-full touch-none" />
      {fatal && (
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <p className="text-center text-xs leading-relaxed text-neutral-300">{fatal}</p>
        </div>
      )}
      {!fatal && isLoading && (
        <div
          role="status"
          aria-live="polite"
          className={
            hasLoadedLayer
              ? 'pointer-events-none absolute left-2 right-2 top-2 z-10 flex justify-center'
              : 'pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40'
          }
        >
          <div
            className={
              hasLoadedLayer
                ? 'w-56 rounded-xl border border-white/10 bg-black/80 px-3 py-2.5 text-center shadow-lg backdrop-blur-sm'
                : 'w-56 rounded-xl bg-black/70 px-3 py-2.5 text-center'
            }
          >
            <span className="text-xs font-semibold text-white">
              {hasLoadedLayer ? 'Adding anatomy layer…' : 'Loading anatomy…'}
            </span>
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
        <div
          className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 rounded-lg bg-red-950/90 px-2.5 py-2 text-[11px] text-red-200"
          role="status"
          aria-live="polite"
        >
          <span className="min-w-0 leading-relaxed">
            Couldn’t load: {[...failedLayers].map((k) => ANATOMY_LAYERS.find((l) => l.key === k)?.label ?? k).join(', ')}.
          </span>
          <button
            type="button"
            onClick={() => setRetryNonce((n) => n + 1)}
            disabled={isLoading}
            className="min-h-[34px] shrink-0 rounded-full border border-red-300/40 bg-red-100/10 px-3 font-bold text-red-100 transition hover:bg-red-100/20 disabled:cursor-wait disabled:opacity-50"
          >
            {isLoading ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      )}
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
