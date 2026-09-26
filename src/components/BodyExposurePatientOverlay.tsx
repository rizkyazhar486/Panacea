import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { buildBodyClinicalFindings, LABEL_ASAL_TEMUAN } from '../lib/bodyClinicalFindings'
import { projectEmrToBodyClinicalBridge } from '../lib/bodyClinicalBridge'
import { focusBodyClinicalProjection } from '../lib/bodyClinicalSystemContext'
import type { BodySystemId } from '../lib/bodySystemSourceWave'
import { strukturUntukTemuan, type StrukturTemuan } from '../lib/strukturTemuanFisik'

function reviewLabel(state: 'draft' | 'exam-verified' | 'record-signed') {
  if (state === 'record-signed') return 'Signed record'
  if (state === 'exam-verified') return 'Exam verified'
  return 'Draft context'
}

export function BodyExposurePatientOverlay({
  selectedSystemId,
  onClinicalView,
  onShowStructure,
}: {
  selectedSystemId: BodySystemId
  onClinicalView?: () => void
  /** Tampilkan struktur rujukan wilayah pemeriksaan di kanvas 3D. */
  onShowStructure?: (s: StrukturTemuan) => void
}) {
  const { state, activePatient } = useStore()
  const record = state.records[activePatient.id]
  if (!record) return null

  const projection = projectEmrToBodyClinicalBridge(
    record,
    state.vitals[activePatient.id] ?? [],
    buildBodyClinicalFindings(record.physicalExam?.perSystem, record.physicalExam),
    record.updatedAt,
  )
  const focus = focusBodyClinicalProjection(projection, selectedSystemId)

  return (
    <section
      aria-label="AI-EMR patient context overlay"
      data-pmd-patient-overlay="true"
      data-pmd-system-focus={focus.systemId}
      className="mb-2 overflow-hidden rounded-[20px] border border-emerald-300/15 bg-black/60 text-white backdrop-blur-2xl"
    >
      <div className="flex min-h-[52px] items-center gap-4 overflow-x-auto px-3 no-scrollbar sm:px-4">
        <div className="min-w-[150px] shrink-0">
          <div className="truncate text-[9px] font-black uppercase tracking-[.15em] text-emerald-200/70">Patient overlay · AI-EMR · {focus.label}</div>
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
          <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/30">Focused findings</div>
          <div className="text-sm font-black text-rose-200/85">{focus.findingCounts.abnormal}</div>
        </div>
        <div className="min-w-[88px] shrink-0">
          <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/30">Exam context</div>
          <div className="truncate text-[10px] font-black text-white/70">{focus.recordedFindings}/{focus.markers.length}</div>
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

      {onShowStructure && (() => {
        const tercatat = focus.markers.filter((m) => m.status !== 'unchecked')
        if (!tercatat.length) return null
        return (
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-white/[.06] px-3 py-1.5 no-scrollbar sm:px-4" data-temuan-ke-struktur>
            {tercatat.map((m) => {
              const s = strukturUntukTemuan(m.key)
              const warna = m.status === 'abnormal' ? 'border-rose-300/40 text-rose-100' : m.status === 'recorded' ? 'border-amber-300/40 text-amber-100' : 'border-emerald-300/30 text-emerald-100'
              const asal = m.origin ? LABEL_ASAL_TEMUAN[m.origin] : undefined
              const heuristik = m.origin === 'text-heuristic'
              const label = `${m.label} · ${m.status === 'abnormal' ? 'finding' : m.status}${heuristik ? ' · unverified heuristic' : ''}`
              return s ? (
                <button key={m.key} type="button" onClick={() => onShowStructure(s)} data-temuan={m.key} data-struktur={s.name}
                  data-asal-temuan={m.origin ?? ''} title={asal} aria-label={asal ? `${label} · ${asal} · show ${s.name}` : undefined}
                  className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] font-black ${warna}${heuristik ? ' border-dashed' : ''}`}>
                  {label} · show {s.name}
                </button>
              ) : (
                <span key={m.key} data-temuan={m.key} data-asal-temuan={m.origin ?? ''} title={asal} className="shrink-0 text-[10px] font-bold text-white/40">
                  {m.label} · no exact 3D structure{heuristik ? ' · unverified heuristic' : ''}
                </span>
              )
            })}
            <span className="shrink-0 text-[9px] text-white/35">reference region examined — not the lesion location</span>
          </div>
        )
      })()}

      <details className="border-t border-white/[.06] px-3 py-1.5 text-[9px] font-semibold text-white/35 sm:px-4">
        <summary className="cursor-pointer truncate font-black uppercase tracking-[.1em] text-white/35">
          {focus.label} exam focus · patient-wide vitals · geometry remains reference-only
        </summary>
        <p className="mt-2 max-w-4xl pb-2 leading-relaxed text-white/45">
          Recorded examination markers are filtered to the selected Body Exposure system for navigation only. Vitals remain patient-wide and are not re-labeled as organ-specific measurements. They do not morph atlas geometry into patient-specific anatomy and do not generate diagnosis, severity, prognosis, treatment, lesion location or procedure targets.
        </p>
      </details>
    </section>
  )
}

export default BodyExposurePatientOverlay
