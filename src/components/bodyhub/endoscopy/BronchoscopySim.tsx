// Interactive bronchoscopy through the whole tracheobronchial tree to segmental level. The tree (topology, centre
// lines, calibre) comes from the Z-Anatomy / BodyParts3D shaft meshes in public/anatomy/visceral.glb (CC BY-SA 4.0)
// via buildAirwayTree. The wall is drawn by ray-marching a smooth union of tapered capsules around those centre lines,
// so every carina and orifice is a clean, continuous surface; cartilage rings, vessels, colour and breathing are
// simulated, and each orifice carries a textbook label so the learner can picture where the scope is.
// Teaching model only: no patient airway, lesion, distance, force, device setting or safe trajectory.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import {
  BRONCHIAL_TREE, buildAirwayTree, chooseChild, airwayPath, airwayCapsules, nearestCapsules,
  initialScope, stepScope, type AirwayBranch, type AirwayCapsule, type ScopeInput, type ScopeState,
} from '../../../domains/body-exposure'

const MAXC = 32

let muat: Promise<THREE.Object3D> | null = null
function muatVisceral(): Promise<THREE.Object3D> {
  if (!muat) {
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    muat = loader.loadAsync(`${import.meta.env.BASE_URL}anatomy/visceral.glb`).then((g) => {
      g.scene.updateMatrixWorld(true)
      return g.scene
    })
    muat.catch(() => { muat = null })
  }
  return muat
}

function meshPositions(root: THREE.Object3D, name: string): Float32Array {
  const m = root.getObjectByName(name) as THREE.Mesh | undefined
  if (!m || !m.isMesh) return new Float32Array()
  const p = m.geometry.attributes.position
  const out = new Float32Array(p.count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z }
  return out
}

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'

// Everything in centimetres relative to the scope tip, which keeps float precision high near the camera.
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec4 uA[${MAXC}];
uniform vec4 uB[${MAXC}];
uniform vec4 uS[${MAXC}];
uniform int uCount;
uniform vec3 uRight; uniform vec3 uUp; uniform vec3 uFwd;
uniform float uAspect; uniform float uTan; uniform float uTime; uniform float uRed; uniform float uBreath; uniform vec3 uPost;

float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// Lumen field: negative inside the airway. ring returns the cartilage-ring crest under the nearest wall.
float field(vec3 p, out float ring){
  float d = 1e5; float best = 1e5; ring = 0.0;
  float breath = 1.0 + uBreath * sin(6.2831853 * uTime / 4.2);
  for (int i = 0; i < ${MAXC}; i++) {
    if (i >= uCount) break;
    vec3 a = uA[i].xyz, b = uB[i].xyz;
    vec3 pa = p - a, ba = b - a;
    float l2 = max(dot(ba, ba), 1e-6);
    float h = clamp(dot(pa, ba) / l2, 0.0, 1.0);
    float r = mix(uA[i].w, uB[i].w, h) * breath;
    float s = uS[i].x + h * sqrt(l2);
    float gen = uS[i].y;
    // Cartilage rings every ~4 mm, prominent in trachea and main bronchi, faint by segmental level.
    float amp = gen < 0.5 ? 0.06 : gen < 1.5 ? 0.04 : gen < 2.5 ? 0.025 : 0.012;
    float rg = pow(0.5 + 0.5 * cos(6.2831853 * s / (gen < 0.5 ? 0.42 : 0.34)), 3.0);
    vec3 radial = pa - ba * h;
    float rl = length(radial);
    // Trachea and main bronchi: cartilage is C-shaped; the posterior third is a flat membranous wall without rings.
    if (gen < 1.5) rg *= 1.0 - smoothstep(0.15, 0.6, dot(radial / max(rl, 1e-4), uPost));
    float di = rl - r + amp * rg;
    if (di < best) { best = di; ring = rg * smoothstep(3.5, 0.0, gen); }
    d = smin(d, di, 0.22);
  }
  return d;
}

vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float R = 0.5 * min(uAspect, 1.0) * 0.985;
  float rr = dot(p / R, p / R);
  if (rr > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec2 q = p * (0.84 + 0.16 * rr);
  vec3 rd = normalize(uFwd + (q.x * 2.0 * uTan) * uRight + (q.y * 2.0 * uTan) * uUp);

  float t = 0.03, ring = 0.0; bool hit = false; vec3 pos;
  for (int i = 0; i < 96; i++) {
    pos = rd * t;
    float d = field(pos, ring);
    if (d > -0.004) { hit = true; break; }
    t += max(-d * 0.7, 0.008);
    if (t > 14.0) break;
  }
  vec3 col = vec3(0.0);
  if (hit) {
    vec2 e = vec2(0.006, -0.006); float tmp;
    vec3 g = normalize(e.xyy * field(pos + e.xyy, tmp) + e.yyx * field(pos + e.yyx, tmp) + e.yxy * field(pos + e.yxy, tmp) + e.xxx * field(pos + e.xxx, tmp));
    vec3 n = -g;
    // Fine mucosal relief breaks the specular into small wet glints.
    vec3 w = pos * 9.0;
    n = normalize(n + 0.12 * (vec3(noise(w), noise(w + 7.1), noise(w + 13.7)) - 0.5));
    vec3 V = -rd;
    vec3 base = vec3(0.86, 0.50, 0.46);
    float vein = smoothstep(0.045, 0.0, abs(noise(pos * 2.2) + 0.5 * noise(pos * 4.7) - 0.75));
    float fine = smoothstep(0.03, 0.0, abs(noise(pos * 7.0 + 3.0) - 0.5));
    base = mix(base, vec3(0.55, 0.10, 0.13), 0.55 * vein + 0.25 * fine);
    base = mix(base, vec3(0.96, 0.86, 0.80), 0.55 * ring);
    col = vec3(0.0);
    for (int k = 0; k < 2; k++) {
      vec3 lp = uRight * (k == 0 ? 0.12 : -0.12);
      vec3 L = lp - pos; float dist = length(L); L /= dist;
      float att = 1.0 / (1.0 + 0.55 * dist * dist);
      float diff = max(dot(n, L), 0.0);
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(n, H), 0.0), 90.0) * 0.9 + pow(max(dot(n, H), 0.0), 18.0) * 0.08;
      col += (base * diff * 0.95 + vec3(1.0, 0.97, 0.94) * spec) * att * 1.6;
    }
    col *= exp(-0.09 * t);
  }
  // Optics: vignette at the rim of the image guide; red-out when the lens is on the mucosa.
  col *= 1.0 - 0.35 * smoothstep(0.55, 1.0, sqrt(rr));
  col = mix(col, vec3(0.55, 0.06, 0.04) * (0.6 + 0.4 * noise(vec3(p * 9.0, uTime))), uRed * 0.9);
  col *= smoothstep(1.0, 0.965, sqrt(rr));
  gl_FragColor = vec4(pow(aces(col), vec3(1.0 / 2.2)), 1.0);
}`

interface Built {
  branches: AirwayBranch[]
  caps: AirwayCapsule[]
  curves: THREE.CatmullRomCurve3[]
  normals: THREE.Vector3[][]
}

const SAMPLES = 64

/** Curves plus rotation-minimising frames per branch, each child starting from its parent's distal frame, so the image never rolls at a bifurcation. */
function build(branches: AirwayBranch[]): Built {
  const curves = branches.map((b) => new THREE.CatmullRomCurve3(b.slices.map((s) => new THREE.Vector3(s.x, s.y, s.z)), false, 'centripetal'))
  const normals: THREE.Vector3[][] = []
  branches.forEach((b, i) => {
    const c = curves[i]
    const list: THREE.Vector3[] = []
    let n: THREE.Vector3
    const t0 = c.getTangentAt(0)
    if (b.parent < 0) n = new THREE.Vector3(0, 0, 1) // anterior is "up" on the image, patient supine, operator at the head
    else n = normals[b.parent][SAMPLES].clone()
    n.addScaledVector(t0, -n.dot(t0))
    if (n.lengthSq() < 1e-8) n.set(1, 0, 0).addScaledVector(t0, -t0.x)
    n.normalize()
    for (let k = 0; k <= SAMPLES; k++) {
      const t = c.getTangentAt(k / SAMPLES)
      n.addScaledVector(t, -n.dot(t)).normalize()
      list.push(n.clone())
    }
    normals[i] = list
  })
  return { branches, caps: airwayCapsules(branches), curves, normals }
}

type Status = 'loading' | 'ready' | 'error' | 'no-webgl'
interface Label { code: string; name: string; x: number; y: number; aimed: boolean }
interface Hud { path: string[]; contact: boolean; end: 'none' | 'fork' | 'terminal'; labels: Label[]; branch: number; u: number }

function webglTersedia(): boolean {
  try { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}

export default function BronchoscopySim({ onPath }: { onPath?: (path: string[]) => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<ScopeInput>({ push: 0, aimYaw: 0, aimPitch: 0, air: false, suction: false })
  const steeringRef = useRef(false)
  const onPathRef = useRef(onPath)
  onPathRef.current = onPath
  const [status, setStatus] = useState<Status>('loading')
  const [tree, setTree] = useState<Built | null>(null)
  const [hud, setHud] = useState<Hud>({ path: ['Trachea'], contact: false, end: 'none', labels: [], branch: 0, u: 0 })
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (!webglTersedia()) { setStatus('no-webgl'); return }
    let hidup = true
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    renderer.setClearColor(0x000000, 1)
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' })
    host.appendChild(renderer.domElement)
    const uA = Array.from({ length: MAXC }, () => new THREE.Vector4())
    const uB = Array.from({ length: MAXC }, () => new THREE.Vector4())
    const uS = Array.from({ length: MAXC }, () => new THREE.Vector4())
    const uniforms = {
      uA: { value: uA }, uB: { value: uB }, uS: { value: uS }, uCount: { value: 0 },
      uRight: { value: new THREE.Vector3(1, 0, 0) }, uUp: { value: new THREE.Vector3(0, 1, 0) }, uFwd: { value: new THREE.Vector3(0, 0, -1) },
      uAspect: { value: 1 }, uTan: { value: Math.tan(THREE.MathUtils.degToRad(50)) }, uTime: { value: 0 }, uRed: { value: 0 }, uBreath: { value: 0.04 }, uPost: { value: new THREE.Vector3(0, 0, -1) },
    }
    const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false, depthWrite: false })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    const scene = new THREE.Scene()
    scene.add(quad)
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    let w = 1, h = 1
    const ukur = () => {
      w = host.clientWidth || 1; h = host.clientHeight || 1
      // Ray marching is per pixel: cap the internal resolution, the optics hide the softness.
      const pr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1 : 1.25)
      renderer.setPixelRatio(pr)
      renderer.setSize(w, h, false)
      uniforms.uAspect.value = w / h
    }
    const ro = new ResizeObserver(ukur)
    ro.observe(host)
    ukur()

    let built: Built | null = null
    let bi = 0
    let st: ScopeState = initialScope(1)
    let red = 0, raf = 0, last = 0, hudAt = 0, visible = true
    const P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), F = new THREE.Vector3(), U = new THREE.Vector3(), Rt = new THREE.Vector3(), tmp = new THREE.Vector3()

    const pose = () => {
      if (!built) return
      const b = built.branches[bi]
      const u = Math.min(1, Math.max(0, st.s / b.profile.length))
      const c = built.curves[bi]
      c.getPointAt(u, P)
      c.getTangentAt(u, T)
      N.copy(built.normals[bi][Math.round(u * SAMPLES)])
      B.crossVectors(T, N).normalize()
      P.addScaledVector(B, st.ox).addScaledVector(N, st.oy)
      F.copy(T).multiplyScalar(Math.cos(st.yaw) * Math.cos(st.pitch)).addScaledVector(B, Math.sin(st.yaw) * Math.cos(st.pitch)).addScaledVector(N, Math.sin(st.pitch)).normalize()
      Rt.crossVectors(F, N).normalize()
      U.crossVectors(Rt, F).normalize()
    }

    const frame = (now: number) => {
      raf = 0
      if (!hidup) return
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016
      last = now
      if (built) {
        const inp = inputRef.current
        if (!steeringRef.current) { const k = Math.exp(-dt * 2.2); inp.aimYaw *= k; inp.aimPitch *= k }
        const b = built.branches[bi]
        st = stepScope(st, { ...inp, air: false, suction: false }, dt, b.profile)
        let end: Hud['end'] = 'none'
        pose()
        if (st.s >= b.profile.length - 1e-4) {
          end = b.children.length ? 'fork' : 'terminal'
          if (inp.push > 0 && b.children.length) {
            const c = chooseChild(built.branches, bi, P, F)
            if (c >= 0) { bi = c; st = { ...st, s: 0, ox: st.ox * 0.5, oy: st.oy * 0.5, contact: false, blocked: false }; pose(); end = 'none' }
          }
        } else if (st.s <= 0 && inp.push < 0 && b.parent >= 0) {
          bi = b.parent
          st = { ...st, s: built.branches[bi].profile.length - 1e-3 }
          pose()
        }
        // Nearest wall primitives, in cm relative to the tip.
        const near = nearestCapsules(built.caps, P, MAXC)
        near.forEach((ci, k) => {
          const c = built!.caps[ci]
          uA[k].set((c.a.x - P.x) * 100, (c.a.y - P.y) * 100, (c.a.z - P.z) * 100, c.ra * 100)
          uB[k].set((c.b.x - P.x) * 100, (c.b.y - P.y) * 100, (c.b.z - P.z) * 100, c.rb * 100)
          uS[k].set(c.s0 * 100, c.generation, 0, 0)
        })
        uniforms.uCount.value = near.length
        uniforms.uRight.value.copy(Rt); uniforms.uUp.value.copy(U); uniforms.uFwd.value.copy(F)
        uniforms.uTime.value = st.time
        red += ((st.contact ? 1 : 0) - red) * Math.min(1, dt * 8)
        uniforms.uRed.value = red
        renderer.render(scene, cam)

        if (now - hudAt > 100) {
          hudAt = now
          const cur = built.branches[bi]
          const uNow = st.s / cur.profile.length
          const labels: Label[] = []
          // Orifice labels: children ahead of the tip, projected with the same lens model as the image.
          if (cur.profile.length - st.s < 0.035) {
            const aimed = chooseChild(built.branches, bi, P, F)
            for (const ci of cur.children) {
              const ch = built.branches[ci]
              const o = ch.slices[Math.min(1, ch.slices.length - 1)]
              tmp.set(o.x - P.x, o.y - P.y, o.z - P.z)
              const z = tmp.dot(F)
              if (z <= 0.001) continue
              const tan = uniforms.uTan.value
              const qx = tmp.dot(Rt) / z / (2 * tan), qy = tmp.dot(U) / z / (2 * tan)
              // Invert q = p (0.84 + 0.16 |p/R|²) for the radius, three Newton steps.
              const Rimg = 0.5 * Math.min(w / h, 1) * 0.985
              const qr = Math.hypot(qx, qy)
              let pr = qr
              for (let it = 0; it < 3; it++) { const f = pr * (0.84 + 0.16 * (pr / Rimg) ** 2) - qr; const df = 0.84 + 0.48 * (pr / Rimg) ** 2; pr -= f / df }
              const k = qr > 0 ? pr / qr : 1
              const sx = 0.5 + (qx * k) / (w / h), sy = 0.5 - qy * k
              if (Math.hypot((sx - 0.5) * (w / h), sy - 0.5) > Rimg * 0.97) continue
              labels.push({ code: ch.code, name: ch.name, x: sx * 100, y: sy * 100, aimed: ci === aimed })
            }
          }
          // Keep labels readable: push a label down when it would sit on top of an earlier one.
          labels.sort((a, b) => a.y - b.y)
          for (let i = 1; i < labels.length; i++) for (let j = 0; j < i; j++) {
            if (Math.abs(labels[i].x - labels[j].x) < 30 && labels[i].y - labels[j].y < 8) labels[i].y = labels[j].y + 8
          }
          const path = airwayPath(built.branches, bi)
          setHud((prev) => {
            if (prev.path.join('>') !== path.join('>')) onPathRef.current?.(path)
            return { path, contact: st.contact, end, labels, branch: bi, u: uNow }
          })
        }
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) { last = 0; raf = requestAnimationFrame(frame) } })
    io.observe(host)
    const onVis = () => { if (!document.hidden && visible && !raf) { last = 0; raf = requestAnimationFrame(frame) } }
    document.addEventListener('visibilitychange', onVis)

    muatVisceral().then((root) => {
      if (!hidup) return
      const byId = new Map(BRONCHIAL_TREE.map((d) => [d.id, d.mesh]))
      const r = buildAirwayTree(BRONCHIAL_TREE, (id) => meshPositions(root, byId.get(id) ?? ''), { x: 0, y: 1.6, z: 0 })
      if (!r.ok) { setStatus('error'); return }
      built = build(r.branches)
      setTree(built)
      st = { ...initialScope(1), s: 0.01 }
      setStatus('ready')
      onPathRef.current?.(['Trachea'])
    }).catch(() => { if (hidup) setStatus('error') })

    return () => {
      hidup = false
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      quad.geometry.dispose(); material.dispose(); renderer.dispose(); renderer.domElement.remove()
    }
  }, [])

  // Front view of the whole tree for orientation: patient's right on the viewer's left, current branch highlighted.
  const map = useMemo(() => {
    if (!tree) return null
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    for (const b of tree.branches) for (const s of b.slices) { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y) }
    const span = Math.max(x1 - x0, y1 - y0) || 1
    const k = 84 / span, ox = (100 - (x1 - x0) * k) / 2, oy = (100 - (y1 - y0) * k) / 2
    const pt = (s: { x: number; y: number }) => [ox + (s.x - x0) * k, 100 - (oy + (s.y - y0) * k)] as const
    return tree.branches.map((b) => {
      const pts = b.parent >= 0 ? [tree.branches[b.parent].slices[tree.branches[b.parent].slices.length - 1], ...b.slices] : b.slices
      return { d: pts.map((s, i) => `${i ? 'L' : 'M'}${pt(s)[0].toFixed(1)} ${pt(s)[1].toFixed(1)}`).join(' '), pts: b.slices.map(pt) }
    })
  }, [tree])
  const here = map && tree ? (() => { const pts = map[hud.branch].pts; return pts[Math.min(pts.length - 1, Math.round(hud.u * (pts.length - 1)))] })() : null

  const drag = useRef<{ x: number; y: number } | null>(null)
  const onDown = (e: RPointerEvent<HTMLDivElement>) => { drag.current = { x: e.clientX, y: e.clientY }; steeringRef.current = true; setTouched(true); e.currentTarget.setPointerCapture(e.pointerId) }
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const width = e.currentTarget.clientWidth || 1
    const c = (v: number) => Math.max(-1, Math.min(1, v))
    inputRef.current.aimYaw = c(-(e.clientX - drag.current.x) / (width * 0.3))
    inputRef.current.aimPitch = c(-(e.clientY - drag.current.y) / (width * 0.3))
  }
  const onUp = () => { drag.current = null; steeringRef.current = false }
  const setPush = (v: number) => { inputRef.current.push = v; if (v) setTouched(true) }
  const holdPush = (v: number) => ({
    onPointerDown: (e: RPointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); setPush(v) },
    onPointerUp: () => setPush(0),
    onPointerCancel: () => setPush(0),
    onKeyDown: (e: RKeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setPush(v) } },
    onKeyUp: (e: RKeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') setPush(0) },
    onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
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
    else return
    e.preventDefault()
    setTouched(true)
  }

  const btn = 'flex min-h-[56px] items-center justify-center gap-2 rounded-[16px] text-[12px] font-bold select-none touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70'
  const current = hud.path[hud.path.length - 1]

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-black sm:aspect-[16/10]">
        <div
          ref={hostRef}
          tabIndex={0}
          role="application"
          aria-label="Bronchoscope view. Drag to aim the tip at an opening; arrow up and down to advance and withdraw; W A S D to aim."
          className="absolute inset-0 cursor-grab touch-none select-none outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-200/50"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onKeyDown={onKey(true)} onKeyUp={onKey(false)}
        />
        {status === 'ready' && hud.labels.map((l) => (
          <div key={l.code} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${l.x}%`, top: `${l.y}%` }}>
            <div className="flex flex-col items-center">
              <span className="block h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: l.aimed ? '#fff' : 'rgba(255,255,255,.55)', background: l.aimed ? '#fda4af' : 'transparent' }} />
              <span className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-black" style={{ background: l.aimed ? '#fff' : 'rgba(0,0,0,.55)', color: l.aimed ? '#000' : '#fff' }}>
                {l.code}<span className="ml-1 font-semibold opacity-70">{l.name}</span>
              </span>
            </div>
          </div>
        ))}
        <div className="pointer-events-none absolute left-3 top-3 max-w-[60%]">
          <div className="text-[13px] font-black text-white">{tree?.branches[hud.branch]?.name ?? 'Trachea'}</div>
          <div className="truncate text-[11px] font-semibold text-white/55">{hud.path.join(' › ')}</div>
        </div>
        {map && here && (
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute right-2 top-2 h-[92px] w-[92px]" role="img" aria-label="Bronchial tree seen from the front; R is the body's right">
            {map.map((m, i) => (
              <path key={i} d={m.d} fill="none" stroke={i === hud.branch ? '#fda4af' : 'rgba(255,255,255,.32)'} strokeWidth={i === hud.branch ? 2.6 : 1.4} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            <circle cx={here[0]} cy={here[1]} r="3.6" fill="#fff" />
            <text x="2" y="98" fontSize="10" fontWeight="800" fill="rgba(255,255,255,.55)">R</text>
            <text x="91" y="98" fontSize="10" fontWeight="800" fill="rgba(255,255,255,.55)">L</text>
          </svg>
        )}
        {status === 'ready' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 px-4 text-center text-[12px] font-bold text-white/85">
            {hud.contact ? 'Red-out — withdraw and re-centre on the lumen'
              : hud.end === 'fork' ? `Aim at an opening, then push to enter (${tree?.branches[hud.branch]?.children.length ?? 0} ahead)`
              : hud.end === 'terminal' ? `${current}: subsegmental bronchi are not modelled — withdraw`
              : !touched ? 'Hold Push · drag to aim the tip at an opening' : ''}
          </div>
        )}
        {status !== 'ready' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-[12px] font-bold text-white/60">
            {status === 'loading' && 'Preparing the bronchoscope…'}
            {status === 'error' && 'Reference airway meshes could not be loaded.'}
            {status === 'no-webgl' && 'The simulator needs WebGL, which this browser has turned off.'}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2" aria-label="Bronchoscope controls">
        <button type="button" data-pmd-native="true" style={{ background: 'rgba(255,255,255,.08)', color: '#fff' }} className={btn} aria-label="Withdraw (hold)" {...holdPush(-1)}>▼ Withdraw</button>
        <button type="button" data-pmd-native="true" style={{ background: '#fff', color: '#000' }} className={btn} aria-label="Advance (hold)" {...holdPush(1)}>▲ Advance</button>
      </div>
    </div>
  )
}
