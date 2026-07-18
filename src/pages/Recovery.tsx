import { useRef, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconMoon, IconLeaf, IconActivity } from '../components/icons'
import { VideoGallery } from '../components/VideoGallery'
import { getHealthCache, hasHealth } from '../lib/profile'

type RecoveryType = 'surgery' | 'injury' | 'illness' | 'overtraining'

interface RecoveryProfile { type: RecoveryType; startDate: string }

const KEY = 'pm_recovery_profile'
const def: RecoveryProfile = { type: 'injury', startDate: new Date().toISOString().slice(0, 10) }
function load(): RecoveryProfile {
  try { const d = JSON.parse(localStorage.getItem(KEY) || ''); return d.startDate ? d : def } catch { return def }
}
function save(p: RecoveryProfile) { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ } }

const TYPE_LABEL: Record<RecoveryType, string> = {
  surgery: 'Post-Surgery',
  injury: 'Injury (Muscle/Joint/Bone)',
  illness: 'Post-Illness (Infection/Fever)',
  overtraining: 'Overtraining / Excessive Fatigue',
}

interface Phase { label: string; days: [number, number]; guidance: string[] }

const PHASES: Record<RecoveryType, Phase[]> = {
  surgery: [
    { label: 'Acute (0-3 days)', days: [0, 3], guidance: ['Complete rest, elevate the surgical area', 'Follow the physician\'s analgesic instructions', 'Avoid physical activity and lifting', 'Ensure protein 1.2-1.5 g/kg body weight for tissue healing'] },
    { label: 'Subacute (4-14 days)', days: [4, 14], guidance: ['Gradual light mobilization as advised', 'Routine wound care, watch for signs of infection', 'Begin breathing exercises and passive ROM', 'Sleep 8-9 hours/night for regeneration'] },
    { label: 'Recovery (15-42 days)', days: [15, 42], guidance: ['Structured physiotherapy', 'Light strength training, avoid heavy loads', 'Re-evaluation with the surgeon', 'Gradually increase daily activity'] },
    { label: 'Advanced (>42 days)', days: [43, 9999], guidance: ['Gradual return to normal activity', 'Full strength and endurance training as tolerated', 'Monitor residual symptoms', 'Routine follow-up if any complaints arise'] },
  ],
  injury: [
    { label: 'Inflammation (0-3 days)', days: [0, 3], guidance: ['RICE: Rest, Ice, Compression, Elevation', 'Avoid heat and massage on the injured area', 'Avoid activities that worsen the pain', 'Anti-inflammatories as advised by a physician'] },
    { label: 'Proliferation (4-21 days)', days: [4, 21], guidance: ['Gentle mobilization and light stretching', 'Begin pain-free isometric exercises', 'Warm compresses may be started', 'Adequate protein for tissue repair'] },
    { label: 'Remodeling (22-90 days)', days: [22, 90], guidance: ['Progressive strengthening exercises', 'Proprioceptive and balance training', 'Gradual return to sport (return-to-play protocol)', 'Monitor pain as intensity escalates'] },
    { label: 'Maintenance (>90 days)', days: [91, 9999], guidance: ['Exercises to prevent re-injury', 'Maintain flexibility and strength of supporting muscles', 'Evaluate biomechanics/sport technique', 'Continue the routine strengthening program'] },
  ],
  illness: [
    { label: 'Acute (0-3 days)', days: [0, 3], guidance: ['Complete rest, hydration 2.5-3 L/day', 'Avoid exercise entirely (fever/acute condition)', 'Get plenty of sleep, 8+ hours', 'Easily digestible, nutritious foods'] },
    { label: 'Early Recovery (4-7 days)', days: [4, 7], guidance: ['Light activity once fever-free for 24 hours', 'Easy walking 10-15 minutes', 'Monitor resting heart rate', 'Avoid high intensity'] },
    { label: 'Graded Return (8-14 days)', days: [8, 14], guidance: ['Increase duration and intensity 10% per day', 'Watch for recurring symptoms (post-viral myocarditis risk)', 'Light-to-moderate aerobics', 'Consult a physician if there is shortness of breath or chest pain'] },
    { label: 'Normal (>14 days)', days: [15, 9999], guidance: ['Return to full exercise routine', 'Monitor endurance and daily energy', 'Maintain immunity with balanced sleep and nutrition'] },
  ],
  overtraining: [
    { label: 'Deload (0-7 days)', days: [0, 7], guidance: ['Stop all high-intensity training', 'Sleep 9+ hours/night', 'Massage/muscle relaxation, avoid added stress', 'Adequate calorie and protein intake, no deficit'] },
    { label: 'Light Activity (8-14 days)', days: [8, 14], guidance: ['Zone 1 (recovery) activity only', 'Daily mobility and stretching', 'Monitor morning HRV/resting heart rate', 'Evaluate overtraining triggers (volume/stress/sleep)'] },
    { label: 'Re-build (15-28 days)', days: [15, 28], guidance: ['Gradual training at 50-70% of previous volume', 'Prioritize sleep quality and recovery', 'Add a maximum of 10% volume/week', 'Avoid returning to full volume too quickly'] },
    { label: 'Normal (>28 days)', days: [29, 9999], guidance: ['Return to the full training program', 'Apply a routine deload every 4-6 weeks', 'Watch for early signs of the next overtraining'] },
  ],
}

function daysSince(dateStr: string) {
  const d = new Date(dateStr); const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000))
}

/* ══════════════════ SLEEP QUALITY SCORING ══════════════════ */
function clamp100(n: number) { return Math.max(0, Math.min(100, Math.round(n))) }

function sleepScore(hours: number, latencyMin: number, awakenings: number, bedtimeVarianceMin: number) {
  const duration = clamp100(hours >= 7 && hours <= 9 ? 100 : 100 - Math.abs(hours - 8) * 20)
  const latency = clamp100(latencyMin <= 15 ? 100 : 100 - (latencyMin - 15) * 2)
  const awakening = clamp100(100 - awakenings * 15)
  const consistency = clamp100(bedtimeVarianceMin <= 30 ? 100 : 100 - (bedtimeVarianceMin - 30) * 1.5)
  const total = clamp100(duration * 0.4 + latency * 0.2 + awakening * 0.2 + consistency * 0.2)
  return { total, duration, latency, awakening, consistency }
}

function SleepScoreCard() {
  const [hours, setHours] = useState(() => {
    const v = getHealthCache().sleepH
    return typeof v === 'number' && v > 0 ? v : 7
  })
  const sleepFromDevice = hasHealth('sleepH')
  const [latency, setLatency] = useState(15)
  const [awakenings, setAwakenings] = useState(0)
  const [variance, setVariance] = useState(20)

  const s = sleepScore(hours, latency, awakenings, variance)
  const grade = s.total >= 85 ? { l: 'Excellent', tone: 'normal' as const } : s.total >= 70 ? { l: 'Good', tone: 'normal' as const } : s.total >= 50 ? { l: 'Fair', tone: 'low' as const } : { l: 'Poor', tone: 'critical' as const }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconMoon size={20} />} title="Sleep Quality Score" subtitle="Physiological scoring based on duration, latency, awakenings & bedtime consistency" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label={sleepFromDevice ? 'Total Sleep (hours) — from your device' : 'Total Sleep (hours)'}><input className={inputClass} type="number" step="0.5" value={hours} onChange={(e) => setHours(+e.target.value)} /></Field>
        <Field label="Time to Fall Asleep (minutes)"><input className={inputClass} type="number" value={latency} onChange={(e) => setLatency(+e.target.value)} /></Field>
        <Field label="Number of Night Awakenings"><input className={inputClass} type="number" value={awakenings} onChange={(e) => setAwakenings(+e.target.value)} /></Field>
        <Field label="Bedtime Variability (minutes)"><input className={inputClass} type="number" value={variance} onChange={(e) => setVariance(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{s.total}<span className="text-sm font-semibold text-neutral-400">/100</span></div>
        <Badge tone={grade.tone}>{grade.l}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <div><div className="text-sm font-black text-ink">{s.duration}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Duration</div></div>
        <div><div className="text-sm font-black text-ink">{s.latency}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Latency</div></div>
        <div><div className="text-sm font-black text-ink">{s.awakening}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Awakenings</div></div>
        <div><div className="text-sm font-black text-ink">{s.consistency}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Consistency</div></div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Weighting: Duration 40% (optimal 7-9 hours) · Latency 20% (ideally ≤15 minutes to fall asleep) · Awakenings 20% (ideally 0) · Bedtime consistency 20% (ideally variance ≤30 minutes from usual) — this pattern reflects the core components of the Pittsburgh Sleep Quality Index (PSQI), simplified for daily self-monitoring.</p>
    </Card>
  )
}

/* ══════════════════ MEDITATION: GUIDED SCRIPTS + AMBIENT SOUND ══════════════════ */
interface MeditationScript { key: string; label: string; emoji: string; durationMin: number; steps: string[] }
const MEDITATION_SCRIPTS: MeditationScript[] = [
  { key: 'breathing478', label: '4-7-8 Breathing', emoji: '🌬️', durationMin: 5, steps: [
    'Sit or lie down comfortably, back upright but relaxed.',
    'Exhale fully through the mouth until the lungs are empty.',
    'Inhale through the nose, silently counting 1-2-3-4.',
    'Hold your breath, counting 1-2-3-4-5-6-7.',
    'Exhale fully through the mouth with a whoosh, counting 1-2-3-4-5-6-7-8.',
    'Repeat this cycle 4-8 times. If you feel dizzy, return to normal breathing briefly.',
  ] },
  { key: 'bodyscan', label: 'Body Scan', emoji: '🧘', durationMin: 10, steps: [
    'Lie supine, arms at your sides, eyes closed.',
    'Direct your attention to the tips of your toes — notice any sensation without judgment.',
    'Slowly move your attention upward: the soles of the feet, calves, knees, thighs.',
    'Continue to the pelvis, abdomen, chest — notice the rise and fall of the breath.',
    'Move to the hands, arms, shoulders, neck, then the face and head.',
    'Feel the whole body as one for the last few breaths.',
  ] },
  { key: 'metta', label: 'Loving-Kindness (Metta)', emoji: '💚', durationMin: 8, steps: [
    'Sit comfortably, eyes closed, breathing naturally.',
    'Silently say to yourself: "May I be happy, may I be healthy, may I be at peace."',
    'Picture someone you love — repeat the same wishes for them.',
    'Picture someone neutral (a casual acquaintance) — repeat the same wishes.',
    'If you are able, picture someone difficult for you — try to repeat the same wishes.',
    'Extend these wishes to all beings: "May all beings be happy and free from suffering."',
  ] },
]

// Self-contained ambient sound generator (Web Audio API) — no external
// service/API key needed, so it works fully offline and isn't dependent on
// a third-party music API that can't be verified reachable from every
// deployment environment.
type AmbientKind = 'rain' | 'ocean' | 'tone'
function useAmbientSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{ src?: AudioBufferSourceNode; gain?: GainNode; osc?: OscillatorNode; lfo?: OscillatorNode }>({})
  const [playing, setPlaying] = useState<AmbientKind | null>(null)

  function stop() {
    const n = nodesRef.current
    try { n.src?.stop(); n.osc?.stop(); n.lfo?.stop() } catch { /* already stopped */ }
    n.src?.disconnect(); n.gain?.disconnect(); n.osc?.disconnect(); n.lfo?.disconnect()
    nodesRef.current = {}
    setPlaying(null)
  }

  function play(kind: AmbientKind, volume: number) {
    stop()
    const ctx = ctxRef.current ?? new AudioContext()
    ctxRef.current = ctx
    const gain = ctx.createGain()
    gain.gain.value = volume
    gain.connect(ctx.destination)

    if (kind === 'tone') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'; osc.frequency.value = 136.1 // "Om" frequency, common calming reference tone
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 0.15; lfoGain.gain.value = 8
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency)
      osc.connect(gain); osc.start(); lfo.start()
      nodesRef.current = { osc, lfo, gain }
    } else {
      const bufferSize = ctx.sampleRate * 4
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      src.buffer = buffer; src.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = kind === 'rain' ? 1200 : 500
      src.connect(filter); filter.connect(gain)
      src.start()
      nodesRef.current = { src, gain }
    }
    setPlaying(kind)
  }

  function setVolume(v: number) { if (nodesRef.current.gain) nodesRef.current.gain.gain.value = v }

  return { playing, play, stop, setVolume }
}

function MeditationCard() {
  const [scriptKey, setScriptKey] = useState(MEDITATION_SCRIPTS[0].key)
  const [stepIdx, setStepIdx] = useState(0)
  const [volume, setVolume] = useState(0.15)
  const { playing, play, stop, setVolume: setAmbientVolume } = useAmbientSound()
  const script = MEDITATION_SCRIPTS.find((s) => s.key === scriptKey)!

  function changeVolume(v: number) { setVolume(v); setAmbientVolume(v) }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconLeaf size={20} />} title="Guided Meditation" subtitle="Guided scripts + ambient sound to calm the mind before sleep" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {MEDITATION_SCRIPTS.map((s) => (
          <button key={s.key} onClick={() => { setScriptKey(s.key); setStepIdx(0) }}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${scriptKey === s.key ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-neutral-100 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-neutral-400">Step {stepIdx + 1}/{script.steps.length} · ~{script.durationMin} minutes total</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink">{script.steps[stepIdx]}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={stepIdx === 0} className="flex-1 rounded-xl border border-neutral-200 py-2 text-xs font-bold text-neutral-600 disabled:opacity-40">← Previous</button>
          <button onClick={() => setStepIdx((i) => Math.min(script.steps.length - 1, i + 1))} disabled={stepIdx === script.steps.length - 1} className="flex-1 rounded-xl bg-brand py-2 text-xs font-bold text-white disabled:opacity-40">Next →</button>
        </div>
      </div>

      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Ambient Sound</h4>
      <div className="mt-2 flex gap-2">
        {([['rain', '🌧️ Rain'], ['ocean', '🌊 Ocean'], ['tone', '🎵 Calming Tone']] as const).map(([k, l]) => (
          <button key={k} onClick={() => (playing === k ? stop() : play(k, volume))}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${playing === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
            {playing === k ? '⏸ ' : ''}{l}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-neutral-400">Volume</span>
        <input type="range" min={0} max={0.5} step={0.01} value={volume} onChange={(e) => changeVolume(+e.target.value)} className="flex-1 accent-brand" />
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Ambient sound is generated directly on your device (Web Audio API) — it works fully offline, without relying on a third-party music service that may not always be reachable.</p>
    </Card>
  )
}

export function Recovery() {
  const [p, setP] = useState<RecoveryProfile>(load)
  const elapsed = daysSince(p.startDate)
  const phases = PHASES[p.type]
  const idx = phases.findIndex((ph) => elapsed >= ph.days[0] && elapsed <= ph.days[1])
  const current = phases[idx === -1 ? phases.length - 1 : idx]

  function upd(next: Partial<RecoveryProfile>) {
    const merged = { ...p, ...next }
    setP(merged)
    save(merged)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <VideoGallery
        icon={<IconLeaf size={20} />}
        title="Recovery Videos"
        subtitle="Gentle stretching & breathing exercises to speed up recovery"
        videos={[
          { label: 'Hamstring Stretch & Twist', cue: 'Hold 20-30 sec per side · deep breathing · no pain', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_072959_151332b7-0e3e-4388-b7f3-4775a65c9b9c.mp4' },
          { label: 'Breathing & Meditation', cue: 'Sit upright · 4-7-8 breathing · 10 minutes lowers stress and improves HRV', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_073011_31df726a-68e4-43bf-a5c6-7cbbb41c748e.mp4' },
        ]}
      />

      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Recovery Tracker" subtitle="Recovery-phase tracker & step-by-step guidance" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Recovery Type">
            <select className={inputClass} value={p.type} onChange={(e) => upd({ type: e.target.value as RecoveryType })}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Start Date">
            <input className={inputClass} type="date" value={p.startDate} onChange={(e) => upd({ startDate: e.target.value })} />
          </Field>
        </div>

        <div className="mt-4 rounded-2xl bg-ink p-4 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Day {elapsed} &middot; Current Phase</div>
          <div className="mt-1 text-2xl font-extrabold text-brand">{current.label}</div>
          <Badge tone="brand">{TYPE_LABEL[p.type]}</Badge>
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconLeaf size={20} />} title="Guidance for This Phase" subtitle="Recommendations based on days since you started" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          {current.guidance.map((g, i) => <li key={i}>• {g}</li>)}
        </ul>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Recovery Timeline" subtitle="All phases for this type" />
        <div className="mt-3 space-y-2">
          {phases.map((ph, i) => (
            <div key={ph.label} className={'flex items-center justify-between rounded-xl border p-3 ' + (i === (idx === -1 ? phases.length - 1 : idx) ? 'border-brand/40 bg-brand-50/40' : 'border-neutral-100')}>
              <div className="text-sm font-bold">{ph.label}</div>
              <div className="text-right text-xs font-semibold text-neutral-400">
                {ph.days[1] >= 9999 ? `>${ph.days[0]} days` : `${ph.days[0]}-${ph.days[1]} days`}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <SleepScoreCard />
      <MeditationCard />
    </div>
  )
}

export default Recovery
