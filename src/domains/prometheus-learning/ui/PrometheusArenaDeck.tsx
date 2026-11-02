import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  ARENA_BOTS,
  ARENA_DISCLAIMER,
  createMatch,
  answerRound,
  standings,
  updateRating,
  currentQuestionId,
  applyMatchToProgress,
  matchLog,
  eligibleArenaQuestions,
  pickArenaQuestions,
  type ArenaMatch,
  type Standing,
} from '../engine/arena.ts'
import {
  CARDIOVASCULAR_CATALOG,
  newProgress,
  startLesson,
  type LearningProgress,
} from '../index.ts'
import {
  searchEducationalUniverse,
  type EducationalSearchResult,
} from '../engine/educationalSearchEngine.ts'
import {
  getTeachableFigure,
  listTeachableFigures,
  type TeachableFigureDef,
} from '../engine/teachableFigureEngine.ts'
import { CARDIOVASCULAR_SPEC, buildConceptGraph } from '../../biological-concept-graph/index.ts'
import { AriaAvatar, KenjiAvatar, MiraAvatar, LearnerAvatar, type AvatarExpression } from './animeAvatars.tsx'
import { TeachableFigureInteractiveView } from './TeachableFigureInteractiveView.tsx'

export function PrometheusArenaDeck() {
  const graph = useMemo(() => {
    const res = buildConceptGraph(CARDIOVASCULAR_SPEC)
    if (!res.ok) throw new Error('Failed to initialize concept graph')
    return res.graph
  }, [])
  const catalog = CARDIOVASCULAR_CATALOG

  // Initialize unlocked learner progress (unlocks lessons for arena)
  const [progress, setProgress] = useState<LearningProgress>(() => {
    let p = newProgress('learner_alpha')
    const s1 = startLesson(p, catalog, 'learner_alpha', 'les:cardiac_output')
    if (s1.ok) p = s1.progress
    const s2 = startLesson(p, catalog, 'learner_alpha', 'les:cardiomyocyte_structure')
    if (s2.ok) p = s2.progress
    const s3 = startLesson(p, catalog, 'learner_alpha', 'les:ec_coupling')
    if (s3.ok) p = s3.progress
    return p
  })

  // Learner rating state
  const [learnerRating, setLearnerRating] = useState<number>(1200)

  // Arena match state
  const [match, setMatch] = useState<ArenaMatch | null>(null)
  const [matchSeed, setMatchSeed] = useState<number>(() => Math.floor(Math.random() * 100000))
  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(20000)
  const [elapsedMs, setElapsedMs] = useState<number>(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  // Interactive drawer states
  const [activeFigure, setActiveFigure] = useState<TeachableFigureDef<any, any> | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<readonly EducationalSearchResult[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false)

  // Terminal CLI log stream
  const [cliInput, setCliInput] = useState<string>('')
  const [customTerminalLogs, setCustomTerminalLogs] = useState<string[]>([
    'PanaceaMed Prometheus Clinical Knowledge Arena — OS Kernel v2.4',
    `# ${ARENA_DISCLAIMER}`,
    'Type "help" or click [Start New Match] to begin arena challenge.',
  ])

  const roundStartTimeRef = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const terminalBottomRef = useRef<HTMLDivElement | null>(null)

  // Current active question
  const currentQId = match ? currentQuestionId(match) : null
  const currentQuestion = useMemo(
    () => (currentQId ? catalog.questions.find((q) => q.id === currentQId) ?? null : null),
    [currentQId, catalog]
  )

  // Helper: append terminal lines
  const appendLog = useCallback((line: string | string[]) => {
    setCustomTerminalLogs((prev) => [...prev, ...(Array.isArray(line) ? line : [line])])
  }, [])

  // Auto-scroll terminal
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [customTerminalLogs, match?.rounds.length])

  // Start new match
  const handleStartMatch = useCallback(() => {
    const eligible = eligibleArenaQuestions(progress, catalog)
    const selectedQIds = pickArenaQuestions(eligible, 5, matchSeed)
    const res = createMatch(
      {
        matchId: `arena_${Date.now().toString(36)}`,
        userId: progress.userId,
        seed: matchSeed,
        timeLimitMs: 20000,
        questionIds: selectedQIds,
      },
      catalog,
      progress
    )

    if (res.ok) {
      setMatch(res.match)
      setSelectedOptionId(null)
      setTimeRemainingMs(res.match.timeLimitMs)
      setElapsedMs(0)
      roundStartTimeRef.current = Date.now()
      appendLog([
        '------------------------------------------------------------',
        `$ prometheus arena --match ${res.match.matchId} --seed ${matchSeed}`,
        `[MATCH INITIALIZED] 5 Rounds • Rivals: Aria (1100), Kenji (1250), Mira (1400)`,
        'Press 1, 2, 3, 4 or click an option before timer expires!',
      ])
    } else {
      appendLog(`[ERROR] Could not initialize arena: ${res.reason}`)
    }
  }, [progress, catalog, matchSeed, appendLog])

  // Timer loop for round countdown
  useEffect(() => {
    if (!match || match.status === 'finished') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    roundStartTimeRef.current = Date.now()
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      const spent = Date.now() - roundStartTimeRef.current
      const left = Math.max(0, match.timeLimitMs - spent)
      setTimeRemainingMs(left)
      setElapsedMs(spent)

      // Time out handler
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        handleAnswerOption(null, match.timeLimitMs)
      }
    }, 100)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [match?.rounds.length, match?.status])

  // Answer handler
  const handleAnswerOption = useCallback(
    (optionId: string | null, responseTimeOverride?: number) => {
      if (!match || match.status === 'finished' || !currentQId) return
      const respMs = responseTimeOverride ?? Math.min(Date.now() - roundStartTimeRef.current, match.timeLimitMs)

      const res = answerRound(match, catalog, {
        userId: progress.userId,
        questionId: currentQId,
        optionId,
        responseMs: respMs,
      })

      if (res.ok) {
        setMatch(res.match)
        setSelectedOptionId(optionId)

        const learnerAns = res.round.answers.find((a) => a.competitorId === 'learner')!
        const correctOpt = catalog.questions.find((q) => q.id === currentQId)?.options.find((o) => o.id === currentQuestion?.correctOptionId)

        const roundLogs = [
          `[ROUND ${res.match.rounds.length}/${res.match.questionIds.length}] Answered in ${(respMs / 1000).toFixed(1)}s`,
          `  > YOU: ${learnerAns.timedOut ? 'TIMEOUT ⌛' : learnerAns.correct ? 'CORRECT! ✓' : 'WRONG ✕'} (+${learnerAns.points} pts)`,
        ]

        for (const ans of res.round.answers.slice(1)) {
          const bot = ARENA_BOTS.find((b) => b.id === ans.competitorId)
          roundLogs.push(
            `  > ${bot?.name ?? ans.competitorId}: ${ans.timedOut ? 'TIMEOUT' : ans.correct ? 'CORRECT' : 'WRONG'} in ${(ans.responseMs / 1000).toFixed(1)}s (+${ans.points} pts)`
          )
        }

        if (correctOpt) {
          roundLogs.push(`  [KEY] Option ${correctOpt.id}: ${correctOpt.text} (${correctOpt.rationale})`)
        }

        appendLog(roundLogs)

        // If match finished, compute Elo and save to progress
        if (res.match.status === 'finished') {
          const finalStandings = standings(res.match)
          const eloRes = updateRating(res.match, learnerRating)
          if (eloRes.ok) {
            setLearnerRating(eloRes.rating)
            appendLog([
              '============================================================',
              'MATCH COMPLETED — FINAL ARENA STANDINGS:',
              ...finalStandings.map((s) => `  #${s.rank} ${s.name.padEnd(6)} : ${s.points} pts (${s.correct}/5 correct, ${(s.totalMs / 1000).toFixed(1)}s)`),
              `Rating adjustment: ${eloRes.delta >= 0 ? '+' : ''}${eloRes.delta} → New Elo: ${eloRes.rating}`,
              '============================================================',
            ])
          }

          // Feed into Leitner progress
          const applied = applyMatchToProgress(progress, catalog, res.match, 1)
          setProgress(applied.progress)
        }
      } else {
        appendLog(`[ERROR] Answer rejected: ${res.reason}`)
      }
    },
    [match, currentQId, catalog, progress, currentQuestion, learnerRating, appendLog]
  )

  // Keyboard shortcut listener (1, 2, 3, 4)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (document.activeElement?.tagName === 'INPUT') return
      if (!currentQuestion) return

      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= currentQuestion.options.length) {
        const opt = currentQuestion.options[num - 1]
        if (opt) handleAnswerOption(opt.id)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentQuestion, handleAnswerOption])

  // Terminal command dispatch
  function handleCliSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cmd = cliInput.trim()
    if (!cmd) return
    setCliInput('')
    appendLog(`$ ${cmd}`)

    const parts = cmd.split(/\s+/)
    const action = parts[0]?.toLowerCase()

    if (action === 'help') {
      appendLog([
        'Available commands:',
        '  start           - Start a new 5-round competitive match',
        '  search <term>   - Deep search biological graph, lessons, and figures',
        '  explain [fig]   - Open interactive causal teachable figure simulation',
        '  answer <1..4>   - Select option number for active question',
        '  standings       - Show current match leaderboard',
        '  clear           - Clear terminal output',
      ])
    } else if (action === 'start') {
      setMatchSeed(Math.floor(Math.random() * 100000))
      handleStartMatch()
    } else if (action === 'search') {
      const q = parts.slice(1).join(' ')
      const res = searchEducationalUniverse(q, { graph, catalog })
      setSearchQuery(q)
      setSearchResults(res.results)
      setIsSearchOpen(true)
      appendLog(`Found ${res.results.length} matches for "${q}". Search drawer opened.`)
    } else if (action === 'explain') {
      const figs = listTeachableFigures()
      const targetFig = figs.find((f) => f.id.includes(parts[1] ?? '')) ?? figs[0]
      if (targetFig) {
        setActiveFigure(targetFig)
        appendLog(`Opening Teachable Figure: ${targetFig.title}`)
      }
    } else if (action === 'standings') {
      if (match) {
        const st = standings(match)
        appendLog(st.map((s) => `#${s.rank} ${s.name}: ${s.points} pts (${s.correct} correct)`))
      } else {
        appendLog('No active match. Type "start" to begin.')
      }
    } else if (action === 'answer') {
      const optIdx = parseInt(parts[1] ?? '0', 10) - 1
      if (currentQuestion && optIdx >= 0 && optIdx < currentQuestion.options.length) {
        handleAnswerOption(currentQuestion.options[optIdx]!.id)
      } else {
        appendLog('Invalid option index. Choose 1 to 4.')
      }
    } else if (action === 'clear') {
      setCustomTerminalLogs(['[TERMINAL CLEARED] Ready.'])
    } else {
      appendLog(`Unknown command "${cmd}". Type "help" for command list.`)
    }
  }

  // Derive bot avatar expressions based on latest round answers
  const latestRound = match?.rounds[match.rounds.length - 1]
  const botExpression = (botId: string): AvatarExpression => {
    if (!latestRound) return 'neutral'
    const ans = latestRound.answers.find((a) => a.competitorId === botId)
    if (!ans) return 'thinking'
    return ans.correct ? 'correct' : 'wrong'
  }

  const learnerExpression: AvatarExpression = useMemo(() => {
    if (!latestRound) return 'neutral'
    const ans = latestRound.answers.find((a) => a.competitorId === 'learner')
    if (!ans) return 'thinking'
    return ans.correct ? 'correct' : 'wrong'
  }, [latestRound])

  // Current match scores
  const currentStandingsMap = useMemo(() => {
    if (!match) return new Map<string, number>()
    const st = standings(match)
    return new Map(st.map((s) => [s.competitorId, s.points]))
  }, [match])

  return (
    <div className="flex flex-col space-y-5 rounded-3xl border border-emerald-500/20 bg-slate-950 p-4 text-slate-100 shadow-2xl sm:p-6 font-sans">
      {/* Top Banner: Arena Header & Containment Alert */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black tracking-wider text-emerald-400 border border-emerald-500/30">
              PROMETHEUS ARENA • MULTI-AGENT DRILL
            </span>
            <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[11px] font-mono text-purple-300">
              Elo: {learnerRating}
            </span>
          </div>
          <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">
            Simulated Rival Challenge Deck
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Test your biological retrieval speed & accuracy against 3 simulated study rivals. 
            All questions and figures are grounded in verified textbook physiology.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const figs = listTeachableFigures()
              if (figs[0]) setActiveFigure(figs[0])
            }}
            className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-all shadow-sm"
          >
            🔬 Causal Teachable Figures
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="rounded-xl border border-sky-500/40 bg-sky-950/40 px-3.5 py-2 text-xs font-bold text-sky-300 hover:bg-sky-900/60 transition-all shadow-sm"
          >
            🔍 Deep Search
          </button>
          <button
            onClick={handleStartMatch}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-black text-slate-950 hover:brightness-110 transition-all shadow-lg active:scale-95"
          >
            ⚡ {match && match.status === 'in_progress' ? 'Restart Match' : 'Start Match'}
          </button>
        </div>
      </div>

      {/* Podium Row: Learner vs 3 Anime Bots */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Learner Card */}
        <div className="flex flex-col items-center rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/20 p-3 text-center shadow-md">
          <div className="relative">
            <LearnerAvatar size={80} />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-slate-950 uppercase">
              YOU
            </span>
          </div>
          <div className="mt-3 font-bold text-xs text-emerald-300">You (Learner)</div>
          <div className="font-mono text-lg font-black text-white">
            {currentStandingsMap.get('learner') ?? 0} <span className="text-[10px] text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[10px] text-slate-400">Elo: {learnerRating}</div>
        </div>

        {/* Aria (Speedster) */}
        <div className="flex flex-col items-center rounded-2xl border border-teal-500/30 bg-gradient-to-b from-slate-900 to-teal-950/20 p-3 text-center shadow-md">
          <div className="relative">
            <AriaAvatar expression={botExpression('bot:aria')} size={80} />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-2 py-0.5 text-[9px] font-black text-slate-950">
              SPEEDSTER
            </span>
          </div>
          <div className="mt-3 font-bold text-xs text-teal-300">Aria</div>
          <div className="font-mono text-lg font-black text-white">
            {currentStandingsMap.get('bot:aria') ?? 0} <span className="text-[10px] text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[10px] text-slate-400">Elo: 1100 • Mean: 4.2s</div>
        </div>

        {/* Kenji (Methodical) */}
        <div className="flex flex-col items-center rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 to-indigo-950/20 p-3 text-center shadow-md">
          <div className="relative">
            <KenjiAvatar expression={botExpression('bot:kenji')} size={80} />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-2 py-0.5 text-[9px] font-black text-white">
              METHODICAL
            </span>
          </div>
          <div className="mt-3 font-bold text-xs text-indigo-300">Kenji</div>
          <div className="font-mono text-lg font-black text-white">
            {currentStandingsMap.get('bot:kenji') ?? 0} <span className="text-[10px] text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[10px] text-slate-400">Elo: 1250 • Mean: 7.6s</div>
        </div>

        {/* Mira (Scholar Theorist) */}
        <div className="flex flex-col items-center rounded-2xl border border-fuchsia-500/30 bg-gradient-to-b from-slate-900 to-fuchsia-950/20 p-3 text-center shadow-md">
          <div className="relative">
            <MiraAvatar expression={botExpression('bot:mira')} size={80} />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-fuchsia-500 px-2 py-0.5 text-[9px] font-black text-white">
              THEORIST
            </span>
          </div>
          <div className="mt-3 font-bold text-xs text-fuchsia-300">Mira</div>
          <div className="font-mono text-lg font-black text-white">
            {currentStandingsMap.get('bot:mira') ?? 0} <span className="text-[10px] text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[10px] text-slate-400">Elo: 1400 • High Acc</div>
        </div>
      </div>

      {/* Question Active Screen / Round Countdown */}
      {match && currentQuestion ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-inner">
          {/* Progress Bar & Header */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-emerald-400 font-bold">
                ROUND {match.rounds.length + 1} / {match.questionIds.length}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">ID: {currentQuestion.id}</span>
            </div>
            <div className="font-mono text-sm font-bold text-amber-400">
              ⏱ {(timeRemainingMs / 1000).toFixed(1)}s
            </div>
          </div>

          {/* Time Remaining Progress Bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all duration-100 ${
                timeRemainingMs < 5000 ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${(timeRemainingMs / match.timeLimitMs) * 100}%` }}
            />
          </div>

          {/* Question Stem */}
          <h3 className="mt-4 text-base font-semibold text-slate-100 sm:text-lg">
            {currentQuestion.stem}
          </h3>

          {/* 4 Interactive Option Buttons */}
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOptionId === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswerOption(opt.id)}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100 font-semibold'
                      : 'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-emerald-500/50 hover:bg-slate-900 active:scale-[0.99]'
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-mono text-xs font-bold text-slate-300">
                    {idx + 1}
                  </span>
                  <div className="flex-1 text-xs leading-relaxed">{opt.text}</div>
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Shortcut: Press keys [1], [2], [3], [4] on desktop</span>
            <span>Target Concept: {currentQuestion.conceptId}</span>
          </div>
        </div>
      ) : match && match.status === 'finished' ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center">
          <div className="text-2xl">🏆</div>
          <h3 className="mt-1 text-lg font-bold text-emerald-300">Arena Duel Completed!</h3>
          <p className="text-xs text-slate-400 mt-1">
            Check terminal log below for your full itemized breakdown and updated Leitner review schedule.
          </p>
          <button
            onClick={handleStartMatch}
            className="mt-4 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 transition-all shadow-md"
          >
            Rematch Next 5 Questions ⚡
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
          <p className="text-sm font-medium">No duel currently in progress.</p>
          <p className="mt-1 text-xs text-slate-500">
            Click <strong className="text-emerald-400">[Start Match]</strong> above or type <code className="text-emerald-300">start</code> in the terminal.
          </p>
        </div>
      )}

      {/* Terminal Console View */}
      <div className="rounded-2xl border border-slate-800 bg-black/90 p-4 font-mono shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="ml-2 font-bold text-slate-300">PROMETHEUS CLI TERMINAL</span>
          </div>
          <span className="text-[10px] text-slate-500">SESSION: {match?.matchId ?? 'IDLE'}</span>
        </div>

        {/* Scrollable logs */}
        <div className="mt-3 max-h-56 overflow-y-auto space-y-1 text-xs text-slate-300 leading-relaxed pr-2">
          {customTerminalLogs.map((log, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap break-all ${
                log.includes('CORRECT')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('WRONG') || log.includes('TIMEOUT')
                  ? 'text-rose-400'
                  : log.startsWith('$')
                  ? 'text-sky-300 font-bold'
                  : log.startsWith('[')
                  ? 'text-amber-300'
                  : 'text-slate-400'
              }`}
            >
              {log}
            </div>
          ))}
          <div ref={terminalBottomRef} />
        </div>

        {/* Terminal Input Bar */}
        <form onSubmit={handleCliSubmit} className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-2">
          <span className="text-emerald-400 font-bold">$</span>
          <input
            type="text"
            value={cliInput}
            onChange={(e) => setCliInput(e.target.value)}
            placeholder="Type command ('help', 'start', 'search <term>', 'explain', '1'-'4')..."
            className="flex-1 bg-transparent text-xs text-emerald-300 outline-none placeholder:text-slate-600 font-mono"
          />
          <button
            type="submit"
            className="rounded bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700"
          >
            Run
          </button>
        </form>
      </div>

      {/* Teachable Figure Drawer Modal */}
      {activeFigure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <TeachableFigureInteractiveView
              figure={activeFigure}
              onClose={() => setActiveFigure(null)}
            />
          </div>
        </div>
      )}

      {/* Universal Search Drawer Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-sky-500/30 bg-slate-900 p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-sky-400">Universal Educational Search</h3>
                <p className="text-xs text-slate-400">Search biological graph, lessons, teachable figures and cases</p>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const q = e.target.value
                  setSearchQuery(q)
                  const res = searchEducationalUniverse(q, { graph, catalog })
                  setSearchResults(res.results)
                }}
                placeholder="Search across scales (e.g. 'heart', 'calcium', 'scale:cell', 'pv loop')..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-sky-500"
              />
            </div>

            {/* Results List */}
            <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Type a query to search across the entire Panacea educational universe.
                </div>
              ) : (
                searchResults.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-sky-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-sky-300">{r.title}</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-mono text-slate-400">
                        {r.kind}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{r.subtitle}</div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{r.snippet}</p>
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div className="flex gap-1">
                        {r.badges.map((b) => (
                          <span key={b} className="rounded bg-sky-950/40 px-1.5 py-0.5 text-[9px] text-sky-400">
                            {b}
                          </span>
                        ))}
                      </div>
                      <a
                        href={r.deepLink}
                        className="text-[11px] font-bold text-emerald-400 hover:underline"
                      >
                        Explore Deep Link →
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Disclaimer */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2 text-[10px] text-slate-500 text-center font-mono">
        ⚠ {ARENA_DISCLAIMER}
      </div>
    </div>
  )
}
