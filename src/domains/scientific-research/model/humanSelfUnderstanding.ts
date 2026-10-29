/**
 * PanaceaMed Omega-Consciousness: Human Self-Understanding Engine
 * Bridging Somatic Biomarkers, Cellular Homeostasis, and Deep Self-Awareness.
 */

export interface SomaticInput {
  heartRateVariability: number; // ms (HRV - index of autonomic balance)
  cortisolProxyLevel: number; // ng/mL (cellular stress indicator)
  mitochondrialRespirationEfficiency: number; // % normal output
  subjectiveCognitiveClarity: number; // 0 to 10 scale
}

export interface SelfUnderstandingProfile {
  autonomicState: 'REST_AND_REGENERATE' | 'VIGILANCE_STRESS' | 'EXHAUSTION_CRITICAL';
  cellularResilienceIndex: number; // 0 to 100
  reflectiveInsight: string;
  auditHash: string;
}

export function analyzeHumanSelf(input: SomaticInput): SelfUnderstandingProfile {
  // Compute cellular resilience based on mitochondrial efficiency and stress
  const resilience = (input.mitochondrialRespirationEfficiency * 0.6) + 
    (Math.min(100, input.heartRateVariability * 0.8) * 0.4) - 
    (input.cortisolProxyLevel * 2.0);

  let state: 'REST_AND_REGENERATE' | 'VIGILANCE_STRESS' | 'EXHAUSTION_CRITICAL' = 'REST_AND_REGENERATE';
  if (resilience < 40) {
    state = 'EXHAUSTION_CRITICAL';
  } else if (input.cortisolProxyLevel > 15 || input.heartRateVariability < 35) {
    state = 'VIGILANCE_STRESS';
  }

  let insight = "Your cellular machinery is operating in harmonic balance. Energy production matches metabolic demand.";
  if (state === 'VIGILANCE_STRESS') {
    insight = "Elevated autonomic vigilance detected. Mitochondria are prioritizing acute stress adaptation over long-term tissue repair. Consider intentional rest and parasympathetic breathing.";
  } else if (state === 'EXHAUSTION_CRITICAL') {
    insight = "Critical cellular fatigue threshold approached. Metabolic reserve is constrained. Absolute biological recovery protocol recommended.";
  }

  const finalResilience = Math.max(0, Math.min(100, resilience));
  const rawHash = `${state}-${finalResilience}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < rawHash.length; i++) {
    hash = (hash << 5) - hash + rawHash.charCodeAt(i);
    hash |= 0;
  }

  return {
    autonomicState: state,
    cellularResilienceIndex: Number(finalResilience.toFixed(2)),
    reflectiveInsight: insight,
    auditHash: `0x${Math.abs(hash).toString(16)}`
  };
}
