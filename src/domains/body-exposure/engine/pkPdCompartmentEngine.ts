// Pure textbook one-compartment multi-dose oral pharmacokinetics (Bateman function)
// and Hill Emax pharmacodynamics coupled to PanaceaMed's 34 bundled RDKit ETKDG v3 / MMFF94
// 3D drug conformers (public/molecules/*.json).
// Educational simulation only — never clinical dosing or prescribing software.

export const PKPD_STUDIO_BOUNDARY = {
  truthClass: 'EDUCATIONAL_PKPD_SIMULATION' as const,
  clinicalPrescribingAuthorized: false,
  note: 'Textbook one-compartment Bateman oral PK and Hill Emax receptor-occupancy equations with representative literature parameters. Never use for patient dosing, therapeutic drug monitoring, or renal dose adjustment.',
} as const

export interface BundledDrugPkProfile {
  readonly slug: string
  readonly name: string
  readonly drugClass: string
  readonly target: string
  readonly defaultDoseMg: number
  readonly intervalHours: number
  readonly halfLifeHours: number
  readonly kaPerHour: number
  readonly vdLiters: number
  readonly bioavailabilityF: number
  readonly ec50MgL: number
  readonly hillN: number
  readonly mecMgL: number
  readonly mtcMgL: number
  readonly renalFraction: number
  readonly mechanismIds?: readonly string[]
}

export const BUNDLED_RDKIT_DRUGS: readonly BundledDrugPkProfile[] = [
  { slug: 'atorvastatin', name: 'Atorvastatin', drugClass: 'Statin', target: 'HMG-CoA reductase', defaultDoseMg: 20, intervalHours: 24, halfLifeHours: 14, kaPerHour: 1.1, vdLiters: 380, bioavailabilityF: 0.14, ec50MgL: 0.004, hillN: 1.0, mecMgL: 0.002, mtcMgL: 0.03, renalFraction: 0.05, mechanismIds: ['statin-hmgcr'] },
  { slug: 'simvastatin', name: 'Simvastatin', drugClass: 'Statin', target: 'HMG-CoA reductase', defaultDoseMg: 20, intervalHours: 24, halfLifeHours: 3, kaPerHour: 0.9, vdLiters: 250, bioavailabilityF: 0.05, ec50MgL: 0.003, hillN: 1.0, mecMgL: 0.001, mtcMgL: 0.02, renalFraction: 0.13, mechanismIds: ['statin-hmgcr'] },
  { slug: 'aspirin', name: 'Aspirin', drugClass: 'Antiplatelet / NSAID', target: 'COX-1 Ser529', defaultDoseMg: 81, intervalHours: 24, halfLifeHours: 0.35, kaPerHour: 2.2, vdLiters: 11, bioavailabilityF: 0.68, ec50MgL: 1.5, hillN: 1.1, mecMgL: 0.8, mtcMgL: 15, renalFraction: 0.25, mechanismIds: ['aspirin-cox1'] },
  { slug: 'clopidogrel', name: 'Clopidogrel', drugClass: 'P2Y12 Inhibitor', target: 'Platelet P2Y12 receptor', defaultDoseMg: 75, intervalHours: 24, halfLifeHours: 6, kaPerHour: 1.5, vdLiters: 180, bioavailabilityF: 0.5, ec50MgL: 0.08, hillN: 1.0, mecMgL: 0.04, mtcMgL: 0.6, renalFraction: 0.5, mechanismIds: ['aspirin-cox1'] },
  { slug: 'lisinopril', name: 'Lisinopril', drugClass: 'ACE Inhibitor', target: 'ACE Zn2+ active site', defaultDoseMg: 10, intervalHours: 24, halfLifeHours: 12, kaPerHour: 0.35, vdLiters: 124, bioavailabilityF: 0.25, ec50MgL: 0.012, hillN: 1.1, mecMgL: 0.005, mtcMgL: 0.08, renalFraction: 0.98, mechanismIds: ['ace-inhibition'] },
  { slug: 'captopril', name: 'Captopril', drugClass: 'ACE Inhibitor', target: 'ACE active site', defaultDoseMg: 25, intervalHours: 8, halfLifeHours: 2, kaPerHour: 1.6, vdLiters: 50, bioavailabilityF: 0.7, ec50MgL: 0.12, hillN: 1.0, mecMgL: 0.05, mtcMgL: 1.0, renalFraction: 0.75, mechanismIds: ['ace-inhibition'] },
  { slug: 'losartan', name: 'Losartan', drugClass: 'ARB', target: 'AT1 receptor', defaultDoseMg: 50, intervalHours: 24, halfLifeHours: 6, kaPerHour: 1.2, vdLiters: 34, bioavailabilityF: 0.33, ec50MgL: 0.18, hillN: 1.0, mecMgL: 0.08, mtcMgL: 1.5, renalFraction: 0.35, mechanismIds: ['ace-inhibition'] },
  { slug: 'bisoprolol', name: 'Bisoprolol', drugClass: 'Beta-1 Blocker', target: 'Cardiac beta-1 adrenergic', defaultDoseMg: 5, intervalHours: 24, halfLifeHours: 11, kaPerHour: 1.3, vdLiters: 220, bioavailabilityF: 0.88, ec50MgL: 0.014, hillN: 1.1, mecMgL: 0.008, mtcMgL: 0.09, renalFraction: 0.5, mechanismIds: ['beta1-blockade'] },
  { slug: 'propranolol', name: 'Propranolol', drugClass: 'Non-selective Beta Blocker', target: 'Beta-1/2 adrenergic', defaultDoseMg: 40, intervalHours: 12, halfLifeHours: 4, kaPerHour: 1.4, vdLiters: 280, bioavailabilityF: 0.26, ec50MgL: 0.025, hillN: 1.0, mecMgL: 0.015, mtcMgL: 0.2, renalFraction: 0.05, mechanismIds: ['beta1-blockade'] },
  { slug: 'amlodipine', name: 'Amlodipine', drugClass: 'DHP CCB', target: 'Vascular L-type Ca2+ channel', defaultDoseMg: 5, intervalHours: 24, halfLifeHours: 36, kaPerHour: 0.25, vdLiters: 1470, bioavailabilityF: 0.64, ec50MgL: 0.004, hillN: 1.0, mecMgL: 0.002, mtcMgL: 0.025, renalFraction: 0.1 },
  { slug: 'metformin', name: 'Metformin', drugClass: 'Biguanide', target: 'Hepatic Complex I / AMPK', defaultDoseMg: 500, intervalHours: 12, halfLifeHours: 6.2, kaPerHour: 0.9, vdLiters: 250, bioavailabilityF: 0.55, ec50MgL: 1.0, hillN: 1.2, mecMgL: 0.5, mtcMgL: 4.0, renalFraction: 0.99, mechanismIds: ['sglt2-inhibition'] },
  { slug: 'furosemide', name: 'Furosemide', drugClass: 'Loop Diuretic', target: 'NKCC2 cotransporter', defaultDoseMg: 40, intervalHours: 12, halfLifeHours: 1.5, kaPerHour: 1.4, vdLiters: 12, bioavailabilityF: 0.5, ec50MgL: 0.8, hillN: 1.4, mecMgL: 0.4, mtcMgL: 8.0, renalFraction: 0.85 },
  { slug: 'hct', name: 'Hydrochlorothiazide', drugClass: 'Thiazide Diuretic', target: 'DCT NCC cotransporter', defaultDoseMg: 25, intervalHours: 24, halfLifeHours: 10, kaPerHour: 0.9, vdLiters: 180, bioavailabilityF: 0.68, ec50MgL: 0.06, hillN: 1.0, mecMgL: 0.03, mtcMgL: 0.4, renalFraction: 0.95 },
  { slug: 'spironolactone', name: 'Spironolactone', drugClass: 'MRA', target: 'Mineralocorticoid receptor', defaultDoseMg: 25, intervalHours: 24, halfLifeHours: 16, kaPerHour: 0.8, vdLiters: 350, bioavailabilityF: 0.72, ec50MgL: 0.04, hillN: 1.0, mecMgL: 0.02, mtcMgL: 0.3, renalFraction: 0.45 },
  { slug: 'warfarin', name: 'Warfarin', drugClass: 'VKA Anticoagulant', target: 'VKORC1 epoxide reductase', defaultDoseMg: 5, intervalHours: 24, halfLifeHours: 40, kaPerHour: 1.5, vdLiters: 10, bioavailabilityF: 0.95, ec50MgL: 1.2, hillN: 1.3, mecMgL: 0.7, mtcMgL: 3.0, renalFraction: 0.05, mechanismIds: ['factor-xa-inhibition'] },
  { slug: 'salbutamol', name: 'Salbutamol', drugClass: 'SABA Bronchodilator', target: 'Airway beta-2 adrenergic', defaultDoseMg: 4, intervalHours: 8, halfLifeHours: 4.5, kaPerHour: 1.5, vdLiters: 156, bioavailabilityF: 0.5, ec50MgL: 0.008, hillN: 1.0, mecMgL: 0.004, mtcMgL: 0.04, renalFraction: 0.65 },
  { slug: 'omeprazole', name: 'Omeprazole', drugClass: 'PPI', target: 'Parietal H+/K+ ATPase', defaultDoseMg: 20, intervalHours: 24, halfLifeHours: 1.0, kaPerHour: 1.4, vdLiters: 22, bioavailabilityF: 0.55, ec50MgL: 0.25, hillN: 1.2, mecMgL: 0.1, mtcMgL: 2.0, renalFraction: 0.1 },
  { slug: 'ondansetron', name: 'Ondansetron', drugClass: '5-HT3 Antagonist', target: 'Vagal / CTZ 5-HT3 receptor', defaultDoseMg: 8, intervalHours: 8, halfLifeHours: 4.0, kaPerHour: 1.2, vdLiters: 140, bioavailabilityF: 0.6, ec50MgL: 0.025, hillN: 1.0, mecMgL: 0.015, mtcMgL: 0.25, renalFraction: 0.1 },
  { slug: 'amoxicillin', name: 'Amoxicillin', drugClass: 'Beta-Lactam Antibiotic', target: 'Bacterial PBP transpeptidase', defaultDoseMg: 500, intervalHours: 8, halfLifeHours: 1.2, kaPerHour: 1.6, vdLiters: 20, bioavailabilityF: 0.8, ec50MgL: 4.0, hillN: 1.3, mecMgL: 2.0, mtcMgL: 45, renalFraction: 0.85 },
  { slug: 'ciprofloxacin', name: 'Ciprofloxacin', drugClass: 'Fluoroquinolone', target: 'DNA gyrase / Topo IV', defaultDoseMg: 500, intervalHours: 12, halfLifeHours: 4.0, kaPerHour: 1.4, vdLiters: 160, bioavailabilityF: 0.72, ec50MgL: 1.2, hillN: 1.2, mecMgL: 0.5, mtcMgL: 8.0, renalFraction: 0.65 },
  { slug: 'metronidazole', name: 'Metronidazole', drugClass: 'Nitroimidazole', target: 'Anaerobic DNA strand break', defaultDoseMg: 500, intervalHours: 8, halfLifeHours: 8.0, kaPerHour: 1.6, vdLiters: 52, bioavailabilityF: 0.95, ec50MgL: 6.0, hillN: 1.2, mecMgL: 4.0, mtcMgL: 40, renalFraction: 0.2 },
  { slug: 'isoniazid', name: 'Isoniazid', drugClass: 'Antimycobacterial', target: 'Mycolic acid InhA', defaultDoseMg: 300, intervalHours: 24, halfLifeHours: 2.5, kaPerHour: 1.8, vdLiters: 42, bioavailabilityF: 0.9, ec50MgL: 1.8, hillN: 1.1, mecMgL: 1.0, mtcMgL: 12, renalFraction: 0.3 },
  { slug: 'paracetamol', name: 'Paracetamol', drugClass: 'Analgesic / Antipyretic', target: 'Central COX / POX site', defaultDoseMg: 500, intervalHours: 6, halfLifeHours: 2.4, kaPerHour: 2.0, vdLiters: 65, bioavailabilityF: 0.85, ec50MgL: 8.0, hillN: 1.1, mecMgL: 5.0, mtcMgL: 25, renalFraction: 0.1 },
  { slug: 'ibuprofen', name: 'Ibuprofen', drugClass: 'NSAID', target: 'COX-1 / COX-2', defaultDoseMg: 400, intervalHours: 8, halfLifeHours: 2.0, kaPerHour: 1.8, vdLiters: 10, bioavailabilityF: 0.9, ec50MgL: 15, hillN: 1.2, mecMgL: 10, mtcMgL: 70, renalFraction: 0.15 },
  { slug: 'morphine', name: 'Morphine', drugClass: 'Opioid Analgesic', target: 'Mu-opioid GPCR (OPRM1)', defaultDoseMg: 15, intervalHours: 4, halfLifeHours: 2.8, kaPerHour: 1.4, vdLiters: 210, bioavailabilityF: 0.3, ec50MgL: 0.02, hillN: 1.3, mecMgL: 0.01, mtcMgL: 0.08, renalFraction: 0.7 },
  { slug: 'diazepam', name: 'Diazepam', drugClass: 'Benzodiazepine', target: 'GABA-A allosteric site', defaultDoseMg: 5, intervalHours: 12, halfLifeHours: 32, kaPerHour: 1.8, vdLiters: 80, bioavailabilityF: 0.94, ec50MgL: 0.15, hillN: 1.1, mecMgL: 0.1, mtcMgL: 1.2, renalFraction: 0.1 },
  { slug: 'phenytoin', name: 'Phenytoin', drugClass: 'Antiseizure', target: 'Voltage-gated Na+ channel', defaultDoseMg: 100, intervalHours: 8, halfLifeHours: 22, kaPerHour: 0.5, vdLiters: 48, bioavailabilityF: 0.85, ec50MgL: 12, hillN: 1.3, mecMgL: 10, mtcMgL: 20, renalFraction: 0.05 },
  { slug: 'sertraline', name: 'Sertraline', drugClass: 'SSRI', target: 'SERT (SLC6A4)', defaultDoseMg: 50, intervalHours: 24, halfLifeHours: 26, kaPerHour: 0.5, vdLiters: 1400, bioavailabilityF: 0.44, ec50MgL: 0.02, hillN: 1.0, mecMgL: 0.01, mtcMgL: 0.2, renalFraction: 0.05 },
  { slug: 'haloperidol', name: 'Haloperidol', drugClass: 'Antipsychotic', target: 'Dopamine D2 receptor', defaultDoseMg: 2, intervalHours: 12, halfLifeHours: 18, kaPerHour: 0.7, vdLiters: 900, bioavailabilityF: 0.6, ec50MgL: 0.004, hillN: 1.1, mecMgL: 0.002, mtcMgL: 0.015, renalFraction: 0.05 },
  { slug: 'levodopa', name: 'Levodopa', drugClass: 'Dopamine Precursor', target: 'Nigrostriatal AADC', defaultDoseMg: 100, intervalHours: 6, halfLifeHours: 1.5, kaPerHour: 2.0, vdLiters: 60, bioavailabilityF: 0.35, ec50MgL: 0.5, hillN: 1.2, mecMgL: 0.3, mtcMgL: 3.0, renalFraction: 0.15 },
  { slug: 'cetirizine', name: 'Cetirizine', drugClass: '2nd-Gen Antihistamine', target: 'Peripheral H1 receptor', defaultDoseMg: 10, intervalHours: 24, halfLifeHours: 8.3, kaPerHour: 1.6, vdLiters: 35, bioavailabilityF: 0.7, ec50MgL: 0.1, hillN: 1.0, mecMgL: 0.05, mtcMgL: 0.9, renalFraction: 0.75 },
  { slug: 'prednisolone', name: 'Prednisolone', drugClass: 'Glucocorticoid', target: 'Cytosolic GR (NR3C1)', defaultDoseMg: 20, intervalHours: 24, halfLifeHours: 3.2, kaPerHour: 1.5, vdLiters: 42, bioavailabilityF: 0.82, ec50MgL: 0.12, hillN: 1.1, mecMgL: 0.06, mtcMgL: 1.0, renalFraction: 0.2 },
  { slug: 'dexamethasone', name: 'Dexamethasone', drugClass: 'Potent Glucocorticoid', target: 'Cytosolic GR (NR3C1)', defaultDoseMg: 4, intervalHours: 24, halfLifeHours: 4.5, kaPerHour: 1.5, vdLiters: 75, bioavailabilityF: 0.8, ec50MgL: 0.018, hillN: 1.1, mecMgL: 0.008, mtcMgL: 0.15, renalFraction: 0.15 },
  { slug: 'allopurinol', name: 'Allopurinol', drugClass: 'Xanthine Oxidase Inhibitor', target: 'Xanthine oxidoreductase', defaultDoseMg: 100, intervalHours: 24, halfLifeHours: 18, kaPerHour: 1.1, vdLiters: 90, bioavailabilityF: 0.78, ec50MgL: 1.2, hillN: 1.1, mecMgL: 0.5, mtcMgL: 8.0, renalFraction: 0.85 },
] as const

export interface MultiDosePkPdInput {
  readonly drug: BundledDrugPkProfile
  readonly doseMg: number
  readonly intervalHours: number
  readonly renalClFactor: number
  readonly totalHours?: number
  readonly stepHours?: number
}

export interface PkPdTimepoint {
  readonly hour: number
  readonly concMgL: number
  readonly effectPct: number
}

export interface MultiDosePkPdResult {
  readonly effectiveHalfLifeHours: number
  readonly peakMgL: number
  readonly troughLastMgL: number
  readonly meanEffectLastIntervalPct: number
  readonly timeInTherapeuticWindowPct: number
  readonly supraToxicFlag: boolean
  readonly points: readonly PkPdTimepoint[]
}

export function resolveDrugForMechanism(mechanismId?: string | null): BundledDrugPkProfile {
  if (mechanismId) {
    const match = BUNDLED_RDKIT_DRUGS.find((d) => d.mechanismIds?.includes(mechanismId))
    if (match) return match
  }
  return BUNDLED_RDKIT_DRUGS[0]!
}

export function simulateMultiDosePkPd(input: MultiDosePkPdInput): MultiDosePkPdResult {
  const { drug } = input
  const doseMg = Math.max(0.5, input.doseMg)
  const intervalHours = Math.max(2, Math.min(48, input.intervalHours))
  const renalScale = Math.max(0.15, Math.min(1.8, input.renalClFactor))
  const totalHours = input.totalHours ?? 72
  const stepHours = input.stepHours ?? 0.5

  const keBase = Math.LN2 / Math.max(0.25, drug.halfLifeHours)
  // Partition total elimination into renal vs non-renal clearance
  const clearanceScale = (1 - drug.renalFraction) + drug.renalFraction * renalScale
  const ke = Math.max(0.004, keBase * clearanceScale)
  const ka = Math.abs(drug.kaPerHour - ke) < 1e-4 ? ke + 0.02 : drug.kaPerHour
  const coeff = (drug.bioavailabilityF * doseMg * ka) / (drug.vdLiters * (ka - ke))

  const doseTimes: number[] = []
  for (let td = 0; td < totalHours; td += intervalHours) doseTimes.push(td)

  const points: PkPdTimepoint[] = []
  let peakMgL = 0
  let troughLastMgL = 0
  let lastIntEffectSum = 0
  let lastIntCount = 0

  for (let t = 0; t <= totalHours + 1e-9; t += stepHours) {
    let c = 0
    for (const td of doseTimes) {
      if (t >= td) {
        const dt = t - td
        c += Math.max(0, coeff * (Math.exp(-ke * dt) - Math.exp(-ka * dt)))
      }
    }
    const cPow = Math.pow(Math.max(0, c), drug.hillN)
    const ecPow = Math.pow(Math.max(1e-6, drug.ec50MgL), drug.hillN)
    const effectPct = 100 * (cPow / (ecPow + cPow))
    if (c > peakMgL) peakMgL = c
    if (Math.abs(t - totalHours) < stepHours * 0.6) troughLastMgL = c
    if (t >= totalHours - intervalHours) {
      lastIntEffectSum += effectPct
      lastIntCount += 1
    }
    points.push({
      hour: Math.round(t * 10) / 10,
      concMgL: Math.round(c * 10000) / 10000,
      effectPct: Math.round(effectPct * 10) / 10,
    })
  }

  const inWindow = points.filter((p) => p.concMgL >= drug.mecMgL && p.concMgL <= drug.mtcMgL).length
  return {
    effectiveHalfLifeHours: Math.round((Math.LN2 / ke) * 10) / 10,
    peakMgL: Math.round(peakMgL * 10000) / 10000,
    troughLastMgL: Math.round(troughLastMgL * 10000) / 10000,
    meanEffectLastIntervalPct: lastIntCount > 0 ? Math.round((lastIntEffectSum / lastIntCount) * 10) / 10 : 0,
    timeInTherapeuticWindowPct: Math.round((inWindow / Math.max(1, points.length)) * 100),
    supraToxicFlag: points.some((p) => p.concMgL > drug.mtcMgL),
    points,
  }
}
