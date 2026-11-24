/**
 * PanaceaMed OS — Universal Demographic Anatomy & 14-Tier Quantum-to-Human Digital Twin Engine ("FSD-15 Bio-Telemetry").
 *
 * Pure, deterministic scientific education & simulation dataset linking:
 *   Quantum Bioenergetics -> Chemical Elements (13) -> Biochemical Compounds (11) ->
 *   DNA Double Strand (5'->3' / 3'->5') -> RNA & 64-Codon Translation -> Organelles ->
 *   Specialized Cells -> Tissues -> Organs -> 10 Organ Systems -> 10 Inclusive Human
 *   Demographic Personas (Wanita, Eldest, Nenek, Kakek, Bayi, Bayi Kembar, Autism,
 *   Anak Laki-laki, Anak Perempuan, Ibu Hamil).
 *
 * Epistemic & Dignity Invariants (Constitutional Laws I & II):
 * - Every simulation output is explicitly tagged `MECHANISTIC_EDUCATIONAL_SIMULATION`.
 * - Quantum entries are strictly grounded in established biophysics approximations
 *   (Marcus/Hopfield electron tunneling, WKB proton tunneling) — never pseudoscience.
 * - Autism Spectrum profile models sensory-gating & autonomic neurophysiology with calm,
 *   sensory-friendly UI presets and dignity — zero caricatured anatomy or diagnostic claims.
 */

import {
  DEMOGRAPHIC_COHORTS,
  synthesizeAnthropometryManifold,
  type AnthropometryManifold,
  type DemographicCohortId,
} from './demographicManifold'

export type VisualDemographicId =
  | 'wanita'
  | 'eldest'
  | 'nenek'
  | 'kakek'
  | 'bayi'
  | 'bayi_kembar'
  | 'autism'
  | 'anak_laki'
  | 'anak_perempuan'
  | 'ibu_hamil'

export interface VisualDemographicPreset {
  readonly id: VisualDemographicId
  readonly labelId: string
  readonly labelEn: string
  readonly baseCohortId: DemographicCohortId
  readonly defaultAgeYears: number
  readonly biologicalSex: 'male' | 'female'
  readonly heightCm: number
  readonly weightKg: number
  readonly restingHrBpm: number
  readonly restingRrPerMin: number
  readonly normalSpo2Pct: number
  readonly strokeVolumeMl: number
  readonly isTwinProfile?: boolean
  readonly isSensoryFriendlyNeuro?: boolean
  readonly gestationalWeek?: number
  readonly silhouetteProfile: 'adult_female' | 'senior_kyphotic' | 'infant' | 'twin_infants' | 'child' | 'pregnant'
  readonly anatomyHighlights: readonly string[]
  readonly physiologyFocus: string
  readonly keywords: readonly string[]
}

export const UNIVERSAL_VISUAL_DEMOGRAPHIC_PRESETS: readonly VisualDemographicPreset[] = [
  {
    id: 'wanita',
    labelId: 'Wanita Dewasa',
    labelEn: 'Adult Female',
    baseCohortId: 'YAD_F',
    defaultAgeYears: 29,
    biologicalSex: 'female',
    heightCm: 161,
    weightKg: 56,
    restingHrBpm: 70,
    restingRrPerMin: 15,
    normalSpo2Pct: 98,
    strokeVolumeMl: 65,
    silhouetteProfile: 'adult_female',
    anatomyHighlights: ['Cardiovascular-Endocrine Estrogen Axis', 'Pelvic & Reproductive Architecture', 'Bone Density Peak'],
    physiologyFocus: 'Balanced cyclic endocrine-cardiovascular regulation & metabolic homeostasis.',
    keywords: ['wanita', 'perempuan dewasa', 'female', 'woman'],
  },
  {
    id: 'eldest',
    labelId: 'Eldest (88+ thn)',
    labelEn: 'Eldest / Longevity (88+ y)',
    baseCohortId: 'LON_F',
    defaultAgeYears: 90,
    biologicalSex: 'female',
    heightCm: 150,
    weightKg: 48,
    restingHrBpm: 66,
    restingRrPerMin: 17,
    normalSpo2Pct: 95,
    strokeVolumeMl: 54,
    silhouetteProfile: 'senior_kyphotic',
    anatomyHighlights: ['Senescence & Sarcopenia Reserve', 'Arterial Compliance Stiffness', 'High-Clarity Accessible Mode'],
    physiologyFocus: 'Longevity frailty reserve, baroreceptor blunting, and renal GFR adaptation.',
    keywords: ['eldest', 'centenarian', 'lansia lanjut', 'sepuh'],
  },
  {
    id: 'nenek',
    labelId: 'Nenek (74 thn)',
    labelEn: 'Grandmother / Senior Female',
    baseCohortId: 'GER_F',
    defaultAgeYears: 74,
    biologicalSex: 'female',
    heightCm: 154,
    weightKg: 54,
    restingHrBpm: 68,
    restingRrPerMin: 16,
    normalSpo2Pct: 96,
    strokeVolumeMl: 58,
    silhouetteProfile: 'senior_kyphotic',
    anatomyHighlights: ['Post-Menopausal Trabecular Bone', 'Thoracic Posture & Diaphragm', 'Vascular Elasticity'],
    physiologyFocus: 'Osteoprotective bone remodeling, cardiopulmonary reserve, and thermoregulation.',
    keywords: ['nenek', 'grandmother', 'oma', 'eyang putri', 'lansia wanita'],
  },
  {
    id: 'kakek',
    labelId: 'Kakek (77 thn)',
    labelEn: 'Grandfather / Senior Male',
    baseCohortId: 'GER_M',
    defaultAgeYears: 77,
    biologicalSex: 'male',
    heightCm: 166,
    weightKg: 65,
    restingHrBpm: 67,
    restingRrPerMin: 16,
    normalSpo2Pct: 96,
    strokeVolumeMl: 64,
    silhouetteProfile: 'senior_kyphotic',
    anatomyHighlights: ['Cardiorenal Vascular Compliance', 'Skeletal Muscle Sarcopenia Index', 'Articular Joint Cartilage'],
    physiologyFocus: 'Systolic pulse-pressure amplification, muscle protein turnover, and autonomic recovery.',
    keywords: ['kakek', 'grandfather', 'opa', 'eyang kakung', 'lansia pria'],
  },
  {
    id: 'bayi',
    labelId: 'Bayi (6 bln)',
    labelEn: 'Infant (6 mo)',
    baseCohortId: 'INF_F',
    defaultAgeYears: 0.5,
    biologicalSex: 'female',
    heightCm: 66,
    weightKg: 7.4,
    restingHrBpm: 128,
    restingRrPerMin: 34,
    normalSpo2Pct: 98,
    strokeVolumeMl: 12,
    silhouetteProfile: 'infant',
    anatomyHighlights: ['1:4 Cranial-to-Body Ratio', 'Open Fontanelles & Growth Plates', 'Brown Adipose Thermogenesis'],
    physiologyFocus: 'High metabolic rate per kg, rate-dependent cardiac output, rapid alveolarization.',
    keywords: ['bayi', 'infant', 'baby', 'neonatus'],
  },
  {
    id: 'bayi_kembar',
    labelId: 'Bayi Kembar (Twin A/B)',
    labelEn: 'Twins (Neonatal / Gestational Dual)',
    baseCohortId: 'NEO_TRM_F',
    defaultAgeYears: 0.15,
    biologicalSex: 'female',
    heightCm: 54,
    weightKg: 4.1,
    restingHrBpm: 136,
    restingRrPerMin: 38,
    normalSpo2Pct: 97,
    strokeVolumeMl: 9,
    isTwinProfile: true,
    silhouetteProfile: 'twin_infants',
    anatomyHighlights: ['Dual Twin-A / Twin-B Vital Sync', 'Placental Perfusion Balance (Educational)', 'Surface-Area Thermoregulation'],
    physiologyFocus: 'Synchronized dual-neonate cardiopulmonary monitoring & twin growth symmetry.',
    keywords: ['bayi kembar', 'kembar', 'twins', 'twin baby', 'gemelli'],
  },
  {
    id: 'autism',
    labelId: 'Autism / Neurodivergent',
    labelEn: 'Autism Spectrum (Sensory-Friendly)',
    baseCohortId: 'CHD_M',
    defaultAgeYears: 9,
    biologicalSex: 'male',
    heightCm: 133,
    weightKg: 29,
    restingHrBpm: 88,
    restingRrPerMin: 20,
    normalSpo2Pct: 98,
    strokeVolumeMl: 36,
    isSensoryFriendlyNeuro: true,
    silhouetteProfile: 'child',
    anatomyHighlights: ['Cortical Sensory-Gating Network', 'Autonomic Vagal HRV Reactivity', 'Circadian Melatonin & Gut-Brain Axis'],
    physiologyFocus: 'Calm sensory-friendly telemetry highlighting auditory/tactile load & autonomic balance (non-diagnostic).',
    keywords: ['autism', 'autisme', 'asd', 'neurodivergent', 'spektrum autisme'],
  },
  {
    id: 'anak_laki',
    labelId: 'Anak Laki-laki (8 thn)',
    labelEn: 'Boy (8 y)',
    baseCohortId: 'CHD_M',
    defaultAgeYears: 8,
    biologicalSex: 'male',
    heightCm: 128,
    weightKg: 26,
    restingHrBpm: 90,
    restingRrPerMin: 21,
    normalSpo2Pct: 99,
    strokeVolumeMl: 35,
    silhouetteProfile: 'child',
    anatomyHighlights: ['Active Epiphyseal Growth Plates', 'Expanding Alveolar Surface', 'Neuromuscular Motor Coordination'],
    physiologyFocus: 'Linear skeletal growth velocity, aerobic reserve, and immune maturation.',
    keywords: ['anak laki laki', 'anak laki-laki', 'boy', 'child male'],
  },
  {
    id: 'anak_perempuan',
    labelId: 'Anak Perempuan (8 thn)',
    labelEn: 'Girl (8 y)',
    baseCohortId: 'CHD_F',
    defaultAgeYears: 8,
    biologicalSex: 'female',
    heightCm: 127,
    weightKg: 25,
    restingHrBpm: 92,
    restingRrPerMin: 21,
    normalSpo2Pct: 99,
    strokeVolumeMl: 34,
    silhouetteProfile: 'child',
    anatomyHighlights: ['Active Epiphyseal Growth Plates', 'Early Endocrine Axis Readiness', 'Cardiopulmonary Growth'],
    physiologyFocus: 'Skeletal mineralization, neurocognitive synaptic pruning, and metabolic growth.',
    keywords: ['anak perempuan', 'girl', 'child female'],
  },
  {
    id: 'ibu_hamil',
    labelId: 'Ibu Hamil (30 mgg)',
    labelEn: 'Pregnant Adult (Week 30)',
    baseCohortId: 'MAT_PREG',
    defaultAgeYears: 30,
    biologicalSex: 'female',
    heightCm: 160,
    weightKg: 66,
    restingHrBpm: 84,
    restingRrPerMin: 18,
    normalSpo2Pct: 98,
    strokeVolumeMl: 78,
    gestationalWeek: 30,
    silhouetteProfile: 'pregnant',
    anatomyHighlights: ['Maternal-Fetal Placental Exchange', '+42% Plasma Volume & CO Gain', 'IVC Left-Lateral Perfusion'],
    physiologyFocus: 'Physiologic hypervolemia, lowered SVR, elevated minute ventilation, fetal O2 transport.',
    keywords: ['ibu hamil', 'hamil', 'pregnant', 'maternal'],
  },
] as const

export function resolveVisualDemographicPreset(queryOrId: string): VisualDemographicPreset {
  const q = queryOrId.trim().toLowerCase()
  const exact = UNIVERSAL_VISUAL_DEMOGRAPHIC_PRESETS.find((p) => p.id === q)
  if (exact) return exact
  let bestPreset: VisualDemographicPreset | undefined
  let bestLen = 0
  for (const preset of UNIVERSAL_VISUAL_DEMOGRAPHIC_PRESETS) {
    for (const kw of preset.keywords) {
      if (q.includes(kw) && kw.length > bestLen) {
        bestLen = kw.length
        bestPreset = preset
      }
    }
  }
  return bestPreset ?? UNIVERSAL_VISUAL_DEMOGRAPHIC_PRESETS[0]
}

// ── 14-TIER MULTISCALE SCIENTIFIC DATABASE (QUANTUM -> ELEMENT -> COMPOUND -> DNA/RNA -> ORGANELLE -> CELL -> TISSUE -> ORGAN) ──

export type MultiscaleTierId =
  | 'quantum'
  | 'element'
  | 'compound'
  | 'dna_strand'
  | 'rna'
  | 'organelle'
  | 'cell'
  | 'tissue'
  | 'organ'
  | 'organ_system'
  | 'human_twin'

export const MULTISCALE_TIER_ORDER: readonly { readonly id: MultiscaleTierId; readonly label: string; readonly scaleLabel: string }[] = [
  { id: 'quantum', label: 'Quantum', scaleLabel: '10⁻¹²–10⁻¹⁰ m' },
  { id: 'element', label: 'Unsur Kimia', scaleLabel: '10⁻¹⁰ m (Å)' },
  { id: 'compound', label: 'Senyawa', scaleLabel: '10⁻⁹ m (nm)' },
  { id: 'dna_strand', label: 'DNA Strand', scaleLabel: '2 nm helix' },
  { id: 'rna', label: 'RNA / Codon', scaleLabel: '5–50 nm' },
  { id: 'organelle', label: 'Organelles', scaleLabel: '0.1–5 µm' },
  { id: 'cell', label: 'Cell', scaleLabel: '10–100 µm' },
  { id: 'tissue', label: 'Jaringan', scaleLabel: '0.1–5 mm' },
  { id: 'organ', label: 'Organ', scaleLabel: '5–30 cm' },
  { id: 'organ_system', label: 'Sistem Organ', scaleLabel: '0.5–1.8 m' },
  { id: 'human_twin', label: 'Digital Twin', scaleLabel: 'Whole Human' },
] as const

export interface ChemicalElementSpec {
  readonly symbol: string
  readonly name: string
  readonly atomicNumber: number
  readonly atomicMassDa: number
  readonly humanBodyMassPct: number
  readonly referenceRange: string
  readonly primarySystem: string
  readonly biologicalRole: string
}

export const CHEMICAL_ELEMENTS_DATASET: readonly ChemicalElementSpec[] = [
  { symbol: 'O', name: 'Oxygen', atomicNumber: 8, atomicMassDa: 15.999, humanBodyMassPct: 65.0, referenceRange: 'PaO2 80–100 mmHg', primarySystem: 'respiratory', biologicalRole: 'Terminal electron acceptor in mitochondrial OXPHOS ATP synthesis.' },
  { symbol: 'C', name: 'Carbon', atomicNumber: 6, atomicMassDa: 12.011, humanBodyMassPct: 18.5, referenceRange: 'Organic backbone', primarySystem: 'metabolic', biologicalRole: 'Tetravalent backbone of DNA, proteins, lipids, and carbohydrates.' },
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, atomicMassDa: 1.008, humanBodyMassPct: 9.5, referenceRange: 'pH 7.35–7.45', primarySystem: 'renal', biologicalRole: 'Proton gradient (ΔpH) powering mitochondrial ATP synthase & acid-base balance.' },
  { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, atomicMassDa: 14.007, humanBodyMassPct: 3.2, referenceRange: 'BUN 7–20 mg/dL', primarySystem: 'digestive', biologicalRole: 'Amino groups of peptides, purine/pyrimidine DNA bases, nitric oxide (NO).' },
  { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, atomicMassDa: 40.078, humanBodyMassPct: 1.5, referenceRange: '8.6–10.2 mg/dL', primarySystem: 'cardiovascular', biologicalRole: 'Excitation-contraction coupling in cardiomyocytes, synaptic exocytosis, hydroxyapatite bone.' },
  { symbol: 'P', name: 'Phosphorus', atomicNumber: 15, atomicMassDa: 30.974, humanBodyMassPct: 1.0, referenceRange: '2.5–4.5 mg/dL', primarySystem: 'musculoskeletal', biologicalRole: 'Phosphodiester DNA backbone, ATP high-energy bonds, cell membrane phospholipids.' },
  { symbol: 'K', name: 'Potassium', atomicNumber: 19, atomicMassDa: 39.098, humanBodyMassPct: 0.4, referenceRange: '3.5–5.0 mEq/L', primarySystem: 'cardiovascular', biologicalRole: 'Primary intracellular cation setting resting membrane potential (-85 mV).' },
  { symbol: 'Na', name: 'Sodium', atomicNumber: 11, atomicMassDa: 22.99, humanBodyMassPct: 0.2, referenceRange: '135–145 mEq/L', primarySystem: 'nervous', biologicalRole: 'Primary extracellular cation driving action-potential depolarization & ECF volume.' },
  { symbol: 'Cl', name: 'Chloride', atomicNumber: 17, atomicMassDa: 35.45, humanBodyMassPct: 0.2, referenceRange: '98–106 mEq/L', primarySystem: 'respiratory', biologicalRole: 'GABAergic inhibitory hyperpolarization, CFTR airway hydration, anion gap balance.' },
  { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, atomicMassDa: 24.305, humanBodyMassPct: 0.05, referenceRange: '1.7–2.2 mg/dL', primarySystem: 'metabolic', biologicalRole: 'Essential cofactor stabilizing Mg-ATP complex & >300 enzymatic reactions.' },
  { symbol: 'Fe', name: 'Iron', atomicNumber: 26, atomicMassDa: 55.845, humanBodyMassPct: 0.006, referenceRange: 'Ferritin 30–300 ng/mL', primarySystem: 'hematologic', biologicalRole: 'Ferrous (Fe2+) core of heme binding O2 in hemoglobin & mitochondrial Fe-S clusters.' },
  { symbol: 'Zn', name: 'Zinc', atomicNumber: 30, atomicMassDa: 65.38, humanBodyMassPct: 0.003, referenceRange: '70–120 µg/dL', primarySystem: 'immune', biologicalRole: 'Zinc-finger DNA transcription factors, carbonic anhydrase, T-cell immunity.' },
  { symbol: 'I', name: 'Iodine', atomicNumber: 53, atomicMassDa: 126.904, humanBodyMassPct: 0.0002, referenceRange: 'UIC 100–199 µg/L', primarySystem: 'endocrine', biologicalRole: 'Essential constituent of thyroid hormones T3/T4 governing basal metabolic rate.' },
] as const

export interface BiochemicalCompoundSpec {
  readonly id: string
  readonly formula: string
  readonly name: string
  readonly chebiId: string
  readonly molarMassGmol: number
  readonly normalRange: string
  readonly organCoupling: string
  readonly role: string
}

export const BIOCHEMICAL_COMPOUNDS_DATASET: readonly BiochemicalCompoundSpec[] = [
  { id: 'h2o', formula: 'H₂O', name: 'Water', chebiId: 'CHEBI:15377', molarMassGmol: 18.015, normalRange: '55–65% body mass', organCoupling: 'Kidney / Plasma', role: 'Universal solvent, thermal buffer, osmotic homeostasis.' },
  { id: 'o2', formula: 'O₂', name: 'Dioxygen', chebiId: 'CHEBI:15379', molarMassGmol: 31.999, normalRange: 'SpO2 95–100%', organCoupling: 'Lungs → Heart → Mitochondria', role: 'Drives aerobic oxidative phosphorylation yielding ~30–32 ATP/glucose.' },
  { id: 'co2', formula: 'CO₂', name: 'Carbon Dioxide', chebiId: 'CHEBI:16526', molarMassGmol: 44.01, normalRange: 'PaCO2 35–45 mmHg', organCoupling: 'Tissues → Lungs', role: 'Primary respiratory drive modulator & bicarbonate blood buffer.' },
  { id: 'glucose', formula: 'C₆H₁₂O₆', name: 'D-Glucose', chebiId: 'CHEBI:17634', molarMassGmol: 180.156, normalRange: '70–99 mg/dL fasting', organCoupling: 'Pancreas / Liver / Brain', role: 'Primary glycolytic & cerebral metabolic fuel.' },
  { id: 'atp', formula: 'C₁₀H₁₆N₅O₁₃P₃', name: 'Adenosine Triphosphate (ATP)', chebiId: 'CHEBI:15422', molarMassGmol: 507.18, normalRange: '~50–70 kg/day turnover', organCoupling: 'Mitochondria → Myocardium', role: 'Universal free-energy currency for myosin motors & Na+/K+ pumps.' },
  { id: 'lactate', formula: 'C₃H₆O₃', name: 'L-Lactate', chebiId: 'CHEBI:422', molarMassGmol: 90.08, normalRange: '0.5–2.0 mmol/L', organCoupling: 'Muscle ↔ Liver (Cori)', role: 'Anaerobic glycolytic flux indicator & oxidative shuttle fuel.' },
  { id: 'heme_b', formula: 'C₃₄H₃₂FeN₄O₄', name: 'Heme b', chebiId: 'CHEBI:26355', molarMassGmol: 616.49, normalRange: 'Hb 12–17 g/dL', organCoupling: 'Erythrocyte / Marrow', role: 'Porphyrin-Fe2+ prosthetic group carrying 4 O2 molecules per Hb tetramer.' },
  { id: 'cholesterol', formula: 'C₂₇H₄₆O', name: 'Cholesterol', chebiId: 'CHEBI:16113', molarMassGmol: 386.65, normalRange: 'LDL < 100 mg/dL', organCoupling: 'Liver / Arteries', role: 'Membrane fluidity regulator & steroid hormone precursor.' },
  { id: 'dopamine', formula: 'C₈H₁₁NO₂', name: 'Dopamine', chebiId: 'CHEBI:18243', molarMassGmol: 153.18, normalRange: 'Synaptic nanomolar', organCoupling: 'Basal Ganglia / Prefrontal', role: 'Motor control, reward prediction error, attention & executive drive.' },
  { id: 'serotonin', formula: 'C₁₀H₁₂N₂O', name: 'Serotonin (5-HT)', chebiId: 'CHEBI:28790', molarMassGmol: 176.21, normalRange: 'Raphe / Enterochromaffin', organCoupling: 'Brainstem & Gut-Brain Axis', role: 'Mood, sensory gating, sleep-wake regulation, gut motility.' },
  { id: 'melatonin', formula: 'C₁₃H₁₆N₂O₂', name: 'Melatonin', chebiId: 'CHEBI:16796', molarMassGmol: 232.28, normalRange: 'Nocturnal peak 20–100 pg/mL', organCoupling: 'Pineal Gland / SCN', role: 'Circadian phase synchronization & nocturnal sleep onset.' },
] as const

export interface QuantumBioProcessSpec {
  readonly id: string
  readonly name: string
  readonly equationLabel: string
  readonly epistemicTag: 'THEORETICAL_BIOPHYSICS_EDUCATIONAL'
  readonly physiologicalLink: string
}

export const QUANTUM_BIO_PROCESSES: readonly QuantumBioProcessSpec[] = [
  {
    id: 'electron_tunneling_etc',
    name: 'Mitochondrial Electron Tunneling (Complex I–IV Fe-S)',
    equationLabel: 'k_ET(r) = k₀ · exp(−β·(r − r₀)), β ≈ 1.4 Å⁻¹',
    epistemicTag: 'THEORETICAL_BIOPHYSICS_EDUCATIONAL',
    physiologicalLink: 'Transfers electrons across 8–14 Å protein gaps to pump H+ across inner mitochondrial membrane.',
  },
  {
    id: 'proton_tunneling_enzyme',
    name: 'Enzymatic Hydrogen / Proton Tunneling (WKB Approximation)',
    equationLabel: 'T ≈ exp(−2w·√(2mΔE)/ħ)',
    epistemicTag: 'THEORETICAL_BIOPHYSICS_EDUCATIONAL',
    physiologicalLink: 'Contributes to kinetic isotope effects in dehydrogenases & metabolic catalysis.',
  },
  {
    id: 'radical_pair_spin',
    name: 'Flavoprotein Radical-Pair Singlet–Triplet Spin Dynamics',
    equationLabel: 'P_S(t) = cos²(Δω·t / 2)',
    epistemicTag: 'THEORETICAL_BIOPHYSICS_EDUCATIONAL',
    physiologicalLink: 'Studied in cryptochrome photobiology and reactive-oxygen signaling kinetics.',
  },
] as const

/** Deterministic Marcus/Hopfield relative electron tunneling attenuation factor (r in Angstroms). */
export function computeElectronTunnelingFactor(distanceAngstrom: number, betaPerAngstrom = 1.4): number {
  const r = Number.isFinite(distanceAngstrom) ? Math.max(3.6, Math.min(25, distanceAngstrom)) : 11
  const b = Number.isFinite(betaPerAngstrom) ? Math.max(0.5, Math.min(2.5, betaPerAngstrom)) : 1.4
  return Number(Math.exp(-b * (r - 3.6)).toExponential(3))
}

// ── DNA DOUBLE STRAND, COMPLEMENTARY PAIRING, RNA TRANSCRIPTION & 64-CODON TRANSLATION ──

export interface CuratedGeneLocus {
  readonly symbol: string
  readonly chromosome: string
  readonly organ: string
  readonly codingDna5to3: string
  readonly role: string
}

export const CURATED_GENE_LOCI: readonly CuratedGeneLocus[] = [
  { symbol: 'HBB', chromosome: '11p15.4', organ: 'Erythrocyte / Marrow', codingDna5to3: 'ATGGTGCATCTGACTCCTGAGGAGAAG', role: 'Beta-globin subunit of adult hemoglobin carrying O2.' },
  { symbol: 'MYH7', chromosome: '14q11.2', organ: 'Heart Myocardium', codingDna5to3: 'ATGGGAGATTCGGAGATGGCCGTCTTT', role: 'Beta-myosin heavy chain sarcomere motor protein.' },
  { symbol: 'SCN5A', chromosome: '3p22.2', organ: 'Cardiac Conduction', codingDna5to3: 'ATGGCAAACTTCCTATTACCTCGGGGC', role: 'Voltage-gated Nav1.5 sodium channel driving cardiac upstroke.' },
  { symbol: 'INS', chromosome: '11p15.5', organ: 'Pancreatic Beta-Cell', codingDna5to3: 'ATGGCCCTGTGGATGCGCCTCCTGCCC', role: 'Preproinsulin hormone regulating systemic glucose uptake.' },
  { symbol: 'CFTR', chromosome: '7q31.2', organ: 'Lung Airway Epithelium', codingDna5to3: 'ATGCAGAGGTCGCCTCTGGAAAAGGCC', role: 'cAMP-gated chloride channel preserving airway mucus clearance.' },
  { symbol: 'SHANK3', chromosome: '22q13.33', organ: 'Cortical Synapse', codingDna5to3: 'ATGGACGGCCCCGGGGCCAGCGCCGTG', role: 'Postsynaptic scaffolding protein studied in synaptic plasticity & neurodevelopment.' },
] as const

const CODON_TABLE: Readonly<Record<string, string>> = {
  UUU: 'Phe', UUC: 'Phe', UUA: 'Leu', UUG: 'Leu',
  UCU: 'Ser', UCC: 'Ser', UCA: 'Ser', UCG: 'Ser',
  UAU: 'Tyr', UAC: 'Tyr', UAA: 'STOP', UAG: 'STOP',
  UGU: 'Cys', UGC: 'Cys', UGA: 'STOP', UGG: 'Trp',
  CUU: 'Leu', CUC: 'Leu', CUA: 'Leu', CUG: 'Leu',
  CCU: 'Pro', CCC: 'Pro', CCA: 'Pro', CCG: 'Pro',
  CAU: 'His', CAC: 'His', CAA: 'Gln', CAG: 'Gln',
  CGU: 'Arg', CGC: 'Arg', CGA: 'Arg', CGG: 'Arg',
  AUU: 'Ile', AUC: 'Ile', AUA: 'Ile', AUG: 'Met',
  ACU: 'Thr', ACC: 'Thr', ACA: 'Thr', ACG: 'Thr',
  AAU: 'Asn', AAC: 'Asn', AAA: 'Lys', AAG: 'Lys',
  AGU: 'Ser', AGC: 'Ser', AGA: 'Arg', AGG: 'Arg',
  GUU: 'Val', GUC: 'Val', GUA: 'Val', GUG: 'Val',
  GCU: 'Ala', GCC: 'Ala', GCA: 'Ala', GCG: 'Ala',
  GAU: 'Asp', GAC: 'Asp', GAA: 'Glu', GAG: 'Glu',
  GGU: 'Gly', GGC: 'Gly', GGA: 'Gly', GGG: 'Gly',
}

const COMPLEMENT_BASE: Readonly<Record<string, string>> = { A: 'T', T: 'A', C: 'G', G: 'C' }

export interface DnaToProteinAnalysis {
  readonly codingStrand5to3: string
  readonly templateStrand3to5: string
  readonly mrna5to3: string
  readonly codons: readonly string[]
  readonly aminoAcids: readonly string[]
  readonly gcContentPct: number
  readonly hydrogenBondCount: number
  readonly wallaceTmC: number
}

export function analyzeDnaStrandAndTranslation(rawDna: string): DnaToProteinAnalysis {
  const clean = rawDna.toUpperCase().replace(/[^ATCG]/g, '') || 'ATG'
  let template = ''
  let gc = 0
  let hBonds = 0
  for (const ch of clean) {
    template += COMPLEMENT_BASE[ch] ?? 'A'
    if (ch === 'G' || ch === 'C') {
      gc++
      hBonds += 3
    } else {
      hBonds += 2
    }
  }
  const mrna = clean.replace(/T/g, 'U')
  const codons: string[] = []
  const aminoAcids: string[] = []
  for (let i = 0; i + 3 <= mrna.length; i += 3) {
    const codon = mrna.slice(i, i + 3)
    codons.push(codon)
    const aa = CODON_TABLE[codon] ?? 'Xaa'
    aminoAcids.push(aa)
    if (aa === 'STOP') break
  }
  const gcContentPct = Math.round((gc / clean.length) * 1000) / 10
  const at = clean.length - gc
  const wallaceTmC = 2 * at + 4 * gc

  return {
    codingStrand5to3: clean,
    templateStrand3to5: template,
    mrna5to3: mrna,
    codons,
    aminoAcids,
    gcContentPct,
    hydrogenBondCount: hBonds,
    wallaceTmC,
  }
}

export function simulatePointMutationEffect(
  rawDna: string,
  baseIndex: number,
  newBase: 'A' | 'T' | 'C' | 'G',
): {
  readonly original: DnaToProteinAnalysis
  readonly mutated: DnaToProteinAnalysis
  readonly classification: 'UNCHANGED' | 'SILENT' | 'MISSENSE' | 'NONSENSE'
} {
  const original = analyzeDnaStrandAndTranslation(rawDna)
  const chars = original.codingStrand5to3.split('')
  const idx = Math.max(0, Math.min(chars.length - 1, Math.floor(baseIndex)))
  if (chars[idx] === newBase) {
    return { original, mutated: original, classification: 'UNCHANGED' }
  }
  chars[idx] = newBase
  const mutated = analyzeDnaStrandAndTranslation(chars.join(''))
  const origSeq = original.aminoAcids.join('-')
  const mutSeq = mutated.aminoAcids.join('-')
  let classification: 'UNCHANGED' | 'SILENT' | 'MISSENSE' | 'NONSENSE' = 'SILENT'
  if (mutated.aminoAcids.includes('STOP') && !original.aminoAcids.includes('STOP')) {
    classification = 'NONSENSE'
  } else if (origSeq !== mutSeq) {
    classification = 'MISSENSE'
  }
  return { original, mutated, classification }
}

// ── ORGANELLE -> CELL -> TISSUE REFERENCE CATALOG ──

export const ORGANELLES_DATASET = [
  { id: 'nucleus', name: 'Nucleus', role: 'Stores 3.1 Gb nuclear DNA, chromatin & transcription machinery.' },
  { id: 'mitochondrion', name: 'Mitochondrion', role: 'OXPHOS Complexes I–V generating >90% of cellular ATP.' },
  { id: 'sarcoplasmic_reticulum', name: 'Sarcoplasmic Reticulum', role: 'Releases Ca²⁺ transients coupling action potentials to contraction.' },
  { id: 'ribosome', name: '80S Ribosome', role: 'Translates mRNA codons into folded polypeptide chains.' },
  { id: 'er_golgi', name: 'ER & Golgi Apparatus', role: 'Folds, glycosylates, and sorts secreted hormones & receptors.' },
  { id: 'lysosome', name: 'Lysosome / Autophagosome', role: 'Recycles damaged organelles (mitophagy) & cellular longevity.' },
] as const

export const SPECIALIZED_CELLS_DATASET = [
  { id: 'cardiomyocyte', name: 'Cardiomyocyte', organ: 'Heart', specialty: '~30% mitochondrial volume; continuous rhythmic Ca²⁺ contraction.' },
  { id: 'neuron', name: 'Cortical Neuron', organ: 'Brain', specialty: 'Action-potential signaling, synaptic plasticity & sensory gating.' },
  { id: 'erythrocyte', name: 'Erythrocyte (RBC)', organ: 'Blood', specialty: '270M hemoglobin tetramers/cell transporting O₂ via heme Fe²⁺.' },
  { id: 'pneumocyte_2', name: 'Type II Pneumocyte', organ: 'Lung', specialty: 'Secretes pulmonary surfactant preventing alveolar collapse.' },
  { id: 'hepatocyte', name: 'Hepatocyte', organ: 'Liver', specialty: 'CYP450 metabolism, gluconeogenesis, lipid & bile regulation.' },
  { id: 'podocyte', name: 'Renal Podocyte', organ: 'Kidney', specialty: 'Slit-diaphragm size/charge glomerular filtration barrier.' },
  { id: 'beta_cell', name: 'Pancreatic Beta-Cell', organ: 'Pancreas', specialty: 'ATP-sensitive K⁺ channel glucose sensing & insulin exocytosis.' },
  { id: 'dendritic', name: 'Dendritic Cell', organ: 'Immune', specialty: 'Antigen presentation bridging innate & adaptive vaccine immunity.' },
] as const

export const TISSUES_DATASET = [
  { id: 'myocardium', name: 'Cardiac Striated Myocardium', organ: 'Heart', cellLink: 'cardiomyocyte' },
  { id: 'alveolar_barrier', name: 'Alveolar-Capillary Membrane (0.5 µm)', organ: 'Lung', cellLink: 'pneumocyte_2' },
  { id: 'hepatic_lobule', name: 'Hepatic Sinusoidal Lobule', organ: 'Liver', cellLink: 'hepatocyte' },
  { id: 'glomerulus', name: 'Renal Glomerular Capillary Tuft', organ: 'Kidney', cellLink: 'podocyte' },
  { id: 'cortical_microcircuit', name: 'Cerebral Cortical Microcircuit', organ: 'Brain', cellLink: 'neuron' },
  { id: 'trabecular_bone', name: 'Trabecular Cancellous Bone', organ: 'Skeleton', cellLink: 'osteocyte' },
] as const

// ── FSD-15 LIVE INSIDE-BODY DIGITAL TWIN TELEMETRY SIMULATOR ──

export interface Fsd15TwinSimulationInput {
  readonly demographicId: VisualDemographicId
  readonly heartRateBpm?: number
  readonly spo2Pct?: number
  readonly glucoseMgDl?: number
  readonly exertionMet?: number
  readonly geneSymbol?: string
  readonly tunnelingGapAngstrom?: number
}

export interface Fsd15DigitalTwinFrame {
  readonly epistemicClass: 'MECHANISTIC_EDUCATIONAL_SIMULATION'
  readonly notClinicalAdvice: true
  readonly preset: VisualDemographicPreset
  readonly manifold: AnthropometryManifold
  readonly sensoryFriendlyUiMode: boolean
  readonly twinDualTelemetry?: {
    readonly twinAHrBpm: number
    readonly twinBHrBpm: number
    readonly twinWeightSymmetryPct: number
  }
  readonly organLevel: {
    readonly heartRateBpm: number
    readonly strokeVolumeMl: number
    readonly cardiacOutputLMin: number
    readonly spo2Pct: number
    readonly oxygenDeliveryMlMin: number
    readonly alveolarVentilationLMin: number
  }
  readonly cellularLevel: {
    readonly ca2TransientHz: number
    readonly estimatedAtpTurnoverMmolMin: number
    readonly erythrocyteO2BoundPct: number
    readonly glucoseUtilizationState: 'BASAL' | 'ELEVATED_EXERTION' | 'HYPERGLYCEMIC_LOAD' | 'HYPOGLYCEMIC_ALERT'
  }
  readonly organelleQuantumLevel: {
    readonly atpSynthaseRotorRpmEdu: number
    readonly electronTunnelingGapAngstrom: number
    readonly electronTunnelingAttenuation: number
    readonly protonGradientMv: number
  }
  readonly genomicStream: {
    readonly gene: CuratedGeneLocus
    readonly translation: DnaToProteinAnalysis
  }
  readonly vectorLanes: readonly {
    readonly id: string
    readonly label: string
    readonly flowPct: number
    readonly color: string
    readonly unitLabel: string
  }[]
}

export function simulateFsd15DigitalTwinFrame(input: Fsd15TwinSimulationInput): Fsd15DigitalTwinFrame {
  const preset = resolveVisualDemographicPreset(input.demographicId)
  const cohortMeta = DEMOGRAPHIC_COHORTS[preset.baseCohortId]
  const manifold = synthesizeAnthropometryManifold({
    ageYears: preset.defaultAgeYears,
    biologicalSex: preset.biologicalSex,
    heightCm: preset.heightCm,
    weightKg: preset.weightKg,
    gestationalWeek: preset.gestationalWeek,
  })

  const exertion = typeof input.exertionMet === 'number' && Number.isFinite(input.exertionMet)
    ? Math.max(1, Math.min(12, input.exertionMet))
    : 1.5
  const hr = typeof input.heartRateBpm === 'number' && Number.isFinite(input.heartRateBpm)
    ? Math.max(40, Math.min(200, Math.round(input.heartRateBpm)))
    : Math.round(preset.restingHrBpm + (exertion - 1) * 11)
  const spo2 = typeof input.spo2Pct === 'number' && Number.isFinite(input.spo2Pct)
    ? Math.max(70, Math.min(100, Math.round(input.spo2Pct)))
    : preset.normalSpo2Pct
  const glucose = typeof input.glucoseMgDl === 'number' && Number.isFinite(input.glucoseMgDl)
    ? Math.max(45, Math.min(400, Math.round(input.glucoseMgDl)))
    : 92

  const svBoost = 1 + Math.min(0.28, (exertion - 1) * 0.04)
  const strokeVolumeMl = Math.round(preset.strokeVolumeMl * svBoost * 10) / 10
  const cardiacOutputLMin = Math.round(((hr * strokeVolumeMl) / 1000) * 100) / 100
  const hbRef = preset.biologicalSex === 'male' ? 14.8 : 13.2
  const cao2 = 1.34 * hbRef * (spo2 / 100) + 0.3
  const oxygenDeliveryMlMin = Math.round(cardiacOutputLMin * cao2 * 10)
  const alveolarVentilationLMin = Math.round(preset.restingRrPerMin * (preset.weightKg * 0.0055) * (0.7 + exertion * 0.3) * 10) / 10

  // Cellular & Organelle coupling
  const ca2TransientHz = Math.round((hr / 60) * 100) / 100
  const estimatedAtpTurnoverMmolMin = Math.round(cardiacOutputLMin * 18.5 * (spo2 / 98) * 10) / 10
  const atpSynthaseRotorRpmEdu = Math.round(Math.min(9000, 3200 + exertion * 480))
  const tunnelingGap = typeof input.tunnelingGapAngstrom === 'number' && Number.isFinite(input.tunnelingGapAngstrom)
    ? Math.max(4, Math.min(20, input.tunnelingGapAngstrom))
    : 11.0
  const electronTunnelingAttenuation = computeElectronTunnelingFactor(tunnelingGap)
  const protonGradientMv = Math.round(Math.max(120, Math.min(210, 175 * (spo2 / 98))))

  let glucoseUtilizationState: Fsd15DigitalTwinFrame['cellularLevel']['glucoseUtilizationState'] = 'BASAL'
  if (glucose < 70) glucoseUtilizationState = 'HYPOGLYCEMIC_ALERT'
  else if (glucose > 180) glucoseUtilizationState = 'HYPERGLYCEMIC_LOAD'
  else if (exertion >= 4) glucoseUtilizationState = 'ELEVATED_EXERTION'

  const gene =
    CURATED_GENE_LOCI.find((g) => g.symbol === input.geneSymbol) ??
    (preset.id === 'autism' ? CURATED_GENE_LOCI[5] : CURATED_GENE_LOCI[1])
  const translation = analyzeDnaStrandAndTranslation(gene.codingDna5to3)

  const twinDualTelemetry = preset.isTwinProfile
    ? {
        twinAHrBpm: hr,
        twinBHrBpm: Math.max(100, hr - 4),
        twinWeightSymmetryPct: 96,
      }
    : undefined

  const vectorLanes = [
    { id: 'arterial_o2', label: 'Arterial O₂ / DO₂', flowPct: Math.min(100, Math.round((spo2 / 100) * 100)), color: '#38bdf8', unitLabel: `${oxygenDeliveryMlMin} mL/m` },
    { id: 'cardiac_pump', label: 'Cardiac Output', flowPct: Math.min(100, Math.round((cardiacOutputLMin / 12) * 100)), color: '#fb7185', unitLabel: `${cardiacOutputLMin} L/m` },
    { id: 'mito_atp', label: 'Mitochondrial ATP', flowPct: Math.min(100, Math.round((atpSynthaseRotorRpmEdu / 9000) * 100)), color: '#34d399', unitLabel: `${atpSynthaseRotorRpmEdu} RPM` },
    { id: 'ca2_neural', label: preset.isSensoryFriendlyNeuro ? 'Sensory / Vagal Balance' : 'Ca²⁺ Signaling', flowPct: Math.min(100, Math.round(Math.min(100, ca2TransientHz * 42))), color: '#a78bfa', unitLabel: `${ca2TransientHz} Hz` },
  ] as const

  return {
    epistemicClass: 'MECHANISTIC_EDUCATIONAL_SIMULATION',
    notClinicalAdvice: true,
    preset,
    manifold,
    sensoryFriendlyUiMode: Boolean(preset.isSensoryFriendlyNeuro || cohortMeta.seniorHighClarityRecommended),
    ...(twinDualTelemetry ? { twinDualTelemetry } : {}),
    organLevel: {
      heartRateBpm: hr,
      strokeVolumeMl,
      cardiacOutputLMin,
      spo2Pct: spo2,
      oxygenDeliveryMlMin,
      alveolarVentilationLMin,
    },
    cellularLevel: {
      ca2TransientHz,
      estimatedAtpTurnoverMmolMin,
      erythrocyteO2BoundPct: spo2,
      glucoseUtilizationState,
    },
    organelleQuantumLevel: {
      atpSynthaseRotorRpmEdu,
      electronTunnelingGapAngstrom: tunnelingGap,
      electronTunnelingAttenuation,
      protonGradientMv,
    },
    genomicStream: {
      gene,
      translation,
    },
    vectorLanes,
  }
}
