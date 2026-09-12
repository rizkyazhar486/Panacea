import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

// Setiap pemuat atlas WAJIB memasang dekoder meshopt.
//
// Ketujuh berkas atlas mencantumkan EXT_meshopt_compression di
// `extensionsRequired`. Tanpa `setMeshoptDecoder`, GLTFLoader MENOLAK berkasnya
// sama sekali -- dan penolakan itu tidak muncul di mana pun: bukan galat
// konsol, bukan pengecualian, hanya kanvas kosong tempat anatomi seharusnya
// berada.
//
// Kegagalan ini sudah terjadi DUA KALI di repositori ini: sekali pada panel
// ventilasi saat dibangun, dan sekali lagi pada DigestiveFlow3D yang sudah
// masuk ke main dan tidak menggambar apa pun sampai diukur di browser. Ia akan
// terjadi lagi, karena `new GLTFLoader()` terlihat lengkap.
//
// Jadi aturannya ditegakkan secara statis, bukan diingat.

const AKAR = new URL('../../src/', import.meta.url).pathname
const BERKAS_ATLAS = ['surface', 'skeletal', 'muscular', 'cardiovascular', 'nervous', 'visceral', 'lymphoid']

// ── 1. Premisnya harus benar: berkasnya memang menuntut meshopt ───────────
//
// Kalau atlas suatu hari dikirim tanpa kompresi, aturan di bawah kehilangan
// alasannya dan harus ditinjau ulang alih-alih diberlakukan membabi buta.
for (const nama of BERKAS_ATLAS) {
  const buf = await readFile(new URL(`../../public/anatomy/${nama}.glb`, import.meta.url))
  assert.equal(buf.readUInt32LE(0), 0x46546c67, `${nama}.glb bukan berkas GLB`)
  const gltf = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))
  const wajib: string[] = gltf.extensionsRequired ?? []
  assert.ok(
    wajib.includes('EXT_meshopt_compression'),
    `${nama}.glb tidak lagi menuntut meshopt; aturan pemuat di berkas ini perlu ditinjau`,
  )
}

async function semuaBerkasSumber(dir: string): Promise<string[]> {
  const isi = await readdir(dir, { withFileTypes: true })
  const keluar: string[] = []
  for (const e of isi) {
    const p = join(dir, e.name)
    if (e.isDirectory()) keluar.push(...await semuaBerkasSumber(p))
    else if (/\.(ts|tsx)$/.test(e.name)) keluar.push(p)
  }
  return keluar
}

// ── 2. Setiap pemuat yang menyentuh atlas harus memasang dekodernya ───────
{
  const berkas = await semuaBerkasSumber(AKAR)
  const pelanggar: string[] = []
  let diperiksa = 0

  for (const p of berkas) {
    const isi = await readFile(p, 'utf8')
    if (!isi.includes('new GLTFLoader(')) continue
    // Hanya pemuat yang benar-benar menunjuk berkas atlas yang diatur di sini.
    if (!/anatomy\/|BERKAS_SARAF|BERKAS_PERMUKAAN|BERKAS_BRONKUS/.test(isi)) continue
    diperiksa += 1
    if (!isi.includes('setMeshoptDecoder')) pelanggar.push(relative(AKAR, p))
  }

  assert.ok(diperiksa >= 3, `Hanya ${diperiksa} pemuat atlas ditemukan; pemindaiannya mungkin rusak`)
  assert.deepEqual(
    pelanggar, [],
    'Pemuat atlas tanpa setMeshoptDecoder. Berkasnya akan ditolak diam-diam dan kanvasnya kosong:\n  ' +
    pelanggar.join('\n  '),
  )

  console.log(
    `Pemuat GLB meshopt: ${BERKAS_ATLAS.length} berkas atlas menuntut EXT_meshopt_compression, dan ` +
    `${diperiksa} pemuat di src/ memasang dekodernya.`,
  )
}
