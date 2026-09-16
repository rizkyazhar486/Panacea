import { LongitudinalStateRibbon } from '../components/LongitudinalStateRibbon'
import { UnifiedBodyWorkspace } from './UnifiedBodyWorkspace'

// Search-catalog compatibility for PencarianGlobal. FitnessHub is now a unified
// workspace, but global search still consumes the historical GROUPS contract.
export const GROUPS = [
  {
    name: 'Your Body',
    tools: [
      { to: '/fitness-hub?view=body', name: 'Your Body', kw: 'body composition measurements' },
      { to: '/fitness-hub?view=character', name: '3D Character & Body Shaper', kw: '3d avatar posture body shaper' },
      { to: '/fitness-hub?view=training', name: 'Training', kw: 'training plan sport science progression' },
      { to: '/fitness-hub?view=workout', name: 'Workout', kw: 'workout strength movement session' },
      { to: '/fitness-hub?view=recovery', name: 'Sleep & Recovery', kw: 'sleep recovery readiness' },
      { to: '/fitness-hub?view=numbers', name: 'Your Numbers', kw: 'metrics vitals health signals' },
      { to: '/fitness-hub?view=nutrition', name: 'Nutrition', kw: 'nutrition food hydration macros' },
      { to: '/fitness-hub?view=health-data', name: 'Health Data', kw: 'wearables imported recorded health data' },
      { to: '/fitness-hub?view=labs', name: 'Health Data Lab', kw: 'lab data trends' },
      { to: '/fitness-hub?view=longevity', name: 'Longevity', kw: 'healthy aging longevity' },
      { to: '/fitness-hub?view=vitapulse', name: 'VitaPulse', kw: 'vitality health summary' },
    ],
  },
]

export function FitnessHub() {
  return (
    <div className="space-y-5">
      <LongitudinalStateRibbon title="Your Body state stream" />
      <UnifiedBodyWorkspace />
    </div>
  )
}

export default FitnessHub
