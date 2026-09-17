export type WidgetActionKind =
  | 'navigate'
  | 'expand-inline'
  | 'collapse-inline'
  | 'start'
  | 'pause'
  | 'resume'
  | 'reset'
  | 'submit'
  | 'refresh'
  | 'open-context'

export interface FunctionalWidgetAction {
  id: string
  label: string
  kind: WidgetActionKind
  targetRoute?: string
  changesState: boolean
  producesFeedback: boolean
  decorativeOnly: false
}

export interface FunctionalWidgetSpec {
  id: string
  title: string
  surface: 'home' | 'your-body' | 'clinical' | 'for-you'
  actions: readonly FunctionalWidgetAction[]
  hasInlineState: boolean
  progressiveDisclosure: boolean
  maxInteractionsToPrimaryFunction: 1 | 2
}

export interface FunctionalWidgetAudit {
  widgetId: string
  interactiveControlCount: number
  actionableControlCount: number
  functionalCoverageFraction: number
  deadControlIds: readonly string[]
  primaryFunctionWithinTwoSteps: boolean
  pass: boolean
}

function assertRoute(route: string, field: string) {
  if (!route.startsWith('/') || route.includes('://')) throw new Error(`${field} must be an internal app route`)
}

/**
 * FunctionalCoverage = controls with a real navigation/state action and feedback
 * contract / total declared interactive controls.
 *
 * Panacea's Home/widget target is 1.0: an interactive-looking control must not
 * exist only as decoration. This is a product-interaction metric, not usability
 * or clinical quality.
 */
export function auditFunctionalWidget(spec: FunctionalWidgetSpec): FunctionalWidgetAudit {
  if (!spec.id.trim()) throw new Error('spec.id must not be blank')
  if (!spec.title.trim()) throw new Error('spec.title must not be blank')
  if (!spec.actions.length) throw new Error('functional widget must expose at least one action')

  const seen = new Set<string>()
  const deadControlIds: string[] = []
  for (const action of spec.actions) {
    if (!action.id.trim() || !action.label.trim()) throw new Error('action id/label must not be blank')
    if (seen.has(action.id)) throw new Error(`duplicate action id: ${action.id}`)
    seen.add(action.id)
    if (action.kind === 'navigate') {
      if (!action.targetRoute) deadControlIds.push(action.id)
      else assertRoute(action.targetRoute, `action.${action.id}.targetRoute`)
    }
    const performsAction = action.kind === 'navigate' ? Boolean(action.targetRoute) : action.changesState
    if (!performsAction || !action.producesFeedback || action.decorativeOnly !== false) deadControlIds.push(action.id)
  }

  const uniqueDead = [...new Set(deadControlIds)]
  const interactiveControlCount = spec.actions.length
  const actionableControlCount = interactiveControlCount - uniqueDead.length
  const functionalCoverageFraction = interactiveControlCount ? actionableControlCount / interactiveControlCount : 0
  const primaryFunctionWithinTwoSteps = spec.maxInteractionsToPrimaryFunction <= 2

  return {
    widgetId: spec.id,
    interactiveControlCount,
    actionableControlCount,
    functionalCoverageFraction,
    deadControlIds: uniqueDead,
    primaryFunctionWithinTwoSteps,
    pass: functionalCoverageFraction === 1 && primaryFunctionWithinTwoSteps && spec.progressiveDisclosure,
  }
}

export function createInlineTimerWidgetSpec(id: string, targetRoute = '/'): FunctionalWidgetSpec {
  assertRoute(targetRoute, 'targetRoute')
  return {
    id,
    title: 'Timer',
    surface: 'home',
    hasInlineState: true,
    progressiveDisclosure: true,
    maxInteractionsToPrimaryFunction: 1,
    actions: [
      { id: 'start', label: 'Start', kind: 'start', changesState: true, producesFeedback: true, decorativeOnly: false },
      { id: 'pause', label: 'Pause', kind: 'pause', changesState: true, producesFeedback: true, decorativeOnly: false },
      { id: 'reset', label: 'Reset', kind: 'reset', changesState: true, producesFeedback: true, decorativeOnly: false },
      { id: 'open', label: 'Open', kind: 'navigate', targetRoute, changesState: false, producesFeedback: true, decorativeOnly: false },
    ],
  }
}
