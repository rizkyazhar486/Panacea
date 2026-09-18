import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { buildBodyClinicalFindings } from '../lib/bodyClinicalFindings'
import { projectEmrToBodyClinicalBridge } from '../lib/bodyClinicalBridge'

function reviewLabel(state: 'draft' | 'exam-verified' | 'record-signed') {
  if (state === 'record-signed') return 'Signed record'
  if (state === 'exam-verified') return 'Exam verified'
  return 'Draft context'
}

export function BodyExposurePatientOverlay({
  onClinicalView,
}: {
  onClinicalView?: () => void
}) {
  const { state, activePatient } = useStore()
  const record = state.records[activePatient.id]
  if (!record) return null

  const projection = projectEmrToBodyClinicalBridge(
    record,
    state.vitals[activePatient.id] ?? [],
    buildBodyClinicalFindings(record.physicalExam.perSystem),
    record.updatedAt,
  )

  return (
    <section
      aria-label="AI-EMR patient context overlay"
      data-pmd-patient-overlay="true"
      className="mb-2 overflow-hidden rounded-[20px] border border-emerald-300/15 bg-black/60 text-white backdrop-blur-2xl"
    >
      <div className="flex min-h-[52px] items-center gap-4 overflow-x-auto px-3 no-scrollbar sm:px-4">
        <div className="min-w-[150px] shrink-0">
          <div className="truncate text-[9px] font-black uppercase tracking-[.15em] text-emerald-200/70">Patient overlay · AI-EMR</div>
          <div className="truncate text-xs font-black text-white/88">{activePatient.name}</div>
        </div>

        <div className="h-7 w-px shrink-0 bg-white/10" aria-hidden />

        {projection.signals.slice(0, 5).map((signal) => (
          <div key={signal.id} className="min-w-[82px] shrink-0">
            <div className="truncate text-[8px] font-black uppercase tracking-[.1em] text-white/30">{signal.label}</div>
            <div className="truncate text-sm font-black text-white/88">
              {signal.value}
              {signal.unit ? <span className="ml-1 text-[8px] font-bold text-white/35">{signal.unit}</span> : null}
            </div>
          </div>
        ))}

        <div className="h-7 w-px shrink-0 bg-white/10" aria-hidden />

        <div className="min-w-[76px] shrink-0">
          <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/30">Findings</div>
          <div className="text-sm font-black text-rose-200/85">{projection.findingCounts.abnormal}</div>
        </div>
        <div className="min-w-[104px] shrink-0">
          <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/30">Review</div>
          <div className="truncate text-[10px] font-black text-emerald-200/80">{reviewLabel(projection.reviewState)}</div>
        </div>

        {onClinicalView ? (
          <button
            type="button"
            onClick={onClinicalView}
            className="ml-auto grid min-h-[36px] shrink-0 place-items-center rounded-full border border-emerald-300/15 px-3 text-[9px] font-black text-emerald-100/75 transition hover:border-emerald-300/30 hover:text-emerald-100"
          >
            Clinical view
          </button>
        ) : null}
        <Link
          to="/emr"
          className="grid min-h-[36px] shrink-0 place-items-center rounded-full border border-white/10 px-3 text-[9px] font-black text-white/60 transition hover:border-white/20 hover:text-white"
        >
          AI-EMR →
        </Link>
      </div>

      <details className="border-t border-white/[.06] px-3 py-1.5 text-[9px] font-semibold text-white/35 sm:px-4">
        <summary className="cursor-pointer truncate font-black uppercase tracking-[.1em] text-white/35">
          Patient signals overlay reference anatomy · geometry remains reference-only
        </summary>
        <p className="mt-2 max-w-4xl pb-2 leading-relaxed text-white/45">
          Recorded vitals and examination findings follow the selected AI-EMR patient into Body Exposure as contextual overlays only. They do not morph atlas geometry into patient-specific anatomy and do not generate diagnosis, severity, prognosis, treatment, lesion location or procedure targets.
        </p>
      </details>
    </section>
  )
}

export default BodyExposurePatientOverlay
