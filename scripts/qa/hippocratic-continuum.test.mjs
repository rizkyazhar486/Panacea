import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { translateHippocraticBridge } from '../../src/domains/education/hippocraticBridgeEngine.ts'
import {
  buildContinuumOutboxEvent,
  evaluateLifeHealthContinuum,
  transitionContinuumPhase,
} from '../../src/domains/continuum/lifeHealthContinuumEngine.ts'
import { resolveCorpusShardRequest } from '../../src/domains/education/corpusShardPlanner.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

test('hippocraticBridgeEngine: produces 3 synchronized literacy lenses with <=15-word plain points & speech output', () => {
  const invalid = translateHippocraticBridge({ topicTitle: '   ' })
  assert.equal(invalid.ok, false)

  const res = translateHippocraticBridge({
    topicTitle: 'Hipertensi Derajat 1',
    language: 'id',
    symptomSummary: 'Pusing ringan pagi hari',
    labFindings: [{ name: 'HbA1c', valueText: '5.6', unit: '%', status: 'normal', loincCode: '4548-4' }],
    medications: [{ name: 'Amlodipine 5mg', schedule: '1x sehari pagi', purpose: 'melemaskan pembuluh darah' }],
    icd10: 'I10',
    icd11: 'BA00',
    spo2Pct: 98,
    systolicMmHg: 142,
    consentConfirmed: true,
    scopeId: 'rizkyazhar486',
  })

  assert.equal(res.ok, true)
  if (!res.ok) return
  assert.equal(res.redFlagDetected, false)
  assert.equal(res.clinicallyReviewed, false)
  assert.equal(res.truthClass, 'measured')
  assert.equal(res.hippocraticCompliance.beneficence, true)
  assert.equal(res.hippocraticCompliance.autonomyConsentClear, true)
  assert.equal(res.hippocraticCompliance.confidentialityScoped, true)
  assert.equal(res.patient_partner.questionsForDoctor.length, 3)
  assert.equal(res.clinician_brief.codeAnchors.icd10, 'I10')
  assert.ok(res.clinician_brief.codeAnchors.loinc.includes('4548-4'))
  assert.ok(res.plain_universal.speechSynthesisText.length > 20)

  // <= 15 words invariant on plain_universal points
  const wordCount = (s) => s.trim().split(/\s+/).length
  assert.ok(wordCount(res.plain_universal.summary) <= 15)
  assert.ok(wordCount(res.plain_universal.analogy) <= 15)
  for (const act of [...res.plain_universal.whatToDoToday, ...res.plain_universal.doNotDo]) {
    assert.ok(wordCount(act) <= 15, `Plain point exceeded 15 words: ${act}`)
  }
})

test('hippocraticBridgeEngine: fails closed on red-flag vitals, chest pain, and PHQ-9 item 9 crisis', () => {
  const hypoxia = translateHippocraticBridge({
    topicTitle: 'Sesak Napas',
    language: 'id',
    spo2Pct: 86,
  })
  assert.equal(hypoxia.ok, true)
  if (hypoxia.ok) {
    assert.equal(hypoxia.redFlagDetected, true)
    assert.equal(hypoxia.emergencyEscalationRequired, true)
    assert.match(hypoxia.plain_universal.redFlagErTrigger, /IGD/i)
  }

  const crisis = translateHippocraticBridge({
    topicTitle: 'Evaluasi Suasana Hati',
    language: 'en',
    phq9Item9Score: 2,
  })
  assert.equal(crisis.ok, true)
  if (crisis.ok) {
    assert.equal(crisis.redFlagDetected, true)
    assert.equal(crisis.emergencyEscalationRequired, true)
  }
})

test('lifeHealthContinuumEngine: supports 3 phases, missing-vital null safety, emergency triage, and idempotent outbox events', () => {
  const before = evaluateLifeHealthContinuum({
    language: 'id',
    vitals: { sleepHours: null, restingHrBpm: null, steps: null },
  })
  assert.equal(before.activePhase, 'before_illness')
  assert.equal(before.before_illness.readinessSummary.status, 'unobserved')
  assert.equal(before.before_illness.readinessSummary.restingHrBpm, null)

  const duringUrgent = evaluateLifeHealthContinuum({
    phase: 'during_illness',
    activeSymptoms: ['nyeri dada menjalar'],
    vitals: { spo2Pct: 88 },
  })
  assert.equal(duringUrgent.during_illness.triageLevel, 'emergency_igd')
  assert.equal(duringUrgent.during_illness.emergencyBanner, 'Ke IGD Sekarang')

  const after = evaluateLifeHealthContinuum({
    recoveryTrend: 'better',
    postIllnessMedChecklist: [{ name: 'Obat Pagi', schedule: '07:00', taken: true }],
  })
  assert.equal(after.activePhase, 'after_illness')
  assert.equal(after.after_illness.recoveryTrend, 'better')

  const trans = transitionContinuumPhase('before_illness', 'during_illness', 'Acute fever started', '2026-11-20T04:00:00Z')
  assert.equal(trans.ok, true)
  assert.equal(trans.changed, true)

  const badTrans = transitionContinuumPhase('before_illness', 'during_illness', '', 'not-iso')
  assert.equal(badTrans.ok, false)

  const ev1 = buildContinuumOutboxEvent({
    profileKey: 'rizkyazhar486',
    phase: 'before_illness',
    literacyLens: 'plain_universal',
    teachBackConfirmed: true,
    redFlagEscalated: false,
    nonPhiPassRef: 'PMD-000486',
    recordedAtIso: '2026-11-20T04:00:00Z',
  })
  const ev2 = buildContinuumOutboxEvent({
    profileKey: 'rizkyazhar486',
    phase: 'before_illness',
    literacyLens: 'plain_universal',
    teachBackConfirmed: true,
    redFlagEscalated: false,
    nonPhiPassRef: 'PMD-000486',
    recordedAtIso: '2026-11-20T04:15:00Z',
  })
  assert.equal(ev1.idempotencyKey, ev2.idempotencyKey)
})

test('corpusShardPlanner: resolves SKDI shard URL deterministically and fails closed for missing keys', () => {
  const manifest = {
    version: '1.0.0',
    kind: 'skdi',
    totalKeys: 1,
    shardCount: 1,
    maxShardGzipBytes: 1200,
    keyToShard: { Hypertension: 'shard-000' },
    shards: { 'shard-000': { file: 'shard-000.json', bytes: 2000, gzipBytes: 900, sha256: 'abc', count: 1 } },
  }
  const hit = resolveCorpusShardRequest('skdi', 'Hypertension', manifest)
  assert.equal(hit.found, true)
  assert.equal(hit.shardUrl, './data/corpora/skdi/shard-000.json')

  const miss = resolveCorpusShardRequest('skdi', 'Unknown Condition XYZ', manifest)
  assert.equal(miss.found, false)
  assert.equal(miss.shardUrl, null)
})

test('Purity guard: education & continuum pure engines contain zero forbidden browser/clock/random/fetch globals', () => {
  const files = [
    'src/domains/education/hippocraticBridgeEngine.ts',
    'src/domains/education/corpusShardPlanner.ts',
    'src/domains/continuum/lifeHealthContinuumEngine.ts',
  ]
  const forbidden = [
    /(?<![\w.$])window(?:\.[A-Za-z_$]|\[)/,
    /(?<![\w.$])document(?:\.[A-Za-z_$]|\[)/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /(?<![\w.$])fetch\s*\(/,
  ]
  for (const rel of files) {
    const raw = readFileSync(join(ROOT, rel), 'utf8')
    const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
    for (const pattern of forbidden) {
      assert.equal(pattern.test(stripped), false, `${rel} violated purity rule ${pattern}`)
    }
  }
})
