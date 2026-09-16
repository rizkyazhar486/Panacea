import assert from 'node:assert/strict'
import {
  buildBodyExposureGapBacklog,
  nextBodyExposureGapTasks,
} from '../../src/lib/bodyExposureGapBacklog.ts'

const backlog = buildBodyExposureGapBacklog()
assert.ok(backlog.length > 0)
assert.ok(backlog.every((task) => task.preserveExistingCapability))
assert.ok(backlog.every((task) => task.requiresSourceProvenance))
assert.ok(backlog.every((task) => task.anatomicalAccuracyClaimAllowedBeforeReview === false))

for (let index = 1; index < backlog.length; index += 1) {
  assert.ok(backlog[index - 1].priorityScore >= backlog[index].priorityScore)
}

const macro = backlog.filter((task) => ['whole-body', 'system', 'organ'].includes(task.scale))
const deep = backlog.filter((task) => ['molecular-pathway', 'protein', 'rna', 'dna-epigenome'].includes(task.scale))
if (macro.length && deep.length) {
  assert.ok(Math.max(...macro.map((task) => task.priorityScore)) > Math.max(...deep.map((task) => task.priorityScore)))
}

const top = nextBodyExposureGapTasks(5)
assert.equal(top.length, Math.min(5, backlog.length))
assert.deepEqual(top, backlog.slice(0, 5))
assert.throws(() => nextBodyExposureGapTasks(0), /positive integer/)

console.log('Body Exposure gap backlog verified: whole-body/system/organ gaps receive deliberate engineering priority before deep-scale polish, while preserving existing capability and review/provenance boundaries.')
