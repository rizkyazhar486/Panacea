export type PostureRegime = 'compensated' | 'aligned';

export interface SuperficialFrontLineNode {
  readonly rank: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  readonly id: string;
  readonly anatomicalName: string;
  readonly indonesianLabel: string;
  readonly compensatedState: string;
  readonly alignedState: string;
  readonly tensionLoadPct: number;
}

export interface KineticProtocolStep {
  readonly stepNumber: 1 | 2 | 3 | 4;
  readonly id: string;
  readonly title: string;
  readonly targetStructure: string;
  readonly mechanism: string;
  readonly dailyDrill: string;
}

export interface FasciaKineticEvaluation {
  readonly regime: PostureRegime;
  readonly truthClass: 'simulated';
  readonly epistemicNotice: string;
  readonly metrics: {
    readonly plantarArchStabilityPct: number;
    readonly gaitElasticRecoilEfficiencyPct: number;
    readonly craniocervicalAngleDeg: number;
    readonly palatalTongueSuctionScore: number;
    readonly submentalSoftTissueLiftPct: number;
    readonly axialShoulderPelvicSymmetryPct: number;
  };
  readonly superficialFrontLine: readonly SuperficialFrontLineNode[];
  readonly protocolSteps: readonly KineticProtocolStep[];
}

export interface FasciaKineticInput {
  readonly plantarArchActivation01: number;
  readonly rotationalThoracicMobility01: number;
  readonly palatalTonguePosture01: number;
  readonly facialMyofascialRelease01: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function evaluateFasciaKineticChain(
  input: FasciaKineticInput,
): FasciaKineticEvaluation {
  const foot = clamp01(input.plantarArchActivation01);
  const rotation = clamp01(input.rotationalThoracicMobility01);
  const tongue = clamp01(input.palatalTonguePosture01);
  const facialRelease = clamp01(input.facialMyofascialRelease01);

  const compositeIndex =
    foot * 0.32 + rotation * 0.26 + tongue * 0.24 + facialRelease * 0.18;
  const regime: PostureRegime = compositeIndex >= 0.65 ? 'aligned' : 'compensated';

  const plantarArchStabilityPct = Math.round(38 + foot * 56);
  const gaitElasticRecoilEfficiencyPct = Math.round(
    45 + (foot * 0.6 + rotation * 0.4) * 49,
  );
  const craniocervicalAngleDeg = Number(
    (34 + (foot * 0.35 + tongue * 0.45 + rotation * 0.2) * 18).toFixed(1),
  );
  const palatalTongueSuctionScore = Math.round(30 + tongue * 68);
  const submentalSoftTissueLiftPct = Math.round(
    25 + (tongue * 0.55 + facialRelease * 0.25 + foot * 0.2) * 67,
  );
  const axialShoulderPelvicSymmetryPct = Math.round(
    52 + (foot * 0.5 + rotation * 0.5) * 44,
  );

  const loadFactor = 1 - compositeIndex;

  const superficialFrontLine: readonly SuperficialFrontLineNode[] = Object.freeze([
    {
      rank: 1,
      id: 'scm',
      anatomicalName: 'Sternocleidomastoid (SCM)',
      indonesianLabel: 'Otot Sternokleidomastoideus',
      compensatedState: 'Forward head pull & cervical hyper-extension',
      alignedState: 'Stacked mastoid-sternal balance & unloaded airway',
      tensionLoadPct: Math.round(30 + loadFactor * 55),
    },
    {
      rank: 2,
      id: 'pectoralis',
      anatomicalName: 'Pectoralis Major & Sternochondral Fascia',
      indonesianLabel: 'Fasia Pektoralis & Sternokondral',
      compensatedState: 'Internal humeral rotation & thoracic kyphotic collapse',
      alignedState: 'Open ribcage expansion & elastic scapular glide',
      tensionLoadPct: Math.round(28 + loadFactor * 52),
    },
    {
      rank: 3,
      id: 'rectus_abdominis',
      anatomicalName: 'Rectus Abdominis & Linea Alba',
      indonesianLabel: 'Rektus Abdominis & Tekanan Intra-Abdomen',
      compensatedState: 'Downward rib pull & anterior pelvic tilt leak',
      alignedState: '360° intra-abdominal pressure (IAP) cylinder',
      tensionLoadPct: Math.round(25 + loadFactor * 50),
    },
    {
      rank: 4,
      id: 'quadriceps',
      anatomicalName: 'Quadriceps Femoris',
      indonesianLabel: 'Kuadriseps Femoris',
      compensatedState: 'Eccentric overload from femoral internal rotation',
      alignedState: 'Balanced hip-extension recoil & linear knee tracking',
      tensionLoadPct: Math.round(32 + loadFactor * 48),
    },
    {
      rank: 5,
      id: 'subpatellar_tendon',
      anatomicalName: 'Subpatellar Tendon',
      indonesianLabel: 'Tendon Subpatelar',
      compensatedState: 'Valgus shear stress during stance phase',
      alignedState: 'Coaxial patellofemoral force transmission',
      tensionLoadPct: Math.round(26 + loadFactor * 49),
    },
    {
      rank: 6,
      id: 'anterior_tibialis',
      anatomicalName: 'Anterior Tibialis',
      indonesianLabel: 'Tibialis Anterior',
      compensatedState: 'Sluggish dorsiflexion & out-toeing compensation',
      alignedState: 'Crisp ankle dorsiflexion & forefoot spring loading',
      tensionLoadPct: Math.round(29 + loadFactor * 51),
    },
    {
      rank: 7,
      id: 'toe_extensors',
      anatomicalName: 'Short & Long Toe Extensors',
      indonesianLabel: 'Ekstensor Digitorum & Tripod Kaki',
      compensatedState: 'Collapsed medial arch & duck-foot external flare',
      alignedState: 'Active hallux anchor & plantar fascial windlass recoil',
      tensionLoadPct: Math.round(34 + loadFactor * 54),
    },
  ]);

  const protocolSteps: readonly KineticProtocolStep[] = Object.freeze([
    {
      stepNumber: 1,
      id: 'begin_with_feet',
      title: '1. Begin with the Feet (Plantar Tripod & Arch Recoil)',
      targetStructure: 'Flexor Digitorum Brevis, Tibialis Posterior & Plantar Aponeurosis',
      mechanism:
        'Eliminates out-toeing ("duck feet") and restores medial arch windlass tension from the ground up.',
      dailyDrill: '3 x 45s Towel Scrunches + Short-Foot Tripod Holds barefoot',
    },
    {
      stepNumber: 2,
      id: 'palatal_tongue_posture',
      title: '2. Deep Front Line & Palatal Tongue Seal',
      targetStructure: 'Suprahyoid Sling (Mylohyoid, Geniohyoid) & Deep Cervical Flexors',
      mechanism:
        'Resting the entire tongue on the palate tensions the deep front line, elevating submental soft tissue and stabilizing cervical stacking.',
      dailyDrill: 'Continuous nasal breathing + posterior-third palatal tongue suction',
    },
    {
      stepNumber: 3,
      id: 'facial_fascia_release',
      title: '3. Facial Myofascial & Pericranial Tension Release',
      targetStructure: 'Masseter, Temporalis, Zygomaticus & Galea Aponeurotica',
      mechanism:
        'Reduces masticatory hypertonicity and superficial pericranial fascial stiffness for symmetrical soft-tissue contour.',
      dailyDrill: '2 min bilateral intra/extra-oral masseter & zygomatic myofascial glide',
    },
    {
      stepNumber: 4,
      id: 'rotational_spiral_line',
      title: '4. Spiral Line Rotational Dissociation',
      targetStructure: 'External/Internal Obliques, Serratus Anterior & Rhomboids',
      mechanism:
        'Couples contralateral hip and thoracic rotation for effortless gait propulsion and axial symmetry.',
      dailyDrill: '2 x 12 Standing Thoracic-Pelvic Rotational Slings per side',
    },
  ]);

  return Object.freeze({
    regime,
    truthClass: 'simulated',
    epistemicNotice:
      'Simulated myofascial & postural biomechanics model. Represents soft-tissue tone, craniocervical alignment, and kinetic efficiency—not adult cranial bone osteogenesis or clinical diagnosis.',
    metrics: Object.freeze({
      plantarArchStabilityPct,
      gaitElasticRecoilEfficiencyPct,
      craniocervicalAngleDeg,
      palatalTongueSuctionScore,
      submentalSoftTissueLiftPct,
      axialShoulderPelvicSymmetryPct,
    }),
    superficialFrontLine,
    protocolSteps,
  });
}
