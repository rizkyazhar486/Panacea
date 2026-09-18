import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BODY_SEMANTIC_ZOOM_STOPS,
  bodySemanticScaleFromRelativeZoom,
  getBodySemanticZoomStop,
  isMicroscopicBodyScale,
} from '../../src/lib/bodySemanticZoom.ts'

assert.deepEqual(BODY_SEMANTIC_ZOOM_STOPS.map((stop) => stop.id), [
  'whole-body', 'system', 'organ', 'tissue', 'cell', 'organelle', 'molecule', 'genome',
])
for (let index = 1; index < BODY_SEMANTIC_ZOOM_STOPS.length; index += 1) {
  assert.ok(BODY_SEMANTIC_ZOOM_STOPS[index].minRelativeZoom > BODY_SEMANTIC_ZOOM_STOPS[index - 1].minRelativeZoom)
}
assert.equal(bodySemanticScaleFromRelativeZoom(1), 'whole-body')
assert.equal(bodySemanticScaleFromRelativeZoom(1.5), 'system')
assert.equal(bodySemanticScaleFromRelativeZoom(3), 'organ')
assert.equal(bodySemanticScaleFromRelativeZoom(8), 'tissue')
assert.equal(bodySemanticScaleFromRelativeZoom(20), 'cell')
assert.equal(bodySemanticScaleFromRelativeZoom(45), 'organelle')
assert.equal(bodySemanticScaleFromRelativeZoom(90), 'molecule')
assert.equal(bodySemanticScaleFromRelativeZoom(140), 'genome')
assert.equal(getBodySemanticZoomStop('tissue').literalGrossSpatialContinuity, false)
assert.equal(isMicroscopicBodyScale('organ'), false)
assert.equal(isMicroscopicBodyScale('cell'), true)

const atlas = readFileSync(new URL('../../src/components/BodyAllSystems3D.tsx', import.meta.url), 'utf8')
assert.match(atlas, /fittedCameraDistance \/ cameraDistance/)
assert.match(atlas, /onSemanticZoomChange/)
assert.match(atlas, /controls\.addEventListener\('change', onControlChange\)/)
assert.match(atlas, /controls\.minDistance = Math\.max\(span \* 0\.008/)
assert.match(atlas, /semanticZoomCallbackRef\.current\?\.\(\{ scale, relativeZoom \}\)/)

const projector = readFileSync(new URL('../../src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', import.meta.url), 'utf8')
assert.match(projector, /data-semantic-scale=\{semanticZoom\.scale\}/)
assert.match(projector, /SemanticMicroscopeStage/)
assert.match(projector, /Relative zoom controls representation\/LOD; it is not optical magnification/)
assert.match(projector, /onSemanticZoomChange=\{setSemanticZoom\}/)

const microscope = readFileSync(new URL('../../src/pages/bodyhub/SemanticMicroscopeStage.tsx', import.meta.url), 'utf8')
assert.match(microscope, /must not manufacture a microscopic layer by enlarging the organ mesh/)
assert.match(microscope, /CellLab/)
assert.match(microscope, /AlphaGenomeAtlas/)
assert.match(microscope, /VertikalMolekulerPanel/)
assert.match(microscope, /No validated organ → tissue → cell → protein\/pathway vertical/)

console.log('body semantic zoom: camera-relative LOD switches macro anatomy toward source-aware microscopic representations without fake optical magnification')
