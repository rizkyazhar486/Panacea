export type VisualSemanticAccent =
  | 'neutral'
  | 'information'
  | 'positive'
  | 'caution'
  | 'critical'
  | 'interactive'
  | 'selected'

export interface VisualFirstSurfaceSpec {
  id: string
  focalObjectCount: number
  primaryMetricCount: number
  mainScrollingTextMaxLines: number
  interpretationMode: 'on-demand'
  sectionGapPx: number
  semanticAccents: readonly VisualSemanticAccent[]
  arbitraryDecorativeGradientCount: number
  alwaysFloatingShadowCount: number
  equalWeightMetricTileGroups: number
  contextualControlsOnly: boolean
  progressiveDisclosure: boolean
  supportsFluidWidth: boolean
}

export interface VisualFirstValidation {
  pass: boolean
  issues: readonly string[]
  scores: {
    hierarchy: number
    restraint: number
    disclosure: number
    responsiveness: number
    overall: number
  }
}

export const PANACEA_VISUAL_FIRST_RULES = {
  maxFocalObjectsPerViewport: 1,
  maxPrimaryMetricsPerViewport: 1,
  maxMainScrollingTextLines: 1,
  minSectionGapPx: 24,
  arbitraryDecorativeGradientCount: 0,
  alwaysFloatingShadowCount: 0,
  equalWeightMetricTileGroups: 0,
  interpretationMode: 'on-demand',
} as const

function binary(value: boolean) {
  return value ? 1 : 0
}

/**
 * Deterministic product-design conformance only, not a usability-study score.
 *
 * Hierarchy = mean(focal-object rule, primary-metric rule, one-line text rule)
 * Restraint = mean(no arbitrary gradients, no always-floating shadows,
 *                  no equal-weight metric-tile groups)
 * Disclosure = mean(on-demand interpretation, contextual controls,
 *                   progressive disclosure)
 * Responsiveness = fluid-width support
 * Overall = mean(Hierarchy, Restraint, Disclosure, Responsiveness)
 */
export function validateVisualFirstSurface(spec: VisualFirstSurfaceSpec): VisualFirstValidation {
  if (!spec.id.trim()) throw new Error('spec.id must not be blank')
  if (!Number.isInteger(spec.focalObjectCount) || spec.focalObjectCount < 0) throw new Error('focalObjectCount must be a non-negative integer')
  if (!Number.isInteger(spec.primaryMetricCount) || spec.primaryMetricCount < 0) throw new Error('primaryMetricCount must be a non-negative integer')
  if (!Number.isInteger(spec.mainScrollingTextMaxLines) || spec.mainScrollingTextMaxLines < 0) throw new Error('mainScrollingTextMaxLines must be a non-negative integer')
  if (!Number.isFinite(spec.sectionGapPx) || spec.sectionGapPx < 0) throw new Error('sectionGapPx must be non-negative')

  const focalOk = spec.focalObjectCount <= PANACEA_VISUAL_FIRST_RULES.maxFocalObjectsPerViewport
  const metricOk = spec.primaryMetricCount <= PANACEA_VISUAL_FIRST_RULES.maxPrimaryMetricsPerViewport
  const textOk = spec.mainScrollingTextMaxLines <= PANACEA_VISUAL_FIRST_RULES.maxMainScrollingTextLines
  const gapOk = spec.sectionGapPx >= PANACEA_VISUAL_FIRST_RULES.minSectionGapPx
  const gradientOk = spec.arbitraryDecorativeGradientCount === 0
  const shadowOk = spec.alwaysFloatingShadowCount === 0
  const equalWeightOk = spec.equalWeightMetricTileGroups === 0
  const interpretationOk = spec.interpretationMode === 'on-demand'

  const hierarchy = (binary(focalOk) + binary(metricOk) + binary(textOk)) / 3
  const restraint = (binary(gradientOk) + binary(shadowOk) + binary(equalWeightOk)) / 3
  const disclosure = (binary(interpretationOk) + binary(spec.contextualControlsOnly) + binary(spec.progressiveDisclosure)) / 3
  const responsiveness = binary(spec.supportsFluidWidth)
  const overall = (hierarchy + restraint + disclosure + responsiveness) / 4

  const issues: string[] = []
  if (!focalOk) issues.push('more than one focal object competes in the viewport')
  if (!metricOk) issues.push('more than one primary metric competes for hierarchy')
  if (!textOk) issues.push('main scrolling text exceeds one line')
  if (!gapOk) issues.push('section spacing is below the 24px calm-density floor')
  if (!gradientOk) issues.push('arbitrary decorative gradient is present without semantic meaning')
  if (!shadowOk) issues.push('shadow/elevation is applied as a permanent decoration rather than a floating state')
  if (!equalWeightOk) issues.push('equal-weight metric tiles flatten the visual hierarchy')
  if (!interpretationOk) issues.push('interpretation is not hidden behind an on-demand action')
  if (!spec.contextualControlsOnly) issues.push('controls remain permanently visible outside relevant context')
  if (!spec.progressiveDisclosure) issues.push('progressive disclosure is disabled')
  if (!spec.supportsFluidWidth) issues.push('surface does not declare fluid-width responsiveness')

  return {
    pass: issues.length === 0,
    issues,
    scores: { hierarchy, restraint, disclosure, responsiveness, overall },
  }
}

export function panaceaVisualFirstBaseline(id: string): VisualFirstSurfaceSpec {
  return {
    id,
    focalObjectCount: 1,
    primaryMetricCount: 1,
    mainScrollingTextMaxLines: 1,
    interpretationMode: 'on-demand',
    sectionGapPx: 32,
    semanticAccents: ['neutral', 'information', 'interactive', 'selected'],
    arbitraryDecorativeGradientCount: 0,
    alwaysFloatingShadowCount: 0,
    equalWeightMetricTileGroups: 0,
    contextualControlsOnly: true,
    progressiveDisclosure: true,
    supportsFluidWidth: true,
  }
}
