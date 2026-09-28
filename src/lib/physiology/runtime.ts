export type PhysiologicalOutputTruthClass = 'model-derived' | 'simulated'
export type BoundaryTruthClass = 'measured' | 'imported' | 'clinician-entered'
export type PhysiologicalValidationClass =
  | 'synthetic'
  | 'published-model-reproduction'
  | 'benchmark-validated'
  | 'expert-reviewed'
  | 'clinically-validated'
export type PhysiologicalFidelity =
  | 'infrastructure-fixture'
  | 'educational-reference'
  | 'mechanistic-research'
  | 'patient-informed-simulation'
  | 'clinical-validated'

export interface PhysiologicalFieldDeclaration {
  name: string
  unit: string
  truthClass: PhysiologicalOutputTruthClass
}

export interface BoundaryFieldDeclaration {
  name: string
  unit: string
}

export interface BoundaryCondition {
  name: string
  unit: string
  value: number
  sigma: number | null
  truthClass: BoundaryTruthClass
  source: {
    id: string
    /** Canonical subject identity when this boundary originates from longitudinal patient state. */
    subjectId?: string
    sourceId: string
    capturedAt: string
    semanticState: BoundaryTruthClass
  }
}

export interface PhysiologicalOutput {
  name: string
  unit: string
  value: number
  sigma: number | null
}

export interface PhysiologicalProvenance {
  id: string
  kind: 'boundary' | 'engine-output'
  engineId?: string
  modelId?: string
  modelVersion?: string
  parameterSetId?: string
  validationClass?: PhysiologicalValidationClass
  fidelity?: PhysiologicalFidelity
  step: number
  timeSeconds: number
  parents: readonly string[]
  /** Originating longitudinal event id for patient-derived boundary conditions. */
  sourceEventId?: string
  /** Canonical subject identity paired with sourceEventId; absent for subjectless reference/synthetic boundaries. */
  sourceSubjectId?: string
  sourceId?: string
  capturedAt?: string
}

export interface PhysiologicalValue {
  name: string
  unit: string
  value: number
  sigma: number | null
  truthClass: PhysiologicalOutputTruthClass | BoundaryTruthClass
  provenance: PhysiologicalProvenance
}

export interface DomainEngineStepContext<S> {
  state: S
  inputs: Readonly<Record<string, PhysiologicalValue>>
  dtSeconds: number
  timeSeconds: number
}

export interface DomainEngineContract<S> {
  id: string
  modelId: string
  modelVersion: string
  parameterSetId: string
  validationClass: PhysiologicalValidationClass
  fidelity: PhysiologicalFidelity
  dtSeconds: number
  consumes: readonly BoundaryFieldDeclaration[]
  produces: readonly PhysiologicalFieldDeclaration[]
  initialize: () => S
  step: (context: DomainEngineStepContext<S>) => { state: S; outputs: readonly PhysiologicalOutput[] }
}

export interface DomainEngineRegistry {
  engines: readonly DomainEngineContract<any>[]
  boundaryFields: readonly BoundaryFieldDeclaration[]
  producerByField: Readonly<Record<string, string>>
  declarationByField: Readonly<Record<string, PhysiologicalFieldDeclaration | BoundaryFieldDeclaration>>
}

const allowedOutputTruthClasses = new Set<PhysiologicalOutputTruthClass>(['model-derived', 'simulated'])
const allowedBoundaryTruthClasses = new Set<BoundaryTruthClass>(['measured', 'imported', 'clinician-entered'])

function fieldKey(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('field name must not be empty')
  return trimmed
}

function unitKey(unit: string): string {
  const trimmed = unit.trim()
  if (!trimmed) throw new Error('field unit must not be empty')
  return trimmed
}

function topologicalEngineOrder(engines: readonly DomainEngineContract<any>[]): {
  ordered: DomainEngineContract<any>[]
  cyclic: string[]
} {
  const byId = new Map(engines.map((engine) => [engine.id, engine]))
  const index = new Map(engines.map((engine, i) => [engine.id, i]))
  const producer = new Map<string, string>()
  for (const engine of engines) for (const output of engine.produces) producer.set(output.name, engine.id)

  const dependencies = new Map<string, Set<string>>(engines.map((engine) => [engine.id, new Set<string>()]))
  const dependents = new Map<string, Set<string>>(engines.map((engine) => [engine.id, new Set<string>()]))
  for (const engine of engines) {
    for (const input of engine.consumes) {
      const producerId = producer.get(input.name)
      if (!producerId || producerId === engine.id || !byId.has(producerId)) continue
      dependencies.get(engine.id)!.add(producerId)
      dependents.get(producerId)!.add(engine.id)
    }
  }

  const indegree = new Map([...dependencies].map(([id, deps]) => [id, deps.size]))
  const ready = engines.filter((engine) => indegree.get(engine.id) === 0).map((engine) => engine.id)
  const ordered: DomainEngineContract<any>[] = []
  const sortReady = () => ready.sort((a, b) => (index.get(a) ?? 0) - (index.get(b) ?? 0))
  sortReady()

  while (ready.length) {
    const id = ready.shift()!
    ordered.push(byId.get(id)!)
    for (const dependentId of dependents.get(id) ?? []) {
      const next = (indegree.get(dependentId) ?? 0) - 1
      indegree.set(dependentId, next)
      if (next === 0) { ready.push(dependentId); sortReady() }
    }
  }

  const cyclic = engines.filter((engine) => !ordered.some((candidate) => candidate.id === engine.id)).map((engine) => engine.id)
  return { ordered, cyclic }
}

export function validateDomainEngineComposition(
  engines: readonly DomainEngineContract<any>[],
  boundaryFields: readonly BoundaryFieldDeclaration[] = [],
): string[] {
  const errors: string[] = []
  const engineIds = new Set<string>()
  const producers = new Map<string, { engineId: string; unit: string }[]>()
  const boundaries = new Map<string, string>()

  for (const boundary of boundaryFields) {
    const name = boundary.name.trim()
    const unit = boundary.unit.trim()
    if (!name) { errors.push('boundary field name must not be empty'); continue }
    if (!unit) { errors.push(`boundary ${name}: unit must not be empty`); continue }
    if (boundaries.has(name)) errors.push(`duplicate boundary field ${name}`)
    else boundaries.set(name, unit)
  }

  for (const engine of engines) {
    if (!engine.id.trim()) errors.push('engine id must not be empty')
    if (engineIds.has(engine.id)) errors.push(`duplicate engine id ${engine.id}`)
    engineIds.add(engine.id)
    if (!engine.modelId.trim()) errors.push(`${engine.id}: modelId must not be empty`)
    if (!engine.modelVersion.trim()) errors.push(`${engine.id}: modelVersion must not be empty`)
    if (!engine.parameterSetId.trim()) errors.push(`${engine.id}: parameterSetId must not be empty`)
    if (!(engine.dtSeconds > 0) || !Number.isFinite(engine.dtSeconds)) errors.push(`${engine.id}: dtSeconds must be a positive finite number`)

    for (const output of engine.produces) {
      const name = output.name.trim()
      const unit = output.unit.trim()
      if (!name) { errors.push(`${engine.id}: produced field name must not be empty`); continue }
      if (!unit) { errors.push(`${engine.id}: ${name} unit must not be empty`); continue }
      if (!allowedOutputTruthClasses.has(output.truthClass)) errors.push(`${engine.id}: output ${name} has unsupported truth class ${String(output.truthClass)}`)
      if (boundaries.has(name)) errors.push(`${engine.id}: output ${name} conflicts with a boundary field`)
      producers.set(name, [...(producers.get(name) ?? []), { engineId: engine.id, unit }])
    }
  }

  for (const [name, list] of producers) {
    if (list.length > 1) errors.push(`field ${name} produced by more than one engine (${list.map((x) => x.engineId).join(', ')})`)
  }

  for (const engine of engines) {
    for (const input of engine.consumes) {
      const name = input.name.trim()
      const unit = input.unit.trim()
      if (!name) { errors.push(`${engine.id}: consumed field name must not be empty`); continue }
      if (!unit) { errors.push(`${engine.id}: ${name} consumed unit must not be empty`); continue }
      const producer = producers.get(name)?.[0]
      const boundaryUnit = boundaries.get(name)
      if (!producer && !boundaryUnit) {
        errors.push(`${engine.id}: consumes ${name} but no engine or boundary produces it`)
        continue
      }
      if (producer?.engineId === engine.id) errors.push(`${engine.id}: consumes its own field ${name}`)
      const sourceUnit = producer?.unit ?? boundaryUnit
      if (sourceUnit !== unit) errors.push(`${engine.id}: unit mismatch for ${name} (${unit} vs ${sourceUnit})`)
    }
  }

  const structurallyUnique = engineIds.size === engines.length && [...producers.values()].every((list) => list.length === 1)
  if (structurallyUnique) {
    const { cyclic } = topologicalEngineOrder(engines)
    if (cyclic.length) errors.push(`cyclic engine dependency requires explicit initial-state contract: ${cyclic.join(', ')}`)
  }

  return errors
}

export function createDomainEngineRegistry(
  engines: readonly DomainEngineContract<any>[],
  boundaryFields: readonly BoundaryFieldDeclaration[] = [],
): DomainEngineRegistry {
  const errors = validateDomainEngineComposition(engines, boundaryFields)
  if (errors.length) throw new Error(`invalid physiological engine composition: ${errors.join('; ')}`)

  const producerByField: Record<string, string> = {}
  const declarationByField: Record<string, PhysiologicalFieldDeclaration | BoundaryFieldDeclaration> = {}
  for (const boundary of boundaryFields) declarationByField[fieldKey(boundary.name)] = { name: fieldKey(boundary.name), unit: unitKey(boundary.unit) }
  for (const engine of engines) {
    for (const output of engine.produces) {
      const name = fieldKey(output.name)
      producerByField[name] = engine.id
      declarationByField[name] = { ...output, name, unit: unitKey(output.unit) }
    }
  }
  const { ordered } = topologicalEngineOrder(engines)
  return { engines: ordered, boundaryFields: [...boundaryFields], producerByField, declarationByField }
}

function fnv1a(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

function validateSigma(sigma: number | null, context: string): void {
  if (sigma === null) return
  if (!Number.isFinite(sigma) || sigma < 0) throw new Error(`${context}: sigma must be null or a non-negative finite number`)
}

function boundaryValue(boundary: BoundaryCondition): PhysiologicalValue {
  if (!allowedBoundaryTruthClasses.has(boundary.truthClass)) throw new Error(`boundary ${boundary.name}: unsupported boundary truth class ${String(boundary.truthClass)}`)
  if (boundary.source.semanticState !== boundary.truthClass) throw new Error(`boundary ${boundary.name}: truth class does not match source semantic state`)
  if (!Number.isFinite(boundary.value)) throw new Error(`boundary ${boundary.name}: value must be finite`)
  validateSigma(boundary.sigma, `boundary ${boundary.name}`)
  const sourceSubjectId = boundary.source.subjectId?.trim()
  if (boundary.source.subjectId !== undefined && !sourceSubjectId) {
    throw new Error(`boundary ${boundary.name}: source subjectId must not be blank when provided`)
  }
  const subjectIdentity = sourceSubjectId ? `:${sourceSubjectId}` : ''
  const id = fnv1a(`boundary:${boundary.name}:${boundary.unit}:${boundary.value}:${boundary.sigma ?? 'unknown'}:${boundary.truthClass}:${boundary.source.id}:${boundary.source.sourceId}:${boundary.source.capturedAt}${subjectIdentity}`)
  return {
    name: boundary.name,
    unit: boundary.unit,
    value: boundary.value,
    sigma: boundary.sigma,
    truthClass: boundary.truthClass,
    provenance: {
      id,
      kind: 'boundary',
      step: 0,
      timeSeconds: 0,
      parents: [],
      sourceEventId: boundary.source.id,
      sourceSubjectId,
      sourceId: boundary.source.sourceId,
      capturedAt: boundary.source.capturedAt,
    },
  }
}

export interface PhysiologicalSimulationResult {
  timeSeconds: number
  latest: Readonly<Record<string, PhysiologicalValue>>
  boundaries: Readonly<Record<string, PhysiologicalValue>>
  history: readonly { timeSeconds: number; engineId: string; field: string; value: number; sigma: number | null; provenanceId: string }[]
  provenance: readonly PhysiologicalProvenance[]
  stepCounts: Readonly<Record<string, number>>
}

export function runPhysiologicalSimulation(input: {
  registry: DomainEngineRegistry
  boundaryConditions?: readonly BoundaryCondition[]
  untilSeconds: number
}): PhysiologicalSimulationResult {
  if (!Number.isFinite(input.untilSeconds) || input.untilSeconds < 0) throw new Error('untilSeconds must be a non-negative finite number')
  const boundaryDeclarations = new Map(input.registry.boundaryFields.map((x) => [x.name, x.unit]))
  const boundaries: Record<string, PhysiologicalValue> = {}
  const latest: Record<string, PhysiologicalValue> = {}
  const provenance: PhysiologicalProvenance[] = []

  for (const boundary of input.boundaryConditions ?? []) {
    const declaredUnit = boundaryDeclarations.get(boundary.name)
    if (!declaredUnit) throw new Error(`undeclared boundary condition ${boundary.name}`)
    if (declaredUnit !== boundary.unit) throw new Error(`boundary ${boundary.name}: unit mismatch (${boundary.unit} vs ${declaredUnit})`)
    if (boundaries[boundary.name]) throw new Error(`duplicate boundary condition ${boundary.name}`)
    const value = boundaryValue(boundary)
    boundaries[boundary.name] = value
    latest[boundary.name] = value
    provenance.push(value.provenance)
  }

  for (const declaration of input.registry.boundaryFields) {
    if (!boundaries[declaration.name]) throw new Error(`missing boundary condition ${declaration.name}`)
  }

  const states = new Map<string, unknown>(input.registry.engines.map((engine) => [engine.id, engine.initialize()]))
  const nextAt = new Map<string, number>(input.registry.engines.map((engine) => [engine.id, 0]))
  const stepCounts: Record<string, number> = Object.fromEntries(input.registry.engines.map((engine) => [engine.id, 0]))
  const history: Array<{ timeSeconds: number; engineId: string; field: string; value: number; sigma: number | null; provenanceId: string }> = []
  const EPS = 1e-9
  let timeSeconds = 0

  for (let guard = 0; guard < 1_000_000; guard += 1) {
    let tMin = Infinity
    for (const engine of input.registry.engines) tMin = Math.min(tMin, nextAt.get(engine.id)!)
    if (tMin > input.untilSeconds + EPS) break
    timeSeconds = tMin

    for (const engine of input.registry.engines) {
      if (Math.abs(nextAt.get(engine.id)! - tMin) > EPS) continue
      const inputs: Record<string, PhysiologicalValue> = {}
      const parents: string[] = []
      for (const declaration of engine.consumes) {
        const value = latest[declaration.name]
        if (!value) throw new Error(`${engine.id}: no current value for consumed field ${declaration.name}`)
        if (value.unit !== declaration.unit) throw new Error(`${engine.id}: runtime unit mismatch for ${declaration.name}`)
        inputs[declaration.name] = value
        parents.push(value.provenance.id)
      }
      const step = stepCounts[engine.id] + 1
      const result = engine.step({ state: states.get(engine.id), inputs, dtSeconds: engine.dtSeconds, timeSeconds })
      states.set(engine.id, result.state)
      stepCounts[engine.id] = step

      const emitted = new Set<string>()
      for (const output of result.outputs) {
        if (emitted.has(output.name)) throw new Error(`${engine.id}: produced duplicate field ${output.name} in one step`)
        emitted.add(output.name)
        const declaration = engine.produces.find((candidate) => candidate.name === output.name)
        if (!declaration) throw new Error(`${engine.id}: produced undeclared field ${output.name}`)
        if (declaration.unit !== output.unit) throw new Error(`${engine.id}: field ${output.name} unit ${output.unit} differs from declared ${declaration.unit}`)
        if (!Number.isFinite(output.value)) throw new Error(`${engine.id}: non-finite value in ${output.name}`)
        validateSigma(output.sigma, `${engine.id}: ${output.name}`)
        const provenanceId = fnv1a(`${engine.id}:${engine.modelId}:${engine.modelVersion}:${engine.parameterSetId}:${engine.validationClass}:${engine.fidelity}:${step}:${timeSeconds}:${output.name}:${output.unit}:${output.value}:${output.sigma ?? 'unknown'}:${declaration.truthClass}:${parents.join(',')}`)
        const prov: PhysiologicalProvenance = {
          id: provenanceId,
          kind: 'engine-output',
          engineId: engine.id,
          modelId: engine.modelId,
          modelVersion: engine.modelVersion,
          parameterSetId: engine.parameterSetId,
          validationClass: engine.validationClass,
          fidelity: engine.fidelity,
          step,
          timeSeconds,
          parents: [...parents],
        }
        const value: PhysiologicalValue = {
          name: output.name,
          unit: output.unit,
          value: output.value,
          sigma: output.sigma,
          truthClass: declaration.truthClass,
          provenance: prov,
        }
        latest[output.name] = value
        provenance.push(prov)
        history.push({ timeSeconds, engineId: engine.id, field: output.name, value: output.value, sigma: output.sigma, provenanceId })
      }
      nextAt.set(engine.id, nextAt.get(engine.id)! + engine.dtSeconds)
    }
  }

  return { timeSeconds, latest, boundaries, history, provenance, stepCounts }
}
