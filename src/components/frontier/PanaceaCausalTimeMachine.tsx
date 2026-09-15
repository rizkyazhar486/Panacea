import { PanaceaBiologicalUniverse } from './PanaceaBiologicalUniverse'
import { PanaceaCausalTimeMachine as PanaceaCausalTimeMachineCore } from './PanaceaCausalTimeMachineCore'

export function PanaceaCausalTimeMachine() {
  return (
    <div className="space-y-5">
      <PanaceaCausalTimeMachineCore />
      <PanaceaBiologicalUniverse />
    </div>
  )
}

export default PanaceaCausalTimeMachine
