import type { AnatomyLayer } from '../components/Body3D'

export type PhysiologyDomain =
  | 'sensory'
  | 'neuro'
  | 'cardiopulmonary'
  | 'renal-endocrine'
  | 'metabolism'
  | 'defense'
  | 'homeostasis'

export interface PhysiologyFormula {
  label: string
  expression: string
  variables: string
  note?: string
}

export interface PhysiologyReference {
  label: string
  href?: string
}

export interface PhysiologyDeepDive {
  id: string
  label: string
  domain: PhysiologyDomain
  summary: string
  sequence: string[]
  control: string
  formulas: PhysiologyFormula[]
  layer3d?: AnatomyLayer['key']
  searchTerms: string[]
  boundary: string
  references: PhysiologyReference[]
}

const NCBI = {
  vision: 'https://www.ncbi.nlm.nih.gov/books/NBK538493/',
  hearing: 'https://www.ncbi.nlm.nih.gov/books/NBK531483/',
  bbb: 'https://www.ncbi.nlm.nih.gov/books/NBK557721/',
  osmo: 'https://www.ncbi.nlm.nih.gov/books/NBK541108/',
  glucose: 'https://www.ncbi.nlm.nih.gov/books/NBK545201/',
  insulin: 'https://www.ncbi.nlm.nih.gov/books/NBK545190/',
  spirometry: 'https://www.ncbi.nlm.nih.gov/books/NBK560526/',
  hemostasis: 'https://www.ncbi.nlm.nih.gov/books/NBK507795/',
  fever: 'https://www.ncbi.nlm.nih.gov/books/NBK562334/',
}

export const PHYSIOLOGY_DEEP_DIVES: PhysiologyDeepDive[] = [
  {
    id: 'vision',
    label: 'Vision: optics → retina → cortex',
    domain: 'sensory',
    summary: 'Tracks a photon from corneal refraction through retinal phototransduction, optic pathways and cortical visual processing.',
    sequence: [
      'Cornea provides most refractive power; the lens changes curvature for accommodation.',
      'Light hyperpolarizes rods and cones through the rhodopsin/transducin/cGMP cascade rather than depolarizing them.',
      'Bipolar and ganglion cells encode contrast; ganglion axons form the optic nerve.',
      'Nasal retinal fibres cross in the optic chiasm; optic tracts relay mainly through the lateral geniculate nucleus.',
      'Optic radiations project to primary visual cortex around the calcarine fissure while parallel pathways support reflexes and eye movements.',
    ],
    control: 'Pupillary light reflex regulates retinal illumination; accommodation couples lens shape, convergence and pupillary constriction for near vision.',
    formulas: [
      { label: 'Thin-lens teaching relation', expression: '1/f = 1/dₒ + 1/dᵢ', variables: 'f focal length; dₒ object distance; dᵢ image distance', note: 'A simplified optics relation; the living eye is a multi-surface optical system.' },
      { label: 'Decimal visual acuity', expression: 'VA = 1 / MAR', variables: 'MAR = minimum angle of resolution in arc-minutes' },
    ],
    layer3d: 'nervous',
    searchTerms: ['eye', 'retina', 'optic nerve', 'optic chiasm', 'visual cortex'],
    boundary: 'Educational pathway visualization; it does not infer visual field defects or diagnose ocular disease from symptoms alone.',
    references: [{ label: 'NCBI Bookshelf — Physiology, Vision', href: NCBI.vision }],
  },
  {
    id: 'hearing',
    label: 'Hearing: sound → cochlea → auditory cortex',
    domain: 'sensory',
    summary: 'Connects sound pressure, ossicular mechanics, cochlear tonotopy, hair-cell transduction and the bilateral central auditory pathway.',
    sequence: [
      'The tympanic membrane converts air-pressure oscillation into mechanical vibration.',
      'Malleus, incus and stapes transfer energy to the oval window and help match air impedance to cochlear fluid.',
      'A travelling wave along the basilar membrane separates frequencies: high frequencies peak basally and low frequencies more apically.',
      'Stereocilia deflection opens mechanically gated channels; potassium-rich endolymph drives hair-cell depolarization and transmitter release.',
      'Auditory nerve activity reaches cochlear nuclei, superior olivary complexes, inferior colliculus, medial geniculate body and auditory cortex with extensive bilateral projections.',
    ],
    control: 'Outer hair cells provide active cochlear amplification; efferent olivocochlear pathways modulate cochlear gain.',
    formulas: [
      { label: 'Sound-pressure level', expression: 'SPL = 20·log₁₀(p/p₀) dB', variables: 'p RMS sound pressure; p₀ = 20 µPa in air' },
    ],
    layer3d: 'nervous',
    searchTerms: ['ear', 'cochlea', 'auditory nerve', 'inferior colliculus', 'auditory cortex'],
    boundary: 'The decibel display is physical acoustics education, not an audiogram or hearing-threshold test.',
    references: [{ label: 'NCBI Bookshelf — Physiology, Cochlear Function', href: NCBI.hearing }],
  },
  {
    id: 'umn-lmn',
    label: 'Motor control: UMN → LMN → muscle',
    domain: 'neuro',
    summary: 'Shows how cortical motor commands descend through corticospinal pathways, synapse on lower motor neurons and recruit skeletal muscle.',
    sequence: [
      'Upper motor neuron populations in motor cortex and brainstem generate descending commands.',
      'Corticospinal fibres pass through corona radiata and internal capsule, descend through the brainstem and mostly decussate in the caudal medulla.',
      'Spinal interneurons integrate descending command with sensory feedback before lower motor neurons fire.',
      'Lower motor neuron axons exit through ventral roots and release acetylcholine at neuromuscular junctions.',
      'Muscle action potentials trigger calcium release and cross-bridge cycling; sensory feedback continually updates the command.',
    ],
    control: 'Motor cortex, basal ganglia, cerebellum, brainstem and spinal reflex circuits cooperate; no single structure acts as an isolated movement controller.',
    formulas: [
      { label: 'Nernst equilibrium potential', expression: 'Eᵢₒₙ = (RT/zF)·ln([ion]out/[ion]in)', variables: 'R gas constant; T temperature; z ionic charge; F Faraday constant', note: 'One building block of membrane electrophysiology, not a full action-potential model.' },
    ],
    layer3d: 'nervous',
    searchTerms: ['motor cortex', 'corticospinal tract', 'spinal cord', 'motor neuron', 'neuromuscular junction'],
    boundary: 'Educational localization only. UMN/LMN signs require neurologic examination and clinical context.',
    references: [{ label: 'Standard neurophysiology: corticospinal and motor-unit physiology' }],
  },
  {
    id: 'bbb',
    label: 'Blood–brain barrier',
    domain: 'neuro',
    summary: 'Explains why cerebral capillaries are selectively permeable and how endothelial tight junctions, pericytes, basement membrane and astrocytic signaling form the neurovascular unit.',
    sequence: [
      'Brain endothelial cells are joined by unusually restrictive tight junctions.',
      'Small lipid-soluble molecules can diffuse; many nutrients require selective carriers, while larger or hydrophilic substances are restricted.',
      'Efflux transporters remove selected xenobiotics from endothelial cells back toward blood.',
      'Pericytes, basement membrane and astrocytic end-feet support barrier phenotype and neurovascular coupling.',
      'Barrier properties vary by region; circumventricular organs deliberately have different permeability.',
    ],
    control: 'The neurovascular unit dynamically couples blood flow, transport and barrier integrity to neuronal and glial activity.',
    formulas: [
      { label: 'Fick diffusion teaching relation', expression: 'J = −D·ΔC/Δx', variables: 'J diffusive flux; D diffusion coefficient; ΔC concentration difference; Δx diffusion distance', note: 'Real BBB transport also depends on partitioning, carriers, efflux and tight-junction permeability.' },
    ],
    layer3d: 'cardiovascular',
    searchTerms: ['brain capillary', 'blood brain barrier', 'cerebral vessel', 'astrocyte'],
    boundary: 'A permeability concept model; it cannot predict whether a specific drug crosses the BBB without compound-specific evidence.',
    references: [{ label: 'NCBI Bookshelf — Physiology, Blood Brain Barrier', href: NCBI.bbb }],
  },
  {
    id: 'adh-osmoregulation',
    label: 'ADH, thirst & osmoregulation',
    domain: 'renal-endocrine',
    summary: 'Links hypothalamic osmoreceptors, posterior-pituitary vasopressin, thirst and collecting-duct water handling.',
    sequence: [
      'Rising effective plasma osmolality activates hypothalamic osmoreceptors; marked volume loss can also strongly stimulate vasopressin.',
      'ADH/vasopressin is released from posterior-pituitary nerve terminals into blood.',
      'V2-receptor signaling in collecting-duct principal cells increases apical aquaporin-2 water channels.',
      'Water reabsorption rises along the medullary osmotic gradient, concentrating urine and lowering plasma osmolality.',
      'Thirst adds behavioural water intake to the renal response.',
    ],
    control: 'Negative feedback through osmolality and effective circulating volume; RAAS and sympathetic tone interact with the volume component.',
    formulas: [
      { label: 'Estimated plasma osmolarity', expression: '≈ 2·Na + glucose/18 + BUN/2.8', variables: 'Na mmol/L; glucose and BUN mg/dL', note: 'Clinical estimate, not directly measured osmolality.' },
      { label: 'Free-water clearance', expression: 'Cᴴ₂O = V − Cₒₛₘ', variables: 'V urine flow; Cₒₛₘ osmolar clearance' },
    ],
    layer3d: 'visceral',
    searchTerms: ['hypothalamus', 'posterior pituitary', 'kidney', 'collecting duct'],
    boundary: 'Teaching physiology only; sodium disorders and polyuria require measured serum/urine studies and clinical assessment.',
    references: [{ label: 'NCBI Bookshelf — Physiology, Osmoregulation and Excretion', href: NCBI.osmo }],
  },
  {
    id: 'insulin',
    label: 'Insulin & glucose handling',
    domain: 'renal-endocrine',
    summary: 'Connects meal absorption, pancreatic β-cell sensing, insulin-receptor signaling, GLUT4 trafficking and hepatic glucose storage.',
    sequence: [
      'Absorbed carbohydrate raises portal and systemic glucose, increasing pancreatic β-cell insulin secretion.',
      'Insulin binds a receptor tyrosine kinase and activates intracellular phosphorylation pathways.',
      'Skeletal muscle and adipose tissue increase GLUT4 availability at the membrane, increasing glucose uptake.',
      'Liver shifts toward glycogen synthesis and away from hepatic glucose output while adipose lipolysis is restrained.',
      'As glucose falls, insulin declines and glucagon becomes relatively more important for maintaining hepatic glucose release.',
    ],
    control: 'Insulin and glucagon form a state-dependent counter-regulatory system; catecholamines, cortisol and growth hormone become increasingly important during stress or prolonged fasting.',
    formulas: [],
    layer3d: 'visceral',
    searchTerms: ['pancreas', 'islet', 'liver', 'skeletal muscle', 'adipose'],
    boundary: 'This pathway does not estimate insulin resistance or prescribe glucose-lowering treatment.',
    references: [
      { label: 'NCBI Bookshelf — Physiology, Glucose', href: NCBI.glucose },
      { label: 'NCBI Bookshelf — Human Insulin', href: NCBI.insulin },
    ],
  },
  {
    id: 'digestion',
    label: 'Digestion & nutrient absorption',
    domain: 'metabolism',
    summary: 'Follows carbohydrate, protein and fat from mechanical processing to enzymatic digestion, intestinal absorption and portal/lymphatic transport.',
    sequence: [
      'Saliva begins starch digestion while chewing reduces particle size; swallowing transfers the bolus through the esophagus.',
      'The stomach acidifies contents, activates pepsin and meters chyme into the duodenum.',
      'Pancreatic bicarbonate neutralizes acid; pancreatic enzymes and bile enable macronutrient digestion.',
      'Enterocytes absorb monosaccharides and amino acids to portal blood; most long-chain lipids leave as chylomicrons through lymph.',
      'The colon reabsorbs water/electrolytes and microbiota ferment selected substrates into metabolites such as short-chain fatty acids.',
    ],
    control: 'Enteric neural circuits coordinate motility while gastrin, secretin, CCK, GLP-1, GIP and autonomic inputs coordinate secretion and post-meal physiology.',
    formulas: [],
    layer3d: 'visceral',
    searchTerms: ['stomach', 'duodenum', 'small intestine', 'pancreas', 'liver', 'colon'],
    boundary: 'Transit times and absorption vary substantially; the sequence is an educational normal-physiology map.',
    references: [{ label: 'Standard gastrointestinal physiology: secretion, motility and absorption' }],
  },
  {
    id: 'spirometry',
    label: 'Spirometry & respiratory mechanics',
    domain: 'cardiopulmonary',
    summary: 'Turns a forced breath into volume–time and flow–volume concepts while separating measured spirometry from inferred disease patterns.',
    sequence: [
      'A valid maneuver starts after maximal inspiration at total lung capacity.',
      'The subject exhales as hard and completely as possible; the instrument integrates airflow into exhaled volume over time.',
      'FEV₁ is the volume expired in the first second; FVC is the total forced vital capacity.',
      'The FEV₁/FVC ratio helps characterize airflow obstruction when interpreted against appropriate reference limits.',
      'Flow–volume loop shape adds mechanical context, but quality and repeatability must be checked before interpretation.',
    ],
    control: 'Airway resistance, lung elastic recoil, respiratory muscle effort and dynamic airway compression shape the maneuver.',
    formulas: [
      { label: 'FEV₁/FVC', expression: 'ratio = FEV₁ / FVC × 100%', variables: 'FEV₁ and FVC measured from an acceptable forced expiratory maneuver' },
      { label: 'Minute ventilation', expression: 'V̇E = Vᴛ × f', variables: 'Vᴛ tidal volume; f respiratory frequency' },
      { label: 'Alveolar ventilation', expression: 'V̇A = (Vᴛ − Vᴅ) × f', variables: 'Vᴅ physiologic dead-space volume' },
    ],
    layer3d: 'visceral',
    searchTerms: ['lung', 'bronchus', 'diaphragm', 'alveolus'],
    boundary: 'The module teaches mechanics. Diagnostic spirometry requires quality criteria, reference equations and clinical interpretation.',
    references: [{ label: 'NCBI Bookshelf — Spirometry', href: NCBI.spirometry }],
  },
  {
    id: 'hemostasis',
    label: 'Hemostasis: vessel → platelet → fibrin → lysis',
    domain: 'defense',
    summary: 'Shows hemostasis as a regulated sequence rather than a memorized intrinsic/extrinsic cascade in isolation.',
    sequence: [
      'Vascular injury exposes subendothelial matrix and initiates local vasoconstriction.',
      'von Willebrand factor supports platelet adhesion; activated platelets change shape, secrete mediators and aggregate.',
      'Tissue-factor and coagulation enzyme complexes generate thrombin on phospholipid surfaces.',
      'Thrombin converts fibrinogen to fibrin and amplifies platelet/coagulation activation, stabilizing the plug.',
      'Natural anticoagulant systems restrict clotting spatially; fibrinolysis later remodels and removes fibrin.',
    ],
    control: 'Endothelium, antithrombin, protein C/S, tissue-factor pathway inhibitor and fibrinolytic mechanisms constrain clot formation to the injury site.',
    formulas: [],
    layer3d: 'cardiovascular',
    searchTerms: ['blood vessel', 'platelet', 'fibrin', 'liver'],
    boundary: 'Educational cascade only. PT/INR, aPTT, platelet function and bleeding risk cannot be inferred from this animation.',
    references: [{ label: 'NCBI Bookshelf — Physiology, Clotting Mechanism', href: NCBI.hemostasis }],
  },
  {
    id: 'temperature-fever',
    label: 'Thermoregulation & fever',
    domain: 'homeostasis',
    summary: 'Separates ordinary heat balance, regulated fever and unregulated hyperthermia.',
    sequence: [
      'Core and skin thermoreceptors feed temperature information to hypothalamic networks.',
      'Heat stress increases skin blood flow and sweating; cold stress triggers vasoconstriction and, when needed, shivering thermogenesis.',
      'In fever, inflammatory mediators drive PGE₂ signaling that raises the hypothalamic defended set point.',
      'The person then feels cold and conserves/generates heat until core temperature approaches the new set point.',
      'When the set point returns toward normal, vasodilation and sweating promote heat loss; hyperthermia differs because the set point is not raised.',
    ],
    control: 'Hypothalamic negative feedback integrates autonomic, endocrine and behavioral effectors; hydration, humidity, clothing and workload alter heat exchange.',
    formulas: [
      { label: 'Human heat balance', expression: 'S = M − W ± R ± C ± K − E', variables: 'S heat storage; M metabolism; W external work; R radiation; C convection; K conduction; E evaporation', note: 'Signs depend on heat-flow direction.' },
    ],
    layer3d: 'surface',
    searchTerms: ['skin', 'hypothalamus', 'sweat gland', 'blood vessel'],
    boundary: 'The heat-balance view is educational and is not a core-temperature measurement or heat-illness triage tool.',
    references: [{ label: 'NCBI Bookshelf — Physiology, Fever', href: NCBI.fever }],
  },
  {
    id: 'olfaction',
    label: 'Nasal airflow & olfaction',
    domain: 'sensory',
    summary: 'Connects nasal conditioning of inspired air with odorant delivery to olfactory receptor neurons and cortical processing.',
    sequence: [
      'Turbinates create a large vascular mucosal surface that warms, humidifies and filters inspired air.',
      'A fraction of airflow reaches the olfactory cleft, where odorants dissolve in mucus.',
      'Odorant receptors on olfactory neurons activate G-protein signaling that changes cyclic-nucleotide gated conductance.',
      'Axons pass through the cribriform plate to glomeruli in the olfactory bulb.',
      'Bulbar output reaches primary olfactory cortex and limbic networks without the obligatory first thalamic relay typical of other senses.',
    ],
    control: 'Autonomic regulation changes nasal vascular engorgement; sniffing behavior actively controls odor sampling.',
    formulas: [],
    layer3d: 'visceral',
    searchTerms: ['nose', 'nasal cavity', 'olfactory bulb', 'cribriform plate'],
    boundary: 'Educational airflow and sensory pathway only; smell loss has many conductive, sensorineural and central causes.',
    references: [{ label: 'Standard olfactory and nasal physiology' }],
  },
  {
    id: 'voice',
    label: 'Voice & phonation',
    domain: 'sensory',
    summary: 'Shows phonation as airflow-driven vocal-fold oscillation shaped by laryngeal control and vocal-tract resonance.',
    sequence: [
      'Expiratory pressure from the lungs provides aerodynamic energy.',
      'Adducted vocal folds enter self-sustained oscillation through tissue elasticity, pressure and airflow interactions.',
      'Intrinsic laryngeal muscles adjust vocal-fold length, tension and closure.',
      'Pharynx, oral cavity and nasal cavity shape the spectral envelope into recognizable speech sounds.',
      'Auditory and somatosensory feedback continuously refine pitch, loudness and articulation.',
    ],
    control: 'Brainstem respiratory control, cortical speech networks, recurrent/superior laryngeal nerves and intrinsic laryngeal muscles coordinate phonation.',
    formulas: [
      { label: 'Idealized string-frequency analogy', expression: 'f₀ ≈ (1/2L)·√(T/μ)', variables: 'L effective vibrating length; T tension; μ effective mass per length', note: 'Vocal folds are layered viscoelastic tissue, not ideal strings; this is a teaching analogy only.' },
    ],
    layer3d: 'visceral',
    searchTerms: ['larynx', 'vocal fold', 'pharynx', 'recurrent laryngeal nerve'],
    boundary: 'The relation is a physics analogy, not a patient-specific voice model or laryngoscopic assessment.',
    references: [{ label: 'Standard laryngeal physiology and source–filter theory' }],
  },
  {
    id: 'renal-clearance',
    label: 'Renal filtration, transport & clearance',
    domain: 'renal-endocrine',
    summary: 'Connects renal blood flow, glomerular filtration, tubular transport and urinary excretion quantitatively.',
    sequence: [
      'Renal perfusion delivers plasma to glomerular capillaries, where pressure drives ultrafiltration into Bowman space.',
      'Proximal tubule performs bulk reabsorption of sodium, water, bicarbonate, glucose and amino acids.',
      'Loop of Henle and vasa recta establish and preserve the medullary osmotic gradient.',
      'Distal nephron and collecting duct perform regulated fine-tuning of sodium, potassium, acid–base and water balance.',
      'Urinary excretion is the net result of filtration, reabsorption and secretion.',
    ],
    control: 'Autoregulation stabilizes renal blood flow/GFR over a range of pressures; RAAS, sympathetic tone, natriuretic peptides, aldosterone and ADH adapt volume and solute handling.',
    formulas: [
      { label: 'Renal clearance', expression: 'Cₓ = Uₓ·V / Pₓ', variables: 'Uₓ urine concentration; V urine flow; Pₓ plasma concentration' },
      { label: 'Filtered load', expression: 'Filtered loadₓ = GFR · Pₓ', variables: 'For freely filtered solute x' },
      { label: 'Excretion balance', expression: 'Excretion = Filtration − Reabsorption + Secretion', variables: 'Mass/time balance across the nephron' },
    ],
    layer3d: 'visceral',
    searchTerms: ['kidney', 'glomerulus', 'nephron', 'collecting duct'],
    boundary: 'Equations require measured concentrations/flow and do not substitute for clinical kidney-function interpretation.',
    references: [{ label: 'NCBI Bookshelf — Osmoregulation and Excretion', href: NCBI.osmo }],
  },
  {
    id: 'electrolytes-acid-base',
    label: 'Electrolytes & acid–base',
    domain: 'renal-endocrine',
    summary: 'Maps sodium/water balance, potassium distribution and bicarbonate/CO₂ buffering across kidney, lung and cells.',
    sequence: [
      'Plasma sodium mainly reflects water balance relative to exchangeable body sodium/potassium rather than total-body sodium alone.',
      'Potassium is predominantly intracellular; insulin, β₂-adrenergic signaling and acid–base state shift potassium between compartments.',
      'Bicarbonate buffers nonvolatile acid while ventilation controls carbon dioxide within minutes.',
      'Kidneys reclaim filtered bicarbonate, excrete titratable acid/ammonium and generate new bicarbonate over hours to days.',
      'Electroneutrality means apparent electrolyte gaps are accounting tools, not literal unmeasured electrical charge.',
    ],
    control: 'ADH/thirst regulate water, RAAS/aldosterone regulate sodium and potassium handling, and respiratory/renal feedback cooperate to regulate pH.',
    formulas: [
      { label: 'Anion gap', expression: 'AG = Na − (Cl + HCO₃)', variables: 'All concentrations in mmol/L; albumin and local laboratory conventions matter' },
      { label: 'Henderson–Hasselbalch', expression: 'pH = 6.1 + log₁₀(HCO₃⁻ / (0.03·PaCO₂))', variables: 'HCO₃⁻ mmol/L; PaCO₂ mmHg' },
    ],
    layer3d: 'visceral',
    searchTerms: ['kidney', 'lung', 'blood', 'adrenal gland'],
    boundary: 'Educational acid–base accounting. Real interpretation requires blood gas/electrolyte data, albumin and clinical context.',
    references: [{ label: 'Standard renal and respiratory acid–base physiology' }],
  },
  {
    id: 'hepatic-carbohydrate',
    label: 'Hepatic carbohydrate metabolism',
    domain: 'metabolism',
    summary: 'Shows the liver switching between post-meal glucose storage and fasting glucose production.',
    sequence: [
      'Portal glucose and insulin after a meal favor hepatic glucose uptake, glycolysis and glycogen synthesis.',
      'Between meals, falling insulin and rising glucagon favor glycogen breakdown and hepatic glucose release.',
      'As fasting continues, gluconeogenesis from lactate, glycerol and glucogenic amino-acid carbon skeletons becomes increasingly important.',
      'Cori-cycle lactate and alanine-cycle substrates link peripheral tissues back to hepatic glucose production.',
      'Hepatic acetyl-CoA, redox state and substrate availability couple carbohydrate handling to fatty-acid oxidation and ketogenesis.',
    ],
    control: 'Insulin/glucagon ratio is a major state signal, with catecholamines and cortisol adding stress/fasting regulation.',
    formulas: [
      { label: 'Conceptual hepatic glucose balance', expression: 'Net HGO = glycogenolysis + gluconeogenesis − hepatic glucose uptake', variables: 'HGO = hepatic glucose output', note: 'A mass-balance concept, not a bedside calculation.' },
    ],
    layer3d: 'visceral',
    searchTerms: ['liver', 'portal vein', 'pancreas', 'skeletal muscle'],
    boundary: 'Pathway teaching only; fluxes are not patient-specific without tracer or metabolic data.',
    references: [{ label: 'NCBI Bookshelf — Physiology, Glucose', href: NCBI.glucose }],
  },
  {
    id: 'protein-metabolism',
    label: 'Protein & amino-acid metabolism',
    domain: 'metabolism',
    summary: 'Connects dietary protein, amino-acid pools, protein turnover, nitrogen disposal and hepatic urea production.',
    sequence: [
      'Dietary proteins are hydrolyzed to peptides/amino acids and absorbed from the small intestine.',
      'Amino acids enter dynamic pools used for protein synthesis, signaling molecules and other nitrogen-containing compounds.',
      'There is no dedicated storage polymer for excess amino acids; nitrogen is removed while carbon skeletons enter energy/metabolic pathways.',
      'Ammonia generated from nitrogen metabolism is detoxified largely through the hepatic urea cycle.',
      'Kidneys excrete urea and adapt ammonium excretion during acid–base stress.',
    ],
    control: 'Feeding, insulin, amino-acid availability, resistance exercise, illness, glucocorticoids and energy balance alter protein synthesis/breakdown.',
    formulas: [
      { label: 'Nitrogen balance', expression: 'N balance = N intake − N losses', variables: 'Positive values imply net nitrogen retention; complete measurement of losses is difficult' },
    ],
    layer3d: 'visceral',
    searchTerms: ['small intestine', 'liver', 'kidney', 'skeletal muscle'],
    boundary: 'Nitrogen balance is a population/clinical nutrition concept and is not inferred here from dietary logs alone.',
    references: [{ label: 'Standard amino-acid, urea-cycle and protein-turnover physiology' }],
  },
  {
    id: 'cardiopulmonary',
    label: 'Cardiopulmonary oxygen delivery',
    domain: 'cardiopulmonary',
    summary: 'Links ventilation, diffusion, hemoglobin oxygen content, cardiac output and tissue oxygen delivery in one chain.',
    sequence: [
      'Ventilation brings fresh gas to alveoli while pulmonary perfusion delivers mixed venous blood.',
      'Oxygen diffuses into pulmonary capillary blood and binds hemoglobin; carbon dioxide diffuses in the opposite direction.',
      'Left ventricular output delivers arterial oxygen content to systemic tissues.',
      'Tissues extract oxygen according to demand; venous oxygen content reflects the balance between delivery and consumption.',
      'Exercise raises cardiac output and ventilation while redistributing flow toward active muscle and skin.',
    ],
    control: 'Autonomic control, local metabolic vasodilation, chemoreflexes, preload/afterload and ventilatory control cooperate across time scales.',
    formulas: [
      { label: 'Cardiac output', expression: 'CO = HR × SV', variables: 'HR heart rate; SV stroke volume' },
      { label: 'Stroke volume', expression: 'SV = EDV − ESV', variables: 'EDV end-diastolic volume; ESV end-systolic volume' },
      { label: 'Ejection fraction', expression: 'EF = SV / EDV × 100%', variables: 'Volumetric fraction ejected per beat' },
      { label: 'Arterial oxygen content', expression: 'CaO₂ ≈ 1.34·Hb·SaO₂ + 0.003·PaO₂', variables: 'Hb g/dL; SaO₂ fraction; PaO₂ mmHg; result ≈ mL O₂/dL' },
      { label: 'Oxygen delivery', expression: 'DO₂ = CO · CaO₂ · 10', variables: 'CO L/min and CaO₂ mL/dL; factor 10 converts L to dL' },
    ],
    layer3d: 'cardiovascular',
    searchTerms: ['heart', 'lung', 'pulmonary artery', 'aorta', 'skeletal muscle'],
    boundary: 'These are standard physiology relations. Patient interpretation requires measured hemodynamics, gas exchange and hemoglobin.',
    references: [{ label: 'Standard cardiovascular and respiratory physiology' }],
  },
  {
    id: 'shock',
    label: 'Shock: pressure, flow & oxygen debt',
    domain: 'cardiopulmonary',
    summary: 'Frames shock as inadequate effective tissue perfusion/oxygen delivery with distinct volume, pump, distributive and obstructive mechanisms.',
    sequence: [
      'An initiating problem reduces effective circulating volume, cardiac pump output, vascular tone or forward flow.',
      'Baroreflexes increase sympathetic tone, heart rate and vasoconstriction while RAAS/ADH conserve volume.',
      'If compensation is insufficient, tissue oxygen delivery falls relative to demand and extraction rises.',
      'Progressive microcirculatory and cellular dysfunction can make macro-hemodynamic normalization alone insufficient.',
      'Mechanism matters: hypovolemic, cardiogenic, distributive and obstructive shock require different causal treatment.',
    ],
    control: 'Short-term neural reflexes and hormones compensate, but definitive recovery requires correction of the underlying mechanism.',
    formulas: [
      { label: 'Mean arterial pressure approximation', expression: 'MAP ≈ DBP + (SBP − DBP)/3', variables: 'Approximation at ordinary heart rates' },
      { label: 'Systemic vascular resistance', expression: 'SVR ≈ 80·(MAP − CVP)/CO', variables: 'MAP/CVP mmHg; CO L/min; result dyn·s·cm⁻⁵' },
      { label: 'Oxygen delivery', expression: 'DO₂ = CO · CaO₂ · 10', variables: 'Flow × oxygen content' },
    ],
    layer3d: 'cardiovascular',
    searchTerms: ['heart', 'aorta', 'vena cava', 'capillary', 'lung'],
    boundary: 'Educational hemodynamics only; it is not a shock detector, resuscitation calculator or treatment recommendation.',
    references: [{ label: 'Standard critical-care hemodynamic physiology' }],
  },
  {
    id: 'allergy',
    label: 'Allergy & immediate hypersensitivity',
    domain: 'defense',
    summary: 'Shows sensitization, IgE loading of mast cells and rapid mediator release after re-exposure.',
    sequence: [
      'During sensitization, antigen presentation and type-2 helper responses promote class switching toward antigen-specific IgE in susceptible contexts.',
      'IgE binds high-affinity FcεRI receptors on mast cells and basophils.',
      'On re-exposure, multivalent allergen cross-links receptor-bound IgE and activates the cell.',
      'Preformed mediators such as histamine are released rapidly; lipid mediators and cytokines extend the response.',
      'Target-organ effects depend on site and severity, ranging from local rhinitis/urticaria to systemic anaphylaxis.',
    ],
    control: 'Barrier exposure, innate signals, regulatory pathways and immune tolerance influence whether sensitization and clinical allergy develop.',
    formulas: [],
    layer3d: 'lymphoid',
    searchTerms: ['mast cell', 'basophil', 'skin', 'airway', 'lymph node'],
    boundary: 'Educational immune mechanism only; it cannot establish an allergy or predict anaphylaxis from exposure history alone.',
    references: [{ label: 'Standard type-I hypersensitivity immunology' }],
  },
  {
    id: 'immune-response',
    label: 'Immune response: innate → adaptive → memory',
    domain: 'defense',
    summary: 'Connects physical barriers, innate sensing, antigen presentation, lymphocyte activation, effector function and memory.',
    sequence: [
      'Barrier tissues and innate pattern-recognition systems respond first and recruit phagocytes/complement/inflammatory mediators.',
      'Dendritic cells process antigen and migrate to lymphoid tissue to activate antigen-specific lymphocytes.',
      'Clonal expansion produces effector T cells and antibody-secreting B-cell descendants.',
      'Effector mechanisms eliminate infected or abnormal targets while regulatory mechanisms limit collateral injury.',
      'A subset of antigen-specific cells persists as memory, enabling faster secondary responses.',
    ],
    control: 'Activation thresholds, co-stimulation, cytokine context, checkpoint pathways and regulatory cells balance defense against self-injury.',
    formulas: [
      { label: 'Absolute neutrophil count', expression: 'ANC = WBC × (% neutrophils + % bands) / 100', variables: 'A hematology calculation, not a measure of total immune competence' },
    ],
    layer3d: 'lymphoid',
    searchTerms: ['lymph node', 'spleen', 'bone marrow', 'thymus', 'blood'],
    boundary: 'The immune system cannot be reduced to a single “strength” score; this module is mechanistic education, not immune-status grading.',
    references: [{ label: 'Standard innate/adaptive immunology and lymphoid physiology' }],
  },
]

export const PHYSIOLOGY_DOMAINS: Array<{ key: PhysiologyDomain | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'sensory', label: 'Sensory' },
  { key: 'neuro', label: 'Neuro' },
  { key: 'cardiopulmonary', label: 'Cardiopulmonary' },
  { key: 'renal-endocrine', label: 'Renal / endocrine' },
  { key: 'metabolism', label: 'Metabolism' },
  { key: 'defense', label: 'Defense' },
  { key: 'homeostasis', label: 'Homeostasis' },
]
