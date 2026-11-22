// The 3D face from one aligned photo: the triangulated landmark surface, textured with that photo, turnable by drag.
// A likeness for orientation only — the caption keeps the "estimated from a photo" boundary in view.

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { FaceMesh } from '../../engine/face-capture/faceMesh.ts'

export function FaceMesh3D({ mesh, photo }: { readonly mesh: FaceMesh; readonly photo: HTMLCanvasElement }) {
  const host = useRef<HTMLDivElement>(null)
  const [wire, setWire] = useState(false)
  const [noGl, setNoGl] = useState(false)
  const wireRef = useRef<THREE.LineSegments | null>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setNoGl(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    // false: keep the canvas styled by CSS (100% of the stage) rather than inline pixel sizes.
    const resize = () => {
      const size = Math.max(1, el.clientWidth)
      renderer.setSize(size, size, false)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
    camera.position.set(0, 0, 4.6)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404050, 1.6))
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(1.5, 1, 3)
    scene.add(key)

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3))
    geo.setAttribute('uv', new THREE.BufferAttribute(mesh.uvs, 2))
    geo.setIndex(new THREE.BufferAttribute(mesh.indices, 1))
    geo.computeVertexNormals()
    const tex = new THREE.CanvasTexture(photo)
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    tex.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, side: THREE.DoubleSide })
    const face = new THREE.Mesh(geo, mat)
    const wireGeo = new THREE.WireframeGeometry(geo)
    const wireMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55 })
    const lines = new THREE.LineSegments(wireGeo, wireMat)
    lines.visible = false
    wireRef.current = lines
    scene.add(face, lines)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.minDistance = 3
    controls.maxDistance = 8
    // A face seen from behind is an empty shell; keep the view in front.
    controls.minAzimuthAngle = -1.2
    controls.maxAzimuthAngle = 1.2
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    controls.autoRotate = !reduce
    controls.autoRotateSpeed = 1.6
    const stopAuto = () => { controls.autoRotate = false }
    renderer.domElement.addEventListener('pointerdown', stopAuto)

    let raf = 0
    let previousTime = performance.now()
    let dir = 1
    const tick = (time: number) => {
      const elapsed = Math.min(0.1, Math.max(0, (time - previousTime) / 1000))
      previousTime = time
      // Swing left-right inside the front arc instead of spinning past it.
      const az = controls.getAzimuthalAngle()
      if (controls.autoRotate && Math.abs(az) > 0.7) dir = az > 0 ? 1 : -1
      controls.autoRotateSpeed = 1.6 * dir
      controls.update(elapsed)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
      renderer.domElement.removeEventListener('pointerdown', stopAuto)
      controls.dispose()
      geo.dispose(); mat.dispose(); tex.dispose(); wireGeo.dispose(); wireMat.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      wireRef.current = null
    }
  }, [mesh, photo])

  useEffect(() => { if (wireRef.current) wireRef.current.visible = wire }, [wire, mesh, photo])

  if (noGl) return <p className="fc-err" role="alert">3D is not available in this browser.</p>

  return (
    <figure className="fc-3d">
      <div ref={host} className="fc-3d-stage" role="img" aria-label={`3D face surface from your photo: ${mesh.vertexCount} points, ${mesh.triangleCount} triangles. Drag to turn.`} />
      <figcaption>
        <span>{mesh.vertexCount} points · {mesh.triangleCount} triangles · drag to turn</span>
        <button type="button" className="fc-btn" aria-pressed={wire} onClick={() => setWire((w) => !w)}>{wire ? 'Hide mesh' : 'Show mesh'}</button>
      </figcaption>
    </figure>
  )
}
