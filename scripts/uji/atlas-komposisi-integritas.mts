// Komposisi atlas: id ganda → definisi pertama menang; kandidat tanpa geometri di indeks → reference-only.
import assert from 'node:assert/strict'
import { integrateComposedAtlasNodes, COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import type { AtlasNode } from '../../src/lib/anatomy/atlasKernel.ts'
const dasar = COMPLETE_WHOLE_BODY_ATLAS.nodes.find((n) => n.id === 'resp:right-upper-lobar-bronchus')!
const tiruan: AtlasNode = { ...dasar, parentId: 'resp:lain', label: 'salinan' }
const hasil = integrateComposedAtlasNodes([dasar, tiruan])
assert.equal(hasil.length, 1); assert.equal(hasil[0].label, dasar.label, 'definisi pertama yang menang')
const fiktif: AtlasNode = { ...dasar, id: 'uji:fiktif', geometryStatus: 'partial', source: { mode: 'specific-fallback', files: ['cardiovascular.glb'], nodeHints: ['struktur yang tidak pernah ada xyzzy'] } }
const [d] = integrateComposedAtlasNodes([fiktif])
assert.equal(d.geometryStatus, 'reference-only', 'kandidat tanpa geometri diturunkan'); assert.equal(d.source.files, undefined)
const nyata: AtlasNode = { ...fiktif, id: 'uji:nyata', source: { ...fiktif.source, nodeHints: ['Aorta'] } }
assert.equal(integrateComposedAtlasNodes([nyata])[0].geometryStatus, 'partial', 'kandidat yang cocok tetap partial')
const ids = COMPLETE_WHOLE_BODY_ATLAS.nodes.map((n) => n.id)
assert.equal(new Set(ids).size, ids.length, 'manifes tanpa id ganda')
const turun = COMPLETE_WHOLE_BODY_ATLAS.nodes.filter((n) => n.geometryStatus === 'reference-only' && n.provenance?.sourceId === 'z-anatomy-shipped-glb-index').length
console.log(`atlas-komposisi-integritas: lulus (${turun} kandidat diturunkan ke reference-only)`)
