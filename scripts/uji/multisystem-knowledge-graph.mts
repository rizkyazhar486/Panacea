import assert from 'node:assert/strict'
import {
  MULTISYSTEM_DOMAINS,
  MULTISYSTEM_KNOWLEDGE_GRAPH,
  MULTISYSTEM_REFERENCES,
  MULTISYSTEM_SCALES,
  getDomainsForScale,
  getMandatoryReference,
  getMultisystemDomain,
} from '../../src/lib/multisystemKnowledgeGraph.ts'

const requiredScales = ['whole-body','system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome','neural-circuit','endocrine-signal','cognition-behavior','development-regeneration','aging-longevity'] as const
assert.deepEqual(MULTISYSTEM_SCALES, requiredScales)
assert.ok(MULTISYSTEM_DOMAINS.length >= 15)
for (const scale of requiredScales) assert.ok(getDomainsForScale(scale).length > 0)

for (const id of ['integumentary','musculoskeletal','cardiovascular','respiratory','digestive-hepatobiliary','renal-urinary','hematologic-immune-lymphatic','endocrine','nervous-system','sensory','reproductive-developmental','cell-molecular-genomics','brain-cognition','stem-cell-regeneration','aging-longevity']) assert.ok(getMultisystemDomain(id), `${id} missing`)

const brain = getMultisystemDomain('brain-cognition')!
assert.ok(brain.scales.includes('neural-circuit'))
assert.ok(brain.scales.includes('cognition-behavior'))
assert.match(brain.notes, /emergent network-level/i)
assert.match(brain.notes, /forbids deterministic gene→thought/i)

const endocrine = getMultisystemDomain('endocrine')!
assert.match(endocrine.notes, /must not be reduced to deterministic explanations/i)

const stemCell = getMultisystemDomain('stem-cell-regeneration')!
assert.ok(stemCell.scales.includes('rna'))
assert.ok(stemCell.scales.includes('dna-epigenome'))
assert.match(stemCell.notes, /Takahashi\/Yamanaka/i)
assert.match(stemCell.notes, /no universal regeneration claim/i)

const longevity = getMultisystemDomain('aging-longevity')!
assert.match(longevity.notes, /Research frontier only/i)
assert.match(longevity.notes, /must never label immortality/i)

const anatomyReference = getMandatoryReference('thebuggeddev-anatomy')!
assert.equal(anatomyReference.url, 'https://github.com/thebuggeddev/anatomy')
assert.equal(anatomyReference.role, 'architecture-reference')
assert.equal(anatomyReference.evidenceStatus, 'reference-only')
assert.match(anatomyReference.note, /Do not copy code, models, textures or labels unless license/i)

const breathReference = getMandatoryReference('breath-atlas-thebuggeddev')!
assert.equal(breathReference.url, 'https://breath-atlas.thebuggeddev.chatgpt.site/')
assert.equal(breathReference.role, 'ux-reference')
assert.equal(breathReference.evidenceStatus, 'reference-only')
assert.match(breathReference.note, /not an authoritative physiology source/i)

const yamanaka = getMandatoryReference('takahashi-yamanaka-2006-ipsc')!
assert.equal(yamanaka.pmid, '16904174')
assert.equal(yamanaka.year, 2006)

const japaneseTranslation = getMandatoryReference('jun-takahashi-2025-ipsc-cell-replacement')!
assert.equal(japaneseTranslation.pmid, '39969437')
assert.equal(japaneseTranslation.year, 2025)
assert.match(japaneseTranslation.note, /not proof of broad or universal efficacy/i)

const aging = getMandatoryReference('aging-on-chip-2025')!
assert.equal(aging.pmid, '40509615')
assert.equal(aging.evidenceStatus, 'research-frontier')
assert.match(aging.note, /not an immortality or proven human rejuvenation claim/i)

assert.equal(MULTISYSTEM_KNOWLEDGE_GRAPH.interpretationBoundary.educationalOnly, true)
assert.equal(MULTISYSTEM_KNOWLEDGE_GRAPH.interpretationBoundary.patientSpecificInference, false)
assert.equal(MULTISYSTEM_KNOWLEDGE_GRAPH.interpretationBoundary.diagnosisOrTreatment, false)
assert.equal(MULTISYSTEM_KNOWLEDGE_GRAPH.interpretationBoundary.directGeneToThoughtClaim, false)
assert.equal(MULTISYSTEM_KNOWLEDGE_GRAPH.interpretationBoundary.immortalityClaim, false)
assert.equal(new Set(MULTISYSTEM_REFERENCES.map((reference) => reference.id)).size, MULTISYSTEM_REFERENCES.length)
console.log('Multisystem end-to-end knowledge graph verified.')
