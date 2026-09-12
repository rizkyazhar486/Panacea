import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { BERKAS_KERANGKA, kelompokDariNama } from '../../lib/anatomy/rangkaKerangka'

// Kerangka yang bisa ditunjuk, bukan gambar kerangka.
//
// DUA HAL YANG WAJIB, keduanya gagal tanpa galat apa pun:
//
//   1. skeletal.glb memakai EXT_meshopt_compression. Tanpa
//      loader.setMeshoptDecoder(MeshoptDecoder), GLTFLoader menolak berkasnya
//      dan yang tersisa hanyalah kanvas kosong yang terlihat baik-baik saja.
//
//   2. GLTFLoader membersihkan nama node — titik pemisah dibuang, sehingga
//      "Femur.l" dan "Femur.r" tiba di scene dengan nama yang SAMA. Nama asli
//      dipulihkan lewat gltf.parser.associations, seperti Body3D dan
//      WilayahAbdomen3D. Mencocokkan nama scene akan menyalakan sisi yang salah
//      tanpa satu pun uji gagal.

export interface Kerangka3DProps {
  terpilih: string | null
  onPilih: (id: string | null) => void
  tinggi?: number
}

function warnaLinear(hex: string): THREE.Color {
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

const DIAM = warnaLinear('#cfd6de')
const PILIH = warnaLinear('#00BF63')

export function Kerangka3D({ terpilih, onPilih, tinggi = 340 }: Kerangka3DProps) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const [muat, setMuat] = useState(true)
  const [gagal, setGagal] = useState('')
  const terapkanRef = useRef<((id: string | null) => void) | null>(null)
  const onPilihRef = useRef(onPilih)
  onPilihRef.current = onPilih

  useEffect(() => {
    const wadah = wadahRef.current
    if (!wadah) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100)
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
    renderer.domElement.dataset.kerangka3d = 'true'
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const kunciCahaya = new THREE.DirectionalLight(0xffffff, 1.05)
    kunciCahaya.position.set(1, 2, 4)
    scene.add(kunciCahaya)
    const isiCahaya = new THREE.DirectionalLight(0xffffff, 0.45)
    isiCahaya.position.set(-2, -1, -3)
    scene.add(isiCahaya)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true

    const ukur = () => {
      const w = wadah.clientWidth
      const h = wadah.clientHeight
      if (w < 2 || h < 2) return
      const kecil = window.matchMedia('(max-width: 640px)').matches
      const dpr = body3dPixelRatio(w, h, window.devicePixelRatio || 1, kecil)
      if (Math.abs(renderer.getPixelRatio() - dpr) > 0.01) renderer.setPixelRatio(dpr)
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(wadah)

    const bahanPerKelompok = new Map<string, THREE.MeshStandardMaterial[]>()
    const kelompokMesh = new Map<THREE.Mesh, string>()
    const dapatDipilih: THREE.Mesh[] = []
    let grup: THREE.Group | null = null

    const loader = new GLTFLoader()
    // Tanpa baris ini berkasnya ditolak dan kanvasnya kosong, tanpa galat.
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      `${import.meta.env.BASE_URL}${BERKAS_KERANGKA}`,
      (gltf) => {
        grup = gltf.scene

        // Nama ASLI dipulihkan dari JSON berkasnya lewat associations.
        const nodesJson = gltf.parser.json.nodes as Array<{ name?: string }> | undefined
        const namaAsli = new Map<THREE.Object3D, string>()
        grup.traverse((o) => {
          const assoc = gltf.parser.associations.get(o) as { nodes?: number } | undefined
          const idx = assoc?.nodes
          const nama = idx !== undefined ? nodesJson?.[idx]?.name : undefined
          if (nama) namaAsli.set(o, nama)
        })

        // Tiga tulang tengkorak adalah node PIVOT bernama yang geometrinya ada
        // di anak TANPA nama. Karena itu nama dicari menaik sampai ketemu.
        const namaUntuk = (o: THREE.Object3D): string | null => {
          let n: THREE.Object3D | null = o
          let langkah = 0
          while (n && langkah < 8) {
            const nama = namaAsli.get(n)
            if (nama) return nama
            n = n.parent
            langkah++
          }
          return null
        }

        grup.updateMatrixWorld(true)
        const kotak = new THREE.Box3()

        grup.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return
          const m = o as THREE.Mesh
          const nama = namaUntuk(m)
          const id = nama ? kelompokDariNama(nama) : null
          if (!id) {
            // Node hiasan berkas ini ("HOW TO ...") bukan tulang.
            m.visible = false
            return
          }
          const bahanAsli = m.material
          if (Array.isArray(bahanAsli)) return
          const bahan = (bahanAsli as THREE.MeshStandardMaterial).clone()
          bahan.transparent = true
          bahan.opacity = 1
          bahan.color = DIAM.clone()
          bahan.emissive = new THREE.Color(0, 0, 0)
          m.material = bahan
          const daftar = bahanPerKelompok.get(id) ?? []
          daftar.push(bahan)
          bahanPerKelompok.set(id, daftar)
          kelompokMesh.set(m, id)
          dapatDipilih.push(m)
          kotak.expandByObject(m)
        })

        if (!kotak.isEmpty()) {
          const pusat = kotak.getCenter(new THREE.Vector3())
          const ukuran = kotak.getSize(new THREE.Vector3()).length()
          grup.position.sub(pusat)
          // Dilihat dari DEPAN: kanan pasien di kiri layar.
          camera.position.set(0, 0, ukuran * 0.62)
          camera.near = ukuran / 500
          camera.far = ukuran * 10
          camera.updateProjectionMatrix()
          controls.target.set(0, 0, 0)
        }
        scene.add(grup)
        renderer.domElement.dataset.kerangkaTerikat = String(bahanPerKelompok.size)
        renderer.domElement.dataset.kerangkaMesh = String(dapatDipilih.length)
        setMuat(false)
        terapkanRef.current?.(terpilih)
      },
      undefined,
      () => {
        setGagal('Could not load the skeleton model.')
        setMuat(false)
      },
    )

    terapkanRef.current = (id) => {
      const adaPilihan = Boolean(id && bahanPerKelompok.has(id))
      for (const [kid, daftar] of bahanPerKelompok) {
        const aktif = kid === id
        for (const bahan of daftar) {
          bahan.color.copy(aktif ? PILIH : DIAM)
          bahan.emissive.setRGB(0, aktif ? 0.14 : 0, aktif ? 0.06 : 0)
          bahan.opacity = adaPilihan ? (aktif ? 1 : 0.18) : 1
        }
      }
      renderer.domElement.dataset.kerangkaTerpilih = id ?? ''
    }

    const ray = new THREE.Raycaster()
    const titik = new THREE.Vector2()
    const klik = (ev: PointerEvent) => {
      const kotakLayar = renderer.domElement.getBoundingClientRect()
      titik.x = ((ev.clientX - kotakLayar.left) / kotakLayar.width) * 2 - 1
      titik.y = -((ev.clientY - kotakLayar.top) / kotakLayar.height) * 2 + 1
      ray.setFromCamera(titik, camera)
      // Tulang yang sedang diredupkan tetap bisa ditunjuk; yang dipakai adalah
      // yang paling dekat, bukan yang paling pekat.
      const kena = ray.intersectObjects(dapatDipilih, false)[0]
      const id = kena ? kelompokMesh.get(kena.object as THREE.Mesh) ?? null : null
      if (id) onPilihRef.current(id)
    }
    renderer.domElement.addEventListener('pointerdown', klik)

    let raf = 0
    const gambar = () => {
      raf = requestAnimationFrame(gambar)
      controls.update()
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(gambar)

    return () => {
      cancelAnimationFrame(raf)
      terapkanRef.current = null
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', klik)
      controls.dispose()
      for (const daftar of bahanPerKelompok.values()) for (const b of daftar) b.dispose()
      grup?.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) m.geometry.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
    // Sengaja dijalankan sekali: pilihan diterapkan lewat terapkanRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    terapkanRef.current?.(terpilih)
  }, [terpilih])

  return (
    <div>
      <div
        ref={wadahRef}
        style={{ height: tinggi }}
        className="relative w-full overflow-hidden rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]">
        {muat && !gagal && (
          <p className="absolute inset-0 grid place-items-center text-[12px] text-neutral-500">
            Loading the skeleton…
          </p>
        )}
        {gagal && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-[12px] text-neutral-500">
            {gagal} The list below still names every bone group.
          </p>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
        Drag to turn the skeleton, pinch to zoom, and tap a bone to select its group. The view faces the
        front of the body, so the person's right side is on your left. Every group can also be chosen from
        the list below.
      </p>
    </div>
  )
}
