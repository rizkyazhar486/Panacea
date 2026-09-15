import assert from 'node:assert/strict'
import { BODY_SYSTEM_SOURCE_WAVE } from '../../src/lib/bodySystemSourceWave.ts'
import {
  BODY_PATHOPHYSIOLOGY_BOUNDARY,
  BODY_PATHOPHYSIOLOGY_NETWORK,
  getBodyPathophysiologyScenario,
  listBodyPathophysiologyScenariosForAtlasSystem,
} from '../../src/lib/bodyPathophysiologyNetwork.ts'
import { getWholeBodySystem } from '../../src/lib/wholeBodyPhysiologyOS.ts'

assert.equal(BODY_PATHOPHYSIOLOGY_NETWORK.length, 4, 'the initial pathophysiology wave must expose four evidence-anchored scenarios')
assert.equal(new Set(BODY_PATHOPHYSIOLOGY_NETWORK.map((scenario) => scenario.id)).size, BODY_PATHOPHYSIOLOGY_NETWORK.length, 'scenario ids must be unique')

for (const scenario of BODY_PATHOPHYSIOLOGY_NETWORK) {
  assert.ok(scenario.title.length >= 20, `${scenario.id} needs a descriptive title`)
  assert.ok(scenario.summary.length >= 80, `${scenario.id} needs an explanatory summary`)
  assert.ok(scenario.atlasSystemIds.length >= 1, `${scenario.id} must map to at least one source-atlas system`)
  assert.ok(scenario.physiologySystemIds.length >= 1, `${scenario.id} must map to at least one physiology system`)
  assert.ok(scenario.cascade.length >= 5, `${scenario.id} must expose a multi-step mechanistic cascade`)
  assert.ok(scenario.equations.length >= 1, `${scenario.id} must include at least one teaching relationship`)
  assert.ok(scenario.evidence.length >= 1, `${scenario.id} must include PubMed provenance`)

  for (const atlasSystemId of scenario.atlasSystemIds) {
    assert.ok(BODY_SYSTEM_SOURCE_WAVE.some((system) => system.id === atlasSystemId), `${scenario.id} references unknown atlas system ${atlasSystemId}`)
  }

  for (const physiologySystemId of scenario.physiologySystemIds) getWholeBodySystem(physiologySystemId)

  for (const step of scenario.cascade) {
    assert.ok(step.label.length >= 8, `${scenario.id}/${step.id} needs a mechanistic label`)
    assert.ok(step.mechanism.length >= 60, `${scenario.id}/${step.id} needs a meaningful mechanism description`)
    assert.ok(step.systemIds.length >= 1, `${scenario.id}/${step.id} must identify at least one affected system`)
    for (const physiologySystemId of step.systemIds) getWholeBodySystem(physiologySystemId)
  }

  for (const equation of scenario.equations) {
    assert.ok(equation.expression.length >= 5, `${scenario.id} equation must not be empty`)
    assert.match(equation.note, /teaching|conceptual|directional/i, `${scenario.id} equations must state their educational role`)
    assert.match(equation.note, /not|no patient/i, `${scenario.id} equations must explicitly reject patient-specific inference`)
  }

  for (const source of scenario.evidence) {
    assert.match(source.pmid, /^\d{7,8}$/, `${scenario.id} evidence must carry a PMID`)
    assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`, `${scenario.id} PMID URL must be canonical`)
    assert.ok(source.role.length >= 50, `${scenario.id}/${source.pmid} needs an evidence-role explanation`)
  }
}

assert.deepEqual(
  getBodyPathophysiologyScenario('heart-failure').physiologySystemIds,
  ['cardiovascular', 'renal', 'endocrine', 'nervous', 'respiratory'],
  'heart failure must preserve its multisystem compensation/congestion context',
)
assert.ok(
  getBodyPathophysiologyScenario('ischemic-stroke').cascade.some((step) => /neurovascular/i.test(step.label)),
  'ischemic stroke must retain neurovascular-unit injury framing',
)
assert.ok(
  getBodyPathophysiologyScenario('venous-thromboembolism').equations.some((equation) => /Virchow/i.test(equation.expression)),
  'VTE must preserve the Virchow teaching framework',
)
assert.ok(
  getBodyPathophysiologyScenario('atherosclerosis').evidence.some((source) => source.pmid === '36952068'),
  'atherosclerosis must retain its plaque-vulnerability PubMed anchor',
)

assert.ok(listBodyPathophysiologyScenariosForAtlasSystem('cardiovascular').length >= 4, 'cardiovascular atlas context should surface all four initial vascular/hemodynamic scenarios')
assert.ok(listBodyPathophysiologyScenariosForAtlasSystem('urinary').some((scenario) => scenario.id === 'heart-failure'), 'urinary context should expose heart-failure cardiorenal physiology')
assert.ok(listBodyPathophysiologyScenariosForAtlasSystem('nervous').some((scenario) => scenario.id === 'ischemic-stroke'), 'nervous context should expose ischemic stroke')
assert.equal(listBodyPathophysiologyScenariosForAtlasSystem('integumentary-surface').length, 0, 'unmapped systems must not receive invented disease relationships')

assert.match(BODY_PATHOPHYSIOLOGY_BOUNDARY, /educational pathophysiology network/i)
assert.match(BODY_PATHOPHYSIOLOGY_BOUNDARY, /does not diagnose/i)
assert.match(BODY_PATHOPHYSIOLOGY_BOUNDARY, /does not.*recommend treatment/i)
assert.match(BODY_PATHOPHYSIOLOGY_BOUNDARY, /replace clinical assessment/i)

console.log('body pathophysiology network: 4 evidence-anchored multisystem cascades validated with provenance and safety boundaries')
