import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { BERKAS_BRONKUS, kunciNama, petaMeshKeSegmen } from '../../lib/anatomy/bronkusSegmental'
import {
  SEGMEN_VENTILASI, mulaiVentilasi, langkahVentilasi, type KeadaanVentilasi,
} from '../../lib/ventilasiSegmental'

// Ventilasi segmental yang DIRENDER, bukan ditabelkan.
//
// Panel sebelumnya menghitung tetapan waktu ke-18 segmen dengan benar dan
// menampilkannya sebagai delapan belas baris angka. Angka tidak
// memperlihatkan bahwa satu segmen tertinggal sementara tetangganya sudah
// penuh; warna pada bronkusnya sendiri memperlihatkannya seketika.
//
// Yang diwarnai adalah bronkus segmental, karena itulah geometri yang
// benar-benar dikirim visceral.glb -- dan sekaligus tempat resistensi 1/r^4
// sesungguhnya berada. `bronkus-segmental-3d.mts` menjaga setiap nama mesh di
// sini benar-benar ada dan membawa geometri.

export interface VentilasiBronkus3DProps {
  /** id segmen -> pecahan jari-jari yang hilang. */
  penyempitan: Record<string, number>
  /** Panjang satu inspirasi dalam satuan waktu model. */
  durasiNapas?: number
  tinggi?: number
}

function warnaLinear(hex: string): THREE.Color {
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

const KOSONG = warnaLinear('#3b4a5a')
const PENUH = warnaLinear('#00BF63')

export function VentilasiBronkus3D({
  penyempitan,
  durasiNapas = 6,
  tinggi = 280,
}: VentilasiBronkus3DProps) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const [muat, setMuat] = useState(true)
  const [gagal, setGagal] = useState('')
  const [tertinggal, setTertinggal] = useState<string[]>([])

  // Penyempitan dibaca lewat ref supaya menggeser slider tidak memuat ulang GLB.
  const penyempitanRef = useRef(penyempitan)
  penyempitanRef.current = penyempitan
  const durasiRef = useRef(durasiNapas)
  durasiRef.current = durasiNapas

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
    renderer.domElement.dataset.ventilasi3d = 'true'
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const kunci = new THREE.DirectionalLight(0xffffff, 1.1)
    kunci.position.set(2, 3, 4)
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

    const peta = petaMeshKeSegmen()
    const perSegmen = new Map<string, THREE.MeshStandardMaterial[]>()
    let grup: THREE.Group | null = null
    let keadaan: KeadaanVentilasi = mulaiVentilasi(SEGMEN_VENTILASI)

    // visceral.glb dikirim terkompresi meshopt. Tanpa dekodernya GLTFLoader
    // menolak berkasnya sama sekali -- dan kegagalannya tidak muncul sebagai
    // pengecualian di konsol, hanya sebagai paru yang tidak pernah berwarna.
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      `${import.meta.env.BASE_URL}${BERKAS_BRONKUS}`,
      (gltf) => {
        grup = gltf.scene
        const kotak = new THREE.Box3()

        grup.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return
          const m = o as THREE.Mesh
          const idSegmen = peta.get(kunciNama(m.name))
          if (!idSegmen) {
            // Sisa rongga dada disembunyikan, bukan dihapus: menghapusnya akan
            // membuat berkas yang sama tidak bisa dipakai ulang di tempat lain.
            m.visible = false
            return
          }
          const bahan = (m.material as THREE.MeshStandardMaterial).clone()
          bahan.color = KOSONG.clone()
          bahan.emissive = new THREE.Color(0, 0, 0)
          m.material = bahan
          const daftar = perSegmen.get(idSegmen) ?? []
          daftar.push(bahan)
          perSegmen.set(idSegmen, daftar)
          kotak.expandByObject(m)
        })

        // Segmen yang tidak menemukan satu pun mesh dikatakan, bukan didiamkan.
        // Viewer 3D gagal dengan sunyi, dan sunyi adalah cara gambar berbohong.
        setTertinggal(SEGMEN_VENTILASI.filter((s) => !perSegmen.has(s.id)).map((s) => s.label))

        if (!kotak.isEmpty()) {
          const pusat = kotak.getCenter(new THREE.Vector3())
          const ukuran = kotak.getSize(new THREE.Vector3()).length()
          grup.position.sub(pusat)
          camera.position.set(0, 0, ukuran * 1.35)
          camera.near = ukuran / 100
          camera.far = ukuran * 10
          camera.updateProjectionMatrix()
          controls.target.set(0, 0, 0)
        }
        scene.add(grup)
        renderer.domElement.dataset.segmenTerikat = String(perSegmen.size)
        setMuat(false)
      },
      undefined,
      () => {
        setGagal('Could not load the airway model.')
        setMuat(false)
      },
    )

    let raf = 0
    let sebelumnya = performance.now()
    const warna = new THREE.Color()

    const gambar = (sekarang: number) => {
      raf = requestAnimationFrame(gambar)
      const dt = Math.min((sekarang - sebelumnya) / 1000, 0.05)
      sebelumnya = sekarang

      // Satu siklus: inspirasi mengisi, lalu dikosongkan dan diulang. Yang
      // ingin diperlihatkan adalah URUTAN pengisiannya, bukan ekspirasinya.
      if (keadaan.waktu >= durasiRef.current) keadaan = mulaiVentilasi(SEGMEN_VENTILASI)
      keadaan = langkahVentilasi(keadaan, SEGMEN_VENTILASI, dt, penyempitanRef.current)

      for (const [id, bahanDaftar] of perSegmen) {
        const isi = Math.min(Math.max(keadaan.isi[id] ?? 0, 0), 1)
        warna.copy(KOSONG).lerp(PENUH, isi)
        for (const bahan of bahanDaftar) {
          bahan.color.copy(warna)
          bahan.emissive.setRGB(0, isi * 0.1, isi * 0.05)
        }
      }

      controls.update()
      renderer.render(scene, camera)

      // Pengisian rata-rata dipaparkan ke DOM supaya pemeriksaan browser bisa
      // membuktikan warnanya benar-benar bergerak. readPixels tidak bisa
      // dipakai di sini: buffer gambar tidak dipertahankan antar frame.
      if (perSegmen.size > 0) {
        let jumlah = 0
        for (const id of perSegmen.keys()) jumlah += keadaan.isi[id] ?? 0
        renderer.domElement.dataset.isiRerata = (jumlah / perSegmen.size).toFixed(3)
      }
    }
    raf = requestAnimationFrame(gambar)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      if (grup) scene.remove(grup)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div>
      <div ref={wadahRef} style={{ height: tinggi }}
        className="relative w-full overflow-hidden rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]">
        {muat && !gagal && (
          <p className="absolute inset-0 grid place-items-center text-[12px] text-neutral-500">
            Loading the segmental airway…
          </p>
        )}
        {gagal && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-[12px] text-neutral-500">
            {gagal} The segment table below still runs the same model without it.
          </p>
        )}
      </div>
      {tertinggal.length > 0 && (
        <p role="status" className="mt-2 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
          {tertinggal.length} segment{tertinggal.length > 1 ? 's are' : ' is'} not drawn because the
          model file carries no bronchus for {tertinggal.length > 1 ? 'them' : 'it'}: {tertinggal.join(', ')}.
          The table below still includes {tertinggal.length > 1 ? 'them' : 'it'}.
        </p>
      )}
    </div>
  )
}
