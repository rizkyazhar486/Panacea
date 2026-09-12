import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { BERKAS_LIMFOID, MESH_BUKAN_ANATOMI, stasiunDariMeshAsli } from '../../lib/anatomy/stasiunLimfe'

// Sistem limfoid sebagai benda yang bisa ditunjuk.
//
// EMPAT hal di sini bukan gaya, melainkan syarat supaya gambarnya tidak kosong
// atau tidak menyala di tempat yang keliru. Masing-masing pernah gagal, dan
// tidak satu pun melempar galat:
//
//   1. setMeshoptDecoder. lymphoid.glb memakai EXT_meshopt_compression;
//      tanpa dekodernya GLTFLoader MENOLAK berkasnya dan kanvas tinggal kosong.
//   2. Nama ASLI dipulihkan lewat gltf.parser.associations. Nama scene sudah
//      kehilangan titik pemisah, sehingga "Occipital nodes.l" dan "...r" tiba
//      dengan nama yang sama dan akhiran angka yang urutannya tidak dijamin.
//   3. Bahan DIKLON per objek. Berkas ini memakai ulang satu mesh dan satu
//      bahan untuk kiri dan kanan sekaligus untuk stasiun yang sama sekali
//      berbeda; mewarnai bahan bersama akan menyalakan setengah tubuh.
//   4. Satu nodus limfe seukuran kacang pada tubuh setinggi 1,4 unit tidak
//      terlihat dari jarak seluruh badan. Kamera karena itu mendekat ke kotak
//      batas stasiun yang dipilih, dan mundur lagi saat pilihan dilepas.

export interface Limfe3DProps {
  terpilih: string | null
  onPilih: (id: string | null) => void
  tinggi?: number
}

function warnaLinear(hex: string): THREE.Color {
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

const DIAM = warnaLinear('#8fa3b8')
const PILIH = warnaLinear('#00BF63')

export function Limfe3D({ terpilih, onPilih, tinggi = 340 }: Limfe3DProps) {
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
    renderer.domElement.dataset.limfe3d = 'true'
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const cahaya = new THREE.DirectionalLight(0xffffff, 1.05)
    cahaya.position.set(0.5, 2, 5)
    scene.add(cahaya)
    const isi = new THREE.DirectionalLight(0xffffff, 0.35)
    isi.position.set(-2, -1, -3)
    scene.add(isi)

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

    const bahanPerStasiun = new Map<string, THREE.MeshStandardMaterial[]>()
    const kotakPerStasiun = new Map<string, THREE.Box3>()
    const stasiunMesh = new Map<THREE.Mesh, string>()
    const dapatDipilih: THREE.Mesh[] = []
    const bahanLain: THREE.MeshStandardMaterial[] = []
    let grup: THREE.Group | null = null
    let kotakSeluruh = new THREE.Box3()

    const loader = new GLTFLoader()
    // Tanpa baris ini berkasnya ditolak mentah-mentah dan tidak ada yang tampil.
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      `${import.meta.env.BASE_URL}${BERKAS_LIMFOID}`,
      (gltf) => {
        grup = gltf.scene

        // Nama ASLI, satu-satunya identitas yang boleh dipakai mencocokkan.
        const simpulJson = gltf.parser.json.nodes as Array<{ name?: string }> | undefined
        const namaAsli = new Map<THREE.Object3D, string>()
        grup.traverse((o) => {
          const assoc = gltf.parser.associations.get(o) as { nodes?: number } | undefined
          const idx = assoc?.nodes
          const nama = idx !== undefined ? simpulJson?.[idx]?.name : undefined
          if (nama) namaAsli.set(o, nama)
        })
        grup.updateMatrixWorld(true)

        const abai = new Set<string>(MESH_BUKAN_ANATOMI)
        grup.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return
          const m = o as THREE.Mesh
          const asli = namaAsli.get(m) ?? namaAsli.get(m.parent as THREE.Object3D) ?? m.name
          if (abai.has(asli)) {
            // "HOW TO ..." adalah teks petunjuk berkas sumber, bukan anatomi.
            m.visible = false
            return
          }
          const bahanAsli = m.material
          if (Array.isArray(bahanAsli)) return
          const bahan = (bahanAsli as THREE.MeshStandardMaterial).clone()
          bahan.transparent = true
          bahan.color = DIAM.clone()
          bahan.emissive = new THREE.Color(0, 0, 0)
          bahan.opacity = 0.5
          m.material = bahan

          const id = stasiunDariMeshAsli(asli)
          kotakSeluruh.expandByObject(m)
          if (!id) {
            // Geometri tak bernama di berkas ini tetap digambar sebagai konteks,
            // tetapi tidak pernah diklaim sebagai stasiun bernama.
            bahanLain.push(bahan)
            return
          }
          const daftar = bahanPerStasiun.get(id) ?? []
          daftar.push(bahan)
          bahanPerStasiun.set(id, daftar)
          const kotak = kotakPerStasiun.get(id) ?? new THREE.Box3()
          kotak.expandByObject(m)
          kotakPerStasiun.set(id, kotak)
          stasiunMesh.set(m, id)
          dapatDipilih.push(m)
        })

        if (!kotakSeluruh.isEmpty()) {
          const pusat = kotakSeluruh.getCenter(new THREE.Vector3())
          grup.position.sub(pusat)
          grup.updateMatrixWorld(true)
          // Kotak batas dihitung ulang setelah adegan digeser, supaya
          // pembingkaian stasiun memakai koordinat yang sama dengan kamera.
          kotakSeluruh = new THREE.Box3().setFromObject(grup)
          for (const [id, kotak] of kotakPerStasiun) {
            kotak.translate(new THREE.Vector3(-pusat.x, -pusat.y, -pusat.z))
            kotakPerStasiun.set(id, kotak)
          }
        }
        scene.add(grup)
        renderer.domElement.dataset.limfeStasiun = String(bahanPerStasiun.size)
        renderer.domElement.dataset.limfeMesh = String(stasiunMesh.size)
        setMuat(false)
        terapkanRef.current?.(terpilih)
      },
      undefined,
      () => {
        setGagal('Could not load the lymphoid model.')
        setMuat(false)
      },
    )

    // Pembingkaian kamera: tujuan diperbarui, animasi di bawah yang menuju ke sana.
    const tujuanPosisi = new THREE.Vector3()
    const tujuanTarget = new THREE.Vector3()
    let punyaTujuan = false

    const bingkaiSeluruh = () => {
      if (kotakSeluruh.isEmpty()) return
      const ukuran = kotakSeluruh.getSize(new THREE.Vector3()).length()
      tujuanTarget.copy(kotakSeluruh.getCenter(new THREE.Vector3()))
      tujuanPosisi.set(0, tujuanTarget.y, ukuran * 0.72)
      camera.near = Math.max(ukuran / 2000, 0.001)
      camera.far = ukuran * 12
      camera.updateProjectionMatrix()
      punyaTujuan = true
    }

    const bingkaiStasiun = (id: string) => {
      const kotak = kotakPerStasiun.get(id)
      if (!kotak || kotak.isEmpty()) return bingkaiSeluruh()
      const pusat = kotak.getCenter(new THREE.Vector3())
      const rentang = Math.max(kotak.getSize(new THREE.Vector3()).length(), 0.02)
      tujuanTarget.copy(pusat)
      tujuanPosisi.set(pusat.x * 0.3, pusat.y, pusat.z + rentang * 2.6)
      punyaTujuan = true
    }

    terapkanRef.current = (id) => {
      for (const [sid, daftar] of bahanPerStasiun) {
        const aktif = sid === id
        for (const bahan of daftar) {
          bahan.color.copy(aktif ? PILIH : DIAM)
          bahan.emissive.setRGB(0, aktif ? 0.14 : 0, aktif ? 0.06 : 0)
          bahan.opacity = aktif ? 1 : id ? 0.16 : 0.5
        }
      }
      for (const bahan of bahanLain) bahan.opacity = id ? 0.1 : 0.35
      renderer.domElement.dataset.limfeTerpilih = id ?? ''
      if (id) bingkaiStasiun(id)
      else bingkaiSeluruh()
    }

    const ray = new THREE.Raycaster()
    const titik = new THREE.Vector2()
    let turun: { x: number; y: number } | null = null
    const mulai = (ev: PointerEvent) => { turun = { x: ev.clientX, y: ev.clientY } }
    const selesai = (ev: PointerEvent) => {
      // Memutar model tidak boleh diperlakukan sebagai memilih.
      if (!turun) return
      const geser = Math.hypot(ev.clientX - turun.x, ev.clientY - turun.y)
      turun = null
      if (geser > 8) return
      const kotakLayar = renderer.domElement.getBoundingClientRect()
      titik.x = ((ev.clientX - kotakLayar.left) / kotakLayar.width) * 2 - 1
      titik.y = -((ev.clientY - kotakLayar.top) / kotakLayar.height) * 2 + 1
      ray.setFromCamera(titik, camera)
      const kena = ray.intersectObjects(dapatDipilih, false)[0]
      const id = kena ? stasiunMesh.get(kena.object as THREE.Mesh) ?? null : null
      if (id) onPilihRef.current(id)
    }
    renderer.domElement.addEventListener('pointerdown', mulai)
    renderer.domElement.addEventListener('pointerup', selesai)

    let raf = 0
    const gambar = () => {
      raf = requestAnimationFrame(gambar)
      if (punyaTujuan) {
        camera.position.lerp(tujuanPosisi, 0.12)
        controls.target.lerp(tujuanTarget, 0.12)
        if (camera.position.distanceTo(tujuanPosisi) < 0.0005) punyaTujuan = false
      }
      controls.update()
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(gambar)

    return () => {
      cancelAnimationFrame(raf)
      terapkanRef.current = null
      renderer.domElement.removeEventListener('pointerdown', mulai)
      renderer.domElement.removeEventListener('pointerup', selesai)
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
    <div ref={wadahRef} style={{ height: tinggi }}
      className="relative w-full overflow-hidden rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]">
      {muat && !gagal && (
        <p className="absolute inset-0 grid place-items-center text-[12px] text-neutral-500">
          Loading the lymphoid system…
        </p>
      )}
      {gagal && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-[12px] text-neutral-500">
          {gagal} The list below still names every station and what it drains.
        </p>
      )}
    </div>
  )
}
