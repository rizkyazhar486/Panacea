import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { KELOMPOK_TULANG, TIDAK_DIBAWA, BERKAS_KERANGKA } from '../../src/lib/anatomy/rangkaKerangka'

const renderer = await readFile(new URL('../../src/pages/bodyhub/Kerangka3D.tsx', import.meta.url), 'utf8')
const panel = await readFile(new URL('../../src/pages/bodyhub/KerangkaPanel.tsx', import.meta.url), 'utf8')

assert.ok(KELOMPOK_TULANG.length >= 10, 'skeleton must expose meaningful canonical group breadth')
assert.ok(KELOMPOK_TULANG.every((group) => group.mesh.length > 0), 'every selectable skeleton group must bind named shipped meshes')
assert.ok(TIDAK_DIBAWA.length > 0, 'known source gaps must remain explicitly disclosed')
assert.match(BERKAS_KERANGKA, /\.glb$/i, 'skeleton must use a shipped GLB source')

assert.match(renderer, /muatAtlas\(BERKAS_KERANGKA\)/, 'skeleton must load the shipped source through the provenance-safe atlas loader')
assert.match(renderer, /namaAsli\.get\(n\)/, 'skeleton must recover original GLB names rather than infer sanitized laterality')
assert.match(renderer, /body3dPixelRatio/, 'skeleton renderer must bound mobile DPR')
assert.match(renderer, /Raycaster/, 'source-backed skeleton must remain interactive')
assert.doesNotMatch(renderer, /new THREE\.(BoxGeometry|CapsuleGeometry|CylinderGeometry|ConeGeometry)/, 'do not synthesize substitute bone anatomy')

assert.match(panel, /<Kerangka3D/, 'source-backed skeleton must remain reachable from its panel')
assert.match(panel, /min-h-11/, 'mobile bone controls must meet the 44px-class target floor')
assert.match(panel, /min-\[390px\]:grid-cols-2/, 'narrow mobile layout must collapse before two-column controls become safe')
assert.match(panel, /focus-visible:ring-2/, 'keyboard focus must be visible on the parallel non-canvas selection path')
assert.match(panel, /Nothing is mirrored to fill a gap/, 'source gaps must remain explicit rather than substituted')
assert.match(panel, /not imaging, not anyone's own/, 'generic source anatomy must not be represented as patient imaging')

console.log(`Skeleton source/mobile gate: ${KELOMPOK_TULANG.length} source-bound groups, explicit ${TIDAK_DIBAWA.length} gap disclosures, GLB reachability, bounded mobile rendering, 44px-class controls, and no synthetic bone substitute geometry are locked.`)
