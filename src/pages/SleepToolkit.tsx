import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconMoon } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Sleep Toolkit — five small, real sleep tools bundled into one page instead
// of five separate nav entries: a 90-minute sleep-cycle alarm estimator, a
// 20-minute nap countdown, a sleep-consistency score (std. deviation of your
// logged wake times), a dream journal, and a bedtime routine checklist.
// All pure client-side math/state, localStorage-persisted, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'cycles' | 'nap' | 'consistency' | 'dream' | 'bedtime' | 'soundscape'

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

// Real Web Audio synthesis: binaural beats (two pure tones, one per ear,
// differing by the chosen beat frequency) and colored noise (white/pink/brown
// generated sample-by-sample). No pre-recorded audio files, no external API —
// framed as a relaxation aid, not a claim of any specific cognitive effect.
type NoiseColor = 'white' | 'pink' | 'brown'
const BEAT_PRESETS = [
  { label: 'Delta (deep sleep) — 2 Hz', hz: 2 },
  { label: 'Theta (relaxation) — 6 Hz', hz: 6 },
  { label: 'Alpha (calm focus) — 10 Hz', hz: 10 },
]

function SoundscapeGenerator() {
  const [playing, setPlaying] = useState(false)
  const [mode, setMode] = useState<'binaural' | 'noise'>('binaural')
  const [beatHz, setBeatHz] = useState(6)
  const [baseHz, setBaseHz] = useState(200)
  const [noiseColor, setNoiseColor] = useState<NoiseColor>('pink')
  const [volume, setVolume] = useState(0.15)
  const [minutes, setMinutes] = useState(10)
  const [remainingSec, setRemainingSec] = useState<number | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{ stop: () => void } | null>(null)
  const timerRef = useRef<number | null>(null)

  function clearTimer() { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null } }

  function stop() {
    nodesRef.current?.stop()
    nodesRef.current = null
    clearTimer()
    setRemainingSec(null)
    setPlaying(false)
  }

  function start() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = ctxRef.current ?? new AC()
    ctxRef.current = ctx
    if (ctx.state === 'suspended') ctx.resume()

    const master = ctx.createGain()
    master.gain.value = volume
    master.connect(ctx.destination)

    let stopFn: () => void

    if (mode === 'binaural') {
      const left = ctx.createOscillator()
      const right = ctx.createOscillator()
      left.frequency.value = baseHz
      right.frequency.value = baseHz + beatHz
      const leftPan = ctx.createStereoPanner(); leftPan.pan.value = -1
      const rightPan = ctx.createStereoPanner(); rightPan.pan.value = 1
      left.connect(leftPan).connect(master)
      right.connect(rightPan).connect(master)
      left.start(); right.start()
      stopFn = () => { left.stop(); right.stop() }
    } else {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      if (noiseColor === 'white') {
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      } else if (noiseColor === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          b0 = 0.99886 * b0 + white * 0.0555179
          b1 = 0.99332 * b1 + white * 0.0750759
          b2 = 0.96900 * b2 + white * 0.1538520
          b3 = 0.86650 * b3 + white * 0.3104856
          b4 = 0.55000 * b4 + white * 0.5329522
          b5 = -0.7616 * b5 - white * 0.0168980
          const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
          b6 = white * 0.115926
          data[i] = pink * 0.11
        }
      } else {
        let last = 0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          last = (last + 0.02 * white) / 1.02
          data[i] = last * 3.5
        }
      }
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      src.connect(master)
      src.start()
      stopFn = () => src.stop()
    }

    nodesRef.current = { stop: () => { stopFn(); master.disconnect() } }
    setPlaying(true)

    if (minutes > 0) {
      let sec = minutes * 60
      setRemainingSec(sec)
      clearTimer()
      timerRef.current = window.setInterval(() => {
        sec -= 1
        setRemainingSec(sec)
        if (sec <= 0) stop()
      }, 1000)
    }
  }

  useEffect(() => () => { nodesRef.current?.stop(); clearTimer() }, [])

  return (
    <Card className="!p-6">
      <p className="text-[13px] text-neutral-500">Real generated audio (Web Audio API) — binaural tones or colored noise for winding down. A relaxation aid, not a proven treatment for any sleep disorder. Headphones recommended for binaural beats to work (each ear needs a different tone).</p>

      <div className="mt-4 flex gap-2">
        <button onClick={() => setMode('binaural')} className={`flex-1 rounded-xl py-2 text-[12px] font-bold ${mode === 'binaural' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Binaural Beats</button>
        <button onClick={() => setMode('noise')} className={`flex-1 rounded-xl py-2 text-[12px] font-bold ${mode === 'noise' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Colored Noise</button>
      </div>

      {mode === 'binaural' && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {BEAT_PRESETS.map((p) => (
              <button key={p.hz} onClick={() => setBeatHz(p.hz)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${beatHz === p.hz ? 'bg-brand-dark text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{p.label}</button>
            ))}
          </div>
          <label className="block text-[11px] font-bold text-neutral-500">Base tone: {baseHz} Hz
            <input className="mt-1 w-full accent-brand" type="range" min={100} max={400} value={baseHz} onChange={(e) => setBaseHz(Number(e.target.value))} disabled={playing} />
          </label>
        </div>
      )}

      {mode === 'noise' && (
        <div className="mt-4 flex gap-2">
          {(['white', 'pink', 'brown'] as NoiseColor[]).map((c) => (
            <button key={c} onClick={() => setNoiseColor(c)} disabled={playing} className={`flex-1 rounded-xl py-2 text-[12px] font-bold capitalize ${noiseColor === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{c}</button>
          ))}
        </div>
      )}

      <label className="mt-4 block text-[11px] font-bold text-neutral-500">Volume: {Math.round(volume * 100)}%
        <input className="mt-1 w-full accent-brand" type="range" min={0} max={0.5} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
      </label>
      <label className="mt-3 block text-[11px] font-bold text-neutral-500">Auto-stop after: {minutes === 0 ? 'never' : `${minutes} min`}
        <input className="mt-1 w-full accent-brand" type="range" min={0} max={60} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} disabled={playing} />
      </label>

      {!playing ? (
        <button onClick={start} className="mt-5 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white">▶ Play</button>
      ) : (
        <button onClick={stop} className="mt-5 w-full rounded-xl bg-neutral-800 py-3 text-sm font-bold text-white dark:bg-white/20">
          ■ Stop{remainingSec != null ? ` — ${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, '0')} left` : ''}
        </button>
      )}
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'cycles', label: 'Cycle Alarm' },
  { id: 'nap', label: 'Nap Timer' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'dream', label: 'Dream Journal' },
  { id: 'bedtime', label: 'Bedtime Checklist' },
  { id: 'soundscape', label: 'Soundscape' },
]

export function SleepToolkit() {
  const [tab, setTab] = useState<Tab>('cycles')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Sleep Toolkit" subtitle="Six small, real sleep tools in one place" />
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
      {tab === 'soundscape' && <SoundscapeGenerator />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational estimates based on general sleep-science heuristics (90-minute cycle length varies
        person to person) — not a substitute for a clinical sleep study if you have ongoing sleep problems.
      </div>
    </div>
  )
}

export default SleepToolkit
