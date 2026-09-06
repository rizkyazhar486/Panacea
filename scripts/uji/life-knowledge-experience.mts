import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LIFE_READING_LIBRARY, WEALTH_PILLARS, readingsForPillar } from '../../src/lib/lifeLearning.ts'
import { BRIDGE_TOPICS, bridgeSummary, resolveBridgeTopic } from '../../src/lib/knowledgeBridgeMap.ts'
import { PANACEA_FRONTIER_SEVEN, frontierReadiness } from '../../src/lib/panaceaFrontierSeven.ts'
import { isReviewDue, nextReviewIso, normalizeFocusMinutes, reviewIntervalFor } from '../../src/lib/studyPlanner.ts'

assert.equal(WEALTH_PILLARS.length, 7, 'life library must represent exactly seven wealth pillars')
assert.equal(new Set(WEALTH_PILLARS.map((item) => item.id)).size, 7, 'wealth pillar ids must be unique')
for (const pillar of WEALTH_PILLARS) {
  assert.ok(readingsForPillar(pillar.id).length >= 3, `${pillar.id} must have at least three readable briefs`)
}
assert.ok(LIFE_READING_LIBRARY.every((item) => item.body.length >= 2), 'reading briefs require substantive body content')
assert.ok(LIFE_READING_LIBRARY.every((item) => item.reflection && item.action), 'every reading must end in reflection + action')

assert.ok(BRIDGE_TOPICS.length >= 7, 'Knowledge Bridge requires a useful starter topic set')
assert.equal(resolveBridgeTopic('high blood pressure')?.id, 'hypertension')
assert.equal(resolveBridgeTopic('NSTEMI')?.id, 'acs')
assert.equal(resolveBridgeTopic('low Hb')?.id, 'anemia')
for (const topic of BRIDGE_TOPICS) {
  assert.equal(topic.stages.length, 7, `${topic.id} must connect seven causal stages`)
  assert.match(bridgeSummary(topic), /Evidence:/)
}

assert.equal(PANACEA_FRONTIER_SEVEN.length, 7, 'Frontier studio must expose seven concepts')
assert.equal(new Set(PANACEA_FRONTIER_SEVEN.map((item) => item.id)).size, 7, 'frontier ids must be unique')
for (const feature of PANACEA_FRONTIER_SEVEN) {
  assert.ok(feature.safetyBoundary.length > 30, `${feature.id} needs an explicit safety boundary`)
  assert.ok(frontierReadiness(feature.status) >= 0 && frontierReadiness(feature.status) <= 100)
}

const start = '2026-09-07T00:00:00.000Z'
assert.equal(nextReviewIso(start, 1), '2026-09-08T00:00:00.000Z')
assert.equal(isReviewDue('2026-09-07T00:00:00.000Z', '2026-09-07T00:00:01.000Z'), true)
assert.equal(isReviewDue('2026-09-08T00:00:00.000Z', '2026-09-07T00:00:01.000Z'), false)
assert.equal(normalizeFocusMinutes(-100), 5)
assert.equal(normalizeFocusMinutes(999), 120)
assert.equal(reviewIntervalFor(0), 1)
assert.equal(reviewIntervalFor(1), 3)
assert.equal(reviewIntervalFor(2), 7)
assert.equal(reviewIntervalFor(50), 14)

const wrappers = [
  ['src/pages/Learn.tsx', /LifeLibraryWorkbench/],
  ['src/pages/KnowledgeBridge.tsx', /KnowledgeBridgeWorkbench/],
  ['src/pages/MedStudyHub.tsx', /StudyCommandCenter/],
  ['src/pages/MedStudyHub.tsx', /MedicalLibraryWorkbench/],
  ['src/pages/MedStudyHub.tsx', /bagian.*evidence/],
  ['src/pages/EdukasiAwam.tsx', /HealthLiteracyCoach/],
  ['src/pages/LifeStory.tsx', /StoryReflectionStudio/],
  ['src/pages/ResilienceStories.tsx', /ResilienceActionLab/],
  ['src/pages/RecentInnovationLab.tsx', /PanaceaFrontierSeven/],
] as const
for (const [path, pattern] of wrappers) assert.match(readFileSync(path, 'utf8'), pattern, `${path} must integrate its functional workspace`)

const frontierSource = readFileSync('src/lib/panaceaFrontierSeven.ts', 'utf8')
assert.match(frontierSource, /does not claim that no comparable idea exists anywhere in the world/)
assert.doesNotMatch(frontierSource, /guaranteed cure|will diagnose|will prescribe|autonomous diagnosis|autonomous prescribing/i)
assert.match(frontierSource, /must not autonomously diagnose or prescribe/)

const medicalLibrarySource = readFileSync('src/components/MedicalLibraryWorkbench.tsx', 'utf8')
assert.match(medicalLibrarySource, /Diagnosis/)
assert.match(medicalLibrarySource, /Therapy/)
assert.match(medicalLibrarySource, /Appraisal before conclusion/)
assert.match(medicalLibrarySource, /Effect size is read with uncertainty/)

console.log('life/knowledge experience: all assertions passed')
