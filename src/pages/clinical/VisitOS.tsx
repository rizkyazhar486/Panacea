import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { derivePoliPatientFlow, PoliPatientFlowBoard } from '../../domains/clinical-operations'
import { PanaceaZoneNav } from '../../components/PanaceaZoneNav'
import { VisitCommandCenter } from '../../components/VisitCommandCenter'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'

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

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 pb-20 text-white">
      <PanaceaZoneNav />
      <BatasKlaimKesehatan permukaan="care.visit-os" className="mt-2 text-[11px] leading-snug text-white/55" />
      <PoliPatientFlowBoard rows={patientRows} activePatientId={activePatient.id} onSelect={setActivePatient} />
      <VisitCommandCenter />
      <nav aria-label="Visit OS related clinical tools" className="flex gap-5 overflow-x-auto border-y border-white/10 py-1 no-scrollbar">
        {[
          ['/poli', 'Poli board'],
          ['/emr', 'AI-EMR'],
          ['/body-explorer', 'Body Exposure'],
          ['/health-data', 'Device data'],
          ['/consult', 'Consultations'],
          ['/planning', 'Plan'],
        ].map(([to, label]) => (
          <Link key={to} to={to} className="flex min-h-12 shrink-0 items-center gap-2 text-xs font-black text-white/55 transition hover:text-white">
            {label}<span aria-hidden>→</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default VisitOS
