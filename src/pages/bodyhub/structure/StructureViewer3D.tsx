import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mulaiLoopTerjaga } from '../../../lib/loopRenderTerjaga'
import { buatRendererAman } from '../../../lib/rendererAman'
import { parsePdb } from '../../../lib/molekul/struktur'
import { buildCartoon, type Cartoon, type ColourScheme, type ResidueInfo } from './cartoon'

const SS_LABEL: Record<ResidueInfo['ss'], string> = { H: 'α-helix', E: 'β-strand', C: 'coil', N: 'nucleotide' }

function plddtBand(p: number) {
  if (p > 90) return 'very high'
  if (p > 70) return 'confident'
  if (p > 50) return 'low'
  return 'very low'
}

export interface StructureStats { protein: number; nucleotide: number; ligand: number; chains: number }

export function StructureViewer3D({ url, label, scheme, onStats }: { url: string; label: string; scheme: ColourScheme; onStats?: (stats: StructureStats) => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [hover, setHover] = useState<{ x: number; y: number; residue: ResidueInfo } | null>(null)
  const statsRef = useRef(onStats)
  statsRef.current = onStats

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    setState('loading')
    setHover(null)
    let disposed = false
    const renderer = buatRendererAman({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    if (!renderer) { setState('failed'); return }
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.dataset.structure3d = label
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.style.display = 'block'
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTexture
    // A dimmer environment keeps the specular sheen from washing out the colour scheme.
    scene.environmentIntensity = 0.45
    const key = new THREE.DirectionalLight(0xffffff, 2.1)
    key.position.set(1, 1.4, 1.2)
    const fill = new THREE.DirectionalLight(0x9db8ff, 0.5)
    fill.position.set(-1.2, -0.4, -0.6)
    const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 4000)
    camera.add(key, fill)
    scene.add(camera)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotateSpeed = 0.6

    const material = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.35, side: THREE.DoubleSide })

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

    let cartoon: Cartoon | null = null
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    // Picking is throttled to ~30 Hz; large models have hundreds of thousands of triangles.
    let lastPick = 0
    const onMove = (e: PointerEvent) => {
      if (!cartoon || e.buttons || e.timeStamp - lastPick < 33) return
      lastPick = e.timeStamp
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(cartoon.meshes.map((m) => m.mesh), false)[0]
      if (!hit?.face) { setHover(null); return }
      const owner = cartoon.meshes.find((m) => m.mesh === hit.object)!
      const residue = cartoon.residues[owner.residueOfVertex[hit.face.a]!]
      setHover(residue ? { x: e.clientX - rect.left, y: e.clientY - rect.top, residue } : null)
    }
    const onLeave = () => setHover(null)
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('pointerleave', onLeave)

    let loop: { hentikan: () => void } | null = null
    const frame = () => {
      controls.update()
      renderer.render(scene, camera)
    }

    fetch(url)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((text) => {
        if (disposed) return
        const structure = parsePdb(text)
        cartoon = buildCartoon(structure, scheme)
        for (const m of cartoon.meshes) m.mesh.material = material
        cartoon.group.position.copy(cartoon.center).negate()
        scene.add(cartoon.group)
        const r = cartoon.radius
        // Fit the bounding sphere to the narrower of the two view angles so portrait phones don't clip it.
        const halfV = (camera.fov * Math.PI) / 360
        const halfFit = Math.min(halfV, Math.atan(Math.tan(halfV) * camera.aspect))
        camera.position.set(0, r * 0.2, (r / Math.sin(halfFit)) * 0.82)
        camera.near = r * 0.02
        camera.far = r * 12
        camera.updateProjectionMatrix()
        controls.minDistance = r * 0.6
        controls.maxDistance = r * 5
        statsRef.current?.({ ...cartoon.counts, chains: new Set(cartoon.residues.map((x) => x.chain)).size })
        setState('ready')
        loop = mulaiLoopTerjaga(host, frame)
      })
      .catch(() => { if (!disposed) setState('failed') })

    return () => {
      disposed = true
      if (loop) loop.hentikan()
      ro.disconnect()
      controls.dispose()
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerleave', onLeave)
      cartoon?.meshes.forEach((m) => m.mesh.geometry.dispose())
      material.dispose()
      envTexture.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [url, scheme, label])

  return (
    <div className="absolute inset-0" data-structure-3d-state={state}>
      <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" role="img" aria-label={`${label}: 3D cartoon of the deposited structure. Drag to rotate, scroll to zoom, hover to name a residue.`} />
      {hover && (
        <div className="pointer-events-none absolute z-10 rounded-xl border border-white/15 bg-black/75 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xl backdrop-blur-md" style={{ left: Math.min(hover.x + 14, (hostRef.current?.clientWidth ?? 300) - 170), top: Math.max(8, hover.y - 46) }}>
          <div>{hover.residue.name} {hover.residue.seq} <span className="text-white/45">· chain {hover.residue.chain}</span></div>
          <div className="text-[10px] font-semibold text-white/60">
            {SS_LABEL[hover.residue.ss]}{scheme === 'plddt' && hover.residue.ss !== 'N' ? ` · pLDDT ${hover.residue.bFactor.toFixed(1)} (${plddtBand(hover.residue.bFactor)})` : ''}
          </div>
        </div>
      )}
      {state !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-[11px] font-bold text-white/45" role="status">
          {state === 'loading' ? `Building ${label}…` : `${label} could not be rendered on this device.`}
        </div>
      )}
    </div>
  )
}
