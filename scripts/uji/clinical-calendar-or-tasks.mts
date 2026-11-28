import assert from 'node:assert/strict'
import {
  CALENDAR_VIEWS,
  MODALITY_DISCLOSURES,
  WHO_CHECKLIST_DISCLAIMER,
  convertSpeechTranscriptToDraft,
  createDefaultWhoChecklist,
  createModalityRecognitionDraft,
  createNoteOrTask,
  detectOrConflicts,
  exportEventsToIcs,
  importEventsFromIcs,
  promoteTaskToCalendarEvent,
  scheduleOrCaseWithOverride,
  summarizeNoteToActionItems,
  toggleChecklistLine,
  toggleNotePin,
  toggleWhoChecklistItem,
  type CalendarEventItem,
  type OrSurgeryCase,
} from '../../src/domains/scheduling/index.ts'
import {
  readSchedulingStateForActor,
  writeSchedulingStateForActor,
} from '../../server/src/domains/scheduling/schedulingStore.ts'

assert.equal(CALENDAR_VIEWS.length, 10)
assert.match(WHO_CHECKLIST_DISCLAIMER, /tidak membuktikan pelaksanaan fisik/i)

// 1. .ics export/import + strict PHI stripping on personal/redacted exports
const events: CalendarEventItem[] = [
  {
    id: 'ev-1',
    ownerId: 'doc-1',
    scope: 'clinical',
    title: 'Operasi Pasien SYN-01 Apendektomi',
    startIso: '2026-11-25T02:00:00Z',
    endIso: '2026-11-25T04:00:00Z',
    timezone: 'Asia/Jakarta',
    location: 'OK 1',
    description: 'Detail PHI klinis sensitif',
    recurrence: 'none',
    patientId: 'pat-syn-01',
  },
  {
    id: 'ev-2',
    ownerId: 'doc-1',
    scope: 'personal',
    title: 'Jurnal Klub Pribadi',
    startIso: '2026-11-25T08:00:00Z',
    endIso: '2026-11-25T09:00:00Z',
    timezone: 'Asia/Jakarta',
    recurrence: 'weekly',
  },
]
const redactedIcs = exportEventsToIcs(events, { redactPhi: true })
assert.ok(!redactedIcs.includes('SYN-01 Apendektomi'), 'PHI title must be stripped when redactPhi is true')
assert.match(redactedIcs, /PHI Disembunyikan/)
const personalIcs = exportEventsToIcs(events, { personalOnly: true })
assert.ok(!personalIcs.includes('OK 1'))
const parsed = importEventsFromIcs(personalIcs, 'doc-1', 'personal')
assert.equal(parsed.length, 1)
assert.equal(parsed[0].title, 'Jurnal Klub Pribadi')

// 2. OR 6-resource conflict detection & Emergency Override audit
const baseOr: OrSurgeryCase = {
  id: 'or-1',
  patientId: 'p1',
  encounterId: 'e1',
  procedureName: 'Laparoskopi Apendektomi',
  orRoom: 'OK-1',
  operatorName: 'dr. B, Sp.B',
  anesthesiologistName: 'dr. A, Sp.An',
  nursingTeam: ['Ns. Rina', 'Ns. Budi'],
  equipment: ['C-Arm', 'Laparoskopi Tower'],
  pacuBay: 'PACU-1',
  anesthesiaType: 'General Anesthesia',
  positioning: 'Supine',
  startIso: '2026-11-25T01:00:00Z',
  endIso: '2026-11-25T03:00:00Z',
  lifecycleStage: 'Scheduled',
  preOpChecklist: { labsReady: true, allergiesReviewed: true, implantsReady: true, bloodReserveReady: true, icuPacuReady: true, consentSigned: true },
  whoChecklist: createDefaultWhoChecklist(),
}

const overlapping: OrSurgeryCase = {
  ...baseOr,
  id: 'or-2',
  patientId: 'p2',
  orRoom: 'OK-2',
  operatorName: 'dr. B, Sp.B', // overlapping surgeon
  anesthesiologistName: 'dr. A, Sp.An', // overlapping anesthesiologist
  nursingTeam: ['Ns. Rina'], // overlapping nurse
  equipment: ['C-Arm'], // overlapping equipment
  pacuBay: 'PACU-1', // overlapping recovery bay
}
const conflicts = detectOrConflicts([baseOr], overlapping)
assert.equal(conflicts.length, 5)

const blocked = scheduleOrCaseWithOverride([baseOr], overlapping)
assert.equal(blocked.ok, false)

const emergencyOk = scheduleOrCaseWithOverride([baseOr], overlapping, {
  isEmergency: true,
  reason: 'Perdarahan akut cito mengancam nyawa',
  actorName: 'dr. Kepala IGD',
  nowIso: '2026-11-25T00:30:00Z',
})
assert.equal(emergencyOk.ok, true)
if (emergencyOk.ok) {
  assert.equal(emergencyOk.cases[1].emergencyOverride?.isEmergency, true)
  assert.match(emergencyOk.cases[1].emergencyOverride?.reason ?? '', /mengancam nyawa/)
}

// 3. WHO Surgical Safety Checklist progression
let updatedOr = baseOr
for (const item of updatedOr.whoChecklist.signIn.items) {
  updatedOr = toggleWhoChecklistItem(updatedOr, 'signIn', item.id, 'Ns. Rina', '2026-11-25T00:50:00Z')
}
assert.equal(updatedOr.whoChecklist.signIn.completed, true)
assert.equal(updatedOr.whoChecklist.timeOut.completed, false)

// 4. Keep Notes/Tasks + Speech uncertain token + Handwriting vs Sign Language BISINDO/SIBI/ASL + Promote to Calendar
let note = createNoteOrTask(
  {
    ownerId: 'doc-1',
    kind: 'checklist',
    scope: 'patient',
    title: 'Follow up Bed 1',
    body: 'Cek ulang EKG dan verifikasi hasil lab elektrolit.',
    color: 'teal',
    pinned: false,
    archived: false,
    labels: ['IGD'],
    priority: 'high',
    recurrence: 'none',
    patientId: 'p1',
    checklistItems: [{ id: 'c1', text: 'Cek EKG 12-lead', done: false }],
  },
  1,
  '2026-11-24T10:00:00Z',
)
const notesPinned = toggleNotePin([note], note.id, '2026-11-24T10:01:00Z')
assert.equal(notesPinned[0].pinned, true)
const toggledLine = toggleChecklistLine(notesPinned, note.id, 'c1', '2026-11-24T10:02:00Z')
assert.equal(toggledLine[0].checklistItems[0].done, true)

const summary = summarizeNoteToActionItems(note)
assert.equal(summary.draftOnly, true)
assert.ok(summary.actionItems.length >= 1)

const speech = convertSpeechTranscriptToDraft('Pasien nyeri dada dan furosemide 40 mg', 'soap_draft', ['furosemide'])
assert.equal(speech.clinically_reviewed, false)
assert.match(speech.annotatedText, /\[TIDAK PASTI: furosemide\]/)
assert.ok(speech.warning)

const signDraft = createModalityRecognitionDraft('sign_language', 'Pasien menunjuk dada kiri', 'BISINDO')
assert.equal(signDraft.autoConfirmedToEmr, false)
assert.equal(signDraft.disclosure, MODALITY_DISCLOSURES.sign_language)
assert.match(signDraft.disclosure, /BISINDO, SIBI, dan ASL/)

const promoted = promoteTaskToCalendarEvent(note, '2026-11-25T05:00:00Z', 45)
assert.equal(promoted.linkedTaskId, note.id)
assert.equal(promoted.scope, 'clinical')

// 5. Server RBAC for Scheduling State
const patientWriteClinical = writeSchedulingStateForActor(
  undefined,
  { id: 'pat-1', name: 'Pasien', role: 'pasien' },
  { clinical: { events: [], orCases: [baseOr], notes: [] } },
  '2026-11-24T00:00:00Z',
)
assert.equal(patientWriteClinical.ok, false)
if (!patientWriteClinical.ok) assert.equal(patientWriteClinical.statusCode, 403)

const docWrite = writeSchedulingStateForActor(
  undefined,
  { id: 'doc-1', name: 'dr. R', role: 'dokter' },
  { personal: { events: [events[1]], notes: [] }, clinical: { events: [events[0]], orCases: [baseOr], notes: [note] } },
  '2026-11-24T00:00:00Z',
)
assert.equal(docWrite.ok, true)
if (docWrite.ok) {
  const patientRead = readSchedulingStateForActor(docWrite.nextState, { id: 'pat-1', role: 'pasien' })
  assert.equal(patientRead.clinical, null, 'Patient must never read clinical OR schedule')
  const docRead = readSchedulingStateForActor(docWrite.nextState, { id: 'doc-1', role: 'dokter' })
  assert.equal(docRead.clinical?.orCases.length, 1)
}

console.log('clinical-calendar-or-tasks: all deterministic assertions PASSED.')
