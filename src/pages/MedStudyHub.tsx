import { useSearchParams } from 'react-router-dom'
import { MedicalLibraryWorkbench } from '../components/MedicalLibraryWorkbench'
import { StudyCommandCenter } from '../components/StudyCommandCenter'
import { MedStudyHub as MedStudyHubBase } from './MedStudyHubBase'

export function MedStudyHub() {
  const [params, setParams] = useSearchParams()

  function runEvidenceQuery(query: string) {
    const next = new URLSearchParams(params)
    next.set('bagian', 'evidence')
    next.set('cari', query)
    setParams(next, { replace: true })
  }

  return (
    <div className="space-y-5 pb-8">
      <StudyCommandCenter />
      <MedicalLibraryWorkbench onRun={runEvidenceQuery} />
      <MedStudyHubBase key={params.toString()} />
    </div>
  )
}

export default MedStudyHub
