import { BodyWidgetOS } from './BodyWidgetOS'

export const GROUPS = [
  {
    name: 'Your Body',
    tools: [
      { to: '/fitness-hub', name: 'Today', kw: 'today visual health dashboard' },
      { to: '/fitness-hub', name: 'Move', kw: 'steps active calories movement' },
      { to: '/latihan', name: 'Training', kw: 'training plan sport science progression' },
      { to: '/tubuh?t=tidur', name: 'Sleep & Recovery', kw: 'sleep recovery readiness' },
      { to: '/body', name: 'Body', kw: 'body composition measurements' },
      { to: '/athlete', name: 'Fitness', kw: 'fitness vo2max performance cardio' },
      { to: '/jiwa', name: 'Mind', kw: 'mind mood stress mental wellbeing' },
      { to: '/longevity', name: 'Longevity', kw: 'healthy aging longevity' },
      { to: '/nutrition', name: 'Nutrition', kw: 'nutrition food hydration macros' },
      { to: '/health-data', name: 'Health Data', kw: 'wearables imported recorded health data' },
      { to: '/vitapulse', name: 'VitaPulse', kw: 'vitality health summary' },
    ],
  },
]

export function FitnessHub() {
  return <BodyWidgetOS />
}

export default FitnessHub
