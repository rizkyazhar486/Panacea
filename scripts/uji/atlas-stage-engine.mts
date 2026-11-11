// Logika murni panggung atlas Body Exposure: lapisan per kedalaman, bingkai wilayah, kebijakan pilih,
// label sisi, dan posisi lembar. Positif, negatif (ditolak bernama), batas, berpasangan, tanpa efek samping, determinisme.
import assert from 'node:assert/strict'
import { KEDALAMAN, keburaman } from '../../src/lib/dissection.ts'
import {
  ATLAS_DEPTH_ORDER, ATLAS_FRAME_LAYER, ATLAS_GHOST_FROM_DEPTH, ATLAS_MAX_DEPTH, ATLAS_SHELL_LAYER,
  formatLayerSize, isAtlasDepth, layerAtDepth, planStageLayers, plateShows, type AtlasLayerId, type StageLayerPlan,
} from '../../src/domains/body-exposure/engine/atlas-stage/stageLayers.ts'
import { describeStructure } from '../../src/domains/body-exposure/engine/atlas-stage/structureInfo.ts'
import { ATLAS_BODY_EXTENT, ATLAS_REGIONS, regionContains, regionFrame, regionFrameById } from '../../src/domains/body-exposure/engine/atlas-stage/regionFraming.ts'
import { PICK_MIN_FADE, firstPickableIndex, isPickable } from '../../src/domains/body-exposure/engine/atlas-stage/pickPolicy.ts'
import { ATLAS_MIDLINE_TOLERANCE_M, readAtlasSide, sideFromCentreX } from '../../src/domains/body-exposure/engine/atlas-stage/sideLabel.ts'
import { SHEET_SNAPS, nextSnap, sheetHeight, snapAfterDrag } from '../../src/domains/body-exposure/engine/atlas-stage/sheetSnap.ts'
import { ATLAS_SIDE_LABEL_REVIEW } from '../../src/domains/body-exposure/data/atlasSideLabelReview.ts'
import { viewPose } from '../../src/domains/body-exposure/engine/cameraViews.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const rencana = (r: StageLayerPlan) => { assert.ok(r.ok, `rencana ditolak: ${r.ok ? '' : r.error}`); return r as Extract<StageLayerPlan, { ok: true }> }
const SEMUA: AtlasLayerId[] = ['surface', 'muscular', 'cardiovascular', 'nervous', 'lymphoid', 'visceral', 'skeletal']

// ── urutan: SATU sumber, yaitu lib/dissection ──
gagal('urutan-berasal-dari-kedalaman-diseksi', () => {
  assert.deepEqual([...ATLAS_DEPTH_ORDER], SEMUA)
  assert.deepEqual(ATLAS_DEPTH_ORDER.map((l) => KEDALAMAN[l]), [0, 1, 2, 3, 4, 5, 6])
  assert.equal(ATLAS_MAX_DEPTH, 6)
  assert.equal(ATLAS_SHELL_LAYER, 'surface'); assert.equal(ATLAS_FRAME_LAYER, 'skeletal')
})

// ── kedalaman sah: bilangan bulat 0..6 ──
for (const d of [0, 1, 2, 3, 4, 5, 6]) gagal(`kedalaman-sah:${d}`, () => { assert.equal(isAtlasDepth(d), true); assert.equal(layerAtDepth(d), SEMUA[d]) })
for (const d of [-1, 7, 0.5, 6.0001, Number.NaN, Infinity, -Infinity, '3', null, undefined, true, [2]])
  gagal(`kedalaman-ditolak:${String(d)}`, () => { assert.equal(isAtlasDepth(d), false); assert.equal(layerAtDepth(d as number), null) })
gagal('batas-kedalaman', () => { assert.equal(isAtlasDepth(0), true); assert.equal(isAtlasDepth(-1), false); assert.equal(isAtlasDepth(6), true); assert.equal(isAtlasDepth(7), false) })

// ── kulit menutup semuanya: yang tak terlihat tidak dipasang ──
gagal('kedalaman-0-hanya-kulit-di-kedua-mode', () => {
  for (const mode of ['focus', 'peeled'] as const) {
    const p = rencana(planStageLayers({ depth: 0, mode }))
    assert.deepEqual(p.mount, ['surface']); assert.deepEqual(p.solid, ['surface']); assert.deepEqual(p.ghost, []); assert.equal(p.dissect, 0); assert.equal(p.focus, 'surface')
  }
  assert.deepEqual(rencana(planStageLayers({ depth: 0, mode: 'peeled' })).occluded, SEMUA.slice(1), 'mode kupas: enam lapisan di balik kulit tidak dipasang')
  assert.deepEqual(rencana(planStageLayers({ depth: 0, mode: 'focus' })).occluded, [])
})
gagal('kulit-dipaksa-tampil-tetap-menutup-lapisan-lain', () => {
  const p = rencana(planStageLayers({ depth: 3, mode: 'peeled', overrides: { surface: true } }))
  assert.deepEqual(p.mount, ['surface']); assert.equal(p.dissect, 0)
  assert.deepEqual(p.occluded, ['nervous', 'lymphoid', 'visceral', 'skeletal'])
})

// ── mode kupas: semua pada/di bawah kedalaman ──
gagal('kupas-kedalaman-1-tanpa-kulit-hantu', () => {
  const p = rencana(planStageLayers({ depth: 1, mode: 'peeled' }))
  assert.deepEqual(p.solid, SEMUA.slice(1)); assert.deepEqual(p.ghost, []); assert.deepEqual(p.mount, SEMUA.slice(1)); assert.equal(p.dissect, 1); assert.equal(p.focus, 'muscular')
})
for (const d of [2, 3, 4, 5, 6]) gagal(`kupas-kedalaman-${d}-dengan-kulit-hantu`, () => {
  const p = rencana(planStageLayers({ depth: d, mode: 'peeled' }))
  assert.deepEqual(p.solid, SEMUA.slice(d)); assert.deepEqual(p.ghost, ['surface']); assert.deepEqual(p.mount, ['surface', ...SEMUA.slice(d)]); assert.equal(p.dissect, d)
})
// ── mode fokus: lapisan itu + rangka ──
gagal('fokus-kedalaman-1', () => { const p = rencana(planStageLayers({ depth: 1, mode: 'focus' })); assert.deepEqual(p.solid, ['muscular', 'skeletal']); assert.deepEqual(p.ghost, []); assert.equal(p.dissect, 1) })
gagal('fokus-kedalaman-2', () => { const p = rencana(planStageLayers({ depth: 2, mode: 'focus' })); assert.deepEqual(p.solid, ['cardiovascular', 'skeletal']); assert.deepEqual(p.mount, ['surface', 'cardiovascular', 'skeletal']); assert.equal(p.dissect, 2) })
gagal('fokus-kedalaman-5', () => { const p = rencana(planStageLayers({ depth: 5, mode: 'focus' })); assert.deepEqual(p.solid, ['visceral', 'skeletal']); assert.equal(p.focus, 'visceral') })
gagal('fokus-kedalaman-6-rangka-saja', () => { const p = rencana(planStageLayers({ depth: 6, mode: 'focus' })); assert.deepEqual(p.solid, ['skeletal']); assert.deepEqual(p.mount, ['surface', 'skeletal']) })
gagal('pelat-fokus-tidak-menyertakan-rangka-di-kulit', () => { assert.equal(plateShows('skeletal', 0, 'focus'), false); assert.equal(plateShows('skeletal', 1, 'focus'), true); assert.equal(plateShows('nervous', 2, 'focus'), false); assert.equal(plateShows('nervous', 2, 'peeled'), true) })

// ── penimpaan pribadi ──
gagal('sembunyikan-rangka-di-mode-fokus', () => { const p = rencana(planStageLayers({ depth: 5, mode: 'focus', overrides: { skeletal: false } })); assert.deepEqual(p.solid, ['visceral']) })
gagal('tampilkan-lapisan-lebih-dangkal-menurunkan-diseksi-dan-melepas-hantu', () => {
  const p = rencana(planStageLayers({ depth: 3, mode: 'focus', overrides: { muscular: true } }))
  assert.deepEqual(p.solid, ['muscular', 'nervous', 'skeletal']); assert.equal(p.dissect, 1); assert.deepEqual(p.ghost, [], 'kulit 0,45 akan menutupi otot, jadi tidak dipasang')
})
gagal('kulit-disembunyikan-tidak-menjadi-hantu', () => { const p = rencana(planStageLayers({ depth: 4, mode: 'peeled', overrides: { surface: false } })); assert.deepEqual(p.ghost, []); assert.deepEqual(p.mount, ['lymphoid', 'visceral', 'skeletal']) })
gagal('semua-disembunyikan-rencana-kosong-tetap-sah', () => {
  const p = rencana(planStageLayers({ depth: 6, mode: 'focus', overrides: { skeletal: false, surface: false } }))
  assert.deepEqual(p.mount, []); assert.deepEqual(p.solid, []); assert.equal(p.dissect, 6)
})
// berpasangan: hanya penimpaan kulit yang berbeda
gagal('berpasangan-hantu-kulit', () => {
  assert.deepEqual(rencana(planStageLayers({ depth: 4, mode: 'focus' })).ghost, ['surface'])
  assert.deepEqual(rencana(planStageLayers({ depth: 4, mode: 'focus', overrides: { surface: false } })).ghost, [])
})

// ── invarian terhadap penampil: yang padat benar-benar buram penuh, hantu benar-benar samar ──
gagal('diseksi-membuat-padat-buram-penuh-dan-hantu-di-lantai', () => {
  for (const mode of ['focus', 'peeled'] as const) for (let d = 0; d <= 6; d += 1) {
    const p = rencana(planStageLayers({ depth: d, mode }))
    for (const l of p.solid) assert.equal(keburaman(l, p.dissect), 1, `${mode}/${d}: ${l} harus buram penuh`)
    for (const l of p.ghost) assert.equal(keburaman(l, p.dissect), 0.06, `${mode}/${d}: ${l} harus samar`)
    assert.equal(new Set(p.mount).size, p.mount.length, 'tidak ada lapisan dipasang dua kali')
    assert.deepEqual(p.mount, [...p.ghost, ...p.solid])
  }
  assert.equal(ATLAS_GHOST_FROM_DEPTH, 2); assert.ok(Math.abs(keburaman('surface', 1) - 0.45) < 1e-12, 'satu langkah lebih dangkal kulit masih 0,45: itu alasan ambangnya 2')
})

// ── penolakan bernama ──
for (const d of [-1, 7, 2.5, Number.NaN, Infinity]) gagal(`rencana-menolak-kedalaman:${d}`, () => assert.deepEqual(planStageLayers({ depth: d, mode: 'focus' }), { ok: false, error: 'invalid-depth' }))
gagal('rencana-menolak-mode', () => assert.deepEqual(planStageLayers({ depth: 2, mode: 'xray' as never }), { ok: false, error: 'invalid-mode' }))
gagal('rencana-menolak-lapisan-tak-dikenal', () => assert.deepEqual(planStageLayers({ depth: 2, mode: 'focus', overrides: { fascia: true } as never }), { ok: false, error: 'unknown-layer' }))
gagal('rencana-menolak-penimpaan-bukan-boolean', () => assert.deepEqual(planStageLayers({ depth: 2, mode: 'focus', overrides: { skeletal: 'yes' } as never }), { ok: false, error: 'invalid-override' }))
gagal('berpasangan-penimpaan-sah-diterima', () => assert.ok(planStageLayers({ depth: 2, mode: 'focus', overrides: { skeletal: true } }).ok))
gagal('kunci-warisan-objek-bukan-lapisan', () => assert.deepEqual(planStageLayers({ depth: 2, mode: 'focus', overrides: { toString: true } as never }), { ok: false, error: 'unknown-layer' }))
gagal('rencana-tidak-mengubah-masukan-dan-deterministik', () => {
  const o = Object.freeze({ muscular: true, skeletal: false }); const req = Object.freeze({ depth: 3, mode: 'peeled' as const, overrides: o })
  const a = planStageLayers(req); const b = planStageLayers(req); assert.deepEqual(a, b); assert.deepEqual(o, { muscular: true, skeletal: false })
})

// ── wilayah ──
gagal('tujuh-wilayah-dengan-id-unik', () => {
  assert.deepEqual(ATLAS_REGIONS.map((r) => r.id), ['all', 'head-neck', 'thorax', 'abdomen', 'pelvis', 'upper-limb', 'lower-limb'])
  for (const r of ATLAS_REGIONS) { assert.ok(r.label.length > 0); assert.ok(r.y[1] > r.y[0]); assert.ok(r.y[0] >= ATLAS_BODY_EXTENT.floorY && r.y[1] <= ATLAS_BODY_EXTENT.vertexY + 0.01, `${r.id} di luar tubuh`); assert.ok(r.halfWidthX > 0 && r.halfWidthX <= 0.4) }
})
gagal('bingkai-seluruh-tubuh-tepat', () => {
  const r = regionFrameById('all'); assert.ok(r.ok)
  if (r.ok) { assert.deepEqual(r.frame.center, [0, 0.8715, -0.0010000000000000009]); assert.deepEqual(r.frame.size, [0.68, 1.743, 0.294]); assert.equal(r.frame.view, 'anterior') }
})
gagal('bingkai-toraks-tepat', () => { const r = regionFrameById('thorax'); assert.ok(r.ok); if (r.ok) { assert.equal(r.frame.center[1], 1.325); assert.ok(Math.abs(r.frame.size[1] - 0.25) < 1e-12); assert.equal(r.frame.size[0], 0.4) } })
gagal('urutan-kepala-ke-kaki', () => {
  const pusat = (id: string) => { const r = regionFrameById(id); assert.ok(r.ok); return r.ok ? r.frame.center[1] : NaN }
  assert.ok(pusat('head-neck') > pusat('thorax') && pusat('thorax') > pusat('abdomen') && pusat('abdomen') > pusat('pelvis') && pusat('pelvis') > pusat('lower-limb'))
})
gagal('wilayah-tak-dikenal-ditolak', () => { assert.deepEqual(regionFrameById('tail'), { ok: false, error: 'unknown-region' }); assert.deepEqual(regionFrameById(''), { ok: false, error: 'unknown-region' }) })
for (const [nama, r] of [
  ['terbalik', { id: 'x', label: 'x', y: [1, 0.5], halfWidthX: 0.1, view: 'anterior' }],
  ['nol-tinggi', { id: 'x', label: 'x', y: [1, 1], halfWidthX: 0.1, view: 'anterior' }],
  ['lebar-nol', { id: 'x', label: 'x', y: [0, 1], halfWidthX: 0, view: 'anterior' }],
  ['nan', { id: 'x', label: 'x', y: [0, Number.NaN], halfWidthX: 0.1, view: 'anterior' }],
  ['tak-hingga', { id: 'x', label: 'x', y: [0, 1], halfWidthX: Infinity, view: 'anterior' }],
] as const) gagal(`jendela-ditolak:${nama}`, () => assert.deepEqual(regionFrame(r as never), { ok: false, error: 'invalid-window' }))
gagal('berpasangan-jendela-sah', () => assert.ok(regionFrame({ id: 'x', label: 'x', y: [0, 1], halfWidthX: 0.1, view: 'anterior' }).ok))
gagal('isi-wilayah-batas-inklusif', () => {
  const t = ATLAS_REGIONS.find((r) => r.id === 'thorax')!
  assert.equal(regionContains(t, 0, 1.2), true); assert.equal(regionContains(t, 0, 1.45), true); assert.equal(regionContains(t, 0, 1.199), false); assert.equal(regionContains(t, 0, 1.451), false)
  assert.equal(regionContains(t, 0.2, 1.3), true); assert.equal(regionContains(t, -0.2, 1.3), true); assert.equal(regionContains(t, 0.201, 1.3), false)
  assert.equal(regionContains(t, Number.NaN, 1.3), false); assert.equal(regionContains(t, 0, Infinity), false)
})
// setiap bingkai harus menghasilkan pose kamera sah untuk layar potret maupun lanskap, dan muat penuh
gagal('setiap-wilayah-memberi-pose-kamera-yang-memuat-kotaknya', () => {
  for (const reg of ATLAS_REGIONS) for (const aspek of [390 / 520, 1, 1440 / 800]) {
    const f = regionFrame(reg); assert.ok(f.ok); if (!f.ok) continue
    const pose = viewPose(f.frame.view, f.frame.center, f.frame.size, 35, aspek)
    assert.ok(pose, `${reg.id}@${aspek}`); if (!pose) continue
    const jarak = pose.position[2] - f.frame.center[2] - f.frame.size[2] / 2
    const tinggiTerlihat = 2 * jarak * Math.tan((35 * Math.PI) / 360); const lebarTerlihat = tinggiTerlihat * aspek
    assert.ok(tinggiTerlihat >= f.frame.size[1] * 1.149, `${reg.id}@${aspek}: tinggi terpotong`)
    assert.ok(lebarTerlihat >= f.frame.size[0] * 1.149, `${reg.id}@${aspek}: lebar terpotong`)
  }
})

// ── kebijakan pilih ──
gagal('ambang-pudar', () => assert.equal(PICK_MIN_FADE, 0.5))
gagal('terlihat-dan-utuh-boleh-dipilih', () => { assert.equal(isPickable({ visible: true, opacity: 1, baseOpacity: 1 }), true); assert.equal(isPickable({ visible: true, opacity: 0.9, baseOpacity: 0.9 }), true) })
gagal('batas-pudar-tepat', () => { assert.equal(isPickable({ visible: true, opacity: 0.5, baseOpacity: 1 }), true); assert.equal(isPickable({ visible: true, opacity: 0.4999, baseOpacity: 1 }), false); assert.equal(isPickable({ visible: true, opacity: 0.45, baseOpacity: 1 }), false); assert.equal(isPickable({ visible: true, opacity: 0.06, baseOpacity: 1 }), false) })
gagal('sinar-x-diukur-terhadap-opasitas-dasarnya-sendiri', () => { assert.equal(isPickable({ visible: true, opacity: 0.252, baseOpacity: 0.252 }), true); assert.equal(isPickable({ visible: true, opacity: 0.252 * 0.45, baseOpacity: 0.252 }), false) })
gagal('tersembunyi-tidak-boleh-dipilih', () => assert.equal(isPickable({ visible: false, opacity: 1, baseOpacity: 1 }), false))
for (const [nama, c] of [['opasitas-nan', { visible: true, opacity: Number.NaN, baseOpacity: 1 }], ['dasar-nol', { visible: true, opacity: 0, baseOpacity: 0 }], ['dasar-nol-opasitas-positif', { visible: true, opacity: 0.3, baseOpacity: 0 }], ['dasar-negatif', { visible: true, opacity: 1, baseOpacity: -1 }], ['dasar-tak-hingga', { visible: true, opacity: 1, baseOpacity: Infinity }], ['opasitas-negatif', { visible: true, opacity: -0.5, baseOpacity: 1 }], ['visible-bukan-boolean', { visible: 1 as never, opacity: 1, baseOpacity: 1 }]] as const)
  gagal(`pilih-ditolak:${nama}`, () => assert.equal(isPickable(c), false))
gagal('indeks-pertama-melewati-hantu-dan-tersembunyi', () => {
  const hantu = { visible: true, opacity: 0.06, baseOpacity: 1 }; const sembunyi = { visible: false, opacity: 1, baseOpacity: 1 }; const otot = { visible: true, opacity: 1, baseOpacity: 1 }
  assert.equal(firstPickableIndex([hantu, sembunyi, otot, otot]), 2); assert.equal(firstPickableIndex([otot, hantu]), 0)
  assert.equal(firstPickableIndex([hantu, sembunyi]), -1); assert.equal(firstPickableIndex([]), -1)
})

// ── label sisi ──
gagal('sisi-dari-nama', () => {
  assert.deepEqual(readAtlasSide('Femur.l'), { base: 'Femur', side: 'left', review: null })
  assert.deepEqual(readAtlasSide('rectus femoris muscle.r'), { base: 'Rectus femoris muscle', side: 'right', review: null })
  assert.deepEqual(readAtlasSide('Liver'), { base: 'Liver', side: null, review: null })
  assert.deepEqual(readAtlasSide('Atlas (C1)'), { base: 'Atlas (C1)', side: null, review: null })
})
gagal('label-yang-ditinjau-tidak-menyatakan-sisi', () => {
  assert.deepEqual(readAtlasSide('Eyelashes.l'), { base: 'Eyelashes', side: null, review: 'swapped' })
  assert.deepEqual(readAtlasSide('Eyelashes.r'), { base: 'Eyelashes', side: null, review: 'swapped' })
  assert.deepEqual(readAtlasSide('Vagus nerve (X).r'), { base: 'Vagus nerve (X)', side: null, review: 'inconclusive' })
})
gagal('berpasangan-saraf-vagus-kiri-tetap-menyatakan-sisi', () => assert.deepEqual(readAtlasSide('Vagus nerve (X).l'), { base: 'Vagus nerve (X)', side: 'left', review: null }))
gagal('daftar-tinjauan-tepat-tiga', () => assert.deepEqual(Object.keys(ATLAS_SIDE_LABEL_REVIEW).sort(), ['Eyelashes.l', 'Eyelashes.r', 'Vagus nerve (X).r']))
gagal('nama-kosong-atau-bukan-teks-tidak-melempar', () => { for (const n of ['', '   ', null, undefined, 5, {}]) assert.deepEqual(readAtlasSide(n as never), { base: '', side: null, review: null }) })
gagal('akhiran-lain-bukan-sisi', () => { assert.equal(readAtlasSide('Body of stomach.j').side, null); assert.equal(readAtlasSide('Fornix of stomach.t').side, null); assert.equal(readAtlasSide('Femur.L').side, null) })
gagal('kunci-warisan-bukan-tinjauan', () => assert.deepEqual(readAtlasSide('constructor.l'), { base: 'Constructor', side: 'left', review: null }))
gagal('sisi-dari-geometri', () => {
  assert.equal(sideFromCentreX(0.09), 'left'); assert.equal(sideFromCentreX(-0.09), 'right'); assert.equal(sideFromCentreX(0), 'midline')
  assert.equal(sideFromCentreX(ATLAS_MIDLINE_TOLERANCE_M), 'left'); assert.equal(sideFromCentreX(ATLAS_MIDLINE_TOLERANCE_M - 1e-9), 'midline'); assert.equal(sideFromCentreX(-ATLAS_MIDLINE_TOLERANCE_M), 'right')
  for (const x of [Number.NaN, Infinity, -Infinity]) assert.equal(sideFromCentreX(x), null)
  assert.equal(sideFromCentreX(0.1, -1), null); assert.equal(sideFromCentreX(0.1, Number.NaN), null)
})

// ── uraian struktur: hanya dari namanya ──
gagal('uraian-struktur-dari-nama', () => {
  assert.deepEqual(describeStructure('Femur.l', 'skeletal'), { meshName: 'Femur.l', layerId: 'skeletal', cleanName: 'Femur', kind: 'a bone — structural support, a lever for muscles, and a store of calcium', side: 'left', sideReview: null })
  const otot = describeStructure('Rectus femoris muscle.r', 'muscular'); assert.equal(otot.side, 'right'); assert.match(otot.kind, /^a skeletal muscle/)
  assert.deepEqual(describeStructure('Greater omentum', null), { meshName: 'Greater omentum', layerId: null, cleanName: 'Greater omentum', kind: 'an anatomical structure in the human body', side: null, sideReview: null })
})
gagal('uraian-struktur-menahan-sisi-yang-ditinjau', () => { const d = describeStructure('Eyelashes.l', 'surface'); assert.equal(d.side, null); assert.equal(d.sideReview, 'swapped'); assert.equal(d.cleanName, 'Eyelashes') })
gagal('uraian-struktur-nama-kosong-tidak-mengarang', () => { for (const n of ['', null, undefined, 7]) assert.deepEqual(describeStructure(n as never, null), { meshName: '', layerId: null, cleanName: '', kind: '', side: null, sideReview: null }) })
gagal('uraian-struktur-deterministik', () => assert.deepEqual(describeStructure('Kidney.l', 'visceral'), describeStructure('Kidney.l', 'visceral')))

// ── lembar ponsel ──
gagal('tinggi-lembar', () => {
  assert.equal(sheetHeight('peek', 600, 150), 150); assert.equal(sheetHeight('half', 600, 150), 336); assert.equal(sheetHeight('full', 600, 150), 540)
  assert.ok((sheetHeight('full', 600, 150) as number) < 600, 'tubuh harus tetap terlihat di atas lembar')
  assert.equal(sheetHeight('half', 200, 150), 150, 'tidak pernah lebih pendek dari intip')
})
for (const [nama, a] of [['panggung-nol', ['half', 0, 150]], ['panggung-nan', ['half', Number.NaN, 150]], ['intip-nol', ['half', 600, 0]], ['intip-melebihi-panggung', ['half', 600, 600]], ['intip-negatif', ['peek', 600, -5]], ['posisi-tak-dikenal', ['open', 600, 150]]] as const)
  gagal(`tinggi-lembar-ditolak:${nama}`, () => assert.equal(sheetHeight(a[0] as never, a[1], a[2]), null))
gagal('tombol-pegangan-berputar', () => { assert.deepEqual(SHEET_SNAPS, ['peek', 'half', 'full']); assert.equal(nextSnap('peek'), 'half'); assert.equal(nextSnap('half'), 'full'); assert.equal(nextSnap('full'), 'peek'); assert.equal(nextSnap('open' as never), 'peek') })
gagal('seret-ke-posisi-terdekat', () => {
  assert.equal(snapAfterDrag('peek', 20, 600, 150), 'peek'); assert.equal(snapAfterDrag('peek', 120, 600, 150), 'half'); assert.equal(snapAfterDrag('peek', 330, 600, 150), 'full')
  assert.equal(snapAfterDrag('full', -40, 600, 150), 'full'); assert.equal(snapAfterDrag('full', -150, 600, 150), 'half'); assert.equal(snapAfterDrag('full', -500, 600, 150), 'peek')
  assert.equal(snapAfterDrag('half', 0, 600, 150), 'half')
})
gagal('batas-tengah-seret', () => { assert.equal(snapAfterDrag('peek', 92, 600, 150), 'peek'); assert.equal(snapAfterDrag('peek', 94, 600, 150), 'half') })
gagal('seret-tak-sah-tetap-di-tempat', () => { assert.equal(snapAfterDrag('half', Number.NaN, 600, 150), 'half'); assert.equal(snapAfterDrag('half', 100, 0, 150), 'half'); assert.equal(snapAfterDrag('open' as never, 100, 0, 150), 'peek') })

// ── ukuran berkas ──
gagal('format-ukuran', () => { assert.equal(formatLayerSize(998_480), '1.0 MB'); assert.equal(formatLayerSize(12_344_948), '12 MB'); assert.equal(formatLayerSize(5_636_668), '5.6 MB'); assert.equal(formatLayerSize(9_999_999), '10.0 MB'); assert.equal(formatLayerSize(10_000_000), '10 MB') })
gagal('ukuran-tak-diketahui-bukan-nol', () => { for (const b of [0, -1, Number.NaN, Infinity]) assert.equal(formatLayerSize(b), 'size unknown') })

console.log(`atlas-stage engine: ${ATLAS_DEPTH_ORDER.length} depths from lib/dissection, ${ATLAS_REGIONS.length} regions, pick/side/sheet policies fail closed`)
