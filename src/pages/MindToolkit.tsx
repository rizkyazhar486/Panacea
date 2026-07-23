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

type Tab = 'puzzle' | 'memory' | 'reaction' | 'word' | 'stress' | 'detox' | 'meditation'

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
]

export function MindToolkit() {
  const [tab, setTab] = useState<Tab>('puzzle')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Cognitive Longevity Toolkit" subtitle="Seven small brain & stress tools in one place" />
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

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Casual brain games and self-tracking — engaging, not a clinical cognitive assessment. If you're
        concerned about memory or cognitive changes, talk to a clinician.
      </div>
    </div>
  )
}

export default MindToolkit
