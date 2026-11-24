/**
 * PanaceaMed OS — Aureum Closed-Loop Medical Service & Evidence-Grounded Personal Health Memory (WP-08, WP-10).
 *
 * Implements:
 * - Section XV (Closed-Loop Medical Service): Diagnostic orders, referrals, medication plans,
 *   and discharge follow-ups with strict actor authorization (AI drafts NEVER auto-sign or auto-close),
 *   overdue incomplete-loop detection, and Golden Product Metric `Follow-Up Closure (FC)`.
 * - Section XIX (Aureum Personal Health Memory): Deterministic, zero-fabrication retrieval over
 *   canonical longitudinal health records with explicit provenance citations, approximate-date
 *   honesty, and missing-record gap reporting.
 *
 * Pure, deterministic, zero React, zero network calls.
 */

export type CareLoopKind =
  | 'DIAGNOSTIC_ORDER'
  | 'REFERRAL'
  | 'MEDICATION_PLAN'
  | 'DISCHARGE_FOLLOW_UP'

export type CareLoopStage =
  | 'CREATED'
  | 'PERFORMED_OR_SCHEDULED'
  | 'RESULT_OR_REPORT_RECEIVED'
  | 'ROUTED_FOR_REVIEW'
  | 'CLINICIAN_REVIEWED'
  | 'FOLLOW_UP_COMMUNICATED'
  | 'CLOSED'

export type CareActorRole =
  | 'PATIENT'
  | 'NURSE'
  | 'DOCTOR'
  | 'LAB_SYSTEM'
  | 'AI_ASSISTANT_DRAFT'

export interface CareLoopTransition {
  readonly fromStage: CareLoopStage
  readonly toStage: CareLoopStage
  readonly actorRole: CareActorRole
  readonly actorId: string
  readonly timestampIso: string
  readonly note: string
}

export interface ClosedLoopCareItem {
  readonly loopId: string
  readonly patientId: string
  readonly kind: CareLoopKind
  readonly title: string
  readonly priority: 'ROUTINE' | 'URGENT' | 'CRITICAL'
  readonly stage: CareLoopStage
  readonly createdAtIso: string
  readonly dueAtIso: string
  readonly closedAtIso?: string
  readonly linkedRecordIds: readonly string[]
  readonly transitions: readonly CareLoopTransition[]
}

export interface CareLoopTransitionResult {
  readonly ok: boolean
  readonly item: ClosedLoopCareItem
  readonly refusalReason?: string
}

export interface IncompleteLoopAudit {
  readonly totalEligibleLoops: number
  readonly closedLoops: number
  readonly openLoops: number
  readonly overdueLoops: readonly ClosedLoopCareItem[]
  readonly overdueCriticalCount: number
  readonly followUpClosureRatePct: number
}

const STAGE_ORDER: readonly CareLoopStage[] = [
  'CREATED',
  'PERFORMED_OR_SCHEDULED',
  'RESULT_OR_REPORT_RECEIVED',
  'ROUTED_FOR_REVIEW',
  'CLINICIAN_REVIEWED',
  'FOLLOW_UP_COMMUNICATED',
  'CLOSED',
] as const

const CLINICIAN_SIGN_OFF_STAGES: ReadonlySet<CareLoopStage> = new Set([
  'CLINICIAN_REVIEWED',
  'CLOSED',
])

/**
 * Transitions a closed-loop clinical item with strict authorization guardrails:
 * - `AI_ASSISTANT_DRAFT` can NEVER advance into `CLINICIAN_REVIEWED` or `CLOSED` (Law IV).
 * - `PATIENT` cannot self-sign `CLINICIAN_REVIEWED`.
 * - Stages must progress monotonically forward without skipping clinician review before closure.
 */
export function advanceCareLoopStage(params: {
  readonly item: ClosedLoopCareItem
  readonly nextStage: CareLoopStage
  readonly actorRole: CareActorRole
  readonly actorId: string
  readonly timestampIso: string
  readonly note: string
}): CareLoopTransitionResult {
  const { item, nextStage, actorRole, actorId, timestampIso, note } = params
  const curIdx = STAGE_ORDER.indexOf(item.stage)
  const nextIdx = STAGE_ORDER.indexOf(nextStage)

  if (nextIdx <= curIdx) {
    return {
      ok: false,
      item,
      refusalReason: `Cannot transition backwards or repeat stage (${item.stage} -> ${nextStage}).`,
    }
  }

  if (actorRole === 'AI_ASSISTANT_DRAFT' && CLINICIAN_SIGN_OFF_STAGES.has(nextStage)) {
    return {
      ok: false,
      item,
      refusalReason: 'Constitutional Law IV violation: AI drafts cannot sign clinician review or close clinical loops.',
    }
  }

  if (nextStage === 'CLINICIAN_REVIEWED' && actorRole !== 'DOCTOR') {
    return {
      ok: false,
      item,
      refusalReason: 'Only a licensed DOCTOR actor may complete CLINICIAN_REVIEWED sign-off.',
    }
  }

  if (nextStage === 'CLOSED') {
    const hasClinicianReview =
      item.stage === 'CLINICIAN_REVIEWED' ||
      item.stage === 'FOLLOW_UP_COMMUNICATED' ||
      item.transitions.some((t) => t.toStage === 'CLINICIAN_REVIEWED' && t.actorRole === 'DOCTOR')
    if (!hasClinicianReview) {
      return {
        ok: false,
        item,
        refusalReason: 'Loop cannot be closed before documented DOCTOR review.',
      }
    }
    if (actorRole !== 'DOCTOR' && actorRole !== 'NURSE') {
      return {
        ok: false,
        item,
        refusalReason: 'Closing a clinical loop requires authorized clinical staff (DOCTOR or NURSE after review).',
      }
    }
  }

  const transition: CareLoopTransition = {
    fromStage: item.stage,
    toStage: nextStage,
    actorRole,
    actorId: actorId.trim() || 'unknown_actor',
    timestampIso,
    note: note.trim(),
  }

  const updated: ClosedLoopCareItem = {
    ...item,
    stage: nextStage,
    closedAtIso: nextStage === 'CLOSED' ? timestampIso : item.closedAtIso,
    transitions: [...item.transitions, transition],
  }

  return { ok: true, item: updated }
}

/**
 * Audits incomplete clinical loops and computes the Aureum Golden Metric:
 * `Follow-Up Closure (FC) = Appropriately closed eligible loops / Eligible loops * 100%`.
 */
export function auditClosedLoopService(
  loops: readonly ClosedLoopCareItem[],
  nowIso: string,
): IncompleteLoopAudit {
  const nowMs = Date.parse(nowIso)
  const closed = loops.filter((l) => l.stage === 'CLOSED')
  const open = loops.filter((l) => l.stage !== 'CLOSED')
  const overdueLoops = open.filter((l) => {
    const dueMs = Date.parse(l.dueAtIso)
    return Number.isFinite(nowMs) && Number.isFinite(dueMs) && nowMs > dueMs
  })
  const overdueCriticalCount = overdueLoops.filter((l) => l.priority === 'CRITICAL').length
  const total = loops.length
  const followUpClosureRatePct = total === 0 ? 100 : Math.round((closed.length / total) * 1000) / 10

  return {
    totalEligibleLoops: total,
    closedLoops: closed.length,
    openLoops: open.length,
    overdueLoops,
    overdueCriticalCount,
    followUpClosureRatePct,
  }
}

// ── EVIDENCE-GROUNDED PERSONAL HEALTH MEMORY RETRIEVAL (WP-10 / Section XIX) ──

export interface MemoryRecordEntry {
  readonly id: string
  readonly category: 'MEDICATION' | 'VACCINATION' | 'VITAL' | 'LAB' | 'PROCEDURE' | 'ALLERGY' | 'CONDITION'
  readonly label: string
  readonly valueText?: string
  readonly numericValue?: number
  readonly unit?: string
  readonly effectiveDate: string
  readonly isApproximateDate?: boolean
  readonly sourceId: string
  readonly semanticState: 'measured' | 'imported' | 'clinician-entered' | 'clinician-reviewed' | 'patient-reported' | 'simulated'
}

export type MemoryAnswerCertainty =
  | 'EXACT_RECORD_FACT'
  | 'APPROXIMATE_HISTORICAL_DATE'
  | 'MISSING_OR_UNRECORDED'

export interface PersonalHealthMemoryCitation {
  readonly recordId: string
  readonly effectiveDate: string
  readonly sourceId: string
  readonly semanticState: MemoryRecordEntry['semanticState']
  readonly summary: string
}

export interface PersonalHealthMemoryAnswer {
  readonly intent:
    | 'MEDICATIONS'
    | 'VACCINATIONS'
    | 'TREND_VITAL'
    | 'PROCEDURES'
    | 'PENDING_FOLLOW_UPS'
    | 'MISSING_GAPS'
  readonly certainty: MemoryAnswerCertainty
  readonly summary: string
  readonly citations: readonly PersonalHealthMemoryCitation[]
  readonly missingRequiredDomains: readonly string[]
  readonly fabricatedDataUsed: false
}

const REQUIRED_CORE_DOMAINS: readonly MemoryRecordEntry['category'][] = [
  'ALLERGY',
  'MEDICATION',
  'VACCINATION',
  'VITAL',
] as const

function classifyMemoryIntent(question: string): PersonalHealthMemoryAnswer['intent'] {
  const q = question.toLowerCase()
  if (/(obat|medic|resep|drug|statin)/.test(q)) return 'MEDICATIONS'
  if (/(vaksin|vaccin|imunis|immuniz)/.test(q)) return 'VACCINATIONS'
  if (/(berat|weight|tekanan|pressure|sbp|bp|trend|ubah|change|delta)/.test(q)) return 'TREND_VITAL'
  if (/(prosedur|operasi|surger|procedure|tindakan)/.test(q)) return 'PROCEDURES'
  if (/(tindak lanjut|follow.?up|pending|menunggu|await|rujuk|refer)/.test(q)) return 'PENDING_FOLLOW_UPS'
  return 'MISSING_GAPS'
}

/**
 * Retrieves evidence-grounded personal health memory answers strictly from non-simulated
 * canonical records and active clinical loops. Never fabricates unrecorded facts.
 */
export function queryPersonalHealthMemory(params: {
  readonly question: string
  readonly records: readonly MemoryRecordEntry[]
  readonly careLoops?: readonly ClosedLoopCareItem[]
  readonly nowIso: string
}): PersonalHealthMemoryAnswer {
  const intent = classifyMemoryIntent(params.question)
  // Exclude simulated entries so counterfactuals are never reported as personal history
  const realRecords = params.records
    .filter((r) => r.semanticState !== 'simulated')
    .slice()
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))

  const missingRequiredDomains = REQUIRED_CORE_DOMAINS.filter(
    (cat) => !realRecords.some((r) => r.category === cat),
  )

  if (intent === 'PENDING_FOLLOW_UPS') {
    const audit = auditClosedLoopService(params.careLoops ?? [], params.nowIso)
    const open = (params.careLoops ?? []).filter((l) => l.stage !== 'CLOSED')
    if (open.length === 0) {
      return {
        intent,
        certainty: 'EXACT_RECORD_FACT',
        summary: 'No open clinical follow-up loops are pending.',
        citations: [],
        missingRequiredDomains,
        fabricatedDataUsed: false,
      }
    }
    return {
      intent,
      certainty: 'EXACT_RECORD_FACT',
      summary: `${open.length} open clinical loop(s) awaiting closure (${audit.overdueLoops.length} overdue, closure rate ${audit.followUpClosureRatePct}%).`,
      citations: open.map((l) => ({
        recordId: l.loopId,
        effectiveDate: l.dueAtIso,
        sourceId: l.kind,
        semanticState: 'clinician-entered',
        summary: `${l.title} [${l.stage}] due ${l.dueAtIso}`,
      })),
      missingRequiredDomains,
      fabricatedDataUsed: false,
    }
  }

  if (intent === 'MISSING_GAPS') {
    return {
      intent,
      certainty: missingRequiredDomains.length > 0 ? 'MISSING_OR_UNRECORDED' : 'EXACT_RECORD_FACT',
      summary:
        missingRequiredDomains.length > 0
          ? `Missing core record categories: ${missingRequiredDomains.join(', ')}.`
          : 'Core lifetime categories (allergy, medication, vaccination, vital) have recorded entries.',
      citations: [],
      missingRequiredDomains,
      fabricatedDataUsed: false,
    }
  }

  const categoryMap: Record<Exclude<PersonalHealthMemoryAnswer['intent'], 'PENDING_FOLLOW_UPS' | 'MISSING_GAPS'>, MemoryRecordEntry['category']> = {
    MEDICATIONS: 'MEDICATION',
    VACCINATIONS: 'VACCINATION',
    TREND_VITAL: 'VITAL',
    PROCEDURES: 'PROCEDURE',
  }
  const targetCat = categoryMap[intent]
  const matched = realRecords.filter((r) => r.category === targetCat)

  if (matched.length === 0) {
    return {
      intent,
      certainty: 'MISSING_OR_UNRECORDED',
      summary: `No recorded ${targetCat.toLowerCase()} entries exist in your authorized longitudinal record.`,
      citations: [],
      missingRequiredDomains,
      fabricatedDataUsed: false,
    }
  }

  const hasApprox = matched.some((m) => m.isApproximateDate)
  const citations: PersonalHealthMemoryCitation[] = matched.map((m) => ({
    recordId: m.id,
    effectiveDate: m.effectiveDate,
    sourceId: m.sourceId,
    semanticState: m.semanticState,
    summary:
      m.valueText ??
      (m.numericValue !== undefined ? `${m.label}: ${m.numericValue} ${m.unit ?? ''}`.trim() : m.label),
  }))

  if (intent === 'TREND_VITAL') {
    const numeric = matched.filter((m) => typeof m.numericValue === 'number' && Number.isFinite(m.numericValue))
    if (numeric.length >= 2) {
      const first = numeric[0]
      const latest = numeric[numeric.length - 1]
      const delta = Math.round((latest.numericValue! - first.numericValue!) * 100) / 100
      return {
        intent,
        certainty: hasApprox ? 'APPROXIMATE_HISTORICAL_DATE' : 'EXACT_RECORD_FACT',
        summary: `${latest.label}: ${first.numericValue} (${first.effectiveDate}) -> ${latest.numericValue} ${latest.unit ?? ''} (${latest.effectiveDate}), delta ${delta >= 0 ? '+' : ''}${delta}.`.trim(),
        citations,
        missingRequiredDomains,
        fabricatedDataUsed: false,
      }
    }
  }

  const latest = matched[matched.length - 1]
  return {
    intent,
    certainty: hasApprox ? 'APPROXIMATE_HISTORICAL_DATE' : 'EXACT_RECORD_FACT',
    summary: `Found ${matched.length} recorded ${targetCat.toLowerCase()} entry(ies); most recent: ${latest.label} (${latest.effectiveDate}).`,
    citations,
    missingRequiredDomains,
    fabricatedDataUsed: false,
  }
}
