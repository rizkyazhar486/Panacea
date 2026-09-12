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
    summary: 'Orientation built around one fact: the appendix hangs from the caecum on a short vascular mesentery, and its tip can lie behind the caecum, over the pelvic brim or against the ureter. The base is fixed and findable, the tip is not, which is why identification is treated as an anatomical problem rather than a step in a sequence.',
    learningObjectives: ['Locate caecum and appendix in 3D', 'Understand mesoappendix and vascular relationships', 'Recognize nearby bowel and ureter as structures requiring protection'],
    phases: [
      phase('orientation', 'Abdominal orientation', 'Establish spatial relationships before target work.', 'The three taeniae of the caecum converge on the appendiceal base, which is why the base is the one reliable landmark while the tip is not. The scene establishes that convergence first, because everything later depends on knowing where the base is rather than where the tip happens to lie.', ['appendix', 'caecum', 'cecum', 'ileum'], ['surface', 'muscular', 'visceral', 'cardiovascular'], 2, .08, ['Small bowel', 'Colon', 'Inferior epigastric vessels'], 'The caecum, terminal ileum and appendiceal base can be told apart, so a mobile loop of ileum is not mistaken for the target.', ['camera system', 'atraumatic graspers']),
      phase('target', 'Appendix & mesoappendix', 'Understand target and vascular attachment.', 'The appendicular artery runs inside the mesoappendix as a functional end-artery from the ileocolic supply. That is the anatomical reason an inflamed appendix becomes ischaemic and perforates, and the reason the mesentery is treated as a vascular structure rather than as tissue in the way. The right ureter lies retroperitoneally a short distance behind it.', ['appendix', 'mesoappendix', 'ileocolic'], ['visceral', 'cardiovascular'], 3, .16, ['Ileum', 'Caecum', 'Mesenteric vessels', 'Ureter'], 'The mesoappendix is recognized as carrying the blood supply, and the retroperitoneal course of the ureter behind it is accounted for.', ['dissection instruments', 'energy/hemostasis family']),
      phase('separation', 'Separation & specimen path', 'Visualize how target removal changes local anatomy.', 'Once the appendix is gone, the caecal base is what remains, and it is bowel wall: the orientation shifts from the specimen to the integrity of the organ it came from. The atlas shows that change of attention without specifying any device, closure or energy setting.', ['appendix', 'caecum', 'cecum'], ['visceral', 'cardiovascular'], 3, .2, ['Caecal wall', 'Adjacent bowel'], 'Reassess bowel integrity and local anatomy conceptually.', ['ligation/stapling family', 'specimen retrieval']),
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
      phase('layers', 'Groin layers', 'Expose the layered anatomy of the inguinal region.', 'The groin is layered rather than uniform, and each layer contributes the wall that the hernia has to cross. Fading rather than deleting keeps the outer layers visible, because the depth of the canal is only meaningful relative to what still lies above it.', ['inguinal', 'external oblique', 'rectus', 'spermatic'], ['surface', 'muscular', 'nervous', 'cardiovascular'], 3, .18, ['Ilioinguinal region nerves', 'Inferior epigastric vessels'], 'The canal is placed within its layers, and the inferior epigastric vessels are located as the landmark that separates medial from lateral defects.', ['retractors', 'dissection instruments']),
      phase('hernia-map', 'Hernia pathway', 'Relate the defect to canal anatomy.', 'Where the sac emerges relative to the inferior epigastric vessels is what distinguishes an indirect from a direct defect, and the vessels are the reason the distinction is anatomical rather than descriptive. The pathway shown here is conceptual: reference geometry cannot show where any individual person\u2019s defect actually is.', ['inguinal', 'spermatic', 'round ligament', 'inferior epigastric'], ['muscular', 'nervous', 'cardiovascular', 'visceral'], 4, .2, ['Cord structures / round ligament', 'Bladder', 'Epigastric vessels'], 'Defect location and adjacent structures are differentiated.', ['dissection instruments', 'reconstruction materials']),
      phase('reconstruction', 'Reconstruction concept', 'Visualize restoration of abdominal-wall mechanics.', 'Reconstruction is a mechanical problem: the wall has to carry load again without tethering the structures that pass through it. The nerves of the region and the cord contents are why coverage and tension are discussed together. The atlas stops at that reasoning and prescribes no material, fixation or technique.', ['inguinal', 'abdominal wall'], ['muscular', 'nervous', 'cardiovascular'], 3, .1, ['Nerves', 'Vessels', 'Cord structures'], 'Reconstruction is shown without compressing critical structures.', ['reconstruction materials', 'closure systems']),
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
      phase('joint', 'Joint exposure', 'Reveal articular and periarticular anatomy.', 'The knee is stable because of soft tissue, not bony congruence: the collaterals and the extensor mechanism hold a shallow articulation together. Keeping them registered while the envelope fades is the point, since a joint judged from bone alone looks far more forgiving than it is.', ['femur', 'tibia', 'patella', 'knee', 'collateral'], ['surface', 'muscular', 'skeletal', 'nervous', 'cardiovascular'], 4, .16, ['Collateral ligaments', 'Extensor mechanism', 'Popliteal neurovascular bundle'], 'Joint surfaces and stabilizers are identified.', ['retractors', 'cutting-guide family']),
      phase('bone-plan', 'Bone-surface plan', 'Understand conceptual resection planes and alignment.', 'Bone preparation is bounded by what lies immediately behind it \u2014 the posterior cortex, and behind that the popliteal vessels in the fossa. That proximity, not any numeric plan, is why orientation matters here. Depths, angles and sizing depend on an individual\u2019s imaging and are deliberately absent.', ['distal femur', 'tibial plateau', 'patella'], ['skeletal', 'muscular'], 5, .24, ['Collateral ligaments', 'Posterior cortex', 'Popliteal structures'], 'Planned surfaces remain connected to global limb alignment.', ['alignment guides', 'bone preparation instruments']),
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
      phase('exposure', 'Clavicle exposure', 'Reveal bone while retaining nearby neurovascular context.', 'The clavicle is subcutaneous above and shelters the subclavian vessels, the brachial plexus and the lung apex below. That one bone separates a superficial approach from the most dangerous neighbourhood in the shoulder girdle, which is why the deep structures stay on screen while the envelope fades.', ['clavicle', 'subclavian', 'brachial plexus'], ['surface', 'muscular', 'skeletal', 'nervous', 'cardiovascular'], 4, .18, ['Subclavian vessels', 'Brachial plexus', 'Pleura'], 'Bone and deep danger structures remain visible together.', ['retractors', 'dissection instruments']),
      phase('reduction', 'Fracture reduction concept', 'Restore gross clavicular continuity.', 'Clavicular fragments displace along predictable lines because muscle pull acts on each of them differently, so restoring length and rotation is a question of which structures are pulling where. The sequence shows that geometry only \u2014 no force, manoeuvre or hardware.', ['clavicle'], ['skeletal', 'muscular', 'nervous', 'cardiovascular'], 5, .24, ['Subclavian vessels', 'Brachial plexus', 'Pleura'], 'Continuity and nearby anatomy are reassessed.', ['reduction instruments']),
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
      phase('wrist-map', 'Carpal tunnel map', 'Reveal tunnel contents and roof.', 'The carpal tunnel is a closed space with a rigid roof and rigid floor, so anything that increases its contents raises pressure on the one structure that cannot move away: the median nerve. The scene is built around that fixed-volume relationship, which is also why the median nerve is the structure identified before anything else.', ['median nerve', 'carpal', 'flexor tendon'], ['skeletal', 'muscular', 'nervous', 'cardiovascular'], 5, .28, ['Median nerve', 'Recurrent motor branch', 'Superficial palmar structures'], 'Neural structures are identified before the release concept.', ['magnification', 'fine dissection family']),
      phase('release', 'Decompression concept', 'Visualize increase in tunnel freedom after roof division.', 'Releasing the roof works because it converts a closed compartment into an open one; the contents are unchanged, the volume available to them is not. The atlas shows that before-and-after relationship only, with no trajectory, instrument or technique.', ['median nerve', 'carpal'], ['skeletal', 'nervous', 'muscular'], 5, .32, ['Median nerve and branches', 'Flexor tendons'], 'Median nerve remains continuous and decompressed in the educational model.', ['fine release instrument family']),
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
      phase('nerve-parathyroid', 'Nerve & parathyroid safety map', 'Highlight structures whose preservation is central to safe surgery.', 'The recurrent laryngeal nerve runs in the groove behind the thyroid and supplies the muscles that open the airway; the parathyroid glands sit on the same posterior surface with a blood supply that can be lost without touching the gland itself. Both are why the back of the thyroid, not the front, defines the risk of this operation. Note that neither nerve is shipped as geometry in this atlas, so this phase stays text-only.', ['recurrent laryngeal', 'parathyroid', 'thyroid'], ['nervous', 'visceral', 'cardiovascular'], 5, .28, ['Recurrent laryngeal nerve', 'Parathyroid glands', 'Superior laryngeal nerve region'], 'Critical structures are differentiated from the thyroid target.', ['magnification', 'fine dissection family', 'hemostasis tools']),
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
      phase('bypass-concept', 'Bypass pathway concept', 'Visualize rerouting around obstructed coronary flow.', 'A bypass restores flow by giving blood a second route into the territory beyond a narrowing; the stenosis itself is left alone. That is why the relevant anatomy is the distal target and the conduit\u2019s inflow, not the diseased segment. Cannulation, perfusion, anastomosis and medication are outside this educational layer.', ['coronary', 'aorta', 'internal thoracic', 'saphenous'], ['cardiovascular', 'visceral', 'nervous'], 5, .24, ['Coronary branches', 'Great vessels', 'Conduit structures'], 'The bypass concept is spatially understood.', ['conduit handling family', 'microsurgical/cardiac instrument family']),
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
      phase('cranial-layers', 'Cranial layers', 'Orient skull, meninges and cortex.', 'The skull is a closed box, so a volume added inside it displaces brain rather than expanding outward \u2014 the reason an intracranial collection behaves differently from a collection anywhere else. The layers separate for viewing while the brain stays registered inside the vault, because that containment is the whole point.', ['skull', 'brain', 'dura', 'mening'], ['surface', 'skeletal', 'nervous', 'cardiovascular'], 4, .18, ['Cortical vessels', 'Venous sinuses', 'Eloquent cortex'], 'The learner understands that reference anatomy cannot localize a real patient lesion.', ['cranial exposure family', 'magnification']),
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
      phase('wound-bed', 'Recipient bed', 'Understand viable tissue and vascular context.', 'A graft brings no blood supply of its own, so the recipient bed is not a surface but a source: whether it can perfuse the graft decides the outcome before anything is placed. Bone or tendon stripped of its covering cannot do that, which is why the composition of the bed is examined rather than its size.', ['skin', 'dermis', 'subcutaneous', 'artery', 'vein'], ['surface', 'cardiovascular', 'muscular'], 3, .14, ['Exposed tendon/bone depending on region', 'Local vessels', 'Nerves'], 'Recipient anatomy and tissue layers are recognized.', ['wound preparation family']),
      phase('graft-layer', 'Graft placement concept', 'Visualize a thin skin layer conforming to the recipient surface.', 'A generic graft sheet demonstrates contact and coverage. Harvest thickness and device settings are intentionally absent.', ['skin', 'dermis'], ['surface', 'cardiovascular'], 4, .18, ['Underlying structures', 'Graft edges'], 'Coverage and contact are visually understood.', ['graft handling family', 'fixation/dressing family']),
      phase('take-timeline', '4D graft-take timeline', 'Show the concept of evolving graft-host vascular integration.', 'Graft take is a sequence and not an event: the graft first survives on diffusion from the bed, then depends on vessels growing into it. Anything that separates graft from bed interrupts that supply, which is the reason contact matters more than coverage. The timeline is generic biology, not a viability prediction for anyone.', ['skin', 'artery', 'vein'], ['surface', 'cardiovascular'], 4, .16, ['Graft tissue', 'Recipient microvasculature'], 'Time-dependent biology is explicitly labelled educational.', ['dressing family']),
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

/**
 * Struktur berisiko yang TIDAK punya geometri di berkas atlas yang dikirim.
 *
 * `structuresAtRisk` adalah prosa. Sebagian namanya benar-benar ada sebagai mesh
 * di public/anatomy/*.glb, sebagian tidak. Selama tidak ada yang mencatatnya,
 * kedua hal itu tidak bisa dibedakan: yang hilang tampak sama meyakinkannya
 * dengan yang ada, dan geometri yang sebenarnya tersedia bisa terlewat dipakai.
 *
 * Daftar ini membuat ketiadaan itu menjadi keputusan yang tercatat, bukan
 * kecelakaan. scripts/uji/bedah-struktur-risiko.mts menggagalkan dua arah:
 * struktur yang tidak resolve tetapi tidak tercatat di sini, DAN struktur yang
 * tercatat di sini padahal meshnya ternyata ada. Anatomi tidak boleh diganti
 * namanya supaya cocok — kalau strukturnya memang tidak dikirim, itulah temuannya.
 */
export interface SurgicalStructureWithoutGeometry {
  structure: string
  reason: string
}

export const SURGICAL_STRUCTURES_WITHOUT_GEOMETRY: SurgicalStructureWithoutGeometry[] = [
  { structure: 'Adjacent bowel', reason: 'Collective wording for whatever bowel happens to lie next to the target; the shipped atlas names individual segments (jejunum, ascending colon), never an \'adjacent\' set.' },
  { structure: 'Airway', reason: 'Functional wording rather than a structure name. The shipped atlas carries Trachea and the laryngeal cartilages under their own names.' },
  { structure: 'Articular cartilage', reason: 'No articular cartilage is shipped as separate geometry; the skeletal layer carries bone surfaces only, so knee joint surfaces cannot be highlighted.' },
  { structure: 'Biliary structures', reason: 'Collective wording. The shipped atlas has Bile duct and the gallbladder subdivisions, but no node standing for the biliary tree as a group.' },
  { structure: 'Bowel', reason: 'Generic term. The shipped visceral layer names segments individually; matching \'bowel\' to any of them would be a guess.' },
  { structure: 'Brain tissue', reason: 'Descriptive wording for parenchyma rather than a named structure; the nervous layer is shipped as named regions, nuclei and tracts.' },
  { structure: 'Caecal wall', reason: 'The caecum itself is not shipped (see \'Caecum\'), so its wall has no geometry either.' },
  { structure: 'Caecum', reason: 'Not shipped. No node in any anatomy layer carries caecum/cecum; the appendix is present as \'Vermiform appendix\' but its base has no surrounding caecal mesh.' },
  { structure: 'Cartilage', reason: 'Generic term. It would otherwise match every laryngeal, costal and tracheal cartilage in the body — geometry that has nothing to do with the phase.' },
  { structure: 'Collateral ligaments', reason: 'Knee collateral ligaments are not shipped. The only \'collateral\' nodes present are arteries of the arm and a cerebral sulcus, which are unrelated structures.' },
  { structure: 'Common bile duct', reason: 'The shipped atlas names the extrahepatic duct \'Bile duct\'. Renaming either side to make them match would change anatomy to satisfy a gate, so this stays unresolved.' },
  { structure: 'Common hepatic duct', reason: 'Not shipped. Only \'Bile duct\' exists on the biliary side; the hepatic ducts above the confluence have no geometry.' },
  { structure: 'Conduit structures', reason: 'Refers to a graft conduit that does not exist in a reference atlas; there is nothing to ground.' },
  { structure: 'Cord structures', reason: 'Collective wording for spermatic cord contents; the shipped atlas has no cord-contents grouping node.' },
  { structure: 'Cord structures / round ligament', reason: 'A combined either/or label rather than one structure name; neither alternative is shipped as a node under this wording.' },
  { structure: 'Coronary branches', reason: 'Collective wording. Left and right coronary arteries are shipped individually, but no node stands for \'the branches\'.' },
  { structure: 'Coronary targets', reason: 'Planning wording, not anatomy. A distal target segment is defined by a patient\'s angiogram, never by reference geometry.' },
  { structure: 'Cortical vessels', reason: 'Not shipped. The cardiovascular layer stops at named cerebral arteries; pial and cortical surface vessels are absent.' },
  { structure: 'Deep neurovascular structures', reason: 'Collective wording for whatever lies deep to the exposure; the named structures behind it (subclavian vessels, brachial plexus, pleura) are listed separately and do resolve.' },
  { structure: 'Deep structures', reason: 'Collective wording with no anatomical referent.' },
  { structure: 'Eloquent cortex', reason: 'Eloquence is a functional property established by patient-specific mapping, not a mesh. Reference geometry cannot carry it.' },
  { structure: 'Exposed tendon/bone depending on region', reason: 'Conditional, region-dependent wording describing a wound, not a structure that exists in an atlas.' },
  { structure: 'Extensor mechanism', reason: 'A functional unit (quadriceps, tendon, patella, patellar ligament) with no single node; the shipped atlas names its components separately.' },
  { structure: 'Flexor tendons', reason: 'Not shipped as tendons. The muscular layer carries the flexor muscle bellies (flexor digitorum profundus/superficialis), not their tendons in the carpal tunnel.' },
  { structure: 'Functional cortex', reason: 'Function is not geometry; the same boundary as \'Eloquent cortex\'.' },
  { structure: 'Graft edges', reason: 'Part of a graft that does not exist in reference anatomy.' },
  { structure: 'Graft route', reason: 'A conceptual path drawn for teaching, not shipped geometry.' },
  { structure: 'Graft tissue', reason: 'Transplanted tissue has no counterpart in a reference atlas.' },
  { structure: 'Great vessels', reason: 'Collective wording. Ascending aorta, thoracic aorta and the venae cavae ship individually; no node stands for the group.' },
  { structure: 'Ileum', reason: 'Not shipped. The visceral layer carries Jejunum but no ileum, so the terminal ileum taught in this phase cannot be highlighted.' },
  { structure: 'Ilioinguinal region nerves', reason: 'Not shipped. No ilioinguinal or iliohypogastric nerve node exists in the nervous layer, which is the nerve this phase is about.' },
  { structure: 'Liver parenchyma', reason: 'The shipped liver is subdivided into named lobes, segments and surfaces; there is no single parenchyma node.' },
  { structure: 'Liver surface', reason: 'Shipped only as specific surfaces (\'Diaphragmatic surface of liver\', \'Anterior surface of liver\'), never as one generic surface.' },
  { structure: 'Local vessels', reason: 'Region-dependent wording rather than a named vessel.' },
  { structure: 'Median nerve and branches', reason: 'A collective phrase. \'Median nerve\' on its own does resolve and is listed separately in the preceding phase.' },
  { structure: 'Menisci', reason: 'Not shipped. No meniscal geometry exists in any layer, so the knee scenes cannot show them.' },
  { structure: 'Nerves', reason: 'Generic term; it would otherwise match over two hundred unrelated nerve nodes across the whole body.' },
  { structure: 'Neurovascular bundle', reason: 'Collective wording for a vessel-and-nerve group that is shipped only as its separate members.' },
  { structure: 'Neurovascular structures relevant to the approach', reason: 'Deliberately approach-dependent wording in the shared closure phase; it names no structure and is not meant to.' },
  { structure: 'Operative field', reason: 'The exposed field is an operative concept, not anatomy. Nothing in an atlas can represent it.' },
  { structure: 'PCL', reason: 'An abbreviation, and the posterior cruciate ligament is not shipped in any case; no cruciate geometry exists.' },
  { structure: 'Parathyroid regions', reason: 'The four parathyroid glands are shipped under their own names; \'regions\' is looser wording that matches nothing.' },
  { structure: 'Phrenic nerve regions', reason: 'The phrenic nerve itself is not shipped; only musculophrenic and phrenic arteries and veins exist, which are different structures.' },
  { structure: 'Popliteal neurovascular bundle', reason: 'Collective wording. Popliteal artery and vein are shipped; the tibial and common fibular nerves are not grouped with them.' },
  { structure: 'Popliteal structures', reason: 'Collective wording for the contents of the fossa.' },
  { structure: 'Posterior cortex', reason: 'Refers to the posterior cortical bone of the tibia/femur; the skeletal layer ships whole bones, not cortical shells.' },
  { structure: 'Posterior neurovascular bundle', reason: 'Same collective wording as the popliteal bundle, in the implant phase.' },
  { structure: 'Recipient microvasculature', reason: 'Microvasculature is below the resolution of the shipped meshes; graft take cannot be grounded in geometry.' },
  { structure: 'Recurrent laryngeal nerve', reason: 'Not shipped. This is the structure the whole thyroidectomy safety phase is built around, and no node for it exists in the nervous layer.' },
  { structure: 'Recurrent motor branch', reason: 'Not shipped. The median nerve and its palmar branches exist, but the recurrent motor branch is not named separately.' },
  { structure: 'Right hepatic artery', reason: 'Not shipped. The atlas carries \'Common hepatic artery\' and \'Proper hepatic artery\' only; the right hepatic branch is absent.' },
  { structure: 'Small bowel', reason: 'Collective wording, and the shipped atlas carries only Jejunum from the small intestine.' },
  { structure: 'Superficial palmar structures', reason: 'Collective wording for the palmar soft tissue overlying the release.' },
  { structure: 'Superior laryngeal nerve region', reason: '\'Region\' wording, and the superior laryngeal nerve is not shipped either.' },
  { structure: 'Underlying structures', reason: 'Region-dependent collective wording.' },
  { structure: 'Uterine vessels', reason: 'The uterus is not shipped at all in the visceral layer, and neither are the uterine vessels; the cesarean scenes have no uterine geometry.' },
  { structure: 'Venous sinuses', reason: 'Individual dural sinuses (superior sagittal, transverse, sigmoid, straight) are shipped under their own names; the collective term matches none of them.' },
  { structure: 'Vessels', reason: 'Generic term; matching it would claim grounding over the entire cardiovascular layer.' },
]
