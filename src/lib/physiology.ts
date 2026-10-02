import type { AnatomyLayer } from '../components/Body3D'

// FISIOLOGI — apa yang tubuh kerjakan. Semua angka di sini adalah rujukan
// pendidikan populasi, bukan nilai personal, target latihan, atau ambang
// diagnosis. Respons latihan bergantung pada usia, ukuran tubuh, jenis kelamin,
// kebugaran, posisi, lingkungan, protokol dan metode pengukuran.

export interface NilaiFaal {
  label: string
  /** Nilai/kisaran rujukan saat istirahat; bukan "nilai normal" universal. */
  rest: string
  /** Arah atau kisaran respons latihan yang lazim; bukan prediksi individual. */
  exercise?: string
}

export interface SistemFisiologi {
  key: string
  label: string
  fungsi: string
  proses: string[]
  regulasi: string
  angka: NilaiFaal[]
  saatOlahraga: string
  layer3d?: AnatomyLayer['key']
  searchTerms: string[]
  /** Batas interpretasi khusus sistem yang harus tetap terlihat di UI. */
  evidenceNote?: string
}

export const PHYSIOLOGY_REFERENCE_SOURCES = [
  'Guyton & Hall Textbook of Medical Physiology',
  'Boron & Boulpaep Medical Physiology',
  'ACSM Guidelines for Exercise Testing and Prescription',
] as const

export const PHYSIOLOGY_EVIDENCE_BOUNDARY =
  'Reference physiology describes population-level mechanisms and approximate teaching ranges. It does not infer a user’s physiology, fitness, disease, internal force, oxygen delivery, hydration state or clinical risk without measured inputs and an appropriate validated method.'

export const SISTEM_FISIOLOGI: SistemFisiologi[] = [
  {
    key: 'cardiovascular',
    label: 'Cardiovascular physiology',
    fungsi: 'Moves oxygen, fuel, hormones and heat through the circulation and carries carbon dioxide and metabolic products away from tissues.',
    proses: [
      'Pacemaker cells in the sinoatrial node depolarise spontaneously; autonomic and hormonal inputs continuously modulate the resulting heart rate.',
      'Atrial activation reaches the AV node and His–Purkinje system, coordinating ventricular activation rather than making the chambers contract as a single point source.',
      'Stroke volume reflects preload, afterload, contractility, ventricular compliance and heart–vascular interaction.',
      'Cardiac output = heart rate × stroke volume. Mean arterial pressure is often approximated as cardiac output × systemic vascular resistance, while pulsatile pressure also depends on arterial properties.',
    ],
    regulasi: 'Arterial baroreflexes rapidly alter sympathetic and parasympathetic activity. Renal, hormonal and vascular mechanisms regulate volume and pressure over longer timescales.',
    angka: [
      { label: 'Heart rate', rest: 'Common adult reference: 60–100 beats/min', exercise: 'Rises with workload; 220 − age is only a rough population heuristic for HRmax' },
      { label: 'Stroke volume', rest: 'Often ~60–100 mL/beat', exercise: 'Usually rises; the magnitude and whether it plateaus vary with posture, intensity and training' },
      { label: 'Cardiac output', rest: 'Often ~4–8 L/min', exercise: 'Can rise several-fold; peak values vary widely with body size and endurance training' },
      { label: 'Ejection fraction', rest: 'Common reference ~55–70%' },
      { label: 'Blood pressure', rest: 'Interpret from measured SBP/DBP, not one universal value', exercise: 'During dynamic exercise systolic pressure usually rises; diastolic response is smaller and protocol-dependent' },
    ],
    saatOlahraga: 'Sympathetic activation, vagal withdrawal, increased venous return and local metabolic vasodilation raise oxygen delivery to working muscle. Endurance training can produce physiological cardiac remodelling and a lower resting heart rate, but the degree varies and a low pulse is not by itself proof of fitness.',
    layer3d: 'cardiovascular',
    searchTerms: ['cardiovascular physiology', 'heart disease'],
    evidenceNote: 'Peak heart rate and cardiac output are measured variables. Age formulas and generic exercise values are approximations, not substitutes for testing.',
  },
  {
    key: 'respiratory',
    label: 'Respiratory physiology',
    fungsi: 'Ventilates the lungs, exchanges oxygen and carbon dioxide, and contributes to acid–base regulation.',
    proses: [
      'Diaphragm and inspiratory-muscle contraction lowers pleural pressure and expands the lungs; quiet expiration is largely passive elastic recoil.',
      'Gas transfer across the alveolar–capillary membrane depends on partial-pressure gradients, surface area, diffusion properties and ventilation–perfusion matching.',
      'Most oxygen is carried bound to haemoglobin; the oxyhaemoglobin dissociation curve links saturation to oxygen partial pressure and tissue unloading.',
      'Most carbon dioxide is transported as bicarbonate after rapid interconversion catalysed by carbonic anhydrase in red cells.',
    ],
    regulasi: 'Central chemoreceptors are strongly influenced by CO₂ through CSF pH. Peripheral carotid and aortic-body chemoreceptors respond to arterial hypoxaemia as well as acid–base/CO₂ signals; the hypoxic ventilatory stimulus becomes especially strong as PaO₂ falls to roughly the 60 mmHg range and below.',
    angka: [
      { label: 'Respiratory rate', rest: 'Common adult reference: ~12–20 breaths/min', exercise: 'Rises with workload; peak rate is highly individual' },
      { label: 'Tidal volume', rest: 'Often ~0.5 L at quiet rest', exercise: 'Usually rises before breathing frequency contributes more strongly at high ventilation' },
      { label: 'Minute ventilation', rest: 'Often ~5–8 L/min', exercise: 'Can exceed 100 L/min in strenuous exercise and much more in highly trained athletes' },
      { label: 'Arterial oxygen saturation', rest: 'Often ~95–100% at sea level', exercise: 'Usually maintained in healthy people, but may fall in some athletes, lung disease or altitude' },
      { label: 'VO₂max', rest: '—', exercise: 'A measured maximal oxygen-uptake phenotype; values depend strongly on age, sex, body size and training' },
    ],
    saatOlahraga: 'Ventilation rises rapidly from central command and afferent feedback, then tracks metabolic CO₂ production and acid–base demands. Above ventilatory thresholds it rises disproportionately. Pulmonary reserve is large in many healthy people, but exercise-induced arterial desaturation, airway disease, altitude and elite workloads can make respiratory factors relevant.',
    layer3d: 'visceral',
    searchTerms: ['respiratory physiology', 'lung disease'],
    evidenceNote: 'Ventilation and VO₂max require direct measurement if used to characterize an individual; the displayed values are not a fitness classification.',
  },
  {
    key: 'muscular',
    label: 'Muscle physiology',
    fungsi: 'Converts chemical energy into force, movement and heat through excitation–contraction coupling and cross-bridge cycling.',
    proses: [
      'A motor neuron releases acetylcholine at the neuromuscular junction, initiating a muscle-fibre action potential.',
      'The action potential travels along sarcolemma and T-tubules and triggers calcium release from the sarcoplasmic reticulum.',
      'Calcium binding to troponin shifts tropomyosin and permits actin–myosin cross-bridge cycling.',
      'Force is regulated by motor-unit recruitment, firing rate, muscle length/velocity, architecture and neural coordination.',
    ],
    regulasi: 'Muscle spindles, Golgi tendon organs, joint/cutaneous afferents and descending commands interact in task-dependent spinal and supraspinal control. Golgi tendon organs are not a simple emergency switch that always inhibits a muscle at high tension.',
    angka: [
      { label: 'Skeletal muscle fraction', rest: 'Often ~30–45% of body mass; highly individual' },
      { label: 'Muscle blood flow', rest: 'Low relative to exercise', exercise: 'Can receive most of the increased cardiac output during heavy dynamic exercise' },
      { label: 'Phosphagen contribution', rest: '—', exercise: 'Very high during the first seconds of maximal work, while all energy systems remain active' },
      { label: 'Glycolytic contribution', rest: '—', exercise: 'Becomes prominent during intense short-duration work; no fixed 10 s–2 min switch' },
      { label: 'Oxidative contribution', rest: 'Dominant for resting ATP demand', exercise: 'Contribution rises rapidly and dominates sustained submaximal work; kinetics depend on intensity and training' },
    ],
    saatOlahraga: 'Phosphagen, glycolytic and oxidative pathways contribute simultaneously; their relative contributions shift continuously with intensity and duration. Fibre phenotypes span a continuum rather than two perfectly discrete classes. Early strength gains are often strongly neural, while repeated loading can later increase muscle cross-sectional area.',
    layer3d: 'muscular',
    searchTerms: ['muscle physiology', 'myopathy'],
    evidenceNote: 'The viewer names likely contributors but does not infer recruitment, activation, fibre type, tendon force or muscle force from a visual slider.',
  },
  {
    key: 'urinary',
    label: 'Renal physiology',
    fungsi: 'Regulates extracellular fluid, electrolytes, acid–base balance and waste excretion while contributing to blood-pressure and endocrine control.',
    proses: [
      'Glomerular filtration moves water and small solutes into Bowman space while normally retaining cells and most large proteins.',
      'The proximal tubule reabsorbs most filtered sodium and water and normally reclaims nearly all filtered glucose and amino acids below transport limits.',
      'Countercurrent mechanisms in the loop of Henle help build the medullary osmotic gradient.',
      'Distal nephron and collecting-duct transport provide regulated fine control under hormones including aldosterone and vasopressin.',
    ],
    regulasi: 'Renal autoregulation, sympathetic tone, the renin–angiotensin–aldosterone system, natriuretic peptides and vasopressin interact to regulate perfusion, sodium and water balance.',
    angka: [
      { label: 'Renal blood flow', rest: 'Often ~1.0–1.2 L/min in a healthy adult', exercise: 'Usually decreases as intensity rises, with wide protocol-dependent variation' },
      { label: 'Estimated/measured GFR', rest: 'Interpret by method, age and clinical context; ~90–120 mL/min/1.73 m² is a teaching range for many young adults' },
      { label: 'Daily filtrate', rest: 'Order of magnitude ~180 L/day before tubular reabsorption' },
      { label: 'Urine volume', rest: 'Often roughly 1–2 L/day but strongly intake- and environment-dependent', exercise: 'May fall during prolonged exercise as renal perfusion and water-conservation signals change' },
    ],
    saatOlahraga: 'Renal blood flow generally falls with increasing exercise intensity, while sweating and fluid intake alter osmolality and vasopressin. Urine colour alone is nonspecific: dark urine can reflect concentration but also blood, myoglobin, medications or other causes, so it must not be used here as proof of dehydration or reassurance about kidney status.',
    layer3d: 'visceral',
    searchTerms: ['renal physiology', 'kidney disease'],
    evidenceNote: 'Hydration and renal function require measured context; urine colour is not a diagnostic sensor in this model.',
  },
  {
    key: 'digestive',
    label: 'Digestive physiology',
    fungsi: 'Processes food, coordinates secretion and motility, absorbs nutrients and water, and supports host–microbiome metabolism.',
    proses: [
      'Oral processing and salivary enzymes begin digestion before coordinated swallowing transfers a bolus to the oesophagus.',
      'The stomach mixes food with acid and enzymes and meters chyme into the duodenum.',
      'Pancreatic enzymes, bile and brush-border processes support digestion and absorption across the small-intestinal mucosa.',
      'The colon absorbs water and electrolytes while microbial fermentation produces metabolites including short-chain fatty acids.',
    ],
    regulasi: 'Enteric neural circuits interact with autonomic input and gut hormones including gastrin, secretin, cholecystokinin, GLP-1 and GIP; control is distributed rather than a single linear reflex.',
    angka: [
      { label: 'Splanchnic blood flow', rest: 'A substantial fraction of resting cardiac output', exercise: 'Usually falls as intensity rises, especially with heat/dehydration' },
      { label: 'Gastric pH', rest: 'Often strongly acidic between meals; varies with meals, drugs and disease' },
      { label: 'Gastric emptying', rest: 'Highly meal-dependent; mixed meals often require hours' },
      { label: 'Small-bowel transit', rest: 'Measured transit varies widely among people and methods' },
    ],
    saatOlahraga: 'Exercise-related gastrointestinal symptoms are multifactorial. Reduced splanchnic perfusion can contribute, but mechanical motion, heat, dehydration, intensity, anxiety and pre-exercise food/fluid composition also matter; the model must not assign a single direct cause.',
    layer3d: 'visceral',
    searchTerms: ['digestive physiology', 'gastrointestinal disease'],
  },
  {
    key: 'endocrine',
    label: 'Endocrine physiology',
    fungsi: 'Uses hormone signals to coordinate metabolism, growth, stress responses, reproduction and fluid balance across multiple timescales.',
    proses: [
      'Hypothalamic signals regulate pituitary output, which in turn regulates multiple peripheral endocrine glands.',
      'Many endocrine axes use negative feedback, but feedback strength and pulsatility change across time and physiological states.',
      'Pancreatic insulin and glucagon are major regulators of glucose flux, interacting with autonomic and other hormonal signals.',
      'Hormones act over different timescales: catecholamine effects can be rapid while genomic hormone effects may evolve over hours to days.',
    ],
    regulasi: 'Negative feedback is common, while specific physiological states use positive feedback—for example sustained pre-ovulatory oestradiol can generate the LH surge.',
    angka: [
      { label: 'Fasting plasma glucose', rest: 'Common laboratory reference ~70–99 mg/dL', exercise: 'May fall, remain stable or transiently rise depending on intensity, duration, nutrition and metabolic state' },
      { label: 'Cortisol', rest: 'Circadian and pulsatile', exercise: 'Response depends on intensity, duration, time of day and training state' },
      { label: 'Growth hormone', rest: 'Pulsatile, with sleep-related secretion', exercise: 'Often rises during sufficiently intense/prolonged exercise, with large individual variation' },
      { label: 'TSH', rest: 'Laboratory reference ranges are assay- and population-specific' },
    ],
    saatOlahraga: 'Muscle contraction stimulates insulin-independent GLUT4 translocation and can improve insulin sensitivity after exercise. Counter-regulatory hormones rise with sufficiently intense/prolonged work, so blood glucose is not guaranteed to fall during every session and may transiently rise during high-intensity exercise.',
    layer3d: 'visceral',
    searchTerms: ['endocrine physiology', 'endocrine system disease'],
  },
  {
    key: 'nervous-system',
    label: 'Neurophysiology',
    fungsi: 'Senses, integrates and controls activity over millisecond-to-long-term timescales.',
    proses: [
      'Resting membrane potential reflects ionic gradients, selective membrane permeability and electrogenic transport including the Na⁺/K⁺-ATPase.',
      'When membrane depolarisation reaches threshold, voltage-gated channels generate a regenerative action potential.',
      'Myelin enables saltatory conduction between nodes of Ranvier and substantially increases conduction velocity.',
      'At synapses, transmitter release and postsynaptic integration alter the probability and timing of downstream firing.',
    ],
    regulasi: 'Autonomic, somatic and central networks interact continuously. Sympathetic and parasympathetic descriptions are useful summaries, but organ control is not a two-position switch.',
    angka: [
      { label: 'Neuronal resting potential', rest: 'Often around −70 mV; varies by cell type' },
      { label: 'Myelinated conduction velocity', rest: 'Can span tens to >100 m/s depending on fibre diameter/type' },
      { label: 'Unmyelinated conduction velocity', rest: 'Typically much slower than large myelinated fibres' },
      { label: 'Cerebral blood flow', rest: 'Often ~700–800 mL/min globally in adults', exercise: 'Can rise during moderate exercise and change again at high intensity as arterial CO₂ and autoregulation shift' },
    ],
    saatOlahraga: 'Central command and autonomic adjustments begin rapidly with movement. Cerebral perfusion is regulated but not perfectly fixed: moderate exercise may increase flow, while hyperventilation-induced hypocapnia at very high intensity can reduce it. A generic viewer cannot infer regional neural activation or perfusion.',
    layer3d: 'nervous',
    searchTerms: ['nervous system physiology', 'neurological disease'],
  },
  {
    key: 'integumentary',
    label: 'Thermoregulation & skin physiology',
    fungsi: 'Maintains thermal balance, provides a barrier against water loss/pathogens and participates in vitamin-D synthesis.',
    proses: [
      'Central and peripheral thermal signals are integrated in hypothalamic and distributed neural circuits.',
      'Heat stress increases skin blood flow and eccrine sweating, supporting dry and evaporative heat loss.',
      'Cold exposure reduces skin blood flow and can trigger shivering and behavioural heat-conservation responses.',
      'When ambient temperature exceeds skin temperature, evaporation becomes the principal avenue for net heat loss.',
    ],
    regulasi: 'Thermoregulation uses feedback from core and skin temperatures with behavioural and autonomic effectors. Fever shifts regulated temperature upward through pyrogen-mediated signalling rather than simply disabling temperature control.',
    angka: [
      { label: 'Core temperature', rest: 'Often ~36.5–37.5 °C, depending on site/time/method', exercise: 'Usually rises with sustained work; magnitude depends on workload and heat balance' },
      { label: 'Skin blood flow', rest: 'Low-to-moderate and highly environment-dependent', exercise: 'Can rise several-fold during heat stress' },
      { label: 'Sweat rate', rest: 'Low in thermoneutral rest', exercise: 'Can exceed 1 L/hour; large variation with climate, body size and acclimation' },
    ],
    saatOlahraga: 'Only part of metabolic energy becomes external mechanical work; much is released as heat. During prolonged exercise, cardiovascular demand for both active muscle and skin can contribute to performance decline in heat. Heat acclimation changes sweating and circulatory responses over repeated exposures, with individual variability.',
    layer3d: 'surface',
    searchTerms: ['thermoregulation', 'skin physiology'],
  },
  {
    key: 'lymphatic',
    label: 'Immune & lymphatic physiology',
    fungsi: 'Returns interstitial fluid to the circulation, transports absorbed dietary lipid and supports immune-cell trafficking.',
    proses: [
      'Net capillary filtration creates interstitial fluid that is taken up by initial lymphatics and returned to the venous circulation.',
      'Lymph nodes organise encounters among antigen, antigen-presenting cells and lymphocytes.',
      'Innate and adaptive immune responses operate on overlapping timescales with different recognition and memory mechanisms.',
      'B cells can differentiate into antibody-producing plasma cells; T-cell subsets perform cytotoxic, helper and regulatory functions.',
    ],
    regulasi: 'Lymph flow has no single central pump. Intrinsic contraction of collecting lymphatic vessels combines with skeletal-muscle movement, respiration, arterial pulsation and pressure gradients.',
    angka: [
      { label: 'Daily lymph return', rest: 'Order of magnitude: a few litres/day; variable by tissue and state' },
      { label: 'Lymph nodes', rest: 'Hundreds in an adult; exact counts vary anatomically' },
      { label: 'Circulating neutrophils', rest: 'Laboratory differential is population- and lab-dependent', exercise: 'Acute exercise commonly redistributes leukocyte populations' },
    ],
    saatOlahraga: 'Acute exercise causes dynamic leukocyte mobilisation and redistribution rather than a simple on/off change in immunity. Regular activity is associated with many immune-health benefits, while responses to prolonged intense exercise depend on training load, recovery, energy availability, sleep, infection exposure and other factors.',
    layer3d: 'lymphoid',
    searchTerms: ['immune system physiology', 'lymphatic system disease'],
  },
  {
    key: 'skeletal',
    label: 'Bone physiology',
    fungsi: 'Provides support and leverage, protects organs, houses marrow and participates in mineral homeostasis.',
    proses: [
      'Osteoclast-mediated resorption and osteoblast-mediated formation are coupled during remodelling.',
      'Bone adapts to its mechanical environment through mechanosensitive modelling and remodelling rather than simply depositing material along one line of stress.',
      'Haematopoietic marrow produces blood-cell lineages.',
      'Parathyroid hormone and vitamin-D physiology are central to calcium/phosphate homeostasis; calcitonin has a more limited role in routine adult calcium regulation.',
    ],
    regulasi: 'Calcium and phosphate homeostasis integrates parathyroid hormone, vitamin D, kidney, intestine and bone. Bone mineral is an important reservoir, but regulation is dynamic and affected by renal, endocrine, nutritional and mechanical factors.',
    angka: [
      { label: 'Bones in a typical adult skeleton', rest: 'Common teaching count: 206; anatomical variants occur' },
      { label: 'Serum calcium', rest: 'Interpret with laboratory method, albumin/ionized calcium and clinical context' },
      { label: 'Bone remodelling', rest: 'Continuous and site-dependent; no single annual percentage describes every bone' },
      { label: 'Peak bone mass', rest: 'Usually accrued by early adulthood; timing varies by site and individual' },
    ],
    saatOlahraga: 'Progressive resistance and impact/weight-bearing loading can be osteogenic when appropriately dosed. Activities with low skeletal impact such as swimming or cycling may provide less direct osteogenic stimulus at some sites, but they still have substantial cardiovascular, muscular and other health benefits.',
    layer3d: 'skeletal',
    searchTerms: ['bone physiology', 'osteoporosis'],
  },
  {
    key: 'reproductive',
    label: 'Reproductive physiology',
    fungsi: 'Coordinates gametogenesis, sex-steroid production and, in people with ovaries/uterus, cyclical reproductive physiology and pregnancy support.',
    proses: [
      'Pulsatile hypothalamic GnRH drives pituitary gonadotropin secretion.',
      'Ovarian follicular development and steroid feedback shape FSH/LH dynamics; sustained pre-ovulatory oestradiol can trigger positive feedback and the LH surge.',
      'After ovulation the corpus luteum produces progesterone; without pregnancy, luteal regression contributes to endometrial shedding.',
      'In testes, LH stimulates Leydig-cell testosterone production while FSH and intratesticular androgen signalling support Sertoli-cell function and spermatogenesis.',
    ],
    regulasi: 'The hypothalamic–pituitary–gonadal axis uses pulsatile signalling and mostly negative feedback, with state-dependent exceptions including the pre-ovulatory positive-feedback response.',
    angka: [
      { label: 'Menstrual-cycle length', rest: 'Common adult range ~21–35 days; cycle phases vary among and within individuals' },
      { label: 'Spermatogenesis', rest: 'Takes on the order of ~2 months plus epididymal transit; estimates vary by method' },
      { label: 'Basal body temperature', rest: 'May rise by a few tenths of a degree after ovulation; not a precise ovulation timestamp' },
    ],
    saatOlahraga: 'Low energy availability can disrupt reproductive and other physiological systems in athletes of any sex and is central to RED-S. Evaluation and management are individualized and may involve nutrition, training-load adjustment and medical assessment; the appropriate response is not reducible to a single instruction such as “eat more” or “train less”.',
    layer3d: 'visceral',
    searchTerms: ['reproductive physiology', 'reproductive system disease'],
    evidenceNote: 'Cycle, gonadal and RED-S interpretation requires individual history and measurements; this atlas provides mechanisms, not diagnosis.',
  },
]

/** Fisiologi yang berpasangan dengan satu kelompok otot latihan — dipakai
 * halaman Workout untuk menjelaskan apa yang sedang terjadi di tubuh. */
export const FISIOLOGI_LATIHAN = ['muscular', 'cardiovascular', 'respiratory', 'endocrine', 'integumentary', 'skeletal'] as const

export function fisiologiUntuk(key: string): SistemFisiologi | undefined {
  return SISTEM_FISIOLOGI.find((s) => s.key === key)
}
