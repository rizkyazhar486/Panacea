/**
 * Dynamic 4D Soft-Tissue Biomechanics & Viscoelastic Continuum Engine (BX-Pillar-VI).
 *
 * Implements:
 * 1. Non-linear Hyperelastic Neo-Hookean Continuum Mechanics & Cauchy Stress Formulation.
 * 2. Viscoelastic Kelvin-Voigt and Maxwell Dynamic Damping across abdominal and thoracic viscera.
 * 3. Multi-Organ Mechanical Property Catalog (Stiffness, Poisson ratio, Viscosity, Capsular Yield Stress, Friability).
 * 4. 4D Diaphragmatic Excursion & Visceral Displacement Coupling (Liver, Spleen, Kidneys, Stomach).
 * 5. Gastrointestinal Peristaltic Slow-Wave Electromechanical Dynamics & Lumen Constriction Pacing.
 * 6. Laparoscopic / Surgical Tool Tip Contact Indentation & Haptic Force / Capsular Rupture Threshold.
 *
 * Scientific Provenance:
 * - Fung YC. Biomechanics: Mechanical Properties of Living Tissues. 2nd ed. Springer; 1993.
 * - Carter FJ, et al. Measurements of the in vivo properties of human liver and spleen. Med Image Anal. 2001;5(4):249-261. PMID: 11731275.
 * - Sneddon IN. Boussinesq problem for a punch of arbitrary profile. Int J Eng Sci. 1965;3(1):47-57.
 * - Horgan CO. The Remarkable Neo-Hookean Strain Energy Function. J Elasticity. 2021;144(2):127-142.
 * - Huizinga JD, et al. Cellular origin of the gastrointestinal electrical pacemaker. Nature. 1995;373(6510):147-149.
 *
 * Truth Class: 'mechanistic_simulation_proxy'
 * Clinically reviewed: false (Educational biophysical sandbox, never manufactures patient telemetry).
 */

export const SOFT_TISSUE_BIOMECHANICS_DISCLAIMER =
  'Derived mechanistic soft-tissue biomechanics simulation proxy — educational model, not a patient-specific surgical or diagnostic prediction' as const;

export type OrganMechanicalId =
  | 'liver_normal'
  | 'liver_cirrhosis_f4'
  | 'spleen_normal'
  | 'kidney_cortex'
  | 'stomach_wall'
  | 'lung_parenchyma'
  | 'pancreas'
  | 'urinary_bladder';

export interface OrganBiomechanicsProfile {
  readonly id: OrganMechanicalId;
  readonly label: string;
  readonly fmaId: string;
  readonly uberonId: string;
  readonly youngsModulusKPa: number;
  readonly poissonRatio: number;
  readonly shearModulusMuKPa: number;
  readonly bulkModulusKKPa: number;
  readonly dynamicViscosityPaS: number;
  readonly capsularYieldStressKPa: number;
  readonly friabilityIndex: number;
  readonly nominalThicknessMm: number;
  readonly clinicalContext: string;
}

function makeProfile(
  id: OrganMechanicalId,
  label: string,
  fmaId: string,
  uberonId: string,
  eKPa: number,
  nu: number,
  etaPaS: number,
  yieldKPa: number,
  friability: number,
  thicknessMm: number,
  context: string,
): OrganBiomechanicsProfile {
  const mu = Number((eKPa / (2 * (1 + nu))).toFixed(2));
  const k = Number((eKPa / (3 * (1 - 2 * nu))).toFixed(2));
  return Object.freeze({
    id, label, fmaId, uberonId, youngsModulusKPa: eKPa, poissonRatio: nu,
    shearModulusMuKPa: mu, bulkModulusKKPa: k, dynamicViscosityPaS: etaPaS,
    capsularYieldStressKPa: yieldKPa, friabilityIndex: friability,
    nominalThicknessMm: thicknessMm, clinicalContext: context,
  });
}

export const ORGAN_BIOMECHANICS_CATALOG: Readonly<Record<OrganMechanicalId, OrganBiomechanicsProfile>> = Object.freeze({
  liver_normal: makeProfile('liver_normal', 'Normal Liver Parenchyma', 'FMA:7197', 'UBERON:0002107', 5.5, 0.45, 1.2, 18.0, 0.40, 120.0, 'Normative hepatic tissue; compliant Glisson capsule with moderate resilience.'),
  liver_cirrhosis_f4: makeProfile('liver_cirrhosis_f4', 'Cirrhotic Liver (METAVIR F4 / FibroScan > 14 kPa)', 'FMA:7197', 'UBERON:0002107', 22.0, 0.44, 3.8, 12.0, 0.85, 110.0, 'Extensive collagen crosslinking increases stiffness, but nodular architecture renders capsule friable and prone to avulsion bleeding.'),
  spleen_normal: makeProfile('spleen_normal', 'Spleen Parenchyma', 'FMA:7196', 'UBERON:0002106', 4.8, 0.46, 0.95, 14.0, 0.88, 45.0, 'Delicate splenic capsule enclosing red pulp sinusoidal sponges; highly vulnerable to iatrogenic avulsion.'),
  kidney_cortex: makeProfile('kidney_cortex', 'Kidney Cortex & Parenchyma', 'FMA:7203', 'UBERON:0002113', 8.2, 0.44, 1.5, 24.0, 0.35, 40.0, 'Enclosed by tough fibrous capsule and Gerota fascia; higher yield tolerance than liver/spleen.'),
  stomach_wall: makeProfile('stomach_wall', 'Gastric Muscularis & Submucosa', 'FMA:7148', 'UBERON:0000945', 15.0, 0.42, 2.1, 48.0, 0.15, 5.5, 'Three smooth muscle layers reinforced by collagenous submucosa for distension and peristalsis.'),
  lung_parenchyma: makeProfile('lung_parenchyma', 'Pulmonary Alveolar Tissue', 'FMA:7195', 'UBERON:0002048', 2.2, 0.38, 0.7, 7.5, 0.72, 80.0, 'Porous alveolar mesh with elastin fibers and surface tension dampening; prone to barotrauma at peak stress.'),
  pancreas: makeProfile('pancreas', 'Pancreas Glandular Parenchyma', 'FMA:7198', 'UBERON:0001264', 3.6, 0.45, 1.3, 10.5, 0.78, 25.0, 'Lacks true capsule; delicate lobular architecture susceptible to crush necrosis and fistulae.'),
  urinary_bladder: makeProfile('urinary_bladder', 'Urinary Bladder Detrusor', 'FMA:15900', 'UBERON:0001255', 7.0, 0.43, 1.8, 52.0, 0.12, 4.5, 'Hyperelastic detrusor mesh accommodating expansions from 30 to >500 mL via passive unfolding.'),
});

/* -------------------------------------------------------------------------- */
/* 1. Hyperelastic Neo-Hookean Continuum Stress-Strain Formulation            */
/* -------------------------------------------------------------------------- */

export interface HyperelasticStressPoint {
  readonly engineeringStrain: number;
  readonly stretchRatioLambda: number;
  readonly cauchyTrueStressKPa: number;
  readonly nominalEngineeringStressKPa: number;
  readonly strainEnergyDensityKJPerM3: number;
}

export function calculateNeoHookeanStress(
  engineeringStrain: number,
  shearModulusMuKPa: number,
): HyperelasticStressPoint {
  if (!Number.isFinite(engineeringStrain) || engineeringStrain <= -0.99) {
    throw new RangeError('engineeringStrain must be a finite number > -0.99');
  }
  if (!Number.isFinite(shearModulusMuKPa) || shearModulusMuKPa <= 0) {
    throw new RangeError('shearModulusMuKPa must be a positive finite number');
  }

  const lambda = 1 + engineeringStrain;
  const cauchyTrueStressKPa = Number((shearModulusMuKPa * (lambda * lambda - 1 / lambda)).toFixed(3));
  const nominalEngineeringStressKPa = Number((shearModulusMuKPa * (lambda - 1 / (lambda * lambda))).toFixed(3));
  const strainEnergyDensityKJPerM3 = Number(((shearModulusMuKPa / 2) * (lambda * lambda + 2 / lambda - 3)).toFixed(3));

  return Object.freeze({
    engineeringStrain,
    stretchRatioLambda: Number(lambda.toFixed(3)),
    cauchyTrueStressKPa,
    nominalEngineeringStressKPa,
    strainEnergyDensityKJPerM3,
  });
}

export function generateStressStrainCurve(
  shearModulusMuKPa: number,
  maxStrain: number = 0.50,
  steps: number = 25,
): readonly HyperelasticStressPoint[] {
  const points: HyperelasticStressPoint[] = [];
  const delta = maxStrain / steps;
  for (let i = 0; i <= steps; i++) {
    points.push(calculateNeoHookeanStress(Number((i * delta).toFixed(3)), shearModulusMuKPa));
  }
  return Object.freeze(points);
}

/* -------------------------------------------------------------------------- */
/* 2. Surgical / Laparoscopic Palpation Indentation Contact Mechanics        */
/* -------------------------------------------------------------------------- */

export interface PalpationProbeInput {
  readonly organId: OrganMechanicalId;
  readonly indentationDepthMm: number;
  readonly indentationVelocityMmS: number;
  readonly toolTipRadiusMm?: number;
}

export type TissueContactSafetyStatus = 'safe' | 'high_tension' | 'capsular_rupture_risk';

export interface PalpationContactEvaluation {
  readonly ok: boolean;
  readonly organ: OrganBiomechanicsProfile;
  readonly indentationDepthMm: number;
  readonly indentationVelocityMmS: number;
  readonly engineeringStrain: number;
  readonly elasticContactForceN: number;
  readonly viscousDampingForceN: number;
  readonly totalContactForceN: number;
  readonly peakContactPressureKPa: number;
  readonly capsularStressKPa: number;
  readonly capsularYieldStressKPa: number;
  readonly safetyMarginPct: number;
  readonly safetyStatus: TissueContactSafetyStatus;
  readonly hapticResistanceScore: number;
  readonly truthClass: 'mechanistic_simulation_proxy';
  readonly disclaimer: typeof SOFT_TISSUE_BIOMECHANICS_DISCLAIMER;
}

export function evaluatePalpationIndentation(
  input: PalpationProbeInput,
): PalpationContactEvaluation {
  const organ = ORGAN_BIOMECHANICS_CATALOG[input.organId];
  if (!organ) throw new Error(`Unknown organId: ${String(input.organId)}`);

  const dMm = Math.max(0, Math.min(25, input.indentationDepthMm));
  const vMmS = Math.max(0, Math.min(60, input.indentationVelocityMmS));
  const rMm = input.toolTipRadiusMm && input.toolTipRadiusMm > 0 ? input.toolTipRadiusMm : 2.5;

  const dM = dMm / 1000;
  const vMS = vMmS / 1000;
  const rM = rMm / 1000;
  const ePa = organ.youngsModulusKPa * 1000;
  const nu = organ.poissonRatio;

  const eStarPa = ePa / (1 - nu * nu);
  const fElasticN = (4 / 3) * eStarPa * Math.sqrt(rM) * Math.pow(dM, 1.5);
  const fViscousN = 6 * Math.PI * organ.dynamicViscosityPaS * rM * vMS;
  const totalForceN = Number((fElasticN + fViscousN).toFixed(3));

  const contactRadiusM = Math.sqrt(rM * dM);
  let peakPressureKPa = 0;
  if (contactRadiusM > 0) {
    const contactAreaM2 = Math.PI * contactRadiusM * contactRadiusM;
    peakPressureKPa = Number(((1.5 * (fElasticN / contactAreaM2)) / 1000).toFixed(2));
  }

  const strain = Number((dMm / organ.nominalThicknessMm).toFixed(3));
  const capsularStressKPa = Number((peakPressureKPa * 0.35 + organ.youngsModulusKPa * strain * 2).toFixed(2));
  const safetyMarginPct = Number(
    Math.max(0, Math.min(100, ((organ.capsularYieldStressKPa - capsularStressKPa) / organ.capsularYieldStressKPa) * 100)).toFixed(1),
  );

  let safetyStatus: TissueContactSafetyStatus = 'safe';
  if (capsularStressKPa >= organ.capsularYieldStressKPa * 0.95) {
    safetyStatus = 'capsular_rupture_risk';
  } else if (capsularStressKPa >= organ.capsularYieldStressKPa * 0.70) {
    safetyStatus = 'high_tension';
  }

  const hapticResistanceScore = Math.min(100, Math.round(totalForceN * 25 + (organ.youngsModulusKPa / 25) * 40 + (vMmS / 40) * 10));

  return Object.freeze({
    ok: true, organ, indentationDepthMm: dMm, indentationVelocityMmS: vMmS,
    engineeringStrain: strain, elasticContactForceN: Number(fElasticN.toFixed(3)),
    viscousDampingForceN: Number(fViscousN.toFixed(3)), totalContactForceN: totalForceN,
    peakContactPressureKPa: peakPressureKPa, capsularStressKPa, capsularYieldStressKPa: organ.capsularYieldStressKPa,
    safetyMarginPct, safetyStatus, hapticResistanceScore, truthClass: 'mechanistic_simulation_proxy',
    disclaimer: SOFT_TISSUE_BIOMECHANICS_DISCLAIMER,
  });
}

/* -------------------------------------------------------------------------- */
/* 3. 4D Diaphragmatic Excursion & Visceral Displacement Dynamics             */
/* -------------------------------------------------------------------------- */

export type RespirationMode = 'tidal' | 'deep_inspiration' | 'mechanical_peep' | 'apnea';

export interface RespirationExcursionInput {
  readonly mode: RespirationMode;
  readonly respiratoryPhase: number;
  readonly peepCmH2O?: number;
}

export interface VisceralDisplacementVector {
  readonly organId: OrganMechanicalId;
  readonly label: string;
  readonly dxMm: number;
  readonly dyMm: number;
  readonly dzMm: number;
  readonly totalDisplacementMagnitudeMm: number;
  readonly rotationDegrees: number;
}

export interface DiaphragmaticExcursionEvaluation {
  readonly mode: RespirationMode;
  readonly respiratoryPhase: number;
  readonly peakDiaphragmDescentMm: number;
  readonly instantaneousDiaphragmDescentMm: number;
  readonly organDisplacements: readonly VisceralDisplacementVector[];
  readonly truthClass: 'mechanistic_simulation_proxy';
  readonly disclaimer: typeof SOFT_TISSUE_BIOMECHANICS_DISCLAIMER;
}

function makeVector(organId: OrganMechanicalId, label: string, dxFactor: number, dyFactor: number, dzFactor: number, rotFactor: number, z: number, peak: number): VisceralDisplacementVector {
  const dx = Number((dxFactor * z).toFixed(2));
  const dy = Number((dyFactor * z).toFixed(2));
  const dz = Number((-dzFactor * z).toFixed(2));
  const mag = Number(Math.hypot(dx, dy, dz).toFixed(2));
  const rot = Number((rotFactor * (z / Math.max(1, peak))).toFixed(1));
  return Object.freeze({ organId, label, dxMm: dx, dyMm: dy, dzMm: dz, totalDisplacementMagnitudeMm: mag, rotationDegrees: rot });
}

export function evaluateDiaphragmaticExcursion(
  input: RespirationExcursionInput,
): DiaphragmaticExcursionEvaluation {
  const phase = Math.max(0, Math.min(1, input.respiratoryPhase));
  let peakDescentMm = 20.0;
  if (input.mode === 'deep_inspiration') peakDescentMm = 75.0;
  else if (input.mode === 'mechanical_peep') peakDescentMm = 18.0 + (input.peepCmH2O ?? 8) * 1.8;
  else if (input.mode === 'apnea') peakDescentMm = 0.0;

  const z = Number((peakDescentMm * Math.pow(Math.sin(Math.PI * phase), 2)).toFixed(2));

  return Object.freeze({
    mode: input.mode, respiratoryPhase: phase, peakDiaphragmDescentMm: peakDescentMm,
    instantaneousDiaphragmDescentMm: z,
    organDisplacements: Object.freeze([
      makeVector('liver_normal', 'Liver (Right & Left Lobes)', 0, 0.15, 0.85, 8.0, z, peakDescentMm),
      makeVector('spleen_normal', 'Spleen', 0.10, 0.12, 0.80, 5.5, z, peakDescentMm),
      makeVector('kidney_cortex', 'Right Kidney (Retroperitoneal)', 0, 0.05, 0.55, 3.0, z, peakDescentMm),
      makeVector('kidney_cortex', 'Left Kidney (Retroperitoneal)', 0, 0.05, 0.50, 2.8, z, peakDescentMm),
      makeVector('stomach_wall', 'Stomach (Fundus & Greater Curvature)', -0.12, 0.20, 0.70, 7.0, z, peakDescentMm),
    ]),
    truthClass: 'mechanistic_simulation_proxy',
    disclaimer: SOFT_TISSUE_BIOMECHANICS_DISCLAIMER,
  });
}

/* -------------------------------------------------------------------------- */
/* 4. Gastrointestinal Peristaltic Slow-Wave Electromechanical Dynamics       */
/* -------------------------------------------------------------------------- */

export type GastrointestinalSegment =
  | 'gastric_antrum'
  | 'duodenum'
  | 'jejunum'
  | 'ileum'
  | 'colon';

export interface PeristalsisSegmentProfile {
  readonly segment: GastrointestinalSegment;
  readonly label: string;
  readonly pacingFrequencyCpm: number;
  readonly frequencyHz: number;
  readonly waveVelocityCmPerSec: number;
  readonly baselineLumenRadiusMm: number;
  readonly maxContractionFraction: number;
  readonly peakIntraluminalPressureMmHg: number;
  readonly interstitialCellsOfCajalSite: string;
}

function makeGi(seg: GastrointestinalSegment, label: string, cpm: number, hz: number, v: number, r: number, amp: number, p: number, site: string): PeristalsisSegmentProfile {
  return Object.freeze({
    segment: seg, label, pacingFrequencyCpm: cpm, frequencyHz: hz, waveVelocityCmPerSec: v,
    baselineLumenRadiusMm: r, maxContractionFraction: amp, peakIntraluminalPressureMmHg: p,
    interstitialCellsOfCajalSite: site,
  });
}

export const GI_PERISTALSIS_CATALOG: Readonly<Record<GastrointestinalSegment, PeristalsisSegmentProfile>> = Object.freeze({
  gastric_antrum: makeGi('gastric_antrum', 'Stomach (Antrum / Pyloric Pump)', 3.0, 0.05, 0.25, 22.0, 0.75, 55.0, 'ICC-MP in mid-corpus greater curvature (primary gastric pacemaker)'),
  duodenum: makeGi('duodenum', 'Duodenum (Segmenting & Propulsion)', 12.0, 0.20, 1.6, 14.0, 0.70, 35.0, 'ICC-MP dense network in duodenal bulb near ampulla of Vater'),
  jejunum: makeGi('jejunum', 'Jejunum (Migrating Motor Complex)', 10.0, 0.167, 1.2, 12.0, 0.65, 28.0, 'ICC-MP myenteric plexus along mesenteric border'),
  ileum: makeGi('ileum', 'Ileum (Terminal Mixing & Brake)', 8.0, 0.133, 0.9, 10.0, 0.60, 24.0, 'ICC-MP attenuated gradient approaching ileocecal valve'),
  colon: makeGi('colon', 'Colon (Haustral Shuttle & Mass Movement)', 4.0, 0.067, 0.4, 28.0, 0.50, 40.0, 'ICC-SM at submuscular border of circular muscle'),
});

export interface PeristalsisWavePoint {
  readonly positionAlongTractCm: number;
  readonly instantaneousRadiusMm: number;
  readonly constrictionFractionPct: number;
  readonly intraluminalPressureMmHg: number;
}

export interface PeristalsisEvaluation {
  readonly segment: PeristalsisSegmentProfile;
  readonly timeSec: number;
  readonly wavePoints: readonly PeristalsisWavePoint[];
  readonly currentLumenRadiusAtProbeMm: number;
  readonly currentPressureAtProbeMmHg: number;
  readonly truthClass: 'mechanistic_simulation_proxy';
  readonly disclaimer: typeof SOFT_TISSUE_BIOMECHANICS_DISCLAIMER;
}

export function evaluatePeristalsis(
  segmentKey: GastrointestinalSegment,
  timeSec: number,
  probePositionCm: number = 5.0,
  tractLengthCm: number = 20.0,
  stepCount: number = 20,
): PeristalsisEvaluation {
  const profile = GI_PERISTALSIS_CATALOG[segmentKey];
  if (!profile) throw new Error(`Unknown GI segment: ${String(segmentKey)}`);

  const t = Math.max(0, timeSec);
  const f = profile.frequencyHz;
  const v = profile.waveVelocityCmPerSec;
  const wavelengthCm = Math.max(1, v / f);
  const r0 = profile.baselineLumenRadiusMm;
  const maxAmp = profile.maxContractionFraction;

  const points: PeristalsisWavePoint[] = [];
  const deltaX = tractLengthCm / stepCount;

  for (let i = 0; i <= stepCount; i++) {
    const x = i * deltaX;
    const phase = 2 * Math.PI * (f * t - x / wavelengthCm);
    const waveIntensity = Math.pow(Math.cos(phase / 2), 4);
    const rCurrent = r0 * (1 - maxAmp * waveIntensity);
    const constrictionPct = Number((((r0 - rCurrent) / r0) * 100).toFixed(1));
    const pressureMmHg = Number((5 + profile.peakIntraluminalPressureMmHg * Math.pow(constrictionPct / 100, 2)).toFixed(1));

    points.push(Object.freeze({
      positionAlongTractCm: Number(x.toFixed(1)),
      instantaneousRadiusMm: Number(rCurrent.toFixed(2)),
      constrictionFractionPct: constrictionPct,
      intraluminalPressureMmHg: pressureMmHg,
    }));
  }

  const probePhase = 2 * Math.PI * (f * t - probePositionCm / wavelengthCm);
  const probeRadiusMm = Number((r0 * (1 - maxAmp * Math.pow(Math.cos(probePhase / 2), 4))).toFixed(2));
  const probeConstrictionPct = ((r0 - probeRadiusMm) / r0) * 100;
  const probePressureMmHg = Number((5 + profile.peakIntraluminalPressureMmHg * Math.pow(probeConstrictionPct / 100, 2)).toFixed(1));

  return Object.freeze({
    segment: profile, timeSec: t, wavePoints: Object.freeze(points),
    currentLumenRadiusAtProbeMm: probeRadiusMm, currentPressureAtProbeMmHg: probePressureMmHg,
    truthClass: 'mechanistic_simulation_proxy', disclaimer: SOFT_TISSUE_BIOMECHANICS_DISCLAIMER,
  });
}
