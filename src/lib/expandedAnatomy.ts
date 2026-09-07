import {
  HEAD_TO_TOE_REGIONS as BASE_REGIONS,
  type AnatomyRegion,
  type AnatomyStructure,
} from './headToToeAnatomy'

function s(id: string, label: string, system: string, terms: string[], landmark: string): AnatomyStructure {
  return { id, label, system, terms, landmark }
}

const EXTRA_BY_REGION: Record<string, AnatomyStructure[]> = {
  'head-brain': [
    s('corpus-callosum', 'Corpus callosum', 'Nervous', ['corpus callosum', 'brain'], 'Major commissural white-matter tract connecting cerebral hemispheres.'),
    s('hippocampus', 'Hippocampus', 'Nervous', ['hippocampus', 'brain'], 'Medial temporal structure important for memory circuitry.'),
    s('amygdala', 'Amygdala', 'Nervous', ['amygdala', 'brain'], 'Deep temporal nuclear complex participating in salience and affective networks.'),
    s('internal-capsule', 'Internal capsule', 'Nervous', ['internal capsule', 'brain'], 'Compact projection-fiber pathway between deep nuclei and cortex.'),
    s('circle-of-willis', 'Circle of Willis / cerebral arteries', 'Vascular', ['cerebral artery', 'circle of Willis', 'brain artery'], 'Anterior and posterior cerebral arterial circulation at the brain base.'),
    s('dural-sinuses', 'Dural venous sinuses', 'Vascular', ['dural venous sinus', 'superior sagittal sinus'], 'Venous channels between dural layers draining toward internal jugular veins.'),
  ],
  'face-senses': [
    s('sclera', 'Sclera', 'Visual', ['sclera'], 'Dense fibrous outer coat forming most of the globe wall.'),
    s('conjunctiva', 'Conjunctiva', 'Visual', ['conjunctiva'], 'Mucosal surface lining eyelids and reflecting onto anterior sclera.'),
    s('ciliary-body', 'Ciliary body', 'Visual', ['ciliary body'], 'Anterior uveal structure connecting iris and choroid and supporting the lens apparatus.'),
    s('choroid', 'Choroid', 'Visual', ['choroid'], 'Vascular uveal layer between sclera and retina.'),
    s('macula-fovea', 'Macula · fovea', 'Visual', ['macula lutea', 'fovea centralis'], 'Central retinal specializations for high-acuity vision.'),
    s('optic-chiasm', 'Optic chiasm', 'Visual / nervous', ['optic chiasm'], 'Midline partial decussation of optic nerve fibers.'),
    s('extraocular-muscles', 'Extraocular muscles', 'Muscular / visual', ['extraocular muscle', 'ocular muscle'], 'Rectus and oblique muscles controlling globe position.'),
    s('lacrimal-gland', 'Lacrimal gland', 'Lacrimal', ['lacrimal gland'], 'Superolateral orbital gland producing the aqueous tear component.'),
    s('auditory-tube', 'Auditory / Eustachian tube', 'Auditory', ['auditory tube', 'eustachian tube'], 'Connection from middle ear to nasopharynx for pressure equilibration.'),
    s('major-salivary', 'Major salivary glands', 'Digestive', ['parotid gland', 'submandibular gland', 'sublingual gland'], 'Parotid, submandibular and sublingual glands surrounding oral cavity.'),
    s('dentition', 'Teeth / dentition', 'Digestive / dental', ['tooth', 'dentition'], 'Maxillary and mandibular teeth forming the dental arches.'),
  ],
  neck: [
    s('sternocleidomastoid', 'Sternocleidomastoid', 'Muscular', ['sternocleidomastoid muscle'], 'Superficial neck muscle from sternum/clavicle to mastoid process.'),
    s('scalenes', 'Scalene muscles', 'Muscular', ['scalene muscle'], 'Deep lateral neck muscles surrounding the interscalene brachial-plexus interval.'),
    s('vagus-neck', 'Vagus nerve', 'Nervous', ['vagus nerve', 'cranial nerve X'], 'Cranial nerve X descending within the carotid sheath toward thorax and abdomen.'),
    s('cervical-sympathetic', 'Cervical sympathetic trunk', 'Autonomic', ['sympathetic trunk', 'cervical sympathetic trunk'], 'Paired paravertebral autonomic chain posterior to the carotid sheath.'),
    s('vertebral-artery', 'Vertebral arteries', 'Vascular', ['vertebral artery'], 'Subclavian branches ascending through cervical transverse foramina toward posterior circulation.'),
    s('cervical-lymph-nodes', 'Cervical lymph-node chains', 'Lymphatic', ['cervical lymph node', 'deep cervical lymph node'], 'Superficial and deep nodal chains along jugular and posterior-triangle pathways.'),
  ],
  'shoulder-arm': [
    s('axillary-nerve', 'Axillary nerve', 'Nervous', ['axillary nerve'], 'Posterior-cord branch crossing the quadrangular space around the surgical neck of humerus.'),
    s('musculocutaneous-nerve', 'Musculocutaneous nerve', 'Nervous', ['musculocutaneous nerve'], 'Lateral-cord branch traversing anterior arm and continuing as lateral cutaneous nerve of forearm.'),
    s('cephalic-vein', 'Cephalic vein', 'Vascular', ['cephalic vein'], 'Superficial lateral upper-limb vein entering the deltopectoral groove.'),
    s('basilic-vein', 'Basilic vein', 'Vascular', ['basilic vein'], 'Superficial medial upper-limb vein joining deep brachial veins proximally.'),
  ],
  'forearm-hand': [
    s('palmar-arches', 'Superficial & deep palmar arches', 'Vascular', ['superficial palmar arch', 'deep palmar arch'], 'Arterial arches supplying palm and digital vessels.'),
    s('thenar-muscles', 'Thenar muscles', 'Muscular', ['thenar muscle', 'hand muscle'], 'Thumb intrinsic-muscle group at the radial palm.'),
    s('hypothenar-muscles', 'Hypothenar muscles', 'Muscular', ['hypothenar muscle', 'hand muscle'], 'Little-finger intrinsic-muscle group at the ulnar palm.'),
    s('digital-nerves', 'Common & proper digital nerves', 'Nervous', ['digital nerve', 'hand nerve'], 'Terminal median/ulnar sensory and motor branches distributed to the digits.'),
  ],
  thorax: [
    s('pericardium', 'Pericardium', 'Cardiovascular', ['pericardium'], 'Fibrous and serous sac surrounding the heart and proximal great vessels.'),
    s('interventricular-septum', 'Interventricular septum', 'Cardiovascular', ['interventricular septum', 'heart'], 'Muscular and membranous wall separating right and left ventricles.'),
    s('papillary-chordae', 'Papillary muscles & chordae tendineae', 'Cardiovascular', ['papillary muscle', 'chordae tendineae'], 'Subvalvular apparatus stabilizing atrioventricular valve leaflets.'),
    s('cardiac-conduction', 'Cardiac conduction system', 'Cardiovascular', ['sinoatrial node', 'atrioventricular node', 'bundle of His'], 'Specialized impulse-conduction pathway from sinoatrial node through His–Purkinje system.'),
    s('segmental-bronchi', 'Lobar & segmental bronchi', 'Respiratory', ['lobar bronchus', 'segmental bronchus'], 'Intrathoracic airway branches supplying lung lobes and bronchopulmonary segments.'),
    s('mediastinum', 'Mediastinum', 'Regional', ['mediastinum'], 'Central thoracic compartment containing heart, great vessels, trachea, esophagus and nerves.'),
    s('thoracic-duct', 'Thoracic duct', 'Lymphatic', ['thoracic duct'], 'Major lymphatic channel ascending through posterior mediastinum toward the left venous angle.'),
  ],
  abdomen: [
    s('peritoneum', 'Peritoneum', 'Serosal', ['peritoneum'], 'Parietal and visceral serous lining of the abdominopelvic cavity.'),
    s('mesentery', 'Mesentery', 'Digestive / vascular', ['mesentery'], 'Peritoneal fold suspending mobile bowel and carrying vessels, nerves and lymphatics.'),
    s('hepatic-artery', 'Hepatic artery', 'Vascular', ['hepatic artery'], 'Arterial inflow to liver within the hepatoduodenal ligament.'),
    s('hepatic-veins', 'Hepatic veins', 'Vascular', ['hepatic vein'], 'Venous outflow from liver directly into inferior vena cava.'),
    s('celiac-trunk', 'Celiac trunk', 'Vascular', ['celiac artery', 'celiac trunk'], 'Major foregut arterial trunk supplying stomach, liver, spleen and proximal duodenum.'),
    s('superior-mesenteric', 'Superior mesenteric artery', 'Vascular', ['superior mesenteric artery'], 'Arterial supply to midgut structures from distal duodenum to proximal colon.'),
    s('inferior-mesenteric', 'Inferior mesenteric artery', 'Vascular', ['inferior mesenteric artery'], 'Arterial supply to distal colon and upper rectum.'),
    s('renal-vessels', 'Renal arteries & veins', 'Vascular', ['renal artery', 'renal vein'], 'Paired vessels connecting kidneys to aorta and inferior vena cava.'),
  ],
  pelvis: [
    s('iliac-vessels', 'Common / internal / external iliac vessels', 'Vascular', ['common iliac artery', 'internal iliac artery', 'external iliac artery'], 'Major pelvic arterial and venous trunks linking abdomen, pelvic viscera and lower limbs.'),
    s('pudendal-neurovascular', 'Pudendal nerve & internal pudendal vessels', 'Nervous / vascular', ['pudendal nerve', 'internal pudendal artery'], 'Neurovascular bundle supplying much of perineum and external genital structures.'),
    s('cervix', 'Cervix', 'Female reproductive', ['uterine cervix', 'cervix'], 'Inferior cylindrical portion of uterus projecting into the vagina.'),
    s('epididymis', 'Epididymis', 'Male reproductive', ['epididymis'], 'Coiled duct along posterior testis connecting efferent ductules to vas deferens.'),
    s('vas-deferens', 'Vas deferens', 'Male reproductive', ['ductus deferens', 'vas deferens'], 'Muscular sperm-conducting duct from epididymis through inguinal canal to ejaculatory duct.'),
  ],
  'hip-thigh': [
    s('acetabular-labrum', 'Acetabular labrum', 'Fibrocartilage', ['acetabular labrum', 'hip joint'], 'Fibrocartilaginous rim deepening the acetabulum.'),
    s('iliotibial-band', 'Iliotibial band', 'Fascia', ['iliotibial tract', 'iliotibial band'], 'Lateral fascial reinforcement from iliac crest toward proximal tibia.'),
    s('profunda-femoris', 'Profunda femoris artery', 'Vascular', ['deep femoral artery', 'profunda femoris artery'], 'Deep arterial branch supplying thigh compartments.'),
    s('obturator-nerve', 'Obturator nerve', 'Nervous', ['obturator nerve'], 'Lumbar-plexus nerve traversing obturator canal into medial thigh.'),
  ],
  'knee-leg': [
    s('quadriceps-tendon', 'Quadriceps tendon', 'Tendon', ['quadriceps tendon'], 'Common quadriceps tendon inserting on superior patella.'),
    s('patellar-tendon', 'Patellar tendon / ligament', 'Tendon', ['patellar ligament', 'patellar tendon'], 'Continuation of extensor mechanism from patella to tibial tuberosity.'),
    s('knee-cartilage', 'Knee articular cartilage', 'Cartilage', ['articular cartilage', 'knee joint'], 'Hyaline cartilage covering femoral condyles, tibial plateaus and patellar articular surface.'),
    s('great-saphenous', 'Great saphenous vein', 'Vascular', ['great saphenous vein'], 'Long superficial vein ascending medial leg and thigh to saphenofemoral junction.'),
  ],
  'ankle-foot': [
    s('subtalar-joint', 'Subtalar joint', 'Joint', ['subtalar joint', 'talocalcaneal joint'], 'Articulation between talus and calcaneus contributing to inversion/eversion mechanics.'),
    s('lateral-ankle-ligaments', 'ATFL · CFL · PTFL', 'Ligament', ['anterior talofibular ligament', 'calcaneofibular ligament', 'posterior talofibular ligament'], 'Lateral ankle ligament complex stabilizing talocrural and subtalar regions.'),
    s('deltoid-ligament', 'Deltoid ligament', 'Ligament', ['deltoid ligament', 'medial collateral ligament of ankle'], 'Strong medial ankle ligament complex from medial malleolus to talus, calcaneus and navicular.'),
    s('deep-fibular-nerve', 'Deep fibular nerve', 'Nervous', ['deep fibular nerve', 'deep peroneal nerve'], 'Anterior-compartment nerve continuing onto dorsum of foot.'),
    s('superficial-fibular-nerve', 'Superficial fibular nerve', 'Nervous', ['superficial fibular nerve', 'superficial peroneal nerve'], 'Lateral-compartment nerve becoming cutaneous over distal anterolateral leg and dorsum of foot.'),
    s('plantar-arteries', 'Medial & lateral plantar arteries', 'Vascular', ['medial plantar artery', 'lateral plantar artery'], 'Posterior tibial terminal branches supplying plantar foot and plantar arch.'),
  ],
}

const BACK_SPINE_REGION: AnatomyRegion = {
  id: 'back-spine',
  order: 7,
  label: 'Back · lumbar spine',
  span: 'Thoracolumbar junction → sacrum · spinal canal → paraspinal layers',
  structures: [
    s('lumbar-spine', 'Lumbar spine L1–L5', 'Skeletal', ['lumbar vertebra', 'lumbar spine'], 'Five lumbar vertebrae transmitting axial load between thorax and pelvis.'),
    s('lumbar-discs', 'Lumbar intervertebral discs', 'Fibrocartilage', ['intervertebral disc', 'lumbar intervertebral disc'], 'Discs between lumbar vertebral bodies with annulus fibrosus surrounding nucleus pulposus.'),
    s('lumbar-facets', 'Lumbar facet joints', 'Joint', ['zygapophysial joint', 'facet joint', 'lumbar spine'], 'Paired posterior synovial joints guiding and constraining lumbar motion.'),
    s('lumbar-canal', 'Lumbar spinal canal', 'Nervous / skeletal', ['vertebral canal', 'lumbar spinal canal'], 'Bony-ligamentous canal containing distal neural elements and meninges.'),
    s('conus-medullaris', 'Conus medullaris', 'Nervous', ['conus medullaris', 'spinal cord'], 'Tapered distal spinal cord, typically near the upper lumbar vertebral level in adults.'),
    s('cauda-equina', 'Cauda equina', 'Nervous', ['cauda equina', 'spinal nerve root'], 'Lumbar, sacral and coccygeal nerve roots descending below the conus.'),
    s('lumbar-plexus', 'Lumbar plexus', 'Nervous', ['lumbar plexus'], 'Anterior rami network within posterior abdominal wall giving rise to major lower-limb nerves.'),
    s('erector-spinae', 'Erector spinae', 'Muscular', ['erector spinae muscle'], 'Longitudinal iliocostalis, longissimus and spinalis muscle columns.'),
    s('multifidus', 'Multifidus', 'Muscular', ['multifidus muscle'], 'Deep transversospinal muscle spanning adjacent vertebral levels.'),
    s('thoracolumbar-fascia', 'Thoracolumbar fascia', 'Fascia', ['thoracolumbar fascia'], 'Layered fascial complex enclosing deep back muscles and linking trunk musculature.'),
    s('sacrum-coccyx', 'Sacrum & coccyx', 'Skeletal', ['sacrum', 'coccyx'], 'Fused sacral vertebrae and coccyx forming the posterior pelvic wall.'),
    s('spinal-nerve-roots', 'Spinal nerve roots', 'Nervous', ['spinal nerve root', 'dorsal root', 'ventral root'], 'Paired sensory and motor roots leaving the spinal cord/cauda equina toward intervertebral foramina.'),
  ],
}

const enhancedBase = BASE_REGIONS.map<AnatomyRegion>((region) => ({
  ...region,
  order: region.order >= 7 ? region.order + 1 : region.order,
  structures: [...region.structures, ...(EXTRA_BY_REGION[region.id] ?? [])],
}))

export const HEAD_TO_TOE_REGIONS: AnatomyRegion[] = [...enhancedBase, BACK_SPINE_REGION].sort((a, b) => a.order - b.order)
export const HEAD_TO_TOE_STRUCTURES = HEAD_TO_TOE_REGIONS.flatMap((region) => region.structures)

export function findHeadToToeStructure(id: string) {
  return HEAD_TO_TOE_STRUCTURES.find((item) => item.id === id)
}

export function findHeadToToeRegionForStructure(id: string) {
  return HEAD_TO_TOE_REGIONS.find((region) => region.structures.some((item) => item.id === id))
}

export type { AnatomyRegion, AnatomyStructure } from './headToToeAnatomy'
