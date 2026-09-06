import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ikatSumbu, pasangTriplanar, setelAnisotropi } from '../../lib/triplanar'
import { RESEP, type JenisJaringan } from '../../lib/tissueTexture'

// ─────────────────────────────────────────────────────────────────────────────
// CONTOH BAHAN JARINGAN.
//
// Sebuah tubuh utuh berisi dua juta segitiga adalah cara yang buruk untuk
// menjawab pertanyaan "seperti apa sebenarnya bahan otot ini". Ia lambat
// dimuat, dan pada tampilan seluruh tubuh satu berkas serat hanya selebar
// belasan piksel sehingga yang terlihat justru bukan bahannya.
//
// Di sini tiap jaringan ditampilkan pada satu bentuk sederhana, cukup besar
// untuk dilihat. Gunanya dua: pembaca bisa membandingkan otot dengan tendon
// dan parenkim berdampingan, dan siapa pun bisa MEMERIKSA apakah teksturnya
// memang sampai ke layar — pertanyaan yang pada tubuh utuh sulit dijawab
// karena selalu bisa dikira soal jarak pandang.
// ─────────────────────────────────────────────────────────────────────────────

const WARNA: Record<JenisJaringan, number> = {
  otot: 0x8c2f37,
  tendon: 0xd6c4a5,
  tulang: 0xd7cfbb,
  organ: 0x8f3a34,
  pembuluh: 0xb3222a,
  lemak: 0xd8bc73,
  saraf: 0xd3b54a,
}
const LABEL: Record<JenisJaringan, string> = {
  otot: 'Skeletal muscle',
  tendon: 'Tendon / fascia',
  tulang: 'Cortical bone',
  organ: 'Organ parenchyma',
  pembuluh: 'Vessel wall',
  lemak: 'Adipose',
  saraf: 'Peripheral nerve',
}
const URUT: JenisJaringan[] = ['otot', 'tendon', 'organ', 'tulang', 'pembuluh', 'lemak', 'saraf']

export function TissuePreview({ tinggi = 240 }: { tinggi?: number }) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const [gagal, setGagal] = useState('')
  const [pilih, setPilih] = useState<JenisJaringan>('otot')
  const pilihRef = useRef(pilih)
  pilihRef.current = pilih

  useEffect(() => {
    const wadah = wadahRef.current
    if (!wadah) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 50)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setGagal('This device could not start 3D graphics (WebGL).')
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1.05
    setelAnisotropi(renderer.capabilities.getMaxAnisotropy())
    // Gaya CSS ditetapkan sendiri, sebab setSize dipanggil tanpa memperbarui
    // gaya; tanpa ini kanvas ditata memakai ukuran piksel perangkatnya.
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    wadah.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const lingkungan = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = lingkungan.texture
    scene.environmentIntensity = 0.5
    pmrem.dispose()
    scene.add(new THREE.AmbientLight(0xffffff, 0.25))
    const kunci = new THREE.DirectionalLight(0xfff4e8, 1.1)
    kunci.position.set(2, 3, 4)
    scene.add(kunci)
    const tepi = new THREE.DirectionalLight(0xd9e9ff, 0.5)
    tepi.position.set(-2, 1, -3)
    scene.add(tepi)

    // Silinder, bukan bola: serat jaringan punya ARAH, dan arah hanya terbaca
    // pada bentuk yang punya sumbu.
    const geometri = new THREE.CapsuleGeometry(0.55, 1.5, 24, 48)
    const bahanPer = new Map<JenisJaringan, THREE.MeshPhysicalMaterial>()
    for (const j of URUT) {
      const m = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(WARNA[j]),
        roughness: j === 'tulang' ? 0.7 : 0.48,
        metalness: 0,
        clearcoat: j === 'tulang' ? 0.02 : 0.08,
        clearcoatRoughness: 0.55,
        sheen: 0.28,
        sheenColor: new THREE.Color(WARNA[j]).lerp(new THREE.Color(0xffffff), 0.4),
      })
      pasangTriplanar(m, { jenis: j, skala: j === 'lemak' ? 5 : 12, kuat: 1, kuatKasar: 1 })
      bahanPer.set(j, m)
    }
    const mesh = new THREE.Mesh(geometri, bahanPer.get('otot')!)
    // Kapsul memanjang pada sumbu Y-nya sendiri; itulah arah seratnya.
    ikatSumbu(mesh, new THREE.Vector3(0, 1, 0), 1)
    mesh.rotation.z = Math.PI / 2.6
    scene.add(mesh)
    camera.position.set(0, 0, 3.6)

    const ukur = () => {
      const w = wadah.clientWidth, h = wadah.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(wadah)

    let hidup = true, bingkai = 0
    const putar = () => {
      if (!hidup) return
      bingkai = requestAnimationFrame(putar)
      const m = bahanPer.get(pilihRef.current)
      if (m && mesh.material !== m) mesh.material = m
      mesh.rotation.y += 0.004
      renderer.render(scene, camera)
    }
    putar()

    return () => {
      hidup = false
      cancelAnimationFrame(bingkai)
      ro.disconnect()
      geometri.dispose()
      for (const m of bahanPer.values()) m.dispose()
      lingkungan.dispose()
      renderer.dispose()
      wadah.removeChild(renderer.domElement)
    }
  }, [])

  if (gagal) {
    return <div className="rounded-xl bg-black/30 p-4 text-center text-[11px] text-white/60">{gagal}</div>
  }
  const r = RESEP[pilih]
  return (
    <div className="space-y-2">
      <div ref={wadahRef} style={{ height: tinggi }} className="w-full rounded-2xl bg-[#070b11]" />
      <div className="flex flex-wrap gap-1.5">
        {URUT.map((j) => (
          <button
            key={j}
            onClick={() => setPilih(j)}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
              pilih === j ? 'border-cyan-300 bg-cyan-300 text-black' : 'border-white/15 bg-white/5 text-white/70'
            }`}
          >
            {LABEL[j]}
          </button>
        ))}
      </div>
      {/* Angka resepnya ikut ditampilkan: perbandingan pengulangan U terhadap V
          ADALAH arah seratnya, dan menampilkannya membuat klaim "berserat
          searah" bisa diperiksa alih-alih dipercaya. */}
      <p className="text-[10px] leading-relaxed text-white/45">
        {LABEL[pilih]} — pattern repeats {r.ulangU}× along the fibre axis against {r.ulangV}× across it
        {r.ulangU / r.ulangV >= 3 ? ' (directional, as fibrous tissue is)' : ' (isotropic, as parenchyma is)'};
        brightness varies ±{Math.round(r.kontras * 50)}%, roughness ±{Math.round(r.variasiKasar * 50)}%.
        Generated, not downloaded.
      </p>
    </div>
  )
}

export default TissuePreview
