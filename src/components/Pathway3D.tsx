import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { hitungJalur, type Jalur, type KeadaanJalur } from '../lib/pathway'

// ─────────────────────────────────────────────────────────────────────────────
// JALUR SINYAL DALAM TIGA DIMENSI.
//
// Yang ditampilkan bukan gambar jalur yang digambar sekali lalu diberi warna:
// tinggi dan warna tiap simpul DIHITUNG dari model di pathway.ts setiap kali
// mutasi atau obat diubah. Jadi saat penghambat MEK diberikan pada sel bermutasi
// KRAS, yang turun di layar adalah hasil perhitungan, bukan animasi yang
// disiapkan sebelumnya.
//
// Labelnya digambar sebagai HTML di atas kanvas, bukan sebagai objek 3D: teks
// tetap tajam, terbaca pembaca layar, dan tidak ikut membesar saat diperbesar.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  jalur: Jalur
  keadaan: KeadaanJalur
  tinggi?: number
  onPilih?: (simpulId: string | null) => void
}

function warnaLinear(hex: string): THREE.Color {
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

/** Biru tenang -> kuning -> merah menyala, mengikuti keaktifan 0..1. */
function warnaAktivasi(v: number): THREE.Color {
  const dingin = warnaLinear('#3f6fb5')
  const sedang = warnaLinear('#e0a020')
  const panas = warnaLinear('#e8342a')
  return v < 0.5
    ? dingin.clone().lerp(sedang, v / 0.5)
    : sedang.clone().lerp(panas, (v - 0.5) / 0.5)
}

export function Pathway3D({ jalur, keadaan, tinggi = 300, onPilih }: Props) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const [layar, setLayar] = useState<Record<string, { x: number; y: number; v: number }>>({})
  const [gagal, setGagal] = useState('')
  const ref = useRef({ jalur, keadaan })
  ref.current = { jalur, keadaan }
  const onPilihRef = useRef(onPilih)
  onPilihRef.current = onPilih

  useEffect(() => {
    const wadah = wadahRef.current
    if (!wadah) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setGagal('This device could not start 3D graphics (WebGL).')
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const cahaya = new THREE.DirectionalLight(0xffffff, 1)
    cahaya.position.set(3, 5, 6)
    scene.add(cahaya)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true

    const ukur = () => {
      const w = wadah.clientWidth, h = wadah.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(wadah)

    // ── Tata letak: satu simpul per lapisan, menurun seperti kaskade ─────────
    const grup = new THREE.Group()
    scene.add(grup)
    const bola = new Map<string, THREE.Mesh>()
    const posisi = new Map<string, THREE.Vector3>()
    let idJalur = ''

    function bangun(j: Jalur) {
      grup.clear()
      bola.clear()
      posisi.clear()
      const perLapisan = new Map<number, number>()
      for (const s of j.simpul) perLapisan.set(s.lapisan, (perLapisan.get(s.lapisan) ?? 0) + 1)
      const dipakai = new Map<number, number>()
      const maksLapisan = Math.max(...j.simpul.map((s) => s.lapisan))
      for (const s of j.simpul) {
        const n = perLapisan.get(s.lapisan) ?? 1
        const k = dipakai.get(s.lapisan) ?? 0
        dipakai.set(s.lapisan, k + 1)
        const x = n === 1 ? 0 : (k - (n - 1) / 2) * 1.6
        const y = (maksLapisan / 2 - s.lapisan) * 0.85
        const p = new THREE.Vector3(x, y, 0)
        posisi.set(s.id, p)
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 24, 16),
          new THREE.MeshStandardMaterial({ color: warnaLinear('#3f6fb5'), roughness: 0.45, metalness: 0.05 }),
        )
        m.position.copy(p)
        m.name = s.id
        grup.add(m)
        bola.set(s.id, m)
      }
      // Sisi: garis lurus, dengan kerucut kecil sebagai mata panah pengaktif dan
      // palang untuk penghambat — lambang yang sama dipakai di setiap buku.
      for (const e of j.sisi) {
        const a = posisi.get(e.dari), b = posisi.get(e.ke)
        if (!a || !b) continue
        const arah = b.clone().sub(a)
        const panjang = arah.length()
        const tengah = a.clone().add(b).multiplyScalar(0.5)
        const batang = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, Math.max(0.01, panjang - 0.52), 8),
          new THREE.MeshBasicMaterial({ color: warnaLinear(e.tanda === 1 ? '#8a8f98' : '#c0554d') }),
        )
        batang.position.copy(tengah)
        batang.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arah.clone().normalize())
        grup.add(batang)
        const ujung = b.clone().sub(arah.clone().normalize().multiplyScalar(0.3))
        const tanda = e.tanda === 1
          ? new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 10),
              new THREE.MeshBasicMaterial({ color: warnaLinear('#8a8f98') }))
          : new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.08),
              new THREE.MeshBasicMaterial({ color: warnaLinear('#c0554d') }))
        tanda.position.copy(ujung)
        tanda.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arah.clone().normalize())
        grup.add(tanda)
      }
      const kotak = new THREE.Box3().setFromObject(grup)
      const ukuranK = kotak.getSize(new THREE.Vector3())
      camera.position.set(0, 0, Math.max(ukuranK.x, ukuranK.y) * 1.35 + 1.5)
      controls.target.set(0, 0, 0)
      controls.update()
    }

    const ray = new THREE.Raycaster()
    const titik = new THREE.Vector2()
    function padaKlik(ev: PointerEvent) {
      const r = renderer.domElement.getBoundingClientRect()
      titik.x = ((ev.clientX - r.left) / r.width) * 2 - 1
      titik.y = -((ev.clientY - r.top) / r.height) * 2 + 1
      ray.setFromCamera(titik, camera)
      const kena = ray.intersectObjects([...bola.values()], false)
      onPilihRef.current?.(kena[0]?.object.name ?? null)
    }
    renderer.domElement.addEventListener('pointerup', padaKlik)

    const onHilang = (e: Event) => { e.preventDefault(); setGagal('The browser dropped the 3D context.') }
    renderer.domElement.addEventListener('webglcontextlost', onHilang)

    const v = new THREE.Vector3()
    let raf = 0
    const jam = new THREE.Clock()
    function bingkai() {
      raf = requestAnimationFrame(bingkai)
      const { jalur: J, keadaan: K } = ref.current
      if (J.id !== idJalur) { idJalur = J.id; bangun(J) }

      const hasil = hitungJalur(J, K)
      const denyut = 0.5 + 0.5 * Math.sin(jam.getElapsedTime() * 5)
      const simpulMutasi = new Set(J.mutasi.filter((m) => K.mutasi.includes(m.id)).map((m) => m.simpul))
      const simpulObat = new Set(J.penghambat.filter((o) => K.obat.includes(o.id)).map((o) => o.simpul))

      const next: Record<string, { x: number; y: number; v: number }> = {}
      const w = wadah!.clientWidth, h = wadah!.clientHeight
      for (const s of J.simpul) {
        const m = bola.get(s.id)
        if (!m) continue
        const nilai = hasil.aktivasi[s.id] ?? 0
        const bahan = m.material as THREE.MeshStandardMaterial
        bahan.color.copy(warnaAktivasi(nilai))
        // Simpul yang bermutasi berdenyut; yang dihambat obat dikecilkan dan
        // diberi kilau redup — dua isyarat yang tidak bisa tertukar.
        bahan.emissive.copy(warnaAktivasi(nilai)).multiplyScalar(simpulMutasi.has(s.id) ? 0.3 + 0.4 * denyut : 0.12)
        const skala = 0.75 + nilai * 0.65
        m.scale.setScalar(simpulObat.has(s.id) ? skala * 0.6 : skala)
        v.copy(m.position)
        grup.localToWorld(v)
        v.project(camera)
        next[s.id] = { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, v: nilai }
      }
      setLayar(next)
      controls.update()
      renderer.render(scene, camera)
    }
    bingkai()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerup', padaKlik)
      renderer.domElement.removeEventListener('webglcontextlost', onHilang)
      controls.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) {
          m.geometry.dispose()
          const b = m.material as THREE.Material | THREE.Material[]
          Array.isArray(b) ? b.forEach((x) => x.dispose()) : b.dispose()
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-50 dark:bg-white/5">
      <div ref={wadahRef} style={{ height: tinggi }} className="w-full" />
      {gagal && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-center text-xs font-semibold text-neutral-500">{gagal}</p>
        </div>
      )}
      {!gagal && jalur.simpul.map((s) => {
        const l = layar[s.id]
        if (!l) return null
        return (
          <button
            key={s.id}
            onClick={() => onPilih?.(s.id)}
            style={{ left: l.x, top: l.y }}
            className="absolute -translate-y-1/2 translate-x-3 whitespace-nowrap rounded-full bg-white/85 px-1.5 py-0.5 text-[9.5px] font-bold text-ink shadow-sm dark:bg-black/70 dark:text-white"
          >
            {s.label} <span className="tabular-nums text-neutral-400">{Math.round(l.v * 100)}</span>
          </button>
        )
      })}
    </div>
  )
}

export default Pathway3D
