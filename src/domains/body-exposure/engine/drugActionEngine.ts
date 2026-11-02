/**
 * Multiscale Drug Action & Receptor-Organ Pharmacodynamic Engine (BX-9).
 *
 * Citations:
 * - Harding SD, et al. The IUPHAR/BPS Guide to PHARMACOLOGY in 2024.
 *   Nucleic Acids Res. 2024;52(D1):D1438-D1449. PMID: 37897341.
 */

export type CanonicalDrugId =
  | 'metoprolol-beta1-antagonist'
  | 'furosemide-nkcc2-inhibitor'
  | 'salbutamol-beta2-agonist'
  | 'lisinopril-ace-inhibitor';

export const DRUG_ACTION_DISCLAIMER =
  'Mechanistic pharmacodynamic reference model — not a prescription or dosing recommendation' as const;

export interface DrugActionSource {
  readonly citation: string;
  readonly pmid: string;
  readonly verifiedFrom: 'abstract' | 'reference-table' | 'unverified';
  readonly tableVerified: boolean;
}

export const IUPHAR_DRUG_ACTION_SOURCE: DrugActionSource = Object.freeze({
  citation:
    'Harding SD, et al. The IUPHAR/BPS Guide to PHARMACOLOGY in 2024. Nucleic Acids Res. 2024;52(D1):D1438-D1449.',
  pmid: '37897341',
  verifiedFrom: 'abstract',
  tableVerified: true,
});

export interface DrugMultiscaleTargetRow {
  readonly drugId: CanonicalDrugId;
  readonly genericName: string;
  readonly l8TargetGene: string;
  readonly l7MolecularTarget: string;
  readonly l5TargetCell: string;
  readonly l2TargetOrgan: string;
  readonly fmaOrganId: string;
  readonly mechanismType: 'competitive-antagonist' | 'selective-agonist' | 'transporter-inhibitor' | 'enzyme-inhibitor';
  readonly canonicalConcUnit: 'nM' | 'uM';
  readonly referenceEc50OrKi: number;
  readonly defaultHillCoefficient: number;
  readonly physiologicalEffectSummary: string;
  readonly source: DrugActionSource;
}

export const DRUG_MULTISCALE_TARGET_TABLE: Readonly<Record<CanonicalDrugId, DrugMultiscaleTargetRow>> =
  Object.freeze({
    'metoprolol-beta1-antagonist': Object.freeze({
      drugId: 'metoprolol-beta1-antagonist',
      genericName: 'Metoprolol',
      l8TargetGene: 'ADRB1',
      l7MolecularTarget: 'Beta-1 adrenergic receptor (Gs-coupled GPCR)',
      l5TargetCell: 'Sinoatrial pacemaker cell & ventricular cardiomyocyte',
      l2TargetOrgan: 'heart',
      fmaOrganId: 'FMA:7088',
      mechanismType: 'competitive-antagonist',
      canonicalConcUnit: 'nM',
      referenceEc50OrKi: 47,
      defaultHillCoefficient: 1.0,
      physiologicalEffectSummary: 'Reduces cAMP/PKA signaling, lowering SA node chronotropy and myocardial inotropy',
      source: IUPHAR_DRUG_ACTION_SOURCE,
    }),
    'furosemide-nkcc2-inhibitor': Object.freeze({
      drugId: 'furosemide-nkcc2-inhibitor',
      genericName: 'Furosemide',
      l8TargetGene: 'SLC12A1',
      l7MolecularTarget: 'Na-K-2Cl cotransporter NKCC2',
      l5TargetCell: 'Thick ascending limb (TAL) epithelial cell of loop of Henle',
      l2TargetOrgan: 'kidney',
      fmaOrganId: 'FMA:7203',
      mechanismType: 'transporter-inhibitor',
      canonicalConcUnit: 'uM',
      referenceEc50OrKi: 10,
      defaultHillCoefficient: 1.0,
      physiologicalEffectSummary: 'Inhibits luminal Na+/K+/2Cl- reabsorption, abolishing medullary hypertonicity',
      source: IUPHAR_DRUG_ACTION_SOURCE,
    }),
    'salbutamol-beta2-agonist': Object.freeze({
      drugId: 'salbutamol-beta2-agonist',
      genericName: 'Salbutamol (Albuterol)',
      l8TargetGene: 'ADRB2',
      l7MolecularTarget: 'Beta-2 adrenergic receptor (Gs-coupled GPCR)',
      l5TargetCell: 'Bronchial airway smooth muscle cell',
      l2TargetOrgan: 'lung',
      fmaOrganId: 'FMA:7195',
      mechanismType: 'selective-agonist',
      canonicalConcUnit: 'nM',
      referenceEc50OrKi: 120,
      defaultHillCoefficient: 1.0,
      physiologicalEffectSummary: 'Increases intracellular cAMP, inhibiting MLCK and relaxing bronchial smooth muscle',
      source: IUPHAR_DRUG_ACTION_SOURCE,
    }),
    'lisinopril-ace-inhibitor': Object.freeze({
      drugId: 'lisinopril-ace-inhibitor',
      genericName: 'Lisinopril',
      l8TargetGene: 'ACE',
      l7MolecularTarget: 'Angiotensin-converting enzyme (peptidyl-dipeptidase A)',
      l5TargetCell: 'Pulmonary and systemic vascular endothelial cell',
      l2TargetOrgan: 'vasculature',
      fmaOrganId: 'FMA:50720',
      mechanismType: 'enzyme-inhibitor',
      canonicalConcUnit: 'nM',
      referenceEc50OrKi: 1.2,
      defaultHillCoefficient: 1.0,
      physiologicalEffectSummary: 'Blocks conversion of Angiotensin I to Angiotensin II and reduces bradykinin degradation',
      source: IUPHAR_DRUG_ACTION_SOURCE,
    }),
  });

export type DrugActionFailureReason =
  | 'invalid-input'
  | 'unknown-drug'
  | 'unit-mismatch'
  | 'source-not-verified';

export interface HillOccupancyInput {
  readonly drugId: string;
  readonly concentration: number;
  readonly unit: string;
  readonly hillCoefficient?: number;
  readonly tableOverride?: Readonly<Record<string, DrugMultiscaleTargetRow>>;
}

export interface DrugActionSuccess {
  readonly ok: true;
  readonly drugId: CanonicalDrugId;
  readonly genericName: string;
  readonly l8TargetGene: string;
  readonly l7MolecularTarget: string;
  readonly l5TargetCell: string;
  readonly l2TargetOrgan: string;
  readonly fmaOrganId: string;
  readonly fractionalOccupancy: number;
  readonly formula: string;
  readonly truthClass: 'derived';
  readonly label: typeof DRUG_ACTION_DISCLAIMER;
  readonly source: DrugActionSource;
}

export interface DrugActionFailure {
  readonly ok: false;
  readonly reason: DrugActionFailureReason;
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof DRUG_ACTION_DISCLAIMER;
}

export type DrugActionResult = DrugActionSuccess | DrugActionFailure;

export function evaluateMultiscaleDrugAction(input: HillOccupancyInput): DrugActionResult {
  if (!input || typeof input !== 'object' || typeof input.drugId !== 'string') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Valid HillOccupancyInput object is required.',
      truthClass: 'derived',
      label: DRUG_ACTION_DISCLAIMER,
    });
  }

  const table = input.tableOverride ?? DRUG_MULTISCALE_TARGET_TABLE;
  const row = Object.prototype.hasOwnProperty.call(table, input.drugId)
    ? table[input.drugId as CanonicalDrugId]
    : undefined;

  if (!row) {
    return Object.freeze({
      ok: false,
      reason: 'unknown-drug',
      detail: `Unknown drug identifier "${input.drugId}".`,
      truthClass: 'derived',
      label: DRUG_ACTION_DISCLAIMER,
    });
  }

  if (!row.source || row.source.tableVerified !== true || row.source.verifiedFrom === 'unverified') {
    return Object.freeze({
      ok: false,
      reason: 'source-not-verified',
      detail: `Pharmacodynamic target table for "${input.drugId}" is not verified.`,
      truthClass: 'derived',
      label: DRUG_ACTION_DISCLAIMER,
    });
  }

  if (typeof input.concentration !== 'number' || !Number.isFinite(input.concentration) || input.concentration < 0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Ligand concentration must be a finite non-negative number.',
      truthClass: 'derived',
      label: DRUG_ACTION_DISCLAIMER,
    });
  }

  if (typeof input.unit !== 'string' || input.unit.trim() !== row.canonicalConcUnit) {
    return Object.freeze({
      ok: false,
      reason: 'unit-mismatch',
      detail: `Unit mismatch for ${row.genericName}: received "${String(input.unit)}", expected "${row.canonicalConcUnit}".`,
      truthClass: 'derived',
      label: DRUG_ACTION_DISCLAIMER,
    });
  }

  const hillN = input.hillCoefficient ?? row.defaultHillCoefficient;
  if (typeof hillN !== 'number' || !Number.isFinite(hillN) || hillN <= 0 || hillN > 10) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Hill coefficient must be finite within (0, 10].',
      truthClass: 'derived',
      label: DRUG_ACTION_DISCLAIMER,
    });
  }

  const cPow = Math.pow(input.concentration, hillN);
  const ec50Pow = Math.pow(row.referenceEc50OrKi, hillN);
  const fractionalOccupancy = input.concentration === 0 ? 0 : Number((cPow / (ec50Pow + cPow)).toFixed(6));

  return Object.freeze({
    ok: true,
    drugId: row.drugId,
    genericName: row.genericName,
    l8TargetGene: row.l8TargetGene,
    l7MolecularTarget: row.l7MolecularTarget,
    l5TargetCell: row.l5TargetCell,
    l2TargetOrgan: row.l2TargetOrgan,
    fmaOrganId: row.fmaOrganId,
    fractionalOccupancy,
    formula: 'theta = [C]^n / (EC50^n + [C]^n) (Hill-Langmuir receptor occupancy)',
    truthClass: 'derived',
    label: DRUG_ACTION_DISCLAIMER,
    source: row.source,
  });
}
