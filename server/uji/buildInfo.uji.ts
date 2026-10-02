import assert from 'node:assert/strict'
import { readBuildCommit } from '../src/shared/buildInfo.js'

const sha = 'a'.repeat(40)
assert.equal(readBuildCommit({ RENDER_GIT_COMMIT: sha }), sha, 'a valid 40-hex sha is reported')
assert.equal(readBuildCommit({ RENDER_GIT_COMMIT: ` ${sha.toUpperCase()}\n` }), sha, 'whitespace and case are normalized')
assert.equal(readBuildCommit({ RENDER_GIT_COMMIT: sha.slice(0, 39) }), null, 'a 39-char value is unknown, not guessed')
assert.equal(readBuildCommit({ RENDER_GIT_COMMIT: sha + 'a' }), null, 'a 41-char value is unknown')
assert.equal(readBuildCommit({ RENDER_GIT_COMMIT: 'g'.repeat(40) }), null, 'non-hex 40 chars is unknown')
assert.equal(readBuildCommit({ RENDER_GIT_COMMIT: '' }), null, 'empty is unknown')
assert.equal(readBuildCommit({}), null, 'missing variable is unknown')
assert.deepEqual([readBuildCommit({ RENDER_GIT_COMMIT: sha }), readBuildCommit({ RENDER_GIT_COMMIT: sha })], [sha, sha], 'deterministic')
console.log('Build commit provenance verified.')
