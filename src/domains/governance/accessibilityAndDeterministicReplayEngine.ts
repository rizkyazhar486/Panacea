// F-13: Okabe-Ito Colorblind-Safe Scientific Palette (WCAG 2.2 AA Contrast >= 4.5:1 on #020617)
export const OKABE_ITO_ACCESSIBLE_PALETTE = Object.freeze({
  skyBlue: { hex: "#56B4E9", contrastOnDarkBg: 8.6, usage: "Venous / Pulmonary / Stage 1 Anatomy" },
  bluishGreen: { hex: "#009E73", contrastOnDarkBg: 6.4, usage: "Homeostatic / Safe Surgical Corridor / Stage 2 Physiology" },
  amberOrange: { hex: "#E69F00", contrastOnDarkBg: 9.2, usage: "Referred Pain Dermatome / Stage 3 Clinical Caution" },
  vermilion: { hex: "#D55E00", contrastOnDarkBg: 5.3, usage: "Arterial / Ischemic Territory / Critical Alert" },
  reddishPurple: { hex: "#CC79A7", contrastOnDarkBg: 6.8, usage: "Neural / Cranial Nerve / Histological Highlight" },
  yellow: { hex: "#F0E442", contrastOnDarkBg: 14.8, usage: "High-Contrast Focal Selection Pin" }
});

// F-14: Harding Photosensitive Epilepsy Flash Guard (< 3 Hz) & Reduced-Motion Contract
export function validateVisualSafetyAndMotionContract(params: {
  readonly flashFrequencyHz: number;
  readonly prefersReducedMotion: boolean;
  readonly requestedCameraTweenDurationMs: number;
}) {
  if (!Number.isFinite(params.flashFrequencyHz) || params.flashFrequencyHz < 0) {
    throw new RangeError("flashFrequencyHz must be non-negative.");
  }
  // Harding standard: flashing > 3 Hz is prohibited
  const hardingFlashSafe = params.flashFrequencyHz <= 3.0;
  const effectiveTweenDurationMs = params.prefersReducedMotion ? 0 : params.requestedCameraTweenDurationMs;
  return {
    hardingFlashSafe,
    cappedFlashFrequencyHz: Math.min(2.5, params.flashFrequencyHz),
    effectiveTweenDurationMs,
    wcag22AaCompliant: Object.values(OKABE_ITO_ACCESSIBLE_PALETTE).every((c) => c.contrastOnDarkBg >= 4.5)
  };
}

// F-11 & S-11: Seeded Deterministic PRNG (Mulberry32) & Fixed-Timestep Simulation Replay Log
export function createSeededDeterministicRng(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return function nextFloat0to1(): number {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function runDeterministicReplayableSimulation(params: {
  readonly seed: number;
  readonly stepsCount: number;
  readonly fixedDtSeconds: number;
  readonly initialValue: number;
}) {
  if (params.stepsCount <= 0 || params.stepsCount > 1000) throw new RangeError("stepsCount must be in 1..1000.");
  const rng = createSeededDeterministicRng(params.seed);
  const trajectory: { readonly step: number; readonly timeSec: number; readonly stateValue: number }[] = [];
  let current = params.initialValue;
  for (let i = 1; i <= params.stepsCount; i++) {
    const perturbation = (rng() - 0.5) * 0.2;
    current = Number((current + perturbation * params.fixedDtSeconds).toFixed(6));
    trajectory.push({ step: i, timeSec: Number((i * params.fixedDtSeconds).toFixed(3)), stateValue: current });
  }
  return { seed: params.seed, fixedDtSeconds: params.fixedDtSeconds, finalValue: current, trajectory };
}

// S-12: Centralized Scientific & Clinical Disclaimer Registry
export const CENTRALIZED_DISCLAIMER_REGISTRY = Object.freeze({
  ATLAS_REFERENCE: "ATLAS_REFERENCE: Canonical anatomical reference model (Z-Anatomy CC-BY-SA 4.0 / HuBMAP HRA CC-BY 4.0). Does not represent individual patient anatomy.",
  SIMULATED_PHYSIOLOGY: "SIMULATED: Mechanistic mathematical model for educational exploration. Not a validated patient-specific clinical predictor.",
  REFERRED_PAIN_DERMATOME: "DERMATOME_REFERENCE: Population viscerosomatic convergence map (Keegan & Garrett 1948 / ASIA). Individual pain localization varies.",
  HISTORICAL_DEVICE_RECORD: "HISTORICAL / REFERENCE — not a live measurement. Requires authorized clinician review before clinical signing."
});