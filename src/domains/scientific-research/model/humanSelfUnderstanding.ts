/**
 * PanaceaMed Omega-Consciousness: Human Self-Understanding Engine
 * Research-only illustrative score: NOT a physiological, psychological or clinical assessment.
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
  auditHash: string; // legacy non-cryptographic checksum; not a signature or provenance proof
  evidenceStatus: 'ILLUSTRATIVE_UNVALIDATED';
  clinicallyReviewed: false;
}

export function analyzeHumanSelf(input: SomaticInput): SelfUnderstandingProfile {
  // These inputs may only be used in a synthetic research fixture. No patient interpretation.
  if (!input || ![input.heartRateVariability, input.cortisolProxyLevel, input.mitochondrialRespirationEfficiency, input.subjectiveCognitiveClarity].every((x) => typeof x === 'number' && Number.isFinite(x))) {
    throw new TypeError('Illustrative input must contain finite numeric values');
  }
  if (input.heartRateVariability < 0 || input.cortisolProxyLevel < 0 || input.mitochondrialRespirationEfficiency < 0 || input.mitochondrialRespirationEfficiency > 100 || input.subjectiveCognitiveClarity < 0 || input.subjectiveCognitiveClarity > 10) {
    throw new RangeError('Illustrative inputs outside documented bounds');
  }
  // Arbitrary weighted composition, not a validated cellular resilience index.
  const resilience = (input.mitochondrialRespirationEfficiency * 0.6) + 
    (Math.min(100, input.heartRateVariability * 0.8) * 0.4) - 
    (input.cortisolProxyLevel * 2.0);

  let state: 'REST_AND_REGENERATE' | 'VIGILANCE_STRESS' | 'EXHAUSTION_CRITICAL' = 'REST_AND_REGENERATE';
  if (resilience < 40) {
    state = 'EXHAUSTION_CRITICAL';
  } else if (input.cortisolProxyLevel > 15 || input.heartRateVariability < 35) {
    state = 'VIGILANCE_STRESS';
  }

  const insight = 'Illustrative research-only score. No biological, autonomic, psychological, recovery, or clinical state can be inferred from this calculation.';

  const finalResilience = Math.max(0, Math.min(100, resilience));
  const rawHash = `${input.heartRateVariability}-${input.cortisolProxyLevel}-${input.mitochondrialRespirationEfficiency}-${input.subjectiveCognitiveClarity}-${state}-${finalResilience}`;
  let hash = 0;
  for (let i = 0; i < rawHash.length; i++) {
    hash = (hash << 5) - hash + rawHash.charCodeAt(i);
    hash |= 0;
  }

  return {
    autonomicState: state,
    cellularResilienceIndex: Number(finalResilience.toFixed(2)),
    reflectiveInsight: insight,
    auditHash: `0x${Math.abs(hash).toString(16)}`,
    evidenceStatus: 'ILLUSTRATIVE_UNVALIDATED',
    clinicallyReviewed: false
  };
}
