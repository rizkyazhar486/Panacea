import { CARDIO_BY_NAME } from './cardioAtlas.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Patologi kardiovaskular yang DITUNJUKKAN DI TEMPATNYA.
//
// Perbedaannya dengan daftar penyakit biasa: tiap keadaan di sini menyebut
// STRUKTUR BERNAMA yang terkena — nama yang sama persis dengan nama mesh di
// /cardio/cardio.glb — sehingga membuka "infark miokard anterior" langsung
// menyalakan LAD pada figur, bukan menampilkan paragraf tentang LAD.
//
// Yang menyusul lesi adalah HILIRNYA: pembuluh boleh tersumbat di satu titik,
// tapi yang mati adalah jaringan di sebelah hilir. Itu sebabnya ada dua daftar,
// dan keduanya diberi warna berbeda di layar.
//
// Isi klinis ditulis dalam bahasa Inggris (bahasa dasar aplikasi). Tautan ke
// korpus SKDI memakai NAMA PENYAKIT PERSIS seperti di skdiDiseaseList.ts,
// supaya catatan panjang yang sudah ada tidak perlu ditulis ulang — dan ada
// ujinya, sehingga tautan yang salah ketik ketahuan sebelum dikirim.
// ─────────────────────────────────────────────────────────────────────────────

export type JenisLesi =
  | 'occlusion' | 'stenosis' | 'dilatation' | 'thrombus'
  | 'incompetence' | 'shunt' | 'dissection' | 'hypertrophy'

export interface CardioLesion {
  /** Nama struktur BodyParts3D — harus ada di CARDIO_PARTS. */
  struktur: string
  jenis: JenisLesi
  /** Penyempitan diameter 0..1, hanya untuk 'stenosis'. */
  derajat?: number
  catatan: string
}

export interface CardioCondition {
  id: string
  label: string
  kategori: 'coronary' | 'valve' | 'aorta' | 'venous' | 'pulmonary' | 'cerebrovascular' | 'renal' | 'portal' | 'congenital'
  /** Satu kalimat, bahasa sehari-hari. */
  ringkas: string
  lesi: CardioLesion[]
  /** Struktur yang kekurangan darah AKIBAT lesi di atas. */
  hilir: string[]
  /** Mekanisme setingkat dokter/peneliti — kenapa hal ini terjadi. */
  mekanisme: string
  temuan: string[]
  penunjang: string[]
  tata: string[]
  /** Jalur aliran yang paling menjelaskan keadaan ini. */
  jalur?: string
  /** Sasaran organ untuk membuka berkas klinis lengkapnya. */
  organKey: string
  /** Nama penyakit PERSIS seperti di daftar SKDI, untuk menarik catatannya. */
  skdi: string[]
}

export const CARDIO_CONDITIONS: CardioCondition[] = [
  {
    id: 'stemi-anterior',
    label: 'Anterior STEMI — LAD occlusion',
    kategori: 'coronary',
    ringkas: 'The artery running down the front of the heart blocks, and the muscle it feeds starts to die.',
    lesi: [
      { struktur: 'Trunk of anterior interventricular branch of left coronary artery', jenis: 'occlusion',
        catatan: 'Thrombus on a ruptured plaque, usually in the proximal third.' },
    ],
    // Yang mati adalah OTOT dinding depan, bukan darah di dalam rongganya —
    // menyorot rongga akan mengajarkan letak yang salah, dan gumpalan besarnya
    // menutupi koroner yang sedang dibicarakan.
    hilir: [
      'Diagonal branch of anterior descending branch of left coronary artery',
      'Wall of ventricle',
    ],
    mekanisme:
      'A lipid-rich plaque with a thin fibrous cap ruptures; exposed collagen and tissue factor trigger platelet ' +
      'adhesion and a fibrin-rich occlusive thrombus. Transmural ischaemia begins within seconds and myocyte ' +
      'necrosis within 20–30 minutes, spreading as a wavefront from subendocardium to epicardium over 4–6 hours — ' +
      'which is why time to reperfusion, not the size of the vessel, decides the size of the infarct.',
    temuan: [
      'Crushing central chest pain lasting more than 20 minutes, not relieved by rest',
      'ST elevation in V1–V4 (anterior leads); reciprocal depression inferiorly',
      'Pump failure signs if the infarct is large — hypotension, S3, pulmonary crackles',
    ],
    penunjang: [
      'ECG within 10 minutes of arrival — this decides reperfusion, not the troponin',
      'High-sensitivity troponin (rises 2–4 h, peaks 24 h); do not wait for it to act on ST elevation',
      'Echocardiography for anterior wall akinesis, LV function, mechanical complications',
    ],
    tata: [
      'Primary PCI within 90 minutes of first medical contact; fibrinolysis if PCI is more than 120 minutes away',
      'Dual antiplatelet therapy, anticoagulation, high-intensity statin',
      'Beta blocker and ACE inhibitor once haemodynamically stable — both reduce remodelling',
    ],
    jalur: 'coronary-left',
    organKey: 'heart',
    skdi: ['Infark miokard'],
  },
  {
    id: 'stemi-inferior',
    label: 'Inferior STEMI — RCA occlusion',
    kategori: 'coronary',
    ringkas: 'The artery on the underside of the heart blocks; the pulse often slows because it also feeds the pacemaker tissue.',
    lesi: [
      { struktur: 'Trunk of right coronary artery', jenis: 'occlusion',
        catatan: 'Occlusion proximal to the marginal branch affects the right ventricle too.' },
    ],
    hilir: [
      'Posterior interventricular branch of right coronary artery',
      'Marginal branch of right coronary artery', 'Cavity of right ventricle',
    ],
    mekanisme:
      'The RCA supplies the inferior wall, the AV node in ~90% of people, and the sinus node in ~60%. Occlusion ' +
      'therefore couples infarction with bradyarrhythmia, and a proximal occlusion adds right ventricular ' +
      'infarction — a preload-dependent state in which nitrates and diuretics cause abrupt hypotension.',
    temuan: [
      'Inferior chest pain with nausea and vomiting; bradycardia is common',
      'ST elevation in II, III, aVF; ST elevation in V4R indicates RV involvement',
      'Hypotension with clear lungs and raised JVP points to RV infarction',
    ],
    penunjang: [
      'Right-sided ECG leads (V4R) — routinely omitted and routinely needed here',
      'Troponin, echocardiography for RV dilatation and inferior wall motion',
    ],
    tata: [
      'Primary PCI; avoid nitrates and diuretics if the right ventricle is involved',
      'Fluid loading for RV infarct hypotension; atropine or pacing for symptomatic bradycardia',
    ],
    jalur: 'coronary-right',
    organKey: 'heart',
    skdi: ['Infark miokard'],
  },
  {
    id: 'stable-angina',
    label: 'Stable angina — 70% LAD stenosis',
    kategori: 'coronary',
    ringkas: 'A narrowed artery still supplies enough blood at rest, but not enough when you climb stairs.',
    lesi: [
      { struktur: 'Trunk of anterior interventricular branch of left coronary artery', jenis: 'stenosis',
        derajat: 0.7, catatan: '70% diameter stenosis — resting flow preserved, flow reserve roughly halved.' },
    ],
    hilir: ['Diagonal branch of anterior descending branch of left coronary artery'],
    mekanisme:
      'Resistance rises with the fourth power of the radius, but the stenosis is short while the distal bed is a ' +
      'whole tree. The bed dilates to hold resting flow constant, so symptoms appear only when demand rises and ' +
      'the bed has no dilatation left — the reason the first thing lost is coronary flow reserve, not resting flow.',
    temuan: [
      'Predictable, exertional chest tightness relieved within minutes by rest or nitrate',
      'Normal examination between episodes — a normal resting ECG excludes nothing',
    ],
    penunjang: [
      'Exercise or pharmacological stress imaging; CT coronary angiography for anatomy',
      'Invasive FFR when a lesion of intermediate severity needs a decision',
    ],
    tata: [
      'Antiplatelet and high-intensity statin for every patient — prognosis first',
      'Beta blocker or calcium channel blocker for symptoms; revascularisation if symptoms persist',
    ],
    jalur: 'coronary-left',
    organKey: 'heart',
    skdi: ['Angina pektoris'],
  },
  {
    id: 'aortic-stenosis',
    label: 'Aortic stenosis',
    kategori: 'valve',
    ringkas: 'The door out of the left ventricle stiffens, so the heart has to push much harder to open it.',
    lesi: [
      { struktur: 'Anterior cusp of aortic valve', jenis: 'stenosis', derajat: 0.75,
        catatan: 'Calcific thickening with restricted cusp opening.' },
      { struktur: 'Left posterior cusp of aortic valve', jenis: 'stenosis', derajat: 0.75, catatan: 'Calcified cusp.' },
      { struktur: 'Right posterior cusp of aortic valve', jenis: 'stenosis', derajat: 0.75, catatan: 'Calcified cusp.' },
    ],
    hilir: ['Ascending aorta'],
    mekanisme:
      'Chronic pressure overload drives concentric hypertrophy, which preserves wall stress but raises filling ' +
      'pressure and shrinks the subendocardial perfusion window. Angina occurs with normal coronaries because ' +
      'hypertrophied muscle outgrows its supply; syncope occurs because output is fixed while exercise vasodilates ' +
      'the periphery.',
    temuan: [
      'Ejection systolic murmur radiating to the carotids, soft or absent second sound',
      'Slow-rising, low-volume pulse',
      'The triad that dates the prognosis: angina, syncope, heart failure',
    ],
    penunjang: [
      'Echocardiography: peak velocity, mean gradient, valve area, LV function',
      'ECG for hypertrophy and strain; coronary assessment before intervention',
    ],
    tata: [
      'Valve replacement (surgical or transcatheter) once severe and symptomatic — medicine does not relieve obstruction',
      'Avoid preload-reducing drugs in severe stenosis',
    ],
    jalur: 'systemic',
    organKey: 'heart',
    skdi: ['Penyakit katup jantung (Mitral stenosis, Mitral regurgitation, Aortic stenosis, Aortic regurgitation)'],
  },
  {
    id: 'mitral-stenosis',
    label: 'Mitral stenosis',
    kategori: 'valve',
    ringkas: 'The valve between the left atrium and ventricle narrows, and blood backs up into the lungs.',
    lesi: [
      { struktur: 'Anterior leaflet of mitral valve', jenis: 'stenosis', derajat: 0.7,
        catatan: 'Commissural fusion and leaflet thickening, almost always rheumatic.' },
      { struktur: 'Posterior leaflet of mitral valve', jenis: 'stenosis', derajat: 0.7, catatan: 'Thickened, tethered leaflet.' },
    ],
    hilir: ['Cavity of left ventricle'],
    mekanisme:
      'A fixed diastolic gradient raises left atrial pressure, which transmits back to the pulmonary veins and ' +
      'capillaries. The atrium dilates and fibrillates, and the loss of atrial systole plus the shortened diastole ' +
      'of a fast ventricular rate can precipitate pulmonary oedema in a patient who was stable an hour earlier.',
    temuan: [
      'Loud first heart sound, opening snap, rumbling mid-diastolic murmur at the apex',
      'Atrial fibrillation, systemic embolism, haemoptysis',
      'Symptoms first appear in pregnancy, sepsis or fast AF — states that shorten diastole',
    ],
    penunjang: [
      'Echocardiography with valve area and gradient; transoesophageal study for atrial thrombus',
      'ECG for AF and left atrial enlargement',
    ],
    tata: [
      'Rate control and anticoagulation for AF',
      'Percutaneous balloon commissurotomy if the anatomy is suitable; otherwise valve surgery',
      'Secondary prophylaxis against rheumatic fever where it is endemic',
    ],
    jalur: 'systemic',
    organKey: 'heart',
    skdi: [
      'Penyakit katup jantung (Mitral stenosis, Mitral regurgitation, Aortic stenosis, Aortic regurgitation)',
      'Penyakit jantung reumatik',
    ],
  },
  {
    id: 'mitral-regurgitation',
    label: 'Mitral regurgitation',
    kategori: 'valve',
    ringkas: 'The valve leaks, so every beat sends part of the blood backwards into the lungs.',
    lesi: [
      { struktur: 'Posterior leaflet of mitral valve', jenis: 'incompetence',
        catatan: 'Prolapse, chordal rupture, annular dilatation or ischaemic tethering.' },
    ],
    hilir: ['Cavity of left atrium'],
    mekanisme:
      'The regurgitant orifice offers a low-impedance escape route, so the ventricle empties into the atrium at ' +
      'low pressure and ejection fraction looks deceptively good. An EF that has fallen to "normal-low" in severe ' +
      'MR already indicates established myocardial injury — the reason surgical thresholds are set earlier than intuition suggests.',
    temuan: [
      'Pansystolic murmur at the apex radiating to the axilla, soft first sound',
      'Displaced hyperdynamic apex, third heart sound in severe leak',
      'Acute severe MR after infarction presents as sudden pulmonary oedema, often with a quiet murmur',
    ],
    penunjang: [
      'Echocardiography: mechanism, regurgitant volume, LV size, pulmonary pressure',
      'Coronary angiography when the cause may be ischaemic',
    ],
    tata: [
      'Repair rather than replace whenever the anatomy allows',
      'Afterload reduction and diuretics for symptoms; urgent surgery for acute severe MR',
    ],
    jalur: 'systemic',
    organKey: 'heart',
    skdi: ['Penyakit katup jantung (Mitral stenosis, Mitral regurgitation, Aortic stenosis, Aortic regurgitation)'],
  },
  {
    id: 'aortic-dissection-a',
    label: 'Aortic dissection, Stanford A',
    kategori: 'aorta',
    ringkas: 'The inner lining of the main artery tears and blood burrows into the wall — a surgical emergency.',
    lesi: [
      { struktur: 'Ascending aorta', jenis: 'dissection', catatan: 'Intimal tear with a false lumen in the media.' },
      { struktur: 'Arch of aorta', jenis: 'dissection', catatan: 'Propagation into the arch and its branches.' },
    ],
    hilir: ['Trunk of right coronary artery', 'Left common carotid artery', 'Left subclavian artery'],
    mekanisme:
      'Blood enters the media through an intimal tear and cleaves the wall along its length. Complications follow ' +
      'the anatomy: proximal extension causes aortic regurgitation, coronary ostial occlusion or tamponade; branch ' +
      'involvement causes stroke, limb or visceral malperfusion. Untreated type A mortality rises roughly 1% per hour.',
    temuan: [
      'Sudden tearing chest pain radiating to the back, maximal at onset',
      'Blood pressure differential between arms, new early diastolic murmur, pulse deficit',
      'Any combination of chest pain with a focal neurological deficit',
    ],
    penunjang: [
      'CT angiography of the whole aorta; transoesophageal echocardiography if too unstable to move',
      'D-dimer is supportive, never exclusionary in a high-probability patient',
    ],
    tata: [
      'Immediate surgery for type A; anti-impulse therapy with a beta blocker first — lower dP/dt before lowering pressure',
      'Type B without complications is managed medically with strict pressure control',
    ],
    jalur: 'systemic',
    organKey: 'heart',
    skdi: ['Aneurisma diseksi', 'Aneurisma Aorta'],
  },
  {
    id: 'aaa',
    label: 'Abdominal aortic aneurysm',
    kategori: 'aorta',
    ringkas: 'The main artery in the belly balloons out; the danger is that it bursts.',
    lesi: [
      { struktur: 'Abdominal aorta', jenis: 'dilatation',
        catatan: 'Infrarenal dilatation beyond 3 cm; rupture risk climbs steeply beyond 5.5 cm.' },
    ],
    hilir: ['Left common iliac artery', 'Right common iliac artery'],
    mekanisme:
      'Elastin degradation and matrix metalloproteinase activity weaken the media. Laplace\'s law makes this ' +
      'self-accelerating: wall tension rises with radius, so each increment of dilatation increases the tension ' +
      'that drives the next. Most aneurysms are infrarenal, where the aorta has fewer vasa vasorum.',
    temuan: [
      'Usually silent; a pulsatile expansile abdominal mass when large',
      'Rupture: sudden abdominal or back pain, hypotension, pulsatile mass — the classic triad is often incomplete',
    ],
    penunjang: [
      'Ultrasound for detection and surveillance; CT angiography before repair',
      'Screening ultrasound for men over 65 where a programme exists',
    ],
    tata: [
      'Repair (open or endovascular) at 5.5 cm, rapid growth, or symptoms',
      'Smoking cessation and blood pressure control slow expansion',
    ],
    jalur: 'systemic',
    organKey: 'heart',
    skdi: ['Aneurisma Aorta'],
  },
  {
    id: 'coarctation',
    label: 'Coarctation of the aorta',
    kategori: 'congenital',
    ringkas: 'A narrow segment of the main artery: the arms get high pressure, the legs get too little.',
    lesi: [
      { struktur: 'Arch of aorta', jenis: 'stenosis', derajat: 0.6,
        catatan: 'Narrowing at the isthmus, just distal to the left subclavian artery.' },
    ],
    hilir: ['Descending thoracic aorta', 'Abdominal aorta', 'Left femoral artery', 'Left renal artery'],
    mekanisme:
      'Obstruction distal to the head and arm vessels produces upper-limb hypertension and lower-limb hypoperfusion. ' +
      'Renal hypoperfusion recruits the renin–angiotensin system, so the hypertension persists even after the ' +
      'mechanical gradient is relieved late. Collaterals through the intercostal arteries erode the ribs.',
    temuan: [
      'Radiofemoral delay; blood pressure higher in the arms than the legs',
      'Hypertension in a young person — the reason femoral pulses belong in that examination',
      'Rib notching on chest radiograph in long-standing cases',
    ],
    penunjang: [
      'Four-limb blood pressure; echocardiography with arch Doppler; CT or MR angiography',
    ],
    tata: [
      'Surgical repair or stenting; lifelong follow-up for recoarctation, aneurysm and persistent hypertension',
      'Look for the associated bicuspid aortic valve — it is present in most patients',
    ],
    jalur: 'systemic',
    organKey: 'heart',
    skdi: ['Koarktasio aorta'],
  },
  {
    id: 'carotid-stenosis',
    label: 'Carotid stenosis',
    kategori: 'cerebrovascular',
    ringkas: 'Plaque at the neck artery; fragments can break off and block a brain vessel.',
    lesi: [
      { struktur: 'Left internal carotid artery', jenis: 'stenosis', derajat: 0.75,
        catatan: 'Plaque at the bifurcation — the usual site because of low, oscillatory wall shear.' },
    ],
    hilir: ['Sphenoid part of left middle cerebral artery'],
    mekanisme:
      'The mechanism is embolic far more often than haemodynamic: platelet-fibrin and cholesterol debris from an ' +
      'ulcerated plaque lodge distally. That is why symptoms are sudden and focal rather than postural, and why ' +
      'the surgical benefit depends on recent symptoms rather than on the degree of narrowing alone.',
    temuan: [
      'Amaurosis fugax, or transient hemiparesis or dysphasia lasting minutes',
      'Carotid bruit — neither sensitive nor specific, and absent in very tight stenosis',
    ],
    penunjang: [
      'Carotid duplex ultrasound; CT or MR angiography to confirm before intervention',
      'Brain imaging to distinguish infarction from haemorrhage',
    ],
    tata: [
      'Antiplatelet, high-intensity statin, blood pressure and diabetes control',
      'Endarterectomy within 2 weeks of symptoms for 50–99% stenosis — benefit falls sharply with delay',
    ],
    jalur: 'cerebral-anterior',
    organKey: 'brain',
    skdi: ['Infark serebral', 'Trombosis arteri'],
  },
  {
    id: 'mca-occlusion',
    label: 'Middle cerebral artery occlusion',
    kategori: 'cerebrovascular',
    ringkas: 'A clot blocks the main brain artery — face, arm and speech go first.',
    lesi: [
      { struktur: 'Sphenoid part of left middle cerebral artery', jenis: 'occlusion',
        catatan: 'Embolus from the heart or a proximal artery lodging in the M1 segment.' },
    ],
    hilir: ['Left anterior cerebral artery'],
    mekanisme:
      'Flow below roughly 20 mL/100 g/min silences neurons but keeps them alive — the penumbra — while flow below ' +
      '10 kills them within minutes. The penumbra is the target of reperfusion, and its size, not the clock alone, ' +
      'is what modern imaging-based selection tries to measure.',
    temuan: [
      'Contralateral face and arm weakness worse than the leg, gaze deviation towards the lesion',
      'Aphasia with dominant-hemisphere occlusion; neglect with the non-dominant side',
    ],
    penunjang: [
      'Immediate non-contrast CT to exclude haemorrhage, then CT angiography for the occlusion',
      'CT perfusion or MR diffusion–perfusion mismatch for late-window selection',
    ],
    tata: [
      'Thrombolysis within the licensed window; mechanical thrombectomy for large-vessel occlusion',
      'Stroke unit care, then secondary prevention aimed at the mechanism found',
    ],
    jalur: 'cerebral-anterior',
    organKey: 'brain',
    skdi: ['Infark serebral', 'Emboli arteri'],
  },
  {
    id: 'pe',
    label: 'Pulmonary embolism',
    kategori: 'pulmonary',
    ringkas: 'A clot travels from a leg vein and lodges in the lung arteries.',
    lesi: [
      { struktur: 'Pulmonary trunk', jenis: 'thrombus', catatan: 'Saddle embolus straddling the bifurcation.' },
      { struktur: 'Right pulmonary artery', jenis: 'occlusion', catatan: 'Occlusive thrombus in a main branch.' },
    ],
    hilir: ['Left superior pulmonary vein', 'Cavity of left atrium', 'Cavity of left ventricle'],
    mekanisme:
      'Obstruction plus hypoxic and mediator-driven vasoconstriction raises pulmonary vascular resistance abruptly. ' +
      'A thin-walled right ventricle cannot generate more than about 40 mmHg acutely, so it dilates, its wall ' +
      'tension and oxygen demand rise while systemic pressure falls, and the spiral to obstructive shock is ' +
      'ventricular, not pulmonary.',
    temuan: [
      'Sudden dyspnoea, pleuritic pain, haemoptysis; tachycardia and hypoxaemia',
      'Raised JVP, right ventricular heave and hypotension mark high-risk PE',
    ],
    penunjang: [
      'Wells or Geneva score first; D-dimer only in low or intermediate probability',
      'CT pulmonary angiography; echocardiography for RV strain in the unstable patient',
    ],
    tata: [
      'Anticoagulation immediately unless contraindicated',
      'Thrombolysis for haemodynamic instability; catheter or surgical embolectomy where thrombolysis fails or is contraindicated',
    ],
    jalur: 'pulmonary',
    organKey: 'lungs',
    skdi: ['Emboli paru', 'Infark paru', 'Tromboemboli'],
  },
  {
    id: 'dvt',
    label: 'Deep vein thrombosis',
    kategori: 'venous',
    ringkas: 'A clot forms in a deep leg vein; the leg swells and the clot can travel to the lungs.',
    lesi: [
      { struktur: 'Left femoral vein', jenis: 'thrombus', catatan: 'Occlusive thrombus in the femoral segment.' },
      { struktur: 'Left popliteal vein', jenis: 'thrombus', catatan: 'Popliteal extension — the threshold for anticoagulating.' },
    ],
    hilir: ['Left external iliac vein', 'Left common iliac vein', 'Inferior vena cava'],
    mekanisme:
      'Virchow\'s triad, still intact after 160 years: stasis, endothelial injury and hypercoagulability. Thrombi ' +
      'begin in valve pockets of the calf where flow separates; propagation above the knee is what converts a ' +
      'local problem into a pulmonary one, which is why the popliteal vein is the decision point.',
    temuan: [
      'Unilateral calf or thigh swelling, tenderness along the deep veins, warmth',
      'Phlegmasia — a tense, blue, painful limb — signals threatened viability',
    ],
    penunjang: [
      'Wells score, then compression ultrasound; D-dimer to exclude in low probability',
      'Look for provocation: surgery, immobility, malignancy, oestrogen, pregnancy',
    ],
    tata: [
      'Anticoagulation for at least 3 months; longer if unprovoked or the risk persists',
      'Compression for post-thrombotic symptoms; thrombolysis reserved for limb-threatening ileofemoral thrombosis',
    ],
    jalur: 'venous-return',
    organKey: 'heart',
    skdi: ['Trombosis vena dalam', 'Tromboflebitis', 'Emboli vena'],
  },
  {
    id: 'varicose',
    label: 'Varicose veins and chronic venous insufficiency',
    kategori: 'venous',
    ringkas: 'Leaky valves in the surface veins let blood pool, and the ankle skin pays for it.',
    lesi: [
      { struktur: 'Left great saphenous vein', jenis: 'incompetence',
        catatan: 'Saphenofemoral junction reflux with dilated tributaries.' },
    ],
    hilir: ['Left femoral vein'],
    mekanisme:
      'Valve failure makes the standing column of blood continuous, so ambulatory venous pressure never falls ' +
      'during walking. Sustained capillary hypertension drives fibrin cuffing, leucocyte trapping and haemosiderin ' +
      'deposition — the sequence that ends in lipodermatosclerosis and ulceration at the gaiter area.',
    temuan: [
      'Visible tortuous veins, aching and heaviness worse at the end of the day',
      'Ankle oedema, haemosiderin staining, lipodermatosclerosis, venous ulcer at the medial malleolus',
    ],
    penunjang: ['Duplex ultrasound to map reflux and exclude deep vein obstruction before intervention'],
    tata: [
      'Graduated compression, leg elevation, exercise of the calf pump',
      'Endovenous ablation or surgery for symptomatic superficial reflux with a patent deep system',
    ],
    jalur: 'venous-return',
    organKey: 'heart',
    skdi: ['Varises (primer, sekunder)', 'Insufisiensi vena kronik'],
  },
  {
    id: 'pad',
    label: 'Peripheral arterial disease',
    kategori: 'aorta',
    ringkas: 'Narrowed leg arteries: the calf cramps after a predictable walking distance.',
    lesi: [
      { struktur: 'Left femoral artery', jenis: 'stenosis', derajat: 0.7,
        catatan: 'Superficial femoral disease at the adductor canal is the classic site.' },
      { struktur: 'Left popliteal artery', jenis: 'stenosis', derajat: 0.5, catatan: 'Tandem disease below the knee.' },
    ],
    hilir: [],
    mekanisme:
      'The same atherosclerosis as in the coronaries, and the same reserve arithmetic: resting flow is preserved ' +
      'until stenosis is severe, but exercise demand cannot be met, so pain appears at a reproducible distance and ' +
      'stops with rest. Rest pain and tissue loss mean perfusion has fallen below basal metabolic need.',
    temuan: [
      'Intermittent claudication with a reproducible claudication distance',
      'Absent pulses, hair loss, cool skin; rest pain relieved by hanging the leg out of bed',
      'Ankle-brachial index below 0.9; incompressible above 1.4 in diabetes or renal failure',
    ],
    penunjang: ['ABI first, then duplex, CT or MR angiography if revascularisation is being considered'],
    tata: [
      'Supervised exercise therapy — the intervention with the best evidence for claudication',
      'Antiplatelet and statin for cardiovascular risk, which is the real prognosis here',
      'Revascularisation for lifestyle-limiting symptoms or critical limb ischaemia',
    ],
    jalur: 'systemic',
    organKey: 'heart',
    skdi: ['Klaudikasio', 'Trombosis arteri'],
  },
  {
    id: 'renal-artery-stenosis',
    label: 'Renal artery stenosis',
    kategori: 'renal',
    ringkas: 'A narrowed kidney artery makes the kidney demand a higher blood pressure from the whole body.',
    lesi: [
      { struktur: 'Left renal artery', jenis: 'stenosis', derajat: 0.75,
        catatan: 'Ostial atherosclerotic plaque, or a mid-vessel string-of-beads in fibromuscular dysplasia.' },
    ],
    hilir: ['Left renal vein'],
    mekanisme:
      'Reduced perfusion pressure at the afferent arteriole triggers renin release; angiotensin II raises systemic ' +
      'pressure and constricts the efferent arteriole to defend filtration. That efferent tone is why an ACE ' +
      'inhibitor can precipitate a sharp creatinine rise or acute kidney injury in bilateral disease.',
    temuan: [
      'Resistant hypertension, or hypertension of abrupt onset before 30 or after 55',
      'Flash pulmonary oedema, abdominal bruit, small kidney on imaging',
      'Creatinine rising more than 30% after starting an ACE inhibitor or ARB',
    ],
    penunjang: ['Duplex ultrasound, CT or MR angiography; renal function and electrolytes with plasma renin if indicated'],
    tata: [
      'Medical therapy first in atherosclerotic disease — trials show no routine benefit from stenting',
      'Angioplasty for fibromuscular dysplasia, which often cures the hypertension',
    ],
    jalur: 'renal',
    organKey: 'kidneys',
    skdi: ['Hipertensi sekunder', 'Hipertensi esensial'],
  },
  {
    id: 'portal-hypertension',
    label: 'Portal hypertension',
    kategori: 'portal',
    ringkas: 'Scarring in the liver dams the gut\'s blood, which then forces open side channels that bleed.',
    lesi: [
      { struktur: 'Hepatic portal vein', jenis: 'stenosis', derajat: 0.5,
        catatan: 'Raised sinusoidal resistance from cirrhosis; the vein itself dilates.' },
    ],
    hilir: ['Right hepatic vein', 'Azygos vein'],
    mekanisme:
      'Cirrhosis raises intrahepatic resistance while splanchnic vasodilatation raises inflow, so the gradient is ' +
      'driven from both ends. Portosystemic collaterals open at sites of embryological anastomosis — the ' +
      'gastro-oesophageal junction being the one that kills, because those veins are thin-walled and superficial.',
    temuan: [
      'Splenomegaly, ascites, caput medusae, oesophageal varices',
      'Haematemesis from variceal rupture; encephalopathy from bypassed hepatic clearance',
    ],
    penunjang: [
      'Ultrasound with Doppler for portal flow direction; endoscopy to grade varices',
      'Hepatic venous pressure gradient where available — above 10 mmHg predicts varices, above 12 predicts bleeding',
    ],
    tata: [
      'Non-selective beta blocker or band ligation for primary prophylaxis',
      'Bleeding: resuscitation, vasoactive drugs, antibiotics, endoscopic banding; TIPS for failure',
    ],
    jalur: 'portal',
    organKey: 'liver',
    skdi: ['Varises esofagus', 'Hipertensi esensial'],
  },
  {
    id: 'mesenteric-ischaemia',
    label: 'Acute mesenteric ischaemia',
    kategori: 'portal',
    ringkas: 'The gut\'s artery blocks: pain far out of proportion to what the belly feels like.',
    lesi: [
      { struktur: 'Superior mesenteric artery', jenis: 'occlusion',
        catatan: 'Embolus, typically from atrial fibrillation, lodging just past the origin.' },
    ],
    hilir: ['Superior mesenteric vein', 'Hepatic portal vein'],
    mekanisme:
      'The SMA supplies from the duodenojejunal flexure to the mid-transverse colon with limited collateral in the ' +
      'watershed. Mucosa infarcts first, so early examination is unremarkable while pain is severe; peritonism and ' +
      'lactataemia are late signs marking transmural necrosis and a mortality that is already high.',
    temuan: [
      'Severe central abdominal pain out of proportion to a soft abdomen',
      'Atrial fibrillation or recent infarction; later peritonism, shock and metabolic acidosis',
    ],
    penunjang: ['CT angiography urgently; lactate rises late and normal lactate does not exclude it'],
    tata: [
      'Resuscitation, anticoagulation, urgent revascularisation and resection of non-viable bowel',
      'Anticoagulate the underlying atrial fibrillation to prevent the next embolus',
    ],
    jalur: 'portal',
    organKey: 'small-intestine',
    skdi: ['Emboli arteri'],
  },
  {
    id: 'pulmonary-hypertension',
    label: 'Pulmonary hypertension',
    kategori: 'pulmonary',
    ringkas: 'The lung arteries stiffen and narrow, and the right side of the heart wears out pushing against them.',
    lesi: [
      { struktur: 'Pulmonary trunk', jenis: 'dilatation', catatan: 'Proximal dilatation with distal vascular remodelling.' },
      { struktur: 'Wall of ventricle', jenis: 'hypertrophy', catatan: 'Right ventricular hypertrophy, then dilatation.' },
    ],
    hilir: ['Cavity of right ventricle', 'Cavity of right atrium'],
    mekanisme:
      'Remodelling of small pulmonary arteries raises resistance; the right ventricle hypertrophies, then dilates ' +
      'as coupling fails. Septal shift impairs left ventricular filling, so a disease of the lungs ends as ' +
      'biventricular failure with a small, underfilled left ventricle.',
    temuan: [
      'Exertional dyspnoea and syncope; loud pulmonary second sound, right ventricular heave',
      'Raised JVP, hepatomegaly, ascites and peripheral oedema when the right ventricle fails',
    ],
    penunjang: [
      'Echocardiography to estimate pressure and assess the right ventricle',
      'Right heart catheterisation for diagnosis — echocardiography alone cannot make it',
    ],
    tata: [
      'Treat the cause: left heart disease and lung disease are far commoner than pulmonary arterial hypertension',
      'Targeted vasodilator therapy only in confirmed group 1 disease, in expert centres',
    ],
    jalur: 'pulmonary',
    organKey: 'lungs',
    skdi: ['Hipertensi pulmoner', 'Gagal jantung kronik'],
  },
  {
    id: 'asd',
    label: 'Atrial septal defect',
    kategori: 'congenital',
    ringkas: 'A hole between the two upper chambers sends extra blood back through the lungs.',
    lesi: [
      { struktur: 'Wall of right atrium', jenis: 'shunt', catatan: 'Left-to-right interatrial shunt.' },
      { struktur: 'Wall of left atrium', jenis: 'shunt', catatan: 'The higher-pressure side of the shunt.' },
    ],
    hilir: ['Cavity of right ventricle', 'Pulmonary trunk', 'Right pulmonary artery'],
    mekanisme:
      'Shunting is driven by the relative compliance of the two ventricles rather than by the pressure difference ' +
      'across the atria, so the volume load falls on the right heart and the pulmonary circuit. Decades of ' +
      'over-circulation can produce pulmonary vascular disease and shunt reversal — Eisenmenger physiology, at ' +
      'which point closure is contraindicated.',
    temuan: [
      'Fixed splitting of the second heart sound; pulmonary flow murmur',
      'Often silent until adulthood, then arrhythmia, right heart failure or paradoxical embolism',
    ],
    penunjang: ['Echocardiography with bubble study; transoesophageal imaging to define the rim before device closure'],
    tata: [
      'Percutaneous device closure for a haemodynamically significant secundum defect',
      'Surgical closure for sinus venosus and primum defects; assess pulmonary vascular resistance first',
    ],
    jalur: 'pulmonary',
    organKey: 'heart',
    skdi: ['Kelainan jantung kongenital (Ventricular Septal Defect, Atrial Septal Defect, Patent Ductus Arteriosus, Tetralogy of Fallot)'],
  },
  {
    id: 'heart-failure',
    label: 'Chronic heart failure',
    kategori: 'coronary',
    ringkas: 'The pump cannot keep up, so fluid backs up into the lungs and legs.',
    lesi: [
      { struktur: 'Cavity of left ventricle', jenis: 'dilatation', catatan: 'Eccentric remodelling with a raised end-diastolic volume.' },
      { struktur: 'Wall of ventricle', jenis: 'hypertrophy', catatan: 'Remodelled, fibrotic myocardium.' },
    ],
    hilir: ['Cavity of left atrium', 'Left superior pulmonary vein', 'Right pulmonary artery'],
    mekanisme:
      'Falling output activates the sympathetic and renin–angiotensin–aldosterone systems, which defend perfusion ' +
      'in the short term and drive fibrosis, apoptosis and further dilatation in the long term. Modern therapy is ' +
      'aimed almost entirely at blocking that compensation, which is why drugs that merely raise contractility ' +
      'improve symptoms without improving survival.',
    temuan: [
      'Exertional dyspnoea, orthopnoea, paroxysmal nocturnal dyspnoea, fatigue',
      'Raised JVP, third heart sound, basal crackles, peripheral oedema, displaced apex',
    ],
    penunjang: [
      'Natriuretic peptides to rule out; echocardiography to establish ejection fraction and mechanism',
      'ECG, iron studies, renal function and rhythm assessment',
    ],
    tata: [
      'Four pillars in reduced ejection fraction: ARNI or ACE inhibitor, beta blocker, MRA, SGLT2 inhibitor',
      'Diuretics for congestion only; device therapy and transplantation assessment for refractory disease',
    ],
    jalur: 'systemic',
    organKey: 'heart',
    skdi: ['Gagal jantung kronik', 'Gagal jantung akut'],
  },
]

/** Semua struktur yang disebut satu keadaan, lesi maupun hilirnya. */
export function strukturKondisi(k: CardioCondition): string[] {
  return [...k.lesi.map((l) => l.struktur), ...k.hilir]
}

/** Keadaan mana saja yang menyentuh satu struktur — dipakai saat menyentuh
 *  pembuluh di figur 3D: dari struktur ke penyakit, bukan sebaliknya. */
export function kondisiUntukStruktur(nama: string): Array<{
  kondisi: CardioCondition
  peran: 'lesi' | 'hilir'
}> {
  const n = nama.toLowerCase()
  const out: Array<{ kondisi: CardioCondition; peran: 'lesi' | 'hilir' }> = []
  for (const k of CARDIO_CONDITIONS) {
    if (k.lesi.some((l) => l.struktur.toLowerCase() === n)) out.push({ kondisi: k, peran: 'lesi' })
    else if (k.hilir.some((h) => h.toLowerCase() === n)) out.push({ kondisi: k, peran: 'hilir' })
  }
  return out
}

/** Struktur yang dikenal atlas — dipakai uji untuk mencegah tautan mati. */
export function strukturTakDikenal(): string[] {
  const hilang = new Set<string>()
  for (const k of CARDIO_CONDITIONS)
    for (const s of strukturKondisi(k))
      if (!CARDIO_BY_NAME[s.toLowerCase()]) hilang.add(`${k.id}: ${s}`)
  return [...hilang]
}
