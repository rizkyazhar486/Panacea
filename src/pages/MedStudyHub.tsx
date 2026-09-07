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
      <MedicalLibraryWorkbench onRun={runEvidenceQuery} />
      <MedStudyHubBase key={params.toString()} />

      <details className="mx-auto max-w-5xl rounded-[24px] border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.035] sm:p-4">
        <summary className="cursor-pointer text-[11px] font-black text-neutral-700 dark:text-neutral-200">
          Optional study planner · focus timer, goals and spaced review
        </summary>
        <p className="mt-2 text-[9.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          This planner supports study workflow but is separate from the Medical Library itself. Open it only when you want to plan or review learning.
        </p>
        <div className="mt-3">
          <StudyCommandCenter />
        </div>
      </details>
    </div>
  )
}

export default MedStudyHub
