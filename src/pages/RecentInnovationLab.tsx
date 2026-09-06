import { PanaceaFrontierSeven } from '../components/PanaceaFrontierSeven'
import { RecentInnovationLab as RecentInnovationLabBase } from './RecentInnovationLabBase'

export function RecentInnovationLab() {
  return (
    <div className="space-y-5 pb-8">
      <PanaceaFrontierSeven />
      <RecentInnovationLabBase />
    </div>
  )
}

export default RecentInnovationLab
