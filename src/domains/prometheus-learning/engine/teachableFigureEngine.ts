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

export const TEACHABLE_FIGURE_REGISTRY = Object.freeze({
  [PV_LOOP_FIGURE.id]: PV_LOOP_FIGURE,
  [CICR_FIGURE.id]: CICR_FIGURE,
})

export type TeachableFigureId = keyof typeof TEACHABLE_FIGURE_REGISTRY

export function getTeachableFigure(id: string) {
  return (TEACHABLE_FIGURE_REGISTRY as Record<string, TeachableFigureDef<any, any>>)[id] ?? null
}

export function listTeachableFigures(): readonly TeachableFigureDef<any, any>[] {
  return Object.values(TEACHABLE_FIGURE_REGISTRY)
}
