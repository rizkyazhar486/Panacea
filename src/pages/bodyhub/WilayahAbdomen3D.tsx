import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import {
  BERKAS_PERMUKAAN, WILAYAH_ABDOMEN, wilayahDariMesh,
} from '../../lib/anatomy/wilayahAbdomen'

// Sembilan wilayah abdomen pada tubuh yang sebenarnya.
//
// "Hipokondrium kanan" adalah bahasa kerja klinis, dan sampai sekarang aplikasi
// ini hanya memuatnya sebagai teks. Wilayahnya ada sebagai mesh, jadi ia bisa
// disentuh alih-alih dihafal dari gambar buku.

export interface WilayahAbdomen3DProps {
  terpilih: string | null
  onPilih: (id: string | null) => void
  tinggi?: number
}

function warnaLinear(hex: string): THREE.Color {
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

const DIAM = warnaLinear('#9fb0c2')
const PILIH = warnaLinear('#00BF63')

export function WilayahAbdomen3D({ terpilih, onPilih, tinggi = 300 }: WilayahAbdomen3DProps) {
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
    renderer.domElement.dataset.wilayah3d = 'true'
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.95))
    const kunciCahaya = new THREE.DirectionalLight(0xffffff, 1.0)
    kunciCahaya.position.set(0, 2, 5)
    scene.add(kunciCahaya)

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

    const bahanPerWilayah = new Map<string, THREE.MeshStandardMaterial[]>()
    const wilayahMesh = new Map<THREE.Mesh, string>()
    const dapatDipilih: THREE.Mesh[] = []
    let grup: THREE.Group | null = null

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      `${import.meta.env.BASE_URL}${BERKAS_PERMUKAAN}`,
      (gltf) => {
        grup = gltf.scene

        // Nama ASLI dipulihkan lewat parser.associations, seperti Body3D.
        //
        // GLTFLoader membuang titik pemisah, sehingga "Hypochondriac region.l"
        // dan "...r" tiba di scene dengan nama yang sama. Sisi tidak bisa
        // dipulihkan dari nama itu -- tetapi berkasnya masih menyimpannya, dan
        // associations adalah jalan kembali ke sana. Posisi X dipakai hanya
        // sebagai pemeriksaan silang di bawah, bukan sebagai sumber sisi.
        const nodesJson = gltf.parser.json.nodes as Array<{ name?: string }> | undefined
        const namaAsli = new Map<THREE.Object3D, string>()
        grup.traverse((o) => {
          const assoc = gltf.parser.associations.get(o) as { nodes?: number } | undefined
          const idx = assoc?.nodes
          const nama = idx !== undefined ? nodesJson?.[idx]?.name : undefined
          if (nama) namaAsli.set(o, nama)
        })
        // Sisi dibaca dari matriks dunia, jadi matriksnya harus sudah benar --
        // dan harus dibaca SEBELUM adegan digeser ke pusat di bawah.
        grup.updateMatrixWorld(true)
        const kotak = new THREE.Box3()

        grup.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return
          const m = o as THREE.Mesh
          const asli = namaAsli.get(m) ?? namaAsli.get(m.parent as THREE.Object3D) ?? m.name
          const posisi = m.getWorldPosition(new THREE.Vector3())
          const id = wilayahDariMesh(asli, posisi.x)
          if (!id) {
            m.visible = false
            return
          }
          const bahanAsli = m.material
          if (Array.isArray(bahanAsli)) return
          const bahan = (bahanAsli as THREE.MeshStandardMaterial).clone()
          bahan.transparent = true
          bahan.opacity = 0.92
          bahan.color = DIAM.clone()
          bahan.emissive = new THREE.Color(0, 0, 0)
          m.material = bahan
          const daftar = bahanPerWilayah.get(id) ?? []
          daftar.push(bahan)
          bahanPerWilayah.set(id, daftar)
          wilayahMesh.set(m, id)
          dapatDipilih.push(m)
          kotak.expandByObject(m)
        })

        if (!kotak.isEmpty()) {
          const pusat = kotak.getCenter(new THREE.Vector3())
          const ukuran = kotak.getSize(new THREE.Vector3()).length()
          grup.position.sub(pusat)
          // Dilihat dari DEPAN: kanan pasien berada di kiri layar, sama seperti
          // saat berdiri di hadapan seseorang. Memutarnya akan membalik sisi
          // tanpa satu pun uji gagal.
          camera.position.set(0, 0, ukuran * 1.35)
          camera.near = ukuran / 500
          camera.far = ukuran * 10
          camera.updateProjectionMatrix()
          controls.target.set(0, 0, 0)
        }
        scene.add(grup)
        renderer.domElement.dataset.wilayahTampil = String(bahanPerWilayah.size)
        setMuat(false)
        terapkanRef.current?.(terpilih)
      },
      undefined,
      () => {
        setGagal('Could not load the surface model.')
        setMuat(false)
      },
    )

    terapkanRef.current = (id) => {
      for (const [wid, daftar] of bahanPerWilayah) {
        const aktif = wid === id
        for (const bahan of daftar) {
          bahan.color.copy(aktif ? PILIH : DIAM)
          bahan.emissive.setRGB(0, aktif ? 0.12 : 0, aktif ? 0.05 : 0)
          bahan.opacity = aktif ? 1 : 0.55
        }
      }
      renderer.domElement.dataset.wilayahTerpilih = id ?? ''
    }

    const ray = new THREE.Raycaster()
    const titik = new THREE.Vector2()
    const klik = (ev: PointerEvent) => {
      const kotakLayar = renderer.domElement.getBoundingClientRect()
      titik.x = ((ev.clientX - kotakLayar.left) / kotakLayar.width) * 2 - 1
      titik.y = -((ev.clientY - kotakLayar.top) / kotakLayar.height) * 2 + 1
      ray.setFromCamera(titik, camera)
      const kena = ray.intersectObjects(dapatDipilih, false)[0]
      const id = kena ? wilayahMesh.get(kena.object as THREE.Mesh) ?? null : null
      onPilihRef.current(id)
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
      renderer.domElement.removeEventListener('pointerdown', klik)
      ro.disconnect()
      controls.dispose()
      if (grup) scene.remove(grup)
      renderer.dispose()
      renderer.domElement.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    terapkanRef.current?.(terpilih)
  }, [terpilih])

  return (
    <div>
      <div ref={wadahRef} style={{ height: tinggi }}
        className="relative w-full overflow-hidden rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]">
        {muat && !gagal && (
          <p className="absolute inset-0 grid place-items-center text-[12px] text-neutral-500">
            Loading the body surface…
          </p>
        )}
        {gagal && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-[12px] text-neutral-500">
            {gagal} The grid below still names every region.
          </p>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
        Tap a region on the body, or use the grid below. The view faces the front of the body, so the
        patient's right is on your left — the same way round as standing in front of someone.
      </p>

      {/* Kisi adalah jalur yang setara, bukan pelengkap: 3D tidak bisa dipakai
          dengan papan tombol, dan wilayah yang hanya bisa dipilih dengan
          menunjuk berarti wilayah yang tidak bisa dipilih sebagian orang. */}
      <div role="group" aria-label="Abdominal regions" className="mt-2 grid grid-cols-3 gap-1.5">
        {WILAYAH_ABDOMEN.map((w) => (
          <button key={w.id} type="button" aria-pressed={terpilih === w.id}
            onClick={() => onPilih(terpilih === w.id ? null : w.id)}
            className={`rounded-xl px-2 py-2 text-[10.5px] font-bold leading-tight transition ${
              terpilih === w.id
                ? 'bg-[#00BF63] text-white'
                : 'bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] text-ink dark:text-white'
            }`}>
            {w.label}
          </button>
        ))}
      </div>
    </div>
  )
}
