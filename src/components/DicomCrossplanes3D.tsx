import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ambilIrisanMpr, jendelakanMpr, type IrisanMpr, type VolumeMpr } from '../lib/dicomMpr'
import {
  arahBidangDicom,
  BATAS_ARAH_DICOM,
  formatPasanganArah,
} from '../lib/dicomPatientOrientation'

interface Props {
  volume: VolumeMpr
  cursor: { x: number; y: number }
  slice: number
  pusat: number
  lebar: number
  terbalik: boolean
}

type PlaneKey = 'source' | 'row' | 'column'

function textureFromPlane(plane: IrisanMpr, pusat: number, lebar: number, terbalik: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = plane.kolom
  canvas.height = plane.baris
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is unavailable')

  const gray = jendelakanMpr(plane.nilai, pusat, lebar, terbalik)
  const image = context.createImageData(plane.kolom, plane.baris)
  for (let i = 0; i < gray.length; i++) {
    const offset = i * 4
    image.data[offset] = gray[i]
    image.data[offset + 1] = gray[i]
    image.data[offset + 2] = gray[i]
    image.data[offset + 3] = 255
  }
  context.putImageData(image, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function quad(
  a: [number, number, number],
  b: [number, number, number],
  c: [number, number, number],
  d: [number, number, number],
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2))
  geometry.setIndex([0, 1, 2, 0, 2, 3])
  geometry.computeVertexNormals()
  return geometry
}

function disposeGroup(group: THREE.Group) {
  for (const child of [...group.children]) {
    group.remove(child)
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const material of materials) {
        if (material instanceof THREE.MeshBasicMaterial && material.map) material.map.dispose()
        material.dispose()
      }
    }
  }
}

export function DicomCrossplanes3D({ volume, cursor, slice, pusat, lebar, terbalik }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const contentRef = useRef<THREE.Group>(new THREE.Group())
  const renderRef = useRef<() => void>(() => undefined)
  const [error, setError] = useState('')
  const [planeOpacity, setPlaneOpacity] = useState(0.8)
  const [visiblePlanes, setVisiblePlanes] = useState<Record<PlaneKey, boolean>>({
    source: true,
    row: true,
    column: true,
  })

  const patientDirections = arahBidangDicom(volume.orientasiPasien)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05080c)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100)
    camera.position.set(2.6, 2.0, 2.8)
    cameraRef.current = camera

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      setError('3D graphics could not start on this device. The MRI planes above remain available.')
      return
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    rendererRef.current = renderer
    host.appendChild(renderer.domElement)

    const content = contentRef.current
    scene.add(content)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = false
    controls.enablePan = true
    controls.minDistance = 1.4
    controls.maxDistance = 8
    controls.target.set(0, 0, 0)
    controlsRef.current = controls

    const render = () => renderer.render(scene, camera)
    renderRef.current = render
    controls.addEventListener('change', render)

    const resize = () => {
      const width = Math.max(1, host.clientWidth)
      const height = Math.max(1, host.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      render()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    return () => {
      observer.disconnect()
      controls.removeEventListener('change', render)
      controls.dispose()
      disposeGroup(content)
      scene.remove(content)
      renderer.dispose()
      renderer.domElement.remove()
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      controlsRef.current = null
      renderRef.current = () => undefined
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const group = contentRef.current
    disposeGroup(group)

    try {
      const xIndex = Math.max(0, Math.min(volume.kolom - 1, Math.round(cursor.x)))
      const yIndex = Math.max(0, Math.min(volume.baris - 1, Math.round(cursor.y)))
      const zIndex = Math.max(0, Math.min(volume.kedalaman - 1, Math.round(slice)))
      const source = ambilIrisanMpr(volume, 'source', { x: xIndex, y: yIndex, z: zIndex })
      const row = ambilIrisanMpr(volume, 'cross-row', { x: xIndex, y: yIndex, z: zIndex })
      const column = ambilIrisanMpr(volume, 'cross-column', { x: xIndex, y: yIndex, z: zIndex })

      const rawX = Math.max(1e-6, volume.kolom * volume.jarakKolomMm)
      const rawY = Math.max(1e-6, volume.baris * volume.jarakBarisMm)
      const rawZ = Math.max(1e-6, volume.kedalaman * volume.jarakIrisMm)
      const scale = 2.4 / Math.max(rawX, rawY, rawZ)
      const sx = rawX * scale
      const sy = rawY * scale
      const sz = rawZ * scale

      const cx = volume.kolom <= 1 ? 0 : (xIndex / (volume.kolom - 1) - 0.5) * sx
      const cy = volume.baris <= 1 ? 0 : (0.5 - yIndex / (volume.baris - 1)) * sy
      const cz = volume.kedalaman <= 1 ? 0 : (zIndex / (volume.kedalaman - 1) - 0.5) * sz

      const addPlane = (plane: IrisanMpr, geometry: THREE.BufferGeometry, opacity: number) => {
        const texture = textureFromPlane(plane, pusat, lebar, terbalik)
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity,
          depthWrite: false,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.renderOrder = 2
        group.add(mesh)
      }

      if (visiblePlanes.source) {
        addPlane(
          source,
          quad([-sx / 2, -sy / 2, cz], [sx / 2, -sy / 2, cz], [sx / 2, sy / 2, cz], [-sx / 2, sy / 2, cz]),
          Math.min(1, planeOpacity + 0.12),
        )
      }
      if (visiblePlanes.row) {
        addPlane(
          row,
          quad([-sx / 2, cy, -sz / 2], [sx / 2, cy, -sz / 2], [sx / 2, cy, sz / 2], [-sx / 2, cy, sz / 2]),
          planeOpacity,
        )
      }
      if (visiblePlanes.column) {
        addPlane(
          column,
          quad([cx, -sy / 2, -sz / 2], [cx, sy / 2, -sz / 2], [cx, sy / 2, sz / 2], [cx, -sy / 2, sz / 2]),
          planeOpacity,
        )
      }

      const bounds = new THREE.BoxGeometry(sx, sy, sz)
      const edges = new THREE.EdgesGeometry(bounds)
      bounds.dispose()
      const outline = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x738195, transparent: true, opacity: 0.45 }),
      )
      group.add(outline)

      const guideGeometry = new THREE.BufferGeometry()
      guideGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        -sx / 2, cy, cz, sx / 2, cy, cz,
        cx, -sy / 2, cz, cx, sy / 2, cz,
        cx, cy, -sz / 2, cx, cy, sz / 2,
      ], 3))
      const guides = new THREE.LineSegments(
        guideGeometry,
        new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.82, depthTest: false }),
      )
      guides.renderOrder = 4
      group.add(guides)

      const point = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.012, Math.min(sx, sy, sz) * 0.018), 16, 12),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9, depthTest: false }),
      )
      point.position.set(cx, cy, cz)
      point.renderOrder = 5
      group.add(point)

      setError('')
      renderRef.current()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '3D voxel context could not be rendered.')
    }
  }, [
    volume,
    cursor.x,
    cursor.y,
    slice,
    pusat,
    lebar,
    terbalik,
    planeOpacity,
    visiblePlanes.source,
    visiblePlanes.row,
    visiblePlanes.column,
  ])

  const togglePlane = (key: PlaneKey) => {
    setVisiblePlanes((current) => ({ ...current, [key]: !current[key] }))
  }

  const resetView = () => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    camera.position.set(2.6, 2.0, 2.8)
    controls.target.set(0, 0, 0)
    controls.update()
    renderRef.current()
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/70">
      <div className="border-b border-white/10 px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black text-white">3D voxel context</div>
            <div className="text-[10px] text-white/45">Actual loaded pixels · three intersecting planes</div>
          </div>
          <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[9px] font-black text-cyan-200">LOCAL</span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {([
            ['source', 'Source'],
            ['row', 'Cross A'],
            ['column', 'Cross B'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={visiblePlanes[key]}
              onClick={() => togglePlane(key)}
              className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-black transition ${
                visiblePlanes[key]
                  ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                  : 'border-white/10 bg-white/5 text-white/40'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={resetView}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] font-black text-white/60 transition hover:bg-white/10"
          >
            Reset view
          </button>
          <label className="ml-auto flex min-w-[150px] items-center gap-2 text-[9px] font-bold text-white/45">
            Plane opacity
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={planeOpacity}
              onChange={(event) => setPlaneOpacity(Number(event.target.value))}
              className="w-24 accent-cyan-400"
              aria-label="3D plane opacity"
            />
          </label>
        </div>

        {patientDirections ? (
          <div className="mt-2 flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-wide text-white/45">
            <span className="rounded-md bg-white/5 px-2 py-1">Source X {formatPasanganArah(patientDirections.source.horizontal)}</span>
            <span className="rounded-md bg-white/5 px-2 py-1">Source Y {formatPasanganArah(patientDirections.source.vertical)}</span>
            <span className="rounded-md bg-white/5 px-2 py-1">Stack {formatPasanganArah(patientDirections.crossRow.vertical)}</span>
          </div>
        ) : (
          <div className="mt-2 text-[8px] font-bold text-white/30">Patient-direction metadata unavailable or not valid enough to label safely.</div>
        )}
      </div>

      <div className="relative h-[340px] min-h-[280px] bg-[#05080c] sm:h-[430px]">
        <div ref={hostRef} className="absolute inset-0" aria-label="Interactive 3D voxel cross-plane context" />
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center text-xs text-white/60">{error}</div>
        )}
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-xl border border-white/10 bg-black/60 px-2.5 py-2 text-[9px] leading-relaxed text-white/45 backdrop-blur">
          This is a spatial view of the loaded voxel planes, not surface segmentation, anatomy labeling, diagnosis, or registration to the textbook atlas. Drag to rotate; wheel/pinch to zoom. {BATAS_ARAH_DICOM}
        </div>
      </div>
    </section>
  )
}

export default DicomCrossplanes3D
