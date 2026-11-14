// Penjaga berat barrel body-exposure: mengimpor konstanta ringan (ATLAS_LAYERS) lewat src/domains/body-exposure/index.ts
// TIDAK boleh menyeret layar atlas (BodyExposureAtlasHome) maupun layar fisiologi per sistem yang dimuat malas darinya.
// Barrel itu juga mengekspor BodyExposureAtlasHome; bila modul layar itu punya efek samping di tingkat atas (mis.
// `new Map(...)` atau `lazy(...)` tanpa anotasi pure), Rollup tidak bisa membuangnya dari importir barrel. Sejak #3044
// itu membuat build produksi menaruh layar atlas + semua deck di chunk bersama yang ikut dimuat Body3D di /clinical-hub
// desktop: +~40 kB JS dan +3 request (ditangkap gerbang perf-audit F2, PR #3042).
// Uji ini memakai Rollup lewat API build Vite (pemecah chunk yang sama dengan produksi), bukan esbuild: esbuild
// menganggap `new Map(array)` bebas efek samping sehingga mutasi itu lolos darinya.
import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('../..', import.meta.url))
const ATLAS_SCREEN = 'src/domains/body-exposure/ui/BodyExposureAtlasHome.tsx'
const SYSTEMS_SCREEN = 'src/domains/body-exposure/ui/system-physiology/SystemPhysiologyExplorer.tsx'
const EXTERNAL = /^(three|react|react-dom|react-router-dom)(\/|$)/

/** Membundel satu titik masuk virtual; mengembalikan modul yang benar-benar menyumbang kode (bukan yang di-tree-shake habis). */
async function bundle(entryCode) {
  const result = await build({
    configFile: false, root, logLevel: 'silent', esbuild: { jsx: 'automatic' },
    plugins: [{
      name: 'entri-virtual',
      resolveId: (id) => (id === 'virtual:entri' ? '\0entri' : null),
      load: (id) => (id === '\0entri' ? entryCode : null),
    }],
    build: { write: false, minify: false, rollupOptions: { input: 'virtual:entri', external: (id) => EXTERNAL.test(id) } },
  })
  const chunks = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output).filter((o) => o.type === 'chunk')
  const modules = new Map()
  for (const chunk of chunks) {
    for (const [id, info] of Object.entries(chunk.modules)) {
      if (info.renderedLength > 0) modules.set(id.replaceAll('\\', '/').replace(/^.*?\/src\//, 'src/'), info.renderedLength)
    }
  }
  return { modules, chunkCount: chunks.length }
}

const LIGHT = "import { ATLAS_LAYERS } from '/src/domains/body-exposure/index.ts'\nconsole.log(ATLAS_LAYERS)"

test('ringan: ATLAS_LAYERS lewat barrel tidak menyeret layar atlas maupun layar fisiologi per sistem', async () => {
  const { modules, chunkCount } = await bundle(LIGHT)
  assert.equal(modules.has(ATLAS_SCREEN), false, `${ATLAS_SCREEN} rendered ${modules.get(ATLAS_SCREEN)} bytes into a barrel importer`)
  assert.equal(modules.has(SYSTEMS_SCREEN), false, `${SYSTEMS_SCREEN} reached a barrel importer`)
  // Satu chunk: tidak ada import() malas dari layar atlas yang ikut terbawa.
  assert.equal(chunkCount, 1)
})

test('kembaran: mengimpor layar atlas sendiri MEMANG membawanya beserta chunk malas fisiologi — uji di atas bisa gagal', async () => {
  const { modules, chunkCount } = await bundle("import { BodyExposureAtlasHome } from '/src/domains/body-exposure/index.ts'\nconsole.log(BodyExposureAtlasHome)")
  assert.ok(modules.get(ATLAS_SCREEN) > 0)
  assert.ok(modules.get(SYSTEMS_SCREEN) > 0)
  assert.ok(chunkCount >= 2, `expected the lazy systems chunk, got ${chunkCount} chunk(s)`)
})

test('deterministik: dua bundel barrel ringan identik', async () => {
  const a = await bundle(LIGHT)
  const b = await bundle(LIGHT)
  assert.deepEqual([...a.modules], [...b.modules])
  assert.equal(a.chunkCount, b.chunkCount)
})
