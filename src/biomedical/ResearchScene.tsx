import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { medicalCameraDistance } from '../lib/medical4D'
import type { CellRow, Volume } from './types'

export type SceneMode = 'cells' | 'imaging'
interface Props { mode: SceneMode; cells: CellRow[]; volume?: Volume; playing: boolean; speed: number; gene: string; reset: number; threshold: number; onPick: (value: string) => void }

export function ResearchScene({ mode, cells, volume, playing, speed, gene, reset, threshold, onPick }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const playback = useRef({ playing, speed })
  const pickRef = useRef(onPick)
  playback.current = { playing, speed }; pickRef.current = onPick
  const [error, setError] = useState('')
  const [points, setPoints] = useState(0)

  useEffect(() => {
    const element = host.current
    if (!element) return
    setError('')
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }) }
    catch { setError('3D graphics are unavailable. Data tables and reports remain available.'); return }
    renderer.setClearColor('#eef1f0')
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-label', `${mode} research visualization`)
    renderer.domElement.setAttribute('role', 'img')
    element.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const root = new THREE.Group()
    scene.add(root)
    scene.add(new THREE.HemisphereLight('#ffffff', '#777e7c', 2.2))
    const light = new THREE.DirectionalLight('#ffffff', 3)
    light.position.set(4, 8, 12); scene.add(light)
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 10000)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = true
    controls.autoRotateSpeed = 0.7
    const clickable: THREE.Object3D[] = []
    const materials: THREE.Material[] = []
    const geometries: THREE.BufferGeometry[] = []
    {
      const positions: number[] = [], colors: number[] = [], ids: string[] = []
      const low = new THREE.Color('#27998c'), high = new THREE.Color('#d95e58')
      const add = (position: number[], intensity: number, id: string) => {
        positions.push(...position); const color = low.clone().lerp(high, intensity); colors.push(color.r, color.g, color.b); ids.push(id)
      }
      if (mode === 'cells') {
        const rows = cells.filter(c => c.gene === gene)
        const max = Math.max(1, ...rows.map(c => c.expression))
        rows.forEach(c => add(c.position, c.expression / max, `${c.id} | ${c.gene}: ${c.expression} | ${c.group}`))
      } else if (volume) {
        const [nx, ny] = volume.dimensions
        const step = Math.max(1, Math.ceil(volume.values.length / 16000))
        const span = volume.range[1] - volume.range[0] || 1
        for (let i = 0; i < volume.values.length; i += step) {
          const intensity = (volume.values[i] - volume.range[0]) / span
          if (intensity < threshold) continue
          const index = [i % nx, Math.floor(i / nx) % ny, Math.floor(i / (nx * ny)), 1]
          const position = volume.affine.slice(0, 3).map(row => row.reduce((sum, n, k) => sum + n * index[k], 0))
          add(position, intensity, `Voxel ${index.slice(0, 3).join(', ')} | intensity ${volume.values[i].toFixed(2)}`)
        }
      }
      const geometry = new THREE.BufferGeometry(); geometries.push(geometry)
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      geometry.computeBoundingSphere()
      const radius = geometry.boundingSphere?.radius || 5
      const mat = new THREE.PointsMaterial({ vertexColors: true, size: Math.max(radius * 0.025, 0.03), sizeAttenuation: true }); materials.push(mat)
      const cloud = new THREE.Points(geometry, mat); cloud.userData.ids = ids; root.add(cloud); clickable.push(cloud)
      setPoints(ids.length)
    }

    const bounds = new THREE.Box3().setFromObject(root)
    const center = bounds.isEmpty() ? new THREE.Vector3() : bounds.getCenter(new THREE.Vector3())
    const size = bounds.isEmpty() ? 10 : Math.max(bounds.getBoundingSphere(new THREE.Sphere()).radius * 2, 1)
    controls.target.copy(center)
    const resize = () => {
      const width = element.clientWidth, height = element.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height, false); camera.aspect = width / height
      camera.far = Math.max(100, size * 50); camera.near = Math.max(size / 1000, 0.001)
      camera.updateProjectionMatrix()
      const distance = medicalCameraDistance(size / 2, camera.aspect, camera.fov)
      camera.position.copy(center).add(new THREE.Vector3(0, 0, distance))
      controls.target.copy(center); controls.update()
      controls.minDistance = size * 0.25; controls.maxDistance = Math.max(size * 8, distance * 2)
    }
    resize()
    const observer = new ResizeObserver(resize); observer.observe(element)
    const raycaster = new THREE.Raycaster(); raycaster.params.Points = { threshold: size * 0.035 }
    let down = [0, 0]
    const pointerDown = (e: PointerEvent) => { down = [e.clientX, e.clientY] }
    const pointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return
      const rect = renderer.domElement.getBoundingClientRect()
      raycaster.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), camera)
      const hit = raycaster.intersectObjects(clickable)[0]
      if (hit) pickRef.current(hit.object.userData.pick ?? hit.object.userData.ids?.[hit.index ?? 0] ?? '')
    }
    renderer.domElement.addEventListener('pointerdown', pointerDown)
    renderer.domElement.addEventListener('pointerup', pointerUp)
    let lost = false
    const contextLost = (e: Event) => { e.preventDefault(); lost = true; cancelAnimationFrame(frame); setError('Graphics context lost. Reset the view to retry. Data is unchanged.') }
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    let frame = 0, last = performance.now()
    const animate = (now: number) => {
      if (lost) return
      const dt = Math.min((now - last) / 1000, 0.1); last = now
      const active = playback.current.playing && !document.hidden && element.clientWidth > 0
      controls.autoRotate = active
      controls.autoRotateSpeed = 0.7 * playback.current.speed
      controls.update(dt)
      if (!document.hidden && element.clientWidth > 0) renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointerup', pointerUp)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [mode, cells, volume, gene, reset, threshold])

  return <div className="be-scene-wrap">
    <div ref={host} className="be-scene" />
    <div className="be-scene-caption">{mode === 'cells' ? `${points.toLocaleString()} expression points · coordinate space unverified` : `${points.toLocaleString()} sampled voxels · not a segmentation`}</div>
    {error && <div className="be-scene-error" role="alert">{error}</div>}
  </div>
}

export function VolumeSlice({ volume, slice }: { volume: Volume; slice: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const [nx, ny, nz] = volume.dimensions, z = Math.min(nz - 1, Math.max(0, slice))
    el.width = nx; el.height = ny
    const context = el.getContext('2d')!
    const image = context.createImageData(nx, ny), span = volume.range[1] - volume.range[0] || 1
    for (let i = 0; i < nx * ny; i++) {
      const value = Math.round((volume.values[z * nx * ny + i] - volume.range[0]) / span * 255)
      image.data.set([value, value, value, 255], i * 4)
    }
    context.putImageData(image, 0, 0)
  }, [volume, slice])
  return <canvas ref={canvas} className="be-slice" role="img" aria-label={`NIfTI voxel plane k=${slice}; voxel axes, not patient orientation`} />
}
