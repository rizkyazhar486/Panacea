// Fail-closed guard over the organ-specific evidence seeds under
// data/body-knowledge/*.json.
//
// WHY THIS EXISTS. Each seed (liver, pituitary, lung, kidney, ...) landed
// through its own isolated PR with its own isolated test. Nothing checked
// that a shared registry actually stayed in sync with disk, so the five
// seeds on main were reachable only by their own narrow test and remained
// otherwise orphaned data — never enumerated anywhere in src/. This test
// fails closed on that specific drift: a JSON file added to
// data/body-knowledge/ without a matching import in
// src/lib/anatomy/bodyKnowledgeEvidenceIndex.ts, or a registry entry with no
// backing file, breaks the build instead of silently accumulating.
//
// It also re-runs the shared contract (see bodyKnowledgeEvidenceContract.ts)
// against every seed read directly from disk, independent of the registry
// module, so a future seed cannot satisfy the registry's TypeScript types
// while actually violating the provenance guarantees at runtime.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  summarizeBodyKnowledgeOrganEvidence,
  type BodyKnowledgeOrganEvidenceSeed,
} from '../../src/lib/anatomy/bodyKnowledgeEvidenceContract.ts'
import { BODY_KNOWLEDGE_ORGAN_EVIDENCE } from '../../src/lib/anatomy/bodyKnowledgeEvidenceIndex.ts'

const dataDir = fileURLToPath(new URL('../../data/body-knowledge/', import.meta.url))
const onDisk = readdirSync(dataDir)
  .filter((name) => name.endsWith('-evidence.json'))
  .filter((name) => name !== 'multisystem-evidence.json') // distinct shape; not an organ seed

assert.ok(onDisk.length >= 4, 'expected at least the four known organ evidence seeds on disk')

const seedsFromDisk = onDisk.map((name) => {
  const raw = readFileSync(`${dataDir}${name}`, 'utf8')
  return { file: name, seed: JSON.parse(raw) as BodyKnowledgeOrganEvidenceSeed }
})

// Every seed on disk must independently satisfy the shared contract.
const summariesFromDisk = seedsFromDisk.map(({ file, seed }) => {
  try {
    return summarizeBodyKnowledgeOrganEvidence(seed)
  } catch (error) {
    throw new Error(`${file}: ${(error as Error).message}`)
  }
})

// The registry module (statically imported JSON, what the app can actually
// consume) must have exactly one entry per file on disk — neither fewer
// (an orphaned/unregistered seed) nor more (a registry entry with no file).
const diskKeys = new Set(summariesFromDisk.map((s) => `${s.system}/${s.organ}`))
const registryKeys = new Set(BODY_KNOWLEDGE_ORGAN_EVIDENCE.map((s) => `${s.system}/${s.organ}`))

for (const key of diskKeys) {
  assert.ok(
    registryKeys.has(key),
    `data/body-knowledge/ has a seed for "${key}" that bodyKnowledgeEvidenceIndex.ts does not import — ` +
      'add it there so it is reachable, not just validated in isolation.',
  )
}
for (const key of registryKeys) {
  assert.ok(diskKeys.has(key), `bodyKnowledgeEvidenceIndex.ts registers "${key}" but no matching file exists on disk`)
}
assert.equal(BODY_KNOWLEDGE_ORGAN_EVIDENCE.length, onDisk.length, 'registry size must match seed file count exactly')

// Sanity: registry summaries must match what the raw files actually contain
// (catches the module quietly substituting stale or hand-edited data).
for (const fromDisk of summariesFromDisk) {
  const fromRegistry = BODY_KNOWLEDGE_ORGAN_EVIDENCE.find(
    (s) => s.system === fromDisk.system && s.organ === fromDisk.organ,
  )!
  assert.equal(fromRegistry.sourceCount, fromDisk.sourceCount)
  assert.equal(fromRegistry.relationshipCount, fromDisk.relationshipCount)
  assert.deepEqual([...fromRegistry.sourcePmids].sort(), [...fromDisk.sourcePmids].sort())
}

console.log(
  `body knowledge evidence registry: ok (${onDisk.length} organ seeds on disk, ` +
    `${BODY_KNOWLEDGE_ORGAN_EVIDENCE.length} registered, all provenance-boundary contracts hold)`,
)
