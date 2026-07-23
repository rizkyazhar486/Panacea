import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconMoon } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Sleep Toolkit — five small, real sleep tools bundled into one page instead
// of five separate nav entries: a 90-minute sleep-cycle alarm estimator, a
// 20-minute nap countdown, a sleep-consistency score (std. deviation of your
// logged wake times), a dream journal, and a bedtime routine checklist.
// All pure client-side math/state, localStorage-persisted, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'cycles' | 'nap' | 'consistency' | 'dream' | 'bedtime'

function CycleAlarm() {
  const [mode, setMode] = useState<'bedtime' | 'now'>('now')
  const [bedtime, setBedtime] = useState('23:00')
  const fallAsleepMin = 15

  const wakeTimes = useMemo(() => {
    const base = mode === 'now' ? new Date() : (() => {
      const [h, m] = bedtime.split(':').map(Number)
      const d = new Date()
      d.setHours(h, m, 0, 0)
      if (d.getTime() < Date.now() - 3600000) d.setDate(d.getDate() + 1)
      return d
    })()
    const start = new Date(base.getTime() + fallAsleepMin * 60000)
    return [4, 5, 6].map((cycles) => new Date(start.getTime() + cycles * 90 * 60000))
  }, [mode, bedtime])

  return (
    <Card className="!p-5">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setMode('now')} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${mode === 'now' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Going to sleep now</button>
        <button onClick={() => setMode('bedtime')} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${mode === 'bedtime' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Pick a bedtime</button>
      </div>
      {mode === 'bedtime' && (
        <Field label="Bedtime">
          <input className={`${inputClass} mt-1`} type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
        </Field>
      )}
      <p className="mt-3 text-[12px] text-neutral-500">Assuming ~{fallAsleepMin} min to fall asleep, waking at the end of a 90-minute cycle (rather than mid-cycle) tends to feel less groggy:</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {wakeTimes.map((t, i) => (
          <div key={i} className="rounded-xl bg-brand/10 p-2 text-center">
            <div className="text-sm font-black text-brand-dark">{t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-[10px] text-neutral-500">{i + 4} cycles</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function NapTimer() {
  const [secondsLeft, setSecondsLeft] = useState(20 * 60)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? (setRunning(false), 0) : s - 1)), 1000)
    return () => clearInterval(t)
  }, [running])
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">A ~20-minute nap avoids deep sleep, so you wake without grogginess.</p>
      <div className="mt-3 text-5xl font-black tabular-nums text-brand-dark">{mm}:{ss}</div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => setRunning((r) => !r)} className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${running ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300' : 'bg-brand text-white'}`}>{running ? 'Pause' : 'Start nap'}</button>
        <button onClick={() => { setRunning(false); setSecondsLeft(20 * 60) }} className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-bold text-neutral-500 dark:bg-white/10">Reset</button>
      </div>
    </Card>
  )
}

const CONSISTENCY_KEY = 'pmd_sleep_consistency_v1'
function ConsistencyScore() {
  const [entries, setEntries] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(CONSISTENCY_KEY) || '[]') } catch { return [] }
  })
  const [time, setTime] = useState('07:00')
  useEffect(() => { try { localStorage.setItem(CONSISTENCY_KEY, JSON.stringify(entries)) } catch { /* ignore */ } }, [entries])

  const add = () => setEntries((e) => [...e.slice(-13), time])
  const minutesOf = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const stats = useMemo(() => {
    if (entries.length < 2) return null
    const mins = entries.map(minutesOf)
    const mean = mins.reduce((a, b) => a + b, 0) / mins.length
    const variance = mins.reduce((a, b) => a + (b - mean) ** 2, 0) / mins.length
    const sd = Math.sqrt(variance)
    return { sd: Math.round(sd), score: Math.max(0, Math.round(100 - sd)) }
  }, [entries])

  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Log your wake-up time each day — consistency (not just duration) is linked to better metabolic and mood outcomes.</p>
      <div className="mt-3 flex items-end gap-2">
        <Field label="Today's wake time">
          <input className={inputClass} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <button onClick={add} className="mb-0.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">Log</button>
      </div>
      {stats && (
        <div className="mt-3 rounded-xl bg-brand/10 p-3 text-center">
          <div className="text-2xl font-black text-brand-dark">{stats.score}/100</div>
          <div className="text-[11px] text-neutral-500">Consistency score · ±{stats.sd} min variation over last {entries.length} logs</div>
        </div>
      )}
      {entries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entries.map((t, i) => <Badge key={i} tone="neutral">{t}</Badge>)}
        </div>
      )}
    </Card>
  )
}

const DREAM_KEY = 'pmd_dream_journal_v1'
interface DreamEntry { t: number; text: string }
function DreamJournal() {
  const [entries, setEntries] = useState<DreamEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(DREAM_KEY) || '[]') } catch { return [] }
  })
  const [text, setText] = useState('')
  useEffect(() => { try { localStorage.setItem(DREAM_KEY, JSON.stringify(entries)) } catch { /* ignore */ } }, [entries])
  const save = () => { if (!text.trim()) return; setEntries((e) => [{ t: Date.now(), text: text.trim() }, ...e]); setText('') }
  return (
    <Card className="!p-5">
      <textarea className={`${inputClass} min-h-24`} placeholder="What do you remember?" value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={save} className="mt-2 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Save entry</button>
      <div className="mt-4 space-y-2">
        {entries.map((e) => (
          <div key={e.t} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
            <div className="text-[11px] font-bold text-neutral-400">{new Date(e.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-neutral-700 dark:text-neutral-300">{e.text}</p>
          </div>
        ))}
        {entries.length === 0 && <p className="text-center text-[12px] text-neutral-400">No entries yet.</p>}
      </div>
    </Card>
  )
}

const BEDTIME_STEPS = [
  { emoji: '💡', text: 'Dim the lights an hour before bed' },
  { emoji: '🧘', text: 'A few minutes of stretching or breathing' },
  { emoji: '📖', text: 'Read something calming (not your phone)' },
  { emoji: '❄️', text: 'Cool the room down (~18-20°C / 65-68°F)' },
]
const BEDTIME_KEY = 'pmd_bedtime_checklist_v1'
function BedtimeChecklist() {
  const today = new Date().toISOString().slice(0, 10)
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try { const s = JSON.parse(localStorage.getItem(BEDTIME_KEY) || '{}'); return s.day === today ? s.items : {} } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem(BEDTIME_KEY, JSON.stringify({ day: today, items: done })) } catch { /* ignore */ } }, [done, today])
  return (
    <Card className="!p-5">
      <div className="space-y-2">
        {BEDTIME_STEPS.map((s) => (
          <label key={s.text} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
            <input type="checkbox" checked={!!done[s.text]} onChange={(e) => setDone((d) => ({ ...d, [s.text]: e.target.checked }))} className="h-4 w-4 accent-brand" />
            <span className="text-lg">{s.emoji}</span>
            <span className={`text-[13px] font-semibold ${done[s.text] ? 'text-neutral-400 line-through' : 'text-ink dark:text-white'}`}>{s.text}</span>
          </label>
        ))}
      </div>
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'cycles', label: 'Cycle Alarm' },
  { id: 'nap', label: 'Nap Timer' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'dream', label: 'Dream Journal' },
  { id: 'bedtime', label: 'Bedtime Checklist' },
]

export function SleepToolkit() {
  const [tab, setTab] = useState<Tab>('cycles')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Sleep Toolkit" subtitle="Five small, real sleep tools in one place" />
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'cycles' && <CycleAlarm />}
      {tab === 'nap' && <NapTimer />}
      {tab === 'consistency' && <ConsistencyScore />}
      {tab === 'dream' && <DreamJournal />}
      {tab === 'bedtime' && <BedtimeChecklist />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational estimates based on general sleep-science heuristics (90-minute cycle length varies
        person to person) — not a substitute for a clinical sleep study if you have ongoing sleep problems.
      </div>
    </div>
  )
}

export default SleepToolkit
