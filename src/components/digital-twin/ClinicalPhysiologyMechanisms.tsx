import { useMemo, useState, type ReactNode } from 'react'

type TopicKey =
  | 'cardio'
  | 'respiratory'
  | 'renal'
  | 'endocrine'
  | 'neuro'
  | 'sensory'
  | 'gi'
  | 'hemostasis'
  | 'immune'
  | 'thermo'
  | 'shock'
  | 'electrolytes'

type FlowNode = { title: string; detail: string; tag?: string }
type MiniPath = { title: string; path: string; detail: string }
type Formula = { name: string; expression: string; note: string }
type Topic = {
  key: TopicKey
  emoji: string
  label: string
  kicker: string
  summary: string
  anatomy: string[]
  nodes: FlowNode[]
  miniPaths?: MiniPath[]
  formulae?: Formula[]
  challenge?: string[]
}

const TOPICS: Topic[] = [
  {
    key: 'cardio', emoji: '🫀', label: 'Cardiopulmonary', kicker: 'Flow · pressure · oxygen delivery',
    summary: 'Follow blood from venous return through the right heart, lungs, left heart and systemic circulation, while keeping HR, stroke volume, cardiac output, ejection fraction and pressure mathematically linked.',
    anatomy: ['right atrium', 'right ventricle', 'pulmonary artery', 'lungs', 'left atrium', 'left ventricle', 'aorta', 'systemic arteries', 'systemic veins'],
    nodes: [
      { title: 'Venous return', detail: 'Systemic veins deliver preload to the right atrium.', tag: 'PRELOAD' },
      { title: 'Right heart', detail: 'RV ejects blood into the pulmonary circulation.', tag: 'PUMP' },
      { title: 'Pulmonary exchange', detail: 'Alveolar-capillary gas exchange loads O₂ and removes CO₂.', tag: 'GAS' },
      { title: 'Left heart', detail: 'LV converts filling and contractility into stroke volume.', tag: 'SV' },
      { title: 'Systemic perfusion', detail: 'Cardiac output meets vascular resistance to generate organ perfusion pressure.', tag: 'MAP' },
    ],
    miniPaths: [
      { title: 'Cardiac cycle', path: 'filling → isovolumic contraction → ejection → isovolumic relaxation', detail: 'Valve state and pressure gradients determine each phase.' },
      { title: 'Oxygen delivery', path: 'lungs → Hb saturation → arterial O₂ content → cardiac output → tissue delivery', detail: 'A normal saturation alone does not define total oxygen delivery.' },
    ],
    formulae: [
      { name: 'Stroke volume', expression: 'SV = EDV − ESV', note: 'Volume ejected per beat.' },
      { name: 'Cardiac output', expression: 'CO = HR × SV', note: 'Displayed in L/min after unit conversion.' },
      { name: 'Ejection fraction', expression: 'EF = SV / EDV × 100%', note: 'EF, not “ejection rate”, is the conventional term.' },
      { name: 'Mean arterial pressure', expression: 'MAP ≈ DBP + (SBP − DBP) / 3', note: 'Useful approximation at ordinary heart rates.' },
      { name: 'Arterial O₂ content', expression: 'CaO₂ ≈ 1.34 × Hb × SaO₂ + 0.003 × PaO₂', note: 'Hb in g/dL, SaO₂ as a fraction, PaO₂ in mmHg.' },
    ],
    challenge: ['Reduced preload lowers filling and may reduce SV/CO.', 'Increased afterload can reduce ejection for a given contractile state.', 'Heart failure cannot be inferred from EF alone; physiology and phenotype matter.'],
  },
  {
    key: 'respiratory', emoji: '🫁', label: 'Respiration & spirometry', kicker: 'Ventilation · diffusion · perfusion',
    summary: 'Connect respiratory mechanics to alveolar ventilation, gas exchange and spirometry without pretending a teaching ratio replaces age/sex/height-adjusted reference interpretation.',
    anatomy: ['nose', 'pharynx', 'larynx', 'trachea', 'bronchi', 'lungs', 'alveoli', 'diaphragm', 'pulmonary capillaries'],
    nodes: [
      { title: 'Inspiration', detail: 'Diaphragm contraction lowers pleural pressure and expands the thorax.', tag: 'MECHANICS' },
      { title: 'Conducting airways', detail: 'Air is warmed, humidified and delivered toward respiratory bronchioles.', tag: 'FLOW' },
      { title: 'Alveoli', detail: 'Fresh gas reaches exchange units; dead-space ventilation does not participate in alveolar gas exchange.', tag: 'Vᴬ' },
      { title: 'Pulmonary capillary', detail: 'Diffusion and V/Q matching determine arterial gas transfer.', tag: 'V/Q' },
      { title: 'Expiration / spirometry', detail: 'Forced expiration generates the volume-time and flow-volume measurements used for FEV₁ and FVC.', tag: 'FEV₁' },
    ],
    miniPaths: [
      { title: 'Spirometer', path: 'maximal inspiration → forced expiration → volume vs time → FEV₁ + FVC → ratio + reference limits', detail: 'Restriction cannot be confirmed by spirometry alone; lung volumes are required.' },
      { title: 'Gas exchange', path: 'alveolar ventilation ↔ V/Q matching ↔ diffusion ↔ arterial blood', detail: 'Different mechanisms can produce the same low SpO₂.' },
    ],
    formulae: [
      { name: 'Minute ventilation', expression: 'V̇E = VT × RR', note: 'Total inspired/expired volume per minute.' },
      { name: 'Alveolar ventilation', expression: 'V̇A = (VT − VD) × RR', note: 'Subtracts anatomical/physiological dead-space volume.' },
      { name: 'Spirometry ratio', expression: 'FEV₁/FVC', note: 'Interpret against validated lower-limit-of-normal reference equations, not a universal cutoff alone.' },
      { name: 'Alveolar gas equation', expression: 'PAO₂ ≈ FiO₂(Patm − PH₂O) − PaCO₂/R', note: 'Teaching form; assumptions and ambient pressure matter.' },
    ],
    challenge: ['Obstruction primarily limits expiratory flow.', 'Restriction is a lung-volume diagnosis; a low FVC only raises suspicion.', 'V/Q mismatch, hypoventilation, diffusion limitation and shunt are different mechanisms of hypoxemia.'],
  },
  {
    key: 'renal', emoji: '🫘', label: 'Renal + ADH/RAAS', kicker: 'Filter · reabsorb · concentrate',
    summary: 'Move from glomerular filtration through nephron segment handling to ADH, RAAS and urine concentration. Calculations are teaching tools and require correctly measured inputs.',
    anatomy: ['kidney', 'renal artery', 'glomerulus', 'proximal tubule', 'loop of Henle', 'distal tubule', 'collecting duct', 'ureter', 'bladder'],
    nodes: [
      { title: 'Glomerulus', detail: 'Plasma water and small solutes are filtered across the glomerular barrier.', tag: 'GFR' },
      { title: 'Proximal tubule', detail: 'Bulk Na⁺, water, bicarbonate, glucose and amino-acid reabsorption.', tag: 'PCT' },
      { title: 'Loop of Henle', detail: 'Countercurrent architecture builds the medullary osmotic gradient.', tag: 'LOOP' },
      { title: 'Distal nephron', detail: 'Fine control of Na⁺, K⁺, acid-base and Ca²⁺ handling.', tag: 'DCT' },
      { title: 'Collecting duct', detail: 'ADH regulates water permeability through V2 signaling and AQP2 trafficking.', tag: 'ADH' },
    ],
    miniPaths: [
      { title: 'ADH / vasopressin axis', path: '↑ plasma osmolality or ↓ effective volume → hypothalamic sensors → posterior pituitary AVP → V2 receptor → cAMP/PKA → AQP2 insertion', detail: 'Water reabsorption increases without directly “adding sodium”.' },
      { title: 'RAAS', path: '↓ renal perfusion / NaCl delivery / β₁ signal → renin → Ang I → Ang II → vasoconstriction + aldosterone + thirst/ADH support', detail: 'Aldosterone promotes distal Na⁺ reabsorption and K⁺ secretion.' },
    ],
    formulae: [
      { name: 'Clearance', expression: 'Cx = Ux × V / Px', note: 'Requires urine concentration, urine flow and plasma concentration.' },
      { name: 'Calculated osmolality', expression: 'Osm ≈ 2Na + glucose/18 + BUN/2.8', note: 'For mg/dL glucose and BUN; a calculated estimate, not measured osmolality.' },
      { name: 'Fractional excretion of sodium', expression: 'FeNa = (UNa × SCr) / (SNa × UCr) × 100%', note: 'Clinical context and diuretics can alter interpretation.' },
    ],
    challenge: ['SIADH and diabetes insipidus are disorders of water balance with very different urine concentration patterns.', 'AKI mechanism cannot be diagnosed from FeNa alone.', 'Acid-base regulation spans filtered bicarbonate, H⁺ secretion, ammoniagenesis and respiratory compensation.'],
  },
  {
    key: 'endocrine', emoji: '🧪', label: 'Insulin & endocrine axes', kicker: 'Signal · store · mobilize',
    summary: 'See glucose sensing, insulin/glucagon actions and endocrine feedback as linked organ circuits rather than isolated hormone numbers.',
    anatomy: ['pancreas', 'liver', 'skeletal muscle', 'adipose tissue', 'hypothalamus', 'pituitary', 'adrenal gland', 'kidney'],
    nodes: [
      { title: 'Glucose sensing', detail: 'Pancreatic β cells couple nutrient metabolism to insulin secretion.', tag: 'β CELL' },
      { title: 'Insulin signal', detail: 'Receptor signaling increases glucose uptake in insulin-sensitive tissues and promotes storage.', tag: 'INSULIN' },
      { title: 'Liver', detail: 'Fed-state insulin favors glycogenesis/lipogenesis and suppresses hepatic glucose output.', tag: 'LIVER' },
      { title: 'Muscle / adipose', detail: 'GLUT4 translocation increases glucose uptake in response to insulin and muscle contraction.', tag: 'GLUT4' },
      { title: 'Counter-regulation', detail: 'Glucagon and stress hormones help mobilize fuel when glucose availability falls.', tag: 'GLUCAGON' },
    ],
    miniPaths: [
      { title: 'Insulin system', path: 'meal → glucose/incretins → β cell → insulin → liver + muscle + adipose → storage/use', detail: 'Exercise can stimulate muscle glucose uptake through insulin-independent signaling as well.' },
      { title: 'Hypothalamic-pituitary logic', path: 'sensor/input → hypothalamic releasing signal → pituitary hormone → target gland → end hormone → negative feedback', detail: 'ADH is synthesized in hypothalamic neurons and released from posterior pituitary terminals, a different architecture from anterior pituitary axes.' },
    ],
    formulae: [
      { name: 'HOMA-IR teaching surrogate', expression: 'HOMA-IR = fasting insulin × fasting glucose / 405', note: 'For insulin µU/mL and glucose mg/dL. Research/clinical surrogate; not a standalone diagnosis.' },
    ],
    challenge: ['Type 1 diabetes centers on absolute insulin deficiency from β-cell loss.', 'Type 2 diabetes combines insulin resistance with progressive β-cell dysfunction.', 'DKA is a systemic metabolic emergency, not simply “high glucose”.'],
  },
  {
    key: 'neuro', emoji: '🧠', label: 'UMN/LMN + synapse + BBB', kicker: 'Command · transmit · gate',
    summary: 'Trace voluntary motor output from cortex to muscle, then open the synapse, neurotransmitter and blood-brain-barrier layers.',
    anatomy: ['motor cortex', 'internal capsule', 'brainstem', 'spinal cord', 'anterior horn', 'peripheral nerve', 'neuromuscular junction', 'skeletal muscle', 'brain capillary'],
    nodes: [
      { title: 'Upper motor neuron', detail: 'Motor cortex axons descend through corticospinal pathways and decussate according to tract anatomy.', tag: 'UMN' },
      { title: 'Anterior horn', detail: 'Descending input synapses on spinal motor circuits and lower motor neurons.', tag: 'SYNAPSE' },
      { title: 'Lower motor neuron', detail: 'LMN axon exits through peripheral nerve to its motor units.', tag: 'LMN' },
      { title: 'Neuromuscular junction', detail: 'ACh release activates nicotinic receptors and triggers the muscle action potential.', tag: 'ACh' },
      { title: 'Muscle contraction', detail: 'Excitation-contraction coupling releases Ca²⁺ to regulate actin-myosin cycling.', tag: 'Ca²⁺' },
    ],
    miniPaths: [
      { title: 'Major transmitter roles', path: 'glutamate: major excitatory · GABA: major inhibitory · dopamine: modulatory · ACh: NMJ/autonomic/cognitive · serotonin & norepinephrine: broad modulatory systems', detail: 'A transmitter’s effect depends on receptor, circuit and location—not the molecule alone.' },
      { title: 'Blood-brain barrier', path: 'endothelial tight junctions → basement membrane/pericytes → astrocyte endfeet → selective transport → CNS interstitium', detail: 'BBB function is a neurovascular-unit property; it is not an impermeable wall.' },
    ],
    formulae: [
      { name: 'Nernst potential', expression: 'Eion = (RT / zF) ln([ion]out / [ion]in)', note: 'Equilibrium potential for one ion under defined concentrations and temperature.' },
    ],
    challenge: ['UMN and LMN lesions produce different exam patterns because their anatomical level differs.', 'Myasthenia gravis is a neuromuscular-junction disorder, not an UMN/LMN tract lesion.', 'BBB disruption can alter permeability without meaning every molecule crosses freely.'],
  },
  {
    key: 'sensory', emoji: '👁️', label: 'Vision · hearing · nose · voice', kicker: 'Transduce · encode · perceive',
    summary: 'Four linked sensory/communication pathways show how physical energy becomes neural information, and how airflow becomes speech.',
    anatomy: ['cornea', 'lens', 'retina', 'optic nerve', 'cochlea', 'auditory nerve', 'olfactory epithelium', 'olfactory bulb', 'larynx', 'vocal folds'],
    nodes: [
      { title: 'Vision', detail: 'Cornea/lens focus light → photoreceptors transduce → retinal circuits encode → optic pathway → visual cortex.', tag: 'LIGHT' },
      { title: 'Hearing', detail: 'Sound → tympanic membrane → ossicles → cochlear traveling wave → hair-cell transduction → CN VIII.', tag: 'SOUND' },
      { title: 'Smell', detail: 'Odorant binding in olfactory epithelium → CN I axons → bulb → olfactory cortical networks.', tag: 'ODOR' },
      { title: 'Voice', detail: 'Expiratory airflow + vocal-fold vibration generates sound; vocal tract resonance and articulation shape speech.', tag: 'VOICE' },
    ],
    miniPaths: [
      { title: 'Visual pathway', path: 'cornea → pupil → lens → retina → optic nerve → chiasm → tract → LGN → optic radiations → V1', detail: 'Retinal nasal fibers cross at the chiasm, organizing visual hemifields.' },
      { title: 'Auditory pathway', path: 'pinna → canal → tympanum → malleus/incus/stapes → cochlea → hair cells → CN VIII → brainstem nuclei → thalamus → auditory cortex', detail: 'Cochlear tonotopy maps frequency along the basilar membrane.' },
      { title: 'Phonation', path: 'respiratory pressure → vocal-fold oscillation → resonance → tongue/lips/palate articulation', detail: 'Fundamental frequency and perceived voice quality depend on multiple biomechanical and acoustic factors.' },
    ],
    formulae: [{ name: 'Optical power', expression: 'P = 1/f', note: 'Diopters when focal length f is in meters; the living eye is a multi-surface optical system.' }],
  },
  {
    key: 'gi', emoji: '🧬', label: 'GI + liver metabolism', kicker: 'Digest · absorb · transform',
    summary: 'Track a meal through digestion and portal delivery, then branch into hepatic carbohydrate handling and amino-acid/nitrogen metabolism.',
    anatomy: ['mouth', 'esophagus', 'stomach', 'duodenum', 'pancreas', 'gallbladder', 'small intestine', 'portal vein', 'liver', 'colon'],
    nodes: [
      { title: 'Mechanical + gastric phase', detail: 'Chewing, swallowing, acid, pepsin and gastric mixing prepare chyme.', tag: 'STOMACH' },
      { title: 'Pancreatic / biliary phase', detail: 'Pancreatic enzymes and bicarbonate join bile delivery in the duodenum.', tag: 'ENZYMES' },
      { title: 'Small-bowel absorption', detail: 'Carbohydrates and amino acids enter portal blood; most lipids enter lymph as chylomicrons.', tag: 'ABSORB' },
      { title: 'Portal liver', detail: 'The liver buffers nutrient flux, stores/releases glucose and processes amino-acid nitrogen.', tag: 'LIVER' },
      { title: 'Colon', detail: 'Water/electrolyte handling and microbial metabolism shape final stool composition.', tag: 'COLON' },
    ],
    miniPaths: [
      { title: 'Carbohydrate metabolism', path: 'glucose ↔ glycogenesis/glycogenolysis ↔ glycolysis/oxidation ↔ gluconeogenesis', detail: 'Fed/fasted hormonal state shifts pathway dominance.' },
      { title: 'Protein metabolism', path: 'dietary protein → amino acids → protein synthesis / transamination → nitrogen → urea cycle → kidney excretion', detail: 'There is no dedicated storage depot equivalent to glycogen for excess amino acids.' },
      { title: 'Fat handling', path: 'emulsification → lipase → micelles → enterocyte → chylomicron → lymph → circulation', detail: 'Shorter-chain fatty acids can use different routes.' },
    ],
    formulae: [{ name: 'Mass-balance principle', expression: 'Rate of accumulation = input − output + production − consumption', note: 'General physiology conservation relation; not a patient-specific calculator.' }],
  },
  {
    key: 'hemostasis', emoji: '🩸', label: 'Hemostasis', kicker: 'Seal · stabilize · dissolve',
    summary: 'Separate primary platelet hemostasis, secondary coagulation and fibrinolysis so a clot is understood as a controlled sequence rather than one single cascade.',
    anatomy: ['blood vessel', 'endothelium', 'platelets', 'plasma coagulation factors', 'liver', 'spleen', 'bone marrow'],
    nodes: [
      { title: 'Vessel injury', detail: 'Local vasoconstriction and exposure of subendothelial matrix initiate hemostasis.', tag: 'INJURY' },
      { title: 'Platelet adhesion', detail: 'vWF bridges exposed collagen and platelet GPIb.', tag: 'PRIMARY' },
      { title: 'Activation + aggregation', detail: 'Activated platelets recruit others and GPIIb/IIIa-fibrinogen bridges stabilize the platelet plug.', tag: 'PLATELET' },
      { title: 'Thrombin + fibrin', detail: 'Coagulation reactions generate thrombin, converting fibrinogen to fibrin and stabilizing clot structure.', tag: 'SECONDARY' },
      { title: 'Fibrinolysis', detail: 'Plasmin-mediated fibrin degradation helps remodel/remove clot after repair.', tag: 'RESOLVE' },
    ],
    miniPaths: [{ title: 'Clinical laboratory bridge', path: 'platelet count/function ↔ PT/INR ↔ aPTT ↔ fibrinogen ↔ D-dimer', detail: 'Each test samples a different part of hemostasis; none is a complete “clotting score”.' }],
  },
  {
    key: 'immune', emoji: '🛡️', label: 'Immune + allergy', kicker: 'Recognize · respond · remember',
    summary: 'Link physical barriers, innate recognition, antigen presentation, adaptive immunity and IgE-mediated allergy without collapsing the immune system into a single “strength” score.',
    anatomy: ['skin', 'mucosa', 'bone marrow', 'lymph node', 'spleen', 'thymus', 'blood', 'mast cell'],
    nodes: [
      { title: 'Barrier + innate sensing', detail: 'Epithelia, complement, phagocytes and pattern-recognition systems respond rapidly.', tag: 'INNATE' },
      { title: 'Antigen presentation', detail: 'APCs process antigen and provide signals that shape T-cell activation.', tag: 'APC' },
      { title: 'T-cell response', detail: 'Helper and cytotoxic programs coordinate cellular immune functions.', tag: 'T CELL' },
      { title: 'B cell / antibody', detail: 'B-cell activation, class switching and plasma-cell differentiation generate antibody responses.', tag: 'B CELL' },
      { title: 'Memory / resolution', detail: 'Contraction and memory allow a faster context-specific future response.', tag: 'MEMORY' },
    ],
    miniPaths: [
      { title: 'Immediate IgE allergy', path: 'sensitization → Th2-type signaling → IgE → FcεRI-bound mast cells → re-exposure → degranulation + lipid mediators', detail: 'Histamine is important but not the only mediator.' },
      { title: 'Anaphylaxis', path: 'systemic mediator release → vasodilation/permeability ± bronchospasm/airway edema → impaired perfusion/ventilation', detail: 'A medical emergency; educational visualization is not a substitute for emergency treatment.' },
    ],
  },
  {
    key: 'thermo', emoji: '🌡️', label: 'Temperature & fever', kicker: 'Sense · compare · dissipate/conserve',
    summary: 'Distinguish ordinary thermoregulation from fever: fever raises the hypothalamic set-point, whereas environmental heat illness does not require a set-point increase.',
    anatomy: ['skin', 'hypothalamus', 'blood vessels', 'sweat glands', 'skeletal muscle', 'liver'],
    nodes: [
      { title: 'Thermal sensing', detail: 'Peripheral and central thermoreceptors report temperature information.', tag: 'SENSE' },
      { title: 'Hypothalamic integration', detail: 'Neural circuits compare thermal inputs with regulated targets.', tag: 'CONTROL' },
      { title: 'Heat conservation', detail: 'Cutaneous vasoconstriction and behavior reduce heat loss.', tag: 'COLD' },
      { title: 'Heat production', detail: 'Shivering and metabolism can increase heat generation.', tag: 'SHIVER' },
      { title: 'Heat loss', detail: 'Skin vasodilation and sweating increase convective/radiative/evaporative loss when conditions allow.', tag: 'SWEAT' },
    ],
    miniPaths: [{ title: 'Fever mechanism', path: 'immune pyrogens → CNS signaling → PGE₂ → raised hypothalamic set-point → chills/vasoconstriction → plateau → set-point falls → sweating/vasodilation', detail: 'This explains why a person can feel cold while core temperature is rising.' }],
    formulae: [{ name: 'Heat balance', expression: 'S = M − W ± R ± C ± K − E', note: 'Conceptual heat-storage balance; environmental sign conventions can vary.' }],
  },
  {
    key: 'shock', emoji: '⚡', label: 'Shock systems', kicker: 'Perfusion failure · compensation',
    summary: 'Compare major shock mechanisms through preload, pump function, vascular tone and oxygen delivery instead of using one generic “shock animation”.',
    anatomy: ['heart', 'arteries', 'veins', 'lungs', 'brain', 'kidney', 'skin', 'microcirculation'],
    nodes: [
      { title: 'Trigger', detail: 'Volume loss, pump failure, vasodilation or mechanical obstruction initiates circulatory stress.', tag: 'CAUSE' },
      { title: 'Hemodynamics', detail: 'Preload, cardiac output and SVR shift in mechanism-specific directions.', tag: 'CO/SVR' },
      { title: 'Compensation', detail: 'Sympathetic and hormonal responses attempt to preserve arterial pressure and vital-organ perfusion.', tag: 'COMP' },
      { title: 'Microcirculation', detail: 'Pressure alone does not guarantee adequate capillary oxygen delivery or extraction.', tag: 'DO₂' },
      { title: 'Organ dysfunction', detail: 'Persistent oxygen supply-demand mismatch can injure kidney, brain, heart and other organs.', tag: 'ORGAN' },
    ],
    miniPaths: [
      { title: 'Hypovolemic', path: 'preload ↓ → SV/CO ↓ → compensatory SVR ↑', detail: 'Typical teaching pattern; real patients vary.' },
      { title: 'Cardiogenic', path: 'pump function ↓ → CO ↓ → filling pressures often ↑ → SVR often ↑', detail: 'Congestion and perfusion can coexist.' },
      { title: 'Distributive / septic', path: 'vasodilation + permeability + microcirculatory dysfunction → SVR ↓; CO may be high or low', detail: 'Sepsis physiology evolves over time and treatment.' },
      { title: 'Obstructive', path: 'mechanical impediment to filling/outflow → CO ↓ → compensatory vasoconstriction', detail: 'Filling-pressure patterns depend on the obstruction.' },
    ],
    formulae: [{ name: 'Shock index', expression: 'SI = HR / SBP', note: 'A screening/context metric, not a standalone diagnosis or treatment trigger.' }],
  },
  {
    key: 'electrolytes', emoji: '⚗️', label: 'Electrolytes & acid-base', kicker: 'Water · ions · membrane · pH',
    summary: 'Connect sodium to water balance, potassium to transmembrane distribution and renal excretion, calcium to signaling, and bicarbonate/CO₂ to acid-base physiology.',
    anatomy: ['kidney', 'collecting duct', 'bone', 'parathyroid gland', 'lung', 'cell membrane', 'gastrointestinal tract'],
    nodes: [
      { title: 'Sodium + water', detail: 'Serum Na⁺ mainly reflects water balance relative to exchangeable body Na⁺/K⁺, not total-body sodium alone.', tag: 'Na⁺' },
      { title: 'Potassium', detail: 'Insulin, β₂ signaling and acid-base state influence distribution; kidney controls longer-term excretion.', tag: 'K⁺' },
      { title: 'Calcium / phosphate', detail: 'PTH, vitamin D, bone, kidney and gut coordinate extracellular mineral balance.', tag: 'Ca²⁺' },
      { title: 'Bicarbonate / CO₂', detail: 'Kidney regulates bicarbonate/acid excretion while ventilation rapidly regulates PaCO₂.', tag: 'pH' },
    ],
    miniPaths: [
      { title: 'Potassium shift', path: 'extracellular K⁺ ↔ cell membrane transport ↔ intracellular pool → renal secretion/excretion', detail: 'A serum value is a small extracellular window into a much larger intracellular pool.' },
      { title: 'Acid-base partnership', path: 'metabolic acid/base production ↔ bicarbonate buffering ↔ ventilation/CO₂ ↔ renal H⁺ + NH₄⁺ excretion and HCO₃⁻ handling', detail: 'Compensation and primary disorders must be separated.' },
    ],
    formulae: [{ name: 'Henderson-Hasselbalch concept', expression: 'pH = 6.1 + log(HCO₃⁻ / (0.03 × PaCO₂))', note: 'Conceptual bicarbonate-buffer relationship using conventional clinical units.' }],
  },
]

function classForIndex(index: number) {
  return [
    'from-cyan-400/20 via-blue-500/10 to-transparent border-cyan-400/30',
    'from-violet-400/20 via-fuchsia-500/10 to-transparent border-violet-400/30',
    'from-emerald-400/20 via-teal-500/10 to-transparent border-emerald-400/30',
    'from-amber-400/20 via-orange-500/10 to-transparent border-amber-400/30',
    'from-rose-400/20 via-red-500/10 to-transparent border-rose-400/30',
  ][index % 5]
}

function FlowRail({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="no-scrollbar -mx-1 flex snap-x items-stretch gap-2 overflow-x-auto px-1 pb-2" role="list" aria-label="Physiology mechanism sequence">
      {nodes.map((node, index) => (
        <div key={node.title} className="flex shrink-0 snap-start items-stretch">
          <article role="listitem" className={`w-[205px] rounded-[22px] border bg-gradient-to-br p-3.5 ${classForIndex(index)}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-neutral-950 text-[9px] font-black text-white dark:bg-white dark:text-neutral-950">{index + 1}</span>
              {node.tag && <span className="rounded-full bg-white/75 px-2 py-1 text-[8px] font-black tracking-wide text-neutral-600 backdrop-blur dark:bg-white/10 dark:text-neutral-200">{node.tag}</span>}
            </div>
            <h4 className="mt-4 text-[13px] font-black tracking-tight text-neutral-950 dark:text-white">{node.title}</h4>
            <p className="mt-1 text-[9px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">{node.detail}</p>
          </article>
          {index < nodes.length - 1 && <div className="grid w-7 shrink-0 place-items-center text-lg font-black text-violet-400" aria-hidden>→</div>}
        </div>
      ))}
    </div>
  )
}

function NumberField({ label, value, onChange, unit, min = 0, max = 1000, step = 1 }: { label: string; value: number; onChange: (n: number) => void; unit: string; min?: number; max?: number; step?: number }) {
  return (
    <label className="rounded-2xl border border-neutral-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[.035]">
      <span className="block text-[8px] font-black uppercase tracking-[.12em] text-neutral-400">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="min-w-0 flex-1 bg-transparent text-lg font-black tabular-nums text-neutral-950 outline-none dark:text-white" />
        <span className="text-[9px] font-bold text-neutral-400">{unit}</span>
      </div>
    </label>
  )
}

function Result({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="rounded-2xl border border-white/10 bg-neutral-950 p-3 text-white dark:bg-white/[.07]"><div className="text-[8px] font-black uppercase tracking-[.12em] text-white/45">{label}</div><div className="mt-1 text-xl font-black tabular-nums">{value}</div>{note && <div className="mt-1 text-[8px] font-medium leading-relaxed text-white/45">{note}</div>}</div>
}

function TeachingLab({ topic }: { topic: TopicKey }) {
  const [cardio, setCardio] = useState({ hr: 70, edv: 120, esv: 50, sbp: 120, dbp: 80, hb: 14, sao2: 98, pao2: 95 })
  const [resp, setResp] = useState({ vt: 500, vd: 150, rr: 12, fev1: 3.6, fvc: 4.5 })
  const [renal, setRenal] = useState({ na: 140, glucose: 90, bun: 14, una: 40, scr: 1, sna: 140, ucr: 100 })
  const [endo, setEndo] = useState({ insulin: 8, glucose: 90 })
  const [shock, setShock] = useState({ hr: 90, sbp: 110 })

  if (topic === 'cardio') {
    const sv = Math.max(0, cardio.edv - cardio.esv)
    const co = cardio.hr * sv / 1000
    const ef = cardio.edv > 0 ? sv / cardio.edv * 100 : 0
    const map = cardio.dbp + (cardio.sbp - cardio.dbp) / 3
    const cao2 = 1.34 * cardio.hb * (cardio.sao2 / 100) + 0.003 * cardio.pao2
    const do2 = co * cao2 * 10
    return <LabShell title="Hemodynamic teaching lab" note="Illustrative adult inputs. Change values to see equations respond; these are not inferred patient measurements."><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><NumberField label="Heart rate" value={cardio.hr} onChange={(hr) => setCardio({ ...cardio, hr })} unit="bpm" max={240}/><NumberField label="EDV" value={cardio.edv} onChange={(edv) => setCardio({ ...cardio, edv })} unit="mL" max={300}/><NumberField label="ESV" value={cardio.esv} onChange={(esv) => setCardio({ ...cardio, esv })} unit="mL" max={250}/><NumberField label="SBP" value={cardio.sbp} onChange={(sbp) => setCardio({ ...cardio, sbp })} unit="mmHg" max={300}/><NumberField label="DBP" value={cardio.dbp} onChange={(dbp) => setCardio({ ...cardio, dbp })} unit="mmHg" max={200}/><NumberField label="Hemoglobin" value={cardio.hb} onChange={(hb) => setCardio({ ...cardio, hb })} unit="g/dL" step={0.1} max={30}/><NumberField label="SaO₂" value={cardio.sao2} onChange={(sao2) => setCardio({ ...cardio, sao2 })} unit="%" step={0.1} max={100}/><NumberField label="PaO₂" value={cardio.pao2} onChange={(pao2) => setCardio({ ...cardio, pao2 })} unit="mmHg" max={700}/></div><div className="mt-3 grid gap-2 grid-cols-2 lg:grid-cols-5"><Result label="SV" value={`${sv.toFixed(0)} mL`}/><Result label="CO" value={`${co.toFixed(2)} L/min`}/><Result label="EF" value={`${ef.toFixed(0)}%`}/><Result label="MAP" value={`${map.toFixed(0)} mmHg`}/><Result label="O₂ delivery" value={`${do2.toFixed(0)} mL/min`} note="Calculated DO₂ from teaching Hb/SaO₂/PaO₂ and CO."/></div></LabShell>
  }

  if (topic === 'respiratory') {
    const ve = resp.vt * resp.rr / 1000
    const va = Math.max(0, resp.vt - resp.vd) * resp.rr / 1000
    const ratio = resp.fvc > 0 ? resp.fev1 / resp.fvc * 100 : 0
    return <LabShell title="Ventilation & spirometry teaching lab" note="The FEV₁/FVC ratio must be interpreted against appropriate reference equations; this panel does not diagnose obstruction/restriction."><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><NumberField label="Tidal volume" value={resp.vt} onChange={(vt) => setResp({ ...resp, vt })} unit="mL" max={3000}/><NumberField label="Dead space" value={resp.vd} onChange={(vd) => setResp({ ...resp, vd })} unit="mL" max={1000}/><NumberField label="Resp. rate" value={resp.rr} onChange={(rr) => setResp({ ...resp, rr })} unit="/min" max={80}/><NumberField label="FEV₁" value={resp.fev1} onChange={(fev1) => setResp({ ...resp, fev1 })} unit="L" step={0.1} max={10}/><NumberField label="FVC" value={resp.fvc} onChange={(fvc) => setResp({ ...resp, fvc })} unit="L" step={0.1} max={12}/></div><div className="mt-3 grid grid-cols-3 gap-2"><Result label="Minute ventilation" value={`${ve.toFixed(1)} L/min`}/><Result label="Alveolar ventilation" value={`${va.toFixed(1)} L/min`}/><Result label="FEV₁/FVC" value={`${ratio.toFixed(0)}%`} note="Descriptive ratio only."/></div></LabShell>
  }

  if (topic === 'renal') {
    const osm = 2 * renal.na + renal.glucose / 18 + renal.bun / 2.8
    const fena = renal.sna > 0 && renal.ucr > 0 ? renal.una * renal.scr / (renal.sna * renal.ucr) * 100 : 0
    return <LabShell title="Water/electrolyte teaching lab" note="Calculated osmolality and FeNa depend on correct units, timing and clinical context. Neither result identifies a diagnosis by itself."><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><NumberField label="Serum Na" value={renal.na} onChange={(na) => setRenal({ ...renal, na })} unit="mmol/L" max={200}/><NumberField label="Glucose" value={renal.glucose} onChange={(glucose) => setRenal({ ...renal, glucose })} unit="mg/dL" max={1500}/><NumberField label="BUN" value={renal.bun} onChange={(bun) => setRenal({ ...renal, bun })} unit="mg/dL" max={300}/><NumberField label="Urine Na" value={renal.una} onChange={(una) => setRenal({ ...renal, una })} unit="mmol/L" max={400}/><NumberField label="Serum creatinine" value={renal.scr} onChange={(scr) => setRenal({ ...renal, scr })} unit="mg/dL" step={0.1} max={30}/><NumberField label="Serum Na for FeNa" value={renal.sna} onChange={(sna) => setRenal({ ...renal, sna })} unit="mmol/L" max={200}/><NumberField label="Urine creatinine" value={renal.ucr} onChange={(ucr) => setRenal({ ...renal, ucr })} unit="mg/dL" max={500}/></div><div className="mt-3 grid grid-cols-2 gap-2"><Result label="Calculated osmolality" value={`${osm.toFixed(0)} mOsm/kg`}/><Result label="FeNa" value={`${fena.toFixed(2)}%`} note="Context-sensitive; diuretics and many conditions alter interpretation."/></div></LabShell>
  }

  if (topic === 'endocrine') {
    const homa = endo.insulin * endo.glucose / 405
    return <LabShell title="Insulin teaching lab" note="HOMA-IR is a surrogate that varies by population, assay and context; Panacea does not label insulin resistance from this number alone."><div className="grid gap-2 sm:grid-cols-2"><NumberField label="Fasting insulin" value={endo.insulin} onChange={(insulin) => setEndo({ ...endo, insulin })} unit="µU/mL" step={0.1} max={200}/><NumberField label="Fasting glucose" value={endo.glucose} onChange={(glucose) => setEndo({ ...endo, glucose })} unit="mg/dL" max={800}/></div><div className="mt-3 max-w-xs"><Result label="HOMA-IR" value={homa.toFixed(2)} note="Teaching surrogate only."/></div></LabShell>
  }

  if (topic === 'shock') {
    const si = shock.sbp > 0 ? shock.hr / shock.sbp : 0
    return <LabShell title="Shock-index teaching lab" note="Shock index is a context/screening metric and cannot distinguish shock type or replace clinical assessment."><div className="grid gap-2 sm:grid-cols-2"><NumberField label="Heart rate" value={shock.hr} onChange={(hr) => setShock({ ...shock, hr })} unit="bpm" max={250}/><NumberField label="Systolic pressure" value={shock.sbp} onChange={(sbp) => setShock({ ...shock, sbp })} unit="mmHg" max={300}/></div><div className="mt-3 max-w-xs"><Result label="Shock index" value={si.toFixed(2)} note="HR ÷ SBP; not a standalone diagnosis."/></div></LabShell>
  }

  return null
}

function LabShell({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return <section className="rounded-[26px] border border-violet-400/20 bg-gradient-to-br from-violet-500/[.07] via-cyan-500/[.04] to-fuchsia-500/[.05] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[.15em] text-violet-600 dark:text-violet-300">Interactive equations</div><h4 className="mt-1 text-[16px] font-black text-neutral-950 dark:text-white">{title}</h4></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[8px] font-black text-amber-900 dark:bg-amber-300/10 dark:text-amber-200">TEACHING INPUTS</span></div><p className="mt-1 max-w-3xl text-[9px] font-medium leading-relaxed text-neutral-500 dark:text-neutral-400">{note}</p><div className="mt-3">{children}</div></section>
}

export function ClinicalPhysiologyMechanisms() {
  const [topicKey, setTopicKey] = useState<TopicKey>('cardio')
  const topic = useMemo(() => TOPICS.find((x) => x.key === topicKey) ?? TOPICS[0], [topicKey])

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-violet-400/20 bg-white/90 p-4 shadow-[0_24px_80px_rgba(76,60,160,.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#080b14]/92 sm:p-5">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 top-40 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-violet-600 dark:text-violet-300">Clinical Physiology Atlas · mechanism layer</div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-2xl">Real anatomy above. Mechanisms, equations and pathways below.</h2>
            <p className="mt-1 text-[10px] font-medium leading-relaxed text-neutral-500 dark:text-neutral-400">This layer does not deform HuBMAP HRA organs or pretend to simulate every molecule. It maps the major physiological sequence, shows assumptions, and exposes teaching equations only where the required variables are meaningful.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-[9px] font-bold leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">12 linked domains<br/><span className="text-neutral-400">normal physiology → mechanism → pathophysiology bridge</span></div>
        </div>

        <div className="no-scrollbar -mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
          {TOPICS.map((item) => (
            <button key={item.key} onClick={() => setTopicKey(item.key)} className={`min-w-[142px] shrink-0 snap-start rounded-2xl border p-3 text-left transition active:scale-[.98] ${item.key === topicKey ? 'border-violet-400 bg-violet-500/10 shadow-[0_8px_24px_rgba(124,92,255,.12)]' : 'border-neutral-200 bg-white/60 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="text-xl" aria-hidden>{item.emoji}</div>
              <div className="mt-2 text-[10px] font-black text-neutral-950 dark:text-white">{item.label}</div>
              <div className="mt-0.5 line-clamp-2 text-[8px] font-semibold leading-relaxed text-neutral-400">{item.kicker}</div>
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-[28px] border border-neutral-200 bg-neutral-50/60 p-4 dark:border-white/10 dark:bg-white/[.025]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl"><div className="text-[9px] font-black uppercase tracking-[.15em] text-cyan-600 dark:text-cyan-300">{topic.kicker}</div><h3 className="mt-1 text-[19px] font-black tracking-tight text-neutral-950 dark:text-white">{topic.emoji} {topic.label}</h3><p className="mt-1 text-[10px] font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">{topic.summary}</p></div>
            <div className="max-w-sm"><div className="text-[8px] font-black uppercase tracking-[.12em] text-neutral-400">Structures to correlate in 3D</div><div className="mt-1.5 flex flex-wrap justify-end gap-1">{topic.anatomy.map((x) => <span key={x} className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[8px] font-bold text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">{x}</span>)}</div></div>
          </div>

          <div className="mt-4"><div className="mb-2 text-[8px] font-black uppercase tracking-[.15em] text-neutral-400">Mechanism flow · swipe</div><FlowRail nodes={topic.nodes} /></div>

          {topic.miniPaths?.length ? <div className="mt-3 grid gap-2 lg:grid-cols-2">{topic.miniPaths.map((path, index) => <article key={path.title} className={`rounded-2xl border bg-gradient-to-br p-3 ${classForIndex(index + 1)}`}><div className="text-[9px] font-black uppercase tracking-wide text-neutral-500 dark:text-neutral-300">{path.title}</div><div className="mt-2 text-[11px] font-black leading-relaxed text-neutral-950 dark:text-white">{path.path}</div><p className="mt-1 text-[9px] font-medium leading-relaxed text-neutral-500 dark:text-neutral-400">{path.detail}</p></article>)}</div> : null}

          {topic.formulae?.length ? <div className="mt-3"><div className="mb-2 text-[8px] font-black uppercase tracking-[.15em] text-neutral-400">Equation layer</div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{topic.formulae.map((f) => <article key={f.name} className="rounded-2xl border border-neutral-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[.035]"><div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">{f.name}</div><div className="mt-1 font-mono text-[11px] font-black text-neutral-950 dark:text-white">{f.expression}</div><p className="mt-1 text-[8px] font-medium leading-relaxed text-neutral-500 dark:text-neutral-400">{f.note}</p></article>)}</div></div> : null}

          <div className="mt-4"><TeachingLab topic={topic.key} /></div>

          {topic.challenge?.length ? <div className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-500/[.045] p-3"><div className="text-[8px] font-black uppercase tracking-[.14em] text-rose-600 dark:text-rose-300">Pathophysiology bridge · not diagnosis</div><div className="mt-2 grid gap-2 md:grid-cols-3">{topic.challenge.map((x) => <div key={x} className="rounded-xl bg-white/65 p-2.5 text-[9px] font-medium leading-relaxed text-neutral-600 dark:bg-white/[.035] dark:text-neutral-300">{x}</div>)}</div></div> : null}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="text-[8px] font-semibold leading-relaxed text-neutral-400">Educational reference framework: Guyton & Hall Textbook of Medical Physiology; Boron & Boulpaep Medical Physiology; Costanzo Physiology; West’s Respiratory Physiology. Equations state units/assumptions where relevant. This atlas supports learning and visualization, not diagnosis or treatment decisions.</p>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[8px] font-black text-emerald-700 dark:text-emerald-200">SOURCE ANATOMY + HONEST MECHANISMS</span>
        </div>
      </div>
    </section>
  )
}

export default ClinicalPhysiologyMechanisms
