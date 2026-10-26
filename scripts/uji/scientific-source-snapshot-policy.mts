import assert from 'node:assert/strict'
import {
  SCIENTIFIC_SNAPSHOT_BOUNDARY,
  decideSnapshotReuse,
  mayClaimSnapshotComplete,
  snapshotCacheKey,
  type ScientificSourceSnapshot,
} from '../../src/lib/science/scientificSourceSnapshotPolicy'

const base: ScientificSourceSnapshot = {
  sourceId: 'uniprot',
  sourceVersion: '2026_04',
  retrievedAt: '2026-09-13T15:00:00Z',
  kind: 'release-file',
  upstreamUrl: 'https://www.uniprot.org/',
  contentDigest: 'sha256:abc',
  licenseState: 'verified',
  immutable: true,
}

assert.deepEqual(decideSnapshotReuse(base, { ...base }), {
  reusable: true,
  refreshRequired: false,
  reasons: [],
})

const changed = decideSnapshotReuse(base, { ...base, sourceVersion: '2026_05' })
assert.equal(changed.reusable, false)
assert.ok(changed.reasons.some((reason) => /identity changed/i.test(reason)))

const unknownLicense = decideSnapshotReuse(base, { ...base, licenseState: 'unknown' })
assert.equal(unknownLicense.reusable, false)
assert.ok(unknownLicense.reasons.some((reason) => /license/i.test(reason)))

const mutableUnversioned: ScientificSourceSnapshot = {
  ...base,
  sourceVersion: null,
  contentDigest: null,
  immutable: false,
}
assert.equal(decideSnapshotReuse(mutableUnversioned, mutableUnversioned).reusable, false)

assert.equal(snapshotCacheKey(base), 'uniprot:2026_04:release-file')
assert.equal(snapshotCacheKey(mutableUnversioned), null)
assert.equal(snapshotCacheKey({ ...base, sourceId: ' \t' }), null)
assert.equal(snapshotCacheKey({ ...base, sourceVersion: ' \t' }), 'uniprot:sha256:abc:release-file')
const whitespaceSource = { ...base, sourceId: ' \t' }
assert.equal(decideSnapshotReuse(whitespaceSource, { ...whitespaceSource }).reusable, false)
const whitespaceVersion = { ...base, sourceVersion: ' \t' }
assert.equal(decideSnapshotReuse(whitespaceVersion, { ...whitespaceVersion }).reusable, true)
assert.equal(decideSnapshotReuse(whitespaceVersion, { ...whitespaceVersion, contentDigest: 'sha256:other' }).reusable, false)
const malformedUpstream = { ...base, upstreamUrl: null } as unknown as ScientificSourceSnapshot
let malformedUpstreamDecision: ReturnType<typeof decideSnapshotReuse> | null = null
assert.doesNotThrow(() => {
  malformedUpstreamDecision = decideSnapshotReuse(malformedUpstream, { ...base })
})
assert.equal(malformedUpstreamDecision?.reusable, false)
assert.ok(malformedUpstreamDecision?.reasons.some((reason) => /non-https/i.test(reason)))
assert.equal(mayClaimSnapshotComplete(base), true)
assert.equal(mayClaimSnapshotComplete({ ...base, contentDigest: null }), false)
assert.equal(mayClaimSnapshotComplete(whitespaceSource), false)
assert.equal(mayClaimSnapshotComplete({ ...base, sourceVersion: ' \t' }), false)
assert.equal(mayClaimSnapshotComplete({ ...base, upstreamUrl: 'http://www.uniprot.org/' }), false)
assert.match(SCIENTIFIC_SNAPSHOT_BOUNDARY, /does not imply full upstream coverage/i)
assert.match(SCIENTIFIC_SNAPSHOT_BOUNDARY, /clinical validity/i)

console.log('scientific-source-snapshot-policy: ok')
