import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = JSON.parse(
  await readFile(
    new URL('../../data/source-registry/anatomy/thebuggeddev-anatomy-breath-atlas.json', import.meta.url),
    'utf8',
  ),
)

assert.equal(source.id, 'thebuggeddev_anatomy_breath_atlas')
assert.equal(source.repository, 'https://github.com/thebuggeddev/anatomy')
assert.equal(source.homepage, 'https://breath-atlas.thebuggeddev.chatgpt.site/')

assert.equal(source.usage.runtime, false)
assert.equal(source.usage.buildTime, false)
assert.equal(source.adapter.status, 'NOT_APPLICABLE')
assert.equal(source.validation.clinicalDecisionUse, 'NO')
assert.notEqual(source.license.status, 'VERIFIED')
assert.equal(source.license.commercialUse, 'UNKNOWN')

assert.match(source.usage.notes, /Interaction and information-architecture reference only/i)
assert.match(source.usage.notes, /does not embed, fetch, copy or redistribute/i)
assert.match(source.usage.notes, /independently implemented/i)
assert.match(source.validation.notes, /interaction and information-architecture patterns only/i)
assert.match(source.provenance.notes, /Do not convert reference status into anatomical evidence/i)
assert.match(source.license.notes, /Do not copy source code, artwork or 3D model assets/i)

console.log(
  'Body external reference contract: thebuggeddev/anatomy + Breath Atlas remain mandatory interaction references without becoming runtime dependencies or biomedical evidence.',
)
