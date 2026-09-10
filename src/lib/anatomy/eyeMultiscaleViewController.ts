import {
  evaluateEyeLearningView,
  type EyeLearningViewScale,
  type EyeLearningViewState,
} from './eyeLearningViewContract'

export const EYE_MULTISCALE_ORDER: readonly EyeLearningViewScale[] = [
  'organ',
  'suborgan',
  'tissue',
  'cellular',
  'molecular',
] as const

export interface EyeMultiscaleViewCatalog {
  readonly views: readonly EyeLearningViewState[]
  readonly canonicalNodeIds: ReadonlySet<string>
}

export interface EyeMultiscaleTransitionDecision {
  readonly status: 'eligible' | 'blocked'
  readonly blockers: readonly string[]
  readonly fromViewId: string | null
  readonly toViewId: string
  readonly scaleDelta: number | null
  readonly mayRender: boolean
  readonly mayAnimate: boolean
  readonly mayInferFunction: false
  readonly mayLocalizeLesion: false
  readonly patientSpecific: false
}

function scaleIndex(scale: EyeLearningViewScale): number {
  return EYE_MULTISCALE_ORDER.indexOf(scale)
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

export function validateEyeMultiscaleViewCatalog(catalog: EyeMultiscaleViewCatalog): readonly string[] {
  const issues: string[] = []
  const ids = catalog.views.map((view) => view.id)
  for (const duplicate of duplicateValues(ids)) issues.push(`duplicate-view-id:${duplicate}`)

  for (const view of catalog.views) {
    const decision = evaluateEyeLearningView(view)
    for (const blocker of decision.blockers) issues.push(`view:${view.id}:${blocker}`)

    for (const nodeId of view.canonicalNodeIds) {
      if (!catalog.canonicalNodeIds.has(nodeId)) issues.push(`view:${view.id}:unknown-canonical-node:${nodeId}`)
    }
  }

  return issues
}

export interface EyeMultiscaleViewController {
  readonly currentViewId: string | null
  transition(toViewId: string): EyeMultiscaleTransitionDecision
}

export function createEyeMultiscaleViewController(
  catalog: EyeMultiscaleViewCatalog,
  initialViewId: string | null = null,
): EyeMultiscaleViewController {
  const catalogIssues = validateEyeMultiscaleViewCatalog(catalog)
  const byId = new Map(catalog.views.map((view) => [view.id, view]))
  let current = initialViewId

  return {
    get currentViewId() {
      return current
    },

    transition(toViewId: string): EyeMultiscaleTransitionDecision {
      const blockers = [...catalogIssues]
      const target = byId.get(toViewId)
      const source = current ? byId.get(current) : undefined

      if (!target) blockers.push(`missing-target-view:${toViewId}`)
      if (current && !source) blockers.push(`missing-current-view:${current}`)

      let delta: number | null = null
      let mayAnimate = false

      if (target) {
        const targetDecision = evaluateEyeLearningView(target)
        for (const blocker of targetDecision.blockers) blockers.push(`target:${blocker}`)
        mayAnimate = targetDecision.mayAnimate

        if (source) {
          delta = scaleIndex(target.scale) - scaleIndex(source.scale)
          if (Math.abs(delta) > 1) blockers.push(`scale-skip:${source.scale}->${target.scale}`)
        }
      }

      const status = blockers.length === 0 ? 'eligible' : 'blocked'
      if (status === 'eligible') current = toViewId

      return {
        status,
        blockers,
        fromViewId: source?.id ?? null,
        toViewId,
        scaleDelta: delta,
        mayRender: status === 'eligible',
        mayAnimate: status === 'eligible' && mayAnimate,
        mayInferFunction: false,
        mayLocalizeLesion: false,
        patientSpecific: false,
      }
    },
  }
}

export const EYE_MULTISCALE_VIEW_CONTROLLER_BOUNDARY =
  'The controller sequences Panacea-owned educational view states only. Adjacent scale navigation does not establish anatomical containment, physiology, lesion localization, patient specificity, renderer ownership, source provenance, or academic publication readiness.'
