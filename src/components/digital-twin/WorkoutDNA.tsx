import { useMemo, useState } from 'react'
import { IconActivity, IconHeart, IconShield, IconSparkle } from '../icons'
import type { ImportedWorkout } from '../../lib/workoutImport'
import {
  buildWorkoutDnaLibrary,
  findClosestWorkoutDna,
  type WorkoutDnaSignature,
} from '../../lib/workoutDNA'

const AXIS_TONES: Record<string, string> = {
  endurance: 'from-cyan-300/70 to-cyan-300/15',
  intensity: 'from-rose-300/70 to-rose-300/15',
  variability: 'from-violet-300/70 to-violet-300/15',
  recovery: 'from-emerald-300/70 to-emerald-300/15',
  volume: 'from-amber-200/70 to-amber-200/15',
  data: 'from-sky-300/70 to-sky-300/15',
}

function formatDate(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'Recorded workout' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

async function dnaPoster(signature: WorkoutDnaSignature): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const bg = ctx.createLinearGradient(0, 0, 1080, 1350)
  bg.addColorStop(0, '#020712')
  bg.addColorStop(.52, '#061712')
  bg.addColorStop(1, '#110914')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1080, 1350)

  const aurora = ctx.createRadialGradient(820, 180, 20, 820, 180, 620)
  aurora.addColorStop(0, 'rgba(0,191,99,.30)')
  aurora.addColorStop(.5, 'rgba(77,212,255,.12)')
  aurora.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = aurora
  ctx.fillRect(0, 0, 1080, 780)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 50px Montserrat, system-ui, sans-serif'
  ctx.fillText('PanaceaMed', 86, 128)
  ctx.fillStyle = '#f0d68a'
  ctx.font = '900 21px Montserrat, system-ui, sans-serif'
  ctx.fillText('WORKOUT DNA · 4D PHYSIOLOGY FINGERPRINT', 86, 174)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 64px Montserrat, system-ui, sans-serif'
  const title = signature.name.length > 26 ? `${signature.name.slice(0, 26)}…` : signature.name
  ctx.fillText(title, 86, 310)
  ctx.fillStyle = 'rgba(255,255,255,.48)'
  ctx.font = '700 23px Montserrat, system-ui, sans-serif'
  ctx.fillText(`${formatDate(signature.startedAt)} · ${Math.round(signature.durationMin)} min${signature.distanceKm != null ? ` · ${signature.distanceKm.toFixed(2)} km` : ''}`, 86, 355)

  ctx.fillStyle = '#63f5a6'
  ctx.font = '900 30px Montserrat, system-ui, sans-serif'
  ctx.fillText(signature.archetype, 86, 430)

  signature.axes.forEach((axis, index) => {
    const y = 520 + index * 105
    ctx.fillStyle = 'rgba(255,255,255,.04)'
    ctx.beginPath()
    ctx.roundRect(86, y, 908, 68, 22)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.58)'
    ctx.font = '800 17px Montserrat, system-ui, sans-serif'
    ctx.fillText(axis.label.toUpperCase(), 110, y + 42)
    ctx.fillStyle = axis.provenance === 'unavailable' ? 'rgba(255,255,255,.14)' : '#63f5a6'
    ctx.beginPath()
    ctx.roundRect(330, y + 18, Math.max(8, (axis.value / 100) * 560), 30, 15)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 19px Montserrat, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(axis.provenance === 'unavailable' ? '—' : `${axis.value}`, 965, y + 42)
    ctx.textAlign = 'left'
  })

  ctx.fillStyle = 'rgba(255,255,255,.38)'
  ctx.font = '600 18px Montserrat, system-ui, sans-serif'
  ctx.fillText('Visual normalization for comparing your own sessions · not a health or fitness score', 86, 1185)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px Montserrat, system-ui, sans-serif'
  ctx.fillText('panaceamed.id', 86, 1260)
  ctx.fillStyle = '#63f5a6'
  ctx.fillRect(86, 1280, 225, 7)

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', .94))
}

export function WorkoutDNA({ workouts, hrMax }: { workouts: ImportedWorkout[]; hrMax: number }) {
  const library = useMemo(() => buildWorkoutDnaLibrary(workouts, hrMax), [workouts, hrMax])
  const [selectedId, setSelectedId] = useState(library[0]?.workoutId ?? '')
  const [shareStatus, setShareStatus] = useState('')
  const selected = library.find((item) => item.workoutId === selectedId) ?? library[0]
  const closest = selected ? findClosestWorkoutDna(selected, library) : null

  if (!selected) return null

  async function shareDna() {
    const snapshot = selected
    const blob = await dnaPoster(snapshot)
    if (!blob) {
      setShareStatus('Workout DNA export unavailable on this browser')
      return
    }
    const file = new File([blob], 'panacea-workout-dna.png', { type: 'image/png' })
    const text = `My ${snapshot.name} Workout DNA on PanaceaMed: a privacy-aware physiology fingerprint built from recorded session data and clearly labelled derived metrics.`
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'My Panacea Workout DNA', text, files: [file] })
        setShareStatus('Workout DNA shared')
        return
      }
    } catch {
      // Fall back to local export.
    }
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    setShareStatus('Workout DNA poster exported')
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#030914] text-white shadow-[0_30px_100px_rgba(0,0,0,.28)]">
      <header className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#f0d68a]"><IconSparkle size={14} /> Panacea Workout DNA</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">Every workout leaves a different physiological fingerprint.</h2>
            <p className="mt-2 text-xs leading-relaxed text-white/48 sm:text-sm">Workout DNA converts recorded session facts into a consistent visual language so your sessions can be compared over months and years. The axes are display normalizations, not health, longevity, readiness, or fitness scores.</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.055] px-4 py-3 text-right">
            <div className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Session library</div>
            <div className="mt-1 text-2xl font-black">{library.length}</div>
            <div className="text-[9px] text-white/30">fingerprints available</div>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[300px_1fr]">
        <aside className="max-h-[520px] overflow-y-auto border-b border-white/8 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 text-[9px] font-black uppercase tracking-[.17em] text-white/28">Choose a real workout</div>
          <div className="space-y-2">
            {library.map((item) => (
              <button key={item.workoutId} onClick={() => { setSelectedId(item.workoutId); setShareStatus('') }} className={`w-full rounded-2xl border p-3 text-left ${item.workoutId === selected.workoutId ? 'border-emerald-300/20 bg-emerald-300/[.07]' : 'border-white/8 bg-white/[.025]'}`}>
                <div className="text-xs font-black text-white/82">{item.name}</div>
                <div className="mt-1 text-[9px] text-white/30">{formatDate(item.startedAt)} · {Math.round(item.durationMin)} min{item.distanceKm != null ? ` · ${item.distanceKm.toFixed(1)} km` : ''}</div>
                <div className="mt-2 text-[9px] font-bold text-[#f0d68a]/70">{item.archetype}</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.17em] text-white/28">Current fingerprint</div>
              <div className="mt-1 text-xl font-black">{selected.name}</div>
              <div className="mt-1 text-[11px] font-bold text-emerald-300">{selected.archetype}</div>
            </div>
            <button onClick={shareDna} className="inline-flex items-center gap-2 rounded-full bg-[#f0d68a] px-4 py-2.5 text-[10px] font-black text-[#171106]"><IconActivity size={14} /> Share Workout DNA</button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {selected.axes.map((axis) => (
              <article key={axis.id} className="rounded-2xl border border-white/8 bg-white/[.025] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/55">{axis.label}</div>
                  <div className="text-lg font-black">{axis.provenance === 'unavailable' ? '—' : axis.value}</div>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/[.05]">
                  <div className={`h-full rounded-full bg-gradient-to-r ${AXIS_TONES[axis.id] ?? 'from-emerald-300/70 to-emerald-300/15'}`} style={{ width: `${axis.provenance === 'unavailable' ? 0 : axis.value}%` }} />
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-white/35">{axis.meaning}</p>
                <div className={`mt-2 text-[8px] font-black uppercase tracking-wide ${axis.provenance === 'unavailable' ? 'text-white/20' : axis.provenance === 'measured' ? 'text-cyan-300' : 'text-emerald-300'}`}>{axis.provenance}</div>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-cyan-300/12 bg-cyan-300/[.045] p-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-cyan-200"><IconHeart size={13} /> Recorded facts</div>
              <div className="mt-3 flex flex-wrap gap-1.5">{selected.measuredFacts.length ? selected.measuredFacts.map((item) => <span key={item} className="rounded-full border border-cyan-200/10 px-2.5 py-1 text-[9px] text-white/46">{item}</span>) : <span className="text-[10px] text-white/35">Only basic workout timing is available.</span>}</div>
              {(selected.zoneEasyPct != null || selected.zoneHardPct != null) && <div className="mt-3 text-[10px] leading-relaxed text-white/38">Measured HR trace: {selected.zoneEasyPct ?? 0}% in zones 1–2 · {selected.zoneHardPct ?? 0}% in zones 4–5.</div>}
            </article>

            <article className="rounded-2xl border border-violet-300/12 bg-violet-300/[.045] p-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-violet-200"><IconActivity size={13} /> Closest past fingerprint</div>
              {closest ? (
                <>
                  <div className="mt-2 text-sm font-black">{closest.name}</div>
                  <div className="mt-1 text-[10px] text-white/38">{formatDate(closest.startedAt)} · {closest.archetype}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-white/35">Similarity is calculated only across axes available in both sessions. It is useful for finding comparable workouts, not declaring one workout better.</p>
                  <button onClick={() => setSelectedId(closest.workoutId)} className="mt-3 rounded-full border border-violet-200/15 px-3 py-2 text-[9px] font-black text-violet-100">Open closest session</button>
                </>
              ) : <p className="mt-2 text-[10px] leading-relaxed text-white/35">Add another workout to create your first longitudinal comparison.</p>}
            </article>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#f0d68a]/12 bg-[#f0d68a]/[.04] p-4">
            <IconShield size={17} className="mt-0.5 shrink-0 text-[#f0d68a]" />
            <p className="text-[10px] leading-relaxed text-white/40"><strong className="text-white/68">Scientific boundary:</strong> 0–100 axes are normalized graphics for comparing your own recorded sessions. They do not estimate biological age, cardiovascular disease risk, recovery readiness, injury risk, or longevity.</p>
          </div>
          {shareStatus && <div className="mt-3 text-[9px] font-bold text-emerald-300">{shareStatus}</div>}
        </div>
      </div>
    </section>
  )
}
