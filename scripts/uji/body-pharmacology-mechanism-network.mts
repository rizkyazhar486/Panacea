import assert from 'node:assert/strict'
import { BODY_SYSTEM_SOURCE_WAVE } from '../../src/lib/bodySystemSourceWave.ts'
import {
  BODY_PHARMACOLOGY_MECHANISM_NETWORK,
  BODY_PHARMACOLOGY_NETWORK_BOUNDARY,
  PHARMACOLOGY_TEACHING_EQUATIONS,
  getBodyPharmacologyMechanism,
  listBodyPharmacologyForAtlasSystem,
  listBodyPharmacologyForScenario,
} from '../../src/lib/bodyPharmacologyMechanismNetwork.ts'
import { getBodyPathophysiologyScenario } from '../../src/lib/bodyPathophysiologyNetwork.ts'
import { getWholeBodySystem } from '../../src/lib/wholeBodyPhysiologyOS.ts'

assert.equal(BODY_PHARMACOLOGY_MECHANISM_NETWORK.length, 7, 'pharmacology wave must expose seven evidence-anchored class mechanisms')
assert.equal(new Set(BODY_PHARMACOLOGY_MECHANISM_NETWORK.map((mechanism) => mechanism.id)).size, BODY_PHARMACOLOGY_MECHANISM_NETWORK.length, 'pharmacology mechanism ids must be unique')

for (const mechanism of BODY_PHARMACOLOGY_MECHANISM_NETWORK) {
  assert.ok(mechanism.classLabel.length >= 8, `${mechanism.id} needs a class label`)
  assert.ok(mechanism.targetLabel.length >= 6, `${mechanism.id} needs a molecular target`)
  assert.ok(mechanism.summary.length >= 90, `${mechanism.id} needs an explanatory summary`)
  assert.ok(mechanism.representativeExamples.length >= 1, `${mechanism.id} needs representative examples`)
  assert.equal(mechanism.mechanismChain.length, 5, `${mechanism.id} must traverse exactly target → molecular → cellular → organ → systems`)
  assert.deepEqual(mechanism.mechanismChain.map((step) => step.layer), ['target', 'molecular', 'cellular', 'organ', 'systems'], `${mechanism.id} must preserve the five-scale mechanism order`)
  assert.ok(mechanism.equations.length >= 1, `${mechanism.id} must include a teaching relationship`)
  assert.ok(mechanism.evidence.length >= 1, `${mechanism.id} must include PubMed provenance`)
  assert.ok(mechanism.linkedScenarioIds.length >= 1, `${mechanism.id} must connect to at least one pathophysiology scenario`)

  for (const atlasSystemId of mechanism.atlasSystemIds) {
    assert.ok(BODY_SYSTEM_SOURCE_WAVE.some((system) => system.id === atlasSystemId), `${mechanism.id} references unknown atlas system ${atlasSystemId}`)
  }
  for (const physiologySystemId of mechanism.physiologySystemIds) getWholeBodySystem(physiologySystemId)
  for (const scenarioId of mechanism.linkedScenarioIds) getBodyPathophysiologyScenario(scenarioId)

  for (const step of mechanism.mechanismChain) {
    assert.ok(step.label.length >= 8, `${mechanism.id}/${step.id} needs a meaningful label`)
    assert.ok(step.mechanism.length >= 90, `${mechanism.id}/${step.id} needs a detailed mechanism statement`)
  }

  for (const equation of mechanism.equations) {
    assert.ok(equation.expression.length >= 8, `${mechanism.id} equation cannot be empty`)
    assert.match(equation.note, /teaching|conceptual|directional/i, `${mechanism.id} equations must identify their educational role`)
    assert.match(equation.note, /not|no patient/i, `${mechanism.id} equations must reject patient-specific inference`)
  }

  for (const source of mechanism.evidence) {
    assert.match(source.pmid, /^\d{7,8}$/, `${mechanism.id} evidence must carry a PMID`)
    assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`, `${mechanism.id} PMID URL must be canonical`)
    assert.ok(source.role.length >= 70, `${mechanism.id}/${source.pmid} needs an evidence-role explanation`)
  }

  assert.match(mechanism.boundary, /does not choose|does not/i, `${mechanism.id} must preserve a non-prescribing boundary`)
  assert.match(mechanism.boundary, /dose/i, `${mechanism.id} must reject dosing`)
  assert.match(mechanism.boundary, /clinical judgment/i, `${mechanism.id} must retain clinical-judgment boundary`)
}

assert.deepEqual(getBodyPharmacologyMechanism('statin-hmgcr').mechanismChain.map((step) => step.layer), ['target', 'molecular', 'cellular', 'organ', 'systems'], 'statin mechanism must preserve scale continuity')
assert.ok(getBodyPharmacologyMechanism('aspirin-cox1').mechanismChain.some((step) => /thromboxane/i.test(step.mechanism)), 'aspirin mechanism must retain thromboxane biology')
assert.ok(getBodyPharmacologyMechanism('ace-inhibition').linkedScenarioIds.includes('heart-failure'), 'ACE inhibition must connect to the heart-failure mechanism network')
assert.ok(getBodyPharmacologyMechanism('sglt2-inhibition').physiologySystemIds.includes('renal'), 'SGLT2 inhibition must preserve its canonical renal target context')
assert.ok(getBodyPharmacologyMechanism('factor-xa-inhibition').linkedScenarioIds.includes('venous-thromboembolism'), 'factor Xa inhibition must connect to VTE pathophysiology')
assert.ok(getBodyPharmacologyMechanism('pcsk9-inhibition').mechanismChain.some((step) => /LDL-receptor degradation decreases/i.test(step.label)), 'PCSK9 mechanism must preserve LDLR-degradation biology')

assert.ok(listBodyPharmacologyForAtlasSystem('cardiovascular').length >= 6, 'cardiovascular atlas context should expose the broad vascular/cardiorenal mechanism wave')
assert.ok(listBodyPharmacologyForAtlasSystem('urinary').some((item) => item.id === 'sglt2-inhibition'), 'urinary context should expose SGLT2 renal-target pharmacology')
assert.ok(listBodyPharmacologyForAtlasSystem('nervous').some((item) => item.id === 'beta1-blockade'), 'nervous context should expose autonomic beta-blockade context')
assert.equal(listBodyPharmacologyForAtlasSystem('integumentary-surface').length, 0, 'unmapped atlas systems must not receive invented drug relationships')

assert.ok(listBodyPharmacologyForScenario('atherosclerosis').some((item) => item.id === 'statin-hmgcr'), 'atherosclerosis should connect to statin mechanism')
assert.ok(listBodyPharmacologyForScenario('heart-failure').some((item) => item.id === 'ace-inhibition'), 'heart failure should connect to ACE inhibition')
assert.ok(listBodyPharmacologyForScenario('heart-failure').some((item) => item.id === 'sglt2-inhibition'), 'heart failure should connect to SGLT2 inhibition')
assert.ok(listBodyPharmacologyForScenario('venous-thromboembolism').some((item) => item.id === 'factor-xa-inhibition'), 'VTE should connect to factor Xa inhibition')

assert.equal(PHARMACOLOGY_TEACHING_EQUATIONS.length, 2, 'general PK/PD layer must expose two bounded teaching equations')
for (const equation of PHARMACOLOGY_TEACHING_EQUATIONS) {
  assert.match(equation.note, /not|no patient/i)
  assert.match(equation.note, /dose|dosing|concentration/i)
}

assert.match(BODY_PHARMACOLOGY_NETWORK_BOUNDARY, /educational pharmacology-mechanism network/i)
assert.match(BODY_PHARMACOLOGY_NETWORK_BOUNDARY, /does not prescribe/i)
assert.match(BODY_PHARMACOLOGY_NETWORK_BOUNDARY, /does not.*dose/i)
assert.match(BODY_PHARMACOLOGY_NETWORK_BOUNDARY, /patient-specific benefit or harm/i)
assert.match(BODY_PHARMACOLOGY_NETWORK_BOUNDARY, /official prescribing information/i)

console.log('body pharmacology mechanism network: 7 class-level target-to-system chains validated with PubMed provenance and non-prescribing boundaries')