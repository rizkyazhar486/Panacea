import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Card, SectionTitle, Badge } from '../components/ui'

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
  structures: number
}
interface BodyMatrix { bodies: BodyEntry[]; files: string[] }

interface Picked {
  id: string
  name: string
  system: string
  laterality: string
  status: string
  source: string
  license: string
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
const DEFAULT_ON = new Set(['surface', 'skeletal', 'cardiovascular', 'respiratory', 'digestive', 'urinary', 'reproductive'])

// ID tubuh → awalan berkas (HUMAN.ADULT.MALE → adult_male)
const fileTag = (bodyId: string) => bodyId.replace('HUMAN.', '').replaceAll('.', '_').toLowerCase()

function statusTone(s: string): 'normal' | 'low' | 'neutral' {
  if (s.startsWith('source_backed')) return 'normal'
  if (s === 'placeholder') return 'neutral'
  return 'low'
}

export function CanonicalBody() {
  const [matrix, setMatrix] = useState<BodyMatrix | null>(null)
  const [error, setError] = useState('')
  const [bodyId, setBodyId] = useState('HUMAN.ADULT.MALE')
  const [lod, setLod] = useState<'LOD2' | 'LOD3'>(() => (window.matchMedia('(max-width: 767px)').matches ? 'LOD3' : 'LOD2'))
  const [enabled, setEnabled] = useState<Set<string>>(DEFAULT_ON)
  const [mode, setMode] = useState<Mode>('normal')
  const [picked, setPicked] = useState<Picked | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ structures: 0, tris: 0, ms: 0 })

  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    root: THREE.Group
    groups: Map<string, THREE.Group>
    byId: Map<string, THREE.Object3D>
  } | null>(null)
  const selectedRef = useRef<string | null>(null)

  useEffect(() => {
    fetch(`${BASE}body_matrix.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setMatrix)
      .catch((e) => setError(`Body index could not be loaded (${e.message}).`))
  }, [])

  const body = matrix?.bodies.find((b) => b.body_id === bodyId)
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
    sceneRef.current = { renderer, camera, controls, root, groups: new Map(), byId: new Map() }

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      renderer.setSize(w, h); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize); ro.observe(mount); resize()
    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera) })

    // identifikasi struktur dengan ketukan (bukan seretan)
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2()
    let down: [number, number] | null = null
    const onDown = (e: PointerEvent) => { down = [e.clientX, e.clientY] }
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return
      const r = renderer.domElement.getBoundingClientRect()
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ptr, camera)
      const hit = ray.intersectObject(root, true).find((h) => h.object.visible)
      let o: THREE.Object3D | null = hit?.object ?? null
      while (o && !o.userData.panacea_structure_id) o = o.parent
      if (o) select(o)
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)
    return () => {
      ro.disconnect()
      renderer.setAnimationLoop(null)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()) }
      })
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      sceneRef.current = null
    }
    // select bersifat stabil (hanya memakai ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── muat ulang GLB saat tubuh / LOD berubah ─────────────────────────────────
  useEffect(() => {
    const s = sceneRef.current
    if (!s || !systems.length) return
    let cancelled = false
    setLoading(true); setPicked(null); selectedRef.current = null
    s.root.traverse((o) => {
      if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()) }
    })
    s.root.clear(); s.groups.clear(); s.byId.clear()
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const tag = fileTag(bodyId)
    const t0 = performance.now()
    Promise.allSettled(systems.map(async (sys) => {
      const g = await loader.loadAsync(`${BASE}${tag}.${sys}.${lod}.glb`)
      return { sys, scene: g.scene }
    })).then((results) => {
      if (cancelled) return
      let tris = 0
      for (const r of results) {
        if (r.status !== 'fulfilled') continue
        const { sys, scene } = r.value
        scene.traverse((o) => {
          if (o.userData.panacea_structure_id) s.byId.set(o.userData.panacea_structure_id, o)
          if (o instanceof THREE.Mesh) {
            o.material = (o.material as THREE.Material).clone()
            o.userData.baseOpacity = sys === 'surface' ? 0.12 : 1
            const geo = o.geometry
            tris += geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3
            if (sys === 'surface') o.raycast = () => {}  // kulit tembus pandang tidak menghalangi ketukan
          }
        })
        s.groups.set(sys, scene)
        s.root.add(scene)
      }
      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed) setError(`${failed} system file(s) could not be loaded.`)
      setStats({ structures: s.byId.size, tris: Math.round(tris), ms: Math.round(performance.now() - t0) })
      frame()
      applyVisibility()
      setLoading(false)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyId, lod, systems])

  useEffect(() => { applyVisibility() })  // sistem, mode, pilihan

  function frame() {
    const s = sceneRef.current
    if (!s) return
    const box = new THREE.Box3().setFromObject(s.root)
    if (box.isEmpty()) return
    const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3())
    s.controls.target.copy(c)
    s.camera.position.set(c.x, c.y, c.z + Math.max(size.y, size.x * s.camera.aspect) * 1.9)
    s.controls.update()
  }

  function focusOn(o: THREE.Object3D) {
    const s = sceneRef.current
    if (!s) return
    const box = new THREE.Box3().setFromObject(o)
    const c = box.getCenter(new THREE.Vector3())
    const r = Math.max(box.getSize(new THREE.Vector3()).length(), 0.08)
    const dir = s.camera.position.clone().sub(s.controls.target).normalize()
    s.controls.target.copy(c)
    s.camera.position.copy(c.clone().add(dir.multiplyScalar(r * 3.2)))
  }

  function applyVisibility() {
    const s = sceneRef.current
    if (!s) return
    const sel = selectedRef.current
    const selObj = sel ? s.byId.get(sel) : undefined
    for (const [sys, g] of s.groups) {
      g.visible = enabled.has(sys) || (mode === 'isolate' && !!selObj && isInside(selObj, g))
      g.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return
        const m = o.material as THREE.MeshStandardMaterial
        const inSel = !!selObj && isInside(o, selObj)
        const base = o.userData.baseOpacity as number
        let opacity = base
        if (selObj && mode === 'ghost' && !inSel) opacity = Math.min(base, 0.12)
        o.visible = !(selObj && mode === 'isolate' && !inSel)
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
      license: u.panacea_license ?? '', note: u.panacea_qa_note,
    })
  }

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const s = sceneRef.current
    if (q.length < 2 || !s) return []
    const out: Array<{ id: string; name: string }> = []
    for (const [id, o] of s.byId) {
      const name = String(o.userData.canonical_name ?? id)
      if (name.toLowerCase().includes(q) || id.toLowerCase().includes(q)) out.push({ id, name: `${name}${o.userData.panacea_laterality === 'left' ? ' (left)' : o.userData.panacea_laterality === 'right' ? ' (right)' : ''}` })
      if (out.length >= 8) break
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, stats])

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
            const available = b.structures > 0
            return (
              <button
                key={b.body_id}
                role="tab"
                aria-selected={b.body_id === bodyId}
                disabled={!available}
                title={available ? undefined : b.source_requirement ?? 'Source data required'}
                onClick={() => available && setBodyId(b.body_id)}
                className={`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-bold transition ${b.body_id === bodyId ? 'border-brand bg-brand text-white' : available ? 'border-neutral-500/30 bg-neutral-500/10' : 'cursor-not-allowed border-dashed border-neutral-500/30 opacity-55'}`}
              >
                {BODY_LABEL[b.body_id] ?? b.body_id}
                {!available && <span className="ml-1.5 text-[11px] font-semibold">· not yet</span>}
              </button>
            )
          })}
        </div>
        {body && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-neutral-600 dark:text-neutral-300">
            <Badge tone={statusTone(body.status)}>{body.status.replaceAll('_', ' ')}</Badge>
            <span>{body.structures.toLocaleString('en')} structures</span>
            {body.source && <span className="min-w-0 truncate">· {body.source}</span>}
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
          <div className="pointer-events-auto flex rounded-full border border-white/15 bg-black/50 p-1 backdrop-blur">
            {(['LOD3', 'LOD2'] as const).map((l) => (
              <button key={l} onClick={() => setLod(l)} aria-pressed={lod === l}
                className={`min-h-[36px] rounded-full px-3 text-[12px] font-bold ${lod === l ? 'bg-[#f2f4f6] text-[#0b0c0e]' : 'text-white/80'}`}>
                {l === 'LOD3' ? 'Light' : 'Detailed'}
              </button>
            ))}
          </div>
        </div>
        {loading && <div className="absolute inset-0 grid place-items-center text-sm font-bold text-white/80">Loading anatomy…</div>}
        {!loading && stats.structures > 0 && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/70">
            {stats.structures.toLocaleString('en')} structures · {Math.round(stats.tris / 1000)}k triangles · {stats.ms} ms
          </div>
        )}
      </div>

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
                      const o = sceneRef.current?.byId.get(m.id)
                      if (!o) return
                      const sys = String(o.userData.panacea_system ?? '')
                      if (sys && !enabled.has(sys)) toggle(sys)
                      select(o); focusOn(o); setQuery('')
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
            <p className="break-all font-mono text-[11px] text-neutral-500">{picked.id}</p>
            <p className="text-sm text-neutral-700 dark:text-neutral-200">
              {SYSTEM_LABEL[picked.system] ?? picked.system}
              {picked.laterality && picked.laterality !== 'unpaired' ? ` · ${picked.laterality}` : ''}
            </p>
            <p className="text-[13px] text-neutral-600 dark:text-neutral-300">Source: {picked.source}{picked.license ? ` (${picked.license})` : ''}</p>
            {picked.note && <p className="text-[13px] text-amber-800 dark:text-amber-200">Note: {picked.note}</p>}
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
        Adult female: HuBMAP VH_Female from the NLM Visible Human female (CC BY 4.0). Bodies marked “not yet” need
        source anatomy that this project does not have; they are not built by scaling an adult body.
      </p>
    </div>
  )
}
