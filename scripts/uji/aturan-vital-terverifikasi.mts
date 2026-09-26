import assert from 'node:assert/strict'
import { susunRencana } from '../../server/src/carePlan.ts'
import { buildClinicianContinuousCareDigest, type ContinuousCarePlan } from '../../src/lib/continuousCareOperatingSystem.ts'
import { createLongitudinalPatientState, ingestLongitudinalEvent, type LongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'
const now='2026-09-26T07:30:00.000Z'
const plan=susunRencana({diagnosisRefs:[{system:'local',code:'f',display:'Follow-up'}],questions:[{id:'q1',prompt:'New symptom?',kind:'boolean',required:true}],measurementReviewRules:[{metric:'vital.sbp',operator:'gte',threshold:180,unit:'mmHg',maxAgeDays:1,label:'SBP ≥ 180',priority:'review-today',rationale:'test',evidenceRef:'test',sourcePolicy:'shared-lab-transcribed'}]},'patient-1','doctor-1',new Date(now))
assert.equal(plan.measurementReviewRules[0].sourcePolicy,'verified-clinical-vital')
const consent={granted:true,purposes:['clinical-support'] as const,grantedAt:'2026-09-25T00:00:00.000Z',expiresAt:'2026-09-27T00:00:00.000Z'}
function digest(semanticState:'patient-reported'|'clinician-entered',sourceKind:'clinical-system'|'manual'='clinical-system'){
 const e:LongitudinalEvent<number>={id:`v-${semanticState}-${sourceKind}`,subjectId:'patient-1',domain:'vital',metric:'vital.sbp',value:190,unit:'mmHg',recordedAt:'2026-09-26T07:20:00.000Z',confidence:1,provenance:{sourceKind,sourceId:'panaceamed:ai-emr',capturedAt:'2026-09-26T07:20:00.000Z',receivedAt:'2026-09-26T07:21:00.000Z'},consent,review:{state:'not-required'},semanticState}
 let st=createLongitudinalPatientState('patient-1',now); st=ingestLongitudinalEvent(st,e).state
 return buildClinicianContinuousCareDigest(plan as ContinuousCarePlan,null,st,now)
}
assert.equal(digest('patient-reported').measurementRules[0].state,'source-unverified')
assert.equal(digest('patient-reported').workflowPriority,'routine')
assert.equal(digest('clinician-entered','manual').measurementRules[0].state,'source-unverified')
assert.equal(digest('clinician-entered').measurementRules[0].state,'triggered')
assert.equal(digest('clinician-entered').workflowPriority,'review-today')
console.log('aturan-vital-terverifikasi: unverified values fail closed; server-stamped clinician vital may trigger')
