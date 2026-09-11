import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INDEKS_TUBUH } from '../../src/lib/bodyIndex.gen.ts'
import {
  filterAnatomySourceBundlesForAtlasRegion,
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
} from '../../src/lib/anatomySourceNodeRegistry.ts'
import { coupledKinematicsFor } from '../../src/lib/biomechanicsCoupling.ts'
import { WHOLE_BODY_JOINT_PROFILES } from '../../src/lib/wholeBodyBiomechanics.ts'
import type { AtlasRegionKey } from '../../src/lib/wholeBodyAtlasBlueprint.ts'

const bodyRegionsByAtlas: Record<AtlasRegionKey, readonly string[]> = {
  'head-neck': ['kepala', 'leher'],
  thorax: ['toraks'],
  abdomen: ['abdomen'],
  'pelvis-perineum': ['pelvis'],
  'upper-limb': ['bahu-lengan', 'tangan'],
  'lower-limb': ['pelvis', 'paha', 'tungkai'],
  'spine-back': ['leher', 'toraks', 'abdomen', 'pelvis'],
}

const biomechanicsFiles = new Set(['skeletal.glb', 'muscular.glb'])
const sourceBundles = getEffectiveAnatomySourceNodeSnapshot()
  .filter((bundle) => biomechanicsFiles.has(bundle.file))

let representedMotions = 0
const representedJoints = new Set<string>()
let hipPelvicSourceSeen = false

for (const joint of WHOLE_BODY_JOINT_PROFILES) {
  const regionalBundles = filterAnatomySourceBundlesForAtlasRegion(sourceBundles, joint.region)
  for (const motion of joint.motions) {
    const coupled = coupledKinematicsFor(motion.id)
    const hints = [...joint.nodeHints, ...motion.structureHints, ...(coupled?.structures ?? [])]
    const matches = resolveAllAnatomySourceNodes(hints, regionalBundles, 64)
    const names = matches.flatMap((match) => match.names)
    if (names.length) {
      representedMotions += 1
      representedJoints.add(joint.id)
    }

    for (const match of matches) {
      assert.ok(biomechanicsFiles.has(match.file), `${joint.id}/${motion.id} must stay on skeletal or muscular source bundles`)
      for (const name of match.names) {
        const rows = INDEKS_TUBUH.filter((row) => row.n === name)
        assert.ok(rows.length > 0, `${name} must retain generated source metadata`)
        assert.ok(
          rows.some((row) => bodyRegionsByAtlas[joint.region].includes(row.w)),
          `${joint.id}/${motion.id} must not resolve ${name} outside ${joint.region}`,
        )
        if (joint.id === 'hip' && rows.some((row) => row.w === 'pelvis')) hipPelvicSourceSeen = true
      }
    }
  }
}

assert.ok(representedMotions > 0, 'at least one biomechanics motion must resolve exact shipped skeletal/muscular geometry')
for (const expected of ['cervical-spine', 'shoulder', 'forearm', 'hip', 'knee']) {
  assert.ok(representedJoints.has(expected), `${expected} should retain at least one exact represented motion context`)
}
assert.ok(hipPelvicSourceSeen, 'lower-limb biomechanics must retain represented pelvic-side hip anatomy when matched by reviewed hints')

const inspectorSource = readFileSync(new URL('../../src/pages/bodyhub/WholeBodyMotionInspector.tsx', import.meta.url), 'utf8')
assert.match(inspectorSource, /onHighlight\?\.\(exactSourceNames\)/, 'apply-to-viewer must highlight exact represented source nodes')
assert.match(inspectorSource, /onHighlight\?\.\(exactNames\)/, 'joint/motion selection must use exact represented source nodes')
assert.doesNotMatch(
  inspectorSource,
  /onHighlight\?\.\(\[\.\.\.new Set\(\[\.\.\.joint\.nodeHints, \.\.\.motion\.structureHints/,
  'biomechanics must not send raw joint/motion hints directly to the shared highlighter',
)
assert.match(
  inspectorSource,
  /No exact regional skeletal\/muscular source-node match/,
  'missing biomechanics geometry must remain explicitly text-only rather than using substitute meshes',
)

console.log('Biomechanics highlights exact regional skeletal/muscular source nodes, preserves pelvic-side hip geometry, and fails closed when geometry is absent.')
