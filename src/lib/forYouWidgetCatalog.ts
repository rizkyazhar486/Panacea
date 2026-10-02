export type ForYouWidgetKind =
  | 'music'
  | 'sports'
  | 'faith'
  | 'mental-wellbeing'
  | 'motivation'
  | 'library'
  | 'stories'
  | 'activity'

export type ForYouPrimaryVisual =
  | 'media'
  | 'score'
  | 'chart'
  | 'number'
  | 'timeline'
  | 'quote'
  | 'stack'

export type ForYouAdapter = 'spotify' | 'apple-music'

export interface ForYouWidgetDefinition {
  id: string
  title: string
  kind: ForYouWidgetKind
  primaryVisual: ForYouPrimaryVisual
  oneSentence: string
  route?: string
  adapters?: readonly ForYouAdapter[]
  sourcePolicy: 'existing-route' | 'local' | 'live-source' | 'adapter-required'
}

export const FOR_YOU_WIDGET_CATALOG: readonly ForYouWidgetDefinition[] = [
  {
    id: 'music',
    title: 'Music',
    kind: 'music',
    primaryVisual: 'media',
    oneSentence: 'Play a focus, training, recovery or wind-down soundtrack from a connected music provider.',
    adapters: ['spotify', 'apple-music'],
    sourcePolicy: 'adapter-required',
  },
  {
    id: 'sports',
    title: 'Live sports',
    kind: 'sports',
    primaryVisual: 'score',
    oneSentence: 'See live or recent scores from the existing source-backed sports experience.',
    route: '/sports-scores',
    sourcePolicy: 'live-source',
  },
  {
    id: 'faith',
    title: 'Faith',
    kind: 'faith',
    primaryVisual: 'timeline',
    oneSentence: 'Keep prayer times, scripture and reflection reachable without turning the main feed into prose.',
    route: '/prayer-times',
    sourcePolicy: 'existing-route',
  },
  {
    id: 'mental-wellbeing',
    title: 'Mind',
    kind: 'mental-wellbeing',
    primaryVisual: 'number',
    oneSentence: 'Offer a private check-in and direct access to the existing mental-health support tools.',
    route: '/mental-health-screen',
    sourcePolicy: 'existing-route',
  },
  {
    id: 'motivation',
    title: 'Momentum',
    kind: 'motivation',
    primaryVisual: 'quote',
    oneSentence: 'Show one useful prompt for the next meaningful action, not an endless motivational feed.',
    sourcePolicy: 'local',
  },
  {
    id: 'library',
    title: 'Library',
    kind: 'library',
    primaryVisual: 'stack',
    oneSentence: 'Continue saved books, learning materials and personal knowledge from one compact shelf.',
    route: '/my-materials',
    sourcePolicy: 'existing-route',
  },
  {
    id: 'stories',
    title: 'Stories',
    kind: 'stories',
    primaryVisual: 'media',
    oneSentence: 'Surface short meaningful stories with optional deeper reading.',
    route: '/prophet-stories',
    sourcePolicy: 'existing-route',
  },
  {
    id: 'activity',
    title: 'Activity',
    kind: 'activity',
    primaryVisual: 'chart',
    oneSentence: 'Show sport and activity as distance, load, pace, reps, recovery and trend graphics.',
    route: '/fitness-hub?view=training',
    sourcePolicy: 'existing-route',
  },
] as const

export function widgetsRequiringExternalAdapters() {
  return FOR_YOU_WIDGET_CATALOG.filter((widget) => widget.sourcePolicy === 'adapter-required')
}
