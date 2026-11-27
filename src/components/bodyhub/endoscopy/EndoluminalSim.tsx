// Interactive virtual endoscopy simulator. The ROUTE and CALIBRE come from the Z-Anatomy / BodyParts3D reference
// meshes in public/anatomy/visceral.glb (CC BY-SA 4.0): their centre line and mean radius are computed by lumenPath.
// The wall is then rebuilt as a smooth high-resolution tube on that route so it can move: insufflation, suction,
// peristalsis or breathing, and simulated textbook mucosal relief (haustra, rugae, circular folds, cartilage rings).
// The learner drives the scope — push/pull, tip angulation, air, suction — with red-out on wall contact.
// Teaching model only: no patient anatomy, lesion, insertion distance, force, device setting or safe trajectory.
import { useEffect, useRef, useState, type KeyboardEvent as RKeyboardEvent, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import {
  lumenPath, anteriorMap, routeProfile, radiusAt, openFactor, initialScope, stepScope, wallFold,
  type LumenSlice, type ScopeInput, type ScopeState, type WallPattern, type RouteProfile,
} from '../../../domains/body-exposure'
import { body3dPixelRatio } from '../../../lib/body3dQuality'
import { mucosaTextures } from './mucosaTexture'

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

function worldPositions(root: THREE.Object3D, seg: EndoluminalSegment): Float32Array {
  const o = root.getObjectByName(seg.node)
  if (!o) return new Float32Array()
  const meshes: THREE.Mesh[] = []
  if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh)
  else if (seg.take === 'own') { const m = o.children.find((c) => (c as THREE.Mesh).isMesh); if (m) meshes.push(m as THREE.Mesh) }
  else o.traverse((c) => { if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh) })
  const out: number[] = []
  const v = new THREE.Vector3()
  for (const m of meshes) {
    const p = m.geometry.attributes.position
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); out.push(v.x, v.y, v.z) }
  }
  return new Float32Array(out)
}

const AROUND = 56

interface Tube { geometry: THREE.BufferGeometry; frames: { tangents: THREE.Vector3[]; normals: THREE.Vector3[]; binormals: THREE.Vector3[] }; rings: number }

/** Smooth tube along the curve. Vertex position is rebuilt in the shader from centre + direction × animated radius. */
function buildTube(curve: THREE.CatmullRomCurve3, profile: RouteProfile, patternAt: (u: number) => WallPattern, tint: THREE.Color, ridgeTint: THREE.Color): Tube {
  const L = profile.length
  const rings = Math.max(200, Math.min(1100, Math.round(L / 0.002)))
  const frames = curve.computeFrenetFrames(rings - 1, false)
  const M = AROUND
  const nv = rings * (M + 1)
  const centre = new Float32Array(nv * 3), dir = new Float32Array(nv * 3), rad = new Float32Array(nv)
  const fix = new Float32Array(nv), col = new Float32Array(nv), sArr = new Float32Array(nv)
  const colour = new Float32Array(nv * 3), uv = new Float32Array(nv * 2)
  const posOpen = new Float32Array(nv * 3), posShut = new Float32Array(nv * 3)
  const P = new THREE.Vector3(), d = new THREE.Vector3(), c = new THREE.Color()
  const back = new THREE.Vector3(0, 0, -1)
  for (let i = 0; i < rings; i++) {
    const u = i / (rings - 1)
    const s = u * L
    curve.getPointAt(u, P)
    const n = frames.normals[i], b = frames.binormals[i]
    // theta = 0 faces anterior (+z in the atlas) so the tracheal membranous wall lands posteriorly.
    const ang0 = Math.atan2(back.dot(b), back.dot(n)) + Math.PI
    const r0 = radiusAt(profile, s)
    const pattern = patternAt(u)
    for (let j = 0; j <= M; j++) {
      const k = i * (M + 1) + j
      const a = (j / M) * Math.PI * 2
      d.copy(n).multiplyScalar(Math.cos(a)).addScaledVector(b, Math.sin(a))
      const f = wallFold(pattern, a - ang0, s)
      centre.set([P.x, P.y, P.z], k * 3); dir.set([d.x, d.y, d.z], k * 3)
      rad[k] = r0; fix[k] = f.fixed; col[k] = f.collapsible; sArr[k] = s
      const ro = r0 * (1 - 0.35 * f.fixed)
      const rs = r0 * openFactor(0) * (1 - 0.35 * f.fixed - 0.45 * f.collapsible)
      posOpen.set([P.x + d.x * ro, P.y + d.y * ro, P.z + d.z * ro], k * 3)
      posShut.set([P.x + d.x * rs, P.y + d.y * rs, P.z + d.z * rs], k * 3)
      c.copy(tint).lerp(ridgeTint, f.ridge * 0.55).multiplyScalar(0.9 + 0.1 * (1 - f.fixed))
      colour.set([c.r, c.g, c.b], k * 3)
      uv.set([(j / M) * 5, s / 0.035], k * 2)
    }
  }
  const index: number[] = []
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < M; j++) {
    const a = i * (M + 1) + j, b2 = a + M + 1
    index.push(a, b2, a + 1, a + 1, b2, b2 + 1)
  }
  const normalsFor = (pos: Float32Array) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setIndex(index)
    g.computeVertexNormals()
    const nArr = g.attributes.normal.array as Float32Array
    // Weld the UV seam: j = 0 and j = M are the same point.
    for (let i = 0; i < rings; i++) {
      const a = i * (M + 1) * 3, z = (i * (M + 1) + M) * 3
      for (let q = 0; q < 3; q++) { const m = (nArr[a + q] + nArr[z + q]) / 2; nArr[a + q] = m; nArr[z + q] = m }
    }
    g.dispose()
    return nArr
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(posOpen, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(normalsFor(posOpen), 3))
  geometry.setAttribute('aNormalShut', new THREE.BufferAttribute(normalsFor(posShut), 3))
  geometry.setAttribute('aCentre', new THREE.BufferAttribute(centre, 3))
  geometry.setAttribute('aDir', new THREE.BufferAttribute(dir, 3))
  geometry.setAttribute('aR', new THREE.BufferAttribute(rad, 1))
  geometry.setAttribute('aFix', new THREE.BufferAttribute(fix, 1))
  geometry.setAttribute('aCol', new THREE.BufferAttribute(col, 1))
  geometry.setAttribute('aS', new THREE.BufferAttribute(sArr, 1))
  geometry.setAttribute('color', new THREE.BufferAttribute(colour, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geometry.setIndex(index)
  geometry.computeBoundingSphere()
  if (geometry.boundingSphere) geometry.boundingSphere.radius += 0.05
  return { geometry, frames, rings }
}

const OPTICS = {
  uniforms: { tDiffuse: { value: null }, uAspect: { value: 1 }, uRed: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uAspect; uniform float uRed; varying vec2 vUv;
    vec2 toUv(vec2 p){ return p / vec2(uAspect, 1.0) + 0.5; }
    void main(){
      vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
      float R = 0.5 * min(uAspect, 1.0) * 0.985;
      float rr = dot(p / R, p / R);
      // Wide-angle scope optics: magnified centre, compressed rim, slight colour fringing at the edge.
      vec2 base = p * (0.84 + 0.16 * rr);
      vec3 col = vec3(texture2D(tDiffuse, toUv(base * 1.006)).r, texture2D(tDiffuse, toUv(base)).g, texture2D(tDiffuse, toUv(base * 0.994)).b);
      if (uRed > 0.001) {
        // Red-out: the lens is on the mucosa, everything becomes a defocused red glow.
        vec3 blur = vec3(0.0);
        for (int i = 0; i < 8; i++) { float a = float(i) * 0.785; blur += texture2D(tDiffuse, toUv(base + vec2(cos(a), sin(a)) * 0.035 * uRed)).rgb; }
        blur /= 8.0;
        vec3 red = vec3(0.62, 0.07, 0.05) * (0.55 + 0.6 * dot(blur, vec3(0.3, 0.6, 0.1)) ) + vec3(0.25, 0.02, 0.01);
        col = mix(col, red, uRed * 0.9);
      }
      float mask = smoothstep(1.0, 0.965, sqrt(rr));
      float vig = 1.0 - 0.35 * smoothstep(0.55, 1.0, sqrt(rr));
      gl_FragColor = vec4(col * mask * vig, 1.0);
    }`,
}

function webglTersedia(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function smoothSlices(s: LumenSlice[]): LumenSlice[] {
  if (s.length < 3) return s
  return s.map((v, i) => {
    if (i === 0 || i === s.length - 1) return v
    const a = s[i - 1], b = s[i + 1]
    return { x: (a.x + 2 * v.x + b.x) / 4, y: (a.y + 2 * v.y + b.y) / 4, z: (a.z + 2 * v.z + b.z) / 4, r: (a.r + 2 * v.r + b.r) / 4 }
  })
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
    if (!webglTersedia()) { setStatus('no-webgl'); return }
    setStatus('loading')
    let hidup = true
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.setClearColor(0x000000, 1)
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' })
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x040000, 16)
    const camera = new THREE.PerspectiveCamera(100, 1, 0.0004, 3)
    // Two light guides beside the lens, as on a real scope tip.
    const lampA = new THREE.PointLight(0xfff6ee, 0.006, 0.5, 2)
    const lampB = new THREE.PointLight(0xfff6ee, 0.006, 0.5, 2)
    const fill = new THREE.HemisphereLight(0xffd2c4, 0x180303, 0.012)
    scene.add(lampA, lampB, fill)

    const tex = mucosaTextures(segments.length * 7919 + 17, vesselTone)
    const uniforms = { uOpen: { value: 1 }, uInsuf: { value: 0.35 }, uTime: { value: 0 }, uPeri: { value: peristalsis }, uBreath: { value: breathing } }
    const material = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      map: tex?.map ?? null,
      normalMap: tex?.normalMap ?? null,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.24,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      specularIntensity: 1,
    })
    material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms)
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec3 aCentre; attribute vec3 aDir; attribute vec3 aNormalShut;
          attribute float aR; attribute float aFix; attribute float aCol; attribute float aS;
          uniform float uOpen; uniform float uInsuf; uniform float uTime; uniform float uPeri; uniform float uBreath;`)
        .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = normalize(mix(aNormalShut, normal, uInsuf));')
        .replace('#include <begin_vertex>', `
          float wave = uPeri * pow(max(0.0, sin(6.2831853 * (aS / 0.16 - uTime * 0.06))), 6.0);
          float breath = 1.0 + uBreath * sin(6.2831853 * uTime / 4.2);
          float rad = aR * uOpen * breath * (1.0 - 0.35 * aFix - 0.45 * aCol * (1.0 - uInsuf)) * (1.0 - wave);
          vec3 transformed = aCentre + aDir * rad;`)
    }
    material.customProgramCacheKey = () => 'endoluminal-v1'

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.35, 0.86)
    composer.addPass(bloom)
    const optics = new ShaderPass(OPTICS)
    composer.addPass(optics)
    composer.addPass(new OutputPass())

    let mesh: THREE.Mesh | null = null
    let curve: THREE.CatmullRomCurve3 | null = null
    let tube: Tube | null = null
    let profile: RouteProfile | null = null
    let landmarks: EndoluminalLandmark[] = []
    let st: ScopeState = initialScope()
    let red = 0

    const ukur = () => {
      const w = host.clientWidth || 1, h = host.clientHeight || 1
      const pr = body3dPixelRatio(w, h, window.devicePixelRatio || 1, w < 768)
      renderer.setPixelRatio(pr)
      renderer.setSize(w, h, false)
      composer.setPixelRatio(pr)
      composer.setSize(w, h)
      bloom.resolution.set(Math.round(w * pr / 2), Math.round(h * pr / 2))
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      optics.uniforms.uAspect.value = w / h
    }
    const ro = new ResizeObserver(ukur)
    ro.observe(host)
    ukur()

    jumpRef.current = (t: number) => {
      if (!profile) return
      st = { ...initialScope(st.insuf), s: Math.max(0, Math.min(1, t)) * profile.length, time: st.time }
    }

    const P = new THREE.Vector3(), look = new THREE.Vector3(), q = new THREE.Vector3()
    let last = 0, hudAt = 0, raf = 0, visible = true
    const frame = (now: number) => {
      raf = 0
      if (!hidup) return
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016
      last = now
      if (curve && tube && profile) {
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
        camera.position.copy(P)
        camera.up.copy(nor)
        camera.lookAt(look.copy(P).add(q))
        lampA.position.copy(P).addScaledVector(bin, 0.0015)
        lampB.position.copy(P).addScaledVector(bin, -0.0015)
        uniforms.uOpen.value = openFactor(st.insuf)
        uniforms.uInsuf.value = st.insuf
        uniforms.uTime.value = st.time
        red += ((st.contact ? 1 : 0) - red) * Math.min(1, dt * 8)
        optics.uniforms.uRed.value = red
        composer.render(dt)
        if (now - hudAt > 120) {
          hudAt = now
          const t = st.s / profile.length
          let segment = 0
          for (let k = 0; k < landmarks.length; k++) if (t >= landmarks[k].t) segment = k
          setHud({ t, cm: st.s * 100, contact: st.contact, insuf: st.insuf, segment })
          cb.current.onProgress?.(t)
        }
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(frame) }
    })
    io.observe(host)
    const onVis = () => { if (!document.hidden && visible && !raf) { last = 0; raf = requestAnimationFrame(frame) } }
    document.addEventListener('visibilitychange', onVis)

    muatVisceral().then((root) => {
      if (!hidup) return
      const r = lumenPath(segments.map((s) => ({ label: s.label, positions: worldPositions(root, s) })), 24, startNear)
      if (!r.ok) { setStatus('error'); return }
      const slices = smoothSlices(r.slices)
      profile = routeProfile(slices)
      if (!profile) { setStatus('error'); return }
      landmarks = r.landmarks
      curve = new THREE.CatmullRomCurve3(slices.map((s) => new THREE.Vector3(s.x, s.y, s.z)), false, 'centripetal')
      const starts = landmarks.map((l) => l.t)
      const patternAt = (u: number) => { let k = 0; for (let i = 0; i < starts.length; i++) if (u >= starts[i]) k = i; return segments[k].wall }
      const base = new THREE.Color(tint)
      const ridge = segments.some((s) => s.wall === 'trachea' || s.wall === 'bronchus') ? new THREE.Color('#f4e3dc') : base.clone().offsetHSL(0, -0.05, 0.08)
      tube = buildTube(curve, profile, patternAt, base, ridge)
      mesh = new THREE.Mesh(tube.geometry, material)
      mesh.frustumCulled = false
      scene.add(mesh)
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
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      tube?.geometry.dispose()
      tex?.dispose()
      material.dispose()
      bloom.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
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
