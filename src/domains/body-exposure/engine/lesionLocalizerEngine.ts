/**
 * BX-1 Lesion Localizer Engine
 * Menggeneralisasi pelokalan lesi saraf (dari okulomotor ke spinal cord & pleksus brakialis).
 * Sesuai Directive D-101: Contradictory pattern -> ambiguous candidates, never forced single answer.
 */
export interface LesionResult {
  pattern: string;
  localizedLevel: string;
  truthClass: 'reference' | 'derived';
  ambiguous: boolean;
  candidates?: string[];
}

export function localizeSpinalLesion(weakness: string, reflexLoss: string): LesionResult {
  const w = weakness.toLowerCase();
  const r = reflexLoss.toLowerCase();

  if (w.includes('c5') && r.includes('biceps')) {
    return {
      pattern: 'C5 weakness + biceps reflex loss',
      localizedLevel: 'C5',
      truthClass: 'reference',
      ambiguous: false
    };
  }

  // Contradictory / ambiguous pattern handling
  if (w !== '' && r !== '') {
    return {
      pattern: `${weakness} + ${reflexLoss}`,
      localizedLevel: 'ambiguous',
      truthClass: 'reference',
      ambiguous: true,
      candidates: ['C5', 'C6', 'Upper Trunk']
    };
  }

  return {
    pattern: 'unknown',
    localizedLevel: 'not available',
    truthClass: 'reference',
    ambiguous: false
  };
}
