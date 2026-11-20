// Simulasi seluruh tubuh di panggung atlas: penampil menerima rencana dari simulator, kendali menampilkan angka
// simulator (bukan angka tangan), dan Body3D menyalakan anatomi lewat penjadwal bersama tanpa mengubah geometri.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NORMAL, SKENARIO, simulate } from '../../src/lib/bodySim.ts'
import { planScenarioMotion } from '../../src/domains/body-exposure/engine/body-motion/bodyMotion.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

const { build } = await import('esbuild')
const out = await build({
  stdin: {
    contents: "export { BodyExposureAtlasHome } from './src/domains/body-exposure/ui/BodyExposureAtlasHome.tsx'\nexport { SimulationDial } from './src/domains/body-exposure/ui/atlas-stage/SimulationDial.tsx'",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react-dom'], loader: { '.css': 'empty' }, logLevel: 'silent',
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/body-motion-stage.uji.mjs', out.outputFiles[0].text)
const { BodyExposureAtlasHome, SimulationDial } = await import(pathToFileURL(resolve('node_modules/.cache/body-motion-stage.uji.mjs')).href)

let diterima: Array<Record<string, unknown>> = []
const Pengganti = (props: Record<string, unknown>) => { diterima.push(props); return createElement('div', { 'data-stub-viewer': '1' }) }
const html = renderToStaticMarkup(createElement(BodyExposureAtlasHome, { Viewer: Pengganti, sendCamera: () => undefined }))
const rest = simulate(NORMAL)

gagal('penampil-menerima-rencana-istirahat-dari-simulator', () => {
  const motion = diterima[0]?.motion as { ok: boolean; scenarioKey: string; truthClass: string; readout: { cardiacOutputLMin: number } } | null
  assert.ok(motion, 'panggung harus memberi rencana gerak ke penampil')
  assert.equal(motion.ok, true); assert.equal(motion.scenarioKey, 'normal'); assert.equal(motion.truthClass, 'simulated')
  assert.equal(motion.readout.cardiacOutputLMin, rest.cardiacOutput)
})
gagal('kendali-menampilkan-angka-simulator', () => {
  assert.match(html, /data-sim-dial="normal"/)
  assert.match(html, new RegExp(`>${rest.cardiacOutput.toFixed(1)}<`), 'curah jantung tampil dari simulate(), satu desimal')
  assert.match(html, /Cardiac output/); assert.match(html, />Simulated</)
  for (const s of SKENARIO) assert.ok(html.includes(`>${s.label}</option>`), `skenario "${s.label}" hilang dari pilihan`)
  assert.equal((html.match(/<option /g) ?? []).length, SKENARIO.length, 'tidak ada skenario karangan di luar simulator')
})
gagal('lapisan-awal-kulit-menawarkan-lihat-ke-dalam', () => {
  assert.match(html, /data-sim-see-inside/, 'pada kedalaman kulit organ yang menyala belum terpasang')
})
gagal('tombol-jeda-bernama-dan-cukup-besar', () => {
  assert.match(html, /aria-label="Pause simulation"/); assert.match(html, /aria-pressed="true"/)
  assert.match(html, /aria-label="Simulation scenario"/)
})

// ── Komponen kendali sendiri: keadaan jeda, gagal tertutup, organ sudah tampak ───────────────────────
const dial = (props: Record<string, unknown>) => renderToStaticMarkup(createElement(SimulationDial, {
  scenario: 'normal', onScenario: () => undefined, running: true, onToggle: () => undefined, result: planScenarioMotion('normal'),
  compact: false, insideHidden: false, onSeeInside: () => undefined, ...props,
}))
gagal('jeda-mengganti-label-dan-status', () => {
  const h = dial({ running: false })
  assert.match(h, /aria-label="Play simulation"/); assert.match(h, /aria-pressed="false"/)
})
gagal('hasil-tak-sah-tanpa-angka-dan-tombol-mati', () => {
  const h = dial({ result: planScenarioMotion('not-a-scenario') })
  assert.match(h, /role="status"[^>]*>Simulation unavailable/); assert.doesNotMatch(h, /data-sim-readout/)
  assert.match(h, /disabled=""/); assert.doesNotMatch(h, /data-sim-see-inside/)
  assert.match(h, /data-sim-dial="unavailable"/)
})
gagal('organ-tampak-tanpa-tombol-lihat-ke-dalam', () => {
  assert.doesNotMatch(dial({ insideHidden: false }), /data-sim-see-inside/)
  assert.match(dial({ insideHidden: true }), /data-sim-see-inside/)
})
gagal('ringkas-di-ponsel-tanpa-baris-detail', () => {
  assert.doesNotMatch(dial({ compact: true }), /MAP /); assert.match(dial({ compact: false }), /MAP \d+ mmHg/)
})
gagal('skenario-olahraga-angka-sendiri', () => {
  const ex = SKENARIO.find((s) => s.key === 'exercise')!
  assert.match(dial({ scenario: 'exercise', result: planScenarioMotion('exercise') }), new RegExp(`>${simulate(ex.input).cardiacOutput.toFixed(1)}<`))
})

// ── Body3D: cahaya lewat penjadwal bersama, menghormati gerak dikurangi, tanpa ubah geometri ──────────
const body3d = readFileSync('src/components/bodyhub/Body3D.tsx', 'utf8')
const rute = readFileSync('src/app/BodyExposureAtlasRoute.tsx', 'utf8')
const kontrak = readFileSync('src/domains/body-exposure/engine/atlas-stage/viewerContract.ts', 'utf8')
gagal('body3d-menandai-mesh-setelah-material-lokal', () => {
  assert.match(body3d, /cloneLayerMaterials\(clone\)\n\s+tagMotionMeshes\(def\.key as AtlasLayerId, clone\)/)
})
gagal('body3d-cahaya-hanya-saat-gerak-tidak-dikurangi', () => {
  assert.match(body3d, /plan && !gerakDikurangi\(\) \? bodyMotionFrame\(plan,/)
})
gagal('body3d-bingkai-gerak-lewat-penjadwal-bersama', () => {
  assert.match(body3d, /else if \(bergerak\) renderScheduler\.request\(\)/)
  assert.equal((body3d.match(/requestAnimationFrame\(/g) ?? []).length, 1, 'tidak boleh ada RAF kedua untuk gerak')
})
gagal('body3d-gerak-tanpa-ubah-geometri', () => {
  const blok = body3d.slice(body3d.indexOf('const terapkanCahayaGerak'), body3d.indexOf('const renderScheduler'))
  assert.ok(blok.length > 0)
  assert.doesNotMatch(blok, /\.scale\.|\.position\.|morphTargetInfluences/, 'cahaya gerak tidak boleh menyentuh skala/posisi/morph')
})
gagal('rute-dan-kontrak-meneruskan-rencana', () => {
  assert.match(kontrak, /motion\?: BodyMotionPlan \| null/)
  assert.match(rute, /bodyMotion=\{motion \?\? null\}/)
})

console.log('body-motion-stage: OK')
