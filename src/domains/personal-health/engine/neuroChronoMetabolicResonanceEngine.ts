/**
 * Neuro-Chrono-Metabolic Resonance Engine (ASC-1E) — Minimalist Daily Biological Tempo OS.
 * Citations: Brown TM et al. PLoS Biol. 2022;20(3):e3001571 (PMID: 35298459; CIE S 026);
 * Kleitman N. Sleep and Wakefulness (90-min BRAC); de Cabo R, Mattson MP. N Engl J Med. 2019;381(26):2541-2554 (PMID: 31881139);
 * Task Force ESC/NASPE. Circulation. 1996;93(5):1043-1065 (PMID: 8598068); Plews DJ et al. IJSPP. 2013 (PMID: 23539081).
 */

export const NEURO_CHRONO_RESONANCE_DISCLAIMER =
  'Derived chronobiological, autonomic & metabolic state — not a clinical endocrinology or cardiology diagnosis' as const;

export const NEURO_CHRONO_RESONANCE_SOURCES = Object.freeze({
  citation:
    'Brown TM et al. PLoS Biol. 2022;20(3):e3001571 (PMID: 35298459); de Cabo R, Mattson MP. N Engl J Med. 2019;381(26):2541-2554 (PMID: 31881139); Task Force ESC/NASPE. Circulation. 1996;93(5):1043-1065 (PMID: 8598068).',
  pmids: Object.freeze(['35298459', '31881139', '8598068', '23539081']),
  verifiedFrom: 'abstract' as const,
});

export type MetabolicSubstratePhase = 'fed-glycolytic' | 'hepatic-glycogenolysis' | 'g-to-k-metabolic-switch' | 'deep-ketogenic-autophagy';
export type UltradianWavePhase = 'ascending-catecholamine-focus' | 'peak-neuroplastic-execution' | 'ultradian-trough-decompression';
export type CircadianLightAlignment = 'optimal-circadian-lock' | 'suboptimal-daylight-anchor' | 'melatonin-suppression-hazard';

export interface NeuroChronoMetabolicInput {
  readonly hoursSinceWake: number; readonly ambientMelanopicLux: number; readonly continuousFocusMinutes: number;
  readonly fastingElapsedHours: number; readonly measuredRmssdMs: number; readonly baseline7DayLnRmssd?: number;
}

export interface NeuroChronoMetabolicSuccess {
  readonly ok: true;
  readonly resonanceCoherenceScore0To100: number;
  readonly circadianPhase: { readonly alignment: CircadianLightAlignment; readonly melanopicEdiTargetLux: number; readonly circadianDriveFraction: number };
  readonly ultradianWave: { readonly phase: UltradianWavePhase; readonly cycleMinute0To110: number; readonly minutesUntilRestOrNextBlock: number };
  readonly metabolicState: { readonly phase: MetabolicSubstratePhase; readonly ketogenicSwitchFraction: number };
  readonly vagalReadiness: {
    readonly lnRmssd: number; readonly vagalToneIndex0To100: number;
    readonly autonomicState: 'sympathetic-strain' | 'balanced-homeostasis' | 'parasympathetic-peak';
  };
  readonly nextBestActionDirective: string;
  readonly truthClass: 'derived';
  readonly label: typeof NEURO_CHRONO_RESONANCE_DISCLAIMER;
  readonly source: typeof NEURO_CHRONO_RESONANCE_SOURCES;
}

export interface NeuroChronoMetabolicFailure {
  readonly ok: false; readonly reason: 'invalid-input'; readonly detail: string;
  readonly truthClass: 'derived'; readonly label: typeof NEURO_CHRONO_RESONANCE_DISCLAIMER;
}

export type NeuroChronoMetabolicResult = NeuroChronoMetabolicSuccess | NeuroChronoMetabolicFailure;

export function evaluateNeuroChronoMetabolicResonance(input: NeuroChronoMetabolicInput): NeuroChronoMetabolicResult {
  if (
    !input || typeof input !== 'object' ||
    typeof input.hoursSinceWake !== 'number' || !Number.isFinite(input.hoursSinceWake) || input.hoursSinceWake < 0 || input.hoursSinceWake > 36 ||
    typeof input.ambientMelanopicLux !== 'number' || !Number.isFinite(input.ambientMelanopicLux) || input.ambientMelanopicLux < 0 || input.ambientMelanopicLux > 150000 ||
    typeof input.continuousFocusMinutes !== 'number' || !Number.isFinite(input.continuousFocusMinutes) || input.continuousFocusMinutes < 0 || input.continuousFocusMinutes > 1440 ||
    typeof input.fastingElapsedHours !== 'number' || !Number.isFinite(input.fastingElapsedHours) || input.fastingElapsedHours < 0 || input.fastingElapsedHours > 120 ||
    typeof input.measuredRmssdMs !== 'number' || !Number.isFinite(input.measuredRmssdMs) || input.measuredRmssdMs < 5 || input.measuredRmssdMs > 300
  ) {
    return Object.freeze({
      ok: false, reason: 'invalid-input',
      detail: 'Input metrics must be finite within valid physiological bounds (hoursSinceWake [0,36], lux [0,150000], focus [0,1440], fasting [0,120], RMSSD [5,300] ms).',
      truthClass: 'derived', label: NEURO_CHRONO_RESONANCE_DISCLAIMER,
    });
  }

  const isEveningWindDown = input.hoursSinceWake >= 13;
  const targetLux = isEveningWindDown ? 10 : 250;
  let alignment: CircadianLightAlignment = 'optimal-circadian-lock';
  let circadianScore = 100;
  if (!isEveningWindDown && input.ambientMelanopicLux < 250) {
    alignment = 'suboptimal-daylight-anchor';
    circadianScore = Math.max(35, Math.round(35 + (input.ambientMelanopicLux / 250) * 65));
  } else if (isEveningWindDown && input.ambientMelanopicLux > 10) {
    alignment = 'melatonin-suppression-hazard';
    circadianScore = Math.max(20, Math.round(100 - Math.min(80, (input.ambientMelanopicLux - 10) * 0.8)));
  }
  const circadianDriveFraction = Number(Math.max(0.1, Math.min(1.0, 0.55 + 0.45 * Math.sin(((input.hoursSinceWake - 2) / 16) * Math.PI))).toFixed(3));

  const cycleMin = Number((input.continuousFocusMinutes % 110).toFixed(1));
  let ultradianPhase: UltradianWavePhase = 'peak-neuroplastic-execution';
  let minutesUntilTransition = Number((90 - cycleMin).toFixed(1));
  let ultradianScore = 95;
  if (cycleMin < 15) { ultradianPhase = 'ascending-catecholamine-focus'; ultradianScore = 85; }
  else if (cycleMin >= 90) {
    ultradianPhase = 'ultradian-trough-decompression';
    minutesUntilTransition = Number((110 - cycleMin).toFixed(1));
    ultradianScore = input.continuousFocusMinutes > 95 ? 55 : 90;
  }

  const ketogenicSwitchFraction = Number((1 / (1 + Math.exp(-0.55 * (input.fastingElapsedHours - 14)))).toFixed(4));
  let metabolicPhase: MetabolicSubstratePhase = 'fed-glycolytic';
  if (input.fastingElapsedHours >= 18) metabolicPhase = 'deep-ketogenic-autophagy';
  else if (input.fastingElapsedHours >= 12) metabolicPhase = 'g-to-k-metabolic-switch';
  else if (input.fastingElapsedHours >= 4) metabolicPhase = 'hepatic-glycogenolysis';
  const metabolicScore = Math.min(100, Math.round(65 + ketogenicSwitchFraction * 35));

  const lnRmssd = Number(Math.log(input.measuredRmssdMs).toFixed(3));
  const deltaLn = lnRmssd - (input.baseline7DayLnRmssd ?? 3.8);
  const vagalToneIndex0To100 = Math.max(0, Math.min(100, Math.round(((lnRmssd - 1.6) / (5.2 - 1.6)) * 100)));
  let autonomicState: 'sympathetic-strain' | 'balanced-homeostasis' | 'parasympathetic-peak' = 'balanced-homeostasis';
  if (deltaLn < -0.25 || lnRmssd < 3.1) autonomicState = 'sympathetic-strain';
  else if (deltaLn >= 0.1 || lnRmssd >= 4.0) autonomicState = 'parasympathetic-peak';

  const resonanceCoherenceScore0To100 = Math.round(0.28 * circadianScore + 0.24 * ultradianScore + 0.22 * metabolicScore + 0.26 * vagalToneIndex0To100);

  let nextBestActionDirective = 'Execute high-leverage deep work or progressive resistance training during current peak coherence.';
  if (alignment === 'melatonin-suppression-hazard') nextBestActionDirective = 'Dim ambient lighting below 10 melanopic EDI lux immediately to protect pineal melatonin onset.';
  else if (alignment === 'suboptimal-daylight-anchor') nextBestActionDirective = 'Anchor suprachiasmatic clock with >= 250 melanopic EDI lux outdoor daylight for 10 minutes.';
  else if (ultradianPhase === 'ultradian-trough-decompression') nextBestActionDirective = `Take a ${minutesUntilTransition}-minute non-screen NSDR / 6-bpm resonance breathwork break to clear synaptic adenosine.`;
  else if (autonomicState === 'sympathetic-strain') nextBestActionDirective = 'Autonomic vagal tone depressed; prioritize 6-breaths/min resonance breathing and Zone-2 active recovery.';

  return Object.freeze({
    ok: true, resonanceCoherenceScore0To100,
    circadianPhase: Object.freeze({ alignment, melanopicEdiTargetLux: targetLux, circadianDriveFraction }),
    ultradianWave: Object.freeze({ phase: ultradianPhase, cycleMinute0To110: cycleMin, minutesUntilRestOrNextBlock: minutesUntilTransition }),
    metabolicState: Object.freeze({ phase: metabolicPhase, ketogenicSwitchFraction }),
    vagalReadiness: Object.freeze({ lnRmssd, vagalToneIndex0To100, autonomicState }),
    nextBestActionDirective, truthClass: 'derived', label: NEURO_CHRONO_RESONANCE_DISCLAIMER, source: NEURO_CHRONO_RESONANCE_SOURCES,
  });
}
