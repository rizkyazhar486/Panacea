import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useStore } from '../lib/store'
import { getBodyCharacter, characterShape } from '../lib/bodyCharacter'
import { getDemoTersimpan } from '../lib/profile'
import { getVitals } from '../lib/healthVitals'
import {
  selesaikanBentukTubuh,
  bangunMeshTubuh,
  lingkarPenampangCm,
  type BentukTubuh,
} from '../lib/anatomy/antropometriTubuh'

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

export function PersonalBodyAvatar3D({ compact = false }: { compact?: boolean } = {}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const { account, state } = useStore()
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const refresh = () => setRevision((x) => x + 1)
    window.addEventListener('panacea:body-character-updated', refresh)
    window.addEventListener('panacea:health-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('panacea:body-character-updated', refresh)
      window.removeEventListener('panacea:health-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const profile = account ? state.profiles[account.email] ?? {} : {}
  const input = useMemo(() => {
    const demo = getDemoTersimpan()
    const body = getBodyCharacter()
    const heightCm = typeof demo.heightCm === 'number' && demo.heightCm > 0 ? demo.heightCm : 170
    const weightKg = typeof demo.weightKg === 'number' && demo.weightKg > 0 ? demo.weightKg : 70
    const bmi = weightKg / Math.pow(heightCm / 100, 2)
    // Lemak tubuh terukur (impor Apple Health / BIA) bila ada. Tanpa ini model
    // memakai densitas lazim: tetap benar totalnya, hanya tidak personal.
    const v = getVitals() as Record<string, unknown>
    const bf = typeof v.bodyFatPct === 'number' && v.bodyFatPct >= 2 && v.bodyFatPct <= 70
      ? v.bodyFatPct
      : undefined
    return {
      heightCm,
      weightKg,
      bmi,
      sex: demo.sex,
      bodyFatPct: bf,
      shape: characterShape(body.bodyType),
      bodyType: body.bodyType,
      face: profile.avatar,
    }
  }, [profile.avatar, revision])

  // Bentuk antropometrik diselesaikan sekali per perubahan ukuran. Gagal-tertutup:
  // ukuran di luar kisaran manusia menghasilkan null, dan perendernya jatuh ke
  // sosok netral alih-alih menampilkan bentuk yang mengaku milik orang ini.
  const bentuk = useMemo<BentukTubuh | null>(() => {
    try {
      return selesaikanBentukTubuh({
        tinggiCm: input.heightCm,
        massaKg: input.weightKg,
        jenisKelamin: input.sex === 'F' ? 'P' : 'L',
        lemakTubuhPct: input.bodyFatPct,
      })
    } catch {
      return null
    }
  }, [input.heightCm, input.weightKg, input.sex, input.bodyFatPct])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#071018')
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 1.25, 5.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true })
    renderer.domElement.dataset.personalAvatarCanvas = 'true'
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    mount.innerHTML = ''
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = 3.6
    controls.maxDistance = 7.5
    controls.target.set(0, 0.85, 0)

    scene.add(new THREE.HemisphereLight(0xd8f4ff, 0x17211a, 2.0))
    const key = new THREE.DirectionalLight(0xffffff, 2.8)
    key.position.set(3, 5, 4)
    key.castShadow = true
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x5bc7ff, 1.8)
    rim.position.set(-4, 3, -4)
    scene.add(rim)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.55, 64),
      new THREE.MeshStandardMaterial({ color: 0x101a20, roughness: 0.8, metalness: 0.05 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.68
    floor.receiveShadow = true
    scene.add(floor)

    const person = new THREE.Group()
    scene.add(person)

    const heightScale = clamp(input.heightCm / 170, 0.86, 1.16)
    const bmiFactor = clamp((input.bmi - 22) / 18, -0.22, 0.42)
    const shapeAdjust = {
      slim: { shoulder: -0.06, waist: -0.08, hip: -0.04, limb: -0.035 },
      balanced: { shoulder: 0, waist: 0, hip: 0, limb: 0 },
      athletic: { shoulder: 0.10, waist: -0.02, hip: 0.01, limb: 0.04 },
      broad: { shoulder: 0.08, waist: 0.09, hip: 0.06, limb: 0.055 },
      curvy: { shoulder: 0.01, waist: -0.02, hip: 0.10, limb: 0.02 },
    }[input.shape]

    const shoulder = 0.68 + bmiFactor * 0.16 + shapeAdjust.shoulder
    const waist = 0.43 + bmiFactor * 0.22 + shapeAdjust.waist
    const hip = 0.52 + bmiFactor * 0.16 + shapeAdjust.hip + (input.sex === 'F' ? 0.05 : 0)
    const limb = 0.145 + bmiFactor * 0.035 + shapeAdjust.limb
    const torsoH = 1.12 * heightScale
    const legH = 1.42 * heightScale
    const armH = 1.08 * heightScale

    const skin = new THREE.MeshStandardMaterial({ color: 0xc99571, roughness: 0.62, metalness: 0.02 })
    const shirt = new THREE.MeshStandardMaterial({ color: 0x143b35, roughness: 0.52, metalness: 0.04 })
    const shorts = new THREE.MeshStandardMaterial({ color: 0x1a2632, roughness: 0.6, metalness: 0.04 })

    const addMesh = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], scale: [number, number, number] = [1, 1, 1]) => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...position)
      mesh.scale.set(...scale)
      mesh.castShadow = true
      mesh.receiveShadow = true
      person.add(mesh)
      return mesh
    }

    // BATANG TUBUH — satu permukaan menyambung yang di-loft melalui penampang
    // antropometrik, menggantikan silinder/bola/kotak bertumpuk yang dulu
    // dipakai. Ukurannya berasal dari tinggi dan massa nyata lewat kekekalan
    // massa (lihat src/lib/anatomy/antropometriTubuh.ts), bukan dari jari-jari
    // yang ditulis langsung di kode.
    // Model antropometri memakai titik asal di telapak kaki, sedangkan adegan
    // ini memusatkan orangnya di pinggang. Satu pergeseran dipakai bersama oleh
    // batang tubuh, lengan, kaki dan wajah supaya semuanya tetap satu sosok.
    const LANTAI = -1.68
    let wajahY = 1.63 * heightScale
    let wajahZ = 0.235

    if (bentuk) {
      const m = bangunMeshTubuh(bentuk, { segmen: 56, sisipan: 6, tutupAtas: true })
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(m.posisi, 3))
      geo.setIndex(new THREE.BufferAttribute(m.indeks, 1))
      geo.computeVertexNormals()
      const tubuh = new THREE.Mesh(geo, skin)
      tubuh.position.y = LANTAI
      tubuh.castShadow = true
      tubuh.receiveShadow = true
      person.add(tubuh)

      // Kepala sudah menjadi bagian dari permukaan ter-loft, jadi TIDAK ada
      // bola kepala terpisah di sini: menambahkannya akan menggandakan kepala.
      // Lengan dan kaki ditempatkan dari ukuran nyata, bukan dari satuan lama.
      // Dicari di KEDUA daftar, dan melempar kalau tidak ketemu. Versi pertama
      // memakai `find(...)!` hanya pada `penampang`, lalu mengambil `.y` dari
      // hasilnya; ketika tungkai dipisahkan ke daftarnya sendiri, pencarian
      // 'pergelangan-kaki' diam-diam menjadi undefined dan seluruh halaman
      // Profile jatuh ke layar "Something went wrong".
      const cari = (nama: string) => {
        const p =
          bentuk.penampang.find((x) => x.nama === nama) ??
          bentuk.tungkai.find((x) => x.nama === nama) ??
          bentuk.lengan.find((x) => x.nama === nama)
        if (!p) throw new Error(`penampang '${nama}' tidak ada pada bentuk tubuh`)
        return p
      }
      const bahuP = cari('bahu')
      const panggulP = cari('panggul')
      const pergelanganKaki = cari('pergelangan-kaki')
      const kepala = cari('kepala-tengah')
      const selangkanganP = cari('selangkangan')

      // LENGAN — di-loft dari penampangnya sendiri, bukan silinder seragam.
      // Ditempatkan sedikit MASUK ke dalam bahu supaya tidak ada sambungan yang
      // terlihat; tumpang tindih kecil itu urusan tampilan, sedangkan volume
      // tetap dihitung sebagai jumlah volume segmen seperti lazimnya
      // antropometri.
      const mLengan = bangunMeshTubuh(bentuk.lengan, { segmen: 28, sisipan: 5, tutupUjung: true })
      const deltoid = cari('deltoid')
      for (const sisi of [-1, 1]) {
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(mLengan.posisi.slice(), 3))
        g.setIndex(new THREE.BufferAttribute(mLengan.indeks.slice(), 1))
        g.computeVertexNormals()
        const lengan = new THREE.Mesh(g, skin)
        // Diturunkan sedikit: kalau ring teratas lengan berhenti tepat di
        // garis bahu, ujung terbukanya menonjol sebagai tepi datar karena
        // batang tubuh sudah menyempit ke arah leher di atas titik itu.
        lengan.position.set(sisi * (bahuP.a - deltoid.a * 0.35), LANTAI - deltoid.a * 0.55, 0)
        lengan.castShadow = true
        lengan.receiveShadow = true
        person.add(lengan)
      }

      // DUA TUNGKAI, di-loft dengan pembangun permukaan yang sama persis.
      // Keduanya juga dihitung dua kali dalam volume, sehingga sosok di layar
      // dan klaim kekekalan massa merujuk pada tubuh yang sama.
      const mKaki = bangunMeshTubuh(bentuk.tungkai, { segmen: 32, sisipan: 5, tutupUjung: true })
      const kakiX = panggulP.a * 0.46
      for (const sisi of [-1, 1]) {
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(mKaki.posisi.slice(), 3))
        g.setIndex(new THREE.BufferAttribute(mKaki.indeks.slice(), 1))
        g.computeVertexNormals()
        const kaki = new THREE.Mesh(g, skin)
        // Dinaikkan sedikit ke dalam panggul: kalau puncak tungkai berhenti
        // tepat di selangkangan, yang terlihat adalah tepi bertingkat karena
        // tungkai lebih sempit daripada dasar batang tubuh.
        kaki.position.set(sisi * kakiX, LANTAI + selangkanganP.y * 0.055, 0)
        kaki.castShadow = true
        kaki.receiveShadow = true
        person.add(kaki)

        // Telapak kaki berukuran dari proporsi terbitan (panjang telapak
        // 0.152H), bukan kotak berukuran tetap yang salah pada tubuh pendek
        // maupun tinggi.
        const panjangTelapak = 0.152 * (input.heightCm / 100)
        const telapak = new THREE.Mesh(
          new THREE.BoxGeometry(pergelanganKaki.a * 2.1, pergelanganKaki.b * 0.9, panjangTelapak),
          skin,
        )
        telapak.position.set(sisi * kakiX, LANTAI + pergelanganKaki.b * 0.45, panjangTelapak * 0.22)
        telapak.castShadow = true
        person.add(telapak)
      }

      wajahY = LANTAI + kepala.y
      wajahZ = kepala.b + 0.01
    } else {
      // Ukuran di luar kisaran yang dapat dimodelkan: gagal-tertutup ke sosok
      // netral, bukan menampilkan bentuk yang mengaku milik orang ini.
      addMesh(new THREE.CylinderGeometry(shoulder, waist, torsoH, 32), shirt, [0, 0.72 * heightScale, 0], [1, 1, 0.52])
      addMesh(new THREE.SphereGeometry(hip, 32, 18), shorts, [0, 0.05 * heightScale, 0], [1, 0.56, 0.63])
      addMesh(new THREE.SphereGeometry(0.25, 32, 24), skin, [0, 1.63 * heightScale, 0], [1, 1.08, 0.98])
      const legX = hip * 0.45
      addMesh(new THREE.CylinderGeometry(limb * 0.92, limb * 0.74, legH, 24), skin, [-legX, -0.85 * heightScale, 0])
      addMesh(new THREE.CylinderGeometry(limb * 0.92, limb * 0.74, legH, 24), skin, [legX, -0.85 * heightScale, 0])
      addMesh(new THREE.BoxGeometry(0.28, 0.12, 0.55), shorts, [-legX, -1.57 * heightScale, 0.10], [1, 1, 1])
      addMesh(new THREE.BoxGeometry(0.28, 0.12, 0.55), shorts, [legX, -1.57 * heightScale, 0.10], [1, 1, 1])
      const armX = shoulder + 0.10
      const armGeo = new THREE.CylinderGeometry(limb * 0.78, limb * 0.62, armH, 22)
      const leftArm = addMesh(armGeo, skin, [-armX, 0.73 * heightScale, 0])
      leftArm.rotation.z = -0.12
      const rightArm = addMesh(armGeo.clone(), skin, [armX, 0.73 * heightScale, 0])
      rightArm.rotation.z = 0.12
    }

    if (input.face) {
      new THREE.TextureLoader().load(input.face, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        const faceMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.38), faceMat)
        face.position.set(0, wajahY, wajahZ)
        person.add(face)
      })
    }

    // PEMBINGKAIAN DARI BATAS NYATA, bukan angka tetap.
    //
    // Kamera di adegan ini dulu diarahkan ke y=0.85, yang cocok untuk sosok
    // primitif lama yang berpusat di pinggang. Tubuh ter-loft memakai titik
    // asal telapak kaki, jadi ia membentang kira-kira -1.68..+0.02 — dan
    // dengan sasaran lama, yang tampak di layar hanya dada ke atas sementara
    // dua pertiga bingkai kosong. Sasaran dan jarak sekarang dihitung dari
    // kotak batas sosok yang benar-benar dirender, sehingga tubuh setinggi apa
    // pun terbingkai penuh dan menjadi satu-satunya titik fokus.
    const bataske = new THREE.Box3().setFromObject(person)
    const pusat = bataske.getCenter(new THREE.Vector3())
    const rentang = bataske.getSize(new THREE.Vector3())
    const tinggiSosok = Math.max(0.2, rentang.y)
    controls.target.copy(pusat)

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(280, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height

      // Jarak agar seluruh tinggi sosok masuk bingkai, dengan sedikit ruang
      // napas. Pada bingkai yang lebih sempit daripada tinggi, bidang pandang
      // horizontal yang mengikat, jadi keduanya diperiksa.
      const fovV = (camera.fov * Math.PI) / 180
      const jarakV = (tinggiSosok / 2) / Math.tan(fovV / 2)
      const fovH = 2 * Math.atan(Math.tan(fovV / 2) * camera.aspect)
      const jarakH = (Math.max(rentang.x, rentang.z) / 2) / Math.tan(fovH / 2)
      const jarak = Math.max(jarakV, jarakH) * 1.18

      controls.minDistance = jarak * 0.55
      controls.maxDistance = jarak * 2.2
      camera.position.set(pusat.x, pusat.y + tinggiSosok * 0.06, pusat.z + jarak)
      camera.updateProjectionMatrix()
      controls.update()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let raf = 0
    const tick = () => {
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return
        obj.geometry.dispose()
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach((material) => {
          const map = (material as THREE.MeshBasicMaterial).map
          if (map) map.dispose()
          material.dispose()
        })
      })
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
    }
  }, [input, bentuk])

  return (
    <section className="overflow-hidden rounded-[26px] border border-white/10 bg-[#071018] text-white shadow-2xl">
      <div ref={mountRef} className={compact ? "h-[300px] w-full sm:h-[340px]" : "h-[360px] w-full sm:h-[430px]"} aria-label="Personalized 3D body character" />
      <div className="border-t border-white/10 p-3">
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-white/75">
          <span className="rounded-full bg-white/10 px-2 py-1">{Math.round(input.heightCm)} cm</span>
          <span className="rounded-full bg-white/10 px-2 py-1">{Math.round(input.weightKg)} kg</span>
          <span className="rounded-full bg-white/10 px-2 py-1">BMI {input.bmi.toFixed(1)}</span>
          {/* Lingkar ini BUKAN hiasan: keduanya keliling penampang mesh yang
              benar-benar dirender, jadi angka di layar dan sosok di layar
              berasal dari bentuk yang sama. */}
          {bentuk && (
            <>
              <span className="rounded-full bg-white/10 px-2 py-1">
                Chest {Math.round(lingkarPenampangCm(bentuk, 'dada'))} cm
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1">
                Waist {Math.round(lingkarPenampangCm(bentuk, 'pinggang'))} cm
              </span>
            </>
          )}
          {/* Hanya muncul bila lemak tubuh BENAR-BENAR terukur. Tanpa nilai
              nyata, chip ini tidak ditampilkan sama sekali — bukan diisi
              perkiraan yang tampak seperti pengukuran. */}
          {input.bodyFatPct !== undefined && (
            <span className="rounded-full bg-white/10 px-2 py-1">
              Body fat {input.bodyFatPct.toFixed(1)}%
            </span>
          )}
          {input.bodyType && <span className="rounded-full bg-brand/20 px-2 py-1 text-emerald-200">{input.bodyType}</span>}
        </div>
        {!compact && (
          <p className="mt-2 text-[10px] leading-relaxed text-white/70">
            Shaped from your measurements: published segment proportions (Drillis &amp; Contini), mass conservation, and — when your body fat is measured — density from the Siri equation plus its android/gynoid distribution. Derived from measurements, not a scan and not a clinical measurement.
          </p>
        )}
      </div>
    </section>
  )
}

export default PersonalBodyAvatar3D
