/**
 * Seasonal Ranked Ladder ("Climb While They Sleep"), 50-Achievement Proof Matrix
 * ("Proof You Changed"), and Partner Accountability ("Better Together") Engine (ASC-1C).
 */

export type CompetitiveSeasonTier =
  | 'Bronze' | 'Silver' | 'Gold III' | 'Gold II' | 'Gold I' | 'Platinum' | 'Diamond' | 'Ascendant';

export interface SeasonClimbInput {
  readonly seasonId: string;
  readonly currentSeasonXp: number;
  readonly dailyXpHistory: readonly number[];
  readonly goldTierAverageDailyXp: number;
  readonly partnerStreakDays: number;
  readonly userOpenedToday: boolean;
  readonly partnerOpenedToday: boolean;
  readonly longestHabitStreakDays: number;
  readonly totalWorkoutsCompleted: number;
  readonly abstinenceStreakDays: number;
  readonly spiritualSessionsCompleted: number;
}

export interface AchievementBadge {
  readonly badgeId: string;
  readonly title: string;
  readonly category: 'discipline' | 'strength' | 'wisdom' | 'focus' | 'brotherhood';
  readonly unlocked: boolean;
  readonly requirementText: string;
}

export interface SeasonClimbSuccess {
  readonly ok: true;
  readonly seasonId: string;
  readonly currentTier: CompetitiveSeasonTier;
  readonly nextTier: CompetitiveSeasonTier | null;
  readonly currentSeasonXp: number;
  readonly xpToNextTier: number;
  readonly tierProgressPercent: number;
  readonly userDailyAverageXp: number;
  readonly dailyXpDeltaVsTierAvg: number;
  readonly partnerStreakActive: boolean;
  readonly partnerNudgeAvailable: boolean;
  readonly unlockedAchievementsCount: number;
  readonly totalAchievementsCatalogCount: 50;
  readonly featuredAchievements: readonly AchievementBadge[];
}

export interface SeasonClimbFailure {
  readonly ok: false;
  readonly reason: 'invalid-input';
  readonly detail: string;
}

export type SeasonClimbResult = SeasonClimbSuccess | SeasonClimbFailure;

const TIER_THRESHOLDS: readonly { tier: CompetitiveSeasonTier; minXp: number }[] = Object.freeze([
  { tier: 'Bronze', minXp: 0 },
  { tier: 'Silver', minXp: 600 },
  { tier: 'Gold III', minXp: 1200 },
  { tier: 'Gold II', minXp: 1600 },
  { tier: 'Gold I', minXp: 1980 },
  { tier: 'Platinum', minXp: 2600 },
  { tier: 'Diamond', minXp: 3500 },
  { tier: 'Ascendant', minXp: 5000 },
]);

export function evaluateSeasonClimbAndProofs(input: SeasonClimbInput): SeasonClimbResult {
  if (!input || typeof input !== 'object' || typeof input.seasonId !== 'string') {
    return Object.freeze({ ok: false, reason: 'invalid-input', detail: 'Valid SeasonClimbInput is required.' });
  }
  if (
    typeof input.currentSeasonXp !== 'number' || !Number.isFinite(input.currentSeasonXp) || input.currentSeasonXp < 0 ||
    !Array.isArray(input.dailyXpHistory) || input.dailyXpHistory.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0)
  ) {
    return Object.freeze({ ok: false, reason: 'invalid-input', detail: 'currentSeasonXp and dailyXpHistory values must be finite non-negative numbers.' });
  }

  let currentIdx = 0;
  for (let i = 0; i < TIER_THRESHOLDS.length; i += 1) {
    if (input.currentSeasonXp >= TIER_THRESHOLDS[i].minXp) currentIdx = i;
  }

  const currentTier = TIER_THRESHOLDS[currentIdx].tier;
  const nextEntry = currentIdx + 1 < TIER_THRESHOLDS.length ? TIER_THRESHOLDS[currentIdx + 1] : null;
  const currentFloor = TIER_THRESHOLDS[currentIdx].minXp;
  const xpToNextTier = nextEntry ? Math.max(0, nextEntry.minXp - input.currentSeasonXp) : 0;
  const tierProgressPercent = nextEntry ? Math.round(((input.currentSeasonXp - currentFloor) / (nextEntry.minXp - currentFloor)) * 100) : 100;

  const userDailyAverageXp =
    input.dailyXpHistory.length > 0
      ? Number((input.dailyXpHistory.reduce((acc, v) => acc + v, 0) / input.dailyXpHistory.length).toFixed(1))
      : 0;
  const dailyXpDeltaVsTierAvg = Number((userDailyAverageXp - input.goldTierAverageDailyXp).toFixed(1));

  const featuredAchievements: AchievementBadge[] = [
    Object.freeze({ badgeId: 'ach-01-first-dawn', title: 'First Dawn (Day 7 Streak)', category: 'discipline', unlocked: input.longestHabitStreakDays >= 7, requirementText: 'Complete 7 consecutive days of core protocol quests.' }),
    Object.freeze({ badgeId: 'ach-02-endocrine-surge', title: 'Sovereign Impulse (Day 7 Abstinence Peak)', category: 'discipline', unlocked: input.abstinenceStreakDays >= 7, requirementText: 'Reach Day 7 of impulse/abstinence mastery (Jiang 2003 window).' }),
    Object.freeze({ badgeId: 'ach-03-iron-vanguard', title: 'Train Hard, Rest Smart (10 Sessions)', category: 'strength', unlocked: input.totalWorkoutsCompleted >= 10, requirementText: 'Log 10 structured resistance or calisthenics workouts.' }),
    Object.freeze({ badgeId: 'ach-04-sacred-stillness', title: 'Pillar of Wisdom (14 Contemplative Sessions)', category: 'wisdom', unlocked: input.spiritualSessionsCompleted >= 14, requirementText: 'Complete 14 spiritual, prayer, scripture, or meditation sessions.' }),
    Object.freeze({ badgeId: 'ach-05-brotherhood-fire', title: 'Better Together (5-Day Partner Streak)', category: 'brotherhood', unlocked: input.partnerStreakDays >= 5, requirementText: 'Maintain a 5-day accountability streak with a training partner.' }),
    Object.freeze({ badgeId: 'ach-06-66-day-forged', title: '66日間 Neuroplastic Automaticity', category: 'focus', unlocked: input.longestHabitStreakDays >= 66, requirementText: 'Complete the full 66-day habit automaticity protocol.' }),
  ];

  const baseUnlocked = featuredAchievements.filter(a => a.unlocked).length;
  const milestoneExtras = Math.min(44, Math.floor(input.currentSeasonXp / 400));
  const unlockedAchievementsCount = Math.min(50, baseUnlocked + milestoneExtras);

  return Object.freeze({
    ok: true,
    seasonId: input.seasonId,
    currentTier,
    nextTier: nextEntry ? nextEntry.tier : null,
    currentSeasonXp: input.currentSeasonXp,
    xpToNextTier,
    tierProgressPercent,
    userDailyAverageXp,
    dailyXpDeltaVsTierAvg,
    partnerStreakActive: input.userOpenedToday && input.partnerOpenedToday,
    partnerNudgeAvailable: input.userOpenedToday && !input.partnerOpenedToday,
    unlockedAchievementsCount,
    totalAchievementsCatalogCount: 50,
    featuredAchievements: Object.freeze(featuredAchievements),
  });
}
