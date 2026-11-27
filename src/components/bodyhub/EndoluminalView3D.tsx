// Endoluminal (virtual endoscopy) view: the camera travels INSIDE the real Z-Anatomy / BodyParts3D reference meshes
// (public/anatomy/visceral.glb, CC BY-SA 4.0) along the centre line computed from those same meshes. Nothing here is
// drawn by hand: wall shape, haustra/folds and calibre are whatever the reference geometry has. It is a reference
// teaching model, never a patient's lumen, and it does not estimate insertion depth or a safe trajectory.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { lumenPath, anteriorMap, type LumenSlice } from '../../domains/body-exposure'
import { body3dPixelRatio } from '../../lib/body3dQuality'

export interface EndoluminalSegment {
  /** Node name in visceral.glb after GLTFLoader sanitising (spaces → _). */
  node: string
  label: string
  /** 'all' merges every mesh under the node; 'own' takes only the node's own shaft (bronchial tree nodes nest children). */
  take: 'all' | 'own'
}

export interface EndoluminalRoute {
  landmarks: { label: string; t: number }[]
  /** Anterior projection of the centre line; t is each point's 3D arc-length fraction. */
  map: { x: number; y: number; t: number }[]
  lengthCm: number
}

interface Props {
  segments: readonly EndoluminalSegment[]
  startNear: { x: number; y: number; z: number }
  /** Mucosa base colour. */
  tint: string
  /** Route fraction 0..1. */
  t: number
  onRoute?: (route: EndoluminalRoute | null) => void
  className?: string
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

function meshesOf(root: THREE.Object3D, seg: EndoluminalSegment): THREE.Mesh[] {
  const o = root.getObjectByName(seg.node)
  if (!o) return []
  if ((o as THREE.Mesh).isMesh) return [o as THREE.Mesh]
  if (seg.take === 'own') {
    const m = o.children.find((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh | undefined
    return m ? [m] : []
  }
  const out: THREE.Mesh[] = []
  o.traverse((c) => { if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh) })
  return out
}

/** World-space geometry, welded so normals are smooth from inside, plus a soft deterministic mottling as vertex colour. */
function worldGeometry(mesh: THREE.Mesh, base: THREE.Color): THREE.BufferGeometry {
  // The atlas is meshopt-quantised (interleaved, normalised ints): copy into plain float positions before welding.
  const src = mesh.geometry
  const sp = src.attributes.position
  const pos = new Float32Array(sp.count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < sp.count; i++) { v.fromBufferAttribute(sp, i).applyMatrix4(mesh.matrixWorld); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z }
  let g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  if (src.index) g.setIndex(Array.from(src.index.array))
  g = mergeVertices(g, 1e-5)
  g.computeVertexNormals()
  const p = g.attributes.position
  const col = new Float32Array(p.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * 260, y = p.getY(i) * 260, z = p.getZ(i) * 260
    // Low-frequency band noise (sum of sines): vascular-looking redness variation, not a texture of any real mucosa.
    const n = 0.5 + 0.25 * Math.sin(x + 1.7 * Math.sin(y * 0.6)) * Math.sin(z * 0.8 + y * 0.3) + 0.12 * Math.sin(x * 2.3 + z * 1.9)
    c.copy(base).offsetHSL(0.012 * (n - 0.5), 0.1 * (n - 0.5), 0.22 * (n - 0.5))
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

function positionsOf(geoms: THREE.BufferGeometry[]): Float32Array {
  let n = 0
  for (const g of geoms) n += g.attributes.position.count
  const out = new Float32Array(n * 3)
  let o = 0
  for (const g of geoms) { out.set(g.attributes.position.array as Float32Array, o); o += g.attributes.position.count * 3 }
  return out
}

function webglTersedia(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function EndoluminalView3D({ segments, startNear, tint, t, onRoute, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const tRef = useRef(t)
  const lookRef = useRef({ yaw: 0, pitch: 0 })
  const drawRef = useRef<(() => void) | null>(null)
  const onRouteRef = useRef(onRoute)
  onRouteRef.current = onRoute
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'no-webgl'>('loading')
  const kunci = segments.map((s) => `${s.node}:${s.take}`).join('|')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (!webglTersedia()) { setStatus('no-webgl'); return }
    setStatus('loading')
    let hidup = true
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setClearColor(0x000000, 1)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x070101, 12)
    const camera = new THREE.PerspectiveCamera(96, 1, 0.0006, 2)
    // The scope's own light rides at the tip: the classic falloff into a dark lumen.
    const lampu = new THREE.PointLight(0xfff1e6, 0.03, 0.6, 1.6)
    const isi = new THREE.HemisphereLight(0xffd8cc, 0x1a0404, 0.12)
    scene.add(lampu, isi)

    const material = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.3,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.16,
    })
    const geoms: THREE.BufferGeometry[] = []
    let curve: THREE.CatmullRomCurve3 | null = null
    let frames: { normals: THREE.Vector3[]; binormals: THREE.Vector3[]; tangents: THREE.Vector3[] } | null = null
    const FRAMES = 400

    const ukur = () => {
      const w = host.clientWidth || 1, h = host.clientHeight || 1
      renderer.setPixelRatio(body3dPixelRatio(w, h, window.devicePixelRatio || 1, w < 768))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const p = new THREE.Vector3(), q = new THREE.Vector3(), target = new THREE.Vector3()
    const draw = () => {
      if (!hidup || !curve || !frames) return
      const tt = Math.min(0.995, Math.max(0, tRef.current))
      curve.getPointAt(tt, p)
      const i = Math.min(FRAMES, Math.round(tt * FRAMES))
      const { yaw, pitch } = lookRef.current
      const tan = frames.tangents[i], nor = frames.normals[i], bin = frames.binormals[i]
      q.copy(tan).multiplyScalar(Math.cos(yaw) * Math.cos(pitch))
        .addScaledVector(bin, Math.sin(yaw) * Math.cos(pitch))
        .addScaledVector(nor, Math.sin(pitch))
      camera.position.copy(p)
      camera.up.copy(nor)
      target.copy(p).add(q)
      camera.lookAt(target)
      lampu.position.copy(p)
      renderer.render(scene, camera)
    }
    let antre = 0
    drawRef.current = () => {
      if (antre) return
      antre = requestAnimationFrame(() => { antre = 0; draw() })
    }
    const ro = new ResizeObserver(() => { ukur(); drawRef.current?.() })
    ro.observe(host)
    ukur()

    muatVisceral().then((root) => {
      if (!hidup) return
      const base = new THREE.Color(tint)
      const masukan: { label: string; positions: Float32Array }[] = []
      for (const seg of segments) {
        const gs = meshesOf(root, seg).map((m) => worldGeometry(m, base))
        geoms.push(...gs)
        masukan.push({ label: seg.label, positions: positionsOf(gs) })
      }
      const r = lumenPath(masukan, 24, startNear)
      if (!r.ok) { console.error('endoluminal route', r); setStatus('error'); onRouteRef.current?.(null); return }
      for (const g of geoms) scene.add(new THREE.Mesh(g, material))
      const pts = smooth(r.slices).map((s) => new THREE.Vector3(s.x, s.y, s.z))
      curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
      frames = curve.computeFrenetFrames(FRAMES, false)
      const cum = [0]
      for (let i = 1; i < r.slices.length; i++) {
        const a = r.slices[i - 1], b = r.slices[i]
        cum.push(cum[i - 1] + Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z))
      }
      const map = (anteriorMap(r.slices) ?? []).map((m, i) => ({ ...m, t: r.length > 0 ? cum[i] / r.length : 0 }))
      onRouteRef.current?.({ landmarks: r.landmarks, map, lengthCm: r.length * 100 })
      setStatus('ready')
      draw()
    }).catch((e) => { console.error('endoluminal', e); if (hidup) { setStatus('error'); onRouteRef.current?.(null) } })

    return () => {
      hidup = false
      drawRef.current = null
      if (antre) cancelAnimationFrame(antre)
      ro.disconnect()
      for (const g of geoms) g.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
    // segments/startNear/tint are static per procedure; kunci identifies the procedure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci])

  useEffect(() => {
    tRef.current = t
    lookRef.current = { yaw: 0, pitch: 0 }
    drawRef.current?.()
  }, [t])

  // Drag to look around the wall at the current position; release keeps the view until the scope moves again.
  const seret = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null)
  const LIMIT = 0.75
  return (
    <div className={`relative h-full w-full touch-none select-none ${className ?? ''}`}>
      <div
        ref={hostRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          seret.current = { x: e.clientX, y: e.clientY, ...lookRef.current }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const s = seret.current
          if (!s) return
          const w = e.currentTarget.clientWidth || 1
          const clamp = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v))
          lookRef.current = { yaw: clamp(s.yaw - ((e.clientX - s.x) / w) * 1.6), pitch: clamp(s.pitch + ((e.clientY - s.y) / w) * 1.6) }
          drawRef.current?.()
        }}
        onPointerUp={() => { seret.current = null }}
        onPointerCancel={() => { seret.current = null }}
      />
      {/* Scope optics: circular field with a soft dark rim. */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle closest-side at 50% 50%, transparent 0 80%, rgba(0,0,0,.55) 92%, #000 100%)' }} />
      {status !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center text-[11px] font-bold text-white/55">
          {status === 'loading' && 'Loading reference anatomy…'}
          {status === 'error' && 'Reference meshes for this route could not be loaded.'}
          {status === 'no-webgl' && '3D view needs WebGL, which this browser has turned off.'}
        </div>
      )}
    </div>
  )
}

/** Light 3-tap smoothing of the centre line so bin-to-bin jitter does not shake the camera. Ends are kept. */
function smooth(s: LumenSlice[]): LumenSlice[] {
  if (s.length < 3) return s
  return s.map((v, i) => {
    if (i === 0 || i === s.length - 1) return v
    const a = s[i - 1], b = s[i + 1]
    return { x: (a.x + 2 * v.x + b.x) / 4, y: (a.y + 2 * v.y + b.y) / 4, z: (a.z + 2 * v.z + b.z) / 4, r: v.r }
  })
}
