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

export default function QuantumElementStage() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [orbitalId, setOrbitalId] = useState<HydrogenicOrbitalId>('3dz2')
  const [selectedSymbol, setSelectedSymbol] = useState<string>('Fe')
  const [webglFailed, setWebglFailed] = useState(false)

  const orbital = useMemo(
    () => HYDROGENIC_ORBITALS.find((o) => o.id === orbitalId) ?? HYDROGENIC_ORBITALS[0],
    [orbitalId],
  )
  const element = useMemo(
    () => BIO_PERIODIC_ELEMENTS.find((e) => e.symbol === selectedSymbol) ?? BIO_PERIODIC_ELEMENTS[0],
    [selectedSymbol],
  )
  const cloud = useMemo(() => sampleOrbitalProbabilityCloud(orbitalId, 1600), [orbitalId])

  const radialCurvePoints = useMemo(() => {
    const pts: string[] = []
    const steps = 60
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
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200)
    camera.position.set(0, orbital.maxRadiusBohr * 0.45, orbital.maxRadiusBohr * 1.95)

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

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.PointsMaterial({ size: orbital.maxRadiusBohr * 0.032, vertexColors: true, transparent: true, opacity: 0.82 })
    const pointsMesh = new THREE.Points(geo, mat)
    scene.add(pointsMesh)

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(orbital.maxRadiusBohr * 0.03, 14, 12),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
    )
    scene.add(nucleus)

    const axes = new THREE.AxesHelper(orbital.maxRadiusBohr * 0.85)
    scene.add(axes)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotateSpeed = 0.8

    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (w < 2 || h < 2) return
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(w, h)
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
    const onLost = (e: Event) => { e.preventDefault(); loop.kontekHilang() }
    renderer.domElement.addEventListener('webglcontextlost', onLost)

    return () => {
      loop.hentikan()
      renderer.domElement.removeEventListener('webglcontextlost', onLost)
      ro.disconnect()
      controls.dispose()
      geo.dispose()
      mat.dispose()
      nucleus.geometry.dispose()
      ;(nucleus.material as THREE.Material).dispose()
      axes.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [cloud, orbital.maxRadiusBohr])

  return (
    <section
      data-quantum-element-stage="v1"
      aria-label="Biological Periodic Table and Hydrogenic Quantum Orbital Probability Density"
      className="dark space-y-3 rounded-2xl border border-violet-400/25 bg-[#040712] p-3.5 text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-wider text-violet-200">
            Element & Quantum Reality · 18 Bio-Elements + |ψₙ,ₗ,ₘ(r,θ,φ)|² Probability Density
          </div>
          <div className="text-[11px] text-slate-300">
            Textbook hydrogenic wavefunctions (Bohr radii a₀). Electrons are probability clouds, never miniature planets.
          </div>
        </div>
        <span className="rounded-full border border-violet-400/35 bg-violet-500/15 px-2.5 py-0.5 font-mono text-[9.5px] text-violet-200">
          ψ &gt; 0 Cyan · ψ &lt; 0 Amber
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-5">
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

          <div className="relative h-[250px] overflow-hidden rounded-2xl border border-white/10 bg-[#02040a]">
            <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" role="img" aria-label={`3D probability cloud for hydrogenic ${orbital.label} orbital`} />
            {webglFailed && <div className="grid h-full place-items-center p-4 text-xs text-slate-400">WebGL unavailable — radial probability P(r) remains plotted below.</div>}
            <div className="pointer-events-none absolute left-2.5 top-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[9.5px] text-violet-200">
              {orbital.label} (n={orbital.n}, l={orbital.l}, {orbital.mLabel}) · nodes {orbital.radialNodes}R/{orbital.angularNodes}A
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/90 p-2 font-mono text-[9.5px]">
            <div className="flex justify-between text-slate-400">
              <span>Radial Probability 4πr²|Rₙ,ₗ(r)|²</span>
              <span>0 → {orbital.maxRadiusBohr} a₀</span>
            </div>
            <svg viewBox="0 0 180 48" className="mt-1 h-12 w-full" role="img" aria-label="Radial probability curve">
              <polyline fill="none" stroke="#a78bfa" strokeWidth="1.6" points={radialCurvePoints} />
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
                  onClick={() => setSelectedSymbol(el.symbol)}
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
                {element.electronConfig}
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
