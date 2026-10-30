/**
 * BX-7 Referred Pain & Dermatome Explorer Engine
 * Menghubungkan wilayah kulit (dermatome) ke kandidat organ nyeri alih.
 * Sesuai Directive D-101: Educational label, missing region -> not available.
 */
export interface DermatomeResult {
  skinRegion: string;
  dermatomeLevel: string;
  referredOrganCandidates: string[];
  disclaimer: string;
  truthClass: 'reference';
}

export function exploreDermatome(skinRegion: string): DermatomeResult {
  const region = skinRegion.toLowerCase();
  
  const mapping: Record<string, { level: string; organs: string[] }> = {
    'c5-shoulder': { level: 'C5', organs: ['Diaphragm', 'Heart (early referral)'] },
    't10-umbilicus': { level: 'T10', organs: ['Appendix (early stage)', 'Small Intestine'] },
    'epigastric': { level: 'T7-T9', organs: ['Stomach', 'Gallbladder', 'Pancreas'] }
  };

  const matched = mapping[region];
  if (!matched) {
    return {
      skinRegion,
      dermatomeLevel: 'not available',
      referredOrganCandidates: [],
      disclaimer: 'Educational, not a diagnosis',
      truthClass: 'reference'
    };
  }

  return {
    skinRegion,
    dermatomeLevel: matched.level,
    referredOrganCandidates: matched.organs,
    disclaimer: 'Educational, not a diagnosis',
    truthClass: 'reference'
  };
}
