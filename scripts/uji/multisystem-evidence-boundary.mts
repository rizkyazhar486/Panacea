import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const raw = await readFile(new URL('../../data/body-knowledge/multisystem-evidence.json', import.meta.url), 'utf8')
const data = JSON.parse(raw) as {
  mandatoryReferences: Array<{ id: string; url: string; use: string; licenseStatus: string; medicalEvidence: boolean }>
  scientificAnchors: Array<{ id: string; pmid: string; year: number; status: string; scope: string }>
  forbiddenPromotions: string[]
}

const anatomy = data.mandatoryReferences.find((entry) => entry.id === 'thebuggeddev-anatomy')!
assert.equal(anatomy.url, 'https://github.com/thebuggeddev/anatomy')
assert.equal(anatomy.medicalEvidence, false)
assert.match(anatomy.licenseStatus, /unverified/i)

const breath = data.mandatoryReferences.find((entry) => entry.id === 'breath-atlas-thebuggeddev')!
assert.equal(breath.url, 'https://breath-atlas.thebuggeddev.chatgpt.site/')
assert.equal(breath.medicalEvidence, false)
assert.match(breath.use, /visual-storytelling-reference-only/i)

const originalIpsc = data.scientificAnchors.find((entry) => entry.pmid === '16904174')!
assert.equal(originalIpsc.year, 2006)
assert.match(originalIpsc.scope, /not a universal clinical regeneration claim/i)

const latestJapaneseIpsc = data.scientificAnchors.find((entry) => entry.pmid === '39969437')!
assert.equal(latestJapaneseIpsc.year, 2025)
assert.equal(latestJapaneseIpsc.status, 'source-checked')
assert.match(latestJapaneseIpsc.scope, /indication-specific/i)

const longevity = data.scientificAnchors.find((entry) => entry.pmid === '40509615')!
assert.equal(longevity.status, 'research-frontier')
assert.match(longevity.scope, /not proof of immortality/i)

for (const guard of ['third-party-ux-reference-to-medical-evidence','unknown-license-reference-to-runtime-asset','gene-or-rna-to-deterministic-thought','hormone-to-deterministic-personality','atlas-geometry-to-patient-specific-anatomy','longevity-research-to-immortality-claim']) assert.ok(data.forbiddenPromotions.includes(guard), `${guard} must remain fail-closed`)

console.log('Multisystem evidence boundary verified.')
