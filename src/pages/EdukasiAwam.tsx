import { HealthLiteracyCoach } from '../components/HealthLiteracyCoach'
import { EdukasiAwam as EdukasiAwamBase } from './EdukasiAwamBase'

export function EdukasiAwam() {
  return (
    <div className="space-y-5 pb-8">
      <HealthLiteracyCoach />
      <EdukasiAwamBase />
    </div>
  )
}

export default EdukasiAwam
