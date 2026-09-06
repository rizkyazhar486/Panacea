import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// ─────────────────────────────────────────────────────────────────────────────
// PENAMPIL MOLEKUL — bola-dan-batang, dari koordinat 3D yang sesungguhnya.
//
// Koordinatnya bukan hiasan: konformer dihitung RDKit (ETKDG + MMFF94) dari
// SMILES tiap obat, dan hanya ditulis kalau rumus serta massa molekulnya cocok
// dengan nilai rujukan — lihat scripts/molekul.py. Jadi sudut ikatan, bentuk
// cincin, dan jarak antaratom di layar adalah hasil hitungan kimia, bukan
// susunan bola yang dibuat agar menyerupai molekul.
//
// Warna unsur memakai kesepakatan CPK, yang sama dengan yang dipakai buku ajar
// dan penampil molekul lain. Kesepakatan warna adalah bahasa; mengarang sendiri
// membuat gambarnya tidak bisa dibaca orang yang sudah tahu.
// ─────────────────────────────────────────────────────────────────────────────

interface AtomTuple extends Array<string | number> { 0: string; 1: number; 2: number; 3: number }

export interface MoleculeData {
  name: string
  formula: string
  atoms: AtomTuple[]
  /** [indeks atom a, indeks atom b, orde ikatan; 4 = aromatik] */
  bonds: [number, number, number][]
}

/** Warna CPK dan jari-jari van der Waals (Å) yang dipakai untuk skala bola. */
const UNSUR: Record<string, { warna: string; r: number }> = {
  H: { warna: '#f2f2f2', r: 1.20 },
  C: { warna: '#404040', r: 1.70 },
  N: { warna: '#2f5fd0', r: 1.55 },
  O: { warna: '#d33a2c', r: 1.52 },
  S: { warna: '#d8c33a', r: 1.80 },
  P: { warna: '#e08b3a', r: 1.80 },
  F: { warna: '#79d34a', r: 1.47 },
  Cl: { warna: '#38a83a', r: 1.75 },
  Br: { warna: '#a1522c', r: 1.85 },
  I: { warna: '#8f3fbf', r: 1.98 },
}
const LAIN = { warna: '#c07ad0', r: 1.7 }

function warnaLinear(hex: string): THREE.Color {
  // Sama seperti di AtlasViewer3D: nilai ditulis dalam ruang linear supaya
  // warnanya tampil sebagaimana ditulis, bukan bergeser saat penyajian.
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

interface Props {
  /** Berkas di /public/molecules/<id>.json */
  id: string
  /** Sembunyikan hidrogen — struktur besar jadi jauh lebih terbaca. */
  tanpaH?: boolean
  tinggi?: number
}

export function Molecule3D({ id, tanpaH = false, tinggi = 260 }: Props) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const [gagal, setGagal] = useState('')
  const [muat, setMuat] = useState(true)
  const [sentuh, setSentuh] = useState<string | null>(null)
  const tanpaHRef = useRef(tanpaH)
  tanpaHRef.current = tanpaH

  useEffect(() => {
    const wadah = wadahRef.current
    if (!wadah) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setGagal('This device could not start 3D graphics (WebGL).')
      setMuat(false)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.75))
    const kunci = new THREE.DirectionalLight(0xffffff, 1.05)
    kunci.position.set(3, 4, 5)
    scene.add(kunci)
    const isi = new THREE.DirectionalLight(0xffffff, 0.35)
    isi.position.set(-4, -1, -3)
    scene.add(isi)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.1

    const ukur = () => {
      const w = wadah.clientWidth, h = wadah.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(wadah)

    const grup = new THREE.Group()
    scene.add(grup)
    const bolaAtom: THREE.Mesh[] = []
    const labelAtom = new Map<THREE.Mesh, string>()
    let batal = false

    fetch(`${import.meta.env.BASE_URL}molecules/${id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: MoleculeData) => {
        if (batal) return
        const sembunyi = tanpaHRef.current
        const geoBola = new THREE.SphereGeometry(1, 20, 14)
        const geoBatang = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true)

        data.atoms.forEach((a, i) => {
          const sym = a[0] as string
          if (sembunyi && sym === 'H') return
          const u = UNSUR[sym] ?? LAIN
          const m = new THREE.Mesh(
            geoBola,
            new THREE.MeshStandardMaterial({ color: warnaLinear(u.warna), roughness: 0.45, metalness: 0.05 }),
          )
          // Jari-jari bola dipendekkan dari van der Waals: pada ukuran penuh
          // bola-bolanya saling menelan dan ikatannya tidak terlihat lagi.
          const r = u.r * 0.28
          m.scale.setScalar(r)
          m.position.set(a[1] as number, a[2] as number, a[3] as number)
          grup.add(m)
          bolaAtom.push(m)
          labelAtom.set(m, `${sym}${i + 1}`)
        })

        const v = new THREE.Vector3()
        for (const [ia, ib, orde] of data.bonds) {
          const A = data.atoms[ia], B = data.atoms[ib]
          if (sembunyi && (A[0] === 'H' || B[0] === 'H')) continue
          const pa = new THREE.Vector3(A[1] as number, A[2] as number, A[3] as number)
          const pb = new THREE.Vector3(B[1] as number, B[2] as number, B[3] as number)
          const panjang = pa.distanceTo(pb)
          // Ikatan rangkap digambar sebagai dua batang sejajar, aromatik sebagai
          // batang tunggal yang lebih tebal — cara buku menggambarnya.
          const jumlah = orde === 2 || orde === 3 ? orde : 1
          const tebal = orde === 4 ? 0.085 : 0.06
          const tengah = pa.clone().add(pb).multiplyScalar(0.5)
          v.subVectors(pb, pa).normalize()
          const tegak = new THREE.Vector3(0, 1, 0).cross(v)
          if (tegak.lengthSq() < 1e-6) tegak.set(1, 0, 0)
          tegak.normalize().multiplyScalar(0.09)
          for (let k = 0; k < jumlah; k++) {
            const geser = jumlah === 1 ? 0 : (k - (jumlah - 1) / 2) * 1
            const batang = new THREE.Mesh(
              geoBatang,
              new THREE.MeshStandardMaterial({ color: warnaLinear('#9aa0a6'), roughness: 0.55, metalness: 0.05 }),
            )
            batang.scale.set(tebal, panjang, tebal)
            batang.position.copy(tengah).addScaledVector(tegak, geser)
            batang.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v)
            grup.add(batang)
          }
        }

        const kotak = new THREE.Box3().setFromObject(grup)
        const ukuran = kotak.getSize(new THREE.Vector3())
        const pusat = kotak.getCenter(new THREE.Vector3())
        grup.position.sub(pusat)
        const besar = Math.max(ukuran.x, ukuran.y, ukuran.z, 1)
        camera.position.set(0, 0, besar * 1.6)
        controls.target.set(0, 0, 0)
        controls.update()
        setMuat(false)
      })
      .catch(() => { if (!batal) { setGagal('Could not load this molecule.'); setMuat(false) } })

    const ray = new THREE.Raycaster()
    const titik = new THREE.Vector2()
    function padaKlik(ev: PointerEvent) {
      const r = renderer.domElement.getBoundingClientRect()
      titik.x = ((ev.clientX - r.left) / r.width) * 2 - 1
      titik.y = -((ev.clientY - r.top) / r.height) * 2 + 1
      ray.setFromCamera(titik, camera)
      const kena = ray.intersectObjects(bolaAtom, false)
      setSentuh(kena[0] ? labelAtom.get(kena[0].object as THREE.Mesh) ?? null : null)
      controls.autoRotate = false
    }
    renderer.domElement.addEventListener('pointerup', padaKlik)

    const onHilang = (e: Event) => { e.preventDefault(); setGagal('The browser dropped the 3D context.') }
    renderer.domElement.addEventListener('webglcontextlost', onHilang)

    let raf = 0
    const bingkai = () => {
      raf = requestAnimationFrame(bingkai)
      controls.update()
      renderer.render(scene, camera)
    }
    bingkai()

    return () => {
      batal = true
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
  }, [id, tanpaH])

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-50 dark:bg-white/5">
      <div ref={wadahRef} style={{ height: tinggi }} className="w-full" />
      {muat && !gagal && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs font-semibold text-neutral-500">Building the molecule…</p>
        </div>
      )}
      {gagal && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-center text-xs font-semibold text-neutral-500">{gagal}</p>
        </div>
      )}
      {!muat && !gagal && (
        <p className="px-3 pb-2 text-center text-[10.5px] text-neutral-400">
          {sentuh ? `Atom ${sentuh}` : 'Drag to rotate · tap an atom to name it'}
        </p>
      )}
    </div>
  )
}

export default Molecule3D
