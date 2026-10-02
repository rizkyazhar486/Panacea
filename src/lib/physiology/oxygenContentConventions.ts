export type OxygenContentConventionId =
  | 'panacea-clinical-effective-v1'
  | 'theoretical-hufner-v1'
  | 'elso-vv-2021-verbatim'

export interface OxygenContentConvention {
  id: OxygenContentConventionId
  label: string
  executable: boolean
  hbWorkingUnit: 'g/dL'
  outputUnit: 'mL O2/dL'
  hufnerMlO2PerGHb: number
  dissolvedMlO2PerDlPerMmHg: number
  evidence: readonly { id: string; kind: 'pmid' | 'doi' | 'url'; reference: string }[]
  sourcePrintedHbUnit?: 'g/dL' | 'g/L'
  sourcePrintedDissolvedCoefficient?: number
  unitIssue?: string
  interpretation: string
}

export const DEFAULT_OXYGEN_CONTENT_CONVENTION: OxygenContentConventionId = 'panacea-clinical-effective-v1'

export const OXYGEN_CONTENT_CONVENTIONS: readonly OxygenContentConvention[] = [
  {
    id: 'panacea-clinical-effective-v1',
    label: 'Panacea clinical-effective oxygen content convention',
    executable: true,
    hbWorkingUnit: 'g/dL',
    outputUnit: 'mL O2/dL',
    hufnerMlO2PerGHb: 1.34,
    dissolvedMlO2PerDlPerMmHg: 0.003,
    evidence: [
      { id: 'statpearls-oxygen-transport', kind: 'url', reference: 'NCBI Bookshelf NBK538336 / PMID 30855920' },
    ],
    interpretation: 'Empirical clinical coefficient convention. This exactly matches the existing src/lib/hemodinamik.ts implementation and is the default until a versioned migration is explicitly validated.',
  },
  {
    id: 'theoretical-hufner-v1',
    label: 'Theoretical Hüfner oxygen-binding convention',
    executable: true,
    hbWorkingUnit: 'g/dL',
    outputUnit: 'mL O2/dL',
    hufnerMlO2PerGHb: 1.39,
    dissolvedMlO2PerDlPerMmHg: 0.0031,
    evidence: [
      { id: 'gorelov-hufner', kind: 'doi', reference: '10.1111/j.1365-2044.2004.03598.x' },
      { id: 'temperature-corrected-o2-content', kind: 'pmid', reference: '32789608' },
    ],
    interpretation: 'The 1.39 coefficient represents the theoretical oxygen-binding capacity of purified hemoglobin. It is kept as a named alternative and is not silently substituted for the clinical-effective convention.',
  },
  {
    id: 'elso-vv-2021-verbatim',
    label: 'ELSO VV 2021 formula as printed',
    executable: false,
    hbWorkingUnit: 'g/dL',
    outputUnit: 'mL O2/dL',
    hufnerMlO2PerGHb: 1.39,
    dissolvedMlO2PerDlPerMmHg: 0.0034,
    evidence: [
      { id: 'elso-vv-2021', kind: 'pmid', reference: '33965970 / PMCID PMC8315725' },
    ],
    sourcePrintedHbUnit: 'g/L',
    sourcePrintedDissolvedCoefficient: 0.0034,
    unitIssue: 'Dimensionally inconsistent as printed for a single oxygen-content unit: Hb in g/L with 1.39 yields bound O2 in mL/L, while the 0.0034 dissolved coefficient is ordinarily interpreted on a per-dL blood basis. The guideline later gives Hb examples in g/dL. Preserve the source text, but do not execute it without an explicit normalization decision.',
    interpretation: 'Evidence/provenance record only. This convention intentionally fails closed so future code cannot copy a unit-ambiguous formula into shared physiology.',
  },
] as const

export function oxygenContentConvention(id: OxygenContentConventionId): OxygenContentConvention {
  const found = OXYGEN_CONTENT_CONVENTIONS.find((item) => item.id === id)
  if (!found) throw new Error(`unknown oxygen-content convention: ${String(id)}`)
  return found
}

function hemoglobinGdl(input: { value: number; unit: 'g/dL' | 'g/L' }): number {
  if (!Number.isFinite(input.value) || input.value < 0) throw new Error('oxygen-content input: hemoglobin must be a non-negative finite number')
  return input.unit === 'g/L' ? input.value / 10 : input.value
}

export function oxygenContentMlDl(
  conventionId: OxygenContentConventionId,
  hemoglobin: { value: number; unit: 'g/dL' | 'g/L' },
  saturationFraction: number,
  po2MmHg: number,
): number {
  const convention = oxygenContentConvention(conventionId)
  if (!convention.executable) throw new Error(`oxygen-content convention ${convention.id} is non-executable: ${convention.unitIssue ?? 'source normalization unresolved'}`)
  if (!Number.isFinite(saturationFraction) || saturationFraction < 0 || saturationFraction > 1) {
    throw new Error('oxygen-content input: saturation must be a finite fraction in [0,1]')
  }
  if (!Number.isFinite(po2MmHg) || po2MmHg < 0) throw new Error('oxygen-content input: PO2 must be a non-negative finite number')
  const hbGdl = hemoglobinGdl(hemoglobin)
  return convention.hufnerMlO2PerGHb * hbGdl * saturationFraction
    + convention.dissolvedMlO2PerDlPerMmHg * po2MmHg
}
