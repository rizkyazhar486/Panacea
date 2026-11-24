/**
 * Google Keep-Style AI Task & Notes OS + Modality Recognition Guardrails (Part II).
 * - Quick / Sticky / Checklist / Voice / Handwriting / Image / Clinical Tasks
 * - Task -> Calendar Event promotion preserving personal vs clinical scope
 * - Explicit separation of Handwriting/Image OCR vs Sign-Language (BISINDO/SIBI/ASL)
 * - Uncertain speech tokens strictly preserved as [TIDAK PASTI: ...] until human review
 */
import type { CalendarEventItem, RecurrenceRule } from './clinicalCalendarEngine'

export type NoteKind = 'quick' | 'sticky' | 'checklist' | 'voice' | 'handwritten' | 'image' | 'clinical_task'
export type NoteScope = 'personal' | 'patient' | 'team'
export type NotePriority = 'low' | 'medium' | 'high' | 'urgent'

export interface ChecklistLine {
  readonly id: string
  readonly text: string
  readonly done: boolean
}

export interface ClinicalNoteOrTask {
  readonly id: string
  readonly ownerId: string
  readonly kind: NoteKind
  readonly scope: NoteScope
  readonly title: string
  readonly body: string
  readonly color: 'slate' | 'amber' | 'teal' | 'rose' | 'sky'
  readonly pinned: boolean
  readonly archived: boolean
  readonly labels: readonly string[]
  readonly priority: NotePriority
  readonly dueAtIso?: string
  readonly recurrence: RecurrenceRule
  readonly patientId?: string
  readonly assigneeId?: string
  readonly checklistItems: readonly ChecklistLine[]
  readonly createdAtIso: string
  readonly updatedAtIso: string
}

export function createNoteOrTask(
  input: Omit<ClinicalNoteOrTask, 'id' | 'createdAtIso' | 'updatedAtIso'>,
  seq: number,
  nowIso: string,
): ClinicalNoteOrTask {
  return {
    ...input,
    id: `note-${seq}`,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  }
}

export function toggleNotePin(notes: readonly ClinicalNoteOrTask[], id: string, nowIso: string): ClinicalNoteOrTask[] {
  return notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAtIso: nowIso } : n))
}

export function toggleNoteArchive(notes: readonly ClinicalNoteOrTask[], id: string, nowIso: string): ClinicalNoteOrTask[] {
  return notes.map((n) => (n.id === id ? { ...n, archived: !n.archived, updatedAtIso: nowIso } : n))
}

export function toggleChecklistLine(
  notes: readonly ClinicalNoteOrTask[],
  noteId: string,
  lineId: string,
  nowIso: string,
): ClinicalNoteOrTask[] {
  return notes.map((n) =>
    n.id !== noteId
      ? n
      : {
          ...n,
          updatedAtIso: nowIso,
          checklistItems: n.checklistItems.map((l) => (l.id === lineId ? { ...l, done: !l.done } : l)),
        },
  )
}

export function summarizeNoteToActionItems(note: ClinicalNoteOrTask): {
  readonly draftOnly: true
  readonly summary: string
  readonly actionItems: readonly string[]
} {
  const sentences = `${note.title}. ${note.body}`
    .split(/[\n.;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const items = [
    ...note.checklistItems.filter((c) => !c.done).map((c) => c.text),
    ...sentences.filter((s) => /\b(cek|follow\s*up|order|konsul|siapkan|verifikasi|hubungi|kontrol|ekg|lab)\b/i.test(s)),
  ]
  const unique = Array.from(new Set(items))
  return {
    draftOnly: true,
    summary: sentences.slice(0, 2).join('. ') || note.title,
    actionItems: unique.length ? unique : sentences.slice(0, 3),
  }
}

export function convertSpeechTranscriptToDraft(
  transcript: string,
  target: 'task' | 'soap_draft',
  uncertainTokens: readonly string[] = [],
): {
  readonly draftOnly: true
  readonly clinically_reviewed: false
  readonly requiresHumanConfirmation: true
  readonly target: 'task' | 'soap_draft'
  readonly annotatedText: string
  readonly warning?: string
} {
  let annotated = transcript.trim()
  for (const tok of uncertainTokens) {
    const clean = tok.trim()
    if (!clean) continue
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    annotated = annotated.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), `[TIDAK PASTI: ${clean}]`)
  }
  const hasUncertainty = uncertainTokens.length > 0 || annotated.includes('[TIDAK PASTI:')
  return {
    draftOnly: true,
    clinically_reviewed: false,
    requiresHumanConfirmation: true,
    target,
    annotatedText:
      target === 'soap_draft'
        ? `[DRAF SOAP SUARA · clinically_reviewed = false]\nS/O/A/P mentah: ${annotated}`
        : annotated,
    warning: hasUncertainty ? 'Terdapat token suara berkepercayaan rendah ([TIDAK PASTI]); konfirmasi manual wajib sebelum disimpan ke rekam klinis.' : undefined,
  }
}

export const MODALITY_DISCLOSURES = {
  handwriting_ocr:
    'Pengenalan tulisan tangan (OCR) menghasilkan draf teks yang dapat disunting. Verifikasi angka dosis, satuan, dan nama obat sebelum menyimpan.',
  sign_language:
    'Peringatan Keterbatasan Bahasa Isyarat: BISINDO, SIBI, dan ASL adalah bahasa yang berbeda dan tidak saling menggantikan. Hasil pengenalan isyarat bersifat draf bantu komunikasi dan TIDAK boleh langsung disahkan sebagai rekam medis tanpa konfirmasi pengguna/penerjemah manusia.',
} as const

export function createModalityRecognitionDraft(
  modality: 'handwriting_ocr' | 'sign_language',
  rawDraftText: string,
  signLanguageVariant?: 'BISINDO' | 'SIBI' | 'ASL' | 'OTHER',
): {
  readonly modality: 'handwriting_ocr' | 'sign_language'
  readonly signLanguageVariant?: 'BISINDO' | 'SIBI' | 'ASL' | 'OTHER'
  readonly draftText: string
  readonly requiresHumanConfirmation: true
  readonly autoConfirmedToEmr: false
  readonly disclosure: string
} {
  return {
    modality,
    ...(modality === 'sign_language' ? { signLanguageVariant: signLanguageVariant ?? 'BISINDO' } : {}),
    draftText: rawDraftText.trim(),
    requiresHumanConfirmation: true,
    autoConfirmedToEmr: false,
    disclosure: MODALITY_DISCLOSURES[modality],
  }
}

export function promoteTaskToCalendarEvent(
  task: ClinicalNoteOrTask,
  startIso: string,
  durationMinutes = 30,
): CalendarEventItem {
  const startMs = Date.parse(startIso)
  const endIso = Number.isFinite(startMs) ? new Date(startMs + Math.max(5, durationMinutes) * 60_000).toISOString() : startIso
  return {
    id: `ev-from-${task.id}`,
    ownerId: task.ownerId,
    scope: task.scope === 'personal' ? 'personal' : 'clinical',
    title: task.title || task.body.slice(0, 60),
    startIso,
    endIso,
    timezone: 'Asia/Jakarta',
    description: task.body,
    recurrence: task.recurrence,
    patientId: task.scope === 'personal' ? undefined : task.patientId,
    linkedTaskId: task.id,
  }
}
