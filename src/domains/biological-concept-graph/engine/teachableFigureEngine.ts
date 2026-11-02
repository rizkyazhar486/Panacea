// Teachable Causal Figures Engine.
// Interactive causal network simulator, explainer, and learner inquiry evaluator.
// Pure & deterministic: enables mechanistic "what-if" explorations across multiscale biological systems
// without fabricating patient data.
export const TEACHABLE_FIGURE_SCHEMA_VERSION = '1.0.0' as const
export const TEACHABLE_FIGURE_DISCLAIMER =
  'Teachable figures are mechanistic physiological learning models for educational inquiry and exploration. They do not represent real-time patient monitors and must not be used for clinical dosing or acute diagnostic decisions.' as const

export interface CausalVariable {
  id: string
  label: string
  baseline: number
  min: number
  max: number
  unit: string
  conceptId?: string
  scale: 'organ_system' | 'organ' | 'tissue' | 'cell' | 'molecular'
  description: string
}

export interface CausalLink {
  from: string
  to: string
  polarity: 'positive' | 'negative'
  weight: number
  mechanism: string
  formula?: string
}

export interface CausalNetwork {
  id: string
  name: string
  description: string
  variables: readonly CausalVariable[]
  links: readonly CausalLink[]
  references: readonly string[]
}

export interface Perturbation {
  variableId: string
  type: 'absolute_set' | 'relative_delta' | 'clamped'
  value: number
}

export interface SimulationStepState {
  values: Readonly<Record<string, number>>
  deltaFromBaseline: Readonly<Record<string, number>>
}

export interface SimulationResult {
  networkId: string
  initialState: SimulationStepState
  finalState: SimulationStepState
  trajectory: readonly SimulationStepState[]
  iterations: number
  converged: boolean
  explanations: readonly string[]
}

export interface TeachableInquiry {
  id: string
  networkId: string
  prompt: string
  perturbedVariableId: string
  perturbationDescription: string
  targetVariableId: string
  options: readonly {
    id: string
    prediction: 'increase' | 'decrease' | 'no_change'
    explanation: string
    isCorrect: boolean
  }[]
  scientificExplanation: string
}

export function clampValue(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min
  return Math.min(Math.max(v, min), max)
}

/**
 * Propagate perturbations through a causal physiological network with damped relaxation.
 */
export function simulateCausalNetwork(
  network: CausalNetwork,
  perturbations: readonly Perturbation[],
  options: { maxIterations?: number; dampingFactor?: number; tolerance?: number } = {}
): SimulationResult {
  const maxIterations = Math.max(1, Math.min(options.maxIterations ?? 35, 100))
  const damping = Math.max(0.1, Math.min(options.dampingFactor ?? 0.5, 0.9))
  const tol = Math.max(1e-5, options.tolerance ?? 1e-3)

  const varMap = new Map<string, CausalVariable>(network.variables.map((v) => [v.id, v]))
  const outgoing = new Map<string, CausalLink[]>()
  for (const l of network.links) {
    const list = outgoing.get(l.from) ?? []
    list.push(l)
    outgoing.set(l.from, list)
  }

  // Initial values at baseline
  const currentValues: Record<string, number> = {}
  for (const v of network.variables) {
    currentValues[v.id] = v.baseline
  }

  // Apply perturbations to initial state
  const clampedVars = new Set<string>()
  for (const p of perturbations) {
    const v = varMap.get(p.variableId)
    if (!v) continue
    if (p.type === 'absolute_set' || p.type === 'clamped') {
      currentValues[p.variableId] = clampValue(p.value, v.min, v.max)
      clampedVars.add(p.variableId)
    } else if (p.type === 'relative_delta') {
      currentValues[p.variableId] = clampValue(v.baseline * (1 + p.value), v.min, v.max)
      clampedVars.add(p.variableId)
    }
  }

  const makeState = (vals: Record<string, number>): SimulationStepState => {
    const delta: Record<string, number> = {}
    for (const [k, val] of Object.entries(vals)) {
      const base = varMap.get(k)?.baseline ?? 1
      delta[k] = base !== 0 ? ((val - base) / Math.abs(base)) * 100 : 0
    }
    return { values: Object.freeze({ ...vals }), deltaFromBaseline: Object.freeze(delta) }
  }

  const trajectory: SimulationStepState[] = [makeState(currentValues)]
  let converged = false
  let step = 0

  while (step < maxIterations && !converged) {
    step++
    const nextValues = { ...currentValues }
    let maxChange = 0

    for (const v of network.variables) {
      if (clampedVars.has(v.id)) continue

      // Sum influences from incoming links
      let netInfluence = 0
      for (const link of network.links) {
        if (link.to !== v.id) continue
        const sourceVar = varMap.get(link.from)
        if (!sourceVar) continue

        const sourceVal = currentValues[link.from] ?? sourceVar.baseline
        const sourceNormDelta = (sourceVal - sourceVar.baseline) / (sourceVar.baseline || 1)
        const sign = link.polarity === 'positive' ? 1 : -1
        netInfluence += sign * link.weight * sourceNormDelta
      }

      // Updated target value with damping
      const rawTarget = v.baseline * (1 + netInfluence)
      const targetClamped = clampValue(rawTarget, v.min, v.max)
      const updated = currentValues[v.id] * (1 - damping) + targetClamped * damping
      const delta = Math.abs(updated - currentValues[v.id])
      if (delta > maxChange) maxChange = delta
      nextValues[v.id] = updated
    }

    Object.assign(currentValues, nextValues)
    trajectory.push(makeState(currentValues))

    if (maxChange < tol) {
      converged = true
    }
  }

  // Generate mechanistic explanations for perturbed links
  const explanations: string[] = []
  for (const p of perturbations) {
    const v = varMap.get(p.variableId)
    if (!v) continue
    const links = outgoing.get(p.variableId) ?? []
    for (const l of links) {
      const target = varMap.get(l.to)
      if (!target) continue
      const targetDelta = trajectory[trajectory.length - 1].deltaFromBaseline[l.to]
      const dirText = targetDelta > 0 ? 'increased' : targetDelta < 0 ? 'decreased' : 'remained steady'
      explanations.push(
        `${v.label} perturbation propagated to ${target.label} (${dirText} by ${Math.abs(targetDelta).toFixed(1)}%): ${l.mechanism}`
      )
    }
  }

  return {
    networkId: network.id,
    initialState: trajectory[0],
    finalState: trajectory[trajectory.length - 1],
    trajectory: Object.freeze(trajectory),
    iterations: step,
    converged,
    explanations: Object.freeze(explanations),
  }
}

/**
 * Validates a learner's causal prediction against simulated ground truth.
 */
export function evaluateLearnerPrediction(
  inquiry: TeachableInquiry,
  selectedOptionId: string
): {
  isCorrect: boolean
  feedback: string
  scientificExplanation: string
} {
  const opt = inquiry.options.find((o) => o.id === selectedOptionId)
  if (!opt) {
    return {
      isCorrect: false,
      feedback: 'Invalid option selected. Please choose a valid answer option.',
      scientificExplanation: inquiry.scientificExplanation,
    }
  }

  return {
    isCorrect: opt.isCorrect,
    feedback: opt.isCorrect
      ? `Correct! ${opt.explanation}`
      : `Incorrect: ${opt.explanation}`,
    scientificExplanation: inquiry.scientificExplanation,
  }
}
