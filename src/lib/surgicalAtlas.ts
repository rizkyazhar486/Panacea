export type SurgicalSpecialty = 'general' | 'orthopaedics' | 'cardiothoracic' | 'neurosurgery' | 'obgyn' | 'urology' | 'plastic' | 'ent'
export type SurgicalApproach = 'open' | 'laparoscopic' | 'robotic' | 'arthroscopic' | 'endoscopic' | 'microsurgical'
export type SurgicalLayer = 'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid'

export interface SurgicalPhase {
  id: string
  title: string
  objective: string
  narration: string
  focusKeywords: string[]
  layers: SurgicalLayer[]
  dissect: number
  unfold: number
  structuresAtRisk: string[]
  checkpoint: string
  instrumentFamilies: string[]
}

export interface SurgicalProcedure {
  id: string
  name: string
  specialty: SurgicalSpecialty
  region: string
  approach: SurgicalApproach
  summary: string
  learningObjectives: string[]
  phases: SurgicalPhase[]
  complications: string[]
  patientSpecificInputs: string[]
  evidenceLevel: 'reference-education' | 'curriculum-reviewed'
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

const COMMON_CLOSE = phase(
  'closure',
  'Closure & final safety check',
  'Restore layers and verify the operative field before completing the procedure.',
  'The atlas deliberately summarizes closure rather than teaching a specific suture pattern or device setting. The learning goal is orientation, hemostasis awareness and final-anatomy review.',
  [], ['surface', 'muscular', 'cardiovascular', 'visceral'], 1, 0,
  ['Operative field', 'Neurovascular structures relevant to the approach'],
  'Final anatomy, hemostasis and specimen/device accounting are conceptually reviewed.',
  ['closure systems', 'suture families', 'hemostasis tools'],
)

export const SURGICAL_PROCEDURES: SurgicalProcedure[] = [
  {
    id: 'lap-appendectomy', name: 'Laparoscopic appendectomy', specialty: 'general', region: 'Right lower abdomen', approach: 'laparoscopic',
    summary: 'Educational 4D orientation from abdominal access to appendix identification, control and removal.',
    learningObjectives: ['Locate caecum and appendix in 3D', 'Understand mesoappendix and vascular relationships', 'Recognize nearby bowel and ureter as structures requiring protection'],
    phases: [
      phase('orientation', 'Abdominal orientation', 'Establish spatial relationships before target work.', 'The scene opens the abdominal wall and orients the learner to caecum, terminal ileum and appendix.', ['appendix', 'caecum', 'cecum', 'ileum'], ['surface', 'muscular', 'visceral', 'cardiovascular'], 2, .08, ['Small bowel', 'Colon', 'Inferior epigastric vessels'], 'Confirm the target anatomy before continuing.', ['camera system', 'atraumatic graspers']),
      phase('target', 'Appendix & mesoappendix', 'Understand target and vascular attachment.', 'The mesoappendix is treated as a vascular-bearing attachment; the atlas emphasizes relationships rather than an operative recipe.', ['appendix', 'mesoappendix', 'ileocolic'], ['visceral', 'cardiovascular'], 3, .16, ['Ileum', 'Caecum', 'Mesenteric vessels', 'Ureter'], 'Target and adjacent bowel are differentiated.', ['dissection instruments', 'energy/hemostasis family']),
      phase('separation', 'Separation & specimen path', 'Visualize how target removal changes local anatomy.', 'The model transitions from attached appendix to post-removal orientation without specifying device sizes or energy settings.', ['appendix', 'caecum', 'cecum'], ['visceral', 'cardiovascular'], 3, .2, ['Caecal wall', 'Adjacent bowel'], 'Reassess bowel integrity and local anatomy conceptually.', ['ligation/stapling family', 'specimen retrieval']),
      COMMON_CLOSE,
    ],
    complications: ['Bleeding', 'Bowel injury', 'Intra-abdominal infection', 'Stump-related complication'],
    patientSpecificInputs: ['CT abdomen when clinically available', 'Operative imaging/annotations', 'Surgeon-reviewed segmentation'], evidenceLevel: 'reference-education',
  },
  {
    id: 'lap-cholecystectomy', name: 'Laparoscopic cholecystectomy', specialty: 'general', region: 'Right upper abdomen', approach: 'laparoscopic',
    summary: 'Spatial rehearsal of gallbladder surgery with special emphasis on biliary and vascular anatomy.',
    learningObjectives: ['Orient gallbladder, liver and extrahepatic biliary anatomy', 'Understand why anatomic identification matters before division', 'Recognize common structures at risk'],
    phases: [
      phase('exposure', 'Gallbladder exposure', 'Reveal gallbladder-liver-biliary relationships.', 'The liver and gallbladder are brought into focus while maintaining surrounding reference anatomy.', ['gallbladder', 'liver', 'bile duct', 'cystic'], ['visceral', 'cardiovascular'], 2, .12, ['Duodenum', 'Colon', 'Liver surface'], 'Orientation is clear before target structures are discussed.', ['camera system', 'atraumatic graspers']),
      phase('biliary-map', 'Biliary safety map', 'Distinguish target ducts and vessels from non-target structures.', 'This scene is a map of relationships, not a substitute for formal operative training. It highlights why misidentification can cause major injury.', ['cystic duct', 'common bile', 'hepatic duct', 'cystic artery'], ['visceral', 'cardiovascular'], 4, .22, ['Common bile duct', 'Common hepatic duct', 'Right hepatic artery'], 'Target structures are explicitly distinguished from the main biliary tree.', ['dissection instruments', 'clip/ligation family']),
      phase('bed', 'Gallbladder-liver plane', 'Understand the attachment plane to the liver.', 'The atlas shows the gallbladder separating from the liver bed and the surrounding vascular context.', ['gallbladder', 'liver'], ['visceral', 'cardiovascular'], 3, .18, ['Liver parenchyma', 'Biliary structures'], 'Final target removal path remains anatomically coherent.', ['dissection instruments', 'hemostasis tools', 'specimen retrieval']),
      COMMON_CLOSE,
    ],
    complications: ['Bile duct injury', 'Bleeding', 'Bile leak', 'Bowel injury', 'Infection'],
    patientSpecificInputs: ['Ultrasound/CT/MRCP as appropriate', 'Segmentation of biliary anatomy', 'Surgeon-reviewed variant anatomy'], evidenceLevel: 'reference-education',
  },
  {
    id: 'inguinal-hernia', name: 'Inguinal hernia repair', specialty: 'general', region: 'Groin', approach: 'open',
    summary: 'Layer-by-layer groin anatomy with hernia pathway, neurovascular landmarks and reconstruction concept.',
    learningObjectives: ['See abdominal-wall layers in order', 'Understand inguinal canal relationships', 'Recognize nerves, vessels and cord structures at risk'],
    phases: [
      phase('layers', 'Groin layers', 'Expose the layered anatomy of the inguinal region.', 'The atlas fades outer layers rather than deleting them, preserving orientation.', ['inguinal', 'external oblique', 'rectus', 'spermatic'], ['surface', 'muscular', 'nervous', 'cardiovascular'], 3, .18, ['Ilioinguinal region nerves', 'Inferior epigastric vessels'], 'Learner can identify the canal and surrounding layers.', ['retractors', 'dissection instruments']),
      phase('hernia-map', 'Hernia pathway', 'Relate the defect to canal anatomy.', 'A conceptual defect pathway is overlaid on reference anatomy; this is not patient-specific unless imaging-derived geometry is supplied.', ['inguinal', 'spermatic', 'round ligament', 'inferior epigastric'], ['muscular', 'nervous', 'cardiovascular', 'visceral'], 4, .2, ['Cord structures / round ligament', 'Bladder', 'Epigastric vessels'], 'Defect location and adjacent structures are differentiated.', ['dissection instruments', 'reconstruction materials']),
      phase('reconstruction', 'Reconstruction concept', 'Visualize restoration of abdominal-wall mechanics.', 'The final scene emphasizes spatial coverage and layer restoration rather than a named technical recipe.', ['inguinal', 'abdominal wall'], ['muscular', 'nervous', 'cardiovascular'], 3, .1, ['Nerves', 'Vessels', 'Cord structures'], 'Reconstruction is shown without compressing critical structures.', ['reconstruction materials', 'closure systems']),
      COMMON_CLOSE,
    ],
    complications: ['Bleeding', 'Nerve-related chronic pain', 'Recurrence', 'Seroma/hematoma', 'Injury to adjacent structures'],
    patientSpecificInputs: ['Exam/imaging if available', 'Side and hernia classification', 'Prior operative anatomy'], evidenceLevel: 'reference-education',
  },
  {
    id: 'total-knee', name: 'Total knee arthroplasty', specialty: 'orthopaedics', region: 'Knee', approach: 'open',
    summary: '4D arthroplasty concept from joint exposure through bone-surface preparation, implant relationship and soft-tissue balance.',
    learningObjectives: ['Understand femur-tibia-patella relationships', 'See collateral and posterior neurovascular risk anatomy', 'Visualize alignment and implant-bone relationships'],
    phases: [
      phase('joint', 'Joint exposure', 'Reveal articular and periarticular anatomy.', 'The skin and muscle envelope fade while the femur, tibia, patella and major soft-tissue stabilizers remain spatially registered.', ['femur', 'tibia', 'patella', 'knee', 'collateral'], ['surface', 'muscular', 'skeletal', 'nervous', 'cardiovascular'], 4, .16, ['Collateral ligaments', 'Extensor mechanism', 'Popliteal neurovascular bundle'], 'Joint surfaces and stabilizers are identified.', ['retractors', 'cutting-guide family']),
      phase('bone-plan', 'Bone-surface plan', 'Understand conceptual resection planes and alignment.', 'The atlas shows orientation planes only; it intentionally omits patient-specific cut depths, angles and implant sizing.', ['distal femur', 'tibial plateau', 'patella'], ['skeletal', 'muscular'], 5, .24, ['Collateral ligaments', 'Posterior cortex', 'Popliteal structures'], 'Planned surfaces remain connected to global limb alignment.', ['alignment guides', 'bone preparation instruments']),
      phase('implant', 'Implant relationship', 'Visualize component-bone and soft-tissue relationships.', 'A generic component envelope demonstrates how reconstruction restores a joint space; it is not an implant recommendation.', ['femur', 'tibia', 'patella', 'knee'], ['skeletal', 'muscular', 'nervous', 'cardiovascular'], 4, .18, ['Extensor mechanism', 'Collateral ligaments', 'Posterior neurovascular bundle'], 'Final geometry is reviewed for conceptual alignment and surrounding soft tissue.', ['trial/component family', 'cement/fixation family']),
      COMMON_CLOSE,
    ],
    complications: ['Infection', 'Bleeding', 'Neurovascular injury', 'Thromboembolic complications', 'Instability/stiffness', 'Periprosthetic complication'],
    patientSpecificInputs: ['Weight-bearing radiographs', 'CT if used for planning', 'Implant system data', 'Surgeon-approved alignment plan'], evidenceLevel: 'reference-education',
  },
  {
    id: 'acl-reconstruction', name: 'ACL reconstruction', specialty: 'orthopaedics', region: 'Knee', approach: 'arthroscopic',
    summary: 'Arthroscopic spatial map of ACL anatomy, femoral/tibial footprints and surrounding structures.',
    learningObjectives: ['See ACL orientation in the 3D knee', 'Understand footprint relationships', 'Recognize meniscus, cartilage and neurovascular structures'],
    phases: [
      phase('scope-map', 'Arthroscopic orientation', 'Map the intra-articular knee.', 'The view focuses the ACL, PCL, femoral condyles, tibial plateau and menisci as a spatial learning scene.', ['anterior cruciate', 'posterior cruciate', 'meniscus', 'femur', 'tibia'], ['skeletal', 'muscular'], 5, .28, ['Articular cartilage', 'Menisci', 'PCL'], 'Target ligament and adjacent intra-articular anatomy are distinguished.', ['arthroscope', 'probe family']),
      phase('footprints', 'ACL footprints', 'Understand femoral and tibial attachment regions.', 'The atlas highlights footprint concepts without providing tunnel coordinates, drill angles or graft sizing.', ['anterior cruciate', 'femur', 'tibia'], ['skeletal', 'muscular'], 5, .3, ['Posterior cortex', 'Neurovascular bundle', 'Cartilage'], 'Attachment regions are understood in 3D.', ['guide family', 'bone preparation family']),
      phase('reconstruction', 'Graft pathway concept', 'Visualize reconstructed ligament orientation.', 'A conceptual graft axis reconnects the native attachment regions. Fixation specifics remain outside this educational layer.', ['anterior cruciate', 'femur', 'tibia'], ['skeletal', 'muscular'], 5, .22, ['PCL', 'Menisci', 'Cartilage'], 'Reconstructed axis is reviewed through flexion-extension context.', ['graft preparation family', 'fixation family']),
      COMMON_CLOSE,
    ],
    complications: ['Infection', 'Stiffness', 'Graft failure', 'Neurovascular injury', 'Tunnel/fixation complication'],
    patientSpecificInputs: ['MRI knee', 'Radiographs', 'Graft choice', 'Surgeon-reviewed tunnel plan'], evidenceLevel: 'reference-education',
  },
  {
    id: 'clavicle-orif', name: 'Clavicle fracture ORIF', specialty: 'orthopaedics', region: 'Shoulder girdle', approach: 'open',
    summary: 'Layered clavicular anatomy, fracture reduction concept and implant relationship with subclavian/neural structures emphasized.',
    learningObjectives: ['Understand clavicle and shoulder-girdle relationships', 'Recognize subclavian and brachial plexus risk anatomy', 'Visualize reduction and fixation concept'],
    phases: [
      phase('exposure', 'Clavicle exposure', 'Reveal bone while retaining nearby neurovascular context.', 'The skin and superficial muscle envelope fade to show the clavicle and structures deep to it.', ['clavicle', 'subclavian', 'brachial plexus'], ['surface', 'muscular', 'skeletal', 'nervous', 'cardiovascular'], 4, .18, ['Subclavian vessels', 'Brachial plexus', 'Pleura'], 'Bone and deep danger structures remain visible together.', ['retractors', 'dissection instruments']),
      phase('reduction', 'Fracture reduction concept', 'Restore gross clavicular continuity.', 'The 4D sequence shows fragment alignment conceptually, without giving reduction-force instructions.', ['clavicle'], ['skeletal', 'muscular', 'nervous', 'cardiovascular'], 5, .24, ['Subclavian vessels', 'Brachial plexus', 'Pleura'], 'Continuity and nearby anatomy are reassessed.', ['reduction instruments']),
      phase('fixation', 'Fixation envelope', 'Understand implant-to-bone relationship.', 'A generic fixation zone is used; hardware brand, screw length and drilling parameters are intentionally absent.', ['clavicle'], ['skeletal', 'nervous', 'cardiovascular'], 5, .2, ['Deep neurovascular structures', 'Pleura'], 'Fixation concept is reviewed without implying patient-specific hardware selection.', ['plate/fixation family']),
      COMMON_CLOSE,
    ],
    complications: ['Infection', 'Neurovascular injury', 'Pneumothorax', 'Nonunion/malunion', 'Hardware-related symptoms'],
    patientSpecificInputs: ['Radiographs', 'CT for complex patterns', 'Fracture segmentation', 'Chosen implant system'], evidenceLevel: 'reference-education',
  },
  {
    id: 'carpal-tunnel', name: 'Carpal tunnel release', specialty: 'orthopaedics', region: 'Wrist/hand', approach: 'open',
    summary: 'High-resolution orientation of transverse carpal ligament, median nerve and neighboring tendons/branches.',
    learningObjectives: ['Identify median nerve and flexor tunnel', 'Understand ligament-nerve relationship', 'Recognize nearby branches and vascular structures'],
    phases: [
      phase('wrist-map', 'Carpal tunnel map', 'Reveal tunnel contents and roof.', 'The atlas isolates the median nerve, transverse carpal ligament concept and flexor tendons in a compact spatial scene.', ['median nerve', 'carpal', 'flexor tendon'], ['skeletal', 'muscular', 'nervous', 'cardiovascular'], 5, .28, ['Median nerve', 'Recurrent motor branch', 'Superficial palmar structures'], 'Neural structures are identified before the release concept.', ['magnification', 'fine dissection family']),
      phase('release', 'Decompression concept', 'Visualize increase in tunnel freedom after roof division.', 'The sequence shows before/after spatial relationships rather than a cutting trajectory.', ['median nerve', 'carpal'], ['skeletal', 'nervous', 'muscular'], 5, .32, ['Median nerve and branches', 'Flexor tendons'], 'Median nerve remains continuous and decompressed in the educational model.', ['fine release instrument family']),
      COMMON_CLOSE,
    ],
    complications: ['Nerve injury', 'Bleeding', 'Incomplete release', 'Scar/pillar pain', 'Infection'],
    patientSpecificInputs: ['Ultrasound when available', 'Electrodiagnostic context', 'Prior surgery/anatomy'], evidenceLevel: 'reference-education',
  },
  {
    id: 'cesarean', name: 'Cesarean delivery', specialty: 'obgyn', region: 'Pelvis/lower abdomen', approach: 'open',
    summary: 'Layer-by-layer maternal anatomy and delivery/reconstruction sequence for educational orientation.',
    learningObjectives: ['Understand abdominal wall, bladder and uterine relationships', 'See fetal/maternal compartment orientation', 'Recognize major structures at risk'],
    phases: [
      phase('layers', 'Maternal abdominal layers', 'Orient abdominal wall and pelvis.', 'The scene progressively fades abdominal wall layers while preserving bladder, uterus and major vessels.', ['uterus', 'bladder', 'rectus', 'inferior epigastric'], ['surface', 'muscular', 'visceral', 'cardiovascular'], 3, .16, ['Bladder', 'Epigastric vessels', 'Bowel'], 'Uterus and bladder relationship is clear.', ['retractors', 'dissection family']),
      phase('uterus', 'Uterine compartment', 'Visualize uterus and fetal compartment concept.', 'The atlas shows compartment relationships without specifying incision dimensions, extraction maneuvers or medication.', ['uterus', 'placenta', 'fetal'], ['visceral', 'cardiovascular'], 4, .22, ['Bladder', 'Uterine vessels', 'Adjacent bowel'], 'Target compartment and vascular context are identified.', ['delivery/traction family', 'suction family']),
      phase('reconstruction', 'Uterine & wall reconstruction', 'Restore layers after delivery.', 'The sequence returns the uterus and abdominal wall toward the postoperative state without teaching a suturing recipe.', ['uterus', 'rectus', 'abdominal wall'], ['visceral', 'muscular', 'cardiovascular'], 3, .12, ['Bladder', 'Uterine vessels'], 'Final layer relationships are reviewed.', ['closure systems', 'hemostasis tools']),
      COMMON_CLOSE,
    ],
    complications: ['Hemorrhage', 'Infection', 'Bladder/bowel injury', 'Thromboembolic complication', 'Anesthetic complication'],
    patientSpecificInputs: ['Obstetric ultrasound', 'Placental location', 'Prior operative history', 'Clinician-reviewed anatomy'], evidenceLevel: 'reference-education',
  },
  {
    id: 'thyroidectomy', name: 'Total thyroidectomy', specialty: 'ent', region: 'Neck', approach: 'open',
    summary: 'Neck anatomy rehearsal centered on thyroid, recurrent laryngeal nerve, parathyroid and vascular relationships.',
    learningObjectives: ['Identify thyroid and central neck anatomy', 'Understand recurrent laryngeal nerve relationship', 'Recognize parathyroid and major vascular structures'],
    phases: [
      phase('neck-map', 'Neck exposure map', 'Reveal thyroid in relation to airway, vessels and muscles.', 'The model fades superficial layers to show thyroid, trachea and carotid-jugular structures.', ['thyroid', 'trachea', 'carotid', 'jugular'], ['surface', 'muscular', 'visceral', 'nervous', 'cardiovascular'], 4, .18, ['Carotid artery', 'Jugular vein', 'Trachea'], 'Central and lateral neck relationships are oriented.', ['retractors', 'fine dissection family']),
      phase('nerve-parathyroid', 'Nerve & parathyroid safety map', 'Highlight structures whose preservation is central to safe surgery.', 'The recurrent laryngeal nerve and parathyroid regions are highlighted as structures to identify and protect; no dissection trajectory is prescribed.', ['recurrent laryngeal', 'parathyroid', 'thyroid'], ['nervous', 'visceral', 'cardiovascular'], 5, .28, ['Recurrent laryngeal nerve', 'Parathyroid glands', 'Superior laryngeal nerve region'], 'Critical structures are differentiated from the thyroid target.', ['magnification', 'fine dissection family', 'hemostasis tools']),
      phase('post-resection', 'Post-resection anatomy', 'Review remaining airway, nerve and vascular relationships.', 'The thyroid target fades while preserved structures remain visible for final orientation.', ['trachea', 'recurrent laryngeal', 'parathyroid', 'carotid'], ['nervous', 'visceral', 'cardiovascular'], 5, .22, ['Airway', 'Nerves', 'Parathyroid regions'], 'Preserved anatomy is conceptually reviewed.', ['hemostasis tools', 'closure systems']),
      COMMON_CLOSE,
    ],
    complications: ['Bleeding/neck hematoma', 'Recurrent laryngeal nerve injury', 'Hypocalcemia', 'Infection'],
    patientSpecificInputs: ['Neck ultrasound', 'Cross-sectional imaging when indicated', 'Laryngoscopy context', 'Surgeon-reviewed variant anatomy'], evidenceLevel: 'reference-education',
  },
  {
    id: 'cabg', name: 'Coronary artery bypass grafting', specialty: 'cardiothoracic', region: 'Chest/heart', approach: 'open',
    summary: 'Macro-anatomy rehearsal of coronary territories, conduit concept and bypass relationship without perfusion or anastomotic technique instructions.',
    learningObjectives: ['Map major coronary territories', 'Understand bypass as rerouting around a stenotic segment', 'See heart/great-vessel and conduit relationships'],
    phases: [
      phase('heart-map', 'Coronary map', 'Orient heart chambers, great vessels and coronary arteries.', 'The cardiovascular layer becomes dominant and major coronary territories are highlighted.', ['heart', 'coronary', 'aorta', 'ventricle'], ['skeletal', 'cardiovascular', 'visceral'], 4, .18, ['Great vessels', 'Coronary branches', 'Phrenic nerve regions'], 'Target vascular territories are identified.', ['cardiac exposure family', 'magnification']),
      phase('bypass-concept', 'Bypass pathway concept', 'Visualize rerouting around obstructed coronary flow.', 'A conceptual conduit path connects inflow and distal coronary territory. The atlas does not teach cannulation, perfusion, anastomotic suturing or medication.', ['coronary', 'aorta', 'internal thoracic', 'saphenous'], ['cardiovascular', 'visceral', 'nervous'], 5, .24, ['Coronary branches', 'Great vessels', 'Conduit structures'], 'The bypass concept is spatially understood.', ['conduit handling family', 'microsurgical/cardiac instrument family']),
      phase('reperfused-map', 'Post-bypass flow map', 'Compare pre/post conceptual coronary routing.', 'Animated flow highlights the new route as an educational visualization, not a quantitative perfusion prediction.', ['coronary', 'heart', 'aorta'], ['cardiovascular', 'visceral'], 5, .2, ['Graft route', 'Coronary targets'], 'Final vascular map is reviewed.', ['flow-assessment family']),
      COMMON_CLOSE,
    ],
    complications: ['Bleeding', 'Arrhythmia', 'Myocardial injury', 'Stroke', 'Infection', 'Graft-related complication'],
    patientSpecificInputs: ['Coronary angiography/CT', 'Echocardiography', 'Conduit assessment', 'Surgeon-approved graft plan'], evidenceLevel: 'reference-education',
  },
  {
    id: 'craniotomy-hematoma', name: 'Craniotomy for intracranial hematoma evacuation', specialty: 'neurosurgery', region: 'Skull/brain', approach: 'open',
    summary: 'Layered cranial rehearsal from skull to lesion compartment with eloquent/neurovascular structures kept visible.',
    learningObjectives: ['Understand scalp-skull-dura-brain layers', 'Relate lesion location to nearby cortex and vessels', 'See why patient-specific imaging is essential for real surgical planning'],
    phases: [
      phase('cranial-layers', 'Cranial layers', 'Orient skull, meninges and cortex.', 'Reference layers separate in 3D while the brain remains registered inside the skull.', ['skull', 'brain', 'dura', 'mening'], ['surface', 'skeletal', 'nervous', 'cardiovascular'], 4, .18, ['Cortical vessels', 'Venous sinuses', 'Eloquent cortex'], 'The learner understands that reference anatomy cannot localize a real patient lesion.', ['cranial exposure family', 'magnification']),
      phase('lesion-map', 'Lesion corridor concept', 'Relate a hypothetical lesion compartment to surrounding structures.', 'A reference target region is used only to demonstrate corridor thinking. Actual lesion localization requires patient imaging and registration.', ['brain', 'cerebral', 'middle cerebral', 'venous sinus'], ['nervous', 'cardiovascular'], 5, .26, ['Cortical vessels', 'Functional cortex', 'Deep structures'], 'No patient-specific target is implied without DICOM-derived geometry.', ['microsurgical visualization', 'fine dissection family']),
      phase('post-target', 'Post-evacuation reference state', 'Review decompressed anatomy conceptually.', 'The scene demonstrates before/after volume concept, not pressure prediction or operative guidance.', ['brain', 'cerebral'], ['nervous', 'cardiovascular'], 5, .2, ['Brain tissue', 'Vessels'], 'Final state remains labelled educational unless patient-specific validated data exist.', ['hemostasis family', 'closure systems']),
      COMMON_CLOSE,
    ],
    complications: ['Bleeding/rebleeding', 'Neurologic deficit', 'Seizure', 'Infection', 'Edema/pressure-related complication'],
    patientSpecificInputs: ['DICOM CT/MRI', 'Segmentation of hematoma and critical structures', 'Registration landmarks', 'Neurosurgeon-reviewed trajectory'], evidenceLevel: 'reference-education',
  },
  {
    id: 'skin-graft', name: 'Split-thickness skin graft reconstruction', specialty: 'plastic', region: 'Skin/soft tissue', approach: 'open',
    summary: 'Reconstructive wound-bed and graft-take concept using layered skin/vascular anatomy.',
    learningObjectives: ['Understand donor/recipient tissue layers', 'Visualize vascular dependence of graft take', 'See reconstruction as a timed biological process, not just a static closure'],
    phases: [
      phase('wound-bed', 'Recipient bed', 'Understand viable tissue and vascular context.', 'The atlas focuses skin, subcutaneous tissue and local vascularity as the receiving environment.', ['skin', 'dermis', 'subcutaneous', 'artery', 'vein'], ['surface', 'cardiovascular', 'muscular'], 3, .14, ['Exposed tendon/bone depending on region', 'Local vessels', 'Nerves'], 'Recipient anatomy and tissue layers are recognized.', ['wound preparation family']),
      phase('graft-layer', 'Graft placement concept', 'Visualize a thin skin layer conforming to the recipient surface.', 'A generic graft sheet demonstrates contact and coverage. Harvest thickness and device settings are intentionally absent.', ['skin', 'dermis'], ['surface', 'cardiovascular'], 4, .18, ['Underlying structures', 'Graft edges'], 'Coverage and contact are visually understood.', ['graft handling family', 'fixation/dressing family']),
      phase('take-timeline', '4D graft-take timeline', 'Show the concept of evolving graft-host vascular integration.', 'The timeline moves from early diffusion-dependent survival toward revascularization as an educational biology sequence, not a patient-specific viability prediction.', ['skin', 'artery', 'vein'], ['surface', 'cardiovascular'], 4, .16, ['Graft tissue', 'Recipient microvasculature'], 'Time-dependent biology is explicitly labelled educational.', ['dressing family']),
      COMMON_CLOSE,
    ],
    complications: ['Graft loss', 'Infection', 'Hematoma/seroma', 'Contracture/scarring', 'Donor-site morbidity'],
    patientSpecificInputs: ['Wound photography with consent', '3D surface scan', 'Perfusion imaging if clinically available', 'Reconstructive surgeon annotation'], evidenceLevel: 'reference-education',
  },
]

export const SURGICAL_SPECIALTIES: Array<{ key: 'all' | SurgicalSpecialty; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'orthopaedics', label: 'Orthopaedics' },
  { key: 'cardiothoracic', label: 'Cardiothoracic' },
  { key: 'neurosurgery', label: 'Neurosurgery' },
  { key: 'obgyn', label: 'OB/GYN' },
  { key: 'urology', label: 'Urology' },
  { key: 'plastic', label: 'Plastic' },
  { key: 'ent', label: 'ENT' },
]

export function searchSurgicalProcedures(query: string, specialty: 'all' | SurgicalSpecialty = 'all') {
  const q = query.trim().toLowerCase()
  return SURGICAL_PROCEDURES.filter((procedure) => {
    if (specialty !== 'all' && procedure.specialty !== specialty) return false
    if (!q) return true
    const haystack = [procedure.name, procedure.specialty, procedure.region, procedure.approach, procedure.summary, ...procedure.learningObjectives, ...procedure.complications].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}
