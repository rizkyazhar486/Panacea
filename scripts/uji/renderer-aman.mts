// Tanpa WebGL, viewer menurunkan hanya kanvasnya — bukan seluruh panel ke batas galat.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buatRendererAman } from '../../src/lib/rendererAman.ts'
assert.equal(buatRendererAman({ antialias: true }), null, 'lingkungan tanpa WebGL: null, bukan lemparan')
for (const f of ['src/pages/bodyhub/AlphaGenomeAtlas.tsx', 'src/pages/discovery/SynapseMicro3DLab.tsx', 'src/components/digital-twin/CinematicCellGenomeExplorer.tsx', 'src/components/Medical3DFrontierLab.tsx', 'src/components/PersonalBodyAvatar3D.tsx', 'src/components/dashboard/BodyExposureWidget.tsx']) {
  const s = readFileSync(f, 'utf8')
  assert.doesNotMatch(s, /new THREE\.WebGLRenderer\(/, `${f}: konstruktor tanpa penjaga`)
  assert.match(s, /buatRendererAman\([^)]*\);?\s*\n\s*if \(!renderer\)/, `${f}: hasil null harus ditangani`)
}
console.log('renderer-aman: lulus')
