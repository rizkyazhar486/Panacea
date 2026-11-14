// Penjaga berat: daftar sistem tubuh dan jembatan fisiologinya harus bisa diimpor TANPA menyeret indeks tubuh
// hasil generate (src/lib/bodyIndex.gen.ts, ~359 kB sumber). Sebelum datanya dipindah ke
// src/domains/body-exposure/data/bodySystems.ts, mengimpor jembatan fisiologi saja menghasilkan bundle 321 kB
// (48 kB gzip); sesudahnya ~9 kB. Uji ini membundel titik masuk sungguhan dengan esbuild dan membaca metafile-nya,
// jadi impor tidak langsung (lewat berkas lain) pun tertangkap.
import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = fileURLToPath(new URL('../..', import.meta.url))
const HEAVY = 'src/lib/bodyIndex.gen.ts'
/** Batas atas bundle ringan (byte, termifikasi). Sekarang ~9 kB; indeks tubuh sendiri lebih dari 300 kB. */
const LIGHT_LIMIT_BYTES = 40_000

async function bundle(entryCode) {
  const result = await build({
    stdin: { contents: entryCode, resolveDir: root, sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true, minify: true, write: false, metafile: true, format: 'esm', platform: 'browser', logLevel: 'silent',
  })
  const inputs = Object.keys(result.metafile.inputs).map((path) => path.replaceAll('\\', '/'))
  return { inputs, bytes: result.outputFiles[0].contents.length }
}

const touches = (inputs, path) => inputs.some((input) => input.endsWith(path))

test('ringan: data sistem tubuh, jembatan fisiologi dan OS fisiologi tidak menyeret indeks tubuh', async () => {
  const { inputs, bytes } = await bundle([
    "import { BODY_SYSTEM_SOURCE_WAVE } from './src/domains/body-exposure/data/bodySystems.ts'",
    "import { BODY_SYSTEM_PHYSIOLOGY_BRIDGE } from './src/lib/bodySystemPhysiologyBridge.ts'",
    "import { WHOLE_BODY_PHYSIOLOGY_SYSTEMS } from './src/lib/wholeBodyPhysiologyOS.ts'",
    'console.log(BODY_SYSTEM_SOURCE_WAVE, BODY_SYSTEM_PHYSIOLOGY_BRIDGE, WHOLE_BODY_PHYSIOLOGY_SYSTEMS)',
  ].join('\n'))
  assert.equal(touches(inputs, HEAVY), false, `the light entry pulled ${HEAVY}: ${inputs.join(', ')}`)
  assert.ok(bytes < LIGHT_LIMIT_BYTES, `light entry bundles to ${bytes} bytes, limit ${LIGHT_LIMIT_BYTES}`)
})

/** Batas atas mesin fisiologi per sistem (byte, termifikasi). Sekarang ~95 kB, hampir semuanya teks graf edukasi. */
const ENGINE_LIMIT_BYTES = 120_000

test('ringan: mesin fisiologi per sistem (katalog, perencana, struktur → sistem) tidak menyeret indeks tubuh', async () => {
  const { inputs, bytes } = await bundle([
    "import { defaultPhysiologyCatalog } from './src/domains/body-exposure/engine/system-physiology/physiologyCatalog.ts'",
    "import { planSystemIndex } from './src/domains/body-exposure/engine/system-physiology/systemPhysiology.ts'",
    "import { systemsForStructure } from './src/domains/body-exposure/engine/system-physiology/structureSystem.ts'",
    "console.log(planSystemIndex(defaultPhysiologyCatalog()), systemsForStructure('Heart', 'cardiovascular'))",
  ].join('\n'))
  assert.equal(touches(inputs, HEAVY), false, `the system-physiology engine pulled ${HEAVY}`)
  assert.ok(bytes < ENGINE_LIMIT_BYTES, `system-physiology engine bundles to ${bytes} bytes, limit ${ENGINE_LIMIT_BYTES}`)
})

test('ringan: modul data sistem tubuh tidak mengimpor apa pun', async () => {
  const { inputs } = await bundle("import { BODY_SYSTEM_SOURCE_WAVE } from './src/domains/body-exposure/data/bodySystems.ts'\nconsole.log(BODY_SYSTEM_SOURCE_WAVE)")
  assert.deepEqual(inputs.filter((input) => input !== 'entry.ts').map((input) => input.replace(/^.*\/src\//, 'src/')), ['src/domains/body-exposure/data/bodySystems.ts'])
})

test('kembaran: resolver sumber lama MEMANG menyeret indeks tubuh — membuktikan uji di atas bisa gagal', async () => {
  const { inputs, bytes } = await bundle("import { resolveBodySystemSourceWave } from './src/lib/bodySystemSourceWave.ts'\nconsole.log(resolveBodySystemSourceWave())")
  assert.equal(touches(inputs, HEAVY), true)
  assert.ok(bytes > LIGHT_LIMIT_BYTES, `the resolver bundle is only ${bytes} bytes; the limit no longer separates light from heavy`)
})

test('kompatibel: lokasi lama tetap mengekspor data yang sama (objek yang sama, bukan salinan)', async () => {
  // Dibundel dulu: modul lib memakai impor tanpa ekstensi yang tidak bisa dimuat node apa adanya.
  const result = await build({
    stdin: {
      contents: [
        "import { BODY_SYSTEM_SOURCE_WAVE as viaOldPath } from './src/lib/bodySystemSourceWave.ts'",
        "import { BODY_SYSTEM_SOURCE_WAVE as moved } from './src/domains/body-exposure/data/bodySystems.ts'",
        'export const same = viaOldPath === moved',
        'export const ids = moved.map((system) => system.id)',
      ].join('\n'),
      resolveDir: root, sourcefile: 'entry.ts', loader: 'ts',
    },
    bundle: true, write: false, format: 'esm', platform: 'neutral', logLevel: 'silent',
  })
  const loaded = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
  assert.equal(loaded.same, true)
  assert.deepEqual(loaded.ids, [
    'cardiovascular', 'nervous', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive',
    'lymphatic-immune', 'musculoskeletal', 'sensory-ent', 'integumentary-surface',
  ])
})
