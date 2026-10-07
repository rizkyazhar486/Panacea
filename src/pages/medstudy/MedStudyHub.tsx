import { useSearchParams } from 'react-router-dom'
import { MedicalLibraryWorkbench } from '../../components/MedicalLibraryWorkbench'
import { StudyCommandCenter } from '../../components/StudyCommandCenter'
import { MedStudyHub as MedStudyHubBase } from '../MedStudyHubBase'
import { Fold } from '../../shared/ui/Fold'

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
      <MedicalLibraryWorkbench onRun={runEvidenceQuery} />
      {/* Hasil pencarian bukti tampil di bagian ini; ia terbuka sendiri bila ada `bagian`. */}
      <Fold label="Topics" defaultOpen={params.has('bagian')}>
        <MedStudyHubBase key={params.toString()} />
      </Fold>

      <Fold label="Planner">
        <p className="mb-3 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          Focus timer, goals and spaced review. Separate from the Medical Library; open it only to plan or review learning.
        </p>
        <StudyCommandCenter />
      </Fold>
    </div>
  )
}

export default MedStudyHub
