// Curated mechanistic physiological causal networks for Teachable Figures.
import type { CausalNetwork, TeachableInquiry } from '../engine/teachableFigureEngine.ts'

export const HEMODYNAMIC_CAUSAL_NETWORK: CausalNetwork = {
  id: 'net:cardiovascular_hemodynamics',
  name: 'Cardiovascular Hemodynamics & Guyton-Starling Coupling',
  description:
    'Mechanistic closed-loop coupling of preload, inotropy, afterload, stroke volume, cardiac output, systemic vascular resistance, and arterial pressure.',
  references: ['ref:openstax-ap2e', 'ref:bers-2002', 'ref:esc-hf-2021'],
  variables: [
    {
      id: 'preload_edv',
      label: 'End-Diastolic Volume (Preload)',
      baseline: 120,
      min: 40,
      max: 300,
      unit: 'mL',
      conceptId: 'pcg:left_ventricle',
      scale: 'organ',
      description: 'Volume of blood in the left ventricle at end-diastole, setting myocyte resting sarcomere length.',
    },
    {
      id: 'contractility',
      label: 'Myocardial Inotropy',
      baseline: 1.0,
      min: 0.2,
      max: 3.0,
      unit: 'index',
      conceptId: 'pcg:excitation_contraction_coupling',
      scale: 'cell',
      description: 'Intrinsic contractility governed by peak intracellular calcium transient and cross-bridge kinetics.',
    },
    {
      id: 'afterload_svr',
      label: 'Systemic Vascular Resistance (Afterload)',
      baseline: 1200,
      min: 400,
      max: 3500,
      unit: 'dynes·s/cm⁵',
      conceptId: 'pcg:cardiovascular_system',
      scale: 'organ_system',
      description: 'Resistance to ventricular ejection imposed by arterial tone and vascular impedance.',
    },
    {
      id: 'heart_rate',
      label: 'Heart Rate',
      baseline: 72,
      min: 30,
      max: 220,
      unit: 'bpm',
      conceptId: 'pcg:cardiac_conduction_system',
      scale: 'organ',
      description: 'Sinoatrial node firing frequency dictating cardiac cycle duration and diastolic filling time.',
    },
    {
      id: 'stroke_volume',
      label: 'Stroke Volume',
      baseline: 70,
      min: 10,
      max: 180,
      unit: 'mL',
      conceptId: 'pcg:left_ventricle',
      scale: 'organ',
      description: 'Volume of blood ejected per beat (EDV - ESV).',
    },
    {
      id: 'cardiac_output',
      label: 'Cardiac Output',
      baseline: 5.0,
      min: 1.0,
      max: 25.0,
      unit: 'L/min',
      conceptId: 'pcg:heart',
      scale: 'organ',
      description: 'Total volume of blood pumped by the ventricle per minute (HR × SV / 1000).',
    },
    {
      id: 'mean_arterial_pressure',
      label: 'Mean Arterial Pressure (MAP)',
      baseline: 93.3,
      min: 30,
      max: 200,
      unit: 'mmHg',
      conceptId: 'pcg:cardiovascular_system',
      scale: 'organ_system',
      description: 'Perfusion pressure driving systemic blood flow (MAP = CO × SVR / 80 + CVP).',
    },
  ],
  links: [
    {
      from: 'preload_edv',
      to: 'stroke_volume',
      polarity: 'positive',
      weight: 0.65,
      mechanism:
        'Frank-Starling law: myocyte stretching towards optimal filament overlap increases troponin C affinity for Ca²⁺.',
      formula: 'SV ~ EDV × EF',
    },
    {
      from: 'contractility',
      to: 'stroke_volume',
      polarity: 'positive',
      weight: 0.55,
      mechanism:
        'Increased cytosolic Ca²⁺ transient elevates peak cross-bridge cycling and systolic force.',
    },
    {
      from: 'afterload_svr',
      to: 'stroke_volume',
      polarity: 'negative',
      weight: 0.40,
      mechanism:
        'Increased aortic impedance prolongs isovolumetric contraction and decreases ejection velocity.',
    },
    {
      from: 'stroke_volume',
      to: 'cardiac_output',
      polarity: 'positive',
      weight: 0.85,
      mechanism: 'Cardiac output is directly proportional to stroke volume (CO = HR × SV).',
      formula: 'CO = (HR × SV) / 1000',
    },
    {
      from: 'heart_rate',
      to: 'cardiac_output',
      polarity: 'positive',
      weight: 0.70,
      mechanism: 'Cardiac output scales with pacing frequency within physiological filling limits.',
    },
    {
      from: 'cardiac_output',
      to: 'mean_arterial_pressure',
      polarity: 'positive',
      weight: 0.75,
      mechanism: 'Ohm’s law of hemodynamics: pressure gradient equals flow multiplied by resistance.',
      formula: 'MAP ≈ CO × SVR + CVP',
    },
    {
      from: 'afterload_svr',
      to: 'mean_arterial_pressure',
      polarity: 'positive',
      weight: 0.65,
      mechanism: 'Arteriolar vasoconstriction elevates systemic hydraulic resistance.',
    },
  ],
}

export const SAMPLE_TEACHABLE_INQUIRIES: readonly TeachableInquiry[] = [
  {
    id: 'inq:afterload_sv_response',
    networkId: 'net:cardiovascular_hemodynamics',
    prompt:
      'In a patient with isolated acute systemic vasoconstriction (SVR +40%) without immediate autonomic compensation, what is the initial change in left ventricular Stroke Volume?',
    perturbedVariableId: 'afterload_svr',
    perturbationDescription: 'SVR increased by 40%',
    targetVariableId: 'stroke_volume',
    options: [
      {
        id: 'opt_1',
        prediction: 'decrease',
        explanation:
          'Higher afterload opposes myocyte shortening during ejection, increasing end-systolic volume and reducing stroke volume.',
        isCorrect: true,
      },
      {
        id: 'opt_2',
        prediction: 'increase',
        explanation: 'Afterload does not enhance ejection; it impedes ventricular emptying.',
        isCorrect: false,
      },
      {
        id: 'opt_3',
        prediction: 'no_change',
        explanation: 'Stroke volume is sensitive to ventricular wall stress and afterload.',
        isCorrect: false,
      },
    ],
    scientificExplanation:
      'According to the force-velocity relationship of cardiac muscle and Laplace’s law, increased aortic pressure (afterload) decreases the velocity and extent of myocyte shortening, elevating end-systolic volume and acutely reducing stroke volume.',
  },
]
