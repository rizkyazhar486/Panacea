/**
 * Universal Clinical Calendar OS & Operating Theater (OK) Scheduler Engine (Part II).
 * - 10 calendar views + recurrence rules with exception dates
 * - RFC 5545 .ics export/import with strict PHI stripping on personal/redacted exports
 * - 6-resource OR conflict detection (OR room, operator, anesthesiologist, equipment, nurses, PACU bay)
 * - Emergency override audit logging + 11-stage OR lifecycle + WHO Surgical Safety Checklist
 */

export const CALENDAR_VIEWS = [
  'day', '3day', 'week', 'month', 'year', 'agenda', 'timeline', 'resource', 'physician', 'or_scheduler',
] as const
export type CalendarViewMode = (typeof CALENDAR_VIEWS)[number]

export type CalendarScope = 'personal' | 'clinical'
export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly'

export interface CalendarEventItem {
  readonly id: string
  readonly ownerId: string
  readonly scope: CalendarScope
  readonly title: string
  readonly startIso: string
  readonly endIso: string
  readonly timezone: string
  readonly location?: string
  readonly description?: string
  readonly recurrence: RecurrenceRule
  readonly exceptionDates?: readonly string[]
  readonly patientId?: string
  readonly encounterId?: string
  readonly linkedTaskId?: string
}

export const WHO_CHECKLIST_DISCLAIMER =
  'Checklist keselamatan bedah WHO ini mencatat dokumentasi kelengkapan persiapan di sistem; ia tidak membuktikan pelaksanaan fisik atau menggantikan verifikasi tim kamar operasi.'

export type OrLifecycleStage =
  | 'Proposed'
  | 'Scheduled'
  | 'Preparation'
  | 'Ready'
  | 'In Progress'
  | 'Recovery'
  | 'Completed'
  | 'Postponed'
  | 'Cancelled'
  | 'Interrupted'
  | 'Aborted'

export interface WhoChecklistPhaseState {
  readonly completed: boolean
  readonly completedBy?: string
  readonly completedAtIso?: string
  readonly items: readonly { readonly id: string; readonly label: string; readonly checked: boolean }[]
}

export interface OrSurgeryCase {
  readonly id: string
  readonly patientId: string
  readonly encounterId: string
  readonly procedureName: string
  readonly orRoom: string
  readonly operatorName: string
  readonly assistantName?: string
  readonly anesthesiologistName: string
  readonly nursingTeam: readonly string[]
  readonly equipment: readonly string[]
  readonly pacuBay?: string
  readonly anesthesiaType: string
  readonly positioning: string
  readonly startIso: string
  readonly endIso: string
  readonly lifecycleStage: OrLifecycleStage
  readonly preOpChecklist: {
    readonly labsReady: boolean
    readonly allergiesReviewed: boolean
    readonly implantsReady: boolean
    readonly bloodReserveReady: boolean
    readonly icuPacuReady: boolean
    readonly consentSigned: boolean
  }
  readonly whoChecklist: {
    readonly signIn: WhoChecklistPhaseState
    readonly timeOut: WhoChecklistPhaseState
    readonly signOut: WhoChecklistPhaseState
  }
  readonly emergencyOverride?: {
    readonly isEmergency: boolean
    readonly reason: string
    readonly overriddenBy: string
    readonly atIso: string
  }
}

export interface OrConflictItem {
  readonly resourceType: 'or_room' | 'operator' | 'anesthesiologist' | 'equipment' | 'nursing_team' | 'pacu_bay'
  readonly resourceValue: string
  readonly conflictingCaseId: string
}

function intervalsOverlap(aStartIso: string, aEndIso: string, bStartIso: string, bEndIso: string): boolean {
  const a0 = Date.parse(aStartIso)
  const a1 = Date.parse(aEndIso)
  const b0 = Date.parse(bStartIso)
  const b1 = Date.parse(bEndIso)
  if (!Number.isFinite(a0) || !Number.isFinite(a1) || !Number.isFinite(b0) || !Number.isFinite(b1)) return false
  return a0 < b1 && b0 < a1
}

export function createDefaultWhoChecklist(): OrSurgeryCase['whoChecklist'] {
  return {
    signIn: {
      completed: false,
      items: [
        { id: 'si-1', label: 'Konfirmasi identitas pasien, lokasi, prosedur, & informed consent', checked: false },
        { id: 'si-2', label: 'Penandaan area operasi & pengecekan mesin anestesi / oksimetri', checked: false },
        { id: 'si-3', label: 'Evaluasi alergi, risiko jalan napas, & risiko perdarahan >500 mL', checked: false },
      ],
    },
    timeOut: {
      completed: false,
      items: [
        { id: 'to-1', label: 'Perkenalan tim bedah, anestesi, & perawat (nama & peran)', checked: false },
        { id: 'to-2', label: 'Konfirmasi verbal pasien, sisi insisi, antibiotik profilaksis <=60 mnt, & imaging', checked: false },
      ],
    },
    signOut: {
      completed: false,
      items: [
        { id: 'so-1', label: 'Konfirmasi prosedur tercatat, hitungan kassa/instrumen/jarum lengkap, & label spesimen PA', checked: false },
        { id: 'so-2', label: 'Rencana pemulihan & perhatian pasca-operasi di PACU/ICU/ruangan', checked: false },
      ],
    },
  }
}

export function detectOrConflicts(
  existingCases: readonly OrSurgeryCase[],
  candidate: OrSurgeryCase,
): OrConflictItem[] {
  const conflicts: OrConflictItem[] = []
  const inactive = new Set<OrLifecycleStage>(['Completed', 'Postponed', 'Cancelled', 'Aborted'])
  for (const existing of existingCases) {
    if (existing.id === candidate.id || inactive.has(existing.lifecycleStage)) continue
    if (!intervalsOverlap(existing.startIso, existing.endIso, candidate.startIso, candidate.endIso)) continue

    if (existing.orRoom === candidate.orRoom) {
      conflicts.push({ resourceType: 'or_room', resourceValue: candidate.orRoom, conflictingCaseId: existing.id })
    }
    if (existing.operatorName === candidate.operatorName) {
      conflicts.push({ resourceType: 'operator', resourceValue: candidate.operatorName, conflictingCaseId: existing.id })
    }
    if (existing.anesthesiologistName === candidate.anesthesiologistName) {
      conflicts.push({ resourceType: 'anesthesiologist', resourceValue: candidate.anesthesiologistName, conflictingCaseId: existing.id })
    }
    if (existing.pacuBay && candidate.pacuBay && existing.pacuBay === candidate.pacuBay) {
      conflicts.push({ resourceType: 'pacu_bay', resourceValue: candidate.pacuBay, conflictingCaseId: existing.id })
    }
    for (const eq of candidate.equipment) {
      if (existing.equipment.includes(eq)) {
        conflicts.push({ resourceType: 'equipment', resourceValue: eq, conflictingCaseId: existing.id })
      }
    }
    for (const nurse of candidate.nursingTeam) {
      if (existing.nursingTeam.includes(nurse)) {
        conflicts.push({ resourceType: 'nursing_team', resourceValue: nurse, conflictingCaseId: existing.id })
      }
    }
  }
  return conflicts
}

export function scheduleOrCaseWithOverride(
  existingCases: readonly OrSurgeryCase[],
  candidate: OrSurgeryCase,
  override?: { readonly isEmergency: boolean; readonly reason: string; readonly actorName: string; readonly nowIso: string },
):
  | { readonly ok: true; readonly cases: OrSurgeryCase[]; readonly conflicts: readonly OrConflictItem[] }
  | { readonly ok: false; readonly conflicts: readonly OrConflictItem[]; readonly error: string } {
  const conflicts = detectOrConflicts(existingCases, candidate)
  if (conflicts.length > 0) {
    if (!override?.isEmergency || override.reason.trim().length < 8) {
      return {
        ok: false,
        conflicts,
        error: `Jadwal bentrok (${conflicts.map((c) => `${c.resourceType}:${c.resourceValue}`).join(', ')}). Diperlukan alasan Emergency Override (>=8 karakter).`,
      }
    }
    const overridden: OrSurgeryCase = {
      ...candidate,
      emergencyOverride: {
        isEmergency: true,
        reason: override.reason.trim(),
        overriddenBy: override.actorName,
        atIso: override.nowIso,
      },
    }
    return { ok: true, cases: [...existingCases, overridden], conflicts }
  }
  return { ok: true, cases: [...existingCases, candidate], conflicts: [] }
}

export function toggleWhoChecklistItem(
  surgeryCase: OrSurgeryCase,
  phase: 'signIn' | 'timeOut' | 'signOut',
  itemId: string,
  actorName: string,
  nowIso: string,
): OrSurgeryCase {
  const prevPhase = surgeryCase.whoChecklist[phase]
  const nextItems = prevPhase.items.map((it) => (it.id === itemId ? { ...it, checked: !it.checked } : it))
  const allChecked = nextItems.every((it) => it.checked)
  return {
    ...surgeryCase,
    whoChecklist: {
      ...surgeryCase.whoChecklist,
      [phase]: {
        items: nextItems,
        completed: allChecked,
        completedBy: allChecked ? actorName : undefined,
        completedAtIso: allChecked ? nowIso : undefined,
      },
    },
  }
}

// ── RFC 5545 iCalendar (.ics) Export/Import with Strict PHI Protection ───────
function toIcsUtc(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function fromIcsUtc(val: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(val.trim())
  if (!m) return val.trim()
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`
}

export function exportEventsToIcs(
  events: readonly CalendarEventItem[],
  options?: { readonly redactPhi?: boolean; readonly personalOnly?: boolean },
): string {
  const redact = Boolean(options?.redactPhi)
  const filtered = options?.personalOnly ? events.filter((e) => e.scope === 'personal') : events
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PanaceaMed//Invictus Calendar OS//EN']
  for (const ev of filtered) {
    const stripPhi = redact || ev.scope === 'personal'
    const summary = stripPhi && ev.patientId ? 'Jadwal Klinis (PHI Disembunyikan)' : ev.title
    const desc = stripPhi ? 'Detail klinis dilindungi — lihat di EMR PanaceaMed' : (ev.description ?? '')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@panaceamed.id`,
      `DTSTART:${toIcsUtc(ev.startIso)}`,
      `DTEND:${toIcsUtc(ev.endIso)}`,
      `SUMMARY:${summary.replace(/\n/g, ' ')}`,
      ...(ev.location ? [`LOCATION:${ev.location.replace(/\n/g, ' ')}`] : []),
      ...(desc ? [`DESCRIPTION:${desc.replace(/\n/g, ' ')}`] : []),
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function importEventsFromIcs(icsText: string, ownerId: string, scope: CalendarScope = 'personal'): CalendarEventItem[] {
  const blocks = icsText.split(/BEGIN:VEVENT/i).slice(1)
  const out: CalendarEventItem[] = []
  for (let i = 0; i < blocks.length; i++) {
    const body = blocks[i].split(/END:VEVENT/i)[0] ?? ''
    const get = (key: string) => {
      const m = new RegExp(`^${key}[^:]*:(.*)$`, 'mi').exec(body)
      return m ? m[1].trim() : ''
    }
    const summary = get('SUMMARY')
    const startRaw = get('DTSTART')
    const endRaw = get('DTEND') || startRaw
    if (!summary || !startRaw) continue
    out.push({
      id: get('UID').split('@')[0] || `ics-${i + 1}`,
      ownerId,
      scope,
      title: summary,
      startIso: fromIcsUtc(startRaw),
      endIso: fromIcsUtc(endRaw),
      timezone: 'Asia/Jakarta',
      location: get('LOCATION') || undefined,
      description: get('DESCRIPTION') || undefined,
      recurrence: 'none',
    })
  }
  return out
}
