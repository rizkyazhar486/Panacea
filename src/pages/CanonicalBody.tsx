import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { Card, SectionTitle, Badge } from '../components/ui'
import { penjagaMuatan, type PenjagaMuatan } from '../lib/gltfSesudahLepas'
import { parseMotionLibrary, movementAt, advanceClock, scrubToTime, crossfadeWeight, MOTION_SPEEDS, type MotionTimeline, type MotionClock, type MotionSpeed, QUALITY_PRESETS, frameStats, stepAuto, type AutoState, initialPreset, effectivePixelRatio, type QualityPreset, type QualityChoice, type FrameStats, ANATOMICAL_VIEWS, viewPose, stepTween, mergeRigMeshes, structureAtFace, type AnatomicalView, type CameraPose, type CameraTween } from '../domains/body-exposure'

// ─────────────────────────────────────────────────────────────────────────────
// BODY EXPOSURE — TUBUH KANONIK
//
// Memuat turunan web dari master Blender kanonik (bodyexposure/). Satu GLB per
// tubuh × sistem × LOD. Identitas struktur dibaca dari extras glTF
// (userData.panacea_structure_id), BUKAN dari object.name: GLTFLoader membuang
// titik dari nama node, dan gltfpack memindahkan mesh ke anak tanpa nama.
//
// Tubuh yang belum punya data sumber (hamil, janin, anak, lansia) ditampilkan
// sebagai "belum tersedia" — tidak pernah dibuat dengan menskalakan dewasa.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = `${import.meta.env.BASE_URL}bodyexposure/`

interface BodyEntry {
  body_id: string
  status: string
  source: string | null
  source_requirement: string | null
  redistribution?: string | null
  structures: number
  variants?: Array<{ body_id: string; structures: number; stature_m?: number | null; label?: string; status?: string; source?: string; coverage?: string; individual?: string }>
}
// light_lod: LOD ringan per berkas tubuh (LOD4 = budget ≤ 80.000 segitiga tampilan awal bila tersedia)
// motion: rig beranimasi per berkas tubuh (GLB kerangka + timeline JSON berlabel simulasi)
interface BodyMatrix { bodies: BodyEntry[]; files: string[]; light_lod?: Record<string, string>; motion?: Record<string, { glb: string; timeline: string }> }

// jangkar landmark sumber (Z-Anatomy), dikelompokkan per struktur inang; koordinat sudah Y-up
interface AnchorIndex { by_structure: Record<string, Array<{ id: string; name: string; p: [number, number, number]; s: string }>> }

interface Picked {
  id: string
  name: string
  system: string
  laterality: string
  status: string
  source: string
  license: string
  latin?: string
  ta2?: string
  note?: string
}

type Mode = 'normal' | 'ghost' | 'isolate'

const BODY_LABEL: Record<string, string> = {
  'HUMAN.ADULT.MALE': 'Adult male',
  'HUMAN.ADULT.FEMALE': 'Adult female',
  'HUMAN.PREGNANT': 'Pregnancy',
  FETUS: 'Fetus',
  'PEDIATRIC.NEONATE': 'Neonate',
  'PEDIATRIC.INFANT': 'Infant',
  'PEDIATRIC.TODDLER': 'Toddler',
  'PEDIATRIC.CHILD': 'Child',
  'PEDIATRIC.ADOLESCENT': 'Adolescent',
  'HUMAN.OLDER_ADULT': 'Older adult',
}
const SYSTEM_LABEL: Record<string, string> = {
  surface: 'Skin', skeletal: 'Bones', joint: 'Joints', muscular: 'Muscles', fascia: 'Fascia',
  cardiovascular: 'Heart & vessels', nervous: 'Nervous', respiratory: 'Respiratory', digestive: 'Digestive',
  urinary: 'Urinary', endocrine: 'Endocrine', reproductive: 'Reproductive', lymphatic: 'Lymphatic', sensory: 'Eye & ear',
}
// arah dispersi per sistem (kolom lateral, kelipatan tinggi tubuh): P_disp = P0 + d · E · w
// orientasi tidak berubah; E = 0 mengembalikan setiap struktur tepat ke posisi anatomisnya
const DISPERSE: Record<string, number> = {
  surface: -0.97, nervous: -0.65, sensory: -0.65, cardiovascular: -0.32, skeletal: 0, joint: 0,
  muscular: 0.32, fascia: 0.32, respiratory: 0.65, digestive: 0.65, urinary: 0.65, endocrine: 0.65,
  reproductive: 0.65, lymphatic: 0.97,
}
type Section = 'none' | 'sagittal' | 'coronal' | 'axial'

// urutan kupas dari luar ke dalam: 0 kulit · 1 fasia & otot · 2 tulang & sendi
// opasitas tiap lapisan = 1 − clamp(kedalaman − indeks, 0, 1) → transisi kontinu, tanpa 'popping'
const PEEL_LAYER: Record<string, number> = { surface: 0, fascia: 1, muscular: 1, skeletal: 2, joint: 2 }
const PEEL_LABELS = ['All layers', 'Skin removed', 'Muscle & fascia removed', 'Bones removed']

const DEFAULT_ON = new Set(['surface', 'skeletal', 'cardiovascular', 'respiratory', 'digestive', 'urinary', 'reproductive'])

// ID tubuh → awalan berkas (HUMAN.ADULT.MALE → adult_male)
// label varian: pakai label eksplisit dari matriks bila ada (mis. dewasa: sumber), selain itu
// diturunkan dari ID: 'PEDIATRIC.CHILD_5Y.FEMALE' → '5 y · Female'
function variantLabel(id: string, label?: string) {
  if (label) return label
  const [, stage, sex] = id.split('.')
  const age = stage.match(/_(\d+)Y$/)?.[1]
  return `${age ? `${age} y · ` : ''}${sex.charAt(0)}${sex.slice(1).toLowerCase()}`
}

const fileTag = (bodyId: string) => bodyId.replace('HUMAN.', '').replaceAll('.', '_').toLowerCase()

function statusTone(s: string): 'normal' | 'low' | 'neutral' {
  if (s.startsWith('source_backed')) return 'normal'
  if (s === 'placeholder') return 'neutral'
  return 'low'
}

export function CanonicalBody() {
  const [matrix, setMatrix] = useState<BodyMatrix | null>(null)
  const [error, setError] = useState('')
  const [entryId, setEntryId] = useState('HUMAN.ADULT.MALE')
  const [variantId, setVariantId] = useState<string | null>(null)
  // default ringan di semua layar: muatan awal tiap tubuh ≤ 80.000 segitiga (gerbang check_web_budget.py)
  const [detail, setDetail] = useState<'light' | 'detailed'>('light')
  const [enabled, setEnabled] = useState<Set<string>>(DEFAULT_ON)
  const [mode, setMode] = useState<Mode>('normal')
  const [section, setSection] = useState<Section>('none')
  const [sectionPos, setSectionPos] = useState(0.5)
  const [disperse, setDisperse] = useState(0)
  const [peel, setPeel] = useState(0)
  const [measuring, setMeasuring] = useState(false)
  const [measureMm, setMeasureMm] = useState<number | null>(null)
  const measuringRef = useRef(false)
  const measurePts = useRef<THREE.Vector3[]>([])
  const bodyBox = useRef<THREE.Box3 | null>(null)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ structures: 0, tris: 0, ms: 0 })
  const [anchors, setAnchors] = useState<AnchorIndex | null>(null)
  // ── gerak rig (kerangka beranimasi); jam berbasis waktu nyata, lihat engine/motionTimeline ──
  const [motionOn, setMotionOn] = useState(false)
  const [motionTl, setMotionTl] = useState<MotionTimeline | null>(null)
  const [motionUi, setMotionUi] = useState<{ timeS: number; playing: boolean; speed: MotionSpeed }>({ timeS: 0, playing: true, speed: 1 })
  const motionClock = useRef<MotionClock>({ timeS: 0, playing: true, speed: 1, loop: true })
  const motionRefs = useRef<{ group: THREE.Group; mixer: THREE.AnimationMixer; key: string; clips: THREE.AnimationClip[]; lib: MotionTimeline[]; current?: string } | null>(null)
  // peralihan antar klip: pose terakhir klip lama (kuaternion & posisi tulang) dicampur ke klip baru selama CROSSFADE_S
  const motionFade = useRef<{ from: Map<THREE.Object3D, { q: THREE.Quaternion; p: THREE.Vector3 }>; elapsedS: number } | null>(null)
  const [motionLib, setMotionLib] = useState<MotionTimeline[]>([])
  const [clipName, setClipName] = useState('ROM')
  const motionOnRef = useRef(false)
  const motionLoadGen = useRef(0)
  const [motionDraws, setMotionDraws] = useState(0)
  // ── kualitas render: preset + auto dari frame time terukur (engine/renderQuality) ──
  const [qualityChoice, setQualityChoice] = useState<QualityChoice>('auto')
  const [qualityActive, setQualityActive] = useState<QualityPreset>(() => initialPreset(window.innerWidth, window.devicePixelRatio))
  const [fps, setFps] = useState<FrameStats | null>(null)
  const qualityRef = useRef<{ choice: QualityChoice; active: QualityPreset }>({ choice: 'auto', active: qualityActive })

  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    root: THREE.Group
    groups: Map<string, THREE.Group>
    byId: Map<string, THREE.Object3D>
    invalidate: () => void
    /** Dipanggil tiap frame dengan dt (detik); true = adegan berubah dan perlu dirender. */
    animate: ((dt: number) => boolean) | null
    motionRoot: THREE.Group
    applyQuality: (p: QualityPreset) => void
    /** Transisi kamera halus (berbasis waktu) ke pose; null = lompat langsung. */
    flyTo: (pose: CameraPose, durationS: number | null) => void
    /** Muatan GLB yang tiba sesudah komponen dilepas tidak punya pemilik; lihat lib/gltfSesudahLepas. */
    penjaga: PenjagaMuatan
  } | null>(null)
  const selectedRef = useRef<string | null>(null)

  useEffect(() => {
    fetch(`${BASE}body_matrix.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setMatrix)
      .catch((e) => setError(`Body index could not be loaded (${e.message}).`))
    fetch(`${BASE}anchors_adult_male.json`).then((r) => (r.ok ? r.json() : null)).then(setAnchors).catch(() => setAnchors(null))
  }, [])

  const body = matrix?.bodies.find((b) => b.body_id === entryId)
  const hasFiles = (id: string) => (matrix?.files ?? []).some((f) => f.startsWith(fileTag(id) + '.'))
  const variants = (body?.variants ?? []).filter((v) => hasFiles(v.body_id))
  // tubuh yang benar-benar dimuat: varian terpilih (pediatrik) atau entri itu sendiri (dewasa)
  const bodyId = variants.length ? (variants.find((v) => v.body_id === variantId) ?? variants[0]).body_id : entryId
  const activeVariant = variants.find((v) => v.body_id === bodyId)
  const lod = detail === 'detailed' ? 'LOD2' : (matrix?.light_lod?.[fileTag(bodyId)] ?? 'LOD3')
  const systems = useMemo(() => {
    const tag = fileTag(bodyId)
    return (matrix?.files ?? []).filter((f) => f.startsWith(tag + '.')).map((f) => f.slice(tag.length + 1))
  }, [matrix, bodyId])

  // ── siapkan renderer satu kali ──────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.AgXToneMapping
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x07080b)
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1410, 1.4))
    const key = new THREE.DirectionalLight(0xfff4ea, 2.2); key.position.set(-2, 3, 3); scene.add(key)
    const rim = new THREE.DirectionalLight(0xcfe3ff, 1.2); rim.position.set(2, 2, -3); scene.add(rim)
    const root = new THREE.Group(); scene.add(root)
    // pencahayaan lingkungan studio netral (prosedural, tanpa aset luar) untuk preset ultra/balanced
    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const envTex = pmrem.fromScene(room, 0.04).texture
    const applyQuality = (p: QualityPreset) => {
      renderer.setPixelRatio(effectivePixelRatio(window.devicePixelRatio, p))
      scene.environment = QUALITY_PRESETS[p].environment ? envTex : null
      scene.environmentIntensity = 0.55
      const w = mount.clientWidth, h = mount.clientHeight; renderer.setSize(w, h)
      dirty = true
    }
    const motionRoot = new THREE.Group(); motionRoot.visible = false; scene.add(motionRoot)
    // render sesuai kebutuhan: hanya saat kamera bergerak atau adegan berubah (hemat baterai ponsel)
    let dirty = true
    const invalidate = () => { dirty = true }
    controls.addEventListener('change', invalidate)
    const penjaga = penjagaMuatan()
    let tween: CameraTween | null = null
    const poseNow = (): CameraPose => ({ position: camera.position.toArray(), target: controls.target.toArray(), up: camera.up.toArray() })
    const setPose = (p: CameraPose) => { camera.up.set(...p.up); camera.position.set(...p.position); controls.target.set(...p.target); camera.lookAt(controls.target) }
    const flyTo = (pose: CameraPose, durationS: number | null) => {
      if (durationS === null || durationS <= 0) { tween = null; setPose(pose); controls.update(); dirty = true; return }
      tween = { from: poseNow(), to: pose, elapsedS: 0, durationS }; dirty = true
    }
    controls.addEventListener('start', () => { tween = null })  // sentuhan pengguna membatalkan transisi
    sceneRef.current = { renderer, camera, controls, root, groups: new Map(), byId: new Map(), invalidate, penjaga, animate: null, motionRoot, applyQuality, flyTo }
    applyQuality(qualityRef.current.active)
    // frame time hanya dari frame yang dirender berturut-turut (render sesuai kebutuhan: jeda bukan beban GPU)
    const samples: number[] = []
    let renderedLast = false, lastEval = 0
    let autoState: AutoState = { preset: qualityRef.current.active, overBudget: 0, atVsync: 0 }
    const timer = new THREE.Timer(); timer.connect(document)  // Page Visibility: tab tersembunyi tidak menumpuk waktu

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      renderer.setSize(w, h); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix(); invalidate()
    }
    const ro = new ResizeObserver(resize); ro.observe(mount); resize()
    renderer.setAnimationLoop((now) => {
      timer.update(now); const dt = timer.getDelta()  // detik waktu nyata: gerak tidak bergantung laju frame layar
      controls.update()  // redaman memicu event 'change' selama kamera masih bergerak
      if (sceneRef.current?.animate?.(dt)) dirty = true
      if (tween) {
        const r = stepTween(tween, dt)
        if (r.ok) { setPose(r.pose); tween = r.done ? null : r.tween; dirty = true } else tween = null
      }
      if (!dirty) { renderedLast = false; return }
      dirty = false
      if (renderedLast) { samples.push(dt * 1000); if (samples.length > 240) samples.shift() }
      renderer.render(scene, camera)
      renderedLast = true
      if (now - lastEval > 2000 && samples.length >= 30) {  // evaluasi tiap ±2 s selama ada render kontinu
        lastEval = now
        const st = frameStats(samples); setFps(st)
        const q = qualityRef.current
        if (q.choice === 'auto') {
          const prev = q.active
          autoState = stepAuto({ ...autoState, preset: prev }, st)
          if (autoState.preset !== prev) { q.active = autoState.preset; applyQuality(autoState.preset); setQualityActive(autoState.preset); samples.length = 0 }
        }
      }
    })

    // identifikasi struktur dengan ketukan (bukan seretan)
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2()
    let down: [number, number] | null = null
    const onDown = (e: PointerEvent) => { down = [e.clientX, e.clientY] }
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return
      const r = renderer.domElement.getBoundingClientRect()
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ptr, camera)
      const hit = ray.intersectObject(motionOnRef.current ? motionRoot : root, true).find((h) => h.object.visible)
      if (measuringRef.current) { if (hit) addMeasurePoint(hit.point); return }
      let o: THREE.Object3D | null = (hit && structureAtFace(hit.object, hit.faceIndex)) ?? hit?.object ?? null
      while (o && !o.userData.panacea_structure_id) o = o.parent
      if (o) select(o)
    }
    // ketuk ganda: fokus halus ke struktur di bawah penunjuk
    const onDbl = (e: MouseEvent) => {
      const r = renderer.domElement.getBoundingClientRect()
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ptr, camera)
      const h = ray.intersectObject(motionOnRef.current ? motionRoot : root, true).find((x) => x.object.visible)
      let o: THREE.Object3D | null = (h && structureAtFace(h.object, h.faceIndex)) ?? h?.object ?? null
      while (o && !o.userData.panacea_structure_id) o = o.parent
      if (o) focusOn(o)
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)
    renderer.domElement.addEventListener('dblclick', onDbl)
    return () => {
      penjaga.lepas()
      timer.disconnect()
      envTex.dispose(); pmrem.dispose(); room.dispose()
      ro.disconnect()
      renderer.setAnimationLoop(null)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      renderer.domElement.removeEventListener('dblclick', onDbl)
      for (const g of [root, motionRoot]) g.traverse((o) => {
        if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()) }
      })
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      sceneRef.current = null
    }
    // select bersifat stabil (hanya memakai ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const q = qualityRef.current; q.choice = qualityChoice
    const target = qualityChoice === 'auto' ? q.active : qualityChoice
    q.active = target; setQualityActive(target); sceneRef.current?.applyQuality(target)
  }, [qualityChoice])

  // ── mode gerak: rig kerangka beranimasi menggantikan tampilan statis (hanya tubuh yang punya rig) ──
  const motionInfo = matrix?.motion?.[fileTag(bodyId)]
  const disposeMotion = () => {
    const s = sceneRef.current, m = motionRefs.current
    if (m) { m.mixer.stopAllAction(); m.group.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((x) => x.dispose()) } }) }
    s?.motionRoot.clear(); motionRefs.current = null; setMotionTl(null); setMotionLib([])
  }
  // tubuh tanpa rig: matikan gerak dan lepaskan rig sebelumnya dari memori GPU
  useEffect(() => { if (!motionInfo) { setMotionOn(false); disposeMotion() } }, [motionInfo])
  useEffect(() => {
    const s = sceneRef.current
    motionOnRef.current = motionOn
    if (!s) return
    if (!motionOn || !motionInfo) {
      s.animate = null; s.motionRoot.visible = false; s.root.visible = true; s.invalidate(); return
    }
    let cancelled = false
    const show = (tl: MotionTimeline, frameCamera: boolean) => {
      const m = motionRefs.current
      if (!m || cancelled) return
      s.root.visible = false; s.motionRoot.visible = true
      const dur = tl.durationS
      let lastUi = -1, lastPlaying = motionClock.current.playing
      s.animate = (dt) => {
        const r = advanceClock(motionClock.current, dt, dur)
        if (!r.ok) return false
        const fading = motionFade.current
        const moved = r.clock.timeS !== motionClock.current.timeS || !!fading
        motionClock.current = r.clock
        if (moved) m.mixer.setTime(r.clock.timeS)
        if (fading) {
          fading.elapsedS += dt
          const w = crossfadeWeight(fading.elapsedS)
          for (const [o, f] of fading.from) { o.quaternion.slerpQuaternions(f.q, o.quaternion, w); o.position.lerpVectors(f.p, o.position, w) }
          if (w >= 1) motionFade.current = null
        }
        // UI ±10 Hz selama berjalan; saat dijeda hanya sekali (bukan setState tiap frame)
        if ((moved && Math.abs(r.clock.timeS - lastUi) >= 0.1) || r.clock.playing !== lastPlaying) {
          lastUi = r.clock.timeS; lastPlaying = r.clock.playing
          setMotionUi({ timeS: r.clock.timeS, playing: r.clock.playing, speed: r.clock.speed })
        }
        return moved
      }
      if (!frameCamera) { s.invalidate(); return }
      // seluruh rig (termasuk lengan terangkat) muat: jarak dari FOV vertikal & horizontal + margin 15 %
      const box = new THREE.Box3().setFromObject(m.group); const c = box.getCenter(new THREE.Vector3()); const sz = box.getSize(new THREE.Vector3())
      const vfov = THREE.MathUtils.degToRad(s.camera.fov); const hfov = 2 * Math.atan(Math.tan(vfov / 2) * s.camera.aspect)
      const reach = (sz.y * 1.35) / 2  // lengan terangkat ±180° menambah tinggi di atas kepala
      const span = Math.max(sz.x * 1.6, sz.y)  // abduksi 90° → bentang lengan ≈ tinggi badan
      const dist = Math.max(reach / Math.tan(vfov / 2), span / 2 / Math.tan(hfov / 2)) * 1.15
      s.controls.target.set(c.x, c.y + sz.y * 0.1, c.z); s.camera.position.set(c.x, c.y + sz.y * 0.1, c.z + dist); s.controls.update(); s.invalidate()
    }
    // ganti klip: action mixer baru, jam direset; kamera dibingkai hanya pada pemuatan pertama
    const activate = (name: string, frameCamera: boolean) => {
      const m = motionRefs.current
      if (!m) return
      const tl = m.lib.find((c) => c.clip === name) ?? m.lib[0]
      const clip = m.clips.find((c) => c.name === tl.clip)
      if (!clip) return
      // pose terakhir klip lama (hanya bila benar-benar berganti klip) untuk peralihan halus
      motionFade.current = null
      if (m.current && m.current !== tl.clip) {
        const from = new Map<THREE.Object3D, { q: THREE.Quaternion; p: THREE.Vector3 }>()
        // nama track 'NAMA.quaternion' → NAMA (nama tulang sudah disanitasi loader, tanpa titik)
        const names = new Set(m.clips.flatMap((c) => c.tracks.map((t) => t.name.slice(0, t.name.lastIndexOf('.')))))
        names.forEach((n) => { const o = m.group.getObjectByName(n); if (o) from.set(o, { q: o.quaternion.clone(), p: o.position.clone() }) })
        if (from.size) motionFade.current = { from, elapsedS: 0 }
      }
      m.current = tl.clip
      m.mixer.stopAllAction(); m.mixer.clipAction(clip).play()
      motionClock.current = { timeS: 0, playing: true, speed: motionClock.current.speed, loop: true }
      m.mixer.setTime(0)
      setMotionUi({ timeS: 0, playing: true, speed: motionClock.current.speed })
      setMotionTl(tl); show(tl, frameCamera)
    }
    const key = motionInfo.glb
    if (motionRefs.current?.key === key) { activate(clipName, false); return () => { cancelled = true } }
    setLoading(true)
    const gen = ++motionLoadGen.current
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    Promise.all([loader.loadAsync(`${BASE}${motionInfo.glb}`), fetch(`${BASE}${motionInfo.timeline}`).then((r) => (r.ok ? r.json() : null))])
      .then(([g, raw]) => {
        if (cancelled) return
        const drop = () => g.scene.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((x) => x.dispose()) } })
        const parsed = parseMotionLibrary(raw)
        if (!parsed.ok) { drop(); setError(`Motion library rejected: ${parsed.error}`); setMotionOn(false); return }
        const missing = parsed.clips.filter((c) => !g.animations.some((a) => a.name === c.clip))
        if (missing.length) { drop(); setError(`Motion clip missing from the rig file: ${missing.map((c) => c.clip).join(', ')}`); setMotionOn(false); return }
        disposeMotion()
        s.motionRoot.add(g.scene)
        // satu draw call per (tulang × material), bukan per struktur: ±825 → ±100 (mesh asli disembunyikan)
        const merge = mergeRigMeshes(g.scene)
        setMotionDraws(merge.mergedMeshes)
        const mixer = new THREE.AnimationMixer(g.scene)
        motionRefs.current = { group: g.scene, mixer, key, clips: g.animations, lib: parsed.clips }
        setMotionLib(parsed.clips)
        activate(clipName, true)
      })
      .catch(() => { if (!cancelled) { setError('Motion rig could not be loaded.'); setMotionOn(false) } })
      // overlay dilepas oleh pemuatan gerak terakhir saja (toggle cepat), dan tidak bila sistem statis masih dimuat
      .finally(() => { if (motionLoadGen.current === gen && !loadState.current.inflight) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionOn, motionInfo, clipName])

  const motionControl = (patch: Partial<MotionClock>) => {
    motionClock.current = { ...motionClock.current, ...patch }
    const c = motionClock.current
    setMotionUi({ timeS: c.timeS, playing: c.playing, speed: c.speed })
    motionRefs.current?.mixer.setTime(c.timeS); sceneRef.current?.invalidate()
  }
  const activeMovement = motionTl ? movementAt(motionTl, motionUi.timeS) : null

  // preset kamera anatomis: transisi halus 0,6 s ke tampilan yang memuat seluruh subjek yang sedang tampil
  const goToView = (v: AnatomicalView) => {
    const s = sceneRef.current
    if (!s) return
    const box = new THREE.Box3().setFromObject(motionOnRef.current ? s.motionRoot : s.root)
    if (box.isEmpty()) return
    const pose = viewPose(v, box.getCenter(new THREE.Vector3()).toArray(), box.getSize(new THREE.Vector3()).toArray(), s.camera.fov, s.camera.aspect)
    if (pose) s.flyTo(pose, 0.6)
  }
  const VIEW_LABEL: Record<AnatomicalView, string> = { anterior: 'Anterior', posterior: 'Posterior', left: 'Left lateral', right: 'Right lateral', superior: 'Superior', inferior: 'Inferior', 'three-quarter': '3/4' }

  // ── muat GLB bertahap: tubuh/LOD baru → kosongkan; lalu hanya sistem yang aktif dimuat ──
  // (muatan awal = sistem default ≤ 80.000 segitiga; sistem lain dimuat saat dinyalakan)
  const loadState = useRef({ key: '', gen: 0, loaded: new Set<string>(), tris: 0, inflight: 0 })
  const pendingSelect = useRef<string | null>(null)
  useEffect(() => {
    const s = sceneRef.current
    if (!s || !systems.length) return
    const L = loadState.current
    const key = `${bodyId}|${lod}`
    const reset = L.key !== key
    if (reset) {
      L.key = key; L.gen += 1; L.loaded = new Set(); L.tris = 0; L.inflight = 0
      setPicked(null); selectedRef.current = null; pendingSelect.current = null; setError('')
      s.root.traverse((o) => {
        if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()) }
      })
      s.root.clear(); s.groups.clear(); s.byId.clear()
    }
    const todo = systems.filter((sys) => enabled.has(sys) && !L.loaded.has(sys))
    if (!todo.length) {
      if (reset) { setLoading(false); setStats({ structures: 0, tris: 0, ms: 0 }); bodyBox.current = null }  // semua sistem mati
      return
    }
    todo.forEach((sys) => L.loaded.add(sys))
    const gen = L.gen
    L.inflight += 1; setLoading(true)
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const tag = fileTag(bodyId)
    const t0 = performance.now()
    Promise.allSettled(todo.map(async (sys) => {
      const g = await loader.loadAsync(`${BASE}${tag}.${sys}.${lod}.glb`)
      return { sys, scene: g.scene }
    })).then((results) => {
      // Komponen sudah dilepas: scene-nya mati dan tidak ada yang akan membuang muatan ini, jadi buang di sini.
      if (!s.penjaga.hidup) { for (const r of results) if (r.status === 'fulfilled') s.penjaga.terima(r.value.scene); return }
      if (gen !== loadState.current.gen) return  // tubuh/LOD sudah berganti
      L.inflight -= 1
      for (const r of results) {
        if (r.status !== 'fulfilled') continue
        const { sys, scene } = r.value
        scene.traverse((o) => {
          if (o.userData.panacea_structure_id) s.byId.set(o.userData.panacea_structure_id, o)
          if (o instanceof THREE.Mesh) {
            o.material = (o.material as THREE.Material).clone()
            o.userData.baseOpacity = sys === 'surface' ? 0.12 : 1
            const geo = o.geometry
            L.tris += geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3
            if (sys === 'surface') o.raycast = () => {}  // kulit tembus pandang tidak menghalangi ketukan
          }
        })
        s.groups.set(sys, scene)
        s.root.add(scene)
      }
      const failed = results.filter((r) => r.status === 'rejected')
      results.forEach((r, i) => { if (r.status === 'rejected') L.loaded.delete(todo[i]) })
      if (failed.length) setError(`${failed.length} system file(s) could not be loaded.`)
      else if (!L.inflight) setError('')
      setStats({ structures: s.byId.size, tris: Math.round(L.tris), ms: Math.round(performance.now() - t0) })
      if (reset || !bodyBox.current) { bodyBox.current = new THREE.Box3().setFromObject(s.root); frame() }
      applyVisibility()
      applyDisperse(disperse)
      if (!L.inflight) setLoading(false)  // overlay hilang hanya setelah semua pemuatan selesai
      const want = pendingSelect.current
      const o = want ? s.byId.get(want) : undefined
      if (o) { pendingSelect.current = null; select(o); focusOn(o) }
      else if (want && failed.length) pendingSelect.current = null
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyId, lod, systems, enabled])

  useEffect(() => { applyVisibility() })  // sistem, mode, pilihan

  function frame() {
    const s = sceneRef.current
    if (!s) return
    const box = new THREE.Box3().setFromObject(s.root)
    if (box.isEmpty()) return
    const pose = viewPose('anterior', box.getCenter(new THREE.Vector3()).toArray(), box.getSize(new THREE.Vector3()).toArray(), s.camera.fov, s.camera.aspect)
    if (pose) s.flyTo(pose, null)
  }

  function focusOn(o: THREE.Object3D) {
    const s = sceneRef.current
    if (!s) return
    const box = new THREE.Box3().setFromObject(o)
    const c = box.getCenter(new THREE.Vector3())
    const r = Math.max(box.getSize(new THREE.Vector3()).length(), 0.08)
    const dir = s.camera.position.clone().sub(s.controls.target).normalize()
    s.flyTo({ position: c.clone().add(dir.multiplyScalar(r * 3.2)).toArray(), target: c.toArray(), up: s.camera.up.toArray() }, 0.6)
  }

  // ── potongan: satu bidang kliping global (sagital x, koronal z [anterior +z], aksial y) ──
  useEffect(() => {
    const s = sceneRef.current
    const box = bodyBox.current
    if (!s) return
    if (section === 'none' || !box) { s.renderer.clippingPlanes = []; s.invalidate(); return }
    const axis = section === 'sagittal' ? 'x' : section === 'coronal' ? 'z' : 'y'
    const n = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0)
    const v = box.min[axis] + sectionPos * (box.max[axis] - box.min[axis])
    s.renderer.clippingPlanes = [new THREE.Plane(n.negate(), v)]  // simpan sisi di bawah posisi bidang
    s.invalidate()
  }, [section, sectionPos, stats])

  function applyDisperse(E: number) {
    const s = sceneRef.current
    const box = bodyBox.current
    if (!s || !box) return
    const h = box.max.y - box.min.y  // w: diskalakan dengan tinggi tubuh agar tubuh anak tetap proporsional
    for (const [sys, g] of s.groups) g.position.x = (DISPERSE[sys] ?? 0) * E * h
    s.invalidate()
  }
  useEffect(() => { applyDisperse(disperse); if (disperse === 0) frame() ; else frameDispersed() }, [disperse])

  function frameDispersed() {
    const s = sceneRef.current
    if (!s) return
    const b = new THREE.Box3().setFromObject(s.root)
    const c = b.getCenter(new THREE.Vector3()), size = b.getSize(new THREE.Vector3())
    s.controls.target.copy(c)
    s.camera.position.set(c.x, c.y, c.z + Math.max(size.y, size.x / s.camera.aspect) * 1.9)
    s.controls.update(); s.invalidate()
  }

  // ── pengukuran: dua ketukan pada anatomi → jarak garis lurus (ruang dunia, meter → mm) ──
  function clearMeasure() {
    const s = sceneRef.current
    measurePts.current = []
    setMeasureMm(null)
    const old = s?.root.parent?.getObjectByName('measure-markers')
    if (old) { old.removeFromParent(); old.traverse((o) => { if (o instanceof THREE.Mesh || o instanceof THREE.Line) { o.geometry.dispose(); (o.material as THREE.Material).dispose() } }) }
    s?.invalidate()
  }
  function addMeasurePoint(p: THREE.Vector3) {
    const s = sceneRef.current
    if (!s) return
    if (measurePts.current.length >= 2) clearMeasure()
    measurePts.current.push(p.clone())
    let g = s.root.parent?.getObjectByName('measure-markers') as THREE.Group | undefined
    if (!g) { g = new THREE.Group(); g.name = 'measure-markers'; s.root.parent?.add(g) }
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.004, 12, 8), new THREE.MeshBasicMaterial({ color: 0x7ee0ff, depthTest: false }))
    dot.position.copy(p); dot.renderOrder = 11; g.add(dot)
    if (measurePts.current.length === 2) {
      const [a, b] = measurePts.current
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: 0x7ee0ff, depthTest: false }))
      line.renderOrder = 11; g.add(line)
      setMeasureMm(a.distanceTo(b) * 1000)
    }
    s.invalidate()
  }
  useEffect(() => { measuringRef.current = measuring; if (!measuring) clearMeasure() }, [measuring])

  function applyVisibility() {
    const s = sceneRef.current
    if (!s) return
    s.invalidate()
    const sel = selectedRef.current
    const selObj = sel ? s.byId.get(sel) : undefined
    for (const [sys, g] of s.groups) {
      g.visible = enabled.has(sys) || (mode === 'isolate' && !!selObj && isInside(selObj, g))
      g.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return
        const m = o.material as THREE.MeshStandardMaterial
        const inSel = !!selObj && isInside(o, selObj)
        const base = o.userData.baseOpacity as number
        const layer = PEEL_LAYER[sys]
        const peelKeep = layer === undefined || inSel ? 1 : 1 - Math.min(Math.max(peel - layer, 0), 1)
        let opacity = base * peelKeep
        if (selObj && mode === 'ghost' && !inSel) opacity = Math.min(opacity, 0.12)
        o.visible = !(selObj && mode === 'isolate' && !inSel) && opacity > 0.01
        m.transparent = opacity < 1
        m.opacity = opacity
        m.depthWrite = opacity >= 1
        m.emissive?.set(inSel ? 0x1d4a5c : 0x000000)
      })
    }
  }

  function isInside(o: THREE.Object3D, ancestor: THREE.Object3D) {
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p === ancestor) return true
    return false
  }

  function select(o: THREE.Object3D) {
    const u = o.userData
    selectedRef.current = u.panacea_structure_id
    setPicked({
      id: u.panacea_structure_id, name: u.canonical_name ?? u.panacea_structure_id, system: u.panacea_system ?? '',
      laterality: u.panacea_laterality ?? '', status: u.panacea_accuracy_status ?? '', source: u.panacea_source ?? '',
      license: u.panacea_license ?? '', latin: u.panacea_latin_name, ta2: u.panacea_ta2_id, note: u.panacea_qa_note,
    })
  }

  const landmarks = useMemo(() => {
    if (!picked || !anchors) return []
    return anchors.by_structure[picked.id] ?? []
  }, [picked, anchors])

  // penanda landmark: titik kecil di atas struktur terpilih, selalu terlihat (depthTest mati)
  useEffect(() => {
    const s = sceneRef.current
    if (!s) return
    const old = s.root.parent?.getObjectByName('landmark-markers')
    if (old) { old.removeFromParent(); old.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose() } }) }
    if (!landmarks.length) { s.invalidate(); return }
    const g = new THREE.Group(); g.name = 'landmark-markers'
    const geo = new THREE.SphereGeometry(0.0035, 12, 8)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd166, depthTest: false })
    for (const l of landmarks) { const m = new THREE.Mesh(geo, mat); m.position.set(...l.p); m.renderOrder = 10; m.raycast = () => {}; g.add(m) }
    s.root.parent?.add(g)
    s.invalidate()
  }, [landmarks])

  // indeks pencarian seluruh tubuh (termasuk sistem yang belum dimuat): [id, nama, lateralitas, sistem]
  const [index, setIndex] = useState<Array<[string, string, string, string]>>([])
  useEffect(() => {
    setIndex([])
    fetch(`${BASE}${fileTag(bodyId)}.index.json`).then((r) => (r.ok ? r.json() : [])).then(setIndex).catch(() => setIndex([]))
  }, [bodyId])
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const out: Array<{ id: string; name: string; system: string }> = []
    for (const [id, name, lat, system] of index) {
      if (name.toLowerCase().includes(q) || id.toLowerCase().includes(q)) out.push({ id, system, name: `${name}${lat === 'left' ? ' (left)' : lat === 'right' ? ' (right)' : ''}` })
      if (out.length >= 8) break
    }
    return out
  }, [query, index])

  const toggle = (sys: string) => setEnabled((prev) => {
    const n = new Set(prev); if (n.has(sys)) n.delete(sys); else n.add(sys); return n
  })

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Canonical human bodies"
          subtitle="Source-backed anatomical bodies from the Body Exposure master. Tap any structure to see where its geometry comes from. Educational models — not patient-specific anatomy."
        />
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Body">
          {(matrix?.bodies ?? []).map((b) => {
            // tersedia hanya bila berkas web tubuh ini benar-benar diterbitkan
            const available = hasFiles(b.body_id) || (b.variants ?? []).some((v) => hasFiles(v.body_id))
            return (
              <button
                key={b.body_id}
                role="tab"
                aria-selected={b.body_id === entryId}
                disabled={!available}
                title={available ? undefined : b.redistribution ?? b.source_requirement ?? 'Source data required'}
                onClick={() => { if (available) { setEntryId(b.body_id); setVariantId(null) } }}
                className={`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-bold transition ${b.body_id === entryId ? 'border-brand bg-brand text-white' : available ? 'border-neutral-500/30 bg-neutral-500/10' : 'cursor-not-allowed border-dashed border-neutral-500/30 opacity-55'}`}
              >
                {BODY_LABEL[b.body_id] ?? b.body_id}
                {!available && <span className="ml-1.5 text-[11px] font-semibold">· not yet</span>}
              </button>
            )
          })}
        </div>
        {variants.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Body variant">
            {variants.map((v) => (
              <button key={v.body_id} role="radio" aria-checked={v.body_id === bodyId} onClick={() => setVariantId(v.body_id)}
                className={`min-h-[40px] rounded-full border px-3.5 text-[13px] font-bold ${v.body_id === bodyId ? 'border-brand bg-brand-100 text-brand-dark dark:bg-emerald-400/15 dark:text-emerald-200' : 'border-neutral-500/30 opacity-70'}`}>
                {variantLabel(v.body_id, v.label)}
              </button>
            ))}
          </div>
        )}
        {body && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-neutral-600 dark:text-neutral-300">
            <Badge tone={statusTone(activeVariant?.status ?? body.status)}>{(activeVariant?.status ?? body.status).replaceAll('_', ' ')}</Badge>
            <span>{(activeVariant?.structures ?? body.structures).toLocaleString('en')} structures</span>
            {typeof activeVariant?.stature_m === 'number' && <span>· stature {Math.round(activeVariant.stature_m * 100)} cm</span>}
            {activeVariant?.coverage && <span>· {activeVariant.coverage}</span>}
            {(activeVariant?.source ?? body.source) && <span className="min-w-0 truncate">· {activeVariant?.source ?? body.source}</span>}
            {activeVariant?.individual && <span className="basis-full" data-testid="variant-individual">{activeVariant.individual}</span>}
          </div>
        )}
      </Card>

      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#07080b]">
        <div ref={mountRef} className="h-[62vh] min-h-[420px] w-full" data-testid="canonical-body-canvas" />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start gap-2">
          <div className="pointer-events-auto flex rounded-full border border-white/15 bg-black/50 p-1 backdrop-blur">
            {(['normal', 'ghost', 'isolate'] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
                className={`min-h-[36px] rounded-full px-3 text-[12px] font-bold capitalize ${mode === m ? 'bg-[#f2f4f6] text-[#0b0c0e]' : 'text-white/80'}`}>
                {m}
              </button>
            ))}
          </div>
          {motionInfo && (
            <div className="pointer-events-auto flex rounded-full border border-white/15 bg-black/50 p-1 backdrop-blur">
              <button onClick={() => { setMotionOn((m) => !m); setMeasuring(false); setDisperse(0) }} aria-pressed={motionOn}
                className={`min-h-[36px] rounded-full px-3 text-[12px] font-bold ${motionOn ? 'bg-[#ffd166] text-[#0b0c0e]' : 'text-white/80'}`}>
                {motionOn ? 'Stop motion' : 'Motion'}
              </button>
            </div>
          )}
          {/* alat ukur di toolbar kanvas: tetap terlihat saat mengetuk anatomi (tidak menggulir keluar) */}
          <div className="pointer-events-auto flex rounded-full border border-white/15 bg-black/50 p-1 backdrop-blur">
            <button onClick={() => { setMeasuring((m) => !m); setDisperse(0) }} aria-pressed={measuring}
              className={`min-h-[36px] rounded-full px-3 text-[12px] font-bold ${measuring ? 'bg-[#7ee0ff] text-[#0b0c0e]' : 'text-white/80'}`}>
              {measuring ? 'Stop measuring' : 'Measure'}
            </button>
          </div>
          <div className="pointer-events-auto flex rounded-full border border-white/15 bg-black/50 p-1 backdrop-blur">
            {(['light', 'detailed'] as const).map((l) => (
              <button key={l} onClick={() => setDetail(l)} aria-pressed={detail === l}
                className={`min-h-[36px] rounded-full px-3 text-[12px] font-bold ${detail === l ? 'bg-[#f2f4f6] text-[#0b0c0e]' : 'text-white/80'}`}>
                {l === 'light' ? 'Light' : 'Detailed'}
              </button>
            ))}
          </div>
        </div>
        {measuring && (
          <div className="pointer-events-none absolute inset-x-3 bottom-12 text-center text-[12px] font-bold text-[#7ee0ff]">
            {measureMm === null ? 'Tap two points on the anatomy' : `${measureMm.toFixed(1)} mm · straight line`}
          </div>
        )}
        {loading && <div className="absolute inset-0 grid place-items-center text-sm font-bold text-white/80">Loading anatomy…</div>}
        {!loading && !motionOn && stats.structures > 0 && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/70">
            {stats.structures.toLocaleString('en')} loaded · {Math.round(stats.tris / 1000)}k triangles · {stats.ms} ms
            {/* frame time terukur dari render kontinu (rata-rata & 1 % terendah) */}
            {fps && <span data-testid="fps-readout"> · {Math.round(fps.fpsMean)} fps · 1% low {Math.round(fps.fps1Low)} · {qualityActive}</span>}
          </div>
        )}
        {/* panel gerak di bawah kanvas: tidak menutupi anatomi */}
        {motionOn && motionTl && (
          <div className="border-t border-white/10 bg-black/60 p-3 text-white" data-testid="motion-panel">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="rounded-full bg-[#ffd166] px-2 py-0.5 text-[10px] font-bold uppercase text-[#0b0c0e]">{motionTl.truthClass === 'simulated' ? 'Simulation' : 'Recorded motion'}</span>
              <span className="font-bold capitalize" data-testid="motion-movement">{activeMovement?.name ?? 'rest'}</span>
              <span className="text-white/60">{motionUi.timeS.toFixed(1)} / {motionTl.durationS.toFixed(1)} s</span>
              {fps && <span className="text-white/60" data-testid="fps-readout">· {Math.round(fps.fpsMean)} fps · 1% low {Math.round(fps.fps1Low)} · {qualityActive}</span>}
            </div>
            {motionLib.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Motion clip">
                {motionLib.map((c) => (
                  <button key={c.clip} role="radio" aria-checked={c.clip === motionTl.clip} onClick={() => setClipName(c.clip)}
                    className={`min-h-[34px] rounded-full px-3 text-[12px] font-bold ${c.clip === motionTl.clip ? 'bg-[#f2f4f6] text-[#0b0c0e]' : 'bg-white/10 text-white/80'}`}>{c.labelShort}</button>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => motionControl({ playing: !motionUi.playing })} className="min-h-[36px] rounded-full bg-white/10 px-3 text-[12px] font-bold">
                {motionUi.playing ? 'Pause' : 'Play'}
              </button>
              <input type="range" min={0} max={1} step={0.001} value={motionUi.timeS / motionTl.durationS} aria-label="Motion timeline" className="min-w-0 flex-1"
                onChange={(e) => { const t = scrubToTime(Number(e.target.value), motionTl.durationS); if (t !== null) motionControl({ timeS: t, playing: false }) }} />
              <div className="flex rounded-full bg-white/10 p-0.5" role="radiogroup" aria-label="Motion speed">
                {MOTION_SPEEDS.map((v) => (
                  <button key={v} role="radio" aria-checked={motionUi.speed === v} onClick={() => motionControl({ speed: v })}
                    className={`min-h-[32px] rounded-full px-2 text-[11px] font-bold ${motionUi.speed === v ? 'bg-[#f2f4f6] text-[#0b0c0e]' : 'text-white/75'}`}>{v}×</button>
                ))}
              </div>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-white/65">{motionTl.label}. Skeleton and joints only; muscles and skin are not rigged yet.{motionTl.acknowledgement && <> {motionTl.acknowledgement}</>}{motionDraws > 0 && <span data-testid="motion-draws"> · {motionDraws} draw groups</span>}</p>
          </div>
        )}
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-neutral-500">View</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Anatomical view">
              {ANATOMICAL_VIEWS.map((v) => (
                <button key={v} onClick={() => goToView(v)}
                  className="min-h-[40px] rounded-full border border-neutral-500/30 px-3.5 text-[13px] font-bold">
                  {VIEW_LABEL[v]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-neutral-500">
              Graphics quality{qualityChoice === 'auto' && <span className="normal-case"> · now {qualityActive}</span>}
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Graphics quality">
              {(['auto', 'ultra', 'balanced', 'performance'] as QualityChoice[]).map((k) => (
                <button key={k} role="radio" aria-checked={qualityChoice === k} onClick={() => setQualityChoice(k)}
                  className={`min-h-[40px] rounded-full border px-3.5 text-[13px] font-bold capitalize ${qualityChoice === k ? 'border-brand bg-brand-100 text-brand-dark dark:bg-emerald-400/15 dark:text-emerald-200' : 'border-neutral-500/30 opacity-70'}`}>
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-neutral-500">Section plane</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Section plane">
              {(['none', 'sagittal', 'coronal', 'axial'] as Section[]).map((k) => (
                <button key={k} role="radio" aria-checked={section === k} onClick={() => setSection(k)}
                  className={`min-h-[40px] rounded-full border px-3.5 text-[13px] font-bold capitalize ${section === k ? 'border-brand bg-brand-100 text-brand-dark dark:bg-emerald-400/15 dark:text-emerald-200' : 'border-neutral-500/30 opacity-70'}`}>
                  {k === 'none' ? 'Off' : k}
                </button>
              ))}
            </div>
            {section !== 'none' && (
              <input type="range" min={0} max={1} step={0.005} value={sectionPos} aria-label="Section position"
                onChange={(e) => setSectionPos(Number(e.target.value))} className="mt-3 w-full" />
            )}
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-neutral-500">
              Peel layers · <span className="normal-case">{PEEL_LABELS[Math.min(Math.round(peel), 3)]}</span>
            </p>
            <input type="range" min={0} max={3} step={0.01} value={peel} aria-label="Peel layers"
              onChange={(e) => setPeel(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-neutral-500">Disperse systems</p>
            <input type="range" min={0} max={1} step={0.01} value={disperse} aria-label="Disperse systems"
              disabled={measuring} onChange={(e) => setDisperse(Number(e.target.value))} className="w-full" />
            <p className="mt-1 text-[11px] text-neutral-500">Each system moves along its own fixed axis; slide back to 0 to restore exact anatomical positions.</p>
          </div>
        </div>
      </Card>

      {error && <Card><p className="text-sm text-red-700 dark:text-red-300">{error}</p></Card>}

      <Card>
        <div className="flex flex-wrap gap-2" aria-label="Body systems">
          {systems.map((sys) => (
            <button key={sys} onClick={() => toggle(sys)} aria-pressed={enabled.has(sys)}
              className={`min-h-[40px] rounded-full border px-3.5 text-[13px] font-bold transition ${enabled.has(sys) ? 'border-brand bg-brand-100 text-brand-dark dark:bg-emerald-400/15 dark:text-emerald-200' : 'border-neutral-500/30 opacity-60'}`}>
              {SYSTEM_LABEL[sys] ?? sys}
            </button>
          ))}
        </div>
        <div className="relative mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a structure, e.g. femur, mitral, ovary"
            aria-label="Find a structure"
            className="min-h-[44px] w-full rounded-2xl border border-neutral-500/30 bg-neutral-500/10 px-4 text-sm text-inherit"
          />
          {matches.length > 0 && (
            <ul className="mt-2 divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 dark:divide-white/10 dark:border-white/15">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    className="min-h-[44px] w-full px-4 text-left text-sm capitalize hover:bg-neutral-500/10"
                    onClick={() => {
                      setQuery('')
                      if (m.system && !enabled.has(m.system)) toggle(m.system)
                      const o = sceneRef.current?.byId.get(m.id)
                      if (o) { select(o); focusOn(o) } else pendingSelect.current = m.id  // pilih setelah sistemnya dimuat
                    }}
                  >
                    {m.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        {picked ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black capitalize text-ink dark:text-white">{picked.name}</h3>
              <Badge tone={statusTone(picked.status)}>{picked.status.replaceAll('_', ' ')}</Badge>
            </div>
            {picked.latin && (
              <p className="text-sm italic text-neutral-700 dark:text-neutral-200">
                {picked.latin}{picked.ta2 && <span className="not-italic text-neutral-500"> · TA2 {picked.ta2}</span>}
              </p>
            )}
            <p className="break-all font-mono text-[11px] text-neutral-500">{picked.id}</p>
            <p className="text-sm text-neutral-700 dark:text-neutral-200">
              {SYSTEM_LABEL[picked.system] ?? picked.system}
              {picked.laterality && picked.laterality !== 'unpaired' ? ` · ${picked.laterality}` : ''}
            </p>
            <p className="text-[13px] text-neutral-600 dark:text-neutral-300">Source: {picked.source}{picked.license ? ` (${picked.license})` : ''}</p>
            {picked.note && <p className="text-[13px] text-amber-800 dark:text-amber-200">Note: {picked.note}</p>}
            {landmarks.length > 0 && (
              <div className="pt-1">
                <p className="text-[12px] font-bold uppercase tracking-wide text-neutral-500">Landmarks on this structure ({landmarks.length})</p>
                <p className="mt-1 text-[13px] capitalize leading-relaxed text-neutral-700 dark:text-neutral-200">{landmarks.map((l) => l.name).join(' · ')}</p>
                <p className="mt-1 text-[11px] text-neutral-500">Shown as yellow points. Positions from Z-Anatomy label lines (right side where labelled once).</p>
              </div>
            )}
            <button className="text-[13px] font-bold text-brand-dark underline dark:text-emerald-300" onClick={() => {
              const o = sceneRef.current?.byId.get(picked.id); if (o) focusOn(o)
            }}>Focus on this structure</button>
          </div>
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Tap a structure in the body, or search for one by name.</p>
        )}
      </Card>

      <p className="px-1 text-[11px] leading-relaxed text-neutral-500">
        Adult male: Z-Anatomy / BodyParts3D (CC BY-SA 4.0), with reconstructed intervertebral discs and pericardium.
        Adult female: HuBMAP VH_Female from the NLM Visible Human female (CC BY 4.0). Skeleton variant: University of Denver segmentation of the same donor (CC BY 4.0) plus CT bones segmented with TotalSegmentator (Apache-2.0), courtesy of the U.S. National Library of Medicine. Neonate to adolescent: ICRP
        Publication 156 paediatric reference phantoms, built from CT images of real children. Bodies marked “not yet”
        need source anatomy that this project does not have; they are not built by scaling an adult body.
      </p>
    </div>
  )
}
