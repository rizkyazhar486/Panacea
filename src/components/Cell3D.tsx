import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { tempatkan, cuplikan, RADIUS_SEL, RADIUS_INTI, type Penempatan } from '../lib/cellLayout'
import { body3dPixelRatio } from '../lib/body3dQuality'

// ─────────────────────────────────────────────────────────────────────────────
// SEL DALAM TIGA DIMENSI.
//
// Ini adalah rekonstruksi edukasi berbasis SKALA REFERENSI, bukan segmentasi
// mikroskopi atau mesh pasien. Primitive dipakai untuk menjelaskan kompartemen
// dan perbandingan ukuran; karena itu bentuk primitive tidak boleh dibaca
// sebagai ultrastruktur yang presisi. Angka di cellBio.ts sendiri dinyatakan
// sebagai perkiraan diameter/panjang tipikal dalam mikrometer.
// ─────────────────────────────────────────────────────────────────────────────

export interface Cell3DProps {
  /** Organel yang sedang disorot; sisanya diredupkan. */
  disorot?: string | null
  tinggi?: number
  onPilih?: (kunci: string | null) => void
}

const WARNA: Record<string, string> = {
  membran: '#8fb8d8',
  sitosol: '#cfe3ef',
  nukleus: '#6b76c8',
  nukleolus: '#3f478f',
  mitokondria: '#d2694a',
  lisosom: '#8e5aa8',
  peroksisom: '#4f9d6b',
  rer: '#c9a24d',
  ser: '#d9c07a',
  golgi: '#4aa3a3',
  ribosom: '#6b4f3a',
  sitoskeleton: '#9aa3ad',
}

function warnaLinear(hex: string): THREE.Color {
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

/** Jumlah referensi yang disampel; bukan jumlah universal untuk setiap tipe sel. */
export const GAMBAR = {
  mitokondria: { asli: 1500, maks: 60 },
  lisosom: { asli: 300, maks: 26 },
  peroksisom: { asli: 500, maks: 22 },
  ribosom: { asli: 10000000, maks: 320 },
}

export function Cell3D({ disorot, tinggi = 340, onPilih }: Cell3DProps) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const requestRenderRef = useRef<(() => void) | null>(null)
  const [gagal, setGagal] = useState('')
  const disorotRef = useRef(disorot)
  disorotRef.current = disorot
  const onPilihRef = useRef(onPilih)
  onPilihRef.current = onPilih

  useEffect(() => {
    requestRenderRef.current?.()
  }, [disorot])

  useEffect(() => {
    const wadah = wadahRef.current
    if (!wadah) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setGagal('This device could not start 3D graphics (WebGL).')
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.localClippingEnabled = true
    renderer.domElement.dataset.cellViewer3d = 'true'
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.85))
    const kunci = new THREE.DirectionalLight(0xffffff, 1.1)
    kunci.position.set(6, 9, 12)
    scene.add(kunci)
    const isi = new THREE.DirectionalLight(0xffffff, 0.35)
    isi.position.set(-8, -4, -6)
    scene.add(isi)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    // Tidak ada animasi biologis pada rekonstruksi ini. Damping dimatikan agar
    // viewer bisa benar-benar render-on-demand, bukan membutuhkan loop 60 fps.
    controls.enableDamping = false
    controls.minDistance = 14
    controls.maxDistance = 60

    let raf = 0
    let inViewport = true
    let documentVisible = !document.hidden

    function stopRendering() {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    function renderFrame() {
      raf = 0
      if (!inViewport || !documentVisible) return
      terapkanSorot()
      controls.update()
      renderer.render(scene, camera)
    }

    function requestRender() {
      if (raf || !inViewport || !documentVisible) return
      raf = requestAnimationFrame(renderFrame)
    }
    requestRenderRef.current = requestRender
    controls.addEventListener('change', requestRender)

    const ukur = () => {
      const w = wadah.clientWidth
      const h = wadah.clientHeight
      if (w < 2 || h < 2) return
      const smallViewport = window.matchMedia('(max-width: 640px)').matches
      const dpr = body3dPixelRatio(w, h, window.devicePixelRatio || 1, smallViewport)
      if (Math.abs(renderer.getPixelRatio() - dpr) > 0.01) renderer.setPixelRatio(dpr)
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      requestRender()
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(wadah)

    // Bidang potong: separuh sel dibuang supaya kompartemen internal terlihat.
    const potong = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1.5)
    const grup = new THREE.Group()
    scene.add(grup)
    const perOrganel = new Map<string, THREE.Object3D[]>()
    const catat = (k: string, o: THREE.Object3D) => {
      o.userData.organel = k
      const d = perOrganel.get(k) ?? []
      d.push(o)
      perOrganel.set(k, d)
    }

    const bahan = (k: string, opsi: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({
        color: warnaLinear(WARNA[k] ?? '#999999'),
        roughness: 0.55,
        metalness: 0.05,
        clippingPlanes: [potong],
        ...opsi,
      })

    const membran = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS_SEL, 64, 48),
      bahan('membran', { transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
    )
    catat('membran', membran)
    grup.add(membran)

    const inti = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS_INTI, 48, 32),
      bahan('nukleus', { transparent: true, opacity: 0.85 }),
    )
    catat('nukleus', inti)
    grup.add(inti)
    const anakInti = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 16), bahan('nukleolus'))
    anakInti.position.set(0.9, 0.6, 0.4)
    catat('nukleolus', anakInti)
    grup.add(anakInti)

    // ER/Golgi di sini adalah representasi topologis: ia menunjukkan hubungan
    // kompartemen, bukan meniru ultrastruktur mikroskopi secara literal.
    for (let i = 0; i < 7; i++) {
      const r = RADIUS_INTI + 0.55 + i * 0.42
      const lembar = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.12, 8, 60, Math.PI * (0.55 + (i % 3) * 0.18)),
        bahan(i < 4 ? 'rer' : 'ser', { side: THREE.DoubleSide }),
      )
      lembar.rotation.set(Math.PI / 2 + (i % 3) * 0.35, i * 0.7, i * 0.4)
      catat(i < 4 ? 'rer' : 'ser', lembar)
      grup.add(lembar)
    }

    const golgi = new THREE.Group()
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(
        new THREE.TorusGeometry(1.5 - i * 0.13, 0.1, 8, 40, Math.PI * 0.9),
        bahan('golgi', { side: THREE.DoubleSide }),
      )
      c.position.y = i * 0.28
      c.rotation.x = Math.PI / 2
      golgi.add(c)
    }
    golgi.position.set(-4.4, -1.2, 0.5)
    golgi.rotation.z = 0.4
    catat('golgi', golgi)
    golgi.traverse((o) => { o.userData.organel = 'golgi' })
    grup.add(golgi)

    for (let i = 0; i < 14; i++) {
      const sudut = (i / 14) * Math.PI * 2
      const miring = (i % 5) * 0.3 - 0.6
      const a = new THREE.Vector3(Math.cos(sudut) * RADIUS_INTI, miring, Math.sin(sudut) * RADIUS_INTI)
      const b2 = new THREE.Vector3(
        Math.cos(sudut) * (RADIUS_SEL - 0.3),
        miring * 2.2,
        Math.sin(sudut) * (RADIUS_SEL - 0.3),
      )
      const arah = b2.clone().sub(a)
      const batang = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, arah.length(), 6),
        bahan('sitoskeleton', { transparent: true, opacity: 0.5 }),
      )
      batang.position.copy(a.clone().add(b2).multiplyScalar(0.5))
      batang.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arah.clone().normalize())
      catat('sitoskeleton', batang)
      grup.add(batang)
    }

    const letak = tempatkan([
      { kunci: 'mitokondria', jumlah: GAMBAR.mitokondria.maks, diameterUm: 1 },
      { kunci: 'lisosom', jumlah: GAMBAR.lisosom.maks, diameterUm: 0.5 },
      { kunci: 'peroksisom', jumlah: GAMBAR.peroksisom.maks, diameterUm: 0.5 },
      { kunci: 'ribosom', jumlah: GAMBAR.ribosom.maks, diameterUm: 0.05 },
    ])

    const geometri: Record<string, THREE.BufferGeometry> = {
      mitokondria: new THREE.CapsuleGeometry(0.28, 0.75, 6, 12),
      lisosom: new THREE.SphereGeometry(0.25, 16, 12),
      peroksisom: new THREE.SphereGeometry(0.25, 16, 12),
      ribosom: new THREE.SphereGeometry(0.06, 6, 5),
    }
    const perKunci = new Map<string, Penempatan[]>()
    for (const p of letak) {
      const d = perKunci.get(p.kunci) ?? []
      d.push(p)
      perKunci.set(p.kunci, d)
    }
    for (const [k, daftar] of perKunci) {
      const im = new THREE.InstancedMesh(geometri[k], bahan(k), daftar.length)
      const m = new THREE.Matrix4()
      const q = new THREE.Quaternion()
      const e = new THREE.Euler()
      daftar.forEach((p, i) => {
        e.set(p.putaran, p.putaran * 1.7, p.putaran * 0.6)
        q.setFromEuler(e)
        m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(1, 1, 1))
        im.setMatrixAt(i, m)
      })
      im.instanceMatrix.needsUpdate = true
      im.userData.organel = k
      catat(k, im)
      grup.add(im)
    }

    camera.position.set(0, 6, 30)
    controls.target.set(0, 0, 0)
    controls.update()

    function terapkanSorot() {
      const s = disorotRef.current
      for (const [k, daftar] of perOrganel) {
        for (const o of daftar) {
          o.traverse((anak) => {
            const mesh = anak as THREE.Mesh
            if (!mesh.isMesh) return
            const b = mesh.material as THREE.MeshStandardMaterial
            const redup = !!s && s !== k
            const dasar = k === 'membran' ? 0.16 : k === 'nukleus' ? 0.85 : k === 'sitoskeleton' ? 0.5 : 1
            b.opacity = redup ? Math.min(dasar, 0.12) : dasar
            b.transparent = b.opacity < 0.999
            b.depthWrite = b.opacity >= 0.999
            b.emissive.setHex(s === k ? 0x1b5e3a : 0x000000)
            b.emissiveIntensity = s === k ? 0.55 : 0
          })
        }
      }
    }

    const ray = new THREE.Raycaster()
    const titik = new THREE.Vector2()
    function klik(ev: PointerEvent) {
      const kotak = renderer.domElement.getBoundingClientRect()
      if (kotak.width < 2 || kotak.height < 2) return
      titik.x = ((ev.clientX - kotak.left) / kotak.width) * 2 - 1
      titik.y = -((ev.clientY - kotak.top) / kotak.height) * 2 + 1
      ray.setFromCamera(titik, camera)
      const kena = ray.intersectObjects(grup.children, true)
      const pertama = kena.find((k) => {
        let o: THREE.Object3D | null = k.object
        while (o && !o.userData.organel) o = o.parent
        return !!o && o.userData.organel !== 'membran'
      })
      let o: THREE.Object3D | null = pertama?.object ?? null
      while (o && !o.userData.organel) o = o.parent
      onPilihRef.current?.((o?.userData.organel as string) ?? null)
    }
    renderer.domElement.addEventListener('pointerdown', klik)

    const onHilang = (e: Event) => {
      e.preventDefault()
      stopRendering()
      setGagal('The browser dropped the 3D context, usually because memory ran low.')
    }
    const onPulih = () => {
      setGagal('')
      ukur()
      requestRender()
    }
    renderer.domElement.addEventListener('webglcontextlost', onHilang)
    renderer.domElement.addEventListener('webglcontextrestored', onPulih)

    const io = new IntersectionObserver(
      ([entry]) => {
        inViewport = Boolean(entry?.isIntersecting)
        if (inViewport) requestRender()
        else stopRendering()
      },
      { rootMargin: '128px' },
    )
    io.observe(wadah)

    const onVisibility = () => {
      documentVisible = !document.hidden
      if (documentVisible) requestRender()
      else stopRendering()
    }
    document.addEventListener('visibilitychange', onVisibility)

    requestRender()

    return () => {
      requestRenderRef.current = null
      stopRendering()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.domElement.removeEventListener('pointerdown', klik)
      renderer.domElement.removeEventListener('webglcontextlost', onHilang)
      renderer.domElement.removeEventListener('webglcontextrestored', onPulih)
      controls.removeEventListener('change', requestRender)
      controls.dispose()

      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        geometries.add(mesh.geometry)
        const m = mesh.material as THREE.Material | THREE.Material[]
        if (Array.isArray(m)) m.forEach((x) => materials.add(x))
        else materials.add(m)
      })
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative overflow-hidden rounded-xl bg-neutral-950/90">
      <div ref={wadahRef} style={{ height: tinggi }} className="w-full touch-none" />
      {gagal && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 p-4">
          <p className="text-center text-[12px] text-neutral-300">{gagal}</p>
        </div>
      )}
    </div>
  )
}

export function keteranganCuplikan(): string[] {
  return Object.entries(GAMBAR).map(([k, v]) => `${k}: ${cuplikan(v.asli, v.maks).kalimat}`)
}

export default Cell3D
