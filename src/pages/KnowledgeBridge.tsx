import { KnowledgeBridgeWorkbench } from '../components/KnowledgeBridgeWorkbench'
import { KnowledgeBridge as KnowledgeBridgeBase } from './KnowledgeBridgeBase'

export function KnowledgeBridge() {
  return (
    <div className="space-y-5 pb-8">
      <KnowledgeBridgeWorkbench />
      <KnowledgeBridgeBase />
    </div>
  )
}

export default KnowledgeBridge
