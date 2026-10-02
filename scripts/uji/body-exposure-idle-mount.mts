import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Bukti cacat nyata (diukur di build produksi, viewport 390×844):
//  - Body Exposure: membuka halaman langsung memasang Body3D di dalam <details> yang TERTUTUP ->
//    satu konteks WebGL ekstra + skeletal.glb & muscular.glb (~8,3 MB) diunduh/di-parse untuk panel tak terlihat.
//  - Frontier Health: dua lab 3D di <details> tertutup membuat dua konteks WebGL dan ~200 draw call/detik
//    terus-menerus; tanpa WebGL, membuka halaman saja menjatuhkan seluruh aplikasi ke layar galat.
// React merender anak <details> yang tertutup, jadi "dimuat saat dibuka" harus dibuat benar-benar terjadi.

const disclosure = readFileSync('src/shared/ui/OnDemandDisclosure.tsx', 'utf8')
const os = readFileSync('src/pages/BodyExposureOS.tsx', 'utf8')
const discovery = readFileSync('src/components/frontier/DiscoveryWorkbench.tsx', 'utf8')

// ── Komponen: isi baru dipasang setelah panel pernah dibuka, lalu tetap terpasang ──
assert.match(disclosure, /useState\(Boolean\(details\.open\)\)/, 'mulai tertutup kecuali pemanggil meminta terbuka')
assert.match(disclosure, /if \(event\.currentTarget\.open\) setOpened\(true\)/, 'hanya event toggle dengan open=true yang memasang isi')
assert.doesNotMatch(disclosure, /setOpened\(false\)/, 'menutup panel tidak boleh membuang state di dalamnya')
assert.match(disclosure, /\{opened \? children : null\}/, 'anak dirender hanya setelah dibuka')
assert.match(disclosure, /\{summary\}/, 'summary selalu dirender agar panel dapat dibuka')
assert.match(disclosure, /onToggle\?\.\(event\)/, 'onToggle milik pemanggil tetap dipanggil')

// ── Body Exposure ──
// Tidak ada impor statis: penjelajah lama tidak ikut chunk awal Body Exposure.
assert.doesNotMatch(os, /^import\s+\{[^}]*\bBodyExplorer\b[^}]*\}\s+from\s+'\.\/BodyExplorer'/m, 'BodyExplorer tidak boleh diimpor statis')
assert.match(os, /const BodyExplorer = lazy\(\(\) => import\('\.\/BodyExplorer'\)/, 'BodyExplorer harus dimuat lazy')
assert.equal((os.match(/<BodyExplorer\b/g) ?? []).length, 1, 'BodyExplorer hanya dirender di satu tempat')
const labs = os.match(/<OnDemandDisclosure([\s\S]*?)<\/OnDemandDisclosure>/)
assert.ok(labs, 'panel Deep reference labs harus memakai OnDemandDisclosure')
assert.match(labs![1], /<BodyExplorer \/>/, 'BodyExplorer harus berada di dalam panel on-demand')
assert.match(labs![1], /Deep reference labs/, 'kemampuan penjelajah lama tetap tersedia sesuai permintaan')
// Kegagalan chunk setelah ditunda terkurung di panel ini, bukan menjatuhkan seluruh aplikasi.
assert.match(labs![1], /<FeatureErrorBoundary featureName="Deep reference labs">/, 'galat muat panel harus terkurung')
assert.match(labs![1], /<Suspense fallback=/, 'pemuatan harus punya fallback status')
// Kontrak lama: proyektor tetap pengalaman utama sebelum penjelajah lama.
assert.ok(os.indexOf('<UnifiedHumanSimulationProjector') < os.indexOf('<BodyExplorer'), 'proyektor harus tetap sebelum penjelajah lama')
// Pasangan negatif: tak ada <details> mentah yang membungkus viewer 3D.
assert.doesNotMatch(os, /<details[^>]*body-exposure-os__labs/, 'panel labs tidak boleh kembali menjadi <details> mentah')

// ── Frontier Health ──
assert.equal((discovery.match(/<OnDemandDisclosure\b/g) ?? []).length, 2, 'kedua jembatan visual 3D harus on-demand')
assert.doesNotMatch(discovery, /<details\b/, 'tidak ada <details> mentah yang membungkus lab 3D')
for (const lab of ['SynapseMicro3DLab', 'MentalStateCircuit3DLab']) {
  const blok = discovery.match(new RegExp(`<OnDemandDisclosure[\\s\\S]*?<${lab} />[\\s\\S]*?</OnDemandDisclosure>`))
  assert.ok(blok, `${lab} harus dirender di dalam OnDemandDisclosure`)
}

console.log('on-demand 3D: viewer WebGL di panel tertutup tidak dipasang sampai dibuka, dan galat muatnya terkurung')
