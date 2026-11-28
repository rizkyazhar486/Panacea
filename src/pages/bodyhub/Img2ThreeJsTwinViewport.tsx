import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buatRendererAman } from '../../lib/rendererAman'
import { mulaiLoopTerjaga, type LoopTerjaga } from '../../lib/loopRenderTerjaga'
import {
  IMG2THREEJS_PROVENANCE,
  analyzeImageMaterialRegions,
  buildImg2ThreeJsDigitalTwinSpec,
  evaluateImg2ThreeJsSuitability,
  type ImageSuitabilityReport,
  type MaterialHypothesisRecord,
  type ObjectSculptSpec,
} from '../../domains/body-exposure/engine/img2threejsTwinEngine'

interface Img2ThreeJsTwinViewportProps {
  capturedFrameCount?: number
}

function sampleRegionRgb(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x0Frac: number,
  y0Frac: number,
  x1Frac: number,
  y1Frac: number,
) {
  const x0 = Math.max(0, Math.floor(w * x0Frac))
  const x1 = Math.min(w, Math.floor(w * x1Frac))
  const y0 = Math.max(0, Math.floor(h * y0Frac))
  const y1 = Math.min(h, Math.floor(h * y1Frac))
  let r = 0
  let g = 0
  let b = 0
  let lumSq = 0
  let lumSum = 0
  let n = 0
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const idx = (y * w + x) * 4
      const rv = data[idx]! / 255
      const gv = data[idx + 1]! / 255
      const bv = data[idx + 2]! / 255
      const lum = 0.299 * rv + 0.587 * gv + 0.114 * bv
      r += rv
      g += gv
      b += bv
      lumSum += lum
      lumSq += lum * lum
      n += 1
    }
  }
  if (n === 0) return { r01: 0.5, g01: 0.5, b01: 0.5, specularSpread01: 0.2, samplePixels: 0 }
  const meanLum = lumSum / n
  const variance = Math.max(0, lumSq / n - meanLum * meanLum)
  return {
    r01: r / n,
    g01: g / n,
    b01: b / n,
    specularSpread01: Math.min(1, Math.sqrt(variance) * 2.2),
    samplePixels: n,
  }
}

function buildSculptGroup(spec: ObjectSculptSpec, clipPlane: THREE.Plane | null): THREE.Group {
  const root = new THREE.Group()
  root.name = 'img2threejs-1to1-cad-twin'
  const clippingPlanes = clipPlane ? [clipPlane] : []

  const skinMat = new THREE.MeshStandardMaterial({
    color: spec.palette.skinHex,
    roughness: spec.materialHypotheses[0]?.roughness ?? 0.56,
    metalness: 0.0,
    clippingPlanes,
    clipShadows: true,
    side: THREE.DoubleSide,
  })
  const hairMat = new THREE.MeshStandardMaterial({
    color: spec.palette.hairHex,
    roughness: spec.materialHypotheses[1]?.roughness ?? 0.44,
    metalness: 0.04,
    clippingPlanes,
  })
  const garmentMat = new THREE.MeshStandardMaterial({
    color: spec.palette.garmentHex,
    roughness: spec.materialHypotheses[2]?.roughness ?? 0.82,
    metalness: 0.0,
    clippingPlanes,
    side: THREE.DoubleSide,
  })
  const jointMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.3,
    metalness: 0.25,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.35,
  })

  const pivots: Record<string, THREE.Object3D> = {}

  for (const seg of spec.segments) {
    const mat = seg.materialRegion === 'skin-face' ? skinMat : seg.materialRegion === 'hair-crown' ? hairMat : garmentMat
    const isFoot = seg.id.startsWith('foot-')
    const geo = isFoot
      ? new THREE.BoxGeometry(seg.radiusTopM * 2.4, seg.radiusBottomM * 1.4, seg.lengthM)
      : seg.id === 'head'
        ? new THREE.SphereGeometry(seg.radiusTopM * 1.15, 28, 22)
        : new THREE.CylinderGeometry(seg.radiusTopM, seg.radiusBottomM, seg.lengthM, 24, 1, false)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.name = seg.id
    mesh.position.set(seg.positionM.x, seg.positionM.y, seg.positionM.z)
    if (!isFoot) mesh.scale.set(1, 1, seg.depthRatioZ)
    if (seg.id === 'head') mesh.scale.set(0.92, 1.18, 1.04)
    root.add(mesh)
    pivots[seg.id] = mesh

    if (seg.id === 'head') {
      const hairCap = new THREE.Mesh(
        new THREE.SphereGeometry(seg.radiusTopM * 1.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56),
        hairMat,
      )
      hairCap.position.set(seg.positionM.x, seg.positionM.y + seg.radiusTopM * 0.12, seg.positionM.z - seg.radiusTopM * 0.06)
      hairCap.scale.set(0.94, 1.15, 1.05)
      root.add(hairCap)
    }

    if (seg.parentSocketId) {
      const joint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), jointMat)
      joint.position.set(seg.positionM.x, seg.positionM.y + (isFoot ? 0.015 : seg.lengthM * 0.48), seg.positionM.z)
      root.add(joint)
    }
  }

  // Expose img2threejs sculptRuntime hierarchy for kinematic & CAD/CAE inspection
  root.userData.sculptRuntime = {
    specVersion: spec.specVersion,
    pivots,
    cadCaeMetrics: spec.cadCaeMetrics,
  }
  return root
}

export default function Img2ThreeJsTwinViewport({ capturedFrameCount = 0 }: Img2ThreeJsTwinViewportProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [heightCm, setHeightCm] = useState(170)
  const [weightKg, setWeightKg] = useState(66)
  const [sex, setSex] = useState<'female' | 'male'>('female')
  const [postureMode, setPostureMode] = useState<'neutral' | 'gait' | 'squat'>('neutral')
  const [clipAxis, setClipAxis] = useState<'none' | 'axial' | 'sagittal'>('none')
  const [suitability, setSuitability] = useState<ImageSuitabilityReport | undefined>(undefined)
  const [materials, setMaterials] = useState<readonly MaterialHypothesisRecord[] | undefined>(undefined)
  const [photoNote, setPhotoNote] = useState<string>('Ready for local photo or CAD sliders (raw photo purged in RAM)')
  const [webglFailed, setWebglFailed] = useState(false)

  const spec = useMemo(
    () =>
      buildImg2ThreeJsDigitalTwinSpec({
        heightCm,
        weightKg,
        biologicalSex: sex,
        postureMode,
        suitability,
        materialHypotheses: materials,
      }),
    [heightCm, weightKg, sex, postureMode, suitability, materials],
  )

  const handleLocalReferencePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const tempUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const w = Math.min(256, img.naturalWidth || 256)
        const h = Math.min(256, img.naturalHeight || 256)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          const { data } = ctx.getImageData(0, 0, w, h)
          const overall = sampleRegionRgb(data, w, h, 0.15, 0.08, 0.85, 0.92)
          const skin = sampleRegionRgb(data, w, h, 0.42, 0.12, 0.58, 0.24)
          const hair = sampleRegionRgb(data, w, h, 0.40, 0.04, 0.60, 0.12)
          const garment = sampleRegionRgb(data, w, h, 0.35, 0.34, 0.65, 0.58)
          const meanLum = 0.299 * overall.r01 + 0.587 * overall.g01 + 0.114 * overall.b01
          const suit = evaluateImg2ThreeJsSuitability({
            widthPx: img.naturalWidth,
            heightPx: img.naturalHeight,
            meanLuminance01: meanLum,
            foregroundCoverage01: 0.52,
            silhouetteAspectRatio: img.naturalWidth / Math.max(1, img.naturalHeight),
          })
          const matHyps = analyzeImageMaterialRegions([
            { regionId: 'skin-face', ...skin },
            { regionId: 'hair-crown', ...hair },
            { regionId: 'garment-torso', ...garment },
          ])
          setSuitability(suit)
          setMaterials(matHyps)
          setPhotoNote(`Extracted PBR palette & gates (${suit.status}, conf ${suit.confidence}); raw image purged immediately.`)
          ctx.clearRect(0, 0, w, h)
        }
      } finally {
        URL.revokeObjectURL(tempUrl)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(tempUrl)
      setPhotoNote('Could not read local image; photo buffer cleared.')
    }
    img.src = tempUrl
  }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const renderer = buatRendererAman({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    if (!renderer) {
      setWebglFailed(true)
      return
    }
    setWebglFailed(false)
    renderer.localClippingEnabled = true
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex

    const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 40)
    const halfH = (spec.cadCaeMetrics.heightCm / 100) * 0.52
    camera.position.set(0.35, halfH + 0.12, 2.55)

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 1.35)
    key.position.set(2.5, 4.0, 3.5)
    scene.add(key)

    const grid = new THREE.GridHelper(2.2, 12, 0x38bdf8, 0x1e293b)
    scene.add(grid)

    const clipPlane =
      clipAxis === 'axial'
        ? new THREE.Plane(new THREE.Vector3(0, -1, 0), halfH * 1.15)
        : clipAxis === 'sagittal'
          ? new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)
          : null

    const twinGroup = buildSculptGroup(spec, clipPlane)
    scene.add(twinGroup)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, halfH, 0)
    controls.enableDamping = true
    controls.update()

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

    let phase = 0
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const loop: LoopTerjaga = mulaiLoopTerjaga(host, () => {
      if (!reduceMotion) {
        phase += 0.025
        const pivots = (twinGroup.userData.sculptRuntime as { pivots: Record<string, THREE.Object3D> }).pivots
        const thorax = pivots.thorax
        if (thorax) {
          const breath = 1 + Math.sin(phase) * 0.018
          thorax.scale.x = breath
        }
        if (postureMode === 'gait') {
          const swing = Math.sin(phase * 1.6) * 0.24
          if (pivots['thigh-l']) pivots['thigh-l'].rotation.x = swing
          if (pivots['thigh-r']) pivots['thigh-r'].rotation.x = -swing
          if (pivots['upper-arm-l']) pivots['upper-arm-l'].rotation.x = -swing * 0.7
          if (pivots['upper-arm-r']) pivots['upper-arm-r'].rotation.x = swing * 0.7
        } else if (postureMode === 'squat') {
          const depth = (Math.sin(phase) * 0.5 + 0.5) * 0.14
          twinGroup.position.y = -depth
        } else {
          twinGroup.position.y = 0
        }
      }
      controls.update()
      renderer.render(scene, camera)
    })

    const onLost = (e: Event) => {
      e.preventDefault()
      loop.kontekHilang()
    }
    renderer.domElement.addEventListener('webglcontextlost', onLost)

    return () => {
      loop.hentikan()
      renderer.domElement.removeEventListener('webglcontextlost', onLost)
      ro.disconnect()
      controls.dispose()
      envTex.dispose()
      pmrem.dispose()
      const geos = new Set<THREE.BufferGeometry>()
      const mats = new Set<THREE.Material>()
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (!mesh.isMesh) return
        if (!geos.has(mesh.geometry)) {
          mesh.geometry.dispose()
          geos.add(mesh.geometry)
        }
        const m = mesh.material as THREE.Material
        if (!mats.has(m)) {
          m.dispose()
          mats.add(m)
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [spec, clipAxis, postureMode])

  const exportCadJson = () => {
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panacea-img2threejs-cad-twin-${spec.cadCaeMetrics.heightCm}cm.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section
      data-img2threejs-cad-twin="v1"
      aria-label="img2threejs 1:1 Procedural 3D CAD/CAE Digital Twin"
      className="dark mt-3 space-y-3 rounded-2xl border border-cyan-400/25 bg-[#040912] p-3.5 text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-wider text-cyan-200">
            1:1 Procedural 3D CAD/CAE Digital Twin · img2threejs (Apache-2.0)
          </div>
          <div className="text-[11px] text-slate-300">{photoNote}</div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9.5px]">
          <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
            CHIRALITY {spec.chiralityGate.passed ? 'PASS' : 'CHECK'} ({spec.chiralityGate.pairsChecked} pairs)
          </span>
          <span className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 text-cyan-200">
            SOCKETS {spec.socketAttachmentGate.passed ? 'LOCKED' : 'OPEN'}
          </span>
          {capturedFrameCount > 0 && (
            <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-amber-200">
              {capturedFrameCount} CAM VIEWS
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="relative h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#02050a] lg:col-span-6">
          <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" role="img" aria-label="1:1 procedural Three.js human CAD digital twin" />
          {webglFailed && (
            <div className="grid h-full place-items-center p-4 text-center text-xs text-slate-300">
              WebGL 3D unavailable on this device — CAD/CAE metrics remain computed below.
            </div>
          )}
          <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 font-mono text-[9.5px] text-cyan-200">
            1:1 ({spec.cadCaeMetrics.heightCm} cm · {spec.cadCaeMetrics.weightKg} kg · BSA {spec.cadCaeMetrics.bsaDuBoisM2} m²)
          </div>
        </div>

        <div className="space-y-2.5 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
            <label className="inline-flex min-h-9 cursor-pointer items-center rounded-xl border border-cyan-300/45 bg-cyan-500/15 px-3 font-black text-cyan-100 hover:bg-cyan-500/25">
              Load Local Photo (RAM-only)
              <input type="file" accept="image/*" onChange={handleLocalReferencePhoto} className="sr-only" />
            </label>
            {(['female', 'male'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSex(s)} aria-pressed={sex === s} className={`min-h-9 rounded-xl border px-2.5 font-black uppercase ${sex === s ? 'border-cyan-300 bg-cyan-500/25 text-white' : 'border-white/15 text-slate-300'}`}>
                {s}
              </button>
            ))}
            <button type="button" onClick={exportCadJson} className="min-h-9 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-2.5 font-black text-emerald-100 hover:bg-emerald-500/25">
              Export CAD JSON
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2 text-cyan-200">
              <span>Height {heightCm} cm</span>
              <input type="range" min={110} max={210} value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} className="accent-cyan-400" />
            </label>
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 p-2 text-emerald-200">
              <span>Mass {weightKg} kg</span>
              <input type="range" min={25} max={145} value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="accent-emerald-400" />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
            {(['neutral', 'gait', 'squat'] as const).map((pm) => (
              <button key={pm} type="button" onClick={() => setPostureMode(pm)} aria-pressed={postureMode === pm} className={`min-h-8 rounded-lg border px-2.5 font-bold uppercase ${postureMode === pm ? 'border-amber-300 bg-amber-500/20 text-amber-100' : 'border-white/10 text-slate-400'}`}>
                CAE: {pm}
              </button>
            ))}
            {(['none', 'axial', 'sagittal'] as const).map((ax) => (
              <button key={ax} type="button" onClick={() => setClipAxis(ax)} aria-pressed={clipAxis === ax} className={`min-h-8 rounded-lg border px-2.5 font-bold uppercase ${clipAxis === ax ? 'border-violet-300 bg-violet-500/20 text-violet-100' : 'border-white/10 text-slate-400'}`}>
                CAD Slice: {ax}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 font-mono text-[10px]">
            <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
              <div className="text-slate-400">BMI / WHR</div>
              <div className="font-black text-cyan-200">{spec.cadCaeMetrics.bmi} · {spec.cadCaeMetrics.waistToHipRatio}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
              <div className="text-slate-400">CHEST / WAIST / HIP</div>
              <div className="font-black text-emerald-200">{spec.cadCaeMetrics.chestCircumferenceCm}/{spec.cadCaeMetrics.waistCircumferenceCm}/{spec.cadCaeMetrics.hipCircumferenceCm} cm</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
              <div className="text-slate-400">CoM / KNEE LOAD</div>
              <div className="font-black text-amber-200">{spec.cadCaeMetrics.centerOfMassHeightCm} cm · {spec.cadCaeMetrics.peakKneeJointLoadN} N</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-[10px] text-slate-400">
            {IMG2THREEJS_PROVENANCE.epistemicBoundary}
          </div>
        </div>
      </div>
    </section>
  )
}
