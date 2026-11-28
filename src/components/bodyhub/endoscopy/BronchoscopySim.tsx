// Whole-tree bronchoscopy simulator. Every bronchus is a tube on the centre line of its own Z-Anatomy / BodyParts3D
// mesh (CC BY-SA 4.0): trachea, main, lobar and segmental bronchi from BRONCHIAL_TREE, and the subsegmental pieces
// the atlas carries inside each segmental mesh. Tubes cut each other where they meet, so the carina and every orifice
// are the real intersection of the reference tubes. The learner aims at an orifice (or taps its label) and pushes in;
// pulling back past a branch's origin returns to the parent.
// Teaching model only: no patient airway, lesion, insertion depth, force, scope size or safe trajectory.
import { memo, useEffect, useRef, useState, type KeyboardEvent as RKeyboardEvent, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent } from 'react'
import * as THREE from 'three'
import {
  BRONCHIAL_TREE, airwayRoute, buildAirwayTree, chooseChild, indexPath, initialScope, meshIslands, nextAirwayPath, openFactor, radiusAt,
  routeBranchAt, stepScope, withSubsegments,
  type AirwayBranch, type AirwayRoute, type LumenSlice, type RouteProfile, type ScopeInput, type ScopeState,
} from '../../../domains/body-exposure'
import type { AirwayJump } from './airwayStops'
import { mulaiLoopTerjaga, type LoopTerjaga } from '../../../lib/loopRenderTerjaga'
import { mucosaTextures } from './mucosaTexture'
import { buatRigScope, buildTube, curveOf, cutsFrom, meshWorld, muatVisceral, RIDGE_AIRWAY, smoothSlices, wallMaterial, wallUniforms } from './endoluminalCore'

interface Props {
  tint: string
  vesselTone: string
  breathing: number
  jump: AirwayJump | null
}

const START_NEAR = { x: 0, y: 1.6, z: 0 }
const LABELS = 8
/** Start 2 cm into the trachea: from the tube's very first slice the camera looked at the wall, not down the lumen. */
const TRACHEA_IN = 0.02
// Branches drawn around the scope's branch, counted in parent/child steps.
const NEAR_HOPS = 3
const MIN_R = 0.0008

/** Arc-length profile with the atlas radii as measured (the GI floor of 4 mm would swell subsegmental airways). */
function trueProfile(slices: readonly LumenSlice[]): RouteProfile | null {
  if (slices.length < 2) return null
  const s = [0], r = [Math.max(MIN_R, slices[0].r)]
  for (let i = 1; i < slices.length; i++) {
    const a = slices[i - 1], b = slices[i]
    s.push(s[i - 1] + Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z))
    r.push(Math.max(MIN_R, b.r))
  }
  const length = s[s.length - 1]
  return length > 0 ? { s, r, length } : null
}

/** Display centre line of each branch: smoothed, and starting at its parent's end so the tubes meet. */
function displayTree(branches: readonly AirwayBranch[]): AirwayBranch[] {
  const smooth = branches.map((b) => smoothSlices(b.slices))
  return branches.map((b, i) => {
    let slices = smooth[i]
    if (b.parent >= 0) {
      const e = smooth[b.parent][smooth[b.parent].length - 1]
      const f = slices[0]
      if (Math.hypot(e.x - f.x, e.y - f.y, e.z - f.z) > 1e-6) slices = [{ ...e, r: f.r }, ...slices]
    }
    return { ...b, slices, profile: trueProfile(slices) ?? b.profile }
  })
}

type Cut = { a: LumenSlice; b: LumenSlice; open?: boolean }

/**
 * The first or last `span` metres of a branch as `n` cut segments, sampled on the same smoothed curve and radius the
 * tube is built from. Straight segments between the raw slices bowed away from the tube at oblique junctions, and the
 * cut then removed a neighbour's wall where this tube did not replace it: a black hole at the crotch.
 */
function curveCuts(curve: THREE.CatmullRomCurve3, prof: RouteProfile, atStart: boolean, span: number, n: number): Cut[] {
  const L = prof.length, from = atStart ? 0 : Math.max(0, L - span), to = atStart ? Math.min(L, span) : L
  const P = new THREE.Vector3()
  const pts = Array.from({ length: n + 1 }, (_, k) => {
    const s = Math.min(L, from + ((to - from) * k) / n)
    curve.getPointAt(L > 0 ? s / L : 0, P)
    return { x: P.x, y: P.y, z: P.z, r: radiusAt(prof, s) }
  })
  return pts.slice(1).map((b, k) => ({ a: pts[k], b, open: atStart && k === 0 }))
}

/** Round cones whose inside is cut from branch i: the parent's distal end, and the start of children and siblings. */
function cutsFor(tree: readonly AirwayBranch[], curves: readonly THREE.CatmullRomCurve3[], i: number) {
  const b = tree[i]
  // The same reach as before (the parent's last four slice gaps, three at a branch start), now along the curve.
  const reach = (j: number, atStart: boolean, gaps: number) => {
    const s = tree[j].profile.s, n = s.length - 1
    return atStart ? s[Math.min(gaps, n)] : s[n] - s[Math.max(0, n - gaps)]
  }
  const caps = b.parent >= 0 ? curveCuts(curves[b.parent], tree[b.parent].profile, false, reach(b.parent, false, 4), 4) : []
  const starts = [...b.children, ...(b.parent >= 0 ? tree[b.parent].children.filter((c) => c !== i) : [])]
  for (const c of starts) caps.push(...curveCuts(curves[c], tree[c].profile, true, reach(c, true, 3), 3))
  return cutsFrom(caps)
}

/** The tree outline; re-rendered only when the route changes, not with every HUD tick. */
const TreePaths = memo(function TreePaths({ paths, route }: { paths: readonly { i: number; d: string }[]; route: string }) {
  const on = new Set(route.split(',').map(Number))
  return (
    <>
      {paths.map((p) => (
        <path key={p.i} d={p.d} fill="none" stroke={on.has(p.i) ? '#fda4af' : 'rgba(255,255,255,.22)'} strokeWidth={on.has(p.i) ? 2.2 : 0.8} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </>
  )
})

type Status = 'loading' | 'ready' | 'error' | 'no-webgl'
interface Hud { name: string; crumbs: string[]; cm: number; contact: boolean; end: boolean; kids: { i: number; code: string; name: string }[]; next: number }

export default function BronchoscopySim({ tint, vesselTone, breathing, jump }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])
  const inputRef = useRef<ScopeInput>({ push: 0, aimYaw: 0, aimPitch: 0, air: true, suction: false })
  const steeringRef = useRef(false)
  const lockRef = useRef(-1)
  const jumpRef = useRef<((id: string) => void) | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [hud, setHud] = useState<Hud>({ name: 'Trachea', crumbs: ['Trachea'], cm: 0, contact: false, end: false, kids: [], next: -1 })
  const [map, setMap] = useState<{ paths: { i: number; d: string }[]; project: (x: number, y: number) => [number, number] } | null>(null)
  const [onPath, setOnPath] = useState('0')
  const [dot, setDot] = useState<[number, number] | null>(null)
  const [touched, setTouched] = useState(false)
  const [pick, setPick] = useState(-1)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let hidup = true
    let loop: LoopTerjaga | null = null
    const rig = buatRigScope(host, () => { loop?.kontekHilang(); if (hidup) setStatus('no-webgl') })
    if (!rig) { setStatus('no-webgl'); return }
    const tex = mucosaTextures(BRONCHIAL_TREE.length * 7919 + 17, vesselTone)
    const uniforms = wallUniforms(0, breathing)
    const materials: THREE.Material[] = []
    const geometries: THREE.BufferGeometry[] = []
    const meshes: THREE.Mesh[] = []
    // The wall shader discards at junction cuts, which defeats early-z, so every tube in view was shaded in full.
    // From inside a lumen the opaque walls hide anything more than a few branches away, so draw only those.
    const showNear = (at: number) => {
      const near = new Set([at])
      let ring = [at]
      for (let hop = 0; hop < NEAR_HOPS; hop++) {
        ring = ring.flatMap((i) => [tree[i].parent, ...tree[i].children]).filter((i) => i >= 0 && !near.has(i))
        ring.forEach((i) => near.add(i))
      }
      meshes.forEach((m, i) => { m.visible = near.has(i) })
    }
    let tree: AirwayBranch[] = []
    let route: AirwayRoute | null = null
    let curve: THREE.CatmullRomCurve3 | null = null
    let frames: ReturnType<THREE.CatmullRomCurve3['computeFrenetFrames']> | null = null
    let rings = 0
    let st: ScopeState = initialScope(1)
    let red = 0
    let current = 0
    const up = new THREE.Vector3(0, 0, 1)

    const setRoute = (path: number[]) => {
      const r = airwayRoute(tree, path)
      if (!r) return false
      route = r
      curve = curveOf(r.slices)
      rings = Math.max(32, Math.round(r.profile.length / 0.001))
      frames = curve.computeFrenetFrames(rings - 1, false)
      st = { ...st, s: Math.min(st.s, r.profile.length) }
      return true
    }

    jumpRef.current = (id: string) => {
      if (!tree.length) return
      const carina = id === 'carina'
      const at = carina ? 0 : tree.findIndex((b) => b.id === id)
      if (at < 0) return
      lockRef.current = -1
      setPick(-1)
      st = { ...initialScope(1), time: st.time }
      if (!setRoute(indexPath(tree, at)) || !route) return
      const r: AirwayRoute = route
      st = { ...st, s: carina ? Math.max(0, r.ends[0] - 0.018) : r.starts[r.starts.length - 1] + (at === 0 ? TRACHEA_IN : 0.001) }
    }

    const P = new THREE.Vector3(), q = new THREE.Vector3(), side = new THREE.Vector3(), tmp = new THREE.Vector3()
    let last = 0, hudAt = 0
    // Label placement needs the view size; reading clientWidth in the frame forced a whole-page layout after each HUD update.
    const size = { w: host.clientWidth, h: host.clientHeight }
    const sizeObs = new ResizeObserver(([e]) => { size.w = e.contentRect.width; size.h = e.contentRect.height })
    sizeObs.observe(host)
    const frame = () => {
      const now = performance.now()
      const dt = last && now - last < 250 ? Math.min(0.1, (now - last) / 1000) : 0.016
      last = now
      if (!route || !curve || !frames) return
      const inp = inputRef.current
      inp.air = !inp.suction
      if (!steeringRef.current) { const k = Math.exp(-dt * 2.2); inp.aimYaw *= k; inp.aimPitch *= k }
      st = stepScope(st, inp, dt, route.profile)
      const L = route.profile.length
      const u = Math.min(0.9995, st.s / L)
      const fi = Math.round(u * (rings - 1))
      const tan = frames.tangents[fi], nor = frames.normals[fi], bin = frames.binormals[fi]
      curve.getPointAt(u, P)
      P.addScaledVector(bin, st.ox).addScaledVector(nor, st.oy)
      q.copy(tan).multiplyScalar(Math.cos(st.yaw) * Math.cos(st.pitch))
        .addScaledVector(bin, Math.sin(st.yaw) * Math.cos(st.pitch))
        .addScaledVector(nor, Math.sin(st.pitch))
      // Frames are recomputed when the route changes at a bifurcation; ease the image's "up" instead of snapping it.
      up.lerp(nor, Math.min(1, dt * 6)).normalize()
      side.crossVectors(q, up).normalize()
      rig.aim(P, q, up, side)
      uniforms.uOpen.value = openFactor(st.insuf)
      uniforms.uInsuf.value = st.insuf
      uniforms.uTime.value = st.time
      red += ((st.contact ? 1 : 0) - red) * Math.min(1, dt * 8)
      rig.optics.uniforms.uRed.value = red

      // Branch choice: aim at an orifice, or keep the one tapped by name.
      const at = routeBranchAt(route, st.s)
      const here = route.path[at]
      if (here !== current) { current = here; lockRef.current = -1; setPick(-1); showNear(here) }
      const aimed = chooseChild(tree, here, { x: P.x, y: P.y, z: P.z }, { x: q.x, y: q.y, z: q.z })
      const want = nextAirwayPath(tree, route, st.s, aimed, lockRef.current)
      if (want) setRoute(want)

      rig.composer.render(dt)

      // Orifice labels over the image, like a teaching bronchoscopy atlas.
      const kids = tree[here].children
      const next = route.path[at + 1] ?? -1
      for (let k = 0; k < LABELS; k++) {
        const el = labelRefs.current[k]
        if (!el) continue
        const c = kids[k]
        if (c === undefined) { el.style.opacity = '0'; continue }
        const sl = tree[c].slices[Math.min(2, tree[c].slices.length - 1)]
        tmp.set(sl.x, sl.y, sl.z)
        const dist = tmp.distanceTo(P)
        tmp.project(rig.camera)
        const inFront = tmp.z < 1 && tmp.z > -1 && Math.abs(tmp.x) < 0.9 && Math.abs(tmp.y) < 0.9
        if (!inFront || dist > 0.05) { el.style.opacity = '0'; continue }
        el.style.opacity = '1'
        el.style.transform = `translate(${((tmp.x + 1) / 2) * size.w}px, ${((1 - tmp.y) / 2) * size.h}px) translate(-50%, -50%)`
        if (el.textContent !== tree[c].code) el.textContent = tree[c].code
        const isNext = c === next ? 'true' : 'false'
        if (el.dataset.next !== isNext) el.dataset.next = isNext
      }

      if (now - hudAt > 150) {
        hudAt = now
        const crumbs = route.path.slice(0, at + 1).map((i) => tree[i].code).filter((c, k, a) => c !== a[k - 1])
        const end = !kids.length && st.s > route.profile.length - 0.002
        setHud({ name: tree[here].name, crumbs, cm: st.s * 100, contact: st.contact, end, kids: kids.map((i) => ({ i, code: tree[i].code, name: tree[i].name })), next })
        setOnPath(route.path.slice(0, at + 1).join(','))
        setDot([P.x, P.y])
      }
    }
    loop = mulaiLoopTerjaga(host, frame)

    muatVisceral().then((root) => {
      if (!hidup) return
      const meshOf = (id: string) => {
        const def = BRONCHIAL_TREE.find((d) => d.id === id)
        const m = def ? root.getObjectByName(def.mesh) : null
        return m && (m as THREE.Mesh).isMesh ? (m as THREE.Mesh) : null
      }
      const built = buildAirwayTree(
        BRONCHIAL_TREE.map(({ id, parent, code, name }) => ({ id, parent, code, name })),
        (id) => { const m = meshOf(id); return m ? meshWorld(m) : new Float32Array() },
        START_NEAR,
      )
      if (!built.ok) { setStatus('error'); return }
      const full = withSubsegments(built.branches, (b) => {
        const m = meshOf(b.id)
        return m ? meshIslands(meshWorld(m), m.geometry.index?.array ?? null) : null
      })
      tree = displayTree(full)
      const base = new THREE.Color(tint), ridge = new THREE.Color(RIDGE_AIRWAY)
      const curves = tree.map((b) => curveOf(b.slices))
      tree.forEach((b, i) => {
        const prof = b.profile
        const tube = buildTube(curves[i], prof, () => (i === 0 ? 'trachea' : 'bronchus'), base, ridge, { cap: true, minRings: 16, maxRings: 500, ringStep: 0.0012 })
        const material = wallMaterial(tex, uniforms, cutsFor(tree, curves, i))
        const mesh = new THREE.Mesh(tube.geometry, material)
        // The shader only narrows the open rest pose (or widens it a few percent with breathing), so padded rest bounds are safe.
        tube.geometry.computeBoundingSphere()
        if (tube.geometry.boundingSphere) tube.geometry.boundingSphere.radius *= 1.15
        rig.scene.add(mesh)
        meshes.push(mesh)
        materials.push(material)
        geometries.push(tube.geometry)
      })
      if (!setRoute([0])) { setStatus('error'); return }
      // One frame with every tube visible uploads all buffers now; uploads on first sight stuttered the push.
      meshes.forEach((m) => { m.frustumCulled = false })
      rig.composer.render(0)
      meshes.forEach((m) => { m.frustumCulled = true })
      showNear(0)
      st = { ...st, s: TRACHEA_IN }
      // Anterior map of the whole tree: viewer faces the body, so the patient's right is on the left.
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
      for (const b of tree) for (const s of b.slices) { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y) }
      const k = 84 / Math.max(x1 - x0, y1 - y0), ox = (100 - (x1 - x0) * k) / 2, oy = (100 - (y1 - y0) * k) / 2
      const project = (x: number, y: number): [number, number] => [ox + (x - x0) * k, 100 - (oy + (y - y0) * k)]
      setMap({ project, paths: tree.map((b, i) => ({ i, d: b.slices.map((s, j) => { const [px, py] = project(s.x, s.y); return `${j ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}` }).join(' ') })) })
      setStatus('ready')
    }).catch(() => { if (hidup) setStatus('error') })

    return () => {
      hidup = false
      jumpRef.current = null
      loop?.hentikan()
      sizeObs.disconnect()
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      tex?.dispose()
      rig.dispose()
    }
    // One airway per mount; tint, tone and breathing are constant for the procedure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (jump) jumpRef.current?.(jump.id)
  }, [jump])

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

  type Held = 'push' | 'suction'
  const set = (key: Held, on: boolean, value: number) => {
    if (key === 'push') inputRef.current.push = on ? value : 0
    else inputRef.current.suction = on
  }
  const hold = (key: Held, value = 1) => ({
    onPointerDown: (e: RPointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); setTouched(true); set(key, true, value) },
    onPointerUp: () => set(key, false, value),
    onPointerCancel: () => set(key, false, value),
    onKeyDown: (e: RKeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); set(key, true, value) } },
    onKeyUp: (e: RKeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') set(key, false, value) },
    onContextMenu: (e: RMouseEvent) => e.preventDefault(),
  })

  const onKey = (down: boolean) => (e: RKeyboardEvent) => {
    const i = inputRef.current
    const k = e.key.toLowerCase()
    if (k === 'arrowup') i.push = down ? 1 : 0
    else if (k === 'arrowdown') i.push = down ? -1 : 0
    else if (k === 'a') { i.aimYaw = down ? 1 : 0; steeringRef.current = down }
    else if (k === 'd') { i.aimYaw = down ? -1 : 0; steeringRef.current = down }
    else if (k === 'w') { i.aimPitch = down ? 1 : 0; steeringRef.current = down }
    else if (k === 's') { i.aimPitch = down ? -1 : 0; steeringRef.current = down }
    else if (k === 'q') i.suction = down
    else return
    e.preventDefault()
    setTouched(true)
  }

  const choose = (i: number) => { lockRef.current = i; setPick(i); setTouched(true) }
  const btn = 'flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-[16px] text-[11px] font-bold select-none touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70'
  const marked = pick >= 0 ? pick : hud.next

  return (
    <div className="flex flex-col gap-2">
      {/* Strict containment: the HUD updates several times a second and must not relayout the whole page. */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-black [contain:strict] sm:aspect-[16/10]">
        <div
          ref={hostRef}
          tabIndex={0}
          role="application"
          aria-label="Bronchoscope view. Drag to angle the tip toward an orifice; arrow up and down to push and pull; W A S D to angle; Q for suction."
          className="absolute inset-0 cursor-grab touch-none select-none outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-200/50"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey(true)}
          onKeyUp={onKey(false)}
        />
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: LABELS }, (_, k) => (
            <div
              key={k}
              ref={(el) => { labelRefs.current[k] = el }}
              style={{ opacity: 0, left: 0, top: 0 }}
              className="absolute rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-black text-white/90 ring-1 ring-white/25 transition-opacity data-[next=true]:bg-rose-300 data-[next=true]:text-black data-[next=true]:ring-0"
            />
          ))}
        </div>
        <div className="pointer-events-none absolute left-3 top-3 max-w-[58%]">
          <div className="text-[13px] font-black leading-tight text-white">{hud.name}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-white/60">{hud.crumbs.join(' › ')}</div>
          <div className="text-[11px] font-semibold tabular-nums text-white/45">{hud.cm.toFixed(1)} cm along reference route</div>
        </div>
        {map && (
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute right-2 top-2 h-[84px] w-[84px] sm:h-[112px] sm:w-[112px]" role="img" aria-label="Airway tree seen from the front; R is the body's right; the pink line is your route">
            <TreePaths paths={map.paths} route={onPath} />
            {dot && (() => { const [x, y] = map.project(dot[0], dot[1]); return <circle cx={x} cy={y} r="3.5" fill="#fff" /> })()}
            <text x="2" y="98" fontSize="10" fontWeight="800" fill="rgba(255,255,255,.55)">R</text>
            <text x="91" y="98" fontSize="10" fontWeight="800" fill="rgba(255,255,255,.55)">L</text>
          </svg>
        )}
        {hud.contact && status === 'ready' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-14 text-center text-[12px] font-black text-white">Red-out — pull back and steer to the dark lumen</div>
        )}
        {hud.end && status === 'ready' && (
          <div className="pointer-events-none absolute inset-x-4 bottom-14 text-center text-[12px] font-bold text-white/85">End of the atlas airway here. Smaller airways continue beyond the reference model.</div>
        )}
        {status === 'ready' && !touched && (
          <div className="pointer-events-none absolute inset-x-0 bottom-14 text-center text-[12px] font-bold text-white/80">Hold Push · drag to aim at an orifice · tap a label below to choose it</div>
        )}
        {status === 'ready' && hud.kids.length > 0 && (
          <div className="no-scrollbar absolute inset-x-2 bottom-2 flex gap-1.5 overflow-x-auto" role="group" aria-label="Next bronchus">
            {hud.kids.map((k) => (
              <button
                key={k.i}
                type="button"
                title={k.name}
                aria-pressed={k.i === marked}
                onClick={() => choose(k.i)}
                data-pmd-native="true"
                style={k.i === marked ? { background: '#fda4af', color: '#000', borderRadius: 9999 } : { background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 9999, border: '1px solid rgba(255,255,255,.25)' }}
                className="min-h-[40px] shrink-0 px-3 text-[12px] font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70"
              >
                {k.code}
              </button>
            ))}
          </div>
        )}
        {status !== 'ready' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-[12px] font-bold text-white/60">
            {status === 'loading' && 'Building the airway tree…'}
            {status === 'error' && 'Reference airway meshes could not be loaded.'}
            {status === 'no-webgl' && 'The simulator needs WebGL, which this browser has turned off.'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2" aria-label="Scope controls">
        <button type="button" data-pmd-native="true" style={{ background: 'rgba(255,255,255,.08)', color: '#fff' }} className={btn} aria-label="Pull back (hold)" {...hold('push', -1)}>
          <span aria-hidden className="text-base leading-none">▼</span>Pull
        </button>
        <button type="button" data-pmd-native="true" style={{ background: '#fff', color: '#000' }} className={btn} aria-label="Push in (hold)" {...hold('push', 1)}>
          <span aria-hidden className="text-base leading-none">▲</span>Push
        </button>
        <button type="button" data-pmd-native="true" style={{ background: 'rgba(255,255,255,.08)', color: '#fff' }} className={btn} aria-label="Suction (hold)" {...hold('suction')}>
          <span aria-hidden className="text-base leading-none">◉</span>Suction
        </button>
      </div>
    </div>
  )
}
