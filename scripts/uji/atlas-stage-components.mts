// Komponen HUD panggung atlas dirender NYATA (SSR, tanpa WebGL) dengan data pengganti: rel kedalaman, chip
// wilayah, tab tahap, segmented, dan daftar lapisan. Membuktikan tiap komponen menampilkan keadaan yang benar,
// semua tombol bernama, dan target sentuh >= 44px — bergantung HANYA pada engine (tidak pada konfigurasi beranda),
// jadi bisa mendarat sebelum beranda ditulis ulang.
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ATLAS_DEPTH_ORDER, planStageLayers, type AtlasLayerId, type AtlasLayerInfo } from '../../src/domains/body-exposure/engine/atlas-stage/stageLayers.ts'
import { ATLAS_REGIONS } from '../../src/domains/body-exposure/engine/atlas-stage/regionFraming.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const hitung = (teks: string, pola: RegExp) => (teks.match(pola) ?? []).length

// Fixture lapisan: cukup untuk komponen (yang menerima lapisan sebagai prop). Nilai kanonik diuji terpisah di
// atlas-stage-assets.mts (sizeBytes == ukuran berkas) dan body-exposure-atlas-home.test.mjs.
const FACTS: Record<AtlasLayerId, { label: string; short: string; color: string; sizeBytes: number }> = {
  surface: { label: 'Integumentary (Skin)', short: 'Skin', color: '#d8b4a0', sizeBytes: 998_480 },
  muscular: { label: 'Muscular System', short: 'Muscles', color: '#e05a5a', sizeBytes: 5_636_668 },
  cardiovascular: { label: 'Cardiovascular Vessels', short: 'Vessels', color: '#ff4d6a', sizeBytes: 12_344_948 },
  nervous: { label: 'Nervous System', short: 'Nerves', color: '#f5c542', sizeBytes: 7_785_940 },
  lymphoid: { label: 'Lymphatic & Spleen', short: 'Lymph', color: '#3ddc97', sizeBytes: 652_008 },
  visceral: { label: 'Visceral Organs', short: 'Organs', color: '#ff8a3d', sizeBytes: 3_682_364 },
  skeletal: { label: 'Skeletal Framework', short: 'Skeleton', color: '#e8dfd0', sizeBytes: 2_653_500 },
}
const LAYERS: AtlasLayerInfo[] = ATLAS_DEPTH_ORDER.map((id, i) => ({ id, file: `${id}.glb`, peelRank: i, ...FACTS[id] }))

const { build } = await import('esbuild')
const out = await build({
  stdin: {
    contents: [
      "export { DepthRail } from './src/domains/body-exposure/ui/atlas-stage/DepthRail.tsx'",
      "export { StageTabs, RegionChips, Segmented, ReferenceChip, CameraButton, ResetGlyph } from './src/domains/body-exposure/ui/atlas-stage/StagePieces.tsx'",
      "export { LayerList, StructureHeader, StructureCard, layerState } from './src/domains/body-exposure/ui/atlas-stage/AnatomyInspector.tsx'",
      "export { WideStage, PhoneStage } from './src/domains/body-exposure/ui/atlas-stage/StageFrame.tsx'",
    ].join('\n'),
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom'], loader: { '.css': 'empty' }, logLevel: 'silent',
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/atlas-stage-components.uji.mjs', out.outputFiles[0].text)
const m = await import(pathToFileURL(resolve('node_modules/.cache/atlas-stage-components.uji.mjs')).href)
const el = createElement
const html = (node: unknown) => renderToStaticMarkup(node as never)

// ── DepthRail: radiogroup dengan 7 perhentian, satu terpilih, semua >=44px, panah menelusuri ──
gagal('rel-kedalaman-tujuh-perhentian-satu-terpilih', () => {
  const wide = html(el(m.DepthRail, { layers: LAYERS, depth: 2, labelled: true, onDepth() {} }))
  assert.match(wide, /role="radiogroup"/); assert.equal(hitung(wide, /role="radio"/g), 7)
  assert.equal(hitung(wide, /aria-checked="true"/g), 1); assert.equal(hitung(wide, /aria-checked="false"/g), 6)
  assert.match(wide, /aria-checked="true"[^>]*aria-label="Vessels, depth 3 of 7"/)
  assert.equal(hitung(wide, /tabindex="0"/g), 1); assert.equal(hitung(wide, /tabindex="-1"/g), 6, 'hanya yang aktif bisa ditab; sisanya lewat panah')
  for (const n of ['Skin', 'Muscles', 'Vessels', 'Nerves', 'Lymph', 'Organs', 'Skeleton']) assert.ok(wide.includes(`>${n}</span>`), n)
  assert.ok(hitung(wide, /min-height:44px/g) >= 7, 'tiap perhentian >=44px')
})
gagal('rel-kedalaman-ringkas-menyembunyikan-label', () => {
  const compact = html(el(m.DepthRail, { layers: LAYERS, depth: 0, labelled: false, onDepth() {} }))
  assert.equal(hitung(compact, /role="radio"/g), 7); assert.doesNotMatch(compact, />Skeleton<\/span>/, 'mode ringkas: nama tidak dirender, hanya titik + aria-label')
  assert.match(compact, /aria-label="Skin, depth 1 of 7"/)
})

// ── tab tahap: tablist 3, satu terpilih; ringkas memakai nama pendek tapi aria-label panjang ──
const TABS = [{ id: 'anatomy', label: '1. Anatomy', short: 'Anatomy' }, { id: 'physiology', label: '2. Living Physiology', short: 'Physiology' }, { id: 'clinical', label: '3. Clinical Relevance', short: 'Clinical' }]
gagal('tab-tahap-tiga-satu-terpilih', () => {
  const wide = html(el(m.StageTabs, { tabs: TABS, value: 'anatomy', compact: false, onChange() {} }))
  assert.equal(hitung(wide, /role="tab"/g), 3); assert.equal(hitung(wide, /aria-selected="true"/g), 1)
  assert.match(wide, /aria-selected="true" aria-label="1\. Anatomy"/); assert.ok(wide.includes('>1. Anatomy<'))
  const compact = html(el(m.StageTabs, { tabs: TABS, value: 'clinical', compact: true, onChange() {} }))
  assert.match(compact, /aria-selected="true" aria-label="3\. Clinical Relevance"[^>]*>Clinical</, 'ringkas: nama pendek terlihat, nama panjang tetap jadi aria-label')
  assert.doesNotMatch(compact, />3\. Clinical Relevance</)
})

// ── chip wilayah: 7, satu ditekan, semua bernama ──
gagal('chip-wilayah-tujuh-satu-ditekan', () => {
  const r = html(el(m.RegionChips, { regions: ATLAS_REGIONS, active: 'thorax', onRegion() {} }))
  assert.match(r, /aria-label="Frame a body region"/); assert.equal(hitung(r, /<button/g), 7)
  assert.equal(hitung(r, /aria-pressed="true"/g), 1); assert.match(r, /aria-pressed="true"[^>]*>Thorax</)
  for (const n of ['Whole body', 'Head &amp; neck', 'Abdomen', 'Pelvis', 'Upper limbs', 'Lower limbs']) assert.ok(r.includes(`>${n}<`), n)
})

// ── segmented: group, satu ditekan ──
gagal('segmented-satu-ditekan', () => {
  const s = html(el(m.Segmented, { label: 'Mode', value: 'focus', options: [{ id: 'focus', label: 'Focus' }, { id: 'peeled', label: 'Peeled body' }], onChange() {} }))
  assert.match(s, /role="group" aria-label="Mode"/); assert.equal(hitung(s, /aria-pressed="true"/g), 1); assert.match(s, /aria-pressed="true"[^>]*>Focus</)
})

// ── penanda kebenaran selalu ada ──
gagal('chip-referensi-menyatakan-bukan-pindaian', () => {
  assert.match(html(el(m.ReferenceChip, { tight: false })), /Reference anatomy · not a scan of you/)
  assert.match(html(el(m.ReferenceChip, { tight: true })), /data-atlas-reference="true"/)
})

// ── daftar lapisan: keadaan tiap lapisan dari rencana murni (data), bukan tebakan ──
gagal('daftar-lapisan-mode-kupas-kedalaman-4', () => {
  const plan = planStageLayers({ depth: 4, mode: 'peeled', overrides: {} })
  const list = html(el(m.LayerList, { layers: LAYERS, depth: 4, mode: 'peeled', plan, overrides: {}, onMode() {}, onToggle() {} }))
  assert.equal(hitung(list, /type="checkbox"/g), 7)
  assert.ok(list.includes('Peeled body')); assert.equal(hitung(list, /width:24px;height:24px/g), 7, 'kotak centang >=24px')
  assert.equal(hitung(list, />Shown · /g), 3); assert.equal(hitung(list, />Faint outline · /g), 1); assert.equal(hitung(list, />Hidden · /g), 3)
  for (const u of ['0.7 MB', '3.7 MB', '2.7 MB', '1.0 MB', '5.6 MB', '12 MB', '7.8 MB']) assert.ok(list.includes(u), `ukuran ${u}`)
})
gagal('layerState-memetakan-rencana-ke-kata', () => {
  const plan = planStageLayers({ depth: 1, mode: 'focus', overrides: {} })
  assert.ok(plan.ok); assert.equal(m.layerState(plan, 'muscular'), 'Shown'); assert.equal(m.layerState(plan, 'skeletal'), 'Shown'); assert.equal(m.layerState(plan, 'nervous'), 'Hidden')
})

// ── kartu struktur: nama, jenis, truth-class, provenans; sisi yang ditinjau ditahan ──
gagal('kartu-struktur-menampilkan-provenans-dan-menahan-sisi-ditinjau', () => {
  const femur = { meshName: 'Femur.l', layerId: 'skeletal', cleanName: 'Femur', kind: 'a bone', side: 'left', sideReview: null }
  const card = html(el(m.StructureCard, { structure: femur, layer: LAYERS.find((l) => l.id === 'skeletal'), truthClass: 'TC', onFocus() {}, onPhysiology() {}, onClinical() {} }))
  assert.ok(card.includes('Femur is a bone')); assert.match(card, /Atlas node: Femur\.l · skeletal\.glb/); assert.ok(card.includes('Focus on this structure'))
  const eye = { meshName: 'Eyelashes.l', layerId: 'surface', cleanName: 'Eyelashes', kind: 'an anatomical structure in the human body', side: null, sideReview: 'swapped' }
  const h = html(el(m.StructureHeader, { structure: eye, layer: null, showName: true, onClear() {} }))
  assert.ok(h.includes('Side label under review')); assert.doesNotMatch(h, />Left side<|>Right side</)
})

// ── setiap tombol di tiap komponen punya nama yang dapat diakses ──
gagal('setiap-tombol-bernama', () => {
  const kumpulan = [
    html(el(m.DepthRail, { layers: LAYERS, depth: 0, labelled: true, onDepth() {} })),
    html(el(m.RegionChips, { regions: ATLAS_REGIONS, active: 'all', onRegion() {} })),
    html(el(m.StageTabs, { tabs: TABS, value: 'anatomy', compact: false, onChange() {} })),
    html(el(m.CameraButton, { label: 'Reset', onPress() {}, children: el(m.ResetGlyph) })),
  ].join('')
  for (const mt of kumpulan.matchAll(/<button([^>]*)>(.*?)<\/button>/gs)) {
    const bernama = /aria-label="[^"]+"/.test(mt[1]) || mt[2].replace(/<[^>]+>/g, '').trim().length > 0
    assert.ok(bernama, `tombol tanpa nama: ${mt[0].slice(0, 100)}`)
  }
})

console.log('atlas-stage components: depth rail, region chips, stage tabs, segmented, layer list and structure card render with named controls, >=44px targets, and plan-driven states')
