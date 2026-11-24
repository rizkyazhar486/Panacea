import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
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
  toggleNoteArchive,
  toggleNotePin,
  toggleWhoChecklistItem,
  type CalendarEventItem,
  type CalendarViewMode,
  type ClinicalNoteOrTask,
  type NoteKind,
  type OrSurgeryCase,
} from '../../domains/scheduling'

type SchedTab = 'calendar' | 'or-scheduler' | 'keep-tasks'

export default function ClinicalCalendarAndTasksWorkspace() {
  const { account, activePatient } = useStore()
  const ownerId = account?.id ?? 'clinician-local'
  const actorName = account?.name ?? 'Dokter / Tim Klinik'

  const [tab, setTab] = useState<SchedTab>('calendar')
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week')
  const [redactPhi, setRedactPhi] = useState(true)
  const [events, setEvents] = useState<CalendarEventItem[]>(() => [
    {
      id: 'ev-demo-1',
      ownerId,
      scope: 'clinical',
      title: `Visite & Follow-Up ${activePatient?.name ?? 'Pasien'}`,
      startIso: '2026-11-25T02:00:00Z',
      endIso: '2026-11-25T03:00:00Z',
      timezone: 'Asia/Jakarta',
      location: 'IGD / Bangsal',
      recurrence: 'none',
      patientId: activePatient?.id,
    },
  ])
  const [newTitle, setNewTitle] = useState('')
  const [newScope, setNewScope] = useState<'personal' | 'clinical'>('clinical')
  const [icsBox, setIcsBox] = useState('')

  // Tab 2: Operating Theater Scheduler & WHO Checklist
  const [orCases, setOrCases] = useState<OrSurgeryCase[]>(() => [
    {
      id: 'ok-1',
      patientId: activePatient?.id ?? 'syn-p1',
      encounterId: 'enc-1',
      procedureName: 'Eksisi Massa / Tindakan Terencana',
      orRoom: 'OK-1',
      operatorName: 'dr. Operator, Sp.B',
      anesthesiologistName: 'dr. Anestesi, Sp.An',
      nursingTeam: ['Ns. Rina', 'Ns. Budi'],
      equipment: ['C-Arm'],
      pacuBay: 'PACU-1',
      anesthesiaType: 'General',
      positioning: 'Supine',
      startIso: '2026-11-25T01:00:00Z',
      endIso: '2026-11-25T03:00:00Z',
      lifecycleStage: 'Scheduled',
      preOpChecklist: { labsReady: true, allergiesReviewed: true, implantsReady: true, bloodReserveReady: true, icuPacuReady: true, consentSigned: true },
      whoChecklist: createDefaultWhoChecklist(),
    },
  ])
  const [newOrRoom, setNewOrRoom] = useState('OK-1')
  const [overrideEmergency, setOverrideEmergency] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [orNotice, setOrNotice] = useState('')

  const candidateOr: OrSurgeryCase = useMemo(
    () => ({
      ...orCases[0],
      id: `ok-${orCases.length + 1}`,
      orRoom: newOrRoom,
      procedureName: 'Jadwal Operasi Baru',
    }),
    [orCases, newOrRoom],
  )
  const detectedConflicts = useMemo(() => detectOrConflicts(orCases, candidateOr), [orCases, candidateOr])

  // Tab 3: Keep Notes & AI Tasks
  const [notes, setNotes] = useState<ClinicalNoteOrTask[]>(() => [
    createNoteOrTask(
      {
        ownerId,
        kind: 'checklist',
        scope: 'patient',
        title: 'Checklist Pra-Tindakan & Kontrol',
        body: 'Cek ulang EKG 12-lead dan verifikasi hasil lab sebelum transfer OK.',
        color: 'teal',
        pinned: true,
        archived: false,
        labels: ['IGD', 'OK'],
        priority: 'high',
        recurrence: 'none',
        patientId: activePatient?.id,
        checklistItems: [
          { id: 'c1', text: 'Pastikan hasil lab & EKG terbaru terlampir', done: false },
          { id: 'c2', text: 'Konfirmasi puasa & informed consent', done: false },
        ],
      },
      1,
      new Date().toISOString(),
    ),
  ])
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteKind, setNoteKind] = useState<NoteKind>('quick')
  const [speechText, setSpeechText] = useState('Pasien keluhan nyeri dada dan obat furosemide 40 mg')
  const [uncertainWord, setUncertainWord] = useState('furosemide')
  const [modalityType, setModalityType] = useState<'handwriting_ocr' | 'sign_language'>('sign_language')
  const [signVariant, setSignVariant] = useState<'BISINDO' | 'SIBI' | 'ASL'>('BISINDO')
  const [keepNotice, setKeepNotice] = useState('')

  const speechPreview = useMemo(
    () => convertSpeechTranscriptToDraft(speechText, 'soap_draft', uncertainWord ? [uncertainWord] : []),
    [speechText, uncertainWord],
  )
  const modalityPreview = useMemo(
    () => createModalityRecognitionDraft(modalityType, speechText, signVariant),
    [modalityType, speechText, signVariant],
  )

  return (
    <section
      aria-label="Universal Calendar, OR Scheduler & Keep Tasks OS"
      className="dark space-y-4 rounded-3xl border border-white/15 bg-[#070d18] p-4 text-white shadow-xl sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <span className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-3 py-1 font-mono text-[11px] font-bold text-cyan-200">
            CALENDAR OS · OR SCHEDULER · KEEP NOTES &amp; TASKS
          </span>
          <h2 className="mt-2 text-lg font-extrabold text-white">Jadwal Klinis, Kamar Operasi (OK) &amp; Catatan Kerja</h2>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {([
            ['calendar', 'Calendar OS'],
            ['or-scheduler', 'OK & WHO Checklist'],
            ['keep-tasks', 'Keep Notes & Tugas AI'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-11 rounded-xl border px-3 text-xs font-bold ${
                tab === id ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-white/15 bg-slate-900 text-white/75'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'calendar' && (
        <div className="space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Mode Tampilan Kalender" value={viewMode} onChange={(e) => setViewMode(e.target.value as CalendarViewMode)} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-xs text-white">
                {CALENDAR_VIEWS.map((v) => <option key={v} value={v}>View: {v}</option>)}
              </select>
              <label className="inline-flex min-h-11 items-center gap-2 px-2">
                <input type="checkbox" checked={redactPhi} onChange={(e) => setRedactPhi(e.target.checked)} />
                Anonimisasi PHI pada Export .ics
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setIcsBox(exportEventsToIcs(events, { redactPhi }))} className="min-h-11 rounded-xl bg-sky-600 px-3 font-bold text-white">Export .ics</button>
              <button
                type="button"
                onClick={() => {
                  if (!icsBox.trim()) return
                  const imported = importEventsFromIcs(icsBox, ownerId, 'personal')
                  if (imported.length) setEvents((ev) => [...ev, ...imported])
                }}
                className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 font-bold text-white"
              >
                Import .ics
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select value={newScope} onChange={(e) => setNewScope(e.target.value as 'personal' | 'clinical')} className="min-h-11 rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white">
              <option value="clinical">Kalender Klinis</option>
              <option value="personal">Kalender Pribadi (Terisolasi)</option>
            </select>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Judul agenda / visite / jaga / kontrol..." className="min-h-11 flex-1 rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white" />
            <button
              type="button"
              onClick={() => {
                if (!newTitle.trim()) return
                setEvents((prev) => [
                  ...prev,
                  {
                    id: `ev-${prev.length + 1}`,
                    ownerId,
                    scope: newScope,
                    title: newTitle.trim(),
                    startIso: '2026-11-25T05:00:00Z',
                    endIso: '2026-11-25T06:00:00Z',
                    timezone: 'Asia/Jakarta',
                    recurrence: 'none',
                    patientId: newScope === 'clinical' ? activePatient?.id : undefined,
                  },
                ])
                setNewTitle('')
              }}
              className="min-h-11 rounded-xl bg-emerald-600 px-4 font-bold text-white"
            >
              + Jadwal ({viewMode})
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {events.map((ev) => (
              <div key={ev.id} className="rounded-xl border border-white/10 bg-slate-900 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{ev.title}</span>
                  <span className="rounded bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-cyan-300">{ev.scope}</span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-white/65">{ev.startIso} · {ev.location ?? 'Panacea'}</div>
              </div>
            ))}
          </div>

          {icsBox && (
            <textarea rows={4} value={icsBox} onChange={(e) => setIcsBox(e.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900 p-2 font-mono text-[11px] text-cyan-100" />
          )}
        </div>
      )}

      {tab === 'or-scheduler' && (
        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 text-amber-100">{WHO_CHECKLIST_DISCLAIMER}</div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 p-3">
            <select aria-label="Pilih Ruang OK" value={newOrRoom} onChange={(e) => setNewOrRoom(e.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-xs text-white">
              <option value="OK-1">OK-1</option>
              <option value="OK-2">OK-2</option>
              <option value="OK-Cito">OK-Cito</option>
            </select>
            <label className="inline-flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={overrideEmergency} onChange={(e) => setOverrideEmergency(e.target.checked)} />
              Emergency Override
            </label>
            <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Alasan klinis emergency override (>=8 huruf)..." className="min-h-11 flex-1 rounded-xl border border-white/15 bg-slate-950 px-3 text-xs text-white" />
            <button
              type="button"
              onClick={() => {
                const res = scheduleOrCaseWithOverride(orCases, candidateOr, overrideEmergency ? { isEmergency: true, reason: overrideReason, actorName, nowIso: new Date().toISOString() } : undefined)
                if (!res.ok) setOrNotice(res.error)
                else { setOrNotice('Jadwal OK tersimpan.'); setOrCases(res.cases) }
              }}
              className="min-h-11 rounded-xl bg-cyan-600 px-3 font-bold text-white"
            >
              Jadwalkan Kasus OK
            </button>
          </div>
          {detectedConflicts.length > 0 && (
            <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-rose-200">
              Deteksi Konflik ({detectedConflicts.length}): {detectedConflicts.map((c) => `${c.resourceType}=${c.resourceValue}`).join(', ')}
            </div>
          )}
          {orNotice && <div className="rounded-xl bg-sky-500/15 px-3 py-2 text-sky-200">{orNotice}</div>}

          {orCases.map((c) => (
            <div key={c.id} className="space-y-2 rounded-2xl border border-white/10 bg-slate-900 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white">{c.orRoom} · {c.procedureName} ({c.operatorName} / {c.anesthesiologistName})</span>
                <span className="rounded bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-emerald-300">{c.lifecycleStage}</span>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {(['signIn', 'timeOut', 'signOut'] as const).map((phase) => (
                  <div key={phase} className="rounded-xl border border-white/10 bg-slate-950 p-2.5">
                    <div className="mb-1.5 font-mono text-[11px] font-bold uppercase text-cyan-300">
                      WHO {phase} {c.whoChecklist[phase].completed ? '(Lengkap)' : ''}
                    </div>
                    {c.whoChecklist[phase].items.map((it) => (
                      <label key={it.id} className="flex min-h-11 cursor-pointer items-start gap-2 text-[11px]">
                        <input
                          type="checkbox"
                          checked={it.checked}
                          onChange={() => setOrCases((prev) => prev.map((x) => (x.id === c.id ? toggleWhoChecklistItem(x, phase, it.id, actorName, new Date().toISOString()) : x)))}
                          className="mt-1"
                        />
                        <span>{it.label}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'keep-tasks' && (
        <div className="space-y-3 text-xs">
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-900 p-3 sm:grid-cols-4">
            <select value={noteKind} onChange={(e) => setNoteKind(e.target.value as NoteKind)} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-2.5 text-white">
              <option value="quick">Catatan Cepat</option>
              <option value="sticky">Sticky Note</option>
              <option value="checklist">Checklist</option>
              <option value="voice">Catatan Suara</option>
              <option value="handwritten">Tulisan Tangan (OCR)</option>
              <option value="clinical_task">Tugas Klinis</option>
            </select>
            <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Judul catatan/tugas..." className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-white" />
            <input value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Isi ringkas / instruksi tindak lanjut..." className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-white" />
            <button
              type="button"
              onClick={() => {
                if (!noteTitle.trim() && !noteBody.trim()) return
                setNotes((prev) => [
                  createNoteOrTask(
                    { ownerId, kind: noteKind, scope: 'patient', title: noteTitle || 'Catatan Baru', body: noteBody, color: 'amber', pinned: false, archived: false, labels: ['Klinik'], priority: 'medium', recurrence: 'none', patientId: activePatient?.id, checklistItems: [] },
                    prev.length + 1,
                    new Date().toISOString(),
                  ),
                  ...prev,
                ])
                setNoteTitle('')
                setNoteBody('')
              }}
              className="min-h-11 rounded-xl bg-emerald-600 font-bold text-white"
            >
              + Tambah Note
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {notes.filter((n) => !n.archived).map((n) => (
              <div key={n.id} className="space-y-2 rounded-2xl border border-white/10 bg-slate-900 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{n.pinned ? '📌 ' : ''}{n.title}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setNotes((p) => toggleNotePin(p, n.id, new Date().toISOString()))} className="min-h-11 rounded-lg bg-slate-950 px-2.5 text-[11px] text-white/80">Pin</button>
                    <button type="button" onClick={() => setNotes((p) => toggleNoteArchive(p, n.id, new Date().toISOString()))} className="min-h-11 rounded-lg bg-slate-950 px-2.5 text-[11px] text-white/80">Arsip</button>
                  </div>
                </div>
                <p className="text-white/75">{n.body}</p>
                {n.checklistItems.map((it) => (
                  <label key={it.id} className="flex min-h-11 cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={it.done} onChange={() => setNotes((p) => toggleChecklistLine(p, n.id, it.id, new Date().toISOString()))} />
                    <span className={it.done ? 'line-through text-white/50' : ''}>{it.text}</span>
                  </label>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const s = summarizeNoteToActionItems(n)
                      setKeepNotice(`Ringkasan AI (draf): ${s.summary} | Aksi: ${s.actionItems.join('; ')}`)
                    }}
                    className="min-h-11 rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-3 font-bold text-cyan-200"
                  >
                    Ringkas → Aksi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ev = promoteTaskToCalendarEvent(n, '2026-11-25T07:00:00Z', 30)
                      setEvents((p) => [...p, ev])
                      setKeepNotice(`Dipromosikan ke Calendar OS (${ev.scope}).`)
                    }}
                    className="min-h-11 rounded-lg bg-sky-600 px-3 font-bold text-white"
                  >
                    Jadikan Event Kalender
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900 p-3">
            <div className="font-bold text-cyan-300">Draf Speech-to-Word &amp; Pengenalan Tulisan Tangan vs Bahasa Isyarat</div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input value={speechText} onChange={(e) => setSpeechText(e.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-white sm:col-span-2" />
              <input value={uncertainWord} onChange={(e) => setUncertainWord(e.target.value)} placeholder="Token tidak pasti..." className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 font-mono text-white" />
            </div>
            <div className="flex flex-wrap gap-2">
              <select aria-label="Modalitas Pengenalan" value={modalityType} onChange={(e) => setModalityType(e.target.value as 'handwriting_ocr' | 'sign_language')} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-white">
                <option value="sign_language">Bahasa Isyarat (Sign-to-Word)</option>
                <option value="handwriting_ocr">Tulisan Tangan / Gambar (OCR)</option>
              </select>
              {modalityType === 'sign_language' && (
                <select aria-label="Bahasa Isyarat" value={signVariant} onChange={(e) => setSignVariant(e.target.value as typeof signVariant)} className="min-h-11 rounded-xl border border-white/15 bg-slate-950 px-3 text-white">
                  <option value="BISINDO">BISINDO</option>
                  <option value="SIBI">SIBI</option>
                  <option value="ASL">ASL</option>
                </select>
              )}
            </div>
            <div className="rounded-xl bg-slate-950 p-2.5 font-mono text-[11px] text-slate-200">{speechPreview.annotatedText}</div>
            <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 p-2.5 text-[11px] text-amber-100">{MODALITY_DISCLOSURES[modalityPreview.modality]}</div>
          </div>
          {keepNotice && <div className="rounded-xl bg-emerald-500/15 px-3 py-2 text-emerald-200">{keepNotice}</div>}
        </div>
      )}
    </section>
  )
}
