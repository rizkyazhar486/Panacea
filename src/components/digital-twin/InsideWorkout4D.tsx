import { useEffect, useMemo, useState } from 'react'
import { Body3D, CT_WINDOWS, type AnatomyLayer, type MotionState } from '../Body3D'
import { IconActivity, IconHeart, IconShield, IconSparkle } from '../icons'
import { buildWorkout4DReplay, formatWorkoutClock, frameAt, type Workout4DProvenance } from '../../lib/workout4d'
import type { ImportedWorkout } from '../../lib/workoutImport'

interface Props {
  workouts: ImportedWorkout[]
  hrMax?: number
}

const LAYERS = new Set<AnatomyLayer['key']>(['muscular', 'cardiovascular', 'visceral'])

function provenanceTone(p: Workout4DProvenance) {
  if (p === 'measured') return 'border-emerald-300/25 bg-emerald-300/[.08] text-emerald-200'
  if (p === 'derived') return 'border-cyan-300/20 bg-cyan-300/[.07] text-cyan-200'
  return 'border-amber-200/20 bg-amber-200/[.06] text-amber-100'
}

function focusKeywords(focus: string, muscles: string[]) {
  if (focus === 'cardio') return ['heart', 'atrium', 'ventricle', 'aorta']
  if (focus === 'lungs') return ['lung', 'bronch', 'diaphragm']
  if (focus === 'muscle') return muscles
  if (focus === 'recovery') return ['heart', 'lung', 'diaphragm']
  return null
}

function activityLabel(workout: ImportedWorkout) {
  const d = new Date(workout.mulai)
  const date = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  return `${workout.nama}${date ? ` · ${date}` : ''}`
}

async function storyPoster(workout: ImportedWorkout, hr: number, duration: number, measuredHr: boolean): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const bg = ctx.createLinearGradient(0, 0, 1080, 1920)
  bg.addColorStop(0, '#020611')
  bg.addColorStop(.46, '#07170f')
  bg.addColorStop(1, '#130b08')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1080, 1920)

  const aurora = ctx.createRadialGradient(800, 300, 20, 800, 300, 720)
  aurora.addColorStop(0, 'rgba(0,191,99,.38)')
  aurora.addColorStop(.48, 'rgba(53,196,255,.12)')
  aurora.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = aurora
  ctx.fillRect(0, 0, 1080, 1200)

  ctx.strokeStyle = 'rgba(240,214,138,.26)'
  ctx.lineWidth = 2
  for (let r = 220; r <= 520; r += 100) {
    ctx.beginPath()
    ctx.ellipse(760, 650, r, r * .35, -.18, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 54px Montserrat, system-ui, sans-serif'
  ctx.fillText('PanaceaMed', 86, 138)
  ctx.fillStyle = '#f0d68a'
  ctx.font = '900 24px Montserrat, system-ui, sans-serif'
  ctx.fillText('INSIDE MY WORKOUT · 4D STORY', 86, 188)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 82px Montserrat, system-ui, sans-serif'
  const title = workout.nama.length > 22 ? `${workout.nama.slice(0, 22)}…` : workout.nama
  ctx.fillText(title, 86, 380)
  ctx.fillStyle = 'rgba(255,255,255,.52)'
  ctx.font = '700 28px Montserrat, system-ui, sans-serif'
  ctx.fillText('What happened inside my body while I trained.', 86, 432)

  const metrics = [
    [formatWorkoutClock(duration), 'DURATION'],
    [workout.jarakKm != null ? `${workout.jarakKm.toFixed(2)} km` : '—', 'DISTANCE'],
    [hr > 0 ? `${Math.round(hr)} bpm` : '—', measuredHr ? 'HEART RATE · MEASURED' : 'HEART RATE · DERIVED'],
  ]
  metrics.forEach(([value, label], index) => {
    const y = 700 + index * 190
    ctx.fillStyle = 'rgba(255,255,255,.055)'
    ctx.beginPath()
    ctx.roundRect(86, y - 78, 908, 150, 30)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 54px Montserrat, system-ui, sans-serif'
    ctx.fillText(value, 126, y - 6)
    ctx.fillStyle = 'rgba(255,255,255,.38)'
    ctx.font = '800 17px Montserrat, system-ui, sans-serif'
    ctx.fillText(label, 126, y + 34)
  })

  ctx.fillStyle = '#63f5a6'
  ctx.font = '900 27px Montserrat, system-ui, sans-serif'
  ctx.fillText('MEASURED → DERIVED → EDUCATIONAL', 86, 1390)
  ctx.fillStyle = 'rgba(255,255,255,.52)'
  ctx.font = '600 24px Montserrat, system-ui, sans-serif'
  ctx.fillText('Panacea labels what came from my device and what is physiology context.', 86, 1440)

  ctx.fillStyle = 'rgba(255,255,255,.06)'
  ctx.beginPath()
  ctx.roundRect(86, 1510, 908, 230, 34)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 38px Montserrat, system-ui, sans-serif'
  ctx.fillText('Replay inside the human body.', 126, 1590)
  ctx.fillStyle = 'rgba(255,255,255,.48)'
  ctx.font = '600 23px Montserrat, system-ui, sans-serif'
  ctx.fillText('Heart · lungs · muscle · fuel · recovery', 126, 1640)
  ctx.fillText('Reference anatomy — not a medical scan or diagnosis.', 126, 1685)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 34px Montserrat, system-ui, sans-serif'
  ctx.fillText('panaceamed.id', 86, 1830)
  ctx.fillStyle = '#63f5a6'
  ctx.fillRect(86, 1852, 230, 7)

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', .94))
}

function Metric({ label, value, suffix, provenance, detail }: {
  label: string
  value: string | number
  suffix?: string
  provenance: Workout4DProvenance
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">{label}</span>
        <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wide ${provenanceTone(provenance)}`}>{provenance}</span>
      </div>
      <div className="mt-2 text-xl font-black tabular-nums">{value}{suffix && <span className="ml-1 text-[10px] font-bold text-white/35">{suffix}</span>}</div>
      <p className="mt-1 text-[9px] leading-relaxed text-white/28">{detail}</p>
    </div>
  )
}

export function InsideWorkout4D({ workouts, hrMax }: Props) {
  const [selectedId, setSelectedId] = useState(workouts[0]?.id ?? '')
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [storyIndex, setStoryIndex] = useState(0)
  const [shareStatus, setShareStatus] = useState('')
  const [picked, setPicked] = useState('')

  const workout = workouts.find((w) => w.id === selectedId) ?? workouts[0]
  const replay = useMemo(() => workout ? buildWorkout4DReplay(workout, hrMax) : null, [workout, hrMax])
  const frame = useMemo(() => replay ? frameAt(replay, time) : null, [replay, time])

  useEffect(() => {
    setTime(0)
    setPlaying(false)
    setStoryIndex(0)
  }, [selectedId])

  useEffect(() => {
    if (!playing || !replay) return
    const id = window.setInterval(() => {
      setTime((current) => {
        const next = current + Math.max(1, replay.duration / 240)
        if (next >= replay.duration) {
          setPlaying(false)
          return replay.duration
        }
        return next
      })
    }, 80)
    return () => window.clearInterval(id)
  }, [playing, replay])

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => setStoryIndex((i) => (i + 1) % 6), 1800)
    return () => window.clearInterval(id)
  }, [playing])

  if (!workout || !replay || !frame) return null

  // Snapshot the narrowed values for asynchronous event handlers. TypeScript
  // correctly refuses to assume React state-derived values remain non-null
  // inside a later callback unless we capture them here.
  const activeWorkout = workout
  const activeReplay = replay
  const activeFrame = frame

  const focus = focusKeywords(frame.focus, frame.muscleKeywords)
  const motion: MotionState = {
    heartRate: Math.round(frame.heartRate.value),
    respRate: Math.round(frame.respiration.value),
    contractionRate: frame.focus === 'muscle' ? Math.max(18, Math.round(frame.heartRate.value / 2.2)) : 12,
    peristalsisRate: playing ? 3 : 6,
  }
  const storyScenes = [
    ['START', 'From stillness to movement', 'The first seconds recruit motor units before cardiorespiratory responses fully catch up.'],
    ['HEART', `${Math.round(frame.heartRate.value)} bpm`, frame.heartRate.provenance === 'measured' ? 'Driven by recorded workout heart-rate samples.' : 'Driven by a session-level estimate because a continuous trace is unavailable.'],
    ['LUNGS', `${Math.round(frame.respiration.value)} breaths/min`, 'Respiratory animation is derived physiology unless a respiratory sensor is connected.'],
    ['MUSCLE', 'Mechanical work → ATP demand', 'Active muscle context is selected from the workout type; it is anatomy education, not EMG.'],
    ['FUEL', `${Math.round(frame.carbohydrateShare.value)}% carbohydrate context`, 'Fuel contribution is an educational intensity-based model, not indirect calorimetry.'],
    ['FINISH', 'Recovery starts now', 'A future Astra pass can turn these exact scenes into a cinematic WebM while preserving the same provenance contract.'],
  ] as const

  async function shareStory() {
    const blob = await storyPoster(activeWorkout, activeFrame.heartRate.value, activeReplay.duration, activeReplay.hasMeasuredHr)
    if (!blob) {
      setShareStatus('Story export unavailable on this browser')
      return
    }
    const file = new File([blob], 'panacea-inside-my-workout.png', { type: 'image/png' })
    const text = `Inside my ${activeWorkout.nama}: a 4D physiology replay made with PanaceaMed. Measured signals stay separate from derived and educational physiology.`
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Inside My Workout · PanaceaMed', text, files: [file] })
        setShareStatus('4D Story shared')
        return
      }
    } catch {
      // Fall back to a local PNG export.
    }
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    setShareStatus('Vertical Story poster exported')
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-emerald-300/15 bg-[#030914] text-white shadow-[0_32px_100px_rgba(0,0,0,.28)]">
      <div className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-emerald-300"><IconSparkle size={14} /> Panacea signature experience</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">Inside My Workout · 4D</h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/50 sm:text-sm">Scrub through a real workout and watch the reference human body respond. Device measurements, derived signals and educational physiology are never blended into one fake certainty.</p>
          </div>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="max-w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-xs font-bold text-white outline-none">
            {workouts.slice(0, 30).map((w) => <option key={w.id} value={w.id} className="bg-slate-950">{activityLabel(w)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.15fr_.85fr]">
        <div className="relative min-h-[560px] border-b border-white/8 xl:border-b-0 xl:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,191,99,.10),transparent_38%),radial-gradient(circle_at_85%_65%,rgba(240,214,138,.08),transparent_34%)]" />
          <div className="relative h-[560px]">
            <Body3D
              layers={LAYERS}
              highlighted={[]}
              focusKeywords={focus}
              renderMode="anatomy"
              ctWindow={CT_WINDOWS[0]}
              slicePlane="none"
              slicePos={.5}
              motion={motion}
              unfold={frame.focus === 'whole' ? 0 : .08}
              dissect={frame.focus === 'whole' ? 1 : 2}
              onPick={(_raw, label) => setPicked(label)}
            />
          </div>

          <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
            <div className="text-[8px] font-black uppercase tracking-[.18em] text-[#f0d68a]">4D replay time</div>
            <div className="mt-1 text-2xl font-black tabular-nums">{formatWorkoutClock(time)}</div>
            <div className="mt-1 text-[10px] text-white/40">{Math.round(frame.progress * 100)}% of session</div>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-300">{frame.title}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-white/62">{frame.story}</p>
            {picked && <div className="mt-2 text-[9px] font-bold text-[#f0d68a]">Selected anatomy: {picked}</div>}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2">
            <Metric label={frame.heartRate.label} value={Math.round(frame.heartRate.value)} suffix="bpm" provenance={frame.heartRate.provenance} detail={frame.heartRate.detail} />
            <Metric label={frame.respiration.label} value={Math.round(frame.respiration.value)} suffix="/min" provenance={frame.respiration.provenance} detail={frame.respiration.detail} />
            <Metric label={frame.cardiacDemand.label} value={Math.round(frame.cardiacDemand.value)} suffix="relative" provenance={frame.cardiacDemand.provenance} detail={frame.cardiacDemand.detail} />
            <Metric label={frame.oxygenDemand.label} value={Math.round(frame.oxygenDemand.value)} suffix="relative" provenance={frame.oxygenDemand.provenance} detail={frame.oxygenDemand.detail} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">Intensity domain</div>
                <div className="mt-1 text-base font-black">{frame.intensity.value}</div>
              </div>
              <IconHeart size={22} className="text-emerald-300" />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300" style={{ width: `${Math.max(3, frame.progress * 100)}%` }} />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] text-white/35"><span>Educational fuel context</span><span>not calorimetry</span></div>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/8">
              <div className="h-full bg-amber-300" style={{ width: `${frame.carbohydrateShare.value}%` }} />
              <div className="h-full bg-emerald-300" style={{ width: `${frame.fatShare.value}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold"><span className="text-amber-200">Carbohydrate {Math.round(frame.carbohydrateShare.value)}%</span><span className="text-emerald-200">Fat {Math.round(frame.fatShare.value)}%</span></div>
          </div>

          <div className="mt-5">
            <input aria-label="Workout replay time" type="range" min={0} max={replay.duration} step={1} value={time} onChange={(e) => { setTime(Number(e.target.value)); setPlaying(false) }} className="w-full accent-emerald-400" />
            <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-white/30"><span>0:00</span><span>{formatWorkoutClock(replay.duration)}</span></div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => { if (time >= replay.duration) setTime(0); setPlaying((v) => !v) }} className="rounded-full bg-emerald-400 px-5 py-2.5 text-[11px] font-black text-emerald-950">{playing ? 'Pause replay' : '▶ Replay inside my body'}</button>
              <button onClick={() => { setTime(0); setPlaying(false) }} className="rounded-full border border-white/12 px-4 py-2.5 text-[11px] font-black text-white/60">Restart</button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid border-t border-white/8 lg:grid-cols-[1fr_.8fr]">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-[#f0d68a]"><IconActivity size={14} /> Panacea 4D Story</div>
          <div className="mt-3 min-h-[190px] rounded-[24px] border border-[#f0d68a]/15 bg-[radial-gradient(circle_at_80%_10%,rgba(240,214,138,.13),transparent_38%),rgba(255,255,255,.035)] p-5">
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-white/30">Scene {storyIndex + 1} / 6 · {storyScenes[storyIndex][0]}</div>
            <div className="mt-4 text-2xl font-black tracking-[-.03em]">{storyScenes[storyIndex][1]}</div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/50">{storyScenes[storyIndex][2]}</p>
            <div className="mt-5 flex gap-1.5">{storyScenes.map((_, i) => <button key={i} aria-label={`Story scene ${i + 1}`} onClick={() => setStoryIndex(i)} className={`h-1.5 rounded-full transition-all ${i === storyIndex ? 'w-8 bg-[#f0d68a]' : 'w-3 bg-white/15'}`} />)}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={shareStory} className="rounded-full bg-[#f0d68a] px-5 py-2.5 text-[11px] font-black text-[#171106]">Share vertical Story</button>
            {shareStatus && <span className="self-center text-[10px] font-bold text-emerald-300">{shareStatus}</span>}
          </div>
        </div>

        <div className="border-t border-white/8 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-emerald-300"><IconShield size={14} /> Provenance contract</div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/45">The viral layer must never turn educational animation into fake biometrics. Every visual signal belongs to one of three explicit classes.</p>
          <div className="mt-4 space-y-2">
            <div className={`rounded-2xl border p-3 ${provenanceTone('measured')}`}><div className="text-[9px] font-black uppercase">Measured</div><div className="mt-1 text-[10px] leading-relaxed text-white/55">{replay.measuredSignals.join(' · ')}</div></div>
            <div className={`rounded-2xl border p-3 ${provenanceTone('derived')}`}><div className="text-[9px] font-black uppercase">Derived</div><div className="mt-1 text-[10px] leading-relaxed text-white/55">{replay.derivedSignals.join(' · ')}</div></div>
            <div className={`rounded-2xl border p-3 ${provenanceTone('educational')}`}><div className="text-[9px] font-black uppercase">Educational</div><div className="mt-1 text-[10px] leading-relaxed text-white/55">{replay.educationalSignals.join(' · ')}</div></div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-3 text-[9px] leading-relaxed text-white/30">Reference anatomy only. This replay does not infer organ perfusion, lactate, substrate oxidation, oxygen consumption, injury, disease, or recovery status that was not actually measured.</div>
        </div>
      </div>
    </section>
  )
}
