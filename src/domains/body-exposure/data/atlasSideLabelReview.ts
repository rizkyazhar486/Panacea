// Structures in public/anatomy/*.glb whose ".l"/".r" name suffix does not agree with where the mesh lies.
//
// Convention in the files: +X is the subject's left. Measured over every lateral node (1,811 agree):
//   - 'swapped'      : an exactly mirrored pair whose names sit on the opposite sides — the labels are exchanged;
//   - 'inconclusive' : one long, asymmetric structure whose bounding-box centre is across the midline; the
//                      centre of a box does not prove where a wandering nerve "is", so the label is neither
//                      confirmed nor corrected.
// Neither kind is repaired here: the name is source data. The stage simply does not assert a side for them.
// scripts/uji/atlas-stage-assets.mts re-measures the files; this list must equal what it finds, so a fixed
// asset forces the entry to be removed and a new disagreement cannot appear unnoticed.

export type SideLabelReviewKind = 'swapped' | 'inconclusive'

export const ATLAS_SIDE_LABEL_REVIEW: Readonly<Record<string, SideLabelReviewKind>> = {
  'Eyelashes.l': 'swapped',
  'Eyelashes.r': 'swapped',
  'Vagus nerve (X).r': 'inconclusive',
}
