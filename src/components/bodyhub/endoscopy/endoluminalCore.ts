// Shared rendering core for the endoluminal simulators (GI tube and branching airway): the reference atlas loader,
// the animated wall tube, the scope optics and the renderer/composer rig. Geometry comes from Z-Anatomy /
// BodyParts3D (CC BY-SA 4.0) via the pure engines; everything here is presentation.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { radiusAt, openFactor, wallFold, type LumenSlice, type RouteProfile, type WallPattern } from '../../../domains/body-exposure'
import { body3dPixelRatio } from '../../../lib/body3dQuality'
import { buatRendererAman } from '../../../lib/rendererAman'

let muat: Promise<THREE.Object3D> | null = null
export function muatVisceral(): Promise<THREE.Object3D> {
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

/** World-space vertices of a mesh (positions are meshopt-quantised, so read them through the attribute). */
export function meshWorld(m: THREE.Mesh): Float32Array {
  const p = m.geometry.attributes.position
  const out = new Float32Array(p.count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); out.set([v.x, v.y, v.z], i * 3) }
  return out
}

/** 'all' merges every mesh under the node; 'own' takes only the node's own shaft (bronchial nodes nest children). */
export function nodeWorld(root: THREE.Object3D, node: string, take: 'all' | 'own'): Float32Array {
  const o = root.getObjectByName(node)
  if (!o) return new Float32Array()
  const meshes: THREE.Mesh[] = []
  if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh)
  else if (take === 'own') { const m = o.children.find((c) => (c as THREE.Mesh).isMesh); if (m) meshes.push(m as THREE.Mesh) }
  else o.traverse((c) => { if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh) })
  const parts = meshes.map(meshWorld)
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) { out.set(p, at); at += p.length }
  return out
}

export function smoothSlices(s: readonly LumenSlice[]): LumenSlice[] {
  if (s.length < 3) return [...s]
  return s.map((v, i) => {
    if (i === 0 || i === s.length - 1) return v
    const a = s[i - 1], b = s[i + 1]
    return { x: (a.x + 2 * v.x + b.x) / 4, y: (a.y + 2 * v.y + b.y) / 4, z: (a.z + 2 * v.z + b.z) / 4, r: (a.r + 2 * v.r + b.r) / 4 }
  })
}

export const curveOf = (slices: readonly LumenSlice[]) =>
  new THREE.CatmullRomCurve3(slices.map((s) => new THREE.Vector3(s.x, s.y, s.z)), false, 'centripetal')

const AROUND = 56
const CAP_RINGS = 9

export interface Tube { geometry: THREE.BufferGeometry; frames: { tangents: THREE.Vector3[]; normals: THREE.Vector3[]; binormals: THREE.Vector3[] }; rings: number }

export interface TubeOptions {
  /** Close the far end with a dome (a bifurcation roof or a blind end). */
  cap?: boolean
  minRings?: number
  maxRings?: number
  /** Metres per ring. */
  ringStep?: number
}

/**
 * Smooth tube along the curve. Vertex position is rebuilt in the shader from centre + direction × animated radius, so
 * the dome cap is encoded the same way: centre at the end point, direction tilted toward the tangent.
 */
export function buildTube(curve: THREE.CatmullRomCurve3, profile: RouteProfile, patternAt: (u: number) => WallPattern, tint: THREE.Color, ridgeTint: THREE.Color, opts: TubeOptions = {}): Tube {
  const L = profile.length
  const rings = Math.max(opts.minRings ?? 200, Math.min(opts.maxRings ?? 1100, Math.round(L / (opts.ringStep ?? 0.002))))
  const frames = curve.computeFrenetFrames(rings - 1, false)
  const capRings = opts.cap ? CAP_RINGS : 0
  const total = rings + capRings
  // Texture period along the tube follows its calibre (the wrap is a fixed five repeats around): at a fixed 3.5 cm a
  // 2 mm subsegmental bronchus showed the mucosa stretched into streaks. Wide lumens keep 3.5 cm.
  const rMean = profile.r.reduce((a, v) => a + v, 0) / Math.max(1, profile.r.length)
  const period = 0.035 * Math.min(1, Math.max(0.12, rMean / 0.009))
  const M = AROUND
  const nv = total * (M + 1)
  const centre = new Float32Array(nv * 3), dir = new Float32Array(nv * 3), rad = new Float32Array(nv)
  const fix = new Float32Array(nv), col = new Float32Array(nv), sArr = new Float32Array(nv)
  const colour = new Float32Array(nv * 3), uv = new Float32Array(nv * 2)
  const posOpen = new Float32Array(nv * 3), posShut = new Float32Array(nv * 3)
  const P = new THREE.Vector3(), d = new THREE.Vector3(), c = new THREE.Color()
  const back = new THREE.Vector3(0, 0, -1)
  for (let i = 0; i < total; i++) {
    const cap = i >= rings
    const fi = cap ? rings - 1 : i
    const u = fi / (rings - 1)
    const s = u * L
    const phi = cap ? ((i - rings + 1) / capRings) * (Math.PI / 2) : 0
    curve.getPointAt(u, P)
    const n = frames.normals[fi], b = frames.binormals[fi], t = frames.tangents[fi]
    // theta = 0 faces anterior (+z in the atlas) so the tracheal membranous wall lands posteriorly.
    const ang0 = Math.atan2(back.dot(b), back.dot(n)) + Math.PI
    const r0 = radiusAt(profile, s)
    const pattern = patternAt(u)
    for (let j = 0; j <= M; j++) {
      const k = i * (M + 1) + j
      const a = (j / M) * Math.PI * 2
      d.copy(n).multiplyScalar(Math.cos(a)).addScaledVector(b, Math.sin(a)).multiplyScalar(Math.cos(phi)).addScaledVector(t, Math.sin(phi))
      const f = cap ? { fixed: 0, collapsible: 0, ridge: 0 } : wallFold(pattern, a - ang0, s)
      centre.set([P.x, P.y, P.z], k * 3); dir.set([d.x, d.y, d.z], k * 3)
      rad[k] = r0; fix[k] = f.fixed; col[k] = f.collapsible; sArr[k] = s
      const ro = r0 * (1 - 0.35 * f.fixed)
      const rs = r0 * openFactor(0) * (1 - 0.35 * f.fixed - 0.45 * f.collapsible)
      posOpen.set([P.x + d.x * ro, P.y + d.y * ro, P.z + d.z * ro], k * 3)
      posShut.set([P.x + d.x * rs, P.y + d.y * rs, P.z + d.z * rs], k * 3)
      c.copy(tint).lerp(ridgeTint, f.ridge * 0.55).multiplyScalar(0.9 + 0.1 * (1 - f.fixed))
      colour.set([c.r, c.g, c.b], k * 3)
      // The dome maps by surface distance from its pole: wrapped like the wall it pinched to radial streaks at the pole,
      // and a flat projection along the axis smeared into long streaks near the rim where the dome runs parallel to it.
      const fromPole = (Math.PI / 2 - phi) * r0
      if (cap) uv.set([(Math.cos(a) * fromPole) / period, (s + Math.sin(a) * fromPole) / period], k * 2)
      else uv.set([(j / M) * 5, s / period], k * 2)
    }
  }
  const index: number[] = []
  for (let i = 0; i < total - 1; i++) for (let j = 0; j < M; j++) {
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
    for (let i = 0; i < total; i++) {
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

export interface WallUniforms {
  uOpen: { value: number }
  uInsuf: { value: number }
  uTime: { value: number }
  uPeri: { value: number }
  uBreath: { value: number }
}

export const wallUniforms = (peristalsis: number, breathing: number): WallUniforms => ({
  uOpen: { value: 1 }, uInsuf: { value: 0.35 }, uTime: { value: 0 }, uPeri: { value: peristalsis }, uBreath: { value: breathing },
})

/** Round cones a wall fragment is cut away inside of, so neighbouring branch tubes open into each other. */
export const MAX_CUTS = 32
export interface WallCuts { a: Float32Array; b: Float32Array; n: number }

/**
 * `open` drops the round end behind `a`. A branch's first cut segment starts where its sibling and parent meet; a
 * round end there removed the neighbour's wall where no tube of this branch replaces it, leaving a hole at the crotch.
 */
export function cutsFrom(caps: readonly { a: LumenSlice; b: LumenSlice; open?: boolean }[]): WallCuts {
  const n = Math.min(MAX_CUTS, caps.length)
  const a = new Float32Array(MAX_CUTS * 4), b = new Float32Array(MAX_CUTS * 4)
  for (let i = 0; i < n; i++) {
    const c = caps[i]
    // A negative radius marks an open start; the shader reads the size from its magnitude.
    a.set([c.a.x, c.a.y, c.a.z, c.open ? -c.a.r : c.a.r], i * 4)
    b.set([c.b.x, c.b.y, c.b.z, c.b.r], i * 4)
  }
  return { a, b, n }
}

/**
 * Wet mucosa with the animated wall. `shared` uniforms (air, time, breathing) are the same objects across every tube
 * of one scene. With `cuts`, fragments inside a neighbouring branch's lumen are discarded: the carina and every
 * bronchial orifice are the real intersection of the reference tubes, not a painted hole.
 */
export function wallMaterial(textures: { map: THREE.Texture; normalMap: THREE.Texture } | null, shared: WallUniforms, cuts?: WallCuts): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    map: textures?.map ?? null,
    normalMap: textures?.normalMap ?? null,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughness: 0.24,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    specularIntensity: 1,
  })
  const cutUniforms = cuts ? { uCutA: { value: cuts.a }, uCutB: { value: cuts.b }, uCutN: { value: cuts.n } } : {}
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, shared, cutUniforms)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 aCentre; attribute vec3 aDir; attribute vec3 aNormalShut;
        attribute float aR; attribute float aFix; attribute float aCol; attribute float aS;
        uniform float uOpen; uniform float uInsuf; uniform float uTime; uniform float uPeri; uniform float uBreath;
        varying vec3 vWallPos;`)
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = normalize(mix(aNormalShut, normal, uInsuf));')
      .replace('#include <begin_vertex>', `
        float wave = uPeri * pow(max(0.0, sin(6.2831853 * (aS / 0.16 - uTime * 0.06))), 6.0);
        float breath = 1.0 + uBreath * sin(6.2831853 * uTime / 4.2);
        float rad = aR * uOpen * breath * (1.0 - 0.35 * aFix - 0.45 * aCol * (1.0 - uInsuf)) * (1.0 - wave);
        vec3 transformed = aCentre + aDir * rad;
        vWallPos = transformed;`)
    if (cuts) {
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vWallPos;
          uniform vec4 uCutA[${MAX_CUTS}]; uniform vec4 uCutB[${MAX_CUTS}]; uniform int uCutN;
          uniform float uOpen; uniform float uTime; uniform float uBreath;`)
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          float cutScale = uOpen * (1.0 + uBreath * sin(6.2831853 * uTime / 4.2)) * 0.95;
          for (int i = 0; i < ${MAX_CUTS}; i++) {
            if (i >= uCutN) break;
            vec3 ca = uCutA[i].xyz, ab = uCutB[i].xyz - ca, ap = vWallPos - ca;
            float raw = dot(ap, ab) / max(dot(ab, ab), 1e-12);
            if (uCutA[i].w < 0.0 && raw < 0.0) continue;
            float h = clamp(raw, 0.0, 1.0);
            if (length(ap - ab * h) < mix(abs(uCutA[i].w), uCutB[i].w, h) * cutScale) discard;
          }`)
    }
  }
  material.customProgramCacheKey = () => (cuts ? 'endoluminal-cut-v3' : 'endoluminal-v2')
  return material
}

export const OPTICS = {
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

export interface ScopeRig {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  composer: EffectComposer
  optics: ShaderPass
  lampA: THREE.PointLight
  lampB: THREE.PointLight
  /** Place camera and tip lamps: position, look direction, up, and the sideways axis the two light guides sit on. */
  aim: (pos: THREE.Vector3, look: THREE.Vector3, up: THREE.Vector3, side: THREE.Vector3) => void
  dispose: () => void
}

/** Renderer + scope optics in `host`. Null when WebGL cannot start (the caller shows its own notice). */
export function buatRigScope(host: HTMLElement, onContextLost: () => void): ScopeRig | null {
  const renderer = buatRendererAman({ antialias: true, powerPreference: 'high-performance' })
  if (!renderer) return null
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.setClearColor(0x000000, 1)
  Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' })
  host.appendChild(renderer.domElement)
  const lost = (e: Event) => { e.preventDefault(); onContextLost() }
  renderer.domElement.addEventListener('webglcontextlost', lost)

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x040000, 16)
  const camera = new THREE.PerspectiveCamera(100, 1, 0.0004, 3)
  // Two light guides beside the lens, as on a real scope tip.
  const lampA = new THREE.PointLight(0xfff6ee, 0.014, 0.5, 2)
  const lampB = new THREE.PointLight(0xfff6ee, 0.014, 0.5, 2)
  const fill = new THREE.HemisphereLight(0xffd2c4, 0x180303, 0.012)
  scene.add(lampA, lampB, fill)

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.35, 0.86)
  composer.addPass(bloom)
  const optics = new ShaderPass(OPTICS)
  composer.addPass(optics)
  composer.addPass(new OutputPass())

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

  const look = new THREE.Vector3()
  return {
    renderer, scene, camera, composer, optics, lampA, lampB,
    aim: (pos, dir, up, side) => {
      camera.position.copy(pos)
      camera.up.copy(up)
      camera.lookAt(look.copy(pos).add(dir))
      lampA.position.copy(pos).addScaledVector(side, 0.0015)
      lampB.position.copy(pos).addScaledVector(side, -0.0015)
    },
    dispose: () => {
      ro.disconnect()
      renderer.domElement.removeEventListener('webglcontextlost', lost)
      bloom.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

export const RIDGE_AIRWAY = '#f4e3dc'
