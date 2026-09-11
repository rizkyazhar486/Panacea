import { LifeLibraryWorkbench } from '../components/LifeLibraryWorkbench'
import { Learn as LearnBase } from './LearnBase'

export function Learn() {
  return (
    <div className="space-y-6 pb-8">
      <LifeLibraryWorkbench />
      <LearnBase />
    </div>
  )
}

export default Learn
