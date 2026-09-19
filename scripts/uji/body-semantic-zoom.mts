import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BODY_SEMANTIC_ZOOM_STOPS,
  bodySemanticScaleFromRelativeZoom,
  getBodySemanticZoomStop,
  isMicroscopicBodyScale,
  resolveBodySemanticRepresentation,
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

const grossOnly = {
  'whole-body': { state: 'available', sourceId: 'atlas:whole', version: '2026-09' },
  system: { state: 'available', sourceId: 'atlas:system', version: '2026-09' },
  organ: { state: 'available', sourceId: 'atlas:organ', version: '2026-09' },
} as const
assert.deepEqual(resolveBodySemanticRepresentation('genome', grossOnly), {
  requestedScale: 'genome',
  resolvedScale: 'organ',
  blocked: true,
  reason: 'missing-source-asset',
})
assert.deepEqual(resolveBodySemanticRepresentation('tissue', {
  ...grossOnly,
  tissue: { state: 'available' },
}), {
  requestedScale: 'tissue',
  resolvedScale: 'organ',
  blocked: true,
  reason: 'missing-provenance',
})
assert.deepEqual(resolveBodySemanticRepresentation('cell', {
  ...grossOnly,
  tissue: { state: 'available', sourceId: 'histology:tissue', version: 'v1' },
  cell: { state: 'available', sourceId: 'cell-atlas:cell', version: 'v2' },
}), {
  requestedScale: 'cell',
  resolvedScale: 'cell',
  blocked: false,
})
assert.deepEqual(resolveBodySemanticRepresentation('tissue', {
  ...grossOnly,
  tissue: { state: 'failed', sourceId: 'histology:tissue', version: 'v1' },
}), {
  requestedScale: 'tissue',
  resolvedScale: 'organ',
  blocked: true,
  reason: 'source-load-failed',
})

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
// 7023e43 "feat(body): expose chemistry depth across all body systems"
// (part of the universal gold-standard directive) replaced the blanket
// "No validated organ → tissue → cell → protein/pathway vertical" fail-closed
// message at the molecule scale with a real MolecularChemistryStage that
// renders verified, PubChem-linked metabolites (glucose/NAD+/NADH/ATP) for
// every system, and keeps VertikalMolekulerPanel layered on top for the
// respiratory system specifically. The vertical is no longer universally
// unregistered, so the contract now checks that the new stage is wired in
// and that it still fails closed on precision it cannot back (no invented
// 3D chemical structure without a verified identifier).
assert.match(microscope, /MolecularChemistryStage/)
const chemistryStage = readFileSync(new URL('../../src/pages/bodyhub/MolecularChemistryStage.tsx', import.meta.url), 'utf8')
assert.match(chemistryStage, /pubchemCid/,
  'molecular chemistry stage lost its verified PubChem provenance')
assert.match(chemistryStage, /not a measured patient flux/,
  'molecular chemistry stage lost its reference-vs-measured disclaimer')
assert.match(chemistryStage, /must bind to verified chemical\/protein identifiers before they are rendered as source-backed 3D/,
  'molecular chemistry stage lost its fail-closed boundary for unverified 3D structures')

console.log('body semantic zoom: camera-relative LOD switches macro anatomy toward source-aware microscopic representations without fake optical magnification')
