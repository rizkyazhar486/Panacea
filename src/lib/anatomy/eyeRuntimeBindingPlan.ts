import type {
  AtlasMeshBindingCandidate,
  AtlasMeshBindingResult,
} from './atlasMeshBindingCompiler'

export interface EyeRuntimeLoadedSource {
  readonly file: string
}

export interface EyeRuntimeBindingTarget {
  readonly canonicalNodeId: string
  readonly meshNodeId: string
  readonly sourceName: string
  readonly sourceFile: string
  readonly exactIdentityKind: 'exact-source-name' | 'exact-base-name'
}

export interface EyeRuntimeBindingPlan {
  readonly status: 'eligible' | 'blocked'
  readonly blockers: readonly string[]
  readonly canonicalNodeId: string
  readonly targets: readonly EyeRuntimeBindingTarget[]
  readonly mayTraverseObject3D: false
  readonly mayLoadAsset: false
  readonly mayMutateGeometry: false
  readonly mayInferAnatomy: false
  readonly mayPromoteAcademicReview: false
  readonly patientSpecific: false
}

function selectedCandidate(
  result: AtlasMeshBindingResult,
  meshNodeId: string,
): AtlasMeshBindingCandidate | null {
  const matches = result.candidates.filter((candidate) => candidate.meshNodeId === meshNodeId)
  if (matches.length !== 1) return null
  return matches[0] ?? null
}

function exactIdentityKind(candidate: AtlasMeshBindingCandidate) {
  if (candidate.reasons.includes('exact-source-name')) return 'exact-source-name' as const
  if (candidate.reasons.includes('exact-base-name')) return 'exact-base-name' as const
  return null
}

/**
 * Convert a compiler result into a conservative runtime target plan.
 *
 * This intentionally rejects compiler bindings that rely only on contiguous
 * hints. Eye Gold Standard runtime targeting requires exact source/base-name
 * evidence for every selected mesh and a currently loaded source file.
 *
 * The plan contains identifiers only. It never traverses Object3D roots,
 * loads assets, mutates renderer state, or upgrades provenance/review status.
 */
export function buildEyeRuntimeBindingPlan(
  canonicalNodeId: string,
  binding: AtlasMeshBindingResult,
  loadedSources: readonly EyeRuntimeLoadedSource[],
): EyeRuntimeBindingPlan {
  const blockers: string[] = []
  const key = canonicalNodeId.trim()

  if (!key) blockers.push('missing-canonical-node-id')
  if (binding.atlasNodeId !== key) blockers.push('binding-canonical-id-mismatch')
  if (binding.status !== 'bound') blockers.push(`binding-not-exactly-bound:${binding.status}`)
  if (binding.selectedMeshNodeIds.length === 0) blockers.push('missing-selected-mesh')

  const loadedFiles = new Set(loadedSources.map((source) => source.file.trim()).filter(Boolean))
  const targets: EyeRuntimeBindingTarget[] = []
  const seenMeshIds = new Set<string>()

  for (const meshNodeId of binding.selectedMeshNodeIds) {
    if (!meshNodeId.trim() || seenMeshIds.has(meshNodeId)) {
      blockers.push(`invalid-selected-mesh:${meshNodeId}`)
      continue
    }
    seenMeshIds.add(meshNodeId)

    const candidate = selectedCandidate(binding, meshNodeId)
    if (!candidate) {
      blockers.push(`selected-mesh-candidate-not-unique:${meshNodeId}`)
      continue
    }

    const identityKind = exactIdentityKind(candidate)
    if (!identityKind) {
      blockers.push(`selected-mesh-not-exact-identity:${meshNodeId}`)
      continue
    }

    if (!candidate.sourceFile.trim() || !loadedFiles.has(candidate.sourceFile)) {
      blockers.push(`source-file-not-runtime-loaded:${candidate.sourceFile || meshNodeId}`)
      continue
    }

    if (!candidate.sourceName.trim()) {
      blockers.push(`missing-source-name:${meshNodeId}`)
      continue
    }

    targets.push({
      canonicalNodeId: key,
      meshNodeId,
      sourceName: candidate.sourceName,
      sourceFile: candidate.sourceFile,
      exactIdentityKind: identityKind,
    })
  }

  if (targets.length !== binding.selectedMeshNodeIds.length) blockers.push('incomplete-exact-runtime-target-set')

  const status = blockers.length === 0 ? 'eligible' : 'blocked'
  return {
    status,
    blockers,
    canonicalNodeId: key,
    targets: status === 'eligible' ? targets : [],
    mayTraverseObject3D: false,
    mayLoadAsset: false,
    mayMutateGeometry: false,
    mayInferAnatomy: false,
    mayPromoteAcademicReview: false,
    patientSpecific: false,
  }
}

export const EYE_RUNTIME_BINDING_PLAN_BOUNDARY =
  'Runtime binding plans are identifier-only and require exact selected-mesh identity plus an already-loaded source file. Reviewed contiguous hint matches alone are insufficient. The plan does not traverse Object3D, load assets, mutate geometry, infer anatomy, establish patient state, or promote academic review.'
