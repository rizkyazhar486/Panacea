import assert from 'node:assert/strict'
import {
  BODY_DRUG_MECHANISM_BOUNDARY,
  BODY_DRUG_MECHANISM_NETWORK,
  getBodyDrugMechanism,
  listBodyDrugMechanismsForAtlasSystem,
  listBodyDrugMechanismsForScenario,
} from '../../src/lib/bodyDrugMechanismNetwork.ts'
import { getBodyPathophysiologyScenario } from '../../src/lib/bodyPathophysiologyNetwork.ts'
import { getWholeBodySystem } from '../../src/lib/wholeBodyPhysiologyOS.ts'

assert.equal(BODY_DRUG_MECHANISM_NETWORK.length, 4, 'initial drug-mechanism wave must expose four representative label-anchored agents')
assert.equal(new Set(BODY_DRUG_MECHANISM_NETWORK.map((item) => item.id)).size, BODY_DRUG_MECHANISM_NETWORK.length, 'drug mechanism ids must be unique')

for (const drug of BODY_DRUG_MECHANISM_NETWORK) {
  assert.ok(drug.genericName.length >= 5, `${drug.id} needs a generic name`)
  assert.ok(drug.drugClass.length >= 12, `${drug.id} needs a pharmacologic class`)
  assert.ok(drug.targetSummary.length >= 45, `${drug.id} needs a target summary`)
  assert.ok(drug.mechanism.length >= 4, `${drug.id} needs target → pathway → physiology → disease-context steps`)
  assert.ok(drug.linkedScenarioIds.length >= 1, `${drug.id} must connect to at least one evidence-anchored pathophysiology scenario`)
  assert.ok(drug.physiologySystemIds.length >= 1, `${drug.id} must connect to at least one whole-body physiology domain`)
  assert.ok(drug.pathwayNotation.includes('→'), `${drug.id} must expose directional pathway notation`)

  for (const scenarioId of drug.linkedScenarioIds) getBodyPathophysiologyScenario(scenarioId)
  for (const systemId of drug.physiologySystemIds) getWholeBodySystem(systemId)

  const kinds = new Set(drug.mechanism.map((step) => step.kind))
  assert.ok(kinds.has('molecular-target'), `${drug.id} must include a molecular-target step`)
  assert.ok(kinds.has('pathway') || drug.mechanism.filter((step) => step.kind === 'molecular-target').length > 1, `${drug.id} must expose pathway logic`)
  assert.ok(kinds.has('physiologic-effect'), `${drug.id} must include a physiologic-effect step`)
  assert.ok(kinds.has('disease-context'), `${drug.id} must include a disease-context step`)

  for (const step of drug.mechanism) {
    assert.ok(step.label.length >= 8, `${drug.id}/${step.id} needs a descriptive label`)
    assert.ok(step.detail.length >= 80, `${drug.id}/${step.id} needs a meaningful mechanism explanation`)
  }

  assert.equal(drug.labelSource.source, 'DailyMed')
  assert.match(drug.labelSource.setId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, `${drug.id} needs a canonical DailyMed set id`)
  assert.equal(drug.labelSource.sectionCode, '43679-0', `${drug.id} must point to the SPL Mechanism of Action section`)
  assert.equal(drug.labelSource.sectionTitle, '12.1 Mechanism of Action')
  assert.ok(drug.labelSource.version >= 1, `${drug.id} must preserve label version metadata`)
  assert.match(drug.labelSource.effectiveDate, /^\d{4}-\d{2}-\d{2}$/, `${drug.id} must preserve label effective date`)
  assert.equal(drug.labelSource.url, `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${drug.labelSource.setId}`)

  assert.match(drug.educationalNote, /mechanism visualization only/i)
  assert.match(drug.educationalNote, /dose|dosing/i)
  assert.match(drug.educationalNote, /not|does not|deliberately omits/i)
}

assert.match(getBodyDrugMechanism('atorvastatin').pathwayNotation, /HMG-CoA reductase/i)
assert.ok(getBodyDrugMechanism('atorvastatin').mechanism.some((step) => /LDL-receptor/i.test(step.label)), 'atorvastatin must preserve hepatic LDL-receptor mechanism context')
assert.match(getBodyDrugMechanism('sacubitril-valsartan').pathwayNotation, /NEP inhibition/i)
assert.match(getBodyDrugMechanism('sacubitril-valsartan').pathwayNotation, /AT1 blockade/i)
assert.ok(getBodyDrugMechanism('alteplase').mechanism.some((step) => /Plasminogen → plasmin/i.test(step.label)), 'alteplase must preserve plasminogen-to-plasmin mechanism')
assert.ok(getBodyDrugMechanism('apixaban').mechanism.some((step) => /Factor Xa inhibition/i.test(step.label)), 'apixaban must preserve factor Xa target')

assert.deepEqual(listBodyDrugMechanismsForScenario('atherosclerosis').map((item) => item.id), ['atorvastatin'])
assert.ok(listBodyDrugMechanismsForScenario('heart-failure').some((item) => item.id === 'sacubitril-valsartan'))
assert.ok(listBodyDrugMechanismsForScenario('ischemic-stroke').some((item) => item.id === 'alteplase'))
assert.ok(listBodyDrugMechanismsForScenario('venous-thromboembolism').some((item) => item.id === 'apixaban'))
assert.ok(listBodyDrugMechanismsForScenario('venous-thromboembolism').some((item) => item.id === 'alteplase'))

assert.ok(listBodyDrugMechanismsForAtlasSystem('cardiovascular').length >= 3, 'cardiovascular context should expose multiple representative mechanisms')
assert.ok(listBodyDrugMechanismsForAtlasSystem('urinary').some((item) => item.id === 'sacubitril-valsartan'), 'urinary context should preserve cardiorenal ARNI mechanism link')
assert.equal(listBodyDrugMechanismsForAtlasSystem('integumentary-surface').length, 0, 'unmapped systems must not receive invented pharmacology relationships')

assert.match(BODY_DRUG_MECHANISM_BOUNDARY, /educational pharmacology-mechanism map/i)
assert.match(BODY_DRUG_MECHANISM_BOUNDARY, /does not recommend a drug/i)
assert.match(BODY_DRUG_MECHANISM_BOUNDARY, /dose/i)
assert.match(BODY_DRUG_MECHANISM_BOUNDARY, /patient-specific therapy/i)

console.log('body drug mechanism network: four DailyMed-anchored mechanisms validated with linked physiology/pathophysiology and non-prescribing boundaries')
