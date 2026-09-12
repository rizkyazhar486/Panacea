import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { muatAtlas, namaAtlas } from '../../lib/anatomy/pemuatAtlas'
import {
  BERKAS_SARAF, MESH_LINTASAN, ikatanUntuk, kunciNama, meshSorot,
} from '../../lib/anatomy/tingkatLesiMesh'
import { NAMA_TINGKAT, type Sisi, type TingkatLesi } from '../../lib/lokalisasiLesi'

// Tempat lesi yang DITUNJUKKAN pada model saraf.
//
// Panel lokalisasi menyimpulkan tingkat dan sisi dengan benar lalu menuliskan
// "Left medulla". Kalimat itu tidak memperlihatkan bahwa piramis kiri berada
// tepat di tempat lintasan motorik menyilang, dan penyilangan itulah seluruh
// isi penalarannya.
//
// Yang tidak dilakukan komponen ini: menyorot struktur terdekat ketika
// geometri tingkat itu tidak ada. Menyalakan sesuatu yang keliru pada model
// anatomi terlihat persis seperti berhasil.

export interface LesiNeuro3DProps {
  tingkat: TingkatLesi | null
  sisi: Sisi | null
  tinggi?: number
}

function warnaLinear(hex: string): THREE.Color {
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

const WARNA_LESI = warnaLinear('#ff2d2d')
const WARNA_LINTASAN = warnaLinear('#00BF63')

export function LesiNeuro3D({ tingkat, sisi, tinggi = 280 }: LesiNeuro3DProps) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const [muat, setMuat] = useState(true)
  const [gagal, setGagal] = useState('')
  const [jumlahSorot, setJumlahSorot] = useState<number | null>(null)
  const terapkanRef = useRef<((t: TingkatLesi | null, s: Sisi | null) => void) | null>(null)

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
    renderer.domElement.dataset.lesi3d = 'true'
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

    // Semua mesh yang boleh tampil: lintasan sebagai konteks, ditambah setiap
    // struktur yang bisa menjadi tempat lesi pada tingkat mana pun.
    const kunciLintasan = new Set(MESH_LINTASAN.map(kunciNama))
    const kunciTempat = new Set<string>()
    for (const t of Object.keys(NAMA_TINGKAT) as TingkatLesi[]) {
      for (const s of ['kiri', 'kanan'] as Sisi[]) {
        for (const nama of meshSorot(t, s)) kunciTempat.add(kunciNama(nama))
      }
    }

    let seluruhAdegan = false
    const perKunci = new Map<string, THREE.MeshStandardMaterial[]>()
    const meshPerKunci = new Map<string, THREE.Mesh[]>()
    const dasar = new Map<THREE.MeshStandardMaterial, THREE.Color>()
    let grup: THREE.Group | null = null

    // Dekoder meshopt, pemulihan nama asli dan penolakan yang terlihat ditangani
    // `muatAtlas`; lihat komentarnya untuk kegagalan sunyi yang pernah terjadi.
    muatAtlas(BERKAS_SARAF.replace(/^anatomy\//, ''))
      .then(({ scene: dimuat, namaAsli }) => {
        grup = dimuat
        const kotak = new THREE.Box3()

        grup.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return
          const m = o as THREE.Mesh
          const k = kunciNama(namaAtlas(namaAsli, m))
          const lintasan = kunciLintasan.has(k)
          if (!lintasan && !kunciTempat.has(k)) {
            m.visible = false
            return
          }
          const bahanAsli = m.material
          if (Array.isArray(bahanAsli)) return
          const bahan = (bahanAsli as THREE.MeshStandardMaterial).clone()
          bahan.transparent = true
          bahan.opacity = lintasan ? 0.55 : 0.9
          bahan.color = (lintasan ? WARNA_LINTASAN : warnaLinear('#8fa3b8')).clone()
          bahan.emissive = new THREE.Color(0, 0, 0)
          m.material = bahan
          dasar.set(bahan, bahan.color.clone())
          const daftar = perKunci.get(k) ?? []
          daftar.push(bahan)
          perKunci.set(k, daftar)
          const daftarMesh = meshPerKunci.get(k) ?? []
          daftarMesh.push(m)
          meshPerKunci.set(k, daftarMesh)
          kotak.expandByObject(m)
        })

        if (!kotak.isEmpty()) {
          // Seluruh adegan dipusatkan sekali; pembingkaian per struktur
          // dikerjakan `bingkai` di bawah.
          const pusat = kotak.getCenter(new THREE.Vector3())
          grup.position.sub(pusat)
          const ukuran = kotak.getSize(new THREE.Vector3()).length()
          camera.near = ukuran / 500
          camera.far = ukuran * 10
          camera.updateProjectionMatrix()
        }
        seluruhAdegan = true
        scene.add(grup)
        renderer.domElement.dataset.strukturTampil = String(perKunci.size)
        setMuat(false)
        terapkanRef.current?.(tingkat, sisi)
      })
      .catch(() => {
        setGagal('Could not load the nervous-system model.')
        setMuat(false)
      })

    /**
     * Bingkai kamera pada sekumpulan mesh.
     *
     * Tanpa ini gambarnya tidak berguna: medula spinalis dikirim sebagai batang
     * panjang yang memenuhi seluruh kotak pembatas, sehingga piramis medula dan
     * gyrus presentralis menjadi titik di tepi layar. Menyalakan struktur yang
     * benar tetapi membingkainya sampai tak terlihat sama saja dengan tidak
     * menunjukkannya.
     */
    const bingkai = (mesh: THREE.Mesh[]) => {
      const kotak = new THREE.Box3()
      for (const m of mesh) kotak.expandByObject(m)
      if (kotak.isEmpty()) return
      const pusat = kotak.getCenter(new THREE.Vector3())
      const ukuran = Math.max(kotak.getSize(new THREE.Vector3()).length(), 1e-4)
      const arah = camera.position.clone().sub(controls.target).normalize()
      if (arah.lengthSq() < 1e-6) arah.set(0, 0, 1)
      controls.target.copy(pusat)
      camera.position.copy(pusat).add(arah.multiplyScalar(ukuran * 1.9))
      camera.updateProjectionMatrix()
      controls.update()
    }

    // Menyorot dipisahkan dari memuat supaya mengganti temuan tidak pernah
    // mengunduh ulang berkas 3D.
    terapkanRef.current = (t, s) => {
      for (const [, daftar] of perKunci) {
        for (const bahan of daftar) {
          const asal = dasar.get(bahan)
          if (asal) bahan.color.copy(asal)
          bahan.emissive.setRGB(0, 0, 0)
        }
      }
      const nama = t && s ? meshSorot(t, s) : []
      let disorot = 0
      for (const n of nama) {
        const daftar = perKunci.get(kunciNama(n))
        if (!daftar) continue
        for (const bahan of daftar) {
          bahan.color.copy(WARNA_LESI)
          bahan.emissive.setRGB(0.18, 0, 0)
          // Substansi putih medula spinalis MEMBUNGKUS traktus yang digambar
          // hijau di dalamnya. Menyorotnya pekat akan menutupi lintasan yang
          // justru sedang dijelaskan, jadi yang besar dibiarkan tembus.
          bahan.opacity = kunciNama(n) === kunciNama('White matter of spinal cord') ? 0.35 : 1
        }
        disorot += 1
      }
      renderer.domElement.dataset.mesSorot = String(disorot)
      setJumlahSorot(t && s ? disorot : null)

      if (!seluruhAdegan) return
      const sorotMesh = nama.flatMap((n) => meshPerKunci.get(kunciNama(n)) ?? [])
      if (sorotMesh.length > 0) {
        bingkai(sorotMesh)
        renderer.domElement.dataset.dibingkai = 'sorotan'
      } else {
        bingkai([...meshPerKunci.values()].flat())
        renderer.domElement.dataset.dibingkai = 'adegan'
      }
    }

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
      controls.dispose()
      if (grup) scene.remove(grup)
      renderer.dispose()
      renderer.domElement.remove()
    }
    // Sengaja sekali jalan: perubahan tingkat/sisi ditangani efek di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    terapkanRef.current?.(tingkat, sisi)
  }, [tingkat, sisi])

  const ikatan = tingkat ? ikatanUntuk(tingkat) : undefined
  const takTergambar = Boolean(tingkat && sisi && jumlahSorot === 0)

  return (
    <div>
      <div ref={wadahRef} style={{ height: tinggi }}
        className="relative w-full overflow-hidden rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]">
        {muat && !gagal && (
          <p className="absolute inset-0 grid place-items-center text-[12px] text-neutral-500">
            Loading the nervous-system model…
          </p>
        )}
        {gagal && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-[12px] text-neutral-500">
            {gagal} The reasoning below does not depend on it.
          </p>
        )}
      </div>

      {takTergambar && ikatan?.keterangan && (
        <p role="status" className="mt-2 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
          {NAMA_TINGKAT[ikatan.tingkat]} is not highlighted. {ikatan.keterangan}
        </p>
      )}
      {!takTergambar && ikatan?.cakupan === 'tanpa-sisi' && ikatan.keterangan && (
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{ikatan.keterangan}</p>
      )}
      {!tingkat && (
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          Green shows the three long pathways. Add findings below and the site they point to is
          highlighted here, where the model carries it.
        </p>
      )}
    </div>
  )
}
