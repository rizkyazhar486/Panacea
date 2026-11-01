// EDU-1 (PR #2965): Curriculum Competency Graph & Cycle Detection
export function validateCurriculumDagNoCycles(edges: ReadonlyArray<{ readonly from: string; readonly to: string }>) {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const list = adj.get(e.from) || [];
    list.push(e.to);
    adj.set(e.from, list);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function dfs(node: string): boolean {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of adj.get(node) || []) {
      if (dfs(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  for (const node of adj.keys()) {
    if (dfs(node)) throw new Error("EDU-1 Guard: Cycle detected in curriculum prerequisite graph.");
  }
  return { dagValid: true as const, nodeCount: adj.size };
}

// EDU-2 (PR #2966): Adaptive Spaced Retrieval (FSRS-4.5 Deterministic Stability & Interval)
export function scheduleFsrsRetrievalReview(stabilityDays: number, difficulty1to10: number, grade1to4: 1 | 2 | 3 | 4) {
  if (stabilityDays <= 0 || difficulty1to10 < 1 || difficulty1to10 > 10) {
    throw new RangeError("EDU-2 Guard: Invalid FSRS memory state parameters.");
  }
  const multiplier = grade1to4 === 1 ? 0.35 : grade1to4 === 2 ? 1.15 : grade1to4 === 3 ? 2.25 : 3.4;
  const nextStabilityDays = Number(Math.max(0.5, stabilityDays * multiplier * (1.1 - difficulty1to10 * 0.03)).toFixed(2));
  const nextDifficulty = Number(Math.min(10, Math.max(1, difficulty1to10 + (3 - grade1to4) * 0.45)).toFixed(2));
  return { nextStabilityDays, nextDifficulty, nextIntervalDays: Math.max(1, Math.round(nextStabilityDays)), algorithm: "FSRS_DETERMINISTIC_V4" as const };
}

// EDU-3 (PR #2967): Interactive Physiology Sandbox (Starling Filtration & Henderson-Hasselbalch)
export function computeStarlingAndAcidBaseSandbox(params: {
  capillaryHydrostaticMmHg: number;
  interstitialHydrostaticMmHg: number;
  capillaryOncoticMmHg: number;
  interstitialOncoticMmHg: number;
  filtrationCoeffKf: number;
  reflectionCoeffSigma: number;
  hco3MmolL: number;
  paCO2MmHg: number;
}) {
  const { capillaryHydrostaticMmHg, interstitialHydrostaticMmHg, capillaryOncoticMmHg, interstitialOncoticMmHg, filtrationCoeffKf, reflectionCoeffSigma, hco3MmolL, paCO2MmHg } = params;
  if (hco3MmolL <= 0 || paCO2MmHg <= 0 || filtrationCoeffKf <= 0 || reflectionCoeffSigma < 0 || reflectionCoeffSigma > 1) {
    throw new RangeError("EDU-3 Guard: Invalid Starling or acid-base inputs.");
  }
  const netFiltrationPressureMmHg = Number(((capillaryHydrostaticMmHg - interstitialHydrostaticMmHg) - reflectionCoeffSigma * (capillaryOncoticMmHg - interstitialOncoticMmHg)).toFixed(2));
  const fluidFluxJvMlMin = Number((filtrationCoeffKf * netFiltrationPressureMmHg).toFixed(3));
  const arterialPh = Number((6.1 + Math.log10(hco3MmolL / (0.03 * paCO2MmHg))).toFixed(2));
  return { netFiltrationPressureMmHg, fluidFluxJvMlMin, arterialPh, truthClass: "SIMULATED_EDUCATIONAL" as const };
}