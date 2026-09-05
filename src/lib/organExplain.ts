import type { AnatomyLayer } from '../components/Body3D'

// ─────────────────────────────────────────────────────────────────────────────
// Penjelasan tiap organ, dan KELAINAN BAWAAN-nya.
//
// Dua kekurangan yang diperbaiki berkas ini sekaligus:
//
//   1. Membuka tiroid atau mata dulu tidak menampilkan apa pun. Padahal yang
//      pertama ingin diketahui orang justru paling sederhana: ini apa, kerjanya
//      apa, dan bagaimana ia bekerja. Itu tidak butuh API mana pun — ia
//      pengetahuan baku — jadi ditulis langsung di sini dan selalu tersedia,
//      termasuk saat jaringan mati.
//
//   2. Kelainan BAWAAN tidak punya tempat sama sekali. Ia berbeda dari penyakit
//      didapat: yang menentukan bukan paparan melainkan bagaimana struktur itu
//      TERBENTUK, jadi tiap entri di sini membawa asal embriologinya dan
//      LETAKNYA pada model 3D — supaya "duktus arteriosus persisten" tidak
//      berhenti sebagai istilah, melainkan menyala di tempatnya.
//
// Prioritasnya jantung, paru, dan ginjal, sesuai permintaan; sisanya menyusul
// dengan kedalaman yang lebih ringkas dan jujur tentang itu.
// ─────────────────────────────────────────────────────────────────────────────

export interface KelainanBawaan {
  nama: string
  /** Satu kalimat: apa yang sebenarnya salah secara struktural. */
  apa: string
  /** Asal embriologinya — kenapa ia terbentuk begitu. */
  embriologi: string
  /** Akibatnya pada faal tubuh, ditulis sebagai rantai sebab-akibat. */
  akibat: string
  /** Tanda yang membuat orang mencurigainya. */
  tanda: string
  /** Kata kunci struktur 3D tempat kelainan ini berada — untuk disorot. */
  lokasi3d: string[]
  /** Lapisan yang harus menyala supaya lokasinya terlihat. */
  layer: AnatomyLayer['key']
}

export interface OrganPenjelasan {
  /** Sama dengan key di ORGAN_FOCUS. */
  key: string
  /** Ini apa — satu kalimat, bisa dibaca siapa saja. */
  definisi: string
  /** Kerjanya apa. */
  fungsi: string[]
  /** Bagaimana ia bekerja — mekanismenya, bukan daftar bagian. */
  caraKerja: string
  /** Angka yang membuat ukurannya terbayang. */
  fakta?: string[]
  bawaan: KelainanBawaan[]
}

export const ORGAN_PENJELASAN: OrganPenjelasan[] = [
  {
    key: 'heart',
    definisi: 'A four-chambered muscular pump, roughly the size of your own fist, that drives blood through two circuits in series.',
    fungsi: [
      'Pumps oxygen-poor blood to the lungs (pulmonary circuit) and oxygen-rich blood to the body (systemic circuit).',
      'Generates the pressure that drives every other organ’s blood supply.',
      'Secretes natriuretic peptides when its walls are stretched, telling the kidney to shed salt and water.',
    ],
    caraKerja:
      'The sinoatrial node depolarises spontaneously — the heart beats with every nerve cut. That impulse crosses the atria, is deliberately delayed at the AV node so the atria can finish emptying, then races down the bundle of His and Purkinje fibres. Because those fibres reach the apex first, the ventricle squeezes from the bottom upward, wringing blood toward the outflow valves rather than sloshing it. Valves are passive: they open and close purely on the pressure difference across them.',
    fakta: [
      'About 100,000 beats and 7,000 litres a day',
      'Coronary arteries fill during diastole, not systole — the only organ perfused while relaxing',
      'Cardiac output = heart rate × stroke volume (~5 L/min at rest)',
    ],
    bawaan: [
      {
        nama: 'Ventricular septal defect (VSD)',
        apa: 'A hole in the muscular or membranous wall between the two ventricles.',
        embriologi: 'The interventricular septum fails to close completely in weeks 4–8 — most often the membranous part, where three separate tissue contributions must meet.',
        akibat: 'Left ventricular pressure is far higher than right, so blood shunts LEFT TO RIGHT → extra volume through the lungs → pulmonary over-circulation → heart failure in infancy. If left uncorrected, pulmonary vascular resistance eventually exceeds systemic and the shunt reverses (Eisenmenger syndrome) — at which point it becomes inoperable.',
        tanda: 'Loud harsh pansystolic murmur at the lower left sternal border; poor feeding, sweating and failure to thrive. Paradoxically, a LOUDER murmur means a SMALLER defect.',
        lokasi3d: ['ventricle', 'interventricular'],
        layer: 'cardiovascular',
      },
      {
        nama: 'Atrial septal defect (ASD)',
        apa: 'A persistent opening between the two atria.',
        embriologi: 'Ostium secundum type: excessive resorption of septum primum or deficient septum secundum, so the foramen ovale fails to seal after birth.',
        akibat: 'Left-to-right shunt at low pressure → right atrial and ventricular volume overload → over time, atrial arrhythmia and pulmonary hypertension. Often silent for decades.',
        tanda: 'FIXED, widely split second heart sound — the split does not vary with breathing, which is the finding that distinguishes it.',
        lokasi3d: ['atrium', 'interatrial'],
        layer: 'cardiovascular',
      },
      {
        nama: 'Patent ductus arteriosus (PDA)',
        apa: 'The fetal channel between pulmonary artery and aorta stays open after birth.',
        embriologi: 'The ductus arteriosus is a normal and necessary fetal structure that bypasses the unventilated lungs. It should constrict within hours of birth as oxygen rises and placental prostaglandin E2 disappears.',
        akibat: 'Aortic pressure exceeds pulmonary, so blood shunts aorta → pulmonary artery throughout the whole cardiac cycle → pulmonary over-circulation plus a wide pulse pressure from diastolic run-off.',
        tanda: 'Continuous "machinery" murmur below the left clavicle; bounding pulses. Indometacin or ibuprofen (prostaglandin inhibitors) close it; prostaglandin E1 keeps it OPEN when a duct-dependent lesion makes that life-saving.',
        lokasi3d: ['aorta', 'pulmonary trunk', 'pulmonary artery'],
        layer: 'cardiovascular',
      },
      {
        nama: 'Tetralogy of Fallot',
        apa: 'Four features together: pulmonary stenosis, VSD, overriding aorta, right ventricular hypertrophy.',
        embriologi: 'A single error explains all four — the infundibular septum deviates anteriorly and to the right, so the outflow tract divides unequally.',
        akibat: 'Right ventricular outflow obstruction raises right-sided pressure above left → RIGHT-TO-LEFT shunt across the VSD → deoxygenated blood enters the aorta → cyanosis. Severity tracks the degree of pulmonary stenosis, not the size of the VSD.',
        tanda: 'Cyanotic "tet spells" relieved by squatting — squatting raises systemic vascular resistance and so reduces the right-to-left shunt. Boot-shaped heart on chest radiograph.',
        lokasi3d: ['ventricle', 'aorta', 'pulmonary trunk'],
        layer: 'cardiovascular',
      },
      {
        nama: 'Coarctation of the aorta',
        apa: 'A narrowing of the aorta, typically just distal to the left subclavian artery.',
        embriologi: 'Abnormal extension of ductal tissue into the aortic wall; when the duct closes, that tissue constricts too.',
        akibat: 'Obstruction to systemic outflow → hypertension in the arms and head, hypoperfusion below the narrowing → collateral vessels enlarge through the intercostal arteries.',
        tanda: 'Radio-femoral delay and a blood-pressure gap between arms and legs. Rib notching on radiograph from dilated collaterals. Strongly associated with Turner syndrome and bicuspid aortic valve.',
        lokasi3d: ['aorta'],
        layer: 'cardiovascular',
      },
      {
        nama: 'Transposition of the great arteries',
        apa: 'The aorta arises from the right ventricle and the pulmonary artery from the left — the two circuits run in parallel instead of in series.',
        embriologi: 'The aorticopulmonary septum fails to spiral, so the outflow vessels connect to the wrong ventricles.',
        akibat: 'Deoxygenated blood recirculates to the body and oxygenated blood recirculates to the lungs. Life depends entirely on mixing through a PDA, ASD or VSD — this is a neonatal emergency.',
        tanda: 'Severe cyanosis within hours of birth that does NOT improve with oxygen. "Egg on a string" cardiac silhouette. Prostaglandin E1 is started immediately to keep the duct open.',
        lokasi3d: ['aorta', 'pulmonary trunk', 'ventricle'],
        layer: 'cardiovascular',
      },
    ],
  },
  {
    key: 'lungs',
    definisi: 'Paired organs of gas exchange whose entire architecture exists to put air and blood within a fraction of a micrometre of each other.',
    fungsi: [
      'Loads oxygen onto haemoglobin and clears carbon dioxide.',
      'Regulates blood pH minute to minute by controlling CO₂.',
      'Filters small clots, warms and humidifies air, and converts angiotensin I to II on its endothelium.',
    ],
    caraKerja:
      'The airway divides about 23 times, from trachea to alveolus. The first 16 generations only conduct air; gas exchange begins where alveoli appear. Each division multiplies cross-sectional area, so airflow slows almost to a stop by the alveoli — gas covers the last stretch by DIFFUSION alone, which needs no energy but demands a very short path. The alveolar membrane is roughly 0.3 µm thick across a surface of about 70 m². Surfactant from type II pneumocytes lowers surface tension and, crucially, does so MORE in smaller alveoli, which is what stops small alveoli from emptying into large ones.',
    fakta: [
      'About 300–500 million alveoli; total surface ≈ 70 m², roughly a tennis court',
      'Blood–gas barrier ≈ 0.3 µm — thinner than a red cell is wide',
      'The only organ to receive 100% of cardiac output',
    ],
    bawaan: [
      {
        nama: 'Congenital diaphragmatic hernia',
        apa: 'A defect in the diaphragm through which abdominal organs enter the chest.',
        embriologi: 'The pleuroperitoneal membrane fails to close, most often on the LEFT posterolateral side (foramen of Bochdalek), around weeks 8–10.',
        akibat: 'Bowel and liver in the chest COMPRESS the developing lung → pulmonary hypoplasia and abnormally muscular pulmonary arterioles → persistent pulmonary hypertension after birth. The lethal problem is the hypoplastic lung, not the hole itself.',
        tanda: 'Respiratory distress at birth, scaphoid (sunken) abdomen, bowel sounds heard in the chest, heart displaced to the right.',
        lokasi3d: ['diaphragm', ' lung', 'lung '],
        layer: 'visceral',
      },
      {
        nama: 'Cystic fibrosis (lung involvement)',
        apa: 'A defective chloride channel makes airway secretions thick and unclearable.',
        embriologi: 'Not a structural malformation but an inherited CFTR gene defect (autosomal recessive); ΔF508 is the commonest mutation, causing misfolding and degradation before the protein reaches the membrane.',
        akibat: 'Failed chloride and water secretion → dehydrated airway surface liquid → mucociliary escalator stalls → chronic infection with Pseudomonas and Staphylococcus → bronchiectasis and progressive fibrosis.',
        tanda: 'Recurrent chest infections, steatorrhoea from pancreatic insufficiency, failure to thrive. Diagnosed by a raised sweat chloride.',
        lokasi3d: ['bronch', ' lung', 'lung '],
        layer: 'visceral',
      },
      {
        nama: 'Congenital pulmonary airway malformation (CPAM)',
        apa: 'A cystic mass of non-functioning lung tissue that communicates with the airway.',
        embriologi: 'Localised failure of normal bronchoalveolar maturation, with overgrowth of terminal bronchiolar structures.',
        akibat: 'The lesion occupies space without exchanging gas → compresses adjacent normal lung; large lesions shift the mediastinum and can cause fetal hydrops.',
        tanda: 'Often found on antenatal ultrasound. Later presentation is recurrent infection in the same lobe.',
        lokasi3d: [' lung', 'lung '],
        layer: 'visceral',
      },
      {
        nama: 'Primary ciliary dyskinesia',
        apa: 'Cilia throughout the body beat abnormally or not at all.',
        embriologi: 'Inherited defects in dynein arms. Because embryonic nodal cilia also determine left–right asymmetry, about half of those affected have situs inversus (Kartagener syndrome).',
        akibat: 'No mucociliary clearance → chronic sinusitis, otitis media and bronchiectasis; immotile sperm cause infertility.',
        tanda: 'The triad of situs inversus, chronic sinusitis and bronchiectasis. Dextrocardia on chest radiograph is the clue that ties it together.',
        lokasi3d: ['bronch', 'trachea'],
        layer: 'visceral',
      },
    ],
  },
  {
    key: 'kidneys',
    definisi: 'Paired organs that filter the entire blood volume many times a day and then reclaim, with great precision, almost everything they filtered.',
    fungsi: [
      'Controls fluid volume, sodium, potassium, calcium, phosphate and acid–base balance.',
      'Excretes urea, creatinine, drugs and their metabolites.',
      'Secretes renin (blood pressure), erythropoietin (red cell production) and activates vitamin D.',
    ],
    caraKerja:
      'Each kidney holds about a million nephrons. The glomerulus is a passive high-pressure sieve — it filters by size and CHARGE, which is why the negatively charged basement membrane normally repels albumin. Around 180 litres are filtered daily and about 99% is reabsorbed, so the design is deliberately extravagant: filter everything, then take back what is wanted. The proximal tubule reclaims two-thirds of it in bulk. The loop of Henle then builds a medullary salt gradient by countercurrent multiplication, and that gradient is the ONLY reason concentrated urine is possible. Final adjustment happens in the collecting duct under aldosterone and ADH.',
    fakta: [
      'Filters ~180 L/day to produce ~1.5 L of urine',
      'Receives ~20–25% of cardiac output despite being ~0.5% of body weight',
      'Glucose appears in urine once plasma exceeds ~180 mg/dL — the transport maximum',
    ],
    bawaan: [
      {
        nama: 'Autosomal dominant polycystic kidney disease (ADPKD)',
        apa: 'Progressive replacement of kidney tissue by fluid-filled cysts.',
        embriologi: 'PKD1 or PKD2 mutations disrupt polycystin in the primary cilium of tubular cells, so cells lose the ability to sense flow and orient their division along the tubule.',
        akibat: 'Misoriented division widens the tubule instead of lengthening it → cysts detach from the tubule and secrete fluid → mass effect destroys surrounding parenchyma → hypertension early, kidney failure by middle age.',
        tanda: 'Flank pain, haematuria, hypertension, palpable kidneys, family history. Look for the extrarenal associations: hepatic cysts, mitral valve prolapse, and berry aneurysms causing subarachnoid haemorrhage.',
        lokasi3d: ['kidney', 'renal'],
        layer: 'visceral',
      },
      {
        nama: 'Posterior urethral valves',
        apa: 'Obstructing membranous folds in the posterior urethra — the commonest cause of bladder outlet obstruction in boys.',
        embriologi: 'Abnormal persistence and fusion of the mesonephric duct remnants within the urethral wall.',
        akibat: 'Outflow obstruction → high bladder pressure → vesicoureteric reflux and hydronephrosis → renal dysplasia. Before birth, poor urine output causes oligohydramnios, and since amniotic fluid is required for lung growth, the child arrives with PULMONARY HYPOPLASIA — the kidney lesion kills through the lungs.',
        tanda: 'Male infant, poor urinary stream, palpable bladder, antenatal hydronephrosis. Diagnosed on voiding cystourethrogram.',
        lokasi3d: ['urethra', 'bladder', 'kidney'],
        layer: 'visceral',
      },
      {
        nama: 'Horseshoe kidney',
        apa: 'The two kidneys are fused, almost always at their lower poles.',
        embriologi: 'The developing kidneys fuse while still in the pelvis; the fused isthmus is then caught beneath the inferior mesenteric artery as they try to ascend, so it never reaches its normal position.',
        akibat: 'Usually functions normally. The abnormal position and drainage angle predispose to urinary stasis → infection, stones and pelvi-ureteric junction obstruction.',
        tanda: 'Frequently an incidental finding. Associated with Turner syndrome and with an increased risk of Wilms tumour.',
        lokasi3d: ['kidney', 'renal'],
        layer: 'visceral',
      },
      {
        nama: 'Renal agenesis (Potter sequence)',
        apa: 'One or both kidneys fail to form.',
        embriologi: 'The ureteric bud fails to develop or fails to induce the metanephric blastema — reciprocal induction is required, and neither structure forms without the other.',
        akibat: 'Bilateral agenesis → no fetal urine → severe oligohydramnios → the fetus is compressed and the lungs cannot expand → pulmonary hypoplasia, limb deformity and flat facies. Bilateral disease is incompatible with life; unilateral is usually silent with compensatory hypertrophy.',
        tanda: 'Antenatal oligohydramnios with an empty renal fossa.',
        lokasi3d: ['kidney', 'renal'],
        layer: 'visceral',
      },
      {
        nama: 'Vesicoureteric reflux',
        apa: 'Urine flows backwards from bladder to ureter and kidney.',
        embriologi: 'The intramural segment of the ureter is too short, so bladder contraction cannot compress it shut — the normal flap-valve mechanism fails.',
        akibat: 'Infected urine reaches the renal pelvis → pyelonephritis → scarring → hypertension and chronic kidney disease in adulthood.',
        tanda: 'Recurrent febrile urinary infections in a child. Graded I–V on voiding cystourethrogram.',
        lokasi3d: ['kidney', 'renal', 'bladder'],
        layer: 'visceral',
      },
    ],
  },
  {
    key: 'thyroid',
    definisi: 'A butterfly-shaped gland across the front of the trachea that sets the metabolic rate of nearly every cell in the body.',
    fungsi: [
      'Produces thyroxine (T4) and triiodothyronine (T3), which set basal metabolic rate, heat production and growth.',
      'Its parafollicular C cells secrete calcitonin, lowering blood calcium.',
      'Governs brain development in fetal life and infancy — irreplaceably.',
    ],
    caraKerja:
      'The thyroid is the only endocrine gland that stores its hormone OUTSIDE its cells, as colloid in follicles — enough for two to three months. Iodide is actively pumped in against a steep gradient by the sodium-iodide symporter, oxidised by thyroid peroxidase, and attached to tyrosine residues on thyroglobulin. Coupling those iodinated tyrosines makes T4 and T3. Most of what is released is T4, which is really a long-lived prohormone: peripheral tissues deiodinate it to the far more active T3, and by choosing how much to convert, each tissue sets its own exposure. TSH from the pituitary drives the whole process and is itself suppressed by circulating hormone.',
    fakta: [
      'Stores 2–3 months of hormone in advance — no other endocrine gland does this',
      'T3 is ~4× more potent than T4, but ~80% of T3 is made outside the thyroid',
      'Requires dietary iodine; deficiency remains the leading preventable cause of intellectual disability worldwide',
    ],
    bawaan: [
      {
        nama: 'Congenital hypothyroidism',
        apa: 'The thyroid is absent, misplaced, or unable to make hormone from birth.',
        embriologi: 'Usually thyroid dysgenesis — the gland fails to descend from the foramen caecum at the tongue base to the neck, or fails to form at all. A minority are dyshormonogenesis: an enzyme in the synthesis pathway is missing.',
        akibat: 'Thyroid hormone is required for myelination and neuronal migration in the first months. Without it → irreversible intellectual disability plus poor growth. THE DAMAGE IS PREVENTABLE BUT NOT REVERSIBLE, which is precisely why newborn screening exists.',
        tanda: 'Often no signs at birth — maternal T4 crosses the placenta and masks it. Later: prolonged jaundice, large fontanelle, umbilical hernia, hypotonia, feeding difficulty and a hoarse cry. Detected by newborn heel-prick TSH.',
        lokasi3d: ['thyroid'],
        layer: 'visceral',
      },
      {
        nama: 'Thyroglossal duct cyst',
        apa: 'A midline neck cyst formed from the remnant of the thyroid’s descent tract.',
        embriologi: 'The thyroglossal duct, which marks the gland’s migration from the tongue base, normally disappears; a persistent segment secretes fluid and enlarges.',
        akibat: 'Painless midline swelling that may become infected. Occasionally the cyst contains the ONLY functioning thyroid tissue the person has — which is why it must be imaged before removal.',
        tanda: 'A midline neck lump that MOVES UPWARD ON SWALLOWING AND ON TONGUE PROTRUSION — the tongue link is the distinguishing sign.',
        lokasi3d: ['thyroid', 'hyoid'],
        layer: 'visceral',
      },
    ],
  },
  {
    key: 'eye',
    definisi: 'An optical instrument that focuses light onto a sheet of neural tissue which is, embryologically, an outgrowth of the brain.',
    fungsi: [
      'Focuses light onto the retina and adjusts focus for distance (accommodation).',
      'Converts photons into electrical signals and performs the first stages of image processing before anything reaches the brain.',
      'Controls how much light enters, via the pupil.',
    ],
    caraKerja:
      'Most focusing is done by the CORNEA, not the lens — about 40 of the eye’s ~60 dioptres — because the air-to-tissue interface bends light most. The lens supplies the adjustable remainder: the ciliary muscle contracts, the zonules SLACKEN, and the lens becomes more spherical for near vision, which is the opposite of what intuition suggests. In the retina, photons isomerise retinal within rhodopsin, triggering a G-protein cascade that CLOSES sodium channels — so light HYPERPOLARISES photoreceptors and reduces their transmitter release. The retina is also inside-out: light passes through the neural layers before reaching the photoreceptors at the back.',
    fakta: [
      'Rods ~120 million (dim light, no colour); cones ~6 million, concentrated at the fovea',
      'The optic disc has no photoreceptors — a real blind spot the brain fills in',
      'A single photon can excite a rod',
    ],
    bawaan: [
      {
        nama: 'Congenital cataract',
        apa: 'The lens is opaque at birth.',
        embriologi: 'Disrupted lens fibre development. Causes include intrauterine infection (rubella), galactosaemia, and inherited mutations.',
        akibat: 'A blurred image during the visual critical period → the cortex never learns to process that eye → DEPRIVATION AMBLYOPIA. The lens can be replaced later; the lost cortical development cannot.',
        tanda: 'Absent or white red reflex (leukocoria) on newborn examination. Leukocoria must also raise the question of retinoblastoma.',
        lokasi3d: ['lens of eye', 'eyeball'],
        layer: 'nervous',
      },
      {
        nama: 'Congenital glaucoma',
        apa: 'Aqueous humour cannot drain, so pressure inside the eye rises from birth.',
        embriologi: 'Maldevelopment of the trabecular meshwork and iridocorneal angle.',
        akibat: 'Raised pressure in an infant’s elastic sclera makes the whole globe ENLARGE rather than simply damaging the nerve → corneal oedema and clouding, then optic nerve damage.',
        tanda: 'The classic triad of tearing, photophobia and blepharospasm, with an enlarged cloudy cornea (buphthalmos).',
        lokasi3d: ['cornea', 'iris', 'eyeball'],
        layer: 'nervous',
      },
      {
        nama: 'Coloboma',
        apa: 'A keyhole-shaped gap in the iris, retina, choroid or optic disc.',
        embriologi: 'The optic (choroidal) fissure fails to close in week 7. Because the fissure lies inferonasally, the defect is always in the lower part of the eye.',
        akibat: 'A field defect corresponding to the missing tissue; vision depends entirely on whether the macula is involved.',
        tanda: 'A visible keyhole pupil. Look for CHARGE syndrome, of which coloboma is the "C".',
        lokasi3d: ['iris', 'retina', 'eyeball'],
        layer: 'nervous',
      },
      {
        nama: 'Retinopathy of prematurity',
        apa: 'Abnormal retinal blood vessel growth in a preterm infant.',
        embriologi: 'Retinal vascularisation is incomplete until term. Supplemental oxygen halts the normal advance; when it stops, the relatively hypoxic avascular retina releases VEGF in a surge.',
        akibat: 'Disordered neovascularisation → fibrovascular ridge → traction on the retina → detachment and blindness.',
        tanda: 'Found by screening preterm infants — it has no outward signs until it is far advanced.',
        lokasi3d: ['retina', 'eyeball'],
        layer: 'nervous',
      },
    ],
  },
  {
    key: 'ear',
    definisi: 'An organ that converts air pressure waves into nerve impulses, and separately reports the position and motion of the head.',
    fungsi: [
      'Collects, amplifies and transduces sound into neural signals.',
      'Detects linear acceleration and gravity (otolith organs) and rotation (semicircular canals).',
      'Equalises middle-ear pressure with the atmosphere through the Eustachian tube.',
    ],
    caraKerja:
      'Sound arriving from air would mostly reflect off fluid — a mismatch of about 30 dB. The middle ear solves this: the tympanic membrane is around 17 times larger than the stapes footplate, and the ossicular lever adds a little more, concentrating force enough to drive the fluid. Inside the cochlea, the basilar membrane is narrow and stiff at the base and wide and floppy at the apex, so each frequency peaks at its own place — a mechanical Fourier analysis, called tonotopy, performed before any neuron is involved. Hair cells then convert deflection into voltage in microseconds, since their channels are opened by mechanical tip links rather than by chemistry.',
    fakta: [
      'The stapes is the smallest bone in the body, ~3 mm',
      'The middle ear overcomes a ~30 dB air-to-fluid impedance mismatch',
      'Outer hair cells actively amplify quiet sounds — they change length in response to voltage',
    ],
    bawaan: [
      {
        nama: 'Congenital sensorineural hearing loss',
        apa: 'The cochlea or auditory nerve does not work from birth.',
        embriologi: 'Genetic in about half of cases — connexin 26 (GJB2) mutations are commonest, disrupting potassium recycling in the cochlea. Non-genetic causes include congenital CMV and rubella.',
        akibat: 'Language acquisition has a critical period; auditory cortex deprived of input during it does not fully develop later → permanent speech and language delay even after hearing is restored.',
        tanda: 'Detected by newborn otoacoustic emission or auditory brainstem response screening, not by parental observation, which comes far too late.',
        lokasi3d: ['cochlea', 'vestibul'],
        layer: 'nervous',
      },
      {
        nama: 'Microtia and aural atresia',
        apa: 'An underdeveloped external ear, often with an absent or narrowed ear canal.',
        embriologi: 'Failure of the six hillocks of His (from the first and second pharyngeal arches) to fuse and expand, in weeks 6–8.',
        akibat: 'Sound cannot reach a normal cochlea → CONDUCTIVE loss. Because the inner ear has a different embryological origin, it is usually normal — so bone-conduction hearing works well.',
        tanda: 'Visible malformation of the pinna. Check the other ear and the kidneys, since the same window of development is involved.',
        lokasi3d: ['auricle', 'tympanic'],
        layer: 'surface',
      },
    ],
  },
  {
    key: 'brain',
    definisi: 'The organ that models the world, predicts what happens next, and issues the commands that move the body.',
    fungsi: [
      'Processes sensation, plans and executes movement, and stores memory.',
      'Regulates breathing, circulation, temperature, appetite and sleep through the brainstem and hypothalamus.',
      'Supports language, reasoning and emotion.',
    ],
    caraKerja:
      'Neurons compute by summing excitatory and inhibitory inputs and firing all-or-nothing action potentials; meaning lives in WHICH cells fire and WHEN, not in how strongly. Myelin lets impulses jump between nodes, multiplying speed roughly tenfold without thickening the axon. Synapses change strength with use — cells that fire together wire together — and that plasticity is the physical substrate of learning. The brain is metabolically extravagant and has essentially no fuel reserve, which is why four minutes without perfusion causes irreversible damage.',
    fakta: [
      '~86 billion neurons; ~2% of body weight but ~20% of resting oxygen use',
      'Cerebral blood flow ~750 mL/min, autoregulated across mean pressures of ~60–160 mmHg',
      'CSF ~150 mL total, replaced about 3–4 times a day',
    ],
    bawaan: [
      {
        nama: 'Neural tube defects (spina bifida, anencephaly)',
        apa: 'The neural tube fails to close, leaving neural tissue exposed or uncovered.',
        embriologi: 'Closure should complete by day 28 — often before pregnancy is recognised. Failure at the cranial end gives anencephaly; at the caudal end, spina bifida. Folate deficiency is the major modifiable cause.',
        akibat: 'Exposed cord is damaged → motor and sensory loss below the lesion, neurogenic bladder and bowel. Commonly accompanied by Chiari II malformation and hydrocephalus.',
        tanda: 'Raised maternal serum alpha-fetoprotein and antenatal ultrasound. Preconception folate reduces incidence by about 70% — the strongest argument for supplementing BEFORE conception, not after.',
        lokasi3d: ['spinal cord', 'vertebra'],
        layer: 'nervous',
      },
      {
        nama: 'Congenital hydrocephalus',
        apa: 'CSF accumulates and distends the ventricles.',
        embriologi: 'Most often aqueductal stenosis — the cerebral aqueduct is too narrow to pass CSF from third to fourth ventricle.',
        akibat: 'CSF is produced continuously regardless of outflow → pressure rises → in an infant with open sutures the HEAD ENLARGES rather than herniating, which buys time but compresses white matter.',
        tanda: 'Rapidly crossing head-circumference centiles, bulging fontanelle, "sunsetting" eyes from pressure on upward gaze.',
        lokasi3d: ['ventricle', 'thalamus', 'corpus callosum'],
        layer: 'nervous',
      },
    ],
  },
  {
    key: 'larynx',
    definisi: 'The valve at the top of the airway that protects the lungs and, secondarily, produces voice.',
    fungsi: [
      'Closes the airway during swallowing — its original and most important job.',
      'Generates sound by vibrating the vocal folds.',
      'Enables the cough reflex and allows the thoracic bracing used in lifting.',
    ],
    caraKerja:
      'Voice is not produced by muscles vibrating at pitch. Air pressure below the closed folds forces them apart; as air rushes through, pressure drops (Bernoulli) and elastic recoil snaps them shut, and the cycle repeats — a self-sustaining oscillation set by fold length, tension and mass. Every intrinsic laryngeal muscle is supplied by the recurrent laryngeal nerve except the cricothyroid, which the superior laryngeal supplies; the recurrent nerve’s long path around the aortic arch on the left is why chest disease can present as hoarseness.',
    fakta: [
      'Adult male folds ~17–25 mm, female ~12–17 mm — the length difference sets pitch',
      'Folds vibrate ~110 times/second in a typical male voice, ~220 in a female',
      'Only the posterior cricoarytenoid ABDUCTS the folds — the sole opener of the airway',
    ],
    bawaan: [
      {
        nama: 'Laryngomalacia',
        apa: 'Floppy supraglottic tissue collapses inward on inspiration.',
        embriologi: 'Immature cartilage and neuromuscular tone rather than a structural malformation; it resolves as both mature.',
        akibat: 'Inspiratory collapse narrows the airway → turbulent flow → stridor that is WORSE when supine, feeding or agitated, and better when prone.',
        tanda: 'The commonest cause of stridor in infants. Usually resolves by 12–24 months; feeding difficulty or failure to thrive is what makes it serious.',
        lokasi3d: ['larynx', 'arytenoid', 'epiglottis'],
        layer: 'visceral',
      },
      {
        nama: 'Tracheo-oesophageal fistula with oesophageal atresia',
        apa: 'An abnormal connection between trachea and oesophagus, usually with a blind-ending upper oesophagus.',
        embriologi: 'The tracheo-oesophageal septum fails to divide the foregut completely in weeks 4–5.',
        akibat: 'Saliva and feed cannot reach the stomach and instead spill into the airway → aspiration pneumonitis; gastric acid can also reflux up through the fistula into the lungs.',
        tanda: 'Polyhydramnios antenatally; frothing, choking and cyanosis with the first feed; a nasogastric tube coils in the upper pouch on radiograph. Look for the VACTERL associations.',
        lokasi3d: ['trachea', 'oesophagus', 'esophagus'],
        layer: 'visceral',
      },
    ],
  },
  {
    key: 'external-nose',
    definisi: 'The entrance to the airway, and the only organ of smell.',
    fungsi: [
      'Warms, humidifies and filters inspired air before it reaches the lungs.',
      'Houses the olfactory epithelium.',
      'Adds resonance to the voice and drains the paranasal sinuses and tears.',
    ],
    caraKerja:
      'The turbinates make airflow turbulent on purpose, throwing particles onto mucus and bringing air into contact with a large warm wet surface — inspired air reaches roughly body temperature and full saturation within a few centimetres. Olfactory receptors are true neurons exposed directly to the outside world, the only place in the body where that is true, and they are replaced throughout life. Their axons pass through the cribriform plate straight into the olfactory bulb, bypassing the thalamus — which is why smell reaches memory and emotion so directly, and why a cribriform fracture can leak CSF.',
    fakta: [
      'Around 400 functional olfactory receptor types, enough to discriminate a vast range of odours',
      'Conditions inspired air to ~37 °C and ~100% humidity within centimetres',
      'Kiesselbach’s plexus in the anterior septum is the source of most nosebleeds',
    ],
    bawaan: [
      {
        nama: 'Choanal atresia',
        apa: 'The back of the nasal cavity is blocked by bone or membrane.',
        embriologi: 'The bucconasal membrane fails to rupture, so the nasal cavity never opens into the nasopharynx.',
        akibat: 'Newborns are OBLIGATE NOSE BREATHERS → bilateral atresia causes cyanosis at rest that PARADOXICALLY IMPROVES WITH CRYING, because crying forces mouth breathing. That paradox is the diagnostic clue.',
        tanda: 'A catheter cannot be passed through the nostril into the pharynx. Part of the CHARGE association.',
        lokasi3d: ['nasal', 'nose'],
        layer: 'surface',
      },
      {
        nama: 'Cleft lip and palate',
        apa: 'The lip and/or palate fail to fuse in the midline.',
        embriologi: 'The medial nasal and maxillary prominences fail to merge (lip, weeks 5–6); the palatal shelves fail to elevate and fuse (palate, weeks 6–9).',
        akibat: 'Loss of oral–nasal separation → poor suck, nasal regurgitation, hypernasal speech, and Eustachian tube dysfunction causing recurrent otitis media with hearing loss.',
        tanda: 'Visible at birth; an isolated cleft palate may only be found on palpation of the palate.',
        lokasi3d: ['nose', 'nasal', 'maxilla', 'palate'],
        layer: 'surface',
      },
    ],
  },
  // ── Rangka ────────────────────────────────────────────────────────────────
  {
    key: 'skeleton',
    definisi: 'A living framework of 206 bones that carries load, protects organs, banks calcium, and manufactures blood.',
    fungsi: [
      'Bears weight and gives muscles the levers they pull against.',
      'Shields the brain, spinal cord, heart and lungs.',
      'Stores 99% of the body’s calcium and releases it on demand.',
      'Produces red cells, white cells and platelets in red marrow.',
    ],
    caraKerja:
      'Two ways bone forms, and the difference explains most congenital bone disease. INTRAMEMBRANOUS ossification lays bone straight into mesenchyme — that is how the skull vault and clavicle form. ENDOCHONDRAL ossification first makes a cartilage model and then replaces it, which is how every long bone forms; the growth plate is the surviving cartilage that keeps lengthening the bone until it fuses. Anything that disturbs cartilage signalling therefore shortens the limbs while sparing the skull. After growth ends, bone still turns over continuously: osteoclasts resorb, osteoblasts rebuild, and the whole skeleton is replaced roughly every ten years.',
    fakta: [
      '206 bones in an adult, 270 at birth — many fuse during growth',
      'Type I collagen is ~90% of bone’s organic matrix',
      'Peak bone mass is reached at roughly 25–30 years, and never regained if lost',
    ],
    bawaan: [
      {
        nama: 'Osteogenesis imperfecta',
        apa: 'Bones fracture with little or no force — “brittle bone disease”.',
        embriologi: 'Mutations in COL1A1 or COL1A2 disrupt type I collagen. A glycine substitution in the triple helix is worse than making none at all, because the abnormal chain poisons the normal ones assembled with it — a dominant negative effect.',
        akibat: 'Defective collagen scaffold → mineral has nothing sound to deposit on → bones are brittle despite normal mineral content. Because type I collagen is also in sclera, teeth and ligaments, the disease is never confined to bone.',
        tanda: 'Recurrent fractures from trivial trauma, BLUE SCLERAE (thin sclera showing the choroid beneath), poorly formed teeth, joint hypermobility, and early hearing loss. It is the single most important differential for suspected non-accidental injury.',
        lokasi3d: ['bone', 'femur', 'humerus', 'rib'],
        layer: 'skeletal',
      },
      {
        nama: 'Achondroplasia',
        apa: 'The commonest form of disproportionate short stature.',
        embriologi: 'A GAIN-of-function mutation in FGFR3. FGFR3 normally restrains chondrocyte proliferation at the growth plate; overactivity brakes it far too hard. Over 80% of cases are new mutations, and paternal age is the main risk factor.',
        akibat: 'Endochondral ossification is inhibited while intramembranous ossification is untouched → LIMBS are short while the SKULL VAULT grows normally. That single fact explains the whole phenotype: short proximal limbs, normal trunk length, large head with frontal bossing.',
        tanda: 'Rhizomelic shortening, trident hand, midface hypoplasia. Watch for foramen magnum stenosis in infancy — it compresses the cord and can cause sudden death, and it is the reason these children are imaged rather than simply measured.',
        lokasi3d: ['femur', 'humerus', 'skull', 'vertebra'],
        layer: 'skeletal',
      },
      {
        nama: 'Developmental dysplasia of the hip',
        apa: 'The femoral head sits abnormally in a shallow acetabulum, or dislocates from it.',
        embriologi: 'Not a fixed malformation but a developmental relationship: the acetabulum only deepens if a well-seated femoral head presses into it. Breech position and swaddling with the legs extended both prevent that.',
        akibat: 'A shallow socket → the head subluxes → the socket deepens even less. The loop is self-reinforcing, which is why treatment works when it is early and fails when it is late.',
        tanda: 'Asymmetric skin creases, limited abduction, Ortolani and Barlow tests in the newborn. Ultrasound before ossification, radiograph after. Untreated it causes early osteoarthritis in a young adult.',
        lokasi3d: ['pelvis', 'ilium', 'femur'],
        layer: 'skeletal',
      },
      {
        nama: 'Craniosynostosis',
        apa: 'One or more skull sutures fuse too early.',
        embriologi: 'Sutures are the growth plates of the skull vault; they must stay open while the brain expands. Premature fusion is sometimes syndromic (FGFR2 in Apert and Crouzon), often isolated.',
        akibat: 'Growth is blocked ACROSS the fused suture and continues parallel to it → a predictable head shape for each suture. Sagittal fusion gives a long narrow head; coronal fusion a short wide one. Multiple sutures raise intracranial pressure.',
        tanda: 'An abnormal head shape present from birth that does NOT correct with positioning — that is what separates it from positional plagiocephaly, which does.',
        lokasi3d: ['skull', 'frontal bone', 'parietal bone'],
        layer: 'skeletal',
      },
      {
        nama: 'Talipes equinovarus (clubfoot)',
        apa: 'The foot is turned inward and downward and cannot be passively corrected.',
        embriologi: 'Abnormal development of the talus and of the medial soft tissues, sometimes with an underlying neuromuscular cause such as spina bifida or arthrogryposis.',
        akibat: 'A fixed deformity means the child would walk on the outer border of the foot → skin breakdown and disability. Corrected early, the foot is functional for life.',
        tanda: 'Present at birth, rigid rather than positional. Ponseti serial casting is the standard treatment and usually avoids major surgery.',
        lokasi3d: ['talus', 'calcaneus', 'tibia', 'foot'],
        layer: 'skeletal',
      },
    ],
  },

  // ── Kulit ─────────────────────────────────────────────────────────────────
  {
    key: 'skin',
    definisi: 'The body’s largest organ — a self-repairing barrier that keeps water in, pathogens out, and regulates temperature.',
    fungsi: [
      'Forms a physical, chemical and immunological barrier.',
      'Controls heat loss through blood flow and sweating.',
      'Senses touch, temperature, pressure and pain.',
      'Synthesises vitamin D from ultraviolet light.',
    ],
    caraKerja:
      'The barrier is the outermost layer only, about as thick as a sheet of paper. Keratinocytes are born at the basal layer, migrate upward over roughly four weeks, die deliberately, and end as flattened corneocytes embedded in a lipid matrix — the "bricks and mortar" arrangement. Below, the dermis carries the collagen that gives strength, the vessels, the nerve endings, and the appendages. Holding the two together is the dermal–epidermal junction, a protein complex whose components are precisely what inherited blistering diseases destroy.',
    fakta: [
      'About 1.5–2 m² and ~15% of body weight',
      'The epidermis renews itself roughly every 28 days',
      'Skin blood flow ranges from ~0.3 L/min at rest to ~8 L/min in heat',
    ],
    bawaan: [
      {
        nama: 'Epidermolysis bullosa',
        apa: 'The skin blisters and shears away from minor friction.',
        embriologi: 'Inherited defects in the proteins that anchor epidermis to dermis. The level of the failing protein sets the type: keratin 5/14 (simplex, within the epidermis), laminin-332 (junctional), and type VII collagen (dystrophic, below the lamina densa).',
        akibat: 'No mechanical anchorage → separation with ordinary handling → blisters, erosions, fluid and protein loss, infection. Dystrophic forms scar as they heal → fused digits (mitten deformity), oesophageal strictures, and a very high lifetime risk of squamous cell carcinoma.',
        tanda: 'Blistering from birth at sites of friction, including the mouth. Diagnosis is by immunofluorescence mapping or genetic testing — the level of the split is the diagnosis.',
        lokasi3d: ['skin', 'region'],
        layer: 'surface',
      },
      {
        nama: 'Ichthyosis',
        apa: 'Dry, thickened, fish-scale skin.',
        embriologi: 'Defective desquamation or defective barrier lipids. Ichthyosis vulgaris involves filaggrin, the same gene central to atopic eczema; X-linked ichthyosis lacks steroid sulfatase, so cholesterol sulfate accumulates and glues corneocytes together.',
        akibat: 'Corneocytes fail to detach → the stratum corneum piles up → visible scale plus a leaky barrier → water loss and easier entry for allergens and microbes.',
        tanda: 'Generalised scaling, worse in dry cold air, sparing the flexures in the vulgaris form. X-linked ichthyosis affects boys and may accompany delayed labour, since the placenta needs the same enzyme.',
        lokasi3d: ['skin', 'region'],
        layer: 'surface',
      },
      {
        nama: 'Oculocutaneous albinism',
        apa: 'Little or no melanin in skin, hair and eyes.',
        embriologi: 'Melanocytes migrate normally from the neural crest but cannot make pigment — most often a tyrosinase (TYR) defect, tyrosinase being the rate-limiting enzyme of melanin synthesis.',
        akibat: 'No melanin means no ultraviolet protection → early photodamage and a high skin-cancer risk. Melanin is also required for normal routing of the optic nerves and for foveal development, so the eye problems are structural, not merely cosmetic: nystagmus, reduced acuity, and excessive decussation at the chiasm.',
        tanda: 'White hair, very pale skin, iris transillumination, nystagmus and photophobia from birth. Lifelong sun protection is the single most important intervention.',
        lokasi3d: ['skin', 'region'],
        layer: 'surface',
      },
      {
        nama: 'Ectodermal dysplasia',
        apa: 'Abnormal development of several ectodermal structures at once — hair, teeth, nails and sweat glands.',
        embriologi: 'Defects in the EDA/EDAR signalling pathway, which directs the ectoderm to form appendages. Because one pathway serves all of them, the features travel together.',
        akibat: 'Absent or scanty sweat glands → the child CANNOT LOSE HEAT BY SWEATING → unexplained recurrent fevers and heat intolerance, which is the dangerous part and often the presenting complaint.',
        tanda: 'Sparse fine hair, missing or conical teeth, dystrophic nails, periorbital wrinkling, and hyperthermia in warm weather.',
        lokasi3d: ['skin', 'region'],
        layer: 'surface',
      },
    ],
  },

  // ── Saluran cerna ─────────────────────────────────────────────────────────
  {
    key: 'large-intestine',
    definisi: 'The final 1.5 metres of gut, which reclaims water and salt and houses the microbiome.',
    fungsi: [
      'Absorbs water and electrolytes, turning liquid chyme into formed stool.',
      'Ferments residual fibre into short-chain fatty acids that feed the colonocytes themselves.',
      'Stores stool and controls continence.',
    ],
    caraKerja:
      'The colon has no villi — it is a slow absorptive tube, not a digestive one. Its intrinsic nervous system, the myenteric and submucosal plexuses, coordinates propulsion largely without the brain, which is why the gut still works after spinal injury. Those plexuses are built from neural crest cells that migrate the whole length of the gut during weeks 5–12, from mouth to anus. The migration ends last at the rectum, and that ordering is the key to Hirschsprung disease.',
    fakta: [
      'About 1.5 m long, and reabsorbs ~1.5 L of water a day',
      'Around 10^14 bacteria, outnumbering the body’s own cells',
      'Transit takes 12–48 hours, far longer than the small bowel',
    ],
    bawaan: [
      {
        nama: 'Hirschsprung disease',
        apa: 'A segment of distal bowel has no ganglion cells and cannot relax.',
        embriologi: 'Neural crest cells migrate craniocaudally and arrive at the rectum LAST. If migration arrests early, the aganglionic segment is always distal and always CONTINUOUS with the anus — there are no skip lesions, and that single fact tells you where to biopsy.',
        akibat: 'No ganglia → no receptive relaxation → the segment stays tonically contracted → functional obstruction. The bowel PROXIMAL to it dilates, so the megacolon on imaging is the healthy bowel, not the diseased one — a classic trap.',
        tanda: 'Failure to pass meconium within 48 hours, abdominal distension, bilious vomiting. Rectal biopsy showing absent ganglion cells is diagnostic. Enterocolitis is the complication that kills.',
        lokasi3d: ['colon', 'rectum', 'sigmoid'],
        layer: 'visceral',
      },
      {
        nama: 'Anorectal malformation (imperforate anus)',
        apa: 'The anus is absent, misplaced, or opens as a fistula.',
        embriologi: 'The urorectal septum fails to divide the cloaca completely, so hindgut and urogenital tract stay connected.',
        akibat: 'No patent outlet → obstruction. A fistula to bladder, urethra or vagina may vent stool and delay recognition, at the cost of urinary infection.',
        tanda: 'Absent anal opening on the newborn check, or meconium appearing in urine or at the vulva. Screen for the VACTERL associations, which cluster with it.',
        lokasi3d: ['rectum', 'anal'],
        layer: 'visceral',
      },
      {
        nama: 'Malrotation with midgut volvulus',
        apa: 'The intestine is fixed on too narrow a base and twists on its own blood supply.',
        embriologi: 'The midgut herniates into the umbilical cord, rotates 270° anticlockwise around the superior mesenteric artery, and returns by week 10. Incomplete rotation leaves the mesenteric root short instead of broad.',
        akibat: 'A narrow pedicle lets the whole midgut rotate around the superior mesenteric artery → arterial occlusion → infarction of the entire small bowel within hours. This is one of the few true abdominal emergencies of infancy.',
        tanda: 'BILIOUS VOMITING IN A NEWBORN IS VOLVULUS UNTIL PROVEN OTHERWISE. Upper GI contrast study is the test; delay costs the bowel.',
        lokasi3d: ['duodenum', 'jejunum', 'ileum'],
        layer: 'visceral',
      },
    ],
  },
  {
    key: 'small-intestine',
    definisi: 'Six metres of gut where essentially all nutrient absorption happens.',
    fungsi: [
      'Completes digestion with pancreatic enzymes and bile.',
      'Absorbs carbohydrate, protein, fat, vitamins and minerals.',
      'Hosts most of the body’s immune tissue in its wall.',
    ],
    caraKerja:
      'Surface area is everything. Folds, then villi, then microvilli multiply a plain tube’s area roughly 600-fold to about 250 m². Each villus has a central lacteal for fat and a capillary network for everything else, so fat leaves by lymphatics and bypasses the liver on first pass while sugars and amino acids do not.',
    fakta: [
      'Absorptive surface ≈ 250 m²',
      'The epithelium is replaced every 3–5 days — the fastest in the body',
      'Transit takes 3–5 hours',
    ],
    bawaan: [
      {
        nama: 'Duodenal atresia',
        apa: 'The duodenum ends blindly and does not communicate onward.',
        embriologi: 'The duodenal lumen is normally obliterated by proliferating epithelium in week 6 and then RECANALISES. Failure to recanalise leaves an atretic segment — unlike more distal atresias, which are vascular accidents.',
        akibat: 'Obstruction above the level of the stomach outlet → bilious vomiting if distal to the ampulla → polyhydramnios before birth, because the fetus cannot swallow and absorb amniotic fluid.',
        tanda: '“DOUBLE BUBBLE” on plain radiograph — gas in stomach and proximal duodenum with nothing beyond. Roughly a third of cases have Down syndrome.',
        lokasi3d: ['duodenum'],
        layer: 'visceral',
      },
      {
        nama: 'Meckel diverticulum',
        apa: 'A true diverticulum of the ileum, a remnant of the vitelline duct.',
        embriologi: 'The vitelline duct connects the midgut to the yolk sac and should disappear by week 7. A persistent proximal portion becomes a diverticulum containing all three bowel layers.',
        akibat: 'About half contain ECTOPIC GASTRIC MUCOSA. That mucosa secretes acid into ileum with no defence against it → ulceration of adjacent normal bowel → painless bleeding.',
        tanda: 'The rule of 2s: 2% of people, 2 feet from the ileocaecal valve, 2 inches long, usually under 2 years, 2 tissue types. Painless rectal bleeding in a toddler. A technetium-99m scan finds the gastric mucosa.',
        lokasi3d: ['ileum'],
        layer: 'visceral',
      },
    ],
  },
  {
    key: 'liver',
    definisi: 'The body’s chemical plant — it processes everything absorbed from the gut before the rest of the body sees it.',
    fungsi: [
      'Metabolises drugs, hormones and toxins.',
      'Makes albumin, clotting factors and bile.',
      'Stores glycogen and releases glucose between meals.',
    ],
    caraKerja:
      'The liver receives a dual blood supply, and roughly three quarters of it is venous blood from the gut arriving by the portal vein. Everything absorbed passes hepatocytes before entering the systemic circulation — the first-pass effect, which is why some drugs cannot be given by mouth at all. Bile made by hepatocytes drains the opposite way, through canaliculi into ducts and on to the gut.',
    fakta: [
      'Receives ~1.5 L of blood per minute, ~75% of it portal',
      'The only human organ that regenerates substantially',
      'Makes all clotting factors except von Willebrand factor',
    ],
    bawaan: [
      {
        nama: 'Biliary atresia',
        apa: 'The extrahepatic bile ducts are progressively destroyed and obliterated.',
        embriologi: 'Not a failure to form but a postnatal inflammatory obliteration of ducts that were patent — which is why the jaundice appears after, not at, birth.',
        akibat: 'No bile drainage → conjugated bilirubin backs up → cholestasis → biliary cirrhosis within months. Fat-soluble vitamin absorption fails, and vitamin K deficiency causes bleeding.',
        tanda: 'Jaundice persisting beyond 14 days with PALE STOOLS AND DARK URINE. Conjugated hyperbilirubinaemia in a newborn is never physiological. The Kasai portoenterostomy works far better before 60 days, so this is a diagnosis measured in weeks.',
        lokasi3d: ['liver', 'bile duct', 'gallbladder'],
        layer: 'visceral',
      },
    ],
  },

  // ── Urogenital ────────────────────────────────────────────────────────────
  {
    key: 'bladder',
    definisi: 'A muscular reservoir that stores urine at low pressure and empties it under voluntary control.',
    fungsi: [
      'Stores 400–600 mL without a rise in pressure.',
      'Empties completely and voluntarily.',
      'Protects the kidneys by never letting pressure rise back up the ureters.',
    ],
    caraKerja:
      'Storage depends on compliance: the detrusor relaxes as it fills, so pressure stays low even as volume climbs. The ureters enter obliquely through the bladder wall, so rising bladder pressure compresses them shut — a flap valve made of geometry rather than muscle. That single arrangement is what protects the kidneys, and its failure is what causes reflux.',
    fakta: [
      'Capacity ~400–600 mL in an adult',
      'First urge at around 150–250 mL',
      'Sympathetic fibres store, parasympathetic fibres void — S2–S4',
    ],
    bawaan: [
      {
        nama: 'Bladder exstrophy',
        apa: 'The bladder is open on the lower abdominal wall.',
        embriologi: 'The cloacal membrane fails to be reinforced by mesoderm and ruptures, so the anterior bladder wall and abdominal wall never close.',
        akibat: 'An open bladder plate → continuous urine leakage, exposed mucosa, and an associated wide pubic symphysis. Untreated it causes upper-tract damage and malignancy.',
        tanda: 'Obvious at birth. Almost always with epispadias, and requires staged reconstruction.',
        lokasi3d: ['bladder', 'pelvis'],
        layer: 'visceral',
      },
    ],
  },
  {
    key: 'testis',
    definisi: 'Paired glands that make sperm and testosterone, held outside the body because sperm need to be cooler than core temperature.',
    fungsi: [
      'Produces sperm in the seminiferous tubules.',
      'Secretes testosterone from Leydig cells.',
      'Maintains the blood–testis barrier that hides developing sperm from the immune system.',
    ],
    caraKerja:
      'The testis develops on the posterior abdominal wall and DESCENDS through the inguinal canal in the third trimester, dragging its blood supply from the aorta with it — which is why testicular arteries arise so high, and why testicular pain refers to the abdomen. Spermatogenesis takes about 70 days and fails above roughly 35 °C, so the scrotum, cremaster and pampiniform plexus exist purely to keep it a few degrees cooler.',
    fakta: [
      'Spermatogenesis takes ~64–72 days',
      'Needs a temperature ~2–3 °C below core',
      'Around 1,500 sperm are produced per second',
    ],
    bawaan: [
      {
        nama: 'Cryptorchidism (undescended testis)',
        apa: 'One or both testes have not reached the scrotum.',
        embriologi: 'Descent is a two-stage, hormone-dependent process. Failure leaves the testis anywhere along the path from abdomen to inguinal canal.',
        akibat: 'An abdominal testis sits at core temperature → germ cell loss begins within the first year → reduced fertility. Malignancy risk rises several-fold, and orchidopexy does NOT abolish it — it makes the testis examinable.',
        tanda: 'Empty hemiscrotum. Distinguish from a retractile testis, which can be milked down and needs no surgery. Operate at 6–12 months; waiting costs germ cells.',
        lokasi3d: ['testis', 'epididymis'],
        layer: 'visceral',
      },
      {
        nama: 'Hypospadias',
        apa: 'The urethral opening lies on the underside of the penis rather than at the tip.',
        embriologi: 'The urethral folds fail to fuse in the midline, a process driven by dihydrotestosterone in weeks 8–14. The more proximal the opening, the earlier the failure.',
        akibat: 'A misplaced meatus with an abnormal spray, often with chordee (ventral curvature) that impairs function later. The foreskin is incomplete dorsally — a hooded prepuce.',
        tanda: 'The triad of ventral meatus, hooded foreskin and chordee. DO NOT CIRCUMCISE — the foreskin is the tissue used for repair. Bilateral undescended testes with hypospadias raises the question of a difference of sex development.',
        lokasi3d: ['urethra', 'testis'],
        layer: 'visceral',
      },
    ],
  },

  // ── Saraf tepi & medula spinalis ──────────────────────────────────────────
  {
    key: 'spinal-cord',
    definisi: 'The cable between brain and body, and a reflex processor in its own right.',
    fungsi: [
      'Carries motor commands down and sensory information up.',
      'Executes reflexes without waiting for the brain.',
      'Houses the autonomic outflow that controls bladder, bowel and blood pressure.',
    ],
    caraKerja:
      'Tracts are arranged by function and by side, and that arrangement is what makes cord lesions localisable. The corticospinal tract has already crossed in the medulla, so it carries motor commands for the SAME side below the lesion. The dorsal columns carry vibration and proprioception up the same side and cross in the medulla. Spinothalamic fibres cross within a segment or two of entry, so pain and temperature loss appears on the OPPOSITE side. The cord also stops growing before the vertebral column does, ending near L1–L2 in an adult — which is why lumbar puncture below that level is safe.',
    fakta: [
      'About 45 cm long, ending at L1–L2 in an adult',
      '31 pairs of spinal nerves',
      'Conduction in myelinated fibres reaches ~120 m/s',
    ],
    bawaan: [
      {
        nama: 'Tethered cord syndrome',
        apa: 'The cord is anchored at its lower end and cannot ride up as the spine grows.',
        embriologi: 'A thickened filum terminale, lipoma or dermal sinus fixes the conus. The vertebral column outgrows the cord, so the cord is stretched rather than displaced.',
        akibat: 'Traction → ischaemia of the conus → progressive and often IRREVERSIBLE loss of bladder, bowel and lower limb function. Symptoms typically appear during growth spurts, which is the clue.',
        tanda: 'A cutaneous marker over the lower back — hairy patch, dimple above the natal cleft, lipoma or haemangioma — with new incontinence, foot deformity or leg weakness. MRI is diagnostic.',
        lokasi3d: ['spinal cord', 'vertebra'],
        layer: 'nervous',
      },
      {
        nama: 'Chiari malformation',
        apa: 'Hindbrain tissue is displaced downward through the foramen magnum.',
        embriologi: 'A posterior fossa too small for its contents. Type II accompanies spina bifida and is thought to follow CSF leakage through the open neural tube, which prevents the fossa expanding normally.',
        akibat: 'Crowding at the foramen magnum obstructs CSF flow → hydrocephalus, and pressure waves may split the cord centrally to form a SYRINX. A syrinx damages the crossing spinothalamic fibres first, giving a "cape" of lost pain and temperature sensation with touch preserved.',
        tanda: 'Occipital headache made worse by coughing or straining, neck pain, and a dissociated sensory loss over the shoulders and arms.',
        lokasi3d: ['cerebell', 'spinal cord'],
        layer: 'nervous',
      },
    ],
  },
  {
    key: 'peripheral-nerves',
    definisi: 'The wiring that connects the central nervous system to every muscle, gland and sensory ending.',
    fungsi: [
      'Carries motor commands to muscle and sensation back from the periphery.',
      'Runs the autonomic supply to viscera, vessels and glands.',
      'Regenerates after injury — unlike central axons.',
    ],
    caraKerja:
      'Each axon is wrapped by Schwann cells, and one Schwann cell myelinates exactly one segment of one axon — unlike oligodendrocytes centrally, which serve many. That difference is why peripheral nerve can regrow along its old sheath at roughly 1 mm a day, while central axons cannot. Nerves are bundled in fascicles with connective tissue sheaths; the perineurium forms the blood–nerve barrier.',
    fakta: [
      'Regeneration proceeds at roughly 1 mm per day',
      'The sciatic nerve is the largest, about as thick as a thumb',
      'Schwann cells derive from the neural crest',
    ],
    bawaan: [
      {
        nama: 'Neurofibromatosis type 1',
        apa: 'Tumours grow along nerves throughout the body.',
        embriologi: 'Loss of the NF1 tumour-suppressor gene, which normally restrains RAS signalling. Neural-crest-derived Schwann cells lose that brake and proliferate.',
        akibat: 'Unrestrained RAS activity → neurofibromas along peripheral nerves, and a raised risk of optic glioma and malignant peripheral nerve sheath tumour. It is fully penetrant but extremely variable, so severity cannot be predicted from a parent.',
        tanda: 'Six or more café-au-lait macules, axillary or inguinal freckling, Lisch nodules on the iris, and cutaneous neurofibromas. Skin signs usually precede tumours by years.',
        lokasi3d: ['nerve', 'plexus'],
        layer: 'nervous',
      },
      {
        nama: 'Brachial plexus birth injury (Erb palsy)',
        apa: 'Traction on the upper brachial plexus during delivery.',
        embriologi: 'Not a malformation but a birth injury — included here because it presents at birth and is confused with congenital weakness.',
        akibat: 'C5–C6 injury → deltoid, biceps and supraspinatus denervated → the arm hangs adducted and internally rotated, elbow extended, forearm pronated — the "waiter’s tip" position. GRIP IS PRESERVED, because C8–T1 is spared, and that is what distinguishes it from a lower (Klumpke) injury.',
        tanda: 'Unilateral absent Moro reflex with an intact grasp, after shoulder dystocia or a large baby. Most recover; failure to regain biceps function by 3 months prompts surgical referral.',
        lokasi3d: ['brachial plexus', 'nerve'],
        layer: 'nervous',
      },
    ],
  },
]

export function penjelasanOrgan(key: string): OrganPenjelasan | undefined {
  return ORGAN_PENJELASAN.find((o) => o.key === key)
}

/** Organ yang punya daftar kelainan bawaan — dipakai untuk menandai di layar. */
export function organWithCongenital(): string[] {
  return ORGAN_PENJELASAN.filter((o) => o.bawaan.length > 0).map((o) => o.key)
}
