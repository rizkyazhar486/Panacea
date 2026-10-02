import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { buildBodyClinicalFindings } from '../lib/bodyClinicalFindings'
import { projectEmrToBodyClinicalBridge } from '../lib/bodyClinicalBridge'
import { ClinicalBodyTwin } from './ClinicalBodyTwin'

export function ClinicalPatientContext() {
  const { state, activePatient } = useStore()
  const record = state.records[activePatient.id]

  if (!record) {
    return (
      <section className="border-y border-white/10 py-4" aria-label="Clinical patient context">
        <div className="flex min-h-[52px] items-center justify-between gap-4">
          <span className="min-w-0 text-xs font-black leading-snug text-white/48">No patient record yet</span>
          <Link to="/emr" className="shrink-0 text-[10px] font-black text-white/72 hover:text-white">Open AI-EMR →</Link>
        </div>
      </section>
    )
  }

  const findings = buildBodyClinicalFindings(record.physicalExam?.perSystem, record.physicalExam)
  const projection = projectEmrToBodyClinicalBridge(
    record,
    state.vitals[activePatient.id] ?? [],
    findings,
    record.updatedAt,
  )

  return <ClinicalBodyTwin projection={projection} patientLabel={activePatient.name} />
}

export default ClinicalPatientContext
