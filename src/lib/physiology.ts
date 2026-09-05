import type { AnatomyLayer } from '../components/Body3D'

// ─────────────────────────────────────────────────────────────────────────────
// FISIOLOGI — apa yang tubuh KERJAKAN, bukan terbuat dari apa.
//
// Anatomi menjawab "ini apa dan letaknya di mana"; fisiologi menjawab "ini
// bekerja bagaimana, seberapa cepat, dikendalikan apa, dan berubah bagaimana
// saat tubuh dibebani". Bagian itu memang belum pernah ada di aplikasi ini.
//
// KENAPA TIAP SISTEM MEMBAWA "SAAT OLAHRAGA". Olahraga adalah uji beban faal
// yang paling gampang diamati sendiri: denyut naik, napas dalam, aliran darah
// pindah dari usus ke otot, suhu naik, keringat keluar. Menaruh respons itu
// tepat di sebelah nilai istirahatnya membuat halaman Workout dan halaman
// Body Explorer membicarakan tubuh yang SAMA — beban di satu layar punya
// penjelasan faal di layar lainnya.
//
// ANGKA. Yang ditulis di sini adalah kisaran rujukan dewasa sehat yang lazim
// dan disepakati luas (curah jantung, laju filtrasi glomerulus, volume tidal,
// dan seterusnya), bukan ambang diagnostik dan bukan sasaran pribadi
// siapa pun. Nilai yang tidak dapat dipastikan tidak ditulis.
// ─────────────────────────────────────────────────────────────────────────────

export interface NilaiFaal {
  label: string
  /** Nilai istirahat pada dewasa sehat. */
  rest: string
  /** Nilai atau arah perubahannya saat olahraga berat. */
  exercise?: string
}

export interface SistemFisiologi {
  /** Sama dengan key di ORGAN_SYSTEMS (anatomyHierarchy.ts) supaya keduanya
   *  bisa disandingkan tanpa tabel penerjemah. */
  key: string
  label: string
  /** Satu kalimat: fungsi utamanya. */
  fungsi: string
  /** Proses faal utamanya, ditulis sebagai langkah yang bisa diikuti. */
  proses: string[]
  /** Lingkar umpan balik yang mengendalikannya. */
  regulasi: string
  angka: NilaiFaal[]
  /** Apa yang terjadi saat olahraga — penghubung ke halaman Workout. */
  saatOlahraga: string
  layer3d?: AnatomyLayer['key']
  /** Untuk mengambil istilah ontologi & gambar, seperti entri anatomi. */
  searchTerms: string[]
}

export const SISTEM_FISIOLOGI: SistemFisiologi[] = [
  {
    key: 'cardiovascular',
    label: 'Cardiovascular physiology',
    fungsi: 'Moves oxygen, fuel, hormones and heat to every cell, and carries carbon dioxide and waste away.',
    proses: [
      'The sinoatrial node fires spontaneously, setting the heart rate without any nerve input.',
      'The impulse spreads through the atria, pauses at the AV node, then runs down the bundle of His and Purkinje fibres so the ventricles contract from the apex upward.',
      'Stroke volume depends on preload (how full the ventricle is), afterload (the pressure it must push against), and contractility.',
      'Cardiac output = heart rate × stroke volume. Blood pressure = cardiac output × systemic vascular resistance.',
    ],
    regulasi: 'Baroreceptors in the carotid sinus and aortic arch sense pressure and adjust sympathetic and vagal tone within seconds. The kidney adjusts blood volume over hours to days through the renin–angiotensin–aldosterone system.',
    angka: [
      { label: 'Heart rate', rest: '60–100 beats/min', exercise: 'Up to roughly 220 − age at maximum' },
      { label: 'Stroke volume', rest: '~70 mL', exercise: 'Rises to ~100–120 mL, then plateaus' },
      { label: 'Cardiac output', rest: '~5 L/min', exercise: '20–25 L/min in a trained adult' },
      { label: 'Ejection fraction', rest: '55–70%' },
      { label: 'Blood pressure', rest: '~120/80 mmHg', exercise: 'Systolic rises; diastolic stays flat or falls slightly' },
    ],
    saatOlahraga: 'Cardiac output can quintuple. Sympathetic drive raises rate and contractility while arterioles in working muscle dilate and those in the gut and kidney constrict, redirecting blood to where it is needed. Endurance training enlarges the left ventricle, so stroke volume rises and resting heart rate falls — that is why a fit person\'s resting pulse is low.',
    layer3d: 'cardiovascular',
    searchTerms: ['cardiovascular physiology', 'heart disease'],
  },
  {
    key: 'respiratory',
    label: 'Respiratory physiology',
    fungsi: 'Brings oxygen into the blood and clears carbon dioxide, and in doing so sets the body\'s acid–base balance.',
    proses: [
      'The diaphragm contracts and flattens, dropping intrapleural pressure and drawing air in. Quiet exhalation is passive elastic recoil.',
      'Gas crosses the alveolar–capillary membrane by simple diffusion down its partial-pressure gradient.',
      'Oxygen is carried almost entirely bound to haemoglobin; the sigmoid dissociation curve is what lets tissues unload it steeply at low PO₂.',
      'Most carbon dioxide travels as bicarbonate after carbonic anhydrase converts it inside red cells.',
    ],
    regulasi: 'Central chemoreceptors in the medulla respond to CO₂ (via CSF pH) and drive most of normal breathing. Peripheral chemoreceptors in the carotid and aortic bodies respond to low oxygen and only take over when PaO₂ falls below roughly 60 mmHg.',
    angka: [
      { label: 'Respiratory rate', rest: '12–20 breaths/min', exercise: '40–60 breaths/min' },
      { label: 'Tidal volume', rest: '~500 mL', exercise: 'Up to ~3 L' },
      { label: 'Minute ventilation', rest: '~6 L/min', exercise: '100–150 L/min' },
      { label: 'Arterial oxygen saturation', rest: '95–100%', exercise: 'Stays near resting values in healthy lungs' },
      { label: 'VO₂ max', rest: '—', exercise: '~35–45 mL/kg/min untrained; 60–85 in elite endurance athletes' },
    ],
    saatOlahraga: 'Ventilation rises almost immediately — before blood gases have even changed — driven by signals from the motor cortex and moving joints. Beyond the ventilatory threshold, lactate buffering produces extra CO₂ and breathing climbs out of proportion to oxygen use. Healthy lungs are rarely the limit on exercise; the heart and muscle usually are.',
    layer3d: 'visceral',
    searchTerms: ['respiratory physiology', 'lung disease'],
  },
  {
    key: 'muscular',
    label: 'Muscle physiology',
    fungsi: 'Converts chemical energy into force and movement, and generates most of the body\'s heat.',
    proses: [
      'A motor neuron releases acetylcholine at the neuromuscular junction, depolarising the muscle fibre.',
      'The action potential travels down T-tubules and triggers calcium release from the sarcoplasmic reticulum.',
      'Calcium binds troponin, moving tropomyosin off the actin binding sites; myosin heads then cycle — the sliding filament mechanism.',
      'Force is graded two ways: recruiting more motor units (smallest first — the size principle), and firing them faster.',
    ],
    regulasi: 'Muscle spindles sense stretch and drive the reflex contraction; Golgi tendon organs sense tension and inhibit it, protecting against overload.',
    angka: [
      { label: 'Skeletal muscle mass', rest: '~40% of body mass' },
      { label: 'Blood flow to muscle', rest: '~1 L/min (~20% of output)', exercise: 'Up to 20 L/min (~85%)' },
      { label: 'ATP from phosphocreatine', rest: '—', exercise: 'Powers the first ~10 seconds of maximal effort' },
      { label: 'Anaerobic glycolysis', rest: '—', exercise: 'Dominant from ~10 seconds to ~2 minutes' },
      { label: 'Oxidative phosphorylation', rest: 'Dominant at rest', exercise: 'Dominant beyond ~2 minutes' },
    ],
    saatOlahraga: 'Three energy systems hand over in sequence rather than switching: phosphocreatine for the first seconds, glycolysis for the first couple of minutes, then oxidative metabolism. Type I fibres are slow, fatigue-resistant and aerobic; type II are fast, powerful and fatigue quickly. Strength training grows fibre cross-section (hypertrophy) and, early on, improves recruitment before any size change is visible.',
    layer3d: 'muscular',
    searchTerms: ['muscle physiology', 'myopathy'],
  },
  {
    key: 'urinary',
    label: 'Renal physiology',
    fungsi: 'Filters the blood to control fluid volume, electrolytes, acid–base balance and blood pressure, and excretes waste.',
    proses: [
      'The glomerulus filters plasma under pressure — a passive sieve that holds back cells and large proteins.',
      'The proximal tubule reabsorbs roughly two-thirds of filtered sodium and water, plus essentially all glucose and amino acids.',
      'The loop of Henle builds the medullary concentration gradient that makes concentrated urine possible.',
      'The distal tubule and collecting duct do the fine adjustment under aldosterone and antidiuretic hormone.',
    ],
    regulasi: 'Falling renal perfusion releases renin, generating angiotensin II (vasoconstriction) and aldosterone (sodium retention). Rising plasma osmolality releases ADH from the posterior pituitary, so the collecting duct reabsorbs water.',
    angka: [
      { label: 'Renal blood flow', rest: '~1.1 L/min (~20% of output)', exercise: 'Falls sharply as blood is redirected to muscle' },
      { label: 'Glomerular filtration rate', rest: '~90–120 mL/min/1.73 m²' },
      { label: 'Filtrate produced', rest: '~180 L/day' },
      { label: 'Urine output', rest: '~1–2 L/day', exercise: 'Falls; ADH rises with fluid loss' },
    ],
    saatOlahraga: 'Renal blood flow drops as circulation is diverted to muscle and skin. Sweat loss raises plasma osmolality, ADH rises, and urine becomes scant and concentrated — which is why dark urine after training is a dehydration signal, not a kidney problem in itself.',
    layer3d: 'visceral',
    searchTerms: ['renal physiology', 'kidney disease'],
  },
  {
    key: 'digestive',
    label: 'Digestive physiology',
    fungsi: 'Breaks food into absorbable molecules, takes them up, and disposes of what is left.',
    proses: [
      'Chewing and salivary amylase begin starch digestion; swallowing is a coordinated reflex once initiated.',
      'The stomach secretes acid and pepsinogen, kills most swallowed microbes, and releases chyme into the duodenum in controlled amounts.',
      'Pancreatic enzymes and bile finish digestion in the small intestine, where almost all absorption happens across the villi.',
      'The colon reclaims water and electrolytes; its bacteria ferment residual fibre into short-chain fatty acids.',
    ],
    regulasi: 'The enteric nervous system runs the gut largely on its own. Gastrin drives acid secretion, secretin and cholecystokinin coordinate pancreatic enzymes and bile, and incretins (GLP-1, GIP) link a meal to insulin release before glucose even rises.',
    angka: [
      { label: 'Splanchnic blood flow', rest: '~1.4 L/min (~25% of output)', exercise: 'Falls to as little as ~20% of its resting value' },
      { label: 'Gastric pH', rest: '1.5–3.5' },
      { label: 'Gastric emptying', rest: '~2–4 hours for a mixed meal' },
      { label: 'Small bowel transit', rest: '~3–5 hours' },
    ],
    saatOlahraga: 'Blood is shunted away from the gut, which is the direct cause of exercise-related nausea, cramping and "runner\'s gut". It is also why a large meal shortly before hard training performs badly: digestion and working muscle are competing for the same circulation.',
    layer3d: 'visceral',
    searchTerms: ['digestive physiology', 'gastrointestinal disease'],
  },
  {
    key: 'endocrine',
    label: 'Endocrine physiology',
    fungsi: 'Uses hormones in the bloodstream to coordinate metabolism, growth, stress response, reproduction and fluid balance over minutes to years.',
    proses: [
      'The hypothalamus signals the pituitary, which signals a target gland — thyroid, adrenal cortex, or gonad.',
      'The target gland\'s hormone feeds back to suppress both the hypothalamus and pituitary, holding the axis steady.',
      'Insulin and glucagon from the pancreatic islets hold blood glucose within a narrow range regardless of meals or fasting.',
      'Catecholamines from the adrenal medulla act in seconds; thyroid hormone acts over weeks.',
    ],
    regulasi: 'Almost every axis is a negative feedback loop. The exceptions are instructive: the LH surge before ovulation is genuine positive feedback, and so is oxytocin during labour.',
    angka: [
      { label: 'Fasting glucose', rest: '70–99 mg/dL', exercise: 'Held steady; glucagon and catecholamines rise to match uptake' },
      { label: 'Cortisol', rest: 'Peaks early morning, lowest around midnight', exercise: 'Rises with intensity and duration' },
      { label: 'Growth hormone', rest: 'Pulsatile, largest pulse in deep sleep', exercise: 'Rises sharply with high-intensity work' },
      { label: 'TSH', rest: '0.4–4.0 mIU/L' },
    ],
    saatOlahraga: 'Insulin falls while glucagon, catecholamines, cortisol and growth hormone rise — together mobilising glucose and fatty acids. Muscle contraction itself moves GLUT4 transporters to the membrane without any insulin at all, which is why exercise lowers blood glucose even in insulin resistance.',
    layer3d: 'visceral',
    searchTerms: ['endocrine physiology', 'endocrine system disease'],
  },
  {
    key: 'nervous-system',
    label: 'Neurophysiology',
    fungsi: 'Senses, decides and commands — in milliseconds — and stores what happened.',
    proses: [
      'The resting membrane potential (~−70 mV) is held by the Na⁺/K⁺-ATPase and potassium leak channels.',
      'A stimulus past threshold opens voltage-gated sodium channels and an all-or-nothing action potential fires.',
      'Myelin forces the impulse to jump node to node (saltatory conduction), multiplying speed without thickening the axon.',
      'At the synapse, calcium entry releases neurotransmitter; the postsynaptic cell sums excitation and inhibition to decide whether to fire.',
    ],
    regulasi: 'The autonomic nervous system runs the background: sympathetic for exertion and threat, parasympathetic for digestion and recovery. Most organs receive both and the balance, not either alone, sets the state.',
    angka: [
      { label: 'Resting membrane potential', rest: '~−70 mV' },
      { label: 'Myelinated nerve conduction', rest: '~50–120 m/s' },
      { label: 'Unmyelinated conduction', rest: '~0.5–2 m/s' },
      { label: 'Cerebral blood flow', rest: '~750 mL/min (~15% of output)', exercise: 'Tightly autoregulated — held nearly constant' },
    ],
    saatOlahraga: 'Sympathetic outflow rises and vagal tone withdraws; the vagal withdrawal is what makes heart rate climb in the very first seconds. Central command from the motor cortex raises heart rate and ventilation before any feedback from muscle arrives. Cerebral flow is defended almost unchanged — the brain does not give up its supply.',
    layer3d: 'nervous',
    searchTerms: ['nervous system physiology', 'neurological disease'],
  },
  {
    key: 'integumentary',
    label: 'Thermoregulation & skin physiology',
    fungsi: 'Keeps core temperature near 37 °C, forms the barrier against water loss and infection, and makes vitamin D.',
    proses: [
      'The hypothalamic preoptic area compares core temperature against its set point.',
      'When too hot: skin arterioles dilate to dump heat, and eccrine sweat glands secrete for evaporative cooling.',
      'When too cold: skin vessels constrict, shivering starts, and heat is conserved centrally.',
      'Evaporation is the only mechanism that still works once ambient temperature exceeds skin temperature.',
    ],
    regulasi: 'A hypothalamic negative feedback loop with skin and core thermoreceptors as its sensors. Fever is not a failure of that loop — it is the set point being raised deliberately by pyrogens.',
    angka: [
      { label: 'Core temperature', rest: '36.5–37.5 °C', exercise: 'Rises to 38–40 °C in hard or prolonged effort' },
      { label: 'Skin blood flow', rest: '~0.3 L/min', exercise: 'Up to ~8 L/min in heat' },
      { label: 'Sweat rate', rest: 'Negligible', exercise: '~1–2 L/hour; up to ~3 L/hour when heat-acclimatised' },
    ],
    saatOlahraga: 'Working muscle produces far more heat than force, so cooling becomes the limiting problem in endurance work. Skin and muscle then compete for the same cardiac output, which is why performance falls in the heat. Acclimatisation over 10–14 days makes sweat start earlier, flow faster and carry less salt.',
    layer3d: 'surface',
    searchTerms: ['thermoregulation', 'skin physiology'],
  },
  {
    key: 'lymphatic',
    label: 'Immune & lymphatic physiology',
    fungsi: 'Returns filtered fluid to the blood, absorbs dietary fat, and mounts the defence against infection.',
    proses: [
      'Capillaries leak more fluid than they reabsorb; lymphatics collect the surplus and return it via the thoracic duct.',
      'Lymph passes through nodes where antigen-presenting cells meet lymphocytes.',
      'Innate immunity responds within minutes without prior exposure; adaptive immunity takes days but remembers.',
      'B cells make antibody; cytotoxic T cells kill infected cells; helper T cells direct both.',
    ],
    regulasi: 'Lymph has no pump. It moves by skeletal muscle contraction, arterial pulsation and breathing — which is why immobility causes swelling and movement relieves it.',
    angka: [
      { label: 'Lymph returned', rest: '~2–3 L/day' },
      { label: 'Lymph nodes', rest: '~500–600 in an adult' },
      { label: 'Neutrophils', rest: '~40–70% of white cells', exercise: 'Rise sharply during and just after exertion' },
    ],
    saatOlahraga: 'Muscle contraction is the lymphatic pump, so movement itself drives immune traffic. Moderate regular training improves immune surveillance; very heavy prolonged work is followed by a transient dip in some immune measures, which is part of why recovery and sleep are not optional in hard training blocks.',
    layer3d: 'lymphoid',
    searchTerms: ['immune system physiology', 'lymphatic system disease'],
  },
  {
    key: 'skeletal',
    label: 'Bone physiology',
    fungsi: 'Supports and levers the body, protects organs, stores calcium and phosphate, and makes blood cells.',
    proses: [
      'Osteoclasts resorb bone and osteoblasts lay it down — remodelling continues lifelong.',
      'Bone deposits along lines of mechanical stress (Wolff\'s law), so loading shapes the skeleton.',
      'Red marrow produces red cells, white cells and platelets.',
      'Parathyroid hormone raises serum calcium; calcitonin and vitamin D adjust the balance from the other side.',
    ],
    regulasi: 'Serum calcium is held in a very narrow range by parathyroid hormone, vitamin D and calcitonin acting on bone, gut and kidney together. Bone is the body\'s calcium reserve, and it will be spent to defend serum calcium.',
    angka: [
      { label: 'Bones in an adult', rest: '206' },
      { label: 'Serum calcium', rest: '8.5–10.5 mg/dL' },
      { label: 'Skeleton remodelled', rest: '~10% per year' },
      { label: 'Peak bone mass', rest: 'Reached around age 25–30' },
    ],
    saatOlahraga: 'Impact and resistance loading are the strongest stimuli for bone formation there are — stronger than calcium intake alone. Weight-bearing training in youth raises peak bone mass, and continued loading slows later loss. Swimming and cycling, being unloaded, do not carry the same benefit.',
    layer3d: 'skeletal',
    searchTerms: ['bone physiology', 'osteoporosis'],
  },
  {
    key: 'reproductive',
    label: 'Reproductive physiology',
    fungsi: 'Produces gametes and sex hormones, and in females runs the cycle that supports pregnancy.',
    proses: [
      'GnRH from the hypothalamus is released in pulses, driving FSH and LH from the anterior pituitary.',
      'In the ovary, FSH matures a follicle; rising oestrogen eventually flips to positive feedback and triggers the LH surge and ovulation.',
      'The corpus luteum secretes progesterone; if there is no pregnancy it involutes and the endometrium sheds.',
      'In the testis, FSH supports Sertoli cells and spermatogenesis while LH drives testosterone from Leydig cells.',
    ],
    regulasi: 'A hypothalamic–pituitary–gonadal axis on negative feedback, with one deliberate exception: the mid-cycle oestrogen-driven LH surge is positive feedback, and it is what makes ovulation possible.',
    angka: [
      { label: 'Menstrual cycle', rest: '~21–35 days; luteal phase ~14 days' },
      { label: 'Spermatogenesis', rest: '~64–72 days start to finish' },
      { label: 'Basal body temperature', rest: 'Rises ~0.3–0.5 °C after ovulation' },
    ],
    saatOlahraga: 'Very high training loads combined with low energy availability suppress GnRH pulses. In women this causes functional hypothalamic amenorrhoea, and with it bone loss; in men, low testosterone. This is Relative Energy Deficiency in Sport (RED-S), and the fix is eating enough, not training less hard.',
    layer3d: 'visceral',
    searchTerms: ['reproductive physiology', 'reproductive system disease'],
  },
]

/** Fisiologi yang berpasangan dengan satu kelompok otot latihan — dipakai
 *  halaman Workout untuk menjelaskan apa yang sedang terjadi di tubuh. */
export const FISIOLOGI_LATIHAN = ['muscular', 'cardiovascular', 'respiratory', 'endocrine', 'integumentary', 'skeletal'] as const

export function fisiologiUntuk(key: string): SistemFisiologi | undefined {
  return SISTEM_FISIOLOGI.find((s) => s.key === key)
}
