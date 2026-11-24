export const DEMOGRAPHIC_COHORT_IDS = [
  'NEO_PRE_M', 'NEO_PRE_F',
  'NEO_TRM_M', 'NEO_TRM_F',
  'INF_M', 'INF_F',
  'TOD_M', 'TOD_F',
  'CHD_M', 'CHD_F',
  'ADO_M', 'ADO_F',
  'YAD_M', 'YAD_F',
  'MAD_M', 'MAD_F',
  'GER_M', 'GER_F',
  'LON_M', 'LON_F',
  'MAT_PREG', 'MAT_POST',
] as const

export type DemographicCohortId = typeof DEMOGRAPHIC_COHORT_IDS[number]

export interface DemographicCohortSpec {
  readonly id: DemographicCohortId
  readonly label: string
  readonly biologicalSex: 'male' | 'female'
  readonly minAgeYears: number
  readonly maxAgeYears: number
  readonly headToBodyRatio: number
  readonly shellAssetKey: string
  readonly epiphysealGrowthPlatesOpen: boolean
  readonly seniorHighClarityRecommended: boolean
}

export interface AnthropometryManifold {
  readonly cohortId: DemographicCohortId
  readonly chronologicalAgeYears: number
  readonly biologicalSex: 'male' | 'female'
  readonly gestationalWeek?: number
  readonly postpartumWeek?: number
  readonly tannerStage?: 1 | 2 | 3 | 4 | 5
  readonly heightCm: number
  readonly weightKg: number
  readonly bmi: number
  readonly headToBodyRatio: number
  readonly shellAssetKey: string
  readonly somatotype: { readonly ecto: number; readonly meso: number; readonly endo: number }
  readonly composition: {
    readonly skeletalMusclePct: number
    readonly subcutaneousFatPct: number
    readonly visceralFatIndex: number
    readonly boneMineralDensityTScore: number
  }
  readonly senescenceVector: {
    readonly sarcopeniaIndex: number
    readonly thoracicKyphosisDeg: number
    readonly arterialCalcificationIndex: number
    readonly dermalElastosis: number
    readonly articularCartilageWear: number
    readonly frailtyIndex: number
  }
  readonly obstetricHemodynamics?: {
    readonly gestationalWeek: number
    readonly fundalHeightCm: number
    readonly cardiacOutputGainPct: number
    readonly bloodVolumeGainPct: number
    readonly ivcCompressionRisk0to1: number
    readonly fetalPresentation: 'cephalic' | 'breech' | 'transverse'
  }
}

export const DEMOGRAPHIC_COHORTS: Readonly<Record<DemographicCohortId, DemographicCohortSpec>> = {
  NEO_PRE_M: { id: 'NEO_PRE_M', label: 'Preterm Neonate (M)', biologicalSex: 'male', minAgeYears: 0, maxAgeYears: 0.08, headToBodyRatio: 0.27, shellAssetKey: 'pediatric_neonate_male', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  NEO_PRE_F: { id: 'NEO_PRE_F', label: 'Preterm Neonate (F)', biologicalSex: 'female', minAgeYears: 0, maxAgeYears: 0.08, headToBodyRatio: 0.27, shellAssetKey: 'pediatric_neonate_female', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  NEO_TRM_M: { id: 'NEO_TRM_M', label: 'Term Neonate (M)', biologicalSex: 'male', minAgeYears: 0, maxAgeYears: 0.08, headToBodyRatio: 0.25, shellAssetKey: 'pediatric_neonate_male', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  NEO_TRM_F: { id: 'NEO_TRM_F', label: 'Term Neonate (F)', biologicalSex: 'female', minAgeYears: 0, maxAgeYears: 0.08, headToBodyRatio: 0.25, shellAssetKey: 'pediatric_neonate_female', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  INF_M: { id: 'INF_M', label: 'Infant (M)', biologicalSex: 'male', minAgeYears: 0.08, maxAgeYears: 1, headToBodyRatio: 0.23, shellAssetKey: 'pediatric_infant_male', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  INF_F: { id: 'INF_F', label: 'Infant (F)', biologicalSex: 'female', minAgeYears: 0.08, maxAgeYears: 1, headToBodyRatio: 0.23, shellAssetKey: 'pediatric_infant_female', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  TOD_M: { id: 'TOD_M', label: 'Toddler (M)', biologicalSex: 'male', minAgeYears: 1, maxAgeYears: 4, headToBodyRatio: 0.20, shellAssetKey: 'pediatric_child_5y_male', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  TOD_F: { id: 'TOD_F', label: 'Toddler (F)', biologicalSex: 'female', minAgeYears: 1, maxAgeYears: 4, headToBodyRatio: 0.20, shellAssetKey: 'pediatric_child_5y_female', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  CHD_M: { id: 'CHD_M', label: 'Child (M)', biologicalSex: 'male', minAgeYears: 4, maxAgeYears: 12, headToBodyRatio: 0.16, shellAssetKey: 'pediatric_child_10y_male', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  CHD_F: { id: 'CHD_F', label: 'Child (F)', biologicalSex: 'female', minAgeYears: 4, maxAgeYears: 12, headToBodyRatio: 0.16, shellAssetKey: 'pediatric_child_10y_female', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  ADO_M: { id: 'ADO_M', label: 'Adolescent (M)', biologicalSex: 'male', minAgeYears: 12, maxAgeYears: 18, headToBodyRatio: 0.135, shellAssetKey: 'pediatric_adolescent_male', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  ADO_F: { id: 'ADO_F', label: 'Adolescent (F)', biologicalSex: 'female', minAgeYears: 12, maxAgeYears: 18, headToBodyRatio: 0.135, shellAssetKey: 'pediatric_adolescent_female', epiphysealGrowthPlatesOpen: true, seniorHighClarityRecommended: false },
  YAD_M: { id: 'YAD_M', label: 'Young Adult (M)', biologicalSex: 'male', minAgeYears: 18, maxAgeYears: 40, headToBodyRatio: 0.125, shellAssetKey: 'adult_male', epiphysealGrowthPlatesOpen: false, seniorHighClarityRecommended: false },
  YAD_F: { id: 'YAD_F', label: 'Young Adult (F)', biologicalSex: 'female', minAgeYears: 18, maxAgeYears: 40, headToBodyRatio: 0.125, shellAssetKey: 'adult_female', epiphysealGrowthPlatesOpen: false, seniorHighClarityRecommended: false },
  MAD_M: { id: 'MAD_M', label: 'Middle-Aged Adult (M)', biologicalSex: 'male', minAgeYears: 40, maxAgeYears: 65, headToBodyRatio: 0.125, shellAssetKey: 'adult_male', epiphysealGrowthPlatesOpen: false, seniorHighClarityRecommended: false },
  MAD_F: { id: 'MAD_F', label: 'Middle-Aged Adult (F)', biologicalSex: 'female', minAgeYears: 40, maxAgeYears: 65, headToBodyRatio: 0.125, shellAssetKey: 'adult_female', epiphysealGrowthPlatesOpen: false, seniorHighClarityRecommended: false },
  GER_M: { id: 'GER_M', label: 'Geriatric (M)', biologicalSex: 'male', minAgeYears: 65, maxAgeYears: 85, headToBodyRatio: 0.128, shellAssetKey: 'icrp_adult_male', epiphysealGrowthPlatesOpen: false, seniorHighClarityRecommended: true },
  GER_F: { id: 'GER_F', label: 'Geriatric (F)', biologicalSex: 'female', minAgeYears: 65, maxAgeYears: 85, headToBodyRatio: 0.128, shellAssetKey: 'icrp_adult_female', epiphysealGrowthPlatesOpen: false, seniorHighClarityRecommended: true },
  LON_M: { id: 'LON_M', label: 'Octogenarian+ (M)', biologicalSex: 'male', minAgeYears: 85, maxAgeYears: 115, headToBodyRatio: 0.132, shellAssetKey: 'icrp_adult_male', epiphysealGrowthPlatesOpen: false, seniorHighClarityRecommended: true },
  LON_F: { id: 'LON_F', label: 'Octogenarian+ (F)', biologicalSex: 'female', minAgeYears: 85, maxAgeYears: 115, headToBodyRatio: 0.132, shellAssetKey: 'icrp_adult_female', epiphysealGrowthPlatesOpen: false, seniorHighClarityRecommended: true },
  MAT_PREG: { id: 'MAT_PREG', label: 'Pregnant (4D Obstetric)', biologicalSex: 'female', minAgeYears: 15, maxAgeYears: 50, headToBodyRatio: 0.125, shellAssetKey: 'adult_female', epiphysealGrowthPlatesOpen: false, seniorHighClarityRecommended: false },
  MAT_POST: { id: 'MAT_POST', label: 'Postpartum (Wk 1-12)', biologicalSex: 'female', minAgeYears: 15, maxAgeYears: 50, headToBodyRatio: 0.125, shellAssetKey: 'adult_female', epiphysealGrowthPlatesOpen: false, seniorHighClarityRecommended: false },
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export function classifyDemographicCohort(params: {
  readonly ageYears: number
  readonly biologicalSex: 'male' | 'female'
  readonly gestationalWeek?: number
  readonly postpartumWeek?: number
  readonly preterm?: boolean
}): DemographicCohortId {
  const age = clamp(params.ageYears, 0, 115)
  if (params.biologicalSex === 'female' && typeof params.gestationalWeek === 'number' && params.gestationalWeek >= 1 && params.gestationalWeek <= 42) {
    return 'MAT_PREG'
  }
  if (params.biologicalSex === 'female' && typeof params.postpartumWeek === 'number' && params.postpartumWeek >= 1 && params.postpartumWeek <= 12) {
    return 'MAT_POST'
  }
  const s = params.biologicalSex === 'male' ? 'M' : 'F'
  if (age < 0.08) return params.preterm ? `NEO_PRE_${s}` : `NEO_TRM_${s}`
  if (age < 1) return `INF_${s}`
  if (age < 4) return `TOD_${s}`
  if (age < 12) return `CHD_${s}`
  if (age < 18) return `ADO_${s}`
  if (age < 40) return `YAD_${s}`
  if (age < 65) return `MAD_${s}`
  if (age < 85) return `GER_${s}`
  return `LON_${s}`
}

export function synthesizeAnthropometryManifold(input: {
  readonly ageYears: number
  readonly biologicalSex: 'male' | 'female'
  readonly heightCm: number
  readonly weightKg: number
  readonly gestationalWeek?: number
  readonly postpartumWeek?: number
  readonly preterm?: boolean
  readonly fetalPresentation?: 'cephalic' | 'breech' | 'transverse'
}): AnthropometryManifold {
  const age = clamp(input.ageYears, 0, 115)
  const heightCm = clamp(input.heightCm, 35, 225)
  const weightKg = clamp(input.weightKg, 0.5, 260)
  const bmi = Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1))
  const cohortId = classifyDemographicCohort(input)
  const spec = DEMOGRAPHIC_COHORTS[cohortId]

  const senescentT = clamp((age - 45) / 55, 0, 1)
  const bmdTScore = Number((0.4 - senescentT * 2.9 - (input.biologicalSex === 'female' && age >= 50 ? 0.45 : 0)).toFixed(2))
  const kyphosisDeg = Math.round(28 + senescentT * 34)
  const sarcopeniaIndex = Number(clamp(senescentT * 0.85, 0, 1).toFixed(2))
  const arterialCalc = Number(clamp(senescentT * 0.9, 0, 1).toFixed(2))
  const frailty = Number(clamp(Math.max(0, (age - 70) / 35), 0, 1).toFixed(2))

  const baseMuscle = input.biologicalSex === 'male' ? 42 : 34
  const skeletalMusclePct = Number(clamp(baseMuscle - senescentT * 11, 18, 56).toFixed(1))
  const subcutaneousFatPct = Number(clamp((bmi - 16) * 1.45 + (input.biologicalSex === 'female' ? 6 : 0), 6, 48).toFixed(1))
  const visceralFatIndex = Number(clamp(Math.round(3 + Math.max(0, bmi - 21) * 0.85 + senescentT * 4), 1, 25))

  const endo = clamp((bmi - 18) / 18, 0.1, 0.8)
  const ecto = clamp((24 - bmi) / 14, 0.1, 0.8)
  const meso = clamp(1 - (endo + ecto) * 0.5, 0.15, 0.8)
  const sum = endo + ecto + meso

  const gestWk = cohortId === 'MAT_PREG' ? clamp(Math.round(input.gestationalWeek ?? 20), 1, 42) : undefined
  const obstetricHemodynamics = gestWk !== undefined
    ? {
        gestationalWeek: gestWk,
        fundalHeightCm: gestWk < 12 ? Math.round(gestWk * 0.9) : Math.min(40, gestWk),
        cardiacOutputGainPct: Math.round(clamp((gestWk / 32) * 40, 5, 45)),
        bloodVolumeGainPct: Math.round(clamp((gestWk / 34) * 42, 6, 45)),
        ivcCompressionRisk0to1: Number(clamp((gestWk - 20) / 20, 0, 1).toFixed(2)),
        fetalPresentation: input.fetalPresentation ?? 'cephalic',
      }
    : undefined

  return {
    cohortId,
    chronologicalAgeYears: age,
    biologicalSex: input.biologicalSex,
    ...(gestWk !== undefined ? { gestationalWeek: gestWk } : {}),
    ...(cohortId === 'MAT_POST' ? { postpartumWeek: clamp(Math.round(input.postpartumWeek ?? 4), 1, 12) } : {}),
    ...(cohortId === 'ADO_M' || cohortId === 'ADO_F'
      ? { tannerStage: clamp(Math.round(1 + ((age - 12) / 5) * 4), 1, 5) as 1 | 2 | 3 | 4 | 5 }
      : {}),
    heightCm,
    weightKg,
    bmi,
    headToBodyRatio: spec.headToBodyRatio,
    shellAssetKey: spec.shellAssetKey,
    somatotype: {
      ecto: Number((ecto / sum).toFixed(2)),
      meso: Number((meso / sum).toFixed(2)),
      endo: Number((endo / sum).toFixed(2)),
    },
    composition: {
      skeletalMusclePct,
      subcutaneousFatPct,
      visceralFatIndex,
      boneMineralDensityTScore: bmdTScore,
    },
    senescenceVector: {
      sarcopeniaIndex,
      thoracicKyphosisDeg: kyphosisDeg,
      arterialCalcificationIndex: arterialCalc,
      dermalElastosis: Number(clamp(senescentT * 0.88, 0, 1).toFixed(2)),
      articularCartilageWear: Number(clamp(senescentT * 0.82, 0, 1).toFixed(2)),
      frailtyIndex: frailty,
    },
    ...(obstetricHemodynamics ? { obstetricHemodynamics } : {}),
  }
}

/**
 * Deterministic Indonesian & English clinical voice/text intake parser for
 * Smart Morph synthesis (zero external network required).
 */
export function parseNaturalDemographicIntake(utterance: string): AnthropometryManifold {
  const text = (utterance || '').toLowerCase()
  const isFemale = /\b(wanita|perempuan|ibu|hamil|pregnant|female|woman|girl|postpartum)\b/.test(text)
  const biologicalSex: 'male' | 'female' = isFemale ? 'female' : 'male'

  const ageMatch = text.match(/(\d+(?:\.\d+)?)\s*(tahun|thn|yo|y\/o|years?|yr)/)
  const monthMatch = text.match(/(\d+)\s*(bulan|bln|months?|mos)/)
  const dayMatch = text.match(/(\d+)\s*(hari|days?)/)
  const ageYears = ageMatch
    ? Number(ageMatch[1])
    : monthMatch
      ? Number(monthMatch[1]) / 12
      : dayMatch
        ? Number(dayMatch[1]) / 365
        : 32

  const pregMatch = text.match(/(?:hamil|pregnant|gestasi|uk)\D{0,16}(\d{1,2})\s*(minggu|mgg|weeks?|wk)/)
  const postMatch = text.match(/(?:postpartum|nifas|pasca\s*melahirkan)\D{0,12}(\d{1,2})\s*(minggu|mgg|weeks?|wk)/)
  const heightMatch = text.match(/(?:tinggi|tb|height)\D{0,6}(\d{2,3})\s*(?:cm)?/) ?? text.match(/(\d{2,3})\s*cm/)
  const weightMatch = text.match(/(?:berat|bb|weight)\D{0,6}(\d{1,3}(?:\.\d+)?)\s*(?:kg)?/) ?? text.match(/(\d{1,3}(?:\.\d+)?)\s*kg/)

  const defaultHeight = ageYears < 1 ? 62 : ageYears < 12 ? 125 : biologicalSex === 'male' ? 170 : 160
  const defaultWeight = ageYears < 1 ? 6.5 : ageYears < 12 ? 26 : biologicalSex === 'male' ? 68 : 57

  return synthesizeAnthropometryManifold({
    ageYears,
    biologicalSex,
    heightCm: heightMatch ? Number(heightMatch[1]) : defaultHeight,
    weightKg: weightMatch ? Number(weightMatch[1]) : defaultWeight,
    gestationalWeek: pregMatch ? Number(pregMatch[1]) : undefined,
    postpartumWeek: postMatch ? Number(postMatch[1]) : undefined,
    preterm: /\b(preterm|prematur)\b/.test(text),
  })
}
