import { useMemo, useState } from 'react'
import type { EMRRecord, SupportiveResult, VitalSign } from '../lib/types'
import { SurfaceDepthNavigator } from './SurfaceDepthNavigator'

type EmrDepth = 'timeline' | 'encounter' | 'problem' | 'observation' | 'resource' | 'provenance'

function latestByTime<T extends { takenAt: string }>(items: readonly T[]) {
  const sorted = items
    .filter((item) => Number.isFinite(Date.parse(item.takenAt)))
    .slice()
    .sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt))
  return sorted[sorted.length - 1]
}

function shortDate(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return '—'
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EmrTimelineLens({
  patientLabel,
  record,
  vitals,
  supportive,
}: {
  patientLabel: string
  record: EMRRecord
  vitals: readonly VitalSign[]
  supportive: readonly SupportiveResult[]
}) {
  const [depth, setDepth] = useState<EmrDepth>('timeline')
  const latestVital = useMemo(() => latestByTime(vitals), [vitals])
  const latestSupportive = useMemo(() => latestByTime(supportive), [supportive])

  const events = useMemo(() => {
    const items = [
      { id: 'created', at: record.createdAt, label: 'Encounter opened', detail: record.anamnesis.keluhanUtama || 'Clinical record created' },
      latestVital ? { id: 'vital', at: latestVital.takenAt, label: 'Vitals recorded', detail: `${latestVital.systolic}/${latestVital.diastolic} mmHg · HR ${latestVital.heartRate} bpm · SpO₂ ${latestVital.spo2}%` } : null,
      latestSupportive ? { id: 'supportive', at: latestSupportive.takenAt, label: latestSupportive.category, detail: `${latestSupportive.name}: ${latestSupportive.value}${latestSupportive.unit ? ` ${latestSupportive.unit}` : ''}` } : null,
      record.primaryDiagnosis ? { id: 'diagnosis', at: record.updatedAt, label: 'Diagnosis context', detail: `${record.primaryDiagnosis.code} · ${record.primaryDiagnosis.title}` } : null,
      record.signedAt ? { id: 'signed', at: record.signedAt, label: 'Record signed', detail: record.signedBy || 'Clinician verified' } : null,
    ].filter(Boolean) as { id: string; at: string; label: string; detail: string }[]

    return items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
  }, [latestSupportive, latestVital, record])

  const observationText = latestVital
    ? `BP ${latestVital.systolic}/${latestVital.diastolic} · HR ${latestVital.heartRate} · RR ${latestVital.respRate} · SpO₂ ${latestVital.spo2}% · ${latestVital.tempC.toFixed(1)} °C`
    : 'No recorded vital series for this encounter.'

  const depthContent: Record<EmrDepth, { label: string; value: string; detail: string }> = {
    timeline: {
      label: 'Timeline',
      value: `${events.length} events`,
      detail: 'Only recorded EMR events are shown; missing data stays missing rather than being inferred.',
    },
    encounter: {
      label: 'Encounter',
      value: shortDate(record.updatedAt),
      detail: record.anamnesis.keluhanUtama || 'No chief complaint recorded.',
    },
    problem: {
      label: 'Problem',
      value: record.primaryDiagnosis?.code || `${record.problems.length} problem${record.problems.length === 1 ? '' : 's'}`,
      detail: record.primaryDiagnosis?.title || record.problems[0]?.title || 'No primary diagnosis selected.',
    },
    observation: {
      label: 'Observation',
      value: latestVital ? shortDate(latestVital.takenAt) : 'No vitals',
      detail: observationText,
    },
    resource: {
      label: 'Structured record',
      value: `${record.plan.length} plan items`,
      detail: `${supportive.length} supportive results · ${record.references.length} references · ${record.careEpisodes?.length ?? 0} care episodes.`,
    },
    provenance: {
      label: 'Provenance',
      value: record.signedBy ? 'Clinician signed' : record.physicalExam.doctorVerified ? 'Exam verified' : 'Draft',
      detail: record.signedBy
        ? `Signed by ${record.signedBy} at ${shortDate(record.signedAt)}; later edits require explicit re-signing.`
        : 'AI-assisted content remains draft context until the clinician explicitly verifies and signs it.',
    },
  }

  const current = depthContent[depth]

  return (
    <section className="dark overflow-hidden rounded-[28px] border border-white/10 bg-[#050708] text-white" aria-label="AI-EMR longitudinal lens" data-pmd-unclamped="true">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200/65">AI-EMR · longitudinal lens</div>
          <div className="truncate text-sm font-black">{patientLabel}</div>
        </div>
        <div className="shrink-0 text-[9px] font-black uppercase tracking-[.12em] text-white/32">{shortDate(record.updatedAt)}</div>
      </header>

      <div className="px-4 pt-3 sm:px-5">
        <SurfaceDepthNavigator surface="ai-emr" activeStopId={depth} onSelect={(stop) => setDepth(stop as EmrDepth)} />
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,.65fr)]">
        <div className="min-w-0">
          <div className="relative flex gap-5 overflow-x-auto pb-3 no-scrollbar" aria-label="Recorded clinical timeline">
            <div className="pointer-events-none absolute left-2 right-2 top-[22px] h-px bg-white/10" aria-hidden />
            {events.map((event) => (
              <div key={event.id} className="relative min-w-[170px] pt-8">
                <span className="absolute left-0 top-[17px] h-3 w-3 rounded-full border-2 border-[#050708] bg-cyan-200" aria-hidden />
                <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/28">{shortDate(event.at)}</div>
                <div className="mt-1 truncate text-xs font-black text-white/82">{event.label}</div>
                <div className="mt-1 line-clamp-2 text-[10px] font-semibold leading-relaxed text-white/42">{event.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <aside className="border-t border-white/10 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0" aria-live="polite">
          <div className="text-[9px] font-black uppercase tracking-[.13em] text-white/30">{current.label}</div>
          <div className="mt-1 text-2xl font-black tracking-[-.04em]">{current.value}</div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/46">{current.detail}</p>
        </aside>
      </div>
    </section>
  )
}

export default EmrTimelineLens
