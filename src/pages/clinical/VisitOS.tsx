import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { derivePoliPatientFlow, PoliPatientFlowBoard, CareContinuityPanel, deriveCareContinuityState } from '../../domains/clinical-operations'
import { deriveEncounterOutcomeJob } from '../../domains/clinical-operations/model/encounterOutcomeJob'
import { PanaceaZoneNav } from '../../components/PanaceaZoneNav'
import { VisitCommandCenter } from '../../components/VisitCommandCenter'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'
import { ClinicalPatientContext } from '../../components/ClinicalPatientContext'

const STEP_LABEL: Record<string, string> = {
  missing: 'Needed',
  prepared: 'Prepared · review needed',
  'needs-review': 'Clinician review',
  verified: 'Clinician signed',
  tracked: 'Recorded · not verified',
  blocked: 'Blocked',
}

export function VisitOS() {
  const { state, activePatient, setActivePatient } = useStore()
  const nowIso = new Date().toISOString()
  const patientRows = state.patients.map((patient) => {
    const record = state.records[patient.id]
    return derivePoliPatientFlow({
      patientId: patient.id,
      name: patient.name,
      mrn: patient.mrn,
      dob: patient.dob,
      sex: patient.sex,
      riskFlagCount: patient.riskFlags.length,
      historyItemCount: patient.chronicConditions.length + patient.riskFlags.length,
      vitalTimestamps: (state.vitals[patient.id] ?? []).map((vital) => vital.takenAt),
      supportiveSignals: (state.supportive[patient.id] ?? []).map((signal) => ({
        takenAt: signal.takenAt,
        category: signal.category,
        flag: signal.flag,
      })),
      record: record ? {
        updatedAt: record.updatedAt,
        primaryDiagnosis: record.primaryDiagnosis?.title,
        physicalExamClinicianVerified: Boolean(record.physicalExam.verifiedById),
        recordClinicianSigned: Boolean(record.signedById),
        proposedPlanCount: record.plan.filter((item) => item.status === 'usulan').length,
      } : undefined,
    }, nowIso)
  })
  const outcomeJob = activePatient.id === 'none' ? null : deriveEncounterOutcomeJob({
    patientId: activePatient.id,
    evaluatedAt: nowIso,
    vitalTimestamps: (state.vitals[activePatient.id] ?? []).map(vital => vital.takenAt),
    historyItemCount: activePatient.chronicConditions.length + activePatient.riskFlags.length,
    record: state.records[activePatient.id],
    criticalFlag: patientRows.find(row => row.patientId === activePatient.id)?.priority === 'critical',
  })
  const careContinuity = activePatient.id === 'none' ? null : deriveCareContinuityState({
    patientId: activePatient.id,
    evaluatedAt: nowIso,
    supportiveResults: state.supportive[activePatient.id],
    record: state.records[activePatient.id],
    vitals: state.vitals[activePatient.id],
  })

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 pb-20 text-white">
      <PanaceaZoneNav />
      <BatasKlaimKesehatan permukaan="care.visit-os" className="mt-2 text-[11px] leading-snug text-white/55" />
      <PoliPatientFlowBoard rows={patientRows} activePatientId={activePatient.id} onSelect={setActivePatient} />
      {outcomeJob && (
        <section aria-label="Encounter outcome workflow" data-encounter-outcome-job="v1" aria-labelledby="visit-next-action-title" className="dark rounded-2xl border border-emerald-400/20 bg-[#081410] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-emerald-300">Outcome-first visit · human-controlled</p>
              <h2 id="visit-next-action-title" className="mt-1 text-lg font-bold">Next step in this visit</h2>
              <p id="visit-next-action-reason" className="mt-1 text-sm leading-relaxed text-white/80">{outcomeJob.nextAction.reason}</p>
            </div>
            <Link to={outcomeJob.nextAction.href} aria-describedby="visit-next-action-reason" state={{ fromVisitOS: true }} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              {outcomeJob.nextAction.title}<span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </div>
          <details className="mt-3 border-t border-white/10 pt-3 text-xs text-white/65">
            <summary className="flex min-h-11 cursor-pointer select-none items-center rounded-lg px-2 text-sm font-semibold text-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">Workflow evidence · {outcomeJob.steps.filter(step => step.state === 'verified').length} clinician-verified stage(s)</summary>
            <ol className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {outcomeJob.steps.map((step) => (
                <li key={step.id} className="min-w-0 rounded-lg border border-white/10 bg-white/[.035] p-3">
                  <div className="text-sm font-semibold text-white">{step.title}</div>
                  <div className={step.state === 'blocked' ? 'mt-1 text-amber-300' : step.state === 'verified' ? 'mt-1 text-emerald-300' : 'mt-1 text-white/60'}>{STEP_LABEL[step.state]}</div>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{step.detail}</p>
                  <Link to={step.href} className="mt-2 inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-emerald-200 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">Review {step.title}</Link>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11px] text-white/55">Local workflow projection only. AI does not sign clinical records, execute orders, submit claims, or independently verify outcomes.</p>
          </details>
        </section>
      )}
      {activePatient.id !== 'none' && (
        <CareContinuityPanel
          patientName={activePatient.name}
          closure={careContinuity?.closure}
          careAccess={careContinuity?.careAccess}
          episodeResilience={careContinuity?.episodeResilience}
          oneOsProof={careContinuity?.oneOsProof}
          careJourneys={careContinuity?.careJourneys}
        />
      )}
      {activePatient.id !== 'none' && (
        <div data-visit-patient-body-context="v1">
          <ClinicalPatientContext />
        </div>
      )}
      <VisitCommandCenter />
      <nav aria-label="Visit OS related clinical tools" className="flex gap-5 overflow-x-auto border-y border-white/10 py-1 no-scrollbar">
        {[
          ['/poli', 'Poli board'],
          ['/emr', 'AI-EMR'],
          ['/care-episode', 'Care journey'],
          ['/body-explorer', 'Body Exposure'],
          ['/health-data', 'Device data'],
          ['/consult', 'Consultations'],
          ['/planning', 'Plan'],
        ].map(([to, label]) => (
          <Link key={to} to={to} className="flex min-h-12 shrink-0 items-center gap-2 rounded-md text-sm font-semibold text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">
            {label}<span aria-hidden>→</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
export default VisitOS
