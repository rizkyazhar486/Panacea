import { useMemo, useState } from 'react'
import {
  analyzeLongitudinalTrend,
  buildAnnualYearbook,
  buildMultiResolutionTimeline,
  buildPortableLifetimePassport,
  exportCenturyArchiveJson,
  ingestCenturyEvents,
  type CenturyHealthEvent,
  type TimelineResolutionMode,
} from '../../domains/personal-health/engine/aureumCenturyLifetimeEngine'
import {
  auditClosedLoopService,
  queryPersonalHealthMemory,
  type ClosedLoopCareItem,
  type MemoryRecordEntry,
} from '../../domains/clinical-operations/engine/closedLoopCareAndMemoryEngine'

const MODES: readonly TimelineResolutionMode[] = ['TODAY', 'WEEK', 'MONTH', 'YEAR', 'DECADE', 'LIFETIME']

const MEMORY_CHIPS = [
  'What medications have I previously recorded?',
  'When was my last vaccination?',
  'How has my weight changed over time?',
  'What results or referrals are still awaiting follow-up?',
  'What information is missing from my record?',
] as const

const SAMPLE_CENTURY_RECORDS: readonly CenturyHealthEvent[] = [
  {
    id: 'demo_vax_1992',
    domain: 'clinical-note',
    metric: 'vaccination',
    textValue: 'Hepatitis B Primary Series',
    effectiveDate: '1992',
    datePrecision: 'YEAR',
    recordedAt: '2026-11-24T04:00:00Z',
    semanticState: 'patient-reported',
    provenance: { sourceKind: 'manual', sourceId: 'family-backfill', capturedAt: '1992', receivedAt: '2026-11-24T04:00:00Z' },
    sensitivityClass: 'EMERGENCY_RELEVANT',
  },
  {
    id: 'demo_allergy_01',
    domain: 'clinical-note',
    metric: 'allergy',
    textValue: 'Penicillin (urticaria)',
    effectiveDate: '2004-08',
    datePrecision: 'MONTH',
    recordedAt: '2026-11-24T04:00:00Z',
    semanticState: 'clinician-entered',
    provenance: { sourceKind: 'clinical-system', sourceId: 'clinic-emr', capturedAt: '2004-08', receivedAt: '2026-11-24T04:00:00Z' },
    sensitivityClass: 'EMERGENCY_RELEVANT',
  },
  {
    id: 'demo_restricted_01',
    domain: 'clinical-note',
    metric: 'condition',
    textValue: 'Restricted Counseling Note',
    effectiveDate: '2021-05-12',
    datePrecision: 'DAY',
    recordedAt: '2021-05-12T10:00:00Z',
    semanticState: 'clinician-entered',
    provenance: { sourceKind: 'clinical-system', sourceId: 'private-vault', capturedAt: '2021-05-12', receivedAt: '2021-05-12T10:00:00Z' },
    sensitivityClass: 'RESTRICTED_SENSITIVE',
  },
  {
    id: 'demo_sbp_2018',
    domain: 'vital',
    metric: 'systolic_bp',
    numericValue: 118,
    unit: 'mmHg',
    effectiveDate: '2018-06-15',
    datePrecision: 'DAY',
    recordedAt: '2018-06-15T08:00:00Z',
    semanticState: 'measured',
    provenance: { sourceKind: 'device', sourceId: 'omron-cuff', capturedAt: '2018-06-15', receivedAt: '2018-06-15T08:00:00Z' },
  },
  {
    id: 'demo_sbp_2022',
    domain: 'vital',
    metric: 'systolic_bp',
    numericValue: 121,
    unit: 'mmHg',
    effectiveDate: '2022-06-15',
    datePrecision: 'DAY',
    recordedAt: '2022-06-15T08:00:00Z',
    semanticState: 'measured',
    provenance: { sourceKind: 'wearable', sourceId: 'apple-watch', capturedAt: '2022-06-15', receivedAt: '2022-06-15T08:00:00Z' },
  },
  {
    id: 'demo_sbp_2026',
    domain: 'vital',
    metric: 'systolic_bp',
    numericValue: 119,
    unit: 'mmHg',
    effectiveDate: '2026-11-24',
    datePrecision: 'DAY',
    recordedAt: '2026-11-24T07:00:00Z',
    semanticState: 'measured',
    provenance: { sourceKind: 'wearable', sourceId: 'apple-watch', capturedAt: '2026-11-24', receivedAt: '2026-11-24T07:00:00Z' },
  },
  {
    id: 'demo_med_2025',
    domain: 'medication',
    metric: 'medication',
    textValue: 'Vitamin D3 2000 IU QD',
    effectiveDate: '2025-02-01',
    datePrecision: 'DAY',
    recordedAt: '2025-02-01T09:00:00Z',
    semanticState: 'clinician-reviewed',
    provenance: { sourceKind: 'clinical-system', sourceId: 'satusehat-fhir', capturedAt: '2025-02-01', receivedAt: '2025-02-01T09:00:00Z' },
    sensitivityClass: 'EMERGENCY_RELEVANT',
  },
]

const SAMPLE_LOOPS: readonly ClosedLoopCareItem[] = [
  {
    loopId: 'loop_lipid_2026',
    patientId: 'self',
    kind: 'DIAGNOSTIC_ORDER',
    title: 'Annual ApoB + HbA1c Preventive Panel',
    priority: 'ROUTINE',
    stage: 'RESULT_OR_REPORT_RECEIVED',
    createdAtIso: '2026-11-12T08:00:00Z',
    dueAtIso: '2026-11-20T08:00:00Z',
    linkedRecordIds: ['lab_2026_11'],
    transitions: [],
  },
]

const SAMPLE_MEMORY_ENTRIES: readonly MemoryRecordEntry[] = [
  { id: 'demo_med_2025', category: 'MEDICATION', label: 'Vitamin D3 2000 IU', effectiveDate: '2025-02-01', sourceId: 'satusehat-fhir', semanticState: 'clinician-reviewed' },
  { id: 'demo_vax_1992', category: 'VACCINATION', label: 'Hepatitis B Primary Series', effectiveDate: '1992', isApproximateDate: true, sourceId: 'family-backfill', semanticState: 'patient-reported' },
  { id: 'demo_wt_2021', category: 'VITAL', label: 'Body Weight', numericValue: 76.4, unit: 'kg', effectiveDate: '2021-06-01', sourceId: 'smart-scale', semanticState: 'measured' },
  { id: 'demo_wt_2026', category: 'VITAL', label: 'Body Weight', numericValue: 72.1, unit: 'kg', effectiveDate: '2026-11-20', sourceId: 'smart-scale', semanticState: 'measured' },
  { id: 'demo_allergy_01', category: 'ALLERGY', label: 'Penicillin (urticaria)', effectiveDate: '2004-08', isApproximateDate: true, sourceId: 'clinic-emr', semanticState: 'clinician-entered' },
]

export default function AureumLifetimeMemoryPanel() {
  const [mode, setMode] = useState<TimelineResolutionMode>('DECADE')
  const [passportScope, setPassportScope] = useState<'EMERGENCY_NARROW' | 'CLINICIAN_FULL'>('EMERGENCY_NARROW')
  const [question, setQuestion] = useState<string>(MEMORY_CHIPS[2])
  const [archiveHash, setArchiveHash] = useState<string | null>(null)

  const ingested = useMemo(() => ingestCenturyEvents([], SAMPLE_CENTURY_RECORDS), [])
  const buckets = useMemo(
    () => buildMultiResolutionTimeline(ingested.records, mode, { anchorDateIso: '2026-11-24' }),
    [ingested.records, mode],
  )
  const trend = useMemo(() => analyzeLongitudinalTrend(ingested.records, 'systolic_bp'), [ingested.records])
  const yearbook = useMemo(() => buildAnnualYearbook(ingested.records, 2026), [ingested.records])
  const passport = useMemo(
    () => buildPortableLifetimePassport(ingested.records, passportScope, '2026-11-24T08:00:00Z'),
    [ingested.records, passportScope],
  )
  const loopAudit = useMemo(() => auditClosedLoopService(SAMPLE_LOOPS, '2026-11-24T08:00:00Z'), [])
  const memoryAnswer = useMemo(
    () =>
      queryPersonalHealthMemory({
        question,
        records: SAMPLE_MEMORY_ENTRIES,
        careLoops: SAMPLE_LOOPS,
        nowIso: '2026-11-24T08:00:00Z',
      }),
    [question],
  )

  const handleExport = async () => {
    const archive = await exportCenturyArchiveJson(ingested.records, new Date().toISOString())
    setArchiveHash(`SHA-256 ${archive.sha256ChecksumHex.slice(0, 14)} · ${archive.recordCount} recs`)
  }

  return (
    <div data-aureum-lifetime-panel className="space-y-2.5 rounded-2xl border border-amber-400/25 bg-[#050b16] p-3 text-white">
      {/* 6-Mode Multi-Resolution Century Timeline Selector */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-2">
        <div className="flex flex-wrap gap-1">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`min-h-[34px] rounded-lg border px-2 font-mono text-[10px] font-black ${
                mode === m ? 'border-amber-300/60 bg-amber-500/20 text-amber-100' : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="min-h-[34px] rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2.5 font-mono text-[10px] font-black text-cyan-100"
        >
          {archiveHash ?? 'Export SHA-256 Archive'}
        </button>
      </div>

      {/* Multi-Resolution Buckets + OLS Trend + Closed-Loop KPIs */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 font-mono text-[10px]">
        <div className="rounded-xl border border-white/10 bg-slate-950/80 p-2">
          <div className="text-slate-400">BUCKETS ({mode})</div>
          <div className="text-sm font-black text-amber-200">{buckets.length} · {ingested.records.length} recs</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/80 p-2">
          <div className="text-slate-400">SBP OLS SLOPE</div>
          <div className="text-sm font-black text-cyan-200">{trend.slopeBeta1PerYear ?? 0} mmHg/y</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/80 p-2">
          <div className="text-slate-400">OPEN CARE LOOPS</div>
          <div className="text-sm font-black text-rose-200">{loopAudit.openLoops} ({loopAudit.overdueLoops.length} due)</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/80 p-2">
          <div className="text-slate-400">2026 YEARBOOK</div>
          <div className="text-sm font-black text-emerald-200">{yearbook.totalEvents} ev · {yearbook.missingDataMonths.length}m gaps</div>
        </div>
      </div>

      {/* Evidence-Grounded Personal Health Memory Query Bar */}
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-slate-950/80 p-2.5">
        <div className="flex flex-wrap gap-1">
          {MEMORY_CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setQuestion(c)}
              className={`min-h-[30px] rounded-full border px-2 font-mono text-[9.5px] font-bold ${
                question === c ? 'border-emerald-400/55 bg-emerald-500/20 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              {c.slice(0, 26)}…
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-white/90">{memoryAnswer.summary}</span>
          <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9.5px] text-cyan-200">
            {memoryAnswer.certainty} · {memoryAnswer.citations.length} cited
          </span>
        </div>
      </div>

      {/* Portable Lifetime Medical Passport Scope Guard */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-2.5 py-2 font-mono text-[10px]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPassportScope('EMERGENCY_NARROW')}
            className={`min-h-[32px] rounded-lg border px-2 font-black ${
              passportScope === 'EMERGENCY_NARROW' ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            Emergency Narrow
          </button>
          <button
            type="button"
            onClick={() => setPassportScope('CLINICIAN_FULL')}
            className={`min-h-[32px] rounded-lg border px-2 font-black ${
              passportScope === 'CLINICIAN_FULL' ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            Clinician Full
          </button>
        </div>
        <span className="text-slate-300">
          Allergies: {passport.allergies.length} · Meds: {passport.activeMedications.length} · Sensitive Excluded: {String(passport.restrictedSensitiveExcluded)}
        </span>
      </div>
    </div>
  )
}
