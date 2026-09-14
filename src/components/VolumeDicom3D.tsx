import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ambangKeTekstur, skalaKotak, type VolumeTekstur } from '../lib/volumeTekstur'

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

  vec4 terkumpul = vec4(0.0);
  bool kenaPermukaan = false;
  vec3 warnaPermukaan = vec3(0.0);

  for (int i = 0; i < 512; i++) {
    if (!diKotakPotong(p)) break;
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

export type ModeRender = 'volume' | 'permukaan' | 'keduanya' | 'radiograf'
export type PotongVolume = [number, number, number]

export const MODE_RENDER: { id: ModeRender; label: string; catatan: string }[] = [
  { id: 'volume', label: 'Volume', catatan: 'Every voxel along the ray contributes, so weaker tissue stays visible as weaker.' },
  { id: 'permukaan', label: 'Surface', catatan: 'Stops at the first voxel inside the threshold. A hole here may be a hole in the data or in your threshold.' },
  { id: 'keduanya', label: 'Both', catatan: 'The same threshold drawn both ways at once, so the two can be compared rather than trusted separately.' },
  { id: 'radiograf', label: 'X-ray (simulated)', catatan: 'Beer-Lambert attenuation integrated along each ray from the actual Hounsfield values — a single-energy beam with no scatter, no beam hardening and no detector response. It is a simulation, not a photograph, and thresholds do not apply to it.' },
]

/** Approximate linear attenuation coefficient used only by the educational DRR simulation. */
export const MU_AIR_PER_MM = 0.0193
const NOMOR_MODE: Record<ModeRender, number> = { volume: 0, permukaan: 1, keduanya: 2, radiograf: 3 }

export interface VolumeDicom3DProps {
  tekstur: VolumeTekstur
  mode: ModeRender
  ambangBawah: number
  ambangAtas: number
  kepekatan: number
  pajanan: number
  /** Fraction of the volume retained from the negative side on X/Y/Z. */
  potong?: PotongVolume
  onGagal?: (alasan: string) => void
}

export function VolumeDicom3D({
  tekstur, mode, ambangBawah, ambangAtas, kepekatan, pajanan,
  potong = [1, 1, 1], onGagal,
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
    m.uniforms.uPotongMaks.value.set(
      Math.max(0.01, Math.min(1, potong[0])) - 0.5,
      Math.max(0.01, Math.min(1, potong[1])) - 0.5,
      Math.max(0.01, Math.min(1, potong[2])) - 0.5,
    )
  }, [ambangBawah, ambangAtas, kepekatan, mode, pajanan, potong, tekstur.jendela])

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
