import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAdaptive } from '../../../shared/adaptive/useAdaptive.ts';
import {
  ARENA_BOTS,
  ARENA_DISCLAIMER,
  SCORING,
  createMatch,
  answerRound,
  currentQuestionId,
  standings,
  updateRating,
  type ArenaMatch,
  type BotProfile,
  type Standing,
} from '../engine/arena.ts';
import {
  getBotDialogue,
  type AnimeDialogueLine,
} from '../engine/animeArenaDialogue.ts';
import { CARDIOVASCULAR_CATALOG } from '../data/cardiovascularCatalog.ts';
import {
  newProgress,
  startLesson,
  submitAnswer,
} from '../engine/progress.ts';
import type { LearningProgress } from '../model/types.ts';
import {
  HEMODYNAMIC_CAUSAL_NETWORK,
  simulateCausalNetwork,
  type SimulationResult,
} from '../../biological-concept-graph/index.ts';

export interface PrometheusArenaViewProps {
  readonly userId?: string;
  readonly initialSeed?: number;
  readonly onMatchComplete?: (match: ArenaMatch, finalStandings: readonly Standing[]) => void;
}

export const PrometheusArenaView: React.FC<PrometheusArenaViewProps> = ({
  userId = 'learner:hero',
  initialSeed = 42,
  onMatchComplete,
}) => {
  const { isMobile, isDesktop } = useAdaptive();

  // Initial progress state unlocking cardiology topics
  const [progress, setProgress] = useState<LearningProgress>(() => {
    let p = newProgress(userId);
    const r1 = startLesson(p, CARDIOVASCULAR_CATALOG, userId, 'les:cardiac_output');
    if (r1.ok) p = r1.progress;
    const r2 = startLesson(p, CARDIOVASCULAR_CATALOG, userId, 'les:cardiomyocyte_structure');
    if (r2.ok) p = r2.progress;
    const r3 = submitAnswer(p, CARDIOVASCULAR_CATALOG, {
      userId,
      questionId: 'q:sarcomere_unit',
      optionId: 'a',
      attemptId: 'init1',
      day: 0,
    });
    if (r3.ok) p = r3.progress;
    const r4 = submitAnswer(p, CARDIOVASCULAR_CATALOG, {
      userId,
      questionId: 'q:sr_role',
      optionId: 'b',
      attemptId: 'init2',
      day: 0,
    });
    if (r4.ok) p = r4.progress;
    const r5 = startLesson(p, CARDIOVASCULAR_CATALOG, userId, 'les:ec_coupling');
    if (r5.ok) p = r5.progress;
    return p;
  });

  const [seed, setSeed] = useState(initialSeed);
  const [match, setMatch] = useState<ArenaMatch | null>(null);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(15);
  const [activeDialogue, setActiveDialogue] = useState<AnimeDialogueLine | null>(null);
  const [learnerStreak, setLearnerStreak] = useState(0);
  const [causalSim, setCausalSim] = useState<SimulationResult>(() =>
    simulateCausalNetwork(HEMODYNAMIC_CAUSAL_NETWORK, [])
  );
  const [learnerRating, setLearnerRating] = useState(1200);

  // Initialize Match
  const initMatch = useCallback(
    (newSeed: number) => {
      const matchRes = createMatch(
        {
          matchId: `match:${Date.now()}`,
          userId,
          seed: newSeed,
          timeLimitMs: 15000,
          questionIds: ['q:sarcomere_unit', 'q:sr_role', 'q:cicr_trigger', 'q:troponin_binding'],
        },
        CARDIOVASCULAR_CATALOG,
        progress
      );

      if (matchRes.ok) {
        setMatch(matchRes.match);
        setActiveRoundIndex(0);
        setSelectedOptionId(null);
        setIsSubmitting(false);
        setRoundStartTime(Date.now());
        setTimeRemainingSec(15);
        setLearnerStreak(0);
        setActiveDialogue(getBotDialogue('bot:mira', 'match_start', newSeed));
      }
    },
    [userId, progress]
  );

  useEffect(() => {
    initMatch(seed);
  }, [initMatch, seed]);

  // Round countdown timer
  useEffect(() => {
    if (!match || match.status === 'finished' || isSubmitting) return;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - roundStartTime;
      const remaining = Math.max(0, Math.ceil((15000 - elapsedMs) / 1000));
      setTimeRemainingSec(remaining);

      if (remaining === 0 && !isSubmitting) {
        handleOptionSubmit(null);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [match, roundStartTime, isSubmitting]);

  const currentQId = match ? currentQuestionId(match) : null;
  const currentQ = useMemo(
    () => CARDIOVASCULAR_CATALOG.questions.find((q) => q.id === currentQId) ?? null,
    [currentQId]
  );

  const handleOptionSubmit = (optionId: string | null) => {
    if (!match || !currentQId || isSubmitting) return;
    setIsSubmitting(true);

    const elapsedMs = Math.max(SCORING.minResponseMs, Math.min(15000, Date.now() - roundStartTime));

    const ansRes = answerRound(match, CARDIOVASCULAR_CATALOG, {
      userId,
      questionId: currentQId,
      optionId,
      responseMs: elapsedMs,
    });

    if (ansRes.ok) {
      const updatedMatch = ansRes.match;
      setMatch(updatedMatch);

      const roundAnswers = ansRes.round.answers;
      const learnerAns = roundAnswers.find((a) => a.competitorId === 'learner');
      const isCorrect = learnerAns?.correct ?? false;

      if (isCorrect) {
        const nextStreak = learnerStreak + 1;
        setLearnerStreak(nextStreak);
        if (nextStreak >= 2) {
          setActiveDialogue(getBotDialogue('bot:kenji', 'learner_correct_streak', seed + activeRoundIndex));
        } else {
          setActiveDialogue(getBotDialogue('bot:aria', 'learner_answered_fast', seed + activeRoundIndex));
        }
      } else {
        setLearnerStreak(0);
        setActiveDialogue(getBotDialogue('bot:aria', 'learner_incorrect', seed + activeRoundIndex));
      }

      // Perturb Teachable Causal Figure
      if (currentQ?.conceptId === 'pcg:sarcomere' || currentQ?.conceptId === 'pcg:excitation_contraction_coupling') {
        setCausalSim(
          simulateCausalNetwork(HEMODYNAMIC_CAUSAL_NETWORK, [
            { variableId: 'contractility', type: 'relative_delta', value: isCorrect ? 0.3 : -0.2 },
          ])
        );
      }

      // Progress to next round after delay
      setTimeout(() => {
        if (updatedMatch.status === 'finished') {
          const finalSt = standings(updatedMatch);
          const rUpdate = updateRating(updatedMatch, learnerRating);
          if (rUpdate.ok) {
            setLearnerRating(rUpdate.rating);
          }
          if (finalSt[0]?.competitorId === 'learner') {
            setActiveDialogue(getBotDialogue('bot:aria', 'match_learner_win', seed + 99));
          } else {
            setActiveDialogue(getBotDialogue('bot:kenji', 'match_learner_podium', seed + 99));
          }
          if (onMatchComplete) {
            onMatchComplete(updatedMatch, finalSt);
          }
        } else {
          setActiveRoundIndex((prev) => prev + 1);
          setSelectedOptionId(null);
          setIsSubmitting(false);
          setRoundStartTime(Date.now());
          setTimeRemainingSec(15);
        }
      }, 1400);
    } else {
      setIsSubmitting(false);
    }
  };

  const currentStandings = match ? standings(match) : [];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header & Disclaimer */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-900/60 text-teal-300 border border-teal-700/50">
              Prometheus Arena
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-800/50">
              Rating: {learnerRating} Elo
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white mt-1">
            Multiscale Retrieval Practice with Rival Anime Bots
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{ARENA_DISCLAIMER}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            New Seed ({seed})
          </button>
        </div>
      </div>

      {/* 3 Rival Bot Showcase Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ARENA_BOTS.map((bot) => {
          const isAria = bot.id === 'bot:aria';
          const isKenji = bot.id === 'bot:kenji';
          const avatarUrl = isAria
            ? '/prometheus/arena/aria.svg'
            : isKenji
              ? '/prometheus/arena/kenji.svg'
              : '/prometheus/arena/mira.svg';
          const borderColor = isAria
            ? 'border-teal-500/50 bg-teal-950/20'
            : isKenji
              ? 'border-indigo-500/50 bg-indigo-950/20'
              : 'border-purple-500/50 bg-purple-950/20';

          return (
            <div
              key={bot.id}
              className={`flex items-center gap-3.5 p-3 rounded-xl border ${borderColor} transition-all`}
            >
              <img
                src={avatarUrl}
                alt={bot.name}
                className="w-14 h-14 rounded-full border-2 border-slate-700 object-cover shadow-md flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">{bot.name}</span>
                  <span className="text-[10px] text-slate-400">({bot.rating} Elo)</span>
                </div>
                <p className="text-xs text-slate-300 truncate">{bot.persona}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                  <span>Speed: ~{(bot.meanResponseMs / 1000).toFixed(1)}s</span>
                  <span>•</span>
                  <span>Acc: {(bot.accuracy[2] * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Anime Dialogue Bubble */}
      {activeDialogue && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 shadow-inner">
          <span className="text-xl">💬</span>
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-teal-400">
              {activeDialogue.speakerName} ({activeDialogue.emotion}):
            </span>
            <p className="text-sm text-slate-200 italic font-medium">"{activeDialogue.text}"</p>
          </div>
        </div>
      )}

      {/* Teachable Causal Hemodynamics Telemetry */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Teachable Causal Hemodynamics</span>
          <span>PV-Loop Coupling State</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-teal-400 block">Preload (EDV)</span>
            <span className="font-bold text-sm text-white">
              {causalSim.finalState.values['preload_edv']?.toFixed(1) ?? '120.0'} mL
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-magenta-400 block text-fuchsia-400">Inotropy</span>
            <span className="font-bold text-sm text-white">
              {causalSim.finalState.values['contractility']?.toFixed(2) ?? '1.00'}x
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-blue-400 block">SVR (Afterload)</span>
            <span className="font-bold text-sm text-white">
              {causalSim.finalState.values['afterload_svr']?.toFixed(0) ?? '1200'} dyn
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-emerald-400 block">Cardiac Output</span>
            <span className="font-bold text-sm text-white">
              {causalSim.finalState.values['cardiac_output']?.toFixed(2) ?? '5.00'} L/m
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-amber-400 block">Mean Arterial P</span>
            <span className="font-bold text-sm text-white">
              {causalSim.finalState.values['mean_arterial_pressure']?.toFixed(1) ?? '93.3'} mmHg
            </span>
          </div>
        </div>
      </div>

      {/* Main Arena Gameplay Area (Dual Projection) */}
      {match && match.status !== 'finished' && currentQ ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question & Answer Deck (2 cols desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-400">
                  Question {activeRoundIndex + 1} of {match.questionIds.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Time:</span>
                  <span
                    className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                      timeRemainingSec <= 5
                        ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {timeRemainingSec}s
                  </span>
                </div>
              </div>

              <h2 className="text-base lg:text-lg font-bold text-white leading-snug">
                {currentQ.stem}
              </h2>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOptionId === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setSelectedOptionId(opt.id);
                        handleOptionSubmit(opt.id);
                      }}
                      className={`w-full min-h-[44px] text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-teal-400 bg-teal-950/40 text-teal-100 shadow-md ring-2 ring-teal-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                      } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {letter}
                      </span>
                      <span className="text-sm font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Standings Sidebar (1 col desktop) */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Standings
              </h3>
              <div className="space-y-2">
                {currentStandings.map((st) => {
                  const isLearner = st.competitorId === 'learner';
                  return (
                    <div
                      key={st.competitorId}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                        isLearner
                          ? 'border-amber-500/50 bg-amber-950/20 text-amber-200'
                          : 'border-slate-800 bg-slate-950 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-500 w-4">#{st.rank}</span>
                        <span className="font-semibold">{st.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400">
                          {st.correct}/{activeRoundIndex + 1}
                        </span>
                        <span className="font-mono font-bold text-sm">{st.points} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : match && match.status === 'finished' ? (
        /* Match Finished Podium */
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-6">
          <div className="space-y-2">
            <span className="text-4xl">🏆</span>
            <h2 className="text-2xl font-black text-white">Retrieval Practice Complete!</h2>
            <p className="text-sm text-slate-400">
              Your performance has been incorporated into the canonical spaced-retrieval schedule.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            {currentStandings.map((st) => (
              <div
                key={st.competitorId}
                className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
                  st.rank === 1
                    ? 'border-amber-500 bg-amber-950/40 text-amber-100 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : ' '}
                  </span>
                  <span>{st.name}</span>
                </div>
                <div className="font-mono">{st.points} pts</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => initMatch(seed + 1)}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 transition shadow-lg"
          >
            Play Next Match
          </button>
        </div>
      ) : null}
    </div>
  );
};
