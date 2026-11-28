import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buatRendererAman } from '../../lib/rendererAman'
import { mulaiLoopTerjaga, type LoopTerjaga } from '../../lib/loopRenderTerjaga'
import {
  BIO_PERIODIC_ELEMENTS,
  HYDROGENIC_ORBITALS,
  evaluateRadialProbability,
  sampleOrbitalProbabilityCloud,
  type HydrogenicOrbitalId,
} from '../../lib/kimia/orbitalKuantum'

function valenceOrbitalForElement(symbol: string): HydrogenicOrbitalId {
  if (symbol === 'H') return '1s'
  if (symbol === 'C' || symbol === 'N' || symbol === 'O') return '2pz'
  if (symbol === 'Na' || symbol === 'Mg' || symbol === 'K' || symbol === 'Ca') return '3s'
  if (symbol === 'P' || symbol === 'S' || symbol === 'Cl') return '3pz'
  return '3dz2'
}

/** Pure radial gradient glow sprite (zero ctx.filter, safe on Apple Silicon Metal & SwiftShader). */
function createQuantumGlowTexture(): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.28, 'rgba(255,255,255,0.82)')
  g.addColorStop(0.65, 'rgba(255,255,255,0.22)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

export default function QuantumElementStage() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [orbitalId, setOrbitalId] = useState<HydrogenicOrbitalId>('3dz2')
  const [selectedSymbol, setSelectedSymbol] = useState<string>('Fe')
  const [hemisphereSlice, setHemisphereSlice] = useState<boolean>(false)
  const [webglFailed, setWebglFailed] = useState(false)

  const orbital = useMemo(
    () => HYDROGENIC_ORBITALS.find((o) => o.id === orbitalId) ?? HYDROGENIC_ORBITALS[0],
    [orbitalId],
  )
  const element = useMemo(
    () => BIO_PERIODIC_ELEMENTS.find((e) => e.symbol === selectedSymbol) ?? BIO_PERIODIC_ELEMENTS[0],
    [selectedSymbol],
  )
  const rawCloud = useMemo(() => sampleOrbitalProbabilityCloud(orbitalId, 4200), [orbitalId])
  const cloud = useMemo(
    () => (hemisphereSlice ? rawCloud.filter((pt) => pt.y >= 0) : rawCloud),
    [rawCloud, hemisphereSlice],
  )

  const radialCurvePoints = useMemo(() => {
    const pts: string[] = []
    const steps = 64
    const samples = Array.from({ length: steps + 1 }, (_, i) => {
      const r = (i / steps) * orbital.maxRadiusBohr
      return { r, p: evaluateRadialProbability(orbital.n, orbital.l, r) }
    })
    const maxP = Math.max(1e-9, ...samples.map((s) => s.p))
    for (const s of samples) {
      const x = (s.r / orbital.maxRadiusBohr) * 180
      const y = 44 - (s.p / maxP) * 38
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
    }
    return pts.join(' ')
  }, [orbital])

  const radialAreaPath = useMemo(() => `0,44 ${radialCurvePoints} 180,44`, [radialCurvePoints])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const renderer = buatRendererAman({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    if (!renderer) {
      setWebglFailed(true)
      return
    }
    setWebglFailed(false)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200)
    camera.position.set(0, orbital.maxRadiusBohr * 0.42, orbital.maxRadiusBohr * 1.9)

    const positions = new Float32Array(cloud.length * 3)
    const colors = new Float32Array(cloud.length * 3)
    const posCol = new THREE.Color(0x38bdf8)
    const negCol = new THREE.Color(0xfbbf24)
    cloud.forEach((pt, idx) => {
      positions[idx * 3] = pt.x
      positions[idx * 3 + 1] = pt.z
      positions[idx * 3 + 2] = pt.y
      const c = pt.sign > 0 ? posCol : negCol
      colors[idx * 3] = c.r
      colors[idx * 3 + 1] = c.g
      colors[idx * 3 + 2] = c.b
    })

    const glowTex = createQuantumGlowTexture()
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.PointsMaterial({
      size: orbital.maxRadiusBohr * 0.068,
      map: glowTex ?? undefined,
      vertexColors: true,
      transparent: true,
      opacity: 0.86,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const pointsMesh = new THREE.Points(geo, mat)
    scene.add(pointsMesh)

    const nucleusGeo = new THREE.SphereGeometry(orbital.maxRadiusBohr * 0.032, 16, 12)
    const nucleusMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat)
    scene.add(nucleus)

    const axes = new THREE.AxesHelper(orbital.maxRadiusBohr * 0.82)
    scene.add(axes)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotateSpeed = 0.7

    const resize = () => {
      const w = Math.max(1, host.clientWidth)
      const h = Math.max(1, host.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    const loop: LoopTerjaga = mulaiLoopTerjaga(host, () => {
      controls.update()
      renderer.render(scene, camera)
    })

    const onContextLost = (e: Event) => {
      e.preventDefault()
      loop.kontekHilang()
      setWebglFailed(true)
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false)

    return () => {
      loop.hentikan()
      axes.dispose()
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      ro.disconnect()
      controls.dispose()
      geo.dispose()
      mat.dispose()
      glowTex?.dispose()
      nucleusGeo.dispose()
      nucleusMat.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [cloud, orbital.maxRadiusBohr])

  return (
    <section
      data-quantum-element-stage="v2"
      aria-label="Quantum orbitals and biological periodic elements"
      className="dark space-y-3 rounded-[24px] border border-violet-400/25 bg-[#050816] p-3.5 text-slate-100 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div>
          <p className="font-mono text-[9.5px] font-black uppercase tracking-[.18em] text-violet-300">
            Quantum Wavefunction |ψₙ,ₗ,ₘ(r,θ,φ)|² &amp; 18 Human Bio-Elements
          </p>
          <p className="text-xs text-slate-300">
            Volumetric 4,200-sample hydrogenic probability clouds (cyan +ψ / amber −ψ) with nodal cross-section slicer and valence-linked human elements.
          </p>
        </div>
        <span className="rounded-full border border-violet-400/35 bg-violet-500/15 px-2.5 py-1 font-mono text-[10px] font-bold text-violet-200">
          EXACT_HYDROGENIC_SOLVER · EDUCATIONAL
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Hydrogenic orbitals">
              {HYDROGENIC_ORBITALS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={o.id === orbitalId}
                  onClick={() => setOrbitalId(o.id)}
                  className={`min-h-8 rounded-lg border px-2 font-mono text-[10px] font-black ${
                    o.id === orbitalId ? 'border-violet-300 bg-violet-500/25 text-white' : 'border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-pressed={hemisphereSlice}
              onClick={() => setHemisphereSlice((s) => !s)}
              className={`min-h-8 rounded-lg border px-2.5 font-mono text-[10px] font-black transition ${
                hemisphereSlice
                  ? 'border-cyan-300 bg-cyan-500/25 text-white'
                  : 'border-white/15 bg-white/[.04] text-slate-300 hover:text-white'
              }`}
            >
              {hemisphereSlice ? 'Nodal slice: ON' : 'Nodal slice'}
            </button>
          </div>

          <div className="relative h-[265px] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_45%,#0f1530_0%,#02040a_75%)]">
            <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" role="img" aria-label={`3D probability cloud for hydrogenic ${orbital.label} orbital`} />
            {webglFailed && <div className="grid h-full place-items-center p-4 text-xs text-slate-400">WebGL unavailable — radial probability P(r) remains plotted below.</div>}
            <div className="pointer-events-none absolute left-2.5 top-2 rounded-full bg-black/65 px-2.5 py-0.5 font-mono text-[9.5px] text-violet-200 backdrop-blur-md">
              {orbital.label} (n={orbital.n}, l={orbital.l}, {orbital.mLabel}) · nodes {orbital.radialNodes}R/{orbital.angularNodes}A
            </div>
            <div className="pointer-events-none absolute bottom-2 left-2.5 flex gap-2 font-mono text-[9px] text-white/70">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5"><i className="h-2 w-2 rounded-full bg-sky-400" />+ψ phase</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5"><i className="h-2 w-2 rounded-full bg-amber-400" />−ψ phase</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/90 p-2 font-mono text-[9.5px]">
            <div className="flex justify-between text-slate-400">
              <span>Radial Probability 4πr²|Rₙ,ₗ(r)|²</span>
              <span>0 → {orbital.maxRadiusBohr} a₀</span>
            </div>
            <svg viewBox="0 0 180 48" className="mt-1 h-12 w-full" role="img" aria-label="Radial probability curve">
              <defs>
                <linearGradient id="quantumRadialGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <polygon fill="url(#quantumRadialGrad)" points={radialAreaPath} />
              <polyline fill="none" stroke="#c4b5fd" strokeWidth="1.7" points={radialCurvePoints} />
            </svg>
            <div className="text-[10px] text-slate-300">{orbital.summary}</div>
          </div>
        </div>

        <div className="space-y-2 lg:col-span-7">
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 font-mono text-[10px]">
            {BIO_PERIODIC_ELEMENTS.map((el) => {
              const active = el.symbol === element.symbol
              return (
                <button
                  key={el.symbol}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedSymbol(el.symbol)
                    setOrbitalId(valenceOrbitalForElement(el.symbol))
                  }}
                  className={`rounded-xl border p-1.5 text-left transition ${
                    active ? 'border-cyan-300 bg-cyan-500/20 text-white' : 'border-white/10 bg-slate-900/90 text-slate-300 hover:border-cyan-400/40'
                  }`}
                >
                  <div className="flex justify-between text-[8.5px] text-cyan-300">
                    <span>{el.z}</span>
                    <span className="text-slate-400">{el.physiologicalIon.split(' ')[0]}</span>
                  </div>
                  <div className="text-sm font-black text-white">{el.symbol}</div>
                  <div className="truncate text-[8.5px] text-slate-400">{el.name}</div>
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl border border-cyan-400/25 bg-slate-950/90 p-3 font-mono text-[10.5px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm text-cyan-100">
                {element.symbol} · {element.name} (Z={element.z}, {element.atomicMassDa} Da)
              </strong>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[9.5px] text-emerald-200">
                {element.electronConfig} · valence {valenceOrbitalForElement(element.symbol)}
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[10px] sm:grid-cols-3">
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Ion/Form:</span> <strong className="text-white">{element.physiologicalIon}</strong></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Body Mass:</span> <strong className="text-white">{element.bodyMassPct}%</strong></div>
              <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Ref Range:</span> <strong className="text-amber-200">{element.referenceRange}</strong></div>
            </div>
            <p className="mt-2 font-sans text-xs text-slate-300">{element.biologicalRole}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
