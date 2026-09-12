import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { bangunLintasan, kecepatanAliran, titikPada, type FlowPath, type Vec3 } from '../lib/cardioFlow'
import { body3dPixelRatio } from '../lib/body3dQuality'

export interface PartMeta {
  name: string
  kind: string
  group?: string
}

export interface AtlasViewerProps {
  berkas: string
  bagian: PartMeta[]
  lesi?: string[]
  hilir?: string[]
  jalur?: FlowPath | null
  hr?: number
  wilayah?: string | null
  tinggi?: number
  onPilih?: (nama: string | null) => void
  dipilih?: string | null
}

/** Nama ini harus mengikuti sanitizer yang dipakai GLTFLoader/PropertyBinding. */
function namaBersih(s: string): string {
  return s.replace(/\s/g, '_').replace(/[^\w-]/g, '')
}

function warnaLinear(hex: string): THREE.Color {
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

const WARNA_LESI = warnaLinear('#ff2d2d')
const WARNA_HILIR = warnaLinear('#ff7a00')
const JUMLAH_PARTIKEL = 90

export function AtlasViewer3D({
  berkas,
  bagian,
  lesi = [],
  hilir = [],
  jalur = null,
  hr = 72,
  wilayah = null,
  tinggi = 300,
  onPilih,
  dipilih = null,
}: AtlasViewerProps) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const [muat, setMuat] = useState(true)
  const [pct, setPct] = useState(0)
  const [gagal, setGagal] = useState('')
  const [sentuh, setSentuh] = useState<string | null>(null)

  // Props dinamis dibaca melalui ref agar mengganti penyakit/flow tidak memuat ulang GLB.
  const propRef = useRef({ lesi, hilir, jalur, hr, wilayah, dipilih })
  propRef.current = { lesi, hilir, jalur, hr, wilayah, dipilih }
  const bagianRef = useRef(bagian)
  bagianRef.current = bagian
  const onPilihRef = useRef(onPilih)
  onPilihRef.current = onPilih

  useEffect(() => {
    const wadah = wadahRef.current
    if (!wadah) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setGagal('This device could not start 3D graphics (WebGL).')
      setMuat(false)
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.dataset.atlasViewer3d = 'true'
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.85))
    const kunci = new THREE.DirectionalLight(0xffffff, 1.1)
    kunci.position.set(2, 3, 4)
    scene.add(kunci)
    const tepi = new THREE.DirectionalLight(0xffffff, 0.35)
    tepi.position.set(-3, 1, -3)
    scene.add(tepi)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    camera.position.set(0, 0.15, 3.4)

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
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(wadah)

    const meshes: THREE.Mesh[] = []
    const warnaAsli = new Map<THREE.Mesh, THREE.Color>()
    const wilayahMesh = new Map<THREE.Mesh, string>()
    const jenisMesh = new Map<THREE.Mesh, string>()
    let grup: THREE.Group | null = null

    const geoPartikel = new THREE.SphereGeometry(1, 8, 6)
    const matPartikel = new THREE.MeshBasicMaterial({
      color: warnaLinear('#ff6b6b'),
      transparent: true,
      opacity: 0.95,
    })
    const partikel = new THREE.InstancedMesh(geoPartikel, matPartikel, JUMLAH_PARTIKEL)
    partikel.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    partikel.frustumCulled = false
    partikel.visible = false
    scene.add(partikel)
    const matriks = new THREE.Matrix4()

    const garis = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.25 }),
    )
    garis.visible = false
    scene.add(garis)

    let lintasan: Vec3[] = []
    let idJalur = ''

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      `${import.meta.env.BASE_URL}${berkas}`,
      (gltf) => {
        grup = gltf.scene

        // Satu nama sanitized hanya boleh menunjuk ke satu metadata atlas.
        // Bila generator suatu hari menghasilkan collision, mesh tersebut tidak
        // diberi nama tebakan dan tidak ikut ray-picking sampai metadata diperbaiki.
        const asliPerBersih = new Map<string, PartMeta>()
        const ambigu = new Set<string>()
        for (const p of bagianRef.current) {
          const k = namaBersih(p.name)
          const ada = asliPerBersih.get(k)
          if (ada && ada.name !== p.name) ambigu.add(k)
          else asliPerBersih.set(k, p)
        }

        grup.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return
          const m = o as THREE.Mesh
          const clean = namaBersih(m.name)
          const part = ambigu.has(clean) ? undefined : (asliPerBersih.get(m.name) ?? asliPerBersih.get(clean))
          if (part) m.name = part.name

          const bahanAsli = m.material as THREE.Material | THREE.Material[]
          if (Array.isArray(bahanAsli)) {
            // Atlas generator saat ini menghasilkan satu material per mesh.
            // Bila format berubah, jangan menyamarkan ketidakcocokan itu.
            console.warn(`Multi-material mesh on ${berkas} is not supported for precise atlas highlighting: ${m.name}`)
            return
          }
          const bahan = (bahanAsli as THREE.MeshStandardMaterial).clone()
          bahan.transparent = true
          m.material = bahan
          warnaAsli.set(m, bahan.color.clone())
          wilayahMesh.set(m, part?.group ?? '')
          jenisMesh.set(m, part?.kind ?? '')
          meshes.push(m)
        })

        const takDikenal = meshes.filter((m) => !jenisMesh.get(m)).length
        if (ambigu.size) console.warn(`${ambigu.size} ambiguous sanitized atlas names in ${berkas}`)
        if (takDikenal) console.warn(`${takDikenal} mesh pada ${berkas} tidak dikenali namanya`)
        scene.add(grup)
        setMuat(false)
      },
      (ev) => {
        if (ev.total > 0) setPct(ev.loaded / ev.total)
      },
      () => {
        setGagal('Could not load this anatomical model.')
        setMuat(false)
      },
    )

    const ray = new THREE.Raycaster()
    const titik = new THREE.Vector2()
    function padaKlik(ev: PointerEvent) {
      if (!grup) return
      const r = renderer.domElement.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) return
      titik.x = ((ev.clientX - r.left) / r.width) * 2 - 1
      titik.y = -((ev.clientY - r.top) / r.height) * 2 + 1
      ray.setFromCamera(titik, camera)
      // Hanya mesh dengan metadata terverifikasi yang boleh menghasilkan label.
      const kena = ray.intersectObjects(meshes.filter((m) => m.visible && Boolean(jenisMesh.get(m))), false)
      const nama = kena[0]?.object.name ?? null
      setSentuh(nama)
      onPilihRef.current?.(nama)
    }
    renderer.domElement.addEventListener('pointerup', padaKlik)

    const kotak = new THREE.Box3()
    const pusatTujuan = new THREE.Vector3()
    let jarakTujuan = 3.4
    let adaTujuan = false

    function bingkaiKe(pilih: (m: THREE.Mesh) => boolean, sisa = 2.4) {
      kotak.makeEmpty()
      let ada = false
      for (const m of meshes) {
        if (!m.visible || !pilih(m)) continue
        kotak.expandByObject(m)
        ada = true
      }
      if (!ada) return
      kotak.getCenter(pusatTujuan)
      const ukuran = kotak.getSize(new THREE.Vector3())
      const besar = Math.max(ukuran.x, ukuran.y, ukuran.z, 0.05)
      const fov = (camera.fov * Math.PI) / 180
      jarakTujuan = (besar / 2 / Math.tan(fov / 2)) * sisa
      adaTujuan = true
    }

    const jam = new THREE.Clock()
    let t = 0
    let raf = 0
    let kunciBingkai = ''
    let inViewport = true
    let documentVisible = !document.hidden
    const v = new THREE.Vector3()

    function stopRendering() {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    function startRendering() {
      if (raf || !inViewport || !documentVisible) return
      raf = requestAnimationFrame(bingkai)
    }

    function bingkai() {
      raf = 0
      if (!inViewport || !documentVisible) return

      const dt = Math.min(jam.getDelta(), 0.1)
      const { lesi: L, hilir: H, jalur: J, hr: HR, wilayah: W, dipilih: D } = propRef.current
      const detik = jam.getElapsedTime()

      const setLesi = new Set(L.map((s) => s.toLowerCase()))
      const setHilir = new Set(H.map((s) => s.toLowerCase()))
      const adaSorot = setLesi.size > 0 || setHilir.size > 0
      const denyut = 0.55 + 0.45 * Math.sin(detik * 6.0)
      const setJalur = new Set((J?.urutan ?? []).map((n) => n.toLowerCase()))

      const kunciBaru = `${[...setLesi].sort().join('|')}::${[...setHilir].sort().join('|')}::${W ?? ''}::${J?.id ?? ''}`
      if (meshes.length && kunciBaru !== kunciBingkai) {
        kunciBingkai = kunciBaru
        if (adaSorot) bingkaiKe((m) => setLesi.has(m.name.toLowerCase()) || setHilir.has(m.name.toLowerCase()), 2.1)
        else if (W || J) {
          const perhatian = new Set([...setJalur])
          bingkaiKe((m) => (W ? wilayahMesh.get(m) === W : false) || perhatian.has(m.name.toLowerCase()), 1.9)
        } else {
          bingkaiKe(() => true, 1.45)
        }
      }

      for (const m of meshes) {
        const nama = m.name.toLowerCase()
        const bahan = m.material as THREE.MeshStandardMaterial
        const cocokWilayah = !W || wilayahMesh.get(m) === W || setJalur.has(nama)
        m.visible = cocokWilayah
        if (!cocokWilayah) continue

        const asli = warnaAsli.get(m)!
        if (setLesi.has(nama)) {
          bahan.color.copy(WARNA_LESI)
          bahan.metalness = 0
          bahan.roughness = 1
          bahan.emissive.copy(WARNA_LESI).multiplyScalar(denyut * 0.7)
          bahan.opacity = 1
        } else if (setHilir.has(nama)) {
          bahan.color.copy(WARNA_HILIR)
          bahan.metalness = 0
          bahan.roughness = 1
          bahan.emissive.copy(WARNA_HILIR).multiplyScalar(0.6)
          bahan.opacity = 1
        } else {
          bahan.color.copy(asli)
          bahan.emissive.setRGB(0, 0, 0)
          const rongga = jenisMesh.get(m) === 'chamber'
          bahan.opacity = adaSorot ? (rongga ? 0.10 : 0.16) : (rongga ? 0.34 : 0.92)
        }
        bahan.depthWrite = bahan.opacity >= 0.99
        m.renderOrder = setLesi.has(nama) || setHilir.has(nama) ? 2 : 0

        if (D && nama === D.toLowerCase()) {
          bahan.emissive.setRGB(0.25, 0.25, 0.25)
          bahan.opacity = 1
        }
      }

      if (J && J.id !== idJalur) {
        idJalur = J.id
        lintasan = bangunLintasan(J.urutan)
        t = 0
        if (lintasan.length >= 2) {
          garis.geometry.dispose()
          garis.geometry = new THREE.BufferGeometry().setFromPoints(
            lintasan.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
          )
          garis.visible = true
        }
        matPartikel.color.copy(warnaLinear(
          J.oxygen === 'oxygenated' ? '#ff5a5a' : J.oxygen === 'portal' ? '#a389e8' : '#5aa2ff',
        ))
      }
      if (!J) {
        idJalur = ''
        garis.visible = false
        partikel.visible = false
      }

      if (J && lintasan.length >= 2) {
        partikel.visible = true
        t = (t + dt * (1 / 6) * kecepatanAliran(detik, HR, J.pulsatile)) % 1
        const jarakKamera = camera.position.distanceTo(controls.target)
        const jari = Math.min(0.02, Math.max(0.004, jarakKamera * 0.008))
        for (let i = 0; i < JUMLAH_PARTIKEL; i++) {
          const ti = (t + i / JUMLAH_PARTIKEL) % 1
          const p = titikPada(lintasan, ti)
          matriks.makeScale(jari, jari, jari)
          matriks.setPosition(p[0], p[1], p[2])
          partikel.setMatrixAt(i, matriks)
        }
        partikel.instanceMatrix.needsUpdate = true
      }

      if (adaTujuan) {
        controls.target.lerp(pusatTujuan, 1 - Math.pow(0.001, dt))
        v.copy(camera.position).sub(controls.target)
        const jarakKini = v.length() || 1
        const jarakBaru = jarakKini + (jarakTujuan - jarakKini) * (1 - Math.pow(0.001, dt))
        camera.position.copy(controls.target).add(v.multiplyScalar(jarakBaru / jarakKini))
        if (Math.abs(jarakBaru - jarakTujuan) < 0.01 && controls.target.distanceTo(pusatTujuan) < 0.01) adaTujuan = false
      }

      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(bingkai)
    }

    const onHilang = (e: Event) => {
      e.preventDefault()
      stopRendering()
      setGagal('The browser dropped the 3D context, usually because memory ran low.')
    }
    const onPulih = () => {
      setGagal('')
      ukur()
      startRendering()
    }
    renderer.domElement.addEventListener('webglcontextlost', onHilang)
    renderer.domElement.addEventListener('webglcontextrestored', onPulih)

    const io = new IntersectionObserver(
      ([entry]) => {
        inViewport = Boolean(entry?.isIntersecting)
        if (inViewport) startRendering()
        else stopRendering()
      },
      { rootMargin: '128px' },
    )
    io.observe(wadah)

    const onVisibility = () => {
      documentVisible = !document.hidden
      if (documentVisible) startRendering()
      else stopRendering()
    }
    document.addEventListener('visibilitychange', onVisibility)

    startRendering()

    return () => {
      stopRendering()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.domElement.removeEventListener('pointerup', padaKlik)
      renderer.domElement.removeEventListener('webglcontextlost', onHilang)
      renderer.domElement.removeEventListener('webglcontextrestored', onPulih)
      controls.dispose()

      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        m.geometry.dispose()
        const b = m.material as THREE.Material | THREE.Material[]
        if (Array.isArray(b)) b.forEach((x) => x.dispose())
        else b.dispose()
      })
      garis.geometry.dispose()
      ;(garis.material as THREE.Material).dispose()
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [berkas])

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-50 dark:bg-white/5">
      <div ref={wadahRef} style={{ height: tinggi }} className="w-full" />
      {muat && !gagal && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs font-semibold text-neutral-500">
            Loading anatomy… {pct > 0 ? `${Math.round(pct * 100)}%` : ''}
          </p>
        </div>
      )}
      {gagal && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-center text-xs font-semibold text-neutral-500">{gagal}</p>
        </div>
      )}
      {!muat && !gagal && (
        <p className="px-3 pb-2 text-center text-[10.5px] text-neutral-400">
          {sentuh ? sentuh : 'Drag to rotate · tap any verified structure to identify it'}
        </p>
      )}
    </div>
  )
}

export default AtlasViewer3D
