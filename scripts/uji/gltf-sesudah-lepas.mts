import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { penjagaMuatan, buangSubtree } from '../../src/lib/gltfSesudahLepas.ts'

// ─────────────────────────────────────────────────────────────────────────────
// MUATAN YANG TIBA SESUDAH KOMPONENNYA DILEPAS.
//
// GLTFLoader.load() asinkron dan berkas atlas di sini berukuran megabyte. Pada
// telepon dengan jaringan biasa, jeda antara permintaan dan callback-nya
// beberapa detik. Bila pemakainya berpindah tab dalam jeda itu -- atau React
// memasang lalu melepas komponen dua kali, yang memang dilakukannya di mode
// ketat -- cleanup effect sudah membuang renderer-nya, lalu callback-nya tetap
// berjalan dan menambahkan geometri ke scene yang sudah mati. Cleanup-nya
// sudah lewat, jadi tidak ada lagi yang akan membuangnya.
//
// Hasilnya buffer GPU yang hidup sampai tab ditutup, TANPA galat, TANPA
// peringatan, dan dengan layar yang tampak baik-baik saja -- karena
// komponennya memang sudah tidak terlihat. Itulah sebabnya cacat ini bertahan.
// ─────────────────────────────────────────────────────────────────────────────

// Object3D tiruan secukupnya: traverse, isMesh, dan dispose yang menghitung.
function meshPalsu(n: number) {
  const dibuang = { geometri: 0, bahan: 0 }
  const anak = Array.from({ length: n }, () => ({
    isMesh: true,
    geometry: { dispose: () => { dibuang.geometri++ } },
    material: { dispose: () => { dibuang.bahan++ } },
  }))
  // Simpulnya sendiri BUKAN mesh, tetapi tetap membawa geometry/material --
  // persis seperti Group dan Bone di dalam glTF sungguhan. Tanpa itu, sebuah
  // buangSubtree yang lupa memeriksa isMesh akan tetap lolos ujinya.
  const akar = {
    isMesh: false,
    geometry: { dispose: () => { dibuang.geometri++ } },
    material: { dispose: () => { dibuang.bahan++ } },
    traverse(f: (o: unknown) => void) { f(akar); for (const a of anak) f(a) },
  }
  return { akar, dibuang }
}

// ── 1. Selama hidup, muatan diterima dan TIDAK dibuang ────────────────────
{
  const p = penjagaMuatan()
  const { akar, dibuang } = meshPalsu(4)
  assert.equal(p.hidup, true, 'a fresh guard must be alive')
  assert.equal(p.terima(akar as never), true, 'a live component must accept its own load')
  assert.equal(dibuang.geometri, 0, 'accepting a load must not dispose it — the component is about to use it')
}

// ── 2. Sesudah lepas, muatan ditolak DAN dibuang ──────────────────────────
// Menolak saja tidak cukup: geometrinya sudah terlanjur diparse, dan ini
// satu-satunya kesempatan yang tersisa untuk membuangnya.
{
  const p = penjagaMuatan()
  const { akar, dibuang } = meshPalsu(4)
  p.lepas()
  assert.equal(p.hidup, false, 'the guard must report itself released')
  assert.equal(p.terima(akar as never), false, 'a released component must refuse a late load')
  assert.equal(dibuang.geometri, 4, 'a late load was refused but never disposed — that is the leak itself')
  assert.equal(dibuang.bahan, 4, 'late-arriving materials were left behind')
}

// ── 3. Lepas dua kali tidak boleh membuang dua kali ───────────────────────
{
  const p = penjagaMuatan()
  p.lepas(); p.lepas()
  const { akar, dibuang } = meshPalsu(2)
  p.terima(akar as never)
  assert.equal(dibuang.geometri, 2, 'double release changed the disposal count')
}

// ── 4. Muatan kosong tidak boleh melempar ─────────────────────────────────
{
  const p = penjagaMuatan()
  p.lepas()
  assert.equal(p.terima(null), false, 'a null load must be refused without throwing')
  assert.equal(p.terima(undefined), false, 'an undefined load must be refused without throwing')
}

// ── 5. buangSubtree hanya menyentuh mesh ──────────────────────────────────
{
  const { akar, dibuang } = meshPalsu(3)
  const n = buangSubtree(akar as never)
  assert.equal(n, 3, 'the disposal count must match the mesh count, not the node count')
  assert.equal(dibuang.geometri, 3, 'a mesh was skipped')
}

// ── 6. Setiap pemuat GLB harus punya pembatalannya ────────────────────────
// Inventaris, bukan pencocokan kata: berkas yang memuat GLTF DAN membuang
// geometri pada cleanup adalah berkas yang callback-nya dapat tiba terlambat.
function telusuri(dir: string, keluar: string[] = []): string[] {
  for (const nama of readdirSync(dir)) {
    const p = join(dir, nama)
    if (statSync(p).isDirectory()) telusuri(p, keluar)
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) keluar.push(p.replace(/\\/g, '/'))
  }
  return keluar
}

// Berkas yang memuat atlas lewat helper bersama ATAU GLTFLoader langsung.
const pemuat = telusuri('src').filter((f) => {
  const s = readFileSync(f, 'utf8')
  const memuat = /new GLTFLoader\(\)/.test(s) || /muatAtlas\(/.test(s)
  const membuang = /geometry\??\.dispose\(\)/.test(s)
  return memuat && membuang
})

assert.ok(pemuat.length >= 5, `expected at least 5 GLB-loading components that dispose geometry, found ${pemuat.length}`)

const tanpaPenjaga = pemuat.filter((f) => {
  const s = readFileSync(f, 'utf8')
  // Diterima: penjaga bersama ini, ATAU pembatalan buatan sendiri yang
  // benar-benar memeriksa keadaan sebelum memakai muatannya.
  const bersama = /penjaga\.terima\(/.test(s) && /penjaga\.lepas\(\)/.test(s)
  const sendiri = /if \((?:!hidup|dibuang|disposed|cancelled|batal|!alive)\b[^)]*\)\s*(?:\{[^}]*)?return/.test(s)
  return !bersama && !sendiri
})

assert.deepEqual(tanpaPenjaga, [],
  'These components load a multi-megabyte GLB and dispose geometry on cleanup, but their load callback can still ' +
  'run after unmount — it will add geometry to a dead scene that nothing will ever dispose. Wrap the callback with ' +
  `penjagaMuatan() from src/lib/gltfSesudahLepas.ts. Unguarded: ${tanpaPenjaga.join(', ')}`)

console.log(`gltf-sesudah-lepas: ok (${pemuat.length} GLB loaders, all cancellable)`)
