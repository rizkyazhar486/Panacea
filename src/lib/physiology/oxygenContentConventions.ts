export type OxygenContentConventionId =
  | 'panacea-clinical-effective-v1'
  | 'theoretical-hufner-v1'
  | 'elso-vv-2021-verbatim'
  | 'HUFNER_CLASSIC_1_34'
  | 'GREGORY_CLINICAL_1_39'
  | 'SEVERINGHAUS_STANDARD_1_36'
  | string;

export interface OxygenContentConvention {
  readonly id: OxygenContentConventionId;
  readonly label: string;
  readonly executable: boolean;
  readonly hbWorkingUnit: 'g/dL';
  readonly outputUnit: 'mL O2/dL';
  readonly hufnerMlO2PerGHb: number;
  readonly dissolvedMlO2PerDlPerMmHg: number;
  readonly evidence: readonly { readonly id: string; readonly kind: 'pmid' | 'doi' | 'url'; readonly reference: string }[];
  readonly sourcePrintedHbUnit?: 'g/dL' | 'g/L';
  readonly sourcePrintedDissolvedCoefficient?: number;
  readonly unitIssue?: string;
  readonly interpretation: string;
}

export const DEFAULT_OXYGEN_CONTENT_CONVENTION: OxygenContentConventionId = 'panacea-clinical-effective-v1';

export const OXYGEN_CONTENT_CONVENTIONS: readonly OxygenContentConvention[] = Object.freeze([
  Object.freeze({
    id: 'panacea-clinical-effective-v1',
    label: 'Panacea clinical-effective oxygen content convention',
    executable: true,
    hbWorkingUnit: 'g/dL',
    outputUnit: 'mL O2/dL',
    hufnerMlO2PerGHb: 1.34,
    dissolvedMlO2PerDlPerMmHg: 0.003,
    evidence: Object.freeze([
      Object.freeze({ id: 'statpearls-oxygen-transport', kind: 'url', reference: 'NCBI Bookshelf NBK538336 / PMID 30855920' }),
    ]),
    interpretation: 'Empirical clinical coefficient convention. This exactly matches the existing src/lib/hemodinamik.ts implementation and is the default until a versioned migration is explicitly validated.',
  }),
  Object.freeze({
    id: 'theoretical-hufner-v1',
    label: 'Theoretical Hüfner oxygen-binding convention',
    executable: true,
    hbWorkingUnit: 'g/dL',
    outputUnit: 'mL O2/dL',
    hufnerMlO2PerGHb: 1.39,
    dissolvedMlO2PerDlPerMmHg: 0.0031,
    evidence: Object.freeze([
      Object.freeze({ id: 'gorelov-hufner', kind: 'doi', reference: '10.1111/j.1365-2044.2004.03598.x' }),
      Object.freeze({ id: 'temperature-corrected-o2-content', kind: 'pmid', reference: '32789608' }),
    ]),
    interpretation: 'The 1.39 coefficient represents the theoretical oxygen-binding capacity of purified hemoglobin. It is kept as a named alternative and is not silently substituted for the clinical-effective convention.',
  }),
  Object.freeze({
    id: 'elso-vv-2021-verbatim',
    label: 'ELSO VV 2021 formula as printed',
    executable: false,
    hbWorkingUnit: 'g/dL',
    outputUnit: 'mL O2/dL',
    hufnerMlO2PerGHb: 1.39,
    dissolvedMlO2PerDlPerMmHg: 0.0034,
    evidence: Object.freeze([
      // Tonna et al. 2021, ELSO VV ECMO guideline
      Object.freeze({ id: 'elso-vv-2021', kind: 'pmid', reference: '33965970 / PMCID PMC8315725' }),
    ]),
    sourcePrintedHbUnit: 'g/L',
    sourcePrintedDissolvedCoefficient: 0.0034,
    unitIssue: 'Dimensionally inconsistent as printed for a single oxygen-content unit: Hb in g/L with 1.39 yields bound O2 in mL/L, while the 0.0034 dissolved coefficient is ordinarily interpreted on a per-dL blood basis. The guideline later gives Hb examples in g/dL. Preserve the source text, but do not execute it without an explicit normalization decision.',
    interpretation: 'Evidence/provenance record only. This convention intentionally fails closed so future code cannot copy a unit-ambiguous formula into shared physiology.',
  }),
]);

export function oxygenContentConvention(id: OxygenContentConventionId): OxygenContentConvention {
  // Alias mapping for compatibility
  const canonicalId =
    id === 'HUFNER_CLASSIC_1_34'
      ? 'panacea-clinical-effective-v1'
      : id === 'GREGORY_CLINICAL_1_39'
      ? 'theoretical-hufner-v1'
      : id;

  const found = OXYGEN_CONTENT_CONVENTIONS.find((item) => item.id === canonicalId);
  if (!found) throw new Error(`unknown oxygen-content convention: ${String(id)}`);
  return found;
}

function hemoglobinGdl(input: { value: number; unit: 'g/dL' | 'g/L' } | number): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) throw new Error('oxygen-content input: hemoglobin must be a non-negative finite number');
    return input;
  }
  if (!input || !Number.isFinite(input.value) || input.value < 0) {
    throw new Error('oxygen-content input: hemoglobin must be a non-negative finite number');
  }
  return input.unit === 'g/L' ? input.value / 10 : input.value;
}

export function oxygenContentMlDl(
  arg1: OxygenContentConventionId | { readonly conventionId?: OxygenContentConventionId; readonly hemoglobinGPerDl: number; readonly saturationFraction0to1: number; readonly po2MmHg: number },
  arg2?: { value: number; unit: 'g/dL' | 'g/L' } | number,
  arg3?: number,
  arg4?: number,
): number {
  let conventionId: OxygenContentConventionId = DEFAULT_OXYGEN_CONTENT_CONVENTION;
  let hbInput: { value: number; unit: 'g/dL' | 'g/L' } | number = 0;
  let sat = 0;
  let po2 = 0;

  if (typeof arg1 === 'object' && arg1 !== null) {
    conventionId = arg1.conventionId ?? DEFAULT_OXYGEN_CONTENT_CONVENTION;
    hbInput = arg1.hemoglobinGPerDl;
    sat = arg1.saturationFraction0to1;
    po2 = arg1.po2MmHg;
  } else {
    conventionId = arg1;
    hbInput = arg2!;
    sat = arg3!;
    po2 = arg4!;
  }

  const convention = oxygenContentConvention(conventionId);
  if (!convention.executable) {
    throw new Error(`oxygen-content convention ${convention.id} is non-executable: ${convention.unitIssue ?? 'source normalization unresolved'}`);
  }

  const hbGdl = hemoglobinGdl(hbInput);

  if (!Number.isFinite(sat) || sat < 0 || sat > 1) {
    throw new Error('oxygen-content input: saturation must be a finite fraction in [0,1]');
  }
  if (!Number.isFinite(po2) || po2 < 0) {
    throw new Error('oxygen-content input: PO2 must be a non-negative finite number');
  }

  return convention.hufnerMlO2PerGHb * hbGdl * sat + convention.dissolvedMlO2PerDlPerMmHg * po2;
}
