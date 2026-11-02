// ============================================================================
// A. FREEMOCAP & SKELLYTRACKER 3D MARKERLESS BIOMECHANICS (BX-3 PR #2959 & ASC-1)
// ============================================================================
export interface Skelly3DJointLandmark {
  readonly jointName: "HIP_LEFT" | "KNEE_LEFT" | "ANKLE_LEFT" | "HIP_RIGHT" | "KNEE_RIGHT" | "ANKLE_RIGHT" | "PELVIS_CENTER" | "C7_SPINE";
  readonly positionMetersXYZ: readonly [number, number, number];
  readonly confidence0to1: number;
}

export interface FreeMoCapKinematicsReport {
  readonly trackerBackend: "SKELLYTRACKER_MEDIAPIPE_3D" | "SKELLYTRACKER_VITPOSE_3D";
  readonly leftKneeFlexionDeg: number;
  readonly rightKneeFlexionDeg: number;
  readonly pelvicObliquityDeg: number;
  readonly stepSymmetryIndexPercent: number;
  readonly detectedGaitPattern: "NORMATIVE_BIPEDAL" | "HEMIPARETIC_CIRCUMDUCTION" | "ANTALGIC_ASYMMETRY" | "TRENDELENBURG_DROP";
  readonly meanConfidence: number;
  readonly truthClass: "SIMULATED_EDUCATIONAL";
}

function computeAngleBetweenVectorsDeg(u: readonly [number, number, number], v: readonly [number, number, number]): number {
  const dot = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const magU = Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]);
  const magV = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (magU === 0 || magV === 0) return 0;
  const cosTheta = Math.max(-1, Math.min(1, dot / (magU * magV)));
  return Number(((Math.acos(cosTheta) * 180) / Math.PI).toFixed(2));
}

export function analyzeFreeMoCapSkellyPose(params: {
  readonly leftHipXYZ: readonly [number, number, number];
  readonly leftKneeXYZ: readonly [number, number, number];
  readonly leftAnkleXYZ: readonly [number, number, number];
  readonly rightHipXYZ: readonly [number, number, number];
  readonly rightKneeXYZ: readonly [number, number, number];
  readonly rightAnkleXYZ: readonly [number, number, number];
  readonly trackerBackend?: "SKELLYTRACKER_MEDIAPIPE_3D" | "SKELLYTRACKER_VITPOSE_3D";
}): FreeMoCapKinematicsReport {
  const thighL: [number, number, number] = [params.leftHipXYZ[0] - params.leftKneeXYZ[0], params.leftHipXYZ[1] - params.leftKneeXYZ[1], params.leftHipXYZ[2] - params.leftKneeXYZ[2]];
  const shankL: [number, number, number] = [params.leftAnkleXYZ[0] - params.leftKneeXYZ[0], params.leftAnkleXYZ[1] - params.leftKneeXYZ[1], params.leftAnkleXYZ[2] - params.leftKneeXYZ[2]];
  const thighR: [number, number, number] = [params.rightHipXYZ[0] - params.rightKneeXYZ[0], params.rightHipXYZ[1] - params.rightKneeXYZ[1], params.rightHipXYZ[2] - params.rightKneeXYZ[2]];
  const shankR: [number, number, number] = [params.rightAnkleXYZ[0] - params.rightKneeXYZ[0], params.rightAnkleXYZ[1] - params.rightKneeXYZ[1], params.rightAnkleXYZ[2] - params.rightKneeXYZ[2]];

  const leftKneeFlexionDeg = Number((180 - computeAngleBetweenVectorsDeg(thighL, shankL)).toFixed(2));
  const rightKneeFlexionDeg = Number((180 - computeAngleBetweenVectorsDeg(thighR, shankR)).toFixed(2));
  const dyHips = params.leftHipXYZ[1] - params.rightHipXYZ[1];
  const dxHips = Math.max(0.15, Math.abs(params.leftHipXYZ[0] - params.rightHipXYZ[0]));
  const pelvicObliquityDeg = Number(((Math.atan2(dyHips, dxHips) * 180) / Math.PI).toFixed(2));
  const maxFlex = Math.max(1, leftKneeFlexionDeg, rightKneeFlexionDeg);
  const stepSymmetryIndexPercent = Number((100 - (Math.abs(leftKneeFlexionDeg - rightKneeFlexionDeg) / maxFlex) * 100).toFixed(2));

  let detectedGaitPattern: FreeMoCapKinematicsReport["detectedGaitPattern"] = "NORMATIVE_BIPEDAL";
  if (Math.abs(pelvicObliquityDeg) > 8) detectedGaitPattern = "TRENDELENBURG_DROP";
  else if (stepSymmetryIndexPercent < 75) detectedGaitPattern = "HEMIPARETIC_CIRCUMDUCTION";
  else if (stepSymmetryIndexPercent < 88) detectedGaitPattern = "ANTALGIC_ASYMMETRY";

  return {
    trackerBackend: params.trackerBackend ?? "SKELLYTRACKER_VITPOSE_3D",
    leftKneeFlexionDeg,
    rightKneeFlexionDeg,
    pelvicObliquityDeg,
    stepSymmetryIndexPercent,
    detectedGaitPattern,
    meanConfidence: 0.94,
    truthClass: "SIMULATED_EDUCATIONAL"
  };
}

// ============================================================================
// B. FREEDOMINTELLIGENCE: SEPSISAGENT, REMOP, OPENCLAW, PANTHEON & MEDGEN
// ============================================================================
export interface SepsisAgentSofaInput {
  readonly respiratoryRateBpm: number;
  readonly systolicBpMmHg: number;
  readonly glasgowComaScale3to15: number;
  readonly paO2FiO2Ratio: number;
  readonly platelets10e3PerUl: number;
  readonly bilirubinMgDl: number;
  readonly meanArterialPressureMmHg: number;
  readonly creatinineMgDl: number;
  readonly lactateMmolL: number;
}

export function evaluateSepsisAgentAndRemopSafety(input: SepsisAgentSofaInput) {
  if (input.glasgowComaScale3to15 < 3 || input.glasgowComaScale3to15 > 15) {
    throw new RangeError("GCS must be between 3 and 15");
  }
  const qSofaScore =
    (input.respiratoryRateBpm >= 22 ? 1 : 0) +
    (input.systolicBpMmHg <= 100 ? 1 : 0) +
    (input.glasgowComaScale3to15 < 15 ? 1 : 0);

  const respSofa = input.paO2FiO2Ratio < 100 ? 4 : input.paO2FiO2Ratio < 200 ? 3 : input.paO2FiO2Ratio < 300 ? 2 : input.paO2FiO2Ratio < 400 ? 1 : 0;
  const coagSofa = input.platelets10e3PerUl < 20 ? 4 : input.platelets10e3PerUl < 50 ? 3 : input.platelets10e3PerUl < 100 ? 2 : input.platelets10e3PerUl < 150 ? 1 : 0;
  const liverSofa = input.bilirubinMgDl >= 12 ? 4 : input.bilirubinMgDl >= 6 ? 3 : input.bilirubinMgDl >= 2 ? 2 : input.bilirubinMgDl >= 1.2 ? 1 : 0;
  const cvSofa = input.meanArterialPressureMmHg < 70 ? 1 : 0;
  const cnsSofa = input.glasgowComaScale3to15 < 6 ? 4 : input.glasgowComaScale3to15 <= 9 ? 3 : input.glasgowComaScale3to15 <= 12 ? 2 : input.glasgowComaScale3to15 <= 14 ? 1 : 0;
  const renalSofa = input.creatinineMgDl >= 5 ? 4 : input.creatinineMgDl >= 3.5 ? 3 : input.creatinineMgDl >= 2 ? 2 : input.creatinineMgDl >= 1.2 ? 1 : 0;
  const totalSofaScore = respSofa + coagSofa + liverSofa + cvSofa + cnsSofa + renalSofa;

  const septicShockEducationalFlag = totalSofaScore >= 2 && input.meanArterialPressureMmHg < 65 && input.lactateMmolL > 2.0;
  const oneHourBundleEducationalChecklist = [
    "1. Measure serum lactate level (remeasure if initial lactate > 2 mmol/L)",
    "2. Obtain blood cultures prior to administration of antibiotics",
    "3. Administer broad-spectrum antimicrobials",
    "4. Rapidly administer 30 mL/kg crystalloid for hypotension or lactate >= 4 mmol/L",
    "5. Apply vasopressors (norepinephrine first-line via REMOP receptor optimizer) if hypotensive during/after fluid resuscitation to maintain MAP >= 65 mmHg"
  ];

  return {
    qSofaScore,
    totalSofaScore,
    septicShockEducationalFlag,
    oneHourBundleEducationalChecklist,
    pantheonSpecialistConsensus: {
      intensiveCareAgent: "Initiate Surviving Sepsis 1-Hour Bundle simulation; monitor dynamic fluid responsiveness.",
      pharmacologyRemopAgent: "Titrate alpha-1/beta-1 adrenergic agonist (norepinephrine); avoid nephrotoxic co-medication overlap.",
      infectiousDiseaseOpenClawSkill: "Verify local antibiogram before de-escalation; source control assessment required.",
      medGenSyntheticScenarioId: "MEDGEN_SYNTH_SEPSIS_MODS_042",
      glm4AuroraRoutingModel: "GLM-4-Clinical-Aurora-Gate-Verified"
    },
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}

// ============================================================================
// C. TALKVID & EXPRESSIVESPEECH VRM VISEME + KENNEY/OYASUMI/PISKEL/SIMREADY-GLB
// ============================================================================
export type VrmVisemeKey = "aa" | "ih" | "ou" | "ee" | "oh" | "neutral";

export interface TalkVidExpressiveSpeechFrame {
  readonly botId: "DR_SATORU_SENSEI" | "DR_MAKIMA_SENPAI" | "DR_SENKU_KUN";
  readonly emotionTone: "CALM_AUTHORITATIVE" | "URGENT_TACTICAL" | "EXCITED_SCIENTIFIC";
  readonly pitchHz: number;
  readonly speakingRateWpm: number;
  readonly visemeSequence: ReadonlyArray<{ readonly timeMs: number; readonly viseme: VrmVisemeKey; readonly weight0to1: number }>;
  readonly piskelSpriteBadgeAnimation: {
    readonly spriteSheetId: string;
    readonly frameCount: number;
    readonly fps: number;
    readonly kenneyUiSoundCue: string;
  };
  readonly simReadyGlbAsset: {
    readonly assetId: string;
    readonly rigidBodyPhysicsReady: true;
    readonly collisionMeshVerified: true;
  };
}

export function synthesizeTalkVidExpressiveBotFrame(
  botId: "DR_SATORU_SENSEI" | "DR_MAKIMA_SENPAI" | "DR_SENKU_KUN",
  dialogueText: string
): TalkVidExpressiveSpeechFrame {
  const vowels: VrmVisemeKey[] = ["aa", "ee", "ih", "oh", "ou"];
  const words = dialogueText.trim().split(/\s+/).filter(Boolean);
  const visemeSequence = words.slice(0, 12).map((w, idx) => ({
    timeMs: idx * 140,
    viseme: vowels[w.length % vowels.length],
    weight0to1: Number((0.65 + (idx % 3) * 0.12).toFixed(2))
  }));

  const emotionTone =
    botId === "DR_SATORU_SENSEI" ? "CALM_AUTHORITATIVE" :
    botId === "DR_MAKIMA_SENPAI" ? "URGENT_TACTICAL" : "EXCITED_SCIENTIFIC";

  return {
    botId,
    emotionTone,
    pitchHz: botId === "DR_MAKIMA_SENPAI" ? 215 : botId === "DR_SENKU_KUN" ? 168 : 132,
    speakingRateWpm: botId === "DR_SENKU_KUN" ? 185 : 145,
    visemeSequence,
    piskelSpriteBadgeAnimation: {
      spriteSheetId: "piskel_combo_heart_burst_64x64.png",
      frameCount: 16,
      fps: 24,
      kenneyUiSoundCue: "kenney_ui_confirmation_002.ogg"
    },
    simReadyGlbAsset: {
      assetId: "codepawl_simready_icu_defibrillator_and_organ_tray.glb",
      rigidBodyPhysicsReady: true,
      collisionMeshVerified: true
    }
  };
}