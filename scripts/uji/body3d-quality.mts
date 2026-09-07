import assert from 'node:assert/strict'
import { BODY3D_MAX_DPR, BODY3D_MAX_RENDER_PIXELS, body3dPixelRatio } from '../../src/lib/body3dQuality.ts'

assert.equal(BODY3D_MAX_DPR, 2)
assert.equal(BODY3D_MAX_RENDER_PIXELS, 4_500_000)

// iPhone-width viewer: tetap Retina 2x walaupun device DPR lebih tinggi.
assert.equal(body3dPixelRatio(390, 574, 3), 2)
// Tablet Retina masih berada di bawah anggaran fill-rate.
assert.equal(body3dPixelRatio(1024, 768, 2), 2)
// Desktop besar menurunkan supersampling secara bertahap, bukan kualitas CSS.
const desktop = body3dPixelRatio(1440, 900, 2)
assert.ok(desktop > 1.8 && desktop < 1.9, `unexpected desktop DPR ${desktop}`)
// CSS 4K tidak pernah diturunkan di bawah native 1x.
assert.equal(body3dPixelRatio(3840, 2160, 2), 1)
// Input tidak valid harus fail-safe, bukan menghasilkan NaN/Infinity.
assert.equal(body3dPixelRatio(0, 0, Number.NaN), 1)

console.log('Body3D quality: adaptive Retina/4K pixel budget is deterministic')
