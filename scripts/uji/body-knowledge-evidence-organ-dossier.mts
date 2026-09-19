// Wiring guard: the body-knowledge evidence registry
// (bodyKnowledgeEvidenceIndex.ts) existed on main with no UI consumer — see
// body-knowledge-evidence-registry.mts for why that mattered. This test
// fails closed on that specific regression re-appearing: OrganDossier.tsx
// (the actual per-organ learning surface) must render the evidence
// provenance disclosure, and the organKey -> system/organ lookup map must
// stay in sync with what the registry actually has on disk.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { getBodyKnowledgeEvidenceForOrganKey } from '../../src/lib/anatomy/bodyKnowledgeEvidenceIndex.ts'
import { BODY_KNOWLEDGE_ORGAN_EVIDENCE } from '../../src/lib/anatomy/bodyKnowledgeEvidenceIndex.ts'

const dossier = readFileSync(
  new URL('../../src/pages/bodyhub/OrganDossier.tsx', import.meta.url),
  'utf8',
)
assert.match(
  dossier,
  /<OrganEvidenceProvenance organKey={organKey} \/>/,
  'OrganDossier no longer renders the evidence provenance disclosure — the registry would go orphaned again',
)

const provenanceComponent = readFileSync(
  new URL('../../src/pages/bodyhub/OrganEvidenceProvenance.tsx', import.meta.url),
  'utf8',
)
// The boundary sentence must never be dropped from the rendered claims —
// that is the whole point of "source-checked" not silently reading as
// "clinically verified".
assert.match(provenanceComponent, /sourceCheckedMeans/, 'provenance disclosure lost the source-checked boundary sentence')
assert.match(provenanceComponent, /pubmed\.ncbi\.nlm\.nih\.gov/, 'provenance disclosure lost its PubMed source links')

// Every organKey the lookup map knows about must actually resolve against
// the live registry — a stale mapping (renamed seed, removed organ) must
// fail closed here rather than silently rendering nothing forever.
const knownOrganKeys = ['liver', 'pituitary', 'lungs', 'kidneys']
for (const organKey of knownOrganKeys) {
  const evidence = getBodyKnowledgeEvidenceForOrganKey(organKey)
  assert.ok(evidence, `getBodyKnowledgeEvidenceForOrganKey("${organKey}") resolved to nothing`)
  assert.ok(evidence!.relationships.length > 0, `${organKey} evidence has no relationships to show`)
  assert.ok(evidence!.sourceCheckedMeans.length > 0, `${organKey} evidence is missing its boundary sentence`)
  for (const relationship of evidence!.relationships) {
    assert.ok(relationship.claim.length > 0, `${organKey} relationship ${relationship.id} has an empty claim`)
    assert.ok(relationship.evidencePmids.length > 0, `${organKey} relationship ${relationship.id} cites no PMIDs`)
  }
}

// An organKey with no registered seed must resolve to undefined, not throw
// and not fabricate a result — the dossier's null-render depends on this.
assert.equal(getBodyKnowledgeEvidenceForOrganKey('spleen'), undefined)
assert.equal(getBodyKnowledgeEvidenceForOrganKey('not-a-real-organ'), undefined)

// The map must cover exactly the organs actually registered — neither an
// organKey pointing at a seed that no longer exists, nor a registered seed
// with no organKey able to reach it from the UI.
assert.equal(
  knownOrganKeys.length,
  BODY_KNOWLEDGE_ORGAN_EVIDENCE.length,
  'organKey lookup map and the registry have drifted apart in size',
)

console.log(
  `body knowledge evidence organ dossier wiring: ok (${knownOrganKeys.length} organKeys resolve into OrganDossier's provenance disclosure)`,
)
