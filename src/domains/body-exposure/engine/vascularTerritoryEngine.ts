/**
 * BX-2 Vascular Territory Map Engine
 * Memetakan arteri koroner ke segmen miokardium AHA 17 atau arteri serebral ke wilayah stroke.
 * Sesuai Directive D-101: Unknown dominance -> all variants shown, none chosen.
 */
export interface VascularMapping {
  artery: string;
  dominanceVariant: 'right' | 'left' | 'codominant' | 'unknown';
  segments: number[];
  truthClass: 'reference';
}

export function mapCoronaryToAHA17(artery: string, dominance: 'right' | 'left' | 'codominant' | 'unknown'): VascularMapping {
  const normArtery = artery.toUpperCase();
  if (dominance === 'unknown') {
    return {
      artery: normArtery,
      dominanceVariant: 'unknown',
      segments: [],
      truthClass: 'reference'
    };
  }

  if (normArtery === 'LAD') {
    return {
      artery: 'LAD',
      dominanceVariant: dominance,
      segments: [1, 2, 7, 8, 13, 14, 17],
      truthClass: 'reference'
    };
  }

  return {
    artery: normArtery,
    dominanceVariant: dominance,
    segments: [],
    truthClass: 'reference'
  };
}
