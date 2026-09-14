import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ambangKeTekstur, skalaKotak, type VolumeTekstur } from '../lib/volumeTekstur'

// Ray-casting volume di GPU untuk volume DICOM.
//
// INI MERENDER ISI BERKAS, BUKAN MODEL ANATOMI. Tidak ada mesh yang dimuat,
// tidak ada organ yang dikenali, tidak ada bentuk yang ditebak. Yang terlihat
// di layar adalah nilai-nilai dari irisan yang dibaca, ditembus sinar satu per
// satu. Kalau berkasnya berlubang, gambarnya berlubang.
//
// KENAPA RAY-CASTING DAN BUKAN ISOSURFACE. Isosurface membuang volumenya dan
// menyisakan satu permukaan pada satu ambang; sebuah lubang pada permukaan itu
// tidak dapat dibedakan antara lubang pada pasien dan lubang pada pilihan
// ambang. Ray-casting mempertahankan seluruh volume di sepanjang sinar, jadi
// jaringan yang lebih lemah tetap terlihat sebagai lebih lemah, bukan hilang.
//
// WebGL2 DIPERLUKAN, karena sampler3D tidak ada di WebGL1. Ketiadaannya
// dinyatakan, bukan disiasati dengan tumpukan gambar 2D yang tampak mirip.

const VERTEX = `
out vec3 vOrigin;
out vec3 vDirection;
void main() {
  vec4 modelPos = modelMatrix * vec4(position, 1.0);
  vOrigin = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
  vDirection = position - vOrigin;
  gl_Position = projectionMatrix * viewMatrix * modelPos;
}
`

// Satu langkah penting di dalam shader: sinar dipotong pada kotak satuan
// terlebih dahulu (slab method), supaya langkah-langkahnya tidak dihabiskan
// di ruang kosong di luar volume.
const FRAGMENT = `
precision highp float;
precision highp sampler3D;

in vec3 vOrigin;
in vec3 vDirection;
out vec4 color;

uniform sampler3D uData;
uniform float uAmbangBawah;
uniform float uAmbangAtas;
uniform float uKepekatan;
uniform float uLangkah;
// 0 = volume (kumpulkan sepanjang sinar), 1 = permukaan (berhenti di
// perpotongan pertama), 2 = keduanya ditumpuk.
uniform int uMode;

vec2 potongKotak(vec3 asal, vec3 arah) {
  const vec3 kotakMin = vec3(-0.5);
  const vec3 kotakMaks = vec3(0.5);
  vec3 invArah = 1.0 / arah;
  vec3 tMin = (kotakMin - asal) * invArah;
  vec3 tMaks = (kotakMaks - asal) * invArah;
  vec3 t1 = min(tMin, tMaks);
  vec3 t2 = max(tMin, tMaks);
  return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}

float ambil(vec3 p) {
  return texture(uData, p + vec3(0.5)).r;
}

// Normal permukaan dari GRADIEN nilai, bukan dari mesh: tidak ada segitiga
// yang dibuat, jadi tidak ada bentuk yang dikarang di antara voxel. Arah
// perubahan nilai di sekitar titik itulah yang menjadi arah permukaannya.
vec3 gradien(vec3 p, float h) {
  return normalize(vec3(
    ambil(p + vec3(h, 0.0, 0.0)) - ambil(p - vec3(h, 0.0, 0.0)),
    ambil(p + vec3(0.0, h, 0.0)) - ambil(p - vec3(0.0, h, 0.0)),
    ambil(p + vec3(0.0, 0.0, h)) - ambil(p - vec3(0.0, 0.0, h))
  ) + vec3(1e-6));
}

void main() {
  vec3 arah = normalize(vDirection);
  vec2 t = potongKotak(vOrigin, arah);
  if (t.x > t.y) discard;
  t.x = max(t.x, 0.0);

  vec3 langkahVec = arah * uLangkah;
  vec3 p = vOrigin + arah * t.x;

  vec4 terkumpul = vec4(0.0);
  bool kenaPermukaan = false;
  vec3 warnaPermukaan = vec3(0.0);

  for (int i = 0; i < 512; i++) {
    float v = ambil(p);
    bool diDalam = v >= uAmbangBawah && v <= uAmbangAtas;

    // PERMUKAAN: berhenti pada perpotongan PERTAMA. Inilah yang membuang
    // volumenya dan menyisakan satu kulit -- dan itu sebabnya mode ini
    // tidak menggantikan mode volume melainkan mendampinginya: sebuah
    // lubang pada kulit ini tidak dapat dibedakan antara lubang pada
    // pasien dan lubang pada ambang yang dipilih.
    if (uMode >= 1 && diDalam && !kenaPermukaan) {
      vec3 n = gradien(p, uLangkah);
      // Pencahayaan dari arah kamera: bentuknya terbaca tanpa lampu yang
      // ditempatkan sembarangan, yang akan menyembunyikan sisi tertentu.
      float terang = clamp(abs(dot(n, arah)), 0.12, 1.0);
      warnaPermukaan = vec3(terang);
      kenaPermukaan = true;
      if (uMode == 1) break;
    }

    // VOLUME: di luar ambang berarti TIDAK DIGAMBAR, bukan digambar
    // transparan -- di bawah ambang bawah adalah udara, di atas ambang atas
    // adalah logam atau artefak, dan keduanya tidak boleh mewarnai apa pun.
    if (uMode != 1 && diDalam) {
      float rentang = max(1e-4, uAmbangAtas - uAmbangBawah);
      float n = (v - uAmbangBawah) / rentang;
      float alpha = n * uKepekatan;
      terkumpul.rgb += (1.0 - terkumpul.a) * alpha * vec3(n);
      terkumpul.a += (1.0 - terkumpul.a) * alpha;
      if (terkumpul.a >= 0.98) break;
    }

    p += langkahVec;
    if (p.x < -0.5 || p.x > 0.5 || p.y < -0.5 || p.y > 0.5 || p.z < -0.5 || p.z > 0.5) break;
  }

  if (uMode == 1) {
    if (!kenaPermukaan) discard;
    color = vec4(warnaPermukaan, 1.0);
    return;
  }

  if (uMode == 2 && kenaPermukaan) {
    // Kulit di atas volumenya, keduanya dari ambang yang SAMA -- supaya yang
    // dibandingkan memang hal yang sama, bukan dua pengaturan berbeda.
    terkumpul.rgb = mix(terkumpul.rgb, warnaPermukaan, 0.55);
    terkumpul.a = max(terkumpul.a, 0.55);
  }

  if (terkumpul.a < 0.01) discard;
  color = terkumpul;
}
`

export type ModeRender = 'volume' | 'permukaan' | 'keduanya'

export const MODE_RENDER: { id: ModeRender; label: string; catatan: string }[] = [
  { id: 'volume', label: 'Volume', catatan: 'Every voxel along the ray contributes, so weaker tissue stays visible as weaker.' },
  { id: 'permukaan', label: 'Surface', catatan: 'Stops at the first voxel inside the threshold. A hole here may be a hole in the data or in your threshold.' },
  { id: 'keduanya', label: 'Both', catatan: 'The same threshold drawn both ways at once, so the two can be compared rather than trusted separately.' },
]

const NOMOR_MODE: Record<ModeRender, number> = { volume: 0, permukaan: 1, keduanya: 2 }

export interface VolumeDicom3DProps {
  tekstur: VolumeTekstur
  mode: ModeRender
  /** Ambang dalam satuan asli (HU untuk CT). */
  ambangBawah: number
  ambangAtas: number
  kepekatan: number
  /** Dilaporkan ke atas supaya halaman dapat menyatakan kegagalan, bukan diam. */
  onGagal?: (alasan: string) => void
}

export function VolumeDicom3D({ tekstur, mode, ambangBawah, ambangAtas, kepekatan, onGagal }: VolumeDicom3DProps) {
  const wadahRef = useRef<HTMLDivElement | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const [gagal, setGagal] = useState<string | null>(null)

  // Ambang berubah jauh lebih sering daripada tekstur. Memisahkan keduanya
  // mencegah seluruh volume diunggah ulang ke GPU setiap kali penggeser
  // digerakkan satu satuan Hounsfield.
  useEffect(() => {
    const m = materialRef.current
    if (!m) return
    m.uniforms.uAmbangBawah.value = ambangKeTekstur(ambangBawah, tekstur.jendela)
    m.uniforms.uAmbangAtas.value = ambangKeTekstur(ambangAtas, tekstur.jendela)
    m.uniforms.uKepekatan.value = kepekatan
    m.uniforms.uMode.value = NOMOR_MODE[mode]
  }, [ambangBawah, ambangAtas, kepekatan, mode, tekstur.jendela])

  useEffect(() => {
    const wadah = wadahRef.current
    if (!wadah) return

    const kanvas = document.createElement('canvas')
    const konteks = kanvas.getContext('webgl2')
    if (!konteks) {
      const alasan = 'This browser has no WebGL2, and volume ray-casting needs a 3D texture that WebGL1 cannot hold. Nothing is drawn rather than showing a stack of flat images that would look like a reconstruction.'
      setGagal(alasan)
      onGagal?.(alasan)
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas: kanvas, context: konteks, antialias: false, alpha: true })
    } catch {
      const alasan = 'WebGL2 is present but a renderer could not be created on this device.'
      setGagal(alasan)
      onGagal?.(alasan)
      return
    }

    const lebar = wadah.clientWidth || 320
    const tinggi = Math.max(240, Math.round(lebar * 0.9))
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(lebar, tinggi)
    wadah.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, lebar / tinggi, 0.01, 100)
    camera.position.set(0, 0, 2.2)

    const data3d = new THREE.Data3DTexture(tekstur.data, tekstur.lebar, tekstur.tinggi, tekstur.dalam)
    data3d.format = THREE.RedFormat
    data3d.type = THREE.UnsignedByteType
    data3d.minFilter = THREE.LinearFilter
    data3d.magFilter = THREE.LinearFilter
    data3d.unpackAlignment = 1
    data3d.needsUpdate = true

    const material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        uData: { value: data3d },
        uAmbangBawah: { value: ambangKeTekstur(ambangBawah, tekstur.jendela) },
        uAmbangAtas: { value: ambangKeTekstur(ambangAtas, tekstur.jendela) },
        uKepekatan: { value: kepekatan },
        // Langkah sinar diikat ke ketebalan voxel terkecil: langkah yang
        // lebih besar melewati lapisan tipis dan membuat tulang berlubang.
        uLangkah: { value: 1 / Math.max(tekstur.lebar, tekstur.tinggi, tekstur.dalam) },
        uMode: { value: NOMOR_MODE[mode] },
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
    materialRef.current = material

    const skala = skalaKotak(tekstur.fisikMm)
    const geometry = new THREE.BoxGeometry(skala[0], skala[1], skala[2])
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false

    let hidup = true
    const gambar = () => {
      if (!hidup) return
      controls.update()
      renderer.render(scene, camera)
      requestAnimationFrame(gambar)
    }
    requestAnimationFrame(gambar)

    const ubahUkuran = () => {
      const l = wadah.clientWidth || lebar
      const t = Math.max(240, Math.round(l * 0.9))
      camera.aspect = l / t
      camera.updateProjectionMatrix()
      renderer.setSize(l, t)
    }
    window.addEventListener('resize', ubahUkuran)

    return () => {
      hidup = false
      window.removeEventListener('resize', ubahUkuran)
      controls.dispose()
      geometry.dispose()
      material.dispose()
      data3d.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === wadah) wadah.removeChild(renderer.domElement)
      materialRef.current = null
    }
    // Tekstur adalah satu-satunya hal yang membenarkan pembangunan ulang
    // seluruh adegan. Ambang ditangani effect di atas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tekstur])

  if (gagal) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[.07] p-3.5 text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">
        {gagal}
      </div>
    )
  }

  return <div ref={wadahRef} className="w-full overflow-hidden rounded-2xl bg-black" aria-label="Volume rendering of the loaded DICOM series" />
}
