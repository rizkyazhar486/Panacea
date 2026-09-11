import assert from 'node:assert/strict'
import type { AtlasManifest } from '../../src/lib/anatomy/atlasKernel.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  SAME_FRAME_WHOLE_BODY_FILES,
  SYSTEM_MATURITY_REQUIRED_SYSTEMS,
  buildSystemMaturityAdmissionReport,
} from '../../src/lib/anatomy/systemMaturityAdmission.ts'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'
import { REQUIRED_WHOLE_BODY_SYSTEMS } from '../../src/lib/anatomy/bodyMaturationGate.ts'

assert.deepEqual(SYSTEM_MATURITY_REQUIRED_SYSTEMS, REQUIRED_WHOLE_BODY_SYSTEMS)
assert.deepEqual(SAME_FRAME_WHOLE_BODY_FILES, [
  'surface.glb',
  'skeletal.glb',
  'muscular.glb',
  'cardiovascular.glb',
  'nervous.glb',
  'visceral.glb',
  'lymphoid.glb',
])

const report = buildSystemMaturityAdmissionReport(
  COMPLETE_WHOLE_BODY_ATLAS,
  INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
)
assert.equal(report.admissions.length, 14)
assert.equal(new Set(report.admissions.map((entry) => entry.system)).size, 14)
assert.equal(report.allSystemsAdmitted, false, 'system stage must remain fail-closed while macro evidence debt exists')

for (const entry of report.admissions) {
  assert.ok(entry.files.every((file) => SAME_FRAME_WHOLE_BODY_FILES.includes(file as (typeof SAME_FRAME_WHOLE_BODY_FILES)[number])))
  assert.equal(entry.admitted, entry.status === 'same-frame-shipped')
}

for (const system of ['articular', 'fascial'] as const) {
  const entry = report.admissions.find((candidate) => candidate.system === system)
  assert.ok(entry)
  assert.equal(entry.status, 'same-frame-partial')
  assert.equal(entry.admitted, false)
  assert.notEqual(entry.geometryStatus, 'shipped')
}

// A specialty/reference-frame GLB must never satisfy whole-body system admission,
// even when the manifest is otherwise made to look shipped.
const specialtyFrameManifest: AtlasManifest = {
  ...COMPLETE_WHOLE_BODY_ATLAS,
  nodes: COMPLETE_WHOLE_BODY_ATLAS.nodes.map((node) => node.id === 'system:articular'
    ? {
        ...node,
        geometryStatus: 'shipped' as const,
        source: { ...node.source, files: ['ortopedi.glb'] },
      }
    : node),
}
const specialtyFrame = buildSystemMaturityAdmissionReport(
  specialtyFrameManifest,
  INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
).admissions.find((entry) => entry.system === 'articular')
assert.ok(specialtyFrame)
assert.equal(specialtyFrame.status, 'outside-whole-body-frame')
assert.equal(specialtyFrame.admitted, false)

// "shipped" metadata alone is insufficient when the reviewed source hint does
// not resolve to exact names in the allowed same-frame bundle.
const unresolvedNameManifest: AtlasManifest = {
  ...COMPLETE_WHOLE_BODY_ATLAS,
  nodes: COMPLETE_WHOLE_BODY_ATLAS.nodes.map((node) => node.id === 'system:surface'
    ? {
        ...node,
        geometryStatus: 'shipped' as const,
        source: { mode: 'composite' as const, files: ['surface.glb'], nodeHints: ['panacea definitely absent source node'] },
      }
    : node),
}
const unresolvedName = buildSystemMaturityAdmissionReport(
  unresolvedNameManifest,
  INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
).admissions.find((entry) => entry.system === 'surface')
assert.ok(unresolvedName)
assert.equal(unresolvedName.status, 'source-name-unresolved')
assert.equal(unresolvedName.admitted, false)
assert.deepEqual(unresolvedName.unresolvedHints, ['panacea definitely absent source node'])

// Likewise, a referenced same-frame file must actually exist in the indexed
// source catalogue; absence is evidence debt rather than permission to guess.
const withoutSurfaceBundle = INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT.filter((bundle) => bundle.file !== 'surface.glb')
const unresolvedBundle = buildSystemMaturityAdmissionReport(
  COMPLETE_WHOLE_BODY_ATLAS,
  withoutSurfaceBundle,
).admissions.find((entry) => entry.system === 'surface')
assert.ok(unresolvedBundle)
assert.equal(unresolvedBundle.status, 'source-bundle-unresolved')
assert.equal(unresolvedBundle.admitted, false)
assert.deepEqual(unresolvedBundle.unresolvedFiles, ['surface.glb'])

console.log(JSON.stringify({
  allSystemsAdmitted: report.allSystemsAdmitted,
  admittedSystems: report.admittedSystems,
  blockedSystems: report.blockedSystems,
  evidenceDebt: report.admissions
    .filter((entry) => !entry.admitted)
    .map((entry) => ({
      system: entry.system,
      status: entry.status,
      geometryStatus: entry.geometryStatus,
      unresolvedFiles: entry.unresolvedFiles,
      unresolvedHints: entry.unresolvedHints,
    })),
}, null, 2))
