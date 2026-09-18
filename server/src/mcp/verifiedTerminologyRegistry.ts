// Registry server-side yang sengaja kecil dan terverifikasi untuk FHIR/MCP.
// Ini bukan katalog LOINC lengkap. Hanya kode yang sudah dipakai dan diuji di
// Panaceamed yang boleh tampil sebagai LOINC; angka turunan tetap memakai
// CodeSystem lokal agar tidak menyamar sebagai hasil pemeriksaan baku.

export const LOINC_SYSTEM = 'http://loinc.org'
export const UCUM_SYSTEM = 'http://unitsofmeasure.org'
export const LOCAL_DERIVED_SYSTEM = 'https://panaceamed.id/fhir/CodeSystem/derived'
export const OBS_CATEGORY_SYSTEM = 'http://terminology.hl7.org/CodeSystem/observation-category'

export interface VerifiedMetricTerm {
  key: string
  code: string
  display: string
  unit: string
  ucum: string
  category: 'vital-signs' | 'laboratory' | 'survey'
  system: typeof LOINC_SYSTEM | typeof LOCAL_DERIVED_SYSTEM
  note?: string
}

const measured = (
  key: string,
  code: string,
  display: string,
  unit: string,
  ucum: string,
  category: VerifiedMetricTerm['category'],
  note?: string,
): VerifiedMetricTerm => ({ key, code, display, unit, ucum, category, system: LOINC_SYSTEM, note })

const derived = (
  key: string,
  display: string,
  unit: string,
  ucum: string,
  note: string,
): VerifiedMetricTerm => ({
  key,
  code: key,
  display,
  unit,
  ucum,
  category: 'survey',
  system: LOCAL_DERIVED_SYSTEM,
  note,
})

export const VERIFIED_METRIC_TERMS: readonly VerifiedMetricTerm[] = Object.freeze([
  measured('weightKg', '29463-7', 'Body weight', 'kg', 'kg', 'vital-signs'),
  measured('heightCm', '8302-2', 'Body height', 'cm', 'cm', 'vital-signs'),
  measured('systolic', '8480-6', 'Systolic blood pressure', 'mmHg', 'mm[Hg]', 'vital-signs'),
  measured('diastolic', '8462-4', 'Diastolic blood pressure', 'mmHg', 'mm[Hg]', 'vital-signs'),
  measured('heartRate', '8867-4', 'Heart rate', 'beats/min', '/min', 'vital-signs'),
  measured('waistCm', '8280-0', 'Waist circumference at umbilicus', 'cm', 'cm', 'vital-signs'),
  measured('hba1c', '4548-4', 'Hemoglobin A1c/Hemoglobin.total in Blood', '%', '%', 'laboratory'),
  measured('albuminGdL', '1751-7', 'Albumin [Mass/volume] in Serum or Plasma', 'g/dL', 'g/dL', 'laboratory'),
  measured('kreatininMgdL', '2160-0', 'Creatinine [Mass/volume] in Serum or Plasma', 'mg/dL', 'mg/dL', 'laboratory'),
  measured('glukosaPuasaMgdL', '1558-6', 'Fasting glucose [Mass/volume] in Serum or Plasma', 'mg/dL', 'mg/dL', 'laboratory'),
  measured('crpMgL', '1988-5', 'C reactive protein [Mass/volume] in Serum or Plasma', 'mg/L', 'mg/L', 'laboratory'),
  measured('limfositPersen', '736-9', 'Lymphocytes/100 leukocytes in Blood', '%', '%', 'laboratory'),
  measured('mcv', '787-2', 'MCV [Entitic volume] by Automated count', 'fL', 'fL', 'laboratory'),
  measured('rdw', '788-0', 'Erythrocyte distribution width [Ratio] by Automated count', '%', '%', 'laboratory'),
  measured('alp', '6768-6', 'Alkaline phosphatase [Enzymatic activity/volume] in Serum or Plasma', 'U/L', 'U/L', 'laboratory'),
  measured('wbc', '6690-2', 'Leukocytes [#/volume] in Blood by Automated count', '10*3/uL', '10*3/uL', 'laboratory'),
  measured('ast', '1920-8', 'AST [Enzymatic activity/volume] in Serum or Plasma', 'U/L', 'U/L', 'laboratory'),
  measured('alt', '1742-6', 'ALT [Enzymatic activity/volume] in Serum or Plasma', 'U/L', 'U/L', 'laboratory'),
  measured(
    'trombosit',
    '777-3',
    'Platelets [#/volume] in Blood by Automated count',
    '10*3/uL',
    '10*3/uL',
    'laboratory',
    'Entered as ×10⁹/L, which is numerically identical to ×10³/µL.',
  ),
  measured('trigliserida', '2571-8', 'Triglyceride [Mass/volume] in Serum or Plasma', 'mg/dL', 'mg/dL', 'laboratory'),
  measured('hdl', '2085-9', 'Cholesterol in HDL [Mass/volume] in Serum or Plasma', 'mg/dL', 'mg/dL', 'laboratory'),

  derived(
    'phenoAge',
    'PhenoAge (Levine 2018)',
    'years',
    'a',
    'Derived in Panaceamed from the published Levine 2018 equation; not a laboratory result and not LOINC-coded.',
  ),
  derived(
    'egfr',
    'eGFR (CKD-EPI 2021, race-free)',
    'mL/min/1.73m2',
    'mL/min/{1.73_m2}',
    'Calculated with the 2021 race-free CKD-EPI equation; kept locally coded so the equation identity travels with the value.',
  ),
  derived(
    'fib4',
    'FIB-4 index',
    '{score}',
    '{score}',
    'Derived from age, AST, ALT and platelets (Sterling 2006).',
  ),
  derived(
    'vo2max',
    'Estimated VO2max',
    'mL/kg/min',
    'mL/(kg.min)',
    'Estimated from resting and maximum heart rate (Uth 2004); not measured by ergometry.',
  ),
  derived(
    'bioAge',
    'Biological age (Panaceamed points model)',
    'years',
    'a',
    'Transparent points model whose weights are author-selected; directional only.',
  ),
])

const BY_KEY = new Map(VERIFIED_METRIC_TERMS.map((term) => [term.key, term]))
const BY_SYSTEM_CODE = new Map(VERIFIED_METRIC_TERMS.map((term) => [`${term.system}|${term.code}`, term]))

export function verifiedMetricByKey(key: string): VerifiedMetricTerm | undefined {
  return BY_KEY.get(key.trim())
}

export function verifiedMetricBySystemCode(system: string, code: string): VerifiedMetricTerm | undefined {
  return BY_SYSTEM_CODE.get(`${system.trim()}|${code.trim()}`)
}

export function searchVerifiedMetricTerms(query: string, limit = 20): VerifiedMetricTerm[] {
  const q = query.replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-US')
  if (!q) return []
  const cap = Math.min(Math.max(Math.trunc(limit), 1), 50)
  return VERIFIED_METRIC_TERMS
    .filter((term) =>
      term.code.toLocaleLowerCase('en-US').includes(q)
      || term.display.toLocaleLowerCase('en-US').includes(q)
      || term.key.toLocaleLowerCase('en-US').includes(q),
    )
    .slice(0, cap)
}
