import * as THREE from 'three'
import { buatTekstur, type JenisJaringan } from './tissueTexture'

// ─────────────────────────────────────────────────────────────────────────────
// MEMASANG TEKSTUR PADA MESH YANG TIDAK PUNYA KOORDINAT TEKSTUR.
//
// Dari 743 mesh pada model otot, hanya 9 yang membawa koordinat UV. Tanpa UV,
// tekstur tidak bisa dipasang dengan cara biasa — dan itulah alasan sebenarnya
// setiap permukaan di atlas ini berwarna rata, bukan karena bahannya kurang
// canggih.
//
// Jalan keluarnya PROYEKSI TRIPLANAR: teksturnya diambil tiga kali, sekali
// dari tiap sumbu ruang, lalu dicampur menurut arah hadap permukaannya. Tidak
// ada UV yang dibutuhkan sama sekali, dan tidak ada regangan pada permukaan
// yang melengkung tajam.
//
// Yang dimodulasi hanya TERANG dan KEKASARAN, tidak pernah rona. Warna tiap
// jaringan adalah keterangan klinis — otot merah, vena biru, saraf kuning —
// dan tekstur yang ikut menggeser warnanya akan merusak keterangan itu demi
// penampilan.
// ─────────────────────────────────────────────────────────────────────────────

interface Terikat { pola: THREE.DataTexture; kontras: number; variasiKasar: number }
const cache = new Map<string, Terikat>()

export function teksturJaringan(jenis: JenisJaringan, N = 256): Terikat {
  const kunci = `${jenis}-${N}`
  const ada = cache.get(kunci)
  if (ada) return ada
  const t = buatTekstur(jenis, N)
  const buat = (data: Uint8Array) => {
    const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = true
    tex.needsUpdate = true
    return tex
  }
  const hasil: Terikat = { pola: buat(t.pola), kontras: t.kontras, variasiKasar: t.variasiKasar }
  cache.set(kunci, hasil)
  return hasil
}

export function bebaskanTekstur(): void {
  for (const t of cache.values()) t.pola.dispose()
  cache.clear()
}

export interface OpsiTriplanar {
  jenis: JenisJaringan
  /** Berapa kali tekstur berulang per meter. Makin besar, makin halus seratnya. */
  skala?: number
  /** Kekuatan modulasi terang, 0..1. */
  kuat?: number
  /** Kekuatan modulasi kekasaran, 0..1. */
  kuatKasar?: number
}

/**
 * Menempelkan proyeksi triplanar pada satu bahan.
 *
 * Dipasang lewat onBeforeCompile, bukan dengan menulis ulang seluruh shader,
 * supaya seluruh model fisis three.js — lapisan bening, kilau, tembus cahaya,
 * bayangan — tetap bekerja apa adanya. Menulis shader sendiri berarti
 * kehilangan semuanya sekaligus.
 */
export function pasangTriplanar(bahan: THREE.Material, opsi: OpsiTriplanar): void {
  const { jenis, skala = 9, kuat = 1, kuatKasar = 1 } = opsi
  const tex = teksturJaringan(jenis)
  // Amplitudo diambil dari resep jaringannya, lalu diskalakan oleh kekuatan
  // yang diminta pemanggil. Nilai inilah yang dulu hilang karena terpotong
  // di dalam tekstur 8-bit.
  const amp = tex.kontras * kuat
  const ampKasar = tex.variasiKasar * kuatKasar

  bahan.onBeforeCompile = (shader) => {
    shader.uniforms.uPola = { value: tex.pola }
    shader.uniforms.uSkala = { value: skala }
    shader.uniforms.uAmp = { value: amp }
    shader.uniforms.uAmpKasar = { value: ampKasar }

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
varying vec3 vPosDunia;
varying vec3 vNorDunia;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vPosDunia = (modelMatrix * vec4(transformed, 1.0)).xyz;
vNorDunia = normalize(mat3(modelMatrix) * objectNormal);`)

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D uPola;
uniform float uSkala;
uniform float uAmp;
uniform float uAmpKasar;
varying vec3 vPosDunia;
varying vec3 vNorDunia;

// Pengambilan triplanar. Pangkat empat pada bobot membuat peralihan antar
// sumbu tegas; bobot linear menghasilkan daerah kabur selebar sepertiga
// permukaan di setiap lengkungan.
vec3 ambilTriplanar(sampler2D peta, vec3 pos, vec3 nor) {
  vec3 bobot = pow(abs(nor), vec3(4.0));
  bobot /= max(bobot.x + bobot.y + bobot.z, 1e-4);
  vec3 p = pos * uSkala;
  vec3 cx = texture2D(peta, p.zy).rgb;
  vec3 cy = texture2D(peta, p.xz).rgb;
  vec3 cz = texture2D(peta, p.xy).rgb;
  return cx * bobot.x + cy * bobot.y + cz * bobot.z;
}`)
      // Terang dimodulasi SETELAH warna dasar ditetapkan, sehingga rona
      // jaringannya tidak pernah bergeser — hanya naik-turun terangnya.
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  // Pola berpusat di 0,5; di sinilah ia dikembalikan menjadi pengali di
  // sekitar 1,0 — di luar batas 0..1 yang mengekang tekstur 8-bit.
  float h = ambilTriplanar(uPola, vPosDunia, normalize(vNorDunia)).r;
  diffuseColor.rgb *= 1.0 + (h - 0.5) * 2.0 * uAmp;
}`)
      // Kekasaran dipecah supaya kilaunya tidak rata. Inilah yang membuat
      // permukaan terbaca basah alih-alih dipoles.
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
{
  float hk = ambilTriplanar(uPola, vPosDunia, normalize(vNorDunia)).g;
  roughnessFactor = clamp(roughnessFactor * (1.0 + (hk - 0.5) * 2.0 * uAmpKasar), 0.04, 1.0);
}`)
  }
  // Tanpa kunci ini, three memakai ulang program shader antar bahan yang
  // definisinya sama tetapi teksturnya berbeda.
  bahan.customProgramCacheKey = () => `triplanar-${jenis}-${skala}-${amp}-${ampKasar}`
  bahan.needsUpdate = true
}
