import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function MechanismScene({ labels, phase, onPick }: { labels: string[]; phase: number; onPick: (index: number) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(phase)
  const pickRef = useRef(onPick)
  phaseRef.current = phase
  pickRef.current = onPick
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const container = host.current
    if (!container) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }) } catch { setFailed(true); return }
    setFailed(false)
    renderer.setClearColor('#101819')
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 100)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = 4
    controls.maxDistance = 25
    const points = labels.map((_, index) => new THREE.Vector3((index % 2) * 3 - 1.5, 1.6 - Math.floor(index / 2) * 3.2, index % 2 ? -.35 : .35))
    const colors = ['#55c5bc', '#e5b956', '#b2a3db', '#e58b84']
    const nodes = points.map((point, index) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(.3, 24, 16), new THREE.MeshStandardMaterial({ color: colors[index % 4], roughness: .35, metalness: .2, emissive: colors[index % 4], emissiveIntensity: .1 }))
      mesh.position.copy(point); mesh.userData.index = index; scene.add(mesh)
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#f0f5f3'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 27px sans-serif'
      ctx.fillText(`${index + 1}. ${labels[index]}`, 256, 48, 490)
      const texture = new THREE.CanvasTexture(canvas)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }))
      sprite.position.copy(point).add(new THREE.Vector3(0, -.62, 0)); sprite.scale.set(2.7, .5, 1); scene.add(sprite)
      return mesh
    })
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i], end = points[i + 1]
      const direction = end.clone().sub(start).normalize()
      scene.add(new THREE.ArrowHelper(direction, start.clone().addScaledVector(direction, .42), start.distanceTo(end) - .84, '#617776', .22, .13))
    }
    const marker = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff0bc' }))
    scene.add(marker, new THREE.HemisphereLight('#ffffff', '#364540', 2))
    const light = new THREE.DirectionalLight('#ffffff', 3); light.position.set(1, 5, 5); scene.add(light)
    const resize = () => {
      const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight)
      camera.aspect = width / height
      camera.position.set(0, 0, Math.max(8, 6 / camera.aspect))
      camera.updateProjectionMatrix(); controls.target.set(0, -.15, 0); controls.update()
      renderer.setPixelRatio(Math.min(devicePixelRatio, width < 640 ? 1.5 : 2))
      renderer.setSize(width, height, false)
    }
    const observer = new ResizeObserver(resize); observer.observe(container); resize()
    let visible = true, lost = false, frame = 0
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }); visibility.observe(container)
    const loss = (event: Event) => { event.preventDefault(); lost = true; setFailed(true) }
    renderer.domElement.addEventListener('webglcontextlost', loss)
    const draw = () => {
      frame = requestAnimationFrame(draw)
      if (!visible || document.hidden || lost) return
      const value = Math.max(0, Math.min(points.length - 1, phaseRef.current))
      const index = Math.floor(value)
      marker.position.copy(points[index]).lerp(points[Math.min(index + 1, points.length - 1)], value - index)
      nodes.forEach((node, i) => { node.material.emissiveIntensity = i === index ? .65 : .08 })
      controls.update(); renderer.render(scene, camera)
    }
    let start: PointerEvent | null = null
    const down = (event: PointerEvent) => { start = event.isPrimary ? event : null }
    const up = (event: PointerEvent) => {
      const initial = start; start = null
      if (!initial || event.pointerId !== initial.pointerId || Math.hypot(event.clientX - initial.clientX, event.clientY - initial.clientY) > 5) return
      const rect = renderer.domElement.getBoundingClientRect()
      const ray = new THREE.Raycaster()
      ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera)
      const hit = ray.intersectObjects(nodes)[0]
      if (hit) pickRef.current(hit.object.userData.index as number)
    }
    renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointerup', up)
    draw()
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect(); controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('webglcontextlost', loss)
      scene.traverse(object => {
        const mesh = object as THREE.Mesh
        mesh.geometry?.dispose()
        if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          (material as THREE.SpriteMaterial).map?.dispose(); material.dispose()
        }
      })
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [labels, retry])
  return <div className="phys-scene"><div ref={host} className="phys-canvas" aria-label="Interactive mechanism sequence, schematic not anatomy" />{failed && <div className="phys-fallback" role="alert">3D is unavailable. The numbered sequence remains available below.<button onClick={() => setRetry(value => value + 1)}>Retry 3D</button></div>}</div>
}
