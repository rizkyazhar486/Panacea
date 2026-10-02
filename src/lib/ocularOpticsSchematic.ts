/** Educational SVG coordinates, not biometry or a ray-tracing model.
 * Near accommodation increases lens thickness: Knaus et al., PMID 33491156.
 * https://pubmed.ncbi.nlm.nih.gov/33491156/
 * AI-assisted, source-checked; qualified human review pending.
 */
export function ocularOpticsSchematic(pupilMm: number, distanceM: number) {
  const pupil = Number.isFinite(pupilMm) ? Math.min(8, Math.max(2, pupilMm)) : 4
  const distance = Number.isFinite(distanceM) ? Math.min(6, Math.max(0.25, distanceM)) : 6
  const accommodationD = 1 / distance
  return {
    accommodationD,
    pupilHalf: 8 + ((pupil - 2) / 6) * 18,
    lensRx: 17 + (accommodationD / 4) * 5,
  }
}
