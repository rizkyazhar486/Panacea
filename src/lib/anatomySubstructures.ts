export type AnatomySubstructure = {
  id: string
  label: string
  group: string
  terms: string[]
  relation: string
}

function d(id: string, label: string, group: string, terms: string[], relation: string): AnatomySubstructure {
  return { id, label, group, terms, relation }
}

const DETAILS: Record<string, AnatomySubstructure[]> = {
  skull: [
    d('frontal-bone', 'Frontal bone', 'Cranial bones', ['frontal bone'], 'Anterior calvarium and orbital roof.'),
    d('parietal-bone', 'Parietal bones', 'Cranial bones', ['parietal bone'], 'Paired superolateral calvarial bones.'),
    d('temporal-bone', 'Temporal bones', 'Cranial bones', ['temporal bone'], 'Lateral skull base containing petrous temporal structures.'),
    d('occipital-bone', 'Occipital bone', 'Cranial bones', ['occipital bone'], 'Posterior skull base surrounding the foramen magnum.'),
    d('sphenoid-bone', 'Sphenoid', 'Cranial bones', ['sphenoid bone'], 'Central skull-base bone containing the sella turcica.'),
    d('ethmoid-bone', 'Ethmoid', 'Cranial bones', ['ethmoid bone'], 'Anterior skull-base bone contributing to nasal cavity and medial orbit.'),
  ],
  'basal-ganglia': [
    d('caudate', 'Caudate nucleus', 'Deep nuclei', ['caudate nucleus'], 'Curved nucleus adjacent to lateral ventricle.'),
    d('putamen', 'Putamen', 'Deep nuclei', ['putamen'], 'Lateral striatal nucleus.'),
    d('globus-pallidus', 'Globus pallidus', 'Deep nuclei', ['globus pallidus'], 'Medial lentiform nucleus with internal and external segments.'),
    d('subthalamic', 'Subthalamic nucleus', 'Deep nuclei', ['subthalamic nucleus'], 'Small diencephalic nucleus inferior to thalamus.'),
    d('substantia-nigra', 'Substantia nigra', 'Deep nuclei', ['substantia nigra'], 'Midbrain nucleus within basal-ganglia circuitry.'),
  ],
  brainstem: [
    d('midbrain', 'Midbrain', 'Brainstem levels', ['midbrain'], 'Superior brainstem between diencephalon and pons.'),
    d('pons', 'Pons', 'Brainstem levels', ['pons'], 'Middle brainstem anterior to cerebellum.'),
    d('medulla', 'Medulla oblongata', 'Brainstem levels', ['medulla oblongata'], 'Inferior brainstem continuous with spinal cord.'),
    d('cerebral-peduncles', 'Cerebral peduncles', 'Surface landmarks', ['cerebral peduncle'], 'Paired ventral midbrain fiber bundles.'),
    d('medullary-pyramids', 'Medullary pyramids', 'Surface landmarks', ['medullary pyramid'], 'Ventral medullary corticospinal tracts.'),
  ],
  ventricles: [
    d('lateral-ventricles', 'Lateral ventricles', 'CSF spaces', ['lateral ventricle'], 'Paired C-shaped ventricular cavities within cerebral hemispheres.'),
    d('third-ventricle', 'Third ventricle', 'CSF spaces', ['third ventricle'], 'Midline diencephalic ventricle.'),
    d('aqueduct', 'Cerebral aqueduct', 'CSF spaces', ['cerebral aqueduct'], 'Narrow midbrain channel connecting third and fourth ventricles.'),
    d('fourth-ventricle', 'Fourth ventricle', 'CSF spaces', ['fourth ventricle'], 'CSF cavity between pons/medulla and cerebellum.'),
    d('choroid-plexus', 'Choroid plexus', 'CSF spaces', ['choroid plexus'], 'Vascular epithelial tissue projecting into ventricular spaces.'),
  ],
  orbit: [
    d('eyeball', 'Eyeball / globe', 'Orbital contents', ['eyeball', 'eye'], 'Globe occupying the anterior orbit.'),
    d('optic-nerve-orbit', 'Intraorbital optic nerve', 'Orbital contents', ['optic nerve'], 'CN II segment from posterior globe toward optic canal.'),
    d('orbital-fat', 'Orbital fat', 'Orbital contents', ['orbital fat'], 'Fat compartments surrounding globe, muscles and neurovascular structures.'),
    d('lacrimal-orbit', 'Lacrimal gland', 'Orbital contents', ['lacrimal gland'], 'Superolateral orbital gland.'),
    d('extraocular-orbit', 'Extraocular muscle cone', 'Orbital contents', ['extraocular muscle'], 'Rectus and oblique muscles controlling ocular position.'),
  ],
  cornea: [
    d('corneal-epithelium', 'Corneal epithelium', 'Corneal layers', ['corneal epithelium'], 'Anterior epithelial surface.'),
    d('bowman-layer', 'Bowman layer', 'Corneal layers', ['Bowman membrane', 'anterior limiting lamina of cornea'], 'Acellular anterior stromal boundary.'),
    d('corneal-stroma', 'Corneal stroma', 'Corneal layers', ['corneal stroma'], 'Major transparent connective-tissue thickness of cornea.'),
    d('descemet', 'Descemet membrane', 'Corneal layers', ['Descemet membrane', 'posterior limiting lamina of cornea'], 'Basement membrane immediately anterior to corneal endothelium.'),
    d('corneal-endothelium', 'Corneal endothelium', 'Corneal layers', ['corneal endothelium'], 'Posterior monolayer facing anterior chamber.'),
  ],
  retina: [
    d('optic-disc-detail', 'Optic disc', 'Retinal landmarks', ['optic disc'], 'Exit site for ganglion-cell axons and central retinal vessels.'),
    d('macula-detail', 'Macula lutea', 'Retinal landmarks', ['macula lutea'], 'Central retinal specialization.'),
    d('fovea-detail', 'Fovea centralis', 'Retinal landmarks', ['fovea centralis'], 'Central macular specialization for highest acuity.'),
    d('ora-serrata-detail', 'Ora serrata', 'Retinal landmarks', ['ora serrata'], 'Anterior boundary of photosensitive retina.'),
    d('retinal-vessels', 'Central retinal vessels', 'Retinal landmarks', ['central retinal artery', 'central retinal vein'], 'Vessels traversing optic nerve and retinal surface.'),
  ],
  cochlea: [
    d('cochlear-base', 'Basal turn', 'Cochlear geometry', ['basal turn of cochlea', 'cochlea'], 'Proximal turn near oval and round windows.'),
    d('cochlear-middle', 'Middle turn', 'Cochlear geometry', ['middle turn of cochlea', 'cochlea'], 'Intermediate spiral turn.'),
    d('cochlear-apex', 'Apex / helicotrema region', 'Cochlear geometry', ['apex of cochlea', 'helicotrema'], 'Apical cochlear region.'),
    d('scala-vestibuli', 'Scala vestibuli', 'Cochlear spaces', ['scala vestibuli'], 'Perilymphatic compartment beginning near oval window.'),
    d('scala-tympani', 'Scala tympani', 'Cochlear spaces', ['scala tympani'], 'Perilymphatic compartment ending near round window.'),
  ],
  vestibular: [
    d('utricle', 'Utricle', 'Vestibular organs', ['utricle'], 'Larger vestibular sac receiving semicircular ducts.'),
    d('saccule', 'Saccule', 'Vestibular organs', ['saccule'], 'Smaller vestibular sac adjacent to cochlea.'),
    d('superior-canal', 'Superior semicircular canal', 'Semicircular canals', ['superior semicircular canal'], 'Anterior/superior canal of vestibular labyrinth.'),
    d('posterior-canal', 'Posterior semicircular canal', 'Semicircular canals', ['posterior semicircular canal'], 'Posterior vertical canal.'),
    d('lateral-canal', 'Lateral semicircular canal', 'Semicircular canals', ['lateral semicircular canal'], 'Horizontal/lateral canal.'),
  ],
  larynx: [
    d('thyroid-cartilage', 'Thyroid cartilage', 'Laryngeal framework', ['thyroid cartilage'], 'Largest laryngeal cartilage forming anterior/lateral walls.'),
    d('cricoid-cartilage', 'Cricoid cartilage', 'Laryngeal framework', ['cricoid cartilage'], 'Complete cartilage ring inferior to thyroid cartilage.'),
    d('arytenoids', 'Arytenoid cartilages', 'Laryngeal framework', ['arytenoid cartilage'], 'Paired posterior cartilages anchoring vocal folds.'),
    d('epiglottis', 'Epiglottis', 'Laryngeal framework', ['epiglottis'], 'Elastic cartilage leaf forming anterior laryngeal inlet boundary.'),
    d('true-vocal-folds', 'True vocal folds', 'Laryngeal soft tissue', ['vocal fold', 'true vocal cord'], 'Paired folds forming the glottic sound source.'),
    d('false-vocal-folds', 'Vestibular / false folds', 'Laryngeal soft tissue', ['vestibular fold', 'false vocal cord'], 'Paired folds superior to true vocal folds.'),
  ],
  thyroid: [
    d('thyroid-right-lobe', 'Right thyroid lobe', 'Gland anatomy', ['right lobe of thyroid gland'], 'Right lateral thyroid lobe.'),
    d('thyroid-left-lobe', 'Left thyroid lobe', 'Gland anatomy', ['left lobe of thyroid gland'], 'Left lateral thyroid lobe.'),
    d('thyroid-isthmus', 'Thyroid isthmus', 'Gland anatomy', ['isthmus of thyroid gland'], 'Bridge of thyroid tissue crossing anterior trachea.'),
    d('superior-thyroid-vessels', 'Superior thyroid vessels', 'Vascular relations', ['superior thyroid artery', 'superior thyroid vein'], 'Superior pole vascular supply/drainage.'),
    d('inferior-thyroid-vessels', 'Inferior thyroid vessels', 'Vascular relations', ['inferior thyroid artery', 'inferior thyroid vein'], 'Inferior/posterior thyroid vascular supply/drainage.'),
  ],
  'brachial-plexus-roots': [
    d('plexus-roots', 'Roots C5–T1', 'Brachial plexus', ['brachial plexus root'], 'Anterior rami contributing to plexus.'),
    d('plexus-trunks', 'Upper · middle · lower trunks', 'Brachial plexus', ['brachial plexus trunk'], 'Three trunks formed in posterior triangle.'),
    d('plexus-divisions', 'Anterior & posterior divisions', 'Brachial plexus', ['brachial plexus division'], 'Six divisions passing behind clavicle.'),
    d('plexus-cords', 'Lateral · posterior · medial cords', 'Brachial plexus', ['brachial plexus cord'], 'Cords named around axillary artery.'),
    d('plexus-terminal', 'Terminal branches', 'Brachial plexus', ['median nerve', 'ulnar nerve', 'radial nerve', 'axillary nerve', 'musculocutaneous nerve'], 'Major terminal branches entering upper limb.'),
  ],
  glenohumeral: [
    d('humeral-head', 'Humeral head', 'Articular surfaces', ['head of humerus'], 'Convex proximal humeral articular surface.'),
    d('glenoid', 'Glenoid cavity', 'Articular surfaces', ['glenoid cavity', 'glenoid'], 'Shallow scapular socket.'),
    d('glenoid-labrum', 'Glenoid labrum', 'Stabilizers', ['glenoid labrum'], 'Fibrocartilaginous rim deepening glenoid.'),
    d('gh-capsule', 'Joint capsule', 'Stabilizers', ['shoulder joint capsule'], 'Fibrous capsule surrounding glenohumeral joint.'),
    d('gh-ligaments', 'Glenohumeral ligaments', 'Stabilizers', ['superior glenohumeral ligament', 'middle glenohumeral ligament', 'inferior glenohumeral ligament'], 'Capsular ligament complex reinforcing anterior/inferior joint.'),
    d('coracohumeral', 'Coracohumeral ligament', 'Stabilizers', ['coracohumeral ligament'], 'Superior capsule reinforcement from coracoid to humerus.'),
  ],
  elbow: [
    d('humeroulnar', 'Humeroulnar articulation', 'Joint compartments', ['humeroulnar joint'], 'Trochlea articulating with trochlear notch.'),
    d('humeroradial', 'Humeroradial articulation', 'Joint compartments', ['humeroradial joint'], 'Capitellum articulating with radial head.'),
    d('prox-radioulnar', 'Proximal radioulnar joint', 'Joint compartments', ['proximal radioulnar joint'], 'Radial head rotating within annular ligament.'),
    d('ulnar-collateral', 'Ulnar collateral ligament', 'Ligaments', ['ulnar collateral ligament of elbow'], 'Medial elbow stabilizer.'),
    d('radial-collateral', 'Radial collateral ligament complex', 'Ligaments', ['radial collateral ligament of elbow'], 'Lateral ligament complex.'),
    d('annular-ligament', 'Annular ligament', 'Ligaments', ['annular ligament of radius'], 'Ring-like ligament stabilizing radial head.'),
  ],
  wrist: [
    d('radiocarpal', 'Radiocarpal joint', 'Joint compartments', ['radiocarpal joint'], 'Distal radius/TFCC articulating with proximal carpal row.'),
    d('distal-radioulnar', 'Distal radioulnar joint', 'Joint compartments', ['distal radioulnar joint'], 'Distal radius-ulna articulation supporting pronation/supination.'),
    d('tfcc', 'Triangular fibrocartilage complex', 'Stabilizers', ['triangular fibrocartilage complex'], 'Ulnar-sided wrist stabilizing complex.'),
    d('scapholunate', 'Scapholunate ligament', 'Stabilizers', ['scapholunate ligament'], 'Intrinsic ligament between scaphoid and lunate.'),
    d('flexor-retinaculum', 'Flexor retinaculum', 'Stabilizers', ['flexor retinaculum'], 'Fibrous roof of carpal tunnel.'),
  ],
  carpals: [
    d('scaphoid', 'Scaphoid', 'Proximal row', ['scaphoid bone'], 'Radial proximal-row carpal.'),
    d('lunate', 'Lunate', 'Proximal row', ['lunate bone'], 'Central proximal-row carpal.'),
    d('triquetrum', 'Triquetrum', 'Proximal row', ['triquetrum bone'], 'Ulnar proximal-row carpal.'),
    d('pisiform', 'Pisiform', 'Proximal row', ['pisiform bone'], 'Sesamoid carpal in flexor carpi ulnaris tendon.'),
    d('trapezium', 'Trapezium', 'Distal row', ['trapezium bone'], 'Radial distal-row carpal articulating with thumb metacarpal.'),
    d('trapezoid', 'Trapezoid', 'Distal row', ['trapezoid bone'], 'Second distal-row carpal.'),
    d('capitate', 'Capitate', 'Distal row', ['capitate bone'], 'Largest central distal-row carpal.'),
    d('hamate', 'Hamate', 'Distal row', ['hamate bone'], 'Ulnar distal-row carpal with hook process.'),
  ],
  'right-lung': [
    d('rul', 'Right upper lobe', 'Lobes', ['right upper lobe of lung'], 'Superior right-lung lobe.'),
    d('rml', 'Right middle lobe', 'Lobes', ['right middle lobe of lung'], 'Anterior right-lung lobe between horizontal and oblique fissures.'),
    d('rll', 'Right lower lobe', 'Lobes', ['right lower lobe of lung'], 'Inferior/posterior right-lung lobe.'),
    d('right-fissures', 'Horizontal & oblique fissures', 'Lobes', ['horizontal fissure of right lung', 'oblique fissure of right lung'], 'Fissures separating right-lung lobes.'),
    d('right-hilum', 'Right pulmonary hilum', 'Hilum', ['hilum of right lung'], 'Root region containing bronchus, pulmonary vessels, lymphatics and nerves.'),
  ],
  'left-lung': [
    d('lul', 'Left upper lobe', 'Lobes', ['left upper lobe of lung'], 'Superior left-lung lobe including lingula.'),
    d('lll', 'Left lower lobe', 'Lobes', ['left lower lobe of lung'], 'Inferior/posterior left-lung lobe.'),
    d('lingula', 'Lingula', 'Lobes', ['lingula of left lung'], 'Tongue-like projection of left upper lobe.'),
    d('left-fissure', 'Oblique fissure', 'Lobes', ['oblique fissure of left lung'], 'Fissure separating left upper and lower lobes.'),
    d('left-hilum', 'Left pulmonary hilum', 'Hilum', ['hilum of left lung'], 'Root region containing bronchus, pulmonary vessels, lymphatics and nerves.'),
  ],
  'right-ventricle': [
    d('rv-free-wall', 'Right ventricular free wall', 'Chamber anatomy', ['right ventricular wall'], 'Anterior/right ventricular myocardium.'),
    d('rv-trabeculae', 'Trabeculae carneae', 'Chamber anatomy', ['trabeculae carneae', 'right ventricle'], 'Irregular muscular ridges lining ventricle.'),
    d('rv-papillary', 'Papillary muscles', 'Subvalvular apparatus', ['papillary muscle', 'right ventricle'], 'Muscles anchoring tricuspid chordae.'),
    d('rv-outflow', 'RV outflow tract / infundibulum', 'Outflow', ['right ventricular outflow tract', 'infundibulum of right ventricle'], 'Smooth outflow pathway toward pulmonary valve.'),
  ],
  'left-ventricle': [
    d('lv-free-wall', 'Left ventricular free wall', 'Chamber anatomy', ['left ventricular wall'], 'Thick systemic-pump myocardium.'),
    d('lv-papillary', 'Anterolateral & posteromedial papillary muscles', 'Subvalvular apparatus', ['papillary muscle', 'left ventricle'], 'Papillary muscles anchoring mitral chordae.'),
    d('lv-chordae', 'Mitral chordae tendineae', 'Subvalvular apparatus', ['chordae tendineae', 'mitral valve'], 'Fibrous cords connecting papillary muscles to mitral leaflets.'),
    d('lv-outflow', 'LV outflow tract', 'Outflow', ['left ventricular outflow tract'], 'Subaortic outflow pathway toward aortic valve.'),
  ],
  coronaries: [
    d('left-main', 'Left main coronary artery', 'Left coronary tree', ['left main coronary artery', 'left coronary artery'], 'Short main stem from left aortic sinus.'),
    d('lad', 'LAD / anterior interventricular artery', 'Left coronary tree', ['left anterior descending artery', 'anterior interventricular artery'], 'Anterior interventricular-groove artery.'),
    d('lcx', 'Circumflex artery', 'Left coronary tree', ['circumflex coronary artery'], 'Left atrioventricular-groove branch.'),
    d('rca', 'Right coronary artery', 'Right coronary tree', ['right coronary artery'], 'Right atrioventricular-groove artery.'),
    d('pda', 'Posterior descending artery', 'Right/left dominance branch', ['posterior interventricular artery', 'posterior descending artery'], 'Posterior interventricular-groove artery.'),
  ],
  liver: [
    d('right-hepatic-lobe', 'Right lobe', 'Gross lobes', ['right lobe of liver'], 'Large right hepatic lobe.'),
    d('left-hepatic-lobe', 'Left lobe', 'Gross lobes', ['left lobe of liver'], 'Left hepatic lobe across falciform plane.'),
    d('caudate-lobe', 'Caudate lobe', 'Gross lobes', ['caudate lobe of liver'], 'Posterior-superior lobe adjacent to IVC.'),
    d('quadrate-lobe', 'Quadrate lobe', 'Gross lobes', ['quadrate lobe of liver'], 'Inferior visceral-surface lobe.'),
    d('porta-hepatis', 'Porta hepatis', 'Hepatic hilum', ['porta hepatis'], 'Transverse fissure carrying portal vein, hepatic artery and bile ducts.'),
    d('hepatic-veins-detail', 'Right · middle · left hepatic veins', 'Venous drainage', ['right hepatic vein', 'middle hepatic vein', 'left hepatic vein'], 'Major hepatic venous outflow to IVC.'),
  ],
  stomach: [
    d('gastric-cardia', 'Cardia', 'Stomach regions', ['cardia of stomach'], 'Region around gastroesophageal junction.'),
    d('gastric-fundus', 'Fundus', 'Stomach regions', ['fundus of stomach'], 'Dome superior to cardia.'),
    d('gastric-body', 'Body', 'Stomach regions', ['body of stomach'], 'Largest central stomach region.'),
    d('gastric-antrum', 'Pyloric antrum', 'Stomach regions', ['pyloric antrum'], 'Distal widening before pyloric canal.'),
    d('gastric-pylorus', 'Pylorus', 'Stomach regions', ['pylorus'], 'Distal gastric outlet into duodenum.'),
    d('gastric-curvatures', 'Greater & lesser curvatures', 'Surface landmarks', ['greater curvature of stomach', 'lesser curvature of stomach'], 'Convex lateral/inferior and concave medial/superior borders.'),
  ],
  pancreas: [
    d('pancreatic-head', 'Head', 'Pancreatic regions', ['head of pancreas'], 'Broad right-sided part within duodenal curve.'),
    d('uncinate', 'Uncinate process', 'Pancreatic regions', ['uncinate process of pancreas'], 'Hook-like projection posterior to superior mesenteric vessels.'),
    d('pancreatic-neck', 'Neck', 'Pancreatic regions', ['neck of pancreas'], 'Short segment anterior to portal-vein formation.'),
    d('pancreatic-body', 'Body', 'Pancreatic regions', ['body of pancreas'], 'Central elongated segment crossing posterior abdominal wall.'),
    d('pancreatic-tail', 'Tail', 'Pancreatic regions', ['tail of pancreas'], 'Leftward end approaching splenic hilum.'),
    d('main-pancreatic-duct', 'Main pancreatic duct', 'Ductal anatomy', ['main pancreatic duct', 'duct of Wirsung'], 'Main exocrine duct traversing gland.'),
  ],
  'right-kidney': [
    d('right-renal-capsule', 'Renal capsule', 'Gross kidney layers', ['renal capsule', 'right kidney'], 'Fibrous covering of kidney.'),
    d('right-renal-cortex', 'Renal cortex', 'Gross kidney layers', ['renal cortex', 'right kidney'], 'Outer parenchymal zone.'),
    d('right-renal-medulla', 'Renal medulla / pyramids', 'Gross kidney layers', ['renal medulla', 'renal pyramid', 'right kidney'], 'Inner pyramidal parenchyma.'),
    d('right-minor-calyces', 'Minor calyces', 'Collecting system', ['minor renal calyx', 'right kidney'], 'Cup-shaped spaces receiving renal papillae.'),
    d('right-major-calyces', 'Major calyces', 'Collecting system', ['major renal calyx', 'right kidney'], 'Larger channels receiving groups of minor calyces.'),
    d('right-renal-pelvis', 'Renal pelvis', 'Collecting system', ['renal pelvis', 'right kidney'], 'Funnel-shaped proximal ureteric collecting space.'),
    d('right-hilum', 'Renal hilum', 'Hilum', ['renal hilum', 'right kidney'], 'Medial gateway for vessels, nerves and renal pelvis.'),
  ],
  'left-kidney': [
    d('left-renal-capsule', 'Renal capsule', 'Gross kidney layers', ['renal capsule', 'left kidney'], 'Fibrous covering of kidney.'),
    d('left-renal-cortex', 'Renal cortex', 'Gross kidney layers', ['renal cortex', 'left kidney'], 'Outer parenchymal zone.'),
    d('left-renal-medulla', 'Renal medulla / pyramids', 'Gross kidney layers', ['renal medulla', 'renal pyramid', 'left kidney'], 'Inner pyramidal parenchyma.'),
    d('left-minor-calyces', 'Minor calyces', 'Collecting system', ['minor renal calyx', 'left kidney'], 'Cup-shaped spaces receiving renal papillae.'),
    d('left-major-calyces', 'Major calyces', 'Collecting system', ['major renal calyx', 'left kidney'], 'Larger channels receiving groups of minor calyces.'),
    d('left-renal-pelvis', 'Renal pelvis', 'Collecting system', ['renal pelvis', 'left kidney'], 'Funnel-shaped proximal ureteric collecting space.'),
    d('left-hilum', 'Renal hilum', 'Hilum', ['renal hilum', 'left kidney'], 'Medial gateway for vessels, nerves and renal pelvis.'),
  ],
  colon: [
    d('ascending-colon', 'Ascending colon', 'Colon segments', ['ascending colon'], 'Right-sided colon from cecum to hepatic flexure.'),
    d('hepatic-flexure', 'Hepatic flexure', 'Colon segments', ['right colic flexure', 'hepatic flexure'], 'Junction of ascending and transverse colon.'),
    d('transverse-colon', 'Transverse colon', 'Colon segments', ['transverse colon'], 'Intraperitoneal colon crossing upper abdomen.'),
    d('splenic-flexure', 'Splenic flexure', 'Colon segments', ['left colic flexure', 'splenic flexure'], 'Junction of transverse and descending colon.'),
    d('descending-colon', 'Descending colon', 'Colon segments', ['descending colon'], 'Left-sided retroperitoneal colon.'),
    d('sigmoid-colon', 'Sigmoid colon', 'Colon segments', ['sigmoid colon'], 'Mobile S-shaped distal colon entering rectum.'),
  ],
  uterus: [
    d('uterine-fundus', 'Fundus', 'Uterine regions', ['fundus of uterus'], 'Rounded superior uterus above tubal ostia.'),
    d('uterine-body', 'Body', 'Uterine regions', ['body of uterus'], 'Main central uterine portion.'),
    d('uterine-isthmus', 'Isthmus', 'Uterine regions', ['isthmus of uterus'], 'Narrow transition between body and cervix.'),
    d('uterine-cervix', 'Cervix', 'Uterine regions', ['uterine cervix'], 'Inferior cylindrical uterine segment.'),
    d('uterine-cavity', 'Uterine cavity', 'Internal spaces', ['uterine cavity'], 'Potential central cavity communicating with tubes and cervical canal.'),
  ],
  prostate: [
    d('prostate-peripheral', 'Peripheral zone', 'Prostate zones', ['peripheral zone of prostate'], 'Posterolateral glandular zone.'),
    d('prostate-transition', 'Transition zone', 'Prostate zones', ['transition zone of prostate'], 'Periurethral zone commonly enlarged in BPH.'),
    d('prostate-central', 'Central zone', 'Prostate zones', ['central zone of prostate'], 'Glandular region surrounding ejaculatory ducts.'),
    d('prostatic-urethra', 'Prostatic urethra', 'Ductal relations', ['prostatic urethra'], 'Urethral segment traversing prostate.'),
    d('ejaculatory-ducts', 'Ejaculatory ducts', 'Ductal relations', ['ejaculatory duct'], 'Paired ducts entering prostatic urethra.'),
  ],
  'hip-joint': [
    d('femoral-head-detail', 'Femoral head', 'Articular surfaces', ['head of femur'], 'Spherical proximal femoral articular surface.'),
    d('acetabulum-detail', 'Acetabulum', 'Articular surfaces', ['acetabulum'], 'Cup-shaped pelvic socket.'),
    d('hip-labrum', 'Acetabular labrum', 'Stabilizers', ['acetabular labrum'], 'Fibrocartilaginous rim deepening socket.'),
    d('hip-capsule', 'Hip joint capsule', 'Stabilizers', ['hip joint capsule'], 'Strong fibrous capsule surrounding joint.'),
    d('iliofemoral', 'Iliofemoral ligament', 'Stabilizers', ['iliofemoral ligament'], 'Strong anterior capsular ligament.'),
    d('pubofemoral', 'Pubofemoral ligament', 'Stabilizers', ['pubofemoral ligament'], 'Anteroinferior capsular ligament.'),
    d('ischiofemoral', 'Ischiofemoral ligament', 'Stabilizers', ['ischiofemoral ligament'], 'Posterior capsular ligament.'),
  ],
  'knee-joint': [
    d('medial-femoral-condyle', 'Medial femoral condyle', 'Articular surfaces', ['medial condyle of femur'], 'Medial distal-femoral articular surface.'),
    d('lateral-femoral-condyle', 'Lateral femoral condyle', 'Articular surfaces', ['lateral condyle of femur'], 'Lateral distal-femoral articular surface.'),
    d('medial-tibial-plateau', 'Medial tibial plateau', 'Articular surfaces', ['medial condyle of tibia'], 'Medial proximal-tibial articular surface.'),
    d('lateral-tibial-plateau', 'Lateral tibial plateau', 'Articular surfaces', ['lateral condyle of tibia'], 'Lateral proximal-tibial articular surface.'),
    d('knee-medial-meniscus', 'Medial meniscus', 'Menisci', ['medial meniscus'], 'C-shaped medial fibrocartilage meniscus.'),
    d('knee-lateral-meniscus', 'Lateral meniscus', 'Menisci', ['lateral meniscus'], 'More circular lateral fibrocartilage meniscus.'),
    d('knee-acl', 'ACL', 'Ligaments', ['anterior cruciate ligament'], 'Anterior cruciate ligament.'),
    d('knee-pcl', 'PCL', 'Ligaments', ['posterior cruciate ligament'], 'Posterior cruciate ligament.'),
    d('knee-mcl', 'MCL', 'Ligaments', ['medial collateral ligament of knee'], 'Medial collateral ligament.'),
    d('knee-lcl', 'LCL', 'Ligaments', ['lateral collateral ligament of knee'], 'Lateral collateral ligament.'),
    d('patellofemoral', 'Patellofemoral articulation', 'Articular surfaces', ['patellofemoral joint'], 'Patella articulating with femoral trochlea.'),
  ],
  'ankle-joint': [
    d('medial-malleolus', 'Medial malleolus', 'Bony mortise', ['medial malleolus'], 'Distal tibial medial projection.'),
    d('lateral-malleolus', 'Lateral malleolus', 'Bony mortise', ['lateral malleolus'], 'Distal fibular lateral projection.'),
    d('talar-dome', 'Talar trochlea / dome', 'Articular surfaces', ['trochlea of talus', 'talar dome'], 'Superior talar articular surface within ankle mortise.'),
    d('ankle-atfl', 'Anterior talofibular ligament', 'Lateral ligaments', ['anterior talofibular ligament'], 'Anterior component of lateral ankle ligament complex.'),
    d('ankle-cfl', 'Calcaneofibular ligament', 'Lateral ligaments', ['calcaneofibular ligament'], 'Lateral ligament spanning fibula to calcaneus.'),
    d('ankle-ptfl', 'Posterior talofibular ligament', 'Lateral ligaments', ['posterior talofibular ligament'], 'Posterior lateral ankle ligament.'),
    d('ankle-deltoid', 'Deltoid ligament', 'Medial ligaments', ['deltoid ligament'], 'Strong medial ligament complex.'),
  ],
  'lumbar-spine': [
    d('l1', 'L1 vertebra', 'Lumbar vertebrae', ['first lumbar vertebra', 'L1 vertebra'], 'Uppermost lumbar vertebra.'),
    d('l2', 'L2 vertebra', 'Lumbar vertebrae', ['second lumbar vertebra', 'L2 vertebra'], 'Second lumbar vertebra.'),
    d('l3', 'L3 vertebra', 'Lumbar vertebrae', ['third lumbar vertebra', 'L3 vertebra'], 'Third lumbar vertebra.'),
    d('l4', 'L4 vertebra', 'Lumbar vertebrae', ['fourth lumbar vertebra', 'L4 vertebra'], 'Fourth lumbar vertebra.'),
    d('l5', 'L5 vertebra', 'Lumbar vertebrae', ['fifth lumbar vertebra', 'L5 vertebra'], 'Lowest lumbar vertebra.'),
  ],
  'lumbar-discs': [
    d('l1-l2-disc', 'L1–L2 disc', 'Disc levels', ['L1-L2 intervertebral disc', 'lumbar intervertebral disc'], 'Disc between L1 and L2.'),
    d('l2-l3-disc', 'L2–L3 disc', 'Disc levels', ['L2-L3 intervertebral disc', 'lumbar intervertebral disc'], 'Disc between L2 and L3.'),
    d('l3-l4-disc', 'L3–L4 disc', 'Disc levels', ['L3-L4 intervertebral disc', 'lumbar intervertebral disc'], 'Disc between L3 and L4.'),
    d('l4-l5-disc', 'L4–L5 disc', 'Disc levels', ['L4-L5 intervertebral disc', 'lumbar intervertebral disc'], 'Disc between L4 and L5.'),
    d('l5-s1-disc', 'L5–S1 disc', 'Disc levels', ['L5-S1 intervertebral disc', 'lumbosacral intervertebral disc'], 'Disc between L5 and sacrum.'),
  ],
  'cauda-equina': [
    d('lumbar-roots', 'Lumbar nerve roots', 'Cauda equina', ['lumbar spinal nerve root'], 'Lumbar roots descending toward lumbar foramina.'),
    d('sacral-roots', 'Sacral nerve roots', 'Cauda equina', ['sacral spinal nerve root'], 'Sacral roots descending within the thecal sac.'),
    d('filum-terminale', 'Filum terminale', 'Cauda equina', ['filum terminale'], 'Fibrous extension anchoring distal spinal cord coverings.'),
    d('dural-sac', 'Dural / thecal sac', 'Cauda equina', ['dural sac', 'thecal sac'], 'Meningeal sleeve containing CSF and cauda equina roots.'),
  ],
}

export function getAnatomySubstructures(parentId: string) {
  return DETAILS[parentId] ?? []
}

export function countAnatomySubstructures() {
  return Object.values(DETAILS).reduce((sum, items) => sum + items.length, 0)
}
