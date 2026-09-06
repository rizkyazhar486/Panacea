import { useEffect, useMemo, useState } from 'react'
import { Body3D, CT_WINDOWS, type MotionState } from '../Body3D'
import { IconActivity, IconHeart, IconRun, IconShield, IconSparkle, IconTimer } from '../icons'
import type { ImportedWorkout } from '../../lib/workoutImport'
import { buildHumanReplay, compareReplayEpochs, type HumanReplayEpoch } from '../../lib/humanReplay'

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

async function replayPoster(epoch: HumanReplayEpoch, totalEpochs: number): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const bg = ctx.createLinearGradient(0, 0, 1080, 1350)
  bg.addColorStop(0, '#020711')
  bg.addColorStop(.5, '#061812')
  bg.addColorStop(1, '#120b12')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1080, 1350)

  const glow = ctx.createRadialGradient(780, 270, 30, 780, 270, 620)
  glow.addColorStop(0, 'rgba(0,191,99,.34)')
  glow.addColorStop(.48, 'rgba(79,213,255,.11)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 1080, 900)

  ctx.strokeStyle = 'rgba(240,214,138,.16)'
  ctx.lineWidth = 2
  for (let r = 150; r <= 440; r += 72) {
    ctx.beginPath()
    ctx.ellipse(790, 440, r, r * .38, -.12, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = '#fff'
  ctx.font = '900 50px Montserrat, system-ui, sans-serif'
  ctx.fillText('PanaceaMed', 84, 125)
  ctx.fillStyle = '#f0d68a'
  ctx.font = '900 20px Montserrat, system-ui, sans-serif'
  ctx.fillText('HUMAN REPLAY · MY LIFE IN MOTION', 84, 170)

  ctx.fillStyle = '#fff'
  ctx.font = '900 78px Montserrat, system-ui, sans-serif'
  ctx.fillText(epoch.label, 84, 350)
  ctx.fillStyle = 'rgba(255,255,255,.48)'
  ctx.font = '700 23px Montserrat, system-ui, sans-serif'
  ctx.fillText(`Chapter ${Math.max(1, epoch.cumulativeSessions)} activities deep · ${totalEpochs} recorded months`, 84, 400)

  const facts = [
    [`${epoch.sessions}`, 'sessions'],
    [`${Math.round(epoch.activeMinutes)}`, 'active minutes'],
    [`${formatNumber(epoch.distanceKm, 1)}`, 'km recorded'],
    [epoch.avgHr != null ? `${Math.round(epoch.avgHr)}` : '—', 'mean workout HR'],
  ]
  facts.forEach(([value, label], index) => {
    const x = 84 + (index % 2) * 450
    const y = 545 + Math.floor(index / 2) * 175
    ctx.fillStyle = 'rgba(255,255,255,.045)'
    ctx.beginPath()
    ctx.roundRect(x, y, 410, 135, 28)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '900 44px Montserrat, system-ui, sans-serif'
    ctx.fillText(value, x + 30, y + 58)
    ctx.fillStyle = 'rgba(255,255,255,.42)'
    ctx.font = '800 17px Montserrat, system-ui, sans-serif'
    ctx.fillText(label.toUpperCase(), x + 30, y + 96)
  })

  ctx.fillStyle = '#63f5a6'
  ctx.font = '900 27px Montserrat, system-ui, sans-serif'
  ctx.fillText(epoch.dominantArchetype ?? 'Recorded movement chapter', 84, 955)
  ctx.fillStyle = 'rgba(255,255,255,.40)'
  ctx.font = '600 19px Montserrat, system-ui, sans-serif'
  ctx.fillText('A longitudinal story from recorded workouts · not a biological-age or health score', 84, 1010)

  ctx.fillStyle = '#fff'
  ctx.font = '900 32px Montserrat, system-ui, sans-serif'
  ctx.fillText('panaceamed.id', 84, 1248)
  ctx.fillStyle = '#63f5a6'
  ctx.fillRect(84, 1270, 225, 7)

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', .94))
}

export function HumanReplay({ workouts, hrMax }: { workouts: ImportedWorkout[]; hrMax: number }) {
  const replay = useMemo(() => buildHumanReplay(workouts, hrMax), [workouts, hrMax])
  const [index, setIndex] = useState(Math.max(0, replay.epochs.length - 1))
  const [playing, setPlaying] = useState(false)
  const [shareStatus, setShareStatus] = useState('')

  useEffect(() => {
    setIndex(Math.max(0, replay.epochs.length - 1))
  }, [replay.epochs.length])

  useEffect(() => {
    if (!playing || replay.epochs.length < 2) return
    const id = window.setInterval(() => {
      setIndex((current) => {
        if (current >= replay.epochs.length - 1) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, 2200)
    return () => window.clearInterval(id)
  }, [playing, replay.epochs.length])

  const epoch = replay.epochs[index]
  if (!epoch) return null
  const previous = index > 0 ? replay.epochs[index - 1] : undefined
  const deltas = compareReplayEpochs(epoch, previous)
  const measuredHr = epoch.avgHr != null
  const motion: MotionState = {
    heartRate: Math.round(epoch.avgHr ?? 72),
    respRate: 14,
    contractionRate: 16,
    peristalsisRate: 6,
  }

  async function shareReplay() {
    const snapshot = epoch
    const blob = await replayPoster(snapshot, replay.epochs.length)
    if (!blob) {
      setShareStatus('Human Replay export unavailable on this browser')
      return
    }
    const file = new File([blob], 'panacea-human-replay.png', { type: 'image/png' })
    const text = `My ${snapshot.label} Human Replay on PanaceaMed — a privacy-aware timeline built from recorded movement, not a health or biological-age score.`
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'My Panacea Human Replay', text, files: [file] })
        setShareStatus('Human Replay shared')
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
    setShareStatus('Human Replay poster exported')
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#030914] text-white shadow-[0_34px_110px_rgba(0,0,0,.30)]">
      <header className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#f0d68a]"><IconTimer size={14} /> Panacea Human Replay</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">Scroll through the fourth dimension: your recorded life in motion.</h2>
            <p className="mt-2 text-xs leading-relaxed text-white/48 sm:text-sm">Each chapter is assembled from real workout timestamps, duration, distance and heart-rate data when present. The 3D body stays reference anatomy; it is not a claim that organs physically changed between months.</p>
          </div>
          <button onClick={shareReplay} className="inline-flex items-center gap-2 rounded-full bg-[#f0d68a] px-4 py-2.5 text-[10px] font-black text-[#171106]"><IconSparkle size={14} /> Share this chapter</button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative min-h-[500px] border-b border-white/8 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(0,191,99,.12),transparent_34%),radial-gradient(circle_at_85%_76%,rgba(240,214,138,.07),transparent_28%)]" />
          <div className="relative h-[500px]">
            <Body3D
              layers={new Set(['surface', 'skeletal', 'muscular', 'cardiovascular', 'visceral'])}
              highlighted={[]}
              focusKeywords={null}
              renderMode="anatomy"
              ctWindow={CT_WINDOWS[0]}
              slicePlane="none"
              slicePos={.5}
              motion={motion}
              unfold={.12}
              dissect={2}
              onPick={() => {}}
            />
          </div>
          <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/10 bg-black/48 p-4 backdrop-blur-xl">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-[#f0d68a]">Chapter {index + 1}/{replay.epochs.length}</div>
            <div className="mt-1 text-2xl font-black">{epoch.label}</div>
            <div className="mt-1 text-[10px] text-white/38">{measuredHr ? `Cardiac motion keyed to ${Math.round(epoch.avgHr!)} bpm monthly workout mean` : 'Cardiac motion uses a reference resting animation because HR data are absent'}</div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [epoch.sessions, 'sessions'],
              [Math.round(epoch.activeMinutes), 'active min'],
              [formatNumber(epoch.distanceKm, 1), 'km'],
              [epoch.measuredHrSessions, 'HR sessions'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/[.03] p-3 text-center">
                <div className="text-xl font-black tabular-nums">{value}</div>
                <div className="mt-1 text-[8px] font-black uppercase tracking-wide text-white/28">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-300/12 bg-emerald-300/[.045] p-4">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-emerald-200"><IconRun size={13} /> Movement chapter</div>
            <div className="mt-2 text-base font-black">{epoch.dominantArchetype ?? 'Recorded activity chapter'}</div>
            <div className="mt-2 text-[10px] leading-relaxed text-white/38">Cumulative: {epoch.cumulativeSessions} sessions · {Math.round(epoch.cumulativeMinutes)} active minutes · {formatNumber(epoch.cumulativeDistanceKm, 1)} km recorded.</div>
          </div>

          {previous && (
            <div className="mt-3 rounded-2xl border border-cyan-300/12 bg-cyan-300/[.04] p-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-cyan-200"><IconActivity size={13} /> Versus previous recorded month</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {deltas.map((item) => (
                  <div key={item.label} className="rounded-xl bg-black/15 p-2.5 text-center">
                    <div className={`text-sm font-black ${item.delta > 0 ? 'text-emerald-300' : item.delta < 0 ? 'text-amber-200' : 'text-white/55'}`}>{item.delta > 0 ? '+' : ''}{item.delta}{item.unit ? ` ${item.unit}` : ''}</div>
                    <div className="mt-1 text-[8px] uppercase tracking-wide text-white/28">{item.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-white/30">A positive delta only means “more recorded than the prior month.” It does not mean healthier or better.</p>
            </div>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">Time scrubber</span>
              <button onClick={() => { if (index >= replay.epochs.length - 1) setIndex(0); setPlaying((value) => !value) }} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-black text-white/60">{playing ? 'Pause replay' : 'Play my history'}</button>
            </div>
            <input aria-label="Human Replay month" type="range" min={0} max={Math.max(0, replay.epochs.length - 1)} value={index} onChange={(event) => { setPlaying(false); setIndex(Number(event.target.value)) }} className="mt-3 w-full accent-emerald-400" />
            <div className="mt-1 flex justify-between text-[8px] text-white/24"><span>{replay.epochs[0]?.label}</span><span>{replay.epochs[replay.epochs.length - 1]?.label}</span></div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#f0d68a]/12 bg-[#f0d68a]/[.04] p-4">
            <IconShield size={17} className="mt-0.5 shrink-0 text-[#f0d68a]" />
            <p className="text-[10px] leading-relaxed text-white/40"><strong className="text-white/68">Boundary:</strong> Human Replay visualizes longitudinal records. It does not infer organ rejuvenation, biological age, disease risk or causal benefit from activity. Missing months remain missing rather than being interpolated.</p>
          </div>
          {shareStatus && <div className="mt-3 text-[9px] font-bold text-emerald-300">{shareStatus}</div>}
        </div>
      </div>
    </section>
  )
}
