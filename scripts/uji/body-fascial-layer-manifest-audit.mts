import assert from 'node:assert/strict'
import {
  EXPLICIT_SUPERFICIAL_FASCIAL_MANIFEST_NODES,
  FASCIAL_LAYER_MANIFEST_BOUNDARY,
  FASCIAL_LAYER_MANIFEST_PROVENANCE,
  FASCIAL_LAYER_MANIFESTS,
  SUPERFICIAL_FASCIA_MANIFEST_DISCOVERY,
  fascialLayerManifestHasDuplicateNodes,
  fascialLayerManifestNodeCount,
  superficialFasciaManifestMayPromoteSystem,
} from '../../src/lib/anatomy/fascialLayerManifestAudit.ts'

assert.equal(FASCIAL_LAYER_MANIFEST_PROVENANCE.upstreamRepository, 'LluisV/Z-Anatomy')
assert.equal(FASCIAL_LAYER_MANIFEST_PROVENANCE.upstreamCommit, '6c7f9016bd5899ac8edafd31b9900c151df42ed6')
assert.equal(FASCIAL_LAYER_MANIFEST_PROVENANCE.evidenceKind, 'text-layer-manifest')
assert.equal(FASCIAL_LAYER_MANIFEST_PROVENANCE.currentStatus, 'manifest-evidence-only')
assert.equal(FASCIAL_LAYER_MANIFEST_PROVENANCE.geometryAdmitted, false)
assert.equal(FASCIAL_LAYER_MANIFEST_PROVENANCE.patientSpecific, false)
assert.equal(FASCIAL_LAYER_MANIFEST_PROVENANCE.clinicalInferenceAllowed, false)

assert.deepEqual(
  FASCIAL_LAYER_MANIFESTS.map((manifest) => [manifest.layer, manifest.upstreamBlobSha, manifest.nodeNames.length]),
  [
    [1, 'b0c80ad98cceffd95c07263c9e3361108598b53a', 10],
    [2, 'b4deeeefb2e1f7919c05dbe83a94783e2a8adc08', 8],
    [3, '443131d36bd59b40772e7bfc9409302f83a2db62', 8],
    [4, '1846f6157488170b4da1000f5fbf01aa84240e06', 9],
    [5, '0bc55aa3942e9174471921d0b7ac300fdea59a80', 9],
    [6, '63fbb1d907bcd8b96a1c58c2fc3eb17d2384ef0f', 8],
    [7, 'a622236baad28d662033fe6bd3a2c4eaf0b3a371', 6],
    [8, 'b5d1d1e6165fa7a92a88767a2a5d7a61749cd817', 4],
    [9, '41fbd9cd881da6ac13aa141912007b002740cb29', 8],
    [10, '712bb83be08f2a948f732f4406c87ba08b3d3432', 6],
  ],
)

assert.equal(fascialLayerManifestNodeCount(), 76)
assert.equal(fascialLayerManifestHasDuplicateNodes(), false)
assert.ok(FASCIAL_LAYER_MANIFESTS.every((manifest) => manifest.upstreamPath.startsWith('Z-Anatomy PC/Assets/Models/Layers/Fasciae/')))

assert.deepEqual(EXPLICIT_SUPERFICIAL_FASCIAL_MANIFEST_NODES, [
  'Superficial layer of temporal fascia.r',
  'Superficial layer of temporal fascia.l',
  'Superficial investing cervical fascia.r',
  'Superficial investing cervical fascia.l',
])
assert.equal(
  EXPLICIT_SUPERFICIAL_FASCIAL_MANIFEST_NODES.includes('Superficial transverse metatarsal ligament.r'),
  false,
  'keyword discovery must not misclassify superficial ligaments as superficial fascia',
)
assert.equal(
  EXPLICIT_SUPERFICIAL_FASCIAL_MANIFEST_NODES.includes('Superficial transverse metacarpal ligament.r'),
  false,
  'keyword discovery must require fascia in the source label',
)

assert.equal(SUPERFICIAL_FASCIA_MANIFEST_DISCOVERY.status, 'manifest-evidence-only')
assert.equal(SUPERFICIAL_FASCIA_MANIFEST_DISCOVERY.dedicatedWholeBodyBundleFound, false)
assert.equal(SUPERFICIAL_FASCIA_MANIFEST_DISCOVERY.sourceBundleIdentityVerified, false)
assert.equal(SUPERFICIAL_FASCIA_MANIFEST_DISCOVERY.sourceNodeGeometryVerified, false)
assert.equal(SUPERFICIAL_FASCIA_MANIFEST_DISCOVERY.referenceFrameVerified, false)
assert.equal(SUPERFICIAL_FASCIA_MANIFEST_DISCOVERY.licenseScopeVerified, false)
assert.equal(SUPERFICIAL_FASCIA_MANIFEST_DISCOVERY.academicReviewComplete, false)
assert.equal(SUPERFICIAL_FASCIA_MANIFEST_DISCOVERY.mayPromoteSystem, false)
assert.equal(superficialFasciaManifestMayPromoteSystem(), false)

assert.match(FASCIAL_LAYER_MANIFEST_BOUNDARY, /source-discovery evidence only/i)
assert.match(FASCIAL_LAYER_MANIFEST_BOUNDARY, /specific imported FBX\/GLB/i)
assert.match(FASCIAL_LAYER_MANIFEST_BOUNDARY, /system:fascial must remain blocked/i)

console.log('body-fascial-layer-manifest-audit: 10 pinned layer manifests, 76 names, superficial evidence remains fail-closed')
