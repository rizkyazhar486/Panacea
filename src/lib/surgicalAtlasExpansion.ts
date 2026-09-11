import type {
  SurgicalApproach,
  SurgicalLayer,
  SurgicalPhase,
  SurgicalProcedure,
  SurgicalSpecialty,
} from './surgicalAtlas'

interface ExpansionSeed {
  id: string
  name: string
  specialty: SurgicalSpecialty
  region: string
  approach: SurgicalApproach
  summary: string
  keywords: string[]
  risks: string[]
  complications: string[]
  inputs: string[]
  layers?: SurgicalLayer[]
}

function phase(
  id: string,
  title: string,
  objective: string,
  narration: string,
  focusKeywords: string[],
  layers: SurgicalLayer[],
  dissect: number,
  unfold: number,
  structuresAtRisk: string[],
  checkpoint: string,
  instrumentFamilies: string[],
): SurgicalPhase {
  return { id, title, objective, narration, focusKeywords, layers, dissect, unfold, structuresAtRisk, checkpoint, instrumentFamilies }
}

function defaultLayers(specialty: SurgicalSpecialty): SurgicalLayer[] {
  if (specialty === 'orthopaedics') return ['surface', 'muscular', 'skeletal', 'nervous', 'cardiovascular']
  if (specialty === 'neurosurgery') return ['surface', 'skeletal', 'nervous', 'cardiovascular']
  if (specialty === 'cardiothoracic') return ['skeletal', 'cardiovascular', 'nervous', 'visceral']
  if (specialty === 'plastic') return ['surface', 'muscular', 'cardiovascular', 'nervous']
  return ['surface', 'muscular', 'cardiovascular', 'nervous', 'visceral']
}

function makeProcedure(seed: ExpansionSeed): SurgicalProcedure {
  const layers = seed.layers ?? defaultLayers(seed.specialty)
  const risks = seed.risks.length ? seed.risks : ['Adjacent neurovascular structures', 'Nearby organs/tissues']
  return {
    id: seed.id,
    name: seed.name,
    specialty: seed.specialty,
    region: seed.region,
    approach: seed.approach,
    summary: seed.summary,
    learningObjectives: [
      `Orient the ${seed.region.toLowerCase()} anatomy in 3D before following the procedure story`,
      `Recognize the relationship between the target and ${risks.slice(0, 2).join(' / ')}`,
      'Separate reference education from patient-specific operative planning',
    ],
    phases: [
      phase(
        'orientation',
        'Approach & orientation',
        'Build a spatial map before the operative target is emphasized.',
        'Outer layers fade while the target region and neighboring anatomy remain registered. This scene teaches orientation rather than an incision, port, trajectory, or device recipe.',
        seed.keywords,
        layers,
        3,
        .12,
        risks.slice(0, 3),
        'Target region and adjacent structures are clearly distinguished before the next conceptual phase.',
        ['visualization/camera family', 'exposure/retraction family'],
      ),
      phase(
        'target-map',
        'Target anatomy & risk constellation',
        'Understand the target in relation to structures that must remain protected.',
        'The atlas increases dissection depth and makes the risk constellation explicit. It intentionally omits operative dimensions, energy settings, implant choices, and patient-specific trajectories.',
        seed.keywords,
        layers,
        5,
        .24,
        risks,
        'The target and all listed structures at risk can be identified in the same spatial frame.',
        ['fine visualization family', 'dissection/handling family', 'hemostasis family'],
      ),
      phase(
        'treatment-concept',
        'Treatment / reconstruction concept',
        'Visualize how anatomy changes from pre-treatment to post-treatment reference state.',
        'A before-and-after reference transition demonstrates the intent of resection, repair, reconstruction, decompression, or restoration without providing an executable surgical technique.',
        seed.keywords,
        layers,
        5,
        .2,
        risks,
        'Post-treatment anatomy remains coherent and the risk structures remain visible for final review.',
        ['procedure-specific instrument family', 'reconstruction/fixation family', 'assessment family'],
      ),
      phase(
        'closure-review',
        'Closure & final anatomy review',
        'Return the region toward its final layered state and review preserved anatomy.',
        'The atlas summarizes final review and layer restoration. It does not teach a suture pattern, device setting, medication, or operative dosing decision.',
        seed.keywords,
        layers,
        2,
        .05,
        risks,
        'Reference anatomy, preserved structures, and the intended procedural endpoint are reviewed together.',
        ['closure family', 'hemostasis family'],
      ),
    ],
    complications: seed.complications,
    patientSpecificInputs: seed.inputs,
    evidenceLevel: 'reference-education',
  }
}

const SEEDS: ExpansionSeed[] = [
  // General surgery
  { id: 'colectomy', name: 'Segmental colectomy', specialty: 'general', region: 'Abdomen/colon', approach: 'laparoscopic', summary: 'Reference 4D map of colon, mesentery and adjacent organs for colorectal resection education.', keywords: ['colon', 'mesentery', 'ileocolic', 'middle colic', 'sigmoid'], risks: ['Small bowel', 'Ureter', 'Mesenteric vessels', 'Adjacent colon'], complications: ['Bleeding', 'Anastomotic complication', 'Infection', 'Bowel injury', 'Ileus'], inputs: ['CT abdomen/pelvis when clinically indicated', 'Endoscopic localization data', 'Surgeon-reviewed segment/vascular anatomy'] },
  { id: 'gastrectomy', name: 'Gastrectomy', specialty: 'general', region: 'Upper abdomen/stomach', approach: 'laparoscopic', summary: 'Stomach, omentum, vascular and nodal relationships shown as a staged reference anatomy story.', keywords: ['stomach', 'gastric', 'gastroepiploic', 'omentum'], risks: ['Pancreas', 'Spleen', 'Major gastric vessels', 'Esophagus/duodenum'], complications: ['Bleeding', 'Leak', 'Infection', 'Delayed gastric emptying', 'Nutritional complications'], inputs: ['CT upper abdomen', 'Endoscopy findings', 'Tumor/lesion annotation when relevant'] },
  { id: 'hepatectomy', name: 'Liver resection', specialty: 'general', region: 'Right upper abdomen/liver', approach: 'open', summary: 'Segmental liver orientation with hepatic inflow, outflow and biliary relationships.', keywords: ['liver', 'hepatic', 'portal vein', 'hepatic vein', 'bile duct'], risks: ['Portal structures', 'Hepatic veins', 'Biliary tree', 'Inferior vena cava'], complications: ['Bleeding', 'Bile leak', 'Liver dysfunction', 'Infection'], inputs: ['Multiphasic CT or MRI liver', 'Vascular/biliary segmentation', 'Surgeon-reviewed resection plan'] },
  { id: 'whipple', name: 'Pancreaticoduodenectomy', specialty: 'general', region: 'Upper abdomen/pancreas', approach: 'open', summary: 'High-level pancreatic head, duodenum, biliary and mesenteric vascular anatomy map.', keywords: ['pancreas', 'duodenum', 'portal vein', 'superior mesenteric', 'bile duct'], risks: ['Portal vein', 'Superior mesenteric vessels', 'Bile duct', 'Stomach/small bowel'], complications: ['Bleeding', 'Pancreatic fistula', 'Delayed gastric emptying', 'Infection', 'Biliary complication'], inputs: ['Pancreas-protocol CT/MRI', 'Vascular anatomy segmentation', 'Biliary imaging when relevant'] },
  { id: 'splenectomy', name: 'Splenectomy', specialty: 'general', region: 'Left upper abdomen/spleen', approach: 'laparoscopic', summary: 'Spleen, hilum, stomach, pancreas and diaphragmatic relationships in one reference scene.', keywords: ['spleen', 'splenic', 'pancreas', 'stomach'], risks: ['Pancreatic tail', 'Stomach', 'Splenic vessels', 'Diaphragm'], complications: ['Bleeding', 'Pancreatic injury', 'Infection', 'Thrombotic complications'], inputs: ['CT/MRI upper abdomen when relevant', 'Splenic vascular anatomy', 'Clinical indication context'] },
  { id: 'mastectomy', name: 'Mastectomy', specialty: 'general', region: 'Breast/chest wall', approach: 'open', summary: 'Breast envelope, pectoral fascia and regional neurovascular/lymphatic relationships.', keywords: ['breast', 'pectoralis', 'axillary', 'thoracic'], risks: ['Pectoral fascia', 'Axillary neurovascular structures', 'Long thoracic nerve region', 'Thoracodorsal region'], complications: ['Bleeding', 'Seroma', 'Infection', 'Nerve injury', 'Wound complication'], inputs: ['Breast imaging', 'Lesion/extent annotation', 'Reconstruction plan when relevant'] },

  // Orthopaedics
  { id: 'total-hip', name: 'Total hip arthroplasty', specialty: 'orthopaedics', region: 'Hip/pelvis', approach: 'open', summary: 'Pelvis-femur, implant envelope and major neurovascular relationships for arthroplasty education.', keywords: ['pelvis', 'acetabulum', 'femur', 'hip', 'sciatic'], risks: ['Sciatic nerve', 'Femoral neurovascular bundle', 'Abductor mechanism', 'Pelvic structures'], complications: ['Infection', 'Dislocation', 'Fracture', 'Neurovascular injury', 'Thromboembolic complication'], inputs: ['Pelvic/hip radiographs', 'CT if used for planning', 'Implant system data', 'Surgeon-approved reconstruction plan'] },
  { id: 'rotator-cuff', name: 'Rotator cuff repair', specialty: 'orthopaedics', region: 'Shoulder', approach: 'arthroscopic', summary: 'Arthroscopic shoulder anatomy connecting tendon footprint, humeral head and nearby neurovascular structures.', keywords: ['supraspinatus', 'infraspinatus', 'subscapularis', 'humerus', 'scapula'], risks: ['Axillary nerve region', 'Articular cartilage', 'Biceps tendon', 'Deltoid/rotator cuff tissue'], complications: ['Stiffness', 'Re-tear', 'Infection', 'Nerve injury'], inputs: ['MRI shoulder', 'Radiographs', 'Tear pattern annotation'] },
  { id: 'shoulder-arthroplasty', name: 'Shoulder arthroplasty', specialty: 'orthopaedics', region: 'Shoulder girdle', approach: 'open', summary: 'Glenohumeral reconstruction concept with cuff, deltoid and neurovascular relationships preserved.', keywords: ['humerus', 'glenoid', 'scapula', 'deltoid', 'axillary nerve'], risks: ['Axillary nerve', 'Rotator cuff', 'Glenoid bone stock', 'Brachial plexus region'], complications: ['Infection', 'Instability', 'Fracture', 'Nerve injury', 'Implant complication'], inputs: ['Shoulder radiographs', 'CT for glenoid planning when relevant', 'Implant system data'] },
  { id: 'lumbar-fusion', name: 'Lumbar fusion', specialty: 'orthopaedics', region: 'Lumbar spine', approach: 'open', summary: 'Reference lumbar vertebrae, neural elements and major vascular relationships for fusion education.', keywords: ['lumbar', 'vertebra', 'spinal canal', 'nerve root'], risks: ['Nerve roots', 'Dural sac', 'Major vessels depending on approach', 'Adjacent segment structures'], complications: ['Neurologic injury', 'Dural complication', 'Infection', 'Nonunion', 'Implant complication'], inputs: ['CT/MRI lumbar spine', 'Standing radiographs', 'Surgeon-approved levels/alignment plan'] },
  { id: 'hip-fracture-fixation', name: 'Hip fracture fixation', specialty: 'orthopaedics', region: 'Proximal femur/hip', approach: 'open', summary: 'Fracture geometry, proximal femoral blood supply and fixation envelope shown without implant dimensions.', keywords: ['femur', 'femoral neck', 'trochanter', 'hip'], risks: ['Femoral neurovascular structures', 'Femoral head blood supply', 'Soft-tissue envelope'], complications: ['Bleeding', 'Infection', 'Nonunion/malunion', 'Avascular necrosis depending on fracture', 'Implant failure'], inputs: ['Hip/pelvis radiographs', 'CT for complex patterns', 'Fracture segmentation', 'Chosen implant family'] },
  { id: 'meniscus-repair', name: 'Meniscus repair', specialty: 'orthopaedics', region: 'Knee', approach: 'arthroscopic', summary: 'Meniscal zones, cartilage, cruciate ligaments and peripheral neurovascular context.', keywords: ['meniscus', 'femur', 'tibia', 'anterior cruciate', 'posterior cruciate'], risks: ['Articular cartilage', 'Popliteal neurovascular region', 'Collateral structures', 'Cruciate ligaments'], complications: ['Stiffness', 'Re-tear', 'Infection', 'Neurovascular injury'], inputs: ['MRI knee', 'Arthroscopic findings when available', 'Tear pattern annotation'] },

  // Cardiothoracic
  { id: 'aortic-valve', name: 'Aortic valve replacement', specialty: 'cardiothoracic', region: 'Heart/aortic root', approach: 'open', summary: 'Aortic root, valve, coronary ostia and conduction-neighbor relationships in reference 4D.', keywords: ['aortic valve', 'aorta', 'coronary', 'left ventricle'], risks: ['Coronary ostia', 'Conduction system region', 'Aortic root', 'Adjacent valves'], complications: ['Bleeding', 'Stroke', 'Conduction abnormality', 'Valve-related complication', 'Infection'], inputs: ['Echocardiography', 'CT when used for anatomy/planning', 'Valve morphology and annular measurements'] },
  { id: 'mitral-repair', name: 'Mitral valve repair', specialty: 'cardiothoracic', region: 'Heart/mitral valve', approach: 'open', summary: 'Mitral leaflets, subvalvular apparatus, circumflex region and left-heart geometry.', keywords: ['mitral', 'left atrium', 'left ventricle', 'papillary', 'circumflex'], risks: ['Circumflex coronary region', 'Aortic valve region', 'Conduction system region', 'Subvalvular apparatus'], complications: ['Bleeding', 'Residual valve dysfunction', 'Arrhythmia', 'Stroke', 'Infection'], inputs: ['Echocardiography', 'CT/MRI when clinically relevant', 'Surgeon-reviewed valve morphology'] },
  { id: 'lobectomy', name: 'Pulmonary lobectomy', specialty: 'cardiothoracic', region: 'Chest/lung', approach: 'open', summary: 'Lobar bronchovascular anatomy, pulmonary hilum and mediastinal relationships.', keywords: ['lung', 'pulmonary artery', 'pulmonary vein', 'bronchus', 'hilum'], risks: ['Pulmonary artery branches', 'Pulmonary veins', 'Bronchus', 'Phrenic/recurrent laryngeal nerve regions'], complications: ['Bleeding', 'Air leak', 'Pneumonia', 'Arrhythmia', 'Respiratory complication'], inputs: ['Chest CT', 'Bronchovascular segmentation', 'Lesion/lobe annotation'] },
  { id: 'vsd-closure', name: 'Ventricular septal defect closure', specialty: 'cardiothoracic', region: 'Heart/septum', approach: 'open', summary: 'Congenital septal anatomy, valves and conduction-neighbor relationships for educational rehearsal.', keywords: ['ventricular septum', 'right ventricle', 'left ventricle', 'tricuspid', 'aortic valve'], risks: ['Conduction system region', 'Aortic valve', 'Tricuspid valve', 'Coronary anatomy'], complications: ['Residual shunt', 'Conduction abnormality', 'Valve injury', 'Bleeding', 'Infection'], inputs: ['Echocardiography', 'Cardiac CT/MRI when relevant', 'Congenital anatomy annotation'] },
  { id: 'arterial-switch', name: 'Arterial switch operation', specialty: 'cardiothoracic', region: 'Neonatal heart/great arteries', approach: 'open', summary: 'Reference TGA anatomy and great-artery/coronary relationships for congenital cardiac education.', keywords: ['aorta', 'pulmonary artery', 'coronary', 'right ventricle', 'left ventricle'], risks: ['Coronary arteries', 'Great arteries', 'Branch pulmonary arteries', 'Cardiac conduction region'], complications: ['Coronary complication', 'Great-artery obstruction', 'Bleeding', 'Arrhythmia'], inputs: ['Echocardiography', 'Cardiac CT/MRI when indicated', 'Coronary origin annotation', 'Congenital surgeon-reviewed anatomy'] },

  // Neurosurgery
  { id: 'glioma-craniotomy', name: 'Craniotomy for brain tumor', specialty: 'neurosurgery', region: 'Brain/skull', approach: 'open', summary: 'Patient-imaging-ready framework for cortical, vascular and lesion relationships; reference mode remains generic.', keywords: ['brain', 'cerebral', 'cortex', 'skull', 'middle cerebral'], risks: ['Eloquent cortex', 'Cortical vessels', 'Deep white-matter pathways', 'Venous structures'], complications: ['Neurologic deficit', 'Bleeding', 'Seizure', 'Edema', 'Infection'], inputs: ['DICOM MRI/CT', 'Tumor/eloquent-cortex segmentation', 'Functional imaging/tractography when used clinically', 'Neurosurgeon-reviewed corridor'] },
  { id: 'aneurysm-clipping', name: 'Intracranial aneurysm clipping', specialty: 'neurosurgery', region: 'Cerebrovascular/skull base', approach: 'microsurgical', summary: 'Cerebral arterial tree, aneurysm reference target and nearby neural structures.', keywords: ['cerebral artery', 'circle of willis', 'aneurysm', 'optic', 'brain'], risks: ['Parent artery', 'Perforating arteries', 'Cranial nerves', 'Brain tissue'], complications: ['Ischemic injury', 'Bleeding', 'Neurologic deficit', 'Vasospasm-related complication'], inputs: ['CTA/MRA/angiography', 'Aneurysm/branch segmentation', 'Neurosurgeon-reviewed vascular anatomy'] },
  { id: 'vp-shunt', name: 'Ventriculoperitoneal shunt placement', specialty: 'neurosurgery', region: 'Brain to abdomen', approach: 'open', summary: 'Cross-body educational map connecting ventricular anatomy, subcutaneous route concept and peritoneal endpoint.', keywords: ['ventricle', 'brain', 'skull', 'abdomen', 'peritoneum'], risks: ['Cortical vessels', 'Brain tissue', 'Abdominal organs', 'Shunt pathway tissues'], complications: ['Infection', 'Obstruction', 'Hemorrhage', 'Over/under-drainage complication', 'Abdominal complication'], inputs: ['Brain imaging', 'Ventricular anatomy', 'Prior shunt history', 'Neurosurgeon-reviewed target/path context'] },
  { id: 'lumbar-discectomy', name: 'Lumbar discectomy', specialty: 'neurosurgery', region: 'Lumbar spine', approach: 'microsurgical', summary: 'Disc, nerve root, canal and bony landmarks in a focused microsurgical reference scene.', keywords: ['lumbar', 'disc', 'nerve root', 'spinal canal'], risks: ['Nerve root', 'Dural sac', 'Epidural vessels', 'Facet/adjacent bone'], complications: ['Dural complication', 'Nerve injury', 'Recurrent disc herniation', 'Infection'], inputs: ['MRI lumbar spine', 'Level/side confirmation', 'Surgeon-reviewed imaging'] },

  // OB/GYN
  { id: 'hysterectomy', name: 'Hysterectomy', specialty: 'obgyn', region: 'Pelvis/uterus', approach: 'laparoscopic', summary: 'Uterus, bladder, ureter, pelvic vessels and supporting structures mapped in 4D reference anatomy.', keywords: ['uterus', 'bladder', 'ureter', 'uterine artery', 'pelvis'], risks: ['Ureter', 'Bladder', 'Bowel', 'Pelvic vessels'], complications: ['Bleeding', 'Urinary tract injury', 'Bowel injury', 'Infection', 'Thromboembolic complication'], inputs: ['Pelvic ultrasound/MRI when relevant', 'Uterine/adnexal anatomy', 'Prior operative history'] },
  { id: 'myomectomy', name: 'Myomectomy', specialty: 'obgyn', region: 'Uterus/pelvis', approach: 'laparoscopic', summary: 'Fibroid-location reference overlay with myometrium, cavity and pelvic vascular context.', keywords: ['uterus', 'myometrium', 'fibroid', 'uterine artery'], risks: ['Endometrial cavity', 'Uterine vessels', 'Ureter', 'Adjacent bowel/bladder'], complications: ['Bleeding', 'Adhesion', 'Infection', 'Uterine scar-related complication'], inputs: ['Pelvic ultrasound/MRI', 'Fibroid mapping', 'Fertility/uterine context reviewed by clinician'] },
  { id: 'ovarian-cystectomy', name: 'Ovarian cystectomy', specialty: 'obgyn', region: 'Adnexa/pelvis', approach: 'laparoscopic', summary: 'Ovary, tube, ureter and pelvic vessel relationships with cyst reference overlay.', keywords: ['ovary', 'fallopian', 'ureter', 'pelvic'], risks: ['Ovarian tissue', 'Ureter', 'Pelvic vessels', 'Bowel'], complications: ['Bleeding', 'Infection', 'Ovarian reserve impact', 'Adjacent-organ injury'], inputs: ['Pelvic ultrasound/MRI when indicated', 'Cyst/ovary annotation', 'Clinician-reviewed malignancy risk context'] },
  { id: 'ectopic-surgery', name: 'Surgery for ectopic pregnancy', specialty: 'obgyn', region: 'Fallopian tube/pelvis', approach: 'laparoscopic', summary: 'Tubal, ovarian, uterine and pelvic vascular relationships shown for emergency anatomy education.', keywords: ['fallopian', 'uterus', 'ovary', 'pelvic artery'], risks: ['Pelvic vessels', 'Ovary', 'Ureter', 'Bowel'], complications: ['Hemorrhage', 'Infection', 'Adjacent-organ injury', 'Fertility-related consequence'], inputs: ['Ultrasound', 'Hemodynamic/clinical context', 'Clinician-confirmed side/location'] },

  // Urology
  { id: 'radical-prostatectomy', name: 'Radical prostatectomy', specialty: 'urology', region: 'Male pelvis/prostate', approach: 'robotic', summary: 'Prostate, bladder, urethra, neurovascular and pelvic vascular relationships in a reusable robotic reference scene.', keywords: ['prostate', 'bladder', 'urethra', 'neurovascular', 'pelvis'], risks: ['Neurovascular bundles', 'Rectum', 'Ureteric orifices/bladder', 'Pelvic vessels'], complications: ['Bleeding', 'Urinary complication', 'Sexual-function impact', 'Rectal injury', 'Infection'], inputs: ['Prostate MRI', 'Biopsy/lesion localization context', 'Surgeon-reviewed pelvic anatomy'] },
  { id: 'partial-nephrectomy', name: 'Partial nephrectomy', specialty: 'urology', region: 'Kidney/retroperitoneum', approach: 'robotic', summary: 'Renal mass reference overlay with artery, vein, collecting system and surrounding organs.', keywords: ['kidney', 'renal artery', 'renal vein', 'ureter', 'collecting'], risks: ['Renal vessels', 'Collecting system', 'Adjacent bowel', 'Adrenal/splenic/hepatic structures by side'], complications: ['Bleeding', 'Urine leak', 'Renal-function impact', 'Adjacent-organ injury'], inputs: ['Contrast CT/MRI kidney', 'Tumor/vascular/collecting-system segmentation', 'Urologist-reviewed anatomy'] },
  { id: 'radical-nephrectomy', name: 'Radical nephrectomy', specialty: 'urology', region: 'Kidney/retroperitoneum', approach: 'laparoscopic', summary: 'Kidney, hilum, adrenal and adjacent-organ relationships for nephrectomy education.', keywords: ['kidney', 'renal artery', 'renal vein', 'ureter', 'adrenal'], risks: ['Renal hilum', 'Inferior vena cava/aorta depending on side', 'Bowel', 'Pancreas/spleen/liver depending on side'], complications: ['Bleeding', 'Adjacent-organ injury', 'Renal-function consequence', 'Infection'], inputs: ['CT/MRI kidney', 'Renal vascular anatomy', 'Mass extent annotation'] },
  { id: 'turp', name: 'Transurethral prostate surgery', specialty: 'urology', region: 'Prostate/urethra/bladder', approach: 'endoscopic', summary: 'Endoscopic lower urinary tract orientation without energy, fluid or resection-setting instructions.', keywords: ['prostate', 'urethra', 'bladder', 'ureteric orifice'], risks: ['Urethral sphincter region', 'Bladder neck', 'Ureteric orifices', 'Prostatic capsule'], complications: ['Bleeding', 'Urinary retention/irritative symptoms', 'Infection', 'Urethral complication'], inputs: ['Ultrasound/clinical prostate assessment', 'Cystoscopic findings when available', 'Urologist-reviewed anatomy'] },
  { id: 'pyeloplasty', name: 'Pyeloplasty', specialty: 'urology', region: 'Kidney/ureteropelvic junction', approach: 'robotic', summary: 'UPJ, renal pelvis, ureter and crossing-vessel relationships for reconstructive urology education.', keywords: ['kidney', 'renal pelvis', 'ureter', 'crossing vessel'], risks: ['Renal vessels', 'Crossing vessels', 'Kidney parenchyma', 'Adjacent bowel'], complications: ['Urine leak', 'Recurrent obstruction', 'Bleeding', 'Infection'], inputs: ['Ultrasound/CT/MR urography when indicated', 'Crossing-vessel anatomy', 'Functional drainage study context'] },

  // Plastic/reconstructive
  { id: 'free-flap', name: 'Free flap reconstruction', specialty: 'plastic', region: 'Donor and recipient soft tissue', approach: 'microsurgical', summary: 'Donor tissue, pedicle, recipient vessel and defect relationships as a cross-body reconstructive story.', keywords: ['artery', 'vein', 'skin', 'muscle', 'nerve'], risks: ['Flap pedicle', 'Recipient vessels', 'Donor-site nerves/vessels', 'Defect-adjacent structures'], complications: ['Flap compromise', 'Bleeding', 'Infection', 'Donor-site morbidity', 'Wound complication'], inputs: ['Defect imaging/3D surface data when available', 'Vascular imaging when clinically used', 'Reconstructive surgeon annotations'] },
  { id: 'cleft-lip', name: 'Cleft lip repair', specialty: 'plastic', region: 'Face/upper lip', approach: 'open', summary: 'Facial soft-tissue, orbicularis and nasal-base relationships shown as a developmental/reconstructive reference model.', keywords: ['lip', 'orbicularis', 'nose', 'maxilla'], risks: ['Lip muscle continuity', 'Nasal base structures', 'Facial vessels', 'Oral mucosa'], complications: ['Wound complication', 'Scar/asymmetry', 'Nasal/lip functional issue'], inputs: ['Clinical photography with consent', '3D facial scan when available', 'Craniofacial surgeon annotation'] },
  { id: 'breast-reconstruction', name: 'Breast reconstruction', specialty: 'plastic', region: 'Breast/chest wall', approach: 'open', summary: 'Chest-wall, skin envelope, muscle and vascular options visualized without prescribing a reconstructive technique.', keywords: ['breast', 'pectoralis', 'thoracic', 'skin'], risks: ['Chest wall', 'Pectoral structures', 'Regional vessels', 'Skin envelope'], complications: ['Infection', 'Wound complication', 'Reconstruction failure', 'Seroma/hematoma'], inputs: ['Clinical/oncologic anatomy', 'Chest imaging when relevant', '3D surface scan with consent', 'Reconstructive plan'] },
  { id: 'tendon-repair-hand', name: 'Hand tendon repair', specialty: 'plastic', region: 'Hand/fingers', approach: 'microsurgical', summary: 'Tendon, pulley, digital nerve and vessel relationships in a high-resolution hand reference scene.', keywords: ['finger', 'tendon', 'digital nerve', 'digital artery', 'hand'], risks: ['Digital nerves', 'Digital arteries', 'Tendon sheath/pulley system', 'Joint structures'], complications: ['Adhesion/stiffness', 'Re-rupture', 'Nerve/vessel injury', 'Infection'], inputs: ['Clinical examination', 'Ultrasound/MRI when used', 'Injury-level annotation'] },

  // ENT
  { id: 'tonsillectomy', name: 'Tonsillectomy', specialty: 'ent', region: 'Oropharynx', approach: 'open', summary: 'Tonsillar fossa, pharyngeal musculature and nearby vascular/nerve relationships.', keywords: ['tonsil', 'pharynx', 'carotid', 'glossopharyngeal'], risks: ['Tonsillar vessels', 'Pharyngeal muscle', 'Glossopharyngeal nerve region', 'Carotid space'], complications: ['Bleeding', 'Pain/dehydration', 'Infection', 'Airway complication'], inputs: ['Clinical ENT examination', 'Imaging only when clinically indicated', 'Surgeon-reviewed anatomy'] },
  { id: 'fess', name: 'Functional endoscopic sinus surgery', specialty: 'ent', region: 'Paranasal sinuses/skull base', approach: 'endoscopic', summary: 'Endoscopic sinus, orbit and skull-base relationships with high-visibility risk structures.', keywords: ['sinus', 'ethmoid', 'maxillary', 'orbit', 'skull base'], risks: ['Orbit', 'Skull base', 'Optic nerve region', 'Carotid artery region'], complications: ['Bleeding', 'Orbital injury', 'CSF leak', 'Infection', 'Visual complication'], inputs: ['CT paranasal sinuses', 'Navigation dataset when used clinically', 'ENT surgeon-reviewed variant anatomy'] },
  { id: 'tympanoplasty', name: 'Tympanoplasty', specialty: 'ent', region: 'Middle ear', approach: 'microsurgical', summary: 'Tympanic membrane, ossicles, facial nerve region and middle-ear spatial anatomy.', keywords: ['tympanic', 'malleus', 'incus', 'stapes', 'facial nerve'], risks: ['Ossicular chain', 'Facial nerve region', 'Chorda tympani region', 'Inner-ear structures'], complications: ['Hearing change', 'Dizziness', 'Facial nerve injury', 'Graft failure', 'Infection'], inputs: ['Otoscopy/endoscopy', 'Audiometry', 'Temporal-bone CT when clinically relevant'] },
  { id: 'mastoidectomy', name: 'Mastoidectomy', specialty: 'ent', region: 'Temporal bone/mastoid', approach: 'microsurgical', summary: 'Temporal-bone air cells, facial nerve, sigmoid sinus and labyrinth relationships in a reference microanatomy scene.', keywords: ['mastoid', 'temporal bone', 'facial nerve', 'sigmoid sinus', 'labyrinth'], risks: ['Facial nerve', 'Sigmoid sinus', 'Labyrinth', 'Middle/posterior cranial fossa boundaries'], complications: ['Facial nerve injury', 'Hearing/vestibular complication', 'Bleeding', 'CSF leak', 'Infection'], inputs: ['Temporal-bone CT', 'Audiometry', 'ENT surgeon-reviewed disease extent'] },
  { id: 'septoplasty', name: 'Septoplasty', specialty: 'ent', region: 'Nasal septum', approach: 'endoscopic', summary: 'Septal cartilage/bone, mucosa and adjacent nasal structures in a layered endoscopic reference view.', keywords: ['nasal septum', 'cartilage', 'vomer', 'turbinate'], risks: ['Septal mucosa', 'Dorsal/caudal support structures', 'Turbinates', 'Adjacent nasal vessels'], complications: ['Bleeding', 'Septal perforation', 'Persistent obstruction', 'Cosmetic/support change', 'Infection'], inputs: ['Nasal examination/endoscopy', 'CT when indicated', 'ENT surgeon-reviewed deviation anatomy'] },
]

export const SURGICAL_EXPANSION: SurgicalProcedure[] = SEEDS.map(makeProcedure)
