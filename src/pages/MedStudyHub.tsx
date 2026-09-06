import { StudyCommandCenter } from '../components/StudyCommandCenter'
import { MedStudyHub as MedStudyHubBase } from './MedStudyHubBase'

export function MedStudyHub() {
  return (
    <div className="space-y-5 pb-8">
      <StudyCommandCenter />
      <MedStudyHubBase />
    </div>
  )
}

export default MedStudyHub
