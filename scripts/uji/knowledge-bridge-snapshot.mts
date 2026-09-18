import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { BRIDGE_TOPICS, buildBridgeSnapshot } from '../../src/lib/knowledgeBridgeMap.ts'

// --- ff-medical-education-snapshot: at-a-glance rollup of a topic's own static
// stage data plus the study state the workbench already tracks (personal note,
// evidence shelf). No new medical fact, threshold or claim is introduced —
// only counts derived from data the curated topic and local study state
// already contain. ---

const hypertension = BRIDGE_TOPICS.find((item) => item.id === 'hypertension')
assert.ok(hypertension, 'hypertension must remain a curated topic')

const blank = buildBridgeSnapshot(hypertension!, '', [])
assert.equal(blank.topicId, 'hypertension')
assert.equal(blank.stageCount, 7, 'every curated topic has seven stages')
assert.equal(blank.actionableStageCount, 5, 'hypertension links five of its seven stages to a Panacea tool')
assert.equal(blank.hasPersonalNote, false, 'an empty note must not count as saved')
assert.equal(blank.linkedEvidenceCount, 0, 'no evidence pointers means zero linked evidence')

const whitespaceNote = buildBridgeSnapshot(hypertension!, '   \n  ', [])
assert.equal(whitespaceNote.hasPersonalNote, false, 'a whitespace-only note must not count as saved')

const withNote = buildBridgeSnapshot(hypertension!, 'MAP = CO x SVR, check my BP log', [])
assert.equal(withNote.hasPersonalNote, true, 'a non-blank note must count as saved')

// Evidence linkage matches by title/alias, whole-word only — same fail-closed
// discipline as resolveBridgeTopic/searchBridgeTopics.
const matchedByTitle = buildBridgeSnapshot(hypertension!, '', [{ query: 'hypertension' }, { query: 'unrelated topic' }])
assert.equal(matchedByTitle.linkedEvidenceCount, 1, 'only the evidence pointer matching this topic should be counted')

const matchedByAlias = buildBridgeSnapshot(hypertension!, '', [{ query: 'high blood pressure' }, { query: 'blood pressure' }])
assert.equal(matchedByAlias.linkedEvidenceCount, 2, 'evidence pointers matching a curated alias must also be counted')

const fragmentGuard = buildBridgeSnapshot(hypertension!, '', [{ query: 'sure' }])
assert.equal(fragmentGuard.linkedEvidenceCount, 0, 'a substring fragment ("sure" inside "pressure") must not be counted as a match')

const noQuery = buildBridgeSnapshot(hypertension!, '', [{}, { query: '   ' }])
assert.equal(noQuery.linkedEvidenceCount, 0, 'evidence pointers without a usable query must not be counted')

// Every curated topic must produce a well-formed snapshot with no NaN/negative counts.
for (const topic of BRIDGE_TOPICS) {
  const snapshot = buildBridgeSnapshot(topic, '', [])
  assert.equal(snapshot.stageCount, topic.stages.length)
  assert.ok(snapshot.actionableStageCount >= 0 && snapshot.actionableStageCount <= snapshot.stageCount)
  assert.equal(snapshot.title, topic.title)
  assert.equal(snapshot.oneLiner, topic.oneLiner)
}

const workbench = await readFile(new URL('../../src/components/KnowledgeBridgeWorkbench.tsx', import.meta.url), 'utf8')
assert.match(workbench, /buildBridgeSnapshot/)
assert.match(workbench, /aria-label="Topic snapshot"/)
assert.match(workbench, /Stages mapped/)
assert.match(workbench, /Linked Panacea tools/)
assert.match(workbench, /Personal note/)
assert.match(workbench, /Evidence linked/)

console.log('Knowledge Bridge snapshot dashboard summarizes stage coverage, note and evidence-linkage state deterministically, with no new medical claim.')
