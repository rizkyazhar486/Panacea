import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useStore } from '../lib/store'
import { getBodyCharacter, characterShape } from '../lib/bodyCharacter'
import { getDemoTersimpan } from '../lib/profile'

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

export function PersonalBodyAvatar3D() {
  const mountRef = useRef<HTMLDivElement>(null)
  const { account, state } = useStore()
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const refresh = () => setRevision((x) => x + 1)
    window.addEventListener('panacea:body-character-updated', refresh)
    window.addEventListener('panacea:health-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('panacea:body-character-updated', refresh)
      window.removeEventListener('panacea:health-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const profile = account ? state.profiles[account.email] ?? {} : {}
  const input = useMemo(() => {
    const demo = getDemoTersimpan()
    const body = getBodyCharacter()
    const heightCm = typeof demo.heightCm === 'number' && demo.heightCm > 0 ? demo.heightCm : 170
    const weightKg = typeof demo.weightKg === 'number' && demo.weightKg > 0 ? demo.weightKg : 70
    const bmi = weightKg / Math.pow(heightCm / 100, 2)
    return {
      heightCm,
      weightKg,
      bmi,
      sex: demo.sex,
      shape: characterShape(body.bodyType),
      bodyType: body.bodyType,
      face: profile.avatar,
    }
  }, [profile.avatar, revision])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#071018')
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 1.25, 5.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    mount.innerHTML = ''
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = 3.6
    controls.maxDistance = 7.5
    controls.target.set(0, 0.85, 0)

    scene.add(new THREE.HemisphereLight(0xd8f4ff, 0x17211a, 2.0))
    const key = new THREE.DirectionalLight(0xffffff, 2.8)
    key.position.set(3, 5, 4)
    key.castShadow = true
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x5bc7ff, 1.8)
    rim.position.set(-4, 3, -4)
    scene.add(rim)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.55, 64),
      new THREE.MeshStandardMaterial({ color: 0x101a20, roughness: 0.8, metalness: 0.05 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.68
    floor.receiveShadow = true
    scene.add(floor)

    const person = new THREE.Group()
    scene.add(person)

    const heightScale = clamp(input.heightCm / 170, 0.86, 1.16)
    const bmiFactor = clamp((input.bmi - 22) / 18, -0.22, 0.42)
    const shapeAdjust = {
      slim: { shoulder: -0.06, waist: -0.08, hip: -0.04, limb: -0.035 },
      balanced: { shoulder: 0, waist: 0, hip: 0, limb: 0 },
      athletic: { shoulder: 0.10, waist: -0.02, hip: 0.01, limb: 0.04 },
      broad: { shoulder: 0.08, waist: 0.09, hip: 0.06, limb: 0.055 },
      curvy: { shoulder: 0.01, waist: -0.02, hip: 0.10, limb: 0.02 },
    }[input.shape]

    const shoulder = 0.68 + bmiFactor * 0.16 + shapeAdjust.shoulder
    const waist = 0.43 + bmiFactor * 0.22 + shapeAdjust.waist
    const hip = 0.52 + bmiFactor * 0.16 + shapeAdjust.hip + (input.sex === 'F' ? 0.05 : 0)
    const limb = 0.145 + bmiFactor * 0.035 + shapeAdjust.limb
    const torsoH = 1.12 * heightScale
    const legH = 1.42 * heightScale
    const armH = 1.08 * heightScale

    const skin = new THREE.MeshStandardMaterial({ color: 0xc99571, roughness: 0.62, metalness: 0.02 })
    const shirt = new THREE.MeshStandardMaterial({ color: 0x143b35, roughness: 0.52, metalness: 0.04 })
    const shorts = new THREE.MeshStandardMaterial({ color: 0x1a2632, roughness: 0.6, metalness: 0.04 })

    const addMesh = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], scale: [number, number, number] = [1, 1, 1]) => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...position)
      mesh.scale.set(...scale)
      mesh.castShadow = true
      mesh.receiveShadow = true
      person.add(mesh)
      return mesh
    }

    addMesh(new THREE.SphereGeometry(0.25, 32, 24), skin, [0, 1.63 * heightScale, 0], [1, 1.08, 0.98])
    addMesh(new THREE.CylinderGeometry(0.09, 0.105, 0.22, 24), skin, [0, 1.35 * heightScale, 0])
    addMesh(new THREE.CylinderGeometry(shoulder, waist, torsoH, 32), shirt, [0, 0.72 * heightScale, 0], [1, 1, 0.52])
    addMesh(new THREE.SphereGeometry(hip, 32, 18), shorts, [0, 0.05 * heightScale, 0], [1, 0.56, 0.63])

    const legX = hip * 0.45
    addMesh(new THREE.CylinderGeometry(limb * 0.92, limb * 0.74, legH, 24), skin, [-legX, -0.85 * heightScale, 0])
    addMesh(new THREE.CylinderGeometry(limb * 0.92, limb * 0.74, legH, 24), skin, [legX, -0.85 * heightScale, 0])
    addMesh(new THREE.BoxGeometry(0.28, 0.12, 0.55), shorts, [-legX, -1.57 * heightScale, 0.10], [1, 1, 1])
    addMesh(new THREE.BoxGeometry(0.28, 0.12, 0.55), shorts, [legX, -1.57 * heightScale, 0.10], [1, 1, 1])

    const armX = shoulder + 0.10
    const armGeo = new THREE.CylinderGeometry(limb * 0.78, limb * 0.62, armH, 22)
    const leftArm = addMesh(armGeo, skin, [-armX, 0.73 * heightScale, 0])
    leftArm.rotation.z = -0.12
    const rightArm = addMesh(armGeo.clone(), skin, [armX, 0.73 * heightScale, 0])
    rightArm.rotation.z = 0.12

    if (input.face) {
      new THREE.TextureLoader().load(input.face, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        const faceMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.38), faceMat)
        face.position.set(0, 1.64 * heightScale, 0.235)
        person.add(face)
      })
    }

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(280, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let raf = 0
    const tick = () => {
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return
        obj.geometry.dispose()
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach((material) => {
          const map = (material as THREE.MeshBasicMaterial).map
          if (map) map.dispose()
          material.dispose()
        })
      })
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
    }
  }, [input])

  return (
    <section className="overflow-hidden rounded-[26px] border border-white/10 bg-[#071018] text-white shadow-2xl">
      <div ref={mountRef} className="h-[360px] w-full sm:h-[430px]" aria-label="Personalized 3D body character" />
      <div className="border-t border-white/10 p-3">
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-white/75">
          <span className="rounded-full bg-white/10 px-2 py-1">{Math.round(input.heightCm)} cm</span>
          <span className="rounded-full bg-white/10 px-2 py-1">{Math.round(input.weightKg)} kg</span>
          <span className="rounded-full bg-white/10 px-2 py-1">BMI {input.bmi.toFixed(1)}</span>
          {input.bodyType && <span className="rounded-full bg-brand/20 px-2 py-1 text-emerald-200">{input.bodyType}</span>}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-white/55">
          Personal character: body proportions are estimated from the measurements you entered and saved body-shape analysis. Your profile photo can be used as a face texture. This is a stylized parametric character, not a medical body scan or photogrammetric reconstruction.
        </p>
      </div>
    </section>
  )
}

export default PersonalBodyAvatar3D
