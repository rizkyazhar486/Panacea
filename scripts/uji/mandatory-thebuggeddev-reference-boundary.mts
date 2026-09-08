import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const anatomy = JSON.parse(await readFile('data/source-registry/anatomy/thebuggeddev-anatomy.json', 'utf8'))
const breath = JSON.parse(await readFile('data/source-registry/physiology/thebuggeddev-breath-atlas.json', 'utf8'))

for (const entry of [anatomy, breath]) {
  assert.equal(entry.usage.runtime, false, `${entry.id} must not become an unverified runtime dependency`)
  assert.equal(entry.usage.buildTime, false, `${entry.id} must not authorize unverified source/asset ingestion`)
  assert.equal(entry.license.status, 'UNKNOWN', `${entry.id} license must remain fail-closed until verified`)
  assert.equal(entry.license.commercialUse, 'UNKNOWN')
  assert.equal(entry.validation.level, 'REFERENCE')
  assert.equal(entry.validation.clinicalDecisionUse, 'NO')
  assert.equal(entry.provenance.sourceIdentityRequired, true)
  assert.equal(entry.provenance.versionPinRequired, true)
  assert.equal(entry.adapter.status, 'PLANNED')
}

assert.equal(anatomy.repository, 'https://github.com/thebuggeddev/anatomy')
assert.ok(anatomy.features.includes('body-exposure-reference'))
assert.match(anatomy.usage.notes, /Mandatory design\/architecture reference/i)
assert.match(anatomy.license.notes, /Fail closed/i)
assert.match(anatomy.validation.notes, /not an authoritative anatomy source/i)

assert.equal(breath.homepage, 'https://breath-atlas.thebuggeddev.chatgpt.site/')
assert.ok(breath.features.includes('respiratory-atlas-reference'))
assert.match(breath.usage.notes, /Mandatory UX\/visualization reference/i)
assert.match(breath.validation.notes, /Academic Accuracy Gate/i)
assert.match(breath.adapter.notes, /Panacea-controlled assets/i)

console.log('Mandatory thebuggeddev Anatomy + Breath Atlas references are registered with fail-closed license, provenance, and medical-evidence boundaries.')
