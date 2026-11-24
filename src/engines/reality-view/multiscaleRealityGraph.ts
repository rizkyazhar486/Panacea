/**
 * PanaceaMed OS — Unified Multiscale Biological Reality Graph & Mathematical Solver Engine.
 *
 * Implements:
 * - Constitutional Canonical Epistemic Provenance (Law II) & 20-Relation Et Causalis Graph (Law III)
 * - Multidimensional bidirectional entity navigation across 11 biological scales
 *   (Environment -> Human -> Organ System -> Organ -> Functional Tissue Unit ->
 *    Cell Type -> Organelle -> Protein/Receptor -> Molecule/Drug -> Gene/DNA/RNA -> Disease/Outcome)
 * - Explicit Spatial Registration vs. Conceptual Scale Bridge marker (zero fake spatial claims)
 * - Deterministic mathematical & pharmacological solvers:
 *     1. Michaelis-Menten Enzyme Kinetics: v = Vmax [S] / (Km + [S])
 *     2. Equilibrium / Hill Receptor Occupancy: theta = [L]^n / (Kd^n + [L]^n)
 *     3. First-Order Pharmacokinetics: C(t) = (F * D / Vd) * exp(-k * t), t1/2 = ln(2)/k
 *     4. Gene Transcription-Translation ODE: dm/dt = kt - gm*m, dp/dt = kp*m - gp*p
 *
 * Pure, deterministic, zero React, zero network calls, zero impure globals.
 */

export type EpistemicSource =
  | 'OBSERVED_CLINICAL'
  | 'OBSERVED_CONSUMER'
  | 'CLINICAL_RECORD'
  | 'MECHANISTIC_SIMULATION'

export interface EpistemicProvenance {
  readonly source: EpistemicSource
  readonly deviceOrAuthor: string
  readonly timestampISO: string
  readonly confidenceScore: number
  readonly uncertaintyBand?: { readonly lower: number; readonly upper: number; readonly unit: string }
  readonly modelVersion?: string
  readonly clinicalDisclaimerKey: 'DIAGNOSTIC_VERIFIED' | 'WELLNESS_TREND_ONLY' | 'PROBABILISTIC_SIMULATION'
  readonly citations: readonly string[]
}

export type BiologicalScale =
  | 'ENVIRONMENT'
  | 'INDIVIDUAL_HUMAN'
  | 'ORGAN_SYSTEM'
  | 'ORGAN'
  | 'FUNCTIONAL_TISSUE_UNIT'
  | 'CELL_TYPE'
  | 'ORGANELLE'
  | 'PROTEIN_RECEPTOR'
  | 'MOLECULE_DRUG'
  | 'GENE_DNA_RNA'
  | 'DISEASE_OUTCOME'

export const BIOLOGICAL_SCALE_ORDER: readonly BiologicalScale[] = [
  'ENVIRONMENT',
  'INDIVIDUAL_HUMAN',
  'ORGAN_SYSTEM',
  'ORGAN',
  'FUNCTIONAL_TISSUE_UNIT',
  'CELL_TYPE',
  'ORGANELLE',
  'PROTEIN_RECEPTOR',
  'MOLECULE_DRUG',
  'GENE_DNA_RNA',
  'DISEASE_OUTCOME',
] as const

export type CausalRelationType =
  | 'CAUSES'
  | 'EXACERBATES'
  | 'MITIGATES'
  | 'PREVENTS'
  | 'BIOMARKER_OF'
  | 'ANATOMICALLY_LOCALIZES_TO'
  | 'CONTRAINDICATES'
  | 'METABOLIZED_BY'
  | 'SYNERGIZES_WITH'
  | 'EARLY_WARNING_FOR'
  | 'COMPENSATES_FOR'
  | 'REVERSIBLE_VIA'
  | 'REGULATES'
  | 'INHIBITS'
  | 'ACTIVATES'
  | 'TRANSPORTS_TO'
  | 'STRUCTURALLY_SUPPORTS'
  | 'GENETICALLY_MODULATES'
  | 'IMMUNOLOGICALLY_PRIMES'
  | 'CORRELATES_WITH'

export const ALL_20_CAUSAL_RELATIONS: readonly CausalRelationType[] = [
  'CAUSES',
  'EXACERBATES',
  'MITIGATES',
  'PREVENTS',
  'BIOMARKER_OF',
  'ANATOMICALLY_LOCALIZES_TO',
  'CONTRAINDICATES',
  'METABOLIZED_BY',
  'SYNERGIZES_WITH',
  'EARLY_WARNING_FOR',
  'COMPENSATES_FOR',
  'REVERSIBLE_VIA',
  'REGULATES',
  'INHIBITS',
  'ACTIVATES',
  'TRANSPORTS_TO',
  'STRUCTURALLY_SUPPORTS',
  'GENETICALLY_MODULATES',
  'IMMUNOLOGICALLY_PRIMES',
  'CORRELATES_WITH',
] as const

export type SpatialRegistrationClass = 'SPATIALLY_REGISTERED' | 'CONCEPTUAL_SCALE_BRIDGE'

export type CompoundClassification =
  | 'REGULATORILY_APPROVED_DRUG'
  | 'KNOWN_METABOLITE'
  | 'BIOLOGIC_VACCINE'
  | 'ENVIRONMENTAL_EXPOSURE'
  | 'NOT_APPLICABLE'

export interface MultiscaleEntityNode {
  readonly id: string
  readonly canonicalIdentifier: string
  readonly scale: BiologicalScale
  readonly labelEn: string
  readonly labelId: string
  readonly synonyms: readonly string[]
  readonly organSystemId: string
  readonly meshId?: string
  readonly compoundClass: CompoundClassification
  readonly structuralStatus: 'EXPERIMENTALLY_DETERMINED' | 'ANATOMICAL_ATLAS_CURATED' | 'CONCEPTUAL_REFERENCE'
  readonly summaryPatient: { readonly id: string; readonly en: string }
  readonly summaryClinician: { readonly id: string; readonly en: string }
  readonly provenance: EpistemicProvenance
}

export interface MultiscaleCausalEdge {
  readonly id: string
  readonly fromNodeId: string
  readonly toNodeId: string
  readonly relation: CausalRelationType
  readonly spatialRegistration: SpatialRegistrationClass
  readonly weight: number
  readonly timeConstantDays: number
  readonly reversibilityIndex: number
  readonly evidenceGrade: 'A' | 'B' | 'C' | 'D'
  readonly anatomicalTargetIds: readonly string[]
  readonly explanationPatient: { readonly id: string; readonly en: string }
  readonly explanationClinician: { readonly id: string; readonly en: string }
  readonly citations: readonly string[]
}

const CURATED_PROVENANCE = (citations: readonly string[]): EpistemicProvenance => ({
  source: 'CLINICAL_RECORD',
  deviceOrAuthor: 'PanaceaMed Curated Biomedical Ontology Registry',
  timestampISO: '2026-11-24T00:00:00.000Z',
  confidenceScore: 0.94,
  modelVersion: 'panacea-multiscale-graph-v3.0',
  clinicalDisclaimerKey: 'PROBABILISTIC_SIMULATION',
  citations,
})

export const MULTISCALE_ENTITY_REGISTRY: readonly MultiscaleEntityNode[] = [
  {
    id: 'env_pm25',
    canonicalIdentifier: 'ENVO:01000415',
    scale: 'ENVIRONMENT',
    labelEn: 'Ambient PM2.5 Fine Particulate Matter',
    labelId: 'Partikulat Halus PM2.5 Udara',
    synonyms: ['PM2.5', 'fine particulate air pollution'],
    organSystemId: 'respiratory',
    compoundClass: 'ENVIRONMENTAL_EXPOSURE',
    structuralStatus: 'CONCEPTUAL_REFERENCE',
    summaryPatient: { id: 'Debu halus polusi udara yang masuk sampai kantung paru dan memicu radang.', en: 'Fine airborne particles that reach deep lung sacs and trigger inflammation.' },
    summaryClinician: { id: 'Partikulat aerodinamik <=2.5 um yang menembus epitel alveolar dan memicu stres oksidatif vaskular.', en: 'Aerodynamic <=2.5 um particulates crossing alveolar interface, driving endothelial oxidative stress.' },
    provenance: CURATED_PROVENANCE(['WHO-AQG-2021', 'DOI:10.1016/S0140-6736(20)30752-2']),
  },
  {
    id: 'human_twin',
    canonicalIdentifier: 'NCBITaxon:9606',
    scale: 'INDIVIDUAL_HUMAN',
    labelEn: 'Personified Living Human Twin',
    labelId: 'Kembaran Biologis Manusia 1:1',
    synonyms: ['Homo sapiens', 'whole body'],
    organSystemId: 'whole_body',
    meshId: 'surface_skin_shell',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'ANATOMICAL_ATLAS_CURATED',
    summaryPatient: { id: 'Tubuh utuh Anda yang menghubungkan kebiasaan harian dengan organ dalam.', en: 'Your whole body connecting daily habits with internal organ health.' },
    summaryClinician: { id: 'Model kopling sistemik lintas 10 sistem organ dengan batas epistemik observasi vs simulasi.', en: 'Systemic 10-system coupling model enforcing strict observed vs simulated provenance.' },
    provenance: CURATED_PROVENANCE(['Z-ANATOMY-TA2', 'HRA-V2']),
  },
  {
    id: 'sys_cardiovascular',
    canonicalIdentifier: 'FMA:7161',
    scale: 'ORGAN_SYSTEM',
    labelEn: 'Cardiovascular System',
    labelId: 'Sistem Kardiovaskular',
    synonyms: ['circulatory system', 'heart and vessels'],
    organSystemId: 'cardiovascular',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'ANATOMICAL_ATLAS_CURATED',
    summaryPatient: { id: 'Jaringan pompa jantung dan pembuluh darah pengantar oksigen.', en: 'Heart pump and blood vessel network delivering oxygen.' },
    summaryClinician: { id: 'Sistem hemodinamik tertutup: CO = HR x SV, SVR, dan perfusi mikrovaskular.', en: 'Closed hemodynamic loop governed by CO = HR x SV, SVR, and microvascular perfusion.' },
    provenance: CURATED_PROVENANCE(['FMA:7161', 'ESC-2024']),
  },
  {
    id: 'organ_heart',
    canonicalIdentifier: 'FMA:7088',
    scale: 'ORGAN',
    labelEn: 'Heart (Myocardium & Left Ventricle)',
    labelId: 'Jantung (Miokardium & Ventrikel Kiri)',
    synonyms: ['cor', 'left ventricle', 'myocardium'],
    organSystemId: 'cardiovascular',
    meshId: 'heart_myocardium',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'ANATOMICAL_ATLAS_CURATED',
    summaryPatient: { id: 'Otot pompa utama yang berdetak ~100.000 kali per hari.', en: 'Primary muscular pump beating ~100,000 times daily.' },
    summaryClinician: { id: 'Empat ruang jantung dengan kopling eksitasi-kontraksi dan sirkulasi koroner AHA-17.', en: 'Four-chamber organ with excitation-contraction coupling and AHA-17 coronary territories.' },
    provenance: CURATED_PROVENANCE(['FMA:7088', 'SNOMED:80891009']),
  },
  {
    id: 'ftu_myocardium',
    canonicalIdentifier: 'UBERON:0002349',
    scale: 'FUNCTIONAL_TISSUE_UNIT',
    labelEn: 'Ventricular Myocardial Wall Unit',
    labelId: 'Unit Jaringan Miokardium Ventrikel',
    synonyms: ['cardiac muscle tissue'],
    organSystemId: 'cardiovascular',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'ANATOMICAL_ATLAS_CURATED',
    summaryPatient: { id: 'Lapisan otot dinding jantung yang berkontraksi serempak.', en: 'Muscular wall layer contracting synchronously to eject blood.' },
    summaryClinician: { id: 'Sinsitium fungsional kardiomiosit terhubung diskus interkalaris (Cx43) dan kapiler densitas tinggi.', en: 'Functional cardiomyocyte syncytium coupled via Cx43 gap junctions and dense capillary beds.' },
    provenance: CURATED_PROVENANCE(['UBERON:0002349', 'HuBMAP-HRA-FTU']),
  },
  {
    id: 'cell_cardiomyocyte',
    canonicalIdentifier: 'CL:0000746',
    scale: 'CELL_TYPE',
    labelEn: 'Ventricular Cardiomyocyte',
    labelId: 'Sel Kardiomiosit Ventrikel',
    synonyms: ['cardiac muscle cell'],
    organSystemId: 'cardiovascular',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Sel otot jantung kaya mitokondria yang mengubah energi menjadi detak.', en: 'Mitochondria-rich heart cell converting energy into rhythmic contraction.' },
    summaryClinician: { id: 'Sel eksitabel kaya mitokondria (~30% volume sel) dengan tubulus-T, retikulum sarkoplasma, dan sarkomer.', en: 'Excitable cell (~30% mitochondrial volume) with T-tubules, sarcoplasmic reticulum, and sarcomeres.' },
    provenance: CURATED_PROVENANCE(['CL:0000746', 'HCA-Heart-Atlas']),
  },
  {
    id: 'org_mitochondrion',
    canonicalIdentifier: 'GO:0005739',
    scale: 'ORGANELLE',
    labelEn: 'Cardiac Mitochondrion (OXPHOS Matrix)',
    labelId: 'Mitokondria Jantung (Rantai Respirasi)',
    synonyms: ['mitochondria', 'electron transport chain'],
    organSystemId: 'cardiovascular',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Pembangkit tenaga sel yang menghasilkan ATP untuk setiap kontraksi.', en: 'Cellular powerhouse producing ATP for every heartbeat.' },
    summaryClinician: { id: 'Organel membran ganda dengan krista penghasil gradien proton dan sintesis ATP (Kompleks I-V).', en: 'Double-membrane organelle with cristae driving proton-motive force and Complex I-V ATP synthesis.' },
    provenance: CURATED_PROVENANCE(['GO:0005739', 'Reactome:R-HSA-163200']),
  },
  {
    id: 'prot_beta1_adr',
    canonicalIdentifier: 'UniProt:P08588',
    scale: 'PROTEIN_RECEPTOR',
    labelEn: 'Beta-1 Adrenergic Receptor (ADRB1)',
    labelId: 'Reseptor Adrenergik Beta-1 (ADRB1)',
    synonyms: ['ADRB1', 'beta-1 receptor'],
    organSystemId: 'cardiovascular',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Tombol percepat detak jantung yang merespons adrenalin.', en: 'Heart-rate accelerator switch responding to adrenaline.' },
    summaryClinician: { id: 'GPCR tergandeng Gs pada membran kardiomiosit/nodus SA yang meningkatkan cAMP-PKA dan kronotropi/inotropi.', en: 'Gs-coupled GPCR on SA nodal/cardiomyocyte membranes increasing cAMP-PKA chronotropy and inotropy.' },
    provenance: CURATED_PROVENANCE(['UniProt:P08588', 'RCSB:7BVQ']),
  },
  {
    id: 'prot_hmgcr',
    canonicalIdentifier: 'UniProt:P04035',
    scale: 'PROTEIN_RECEPTOR',
    labelEn: 'HMG-CoA Reductase (HMGCR)',
    labelId: 'Enzim HMG-CoA Reduktase (HMGCR)',
    synonyms: ['HMGCR', 'statin target'],
    organSystemId: 'cardiovascular',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Enzim di hati yang menjadi pintu utama pembuatan kolesterol LDL.', en: 'Liver enzyme acting as the rate-limiting gate for LDL cholesterol synthesis.' },
    summaryClinician: { id: 'Enzim pembatas laju jalur mevalonat di retikulum endoplasma hepatosit; inhibisi memicu upregulasi LDL-R.', en: 'Rate-limiting mevalonate pathway enzyme in hepatocyte ER; inhibition drives SREBP-2 LDL-R upregulation.' },
    provenance: CURATED_PROVENANCE(['UniProt:P04035', 'RCSB:1HWK']),
  },
  {
    id: 'drug_bisoprolol',
    canonicalIdentifier: 'ChEBI:3128',
    scale: 'MOLECULE_DRUG',
    labelEn: 'Bisoprolol (Selective Beta-1 Antagonist)',
    labelId: 'Bisoprolol (Penghambat Beta-1 Selektif)',
    synonyms: ['beta blocker', 'C18H31NO4'],
    organSystemId: 'cardiovascular',
    compoundClass: 'REGULATORILY_APPROVED_DRUG',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Obat penenang beban jantung agar detak lebih teratur dan hemat oksigen.', en: 'Medication easing cardiac workload for calmer, oxygen-efficient beats.' },
    summaryClinician: { id: 'Antagonis kompetitif selektif ADRB1 (t1/2 ~10-12 jam); menurunkan HR, konsumsi O2 miokard, dan remodeling.', en: 'Selective competitive ADRB1 antagonist (t1/2 ~10-12h); lowers HR, myocardial VO2, and sympathetic remodeling.' },
    provenance: CURATED_PROVENANCE(['ChEBI:3128', 'ESC-HF-2023']),
  },
  {
    id: 'drug_atorvastatin',
    canonicalIdentifier: 'ChEBI:39548',
    scale: 'MOLECULE_DRUG',
    labelEn: 'Atorvastatin (HMG-CoA Reductase Inhibitor)',
    labelId: 'Atorvastatin (Penghambat HMG-CoA Reduktase)',
    synonyms: ['statin', 'C33H35FN2O5'],
    organSystemId: 'cardiovascular',
    compoundClass: 'REGULATORILY_APPROVED_DRUG',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Obat penurun kolesterol jahat LDL untuk melindungi dinding pembuluh darah.', en: 'Medication lowering ApoB/LDL cholesterol to stabilize arterial walls.' },
    summaryClinician: { id: 'Inhibitor kompetitif HMGCR (t1/2 ~14 jam, metabolisme CYP3A4); menurunkan LDL-C 40-55% dan menstabilkan plak.', en: 'Competitive HMGCR inhibitor (t1/2 ~14h, CYP3A4 substrate); cuts LDL-C 40-55% and stabilizes plaque.' },
    provenance: CURATED_PROVENANCE(['ChEBI:39548', 'ACC-AHA-Lipid']),
  },
  {
    id: 'gene_myh7',
    canonicalIdentifier: 'HGNC:7577',
    scale: 'GENE_DNA_RNA',
    labelEn: 'MYH7 (Beta-Myosin Heavy Chain, chr14q11.2)',
    labelId: 'Gen MYH7 (Rantai Berat Beta-Miosin, chr14q11.2)',
    synonyms: ['MYH7', 'beta-MHC', 'CMH1'],
    organSystemId: 'cardiovascular',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Gen pembentuk motor otot jantung; variasi tertentu dapat menebalkan dinding jantung.', en: 'Gene encoding heart muscle motor protein; certain variants thicken heart walls.' },
    summaryClinician: { id: 'Gen pada lokus 14q11.2 penyandi beta-myosin heavy chain; varian patogenik dikaitkan dengan HCM (ClinVar).', en: 'Locus 14q11.2 gene encoding beta-myosin heavy chain; pathogenic missense variants associate with HCM.' },
    provenance: CURATED_PROVENANCE(['HGNC:7577', 'ClinVar:MYH7', 'Ensembl:ENSG00000092054']),
  },
  {
    id: 'disease_cad',
    canonicalIdentifier: 'ICD10:I25.1',
    scale: 'DISEASE_OUTCOME',
    labelEn: 'Atherosclerotic Coronary Artery Disease',
    labelId: 'Penyakit Jantung Koroner Aterosklerotik',
    synonyms: ['CAD', 'coronary atherosclerosis'],
    organSystemId: 'cardiovascular',
    meshId: 'heart_myocardium',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'CONCEPTUAL_REFERENCE',
    summaryPatient: { id: 'Penyempitan pembuluh darah pemberi makan otot jantung akibat timbunan plak.', en: 'Narrowing of heart-feeding arteries from lipid-inflammatory plaque buildup.' },
    summaryClinician: { id: 'Proses inflamasi-lipid kronis intima koroner yang menurunkan cadangan aliran koroner (CFR).', en: 'Chronic coronary intimal lipid-inflammatory remodeling reducing coronary flow reserve.' },
    provenance: CURATED_PROVENANCE(['ICD10:I25.1', 'ESC-CCS-2024']),
  },
  {
    id: 'organ_kidney',
    canonicalIdentifier: 'FMA:7203',
    scale: 'ORGAN',
    labelEn: 'Kidney (Renal Cortex & Nephron Network)',
    labelId: 'Ginjal (Korteks & Jaringan Nefron)',
    synonyms: ['ren', 'nephron'],
    organSystemId: 'renal',
    meshId: 'kidney_right',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'ANATOMICAL_ATLAS_CURATED',
    summaryPatient: { id: 'Penyaring darah otomatis yang menjaga keseimbangan air, garam, dan tekanan darah.', en: 'Automatic blood filter balancing fluid, salt, and blood pressure.' },
    summaryClinician: { id: 'Organ filtrasi ~1 juta nefron/ginjal dengan umpan balik tubuloglomerular dan sumbu RAAS.', en: 'Filtration organ (~1M nephrons/kidney) governing tubuloglomerular feedback and RAAS.' },
    provenance: CURATED_PROVENANCE(['FMA:7203', 'KDIGO-2024']),
  },
  {
    id: 'cell_proximal_tubule',
    canonicalIdentifier: 'CL:0002306',
    scale: 'CELL_TYPE',
    labelEn: 'Renal Proximal Tubular Epithelial Cell',
    labelId: 'Sel Epitel Tubulus Proksimal Ginjal',
    synonyms: ['PTEC', 'S1/S2 proximal tubule'],
    organSystemId: 'renal',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Sel penyerap kembali glukosa dan garam di ginjal.', en: 'Kidney lining cell reabsorbing filtered glucose and sodium.' },
    summaryClinician: { id: 'Epitel brush-border segmen S1/S2 pengekspresi tinggi transporter SGLT2 (SLC5A2).', en: 'S1/S2 brush-border epithelium richly expressing sodium-glucose cotransporter SGLT2.' },
    provenance: CURATED_PROVENANCE(['CL:0002306', 'KPMP-Kidney-Atlas']),
  },
  {
    id: 'prot_sglt2',
    canonicalIdentifier: 'UniProt:P31639',
    scale: 'PROTEIN_RECEPTOR',
    labelEn: 'Sodium/Glucose Cotransporter 2 (SLC5A2)',
    labelId: 'Kotransporter Natrium-Glukosa 2 (SGLT2)',
    synonyms: ['SGLT2', 'SLC5A2'],
    organSystemId: 'renal',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Pintu serap ulang gula dan natrium di saluran awal ginjal.', en: 'Reabsorption gate reclaiming glucose and sodium in early kidney tubules.' },
    summaryClinician: { id: 'Simporter Na+/glukosa 1:1 bertanggung jawab atas ~90% reabsorpsi glukosa filtrat.', en: '1:1 Na+/glucose symporter accounting for ~90% of filtered glucose reabsorption.' },
    provenance: CURATED_PROVENANCE(['UniProt:P31639', 'RCSB:7VSI']),
  },
  {
    id: 'drug_empagliflozin',
    canonicalIdentifier: 'ChEBI:82720',
    scale: 'MOLECULE_DRUG',
    labelEn: 'Empagliflozin (SGLT2 Inhibitor)',
    labelId: 'Empagliflozin (Inhibitor SGLT2)',
    synonyms: ['SGLT2i', 'C23H27ClO7'],
    organSystemId: 'renal',
    compoundClass: 'REGULATORILY_APPROVED_DRUG',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Obat pelindung ginjal dan jantung dengan mengurangi beban tekanan saringan ginjal.', en: 'Cardiorenal-protective drug reducing glomerular pressure overload.' },
    summaryClinician: { id: 'Inhibitor selektif SGLT2; memulihkan umpan balik tubuloglomerular, natriuresis, dan proteksi kardio-renal.', en: 'Selective SGLT2 inhibitor restoring tubuloglomerular feedback, natriuresis, and cardiorenal protection.' },
    provenance: CURATED_PROVENANCE(['ChEBI:82720', 'EMPA-KIDNEY-NEJM-2023']),
  },
  {
    id: 'organ_lung',
    canonicalIdentifier: 'FMA:7195',
    scale: 'ORGAN',
    labelEn: 'Lung (Alveolar-Capillary Gas Exchange)',
    labelId: 'Paru-Paru (Pertukaran Gas Alveolar-Kapiler)',
    synonyms: ['pulmo', 'lungs'],
    organSystemId: 'respiratory',
    meshId: 'lung_right',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'ANATOMICAL_ATLAS_CURATED',
    summaryPatient: { id: 'Organ penukar oksigen dan karbon dioksida dengan luas setara lapangan tenis.', en: 'Gas-exchange organ matching oxygen and carbon dioxide across alveolar membranes.' },
    summaryClinician: { id: 'Membran difusi alveolar-kapiler (~0.5 um) diatur rasio V/Q, surfaktan pneumosit II, dan gradien A-a.', en: 'Alveolar-capillary barrier (~0.5 um) governed by V/Q matching, surfactant, and A-a gradient.' },
    provenance: CURATED_PROVENANCE(['FMA:7195', 'GOLD-2025']),
  },
  {
    id: 'cell_pneumocyte_type2',
    canonicalIdentifier: 'CL:0002063',
    scale: 'CELL_TYPE',
    labelEn: 'Type II Alveolar Pneumocyte (AT2)',
    labelId: 'Sel Pneumosit Alveolar Tipe II (AT2)',
    synonyms: ['AT2 cell', 'surfactant-producing cell'],
    organSystemId: 'respiratory',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Sel penghasil pelumas alami paru agar kantung udara tidak mengempis.', en: 'Cell producing lung surfactant keeping air sacs open.' },
    summaryClinician: { id: 'Sel progenitor epitel alveolar penyekresi surfaktan (SP-B/C) dan pengekspresi kanal klorida CFTR.', en: 'Alveolar progenitor epithelium secreting surfactant (SP-B/C) and regulating airway surface liquid.' },
    provenance: CURATED_PROVENANCE(['CL:0002063', 'HCA-Lung-Atlas']),
  },
  {
    id: 'gene_cftr',
    canonicalIdentifier: 'HGNC:1884',
    scale: 'GENE_DNA_RNA',
    labelEn: 'CFTR (Cystic Fibrosis Transmembrane Regulator, chr7q31.2)',
    labelId: 'Gen CFTR (Kanal Klorida Epitel, chr7q31.2)',
    synonyms: ['CFTR', 'ABCC7'],
    organSystemId: 'respiratory',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Gen pengatur kadar air lendir saluran napas.', en: 'Gene regulating airway mucus hydration via chloride channels.' },
    summaryClinician: { id: 'Gen pada lokus 7q31.2 penyandi kanal anion cAMP-gated CFTR; krusial untuk klirens mukosiliar.', en: 'Locus 7q31.2 gene encoding cAMP-gated chloride channel crucial for mucociliary clearance.' },
    provenance: CURATED_PROVENANCE(['HGNC:1884', 'Ensembl:ENSG00000001626']),
  },
  {
    id: 'drug_mrna_vaccine',
    canonicalIdentifier: 'SNOMED:1119349007',
    scale: 'MOLECULE_DRUG',
    labelEn: 'mRNA Lipid-Nanoparticle Vaccine (Immunodynamics)',
    labelId: 'Vaksin mRNA Nanopartikel Lipid (Imunodinamika)',
    synonyms: ['mRNA vaccine', 'immunization'],
    organSystemId: 'immune',
    compoundClass: 'BIOLOGIC_VACCINE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Latihan aman bagi sistem imun untuk mengenali virus tanpa terkena penyakit berat.', en: 'Safe training blueprint teaching immune cells to block severe infection.' },
    summaryClinician: { id: 'Transfeksi sementara mRNA terenkapsulasi LNP -> presentasi antigen MHC I/II sel dendritik -> sel memori B/T.', en: 'Transient LNP-mRNA translation -> dendritic MHC I/II presentation -> germinal center memory B/T priming.' },
    provenance: CURATED_PROVENANCE(['SNOMED:1119349007', 'WHO-Immunization-Evidence']),
  },
  {
    id: 'cell_dendritic',
    canonicalIdentifier: 'CL:0000451',
    scale: 'CELL_TYPE',
    labelEn: 'Antigen-Presenting Dendritic Cell',
    labelId: 'Sel Dendritik Penyaji Antigen',
    synonyms: ['DC', 'APC'],
    organSystemId: 'immune',
    compoundClass: 'NOT_APPLICABLE',
    structuralStatus: 'EXPERIMENTALLY_DETERMINED',
    summaryPatient: { id: 'Pengintai imun yang membawa profil kuman ke kelenjar getah bening.', en: 'Immune scout carrying pathogen profiles to lymph nodes.' },
    summaryClinician: { id: 'Sel penyaji antigen profesional penghubung imunitas bawaan dan adaptif melalui ko-stimulasi CD80/CD86.', en: 'Professional APC bridging innate and adaptive immunity via MHC/CD80-CD86 priming.' },
    provenance: CURATED_PROVENANCE(['CL:0000451', 'Reactome:R-HSA-1280218']),
  },
] as const

export const MULTISCALE_CAUSAL_EDGES: readonly MultiscaleCausalEdge[] = [
  {
    id: 'edge_human_to_cv',
    fromNodeId: 'human_twin',
    toNodeId: 'sys_cardiovascular',
    relation: 'STRUCTURALLY_SUPPORTS',
    spatialRegistration: 'SPATIALLY_REGISTERED',
    weight: 1.0,
    timeConstantDays: 0,
    reversibilityIndex: 0.5,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['heart_myocardium'],
    explanationPatient: { id: 'Sistem kardiovaskular menopang perfusi seluruh tubuh.', en: 'The cardiovascular system perfuses the whole body.' },
    explanationClinician: { id: 'Ko-registrasi spasial kontainer toraks-vaskular terhadap kerangka antropometri 1:1.', en: 'Spatial co-registration of thoraco-vascular container to 1:1 anthropometric frame.' },
    citations: ['Z-ANATOMY-TA2'],
  },
  {
    id: 'edge_cv_to_heart',
    fromNodeId: 'sys_cardiovascular',
    toNodeId: 'organ_heart',
    relation: 'ANATOMICALLY_LOCALIZES_TO',
    spatialRegistration: 'SPATIALLY_REGISTERED',
    weight: 1.0,
    timeConstantDays: 0,
    reversibilityIndex: 0.5,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['heart_myocardium'],
    explanationPatient: { id: 'Jantung adalah pusat pompa sistem kardiovaskular.', en: 'The heart is the central pump of the cardiovascular system.' },
    explanationClinician: { id: 'Lokalisasi anatomi FMA:7088 pada mediastinum medius.', en: 'Anatomical localization FMA:7088 within middle mediastinum.' },
    citations: ['FMA:7088'],
  },
  {
    id: 'edge_heart_to_myocardium',
    fromNodeId: 'organ_heart',
    toNodeId: 'ftu_myocardium',
    relation: 'ANATOMICALLY_LOCALIZES_TO',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: 0.95,
    timeConstantDays: 0,
    reversibilityIndex: 0.4,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['heart_myocardium'],
    explanationPatient: { id: 'Dinding jantung tersusun dari lapisan jaringan otot miokardium.', en: 'The heart wall is built from myocardium muscle layers.' },
    explanationClinician: { id: 'Transisi skala makroskopik ke unit jaringan fungsional HuBMAP.', en: 'Macroscopic-to-FTU scale transition (conceptual tissue registration).' },
    citations: ['HuBMAP-HRA-FTU'],
  },
  {
    id: 'edge_myocardium_to_cardiomyocyte',
    fromNodeId: 'ftu_myocardium',
    toNodeId: 'cell_cardiomyocyte',
    relation: 'STRUCTURALLY_SUPPORTS',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: 0.95,
    timeConstantDays: 1,
    reversibilityIndex: 0.3,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['heart_myocardium'],
    explanationPatient: { id: 'Jaringan otot jantung terbentuk dari jutaan sel kardiomiosit.', en: 'Heart wall tissue is built from millions of cardiomyocytes.' },
    explanationClinician: { id: 'Sel kardiomiosit ventrikel menopang gaya kontraktil dinding LV.', en: 'Ventricular cardiomyocytes generate systolic wall stress.' },
    citations: ['HCA-Heart-Atlas'],
  },
  {
    id: 'edge_cardiomyocyte_to_mito',
    fromNodeId: 'cell_cardiomyocyte',
    toNodeId: 'org_mitochondrion',
    relation: 'ACTIVATES',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: 0.92,
    timeConstantDays: 0.01,
    reversibilityIndex: 0.85,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['heart_myocardium'],
    explanationPatient: { id: 'Setiap detak sel otot jantung memicu mitokondria menghasilkan energi ATP.', en: 'Each heart-cell contraction drives mitochondria to regenerate ATP.' },
    explanationClinician: { id: 'Kopling Ca2+ mitokondria dan beban ADP merangsang fosforilasi oksidatif.', en: 'Mitochondrial Ca2+ uptake and ADP load stimulate oxidative phosphorylation.' },
    citations: ['Reactome:R-HSA-163200'],
  },
  {
    id: 'edge_bisoprolol_inhibits_beta1',
    fromNodeId: 'drug_bisoprolol',
    toNodeId: 'prot_beta1_adr',
    relation: 'INHIBITS',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: -0.88,
    timeConstantDays: 0.5,
    reversibilityIndex: 0.95,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['heart_myocardium'],
    explanationPatient: { id: 'Bisoprolol menahan sinyal adrenalin berlebih pada reseptor beta-1 jantung.', en: 'Bisoprolol calms excess adrenaline signaling at cardiac beta-1 receptors.' },
    explanationClinician: { id: 'Antagonisme kompetitif ADRB1 menurunkan cAMP, denyut jantung, dan konsumsi oksigen miokard.', en: 'Competitive ADRB1 antagonism lowers cAMP, heart rate, and myocardial VO2.' },
    citations: ['ESC-HF-2023', 'ChEBI:3128'],
  },
  {
    id: 'edge_atorvastatin_inhibits_hmgcr',
    fromNodeId: 'drug_atorvastatin',
    toNodeId: 'prot_hmgcr',
    relation: 'INHIBITS',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: -0.9,
    timeConstantDays: 14,
    reversibilityIndex: 0.9,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['liver_parenchyma', 'heart_myocardium'],
    explanationPatient: { id: 'Atorvastatin menghambat enzim HMGCR di hati sehingga kolesterol LDL turun signifikan.', en: 'Atorvastatin inhibits hepatic HMGCR, lowering blood LDL cholesterol.' },
    explanationClinician: { id: 'Inhibisi kompetitif HMGCR hepatosit menginduksi klirens LDL-R dan menurunkan risiko kejadian koroner.', en: 'Competitive HMGCR inhibition drives LDL-R clearance and lowers MACE risk.' },
    citations: ['ACC-AHA-Lipid', 'RCSB:1HWK'],
  },
  {
    id: 'edge_atorvastatin_prevents_cad',
    fromNodeId: 'drug_atorvastatin',
    toNodeId: 'disease_cad',
    relation: 'PREVENTS',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: -0.78,
    timeConstantDays: 365,
    reversibilityIndex: 0.65,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['heart_myocardium'],
    explanationPatient: { id: 'Penurunan LDL jangka panjang membantu menstabilkan plak dan mencegah penyempitan koroner.', en: 'Sustained LDL lowering stabilizes plaque and reduces coronary event risk.' },
    explanationClinician: { id: 'Penurunan ApoB/LDL-C menurunkan progresi ateroma koroner (bukti RCT Grade A).', en: 'ApoB/LDL-C reduction slows coronary atheroma progression (Grade A RCT evidence).' },
    citations: ['ESC-CCS-2024'],
  },
  {
    id: 'edge_myh7_modulates_cardiomyocyte',
    fromNodeId: 'gene_myh7',
    toNodeId: 'cell_cardiomyocyte',
    relation: 'GENETICALLY_MODULATES',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: 0.85,
    timeConstantDays: 180,
    reversibilityIndex: 0.15,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['heart_myocardium'],
    explanationPatient: { id: 'Gen MYH7 menentukan sifat protein motor kontraksi di dalam sel otot jantung.', en: 'The MYH7 gene defines the contractile motor protein inside heart muscle cells.' },
    explanationClinician: { id: 'Varian missense MYH7 mengubah aktivitas ATPase sarkomer dan predisposisi hipertrofi miokard.', en: 'MYH7 missense variants alter sarcomeric ATPase kinetics and hypertrophy predisposition.' },
    citations: ['HGNC:7577', 'ClinVar:MYH7'],
  },
  {
    id: 'edge_empagliflozin_inhibits_sglt2',
    fromNodeId: 'drug_empagliflozin',
    toNodeId: 'prot_sglt2',
    relation: 'INHIBITS',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: -0.92,
    timeConstantDays: 1,
    reversibilityIndex: 0.95,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['kidney_right', 'kidney_left'],
    explanationPatient: { id: 'Empagliflozin memblokir pintu SGLT2 sehingga kelebihan gula dan garam keluar lewat urin.', en: 'Empagliflozin blocks SGLT2 gates, excreting excess glucose and sodium.' },
    explanationClinician: { id: 'Inhibisi SGLT2 di tubulus proksimal memulihkan umpan balik tubuloglomerular dan menurunkan hiperfiltrasi.', en: 'Proximal tubular SGLT2 inhibition restores tubuloglomerular feedback and lowers intraglomerular pressure.' },
    citations: ['EMPA-KIDNEY-NEJM-2023', 'KDIGO-2024'],
  },
  {
    id: 'edge_sglt2_localizes_kidney',
    fromNodeId: 'prot_sglt2',
    toNodeId: 'organ_kidney',
    relation: 'ANATOMICALLY_LOCALIZES_TO',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: 0.95,
    timeConstantDays: 0,
    reversibilityIndex: 0.9,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['kidney_right', 'kidney_left'],
    explanationPatient: { id: 'Transporter SGLT2 bekerja khusus di saluran penyaring awal ginjal.', en: 'SGLT2 transporters operate specifically in kidney filtration tubules.' },
    explanationClinician: { id: 'Ekspresi spesifik epitel tubulus proksimal korteks ginjal (CL:0002306).', en: 'Renal cortex proximal tubule-specific expression (CL:0002306).' },
    citations: ['UniProt:P31639'],
  },
  {
    id: 'edge_pm25_exacerbates_lung',
    fromNodeId: 'env_pm25',
    toNodeId: 'organ_lung',
    relation: 'EXACERBATES',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: 0.72,
    timeConstantDays: 3,
    reversibilityIndex: 0.8,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['lung_right', 'lung_left'],
    explanationPatient: { id: 'Paparan PM2.5 tinggi mengiritasi saluran napas dan menurunkan cadangan oksigen saat beraktivitas.', en: 'High PM2.5 irritates airways and lowers breathing reserve during exertion.' },
    explanationClinician: { id: 'Deposisi partikulat halus memicu inflamasi makrofag alveolar dan hiperreaktivitas bronkus.', en: 'Fine particulate deposition induces alveolar macrophage inflammation and airway hyperresponsiveness.' },
    citations: ['WHO-AQG-2021', 'GOLD-2025'],
  },
  {
    id: 'edge_cftr_regulates_pneumocyte',
    fromNodeId: 'gene_cftr',
    toNodeId: 'cell_pneumocyte_type2',
    relation: 'REGULATES',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: 0.85,
    timeConstantDays: 7,
    reversibilityIndex: 0.2,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['lung_right', 'lung_left'],
    explanationPatient: { id: 'Gen CFTR mengatur keseimbangan cairan lapisan saluran napas.', en: 'The CFTR gene regulates airway surface hydration.' },
    explanationClinician: { id: 'Regulasi transpor klorida dan bikarbonat mempertahankan viskositas mukus epitel saluran napas.', en: 'Chloride/bicarbonate transport regulation preserves airway surface liquid clearance.' },
    citations: ['HGNC:1884'],
  },
  {
    id: 'edge_vaccine_primes_dendritic',
    fromNodeId: 'drug_mrna_vaccine',
    toNodeId: 'cell_dendritic',
    relation: 'IMMUNOLOGICALLY_PRIMES',
    spatialRegistration: 'CONCEPTUAL_SCALE_BRIDGE',
    weight: 0.91,
    timeConstantDays: 14,
    reversibilityIndex: 0.3,
    evidenceGrade: 'A',
    anatomicalTargetIds: ['lymph_nodes_thoracic'],
    explanationPatient: { id: 'Vaksin mRNA melatih sel dendritik untuk membangun antibodi memori pelindung.', en: 'mRNA vaccines prime dendritic cells to generate protective memory antibodies.' },
    explanationClinician: { id: 'Translasi antigen pada APC menginduksi sel T-helper folikular dan maturasi afinitas sel B pusat germinal.', en: 'Antigen translation in APCs induces Tfh activation and germinal center B-cell affinity maturation.' },
    citations: ['WHO-Immunization-Evidence'],
  },
] as const

const ENTITY_MAP = new Map<string, MultiscaleEntityNode>(
  MULTISCALE_ENTITY_REGISTRY.map((node) => [node.id, node]),
)

export function getMultiscaleEntityById(id: string): MultiscaleEntityNode | undefined {
  return ENTITY_MAP.get(id)
}

export function listMultiscaleEntitiesByScale(scale: BiologicalScale): readonly MultiscaleEntityNode[] {
  return MULTISCALE_ENTITY_REGISTRY.filter((n) => n.scale === scale)
}

export function searchMultiscaleEntities(query: string): readonly MultiscaleEntityNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return MULTISCALE_ENTITY_REGISTRY
  return MULTISCALE_ENTITY_REGISTRY.filter(
    (n) =>
      n.id.toLowerCase().includes(q) ||
      n.canonicalIdentifier.toLowerCase().includes(q) ||
      n.labelEn.toLowerCase().includes(q) ||
      n.labelId.toLowerCase().includes(q) ||
      n.synonyms.some((s) => s.toLowerCase().includes(q)),
  )
}

export function getEntityNeighborhood(entityId: string): {
  readonly entity: MultiscaleEntityNode | undefined
  readonly outgoing: readonly MultiscaleCausalEdge[]
  readonly incoming: readonly MultiscaleCausalEdge[]
} {
  return {
    entity: ENTITY_MAP.get(entityId),
    outgoing: MULTISCALE_CAUSAL_EDGES.filter((e) => e.fromNodeId === entityId),
    incoming: MULTISCALE_CAUSAL_EDGES.filter((e) => e.toNodeId === entityId),
  }
}

export interface SemanticZoomStep {
  readonly node: MultiscaleEntityNode
  readonly viaEdge: MultiscaleCausalEdge | null
  readonly spatialRegistration: SpatialRegistrationClass
}

/**
 * Bidirectional BFS tracing a semantic zoom path between any two multiscale biological entities.
 */
export function traceSemanticZoomPath(startId: string, targetId: string): readonly SemanticZoomStep[] {
  const startNode = ENTITY_MAP.get(startId)
  if (!startNode || !ENTITY_MAP.has(targetId)) return []
  if (startId === targetId) {
    return [{ node: startNode, viaEdge: null, spatialRegistration: 'SPATIALLY_REGISTERED' }]
  }

  const visited = new Set<string>([startId])
  const queue: Array<{ id: string; path: SemanticZoomStep[] }> = [
    { id: startId, path: [{ node: startNode, viaEdge: null, spatialRegistration: 'SPATIALLY_REGISTERED' }] },
  ]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const edge of MULTISCALE_CAUSAL_EDGES) {
      const nextId = edge.fromNodeId === current.id ? edge.toNodeId : edge.toNodeId === current.id ? edge.fromNodeId : null
      if (!nextId || visited.has(nextId)) continue
      const nextNode = ENTITY_MAP.get(nextId)
      if (!nextNode) continue
      const nextPath: SemanticZoomStep[] = [
        ...current.path,
        { node: nextNode, viaEdge: edge, spatialRegistration: edge.spatialRegistration },
      ]
      if (nextId === targetId) return nextPath
      visited.add(nextId)
      queue.push({ id: nextId, path: nextPath })
    }
  }
  return []
}

// ── DETERMINISTIC MATHEMATICAL & SCIENTIFIC COMPUTATION SOLVERS (Section 22) ──

function safePositive(v: number, fallback: number): number {
  return Number.isFinite(v) && v > 0 ? v : fallback
}

function safeNonNegative(v: number, fallback: number): number {
  return Number.isFinite(v) && v >= 0 ? v : fallback
}

export interface MichaelisMentenResult {
  readonly velocityUmPerMin: number
  readonly saturationFraction: number
  readonly epistemicProvenance: EpistemicProvenance
}

/** Enzyme kinetics: v = Vmax * [S] / (Km + [S]) */
export function computeMichaelisMentenVelocity(params: {
  readonly substrateUm: number
  readonly vmaxUmPerMin: number
  readonly kmUm: number
}): MichaelisMentenResult {
  const s = safeNonNegative(params.substrateUm, 0)
  const vmax = safePositive(params.vmaxUmPerMin, 1)
  const km = safePositive(params.kmUm, 1)
  const saturationFraction = s / (km + s)
  const velocityUmPerMin = vmax * saturationFraction
  return {
    velocityUmPerMin: Math.round(velocityUmPerMin * 1000) / 1000,
    saturationFraction: Math.round(saturationFraction * 10000) / 10000,
    epistemicProvenance: {
      source: 'MECHANISTIC_SIMULATION',
      deviceOrAuthor: 'Michaelis-Menten Deterministic Solver',
      timestampISO: '2026-11-24T00:00:00.000Z',
      confidenceScore: 0.98,
      modelVersion: 'mm-kinetics-v1',
      clinicalDisclaimerKey: 'PROBABILISTIC_SIMULATION',
      citations: ['Michaelis-Menten-1913'],
    },
  }
}

export interface ReceptorOccupancyResult {
  readonly occupancyFraction: number
  readonly occupancyPct: number
  readonly epistemicProvenance: EpistemicProvenance
}

/** Equilibrium / Hill receptor occupancy: theta = [L]^n / (Kd^n + [L]^n) */
export function computeReceptorOccupancy(params: {
  readonly ligandNm: number
  readonly kdNm: number
  readonly hillCoeff?: number
}): ReceptorOccupancyResult {
  const l = safeNonNegative(params.ligandNm, 0)
  const kd = safePositive(params.kdNm, 1)
  const n = Math.min(4, Math.max(0.5, safePositive(params.hillCoeff ?? 1, 1)))
  const ln = Math.pow(l, n)
  const kdn = Math.pow(kd, n)
  const occupancyFraction = ln / (kdn + ln)
  return {
    occupancyFraction: Math.round(occupancyFraction * 10000) / 10000,
    occupancyPct: Math.round(occupancyFraction * 1000) / 10,
    epistemicProvenance: {
      source: 'MECHANISTIC_SIMULATION',
      deviceOrAuthor: 'Hill-Langmuir Receptor Occupancy Solver',
      timestampISO: '2026-11-24T00:00:00.000Z',
      confidenceScore: 0.97,
      modelVersion: 'hill-occupancy-v1',
      clinicalDisclaimerKey: 'PROBABILISTIC_SIMULATION',
      citations: ['Hill-1910', 'Clark-1933'],
    },
  }
}

export interface FirstOrderPkResult {
  readonly initialConcentrationMgL: number
  readonly halfLifeHr: number
  readonly aucInfMgHrPerL: number
  readonly curve: readonly { readonly hour: number; readonly concentrationMgL: number }[]
  readonly epistemicProvenance: EpistemicProvenance
}

/** One-compartment first-order pharmacokinetics: C(t) = C0 * exp(-k*t), t1/2 = ln(2)/k */
export function simulateFirstOrderPharmacokinetics(params: {
  readonly doseMg: number
  readonly volumeDistributionL: number
  readonly bioavailabilityF?: number
  readonly eliminationRateKPerHr: number
  readonly durationHr?: number
  readonly stepHr?: number
}): FirstOrderPkResult {
  const dose = safePositive(params.doseMg, 10)
  const vd = safePositive(params.volumeDistributionL, 50)
  const f = Math.min(1, safePositive(params.bioavailabilityF ?? 1, 1))
  const k = safePositive(params.eliminationRateKPerHr, 0.0693)
  const duration = Math.min(168, safePositive(params.durationHr ?? 24, 24))
  const step = Math.max(0.25, Math.min(12, safePositive(params.stepHr ?? 2, 2)))

  const c0 = (f * dose) / vd
  const halfLifeHr = Math.LN2 / k
  const aucInfMgHrPerL = c0 / k
  const curve: Array<{ readonly hour: number; readonly concentrationMgL: number }> = []
  for (let t = 0; t <= duration + 1e-9; t += step) {
    const c = c0 * Math.exp(-k * t)
    curve.push({ hour: Math.round(t * 100) / 100, concentrationMgL: Math.round(c * 10000) / 10000 })
  }
  return {
    initialConcentrationMgL: Math.round(c0 * 10000) / 10000,
    halfLifeHr: Math.round(halfLifeHr * 100) / 100,
    aucInfMgHrPerL: Math.round(aucInfMgHrPerL * 1000) / 1000,
    curve,
    epistemicProvenance: {
      source: 'MECHANISTIC_SIMULATION',
      deviceOrAuthor: 'First-Order 1-Compartment PK Educational Solver',
      timestampISO: '2026-11-24T00:00:00.000Z',
      confidenceScore: 0.95,
      modelVersion: 'pk-1comp-v1',
      clinicalDisclaimerKey: 'PROBABILISTIC_SIMULATION',
      citations: ['Rowland-Tozer-Clinical-PK'],
    },
  }
}

export interface GeneExpressionOdeResult {
  readonly steadyStateMrna: number
  readonly steadyStateProtein: number
  readonly trajectory: readonly { readonly hour: number; readonly mrna: number; readonly protein: number }[]
  readonly epistemicProvenance: EpistemicProvenance
}

/** Deterministic transcription-translation ODE: dm/dt = kt - gm*m, dp/dt = kp*m - gp*p */
export function simulateGeneExpressionOde(params: {
  readonly transcriptionRateKt: number
  readonly mrnaDecayGammaM: number
  readonly translationRateKp: number
  readonly proteinDecayGammaP: number
  readonly durationHr?: number
  readonly stepHr?: number
}): GeneExpressionOdeResult {
  const kt = safePositive(params.transcriptionRateKt, 10)
  const gm = safePositive(params.mrnaDecayGammaM, 0.5)
  const kp = safePositive(params.translationRateKp, 5)
  const gp = safePositive(params.proteinDecayGammaP, 0.2)
  const duration = Math.min(120, safePositive(params.durationHr ?? 24, 24))
  const step = Math.max(0.25, Math.min(6, safePositive(params.stepHr ?? 1, 1)))

  const substeps = 20
  const dt = step / substeps
  let m = 0
  let p = 0
  const trajectory: Array<{ readonly hour: number; readonly mrna: number; readonly protein: number }> = [
    { hour: 0, mrna: 0, protein: 0 },
  ]

  for (let t = step; t <= duration + 1e-9; t += step) {
    for (let s = 0; s < substeps; s++) {
      // 4th-order Runge-Kutta for numerical stability
      const k1m = kt - gm * m
      const k1p = kp * m - gp * p
      const k2m = kt - gm * (m + 0.5 * dt * k1m)
      const k2p = kp * (m + 0.5 * dt * k1m) - gp * (p + 0.5 * dt * k1p)
      const k3m = kt - gm * (m + 0.5 * dt * k2m)
      const k3p = kp * (m + 0.5 * dt * k2m) - gp * (p + 0.5 * dt * k2p)
      const k4m = kt - gm * (m + dt * k3m)
      const k4p = kp * (m + dt * k3m) - gp * (p + dt * k3p)
      m += (dt / 6) * (k1m + 2 * k2m + 2 * k3m + k4m)
      p += (dt / 6) * (k1p + 2 * k2p + 2 * k3p + k4p)
    }
    trajectory.push({
      hour: Math.round(t * 100) / 100,
      mrna: Math.round(m * 1000) / 1000,
      protein: Math.round(p * 1000) / 1000,
    })
  }

  const steadyStateMrna = kt / gm
  const steadyStateProtein = (kp * steadyStateMrna) / gp
  return {
    steadyStateMrna: Math.round(steadyStateMrna * 1000) / 1000,
    steadyStateProtein: Math.round(steadyStateProtein * 1000) / 1000,
    trajectory,
    epistemicProvenance: {
      source: 'MECHANISTIC_SIMULATION',
      deviceOrAuthor: 'RK4 Central Dogma Transcription-Translation Solver',
      timestampISO: '2026-11-24T00:00:00.000Z',
      confidenceScore: 0.97,
      modelVersion: 'gene-ode-rk4-v1',
      clinicalDisclaimerKey: 'PROBABILISTIC_SIMULATION',
      citations: ['Alon-Systems-Biology'],
    },
  }
}
