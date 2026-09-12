import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { BERKAS_KELENJAR, petaMeshKeStruktur, STRUKTUR_KELENJAR } from '../../lib/anatomy/kelenjarSaluran'

// Penampil dua berkas sekaligus.
//
// Hipotalamus hanya dikirim nervous.glb, sisanya oleh visceral.glb. Kedua berkas
// berasal dari atlas yang sama dan berbagi koordinat dunia, jadi keduanya bisa
// ditaruh dalam satu scene tanpa penyesuaian. Yang TIDAK boleh dilakukan adalah
// memusatkan kamera sebelum kedua berkas tiba: kotak batasnya akan dihitung dari
// separuh isi dan struktur dari berkas kedua akan berada di luar layar tanpa
// satu pun galat.

export interface KelenjarSaluran3DProps {
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

export function KelenjarSaluran3D({ terpilih, onPilih, tinggi = 320 }: KelenjarSaluran3DProps) {
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
    renderer.domElement.dataset.kelenjar3d = 'true'
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.95))
    const kunciCahaya = new THREE.DirectionalLight(0xffffff, 1.0)
    kunciCahaya.position.set(0, 2, 5)
    scene.add(kunciCahaya)
    const isiCahaya = new THREE.DirectionalLight(0xffffff, 0.4)
    isiCahaya.position.set(0, -2, -4)
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

    const bahanPerStruktur = new Map<string, THREE.MeshStandardMaterial[]>()
    const strukturMesh = new Map<THREE.Mesh, string>()
    const dapatDipilih: THREE.Mesh[] = []
    const grup: THREE.Group[] = []
    const peta = petaMeshKeStruktur()
    const kotak = new THREE.Box3()
    let dibatalkan = false

    // Ketujuh GLB atlas ini dimampatkan meshopt. TANPA dekodernya GLTFLoader
    // MENOLAK berkasnya dan kanvasnya kosong begitu saja, tanpa galat.
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)

    interface Atlas {
      scene: THREE.Group
      parser: {
        json: { nodes?: Array<{ name?: string }> }
        associations: Map<THREE.Object3D, unknown>
      }
    }

    /**
     * Nama ASLI tiap objek, dipulihkan lewat parser.associations.
     *
     * GLTFLoader menyanitasi nama simpul dan aturannya berbeda antar versi
     * three: titik pemisah dibuang, sehingga "Kidney.l" dan "Kidney.r" tiba di
     * scene dengan nama yang SAMA, dibedakan hanya oleh akhiran angka yang
     * urutannya tidak dijamin apa pun. Mencocokkan nama scene akan menukar kiri
     * dan kanan tanpa satu pun galat.
     */
    const namaAsliDari = (gltf: Atlas) => {
      const nodesJson = gltf.parser.json.nodes
      const peta = new Map<THREE.Object3D, string>()
      gltf.scene.traverse((o) => {
        const assoc = gltf.parser.associations.get(o) as { nodes?: number } | undefined
        const idx = assoc?.nodes
        const nama = idx !== undefined ? nodesJson?.[idx]?.name : undefined
        if (nama) peta.set(o, nama)
      })
      return peta
    }

    const pasang = (gltf: Atlas) => {
      const akar = gltf.scene
      const namaAsli = namaAsliDari(gltf)
      akar.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh) return
        const m = o as THREE.Mesh
        // Sebagian simpul bernama menggantung geometrinya pada anak TANPA nama
        // ("Kidney.r", "Thyroid gland", "Urinary bladder", "Pancreas", kedua
        // lobus hipofisis). Karena itu namanya dicari pada objeknya dulu, lalu
        // pada induknya -- dan berhenti pada yang PERTAMA ditemukan, supaya
        // "Pancreatic duct" tidak ikut terbaca sebagai "Pancreas".
        const nama = namaAsli.get(m) ?? (m.parent ? namaAsli.get(m.parent) : undefined)
        const id = nama ? peta.get(nama) : undefined
        if (!id) {
          m.visible = false
          return
        }
        const bahanAsli = m.material
        if (Array.isArray(bahanAsli)) return
        const bahan = (bahanAsli as THREE.MeshStandardMaterial).clone()
        bahan.transparent = true
        bahan.opacity = 0.9
        bahan.color = DIAM.clone()
        bahan.emissive = new THREE.Color(0, 0, 0)
        m.material = bahan
        const daftar = bahanPerStruktur.get(id) ?? []
        daftar.push(bahan)
        bahanPerStruktur.set(id, daftar)
        strukturMesh.set(m, id)
        dapatDipilih.push(m)
        kotak.expandByObject(m)
      })
      grup.push(akar)
      scene.add(akar)
    }

    const rampung = () => {
      // Kamera BARU dipasang setelah KEDUA berkas tiba. Memusatkan lebih awal
      // akan memakai kotak batas separuh isi dan membuang struktur berkas kedua
      // ke luar layar tanpa satu pun galat.
      if (!kotak.isEmpty()) {
        const pusat = kotak.getCenter(new THREE.Vector3())
        const ukuran = kotak.getSize(new THREE.Vector3()).length()
        for (const g of grup) g.position.sub(pusat)
        camera.position.set(0, 0, ukuran * 1.3)
        camera.near = ukuran / 500
        camera.far = ukuran * 10
        camera.updateProjectionMatrix()
        controls.target.set(0, 0, 0)
      }
      renderer.domElement.dataset.kelenjarTampil = String(bahanPerStruktur.size)
      renderer.domElement.dataset.kelenjarDiharapkan = String(STRUKTUR_KELENJAR.length)
      setMuat(false)
      terapkanRef.current?.(terpilih)
    }

    // Satu berkas gagal harus TERLIHAT, bukan menghasilkan separuh gambar yang
    // tampak benar. Keduanya dimuat berdampingan lalu dipasang dalam urutan
    // TETAP: urutan kedatangan jaringan tidak boleh menentukan isi scene.
    const muatSatu = (berkas: string) => new Promise<Atlas>((selesai, tolak) => {
      loader.load(
        `${import.meta.env.BASE_URL}${berkas}`,
        (gltf) => selesai(gltf as unknown as Atlas),
        undefined,
        (e) => tolak(e instanceof Error ? e : new Error(`Gagal memuat ${berkas}`)),
      )
    })

    Promise.all(BERKAS_KELENJAR.map(muatSatu))
      .then((hasil) => {
        if (dibatalkan) return
        for (const a of hasil) pasang(a)
        rampung()
      })
      .catch(() => {
        if (dibatalkan) return
        setGagal('Could not load the anatomy model.')
        setMuat(false)
      })

    terapkanRef.current = (id) => {
      for (const [sid, daftar] of bahanPerStruktur) {
        const aktif = sid === id
        for (const bahan of daftar) {
          bahan.color.copy(aktif ? PILIH : DIAM)
          bahan.emissive.setRGB(0, aktif ? 0.14 : 0, aktif ? 0.06 : 0)
          bahan.opacity = aktif ? 1 : id ? 0.32 : 0.62
        }
      }
      renderer.domElement.dataset.kelenjarTerpilih = id ?? ''
    }

    const ray = new THREE.Raycaster()
    const titik = new THREE.Vector2()
    const klik = (ev: PointerEvent) => {
      const kotakLayar = renderer.domElement.getBoundingClientRect()
      titik.x = ((ev.clientX - kotakLayar.left) / kotakLayar.width) * 2 - 1
      titik.y = -((ev.clientY - kotakLayar.top) / kotakLayar.height) * 2 + 1
      ray.setFromCamera(titik, camera)
      const kena = ray.intersectObjects(dapatDipilih, false)[0]
      const id = kena ? strukturMesh.get(kena.object as THREE.Mesh) ?? null : null
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
      dibatalkan = true
      cancelAnimationFrame(raf)
      terapkanRef.current = null
      renderer.domElement.removeEventListener('pointerdown', klik)
      ro.disconnect()
      controls.dispose()
      for (const g of grup) scene.remove(g)
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
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-[12px] text-neutral-500">
            Loading the glands and the urinary tract…
          </p>
        )}
        {gagal && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-[12px] text-neutral-500">
            {gagal} The list below still names every structure.
          </p>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
        Tap a structure on the model, or use the list below. The view faces the front of the body, so the
        person's right is on your left.
      </p>
    </div>
  )
}
