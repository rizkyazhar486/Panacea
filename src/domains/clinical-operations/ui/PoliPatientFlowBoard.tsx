import { Link } from 'react-router-dom'
import { Prosa } from '../../../components/Prosa'
import type { PoliFlowPriority, PoliPatientFlow } from '../model/poliPatientFlow'

interface PoliPatientFlowBoardProps {
  rows: readonly PoliPatientFlow[]
  activePatientId: string
  onSelect: (patientId: string) => void
}

const CONTINUUM = ['Daily life', 'Outpatient', 'Ward', 'Operating room', 'ICU', 'Home / follow-up']

function priorityClass(priority: PoliFlowPriority) {
  if (priority === 'critical') return 'border-red-400/35 bg-red-400/10 text-red-100'
  if (priority === 'attention') return 'border-amber-300/35 bg-amber-300/10 text-amber-100'
  if (priority === 'review') return 'border-sky-300/35 bg-sky-300/10 text-sky-100'
  if (priority === 'data-gap') return 'border-violet-300/35 bg-violet-300/10 text-violet-100'
  return 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
}

function freshnessLabel(row: PoliPatientFlow) {
  if (row.freshness === 'recent') return 'Recent signal'
  if (row.freshness === 'today') return 'Updated today'
  if (row.freshness === 'historical') return 'Historical data'
  return 'No longitudinal data'
}

function formatLatest(value: string | null) {
  if (!value) return 'No recorded signal'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Timestamp needs reconciliation'
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function PoliPatientFlowBoard({ rows, activePatientId, onSelect }: PoliPatientFlowBoardProps) {
  const criticalCount = rows.filter((row) => row.priority === 'critical').length
  const reviewCount = rows.filter((row) =>
    row.priority === 'review' || row.priority === 'attention' || row.priority === 'data-gap',
  ).length

  return (
    <section
      id="poli-patient-flow"
      data-poli-patient-flow="v1"
      aria-label="Outpatient longitudinal patient flow"
      className="dark overflow-hidden rounded-[34px] border border-white/10 bg-[#05070a] text-white shadow-[0_24px_90px_rgba(0,0,0,.24)]"
    >
      <header className="border-b border-white/10 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-emerald-200/70">
              One OS · outpatient command board
            </div>
            <h1 className="mt-1 text-xl font-black tracking-[-.035em] sm:text-2xl">Poli patient flow</h1>
            <Prosa kelas="mt-2 text-sm leading-relaxed text-white/55">
              One patient state across everyday life and every care setting. This board organizes workflow; it does not autonomously diagnose, triage, prescribe, or sign clinical decisions.
            </Prosa>
          </div>
          <div className="grid min-w-[220px] grid-cols-3 gap-2 text-center">
            {[
              ['Patients', rows.length],
              ['Critical', criticalCount],
              ['To review', reviewCount],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.035] px-3 py-2">
                <div className="text-lg font-black">{value}</div>
                <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label="Longitudinal care continuum target">
          {CONTINUUM.map((stage, index) => (
            <div key={stage} className="flex shrink-0 items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-[10px] font-black text-white/60">{stage}</span>
              {index < CONTINUUM.length - 1 && <span className="text-white/20" aria-hidden>→</span>}
            </div>
          ))}
        </div>
        <Prosa kelas="mt-2 text-[10px] leading-relaxed text-white/35">
          Architecture target: wearables and home sensors, clinic devices, ward monitors, OR/anesthesia systems, ICU devices, laboratory, imaging, medication and follow-up reconcile into the same provenance-aware longitudinal state.
        </Prosa>
      </header>

      {rows.length === 0 ? (
        <div className="p-6 text-center sm:p-10">
          <div className="text-base font-black">No patients in the clinical store yet</div>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/45">
            Add a patient in AI-EMR. The poli board will use the same patient identity instead of creating a second list.
          </p>
          <Link to="/emr" className="mt-4 inline-flex min-h-10 items-center rounded-full bg-white px-4 text-xs font-black text-black">
            Open AI-EMR
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {rows.map((row) => {
            const selected = row.patientId === activePatientId
            return (
              <article
                key={row.patientId}
                className={`grid gap-3 p-4 transition sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center sm:p-5 ${selected ? 'bg-emerald-300/[.045]' : 'hover:bg-white/[.025]'}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => onSelect(row.patientId)} className="truncate text-left text-sm font-black hover:text-emerald-100">
                      {row.name}
                    </button>
                    {selected && (
                      <span className="rounded-full border border-emerald-300/25 px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] text-emerald-200">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-white/35">
                    {row.mrn} · {row.ageYears === null ? 'Age unknown' : `${row.ageYears} y`} · {row.sex}
                  </div>
                  {row.primaryDiagnosis && <div className="mt-2 truncate text-xs font-semibold text-white/65">{row.primaryDiagnosis}</div>}
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {row.dataSources.length ? row.dataSources.slice(0, 4).map((source) => (
                      <span key={source} className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-bold text-white/45">{source}</span>
                    )) : (
                      <span className="text-[10px] font-semibold text-white/30">No source recorded</span>
                    )}
                  </div>
                  <div className="mt-2 text-[10px] text-white/35">{freshnessLabel(row)} · {formatLatest(row.latestAt)}</div>
                </div>

                <div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.1em] ${priorityClass(row.priority)}`}>
                    {row.priority}
                  </span>
                  <div className="mt-2 text-xs font-bold leading-relaxed text-white/70">{row.nextAction}</div>
                  {row.invalidTimestampCount > 0 && (
                    <div className="mt-1 text-[10px] text-violet-200/70">{row.invalidTimestampCount} timestamp(s) require reconciliation</div>
                  )}
                </div>

                <div className="flex gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onSelect(row.patientId)}
                    className="min-h-10 rounded-full border border-white/10 px-3 text-[10px] font-black text-white/60 hover:border-white/25 hover:text-white"
                  >
                    Focus
                  </button>
                  <Link
                    to="/emr"
                    onClick={() => onSelect(row.patientId)}
                    className="inline-flex min-h-10 items-center rounded-full bg-white px-3.5 text-[10px] font-black text-black"
                  >
                    Open EMR →
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
