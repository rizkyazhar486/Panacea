import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BodyExposureWidget } from '../dashboard/BodyExposureWidget'
import { getVitals } from '../../lib/healthVitals'
import { getWorkouts } from '../../lib/workoutStore'
import { getUsageCounts } from '../../lib/usage'
import { buildHumanPassport, nextPassportQuest, type PassportConstellation } from '../../lib/humanPassport'
import { IconSparkle, IconActivity, IconBook, IconShield, IconRun } from '../icons'

type ShareMode = 'identity' | 'activity'

function dateLabel(iso?: string) {
  if (!iso) return 'Not yet recorded'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? 'Recorded' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function constellationTone(item: PassportConstellation) {
  if (!item.unlocked) return 'border-white/8 bg-white/[.025] text-white/35'
  switch (item.id) {
    case 'move': return 'border-emerald-300/20 bg-emerald-300/[.07] text-emerald-200'
    case 'recover': return 'border-cyan-300/20 bg-cyan-300/[.07] text-cyan-200'
    case 'capacity': return 'border-amber-200/20 bg-amber-200/[.07] text-amber-100'
    case 'body': return 'border-rose-300/20 bg-rose-300/[.07] text-rose-200'
    case 'learn': return 'border-violet-300/20 bg-violet-300/[.07] text-violet-200'
    case 'prevent': return 'border-sky-300/20 bg-sky-300/[.07] text-sky-200'
  }
}

async function passportCoverBlob(
  name: string,
  unlocked: PassportConstellation[],
  sessions: number,
  distanceKm: number,
  activeMinutes: number,
  mode: ShareMode,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const bg = ctx.createLinearGradient(0, 0, 1080, 1350)
  bg.addColorStop(0, '#030914')
  bg.addColorStop(0.5, '#061914')
  bg.addColorStop(1, '#0b0712')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1080, 1350)

  const aurora = ctx.createRadialGradient(780, 160, 20, 780, 160, 620)
  aurora.addColorStop(0, 'rgba(0,191,99,.34)')
  aurora.addColorStop(.48, 'rgba(71,210,255,.12)')
  aurora.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = aurora
  ctx.fillRect(0, 0, 1080, 900)

  ctx.strokeStyle = 'rgba(240,214,138,.22)'
  ctx.lineWidth = 2
  for (let r = 170; r <= 440; r += 90) {
    ctx.beginPath()
    ctx.ellipse(790, 410, r, r * .42, -.2, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 50px Montserrat, system-ui, sans-serif'
  ctx.fillText('PanaceaMed', 92, 142)
  ctx.fillStyle = '#f0d68a'
  ctx.font = '800 23px Montserrat, system-ui, sans-serif'
  ctx.fillText('HUMAN PASSPORT', 92, 190)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 86px Montserrat, system-ui, sans-serif'
  ctx.fillText(name || 'My Human Story', 92, 340)
  ctx.fillStyle = 'rgba(255,255,255,.56)'
  ctx.font = '600 28px Montserrat, system-ui, sans-serif'
  ctx.fillText('A living record of movement, recovery, learning and prevention.', 92, 392)

  const positions = [
    [150, 570], [420, 520], [720, 570], [220, 790], [520, 820], [790, 760],
  ]
  unlocked.slice(0, 6).forEach((item, index) => {
    const [x, y] = positions[index]
    ctx.beginPath()
    ctx.fillStyle = 'rgba(99,245,166,.14)'
    ctx.arc(x, y, 66, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(99,245,166,.5)'
    ctx.stroke()
    ctx.fillStyle = '#63f5a6'
    ctx.font = '900 17px Montserrat, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(item.symbol, x, y + 6)
    ctx.fillStyle = 'rgba(255,255,255,.68)'
    ctx.font = '700 18px Montserrat, system-ui, sans-serif'
    ctx.fillText(item.label, x, y + 96)
  })
  ctx.textAlign = 'left'

  if (mode === 'activity') {
    ctx.fillStyle = 'rgba(255,255,255,.055)'
    ctx.beginPath()
    ctx.roundRect(92, 990, 896, 168, 30)
    ctx.fill()
    const metrics = [
      [`${sessions}`, 'SESSIONS'],
      [`${distanceKm.toFixed(1)} km`, 'DISTANCE'],
      [`${activeMinutes}`, 'ACTIVE MIN'],
    ]
    metrics.forEach(([value, label], index) => {
      const x = 145 + index * 294
      ctx.fillStyle = '#ffffff'
      ctx.font = '900 42px Montserrat, system-ui, sans-serif'
      ctx.fillText(value, x, 1065)
      ctx.fillStyle = 'rgba(255,255,255,.38)'
      ctx.font = '800 16px Montserrat, system-ui, sans-serif'
      ctx.fillText(label, x, 1100)
    })
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.48)'
    ctx.font = '700 24px Montserrat, system-ui, sans-serif'
    ctx.fillText(`${unlocked.length}/6 life constellations illuminated by real data`, 92, 1060)
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px Montserrat, system-ui, sans-serif'
  ctx.fillText('panaceamed.id', 92, 1240)
  ctx.fillStyle = '#63f5a6'
  ctx.fillRect(92, 1260, 214, 7)
  ctx.fillStyle = 'rgba(255,255,255,.28)'
  ctx.font = '600 17px Montserrat, system-ui, sans-serif'
  ctx.fillText('Privacy-safe cover · no diagnoses, medications, labs or raw vital signs', 92, 1304)

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', .94))
}

export function HumanPassportWidget({ name = '' }: { name?: string }) {
  const [version, setVersion] = useState(0)
  const [shareMode, setShareMode] = useState<ShareMode>('identity')
  const [shareStatus, setShareStatus] = useState('')
  const summary = useMemo(() => buildHumanPassport(getVitals(), getWorkouts(), getUsageCounts()), [version])
  const quest = nextPassportQuest(summary)

  useEffect(() => {
    const update = () => setVersion((value) => value + 1)
    window.addEventListener('panacea:health-updated', update)
    window.addEventListener('focus', update)
    return () => {
      window.removeEventListener('panacea:health-updated', update)
      window.removeEventListener('focus', update)
    }
  }, [])

  async function sharePassport() {
    const unlocked = summary.constellations.filter((item) => item.unlocked)
    const blob = await passportCoverBlob(name, unlocked, summary.sessions, summary.distanceKm, summary.activeMinutes, shareMode)
    if (!blob) {
      setShareStatus('Share card unavailable on this browser')
      return
    }
    const file = new File([blob], 'panacea-human-passport.png', { type: 'image/png' })
    const text = `My Panacea Human Passport: ${summary.unlockedCount}/6 life constellations are now anchored by real data. Build yours at PanaceaMed.`
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'My Panacea Human Passport', text, files: [file] })
        setShareStatus('Passport shared')
        return
      }
    } catch {
      // Fall back to exporting the PNG locally.
    }
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    setShareStatus('Passport cover exported')
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#050c13] text-white shadow-[0_28px_90px_rgba(0,0,0,.22)]">
      <div className="grid lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative min-h-[420px] border-b border-white/8 lg:border-b-0 lg:border-r">
          <BodyExposureWidget hero interactive showCta={false} className="h-full min-h-[420px] !rounded-none" />
          <div className="pointer-events-none absolute inset-x-5 bottom-5 z-30 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-[#f0d68a]">Living 3D health identity</div>
            <div className="mt-1 text-lg font-black">{summary.unlockedCount}/6 constellations illuminated</div>
            <p className="mt-1 text-[11px] leading-relaxed text-white/52">The body is reference anatomy. Your Passport layers only factual personal milestones around it—never pretending the mesh itself is your scan.</p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.19em] text-emerald-300"><IconSparkle size={14} /> Panacea Human Passport</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-.035em] sm:text-3xl">Your health history becomes a visual identity—not a score.</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/52 sm:text-sm">Movement, recovery, capacity, body composition, learning and prevention become chapters in one longitudinal human story. Missing chapters stay visibly missing instead of being filled with invented wellness numbers.</p>
            </div>
            <div className="rounded-2xl border border-[#f0d68a]/20 bg-[#f0d68a]/8 px-4 py-3 text-right">
              <div className="text-[9px] font-black uppercase tracking-wide text-[#f0d68a]/65">Since</div>
              <div className="mt-1 text-xs font-black text-[#f0d68a]">{dateLabel(summary.firstActivity)}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {summary.constellations.map((item) => (
              <article key={item.id} className={`rounded-2xl border p-3 ${constellationTone(item)}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[9px] font-black uppercase tracking-[.16em]">{item.symbol}</div>
                  <div className="text-[9px] font-bold opacity-60">{item.unlocked ? 'ILLUMINATED' : 'DORMANT'}</div>
                </div>
                <div className="mt-2 text-sm font-black text-white">{item.label}</div>
                <div className="mt-1 text-[11px] font-bold leading-snug text-white/68">{item.headline}</div>
                <p className="mt-2 text-[10px] leading-relaxed text-white/38">{item.detail}</p>
                {item.evidence.length > 0 && <div className="mt-2 text-[9px] leading-relaxed text-white/34">{item.evidence.slice(0, 2).join(' · ')}</div>}
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_.9fr]">
            <div className="rounded-2xl border border-emerald-300/12 bg-emerald-300/[.05] p-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-emerald-300"><IconRun size={14} /> Next quest</div>
              <div className="mt-2 text-sm font-black">{quest.title}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-white/50">{quest.detail}</p>
              <Link to={quest.to} className="mt-3 inline-flex rounded-full border border-emerald-300/20 px-3 py-2 text-[10px] font-black text-emerald-200">Continue story →</Link>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-[#f0d68a]"><IconShield size={14} /> Public cover privacy</div>
              <p className="mt-2 text-[10px] leading-relaxed text-white/40">Share only identity milestones, or add activity totals. Diagnoses, medications, labs and raw vital signs are excluded from both modes.</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setShareMode('identity')} className={`rounded-full px-3 py-2 text-[10px] font-black ${shareMode === 'identity' ? 'bg-white text-neutral-950' : 'border border-white/10 text-white/50'}`}>Identity only</button>
                <button onClick={() => setShareMode('activity')} className={`rounded-full px-3 py-2 text-[10px] font-black ${shareMode === 'activity' ? 'bg-white text-neutral-950' : 'border border-white/10 text-white/50'}`}>+ Activity</button>
              </div>
              <button onClick={sharePassport} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f0d68a] px-4 py-2.5 text-[10px] font-black text-[#171106]"><IconActivity size={14} /> Share Passport Cover</button>
              {shareStatus && <div className="mt-2 text-[9px] font-bold text-emerald-300">{shareStatus}</div>}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/[.035] p-3 text-center"><div className="text-xl font-black">{summary.sessions}</div><div className="mt-1 text-[8px] font-black uppercase tracking-wide text-white/30">sessions</div></div>
            <div className="rounded-2xl bg-white/[.035] p-3 text-center"><div className="text-xl font-black">{summary.distanceKm.toFixed(1)}</div><div className="mt-1 text-[8px] font-black uppercase tracking-wide text-white/30">km recorded</div></div>
            <div className="rounded-2xl bg-white/[.035] p-3 text-center"><div className="text-xl font-black">{summary.distinctLearningRoutes}</div><div className="mt-1 text-[8px] font-black uppercase tracking-wide text-white/30">learning spaces</div></div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[9px] leading-relaxed text-white/25"><IconBook size={12} /> The Passport is a longitudinal identity surface, not a health-risk, biological-age or longevity prediction.</div>
        </div>
      </div>
    </section>
  )
}
