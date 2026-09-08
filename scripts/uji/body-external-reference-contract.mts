import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

async function readRegistry(name: string) {
  return JSON.parse(
    await readFile(
      new URL(`../../data/source-registry/rendering/${name}.json`, import.meta.url),
      'utf8',
    ),
  )
}

const anatomy = await readRegistry('thebuggeddev-anatomy')
const breathAtlas = await readRegistry('thebuggeddev-breath-atlas')

for (const source of [anatomy, breathAtlas]) {
  assert.equal(source.category, 'rendering')
  assert.equal(source.usage.runtime, false)
  assert.equal(source.usage.buildTime, false)
  assert.equal(source.validation.level, 'REFERENCE')
  assert.equal(source.validation.clinicalDecisionUse, 'NO')
  assert.notEqual(source.license.status, 'VERIFIED')
  assert.equal(source.license.commercialUse, 'UNKNOWN')
  assert.equal(source.adapter.status, 'NOT_APPLICABLE')
  assert.match(source.validation.notes, /not (?:treated as )?(?:an )?(?:anatomical|scientific|biomedical)|not .*authority|not treated as scientific evidence/i)
}

assert.equal(anatomy.id, 'thebuggeddev_anatomy')
assert.equal(anatomy.homepage, 'https://github.com/thebuggeddev/anatomy')
assert.equal(anatomy.repository, 'https://github.com/thebuggeddev/anatomy')
assert.match(anatomy.usage.notes, /searchable organ\/structure libraries/i)
assert.match(anatomy.usage.notes, /rotate\/zoom/i)
assert.match(anatomy.usage.notes, /isolate/i)
assert.match(anatomy.usage.notes, /cross-section\/layer controls/i)
assert.match(anatomy.usage.notes, /compare workflows/i)
assert.match(anatomy.usage.notes, /hotspots/i)
assert.match(anatomy.usage.notes, /labeling practice/i)
assert.match(anatomy.usage.notes, /microscopic context cards/i)
assert.match(anatomy.usage.notes, /authoring probes/i)
assert.match(anatomy.usage.notes, /Do not copy, bundle, import, or redistribute/i)

assert.equal(breathAtlas.id, 'thebuggeddev_breath_atlas')
assert.equal(breathAtlas.homepage, 'https://breath-atlas.thebuggeddev.chatgpt.site/')
assert.equal(breathAtlas.repository, null)
assert.match(breathAtlas.usage.notes, /visual and interaction reference/i)
assert.match(breathAtlas.usage.notes, /spatial storytelling/i)
assert.match(breathAtlas.usage.notes, /progressive disclosure/i)
assert.match(breathAtlas.validation.notes, /not treated as scientific evidence/i)
assert.match(breathAtlas.adapter.notes, /No iframe, remote script, data adapter, model import, or content synchronization/i)

console.log(
  'Body external reference contract: thebuggeddev/anatomy and Breath Atlas remain mandatory reference-only inputs with fail-closed licensing and biomedical boundaries.',
)
