import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  DISCOVERY_NEURO_3D_BOUNDARY,
  NEUROCHEMICALS,
  type NeurochemicalId,
} from '../../lib/discoveryNeuropsychiatry3D'

const PALETTE: Record<NeurochemicalId, number> = {
  sodium: 0x3b82f6,
  potassium: 0xa855f7,
  calcium: 0xf59e0b,
  chloride: 0x22c55e,
  glutamate: 0xef4444,
  gaba: 0x06b6d4,
  dopamine: 0xeab308,
  serotonin: 0xec4899,
  norepinephrine: 0xf97316,
  acetylcholine: 0x14b8a6,
}

export default function Neuropsychiatry3DLab() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [selected, setSelected] = useState<NeurochemicalId>('glutamate')
  const [running, setRunning] = useState(true)
  const mechanism = useMemo(() => NEUROCHEMICALS.find((item) => item.id === selected) ?? NEUROCHEMICALS[0], [selected])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x070a0f)
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 4.5, 10)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.replaceChildren(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.minDistance = 6
    controls.maxDistance = 18

    const ambient = new THREE.HemisphereLight(0xffffff, 0x132033, 1.8)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(4, 7, 5)
    scene.add(key)

    const membraneMat = new THREE.MeshPhysicalMaterial({ color: 0x475569, roughness: 0.32, metalness: 0.06, transparent: true, opacity: 0.78 })
    const soma = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 24), membraneMat)
    soma.position.set(-3.2, 0, 0)
    scene.add(soma)

    const axon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.4, 20), membraneMat)
    axon.rotation.z = Math.PI / 2
    axon.position.set(-0.7, 0, 0)
    scene.add(axon)

    const terminal = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), membraneMat)
    terminal.position.set(1.55, 0, 0)
    scene.add(terminal)

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.5, 3.5), new THREE.MeshPhysicalMaterial({ color: 0x334155, roughness: 0.5, transparent: true, opacity: 0.76 }))
    post.position.set(3.2, 0, 0)
    scene.add(post)

    const cleftPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 3.2), new THREE.MeshBasicMaterial({ color: 0x1f2937, transparent: true, opacity: 0.32, side: THREE.DoubleSide }))
    cleftPlane.rotation.y = Math.PI / 2
    cleftPlane.position.set(2.35, 0, 0)
    scene.add(cleftPlane)

    const particleMaterial = new THREE.MeshStandardMaterial({ color: PALETTE[selected], emissive: PALETTE[selected], emissiveIntensity: 0.5 })
    const particles = Array.from({ length: 24 }, (_, index) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), particleMaterial)
      mesh.position.set(1.9 + (index % 6) * 0.16, -1 + Math.floor(index / 6) * 0.55, (index % 4 - 1.5) * 0.34)
      scene.add(mesh)
      return mesh
    })

    const receptorMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, emissive: 0x111827, roughness: 0.42 })
    for (let y = -1.1; y <= 1.1; y += 0.55) {
      const receptor = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.045, 10, 18), receptorMaterial)
      receptor.rotation.y = Math.PI / 2
      receptor.position.set(2.95, y, 0)
      scene.add(receptor)
    }

    const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10), pulseMaterial)
    pulse.position.set(-3, 0, 0)
    scene.add(pulse)

    const resize = () => {
      const width = Math.max(280, mount.clientWidth)
      const height = Math.max(320, Math.min(520, Math.round(width * 0.68)))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    let raf = 0
    let t0 = performance.now()
    const render = (now: number) => {
      const elapsed = (now - t0) / 1000
      if (running) {
        const phase = elapsed % 3.2
        pulse.position.x = -3 + Math.min(1, phase / 1.6) * 4.4
        pulse.visible = phase < 1.7
        particles.forEach((particle, index) => {
          const local = (elapsed * 0.75 + index * 0.08) % 1
          particle.position.x = 1.78 + local * 1.05
          particle.scale.setScalar(0.82 + 0.32 * Math.sin(local * Math.PI))
        })
      }
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const mats = Array.isArray(object.material) ? object.material : [object.material]
          mats.forEach((material) => material.dispose())
        }
      })
      mount.replaceChildren()
    }
  }, [running, selected])

  return (
    <section className="space-y-3" aria-label="Neuropsychiatry 3D mechanism lab">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">Discovery · Neuropsychiatry 3D</div>
            <h2 className="mt-1 text-lg font-black text-ink dark:text-white">Neuron → synapse → chemistry → circuit</h2>
          </div>
          <button type="button" onClick={() => setRunning((value) => !value)} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs font-black text-neutral-600 dark:text-neutral-200">
            {running ? 'Pause mechanism' : 'Play mechanism'}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{DISCOVERY_NEURO_3D_BOUNDARY}</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {NEUROCHEMICALS.map((item) => (
          <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}
            className={`min-h-11 shrink-0 rounded-full border px-3 text-[11px] font-black ${selected === item.id ? 'border-brand bg-brand text-white' : 'border-white/10 text-neutral-500'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div ref={mountRef} className="min-h-[320px] w-full" data-neuropsychiatry-webgl="schematic-v1" />
          <div className="border-t border-white/10 px-3 py-2 text-[10px] text-neutral-500">Drag to orbit · pinch/wheel to zoom · animated white pulse = action-potential timing cue · colored particles = selected ion/transmitter concept.</div>
        </div>

        <aside className="space-y-2 rounded-2xl border border-white/10 p-3">
          <div className="text-[9px] font-black uppercase tracking-[0.14em] text-neutral-400">Selected mechanism</div>
          <div className="text-base font-black text-ink dark:text-white">{mechanism.label}</div>
          <div className="rounded-xl bg-neutral-100/70 p-2.5 text-[11px] leading-relaxed text-neutral-600 dark:bg-white/5 dark:text-neutral-300">{mechanism.primaryRole}</div>
          <div className="text-[10px] leading-relaxed text-neutral-500"><b>What the 3D scene encodes:</b> {mechanism.visualRole}</div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2 text-[10px] leading-relaxed text-amber-700 dark:text-amber-300">No psychiatric symptom, identity, belief, decision, personality trait or diagnosis is represented as a one-neurotransmitter or one-region phenomenon. Circuit-level and mental-state layers must remain many-to-many, evidence-labelled mappings.</div>
        </aside>
      </div>
    </section>
  )
}
