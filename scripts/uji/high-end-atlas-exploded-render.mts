import assert from 'node:assert/strict'
import { aabbIntersects } from '../../src/lib/anatomy/spatialIndex.ts'
import { PANACEA_ANATOMY_ATLAS } from '../../src/lib/anatomy/atlasRegistry.ts'
import {
  buildExplodedAtlasLayout,
  interpolateExplodedOffset,
  translateAabb,
} from '../../src/lib/anatomy/atlasExplodedLayout.ts'
import { compileAtlasRenderPlan } from '../../src/lib/anatomy/atlasRenderPlan.ts'
import { createAtlasSectionPlane } from '../../src/lib/anatomy/atlasCrossSection.ts'

const heart = PANACEA_ANATOMY_ATLAS.get('cardiovascular-heart')!
const rightLung = PANACEA_ANATOMY_ATLAS.get('resp-right-lung')!
const boundedHeart = {
  ...heart,
  spatialBounds: { min: { x: -1.2, y: -1, z: -1 }, max: { x: 0.8, y: 1, z: 1 } },
}
const boundedLung = {
  ...rightLung,
  spatialBounds: { min: { x: 0.2, y: -1.1, z: -1.2 }, max: { x: 2.2, y: 1.1, z: 1.2 } },
}

const options = {
  spacing: 3,
  hierarchyWeight: 0.2,
  collisionPadding: 0.1,
  maxRelaxationIterations: 16,
}
const layoutA = buildExplodedAtlasLayout([boundedHeart, boundedLung], options)
const layoutB = buildExplodedAtlasLayout([boundedHeart, boundedLung], options)
assert.deepEqual(layoutA, layoutB, 'Exploded layout must be deterministic for identical source bounds and options.')
assert.equal(layoutA.transforms.length, 2)

const heartTransform = layoutA.transforms.find((transform) => transform.nodeId === heart.id)!
const lungTransform = layoutA.transforms.find((transform) => transform.nodeId === rightLung.id)!
assert.notDeepEqual(heartTransform.offset, lungTransform.offset)
assert.deepEqual(interpolateExplodedOffset(heartTransform, 0), { x: 0, y: 0, z: 0 })
assert.deepEqual(interpolateExplodedOffset(heartTransform, 1), heartTransform.offset)
assert.deepEqual(interpolateExplodedOffset(heartTransform, -5), { x: 0, y: 0, z: 0 })
assert.deepEqual(interpolateExplodedOffset(heartTransform, 5), heartTransform.offset)

const explodedHeartBounds = translateAabb(boundedHeart.spatialBounds, heartTransform.offset)
const explodedLungBounds = translateAabb(boundedLung.spatialBounds, lungTransform.offset)
assert.equal(aabbIntersects(explodedHeartBounds, explodedLungBounds), false)

const educationalPlan = compileAtlasRenderPlan({
  visibleSystems: new Set(['cardiovascular', 'respiratory']),
  selectedNodeIds: new Set(['cardiovascular-heart']),
  safetyMode: 'educational-draft',
  explodedLayout: layoutA,
  explodedProgress: 1,
  sectionPlane: createAtlasSectionPlane('coronal', 0, 0.25),
})
const heartCommand = educationalPlan.nodeCommands.find((command) => command.nodeId === 'cardiovascular-heart')!
const lungCommand = educationalPlan.nodeCommands.find((command) => command.nodeId === 'resp-right-lung')!
assert.equal(heartCommand.visible, true)
assert.equal(heartCommand.selected, true)
assert.equal(heartCommand.opacity, 1)
assert.equal(heartCommand.entitlement, 'source-candidate')
assert.deepEqual(heartCommand.offset, heartTransform.offset)
assert.equal(lungCommand.visible, true)
assert.equal(lungCommand.entitlement, 'source-candidate')
assert.equal(educationalPlan.sectionPlane?.kind, 'coronal')

const verifiedPlan = compileAtlasRenderPlan({
  visibleSystems: new Set(['cardiovascular', 'respiratory']),
  selectedNodeIds: new Set(['cardiovascular-heart']),
  safetyMode: 'verified-only',
})
const verifiedHeart = verifiedPlan.nodeCommands.find((command) => command.nodeId === 'cardiovascular-heart')!
assert.equal(verifiedHeart.visible, false)
assert.equal(verifiedHeart.reviewRequired, true)
assert.ok(verifiedPlan.warnings.some((warning) => warning.includes('suppressed')))

const microPlan = compileAtlasRenderPlan({
  visibleSystems: new Set(['respiratory']),
  selectedNodeIds: new Set(['resp-alveolar-layer']),
  isolateSelection: true,
  safetyMode: 'educational-draft',
})
const alveolarCommand = microPlan.nodeCommands.find((command) => command.nodeId === 'resp-alveolar-layer')!
assert.equal(alveolarCommand.entitlement, 'conceptual-only')
assert.equal(alveolarCommand.visible, false, 'Conceptual metadata without a render binding must not fabricate gross geometry.')
assert.ok(microPlan.warnings.some((warning) => warning.includes('Conceptual microanatomy')))

console.log('High-end exploded atlas: deterministic bound-derived displacement, collision relaxation, interpolation, provenance-aware render commands, verified-only suppression, and conceptual microanatomy guards verified.')
