import { LAP_APPENDIX_SCENARIO } from './surgerySimulatorAppendectomy'

export type SurgeryAtlasId = 'obgin' | 'cardio' | 'gastro'
export type SurgeryStepMode = 'surface' | 'deep-anatomy' | 'imaging' | 'verification'

export interface SurgeryImagingCue {
  modality: 'ICE' | '3D atlas'
  view: string
  expected: string[]
  limitation: string
}

export interface SurgerySimulationStep {
  id: string
  label: string
  mode: SurgeryStepMode
  objective: string
  anatomy: string
  atlasKeywords: string[]
  sharedBodyKeywords: string[]
  atRiskKeywords: string[]
  atRiskText: string[]
  bodyDepth: number
  imaging?: SurgeryImagingCue
  selfCheck: {
    prompt: string
    answer: string
  }
  boundary?: string
}

export interface SurgerySimulationScenario {
  id: string
  label: string
  shortLabel: string
  atlas: SurgeryAtlasId
  atlasFile: string
  atlasLabel: string
  atlasSource: string
  purpose: string
  referenceContext: string
  instrumentFamilies: string[]
  steps: SurgerySimulationStep[]
  geometryBoundary: string
  evidenceBoundary: string
  sources: string[]
}

/**
 * Educational anatomy simulators.
 *
 * They intentionally do NOT encode patient-specific target coordinates,
 * incision dimensions, device force, procedural success thresholds, drug
 * dosing, anaesthesia management, or autonomous operative decisions. Every
 * step must remain useful even when a fine structure is absent from the atlas:
 * the UI reports that gap rather than fabricating geometry.
 */
export const SURGERY_SIMULATION_SCENARIOS: SurgerySimulationScenario[] = [
  LAP_APPENDIX_SCENARIO,
  {
    id: 'caesarean-anatomy',
    label: 'Caesarean section — layered pelvic anatomy',
    shortLabel: 'Caesarean',
    atlas: 'obgin',
    atlasFile: 'atlas/obgin.glb',
    atlasLabel: 'Female pelvis reference atlas',
    atlasSource: 'HuBMAP Human Reference Atlas, female reference body (CC BY 4.0)',
    purpose:
      'Learn the sequence and spatial relationships of a low transverse caesarean exposure without pretending a non-pregnant reference pelvis is a gravid patient.',
    referenceContext:
      'The dedicated pelvic atlas contains uterus, ovaries, uterine tubes, vagina, supporting ligaments, bladder and female bony pelvis. Superficial abdominal-wall layers are taught against the shared whole-body model.',
    instrumentFamilies: [
      'Incision and tissue-handling instruments',
      'Abdominal-wall and bladder retractors',
      'Suction / irrigation equipment',
      'Needle holders and closure instruments',
    ],
    steps: [
      {
        id: 'cs-surface',
        label: 'Surface & abdominal wall',
        mode: 'surface',
        objective: 'Orient the low transverse exposure to the anterior abdominal wall before entering the pelvis.',
        anatomy:
          'Skin and subcutaneous tissue overlie the anterior rectus sheath. The rectus muscles and their fascial envelope are distinct from the deeper parietal peritoneum.',
        atlasKeywords: [],
        sharedBodyKeywords: ['skin', 'rectus abdominis', 'abdominal wall'],
        atRiskKeywords: [],
        atRiskText: ['Inferior epigastric vessels are lateral/deep to the rectus region rather than in the midline.'],
        bodyDepth: 1,
        selfCheck: {
          prompt: 'Which structures belong to the abdominal wall rather than the pelvic organ atlas?',
          answer: 'Skin, subcutaneous tissue, rectus sheath and rectus muscles are wall structures; uterus and bladder are pelvic viscera.',
        },
      },
      {
        id: 'cs-peritoneal-entry',
        label: 'Peritoneal entry & pelvic orientation',
        mode: 'deep-anatomy',
        objective: 'Separate the concept of abdominal-wall entry from the relationships of pelvic viscera underneath.',
        anatomy:
          'After the abdominal wall, parietal peritoneum opens into the peritoneal cavity. The urinary bladder lies anterior to the uterus and must remain conceptually distinct from the uterine wall.',
        atlasKeywords: ['uterus', 'urinary bladder', 'bladder'],
        sharedBodyKeywords: ['peritoneum', 'urinary bladder', 'uterus'],
        atRiskKeywords: ['urinary bladder', 'bladder'],
        atRiskText: ['Urinary bladder', 'Bowel may occupy the peritoneal cavity but is not represented in this dedicated pelvic cut.'],
        bodyDepth: 5,
        selfCheck: {
          prompt: 'What is the key anterior visceral relationship in this view?',
          answer: 'The urinary bladder is anterior to the uterus.',
        },
      },
      {
        id: 'cs-vesicouterine',
        label: 'Bladder–uterus relationship',
        mode: 'deep-anatomy',
        objective: 'Recognise the anterior lower uterine region in relation to bladder, cervix and supporting ligaments.',
        anatomy:
          'The bladder occupies the anterior pelvic compartment. The uterus is posterior/superior to it, with the cervix inferior to the uterine body and the broad/supporting ligaments extending laterally.',
        atlasKeywords: ['uterus', 'cervix', 'urinary bladder', 'bladder', 'ligament'],
        sharedBodyKeywords: ['uterus', 'urinary bladder'],
        atRiskKeywords: ['urinary bladder', 'bladder', 'ureter'],
        atRiskText: ['Urinary bladder', 'Ureters and uterine vessels are lateral relationships that require patient-specific awareness in real surgery.'],
        bodyDepth: 5,
        imaging: {
          modality: '3D atlas',
          view: 'Anterior female pelvis',
          expected: ['Bladder anterior to uterus', 'Cervix inferior to uterine body', 'Bony pelvis surrounding the visceral compartment'],
          limitation: 'The HRA reference object is not a pregnant uterus and does not encode bladder-flap dissection planes.',
        },
        selfCheck: {
          prompt: 'Why must the bladder and uterus be visualised together?',
          answer: 'Because their anterior-posterior relationship is central to understanding the lower uterine exposure and bladder injury risk.',
        },
      },
      {
        id: 'cs-uterine-wall',
        label: 'Uterine wall & cavity concept',
        mode: 'verification',
        objective: 'Distinguish verified uterine surface geometry from tissue layers the current atlas cannot separately resolve.',
        anatomy:
          'The reference mesh verifies the uterus as an organ and its relationships, but it does not provide a validated gravid lower-segment wall, placenta, amniotic cavity or fetal presentation as separate geometry.',
        atlasKeywords: ['uterus', 'cervix'],
        sharedBodyKeywords: ['uterus'],
        atRiskKeywords: [],
        atRiskText: ['Uterine vessels laterally', 'Broad ligament', 'Bladder anteriorly'],
        bodyDepth: 5,
        selfCheck: {
          prompt: 'Does this atlas show a patient-specific gravid uterus or fetus?',
          answer: 'No. It is a female reference pelvis used for spatial anatomy; gravid deformation, placenta and fetus are explicitly not inferred.',
        },
        boundary:
          'No fetal extraction, placental location, uterine-incision dimensions, haemorrhage prediction or closure technique is simulated from this geometry.',
      },
      {
        id: 'cs-review',
        label: 'Relationship review',
        mode: 'verification',
        objective: 'Reconstruct the anatomy from abdominal wall to pelvic viscera and identify what the model can and cannot prove.',
        anatomy:
          'A useful mental model is wall → peritoneal cavity → bladder/uterus relationship → uterine organ. Fine operative planes remain text-only when source geometry is absent.',
        atlasKeywords: ['uterus', 'cervix', 'urinary bladder', 'bladder', 'pelvis', 'ligament'],
        sharedBodyKeywords: ['rectus abdominis', 'peritoneum', 'uterus', 'urinary bladder'],
        atRiskKeywords: ['urinary bladder', 'bladder'],
        atRiskText: ['Bladder', 'Ureters', 'Uterine vessels', 'Bowel'],
        bodyDepth: 5,
        selfCheck: {
          prompt: 'What makes this simulator anatomically honest?',
          answer: 'Verified source geometry is highlighted where present, and absent pregnancy-specific anatomy stays explicitly unavailable instead of being fabricated.',
        },
      },
    ],
    geometryBoundary:
      'HuBMAP HRA is a reference body, not a gravid patient. The simulator preserves real pelvic relationships but does not morph the uterus into pregnancy, invent placenta/fetus geometry, or estimate a safe incision path.',
    evidenceBoundary:
      'Educational anatomy only. It is not an operative manual, patient-specific planning system, credentialing tool or substitute for supervised surgical training.',
    sources: [
      'HuBMAP Human Reference Atlas 3D reference organ set (CC BY 4.0)',
      'Gray’s Anatomy, 42nd ed. — abdominal wall and female pelvic relationships',
      'Cunningham et al., Williams Obstetrics — caesarean delivery anatomy and operative context',
    ],
  },
  {
    id: 'transseptal-ice',
    label: 'Transseptal puncture — 3D anatomy + ICE orientation',
    shortLabel: 'Transseptal + ICE',
    atlas: 'cardio',
    atlasFile: 'cardio/cardio.glb',
    atlasLabel: 'Cardiovascular reference atlas',
    atlasSource: 'Panacea cardiovascular atlas derived from named reference anatomy',
    purpose:
      'Learn right-atrial septal orientation, adjacent structures and ICE view logic without turning generic atlas coordinates into a patient-specific puncture target.',
    referenceContext:
      'Inspired by the open-source Cardiac Atlas Lab interaction pattern. Panacea reuses its own cardiovascular source geometry and preserves the prototype’s own clinical-validation limitations.',
    instrumentFamilies: [
      'Venous access and guidewire system',
      'Transseptal sheath / dilator family',
      'Transseptal needle or wire family',
      'Intracardiac echocardiography catheter',
    ],
    steps: [
      {
        id: 'ts-ra-orientation',
        label: 'Right-atrial orientation',
        mode: 'deep-anatomy',
        objective: 'Establish the right atrium, caval inflow and atrioventricular landmarks before thinking about septal contact.',
        anatomy:
          'The right atrium receives caval venous return and lies adjacent to the tricuspid valve, interatrial septal region and aortic root. Orientation begins with relationships, not a memorised screen coordinate.',
        atlasKeywords: ['right atrium', 'inferior vena cava', 'superior vena cava', 'tricuspid', 'aorta'],
        sharedBodyKeywords: ['right atrium', 'inferior vena cava', 'superior vena cava', 'aorta'],
        atRiskKeywords: ['aorta'],
        atRiskText: ['Aortic root', 'Right atrial free wall'],
        bodyDepth: 5,
        selfCheck: {
          prompt: 'Why is a generic puncture coordinate unsafe as a teaching target?',
          answer: 'Because septal anatomy and adjacent structures vary by patient and imaging orientation; real procedures require real-time imaging confirmation.',
        },
      },
      {
        id: 'ts-fossa-concept',
        label: 'True septum & fossa ovalis concept',
        mode: 'verification',
        objective: 'Separate the true interatrial septum from surrounding atrial infolding and adjacent structures.',
        anatomy:
          'The fossa ovalis floor is thin true septal tissue, whereas surrounding rims include atrial infolding. A whole-heart atlas may not contain the fossa floor as its own verified mesh.',
        atlasKeywords: ['right atrium', 'left atrium', 'interatrial septum', 'septum'],
        sharedBodyKeywords: ['right atrium', 'left atrium', 'septum'],
        atRiskKeywords: ['aorta'],
        atRiskText: ['Aortic root anterior-superiorly', 'Left atrial free wall', 'Pericardial space'],
        bodyDepth: 5,
        selfCheck: {
          prompt: 'Does a highlighted interatrial region prove the fossa ovalis floor is separately modelled?',
          answer: 'No. The simulator must report whether the fossa floor exists as a verified mesh; otherwise the relationship is educational text only.',
        },
        boundary: 'Fossa-ovalis reconstruction is not invented when the source mesh does not contain it.',
      },
      {
        id: 'ts-ice-long-axis',
        label: 'ICE long-axis orientation',
        mode: 'imaging',
        objective: 'Understand which relationships an ICE long-axis teaching view is intended to keep in one plane.',
        anatomy:
          'ICE is used to orient the septum dynamically relative to right atrium, left atrium and adjacent aortic structures. The probe axis and transseptal needle axis are not assumed to be identical.',
        atlasKeywords: ['right atrium', 'left atrium', 'aorta', 'septum'],
        sharedBodyKeywords: ['right atrium', 'left atrium', 'aorta'],
        atRiskKeywords: ['aorta'],
        atRiskText: ['Aortic root', 'Left atrial free wall'],
        bodyDepth: 5,
        imaging: {
          modality: 'ICE',
          view: 'Long-axis teaching orientation',
          expected: ['Right atrial side', 'Interatrial septal region', 'Left atrial side', 'Anterior-superior aortic relationship'],
          limitation: 'This panel teaches expected spatial relationships; it does not reconstruct a patient ICE acquisition or certify a puncture location.',
        },
        selfCheck: {
          prompt: 'What should remain separate conceptually in an ICE-guided puncture?',
          answer: 'The imaging beam/orientation and the needle trajectory are related but are not the same axis.',
        },
      },
      {
        id: 'ts-ice-short-axis',
        label: 'ICE orthogonal / short-axis orientation',
        mode: 'imaging',
        objective: 'Cross-check septal orientation from a second plane instead of trusting one projection.',
        anatomy:
          'An orthogonal ICE orientation changes how the septum and neighboring atrial structures are displayed. The educational value is the cross-check between planes, not a single fixed screen position.',
        atlasKeywords: ['right atrium', 'left atrium', 'septum', 'aorta'],
        sharedBodyKeywords: ['right atrium', 'left atrium', 'aorta'],
        atRiskKeywords: ['aorta'],
        atRiskText: ['Aortic root', 'Atrial free wall'],
        bodyDepth: 5,
        imaging: {
          modality: 'ICE',
          view: 'Orthogonal / short-axis teaching orientation',
          expected: ['Septal region seen from a second plane', 'Right- vs left-atrial side remains identifiable', 'Aortic relationship remains outside the intended true-septal target'],
          limitation: 'No pixel-level match to a clinical ICE system is claimed. Image appearance, gain, depth and artifact behavior are device- and patient-dependent.',
        },
        selfCheck: {
          prompt: 'Why use more than one ICE orientation?',
          answer: 'Because orthogonal views reduce dependence on a single projection and help confirm the spatial relationship of septum and adjacent structures.',
        },
      },
      {
        id: 'ts-tenting',
        label: 'Contact, tenting & passage concept',
        mode: 'verification',
        objective: 'Distinguish tissue contact/tenting from confirmed left-atrial passage.',
        anatomy:
          'Tenting is deformation of septal tissue under contact; it is not equivalent to successful passage. Panacea does not deform the source heart unless a validated mechanics layer exists.',
        atlasKeywords: ['right atrium', 'left atrium', 'septum'],
        sharedBodyKeywords: ['right atrium', 'left atrium', 'septum'],
        atRiskKeywords: ['aorta'],
        atRiskText: ['Aortic root', 'Left atrial free wall', 'Pericardial space'],
        bodyDepth: 5,
        selfCheck: {
          prompt: 'Does “tenting” alone prove the needle has entered the left atrium?',
          answer: 'No. Tenting indicates contact/deformation; passage requires separate confirmation in real imaging and haemodynamic context.',
        },
        boundary: 'No force, tissue puncture threshold, haptic feedback or “safe” success zone is simulated.',
      },
      {
        id: 'ts-complication-map',
        label: 'Complication anatomy map',
        mode: 'verification',
        objective: 'Review the structures whose spatial relationship makes orientation clinically consequential.',
        anatomy:
          'Anterior-superior misorientation relates to the aortic root; excessive lateral/posterior traversal can relate to atrial free wall and pericardial space. These are relationships, not simulator-derived risk probabilities.',
        atlasKeywords: ['aorta', 'right atrium', 'left atrium', 'coronary sinus', 'inferior vena cava'],
        sharedBodyKeywords: ['aorta', 'right atrium', 'left atrium', 'coronary sinus', 'inferior vena cava'],
        atRiskKeywords: ['aorta'],
        atRiskText: ['Aortic root', 'Atrial free wall', 'Pericardial space', 'Coronary sinus region'],
        bodyDepth: 5,
        selfCheck: {
          prompt: 'What can this simulator responsibly teach about complications?',
          answer: 'It can show adjacency and orientation; it cannot calculate an individual patient’s puncture risk or recommend a target coordinate.',
        },
      },
    ],
    geometryBoundary:
      'The cardiovascular atlas contains named reference structures but does not guarantee a separately segmented fossa ovalis floor. Panacea does not hand-draw a target and call it source anatomy.',
    evidenceBoundary:
      'Educational anatomy and imaging-orientation training only. It does not replace supervised EP training, real ICE/TEE/fluoroscopy, haemodynamic confirmation or patient-specific planning.',
    sources: [
      'EHRA/HFA/EAPCI/EACVI/AEPC clinical consensus statement on transseptal puncture, Europace (2026)',
      'shimayuz/cardiac-atlas-lab (MIT code; Z-Anatomy/BodyParts3D assets under their own attribution terms) — interaction inspiration and limitation model',
      'Panacea cardiovascular reference atlas with named source geometry',
    ],
  },
]
