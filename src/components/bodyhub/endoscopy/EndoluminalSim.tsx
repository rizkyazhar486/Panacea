// Interactive virtual endoscopy simulator. The ROUTE and CALIBRE come from the Z-Anatomy / BodyParts3D reference
// meshes in public/anatomy/visceral.glb (CC BY-SA 4.0): their centre line and mean radius are computed by lumenPath.
// The wall is then rebuilt as a smooth high-resolution tube on that route so it can move: insufflation, suction,
// peristalsis or breathing, and simulated textbook mucosal relief (haustra, rugae, circular folds, cartilage rings).
// The learner drives the scope — push/pull, tip angulation, air, suction — with red-out on wall contact.
// Teaching model only: no patient anatomy, lesion, insertion distance, force, device setting or safe trajectory.
import { useEffect, useRef, useState, type KeyboardEvent as RKeyboardEvent, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent } from 'react'
import * as THREE from 'three'
import {
  lumenPath, anteriorMap, routeProfile, openFactor, initialScope, stepScope,
  type ScopeInput, type ScopeState, type WallPattern, type RouteProfile,
} from '../../../domains/body-exposure'
import { mulaiLoopTerjaga, type LoopTerjaga } from '../../../lib/loopRenderTerjaga'
import { mucosaTextures } from './mucosaTexture'
import { buatRigScope, buildTube, curveOf, muatVisceral, nodeWorld, RIDGE_AIRWAY, smoothSlices, wallMaterial, wallUniforms, type Tube } from './endoluminalCore'

export interface EndoluminalSegment {
  /** Node name in visceral.glb after GLTFLoader sanitising (spaces → _). */
  node: string
  label: string
  /** 'all' merges every mesh under the node; 'own' takes only the node's own shaft (bronchial nodes nest children). */
  take: 'all' | 'own'
  wall: WallPattern
}

export interface EndoluminalLandmark { label: string; t: number }

interface Props {
  segments: readonly EndoluminalSegment[]
  startNear: { x: number; y: number; z: number }
  tint: string
  vesselTone: string
  /** Peristaltic wave amplitude (GI) and breathing amplitude (airway), as fractions of the radius. */
  peristalsis: number
  breathing: number
  /** Teleport request: route fraction plus a counter so the same landmark can be chosen twice. */
  jump: { t: number; n: number } | null
  onLandmarks?: (landmarks: EndoluminalLandmark[]) => void
  onProgress?: (t: number) => void
}

type Hud = { t: number; cm: number; contact: boolean; insuf: number; segment: number }
type Status = 'loading' | 'ready' | 'error' | 'no-webgl'

export default function EndoluminalSim({ segments, startNear, tint, vesselTone, peristalsis, breathing, jump, onLandmarks, onProgress }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<ScopeInput>({ push: 0, aimYaw: 0, aimPitch: 0, air: false, suction: false })
  const steeringRef = useRef(false)
  const jumpRef = useRef<((t: number) => void) | null>(null)
  const cb = useRef({ onLandmarks, onProgress })
  cb.current = { onLandmarks, onProgress }
  const [status, setStatus] = useState<Status>('loading')
  const [hud, setHud] = useState<Hud>({ t: 0, cm: 0, contact: false, insuf: 0.35, segment: 0 })
  const [map, setMap] = useState<{ x: number; y: number; t: number }[]>([])
  const [labels, setLabels] = useState<EndoluminalLandmark[]>([])
  const [touched, setTouched] = useState(false)
  const kunci = segments.map((s) => `${s.node}:${s.take}:${s.wall}`).join('|')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    setStatus('loading')
    let hidup = true
    let loop: LoopTerjaga | null = null
    const rig = buatRigScope(host, () => { loop?.kontekHilang(); if (hidup) setStatus('no-webgl') })
    if (!rig) { setStatus('no-webgl'); return }
    const tex = mucosaTextures(segments.length * 7919 + 17, vesselTone)
    const uniforms = wallUniforms(peristalsis, breathing)
    const material = wallMaterial(tex, uniforms)

    let mesh: THREE.Mesh | null = null
    let curve: THREE.CatmullRomCurve3 | null = null
    let tube: Tube | null = null
    let profile: RouteProfile | null = null
    let landmarks: EndoluminalLandmark[] = []
    let st: ScopeState = initialScope()
    let red = 0

    jumpRef.current = (t: number) => {
      if (!profile) return
      st = { ...initialScope(st.insuf), s: Math.max(0, Math.min(1, t)) * profile.length, time: st.time }
    }

    const P = new THREE.Vector3(), q = new THREE.Vector3()
    let last = 0, hudAt = 0
    const frame = () => {
      const now = performance.now()
      const dt = last && now - last < 250 ? Math.min(0.1, (now - last) / 1000) : 0.016
      last = now
      if (!curve || !tube || !profile) return
      const inp = inputRef.current
      if (!steeringRef.current) { const k = Math.exp(-dt * 2.2); inp.aimYaw *= k; inp.aimPitch *= k }
      st = stepScope(st, inp, dt, profile)
      const u = Math.min(0.9995, st.s / profile.length)
      const i = Math.round(u * (tube.rings - 1))
      const tan = tube.frames.tangents[i], nor = tube.frames.normals[i], bin = tube.frames.binormals[i]
      curve.getPointAt(u, P)
      P.addScaledVector(bin, st.ox).addScaledVector(nor, st.oy)
      q.copy(tan).multiplyScalar(Math.cos(st.yaw) * Math.cos(st.pitch))
        .addScaledVector(bin, Math.sin(st.yaw) * Math.cos(st.pitch))
        .addScaledVector(nor, Math.sin(st.pitch))
      rig.aim(P, q, nor, bin)
      uniforms.uOpen.value = openFactor(st.insuf)
      uniforms.uInsuf.value = st.insuf
      uniforms.uTime.value = st.time
      red += ((st.contact ? 1 : 0) - red) * Math.min(1, dt * 8)
      rig.optics.uniforms.uRed.value = red
      rig.composer.render(dt)
      if (now - hudAt > 120) {
        hudAt = now
        const t = st.s / profile.length
        let segment = 0
        for (let k = 0; k < landmarks.length; k++) if (t >= landmarks[k].t) segment = k
        setHud({ t, cm: st.s * 100, contact: st.contact, insuf: st.insuf, segment })
        cb.current.onProgress?.(t)
      }
    }
    loop = mulaiLoopTerjaga(host, frame)

    muatVisceral().then((root) => {
      if (!hidup) return
      const r = lumenPath(segments.map((s) => ({ label: s.label, positions: nodeWorld(root, s.node, s.take) })), 24, startNear)
      if (!r.ok) { setStatus('error'); return }
      const slices = smoothSlices(r.slices)
      profile = routeProfile(slices)
      if (!profile) { setStatus('error'); return }
      landmarks = r.landmarks
      curve = curveOf(slices)
      const starts = landmarks.map((l) => l.t)
      const patternAt = (u: number) => { let k = 0; for (let i = 0; i < starts.length; i++) if (u >= starts[i]) k = i; return segments[k].wall }
      const base = new THREE.Color(tint)
      const ridge = segments.some((s) => s.wall === 'trachea' || s.wall === 'bronchus') ? new THREE.Color(RIDGE_AIRWAY) : base.clone().offsetHSL(0, -0.05, 0.08)
      tube = buildTube(curve, profile, patternAt, base, ridge)
      mesh = new THREE.Mesh(tube.geometry, material)
      mesh.frustumCulled = false
      rig.scene.add(mesh)
      const cum = [0]
      for (let i = 1; i < r.slices.length; i++) {
        const a = r.slices[i - 1], b = r.slices[i]
        cum.push(cum[i - 1] + Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z))
      }
      setMap((anteriorMap(r.slices) ?? []).map((m, i) => ({ ...m, t: r.length > 0 ? cum[i] / r.length : 0 })))
      const lm = landmarks.map((l, i) => ({ label: segments[i].label, t: l.t }))
      setLabels(lm)
      cb.current.onLandmarks?.(lm)
      setStatus('ready')
    }).catch(() => { if (hidup) setStatus('error') })

    return () => {
      hidup = false
      jumpRef.current = null
      loop?.hentikan()
      tube?.geometry.dispose()
      tex?.dispose()
      material.dispose()
      rig.dispose()
    }
    // The procedure is identified by kunci; the other props are constant per procedure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci])

  useEffect(() => {
    if (jump) jumpRef.current?.(jump.t)
  }, [jump])

  // Steering: drag on the image moves the tip like the angulation wheels; it relaxes back when released.
  const drag = useRef<{ x: number; y: number } | null>(null)
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY }
    steeringRef.current = true
    setTouched(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const w = e.currentTarget.clientWidth || 1
    const c = (v: number) => Math.max(-1, Math.min(1, v))
    inputRef.current.aimYaw = c(-(e.clientX - drag.current.x) / (w * 0.3))
    inputRef.current.aimPitch = c((e.clientY - drag.current.y) / (w * 0.3))
  }
  const onUp = () => { drag.current = null; steeringRef.current = false }

  const hold = (key: 'push' | 'air' | 'suction', value: number | boolean) => ({
    onPointerDown: (e: RPointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); setTouched(true); (inputRef.current as unknown as Record<string, number | boolean>)[key] = value },
    onPointerUp: () => { (inputRef.current as unknown as Record<string, number | boolean>)[key] = key === 'push' ? 0 : false },
    onPointerCancel: () => { (inputRef.current as unknown as Record<string, number | boolean>)[key] = key === 'push' ? 0 : false },
    onKeyDown: (e: RKeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); (inputRef.current as unknown as Record<string, number | boolean>)[key] = value } },
    onKeyUp: (e: RKeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') (inputRef.current as unknown as Record<string, number | boolean>)[key] = key === 'push' ? 0 : false },
    onContextMenu: (e: RMouseEvent) => e.preventDefault(),
  })

  // Keyboard driving when the view has focus: ↑/↓ push-pull, W/A/S/D angulation, Space air, Q suction.
  const onKey = (down: boolean) => (e: RKeyboardEvent) => {
    const i = inputRef.current
    const k = e.key.toLowerCase()
    if (k === 'arrowup') i.push = down ? 1 : 0
    else if (k === 'arrowdown') i.push = down ? -1 : 0
    else if (k === 'a') { i.aimYaw = down ? 1 : 0; steeringRef.current = down }
    else if (k === 'd') { i.aimYaw = down ? -1 : 0; steeringRef.current = down }
    else if (k === 'w') { i.aimPitch = down ? 1 : 0; steeringRef.current = down }
    else if (k === 's') { i.aimPitch = down ? -1 : 0; steeringRef.current = down }
    else if (k === ' ') i.air = down
    else if (k === 'q') i.suction = down
    else return
    e.preventDefault()
    setTouched(true)
  }

  const here = map.length ? map.reduce((best, m) => (m.t <= hud.t ? m : best), map[0]) : null
  const mapPath = map.map((m, i) => `${i ? 'L' : 'M'}${m.x.toFixed(1)} ${m.y.toFixed(1)}`).join(' ')
  const btn = 'flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-[16px] text-[11px] font-bold select-none touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70'

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-black sm:aspect-[16/10]">
        <div
          ref={hostRef}
          tabIndex={0}
          role="application"
          aria-label="Endoscope view. Drag to angle the tip; arrow up and down to push and pull; W A S D to angle; Space for air; Q for suction."
          className="absolute inset-0 cursor-grab touch-none select-none outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-200/50"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey(true)}
          onKeyUp={onKey(false)}
        />
        <div className="pointer-events-none absolute left-3 top-3 max-w-[55%]">
          <div className="text-[13px] font-black text-white">{labels[hud.segment]?.label ?? segments[0].label}</div>
          <div className="text-[11px] font-semibold tabular-nums text-white/55">{hud.cm.toFixed(0)} cm along reference route</div>
        </div>
        {here && (
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute right-3 top-3 h-[72px] w-[72px]" role="img" aria-label="Route seen from the front; R is the body's right">
            <path d={mapPath} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={mapPath} fill="none" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={here.x} cy={here.y} r="5.5" fill="#fff" />
            <text x="2" y="98" fontSize="11" fontWeight="800" fill="rgba(255,255,255,.55)">R</text>
            <text x="90" y="98" fontSize="11" fontWeight="800" fill="rgba(255,255,255,.55)">L</text>
          </svg>
        )}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 text-[11px] font-bold text-white/60">
          <span>Air</span>
          <span className="block h-1.5 w-14 overflow-hidden rounded-full bg-white/15"><span className="block h-full bg-sky-200" style={{ width: `${Math.round(hud.insuf * 100)}%` }} /></span>
        </div>
        {hud.contact && status === 'ready' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 text-center text-[12px] font-black text-white">Red-out — pull back and steer to the dark lumen</div>
        )}
        {status === 'ready' && !touched && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 text-center text-[12px] font-bold text-white/80">Hold Push · drag the image to steer · Air opens the lumen</div>
        )}
        {status !== 'ready' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-[12px] font-bold text-white/60">
            {status === 'loading' && 'Preparing the simulator…'}
            {status === 'error' && 'Reference meshes for this route could not be loaded.'}
            {status === 'no-webgl' && 'The simulator needs WebGL, which this browser has turned off.'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2" aria-label="Scope controls">
        <button type="button" data-pmd-native="true" style={{ background: 'rgba(255,255,255,.08)', color: '#fff' }} className={btn} aria-label="Pull back (hold)" {...hold('push', -1)}>
          <span aria-hidden className="text-base leading-none">▼</span>Pull
        </button>
        <button type="button" data-pmd-native="true" style={{ background: '#fff', color: '#000' }} className={btn} aria-label="Push in (hold)" {...hold('push', 1)}>
          <span aria-hidden className="text-base leading-none">▲</span>Push
        </button>
        <button type="button" data-pmd-native="true" style={{ background: 'rgba(186,230,253,.14)', color: '#e0f2fe' }} className={btn} aria-label="Insufflate air (hold)" {...hold('air', true)}>
          <span aria-hidden className="text-base leading-none">◎</span>Air
        </button>
        <button type="button" data-pmd-native="true" style={{ background: 'rgba(255,255,255,.08)', color: '#fff' }} className={btn} aria-label="Suction (hold)" {...hold('suction', true)}>
          <span aria-hidden className="text-base leading-none">◉</span>Suction
        </button>
      </div>
    </div>
  )
}
