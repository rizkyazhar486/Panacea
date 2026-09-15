import {
  bodyTrillionFeatureAt,
  type BodyTrillionFeature,
  type BodyTrillionSelection,
} from './bodyTrillionFeatureFactory'

export type ExperienceModule =
  | 'source-anatomy'
  | 'labels'
  | 'camera'
  | 'orbit-controls'
  | 'slice-controller'
  | 'flow-field'
  | 'particle-engine'
  | 'timeline'
  | 'quiz-engine'
  | 'simulation-engine'
  | 'imaging-engine'
  | 'surgery-sandbox'
  | 'micro-world'
  | 'clinical-overlay'
  | 'biomechanics-engine'
  | 'pharmacology-overlay'
  | 'histology-overlay'
  | 'rehab-overlay'

export type RuntimePriority = 'critical' | 'high' | 'normal' | 'deferred'

export interface CompiledModule {
  id: ExperienceModule
  priority: RuntimePriority
  reason: string
  lazy: boolean
}

export interface ExperiencePerformancePlan {
  targetFps: number
  maxDpr: number
  particleBudget: number
  maxActiveLabels: number
  modelLod: 'low' | 'medium' | 'high' | 'source-max'
  postFx: 'none' | 'light' | 'balanced' | 'cinematic'
  dynamicQuality: boolean
}

export interface ExperienceSafetyPlan {
  patientSpecific: false
  diagnosticAuthority: false
  treatmentAuthority: false
  autonomousSurgery: false
  requiresEducationalBadge: boolean
  requiresSourceBackedAnatomy: boolean
  schematicMicroAllowed: boolean
}

export interface CompiledBodyExperience {
  feature: BodyTrillionFeature
  routeKey: string
  title: string
  subtitle: string
  modules: readonly CompiledModule[]
  performance: ExperiencePerformancePlan
  safety: ExperienceSafetyPlan
  interactionStack: readonly string[]
  sceneLayers: readonly string[]
  contentQueries: readonly string[]
}

function module(id: ExperienceModule, priority: RuntimePriority, reason: string, lazy = true): CompiledModule {
  return { id, priority, reason, lazy }
}

function compileModules(selection: BodyTrillionSelection): CompiledModule[] {
  const modules = new Map<ExperienceModule, CompiledModule>()
  const add = (candidate: CompiledModule) => {
    const current = modules.get(candidate.id)
    if (!current) modules.set(candidate.id, candidate)
    else if (priorityScore(candidate.priority) > priorityScore(current.priority)) modules.set(candidate.id, candidate)
  }

  add(module('camera', 'critical', `Required by ${selection.camera} camera`, false))
  add(module('source-anatomy', 'critical', `Required for ${selection.system}/${selection.region} spatial context`, false))

  if (selection.interaction === 'orbit') add(module('orbit-controls', 'critical', 'Direct orbital manipulation', false))
  if (selection.interaction === 'slice' || selection.interaction === 'scrub') add(module('slice-controller', 'high', 'Slice/scrub interaction'))
  if (selection.interaction === 'quiz') add(module('quiz-engine', 'high', 'Challenge interaction'))
  if (selection.interaction === 'simulate') add(module('simulation-engine', 'high', 'Synthetic simulation interaction'))
  if (selection.interaction === 'trace') add(module('flow-field', 'normal', 'Path tracing and directional visualization'))

  if (selection.overlay === 'labels') add(module('labels', 'normal', 'Requested label overlay'))
  if (selection.overlay === 'flow-particles') {
    add(module('flow-field', 'high', 'Flow overlay'))
    add(module('particle-engine', 'normal', 'Flow particle rendering'))
  }
  if (selection.overlay === 'timeline') add(module('timeline', 'normal', 'Temporal overlay'))
  if (selection.overlay === 'clinical-markers') add(module('clinical-overlay', 'normal', 'Educational clinical marker overlay'))
  if (selection.overlay === 'force-vectors') add(module('biomechanics-engine', 'high', 'Mechanical vector overlay'))

  if (selection.modality === 'radiology' || selection.modality === 'ultrasound') add(module('imaging-engine', 'high', `${selection.modality} modality`))
  if (selection.modality === 'surgery') add(module('surgery-sandbox', 'high', 'Synthetic surgery modality'))
  if (selection.modality === 'biomechanics') add(module('biomechanics-engine', 'high', 'Biomechanics modality'))
  if (selection.modality === 'pharmacology') add(module('pharmacology-overlay', 'normal', 'Pharmacology teaching modality'))
  if (selection.modality === 'histology') add(module('histology-overlay', 'normal', 'Histology teaching modality'))
  if (selection.modality === 'rehabilitation') add(module('rehab-overlay', 'normal', 'Rehabilitation modality'))

  if (['tissue', 'cell', 'organelle', 'molecular', 'gene'].includes(selection.scale)) add(module('micro-world', 'high', `${selection.scale} scale`))
  if (selection.temporalState !== 'static') add(module('timeline', 'normal', `${selection.temporalState} temporal state`))

  return [...modules.values()].sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority))
}

function priorityScore(priority: RuntimePriority) {
  return priority === 'critical' ? 4 : priority === 'high' ? 3 : priority === 'normal' ? 2 : 1
}

function performanceFor(selection: BodyTrillionSelection): ExperiencePerformancePlan {
  const fidelity = selection.fidelity
  if (fidelity === 'mobile-optimized') return { targetFps: 50, maxDpr: 1.35, particleBudget: 450, maxActiveLabels: 14, modelLod: 'medium', postFx: 'light', dynamicQuality: true }
  if (fidelity === 'desktop-max') return { targetFps: 60, maxDpr: 2.25, particleBudget: 6000, maxActiveLabels: 48, modelLod: 'source-max', postFx: 'cinematic', dynamicQuality: true }
  if (fidelity === 'ultra' || fidelity === 'cinematic') return { targetFps: 60, maxDpr: 2, particleBudget: 4200, maxActiveLabels: 40, modelLod: 'high', postFx: 'cinematic', dynamicQuality: true }
  if (fidelity === 'high' || fidelity === 'research') return { targetFps: 60, maxDpr: 1.75, particleBudget: 2600, maxActiveLabels: 32, modelLod: 'high', postFx: 'balanced', dynamicQuality: true }
  if (fidelity === 'fast' || fidelity === 'draft') return { targetFps: 45, maxDpr: 1.25, particleBudget: 240, maxActiveLabels: 10, modelLod: 'low', postFx: 'none', dynamicQuality: true }
  return { targetFps: 60, maxDpr: 1.5, particleBudget: 1200, maxActiveLabels: 24, modelLod: 'medium', postFx: 'light', dynamicQuality: true }
}

function interactionStack(selection: BodyTrillionSelection) {
  const stack = ['pointer-focus', 'keyboard-focus', 'touch-safe-targets']
  stack.push(selection.interaction)
  if (selection.camera === 'orbiting') stack.push('orbit-camera')
  if (selection.camera === 'fly-through' || selection.camera === 'endoscopic') stack.push('camera-flight')
  if (selection.learningMode === 'challenge' || selection.learningMode === 'case-mode') stack.push('progress-state')
  if (selection.learningMode === 'guided-tour' || selection.learningMode === 'story-mode') stack.push('guided-sequence')
  return [...new Set(stack)]
}

function sceneLayers(selection: BodyTrillionSelection) {
  const layers = ['background-environment', 'source-anatomy', 'focus-highlight', 'interaction-hit-zones', 'hud']
  if (selection.overlay !== 'none') layers.splice(3, 0, `overlay:${selection.overlay}`)
  if (selection.visualStyle !== 'source-realistic') layers.splice(1, 0, `visual-style:${selection.visualStyle}`)
  if (selection.temporalState !== 'static') layers.splice(3, 0, `temporal:${selection.temporalState}`)
  return layers
}

function contentQueries(selection: BodyTrillionSelection) {
  return [
    `${selection.system} ${selection.region} anatomy`,
    `${selection.system} ${selection.scale} ${selection.modality}`,
    `${selection.region} ${selection.overlay} ${selection.temporalState}`,
    `${selection.system} ${selection.context} education`,
  ]
}

export function compileBodyExperience(featureOrIndex: BodyTrillionFeature | bigint): CompiledBodyExperience {
  const feature = typeof featureOrIndex === 'bigint' ? bodyTrillionFeatureAt(featureOrIndex) : featureOrIndex
  const selection = feature.selection
  return {
    feature,
    routeKey: `/body-exposure/x/${feature.id.toLowerCase()}`,
    title: feature.title,
    subtitle: feature.summary,
    modules: compileModules(selection),
    performance: performanceFor(selection),
    safety: {
      patientSpecific: false,
      diagnosticAuthority: false,
      treatmentAuthority: false,
      autonomousSurgery: false,
      requiresEducationalBadge: selection.context !== 'research',
      requiresSourceBackedAnatomy: ['body', 'system', 'organ', 'tissue'].includes(selection.scale),
      schematicMicroAllowed: ['cell', 'organelle', 'molecular', 'gene'].includes(selection.scale),
    },
    interactionStack: interactionStack(selection),
    sceneLayers: sceneLayers(selection),
    contentQueries: contentQueries(selection),
  }
}

export function compileBodyExperienceBatch(indices: readonly bigint[]) {
  return indices.map(compileBodyExperience)
}

export function experienceCompilerSummary(experience: CompiledBodyExperience) {
  return {
    id: experience.feature.id,
    modules: experience.modules.length,
    criticalModules: experience.modules.filter((item) => item.priority === 'critical').length,
    sceneLayers: experience.sceneLayers.length,
    interactions: experience.interactionStack.length,
    targetFps: experience.performance.targetFps,
    sourceBackedRequired: experience.safety.requiresSourceBackedAnatomy,
  }
}
