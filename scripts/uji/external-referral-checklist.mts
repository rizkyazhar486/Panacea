import assert from 'node:assert/strict'
import {
  DEFAULT_EXTERNAL_REFERRAL_ITEMS,
  addChecklistItem,
  buildDischargeResumeDraft,
  computeChecklistProgress,
  createReferralChecklistState,
  resetReferralChecklist,
  toggleChecklistItem,
  transitionReferralLifecycle,
  updateChecklistItemConfig,
} from '../../src/domains/clinical-operations/engine/externalReferralChecklistEngine.ts'

assert.equal(DEFAULT_EXTERNAL_REFERRAL_ITEMS.length, 9)
let ref = createReferralChecklistState({ patientId: 'p1', encounterId: 'e1', nowIso: '2026-11-24T01:00:00Z' })
assert.equal(computeChecklistProgress(ref).done, 0)
assert.equal(computeChecklistProgress(ref).percent, 0)

ref = toggleChecklistItem(ref, DEFAULT_EXTERNAL_REFERRAL_ITEMS[0].id, {
  actorName: 'dr. Jaga',
  nowIso: '2026-11-24T01:02:00Z',
})
assert.equal(computeChecklistProgress(ref).done, 1)
assert.equal(computeChecklistProgress(ref).percent, 11)

// Blocked from Ready for Transfer without manual SISRUTE confirmation & required items
const blockedTransfer = transitionReferralLifecycle(ref, 'Ready for Transfer', {
  nowIso: '2026-11-24T01:03:00Z',
  manualSisruteConfirmed: false,
})
assert.equal(blockedTransfer.ok, false)

ref = updateChecklistItemConfig(ref, DEFAULT_EXTERNAL_REFERRAL_ITEMS[2].id, { copyBadge: '3 Rangkap' }, '2026-11-24T01:03:30Z')
assert.equal(ref.items[2].copyBadge, '3 Rangkap')

ref = addChecklistItem(ref, { label: 'Catatan ICU tambahan', copyBadge: '1 Rangkap', required: false }, '2026-11-24T01:04:00Z')
assert.equal(ref.items.length, 10)

ref = resetReferralChecklist(ref, '2026-11-24T01:05:00Z')
assert.equal(computeChecklistProgress(ref).done, 0)

// Mark all required items checked + manual SISRUTE confirmation -> transitions to Ready for Transfer
for (const item of ref.items) {
  if (item.required) {
    ref = toggleChecklistItem(ref, item.id, { actorName: 'Perawat Rujukan', nowIso: '2026-11-24T01:06:00Z' })
  }
}
const allowedTransfer = transitionReferralLifecycle(ref, 'Ready for Transfer', {
  nowIso: '2026-11-24T01:07:00Z',
  manualSisruteConfirmed: true,
  sisruteReferenceNo: 'SYN-SISRUTE-01',
})
assert.equal(allowedTransfer.ok, true)

const resumeDraft = buildDischargeResumeDraft({
  patientNameOrCode: 'SYN-01',
  primaryDiagnosis: 'D48.9 Suspek massa nasofaring',
  summaryClinicalCourse: 'Observasi tanda vital & rencana evaluasi THT/Mata.',
  dischargeMedications: ['Paracetamol 500 mg'],
  redFlags: ['Sesak napas', 'Perdarahan aktif'],
})
assert.equal(resumeDraft.clinically_reviewed, false)
assert.match(resumeDraft.text, /clinically_reviewed = false/)

console.log('external-referral-checklist: all assertions PASSED.')
