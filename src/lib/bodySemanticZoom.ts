export type BodySemanticScale =
  | 'whole-body'
  | 'system'
  | 'organ'
  | 'tissue'
  | 'cell'
  | 'organelle'
  | 'molecule'
  | 'genome'

export interface BodySemanticZoomStop {
  id: BodySemanticScale
  label: string
  minRelativeZoom: number
  representation: 'gross-3d' | 'microanatomy' | 'cellular-3d' | 'subcellular-3d' | 'molecular-reference' | 'genomic-reference'
  literalGrossSpatialContinuity: boolean
  note: string
}

/**
 * Relative zoom is camera-fit distance divided by current camera distance.
 * It is an interaction/LOD signal only, never optical magnification or a
 * biological measurement.
 */
export const BODY_SEMANTIC_ZOOM_STOPS: readonly BodySemanticZoomStop[] = [
  { id: 'whole-body', label: 'Whole body', minRelativeZoom: 0, representation: 'gross-3d', literalGrossSpatialContinuity: true, note: 'Source-backed whole-body geometry.' },
  { id: 'system', label: 'System', minRelativeZoom: 1.45, representation: 'gross-3d', literalGrossSpatialContinuity: true, note: 'Source-backed system geometry and named structures.' },
  { id: 'organ', label: 'Organ', minRelativeZoom: 3, representation: 'gross-3d', literalGrossSpatialContinuity: true, note: 'Gross organ/detail geometry only while the source mesh supports it.' },
  { id: 'tissue', label: 'Tissue', minRelativeZoom: 8, representation: 'microanatomy', literalGrossSpatialContinuity: false, note: 'Switch representation instead of enlarging a gross mesh beyond its source resolution.' },
  { id: 'cell', label: 'Cell', minRelativeZoom: 20, representation: 'cellular-3d', literalGrossSpatialContinuity: false, note: 'Reference cellular model with explicit cell-type provenance.' },
  { id: 'organelle', label: 'Organelle', minRelativeZoom: 45, representation: 'subcellular-3d', literalGrossSpatialContinuity: false, note: 'Reference subcellular model; organelles are not positioned by gross-body coordinates.' },
  { id: 'molecule', label: 'Molecule', minRelativeZoom: 90, representation: 'molecular-reference', literalGrossSpatialContinuity: false, note: 'Verified molecular/protein/pathway representation only.' },
  { id: 'genome', label: 'Genome / DNA', minRelativeZoom: 140, representation: 'genomic-reference', literalGrossSpatialContinuity: false, note: 'Sequence/chromatin/genomic reference, never inferred from atlas position.' },
] as const

export function bodySemanticScaleFromRelativeZoom(relativeZoom: number): BodySemanticScale {
  const safe = Number.isFinite(relativeZoom) ? Math.max(0, relativeZoom) : 1
  let selected: BodySemanticZoomStop = BODY_SEMANTIC_ZOOM_STOPS[0]
  for (const stop of BODY_SEMANTIC_ZOOM_STOPS) {
    if (safe >= stop.minRelativeZoom) selected = stop
    else break
  }
  return selected.id
}

export function getBodySemanticZoomStop(scale: BodySemanticScale): BodySemanticZoomStop {
  return BODY_SEMANTIC_ZOOM_STOPS.find((stop) => stop.id === scale) ?? BODY_SEMANTIC_ZOOM_STOPS[0]
}

export function isMicroscopicBodyScale(scale: BodySemanticScale) {
  return ['tissue', 'cell', 'organelle', 'molecule', 'genome'].includes(scale)
}


export type BodySemanticAssetState = 'available' | 'missing' | 'failed'

export interface BodySemanticRepresentationCapability {
  state: BodySemanticAssetState
  sourceId?: string
  version?: string
}

export type BodySemanticRepresentationRegistry = Partial<
  Record<BodySemanticScale, BodySemanticRepresentationCapability>
>

export type BodySemanticBlockReason =
  | 'missing-source-asset'
  | 'missing-provenance'
  | 'source-load-failed'

export interface BodySemanticRepresentationResolution {
  requestedScale: BodySemanticScale
  resolvedScale: BodySemanticScale | null
  blocked: boolean
  reason?: BodySemanticBlockReason
}

function hasVerifiedRepresentation(capability: BodySemanticRepresentationCapability | undefined) {
  return capability?.state === 'available'
    && Boolean(capability.sourceId?.trim())
    && Boolean(capability.version?.trim())
}

function blockedReason(capability: BodySemanticRepresentationCapability | undefined): BodySemanticBlockReason {
  if (capability?.state === 'failed') return 'source-load-failed'
  if (capability?.state === 'available') return 'missing-provenance'
  return 'missing-source-asset'
}

/**
 * Resolves a requested biological scale without manufacturing detail.
 *
 * A representation is eligible only when an available asset declares both its
 * source identifier and source version. If the requested representation is not
 * eligible, the renderer stays on the nearest coarser verified representation.
 * Returning null means no source-backed representation is safe to display.
 */
export function resolveBodySemanticRepresentation(
  requestedScale: BodySemanticScale,
  registry: BodySemanticRepresentationRegistry,
): BodySemanticRepresentationResolution {
  const requestedIndex = BODY_SEMANTIC_ZOOM_STOPS.findIndex((stop) => stop.id === requestedScale)
  const requested = registry[requestedScale]
  if (hasVerifiedRepresentation(requested)) {
    return { requestedScale, resolvedScale: requestedScale, blocked: false }
  }

  for (let index = requestedIndex - 1; index >= 0; index -= 1) {
    const candidate = BODY_SEMANTIC_ZOOM_STOPS[index].id
    if (hasVerifiedRepresentation(registry[candidate])) {
      return {
        requestedScale,
        resolvedScale: candidate,
        blocked: true,
        reason: blockedReason(requested),
      }
    }
  }

  return {
    requestedScale,
    resolvedScale: null,
    blocked: true,
    reason: blockedReason(requested),
  }
}
