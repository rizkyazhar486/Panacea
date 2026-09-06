import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { bangunLintasan, kecepatanAliran, titikPada, type FlowPath, type Vec3 } from '../lib/cardioFlow'

// ─────────────────────────────────────────────────────────────────────────────
// PENAMPIL ATLAS — satu penampil untuk SELURUH modul spesialisasi.
//
// Dipakai oleh ruang kardiovaskular maupun oleh ruang spesialisasi lain
// (respirasi, gastro, nefrologi, neurologi, THT, mata, ortopedi, urogenital,
// panggul, imunologi, kulit). Yang berbeda antar modul hanya BERKAS dan
// DAFTAR STRUKTURNYA; perilakunya sama, dan itu disengaja: orang tidak perlu
// belajar penampil baru tiap berpindah bidang.
//
// Empat aturan yang menentukan bentuknya:
//
//   1. TIAP MESH BERNAMA. Menyorot "LAD" atau "Left kidney" cukup dengan
//      mencocokkan nama, tanpa daftar indeks yang akan basi begitu berkasnya
//      dibangun ulang.
//   2. ALIRAN MENGIKUTI GARIS TENGAH STRUKTUR, bukan garis lurus antar organ.
//      Perhitungannya ada di cardioFlow.ts dan diuji dengan angka — animasi
//      yang salah arah tetap terlihat indah, jadi ia tidak bisa diperiksa
//      dengan mata.
//   3. YANG TIDAK TERLIBAT DIREDUPKAN, tidak disembunyikan. Menghilangkan
//      struktur lain menghapus konteks letaknya; meredupkan tetap menjawab
//      "di sebelah mana ini".
//   4. KAMERA IKUT MENDEKAT ke struktur yang disorot. Pada pohon seluruh tubuh,
//      LAD atau kelenjar hipofisis hanya beberapa piksel; menyorot tanpa
//      mendekat terbaca sebagai "tidak terjadi apa-apa".
// ─────────────────────────────────────────────────────────────────────────────

/** Keterangan satu struktur, sama untuk semua modul. */
export interface PartMeta {
  name: string
  /** Jenis jaringan atau golongan — dipakai penyaring dan aturan tampilan. */
  kind: string
  /** Pengelompokan bebas per modul (wilayah tubuh, sistem, dan sebagainya). */
  group?: string
}

export interface AtlasViewerProps {
  /** Berkas GLB, relatif terhadap folder publik. Contoh: 'atlas/neurologi.glb'. */
  berkas: string
  /** Struktur yang dikenal berkas itu, untuk memulihkan nama dan menyaring. */
  bagian: PartMeta[]
  /** Struktur yang menjadi LESI — disorot merah dan berdenyut. */
  lesi?: string[]
  /** Struktur yang kekurangan darah AKIBAT lesi — disorot kuning. */
  hilir?: string[]
  /** Jalur aliran yang sedang diperagakan. */
  jalur?: FlowPath | null
  /** Denyut jantung, memengaruhi laju dan bentuk aliran. */
  hr?: number
  /** Hanya tampilkan kelompok ini. null = semua. */
  wilayah?: string | null
  /** Tinggi kanvas. Modul dengan struktur ramping perlu ruang lebih. */
  tinggi?: number
  onPilih?: (nama: string | null) => void
  dipilih?: string | null
}

/**
 * GLTFLoader MENGGANTI nama simpul: spasi menjadi garis bawah dan tanda baca
 * dibuang (THREE.PropertyBinding.sanitizeNodeName). Jadi mesh "Trunk of
 * anterior interventricular branch of left coronary artery" sampai di adegan
 * dengan nama lain, dan pencocokan nama gagal DIAM-DIAM: figur tetap tampil
 * rapi, hanya tidak ada yang pernah menyala. Nama asli dipulihkan lewat peta
 * ini, dan itu pula yang ditampilkan ke pengguna.
 */
function namaBersih(s: string): string {
  return s.replace(/\s/g, '_').replace(/[^\w-]/g, '')
}

/**
 * Warna sorotan ditulis dalam RUANG LINEAR, sama seperti warna bahan di dalam
 * GLB (lihat scripts/atlasGlb.mjs, yang memangkatkan 2,2 sebelum menulis).
 *
 * Ini bukan kerewelan: memakai `new THREE.Color('#ff7a00')` membuat jingga
 * tampil sebagai HIJAU ZAITUN di layar, karena nilainya diperlakukan sebagai
 * linear lalu dikodekan sekali lagi ke sRGB saat penyajian — saluran hijau
 * naik jauh lebih banyak daripada merah. Terukur: jingga (255,122,0) keluar
 * sebagai (154,145,0). Menyamakan ruang warna dengan berkas modelnya membuat
 * sorotan tampil sebagaimana ditulis, dan tetap benar baik saat manajemen
 * warna three.js menyala maupun mati.
 */
function warnaLinear(hex: string): THREE.Color {
  const n = (i: number) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)
  return new THREE.Color().setRGB(n(1), n(3), n(5))
}

const WARNA_LESI = warnaLinear('#ff2d2d')
const WARNA_HILIR = warnaLinear('#ff7a00')
const JUMLAH_PARTIKEL = 90

export function AtlasViewer3D({ berkas, bagian, lesi = [], hilir = [], jalur = null, hr = 72, wilayah = null, tinggi = 300, onPilih, dipilih = null }: AtlasViewerProps) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const [muat, setMuat] = useState(true)
  const [pct, setPct] = useState(0)
  const [gagal, setGagal] = useState('')
  const [sentuh, setSentuh] = useState<string | null>(null)

  // Nilai yang berubah tiap render dibaca lewat ref supaya loop animasi tidak
  // perlu dibangun ulang — memuat ulang GLB 3,6 MB tiap kali orang mengganti
  // penyakit akan terasa seperti aplikasi yang macet.
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
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
      const w = wadah.clientWidth, h = wadah.clientHeight
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

    // ── Partikel aliran ──────────────────────────────────────────────────────
    // Bola kecil, bukan THREE.Points: titik digambar sebagai persegi sejajar
    // layar, dan begitu kamera mendekat ke satu pembuluh ia berubah menjadi
    // kotak-kotak besar yang tidak menyerupai apa pun.
    const geoPartikel = new THREE.SphereGeometry(1, 8, 6)
    const matPartikel = new THREE.MeshBasicMaterial({ color: warnaLinear('#ff6b6b'), transparent: true, opacity: 0.95 })
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
    loader.load(
      `${import.meta.env.BASE_URL}${berkas}`,
      (gltf) => {
        grup = gltf.scene
        const asliPerBersih = new Map(bagianRef.current.map((p) => [namaBersih(p.name), p]))
        grup.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return
          const m = o as THREE.Mesh
          const bagian = asliPerBersih.get(m.name) ?? asliPerBersih.get(namaBersih(m.name))
          if (bagian) m.name = bagian.name
          const bahan = (m.material as THREE.MeshStandardMaterial).clone()
          bahan.transparent = true
          m.material = bahan
          warnaAsli.set(m, bahan.color.clone())
          wilayahMesh.set(m, bagian?.group ?? '')
          // Rongga jantung adalah gumpalan besar dan pejal. Dibiarkan sepekat
          // pembuluh, ia menutupi koroner yang justru sedang dipelajari.
          jenisMesh.set(m, bagian?.kind ?? '')
          meshes.push(m)
        })
        const takDikenal = meshes.filter((m) => !jenisMesh.get(m)).length
        if (takDikenal) console.warn(`${takDikenal} mesh pada ${berkas} tidak dikenali namanya`)
        scene.add(grup)
        setMuat(false)
      },
      (ev) => { if (ev.total > 0) setPct(ev.loaded / ev.total) },
      () => { setGagal('Could not load this anatomical model.'); setMuat(false) },
    )

    // ── Sentuhan: dari struktur ke penyakit ──────────────────────────────────
    const ray = new THREE.Raycaster()
    const titik = new THREE.Vector2()
    function padaKlik(ev: PointerEvent) {
      if (!grup) return
      const r = renderer.domElement.getBoundingClientRect()
      titik.x = ((ev.clientX - r.left) / r.width) * 2 - 1
      titik.y = -((ev.clientY - r.top) / r.height) * 2 + 1
      ray.setFromCamera(titik, camera)
      const kena = ray.intersectObjects(meshes.filter((m) => m.visible), false)
      const nama = kena[0]?.object.name ?? null
      setSentuh(nama)
      onPilihRef.current?.(nama)
    }
    renderer.domElement.addEventListener('pointerup', padaKlik)

    const onHilang = (e: Event) => {
      e.preventDefault()
      setGagal('The browser dropped the 3D context, usually because memory ran low.')
    }
    renderer.domElement.addEventListener('webglcontextlost', onHilang)

    // ── Membingkai ulang kamera ──────────────────────────────────────────────
    // Pada pohon pembuluh seluruh tubuh, LAD hanya beberapa piksel. Menyorotnya
    // saja tidak cukup: kamera harus IKUT mendekat, kalau tidak orang melihat
    // gambar yang sama persis dan menyimpulkan tidak terjadi apa-apa.
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
    let t = 0            // posisi partikel terdepan pada lintasan, 0..1
    let raf = 0
    let kunciBingkai = ''
    const v = new THREE.Vector3()

    function bingkai() {
      raf = requestAnimationFrame(bingkai)
      const dt = Math.min(jam.getDelta(), 0.1)
      const { lesi: L, hilir: H, jalur: J, hr: HR, wilayah: W, dipilih: D } = propRef.current
      const detik = jam.getElapsedTime()

      const setLesi = new Set(L.map((s) => s.toLowerCase()))
      const setHilir = new Set(H.map((s) => s.toLowerCase()))
      const adaSorot = setLesi.size > 0 || setHilir.size > 0
      // Denyut lesi: 2 Hz, cukup untuk menarik mata tanpa menjadi kedipan.
      const denyut = 0.55 + 0.45 * Math.sin(detik * 6.0)

      // Struktur yang dilalui aliran TIDAK PERNAH disaring keluar oleh
      // penyaring wilayah. Tanpa aturan ini, memilih "Heart" saat mengikuti
      // sirkulasi paru menyembunyikan arteri pulmonalisnya sendiri, dan
      // partikel tampak melayang di udara kosong.
      const setJalur = new Set((J?.urutan ?? []).map((n) => n.toLowerCase()))

      // Bingkai ulang hanya saat yang disorot atau yang disaring berubah —
      // bukan tiap bingkai, supaya pengguna tetap bisa memutar dan memperbesar
      // sendiri tanpa kamera menariknya kembali.
      const kunciBaru = `${[...setLesi].sort().join('|')}::${[...setHilir].sort().join('|')}::${W ?? ''}::${J?.id ?? ''}`
      if (meshes.length && kunciBaru !== kunciBingkai) {
        kunciBingkai = kunciBaru
        if (adaSorot) bingkaiKe((m) => setLesi.has(m.name.toLowerCase()) || setHilir.has(m.name.toLowerCase()), 2.1)
        else if (W || J) {
          // Tanpa lesi, yang dibingkai adalah apa yang sedang dilihat: wilayah
          // yang dipilih beserta jalur yang sedang diikuti.
          const perhatian = new Set([...setJalur])
          bingkaiKe((m) => (W ? wilayahMesh.get(m) === W : false) || perhatian.has(m.name.toLowerCase()), 1.9)
        } else bingkaiKe(() => true, 1.45)
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
          // Pantulan dimatikan pada struktur yang disorot: kilau putih dari
          // lampu menipiskan warnanya, dan warna itulah keterangannya.
          bahan.metalness = 0
          bahan.roughness = 1
          bahan.emissive.copy(WARNA_LESI).multiplyScalar(denyut * 0.7)
          bahan.opacity = 1
        } else if (setHilir.has(nama)) {
          bahan.color.copy(WARNA_HILIR)
          bahan.metalness = 0
          bahan.roughness = 1
          bahan.emissive.copy(WARNA_HILIR).multiplyScalar(0.6)
          // Sengaja PEKAT, termasuk untuk ruang jantung: struktur setengah
          // tembus yang tertumpuk di atas struktur lain menghasilkan warna
          // campuran — jingga di atas rongga yang teredam terbaca hijau zaitun,
          // dan warna yang salah adalah keterangan yang salah.
          bahan.opacity = 1
        } else {
          bahan.color.copy(asli)
          bahan.emissive.setRGB(0, 0, 0)
          // Diredupkan, bukan disembunyikan: letak lesi hanya berarti kalau
          // tetangganya masih terlihat.
          const rongga = jenisMesh.get(m) === 'chamber'
          bahan.opacity = adaSorot ? (rongga ? 0.10 : 0.16) : (rongga ? 0.34 : 0.92)
        }
        // Struktur setengah tembus tidak boleh menulis kedalaman: kalau ia
        // menulis, ia menutupi partikel darah yang berada DI DALAMNYA — aliran
        // di dalam ruang jantung jadi menghilang justru saat ruangnya dilihat.
        bahan.depthWrite = bahan.opacity >= 0.99
        // Yang disorot digambar TERAKHIR. Semua bahan di sini tembus pandang,
        // jadi urutannya menentukan warna akhir: struktur teredam yang digambar
        // di atas sorotan akan menodainya — jingga di balik lapisan teredam
        // terbaca hijau zaitun, terukur (211,121,0) menjadi (155,145,0).
        m.renderOrder = setLesi.has(nama) || setHilir.has(nama) ? 2 : 0

        if (D && nama === D.toLowerCase()) {
          bahan.emissive.setRGB(0.25, 0.25, 0.25)
          bahan.opacity = 1
        }
      }

      // ── Aliran ─────────────────────────────────────────────────────────────
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
      if (!J) { idJalur = ''; garis.visible = false; partikel.visible = false }

      if (J && lintasan.length >= 2) {
        partikel.visible = true
        // Laju dasar dipilih supaya satu putaran penuh memakan ~6 detik pada
        // 72/menit: cukup lambat untuk diikuti mata, cukup cepat untuk terbaca
        // sebagai aliran.
        t = (t + dt * (1 / 6) * kecepatanAliran(detik, HR, J.pulsatile)) % 1
        // Ukuran partikel mengikuti jarak kamera: pada tampilan seluruh tubuh
        // ia harus cukup besar untuk terlihat, saat mendekat ke satu pembuluh ia
        // tidak boleh lebih besar daripada pembuluhnya sendiri.
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

      // Gerak kamera dihaluskan, bukan meloncat: loncatan menghapus rasa
      // "ini bagian dari tubuh yang tadi" dan orang kehilangan letaknya.
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
      geoPartikel.dispose()
      matPartikel.dispose()
      renderer.dispose()
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
          {sentuh ? sentuh : 'Drag to rotate · tap any structure to see what goes wrong there'}
        </p>
      )}
    </div>
  )
}

export default AtlasViewer3D
