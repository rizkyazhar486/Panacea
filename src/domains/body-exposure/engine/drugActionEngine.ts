/**
 * BX-9 Drug Action Map Engine
 * Memetakan mekanisme obat ke target organ/reseptor tanpa field dosis numerik.
 * Sesuai Directive D-101: Curated corpus only, unknown drug -> not available, ZERO numeric dose fields.
 */
export interface DrugActionMapping {
  drugName: string;
  targetOrgan: string;
  receptorOrMechanism: string;
  truthClass: 'reference';
}

export function mapDrugAction(drugName: string): DrugActionMapping {
  const name = drugName.toLowerCase();
  
  const corpus: Record<string, { organ: string; mechanism: string }> = {
    'beta-blocker': { organ: 'Heart', mechanism: 'Beta-1 adrenergic receptor antagonism' },
    'ace-inhibitor': { organ: 'Kidney / Vasculature', mechanism: 'ACE inhibition -> decreased Angiotensin II' },
    'salbutamol': { organ: 'Lung (Bronchioles)', mechanism: 'Beta-2 adrenergic receptor agonist' }
  };

  const matched = corpus[name];
  if (!matched) {
    return {
      drugName,
      targetOrgan: 'not available',
      receptorOrMechanism: 'not available',
      truthClass: 'reference'
    };
  }

  return {
    drugName,
    targetOrgan: matched.organ,
    receptorOrMechanism: matched.mechanism,
    truthClass: 'reference'
  };
}
