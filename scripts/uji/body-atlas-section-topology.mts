import assert from 'node:assert/strict'
import * as THREE from 'three'
import { intersectBodyAtlasSourceMeshesWithPlane, type BodyAtlasExactSectionSegment } from '../../src/lib/bodyAtlasExactMeshSection.ts'
import { classifyBodyAtlasSectionTopology } from '../../src/lib/bodyAtlasSectionTopology.ts'

const root = new THREE.Group()
const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2))
box.userData.originalName = 'Synthetic box'
root.add(box)

const exact = intersectBodyAtlasSourceMeshesWithPlane({
  axis: 'x',
  coordinate: 0,
  candidates: [{ file: 'synthetic.glb', name: 'Synthetic box' }],
  sourceRoots: [{ file: 'synthetic.glb', root }],
})
assert.equal(exact.truncated, false)
assert.ok(exact.segments.length >= 4)

const boxTopology = classifyBodyAtlasSectionTopology(exact.segments, { sourceSectionTruncated: exact.truncated })
assert.equal(boxTopology.semantics, 'source-segment-topology-only-no-gap-closing-no-smoothing')
assert.equal(boxTopology.sourceSectionTruncated, false)
assert.equal(boxTopology.topologyTruncated, false)
assert.equal(boxTopology.inputSegmentsConsidered, exact.segments.length)
assert.equal(boxTopology.droppedDegenerateSegmentIndices.length, 0)
assert.ok(boxTopology.components.length >= 1)
assert.ok(boxTopology.components.some((component) => component.topology === 'closed-loop'))
assert.ok(boxTopology.components.every((component) => component.publishableContour === false))
assert.ok(boxTopology.components.every((component) => component.completeSourceSection === true))

function segment(index: number, start: readonly [number, number, number], end: readonly [number, number, number]): BodyAtlasExactSectionSegment {
  return {
    sourceFile: 'manual.glb',
    sourceName: 'Manual open chain',
    meshName: 'manual',
    triangleIndex: index,
    start,
    end,
    length: Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]),
  }
}

const openSegments = [
  segment(0, [0, 0, 0], [0, 1, 0]),
  segment(1, [0, 1, 0], [0, 1, 1]),
  segment(2, [0, 1, 1], [0, 0, 1]),
]
const openTopology = classifyBodyAtlasSectionTopology(openSegments)
assert.equal(openTopology.components.length, 1)
assert.equal(openTopology.components[0].topology, 'open-chain', 'A missing fourth edge must not be gap-closed into a loop')
assert.equal(openTopology.components[0].degreeOneCount, 2)
assert.equal(openTopology.components[0].publishableContour, false)

const branchedSegments = [
  segment(0, [0, 0, 0], [0, 1, 0]),
  segment(1, [0, 1, 0], [0, 2, 0]),
  segment(2, [0, 1, 0], [0, 1, 1]),
]
const branchedTopology = classifyBodyAtlasSectionTopology(branchedSegments)
assert.equal(branchedTopology.components.length, 1)
assert.equal(branchedTopology.components[0].topology, 'branched')
assert.equal(branchedTopology.components[0].maxDegree, 3)

const upstreamTruncatedTopology = classifyBodyAtlasSectionTopology(exact.segments, { sourceSectionTruncated: true })
assert.equal(upstreamTruncatedTopology.sourceSectionTruncated, true)
assert.equal(upstreamTruncatedTopology.topologyTruncated, false)
assert.ok(upstreamTruncatedTopology.components.every((component) => component.completeSourceSection === false))
assert.ok(upstreamTruncatedTopology.components.every((component) => component.publishableContour === false))

const locallyTruncatedTopology = classifyBodyAtlasSectionTopology(exact.segments, { maxSegments: 2 })
assert.equal(locallyTruncatedTopology.topologyTruncated, exact.segments.length > 2)
assert.equal(locallyTruncatedTopology.inputSegmentsConsidered, Math.min(2, exact.segments.length))
assert.ok(locallyTruncatedTopology.components.every((component) => component.completeSourceSection === false))
assert.ok(locallyTruncatedTopology.components.every((component) => component.publishableContour === false))

console.log(`body-atlas-section-topology: ok (${boxTopology.components.length} synthetic section components)`)
