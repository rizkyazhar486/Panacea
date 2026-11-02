import React, { useMemo, useState } from 'react';
import { evaluateLifeAscentProtocol, type DailyQuestExecution } from '../engine/lifeAscentProtocolEngine';
import { evaluateWorkoutSessionAndRecovery, type WorkoutSplitCategory } from '../engine/workoutAndEndocrineMasteryEngine';
import { evaluateSeasonClimbAndProofs } from '../engine/seasonalClimbAndProofEngine';
import {
  buildHomeScreenWidgetPayload,
  evaluateOnboardingAndProgramGeneration,
  evaluateSevenBuiltInMiniTools,
} from '../engine/onboardingAndMiniToolsEngine';
import { evaluateNeuroChronoMetabolicResonance } from '../engine/neuroChronoMetabolicResonanceEngine';

export interface PanaceaLifeAscentDashboardProps {
  readonly userName?: string;
  readonly partnerName?: string;
}

export const PanaceaLifeAscentDashboard: React.FC<PanaceaLifeAscentDashboardProps> = ({
  userName = 'Kelvin',
  partnerName = 'Rizky',
}) => {
  const [activeSplit, setActiveSplit] = useState<WorkoutSplitCategory>('push');
  const [hardMode, setHardMode] = useState<boolean>(true);
  const [abstinenceDays, setAbstinenceDays] = useState<number>(14);
  const [screenTimeMinutes, setScreenTimeMinutes] = useState<number>(135);
  const [focusTimerMin, setFocusTimerMin] = useState<number>(75);

  const onboarding = useMemo(
    () =>
      evaluateOnboardingAndProgramGeneration({
        biologicalSex: 'male', ageYears: 24, heightCm: 175, weightKg: 70, workoutsPerWeek: 5,
        averageSleepHours: 7.5, dailyScreenTimeMinutes: 262, spiritualPracticeMinutesPerDay: 20,
        readingPagesPerDay: 20, currentAbstinenceStreakDays: abstinenceDays,
        primaryGoal: 'complete-66-day-total-life-reset',
      }),
    [abstinenceDays],
  );

  const quests: readonly DailyQuestExecution[] = useMemo(
    () => [
      { questId: 'q-push-workout', title: 'Push Day Hypertrophy & Calisthenics', category: 'workout-strength', difficulty: 'hard', completed: true, streakDays: 14 },
      { questId: 'q-run-5k', title: 'Run 5km Sub-25 Pace', category: 'cardio-endurance', difficulty: 'hard', completed: true, streakDays: 9 },
      { questId: 'q-spiritual-wisdom', title: 'Morning Prayer, Scripture & Contemplation (20 min)', category: 'spiritual-wisdom', difficulty: 'medium', completed: true, streakDays: 14 },
      { questId: 'q-nofap-impulse', title: 'Impulse Mastery & Dopamine Guard (NoFap)', category: 'impulse-abstinence', difficulty: 'hard', completed: true, streakDays: abstinenceDays },
      { questId: 'q-screen-cap', title: 'Screen Blocker Active + Lights Out 22:30', category: 'screen-time-detox', difficulty: 'medium', completed: screenTimeMinutes <= 150, streakDays: 12 },
    ],
    [abstinenceDays, screenTimeMinutes],
  );

  const ascentResult = useMemo(
    () =>
      evaluateLifeAscentProtocol({
        protocolDay: 14, targetProtocolDays: 66, hardModeEnabled: hardMode,
        day1Ratings: { wisdom: 120, confidence: 140, strength: 210, discipline: 115, focus: 130 },
        currentBaseRatings: { wisdom: 158, confidence: 192, strength: 312, discipline: 165, focus: 188 },
        dailyQuests: quests,
        spiritualLogs: [{ practice: 'prayer-devotion', durationMinutes: 20, reflectionCompleted: true }],
        abstinence: { currentStreakDays: abstinenceDays, urgesOvercomeToday: 2, morningVitalityScore1To5: 5 },
        screenTime: { day1BaselineMinutes: 262, currentDailyMinutes: screenTimeMinutes, targetMaxMinutes: 150, lightsOutBefore2230: true },
      }),
    [abstinenceDays, hardMode, quests, screenTimeMinutes],
  );

  const workoutResult = useMemo(
    () =>
      evaluateWorkoutSessionAndRecovery({
        sessionId: `session-${activeSplit}-01`,
        title: activeSplit === 'push' ? 'Push Day · Chest, Anterior Delts & Triceps' : 'Pull Day · Weighted Pull-Ups & Rows',
        split: activeSplit, durationMinutes: 42, bodyMassKg: 70, sleepHoursLastNight: 7.5,
        acute7DayLoadAu: 1450, chronic28DayWeeklyAvgLoadAu: 1500, sessionRpe1To10: 8,
        moves: [
          { moveId: 'm1', name: 'Bench press', sets: 4, reps: 8, loadKg: 80 },
          { moveId: 'm2', name: 'Overhead press', sets: 4, reps: 6, loadKg: 52.5 },
          { moveId: 'm3', name: 'Weighted push-up', sets: 3, reps: 12, loadKg: 55 },
          { moveId: 'm4', name: 'Parallel bar dip', sets: 3, reps: 8, loadKg: 70 },
        ],
      }),
    [activeSplit],
  );

  const miniTools = useMemo(
    () =>
      evaluateSevenBuiltInMiniTools({
        biologicalSex: 'male', weightKg: 70, heightCm: 175, ageYears: 24, activityMultiplier: 1.65,
        caloricGoalDeltaKcal: 150, focusTimerCompletedMinutes: focusTimerMin, bookPagesReadToday: 20,
        bookKeyTakeaway: 'Discipline is remembering what you want over what you feel right now.',
        meditationMinutesToday: 10, breathCyclesPerMinute: 6, screenBlockerActiveMinutes: 180,
        blockedDistractionAttempts: 5, fastingWindowHours: 16, urgeSurfingResetCompleted: true,
      }),
    [focusTimerMin],
  );

  const seasonResult = useMemo(
    () =>
      evaluateSeasonClimbAndProofs({
        seasonId: 'season-2026-q4', currentSeasonXp: 1820, dailyXpHistory: [55, 70, 65, 80, 68, 74, 64],
        goldTierAverageDailyXp: 63, partnerStreakDays: 5, userOpenedToday: true, partnerOpenedToday: true,
        longestHabitStreakDays: 14, totalWorkoutsCompleted: 12, abstinenceStreakDays: abstinenceDays,
        spiritualSessionsCompleted: 14,
      }),
    [abstinenceDays],
  );

  const resonanceResult = useMemo(
    () =>
      evaluateNeuroChronoMetabolicResonance({
        hoursSinceWake: 4, ambientMelanopicLux: 650, continuousFocusMinutes: focusTimerMin,
        fastingElapsedHours: 16, measuredRmssdMs: 62, baseline7DayLnRmssd: 3.9,
      }),
    [focusTimerMin],
  );

  if (!ascentResult.ok || !workoutResult.ok || !seasonResult.ok || !onboarding.ok || !miniTools.ok || !resonanceResult.ok) {
    return <div data-testid="ascent-error">Invalid Life Ascent configuration.</div>;
  }

  const widgetPayload = buildHomeScreenWidgetPayload({
    protocolDay: ascentResult.protocolDay, targetProtocolDays: ascentResult.targetProtocolDays,
    currentStreakDays: 14, dailyQuests: quests, activeMantraText: ascentResult.unlockedMantraCard.mantra,
    seasonTier: seasonResult.currentTier,
  });

  const pillars = [
    ['WISDOM', ascentResult.updatedRatings.wisdom, ascentResult.ratingDeltasFromDay1.wisdom],
    ['CONFIDENCE', ascentResult.updatedRatings.confidence, ascentResult.ratingDeltasFromDay1.confidence],
    ['STRENGTH', ascentResult.updatedRatings.strength, ascentResult.ratingDeltasFromDay1.strength],
    ['DISCIPLINE', ascentResult.updatedRatings.discipline, ascentResult.ratingDeltasFromDay1.discipline],
    ['FOCUS', ascentResult.updatedRatings.focus, ascentResult.ratingDeltasFromDay1.focus],
  ] as const;

  return (
    <section
      aria-label="Panacea Life Ascent and Workout Mastery"
      style={{ backgroundColor: '#0B0B0E', color: '#F5F5F7', padding: '24px', borderRadius: '18px', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <span style={{ color: '#FF6B1A', fontWeight: 700, letterSpacing: '0.08em', fontSize: '12px' }}>
            66日間 PROTOCOL · {widgetPayload.protocolDayLabel} · FOCUS FIRST: {onboarding.focusFirstAttribute.toUpperCase()}
          </span>
          <h2 style={{ margin: '4px 0', fontSize: '26px', fontWeight: 800 }}>
            {userName} · Level {ascentResult.level} ({ascentResult.archetype.toUpperCase()})
          </h2>
          <p style={{ margin: 0, color: '#A1A1AA', fontSize: '13px' }}>{ascentResult.archetypeTagline}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: '#FF6B1A', color: '#0B0B0E', padding: '6px 12px', borderRadius: '999px', fontWeight: 800 }}>
            {seasonResult.currentTier} · {seasonResult.currentSeasonXp.toLocaleString()} XP
          </div>
          <label style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#D4D4D8' }}>
            <input type="checkbox" checked={hardMode} onChange={e => setHardMode(e.target.checked)} style={{ marginRight: '6px' }} />
            Hard Mode Accountability
          </label>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {pillars.map(([label, score, delta]) => (
          <div key={label} style={{ background: '#141419', border: '1px solid #27272A', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{score}</div>
            <div style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>+{delta} since Day 1</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '16px' }}>
        <div style={{ background: '#141419', border: '1px solid #27272A', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#FF6B1A', fontSize: '12px', fontWeight: 700 }}>TRAIN HARD · REST SMART</span>
            <span style={{ fontSize: '12px', color: '#A1A1AA' }}>
              {workoutResult.durationMinutes} min · {workoutResult.totalSets} sets · {workoutResult.totalVolumeKg.toLocaleString()} kg
            </span>
          </div>
          <h3 style={{ margin: '6px 0 12px', fontSize: '20px' }}>{workoutResult.title}</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {(['push', 'pull', 'legs', 'calisthenics'] as const).map(sp => (
              <button
                key={sp}
                type="button"
                onClick={() => setActiveSplit(sp)}
                style={{
                  background: activeSplit === sp ? '#FF6B1A' : '#1F1F26', color: activeSplit === sp ? '#0B0B0E' : '#E4E4E7',
                  border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', fontSize: '11px',
                }}
              >
                {sp}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {workoutResult.moveSummaries.map((m, idx) => (
              <div key={m.moveId} style={{ background: '#1C1C22', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }}>
                <strong>{idx + 1}. {m.name}</strong> · {m.sets}x{m.reps} ({m.loadKg} kg) — 1RM: {m.estimatedOneRepMaxKg} kg
              </div>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: '#D4D4D8' }}>
            AI Calorie & Macro Tool: <strong>{miniTools.aiCalorieTracker.targetDailyKcal} kcal/day</strong> (
            {miniTools.aiCalorieTracker.targetProteinGrams}g P / {miniTools.aiCalorieTracker.targetCarbsGrams}g C /{' '}
            {miniTools.aiCalorieTracker.targetFatGrams}g F) · ACWR: <strong>{workoutResult.updatedAcuteToChronicRatio}</strong>
          </div>
        </div>

        <div style={{ background: '#141419', border: '1px solid #27272A', borderRadius: '14px', padding: '16px' }}>
          <span style={{ color: '#FF6B1A', fontSize: '12px', fontWeight: 700 }}>
            7 MINI TOOLS · NEURO-CHRONO RESONANCE · NOFAP ENDOCRINE
          </span>
          <h3 style={{ margin: '6px 0 8px', fontSize: '18px' }}>
            Abstinence Streak: {ascentResult.abstinenceReport.streakDays} Days (Jiang T-Index:{' '}
            {(ascentResult.abstinenceReport.jiangDay7RelativeTestosteroneIndex * 100).toFixed(1)}%)
          </h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button type="button" onClick={() => setAbstinenceDays(7)} style={{ background: '#1F1F26', color: '#F5F5F7', border: '1px solid #3F3F46', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>
              Day 7 Peak
            </button>
            <button type="button" onClick={() => setFocusTimerMin(m => m + 25)} style={{ background: '#1F1F26', color: '#F5F5F7', border: '1px solid #3F3F46', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>
              +25m Focus Timer
            </button>
            <button type="button" onClick={() => setScreenTimeMinutes(m => Math.max(30, m - 15))} style={{ background: '#1F1F26', color: '#F5F5F7', border: '1px solid #3F3F46', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>
              -15m Screen Time
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#E4E4E7', marginBottom: '6px' }}>
            Resonance Coherence: <strong>{resonanceResult.resonanceCoherenceScore0To100}%</strong> · ln(RMSSD):{' '}
            <strong>{resonanceResult.vagalReadiness.lnRmssd}</strong> · Pomodoro: <strong>{miniTools.focusTimer.completedPomodoroBlocks}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#38BDF8', marginBottom: '6px' }}>
            Tempo Directive: {resonanceResult.nextBestActionDirective}
          </div>
          <div style={{ fontSize: '12px', color: '#FBBF24', marginBottom: '6px' }}>
            Widget Mantra: &ldquo;{widgetPayload.activeMantraText}&rdquo;
          </div>
          <div style={{ fontSize: '12px', color: '#A1A1AA' }}>
            Brotherhood Streak with {partnerName}: <strong>{seasonResult.partnerStreakActive ? '5 DAYS ON FIRE' : 'Pending'}</strong> ·
            Proofs Unlocked: <strong>{seasonResult.unlockedAchievementsCount}/50</strong>
          </div>
        </div>
      </div>
    </section>
  );
};
