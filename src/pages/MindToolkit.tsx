import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Cognitive Longevity Toolkit — seven small real brain/stress tools in one
// page: a pattern-recognition puzzle, a memory-match game, a reaction-time
// test, a word-of-the-day widget, a stress inventory, a digital-detox
// stopwatch, and a meditation streak calendar. Pure client-side, localStorage
// persisted, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'puzzle' | 'memory' | 'reaction' | 'word' | 'stress' | 'detox' | 'meditation' | 'stroop' | 'nback' | 'pattern' | 'tapping' | 'gonogo'

const PUZZLES = [
  { seq: '2, 4, 8, 16, ?', answer: '32', hint: 'Each number doubles' },
  { seq: '1, 1, 2, 3, 5, 8, ?', answer: '13', hint: 'Fibonacci — sum of the previous two' },
  { seq: '3, 6, 9, 12, ?', answer: '15', hint: 'Add 3 each time' },
  { seq: '1, 4, 9, 16, ?', answer: '25', hint: 'Perfect squares (1², 2², 3², 4², 5²)' },
  { seq: '2, 6, 12, 20, ?', answer: '30', hint: 'Differences increase by 2 each time' },
]
function BrainPuzzle() {
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const p = PUZZLES[i % PUZZLES.length]
  return (
    <Card className="!p-6 text-center">
      <div className="text-xs font-black uppercase tracking-wide text-neutral-400">What comes next?</div>
      <div className="mt-3 text-2xl font-black text-ink dark:text-white">{p.seq}</div>
      {revealed ? (
        <div className="mt-4 rounded-xl bg-brand/10 p-3">
          <div className="text-xl font-black text-brand-dark">{p.answer}</div>
          <div className="text-[12px] text-neutral-500">{p.hint}</div>
        </div>
      ) : (
        <button onClick={() => setRevealed(true)} className="mt-4 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-600 dark:bg-white/10">Reveal answer</button>
      )}
      <button onClick={() => { setI((x) => x + 1); setRevealed(false) }} className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Next puzzle</button>
    </Card>
  )
}

const MEMORY_EMOJI = ['🍎', '🍇', '🍋', '🍓', '🍒', '🥝', '🍑', '🍉']
function shuffledDeck(): string[] {
  const deck = [...MEMORY_EMOJI, ...MEMORY_EMOJI]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}
function MemoryMatch() {
  const [deck, setDeck] = useState(shuffledDeck)
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)

  const click = (i: number) => {
    if (open.length === 2 || open.includes(i) || matched.includes(i)) return
    const next = [...open, i]
    setOpen(next)
    if (next.length === 2) {
      setMoves((m) => m + 1)
      if (deck[next[0]] === deck[next[1]]) {
        setTimeout(() => { setMatched((m) => [...m, ...next]); setOpen([]) }, 400)
      } else {
        setTimeout(() => setOpen([]), 700)
      }
    }
  }
  const reset = () => { setDeck(shuffledDeck()); setOpen([]); setMatched([]); setMoves(0) }
  const won = matched.length === deck.length

  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between text-[12px] text-neutral-500">
        <span>Moves: {moves}</span>
        {won && <Badge tone="brand">✓ Solved!</Badge>}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {deck.map((emoji, i) => {
          const visible = open.includes(i) || matched.includes(i)
          return (
            <button key={i} onClick={() => click(i)} className={`flex h-16 items-center justify-center rounded-xl text-2xl transition ${visible ? 'bg-brand/10' : 'bg-neutral-100 dark:bg-white/10'}`}>
              {visible ? emoji : ''}
            </button>
          )
        })}
      </div>
      <button onClick={reset} className="mt-4 w-full rounded-xl bg-neutral-100 py-2 text-sm font-bold text-neutral-600 dark:bg-white/10">New game</button>
    </Card>
  )
}

function ReactionTime() {
  const [state, setState] = useState<'idle' | 'waiting' | 'go' | 'result' | 'early'>('idle')
  const [ms, setMs] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem('pmd_reaction_best_v1') || 0))
  const startTs = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const begin = () => {
    setState('waiting')
    const delay = 1000 + Math.random() * 3000
    timeoutRef.current = setTimeout(() => { startTs.current = Date.now(); setState('go') }, delay)
  }
  const onClick = () => {
    if (state === 'idle' || state === 'result' || state === 'early') { begin(); return }
    if (state === 'waiting') { if (timeoutRef.current) clearTimeout(timeoutRef.current); setState('early'); return }
    if (state === 'go') {
      const t = Date.now() - startTs.current
      setMs(t)
      if (best === 0 || t < best) { setBest(t); try { localStorage.setItem('pmd_reaction_best_v1', String(t)) } catch { /* ignore */ } }
      setState('result')
    }
  }

  const bg = state === 'go' ? 'bg-brand' : state === 'waiting' ? 'bg-red-400' : 'bg-neutral-200 dark:bg-white/10'
  const label = state === 'idle' ? 'Tap to start' : state === 'waiting' ? 'Wait for green…' : state === 'go' ? 'Tap now!' : state === 'early' ? 'Too early — tap to retry' : `${ms}ms — tap to retry`

  return (
    <Card className="!p-5 text-center">
      <button onClick={onClick} className={`flex h-56 w-full items-center justify-center rounded-2xl text-lg font-black text-white transition ${bg}`}>{label}</button>
      <p className="mt-3 text-[12px] text-neutral-400">Best: {best > 0 ? `${best}ms` : '—'}</p>
    </Card>
  )
}

const WORDS = [
  { word: 'Eudaimonia', def: 'A state of flourishing from living in accordance with your values, not just feeling good.' },
  { word: 'Hormesis', def: 'A beneficial stress response — small controlled stressors (exercise, cold, fasting) that make you more resilient.' },
  { word: 'Neuroplasticity', def: "The brain's ability to reorganize and form new connections throughout life, not just childhood." },
  { word: 'Allostasis', def: 'Achieving stability through change — the body actively adjusting to anticipated demands.' },
  { word: 'Autophagy', def: "The cell's process of clearing out damaged components — literally \"self-eating.\"" },
  { word: 'Sarcopenia', def: 'Age-related loss of muscle mass and strength — largely preventable with resistance training.' },
  { word: 'Interoception', def: 'Your sense of your body\'s internal state — hunger, heartbeat, tension.' },
]
function WordOfDay() {
  const dayIndex = Math.floor(Date.now() / 86400000) % WORDS.length
  const w = WORDS[dayIndex]
  return (
    <Card className="!p-6 text-center">
      <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Today's word</div>
      <div className="mt-2 text-2xl font-black text-brand-dark">{w.word}</div>
      <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{w.def}</p>
    </Card>
  )
}

const STRESS_KEY = 'pmd_stress_inventory_v1'
function StressInventory() {
  const [items, setItems] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(STRESS_KEY) || '[]') } catch { return [] } })
  const [text, setText] = useState('')
  useEffect(() => { try { localStorage.setItem(STRESS_KEY, JSON.stringify(items)) } catch { /* ignore */ } }, [items])
  const add = () => { if (!text.trim()) return; setItems((s) => [...s, text.trim()]); setText('') }
  const move = (i: number, dir: -1 | 1) => setItems((s) => {
    const next = [...s]; const j = i + dir
    if (j < 0 || j >= next.length) return s;
    [next[i], next[j]] = [next[j], next[i]]
    return next
  })
  const remove = (i: number) => setItems((s) => s.filter((_, x) => x !== i))
  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">List what's stressing you, order it by what's actually worth your energy today, then discard what isn't.</p>
      <div className="mt-3 flex gap-2">
        <input className={inputClassLocal} placeholder="Add a stressor…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button onClick={add} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">Add</button>
      </div>
      <div className="mt-3 space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/5">
            <span className="flex-1 text-[13px] text-ink dark:text-white">{item}</span>
            <button onClick={() => move(i, -1)} className="text-neutral-400">↑</button>
            <button onClick={() => move(i, 1)} className="text-neutral-400">↓</button>
            <button onClick={() => remove(i)} className="text-red-500">✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-[12px] text-neutral-400">Nothing listed — good, or add what's on your mind.</p>}
      </div>
    </Card>
  )
}
const inputClassLocal = 'flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white'

const DETOX_KEY = 'pmd_digital_detox_v1'
function DigitalDetox() {
  const [sessions, setSessions] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem(DETOX_KEY) || '[]') } catch { return [] } })
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  useEffect(() => { try { localStorage.setItem(DETOX_KEY, JSON.stringify(sessions)) } catch { /* ignore */ } }, [sessions])
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [running])
  const stop = () => { setRunning(false); if (seconds > 0) setSessions((s) => [...s.slice(-9), seconds]); setSeconds(0) }
  const totalMin = Math.round(sessions.reduce((a, b) => a + b, 0) / 60)
  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">Track time spent away from your phone.</p>
      <div className="mt-3 text-4xl font-black tabular-nums text-brand-dark">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</div>
      <button onClick={() => (running ? stop() : setRunning(true))} className={`mt-4 w-full rounded-xl py-2.5 text-sm font-bold ${running ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300' : 'bg-brand text-white'}`}>{running ? 'End session' : 'Start detox session'}</button>
      <p className="mt-3 text-[12px] text-neutral-400">{totalMin} min tracked across {sessions.length} sessions</p>
    </Card>
  )
}

const STROOP_COLORS = [
  { name: 'Red', hex: '#EF4444' }, { name: 'Blue', hex: '#3B82F6' }, { name: 'Green', hex: '#00BF63' }, { name: 'Yellow', hex: '#F59E0B' },
]
function StroopTest() {
  const [round, setRound] = useState(0)
  const [word, setWord] = useState(STROOP_COLORS[0])
  const [ink, setInk] = useState(STROOP_COLORS[1])
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [times, setTimes] = useState<number[]>([])
  const [started, setStarted] = useState(false)
  const startTs = useRef(0)

  const nextRound = () => {
    const w = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
    const i = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
    setWord(w); setInk(i); setRound((r) => r + 1)
    startTs.current = performance.now()
  }
  const begin = () => { setStarted(true); setScore({ correct: 0, total: 0 }); setTimes([]); nextRound() }
  const answer = (c: typeof STROOP_COLORS[number]) => {
    const rt = performance.now() - startTs.current
    setTimes((t) => [...t, rt])
    setScore((s) => ({ correct: s.correct + (c.name === ink.name ? 1 : 0), total: s.total + 1 }))
    if (round >= 15) { setStarted(false); return }
    nextRound()
  }
  const avgMs = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0

  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">Tap the button matching the <b>ink color</b>, not the word — measures executive function / processing speed.</p>
      {!started && round === 0 && <button onClick={begin} className="mt-4 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Start (15 rounds)</button>}
      {started && (
        <>
          <div className="mt-4 text-4xl font-black" style={{ color: ink.hex }}>{word.name}</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {STROOP_COLORS.map((c) => <button key={c.name} onClick={() => answer(c)} className="rounded-xl py-3 text-sm font-bold text-white" style={{ background: c.hex }}>{c.name}</button>)}
          </div>
        </>
      )}
      {!started && round > 0 && (
        <div className="mt-4 rounded-xl bg-brand/10 p-4">
          <div className="text-2xl font-black text-brand-dark">{score.correct}/{score.total} correct</div>
          <div className="text-[12px] text-neutral-500">Avg response: {avgMs}ms</div>
          <button onClick={begin} className="mt-3 w-full rounded-xl bg-brand py-2 text-sm font-bold text-white">Try again</button>
        </div>
      )}
    </Card>
  )
}

function DualNBack() {
  const [n] = useState(2)
  const [seq, setSeq] = useState<{ pos: number; letter: string }[]>([])
  const [running, setRunning] = useState(false)
  const [current, setCurrent] = useState<{ pos: number; letter: string } | null>(null)
  const [matches, setMatches] = useState({ posHits: 0, letterHits: 0, posMiss: 0, letterMiss: 0 })
  const [answered, setAnswered] = useState({ pos: false, letter: false })
  const LETTERS = 'CHKLQRSTW'.split('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seqRef = useRef<typeof seq>([])

  const start = () => {
    setSeq([]); seqRef.current = []
    setMatches({ posHits: 0, letterHits: 0, posMiss: 0, letterMiss: 0 })
    setRunning(true)
    let count = 0
    timerRef.current = setInterval(() => {
      const item = { pos: Math.floor(Math.random() * 9), letter: LETTERS[Math.floor(Math.random() * LETTERS.length)] }
      seqRef.current = [...seqRef.current, item]
      setSeq((s) => [...s, item])
      setCurrent(item)
      setAnswered({ pos: false, letter: false })
      count++
      if (count >= 20) { clearInterval(timerRef.current!); setTimeout(() => setRunning(false), 3000) }
    }, 3000)
  }
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const markPos = () => {
    if (answered.pos) return
    setAnswered((a) => ({ ...a, pos: true }))
    const i = seqRef.current.length - 1
    const isMatch = i >= n && seqRef.current[i].pos === seqRef.current[i - n].pos
    setMatches((m) => (isMatch ? { ...m, posHits: m.posHits + 1 } : { ...m, posMiss: m.posMiss + 1 }))
  }
  const markLetter = () => {
    if (answered.letter) return
    setAnswered((a) => ({ ...a, letter: true }))
    const i = seqRef.current.length - 1
    const isMatch = i >= n && seqRef.current[i].letter === seqRef.current[i - n].letter
    setMatches((m) => (isMatch ? { ...m, letterHits: m.letterHits + 1 } : { ...m, letterMiss: m.letterMiss + 1 }))
  }

  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">The gold-standard working-memory trainer. Tap "Position match" or "Letter match" when the current square/letter matches the one from {n} steps back.</p>
      {!running && seq.length === 0 && <button onClick={start} className="mt-4 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Start 2-back (20 rounds)</button>}
      {running && current && (
        <>
          <div className="mx-auto mt-4 grid w-40 grid-cols-3 gap-1">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={`flex h-12 items-center justify-center rounded-lg text-lg font-black ${i === current.pos ? 'bg-brand text-white' : 'bg-neutral-100 dark:bg-white/10'}`}>{i === current.pos ? current.letter : ''}</div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={markPos} disabled={answered.pos} className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-sm font-bold text-neutral-600 disabled:opacity-40 dark:bg-white/10 dark:text-neutral-300">Position match</button>
            <button onClick={markLetter} disabled={answered.letter} className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-sm font-bold text-neutral-600 disabled:opacity-40 dark:bg-white/10 dark:text-neutral-300">Letter match</button>
          </div>
        </>
      )}
      {!running && seq.length > 0 && (
        <div className="mt-4 rounded-xl bg-brand/10 p-4 text-left text-[13px]">
          <div><b>Position:</b> {matches.posHits} correct, {matches.posMiss} incorrect</div>
          <div><b>Letter:</b> {matches.letterHits} correct, {matches.letterMiss} incorrect</div>
          <button onClick={start} className="mt-3 w-full rounded-xl bg-brand py-2 text-sm font-bold text-white">Try again</button>
        </div>
      )}
    </Card>
  )
}

function PatternMatrix() {
  const [size, setSize] = useState(3)
  const [pattern, setPattern] = useState<number[]>([])
  const [showing, setShowing] = useState(false)
  const [input, setInput] = useState<number[]>([])
  const [status, setStatus] = useState<'idle' | 'show' | 'input' | 'win' | 'lose'>('idle')

  const start = (n: number) => {
    setSize(n)
    const cells = n * n
    const count = Math.min(cells - 1, n + 1)
    const chosen = new Set<number>()
    while (chosen.size < count) chosen.add(Math.floor(Math.random() * cells))
    setPattern([...chosen])
    setInput([])
    setStatus('show')
    setShowing(true)
    setTimeout(() => { setShowing(false); setStatus('input') }, 1500)
  }
  const click = (i: number) => {
    if (status !== 'input') return
    const next = [...input, i]
    setInput(next)
    if (!pattern.includes(i)) { setStatus('lose'); return }
    if (next.length === pattern.length) setStatus('win')
  }

  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">Memorize the highlighted squares, then tap them back in any order.</p>
      {status === 'idle' && (
        <div className="mt-4 flex justify-center gap-2">
          {[3, 4, 5].map((n) => <button key={n} onClick={() => start(n)} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">{n}×{n}</button>)}
        </div>
      )}
      {status !== 'idle' && (
        <div className="mx-auto mt-4 grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, minmax(0,1fr))`, maxWidth: 240 }}>
          {Array.from({ length: size * size }, (_, i) => {
            const isPattern = pattern.includes(i)
            const isInput = input.includes(i)
            const highlight = (showing && isPattern) || (status === 'input' && isInput) || (status !== 'input' && !showing && isPattern)
            return <button key={i} onClick={() => click(i)} className={`aspect-square rounded-lg transition ${highlight ? 'bg-brand' : 'bg-neutral-100 dark:bg-white/10'}`} />
          })}
        </div>
      )}
      {status === 'win' && <p className="mt-3 text-sm font-bold text-brand-dark">✓ Solved!</p>}
      {status === 'lose' && <p className="mt-3 text-sm font-bold text-red-500">Missed one — try again</p>}
      {(status === 'win' || status === 'lose') && <button onClick={() => setStatus('idle')} className="mt-3 w-full rounded-xl bg-neutral-100 py-2 text-sm font-bold text-neutral-600 dark:bg-white/10">New pattern</button>}
    </Card>
  )
}

function FingerTappingTest() {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [taps, setTaps] = useState<number[]>([])
  const startRef = useRef(0)
  const DURATION_MS = 10000

  function start() {
    startRef.current = performance.now()
    setTaps([])
    setPhase('running')
    window.setTimeout(() => setPhase('done'), DURATION_MS)
  }
  function tap() {
    if (phase !== 'running') return
    setTaps((t) => [...t, performance.now() - startRef.current])
  }

  const intervals = useMemo(() => taps.slice(1).map((t, i) => t - taps[i]), [taps])
  const meanIntervalMs = intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0
  const sd = intervals.length > 1
    ? Math.sqrt(intervals.reduce((a, b) => a + (b - meanIntervalMs) ** 2, 0) / (intervals.length - 1))
    : 0
  const cv = meanIntervalMs ? (sd / meanIntervalMs) * 100 : 0
  const tapsPerSecond = taps.length / (DURATION_MS / 1000)

  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">Tap as fast and as evenly as you can for 10 seconds. Tapping speed and rhythm consistency are real, widely-used measures of fine motor speed.</p>
      {phase === 'idle' && (
        <button onClick={start} className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white">Start 10s test</button>
      )}
      {phase === 'running' && (
        <button onClick={tap} className="mt-4 h-40 w-full rounded-2xl bg-brand text-2xl font-black text-white active:scale-95">TAP<div className="mt-1 text-sm font-bold opacity-80">{taps.length}</div></button>
      )}
      {phase === 'done' && (
        <div className="mt-4 space-y-2 text-left">
          <div className="flex justify-between text-sm"><span className="text-neutral-500">Total taps</span><b>{taps.length}</b></div>
          <div className="flex justify-between text-sm"><span className="text-neutral-500">Taps / second</span><b>{tapsPerSecond.toFixed(1)}</b></div>
          <div className="flex justify-between text-sm"><span className="text-neutral-500">Rhythm variability (CV)</span><b>{cv.toFixed(1)}%</b></div>
          <p className="text-[11px] text-neutral-400">Lower variability = steadier rhythm. Not a diagnostic motor exam — just a fun, repeatable self-tracker.</p>
          <button onClick={() => setPhase('idle')} className="mt-2 w-full rounded-xl bg-neutral-100 py-2 text-sm font-bold text-neutral-600 dark:bg-white/10">Try again</button>
        </div>
      )}
    </Card>
  )
}

function GoNoGoTest() {
  const ROUNDS = 20
  const NOGO_RATIO = 0.25
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [round, setRound] = useState(0)
  const [stimulus, setStimulus] = useState<'go' | 'nogo' | null>(null)
  const [results, setResults] = useState<{ type: 'go' | 'nogo'; correct: boolean; rtMs: number | null }[]>([])
  const shownAtRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)
  const respondedRef = useRef(false)

  function clearTimer() { if (timeoutRef.current) { window.clearTimeout(timeoutRef.current); timeoutRef.current = null } }

  function nextRound(r: number) {
    if (r >= ROUNDS) { setPhase('done'); setStimulus(null); return }
    respondedRef.current = false
    const isNoGo = Math.random() < NOGO_RATIO
    const delay = 400 + Math.random() * 800
    setStimulus(null)
    timeoutRef.current = window.setTimeout(() => {
      setStimulus(isNoGo ? 'nogo' : 'go')
      shownAtRef.current = performance.now()
      timeoutRef.current = window.setTimeout(() => {
        if (!respondedRef.current) {
          setResults((res) => [...res, { type: isNoGo ? 'nogo' : 'go', correct: isNoGo, rtMs: null }])
          setRound((rr) => { const nr = rr + 1; nextRound(nr); return nr })
        }
      }, 900)
    }, delay)
  }

  function start() {
    setResults([])
    setRound(0)
    setPhase('running')
    nextRound(0)
  }

  function respond() {
    if (phase !== 'running' || respondedRef.current || !stimulus) return
    respondedRef.current = true
    clearTimer()
    const rt = performance.now() - shownAtRef.current
    setResults((res) => [...res, { type: stimulus, correct: stimulus === 'go', rtMs: stimulus === 'go' ? rt : rt }])
    setStimulus(null)
    setRound((rr) => { const nr = rr + 1; nextRound(nr); return nr })
  }

  useEffect(() => () => clearTimer(), [])

  const goTrials = results.filter((r) => r.type === 'go')
  const nogoTrials = results.filter((r) => r.type === 'nogo')
  const goAccuracy = goTrials.length ? (goTrials.filter((r) => r.correct).length / goTrials.length) * 100 : 0
  const nogoAccuracy = nogoTrials.length ? (nogoTrials.filter((r) => r.correct).length / nogoTrials.length) * 100 : 0
  const avgRt = goTrials.filter((r) => r.rtMs != null).length
    ? goTrials.reduce((a, r) => a + (r.rtMs || 0), 0) / goTrials.filter((r) => r.rtMs != null).length
    : 0

  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">Tap on green "GO" circles. Do <b>not</b> tap on red "STOP" circles. Measures response inhibition — your ability to hold back an automatic response.</p>
      {phase === 'idle' && <button onClick={start} className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white">Start test ({ROUNDS} rounds)</button>}
      {phase === 'running' && (
        <div className="mt-4">
          <div className="text-[11px] font-bold text-neutral-400">Round {round + 1} / {ROUNDS}</div>
          <button
            onClick={respond}
            disabled={!stimulus}
            className={`mx-auto mt-3 h-32 w-32 rounded-full transition ${stimulus === 'go' ? 'bg-emerald-500' : stimulus === 'nogo' ? 'bg-red-500' : 'bg-neutral-200 dark:bg-white/10'}`}
          />
          <p className="mt-2 text-[11px] text-neutral-400">{stimulus === 'go' ? 'GO — tap now!' : stimulus === 'nogo' ? 'STOP — do not tap' : 'wait...'}</p>
        </div>
      )}
      {phase === 'done' && (
        <div className="mt-4 space-y-2 text-left">
          <div className="flex justify-between text-sm"><span className="text-neutral-500">Go accuracy (hit rate)</span><b>{goAccuracy.toFixed(0)}%</b></div>
          <div className="flex justify-between text-sm"><span className="text-neutral-500">No-Go accuracy (inhibition)</span><b>{nogoAccuracy.toFixed(0)}%</b></div>
          <div className="flex justify-between text-sm"><span className="text-neutral-500">Avg. reaction time (Go)</span><b>{avgRt ? `${Math.round(avgRt)} ms` : '—'}</b></div>
          <p className="text-[11px] text-neutral-400">Lower No-Go accuracy means more impulsive "false alarm" taps. A casual self-tracker, not a clinical inhibition assessment.</p>
          <button onClick={() => setPhase('idle')} className="mt-2 w-full rounded-xl bg-neutral-100 py-2 text-sm font-bold text-neutral-600 dark:bg-white/10">Try again</button>
        </div>
      )}
    </Card>
  )
}

const MEDITATION_KEY = 'pmd_meditation_streak_v1'
function MeditationStreak() {
  const [days, setDays] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(MEDITATION_KEY) || '[]') } catch { return [] } })
  useEffect(() => { try { localStorage.setItem(MEDITATION_KEY, JSON.stringify(days)) } catch { /* ignore */ } }, [days])
  const today = new Date().toISOString().slice(0, 10)
  const doneToday = days.includes(today)
  const streak = useMemo(() => {
    let s = 0
    for (let i = 0; ; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      if (days.includes(d.toISOString().slice(0, 10))) s++
      else break
    }
    return s
  }, [days])
  return (
    <Card className="!p-6 text-center">
      <div className="text-4xl font-black text-brand-dark">{streak} 🔥</div>
      <div className="text-[12px] text-neutral-500">day streak</div>
      <button
        onClick={() => setDays((d) => (doneToday ? d.filter((x) => x !== today) : [...d, today]))}
        className={`mt-4 w-full rounded-xl py-2.5 text-sm font-bold ${doneToday ? 'bg-brand/10 text-brand-dark' : 'bg-brand text-white'}`}
      >
        {doneToday ? '✓ Meditated today — tap to undo' : 'Mark today meditated'}
      </button>
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'puzzle', label: 'Brain Puzzle' },
  { id: 'memory', label: 'Memory Match' },
  { id: 'reaction', label: 'Reaction Time' },
  { id: 'word', label: 'Word of the Day' },
  { id: 'stress', label: 'Stress Inventory' },
  { id: 'detox', label: 'Digital Detox' },
  { id: 'meditation', label: 'Meditation Streak' },
  { id: 'stroop', label: 'Stroop Test' },
  { id: 'nback', label: 'Dual N-Back' },
  { id: 'pattern', label: 'Pattern Matrix' },
  { id: 'tapping', label: 'Finger Tapping' },
  { id: 'gonogo', label: 'Go/No-Go' },
]

export function MindToolkit() {
  const [tab, setTab] = useState<Tab>('puzzle')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Cognitive Longevity Toolkit" subtitle="Twelve small brain & stress tools in one place" />
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'puzzle' && <BrainPuzzle />}
      {tab === 'memory' && <MemoryMatch />}
      {tab === 'reaction' && <ReactionTime />}
      {tab === 'word' && <WordOfDay />}
      {tab === 'stress' && <StressInventory />}
      {tab === 'detox' && <DigitalDetox />}
      {tab === 'meditation' && <MeditationStreak />}
      {tab === 'stroop' && <StroopTest />}
      {tab === 'nback' && <DualNBack />}
      {tab === 'pattern' && <PatternMatrix />}
      {tab === 'tapping' && <FingerTappingTest />}
      {tab === 'gonogo' && <GoNoGoTest />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Casual brain games and self-tracking — engaging, not a clinical cognitive assessment. If you're
        concerned about memory or cognitive changes, talk to a clinician.
      </div>
    </div>
  )
}

export default MindToolkit
