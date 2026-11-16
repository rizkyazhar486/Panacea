/**
 * First-Principles Multiscale CAD/CAE & Human Digital Exposure Engine.
 * Strictly pure & deterministic: zero clock, storage, random, or DOM access.
 */
import { DRUG_MULTISCALE_TARGET_TABLE, evaluateMultiscaleDrugAction, type CanonicalDrugId } from '../engine/drugActionEngine.ts';
import { evaluateCabgEducationalSurgicalSimulation, type CabgProcedurePhase, type SurgicalInstrumentClass } from '../engine/universalSurgicalCabgAndProceduralEngine.ts';
import { computeKroghCylinderOxygenDiffusion, computeWiggersCardiacCyclePressure } from '../engine/wiggersAndKroghPhysiologyEngine.ts';

export const CAE_ENGINE_BOUNDARY =
  'EDUCATIONAL_AND_CAE_RESEARCH_ONLY: Mechanistic mathematical models and reference CAD geometry. Not clinical diagnosis, prescribing, surgical guidance, wet-lab protocol, or consciousness upload.' as const;

export type BiologicalScale12Id =
  | 'whole-body' | 'organ-system' | 'organ' | 'tissue' | 'cell' | 'subcellular'
  | 'organelle' | 'dna-rna' | 'compound' | 'particle-ion' | 'chemical-quantum' | 'ecological-continuity';

export interface BiologicalScale12Spec {
  readonly order: number;
  readonly id: BiologicalScale12Id;
  readonly label: string;
  readonly characteristicLengthMeters: number;
  readonly lengthLabel: string;
  readonly physicalRegime: string;
  readonly epistemicBoundary: string;
}

export const TWELVE_BIOLOGICAL_SCALES: readonly BiologicalScale12Spec[] = Object.freeze([
  { order: 1, id: 'whole-body', label: 'Whole Body', characteristicLengthMeters: 1.7, lengthLabel: '1.7 m', physicalRegime: 'Rigid-body statics, balance, and kinematics', epistemicBoundary: 'Generic anthropometric reference atlas; never patient scan.' },
  { order: 2, id: 'organ-system', label: 'Organ System', characteristicLengthMeters: 0.6, lengthLabel: '60 cm', physicalRegime: 'Closed-loop hemodynamic, neural, endocrine coupling', epistemicBoundary: 'System coupling topology from published physiology.' },
  { order: 3, id: 'organ', label: 'Organ', characteristicLengthMeters: 0.12, lengthLabel: '12 cm', physicalRegime: 'Poiseuille resistance, Laplace stress, compliance', epistemicBoundary: 'Reference chamber/parenchyma model.' },
  { order: 4, id: 'tissue', label: 'Tissue', characteristicLengthMeters: 1e-4, lengthLabel: '100 µm', physicalRegime: 'Krogh radial O2 diffusion, Starling exchange, ECM', epistemicBoundary: 'Idealized capillary-tissue cylinder model.' },
  { order: 5, id: 'cell', label: 'Cell', characteristicLengthMeters: 1.2e-5, lengthLabel: '12 µm', physicalRegime: 'Nernst-Goldman equilibrium & action potential', epistemicBoundary: 'Representative differentiated Cell Ontology state.' },
  { order: 6, id: 'subcellular', label: 'Subcellular', characteristicLengthMeters: 2.5e-6, lengthLabel: '2.5 µm', physicalRegime: 'Dyadic Ca2+ microdomains & sarcomere/synapse array', epistemicBoundary: 'Sub-diffraction compartment approximation.' },
  { order: 7, id: 'organelle', label: 'Organelle', characteristicLengthMeters: 1e-6, lengthLabel: '1.0 µm', physicalRegime: 'Chemiosmotic Δp ATP synthesis & ER/Golgi flux', epistemicBoundary: 'Bioenergetic stoichiometry abstraction.' },
  { order: 8, id: 'dna-rna', label: 'DNA & RNA', characteristicLengthMeters: 2e-9, lengthLabel: '2.0 nm', physicalRegime: 'Helix electrostatics, transcription & HDR/NHEJ', epistemicBoundary: 'Locus annotation only; zero sequence/primer generation.' },
  { order: 9, id: 'compound', label: 'Compound', characteristicLengthMeters: 8e-10, lengthLabel: '0.8 nm', physicalRegime: 'Hill-Langmuir occupancy θ = [C]^n/(EC50^n+[C]^n)', epistemicBoundary: 'Pharmacodynamic occupancy model only; not dosing.' },
  { order: 10, id: 'particle-ion', label: 'Particle & Ion', characteristicLengthMeters: 1.5e-10, lengthLabel: '1.5 Å', physicalRegime: 'Debye hydration, Stokes-Einstein drift, pore flux', epistemicBoundary: 'Continuum ionic transport approximation.' },
  { order: 11, id: 'chemical-quantum', label: 'Chemical Quantum', characteristicLengthMeters: 5e-11, lengthLabel: '0.5 Å', physicalRegime: 'Barrier tunneling exp(-2κw) & spin-pair chemistry', epistemicBoundary: 'Educational quantum-chemistry heuristic; not clinical therapy.' },
  { order: 12, id: 'ecological-continuity', label: 'Longitudinal Continuity', characteristicLengthMeters: 1e3, lengthLabel: 'Human OS', physicalRegime: 'Consent-gated telemetry, 3T channel & environmental load', epistemicBoundary: 'Longitudinal continuity only — NEVER consciousness upload or digital immortality.' },
]);

export type AnatomicalSystemKey =
  | 'cardiovascular' | 'respiratory' | 'nervous' | 'musculoskeletal'
  | 'renal' | 'gastrointestinal' | 'endocrine' | 'lymphatic';

export type AtlasLayerId = 'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid';

export interface SystemMultiscaleRecord {
  readonly id: AnatomicalSystemKey;
  readonly name: string;
  readonly anatomyLayerKey: AtlasLayerId;
  readonly uberonId: string;
  readonly fmaId: string;
  readonly interconnectedWith: readonly { readonly target: AnatomicalSystemKey; readonly couplingMechanism: string }[];
  readonly physiologyLaw: string;
  readonly pathophysiologyCascade: string;
  readonly surgicalActionLink: string;
  readonly relatedDrugId: CanonicalDrugId;
  readonly scaleEntities: Readonly<Record<BiologicalScale12Id, string>>;
}

const mkSys = (
  id: AnatomicalSystemKey, name: string, anatomyLayerKey: AtlasLayerId, uberonId: string, fmaId: string,
  interconnectedWith: readonly { target: AnatomicalSystemKey; couplingMechanism: string }[],
  physiologyLaw: string, pathophysiologyCascade: string, surgicalActionLink: string,
  relatedDrugId: CanonicalDrugId, entities: readonly string[],
): SystemMultiscaleRecord => ({
  id, name, anatomyLayerKey, uberonId, fmaId, interconnectedWith,
  physiologyLaw, pathophysiologyCascade, surgicalActionLink, relatedDrugId,
  scaleEntities: Object.freeze(Object.fromEntries(TWELVE_BIOLOGICAL_SCALES.map((s, i) => [s.id, entities[i]!]))) as Readonly<Record<BiologicalScale12Id, string>>,
});

export const SYSTEM_MULTISCALE_ATLAS: Readonly<Record<AnatomicalSystemKey, SystemMultiscaleRecord>> = Object.freeze({
  cardiovascular: mkSys(
    'cardiovascular', 'Cardiovascular & Coronary Conduit', 'cardiovascular', 'UBERON:0004535', 'FMA:7088',
    [{ target: 'respiratory', couplingMechanism: 'Pulmonary return & V/Q saturation' }, { target: 'renal', couplingMechanism: 'MAP glomerular filtration & RAAS' }],
    'CO = HR × SV ; Q = π·ΔP·r⁴/(8·μ·L) ; σ = (P·r)/(2·h)',
    'LAD stenosis -> r⁴ flow drop -> ischemia -> ATP loss -> SERCA2a stiffness & ST shift.',
    'LIMA-to-LAD CABG anastomosis + Doppler PI & suture symmetry check', 'metoprolol-beta1-antagonist',
    ['Systemic circulatory chassis', 'Closed pressure-volume loops', 'Left Ventricle (FMA:7101) & LAD (FMA:3862)', 'Cx43 coupled myocardium', 'Ventricular Cardiomyocyte (CL:0000746)', 'T-tubule / SR dyadic cleft', 'Mitochondria + SERCA2a SR', 'MYH7, RYR2, ADRB1, SCN5A', 'Metoprolol / ATP / cAMP', 'Ca2+ transient, Na+, K+', 'Myosin ATP γ-phosphate polarization', 'Consent-gated HR/BP/VO2max continuity'],
  ),
  respiratory: mkSys(
    'respiratory', 'Respiratory & Alveolar Diffusion', 'visceral', 'UBERON:0001004', 'FMA:7195',
    [{ target: 'cardiovascular', couplingMechanism: 'RV afterload vs alveolar capillary flow' }, { target: 'nervous', couplingMechanism: 'Phrenic C3–C5 diaphragm drive' }],
    'PAO2 = FiO2·(Pb-47)-PaCO2/R ; P = 2·γ/r ; J = D·A·ΔP/d',
    'Surfactant loss / edema -> higher γ and barrier d -> shunt hypoxia & stiff lungs.',
    'Bronchoscopy airway lumen & tube thoracostomy triangle mapping', 'salbutamol-beta2-agonist',
    ['Thoracic rib-cage bellows', 'Conducting airways + acini', 'Bilateral Lungs (FMA:7195)', '0.5 µm alveolar-capillary barrier', 'Type I/II Pneumocyte (CL:0002062)', 'Apical β2-AR/CFTR zone', 'Lamellar bodies (DPPC)', 'SFTPB, SFTPC, CFTR, ADRB2', 'DPPC / O2 / CO2 / Salbutamol', 'Dissolved O2, Cl-, HCO3-', 'Fe2+-O2 Hb spin transition', 'SpO2 & PM2.5 environmental telemetry'],
  ),
  nervous: mkSys(
    'nervous', 'Central & Autonomic Neural Connectome', 'nervous', 'UBERON:0001016', 'FMA:50801',
    [{ target: 'musculoskeletal', couplingMechanism: 'Corticospinal UMN -> α-motor LMN' }, { target: 'endocrine', couplingMechanism: 'Hypothalamic HPT/HPA axis' }],
    'E_ion = (R·T/z·F)·ln([out]/[in]) ; λ = sqrt(r_m/r_i)',
    'Brainstem PCA perforator infarct -> ipsilateral CN III palsy + contralateral hemiparesis.',
    'Safe dissection margin around phrenic & cranial nerve tracts', 'metoprolol-beta1-antagonist',
    ['Reflex posture & reaction loop', 'Decussating CNS/PNS connectome', 'Encephalon (FMA:50801) & Spinal Cord', 'Myelinated pyramidal tracts', 'Pyramidal Betz Neuron (CL:0000128)', 'Pre/postsynaptic SNARE/PSD-95', 'Synaptic vesicles & axon mitochondria', 'SCN1A, BDNF, GRIN2A', 'Glutamate, GABA, ACh, NE', 'Na+, K+, Ca2+ vesicular trigger', 'Retinal photoisomerization & spin model', 'Sleep & fatigue continuity — never consciousness upload'],
  ),
  musculoskeletal: mkSys(
    'musculoskeletal', 'Musculoskeletal Chassis & Kinematic Levers', 'muscular', 'UBERON:0002204', 'FMA:7161',
    [{ target: 'nervous', couplingMechanism: 'Ia spindle reflex stabilization' }, { target: 'cardiovascular', couplingMechanism: 'Skeletal-muscle venous return pump' }],
    'τ_joint = F·d·sin(θ) ; σ = F/A ; F = Δp/Δt',
    'Repetitive asymmetric load -> tendinopathy, subacromial impingement & disc shear.',
    'Orthopedic alignment axes, osteotomy planes & ergonomic workstation posture', 'salbutamol-beta2-agonist',
    ['Bipedal gait & posture balance', '206-bone lever & 600+ muscle actuators', 'Femur (FMA:9611) & Rotator Cuff', 'Cross-linked Type I tendon collagen', 'Skeletal Myofiber & Osteocyte', '2.2 µm sarcomere A/I bands', 'Triad junctional SR + mitochondria', 'MYH2, ACTN3, COL1A1, RYR1', 'Actomyosin-ATP & Creatine-P', 'Ca2+ TnC & Mg2+-ATPase cofactor', 'Collagen H-bond piezoelectric shift', 'Gait symmetry & ergonomic strain log'],
  ),
  renal: mkSys(
    'renal', 'Renal Filtration & Electrolyte Homeostasis', 'visceral', 'UBERON:0001008', 'FMA:7203',
    [{ target: 'cardiovascular', couplingMechanism: 'Pressure-natriuresis volume loop' }, { target: 'respiratory', couplingMechanism: 'HCO3- / PaCO2 acid-base coupling' }],
    'GFR = Kf·[(P_GC - P_BS) - (π_GC - π_BS)]',
    'Pre-renal hypoperfusion or nephrotoxin injury -> GFR drop -> hyperkalemia & acidosis.',
    'Renal hilum pedicle & retroperitoneal plane preservation', 'furosemide-nkcc2-inhibitor',
    ['Total body water (60% BW) balance', 'Countercurrent nephron multiplier', 'Bilateral Kidneys (FMA:7203)', 'Podocyte slit diaphragm & GBM', 'Loop of Henle TAL epithelial cell', 'Apical NKCC2 & Na/K-ATPase domain', 'Dense cristae tubular mitochondria', 'SLC12A1, AQP2, REN, ACE', 'Furosemide, Aldosterone, AVP, Urea', 'Na+, K+, 2Cl-, H2O selectivity', 'Aquaporin Grotthuss proton exclusion', 'Hydration & nephrotoxin safety boundary'],
  ),
  gastrointestinal: mkSys(
    'gastrointestinal', 'Gastrointestinal & Hepatobiliary Portal Axis', 'visceral', 'UBERON:0001007', 'FMA:7197',
    [{ target: 'endocrine', couplingMechanism: 'Incretin GLP-1 & first-pass clearance' }, { target: 'lymphatic', couplingMechanism: 'Chyle lacteal & GALT immunity' }],
    'CL_H = Q_H·(fu·CL_int)/(Q_H + fu·CL_int)',
    'Cystic duct obstruction -> raised wall tension -> ischemia & Calot inflammation.',
    'Laparoscopic Strasberg Critical View of Safety (Calot triangle)', 'lisinopril-ace-inhibitor',
    ['Caloric uptake & xenobiotic barrier', 'Alimentary canal + portal tree', 'Liver (FMA:7197) & Gallbladder', 'Hexagonal hepatic lobules Zone 1–3', 'Hepatocyte & Brush Enterocyte', 'ABCB11 bile canalicular domain', 'Smooth ER CYP450 & peroxisomes', 'CYP3A4, CYP2C19, UGT1A1, ABCB11', 'Bile salts, Bilirubin, SCFAs', 'SGLT1 Na+/glucose & H+/K+ pump', 'CYP450 Compound I oxo-heme state', 'Daily macronutrient energy balance'],
  ),
  endocrine: mkSys(
    'endocrine', 'Endocrine HPA/HPT & Metabolic Control', 'visceral', 'UBERON:0000949', 'FMA:9668',
    [{ target: 'nervous', couplingMechanism: 'Circadian SCN -> CRH/TRH pulse' }, { target: 'cardiovascular', couplingMechanism: 'T3 β1 receptor & SVR tone' }],
    'HOMA ~ (G·I)/22.5 ; d[H]/dt = S(feedback) - k·[H]',
    'Sleep/cortisol misalignment -> IRS-1 serine phosphorylation -> insulin resistance.',
    'Recurrent laryngeal nerve & parathyroid gland thyroidectomy margin', 'lisinopril-ace-inhibitor',
    ['Basal metabolic & circadian stability', 'Hypothalamic-Pituitary-Target loops', 'Thyroid (FMA:9603) & Pancreatic Islets', 'Fenestrated endocrine sinusoids', 'Pancreatic β-cell (CL:0000169)', 'K_ATP closure -> Ca_V1.2 granule dock', 'Rough ER & Golgi Zn insulin core', 'INS, KCNJ11, TSHR, NR3C1', 'Insulin, Cortisol, T3, Glucose', 'ATP/ADP-gated K+ suppression', 'Deiodinase Se-transfer bond shift', 'Circadian sleep regularity & TDEE log'],
  ),
  lymphatic: mkSys(
    'lymphatic', 'Lymphatic Drainage & Adaptive Immunity', 'lymphoid', 'UBERON:0002405', 'FMA:74594',
    [{ target: 'cardiovascular', couplingMechanism: 'Thoracic duct ~3 L/d venous return' }, { target: 'respiratory', couplingMechanism: 'BALT & hilar antigen clearance' }],
    'dT/dt = r·T·(1 - T/K) - δ·T',
    'Nodal obstruction or IL-6/TNF storm -> interstitial edema & distributive shock.',
    'Sentinel node basin mapping & thoracic duct preservation', 'furosemide-nkcc2-inhibitor',
    ['Systemic immune & lymph return loop', 'Nodal germinal centers & thoracic duct', 'Spleen (FMA:7196) & Thymus', 'Germinal light/dark fibroblastic zones', 'Dendritic APC & CD4+ T-helper cell', 'MHC-II / TCR immunological synapse', 'Endolysosome MHC peptide-loader', 'HLA-DRB1, IGH V(D)J, FOXP3', 'IgG (~150 kDa), IL-2, Perforin', 'Acidic endosomal H+ V-ATPase pump', 'CDR electrostatic-van der Waals binding', 'Adaptive immunization kinetic education'],
  ),
});

export type FirstPrinciplesCaseId = 'poiseuille-hemodynamics' | 'nernst-electrochemical' | 'laplace-alveolar-ventilation' | 'laplace-myocardial-stress';

export interface FirstPrinciplesInput {
  readonly caseId: FirstPrinciplesCaseId;
  readonly radiusPrimary: number;
  readonly secondaryDimension: number;
  readonly drivingParamA: number;
  readonly drivingParamB: number;
  readonly drivingParamC?: number;
}

const isPos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

export function evaluateFirstPrinciplesCase(input: FirstPrinciplesInput) {
  if (!input || typeof input !== 'object') return { ok: false as const, error: 'Missing FirstPrinciplesInput.', truthClass: 'SIMULATED_EDUCATIONAL' as const };
  const { radiusPrimary, secondaryDimension, drivingParamA, drivingParamB } = input;
  if (![radiusPrimary, secondaryDimension, drivingParamA, drivingParamB].every(isPos)) {
    return { ok: false as const, error: 'Primary dimensions and parameters must be finite positive numbers.', truthClass: 'SIMULATED_EDUCATIONAL' as const };
  }

  switch (input.caseId) {
    case 'poiseuille-hemodynamics': {
      const dP = drivingParamA - drivingParamB;
      const mu = input.drivingParamC ?? 0.0035;
      if (dP <= 0) return { ok: false as const, error: 'Upstream pressure must exceed downstream pressure (ΔP > 0).', truthClass: 'SIMULATED_EDUCATIONAL' as const };
      if (!isPos(mu) || mu < 0.001 || mu > 0.02) return { ok: false as const, error: 'Viscosity μ must lie within [0.001, 0.02] Pa·s.', truthClass: 'SIMULATED_EDUCATIONAL' as const };
      const rM = radiusPrimary / 1000, lenM = secondaryDimension / 1000, dPPa = dP * 133.322;
      const flowM3s = (Math.PI * dPPa * Math.pow(rM, 4)) / (8 * mu * lenM);
      const flowMlMin = Number((flowM3s * 6e7).toFixed(2));
      const shearPa = Number(((4 * mu * flowM3s) / (Math.PI * Math.pow(rM, 3))).toFixed(2));
      return {
        ok: true as const, caseId: input.caseId, title: 'First Principles: Vascular Hemodynamics & Shear',
        step1StripAssumptions: 'Strip empirical notion that lumen narrowing lowers blood flow linearly.',
        step2ImmutableAxioms: ['Navier-Stokes laminar balance', 'No-slip boundary v(R)=0 yielding r⁴ dependence'],
        step3DeductiveSteps: [`r=${radiusPrimary.toFixed(2)}mm, ΔP=${dP.toFixed(1)}mmHg -> Q=${flowMlMin} mL/min, τ_w=${shearPa} Pa.`],
        primaryMetricLabel: 'Poiseuille Flow (Q)', primaryValue: flowMlMin, primaryUnit: 'mL/min',
        secondaryMetricLabel: 'Wall Shear (τ_w)', secondaryValue: shearPa, secondaryUnit: 'Pa',
        stressRatio0to1: Number(Math.min(1, shearPa / 8).toFixed(3)),
        physicsAlert: shearPa > 5 ? 'High wall shear (>5 Pa): turbulence/endothelial stress.' : shearPa < 0.5 ? 'Low shear (<0.5 Pa): stasis trend.' : 'Physiological laminar band (0.5–5 Pa).',
        truthClass: 'SIMULATED_EDUCATIONAL' as const, boundaryNotice: CAE_ENGINE_BOUNDARY,
      };
    }
    case 'nernst-electrochemical': {
      const z = input.drivingParamC ?? 1;
      if (typeof z !== 'number' || !Number.isFinite(z) || z === 0 || Math.abs(z) > 4) {
        return { ok: false as const, error: 'Valence z must be non-zero in [-4, 4].', truthClass: 'SIMULATED_EDUCATIONAL' as const };
      }
      const tempK = 273.15 + radiusPrimary;
      const thermalMv = Number(((8.314462618 * tempK) / 96485.33212 * 1000).toFixed(2));
      const nernstMv = Number(((thermalMv / z) * Math.log(drivingParamA / drivingParamB)).toFixed(2));
      return {
        ok: true as const, caseId: input.caseId, title: 'First Principles: Nernst Electrochemical Equilibrium',
        step1StripAssumptions: 'Strip memorized voltage offsets; derive membrane equilibrium thermodynamically.',
        step2ImmutableAxioms: ['Entropy gradient RT·ln([out]/[in])', 'Electrostatic potential work z·F·ΔV'],
        step3DeductiveSteps: [`T=${tempK.toFixed(1)}K (RT/F=${thermalMv} mV), z=${z} -> E_eq=${nernstMv} mV.`],
        primaryMetricLabel: 'Equilibrium E_eq', primaryValue: nernstMv, primaryUnit: 'mV',
        secondaryMetricLabel: 'Thermal RT/F', secondaryValue: thermalMv, secondaryUnit: 'mV',
        stressRatio0to1: Number(Math.min(1, Math.abs(nernstMv) / 140).toFixed(3)),
        physicsAlert: nernstMv > 30 ? 'Depolarizing inward ion equilibrium.' : nernstMv < -75 ? 'Hyperpolarizing clamp range.' : 'Intermediate reversal range.',
        truthClass: 'SIMULATED_EDUCATIONAL' as const, boundaryNotice: CAE_ENGINE_BOUNDARY,
      };
    }
    case 'laplace-alveolar-ventilation': {
      const pMmHg = Number(((2 * drivingParamA * 1e-3) / (radiusPrimary * 1e-6) / 133.322).toFixed(2));
      const fickIdx = Number(((0.5 / secondaryDimension) * (drivingParamB / 60) * 100).toFixed(1));
      return {
        ok: true as const, caseId: input.caseId, title: 'First Principles: Alveolar Collapse & Fick O2',
        step1StripAssumptions: 'Strip heuristic breath targets; derive acinar stability from surface tension.',
        step2ImmutableAxioms: ['Young-Laplace P = 2γ / r', 'Fick gas diffusion J ∝ ΔPO2 / δ'],
        step3DeductiveSteps: [`r=${radiusPrimary}µm, γ=${drivingParamA}mN/m -> Collapse P=${pMmHg} mmHg; Fick Index=${fickIdx}%.`],
        primaryMetricLabel: 'Laplace Collapse P', primaryValue: pMmHg, primaryUnit: 'mmHg',
        secondaryMetricLabel: 'Fick Index', secondaryValue: fickIdx, secondaryUnit: '% ref',
        stressRatio0to1: Number(Math.min(1, pMmHg / 25).toFixed(3)),
        physicsAlert: pMmHg > 12 || fickIdx < 50 ? 'Atelectasis / thickened membrane penalty.' : 'Surfactant-stabilized diffusion.',
        truthClass: 'SIMULATED_EDUCATIONAL' as const, boundaryNotice: CAE_ENGINE_BOUNDARY,
      };
    }
    case 'laplace-myocardial-stress': {
      const wiggers = computeWiggersCardiacCyclePressure(160, drivingParamB);
      const pKpa = drivingParamA * 0.133322;
      const sigma = Number(((pKpa * (radiusPrimary / 1000)) / (2 * (secondaryDimension / 1000))).toFixed(2));
      const rpp = Number(((drivingParamA * drivingParamB) / 1000).toFixed(2));
      return {
        ok: true as const, caseId: input.caseId, title: 'First Principles: CAE LV Myocardial Wall Stress',
        step1StripAssumptions: 'Strip BP-only afterload; include chamber radius r & wall thickness h.',
        step2ImmutableAxioms: ['Hemisphere balance P·πr² = σ·2πrh', 'Laplace tension σ = (P·r)/(2·h)'],
        step3DeductiveSteps: [`r=${radiusPrimary}mm, h=${secondaryDimension}mm, P=${drivingParamA}mmHg -> σ=${sigma} kPa (${wiggers.phaseName}).`],
        primaryMetricLabel: 'LV Wall Stress (σ)', primaryValue: sigma, primaryUnit: 'kPa',
        secondaryMetricLabel: 'RPP O2 Proxy', secondaryValue: rpp, secondaryUnit: '×10³',
        stressRatio0to1: Number(Math.min(1, sigma / 65).toFixed(3)),
        physicsAlert: sigma > 45 ? 'Elevated afterload/dilation sarcomere wall stress.' : 'Balanced wall thickness/stress ratio.',
        truthClass: 'SIMULATED_EDUCATIONAL' as const, boundaryNotice: CAE_ENGINE_BOUNDARY,
      };
    }
  }
}

const LAYER_BASE_VECTORS: Readonly<Record<AtlasLayerId, readonly [number, number, number]>> = Object.freeze({
  surface: [0, 0.35, 0.72], muscular: [0.65, 0.08, 0.36], skeletal: [-0.65, -0.08, 0],
  cardiovascular: [-0.28, 0.12, -0.45], nervous: [0, 0.48, -0.62], visceral: [0.3, -0.22, -0.35], lymphoid: [-0.45, 0.25, -0.25],
});

export function computeAxisExplodeAndProjectile(input: { readonly explodeX: number; readonly explodeY: number; readonly explodeZ: number; readonly projectileFactor: number }) {
  const clampA = (n: number) => (Number.isFinite(n) ? Math.max(-1.5, Math.min(1.5, n)) : 0);
  const ex = clampA(input.explodeX), ey = clampA(input.explodeY), ez = clampA(input.explodeZ);
  const proj = Number.isFinite(input.projectileFactor) ? Math.max(0, Math.min(1, input.projectileFactor)) : 0;
  const out = {} as Record<AtlasLayerId, readonly [number, number, number]>;
  for (const k of Object.keys(LAYER_BASE_VECTORS) as AtlasLayerId[]) {
    const b = LAYER_BASE_VECTORS[k];
    const v = [Number((b[0] * (ex + proj * 0.85)).toFixed(4)), Number((b[1] * (ey + proj * 0.65)).toFixed(4)), Number((b[2] * (ez + proj * 0.9)).toFixed(4))] as const;
    out[k] = [v[0] || 0, v[1] || 0, v[2] || 0] as const;
  }
  return Object.freeze(out);
}

export function evaluateLaserAndCaeInspection(cfg: { readonly wavelengthNm: number; readonly slicePitchMm: number; readonly scanSpeedMmSec: number; readonly fluenceMjCm2: number }) {
  if (![cfg.wavelengthNm, cfg.slicePitchMm, cfg.scanSpeedMmSec, cfg.fluenceMjCm2].every(isPos)) {
    return { ok: false as const, error: 'Laser calibration values must be positive finite numbers.' };
  }
  const contours = Number((10 / cfg.slicePitchMm).toFixed(1));
  const thermal = Number(((cfg.fluenceMjCm2 * 10) / (cfg.scanSpeedMmSec * cfg.slicePitchMm)).toFixed(2));
  const surfaceSafetyStatus = cfg.fluenceMjCm2 > 150 || thermal > 25 ? ('EXCEEDS_EDUCATIONAL_SAFE_CONTOUR_LIMIT' as const) : ('WITHIN_NON_ABLATIVE_SCAN_ENVELOPE' as const);
  return { ok: true as const, nyquistContoursPerCm: contours, thermalLoadIndex: thermal, surfaceSafetyStatus, truthClass: 'SIMULATED_EDUCATIONAL' as const };
}

export function evaluateSurgicalSutureQuality(input: {
  readonly procedurePhase: CabgProcedurePhase; readonly instrument: SurgicalInstrumentClass;
  readonly graftRadiusMm: number; readonly graftLengthMm: number; readonly mapMmHg: number; readonly distalPressureMmHg: number;
  readonly distanceToPhrenicMm: number; readonly stitchSpacingMm: number; readonly biteDepthMm: number;
  readonly tensionUniformity0to1: number; readonly edgeAppositionGapMm: number;
}) {
  if (!isPos(input.stitchSpacingMm) || !isPos(input.biteDepthMm) || !Number.isFinite(input.tensionUniformity0to1) || input.tensionUniformity0to1 < 0 || input.tensionUniformity0to1 > 1 || !Number.isFinite(input.edgeAppositionGapMm) || input.edgeAppositionGapMm < 0) {
    return { ok: false as const, error: 'Invalid suture geometry or tension bounds.' };
  }
  const cabg = evaluateCabgEducationalSurgicalSimulation({
    sessionId: 'cad-cae-studio', currentPhase: input.procedurePhase, selectedInstrument: input.instrument,
    nativeLadStenosisPercent: 85, limaGraftRadiusMm: input.graftRadiusMm, limaGraftLengthMm: input.graftLengthMm,
    meanAorticRootPressureMmHg: input.mapMmHg, distalCoronaryBedPressureMmHg: input.distalPressureMmHg,
    anastomosisPatencyQuality0to1: Math.max(0.15, Math.min(1, 1 - input.edgeAppositionGapMm * 0.45)),
    distanceToLeftPhrenicNerveMm: input.distanceToPhrenicMm,
  });
  const defects: string[] = [];
  let score = 100;
  if (input.stitchSpacingMm < 0.7 || input.stitchSpacingMm > 1.8) { defects.push('STITCH_SPACING_OUT_OF_NOMINAL_8_0_BAND'); score -= 22; }
  if (input.biteDepthMm < 0.5 || input.biteDepthMm > 1.5) { defects.push('TISSUE_BITE_DEPTH_ASYMMETRY'); score -= 20; }
  if (input.tensionUniformity0to1 < 0.75) { defects.push('UNEQUAL_SUTURE_TENSION_RISK'); score -= 25; }
  if (input.edgeAppositionGapMm > 0.25) { defects.push('ANASTOMOTIC_INTIMAL_GAP_RISK'); score -= 28; }
  if (cabg.structuresAtRiskAlert.startsWith('PHRENIC')) { defects.push('PHRENIC_NERVE_CORRIDOR_PROXIMITY'); score -= 15; }
  const finalScore = Math.max(0, score);
  return { ok: true as const, cabg, sutureQualityScore: finalScore, verdict: defects.length === 0 ? 'PASS' : finalScore >= 65 ? 'REVIEW' : 'ANOMALY', detectedAnomalies: defects, truthClass: 'SIMULATED_EDUCATIONAL' as const };
}

export function evaluateFrontierDiscoveryEducation(i: {
  readonly vaccinePeakResponsePct: number; readonly vaccineHalfLifeDays: number; readonly daysPostPriming: number;
  readonly stemStateWeights: readonly [number, number, number]; readonly hdrEvents: number; readonly nhejEvents: number;
  readonly phredQScore: number; readonly readCount: number; readonly readLengthBp: number; readonly targetPanelBp: number;
}) {
  if (!isPos(i.vaccinePeakResponsePct) || !isPos(i.vaccineHalfLifeDays) || !Number.isFinite(i.daysPostPriming) || i.daysPostPriming < 0 ||
    i.stemStateWeights.some((w) => !Number.isFinite(w) || w < 0) || !Number.isFinite(i.hdrEvents) || i.hdrEvents < 0 ||
    !Number.isFinite(i.nhejEvents) || i.nhejEvents < 0 || !Number.isFinite(i.phredQScore) || i.phredQScore <= 0 || i.phredQScore > 60 ||
    !isPos(i.readCount) || !isPos(i.readLengthBp) || !isPos(i.targetPanelBp)) {
    return { ok: false as const, error: 'All discovery and sequencing QC inputs must be valid bounded numbers.' };
  }
  const wSum = i.stemStateWeights.reduce((a, b) => a + b, 0);
  const norm = wSum > 0 ? i.stemStateWeights.map((w) => w / wSum) : [1 / 3, 1 / 3, 1 / 3];
  const breaks = i.hdrEvents + i.nhejEvents;
  return {
    ok: true as const,
    vaccineAdaptiveRetentionPct: Number((i.vaccinePeakResponsePct * Math.pow(0.5, i.daysPostPriming / i.vaccineHalfLifeDays)).toFixed(2)),
    stemEntropyBits: Number((-norm.reduce((acc, p) => (p > 0 ? acc + p * Math.log2(p) : acc), 0)).toFixed(3)),
    hdrPrecisionRatioPct: breaks > 0 ? Number(((i.hdrEvents / breaks) * 100).toFixed(1)) : 0,
    phredBaseErrorProb: Number(Math.pow(10, -i.phredQScore / 10).toExponential(2)),
    landerWatermanCoverage: Number(((i.readCount * i.readLengthBp) / i.targetPanelBp).toFixed(2)),
    truthClass: 'SIMULATED_EDUCATIONAL' as const,
  };
}

export type ChannelEnvironmentKind = 'urban_5g_fiber' | 'rural_3t' | 'underground_basement' | 'maritime_open_sea' | 'remote_island';
export type TransportBearerKind = 'offline-queue' | 'ble-mesh' | '2g-edge' | '3g-umts' | '4g-lte' | '5g-nr' | 'fiber-optic' | 'leo-satellite';

export function selectAdaptive3TChannel(input: { readonly environment: ChannelEnvironmentKind; readonly activeBearer: TransportBearerKind; readonly bandwidthKHz: number; readonly snrLinear: number; readonly pendingPacketsKb: number }) {
  if (!isPos(input.bandwidthKHz) || !Number.isFinite(input.snrLinear) || input.snrLinear < 0 || !Number.isFinite(input.pendingPacketsKb) || input.pendingPacketsKb < 0) {
    return { ok: false as const, error: 'Bandwidth must be >0; SNR and queue must be non-negative.' };
  }
  const shannonUpperKbps = Number((input.bandwidthKHz * Math.log2(1 + input.snrLinear)).toFixed(2));
  const eff = input.activeBearer === 'offline-queue' ? 0 : Number((shannonUpperKbps * 0.55).toFixed(2));
  const payloadPolicy = eff <= 0 ? 'STORE_AND_FORWARD_DELTA' : eff < 120 ? 'VITALS_JSON_COMPACT' : eff < 2500 ? 'GLB_LOD2_PROGRESSIVE' : 'FULL_UHD_STREAM';
  return {
    ok: true as const,
    sourceChannelDestination: `Source(LocalPatientState)->Channel(${input.activeBearer}/${input.environment})->Destination(SyncOutbox)`,
    shannonUpperKbps, effectivePayloadKbps: eff, payloadPolicy,
    estimatedDrainSec: eff > 0 ? Number(((input.pendingPacketsKb * 8) / eff).toFixed(2)) : null,
    truthClass: 'DERIVED_ENGINEERING_MODEL' as const,
  };
}

export interface EmergencyRoadEdge { readonly from: string; readonly to: string; readonly baseDistanceKm: number; readonly trafficMultiplier: number; readonly hazardBlocked?: boolean; }

export function planEmergencyNetworkDijkstra(p: { readonly edges: readonly EmergencyRoadEdge[]; readonly origin: string; readonly destination: string; readonly availableBeds: number; readonly incomingPatients: number }) {
  if (!p.origin.trim() || !p.destination.trim() || !Number.isFinite(p.availableBeds) || !Number.isFinite(p.incomingPatients) || p.availableBeds < 0 || p.incomingPatients < 0) {
    return { ok: false as const, error: 'Invalid origin/destination or supply-demand counts.' };
  }
  const adj = new Map<string, { node: string; cost: number }[]>(), nodes = new Set<string>([p.origin, p.destination]);
  for (const e of p.edges) {
    if (e.hazardBlocked || !isPos(e.baseDistanceKm) || !Number.isFinite(e.trafficMultiplier) || e.trafficMultiplier < 1) continue;
    nodes.add(e.from); nodes.add(e.to);
    (adj.get(e.from) ?? adj.set(e.from, []).get(e.from)!).push({ node: e.to, cost: Number((e.baseDistanceKm * e.trafficMultiplier).toFixed(3)) });
  }
  const dist = new Map<string, number>(), prev = new Map<string, string>(), unvisited = new Set<string>(nodes);
  for (const n of nodes) dist.set(n, Infinity);
  dist.set(p.origin, 0);
  while (unvisited.size > 0) {
    let u: string | null = null, best = Infinity;
    for (const c of unvisited) { const d = dist.get(c) ?? Infinity; if (d < best) { best = d; u = c; } }
    if (!u || u === p.destination || !Number.isFinite(best)) break;
    unvisited.delete(u);
    for (const ed of adj.get(u) ?? []) {
      const alt = best + ed.cost;
      if (unvisited.has(ed.node) && alt < (dist.get(ed.node) ?? Infinity)) { dist.set(ed.node, alt); prev.set(ed.node, u); }
    }
  }
  const total = dist.get(p.destination) ?? Infinity;
  const supplyDemandStatus = p.availableBeds >= p.incomingPatients ? 'CAPACITY_ADEQUATE' : 'SURGE_DEFICIT_ESCALATE';
  if (!Number.isFinite(total)) return { ok: true as const, reachable: false as const, path: [] as string[], weightedDistanceKm: null, supplyDemandStatus, truthClass: 'SIMULATED_EDUCATIONAL' as const };
  const path: string[] = [];
  for (let c: string | undefined = p.destination; c !== undefined; c = prev.get(c)) path.unshift(c);
  return { ok: true as const, reachable: true as const, path, weightedDistanceKm: Number(total.toFixed(2)), supplyDemandStatus, truthClass: 'SIMULATED_EDUCATIONAL' as const };
}

export function evaluateErgonomicHumanLoad(p: { readonly neckFlexionDeg: number; readonly screenDistanceCm: number; readonly continuousMinutes: number }) {
  if (!Number.isFinite(p.neckFlexionDeg) || p.neckFlexionDeg < 0 || p.neckFlexionDeg > 90 || !isPos(p.screenDistanceCm) || !Number.isFinite(p.continuousMinutes) || p.continuousMinutes < 0) {
    return { ok: false as const, error: 'Ergonomic inputs must be finite physical measurements.' };
  }
  const effectiveCervicalLoadKg = Number((5 + 22 * Math.sin((p.neckFlexionDeg * Math.PI) / 180)).toFixed(1));
  return { ok: true as const, effectiveCervicalLoadKg, needsMicroBreakOrAdjustment: p.continuousMinutes >= 45 || p.neckFlexionDeg > 25 || p.screenDistanceCm < 40, truthClass: 'DERIVED_ENGINEERING_MODEL' as const };
}

export function evaluateMultiscalePharmacologyForSystem(drugId: CanonicalDrugId, concentration: number, unit: 'nM' | 'uM') {
  return {
    drugMeta: DRUG_MULTISCALE_TARGET_TABLE[drugId],
    occupancy: evaluateMultiscaleDrugAction({ drugId, concentration, unit }),
    kroghSample: computeKroghCylinderOxygenDiffusion({ capillaryPo2MmHg: 95, tissueRadiusMicrons: 32, KroghDiffusionCoefficientK: 2.1, oxygenConsumptionRateMmolSec: 0.04 }),
  };
}

export function computeCochlearGreenwoodFrequency(normalizedApexToBase0to1: number) {
  if (typeof normalizedApexToBase0to1 !== 'number' || !Number.isFinite(normalizedApexToBase0to1) || normalizedApexToBase0to1 < 0 || normalizedApexToBase0to1 > 1) {
    return { ok: false as const, error: 'Cochlear basilar position x must lie within [0, 1].' };
  }
  const frequencyHz = Number((165.4 * (Math.pow(10, 2.1 * normalizedApexToBase0to1) - 0.88)).toFixed(1));
  const band = frequencyHz < 500 ? 'LOW_FREQUENCY_APEX' : frequencyHz < 3000 ? 'MID_FREQUENCY_SPEECH' : 'HIGH_FREQUENCY_BASE';
  return { ok: true as const, frequencyHz, band, formula: 'f(x) = 165.4*(10^(2.1*x)-0.88)', truthClass: 'SIMULATED_EDUCATIONAL' as const };
}

export function evaluateMicrofluidicChipFlow(p: { readonly hydraulicDiameterUm: number; readonly velocityMmSec: number; readonly dynamicViscosityPaSec?: number }) {
  const mu = p.dynamicViscosityPaSec ?? 0.001;
  if (!isPos(p.hydraulicDiameterUm) || !isPos(p.velocityMmSec) || !isPos(mu)) return { ok: false as const, error: 'Microfluidic parameters must be positive finite numbers.' };
  const reynoldsNumber = Number(((1000 * (p.velocityMmSec * 1e-3) * (p.hydraulicDiameterUm * 1e-6)) / mu).toFixed(4));
  return { ok: true as const, reynoldsNumber, regime: reynoldsNumber < 2100 ? ('LAMINAR_DIFFUSION_CONTROLLED' as const) : ('TRANSITIONAL_OR_TURBULENT' as const), truthClass: 'SIMULATED_EDUCATIONAL' as const };
}

export const BIOMED_FRONTIER_EXHIBIT_MAP = Object.freeze([
  { id: 'daily-bia-wearables', title: 'Daily Health Monitoring (BIA & Wearables)', domainLink: 'Smart Analyzer + Longitudinal Telemetry', boundary: 'Measured observations separated from estimates' },
  { id: 'pharmacogenomics', title: 'Genetic Testing & Precision Medicine', domainLink: '12-Scale Locus + CYP/Target Model', boundary: 'Educational PGx concepts — not clinical genotyping' },
  { id: 'neural-cochlear-fes', title: 'Neural Scaffold Conduit, Cochlear Array & FES', domainLink: 'Nervous/Musculoskeletal + Greenwood Tonotopy', boundary: 'Reference neuro-engineering physics only' },
  { id: 'artificial-heart-stent-cabg', title: 'LVAD Impeller, Robotic Stent & CABG Corridor', domainLink: 'Cardiovascular + Poiseuille/Suture QA', boundary: 'Educational surgical hemodynamics only' },
  { id: 'microfluidics-bioprint-synbio', title: 'Microfluidics Lab-on-a-Chip, 3D Bioprinting & SynBio', domainLink: 'Re Laminar Chip Solver + Tissue/Organ Scale', boundary: 'Zero sequences, primers, or wet-lab protocols' },
  { id: 'spinal-orthopedics', title: 'Spinal Assisted Orthopedics & Ergonomic Load', domainLink: 'Musculoskeletal Lever + Cervical Flexion CAE', boundary: 'Biomechanical teaching model only' },
  { id: 'remote-5g-ambulance-surgery', title: 'Remote 5G ICU Ambulance, Tele-Surgery & Surveillance', domainLink: '3T Adaptive Channel + Dijkstra Logistics', boundary: 'Advises routing only — clinicians retain authority' },
  { id: 'tcm-digitization-reference', title: 'Digital Chinese Medicine & Meridian Educational Diagram', domainLink: 'Cultural/Historical Reference Overlay', boundary: 'Demonstration reference only; distinct from clinical evidence' },
  { id: 'bionic-soft-auv-logistics', title: 'Bionic Soft Actuation, AUV Drag & Intelligent Logistics', domainLink: 'Soft-Compliance + Operations Research Routing', boundary: 'Cross-domain engineering inspiration' },
]);
