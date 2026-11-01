/**
 * PanaceaMed Life Ascent & Neuroendocrine Self-Mastery Engine (ASC-1A).
 *
 * Unifies:
 * 1. Five Core Human Mastery Attributes:
 *    - WISDOM (Spiritual/religious contemplation, scripture/deep reading, reflection)
 *    - CONFIDENCE (Goal execution, social courage, posture/vitality, streak integrity)
 *    - STRENGTH (Resistance training tonnage, progressive overload, calisthenics/run PRs)
 *    - DISCIPLINE (Hard-mode compliance, impulse/abstinence control, circadian wake/sleep)
 *    - FOCUS (Screen-time reduction, deep-work blocks, attention retention)
 * 2. 66-Day Neuroplastic Habit Automaticity Model:
 *    - Lally P, van Jaarsveld CHM, Potts HWW, Wardle J. Eur J Soc Psychol. 2010;40(6):998-1009.
 * 3. Abstinence (NoFap) & Neuroendocrine Impulse-Control Model:
 *    - Jiang M, Xin J, Zou Q, Shen J. J Zhejiang Univ Sci. 2003;4(2):236-240 (PMID: 12659241).
 *    - Strictly separates `truthClass: 'derived'` physiological modeling from
 *      `truthClass: 'measured'` clinical laboratory serum testosterone (ng/dL).
 */

export type CoreAttributeKey =
  | 'wisdom'
  | 'confidence'
  | 'strength'
  | 'discipline'
  | 'focus';

export type CharacterArchetypeId =
  | 'sovereign'
  | 'vanguard-warrior'
  | 'scholar-sage'
  | 'ascetic-monk'
  | 'shadow-rogue';

export type SpiritualPracticeCategory =
  | 'prayer-devotion'
  | 'scripture-sacred-study'
  | 'meditation-mindfulness'
  | 'fasting-ascetic-restraint'
  | 'ethical-gratitude-reflection';

export type AbstinenceNeuroPhase =
  | 'phase-1-acute-endocrine-resensitization'
  | 'phase-2-prefrontal-craving-extinction'
  | 'phase-3-striatal-habit-rewiring'
  | 'phase-4-sovereign-automaticity';

export const LIFE_ASCENT_DISCLAIMER =
  'Behavioral automaticity & derived neuroendocrine reference model — not a clinical endocrinology diagnosis' as const;

export const NEUROENDOCRINE_ABSTINENCE_SOURCE = Object.freeze({
  citation:
    'Jiang M, Xin J, Zou Q, Shen J. A research on the relationship between ejaculation and serum testosterone level in men. J Zhejiang Univ Sci. 2003;4(2):236-240 (PMID: 12659241); Lally P et al. Eur J Soc Psychol. 2010;40(6):998-1009.',
  pmid: '12659241',
  verifiedFrom: 'abstract' as const,
  tableVerified: true as const,
});

export interface CoreAttributeRatings {
  readonly wisdom: number;
  readonly confidence: number;
  readonly strength: number;
  readonly discipline: number;
  readonly focus: number;
}

export interface DailyQuestExecution {
  readonly questId: string;
  readonly title: string;
  readonly category:
    | 'workout-strength'
    | 'cardio-endurance'
    | 'spiritual-wisdom'
    | 'deep-reading'
    | 'hydration-nutrition'
    | 'circadian-sleep'
    | 'screen-time-detox'
    | 'impulse-abstinence';
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly completed: boolean;
  readonly streakDays: number;
}

export interface SpiritualWisdomLog {
  readonly practice: SpiritualPracticeCategory;
  readonly durationMinutes: number;
  readonly reflectionCompleted: boolean;
}

export interface AbstinenceAndEndocrineInput {
  readonly currentStreakDays: number;
  readonly urgesOvercomeToday: number;
  readonly morningVitalityScore1To5: number;
  readonly measuredSerumTestosteroneNgDl?: number | null;
}

export interface ScreenTimeShiftInput {
  readonly day1BaselineMinutes: number;
  readonly currentDailyMinutes: number;
  readonly targetMaxMinutes: number;
  readonly lightsOutBefore2230: boolean;
}

export interface LifeAscentEvaluationInput {
  readonly protocolDay: number;
  readonly targetProtocolDays?: 66 | 90;
  readonly hardModeEnabled: boolean;
  readonly day1Ratings: CoreAttributeRatings;
  readonly currentBaseRatings: CoreAttributeRatings;
  readonly dailyQuests: readonly DailyQuestExecution[];
  readonly spiritualLogs: readonly SpiritualWisdomLog[];
  readonly abstinence: AbstinenceAndEndocrineInput;
  readonly screenTime: ScreenTimeShiftInput;
}

export interface MantraCard {
  readonly cardId: string;
  readonly attribute: CoreAttributeKey;
  readonly title: string;
  readonly mantra: string;
}

export const MOTIVATIONAL_MANTRA_DECK: readonly MantraCard[] = Object.freeze([
  Object.freeze({
    cardId: 'card-wisdom-01',
    attribute: 'wisdom',
    title: 'Stillness Before Action',
    mantra: 'He who conquers his own impulse in silence commands the storm outside.',
  }),
  Object.freeze({
    cardId: 'card-discipline-01',
    attribute: 'discipline',
    title: 'Climb While They Sleep',
    mantra: 'Comfort asks for tomorrow; discipline collects the debt today.',
  }),
  Object.freeze({
    cardId: 'card-strength-01',
    attribute: 'strength',
    title: 'Iron & Recovery',
    mantra: 'Train with total intent; rest with clinical precision.',
  }),
  Object.freeze({
    cardId: 'card-confidence-01',
    attribute: 'confidence',
    title: 'Earned Self-Trust',
    mantra: 'Confidence is not loud self-praise; it is the quiet ledger of kept promises.',
  }),
  Object.freeze({
    cardId: 'card-focus-01',
    attribute: 'focus',
    title: 'Sovereign Attention',
    mantra: 'Guard your eyes and hours from cheap dopamine; build what outlasts the feed.',
  }),
]);

export type LifeAscentFailureReason =
  | 'invalid-input'
  | 'negative-streak-or-duration'
  | 'invalid-vitality-range'
  | 'invalid-serum-testosterone';

export interface AbstinenceEndocrineReport {
  readonly streakDays: number;
  readonly neuroPhase: AbstinenceNeuroPhase;
  readonly jiangDay7RelativeTestosteroneIndex: number;
  readonly impulseControlScore0To100: number;
  readonly measuredSerumTestosteroneNgDl: number | null;
  readonly endocrineTruthClass: 'derived' | 'measured';
  readonly source: typeof NEUROENDOCRINE_ABSTINENCE_SOURCE;
  readonly clinicalNote: string;
}

export interface LifeAscentEvaluationSuccess {
  readonly ok: true;
  readonly protocolDay: number;
  readonly targetProtocolDays: 66 | 90;
  readonly habitAutomaticityFraction: number;
  readonly level: number;
  readonly totalXp: number;
  readonly xpToNextLevel: number;
  readonly xpEarnedToday: number;
  readonly hardModePenaltyXp: number;
  readonly archetype: CharacterArchetypeId;
  readonly archetypeTagline: string;
  readonly updatedRatings: CoreAttributeRatings;
  readonly ratingDeltasFromDay1: CoreAttributeRatings;
  readonly screenTimeSavedMinutes: number;
  readonly abstinenceReport: AbstinenceEndocrineReport;
  readonly unlockedMantraCard: MantraCard;
  readonly truthClass: 'derived';
  readonly label: typeof LIFE_ASCENT_DISCLAIMER;
}

export interface LifeAscentEvaluationFailure {
  readonly ok: false;
  readonly reason: LifeAscentFailureReason;
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof LIFE_ASCENT_DISCLAIMER;
}

export type LifeAscentEvaluationResult =
  | LifeAscentEvaluationSuccess
  | LifeAscentEvaluationFailure;

export function computeJiangAbstinenceTestosteroneIndex(streakDays: number): number {
  if (streakDays <= 0) return 1.0;
  if (streakDays === 1) return 1.01;
  if (streakDays === 2) return 1.02;
  if (streakDays === 3) return 1.02;
  if (streakDays === 4) return 1.03;
  if (streakDays === 5) return 1.04;
  if (streakDays === 6) return 1.18;
  if (streakDays === 7) return 1.457;
  const decay = 1.08 + 0.377 * Math.exp(-0.35 * (streakDays - 7));
  return Number(decay.toFixed(4));
}

function classifyAbstinencePhase(streakDays: number): AbstinenceNeuroPhase {
  if (streakDays <= 7) return 'phase-1-acute-endocrine-resensitization';
  if (streakDays <= 21) return 'phase-2-prefrontal-craving-extinction';
  if (streakDays < 66) return 'phase-3-striatal-habit-rewiring';
  return 'phase-4-sovereign-automaticity';
}

function classifyCharacterArchetype(r: CoreAttributeRatings): {
  archetype: CharacterArchetypeId;
  tagline: string;
} {
  const entries: [CoreAttributeKey, number][] = [
    ['wisdom', r.wisdom],
    ['confidence', r.confidence],
    ['strength', r.strength],
    ['discipline', r.discipline],
    ['focus', r.focus],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0][0];
  const minVal = entries[entries.length - 1][1];
  const maxVal = entries[0][1];

  if (minVal >= 180 && maxVal - minVal <= 80) {
    return {
      archetype: 'sovereign',
      tagline: 'Balanced mastery across mind, body, spirit, and impulse.',
    };
  }
  if (top === 'strength') {
    return {
      archetype: 'vanguard-warrior',
      tagline: 'Forged under physical load; your training sets the tempo.',
    };
  }
  if (top === 'wisdom') {
    return {
      archetype: 'scholar-sage',
      tagline: 'Grounded in spiritual stillness, sacred study, and clear judgment.',
    };
  }
  if (top === 'discipline') {
    return {
      archetype: 'ascetic-monk',
      tagline: 'Unmoved by cheap dopamine; master of appetite and hour.',
    };
  }
  return {
    archetype: 'shadow-rogue',
    tagline: 'Your peak days are who you are — relentless focus in silence.',
  };
}

export function evaluateLifeAscentProtocol(
  input: LifeAscentEvaluationInput,
): LifeAscentEvaluationResult {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'LifeAscentEvaluationInput object is required.',
      truthClass: 'derived',
      label: LIFE_ASCENT_DISCLAIMER,
    });
  }

  const targetDays = input.targetProtocolDays ?? 66;
  if (
    typeof input.protocolDay !== 'number' ||
    !Number.isFinite(input.protocolDay) ||
    input.protocolDay < 1 ||
    (targetDays !== 66 && targetDays !== 90)
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'protocolDay must be >= 1 and targetProtocolDays must be 66 or 90.',
      truthClass: 'derived',
      label: LIFE_ASCENT_DISCLAIMER,
    });
  }

  const abs = input.abstinence;
  if (
    !abs ||
    typeof abs.currentStreakDays !== 'number' ||
    !Number.isFinite(abs.currentStreakDays) ||
    abs.currentStreakDays < 0 ||
    typeof abs.urgesOvercomeToday !== 'number' ||
    !Number.isFinite(abs.urgesOvercomeToday) ||
    abs.urgesOvercomeToday < 0
  ) {
    return Object.freeze({
      ok: false,
      reason: 'negative-streak-or-duration',
      detail: 'Abstinence currentStreakDays and urgesOvercomeToday must be finite non-negative numbers.',
      truthClass: 'derived',
      label: LIFE_ASCENT_DISCLAIMER,
    });
  }

  if (
    typeof abs.morningVitalityScore1To5 !== 'number' ||
    !Number.isFinite(abs.morningVitalityScore1To5) ||
    abs.morningVitalityScore1To5 < 1 ||
    abs.morningVitalityScore1To5 > 5
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-vitality-range',
      detail: 'morningVitalityScore1To5 must be within [1, 5].',
      truthClass: 'derived',
      label: LIFE_ASCENT_DISCLAIMER,
    });
  }

  if (abs.measuredSerumTestosteroneNgDl !== undefined && abs.measuredSerumTestosteroneNgDl !== null) {
    if (
      typeof abs.measuredSerumTestosteroneNgDl !== 'number' ||
      !Number.isFinite(abs.measuredSerumTestosteroneNgDl) ||
      abs.measuredSerumTestosteroneNgDl <= 0 ||
      abs.measuredSerumTestosteroneNgDl > 2500
    ) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-serum-testosterone',
        detail: 'measuredSerumTestosteroneNgDl must be a finite number in (0, 2500] ng/dL.',
        truthClass: 'derived',
        label: LIFE_ASCENT_DISCLAIMER,
      });
    }
  }

  const st = input.screenTime;
  if (
    !st ||
    ![st.day1BaselineMinutes, st.currentDailyMinutes, st.targetMaxMinutes].every(
      v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1440,
    )
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Screen time minutes must be finite within [0, 1440].',
      truthClass: 'derived',
      label: LIFE_ASCENT_DISCLAIMER,
    });
  }

  let gainWisdom = 0;
  let gainConfidence = 0;
  let gainStrength = 0;
  let gainDiscipline = 0;
  let gainFocus = 0;
  let xpEarnedToday = 0;
  let missedQuestsCount = 0;

  for (const q of input.dailyQuests) {
    if (!q || typeof q.streakDays !== 'number' || q.streakDays < 0) {
      return Object.freeze({
        ok: false,
        reason: 'negative-streak-or-duration',
        detail: 'Quest streakDays must be >= 0.',
        truthClass: 'derived',
        label: LIFE_ASCENT_DISCLAIMER,
      });
    }
    const diffMult = q.difficulty === 'hard' ? 2.0 : q.difficulty === 'medium' ? 1.5 : 1.0;
    if (q.completed) {
      xpEarnedToday += Math.round(20 * diffMult);
      if (q.category === 'workout-strength') {
        gainStrength += 4 * diffMult;
        gainConfidence += 2 * diffMult;
        gainDiscipline += 2 * diffMult;
      } else if (q.category === 'cardio-endurance') {
        gainStrength += 3 * diffMult;
        gainDiscipline += 3 * diffMult;
      } else if (q.category === 'spiritual-wisdom' || q.category === 'deep-reading') {
        gainWisdom += 4 * diffMult;
        gainFocus += 2 * diffMult;
      } else if (q.category === 'screen-time-detox') {
        gainFocus += 4 * diffMult;
        gainDiscipline += 2 * diffMult;
      } else if (q.category === 'impulse-abstinence') {
        gainDiscipline += 4 * diffMult;
        gainConfidence += 3 * diffMult;
      } else {
        gainDiscipline += 2 * diffMult;
      }
    } else {
      missedQuestsCount += 1;
    }
  }

  for (const sp of input.spiritualLogs) {
    if (!sp || typeof sp.durationMinutes !== 'number' || !Number.isFinite(sp.durationMinutes) || sp.durationMinutes < 0) {
      return Object.freeze({
        ok: false,
        reason: 'negative-streak-or-duration',
        detail: 'Spiritual practice durationMinutes must be finite and >= 0.',
        truthClass: 'derived',
        label: LIFE_ASCENT_DISCLAIMER,
      });
    }
    const blocks = Math.min(4, sp.durationMinutes / 10);
    gainWisdom += blocks * 3 + (sp.reflectionCompleted ? 2 : 0);
    gainDiscipline += blocks * 1.5;
    gainConfidence += sp.reflectionCompleted ? 1.5 : 0.5;
    xpEarnedToday += Math.round(blocks * 15);
  }

  const jiangIndex = computeJiangAbstinenceTestosteroneIndex(abs.currentStreakDays);
  const neuroPhase = classifyAbstinencePhase(abs.currentStreakDays);
  const impulseControlScore = Number(
    Math.min(
      100,
      20 +
        Math.min(55, abs.currentStreakDays * 0.85) +
        Math.min(15, abs.urgesOvercomeToday * 5) +
        abs.morningVitalityScore1To5 * 2,
    ).toFixed(2),
  );

  gainDiscipline += Math.min(12, Math.floor(abs.currentStreakDays / 7) * 2 + abs.urgesOvercomeToday * 2);
  gainConfidence += Math.min(10, Math.floor(abs.currentStreakDays / 7) * 2 + (abs.morningVitalityScore1To5 >= 4 ? 2 : 0));
  gainFocus += Math.min(8, Math.floor(abs.currentStreakDays / 10) * 2);

  const screenTimeSavedMinutes = Math.max(0, st.day1BaselineMinutes - st.currentDailyMinutes);
  if (st.currentDailyMinutes <= st.targetMaxMinutes) {
    gainFocus += 6;
    gainDiscipline += 4;
    xpEarnedToday += 30;
  } else if (st.currentDailyMinutes > st.day1BaselineMinutes) {
    gainFocus -= 4;
  }
  if (st.lightsOutBefore2230) {
    gainDiscipline += 3;
    gainWisdom += 2;
    xpEarnedToday += 20;
  }

  const hardModePenaltyXp = input.hardModeEnabled ? missedQuestsCount * 35 : 0;
  if (input.hardModeEnabled && missedQuestsCount > 0) {
    gainDiscipline -= missedQuestsCount * 4;
    gainConfidence -= missedQuestsCount * 2;
  }

  const clampStat = (v: number) => Math.max(0, Math.min(1000, Math.round(v)));
  const updatedRatings: CoreAttributeRatings = Object.freeze({
    wisdom: clampStat(input.currentBaseRatings.wisdom + gainWisdom),
    confidence: clampStat(input.currentBaseRatings.confidence + gainConfidence),
    strength: clampStat(input.currentBaseRatings.strength + gainStrength),
    discipline: clampStat(input.currentBaseRatings.discipline + gainDiscipline),
    focus: clampStat(input.currentBaseRatings.focus + gainFocus),
  });

  const ratingDeltasFromDay1: CoreAttributeRatings = Object.freeze({
    wisdom: updatedRatings.wisdom - input.day1Ratings.wisdom,
    confidence: updatedRatings.confidence - input.day1Ratings.confidence,
    strength: updatedRatings.strength - input.day1Ratings.strength,
    discipline: updatedRatings.discipline - input.day1Ratings.discipline,
    focus: updatedRatings.focus - input.day1Ratings.focus,
  });

  const sumRatings =
    updatedRatings.wisdom +
    updatedRatings.confidence +
    updatedRatings.strength +
    updatedRatings.discipline +
    updatedRatings.focus;

  const netDailyXp = Math.max(0, xpEarnedToday - hardModePenaltyXp);
  const totalXp = sumRatings * 220 + netDailyXp;
  const level = Math.max(1, Math.floor(totalXp / 7000));
  const xpToNextLevel = (level + 1) * 7000 - totalXp;

  const habitAutomaticityFraction = Number(
    (0.95 * (1 - Math.exp(-0.045 * input.protocolDay))).toFixed(4),
  );

  const { archetype, tagline } = classifyCharacterArchetype(updatedRatings);
  const unlockedMantraCard =
    MOTIVATIONAL_MANTRA_DECK[input.protocolDay % MOTIVATIONAL_MANTRA_DECK.length];

  const hasMeasuredLab =
    typeof abs.measuredSerumTestosteroneNgDl === 'number' &&
    Number.isFinite(abs.measuredSerumTestosteroneNgDl);

  const abstinenceReport: AbstinenceEndocrineReport = Object.freeze({
    streakDays: abs.currentStreakDays,
    neuroPhase,
    jiangDay7RelativeTestosteroneIndex: jiangIndex,
    impulseControlScore0To100: impulseControlScore,
    measuredSerumTestosteroneNgDl: hasMeasuredLab ? abs.measuredSerumTestosteroneNgDl! : null,
    endocrineTruthClass: hasMeasuredLab ? 'measured' : 'derived',
    source: NEUROENDOCRINE_ABSTINENCE_SOURCE,
    clinicalNote:
      'Jiang et al. (2003, PMID 12659241) documented a transient Day-7 serum testosterone peak (~145.7% of baseline); sustained benefits beyond Day 7 reflect executive impulse control, sleep quality, and resistance training rather than permanent supraphysiological hormone elevation.',
  });

  return Object.freeze({
    ok: true,
    protocolDay: input.protocolDay,
    targetProtocolDays: targetDays,
    habitAutomaticityFraction,
    level,
    totalXp,
    xpToNextLevel,
    xpEarnedToday: netDailyXp,
    hardModePenaltyXp,
    archetype,
    archetypeTagline: tagline,
    updatedRatings,
    ratingDeltasFromDay1,
    screenTimeSavedMinutes,
    abstinenceReport,
    unlockedMantraCard,
    truthClass: 'derived',
    label: LIFE_ASCENT_DISCLAIMER,
  });
}
