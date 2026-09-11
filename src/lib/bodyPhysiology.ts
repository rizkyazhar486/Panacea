export type PhysiologySystemKey =
  | 'cardiovascular'
  | 'respiratory'
  | 'neuromuscular'
  | 'sensory'
  | 'neurovascular'
  | 'gastrointestinal'
  | 'hepatic-metabolism'
  | 'renal'
  | 'endocrine'
  | 'acid-base-electrolyte'
  | 'hematologic'
  | 'immune-allergy'
  | 'reproductive'
  | 'thermoregulation'
  | 'shock'

export type PhysiologyStateKey = 'rest' | 'exercise' | 'recovery' | 'sleep'
export type PhysiologyProvenance = 'measured' | 'derived' | 'educational' | 'unavailable'

export interface PhysiologyState {
  key: PhysiologyStateKey
  label: string
  note: string
  heartRate: number
  respRate: number
  systolic: number
  diastolic: number
  strokeVolumeMl: number
  tidalVolumeMl: number
  bodyTempC: number
  contractionRate: number
  peristalsisRate: number
}

export interface PhysiologySystem {
  key: PhysiologySystemKey
  label: string
  subtitle: string
  layers: Array<'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid'>
  focusKeywords: string[]
  phases: string[]
  explanation: string
  formulae: Array<{ name: string; formula: string; meaning: string }>
}

export const PHYSIOLOGY_STATES: PhysiologyState[] = [
  {
    key: 'rest', label: 'Rest', note: 'Educational adult resting reference state. Connected measurements override only the metrics they actually provide.',
    heartRate: 70, respRate: 14, systolic: 118, diastolic: 76, strokeVolumeMl: 70, tidalVolumeMl: 500, bodyTempC: 36.8, contractionRate: 0, peristalsisRate: 8,
  },
  {
    key: 'exercise', label: 'Exercise', note: 'Illustrative moderate-to-vigorous exercise state; not a prescription and not a prediction for an individual.',
    heartRate: 155, respRate: 36, systolic: 168, diastolic: 76, strokeVolumeMl: 105, tidalVolumeMl: 1700, bodyTempC: 38.0, contractionRate: 30, peristalsisRate: 3,
  },
  {
    key: 'recovery', label: 'Recovery', note: 'Illustrative early post-exercise recovery state.',
    heartRate: 92, respRate: 20, systolic: 126, diastolic: 74, strokeVolumeMl: 80, tidalVolumeMl: 750, bodyTempC: 37.4, contractionRate: 0, peristalsisRate: 5,
  },
  {
    key: 'sleep', label: 'Sleep', note: 'Illustrative quiet-sleep physiology. Sleep stage and individual variation are not inferred here.',
    heartRate: 56, respRate: 12, systolic: 104, diastolic: 64, strokeVolumeMl: 68, tidalVolumeMl: 450, bodyTempC: 36.4, contractionRate: 0, peristalsisRate: 6,
  },
]

export const PHYSIOLOGY_SYSTEMS: PhysiologySystem[] = [
  {
    key: 'cardiovascular', label: 'Cardiovascular', subtitle: 'Filling → contraction → ejection → systemic/pulmonary perfusion', layers: ['cardiovascular', 'visceral'],
    focusKeywords: ['heart', 'atrium', 'ventricle', 'aorta', 'artery', 'vein'],
    phases: ['Ventricular filling', 'Atrial systole', 'Isovolumetric contraction', 'Ventricular ejection', 'Isovolumetric relaxation', 'Systemic and pulmonary perfusion'],
    explanation: 'Source heart and vessel geometry remains fixed. Cardiac timing, pressure and flow are represented beside the anatomy with equations, measured values when available, and explicitly educational context otherwise.',
    formulae: [
      { name: 'Mean arterial pressure', formula: 'MAP ≈ DBP + (SBP − DBP) / 3', meaning: 'Common resting approximation; less accurate with marked tachycardia or unusual waveforms.' },
      { name: 'Cardiac output', formula: 'CO = HR × SV', meaning: 'Cardiac output requires heart rate and stroke volume; Panacea labels modeled SV context rather than presenting it as measured.' },
      { name: 'Ejection fraction', formula: 'EF = SV / EDV × 100%', meaning: 'Requires ventricular end-diastolic volume and stroke volume.' },
      { name: 'Oxygen delivery', formula: 'DO₂ = CO × CaO₂ × 10', meaning: 'Links circulation to arterial oxygen content.' },
    ],
  },
  {
    key: 'respiratory', label: 'Respiratory & spirometry', subtitle: 'Ventilation → diffusion → V/Q → gas transport → spirometry', layers: ['visceral', 'cardiovascular'],
    focusKeywords: ['lung', 'bronchus', 'trachea', 'diaphragm', 'alveolus'],
    phases: ['Inspiration', 'Alveolar ventilation', 'Gas diffusion', 'Ventilation-perfusion matching', 'Expiration', 'Forced expiration / spirometry'],
    explanation: 'Lung source geometry remains static. Ventilation, diffusion and spirometry are represented as process layers; no patient FEV₁ or FVC is invented without actual measurements.',
    formulae: [
      { name: 'Minute ventilation', formula: 'V̇E = RR × VT', meaning: 'Respiratory rate multiplied by tidal volume.' },
      { name: 'Alveolar ventilation', formula: 'V̇A = RR × (VT − VD)', meaning: 'Requires dead-space volume.' },
      { name: 'Spirometry ratio', formula: 'FEV₁ / FVC', meaning: 'Interpreted with appropriate reference values and test quality, not as an isolated universal cutoff.' },
      { name: 'Alveolar gas equation', formula: 'PAO₂ ≈ FiO₂(Patm − PH₂O) − PaCO₂/R', meaning: 'Teaching approximation linking inspired oxygen and carbon dioxide to alveolar oxygen tension.' },
    ],
  },
  {
    key: 'neuromuscular', label: 'UMN · LMN · neuromuscular', subtitle: 'Motor cortex → tract → LMN → NMJ → muscle', layers: ['nervous', 'muscular', 'skeletal'],
    focusKeywords: ['brain', 'spinal cord', 'peripheral nerve', 'skeletal muscle', 'tendon'],
    phases: ['UMN motor command', 'Corticospinal transmission', 'Anterior horn / LMN output', 'Peripheral nerve conduction', 'Neuromuscular transmission', 'Excitation-contraction coupling'],
    explanation: 'Motor pathways are represented as ordered anatomy-linked mechanisms. Motor-unit recruitment and force remain task-dependent unless real EMG/force data exists.',
    formulae: [
      { name: 'Nernst potential', formula: 'Eion = (RT/zF) ln([ion]out/[ion]in)', meaning: 'Equilibrium potential for a single ion.' },
      { name: 'Membrane current', formula: 'I = g(V − Erev)', meaning: 'Conductance-based relation between voltage and reversal potential.' },
      { name: 'Joint torque', formula: 'τ = r × F', meaning: 'Rotational effect of force around a joint.' },
    ],
  },
  {
    key: 'sensory', label: 'Vision · hearing · smell · voice', subtitle: 'Physical stimulus → receptor/transduction → pathway → perception/output', layers: ['nervous', 'visceral'],
    focusKeywords: ['eye', 'retina', 'optic nerve', 'cochlea', 'ear', 'nose', 'olfactory bulb', 'larynx'],
    phases: ['Stimulus capture', 'Receptor/transducer stage', 'Neural encoding', 'Ascending pathway', 'Cortical integration', 'Motor/behavioral output where relevant'],
    explanation: 'Special-sense physiology links eye, ear, olfactory and laryngeal anatomy to their mechanisms without claiming a perfect personalized perception simulator.',
    formulae: [
      { name: 'Optical power', formula: 'P = 1 / f', meaning: 'Lens optical power in diopters when focal length is expressed in meters.' },
      { name: 'Photon energy', formula: 'E = hν', meaning: 'Energy of a photon as a function of frequency.' },
      { name: 'Sound pressure level', formula: 'SPL = 20 log₁₀(p/p₀)', meaning: 'Logarithmic sound-pressure relation.' },
      { name: 'Airflow relation', formula: 'V̇ = ΔP / R', meaning: 'Simplified pressure-flow relation relevant to upper-airway and phonatory airflow.' },
    ],
  },
  {
    key: 'neurovascular', label: 'Synapse & blood-brain barrier', subtitle: 'Transmission ↔ selective neurovascular exchange', layers: ['nervous', 'cardiovascular'],
    focusKeywords: ['brain', 'blood vessel', 'capillary', 'spinal cord'],
    phases: ['Action-potential arrival', 'Ca²⁺-dependent transmitter release', 'Postsynaptic receptor response', 'Transmitter clearance', 'BBB selective transport', 'Neurovascular coupling context'],
    explanation: 'Synaptic signaling and BBB function are related but distinct. Barrier permeability is represented as selective regulation, never as an unrestricted open vessel.',
    formulae: [
      { name: 'Nernst potential', formula: 'Eion = (RT/zF) ln([ion]out/[ion]in)', meaning: 'Ion equilibrium potential.' },
      { name: 'Fick diffusion form', formula: 'Flux ∝ A × D × ΔC / T', meaning: 'General diffusion relation; BBB transport also depends on transporters, junctions and molecular properties.' },
    ],
  },
  {
    key: 'gastrointestinal', label: 'Gastrointestinal', subtitle: 'Motility → secretion → digestion → absorption → portal delivery', layers: ['visceral', 'nervous'],
    focusKeywords: ['esophagus', 'stomach', 'duodenum', 'jejunum', 'ileum', 'colon', 'rectum'],
    phases: ['Swallow / esophageal transit', 'Gastric mixing and secretion', 'Pancreatic-biliary delivery', 'Small-bowel digestion', 'Nutrient absorption', 'Colonic water handling and propulsion'],
    explanation: 'The GI tract is treated as sequential regional physiology rather than making the whole bowel pulse. Transit and absorption values require measurements or validated models.',
    formulae: [{ name: 'Mass transport', formula: 'V̇ = Q × (Cin − Cout)', meaning: 'General flow-concentration balance when flow and concentrations are known.' }],
  },
  {
    key: 'hepatic-metabolism', label: 'Liver & nutrient metabolism', subtitle: 'Fed ↔ fasting · carbohydrate · lipid · amino-acid/nitrogen handling', layers: ['visceral', 'cardiovascular'],
    focusKeywords: ['liver', 'portal vein', 'hepatic vein', 'pancreas'],
    phases: ['Portal substrate delivery', 'Fed-state storage / synthesis', 'Fasting glycogenolysis', 'Gluconeogenesis', 'Fatty-acid oxidation / lipid export', 'Amino-acid nitrogen → urea'],
    explanation: 'Metabolic pathway direction is shown as a mechanism map. Animated substrate flow is educational and is not a measured hepatic flux.',
    formulae: [
      { name: 'Mass balance', formula: 'Accumulation = input − output + production − consumption', meaning: 'General conservation relation for a metabolite pool.' },
      { name: 'Nitrogen balance', formula: 'N balance = N intake − N losses', meaning: 'Conceptual protein/nitrogen balance; clinical use requires actual intake and loss estimates.' },
    ],
  },
  {
    key: 'renal', label: 'Renal · ADH · RAAS', subtitle: 'Perfusion → filtration → tubular handling → concentration → excretion', layers: ['visceral', 'cardiovascular'],
    focusKeywords: ['kidney', 'renal', 'ureter', 'urinary bladder'],
    phases: ['Renal perfusion', 'Glomerular filtration', 'Proximal reabsorption', 'Loop countercurrent handling', 'Distal electrolyte regulation', 'Collecting duct / ADH water regulation', 'Urine excretion'],
    explanation: 'Nephron mechanisms connect kidney anatomy to filtration, sodium/potassium handling, RAAS and ADH. eGFR or electrolyte handling is not fabricated without required inputs.',
    formulae: [
      { name: 'Clearance', formula: 'Cx = (Ux × V) / Px', meaning: 'Requires urine concentration, urine flow and plasma concentration.' },
      { name: 'Filtration fraction', formula: 'FF = GFR / RPF', meaning: 'Fraction of renal plasma flow filtered at the glomerulus.' },
      { name: 'Calculated osmolality', formula: '2[Na⁺] + glucose/18 + BUN/2.8', meaning: 'Common mg/dL-based calculated serum osmolality approximation.' },
      { name: 'Fractional Na excretion', formula: 'FeNa = (UNa × PCr)/(PNa × UCr) × 100%', meaning: 'Context-dependent renal index; not a universal etiology classifier.' },
    ],
  },
  {
    key: 'endocrine', label: 'Endocrine · insulin · hormonal axes', subtitle: 'Sensor → hypothalamic/pituitary or gland signal → target → feedback', layers: ['nervous', 'visceral', 'cardiovascular'],
    focusKeywords: ['pituitary gland', 'thyroid gland', 'adrenal gland', 'pancreas', 'hypothalamus'],
    phases: ['Signal sensing', 'Hypothalamic/pituitary integration where relevant', 'Hormone synthesis/release', 'Circulating transport', 'Target-receptor response', 'Negative/positive feedback'],
    explanation: 'ADH, thyroid, adrenal, gonadal and insulin/glucagon systems are represented as separate feedback mechanisms rather than collapsed into one generic hormone score.',
    formulae: [
      { name: 'HOMA-IR teaching surrogate', formula: 'fasting insulin × fasting glucose / 405', meaning: 'mg/dL glucose version; population/research surrogate, not a standalone diagnosis.' },
      { name: 'Feedback principle', formula: 'output → target effect → feedback to controller', meaning: 'Qualitative control-loop structure shared by many endocrine axes.' },
    ],
  },
  {
    key: 'acid-base-electrolyte', label: 'Electrolytes & acid-base', subtitle: 'Water/Na⁺ · K⁺ · Ca²⁺/phosphate · HCO₃⁻/CO₂', layers: ['visceral', 'cardiovascular', 'nervous'],
    focusKeywords: ['kidney', 'lung', 'bone', 'parathyroid gland'],
    phases: ['Water and sodium balance', 'Potassium distribution/excretion', 'Calcium-phosphate regulation', 'Buffering', 'Pulmonary CO₂ response', 'Renal acid excretion / bicarbonate handling'],
    explanation: 'Electrolyte and acid-base physiology is a multi-organ control system involving kidney, lung, bone, gut and endocrine signaling.',
    formulae: [
      { name: 'Henderson–Hasselbalch', formula: 'pH = 6.1 + log(HCO₃⁻ / (0.03 × PaCO₂))', meaning: 'Bicarbonate-buffer relation linking metabolic and respiratory components.' },
      { name: 'Anion gap', formula: 'AG = Na⁺ − (Cl⁻ + HCO₃⁻)', meaning: 'Calculated index requiring measured electrolytes and clinical context.' },
    ],
  },
  {
    key: 'hematologic', label: 'Blood & hemostasis', subtitle: 'Hematopoiesis · oxygen carriage · platelet plug · coagulation · fibrinolysis', layers: ['cardiovascular', 'lymphoid', 'skeletal'],
    focusKeywords: ['bone marrow', 'spleen', 'blood vessel'],
    phases: ['Hematopoietic production', 'Circulating blood-cell function', 'Vascular injury response', 'Platelet adhesion/activation', 'Thrombin and fibrin formation', 'Fibrinolysis / repair'],
    explanation: 'Primary hemostasis, coagulation and fibrinolysis are separated. PT/INR and aPTT sample parts of the network rather than measuring total hemostatic competence.',
    formulae: [
      { name: 'Arterial oxygen content', formula: 'CaO₂ = 1.34 × Hb × SaO₂ + 0.003 × PaO₂', meaning: 'Hemoglobin-bound plus dissolved arterial oxygen content.' },
      { name: 'Oxygen delivery', formula: 'DO₂ = CO × CaO₂ × 10', meaning: 'Connects blood oxygen content to cardiac output.' },
    ],
  },
  {
    key: 'immune-allergy', label: 'Immune & allergy', subtitle: 'Innate recognition → antigen presentation → adaptive response → memory / IgE allergy', layers: ['lymphoid', 'cardiovascular', 'visceral'],
    focusKeywords: ['spleen', 'thymus', 'lymph node', 'lymphatic vessel'],
    phases: ['Barrier / innate recognition', 'Antigen processing and presentation', 'T-cell activation/regulation', 'B-cell / antibody response', 'Effector response', 'Memory or resolution', 'IgE-mast-cell pathway when allergic'],
    explanation: 'Immune responses are pathway- and tissue-specific. Panacea does not generate a universal “immune strength” score.',
    formulae: [{ name: 'No universal immune scalar', formula: 'response = f(cell type, receptor, antigen, tissue, time)', meaning: 'Immune function cannot be reduced to one valid generic percentage.' }],
  },
  {
    key: 'reproductive', label: 'Reproductive physiology', subtitle: 'HPG axis · gametogenesis · cycle · fertilization · sexual function', layers: ['visceral', 'cardiovascular', 'nervous'],
    focusKeywords: ['ovary', 'uterus', 'testis', 'prostate', 'pituitary gland'],
    phases: ['Hypothalamic-pituitary-gonadal signaling', 'Gametogenesis', 'Gonadal steroid feedback', 'Female cycle / endometrial response', 'Fertilization and implantation context', 'Sexual function / reproductive tract output'],
    explanation: 'Male and female reproductive mechanisms share HPG control but have distinct anatomy, cycles and outputs; pregnancy physiology requires a dedicated maternal-fetal context.',
    formulae: [{ name: 'Control-loop concept', formula: 'GnRH → LH/FSH → gonad → sex steroids/inhibin → feedback', meaning: 'Qualitative HPG-axis organization.' }],
  },
  {
    key: 'thermoregulation', label: 'Thermoregulation & fever', subtitle: 'Thermal sensing → hypothalamus → skin/sweat/shivering → heat balance', layers: ['surface', 'cardiovascular', 'muscular', 'visceral', 'nervous'],
    focusKeywords: ['skin', 'artery', 'vein', 'muscle', 'brain'],
    phases: ['Peripheral/core thermal sensing', 'Hypothalamic integration', 'Cutaneous vasomotor response', 'Sweating or shivering', 'Heat exchange', 'Pyrogen → PGE₂ → set-point change in fever'],
    explanation: 'Temperature may come from a connected source. Sweating, shivering and fever mechanisms are educational unless relevant physiological/environmental inputs are measured.',
    formulae: [{ name: 'Heat balance', formula: 'S = M − W ± R ± C ± K − E', meaning: 'Stored heat equals metabolic heat minus work plus radiative, convective, conductive and evaporative exchange.' }],
  },
  {
    key: 'shock', label: 'Shock & whole-body perfusion', subtitle: 'Preload · pump · vascular tone/obstruction → perfusion → oxygen delivery', layers: ['cardiovascular', 'visceral', 'nervous'],
    focusKeywords: ['heart', 'aorta', 'artery', 'vein', 'lung', 'kidney', 'brain'],
    phases: ['Hemodynamic insult', 'Compensatory autonomic response', 'Preload/CO/SVR pattern', 'Macro-perfusion change', 'Microcirculatory dysfunction', 'Cellular oxygen-delivery mismatch / organ dysfunction'],
    explanation: 'Hypovolemic, cardiogenic, distributive and obstructive shock are different hemodynamic mechanisms. The atlas uses qualitative archetypes and does not turn them into treatment targets.',
    formulae: [
      { name: 'Pressure-flow relation', formula: 'MAP − RAP ≈ CO × SVR', meaning: 'Simplified systemic hemodynamic relation.' },
      { name: 'Shock index', formula: 'SI = HR / SBP', meaning: 'Contextual screening index, not a diagnosis.' },
      { name: 'Fick oxygen use', formula: 'VO₂ = CO × (CaO₂ − CvO₂) × 10', meaning: 'Links cardiac output to arteriovenous oxygen-content difference.' },
    ],
  },
]

export function meanArterialPressure(systolic: number, diastolic: number) {
  return diastolic + (systolic - diastolic) / 3
}

export function pulsePressure(systolic: number, diastolic: number) {
  return systolic - diastolic
}

export function cardiacOutputLMin(heartRate: number, strokeVolumeMl: number) {
  return (heartRate * strokeVolumeMl) / 1000
}

export function minuteVentilationLMin(respRate: number, tidalVolumeMl: number) {
  return (respRate * tidalVolumeMl) / 1000
}

export function physiologyState(key: PhysiologyStateKey) {
  return PHYSIOLOGY_STATES.find((state) => state.key === key) ?? PHYSIOLOGY_STATES[0]
}

export function physiologySystem(key: PhysiologySystemKey) {
  return PHYSIOLOGY_SYSTEMS.find((system) => system.key === key) ?? PHYSIOLOGY_SYSTEMS[0]
}
