import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { ARTERI, BERKAS_ARTERI, arteriDariSimpul, namaSimpulArteri } from '../../lib/anatomy/wilayahArteri'

// Pohon arteri yang bisa ditunjuk, bukan bagan yang harus dihafal.
//
// Tiga warna membawa tiga pertanyaan sekaligus: batang yang dipilih menyala
// hijau, SELURUH keturunannya di dalam berkas menyala jingga, dan sisa pohon
// tinggal sebagai latar redup. Jadi "apa yang ada di hilir arteri ini" tidak
// perlu dijawab dengan kalimat — ia terlihat.
//
// Dua jebakan berkas atlas ini ditutup di sini, keduanya pernah menghasilkan
// kanvas kosong TANPA galat: berkasnya terkompresi meshopt, jadi tanpa
// setMeshoptDecoder GLTFLoader menolaknya bulat-bulat; dan GLTFLoader
// menyanitasi nama simpul dengan aturan yang berbeda antarversi three,
// sehingga pasangan ".l"/".r" tiba dengan nama yang sama. Nama ASLI dipulihkan
// lewat parser.associations sebelum keterangannya hilang.

export interface Arteri3DProps {
  terpilih: string | null
  onPilih: (id: string | null) => void
  /** Dipanggil dengan jumlah arteri yang benar-benar terikat ke geometri. */
  onTerikat?: (jumlah: number) => void
  tinggi?: number
}

function warnaLinear(hex: string): THREE.Color {
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

const LATAR = warnaLinear('#8f9bab')
const PILIH = warnaLinear('#00BF63')
const HILIR = warnaLinear('#F2A33C')

// Pembuluh balik, rongga jantung dan katup bukan urusan panel ini.
const BUKAN_ARTERI = /vein|venous|sinus|plexus|vena cava|valve|leaflet|atrium|ventricle|papillary|how to/i
const ARTERI_LATAR = /arter|aorta|trunk|branch|arch|arcade|anastomos/i

export function Arteri3D({ terpilih, onPilih, onTerikat, tinggi = 320 }: Arteri3DProps) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const [muat, setMuat] = useState(true)
  const [gagal, setGagal] = useState('')
  const terapkanRef = useRef<((id: string | null) => void) | null>(null)
  const onPilihRef = useRef(onPilih)
  onPilihRef.current = onPilih
  const onTerikatRef = useRef(onTerikat)
  onTerikatRef.current = onTerikat

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
    renderer.domElement.dataset.arteri3d = 'true'
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const kunci = new THREE.DirectionalLight(0xffffff, 1.05)
    kunci.position.set(1, 2, 4)
    scene.add(kunci)

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

    // Bahan per mesh, supaya menyorot satu batang tidak ikut mengubah batang
    // lain yang kebetulan berbagi geometri terinstansiasi.
    const bahanMesh = new Map<THREE.Mesh, THREE.MeshStandardMaterial>()
    const arteriMesh = new Map<THREE.Mesh, string>()
    const meshArteri = new Map<string, THREE.Mesh[]>()
    // Nama simpul yang benar-benar ketemu. Menghitung ARTERI saja tidak cukup:
    // arteri berpasangan tetap "terikat" walau satu sisinya meleset, dan sisi
    // yang hilang tidak menghasilkan galat apa pun -- hanya separuh pohon.
    const simpulKetemu = new Set<string>()
    const pivotArteri = new Map<string, THREE.Object3D[]>()
    const dapatDipilih: THREE.Mesh[] = []
    let grup: THREE.Group | null = null
    let batal = false

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      `${import.meta.env.BASE_URL}anatomy/${BERKAS_ARTERI}`,
      (gltf) => {
        if (batal) return
        const simpulJson = gltf.parser.json.nodes as Array<{ name?: string }> | undefined
        const namaAsli = new Map<THREE.Object3D, string>()
        gltf.scene.traverse((o) => {
          const assoc = gltf.parser.associations.get(o) as { nodes?: number } | undefined
          const i = assoc?.nodes
          const nama = i !== undefined ? simpulJson?.[i]?.name : undefined
          if (nama) namaAsli.set(o, nama)
        })
        grup = gltf.scene
        grup.updateMatrixWorld(true)
        const kotak = new THREE.Box3()

        grup.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return
          const m = o as THREE.Mesh
          // Mesh berisi geometri batang itu sendiri tidak bernama di dalam
          // berkas; namanya ada pada simpul pivot induknya.
          const asli = namaAsli.get(m) ?? namaAsli.get(m.parent as THREE.Object3D) ?? m.name
          if (BUKAN_ARTERI.test(asli) || !ARTERI_LATAR.test(asli)) {
            m.visible = false
            return
          }
          const bahanAsli = m.material
          if (Array.isArray(bahanAsli)) return
          const bahan = (bahanAsli as THREE.MeshStandardMaterial).clone()
          bahan.transparent = true
          bahan.color = LATAR.clone()
          bahan.emissive = new THREE.Color(0, 0, 0)
          bahan.opacity = 0.35
          m.material = bahan
          bahanMesh.set(m, bahan)
          kotak.expandByObject(m)

          const arteri = arteriDariSimpul(asli)
          if (arteri) {
            arteriMesh.set(m, arteri.id)
            const daftar = meshArteri.get(arteri.id) ?? []
            daftar.push(m)
            meshArteri.set(arteri.id, daftar)
            dapatDipilih.push(m)
            simpulKetemu.add(asli)
          }
        })

        // Pivot tiap arteri: dari sinilah keturunan (cabang distal) dibaca.
        // Keturunan datang dari POHON di dalam berkas, bukan dari daftar yang
        // ditulis tangan, sehingga tidak bisa menyimpang dari geometrinya.
        grup.traverse((o) => {
          const asli = namaAsli.get(o)
          if (!asli) return
          const arteri = arteriDariSimpul(asli)
          if (!arteri) return
          const daftar = pivotArteri.get(arteri.id) ?? []
          daftar.push(o)
          pivotArteri.set(arteri.id, daftar)
        })

        if (!kotak.isEmpty()) {
          const pusat = kotak.getCenter(new THREE.Vector3())
          const ukuran = kotak.getSize(new THREE.Vector3()).length()
          grup.position.sub(pusat)
          camera.position.set(0, 0, ukuran * 0.62)
          camera.near = ukuran / 800
          camera.far = ukuran * 10
          camera.updateProjectionMatrix()
          controls.target.set(0, 0, 0)
        }
        scene.add(grup)
        renderer.domElement.dataset.arteriTerikat = String(meshArteri.size)
        renderer.domElement.dataset.arteriKatalog = String(ARTERI.length)
        renderer.domElement.dataset.arteriSimpul = String(simpulKetemu.size)
        renderer.domElement.dataset.arteriKatalogSimpul = String(namaSimpulArteri().length)
        setMuat(false)
        onTerikatRef.current?.(meshArteri.size)
        terapkanRef.current?.(terpilih)
      },
      undefined,
      () => {
        if (batal) return
        setGagal('Could not load the cardiovascular model.')
        setMuat(false)
      },
    )

    terapkanRef.current = (id) => {
      const inti = new Set(id ? meshArteri.get(id) ?? [] : [])
      const hilir = new Set<THREE.Mesh>()
      if (id) {
        for (const pivot of pivotArteri.get(id) ?? []) {
          pivot.traverse((o) => {
            const m = o as THREE.Mesh
            if ((m as THREE.Mesh).isMesh && bahanMesh.has(m) && !inti.has(m)) hilir.add(m)
          })
        }
      }
      for (const [m, bahan] of bahanMesh) {
        if (inti.has(m)) {
          bahan.color.copy(PILIH)
          bahan.emissive.setRGB(0, 0.14, 0.06)
          bahan.opacity = 1
        } else if (hilir.has(m)) {
          bahan.color.copy(HILIR)
          bahan.emissive.setRGB(0.1, 0.05, 0)
          bahan.opacity = 0.95
        } else {
          bahan.color.copy(LATAR)
          bahan.emissive.setRGB(0, 0, 0)
          bahan.opacity = id ? 0.16 : 0.35
        }
      }
      renderer.domElement.dataset.arteriTerpilih = id ?? ''
      renderer.domElement.dataset.arteriHilir = String(hilir.size)
    }

    const ray = new THREE.Raycaster()
    const titik = new THREE.Vector2()
    const klik = (ev: PointerEvent) => {
      const kotakLayar = renderer.domElement.getBoundingClientRect()
      titik.x = ((ev.clientX - kotakLayar.left) / kotakLayar.width) * 2 - 1
      titik.y = -((ev.clientY - kotakLayar.top) / kotakLayar.height) * 2 + 1
      ray.setFromCamera(titik, camera)
      const kena = ray.intersectObjects(dapatDipilih, false)[0]
      if (!kena) return
      const id = arteriMesh.get(kena.object as THREE.Mesh) ?? null
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
      batal = true
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
            Loading the arterial tree…
          </p>
        )}
        {gagal && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-[12px] text-neutral-500">
            {gagal} The list below still names every artery, its territory and its branches.
          </p>
        )}
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500">
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-[#00BF63]" /> Selected artery
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-[#F2A33C]" /> Everything it feeds downstream
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-[#8f9bab]" /> Rest of the arterial tree
        </span>
      </p>
    </div>
  )
}
