import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const renderer = readFileSync(new URL('../../src/components/VolumeDicom3D.tsx', import.meta.url), 'utf8')
const panel = readFileSync(new URL('../../src/pages/bodyhub/VolumeDicomBagian.tsx', import.meta.url), 'utf8')

// The crop must happen inside the ray-caster, not by shrinking a CSS box or
// pretending that a 2D slice is a 3D cut.
assert.match(renderer, /uniform vec3 uPotongMin;/, '3D clip minimum uniform disappeared')
assert.match(renderer, /uniform vec3 uPotongMaks;/, '3D clip maximum uniform disappeared')
assert.match(renderer, /potongKotak\(vOrigin, arah\)/, 'ray is no longer intersected with the clipped volume')
assert.match(renderer, /diKotakPotong\(p\)/, 'ray samples are no longer bounded by the clipping box')
assert.match(renderer, /uPotongMaks\.value\.set/, 'live clipping no longer updates the shader without rebuilding the volume')

// All three anatomical axes must remain independently reachable on touch UI.
for (const axis of ['X', 'Y', 'Z']) {
  assert.match(panel, new RegExp(`label="${axis}"`), `${axis} clipping control disappeared`)
}
assert.match(panel, /setPotong\(\[1, 1, 1\]\)/, 'clipping reset disappeared')
assert.match(panel, /This is a crop, not segmentation\./, 'crop/segmentation boundary is no longer explicit')
assert.match(panel, /potong=\{potong\}/, 'panel controls are no longer connected to the renderer')

console.log('volume-clipping: ok')
