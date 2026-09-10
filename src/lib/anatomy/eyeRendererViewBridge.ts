import type { EyeLearningViewState } from './eyeLearningViewContract'
import type { EyeMultiscaleTransitionDecision } from './eyeMultiscaleViewController'

export interface EyeRendererCanonicalTarget {
  readonly canonicalNodeId: string
  readonly rendererTargetId: string
  readonly exactSourceIdentity?: string
}

export type EyeRendererCanonicalResolver = (
  canonicalNodeId: string,
) => EyeRendererCanonicalTarget | null

export interface EyeRendererViewInstruction {
  readonly status: 'eligible' | 'blocked'
  readonly blockers: readonly string[]
  readonly viewId: string
  readonly scale: EyeLearningViewState['scale']
  readonly targets: readonly EyeRendererCanonicalTarget[]
  readonly cameraIntent: 'fit-resolved-targets'
  readonly motion: 'none' | 'representational'
  readonly mayCreateRenderer: false
  readonly mayLoadAsset: false
  readonly mayMutateGeometry: false
  readonly mayInferFunction: false
  readonly mayLocalizeLesion: false
  readonly patientSpecific: false
  readonly publicationReady: false
}

export function buildEyeRendererViewInstruction(
  transition: EyeMultiscaleTransitionDecision,
  view: EyeLearningViewState,
  resolveCanonicalTarget: EyeRendererCanonicalResolver,
): EyeRendererViewInstruction {
  const blockers: string[] = []

  if (transition.status !== 'eligible' || !transition.mayRender) blockers.push('transition-not-renderable')
  if (transition.toViewId !== view.id) blockers.push('transition-view-mismatch')
  if (view.patientSpecific !== false) blockers.push('patient-specific')
  if (view.functionalInferenceAllowed !== false) blockers.push('functional-inference-enabled')
  if (view.lesionLocalizationAllowed !== false) blockers.push('lesion-localization-enabled')
  if (view.publicationReady !== false) blockers.push('publication-promotion')

  const targets: EyeRendererCanonicalTarget[] = []
  const seen = new Set<string>()
  for (const canonicalNodeId of view.canonicalNodeIds) {
    if (!canonicalNodeId.trim() || seen.has(canonicalNodeId)) {
      blockers.push(`invalid-canonical-target:${canonicalNodeId}`)
      continue
    }
    seen.add(canonicalNodeId)

    const resolved = resolveCanonicalTarget(canonicalNodeId)
    if (!resolved) {
      blockers.push(`unresolved-canonical-target:${canonicalNodeId}`)
      continue
    }
    if (resolved.canonicalNodeId !== canonicalNodeId) {
      blockers.push(`resolver-identity-mismatch:${canonicalNodeId}`)
      continue
    }
    if (!resolved.rendererTargetId.trim()) {
      blockers.push(`missing-renderer-target:${canonicalNodeId}`)
      continue
    }
    targets.push(resolved)
  }

  if (targets.length !== view.canonicalNodeIds.length) blockers.push('incomplete-render-target-set')

  const motion = view.motion === 'representational' && transition.mayAnimate ? 'representational' : 'none'
  if (view.motion === 'representational' && motion !== 'representational') blockers.push('representational-motion-not-authorized')

  const status = blockers.length === 0 ? 'eligible' : 'blocked'
  return {
    status,
    blockers,
    viewId: view.id,
    scale: view.scale,
    targets: status === 'eligible' ? targets : [],
    cameraIntent: 'fit-resolved-targets',
    motion: status === 'eligible' ? motion : 'none',
    mayCreateRenderer: false,
    mayLoadAsset: false,
    mayMutateGeometry: false,
    mayInferFunction: false,
    mayLocalizeLesion: false,
    patientSpecific: false,
    publicationReady: false,
  }
}

export const EYE_RENDERER_VIEW_BRIDGE_BOUNDARY =
  'Renderer instructions may target only exact Panacea-resolved canonical identities. They do not create renderers, load assets, mutate geometry, infer anatomy or physiology, localize lesions, establish patient state, or promote academic/publication readiness. Camera framing is presentation only, never evidence.'
