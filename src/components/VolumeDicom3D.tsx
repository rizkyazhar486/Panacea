import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ambangKeTekstur, skalaKotak, type VolumeTekstur } from '../lib/volumeTekstur'
import { lapisanKeUniform, type LapisanVolume } from '../lib/lapisanVolume'
import { normalBidang, jarakBidang, BIDANG_AWAL, type BidangMiring } from '../lib/bidangPotong'

// GPU ray-casting for a DICOM volume. This renders the selected study values;
// it does not infer organs, diagnoses, or substitute an anatomical atlas.
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
uniform int uMode;
uniform float uJendelaBawah;
uniform float uJendelaRentang;
uniform float uMmPerLangkah;
uniform float uMuAir;
uniform float uPajanan;
uniform vec3 uPotongMin;
uniform vec3 uPotongMaks;
uniform int uJumlahLapisan;
uniform vec2 uLapisanRentang[3];
uniform vec3 uLapisanWarna[3];
uniform float uLapisanOpasitas[3];
uniform float uHalus;
uniform int uBidangAktif;
uniform vec3 uBidangNormal;
uniform float uBidangJarak;

vec2 potongKotak(vec3 asal, vec3 arah) {
  vec3 invArah = 1.0 / arah;
  vec3 tMin = (uPotongMin - asal) * invArah;
  vec3 tMaks = (uPotongMaks - asal) * invArah;
  vec3 t1 = min(tMin, tMaks);
  vec3 t2 = max(tMin, tMaks);
  return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}

bool diKotakPotong(vec3 p) {
  return all(greaterThanEqual(p, uPotongMin)) && all(lessThanEqual(p, uPotongMaks));
}

// Bidang miring: sisi depan (dot(p, n) > d) DILEWATI, bukan akhir sinar — sinar
// yang mulai di sisi terbuang harus terus berjalan ke sisi yang dipertahankan.
// Sama dengan dipertahankan() di bidangPotong.ts.
bool terpotongBidang(vec3 p) {
  return uBidangAktif == 1 && dot(p, uBidangNormal) > uBidangJarak;
}

float ambil(vec3 p) {
  return texture(uData, p + vec3(0.5)).r;
}

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

  if (uMode == 3) {
    float integral = 0.0;
    for (int i = 0; i < 512; i++) {
      if (!diKotakPotong(p)) break;
      if (terpotongBidang(p)) { p += langkahVec; continue; }
      float v = ambil(p);
      float hu = uJendelaBawah + v * uJendelaRentang;
      float mu = uMuAir * (1.0 + hu / 1000.0);
      integral += max(mu, 0.0) * uMmPerLangkah;
      p += langkahVec;
    }
    float transmisi = exp(-integral * uPajanan);
    float film = 1.0 - transmisi;
    if (film < 0.004) discard;
    color = vec4(vec3(film), 1.0);
    return;
  }

  if (uMode == 4) {
    // Lapisan: permukaan pertama tiap lapisan, dikomposit depan-ke-belakang,
    // sehingga lapisan tembus pandang (kulit) memperlihatkan yang di baliknya (tulang).
    vec4 akum = vec4(0.0);
    bool kena[3] = bool[3](false, false, false);
    // Jitter awal sinar per piksel: menghapus pola cincin dari langkah tetap.
    p += langkahVec * fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    for (int i = 0; i < 512; i++) {
      if (!diKotakPotong(p)) break;
      if (terpotongBidang(p)) { p += langkahVec; continue; }
      float v = ambil(p);
      for (int k = 0; k < 3; k++) {
        if (k >= uJumlahLapisan || kena[k]) continue;
        if (v >= uLapisanRentang[k].x && v <= uLapisanRentang[k].y) {
          kena[k] = true;
          vec3 n = gradien(p, uLangkah * uHalus);
          float terang = clamp(0.25 + 0.75 * abs(dot(n, arah)), 0.0, 1.0);
          float a = uLapisanOpasitas[k];
          akum.rgb += (1.0 - akum.a) * a * uLapisanWarna[k] * terang;
          akum.a += (1.0 - akum.a) * a;
        }
      }
      if (akum.a >= 0.98) break;
      p += langkahVec;
    }
    if (akum.a < 0.01) discard;
    color = vec4(akum.rgb / akum.a, akum.a);
    return;
  }

  vec4 terkumpul = vec4(0.0);
  bool kenaPermukaan = false;
  vec3 warnaPermukaan = vec3(0.0);

  for (int i = 0; i < 512; i++) {
    if (!diKotakPotong(p)) break;
    if (terpotongBidang(p)) { p += langkahVec; continue; }
    float v = ambil(p);
    bool diDalam = v >= uAmbangBawah && v <= uAmbangAtas;

    if (uMode >= 1 && diDalam && !kenaPermukaan) {
      vec3 n = gradien(p, uLangkah);
      float terang = clamp(abs(dot(n, arah)), 0.12, 1.0);
      warnaPermukaan = vec3(terang);
      kenaPermukaan = true;
      if (uMode == 1) break;
    }

    if (uMode != 1 && diDalam) {
      float rentang = max(1e-4, uAmbangAtas - uAmbangBawah);
      float n = (v - uAmbangBawah) / rentang;
      float alpha = n * uKepekatan;
      terkumpul.rgb += (1.0 - terkumpul.a) * alpha * vec3(n);
      terkumpul.a += (1.0 - terkumpul.a) * alpha;
      if (terkumpul.a >= 0.98) break;
    }

    p += langkahVec;
  }

  if (uMode == 1) {
    if (!kenaPermukaan) discard;
    color = vec4(warnaPermukaan, 1.0);
    return;
  }

  if (uMode == 2 && kenaPermukaan) {
    terkumpul.rgb = mix(terkumpul.rgb, warnaPermukaan, 0.55);
    terkumpul.a = max(terkumpul.a, 0.55);
  }

  if (terkumpul.a < 0.01) discard;
  color = terkumpul;
}
`

export type ModeRender = 'volume' | 'permukaan' | 'keduanya' | 'radiograf' | 'lapisan'
export type PotongVolume = [number, number, number]

export const MODE_RENDER: { id: ModeRender; label: string; catatan: string }[] = [
  { id: 'volume', label: 'Volume', catatan: 'Every voxel along the ray contributes, so weaker tissue stays visible as weaker.' },
  { id: 'permukaan', label: 'Surface', catatan: 'Stops at the first voxel inside the threshold. A hole here may be a hole in the data or in your threshold.' },
  { id: 'keduanya', label: 'Both', catatan: 'The same threshold drawn both ways at once, so the two can be compared rather than trusted separately.' },
  { id: 'lapisan', label: 'Layers', catatan: 'Up to three surfaces at once, each with its own range, colour and opacity, so a translucent layer shows what lies behind it. Ranges are thresholds on this scan, not a segmentation: a layer contains whatever falls in its range.' },
  { id: 'radiograf', label: 'X-ray (simulated)', catatan: 'Beer-Lambert attenuation integrated along each ray from the actual Hounsfield values — a single-energy beam with no scatter, no beam hardening and no detector response. It is a simulation, not a photograph, and thresholds do not apply to it.' },
]

/** Approximate linear attenuation coefficient used only by the educational DRR simulation. */
export const MU_AIR_PER_MM = 0.0193
const NOMOR_MODE: Record<ModeRender, number> = { volume: 0, permukaan: 1, keduanya: 2, radiograf: 3, lapisan: 4 }

export interface VolumeDicom3DProps {
  tekstur: VolumeTekstur
  mode: ModeRender
  ambangBawah: number
  ambangAtas: number
  kepekatan: number
  pajanan: number
  /** Fraction of the volume retained from the negative side on X/Y/Z. */
  potong?: PotongVolume
  /** Mode 'lapisan': up to three surfaces with their own range/colour/opacity. */
  lapisan?: readonly LapisanVolume[]
  /** Surface-shading smoothing: gradient step multiplier (1 = sharpest). */
  halus?: number
  /** Freely oriented cut plane (tilt/rotate/slide). */
  bidang?: BidangMiring
  onGagal?: (alasan: string) => void
}

function setelBidang(m: THREE.ShaderMaterial, b: BidangMiring) {
  const n = normalBidang(b)
  m.uniforms.uBidangAktif.value = b.aktif ? 1 : 0
  ;(m.uniforms.uBidangNormal.value as THREE.Vector3).set(n[0], n[1], n[2])
  m.uniforms.uBidangJarak.value = jarakBidang(b)
}

function setelLapisan(m: THREE.ShaderMaterial, lapisan: readonly LapisanVolume[], tekstur: VolumeTekstur, halus: number) {
  const u = lapisanKeUniform(lapisan, tekstur.jendela)
  m.uniforms.uJumlahLapisan.value = u.jumlah
  u.rentang.forEach((r, i) => (m.uniforms.uLapisanRentang.value[i] as THREE.Vector2).set(r[0], r[1]))
  u.warna.forEach((w, i) => (m.uniforms.uLapisanWarna.value[i] as THREE.Vector3).set(w[0], w[1], w[2]))
  m.uniforms.uLapisanOpasitas.value = u.opasitas
  m.uniforms.uHalus.value = Math.max(1, Math.min(4, halus))
}

export function VolumeDicom3D({
  tekstur, mode, ambangBawah, ambangAtas, kepekatan, pajanan,
  potong = [1, 1, 1], lapisan = [], halus = 1.5, bidang = BIDANG_AWAL, onGagal,
}: VolumeDicom3DProps) {
  const wadahRef = useRef<HTMLDivElement | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const [gagal, setGagal] = useState<string | null>(null)

  useEffect(() => {
    const m = materialRef.current
    if (!m) return
    m.uniforms.uAmbangBawah.value = ambangKeTekstur(ambangBawah, tekstur.jendela)
    m.uniforms.uAmbangAtas.value = ambangKeTekstur(ambangAtas, tekstur.jendela)
    m.uniforms.uKepekatan.value = kepekatan
    m.uniforms.uMode.value = NOMOR_MODE[mode]
    m.uniforms.uPajanan.value = pajanan
    setelLapisan(m, lapisan, tekstur, halus)
    setelBidang(m, bidang)
    m.uniforms.uPotongMaks.value.set(
      Math.max(0.01, Math.min(1, potong[0])) - 0.5,
      Math.max(0.01, Math.min(1, potong[1])) - 0.5,
      Math.max(0.01, Math.min(1, potong[2])) - 0.5,
    )
  }, [ambangBawah, ambangAtas, kepekatan, mode, pajanan, potong, tekstur, lapisan, halus, bidang])

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
        uLangkah: { value: 1 / Math.max(tekstur.lebar, tekstur.tinggi, tekstur.dalam) },
        uMode: { value: NOMOR_MODE[mode] },
        uJendelaBawah: { value: tekstur.jendela.bawah },
        uJendelaRentang: { value: tekstur.jendela.atas - tekstur.jendela.bawah },
        uMmPerLangkah: { value: Math.max(...tekstur.fisikMm) / Math.max(tekstur.lebar, tekstur.tinggi, tekstur.dalam) },
        uMuAir: { value: MU_AIR_PER_MM },
        uPajanan: { value: pajanan },
        uPotongMin: { value: new THREE.Vector3(-0.5, -0.5, -0.5) },
        uPotongMaks: { value: new THREE.Vector3(potong[0] - 0.5, potong[1] - 0.5, potong[2] - 0.5) },
        uJumlahLapisan: { value: 0 },
        uLapisanRentang: { value: [new THREE.Vector2(2, 2), new THREE.Vector2(2, 2), new THREE.Vector2(2, 2)] },
        uLapisanWarna: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
        uLapisanOpasitas: { value: [0, 0, 0] },
        uHalus: { value: 1.5 },
        uBidangAktif: { value: 0 },
        uBidangNormal: { value: new THREE.Vector3(0, 0, 1) },
        uBidangJarak: { value: 0 },
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
    materialRef.current = material
    setelLapisan(material, lapisan, tekstur, halus)
    setelBidang(material, bidang)

    const skala = skalaKotak(tekstur.fisikMm)
    const geometry = new THREE.BoxGeometry(skala[0], skala[1], skala[2])
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = 0.7
    controls.maxDistance = 5

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tekstur])

  if (gagal) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[.07] p-3.5 text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">
        {gagal}
      </div>
    )
  }

  return <div ref={wadahRef} className="w-full touch-none overflow-hidden rounded-2xl bg-black" aria-label="Volume rendering of the loaded DICOM series" />
}
