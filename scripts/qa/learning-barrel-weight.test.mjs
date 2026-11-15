// Penjaga berat: latihan mengingat (self-check) di panggung Fisiologi memakai domain belajar lewat
// src/domains/prometheus-learning/index.ts. Barrel itu (lewat catalog.ts) mengimpor barrel biological-concept-graph, yang
// mengekspor lima spesifikasi data konsep (~35 kB terminifikasi). Tiap spesifikasi membangun simpulnya dengan pembantu
// `n(...)` yang menyebar argumennya; tanpa anotasi @__NO_SIDE_EFFECTS__ Rollup menganggap panggilan itu berefek samping
// dan menaruh KELIMA spesifikasi di setiap bundel importir — terukur: chunk penjelajah fisiologi 110 → 151 kB.
// Uji ini memakai Rollup lewat API build Vite (pemecah chunk yang sama dengan produksi), bukan esbuild.
import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('../..', import.meta.url))
const EXTERNAL = /^(three|react|react-dom|react-router-dom)(\/|$)/
const SPECS = ['cardiovascularSpec', 'neuromuscularSpec', 'pulmonarySpec', 'renalSpec', 'subcellularEnergeticsAutophagySpec']
  .map((name) => `src/domains/biological-concept-graph/data/${name}.ts`)
const RECALL = 'src/domains/prometheus-learning/engine/recall.ts'
const ARENA_UI = 'src/domains/prometheus-learning/ui/PrometheusArenaView.tsx'

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
  return modules
}

test('ringan: penjelajah fisiologi membawa latihan mengingat tanpa spesifikasi konsep maupun arena', async () => {
  const modules = await bundle("import { SystemPhysiologyExplorer } from '/src/domains/body-exposure/ui/system-physiology/SystemPhysiologyExplorer.tsx'\nconsole.log(SystemPhysiologyExplorer)")
  assert.ok(modules.get(RECALL) > 0, 'latihan mengingat memang ada di bundel (uji ini mengukur bundel yang benar)')
  for (const spec of SPECS) assert.equal(modules.has(spec), false, `${spec} rendered ${modules.get(spec)} bytes into the physiology explorer`)
  assert.equal(modules.has(ARENA_UI), false, `${ARENA_UI} reached the physiology explorer`)
})

test('kembaran: spesifikasi yang DIPAKAI tetap ikut utuh — anotasi tidak membuang data yang dipakai', async () => {
  const modules = await bundle("import { CARDIOVASCULAR_SPEC } from '/src/domains/biological-concept-graph/index.ts'\nconsole.log(CARDIOVASCULAR_SPEC.nodes.length)")
  assert.ok(modules.get(SPECS[0]) > 4000, `cardiovascularSpec rendered ${modules.get(SPECS[0])} bytes`)
  for (const spec of SPECS.slice(1)) assert.equal(modules.has(spec), false, `${spec} tidak dipakai, tidak ikut`)
})
