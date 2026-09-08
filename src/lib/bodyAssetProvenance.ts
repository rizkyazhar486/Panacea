import type { BodyProjectionTarget } from './bodyProjectionContract'
import { evaluateProjectionReadiness, type ProjectionAssetProvenance } from './bodyProjectionReadiness'

export type SourceRevisionKind = 'git-commit' | 'accession-version'

export interface BodyAssetTransformationStep {
  operation: string
  tool: string
  toolVersion?: string
  inputSha256: string
  outputSha256: string
  parameters?: string
}

export interface BodyAssetProvenanceRecord extends ProjectionAssetProvenance {
  sourceRevisionKind: SourceRevisionKind
  sourceAssetSha256: string
  derivedAssetSha256: string
  runtimeAssetPath: string
  licenseScope: 'asset'
  licenseEvidence: string
  transformations: BodyAssetTransformationStep[]
}

export interface BodyAssetProvenanceValidation {
  validForVerifiedRender: boolean
  reasons: string[]
}

const SHA256_RE = /^[a-f0-9]{64}$/i
const GIT_COMMIT_RE = /^[a-f0-9]{40}$/i
const FLOATING_REVISIONS = new Set(['main', 'master', 'head', 'latest', 'trunk', 'dev', 'development'])
const REMOTE_RUNTIME_RE = /^(?:https?:)?\/\//i

const nonBlank = (value: string | undefined) => Boolean(value?.trim())

/**
 * Strict asset-level provenance gate for Body3D-derived reference geometry.
 *
 * This deliberately sits above the general projection readiness contract:
 * verified rendering requires an immutable source revision, source + derived
 * checksums, asset-scoped licensing evidence, a repository-local runtime asset,
 * and deterministic transformation lineage with an explicitly versioned tool
 * for every transformation step. No biomedical geometry is created or inferred
 * here.
 */
export function validateBodyAssetProvenance(
  target: BodyProjectionTarget,
  record: BodyAssetProvenanceRecord,
): BodyAssetProvenanceValidation {
  const reasons = [...evaluateProjectionReadiness(target, record).reasons]
  const revision = record.sourceRevision.trim()

  if (FLOATING_REVISIONS.has(revision.toLowerCase())) {
    reasons.push('Source revision is floating and is not an immutable asset revision.')
  }

  if (record.sourceRevisionKind === 'git-commit' && !GIT_COMMIT_RE.test(revision)) {
    reasons.push('Git-backed source revision must be an exact 40-character commit SHA.')
  }

  if (record.sourceRevisionKind === 'accession-version' && !nonBlank(revision)) {
    reasons.push('Accession/version source revision is missing.')
  }

  if (!SHA256_RE.test(record.sourceAssetSha256)) {
    reasons.push('Source asset SHA-256 is missing or invalid.')
  }

  if (!SHA256_RE.test(record.derivedAssetSha256)) {
    reasons.push('Derived runtime asset SHA-256 is missing or invalid.')
  }

  if (!nonBlank(record.runtimeAssetPath)) {
    reasons.push('Runtime asset path is missing.')
  } else {
    if (REMOTE_RUNTIME_RE.test(record.runtimeAssetPath.trim())) {
      reasons.push('Runtime Body3D assets must be repository-local; remote runtime embeds are forbidden.')
    }
    if (record.runtimeAssetPath.includes('..')) {
      reasons.push('Runtime asset path must not traverse outside the local asset root.')
    }
  }

  if (record.licenseScope !== 'asset') {
    reasons.push('License scope must be asset-level; repository-level licensing is insufficient.')
  }

  if (!nonBlank(record.licenseEvidence)) {
    reasons.push('Asset-specific license evidence is missing.')
  }

  if (!record.transformations.length) {
    reasons.push('Structured transformation lineage is missing.')
  } else {
    for (const [index, step] of record.transformations.entries()) {
      if (!nonBlank(step.operation) || !nonBlank(step.tool) || !nonBlank(step.toolVersion)) {
        reasons.push(`Transformation step ${index + 1} is missing operation, tool identity, or tool version.`)
      }
      if (!SHA256_RE.test(step.inputSha256) || !SHA256_RE.test(step.outputSha256)) {
        reasons.push(`Transformation step ${index + 1} must pin input and output SHA-256 checksums.`)
      }
      if (index > 0) {
        const previous = record.transformations[index - 1]
        if (previous.outputSha256.toLowerCase() !== step.inputSha256.toLowerCase()) {
          reasons.push(`Transformation lineage is discontinuous between steps ${index} and ${index + 1}.`)
        }
      }
    }

    const first = record.transformations[0]
    const last = record.transformations[record.transformations.length - 1]
    if (first && first.inputSha256.toLowerCase() !== record.sourceAssetSha256.toLowerCase()) {
      reasons.push('Transformation lineage does not start from the declared source asset checksum.')
    }
    if (last && last.outputSha256.toLowerCase() !== record.derivedAssetSha256.toLowerCase()) {
      reasons.push('Transformation lineage does not end at the declared derived runtime asset checksum.')
    }
  }

  if (record.transformationHistory.length !== record.transformations.length) {
    reasons.push('Legacy transformation history and structured lineage must describe the same number of steps.')
  }

  if (target.geometryStatus === 'reference-only') {
    reasons.push('Reference-only concepts cannot be promoted to verified gross-anatomy geometry.')
  }

  return { validForVerifiedRender: reasons.length === 0, reasons: [...new Set(reasons)] }
}
