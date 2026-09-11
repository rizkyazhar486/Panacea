import type { AtlasRegionKey } from './wholeBodyAtlasBlueprint'

export type JointPlane = 'sagittal' | 'frontal' | 'transverse' | 'scapular' | 'multiplanar'
export type JointAxis = 'mediolateral' | 'anteroposterior' | 'longitudinal' | 'oblique' | 'coupled'

export interface JointMotionProfile {
  id: string
  label: string
  plane: JointPlane
  axis: JointAxis
  minDeg: number
  maxDeg: number
  neutralDeg: number
  negativeLabel: string
  positiveLabel: string
  drivers: string[]
  opposers: string[]
  passiveRestraints: string[]
  structureHints: string[]
  teachingNote: string
}

export interface WholeBodyJointProfile {
  id: string
  label: string
  region: AtlasRegionKey
  sourceGeometry: 'native-geometry' | 'adjacent-geometry'
  nodeHints: string[]
  motions: JointMotionProfile[]
}

export type MotionExcursionState = 'neutral' | 'mid-range' | 'near-end-range'

export function clampJointAngle(motion: JointMotionProfile, angleDeg: number) {
  return Math.min(motion.maxDeg, Math.max(motion.minDeg, angleDeg))
}

export function normalizedJointExcursion(motion: JointMotionProfile, angleDeg: number) {
  const clamped = clampJointAngle(motion, angleDeg)
  const negativeSpan = Math.max(1, Math.abs(motion.neutralDeg - motion.minDeg))
  const positiveSpan = Math.max(1, Math.abs(motion.maxDeg - motion.neutralDeg))
  const span = clamped < motion.neutralDeg ? negativeSpan : positiveSpan
  return Math.min(1, Math.abs(clamped - motion.neutralDeg) / span)
}

export function classifyJointExcursion(motion: JointMotionProfile, angleDeg: number): MotionExcursionState {
  const excursion = normalizedJointExcursion(motion, angleDeg)
  if (excursion < 0.12) return 'neutral'
  if (excursion < 0.78) return 'mid-range'
  return 'near-end-range'
}

export function signedMotionLabel(motion: JointMotionProfile, angleDeg: number) {
  const clamped = clampJointAngle(motion, angleDeg)
  if (Math.abs(clamped - motion.neutralDeg) < 0.5) return 'Neutral'
  const direction = clamped < motion.neutralDeg ? motion.negativeLabel : motion.positiveLabel
  return `${direction} ${Math.abs(clamped - motion.neutralDeg).toFixed(0)}°`
}

export const WHOLE_BODY_JOINT_PROFILES: WholeBodyJointProfile[] = [
  {
    id: 'cervical-spine', label: 'Cervical spine', region: 'head-neck', sourceGeometry: 'native-geometry',
    nodeHints: ['cervical vertebra', 'atlas', 'axis', 'sternocleidomastoid'],
    motions: [
      { id: 'cervical-flexion-extension', label: 'Flexion / extension', plane: 'sagittal', axis: 'mediolateral', minDeg: -60, maxDeg: 45, neutralDeg: 0, negativeLabel: 'Extension', positiveLabel: 'Flexion', drivers: ['sternocleidomastoid', 'deep neck flexors'], opposers: ['splenius', 'semispinalis'], passiveRestraints: ['anterior/posterior ligamentous complex', 'facet geometry'], structureHints: ['sternocleidomastoid', 'splenius', 'cervical vertebra'], teachingNote: 'Treat the displayed range as a generic educational envelope. Segmental cervical motion is distributed and coupled rather than a single hinge.' },
      { id: 'cervical-rotation', label: 'Axial rotation', plane: 'transverse', axis: 'longitudinal', minDeg: -80, maxDeg: 80, neutralDeg: 0, negativeLabel: 'Left rotation', positiveLabel: 'Right rotation', drivers: ['sternocleidomastoid', 'splenius capitis/cervicis'], opposers: ['contralateral rotators'], passiveRestraints: ['alar/transverse ligament complex', 'facet geometry'], structureHints: ['sternocleidomastoid', 'cervical vertebra'], teachingNote: 'Upper-cervical and subaxial contributions differ; this control is not a patient-specific segmental model.' },
    ],
  },
  {
    id: 'thoracolumbar-spine', label: 'Thoracolumbar spine', region: 'spine-back', sourceGeometry: 'native-geometry',
    nodeHints: ['thoracic vertebra', 'lumbar vertebra', 'erector spinae', 'multifidus'],
    motions: [
      { id: 'trunk-flexion-extension', label: 'Flexion / extension', plane: 'sagittal', axis: 'mediolateral', minDeg: -25, maxDeg: 60, neutralDeg: 0, negativeLabel: 'Extension', positiveLabel: 'Flexion', drivers: ['abdominal wall', 'iliopsoas contribution'], opposers: ['erector spinae', 'multifidus'], passiveRestraints: ['posterior ligamentous complex', 'disc/facet geometry'], structureHints: ['rectus abdominis', 'erector spinae', 'multifidus', 'lumbar vertebra'], teachingNote: 'Displayed trunk excursion combines multiple spinal segments and pelvic contribution; it must not be read as lumbar-only ROM.' },
      { id: 'trunk-rotation', label: 'Axial rotation', plane: 'transverse', axis: 'longitudinal', minDeg: -30, maxDeg: 30, neutralDeg: 0, negativeLabel: 'Left rotation', positiveLabel: 'Right rotation', drivers: ['internal/external obliques', 'multifidus'], opposers: ['contralateral trunk rotators'], passiveRestraints: ['facet orientation', 'annulus/ligamentous tissues'], structureHints: ['external oblique', 'internal oblique', 'multifidus'], teachingNote: 'Thoracic and lumbar rotation capacity differs substantially; this is a whole-trunk teaching control.' },
    ],
  },
  {
    id: 'shoulder', label: 'Glenohumeral / shoulder complex', region: 'upper-limb', sourceGeometry: 'native-geometry',
    nodeHints: ['scapula', 'clavicle', 'humerus', 'supraspinatus', 'infraspinatus', 'subscapularis'],
    motions: [
      { id: 'shoulder-flexion-extension', label: 'Flexion / extension', plane: 'sagittal', axis: 'mediolateral', minDeg: -60, maxDeg: 180, neutralDeg: 0, negativeLabel: 'Extension', positiveLabel: 'Flexion', drivers: ['anterior deltoid', 'pectoralis major clavicular head', 'coracobrachialis'], opposers: ['posterior deltoid', 'latissimus dorsi', 'teres major'], passiveRestraints: ['capsuloligamentous tissues', 'scapulothoracic mechanics'], structureHints: ['deltoid', 'pectoralis major', 'latissimus dorsi', 'humerus', 'scapula'], teachingNote: 'Full arm elevation is a shoulder-complex motion that includes scapular upward rotation; the source mesh is not artificially deformed.' },
      { id: 'shoulder-abduction-adduction', label: 'Abduction / adduction', plane: 'frontal', axis: 'anteroposterior', minDeg: -30, maxDeg: 180, neutralDeg: 0, negativeLabel: 'Adduction', positiveLabel: 'Abduction', drivers: ['middle deltoid', 'supraspinatus', 'serratus anterior/trapezius for scapular rotation'], opposers: ['latissimus dorsi', 'pectoralis major', 'teres major'], passiveRestraints: ['inferior capsule', 'glenohumeral ligaments'], structureHints: ['deltoid', 'supraspinatus', 'serratus anterior', 'trapezius', 'scapula', 'humerus'], teachingNote: 'The control links glenohumeral and scapulothoracic teaching; it does not claim a fixed scapulohumeral ratio for every person.' },
      { id: 'shoulder-rotation', label: 'Internal / external rotation', plane: 'transverse', axis: 'longitudinal', minDeg: -70, maxDeg: 90, neutralDeg: 0, negativeLabel: 'Internal rotation', positiveLabel: 'External rotation', drivers: ['infraspinatus', 'teres minor', 'subscapularis', 'pectoralis major'], opposers: ['opposing rotator-cuff group'], passiveRestraints: ['capsule', 'glenohumeral ligament complex'], structureHints: ['infraspinatus', 'teres minor', 'subscapularis', 'pectoralis major'], teachingNote: 'Rotation range changes with arm position and measurement method; use as an educational envelope only.' },
    ],
  },
  {
    id: 'elbow', label: 'Elbow', region: 'upper-limb', sourceGeometry: 'native-geometry',
    nodeHints: ['humerus', 'ulna', 'radius', 'biceps', 'triceps'],
    motions: [
      { id: 'elbow-flexion-extension', label: 'Flexion / extension', plane: 'sagittal', axis: 'mediolateral', minDeg: 0, maxDeg: 150, neutralDeg: 0, negativeLabel: 'Extension', positiveLabel: 'Flexion', drivers: ['biceps brachii', 'brachialis', 'brachioradialis'], opposers: ['triceps brachii', 'anconeus'], passiveRestraints: ['ulnohumeral geometry', 'collateral ligament complex'], structureHints: ['biceps', 'brachialis', 'triceps', 'humerus', 'ulna'], teachingNote: 'The elbow behaves predominantly as a hinge for flexion/extension, while forearm rotation is modeled separately below.' },
    ],
  },
  {
    id: 'forearm', label: 'Radioulnar complex', region: 'upper-limb', sourceGeometry: 'native-geometry',
    nodeHints: ['radius', 'ulna', 'pronator', 'supinator', 'biceps'],
    motions: [
      { id: 'forearm-pronation-supination', label: 'Pronation / supination', plane: 'transverse', axis: 'longitudinal', minDeg: -80, maxDeg: 80, neutralDeg: 0, negativeLabel: 'Pronation', positiveLabel: 'Supination', drivers: ['pronator teres/quadratus', 'supinator', 'biceps brachii'], opposers: ['opposing rotator group'], passiveRestraints: ['interosseous membrane', 'radioulnar ligament complex'], structureHints: ['radius', 'ulna', 'pronator', 'supinator', 'biceps'], teachingNote: 'Pronation/supination is a coupled proximal and distal radioulnar rotation, not wrist rotation.' },
    ],
  },
  {
    id: 'wrist', label: 'Wrist', region: 'upper-limb', sourceGeometry: 'adjacent-geometry',
    nodeHints: ['radius', 'carpal', 'flexor carpi', 'extensor carpi'],
    motions: [
      { id: 'wrist-flexion-extension', label: 'Flexion / extension', plane: 'sagittal', axis: 'mediolateral', minDeg: -70, maxDeg: 80, neutralDeg: 0, negativeLabel: 'Extension', positiveLabel: 'Flexion', drivers: ['flexor carpi radialis/ulnaris', 'extensor carpi radialis/ulnaris'], opposers: ['opposing wrist group'], passiveRestraints: ['radiocarpal/midcarpal capsuloligamentous tissues'], structureHints: ['flexor carpi', 'extensor carpi', 'radius', 'carpal'], teachingNote: 'The current atlas may not contain every carpal ligament as native geometry; missing structures remain labeled as educational context.' },
      { id: 'wrist-deviation', label: 'Radial / ulnar deviation', plane: 'frontal', axis: 'anteroposterior', minDeg: -30, maxDeg: 20, neutralDeg: 0, negativeLabel: 'Ulnar deviation', positiveLabel: 'Radial deviation', drivers: ['flexor/extensor carpi radialis', 'flexor/extensor carpi ulnaris'], opposers: ['opposing deviation group'], passiveRestraints: ['carpal ligamentous complex'], structureHints: ['flexor carpi', 'extensor carpi', 'carpal'], teachingNote: 'Carpal motion is distributed across radiocarpal and midcarpal articulations.' },
    ],
  },
  {
    id: 'hip', label: 'Hip', region: 'lower-limb', sourceGeometry: 'native-geometry',
    nodeHints: ['acetabulum', 'pelvis', 'femur', 'gluteus', 'iliopsoas', 'adductor'],
    motions: [
      { id: 'hip-flexion-extension', label: 'Flexion / extension', plane: 'sagittal', axis: 'mediolateral', minDeg: -20, maxDeg: 120, neutralDeg: 0, negativeLabel: 'Extension', positiveLabel: 'Flexion', drivers: ['iliopsoas', 'rectus femoris', 'gluteus maximus', 'hamstrings'], opposers: ['opposing flexor/extensor group'], passiveRestraints: ['iliofemoral/ischiofemoral/pubofemoral ligament complex'], structureHints: ['iliopsoas', 'rectus femoris', 'gluteus maximus', 'hamstring', 'femur', 'pelvis'], teachingNote: 'Pelvic tilt and knee position alter apparent hip ROM; this control isolates a teaching coordinate.' },
      { id: 'hip-abduction-adduction', label: 'Abduction / adduction', plane: 'frontal', axis: 'anteroposterior', minDeg: -30, maxDeg: 45, neutralDeg: 0, negativeLabel: 'Adduction', positiveLabel: 'Abduction', drivers: ['gluteus medius/minimus', 'adductor group'], opposers: ['opposing abductor/adductor group'], passiveRestraints: ['capsuloligamentous tissues'], structureHints: ['gluteus medius', 'gluteus minimus', 'adductor', 'femur', 'pelvis'], teachingNote: 'Frontal-plane hip control is central to single-leg stance and gait, but this view does not infer real muscle force.' },
      { id: 'hip-rotation', label: 'Internal / external rotation', plane: 'transverse', axis: 'longitudinal', minDeg: -45, maxDeg: 45, neutralDeg: 0, negativeLabel: 'Internal rotation', positiveLabel: 'External rotation', drivers: ['deep external rotators', 'gluteal fibers', 'adductor contributions'], opposers: ['opposing rotator group'], passiveRestraints: ['capsule and femoroacetabular geometry'], structureHints: ['gluteus', 'adductor', 'femur', 'pelvis'], teachingNote: 'Rotation range depends on hip flexion angle and anatomy; the display is not a diagnostic impingement test.' },
    ],
  },
  {
    id: 'knee', label: 'Knee', region: 'lower-limb', sourceGeometry: 'native-geometry',
    nodeHints: ['femur', 'tibia', 'patella', 'quadriceps', 'hamstring', 'gastrocnemius'],
    motions: [
      { id: 'knee-flexion-extension', label: 'Flexion / extension', plane: 'sagittal', axis: 'mediolateral', minDeg: 0, maxDeg: 135, neutralDeg: 0, negativeLabel: 'Extension', positiveLabel: 'Flexion', drivers: ['hamstrings', 'gastrocnemius', 'quadriceps'], opposers: ['opposing flexor/extensor group'], passiveRestraints: ['ACL/PCL and collateral ligament complex', 'menisci and articular geometry'], structureHints: ['quadriceps', 'hamstring', 'gastrocnemius', 'femur', 'tibia', 'patella'], teachingNote: 'Tibiofemoral roll-glide and axial rotation accompany flexion; the source body is not forced through a fake single-axis mesh deformation.' },
    ],
  },
  {
    id: 'ankle', label: 'Talocrural ankle', region: 'lower-limb', sourceGeometry: 'native-geometry',
    nodeHints: ['tibia', 'fibula', 'talus', 'gastrocnemius', 'soleus', 'tibialis anterior'],
    motions: [
      { id: 'ankle-dorsi-plantarflexion', label: 'Dorsiflexion / plantarflexion', plane: 'sagittal', axis: 'mediolateral', minDeg: -20, maxDeg: 50, neutralDeg: 0, negativeLabel: 'Dorsiflexion', positiveLabel: 'Plantarflexion', drivers: ['tibialis anterior', 'gastrocnemius', 'soleus'], opposers: ['opposing dorsiflexor/plantarflexor group'], passiveRestraints: ['talocrural capsule', 'collateral ligament complex', 'Achilles-muscle-tendon unit'], structureHints: ['tibialis anterior', 'gastrocnemius', 'soleus', 'Achilles', 'tibia', 'fibula', 'talus'], teachingNote: 'This reproduces the reference-style ankle control while keeping the output qualitative: no tendon force or ligament strain is fabricated.' },
    ],
  },
  {
    id: 'subtalar', label: 'Subtalar / hindfoot', region: 'lower-limb', sourceGeometry: 'adjacent-geometry',
    nodeHints: ['talus', 'calcaneus', 'tibialis posterior', 'fibularis'],
    motions: [
      { id: 'hindfoot-inversion-eversion', label: 'Inversion / eversion', plane: 'multiplanar', axis: 'oblique', minDeg: -15, maxDeg: 35, neutralDeg: 0, negativeLabel: 'Eversion', positiveLabel: 'Inversion', drivers: ['tibialis posterior/anterior', 'fibularis longus/brevis'], opposers: ['opposing invertor/evertor group'], passiveRestraints: ['lateral/medial ligament complexes', 'subtalar articular geometry'], structureHints: ['tibialis posterior', 'tibialis anterior', 'fibularis', 'talus', 'calcaneus'], teachingNote: 'Inversion/eversion is multiplanar and distributed across hindfoot/midtarsal joints; this axis is deliberately labeled as an educational simplification.' },
    ],
  },
]

export const WHOLE_BODY_BIOMECHANICS_DISCLOSURE = {
  model: 'Whole-body interactive teaching coordinates',
  source: 'Panacea source anatomy + reviewed biomechanics references/OpenSim-ready architecture',
  rangeRule: 'Displayed degree ranges are generic educational reference envelopes and vary with population, position, measurement method and model definition.',
  forceRule: 'Muscle, tendon and ligament names are qualitative contributors/restraints. The UI must not convert slider position into patient-specific force, strain, injury risk or diagnosis.',
  geometryRule: 'Do not deform evidence-bearing source anatomy to fake physiology. True articulated motion requires provenance-cleared rigged/segmented assets or reviewed simulation output.',
} as const
