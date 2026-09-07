export type AnatomyStructure = {
  id: string
  label: string
  system: string
  terms: string[]
  landmark: string
}

export type AnatomyRegion = {
  id: string
  order: number
  label: string
  span: string
  structures: AnatomyStructure[]
}

function s(id: string, label: string, system: string, terms: string[], landmark: string): AnatomyStructure {
  return { id, label, system, terms, landmark }
}

export const HEAD_TO_TOE_REGIONS: AnatomyRegion[] = [
  {
    id: 'head-brain', order: 1, label: 'Head · brain', span: 'Scalp → cranial vault → intracranial contents',
    structures: [
      s('scalp', 'Scalp', 'Integument', ['skin', 'head'], 'Five-layer scalp over the cranial vault.'),
      s('skull', 'Cranium / skull', 'Skeletal', ['skull', 'cranium'], 'Bony protection around brain and cranial fossae.'),
      s('frontal-lobe', 'Frontal lobe', 'Nervous', ['brain', 'cerebrum', 'frontal lobe'], 'Anterior cerebral hemisphere; motor, executive and language networks.'),
      s('parietal-lobe', 'Parietal lobe', 'Nervous', ['brain', 'cerebrum', 'parietal lobe'], 'Posterior to central sulcus; somatosensory integration.'),
      s('temporal-lobe', 'Temporal lobe', 'Nervous', ['brain', 'cerebrum', 'temporal lobe'], 'Inferolateral hemisphere; auditory and memory networks.'),
      s('occipital-lobe', 'Occipital lobe', 'Nervous', ['brain', 'cerebrum', 'occipital lobe'], 'Posterior hemisphere; primary visual cortex region.'),
      s('basal-ganglia', 'Basal ganglia', 'Nervous', ['brain', 'basal ganglia'], 'Deep nuclei participating in motor and behavioral loops.'),
      s('thalamus', 'Thalamus', 'Nervous', ['thalamus', 'brain'], 'Paired diencephalic relay adjacent to third ventricle.'),
      s('hypothalamus', 'Hypothalamus', 'Neuroendocrine', ['hypothalamus', 'brain'], 'Inferior diencephalon linking autonomic and endocrine control.'),
      s('brainstem', 'Brainstem', 'Nervous', ['brainstem', 'midbrain', 'pons', 'medulla'], 'Midbrain → pons → medulla between cerebrum and spinal cord.'),
      s('cerebellum', 'Cerebellum', 'Nervous', ['cerebellum', 'brain'], 'Posterior fossa structure for coordination and motor learning.'),
      s('meninges', 'Meninges', 'Nervous', ['meninges', 'dura mater', 'arachnoid mater', 'pia mater'], 'Dura, arachnoid and pia surrounding CNS.'),
      s('ventricles', 'Cerebral ventricles', 'Nervous', ['brain ventricle', 'lateral ventricle', 'third ventricle', 'fourth ventricle'], 'CSF spaces from lateral ventricles through fourth ventricle.'),
      s('pituitary', 'Pituitary gland', 'Endocrine', ['pituitary gland', 'hypophysis'], 'Sellar endocrine gland connected to hypothalamus.'),
    ],
  },
  {
    id: 'face-senses', order: 2, label: 'Face · special senses', span: 'Orbit · ear · nose · oral cavity',
    structures: [
      s('orbit', 'Orbit', 'Regional', ['eye', 'orbit'], 'Bony cavity containing globe, extraocular muscles, nerves and vessels.'),
      s('cornea', 'Cornea', 'Visual', ['cornea', 'eye'], 'Transparent anterior ocular surface.'),
      s('iris', 'Iris', 'Visual', ['iris', 'eye'], 'Pigmented diaphragm controlling pupil diameter.'),
      s('lens', 'Lens', 'Visual', ['lens', 'eye'], 'Biconvex optical element posterior to iris.'),
      s('retina', 'Retina', 'Visual', ['retina', 'eye'], 'Neurosensory layer lining posterior globe.'),
      s('optic-nerve', 'Optic nerve', 'Visual', ['optic nerve', 'eye'], 'CN II from retina toward optic chiasm.'),
      s('external-ear', 'External ear / canal', 'Auditory', ['ear', 'external auditory canal'], 'Auricle and canal conducting sound to tympanic membrane.'),
      s('tympanic-membrane', 'Tympanic membrane', 'Auditory', ['tympanic membrane', 'ear'], 'Boundary between external and middle ear.'),
      s('ossicles', 'Malleus · incus · stapes', 'Auditory', ['malleus', 'incus', 'stapes', 'auditory ossicle'], 'Middle-ear ossicular chain transmitting vibration.'),
      s('cochlea', 'Cochlea', 'Auditory', ['cochlea', 'inner ear'], 'Spiral inner-ear organ for hearing.'),
      s('vestibular', 'Vestibular apparatus', 'Vestibular', ['vestibular apparatus', 'semicircular canal', 'inner ear'], 'Semicircular canals, utricle and saccule for balance.'),
      s('nasal-cavity', 'Nasal cavity', 'Respiratory', ['nasal cavity', 'nose'], 'Airway from nares to choanae with septum and turbinates.'),
      s('paranasal-sinuses', 'Paranasal sinuses', 'Respiratory', ['paranasal sinus', 'maxillary sinus', 'frontal sinus'], 'Air-filled frontal, maxillary, ethmoid and sphenoid spaces.'),
      s('oral-cavity', 'Oral cavity', 'Digestive', ['oral cavity', 'mouth'], 'Lips/cheeks, palate, floor of mouth and dentition compartment.'),
      s('tongue', 'Tongue', 'Digestive / speech', ['tongue'], 'Muscular organ for taste, bolus control and articulation.'),
    ],
  },
  {
    id: 'neck', order: 3, label: 'Neck', span: 'Skull base → thoracic inlet',
    structures: [
      s('cervical-spine', 'Cervical spine C1–C7', 'Skeletal', ['cervical vertebra', 'vertebral column'], 'Seven cervical vertebrae supporting head and enclosing spinal canal.'),
      s('cervical-cord', 'Cervical spinal cord', 'Nervous', ['spinal cord', 'cervical spinal cord'], 'Cord segment within cervical vertebral canal.'),
      s('pharynx', 'Pharynx', 'Aerodigestive', ['pharynx'], 'Nasopharynx, oropharynx and hypopharynx.'),
      s('hyoid', 'Hyoid bone', 'Skeletal', ['hyoid'], 'Suspended U-shaped bone anchoring tongue and laryngeal muscles.'),
      s('larynx', 'Larynx', 'Respiratory / voice', ['larynx', 'vocal fold'], 'Supraglottis, glottis and subglottis protecting airway and generating voice.'),
      s('thyroid', 'Thyroid gland', 'Endocrine', ['thyroid gland', 'thyroid'], 'Bilobed gland anterolateral to upper trachea.'),
      s('parathyroid', 'Parathyroid glands', 'Endocrine', ['parathyroid gland'], 'Usually four small glands on posterior thyroid surface.'),
      s('carotids', 'Carotid arteries', 'Vascular', ['common carotid artery', 'internal carotid artery', 'external carotid artery'], 'Common carotid bifurcation into internal and external branches.'),
      s('jugulars', 'Internal jugular veins', 'Vascular', ['internal jugular vein', 'jugular vein'], 'Major venous drainage running within carotid sheath.'),
      s('neck-trachea', 'Cervical trachea', 'Respiratory', ['trachea'], 'Conducting airway inferior to cricoid cartilage.'),
      s('neck-esophagus', 'Cervical esophagus', 'Digestive', ['esophagus'], 'Posterior to trachea from pharyngoesophageal junction downward.'),
      s('brachial-plexus-roots', 'Brachial plexus roots/trunks', 'Nervous', ['brachial plexus', 'peripheral nerve'], 'C5–T1 neural network crossing lower neck toward upper limb.'),
    ],
  },
  {
    id: 'shoulder-arm', order: 4, label: 'Shoulder · upper arm', span: 'Pectoral girdle → elbow',
    structures: [
      s('clavicle', 'Clavicle', 'Skeletal', ['clavicle'], 'S-shaped strut connecting sternum and scapula.'),
      s('scapula', 'Scapula', 'Skeletal', ['scapula'], 'Posterior shoulder blade with glenoid, acromion and coracoid.'),
      s('glenohumeral', 'Glenohumeral joint', 'Joint', ['shoulder joint', 'glenohumeral joint'], 'Ball-and-socket articulation of humeral head and glenoid.'),
      s('rotator-cuff', 'Rotator cuff', 'Muscular', ['rotator cuff', 'shoulder muscle'], 'Supraspinatus, infraspinatus, teres minor and subscapularis complex.'),
      s('deltoid', 'Deltoid', 'Muscular', ['deltoid muscle', 'skeletal muscle'], 'Superficial shoulder muscle spanning clavicle/scapula to humerus.'),
      s('humerus', 'Humerus', 'Skeletal', ['humerus'], 'Long bone from shoulder to elbow.'),
      s('biceps', 'Biceps brachii', 'Muscular', ['biceps brachii', 'skeletal muscle'], 'Anterior arm flexor/supinator with long and short heads.'),
      s('triceps', 'Triceps brachii', 'Muscular', ['triceps brachii', 'skeletal muscle'], 'Posterior arm elbow extensor.'),
      s('axillary-artery', 'Axillary artery', 'Vascular', ['axillary artery'], 'Continuation of subclavian artery through axilla.'),
      s('brachial-artery', 'Brachial artery', 'Vascular', ['brachial artery'], 'Main arterial trunk of upper arm to cubital fossa.'),
      s('median-nerve-arm', 'Median nerve', 'Nervous', ['median nerve', 'peripheral nerve'], 'Major upper-limb nerve traveling with brachial vessels.'),
      s('ulnar-nerve-arm', 'Ulnar nerve', 'Nervous', ['ulnar nerve', 'peripheral nerve'], 'Medial arm nerve passing posterior to medial epicondyle.'),
      s('radial-nerve-arm', 'Radial nerve', 'Nervous', ['radial nerve', 'peripheral nerve'], 'Posterior cord continuation traversing radial groove.'),
    ],
  },
  {
    id: 'forearm-hand', order: 5, label: 'Elbow · forearm · hand', span: 'Elbow → fingertips',
    structures: [
      s('elbow', 'Elbow joint', 'Joint', ['elbow joint'], 'Humeroulnar, humeroradial and proximal radioulnar articulations.'),
      s('radius', 'Radius', 'Skeletal', ['radius bone', 'radius'], 'Lateral forearm bone articulating strongly with wrist.'),
      s('ulna', 'Ulna', 'Skeletal', ['ulna'], 'Medial forearm bone forming olecranon and trochlear notch.'),
      s('forearm-flexors', 'Forearm flexor compartment', 'Muscular', ['forearm muscle', 'flexor muscle'], 'Anterior compartment controlling wrist/finger flexion and pronation.'),
      s('forearm-extensors', 'Forearm extensor compartment', 'Muscular', ['forearm muscle', 'extensor muscle'], 'Posterior compartment controlling wrist/finger extension and supination.'),
      s('radial-artery', 'Radial artery', 'Vascular', ['radial artery'], 'Lateral terminal branch of brachial artery.'),
      s('ulnar-artery', 'Ulnar artery', 'Vascular', ['ulnar artery'], 'Medial terminal branch contributing to superficial palmar arch.'),
      s('median-nerve', 'Median nerve / carpal tunnel', 'Nervous', ['median nerve', 'carpal tunnel'], 'Median nerve entering hand beneath flexor retinaculum.'),
      s('ulnar-nerve', 'Ulnar nerve at wrist', 'Nervous', ['ulnar nerve'], 'Ulnar neurovascular bundle entering hand near Guyon canal.'),
      s('wrist', 'Wrist joint', 'Joint', ['wrist joint', 'radiocarpal joint'], 'Radiocarpal and midcarpal articulations.'),
      s('carpals', 'Carpal bones', 'Skeletal', ['carpal bone', 'wrist'], 'Eight carpal bones in proximal and distal rows.'),
      s('metacarpals', 'Metacarpals', 'Skeletal', ['metacarpal bone', 'hand'], 'Five metacarpal bones between carpus and digits.'),
      s('hand-phalanges', 'Finger phalanges', 'Skeletal', ['phalanx of hand', 'finger'], 'Digital bones from proximal to distal phalanges.'),
      s('flexor-tendons', 'Digital flexor tendons', 'Tendon', ['flexor tendon', 'hand tendon'], 'FDS/FDP tendon system passing through flexor sheaths.'),
    ],
  },
  {
    id: 'thorax', order: 6, label: 'Thorax', span: 'Thoracic inlet → diaphragm',
    structures: [
      s('ribs', 'Ribs', 'Skeletal', ['rib'], 'Twelve paired ribs forming the thoracic cage.'),
      s('sternum', 'Sternum', 'Skeletal', ['sternum'], 'Manubrium, body and xiphoid in anterior thoracic wall.'),
      s('thoracic-spine', 'Thoracic spine T1–T12', 'Skeletal', ['thoracic vertebra', 'vertebral column'], 'Thoracic vertebrae articulating with ribs.'),
      s('pleura', 'Pleura', 'Respiratory', ['pleura', 'lung'], 'Visceral and parietal serous layers around lungs.'),
      s('right-lung', 'Right lung', 'Respiratory', ['right lung', 'lung'], 'Three lobes: upper, middle and lower.'),
      s('left-lung', 'Left lung', 'Respiratory', ['left lung', 'lung'], 'Two lobes with cardiac notch and lingula.'),
      s('main-bronchi', 'Main bronchi', 'Respiratory', ['main bronchus', 'bronchus'], 'Right and left main bronchi distal to carina.'),
      s('right-atrium', 'Right atrium', 'Cardiovascular', ['right atrium', 'heart'], 'Receives systemic venous return from venae cavae and coronary sinus.'),
      s('tricuspid', 'Tricuspid valve', 'Cardiovascular', ['tricuspid valve', 'heart valve'], 'Right atrioventricular valve.'),
      s('right-ventricle', 'Right ventricle', 'Cardiovascular', ['right ventricle', 'heart'], 'Pumps blood through pulmonary valve to pulmonary trunk.'),
      s('pulmonary-valve', 'Pulmonary valve', 'Cardiovascular', ['pulmonary valve', 'heart valve'], 'Semilunar valve between RV outflow and pulmonary trunk.'),
      s('left-atrium', 'Left atrium', 'Cardiovascular', ['left atrium', 'heart'], 'Receives pulmonary venous return.'),
      s('mitral', 'Mitral valve', 'Cardiovascular', ['mitral valve', 'heart valve'], 'Left atrioventricular valve.'),
      s('left-ventricle', 'Left ventricle', 'Cardiovascular', ['left ventricle', 'heart'], 'Thick-walled systemic pump ejecting into aorta.'),
      s('aortic-valve', 'Aortic valve', 'Cardiovascular', ['aortic valve', 'heart valve'], 'Semilunar valve between LV and ascending aorta.'),
      s('coronaries', 'Coronary arteries', 'Vascular', ['coronary artery', 'right coronary artery', 'left coronary artery'], 'Epicardial arteries supplying myocardium.'),
      s('thoracic-aorta', 'Thoracic aorta', 'Vascular', ['aorta', 'thoracic aorta'], 'Ascending aorta, arch and descending thoracic aorta.'),
      s('pulmonary-vessels', 'Pulmonary arteries & veins', 'Vascular', ['pulmonary artery', 'pulmonary vein'], 'Pulmonary circulation between heart and lungs.'),
      s('venae-cavae', 'Superior & inferior vena cava', 'Vascular', ['superior vena cava', 'inferior vena cava'], 'Major systemic veins entering right atrium.'),
      s('thoracic-esophagus', 'Thoracic esophagus', 'Digestive', ['esophagus'], 'Posterior mediastinal conduit to stomach.'),
      s('diaphragm', 'Diaphragm', 'Respiratory / muscular', ['diaphragm'], 'Primary inspiratory muscle separating thorax and abdomen.'),
    ],
  },
  {
    id: 'abdomen', order: 7, label: 'Abdomen · retroperitoneum', span: 'Diaphragm → pelvic brim',
    structures: [
      s('liver', 'Liver', 'Hepatobiliary', ['liver'], 'Large right-upper-quadrant organ beneath diaphragm.'),
      s('gallbladder', 'Gallbladder', 'Hepatobiliary', ['gallbladder'], 'Bile reservoir on inferior liver surface.'),
      s('bile-duct', 'Biliary tree / common bile duct', 'Hepatobiliary', ['bile duct', 'common bile duct'], 'Intrahepatic and extrahepatic ducts conveying bile.'),
      s('portal-vein', 'Portal vein', 'Vascular', ['portal vein', 'hepatic portal vein'], 'Carries splanchnic venous blood to liver.'),
      s('stomach', 'Stomach', 'Digestive', ['stomach'], 'Cardia, fundus, body, antrum and pylorus.'),
      s('duodenum', 'Duodenum', 'Digestive', ['duodenum'], 'First small-bowel segment wrapping pancreatic head.'),
      s('pancreas', 'Pancreas', 'Digestive / endocrine', ['pancreas'], 'Head, uncinate process, neck, body and tail.'),
      s('spleen', 'Spleen', 'Immune / hematologic', ['spleen'], 'Left upper quadrant lymphoid organ.'),
      s('jejunum', 'Jejunum', 'Digestive', ['jejunum', 'small intestine'], 'Proximal mobile small bowel after duodenum.'),
      s('ileum', 'Ileum', 'Digestive', ['ileum', 'small intestine'], 'Distal small bowel ending at ileocecal valve.'),
      s('cecum-appendix', 'Cecum & appendix', 'Digestive', ['cecum', 'appendix'], 'Right-lower-quadrant beginning of large bowel and vermiform appendix.'),
      s('colon', 'Colon', 'Digestive', ['colon', 'ascending colon', 'transverse colon', 'descending colon', 'sigmoid colon'], 'Ascending, transverse, descending and sigmoid large bowel.'),
      s('right-kidney', 'Right kidney', 'Renal', ['right kidney', 'kidney'], 'Retroperitoneal filtration organ; typically slightly lower than left.'),
      s('left-kidney', 'Left kidney', 'Renal', ['left kidney', 'kidney'], 'Retroperitoneal filtration organ.'),
      s('adrenals', 'Adrenal glands', 'Endocrine', ['adrenal gland'], 'Suprarenal endocrine glands above kidneys.'),
      s('ureters', 'Ureters', 'Urinary', ['ureter'], 'Muscular tubes carrying urine from renal pelvis to bladder.'),
      s('abdominal-aorta', 'Abdominal aorta', 'Vascular', ['abdominal aorta', 'aorta'], 'Aorta from diaphragm to common iliac bifurcation.'),
      s('abdominal-ivc', 'Inferior vena cava', 'Vascular', ['inferior vena cava'], 'Major retroperitoneal vein returning blood to right atrium.'),
    ],
  },
  {
    id: 'pelvis', order: 8, label: 'Pelvis · perineum', span: 'Pelvic brim → perineal outlet',
    structures: [
      s('pelvic-bones', 'Pelvic ring', 'Skeletal', ['pelvis', 'hip bone', 'sacrum'], 'Paired hip bones with sacrum forming bony pelvis.'),
      s('sacroiliac', 'Sacroiliac joints', 'Joint', ['sacroiliac joint', 'sacrum'], 'Load-transferring joints between sacrum and ilia.'),
      s('bladder', 'Urinary bladder', 'Urinary', ['urinary bladder', 'bladder'], 'Pelvic urine reservoir posterior to pubic symphysis.'),
      s('pelvic-urethra', 'Urethra', 'Urinary', ['urethra'], 'Outflow tract from bladder neck to external meatus.'),
      s('rectum', 'Rectum', 'Digestive', ['rectum'], 'Terminal large-bowel segment within pelvis.'),
      s('pelvic-floor', 'Pelvic floor', 'Muscular', ['pelvic floor', 'levator ani'], 'Levator ani/coccygeus support pelvic viscera and continence.'),
      s('uterus', 'Uterus', 'Female reproductive', ['uterus'], 'Fundus, body and cervix between bladder and rectum.'),
      s('ovaries', 'Ovaries', 'Female reproductive', ['ovary'], 'Paired gonads along lateral pelvic walls.'),
      s('uterine-tubes', 'Uterine / fallopian tubes', 'Female reproductive', ['fallopian tube', 'uterine tube'], 'Fimbria, ampulla, isthmus and intramural segments.'),
      s('vagina', 'Vagina', 'Female reproductive', ['vagina'], 'Fibromuscular canal from cervix to vestibule.'),
      s('prostate', 'Prostate', 'Male reproductive', ['prostate'], 'Gland surrounding proximal male urethra below bladder.'),
      s('seminal-vesicles', 'Seminal vesicles', 'Male reproductive', ['seminal vesicle'], 'Paired glands posterior to bladder.'),
      s('testes', 'Testes', 'Male reproductive', ['testis', 'testicle'], 'Paired gonads within scrotum.'),
      s('penis', 'Penile erectile structures', 'Male reproductive', ['penis', 'corpus cavernosum'], 'Corpora cavernosa and corpus spongiosum surrounding urethra.'),
    ],
  },
  {
    id: 'hip-thigh', order: 9, label: 'Hip · thigh', span: 'Acetabulum → distal femur',
    structures: [
      s('hip-joint', 'Hip joint', 'Joint', ['hip joint'], 'Ball-and-socket articulation of femoral head and acetabulum.'),
      s('femoral-head-neck', 'Femoral head & neck', 'Skeletal', ['femur', 'femoral head'], 'Proximal femur connecting hip joint to shaft.'),
      s('femur', 'Femoral shaft', 'Skeletal', ['femur'], 'Longest bone from hip to knee.'),
      s('gluteals', 'Gluteal muscles', 'Muscular', ['gluteus maximus', 'gluteus medius', 'skeletal muscle'], 'Posterolateral hip extensors/abductors.'),
      s('iliopsoas', 'Iliopsoas', 'Muscular', ['iliopsoas', 'psoas major'], 'Primary deep hip flexor crossing anterior hip.'),
      s('adductors', 'Hip adductor compartment', 'Muscular', ['adductor muscle', 'thigh muscle'], 'Medial thigh muscles controlling adduction.'),
      s('quadriceps', 'Quadriceps', 'Muscular', ['quadriceps femoris', 'thigh muscle'], 'Anterior thigh knee extensor group.'),
      s('hamstrings', 'Hamstrings', 'Muscular', ['hamstring', 'thigh muscle'], 'Posterior thigh hip extensors and knee flexors.'),
      s('femoral-nerve', 'Femoral nerve', 'Nervous', ['femoral nerve', 'peripheral nerve'], 'Lumbar plexus nerve entering anterior thigh beneath inguinal ligament.'),
      s('sciatic-nerve', 'Sciatic nerve', 'Nervous', ['sciatic nerve', 'peripheral nerve'], 'Large lumbosacral nerve traversing posterior thigh.'),
      s('femoral-artery', 'Femoral artery', 'Vascular', ['femoral artery'], 'Main arterial supply of lower limb through femoral triangle.'),
      s('femoral-vein', 'Femoral vein', 'Vascular', ['femoral vein'], 'Major deep venous return accompanying femoral artery.'),
    ],
  },
  {
    id: 'knee-leg', order: 10, label: 'Knee · leg', span: 'Distal femur → ankle mortise',
    structures: [
      s('patella', 'Patella', 'Skeletal', ['patella'], 'Sesamoid bone embedded in quadriceps mechanism.'),
      s('knee-joint', 'Knee joint', 'Joint', ['knee joint'], 'Tibiofemoral and patellofemoral articulations.'),
      s('acl', 'Anterior cruciate ligament', 'Ligament', ['anterior cruciate ligament', 'ACL'], 'Intra-articular stabilizer limiting anterior tibial translation.'),
      s('pcl', 'Posterior cruciate ligament', 'Ligament', ['posterior cruciate ligament', 'PCL'], 'Intra-articular stabilizer limiting posterior tibial translation.'),
      s('mcl', 'Medial collateral ligament', 'Ligament', ['medial collateral ligament', 'knee ligament'], 'Medial stabilizer resisting valgus stress.'),
      s('lcl', 'Lateral collateral ligament', 'Ligament', ['lateral collateral ligament', 'knee ligament'], 'Lateral stabilizer resisting varus stress.'),
      s('menisci', 'Medial & lateral menisci', 'Fibrocartilage', ['meniscus', 'knee meniscus'], 'Fibrocartilage wedges distributing tibiofemoral load.'),
      s('tibia', 'Tibia', 'Skeletal', ['tibia'], 'Medial weight-bearing long bone of leg.'),
      s('fibula', 'Fibula', 'Skeletal', ['fibula'], 'Lateral long bone providing ankle and muscle attachments.'),
      s('gastrocnemius-soleus', 'Gastrocnemius–soleus complex', 'Muscular', ['gastrocnemius', 'soleus', 'calf muscle'], 'Posterior calf plantar-flexor complex.'),
      s('tibialis-anterior', 'Tibialis anterior', 'Muscular', ['tibialis anterior', 'leg muscle'], 'Anterior compartment dorsiflexor/invertor.'),
      s('fibularis', 'Fibularis / peroneal muscles', 'Muscular', ['fibularis muscle', 'peroneus muscle'], 'Lateral compartment evertors.'),
      s('popliteal-artery', 'Popliteal artery', 'Vascular', ['popliteal artery'], 'Continuation of femoral artery behind knee.'),
      s('anterior-tibial', 'Anterior tibial artery', 'Vascular', ['anterior tibial artery'], 'Anterior leg artery continuing as dorsalis pedis.'),
      s('posterior-tibial', 'Posterior tibial artery', 'Vascular', ['posterior tibial artery'], 'Posterior leg artery passing behind medial malleolus.'),
      s('tibial-nerve', 'Tibial nerve', 'Nervous', ['tibial nerve'], 'Sciatic division through posterior knee/leg toward tarsal tunnel.'),
      s('common-fibular-nerve', 'Common fibular nerve', 'Nervous', ['common fibular nerve', 'peroneal nerve'], 'Sciatic division wrapping fibular neck before deep/superficial branches.'),
    ],
  },
  {
    id: 'ankle-foot', order: 11, label: 'Ankle · foot', span: 'Malleoli → toes',
    structures: [
      s('ankle-joint', 'Ankle / talocrural joint', 'Joint', ['ankle joint', 'talocrural joint'], 'Tibia/fibula mortise articulating with talus.'),
      s('talus', 'Talus', 'Skeletal', ['talus'], 'Tarsal bone transmitting load from tibia to hindfoot.'),
      s('calcaneus', 'Calcaneus', 'Skeletal', ['calcaneus'], 'Heel bone and Achilles insertion site.'),
      s('navicular', 'Navicular', 'Skeletal', ['navicular bone', 'foot'], 'Medial midfoot bone between talus and cuneiforms.'),
      s('cuboid', 'Cuboid', 'Skeletal', ['cuboid bone', 'foot'], 'Lateral midfoot tarsal bone.'),
      s('cuneiforms', 'Cuneiform bones', 'Skeletal', ['cuneiform bone', 'foot'], 'Medial, intermediate and lateral cuneiforms.'),
      s('metatarsals', 'Metatarsals', 'Skeletal', ['metatarsal bone', 'foot'], 'Five long bones forming forefoot rays.'),
      s('toe-phalanges', 'Toe phalanges', 'Skeletal', ['phalanx of foot', 'toe'], 'Digital bones of hallux and lesser toes.'),
      s('achilles', 'Achilles tendon', 'Tendon', ['Achilles tendon', 'calcaneal tendon'], 'Conjoined gastrocnemius–soleus tendon inserting on calcaneus.'),
      s('plantar-fascia', 'Plantar fascia', 'Fascia', ['plantar fascia', 'foot'], 'Dense plantar aponeurosis supporting longitudinal arch.'),
      s('dorsalis-pedis', 'Dorsalis pedis artery', 'Vascular', ['dorsalis pedis artery'], 'Continuation of anterior tibial artery on dorsum of foot.'),
      s('tarsal-tunnel', 'Tarsal tunnel / tibial nerve', 'Nervous', ['tibial nerve', 'ankle'], 'Posteromedial ankle passage beneath flexor retinaculum.'),
      s('plantar-nerves', 'Medial & lateral plantar nerves', 'Nervous', ['plantar nerve', 'tibial nerve'], 'Terminal tibial-nerve branches supplying plantar foot.'),
      s('intrinsic-foot', 'Intrinsic foot muscles', 'Muscular', ['foot muscle', 'skeletal muscle'], 'Short muscles stabilizing toes and arches.'),
    ],
  },
]

export const HEAD_TO_TOE_STRUCTURES = HEAD_TO_TOE_REGIONS.flatMap((region) => region.structures)

export function findHeadToToeStructure(id: string) {
  return HEAD_TO_TOE_STRUCTURES.find((item) => item.id === id)
}

export function findHeadToToeRegionForStructure(id: string) {
  return HEAD_TO_TOE_REGIONS.find((region) => region.structures.some((item) => item.id === id))
}
