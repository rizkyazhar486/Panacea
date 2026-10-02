import { INDEKS_TUBUH } from './bodyIndex.gen'
import {
  normalizeAnatomySourceName,
  type AnatomySourceNodeBundle,
} from './anatomySourceNodeRegistry'

export interface SurgicalLayerRiskCoverage {
  label: string
  canonical: string
  names: string[]
}

/**
 * Risk labels in dissection.ts occasionally carry a prose annotation after an
 * em/en dash or a trailing parenthetical. Strip presentation-only annotation,
 * then require an exact normalized base-name match. We deliberately do not use
 * stems, substring matching, plural repair, or a "closest" anatomy fallback.
 */
export function canonicalSurgicalRiskLabel(label: string): string {
  return normalizeAnatomySourceName(
    label
      .split(/\s+[—–]\s+/)[0]
      .replace(/\s*\([^)]*\)\s*$/, '')
      .trim(),
  )
}

/**
 * Resolve layer-sequence risk prose to shipped whole-body source nodes.
 *
 * A match must satisfy all three independent constraints:
 *  1) exact normalized anatomical base name,
 *  2) exact dissection/body-index region,
 *  3) membership in the effective source-node snapshot.
 *
 * If any constraint fails the label remains reference-only. This is stricter
 * than the reviewed-hint resolver used by curated spatial checkpoints because
 * free-form surgical-risk prose must never select a merely similar structure.
 */
export function resolveSurgicalLayerRiskCoverage(
  labels: readonly string[],
  wilayah: string | null | undefined,
  sourceBundles: readonly AnatomySourceNodeBundle[],
): SurgicalLayerRiskCoverage[] {
  const availableNames = new Set(sourceBundles.flatMap((bundle) => bundle.names))
  const region = wilayah?.trim() ?? ''

  return labels.map((label) => {
    const canonical = canonicalSurgicalRiskLabel(label)
    const names = canonical && region
      ? [...new Set(
          INDEKS_TUBUH
            .filter((row) => (
              row.w === region &&
              availableNames.has(row.n) &&
              normalizeAnatomySourceName(row.b) === canonical
            ))
            .map((row) => row.n),
        )]
      : []

    return { label, canonical, names }
  })
}

export function exactSurgicalLayerRiskNodes(
  labels: readonly string[],
  wilayah: string | null | undefined,
  sourceBundles: readonly AnatomySourceNodeBundle[],
): string[] {
  return [...new Set(
    resolveSurgicalLayerRiskCoverage(labels, wilayah, sourceBundles)
      .flatMap((item) => item.names),
  )]
}
