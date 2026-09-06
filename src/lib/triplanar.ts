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

/**
 * Penyaringan anisotropik maksimum yang didukung perangkatnya.
 *
 * Ini penting justru untuk triplanar. Permukaan tubuh sebagian besar terlihat
 * MIRING dari kamera, dan pada sudut miring penyaringan biasa merata-ratakan
 * sepanjang satu arah saja sehingga seratnya lumer menjadi kelabu — tepat pada
 * bidang yang paling luas terlihat. Nilainya disuntikkan dari luar karena
 * hanya renderer yang tahu kemampuan perangkatnya.
 */
let anisotropiMaks = 1
export function setelAnisotropi(n: number): void {
  anisotropiMaks = Math.max(1, Math.floor(n))
  for (const t of cache.values()) {
    t.pola.anisotropy = anisotropiMaks
    t.pola.needsUpdate = true
  }
}

export function teksturJaringan(jenis: JenisJaringan, N = 512): Terikat {
  const kunci = `${jenis}-${N}`
  const ada = cache.get(kunci)
  if (ada) return ada
  const t = buatTekstur(jenis, N)
  const buat = (data: Uint8Array) => {
    const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    // Mipmap dinyalakan: tanpa itu serat sehalus ini berkelip setiap kali model
    // diputar, dan kelipan jauh lebih merusak daripada sedikit kelembutan.
    // Sempat dimatikan atas dugaan bahwa mipmap-lah yang meratakan teksturnya
    // menjadi kelabu; diuji, dan ternyata bukan — penyebabnya pengkodean
    // tekstur yang terpotong.
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = true
    tex.anisotropy = anisotropiMaks
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
    // Arah serat struktur ini. Diperbarui per mesh sesaat sebelum digambar,
    // sehingga satu bahan bersama tetap bisa melayani ratusan otot yang
    // arahnya berbeda-beda.
    shader.uniforms.uSumbu = { value: new THREE.Vector3(0, 1, 0) }
    shader.uniforms.uLonjong = { value: 0 }
    shader.uniforms.uAmp = { value: amp }
    shader.uniforms.uAmpKasar = { value: ampKasar }

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
varying vec3 vPosDunia;
varying vec3 vNorDunia;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vPosDunia = (modelMatrix * vec4(transformed, 1.0)).xyz;
vNorDunia = normalize(mat3(modelMatrix) * objectNormal);`)

    // Rujukan ke shader disimpan supaya uniform per-mesh bisa ditulis saat
    // menggambar; tanpa ini tidak ada jalan sah untuk menyentuhnya.
    ;(bahan as THREE.Material & { userData: Record<string, unknown> }).userData.shader = shader

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D uPola;
uniform float uSkala;
uniform vec3 uSumbu;
uniform float uLonjong;
uniform float uAmp;
uniform float uAmpKasar;
varying vec3 vPosDunia;
varying vec3 vNorDunia;

// Basis ortonormal dengan sumbu serat sebagai sumbu Y-nya. Posisi dan normal
// diputar ke dalam basis ini SEBELUM diambil triplanar, sehingga sumbu halus
// tekstur selalu memotong serat dan tidak pernah berjalan searah dengannya.
mat3 basisSerat(vec3 sumbu) {
  vec3 y = normalize(sumbu);
  // Sumbu bantu dipilih yang paling tidak sejajar dengan y; memakai satu
  // sumbu tetap membuat basisnya runtuh setiap kali serat kebetulan sejajar
  // dengannya, dan runtuhnya tidak melempar galat — teksturnya hanya lenyap.
  vec3 bantu = abs(y.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 x = normalize(cross(bantu, y));
  vec3 z = cross(y, x);
  return mat3(x, y, z);
}

// Pengambilan triplanar. Pangkat empat pada bobot membuat peralihan antar
// sumbu tegas; bobot linear menghasilkan daerah kabur selebar sepertiga
// permukaan di setiap lengkungan.
vec3 ambilTriplanar(sampler2D peta, vec3 pos, vec3 nor) {
  mat3 basis = basisSerat(uSumbu);
  // Diputar hanya sejauh strukturnya memang memanjang. Tulang karpal atau
  // kelenjar yang hampir sekubus tidak punya arah serat, dan memaksakan arah
  // padanya cuma menambahkan pola yang keliru.
  vec3 p = mix(pos, pos * basis, uLonjong) * uSkala;
  vec3 n = normalize(mix(nor, nor * basis, uLonjong));
  vec3 bobot = pow(abs(n), vec3(4.0));
  bobot /= max(bobot.x + bobot.y + bobot.z, 1e-4);
  // Sumbu V tekstur (yang variasinya lambat) dipetakan ke sumbu Y basis,
  // yaitu arah serat. Karena itu semua bidang memakai .y pada slot kedua.
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

/**
 * Menghubungkan satu mesh ke arah seratnya sendiri.
 *
 * Nilai uniform-nya ditulis tepat sebelum mesh itu digambar, bukan sekali di
 * awal: satu bahan dipakai bersama oleh ratusan otot, dan tiap otot punya
 * arah yang berbeda. Menyimpannya di bahan berarti otot terakhir yang
 * disiapkan akan menentukan arah serat semua otot lain.
 */
export function ikatSumbu(mesh: THREE.Mesh, sumbu: THREE.Vector3, lonjong: number): void {
  mesh.userData.sumbuSerat = sumbu.clone().normalize()
  mesh.userData.lonjong = Math.max(0, Math.min(1, lonjong))
  mesh.onBeforeRender = (_r, _s, _c, _g, material) => {
    const u = (material as THREE.Material & { userData: { shader?: { uniforms: Record<string, { value: unknown }> } } })
      .userData.shader?.uniforms
    if (!u) return
    if (u.uSumbu) (u.uSumbu.value as THREE.Vector3).copy(mesh.userData.sumbuSerat as THREE.Vector3)
    if (u.uLonjong) u.uLonjong.value = mesh.userData.lonjong
  }
}
