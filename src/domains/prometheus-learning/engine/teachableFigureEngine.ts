// Teachable Figure Engine — Causal interactive educational figures for medical physiology.
// Inspired by ywEdAi/teachable-figures ("Predict → Try → Explain") and biophysical simulation doctrines.
// Pure & deterministic: no DOM, network, clock or RNG. All mathematical models operate on unit-checked physics equations.
// Every prediction commits the learner to a cognitive hypothesis before parameter exploration, combating hindsight bias.
// Clinical containment: strictly educational models; not for individual patient therapy or autonomous titration.

export const TEACHABLE_FIGURE_SCHEMA_VERSION = '1.0.0' as const
export const TEACHABLE_FIGURE_DISCLAIMER =
  'Illustrative educational causal simulation. Mathematical models represent textbook physiology at steady-state and do not constitute clinical guidance for real patients.' as const

export interface ModelParameterControl {
  readonly id: string
  readonly label: string
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly defaultValue: number
  readonly description: string
}

export interface PredictionChoice {
  readonly id: string
  readonly label: string
  readonly rationale: string
  readonly isAccurate: boolean
}

export interface TeachableFigureDef<TParams extends object, TOutput extends object> {
  readonly id: string
  readonly title: string
  readonly targetConceptId: string
  readonly referenceIds: readonly string[]
  readonly description: string
  readonly coreMisconception: string
  readonly controls: readonly ModelParameterControl[]
  readonly defaultParams: Readonly<TParams>
  readonly predictionQuestion: {
    readonly stem: string
    readonly choices: readonly PredictionChoice[]
  }
  readonly simulate: (params: TParams) => {
    readonly ok: true
    readonly outputs: TOutput
    readonly narrative: string
    readonly visualStateKey: string
  } | {
    readonly ok: false
    readonly reason: 'parameter_out_of_bounds' | 'non_finite'
    readonly field: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIGURE 1: Frank-Starling & Left Ventricular Pressure-Volume Relationship
// Model: Stroke Volume (SV) = EDV - ESV; ESV = f(Inotropy, Afterload); CO = HR * SV / 1000.
// Reference: Bers DM (2002) Nature; OpenStax A&P 2e ch. 19.
// ─────────────────────────────────────────────────────────────────────────────

export interface PvLoopParams {
  edvMl: number       // End-Diastolic Volume (preload) [60 - 240 mL]
  inotropyPercent: number // Contractility index [50 - 200 %]
  mapMmHg: number     // Mean Arterial Pressure (afterload) [50 - 180 mmHg]
  hrBpm: number       // Heart Rate [40 - 180 bpm]
}

export interface PvLoopOutput {
  esvMl: number
  svMl: number
  efPercent: number
  coLMin: number
  workIndexJoule: number
  stateSummary: string
}

export const PV_LOOP_FIGURE: TeachableFigureDef<PvLoopParams, PvLoopOutput> = {
  id: 'fig:cardiac_pv_loop',
  title: 'Frank-Starling Law & Ventricular PV Relationship',
  targetConceptId: 'pcg:left_ventricle',
  referenceIds: ['ref:openstax-ap2e', 'ref:bers-2002'],
  description:
    'Explore how preload (EDV), afterload (MAP), and inotropy determine stroke volume, ejection fraction, and stroke work.',
  coreMisconception:
    'Many learners mistakenly believe increasing afterload will increase stroke volume because the heart "pumps harder", whereas acute afterload increases oppose ventricular shortening and increase ESV, reducing SV unless inotropy or preload compensates.',
  controls: [
    {
      id: 'edvMl',
      label: 'End-Diastolic Volume (Preload)',
      unit: 'mL',
      min: 60,
      max: 240,
      step: 5,
      defaultValue: 120,
      description: 'Ventricular volume at end of diastole.',
    },
    {
      id: 'inotropyPercent',
      label: 'Myocardial Inotropy (Contractility)',
      unit: '%',
      min: 50,
      max: 200,
      step: 5,
      defaultValue: 100,
      description: 'Calcium sensitivity and active cross-bridge cycling vigor.',
    },
    {
      id: 'mapMmHg',
      label: 'Mean Arterial Pressure (Afterload)',
      unit: 'mmHg',
      min: 50,
      max: 180,
      step: 5,
      defaultValue: 90,
      description: 'Aortic impedance opposing systolic ejection.',
    },
    {
      id: 'hrBpm',
      label: 'Heart Rate',
      unit: 'bpm',
      min: 40,
      max: 180,
      step: 5,
      defaultValue: 70,
      description: 'Cardiac cycle frequency.',
    },
  ],
  defaultParams: {
    edvMl: 120,
    inotropyPercent: 100,
    mapMmHg: 90,
    hrBpm: 70,
  },
  predictionQuestion: {
    stem: 'If acute systemic vascular resistance increases MAP from 90 to 140 mmHg while inotropy and venous return remain constant, what immediately happens to ESV and Stroke Volume?',
    choices: [
      {
        id: 'pred_1',
        label: 'ESV increases and Stroke Volume decreases',
        rationale:
          'Correct: Higher afterload truncates the ejection phase earlier against higher pressure, leaving more blood in the ventricle at end-systole (higher ESV), thus decreasing SV.',
        isAccurate: true,
      },
      {
        id: 'pred_2',
        label: 'Stroke Volume increases to overcome resistance',
        rationale:
          'Incorrect: Ventricles do not automatically pump more volume against higher afterload without increased inotropy or homeometric autoregulation.',
        isAccurate: false,
      },
      {
        id: 'pred_3',
        label: 'ESV drops to zero as contraction reaches maximum pressure',
        rationale:
          'Incorrect: ESV cannot drop to zero; higher opposing pressure stops ejection sooner, which increases ESV.',
        isAccurate: false,
      },
    ],
  },
  simulate: (params: PvLoopParams) => {
    const { edvMl, inotropyPercent, mapMmHg, hrBpm } = params
    for (const [k, v] of Object.entries(params)) {
      if (!Number.isFinite(v)) return { ok: false, reason: 'non_finite', field: k }
    }
    if (edvMl < 60 || edvMl > 240) return { ok: false, reason: 'parameter_out_of_bounds', field: 'edvMl' }
    if (inotropyPercent < 50 || inotropyPercent > 200) return { ok: false, reason: 'parameter_out_of_bounds', field: 'inotropyPercent' }
    if (mapMmHg < 50 || mapMmHg > 180) return { ok: false, reason: 'parameter_out_of_bounds', field: 'mapMmHg' }
    if (hrBpm < 40 || hrBpm > 180) return { ok: false, reason: 'parameter_out_of_bounds', field: 'hrBpm' }

    // End-systolic elastance (Ees) slope reflects inotropy: baseline Ees ~ 2.0 mmHg/mL at 100%
    const ees = 2.0 * (inotropyPercent / 100)
    // Approximate ESV: at peak pressure (approximated by MAP * 1.1), ESV = (P_es / Ees) + V0, where V0 ~ 10 mL
    const pEndSystolic = mapMmHg * 1.08
    const rawEsv = pEndSystolic / ees + 10
    const esvMl = Math.min(edvMl - 10, Math.max(15, Math.round(rawEsv * 10) / 10))
    const svMl = Math.max(5, Math.round((edvMl - esvMl) * 10) / 10)
    const efPercent = Math.round((svMl / edvMl) * 1000) / 10
    const coLMin = Math.round(((hrBpm * svMl) / 1000) * 100) / 100
    // Stroke Work = SV * MAP * 0.000133322 Joules
    const workIndexJoule = Math.round(svMl * mapMmHg * 0.000133322 * 100) / 100

    const visualKey = efPercent < 45 ? 'dilated_hypokinetic' : efPercent > 70 ? 'hyperdynamic' : 'eukinetic'
    const narrative = `At preload EDV ${edvMl} mL and contractility ${inotropyPercent}%, the left ventricle generates a stroke volume of ${svMl} mL against afterload ${mapMmHg} mmHg (EF: ${efPercent}%, Cardiac Output: ${coLMin} L/min).`

    return {
      ok: true,
      outputs: {
        esvMl,
        svMl,
        efPercent,
        coLMin,
        workIndexJoule,
        stateSummary: `${visualKey.toUpperCase()} (EF ${efPercent}%, CO ${coLMin} L/min)`,
      },
      narrative,
      visualStateKey: visualKey,
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FIGURE 2: Calcium-Induced Calcium Release & Excitation-Contraction Coupling
// Model: Trigger Ca2+ (Cav1.2) -> RyR2 open probability -> Peak [Ca2+]i transient -> SERCA2a clearance.
// Reference: Bers DM (2002) Nature 415:198-205.
// ─────────────────────────────────────────────────────────────────────────────

export interface CicrParams {
  cavCurrentPercent: number      // L-type Ca2+ current [20 - 180 %]
  ryrSensitivityPercent: number   // RyR2 Ca2+ sensitivity [30 - 200 %]
  sercaActivityPercent: number    // SERCA2a pump rate [30 - 200 %]
  actionPotentialRateHz: number   // Activation rate [0.5 - 3.0 Hz]
}

export interface CicrOutput {
  peakCytosolicCaMicroM: number
  srCaLoadFraction: number
  relaxationTauMs: number
  contractileForceRelative: number
  phenotypeStatus: string
}

export const CICR_FIGURE: TeachableFigureDef<CicrParams, CicrOutput> = {
  id: 'fig:cardiomyocyte_cicr',
  title: 'Excitation-Contraction Coupling: Cav1.2 - RyR2 Spark & SERCA2a Clearance',
  targetConceptId: 'pcg:excitation_contraction_coupling',
  referenceIds: ['ref:bers-2002', 'ref:openstax-ap2e'],
  description:
    'Simulate how trigger Ca²⁺ influx via sarcolemmal L-type channels triggers massive Ca²⁺ release from the sarcoplasmic reticulum (RyR2), followed by SERCA2a re-uptake.',
  coreMisconception:
    'Learners often think extracellular Ca²⁺ influx directly binds troponin C to generate full twitch force. In truth, sarcolemmal influx provides only ~10-25% of active calcium; 75-90% is released from the sarcoplasmic reticulum via RyR2 amplification.',
  controls: [
    {
      id: 'cavCurrentPercent',
      label: 'Cav1.2 L-Type Ca²⁺ Trigger Current',
      unit: '%',
      min: 20,
      max: 180,
      step: 5,
      defaultValue: 100,
      description: 'Depolarization-activated calcium influx through L-type channels.',
    },
    {
      id: 'ryrSensitivityPercent',
      label: 'RyR2 Receptor Sensitivity',
      unit: '%',
      min: 30,
      max: 200,
      step: 5,
      defaultValue: 100,
      description: 'Calcium sensitivity of the sarcoplasmic reticulum release channel.',
    },
    {
      id: 'sercaActivityPercent',
      label: 'SERCA2a Calcium Pump Activity',
      unit: '%',
      min: 30,
      max: 200,
      step: 5,
      defaultValue: 100,
      description: 'ATP-dependent re-uptake of cytosolic Ca²⁺ into sarcoplasmic reticulum.',
    },
    {
      id: 'actionPotentialRateHz',
      label: 'Pacing Frequency',
      unit: 'Hz',
      min: 0.5,
      max: 3.0,
      step: 0.1,
      defaultValue: 1.0,
      description: 'Myocyte stimulation rate (1.0 Hz = 60 bpm).',
    },
  ],
  defaultParams: {
    cavCurrentPercent: 100,
    ryrSensitivityPercent: 100,
    sercaActivityPercent: 100,
    actionPotentialRateHz: 1.0,
  },
  predictionQuestion: {
    stem: 'What happens to diastolic relaxation time (tau) and systolic force if SERCA2a activity is inhibited by 50%?',
    choices: [
      {
        id: 'pred_cicr_1',
        label: 'Relaxation slows (tau prolongs) and SR Ca²⁺ load progressively falls, blunting subsequent contractions',
        rationale:
          'Correct: Impaired SERCA2a delays cytosolic calcium clearance (prolonged tau / diastolic dysfunction) and fails to replenish SR stores, impairing subsequent CICR amplification.',
        isAccurate: true,
      },
      {
        id: 'pred_cicr_2',
        label: 'The cell immediately depolarizes and stays locked in permanent tetany',
        rationale:
          'Incorrect: Cardiac myocytes have long refractory periods and sodium-calcium exchangers (NCX) that prevent true sustained tetanic lockup like skeletal muscle.',
        isAccurate: false,
      },
      {
        id: 'pred_cicr_3',
        label: 'Cytosolic Ca²⁺ increases infinitely because calcium cannot exit the cell',
        rationale:
          'Incorrect: NCX extrusion across the sarcolemma serves as a secondary extrusion pathway, although with slower kinetics.',
        isAccurate: false,
      },
    ],
  },
  simulate: (params: CicrParams) => {
    const { cavCurrentPercent, ryrSensitivityPercent, sercaActivityPercent, actionPotentialRateHz } = params
    for (const [k, v] of Object.entries(params)) {
      if (!Number.isFinite(v)) return { ok: false, reason: 'non_finite', field: k }
    }
    if (cavCurrentPercent < 20 || cavCurrentPercent > 180) return { ok: false, reason: 'parameter_out_of_bounds', field: 'cavCurrentPercent' }
    if (ryrSensitivityPercent < 30 || ryrSensitivityPercent > 200) return { ok: false, reason: 'parameter_out_of_bounds', field: 'ryrSensitivityPercent' }
    if (sercaActivityPercent < 30 || sercaActivityPercent > 200) return { ok: false, reason: 'parameter_out_of_bounds', field: 'sercaActivityPercent' }
    if (actionPotentialRateHz < 0.5 || actionPotentialRateHz > 3.0) return { ok: false, reason: 'parameter_out_of_bounds', field: 'actionPotentialRateHz' }

    // Steady-state SR load tracked as fraction (0.2 - 1.2)
    const baseSrLoad = 1.0
    const srLoad = Math.min(1.2, Math.max(0.2, baseSrLoad * (sercaActivityPercent / 100) / (0.8 + 0.2 * actionPotentialRateHz)))
    // Peak Ca2+ transient: baseline ~ 1.0 microMolar
    const triggerGain = (cavCurrentPercent / 100) * (ryrSensitivityPercent / 100) * srLoad
    const peakCytosolicCaMicroM = Math.round((0.15 + 0.85 * triggerGain) * 100) / 100
    // Relaxation tau inversely proportional to SERCA2a activity (baseline ~ 220 ms)
    const relaxationTauMs = Math.round(220 / (sercaActivityPercent / 100))
    // Relative twitch force scaled to Ca2+ transient with Hill coefficient ~ 3.0 (Troponin C cooperativity)
    const forceRatio = Math.pow(peakCytosolicCaMicroM / 1.0, 2.5)
    const contractileForceRelative = Math.round(Math.min(2.5, Math.max(0.1, forceRatio)) * 100) / 100

    const visualKey = sercaActivityPercent < 60 ? 'diastolic_delay' : peakCytosolicCaMicroM > 1.5 ? 'hypercontractile' : 'normal_spark'
    const narrative = `Trigger calcium influx of ${cavCurrentPercent}% gates RyR2 amplification from SR load (${Math.round(srLoad * 100)}%), yielding peak cytosolic [Ca²⁺] of ${peakCytosolicCaMicroM} µM. SERCA2a clears Ca²⁺ with tau ${relaxationTauMs} ms.`

    return {
      ok: true,
      outputs: {
        peakCytosolicCaMicroM,
        srCaLoadFraction: Math.round(srLoad * 100) / 100,
        relaxationTauMs,
        contractileForceRelative,
        phenotypeStatus: visualKey === 'diastolic_delay' ? 'IMPAIRED RELAXATION (Diastolic Delay)' : visualKey === 'hypercontractile' ? 'INCREASED INOTROPY' : 'HOMEOSTATIC TRANSIENT',
      },
      narrative,
      visualStateKey: visualKey,
    }
  },
}

// Registry at end of file after all figure definitions

// ─────────────────────────────────────────────────────────────────────────────
// FIGURE 3: Respiratory V/Q Mismatch, Shunt & Alveolar-Arterial O2 Gradient
// Model: Alveolar Gas Equation PAO2 = (Patm - 47) * FiO2 - (PaCO2 / R)
//        Shunt Equation: Qs/Qt = (CcO2 - CaO2) / (CcO2 - CvO2)
// Reference: West JB. Respiratory Physiology: The Essentials; Nunn's Applied Respiratory Physiology.
// ─────────────────────────────────────────────────────────────────────────────

export interface VqMismatchParams {
  fiO2Percent: number        // Inspired O2 fraction [21 - 100 %]
  patmMmHg: number           // Barometric pressure [500 - 780 mmHg] (sea level ~ 760)
  paCo2MmHg: number          // Arterial PCO2 [15 - 80 mmHg]
  shuntPercent: number       // Right-to-left shunt fraction [0 - 50 %]
  respiratoryQuotient: number // R [0.7 - 1.0] (default ~ 0.8)
}

export interface VqMismatchOutput {
  pAlveolarO2MmHg: number
  pArterialO2MmHg: number
  pAaGradientMmHg: number
  arterialO2SatPercent: number
  shuntResponseCategory: string
}

export const VQ_MISMATCH_FIGURE: TeachableFigureDef<VqMismatchParams, VqMismatchOutput> = {
  id: 'fig:respiratory_vq_mismatch',
  title: 'Alveolar Gas Equation, V/Q Mismatch & Right-to-Left Shunt Refractoriness',
  targetConceptId: 'pcg:left_ventricle',
  referenceIds: ['ref:openstax-ap2e'],
  description:
    'Simulate how supplemental oxygen, barometric pressure, hypoventilation (PaCO2), and right-to-left shunts govern the Alveolar-Arterial (A-a) O2 gradient.',
  coreMisconception:
    'Learners frequently assume supplemental 100% O2 will correct hypoxemia regardless of etiology. In true anatomical right-to-left shunts, shunted desaturated blood bypasses ventilated alveoli entirely, making hypoxemia refractory to 100% O2.',
  controls: [
    {
      id: 'fiO2Percent',
      label: 'Fraction of Inspired O2 (FiO2)',
      unit: '%',
      min: 21,
      max: 100,
      step: 1,
      defaultValue: 21,
      description: 'Room air = 21%; pure oxygen = 100%.',
    },
    {
      id: 'patmMmHg',
      label: 'Barometric Pressure (Patm)',
      unit: 'mmHg',
      min: 500,
      max: 780,
      step: 5,
      defaultValue: 760,
      description: 'Sea level = 760 mmHg; high altitude < 600 mmHg.',
    },
    {
      id: 'paCo2MmHg',
      label: 'Arterial PCO2 (Ventilation)',
      unit: 'mmHg',
      min: 15,
      max: 80,
      step: 1,
      defaultValue: 40,
      description: 'Eucapnic = 40 mmHg; hypoventilation > 45 mmHg.',
    },
    {
      id: 'shuntPercent',
      label: 'Right-to-Left Shunt (Qs/Qt)',
      unit: '%',
      min: 0,
      max: 50,
      step: 1,
      defaultValue: 3,
      description: 'Normal anatomical shunt ~ 2-5%; pathological > 15%.',
    },
    {
      id: 'respiratoryQuotient',
      label: 'Respiratory Exchange Ratio (R)',
      unit: '',
      min: 0.7,
      max: 1.0,
      step: 0.05,
      defaultValue: 0.8,
      description: 'Ratio of CO2 production to O2 consumption.',
    },
  ],
  defaultParams: {
    fiO2Percent: 21,
    patmMmHg: 760,
    paCo2MmHg: 40,
    shuntPercent: 3,
    respiratoryQuotient: 0.8,
  },
  predictionQuestion: {
    stem: 'A hypoxemic patient with a 35% right-to-left cardiac shunt is placed on 100% FiO2. What will happen to their arterial PaO2 compared to a patient with pure V/Q mismatch on 100% FiO2?',
    choices: [
      {
        id: 'pred_vq_1',
        label: 'PaO2 remains severely blunted (< 120 mmHg) because shunted blood never contacts ventilated alveoli',
        rationale:
          'Correct: True anatomical right-to-left shunt produces hypoxemia refractory to 100% FiO2. Hemoglobin in non-shunted blood is already 100% saturated, so high FiO2 only adds a small amount of dissolved O2, failing to overcome the massive desaturated shunt.',
        isAccurate: true,
      },
      {
        id: 'pred_vq_2',
        label: 'PaO2 increases to > 500 mmHg like a normal subject because alveolar oxygen is maximal',
        rationale:
          'Incorrect: Alveolar PAO2 does reach > 600 mmHg, but shunted venous blood mixes with pulmonary capillary blood downstream, keeping arterial PaO2 low.',
        isAccurate: false,
      },
      {
        id: 'pred_vq_3',
        label: 'The A-a gradient drops to zero on 100% FiO2',
        rationale:
          'Incorrect: In the presence of a shunt, 100% FiO2 actually widens the numerical A-a gradient dramatically because PAO2 rises while PaO2 remains limited.',
        isAccurate: false,
      },
    ],
  },
  simulate: (params: VqMismatchParams) => {
    const { fiO2Percent, patmMmHg, paCo2MmHg, shuntPercent, respiratoryQuotient } = params
    for (const [k, v] of Object.entries(params)) {
      if (!Number.isFinite(v)) return { ok: false, reason: 'non_finite', field: k }
    }
    if (fiO2Percent < 21 || fiO2Percent > 100) return { ok: false, reason: 'parameter_out_of_bounds', field: 'fiO2Percent' }
    if (patmMmHg < 500 || patmMmHg > 780) return { ok: false, reason: 'parameter_out_of_bounds', field: 'patmMmHg' }
    if (paCo2MmHg < 15 || paCo2MmHg > 80) return { ok: false, reason: 'parameter_out_of_bounds', field: 'paCo2MmHg' }
    if (shuntPercent < 0 || shuntPercent > 50) return { ok: false, reason: 'parameter_out_of_bounds', field: 'shuntPercent' }
    if (respiratoryQuotient < 0.7 || respiratoryQuotient > 1.0) return { ok: false, reason: 'parameter_out_of_bounds', field: 'respiratoryQuotient' }

    // Alveolar Gas Equation: PAO2 = (Patm - 47) * FiO2 - (PaCO2 / R)
    const pWater = 47.0
    const fiO2Fraction = fiO2Percent / 100
    const rawPAO2 = (patmMmHg - pWater) * fiO2Fraction - paCo2MmHg / respiratoryQuotient
    const pAlveolarO2MmHg = Math.round(Math.max(10, rawPAO2) * 10) / 10

    // Ideal end-capillary O2 content: CcO2 = 1.34 * Hb * 1.0 + 0.0031 * PAO2 (assuming Hb = 15 g/dL)
    const hb = 15.0
    const ccO2 = 1.34 * hb * 1.0 + 0.0031 * pAlveolarO2MmHg
    // Mixed venous content CvO2 ~ CcO2 - 5 mL/dL (standard a-v O2 difference)
    const cvO2 = Math.max(8.0, ccO2 - 5.0)

    // Arterial content: CaO2 = CcO2 - (shuntFraction * (CcO2 - CvO2))
    const fs = shuntPercent / 100
    const caO2 = ccO2 - fs * (ccO2 - cvO2)

    // Invert CaO2 to PaO2 (Severinghaus Hill approximation)
    // Saturation fraction:
    const sat = Math.min(1.0, Math.max(0.2, (caO2 - 0.0031 * 50) / (1.34 * hb)))
    // PaO2 approximation from sat: P50 ~ 26.6 mmHg, Hill n ~ 2.7
    const paO2Estimated = sat >= 0.999
      ? Math.max(100, (caO2 - 1.34 * hb) / 0.0031)
      : 26.6 * Math.pow(sat / (1.0 - sat), 1 / 2.7)

    const pArterialO2MmHg = Math.round(Math.min(pAlveolarO2MmHg, Math.max(20, paO2Estimated)) * 10) / 10
    const pAaGradientMmHg = Math.round(Math.max(0, pAlveolarO2MmHg - pArterialO2MmHg) * 10) / 10
    const arterialO2SatPercent = Math.round(sat * 1000) / 10

    const isRefractoryShunt = shuntPercent >= 20 && fiO2Percent >= 90 && pArterialO2MmHg < 150
    const category = isRefractoryShunt
      ? 'REFRACTORY SHUNT (Hypoxemia unresponsive to 100% O2)'
      : pAaGradientMmHg > 25
      ? 'INCREASED A-a GRADIENT (V/Q Mismatch or Shunt)'
      : 'NORMAL A-a GRADIENT (Hypoventilation or Altitude)'

    const narrative = `At FiO2 ${fiO2Percent}% and Patm ${patmMmHg} mmHg, alveolar PAO2 is ${pAlveolarO2MmHg} mmHg. With a ${shuntPercent}% shunt, arterial PaO2 reaches ${pArterialO2MmHg} mmHg (A-a gradient: ${pAaGradientMmHg} mmHg, SaO2: ${arterialO2SatPercent}%).`

    return {
      ok: true,
      outputs: {
        pAlveolarO2MmHg,
        pArterialO2MmHg,
        pAaGradientMmHg,
        arterialO2SatPercent,
        shuntResponseCategory: category,
      },
      narrative,
      visualStateKey: isRefractoryShunt ? 'refractory_shunt' : pAaGradientMmHg > 25 ? 'vq_mismatch' : 'normal_gradient',
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FIGURE 4: Aortic Windkessel, Vascular Resistance & Valvular Dynamics
// Model: Windkessel 2-element C_art, SVR + Gorlin / Bernoulli Valve Orifice Gradient
// Reference: Westerhof N et al. (2009) Med Biol Eng Comput; CircAdapt (Arts et al.).
// ─────────────────────────────────────────────────────────────────────────────

export interface WindkesselValveParams {
  strokeVolumeMl: number        // SV [30 - 150 mL]
  heartRateBpm: number          // HR [40 - 160 bpm]
  arterialCompliance: number    // Cart [0.5 - 2.5 mL/mmHg] (stiff aorta ~ 0.6, young ~ 2.0)
  systemicResistance: number    // SVR [600 - 2400 dyn*s/cm5] (normal ~ 1200)
  aorticValveAreaCm2: number    // AVA [0.4 - 4.0 cm2] (normal 3-4, severe stenosis < 1.0)
}

export interface WindkesselValveOutput {
  systolicBpMmHg: number
  diastolicBpMmHg: number
  pulsePressureMmHg: number
  peakTransvalvularGradientMmHg: number
  peakLvPressureMmHg: number
  valvularStatus: string
}

export const WINDKESSEL_VALVE_FIGURE: TeachableFigureDef<WindkesselValveParams, WindkesselValveOutput> = {
  id: 'fig:hemodynamic_windkessel_valve',
  title: 'Aortic Windkessel Compliance & Aortic Valve Orifice Stenosis Dynamics',
  targetConceptId: 'pcg:left_ventricle',
  referenceIds: ['ref:openstax-ap2e', 'ref:bers-2002'],
  description:
    'Simulate how aortic compliance determines pulse pressure and how aortic valve orifice narrowing generates massive transvalvular systolic pressure gradients opposing left ventricular ejection.',
  coreMisconception:
    'Learners often evaluate ventricular afterload based purely on peripheral cuff blood pressure. In severe aortic stenosis, peripheral BP may be normal or low, while the true left ventricular systolic pressure exceeds 200 mmHg due to the valve stenosis gradient.',
  controls: [
    {
      id: 'strokeVolumeMl',
      label: 'Left Ventricular Stroke Volume',
      unit: 'mL',
      min: 30,
      max: 150,
      step: 5,
      defaultValue: 70,
      description: 'Volume ejected into aorta per beat.',
    },
    {
      id: 'heartRateBpm',
      label: 'Heart Rate',
      unit: 'bpm',
      min: 40,
      max: 160,
      step: 5,
      defaultValue: 75,
      description: 'Cardiac cycle frequency.',
    },
    {
      id: 'arterialCompliance',
      label: 'Arterial Compliance (Cart)',
      unit: 'mL/mmHg',
      min: 0.5,
      max: 2.5,
      step: 0.1,
      defaultValue: 1.5,
      description: 'Aortic elasticity (drops with aging and arteriosclerosis).',
    },
    {
      id: 'systemicResistance',
      label: 'Systemic Vascular Resistance (SVR)',
      unit: 'dyn·s/cm⁵',
      min: 600,
      max: 2400,
      step: 50,
      defaultValue: 1200,
      description: 'Arteriolar resistance opposing peripheral runoff.',
    },
    {
      id: 'aorticValveAreaCm2',
      label: 'Aortic Valve Area (AVA)',
      unit: 'cm²',
      min: 0.4,
      max: 4.0,
      step: 0.1,
      defaultValue: 3.2,
      description: 'Effective orifice area; severe stenosis < 1.0 cm².',
    },
  ],
  defaultParams: {
    strokeVolumeMl: 70,
    heartRateBpm: 75,
    arterialCompliance: 1.5,
    systemicResistance: 1200,
    aorticValveAreaCm2: 3.2,
  },
  predictionQuestion: {
    stem: 'If aortic valve area drops from 3.2 cm² to 0.7 cm² (severe stenosis) while peripheral SVR is normal, what happens to the systolic pressure difference between the LV and aorta?',
    choices: [
      {
        id: 'pred_as_1',
        label: 'A large systolic pressure gradient (> 50 mmHg) develops; LV pressure is far higher than aortic SBP',
        rationale:
          'Correct: By the Gorlin/Bernoulli principle (deltaP = 4*v^2), flow through a restricted orifice requires a high velocity jet, generating a high transvalvular gradient where LV pressure dramatically exceeds aortic SBP.',
        isAccurate: true,
      },
      {
        id: 'pred_as_2',
        label: 'Aortic SBP rises higher than LV pressure to push the valve open',
        rationale:
          'Incorrect: Forward ejection occurs only down a positive pressure gradient (LV pressure > aortic pressure); aortic pressure cannot exceed LV pressure during ejection.',
        isAccurate: false,
      },
      {
        id: 'pred_as_3',
        label: 'Pulse pressure widens significantly in the peripheral artery',
        rationale:
          'Incorrect: Severe aortic stenosis dampens peripheral ejection, typically producing a narrow pulse pressure and delayed upstroke (pulsus parvus et tardus).',
        isAccurate: false,
      },
    ],
  },
  simulate: (params: WindkesselValveParams) => {
    const { strokeVolumeMl, heartRateBpm, arterialCompliance, systemicResistance, aorticValveAreaCm2 } = params
    for (const [k, v] of Object.entries(params)) {
      if (!Number.isFinite(v)) return { ok: false, reason: 'non_finite', field: k }
    }
    if (strokeVolumeMl < 30 || strokeVolumeMl > 150) return { ok: false, reason: 'parameter_out_of_bounds', field: 'strokeVolumeMl' }
    if (heartRateBpm < 40 || heartRateBpm > 160) return { ok: false, reason: 'parameter_out_of_bounds', field: 'heartRateBpm' }
    if (arterialCompliance < 0.5 || arterialCompliance > 2.5) return { ok: false, reason: 'parameter_out_of_bounds', field: 'arterialCompliance' }
    if (systemicResistance < 600 || systemicResistance > 2400) return { ok: false, reason: 'parameter_out_of_bounds', field: 'systemicResistance' }
    if (aorticValveAreaCm2 < 0.4 || aorticValveAreaCm2 > 4.0) return { ok: false, reason: 'parameter_out_of_bounds', field: 'aorticValveAreaCm2' }

    // Cardiac Output in L/min
    const coLMin = (strokeVolumeMl * heartRateBpm) / 1000
    // MAP = CO * SVR / 80 (where 80 converts dyn*s/cm5 to Wood units * 80)
    const mapMmHg = (coLMin * (systemicResistance / 80))
    // Pulse Pressure PP ~ SV / Cart
    const pp = strokeVolumeMl / arterialCompliance
    const systolicBpMmHg = Math.round(mapMmHg + (pp * 0.6))
    const diastolicBpMmHg = Math.round(Math.max(30, mapMmHg - (pp * 0.4)))
    const pulsePressureMmHg = systolicBpMmHg - diastolicBpMmHg

    // Valve Gradient: Peak systolic flow Q_peak ~ SV / (systolic ejection time ~ 0.3s)
    const peakFlowMlS = (strokeVolumeMl / 0.28)
    // Peak velocity v = Flow / AVA (cm/s -> m/s)
    const peakVelocityMS = (peakFlowMlS / aorticValveAreaCm2) / 100
    // Simplified Bernoulli: Delta P = 4 * v^2
    const peakTransvalvularGradientMmHg = Math.round(4.0 * Math.pow(peakVelocityMS, 2) * 10) / 10
    const peakLvPressureMmHg = Math.round(systolicBpMmHg + peakTransvalvularGradientMmHg)

    const status = aorticValveAreaCm2 < 1.0
      ? 'SEVERE AORTIC STENOSIS (High Transvalvular Gradient)'
      : aorticValveAreaCm2 < 1.5
      ? 'MODERATE STENOSIS'
      : 'NORMAL VALVE FUNCTION'

    const narrative = `With aortic compliance of ${arterialCompliance} mL/mmHg and AVA ${aorticValveAreaCm2} cm², peripheral blood pressure is ${systolicBpMmHg}/${diastolicBpMmHg} mmHg. The valve creates a peak gradient of ${peakTransvalvularGradientMmHg} mmHg, forcing true peak LV systolic pressure to ${peakLvPressureMmHg} mmHg.`

    return {
      ok: true,
      outputs: {
        systolicBpMmHg,
        diastolicBpMmHg,
        pulsePressureMmHg,
        peakTransvalvularGradientMmHg,
        peakLvPressureMmHg,
        valvularStatus: status,
      },
      narrative,
      visualStateKey: aorticValveAreaCm2 < 1.0 ? 'severe_stenosis' : 'normal_flow',
    }
  },
}

export const TEACHABLE_FIGURE_REGISTRY = Object.freeze({
  [PV_LOOP_FIGURE.id]: PV_LOOP_FIGURE,
  [CICR_FIGURE.id]: CICR_FIGURE,
  [VQ_MISMATCH_FIGURE.id]: VQ_MISMATCH_FIGURE,
  [WINDKESSEL_VALVE_FIGURE.id]: WINDKESSEL_VALVE_FIGURE,
})

export type TeachableFigureId = keyof typeof TEACHABLE_FIGURE_REGISTRY

export function getTeachableFigure(id: string) {
  return (TEACHABLE_FIGURE_REGISTRY as Record<string, TeachableFigureDef<any, any>>)[id] ?? null
}

export function listTeachableFigures(): readonly TeachableFigureDef<any, any>[] {
  return Object.values(TEACHABLE_FIGURE_REGISTRY)
}
