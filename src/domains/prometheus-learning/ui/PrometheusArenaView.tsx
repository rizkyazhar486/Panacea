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
  const { isDesktop } = useAdaptive();

  const [progress] = useState<LearningProgress>(() => {
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

      if (currentQ?.conceptId === 'pcg:sarcomere' || currentQ?.conceptId === 'pcg:excitation_contraction_coupling') {
        setCausalSim(
          simulateCausalNetwork(HEMODYNAMIC_CAUSAL_NETWORK, [
            { variableId: 'contractility', type: 'relative_delta', value: isCorrect ? 0.3 : -0.2 },
          ])
        );
      }

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
    <div
      style={{
        width: '100%',
        maxWidth: '80rem',
        margin: '0 auto',
        padding: isDesktop ? '1.5rem' : '1rem',
        backgroundColor: '#020617',
        color: '#f1f5f9',
        borderRadius: '1rem',
        border: '1px solid #1e293b',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: isDesktop ? 'center' : 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                padding: '0.125rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor: '#134e4a',
                color: '#5eead4',
                border: '1px solid #0f766e',
              }}
            >
              Prometheus Arena
            </span>
            <span
              style={{
                padding: '0.125rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: '#451a03',
                color: '#fcd34d',
                border: '1px solid #92400e',
              }}
            >
              Rating: {learnerRating} Elo
            </span>
          </div>
          <h1 style={{ fontSize: isDesktop ? '1.5rem' : '1.25rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>
            Multiscale Retrieval Practice with Rival Anime Bots
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{ARENA_DISCLAIMER}</p>
        </div>

        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          style={{
            minHeight: '44px',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            cursor: 'pointer',
          }}
        >
          New Seed ({seed})
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(3, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        {ARENA_BOTS.map((bot) => {
          const isAria = bot.id === 'bot:aria';
          const isKenji = bot.id === 'bot:kenji';
          const avatarUrl = isAria
            ? '/prometheus/arena/aria.svg'
            : isKenji
              ? '/prometheus/arena/kenji.svg'
              : '/prometheus/arena/mira.svg';
          const accentBorder = isAria ? '#14b8a6' : isKenji ? '#6366f1' : '#a855f7';

          return (
            <div
              key={bot.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: `1px solid ${accentBorder}`,
                backgroundColor: '#0f172a',
              }}
            >
              <img
                src={avatarUrl}
                alt={bot.name}
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '9999px',
                  border: '2px solid #334155',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>{bot.name}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>({bot.rating} Elo)</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bot.persona}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.6875rem', color: '#94a3b8' }}>
                  <span>Speed: ~{(bot.meanResponseMs / 1000).toFixed(1)}s</span>
                  <span>•</span>
                  <span>Acc: {(bot.accuracy[2] * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeDialogue && (
        <div
          style={{
            padding: '0.875rem',
            borderRadius: '0.75rem',
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>💬</span>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2dd4bf', display: 'block' }}>
              {activeDialogue.speakerName} ({activeDialogue.emotion}):
            </span>
            <p style={{ fontSize: '0.875rem', color: '#e2e8f0', fontStyle: 'italic', margin: 0 }}>
              "{activeDialogue.text}"
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          padding: '0.875rem',
          borderRadius: '0.75rem',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Teachable Causal Hemodynamics</span>
          <span>PV-Loop Coupling State</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(5, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
            gap: '0.5rem',
            textAlign: 'center',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#020617', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.6875rem', color: '#2dd4bf', display: 'block' }}>Preload (EDV)</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>
              {causalSim.finalState.values['preload_edv']?.toFixed(1) ?? '120.0'} mL
            </span>
          </div>
          <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#020617', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.6875rem', color: '#e879f9', display: 'block' }}>Inotropy</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>
              {causalSim.finalState.values['contractility']?.toFixed(2) ?? '1.00'}x
            </span>
          </div>
          <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#020617', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.6875rem', color: '#60a5fa', display: 'block' }}>SVR (Afterload)</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>
              {causalSim.finalState.values['afterload_svr']?.toFixed(0) ?? '1200'} dyn
            </span>
          </div>
          <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#020617', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.6875rem', color: '#34d399', display: 'block' }}>Cardiac Output</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>
              {causalSim.finalState.values['cardiac_output']?.toFixed(2) ?? '5.00'} L/m
            </span>
          </div>
          <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#020617', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.6875rem', color: '#fbbf24', display: 'block' }}>Mean Arterial P</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>
              {causalSim.finalState.values['mean_arterial_pressure']?.toFixed(1) ?? '93.3'} mmHg
            </span>
          </div>
        </div>
      </div>

      {match && match.status !== 'finished' && currentQ ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr',
            gap: '1.5rem',
          }}
        >
          <div style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2dd4bf' }}>
                Question {activeRoundIndex + 1} of {match.questionIds.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Time:</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: timeRemainingSec <= 5 ? '#450a0a' : '#1e293b',
                    color: timeRemainingSec <= 5 ? '#f87171' : '#e2e8f0',
                  }}
                >
                  {timeRemainingSec}s
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: isDesktop ? '1.125rem' : '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
              {currentQ.stem}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
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
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      textAlign: 'left',
                      padding: '0.875rem',
                      borderRadius: '0.75rem',
                      border: isSelected ? '1px solid #2dd4bf' : '1px solid #1e293b',
                      backgroundColor: isSelected ? '#134e4a' : '#020617',
                      color: isSelected ? '#ccfbf1' : '#cbd5e1',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      opacity: isSubmitting ? 0.7 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        backgroundColor: '#1e293b',
                        color: '#cbd5e1',
                        border: '1px solid #334155',
                      }}
                    >
                      {letter}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem' }}>
              Live Standings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {currentStandings.map((st) => {
                const isLearner = st.competitorId === 'learner';
                return (
                  <div
                    key={st.competitorId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem',
                      borderRadius: '0.5rem',
                      border: isLearner ? '1px solid #f59e0b' : '1px solid #1e293b',
                      backgroundColor: isLearner ? '#451a03' : '#020617',
                      color: isLearner ? '#fde68a' : '#cbd5e1',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#64748b' }}>#{st.rank}</span>
                      <span style={{ fontWeight: 600 }}>{st.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: '#94a3b8' }}>
                        {st.correct}/{activeRoundIndex + 1}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }}>{st.points} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : match && match.status === 'finished' ? (
        <div
          style={{
            padding: '2rem',
            borderRadius: '1rem',
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '2.25rem', display: 'block', marginBottom: '0.5rem' }}>🏆</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.25rem' }}>
            Retrieval Practice Complete!
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            Your performance has been incorporated into the canonical spaced-retrieval schedule.
          </p>

          <div style={{ maxWidth: '28rem', margin: '0 auto 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentStandings.map((st) => (
              <div
                key={st.competitorId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: st.rank === 1 ? '1px solid #f59e0b' : '1px solid #1e293b',
                  backgroundColor: st.rank === 1 ? '#451a03' : '#020617',
                  color: st.rank === 1 ? '#fef3c7' : '#cbd5e1',
                  fontSize: '0.875rem',
                  fontWeight: st.rank === 1 ? 700 : 500,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span>{st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : ' '}</span>
                  <span>{st.name}</span>
                </div>
                <div style={{ fontFamily: 'monospace' }}>{st.points} pts</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => initMatch(seed + 1)}
            style={{
              minHeight: '44px',
              padding: '0.625rem 1.5rem',
              borderRadius: '0.75rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              backgroundColor: '#14b8a6',
              color: '#020617',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Play Next Match
          </button>
        </div>
      ) : null}
    </div>
  );
};
