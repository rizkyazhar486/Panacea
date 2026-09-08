export interface CoupledKinematicsNote {
  motionId: string
  title: string
  primaryMotion: string
  coupledMotion: string
  structures: string[]
  interpretation: string
  source: string
}

export const COUPLED_KINEMATICS: CoupledKinematicsNote[] = [
  {
    motionId: 'knee-flexion-extension',
    title: 'Tibiofemoral roll–glide + axial rotation',
    primaryMotion: 'Flexion / extension is accompanied by translation of the femoral condyles relative to the tibial plateau.',
    coupledMotion: 'Near terminal extension the tibia normally externally rotates relative to the femur (or the femur internally rotates on a fixed tibia): the screw-home mechanism.',
    structures: ['medial and lateral femoral condyles', 'tibial plateau', 'ACL', 'PCL', 'menisci'],
    interpretation: 'Do not render the knee as a pure hinge. The exact amount and timing of coupled rotation varies with task and subject.',
    source: 'Kim HY et al. Clin Orthop Surg. 2015;7:303-309. PMID 26330951.',
  },
  {
    motionId: 'shoulder-abduction-adduction',
    title: 'Glenohumeral + scapulothoracic coupling',
    primaryMotion: 'Arm elevation includes glenohumeral abduction/elevation.',
    coupledMotion: 'The scapula upwardly rotates on the thoracic wall while the clavicle and acromioclavicular joint contribute to the shoulder-complex motion.',
    structures: ['humeral head', 'glenoid', 'scapula', 'clavicle', 'serratus anterior', 'trapezius'],
    interpretation: 'No fixed 2:1 scapulohumeral ratio is imposed because the contribution changes across the arc, task and individual.',
    source: 'Standard shoulder-complex biomechanics; display is qualitative rather than patient-specific.',
  },
  {
    motionId: 'forearm-pronation-supination',
    title: 'Radius rotates around ulna',
    primaryMotion: 'Pronation/supination occurs across both proximal and distal radioulnar joints.',
    coupledMotion: 'During pronation the radius crosses anteriorly over the ulna; during supination the radius and ulna become more nearly parallel.',
    structures: ['radius', 'ulna', 'proximal radioulnar joint', 'distal radioulnar joint', 'interosseous membrane'],
    interpretation: 'This is forearm rotation, not wrist rotation, and should not be visualized as the hand rotating independently of the radius.',
    source: 'Standard functional anatomy of the radioulnar complex.',
  },
  {
    motionId: 'hip-abduction-adduction',
    title: 'Femur-on-pelvis vs pelvis-on-femur',
    primaryMotion: 'Open-chain abduction moves the femur relative to the pelvis.',
    coupledMotion: 'In single-leg stance the clinically relevant counterpart is pelvic control over the stance femur, with the hip abductors countering the external pelvic-drop moment.',
    structures: ['femoral head', 'acetabulum', 'gluteus medius', 'gluteus minimus', 'pelvis'],
    interpretation: 'The atlas does not estimate abductor force or joint-contact force because that requires subject-specific geometry, kinematics and external-force data.',
    source: 'Classical hip biomechanics; external moment concepts only, not inverse dynamics.',
  },
  {
    motionId: 'cervical-rotation',
    title: 'Upper cervical + subaxial contribution',
    primaryMotion: 'Axial head/neck rotation is distributed across multiple cervical motion segments.',
    coupledMotion: 'C1–C2 contributes substantially to axial rotation while subaxial facets contribute additional coupled motion.',
    structures: ['atlas (C1)', 'axis (C2)', 'subaxial cervical facets', 'alar ligaments'],
    interpretation: 'Do not rotate the entire cervical spine as one rigid cylinder around a single anatomical axis.',
    source: 'Standard cervical functional anatomy; qualitative whole-neck teaching model.',
  },
]

export function coupledKinematicsFor(motionId: string) {
  return COUPLED_KINEMATICS.find((item) => item.motionId === motionId)
}
