import { useEffect, useMemo, useState } from 'react'
import { IconSparkle, IconTimer, IconUsers } from '../icons'
import {
  getDailyDuel,
  getDuelById,
  localDayKey,
  readDuelProgress,
  recordCorrectDailyDuel,
  type ClinicalDuelCase,
  type DuelProgress,
} from '../../lib/clinicalDuel'

const CHALLENGE_SECONDS = 60

function challengeFromHash(): ClinicalDuelCase | null {
  if (typeof window === 'undefined') return null
  const query = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''
  return getDuelById(new URLSearchParams(query).get('duel'))
}

function challengeUrl(duel: ClinicalDuelCase): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/?duel=${encodeURIComponent(duel.id)}`
}

function proofCode(duel: ClinicalDuelCase, seconds: number) {
  return `PAN-${localDayKey().split('-').join('')}-${duel.id.slice(0, 6).toUpperCase()}-${String(seconds).padStart(2, '0')}`
}

async function createProofCard(
  duel: ClinicalDuelCase,
  correct: boolean,
  seconds: number,
  streak: number,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350)
  gradient.addColorStop(0, '#04140e')
  gradient.addColorStop(0.48, '#071b22')
  gradient.addColorStop(1, '#070b18')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, 1350)

  const glow = ctx.createRadialGradient(850, 180, 20, 850, 180, 560)
  glow.addColorStop(0, 'rgba(0,191,99,.34)')
  glow.addColorStop(1, 'rgba(0,191,99,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 1080, 900)

  ctx.strokeStyle = 'rgba(255,255,255,.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(64, 64, 952, 1222, 48)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 54px Montserrat, system-ui, sans-serif'
  ctx.fillText('PanaceaMed', 112, 156)
  ctx.fillStyle = '#63f5a6'
  ctx.font = '800 24px Montserrat, system-ui, sans-serif'
  ctx.fillText('DAILY CLINICAL DUEL', 112, 210)

  ctx.fillStyle = correct ? '#63f5a6' : '#fbbf24'
  ctx.font = '900 118px Montserrat, system-ui, sans-serif'
  ctx.fillText(correct ? 'SOLVED' : 'ATTEMPTED', 112, 382)

  ctx.fillStyle = 'rgba(255,255,255,.72)'
  ctx.font = '700 30px Montserrat, system-ui, sans-serif'
  ctx.fillText(`${duel.category} · ${duel.difficulty}`, 112, 450)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 76px Montserrat, system-ui, sans-serif'
  ctx.fillText(`${seconds}s`, 112, 590)
  ctx.fillStyle = 'rgba(255,255,255,.45)'
  ctx.font = '700 25px Montserrat, system-ui, sans-serif'
  ctx.fillText('TIME TO ANSWER', 112, 630)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 76px Montserrat, system-ui, sans-serif'
  ctx.fillText(`${streak}`, 490, 590)
  ctx.fillStyle = 'rgba(255,255,255,.45)'
  ctx.font = '700 25px Montserrat, system-ui, sans-serif'
  ctx.fillText('DAY STREAK', 490, 630)

  ctx.fillStyle = 'rgba(255,255,255,.06)'
  ctx.beginPath()
  ctx.roundRect(112, 720, 856, 260, 34)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 42px Montserrat, system-ui, sans-serif'
  ctx.fillText('Can you beat this?', 158, 800)
  ctx.fillStyle = 'rgba(255,255,255,.64)'
  ctx.font = '600 27px Montserrat, system-ui, sans-serif'
  ctx.fillText('Open the same spoiler-free case in PanaceaMed.', 158, 858)
  ctx.fillText('No patient data. No answer revealed.', 158, 906)

  ctx.fillStyle = '#63f5a6'
  ctx.font = '800 24px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillText(proofCode(duel, seconds), 112, 1110)
  ctx.fillStyle = 'rgba(255,255,255,.42)'
  ctx.font = '600 22px Montserrat, system-ui, sans-serif'
  ctx.fillText('PANACEA PROOF SIGNATURE', 112, 1150)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 34px Montserrat, system-ui, sans-serif'
  ctx.fillText('panaceamed.id', 112, 1232)
  ctx.fillStyle = '#63f5a6'
  ctx.fillRect(112, 1252, 210, 7)

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.94))
}

function secondsUsed(secondsLeft: number) {
  return Math.max(1, CHALLENGE_SECONDS - secondsLeft)
}

export function ClinicalDuel() {
  const sharedDuel = useMemo(() => challengeFromHash(), [])
  const dailyDuel = useMemo(() => getDailyDuel(), [])
  const duel = sharedDuel ?? dailyDuel
  const isDaily = duel.id === dailyDuel.id
  const [started, setStarted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(CHALLENGE_SECONDS)
  const [selected, setSelected] = useState<number | null>(null)
  const [resolved, setResolved] = useState(false)
  const [progress, setProgress] = useState<DuelProgress>(() => readDuelProgress())
  const [shareState, setShareState] = useState('')

  const correct = selected === duel.correctIndex
  const elapsed = secondsUsed(secondsLeft)

  useEffect(() => {
    if (!started || resolved) return
    if (secondsLeft <= 0) {
      setResolved(true)
      return
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [started, resolved, secondsLeft])

  function choose(index: number) {
    if (!started || resolved) return
    setSelected(index)
    setResolved(true)
    if (index === duel.correctIndex && isDaily) {
      setProgress(recordCorrectDailyDuel(secondsUsed(secondsLeft)))
    }
  }

  function reset() {
    setStarted(false)
    setSecondsLeft(CHALLENGE_SECONDS)
    setSelected(null)
    setResolved(false)
    setShareState('')
  }

  async function copyChallenge() {
    const url = challengeUrl(duel)
    const text = `Panacea Clinical Duel: ${duel.category}. Can you solve this 60-second case? ${url}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Panacea Clinical Duel', text, url })
        setShareState('Challenge shared')
        return
      }
      await navigator.clipboard.writeText(text)
      setShareState('Challenge link copied')
    } catch {
      try {
        await navigator.clipboard.writeText(text)
        setShareState('Challenge link copied')
      } catch {
        setShareState('Share unavailable on this browser')
      }
    }
  }

  async function shareProof() {
    if (!resolved) return
    const seconds = elapsed
    const blob = await createProofCard(duel, correct, seconds, progress.streak)
    const url = challengeUrl(duel)
    const text = `${correct ? 'Solved' : 'Attempted'} the Panacea Clinical Duel in ${seconds}s. Can you beat it? ${url}`
    if (!blob) {
      await copyChallenge()
      return
    }

    const file = new File([blob], `panacea-clinical-duel-${duel.id}.png`, { type: 'image/png' })
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Panacea Clinical Duel', text, url, files: [file] })
        setShareState('Proof card shared')
        return
      }
    } catch {
      // Fall through to a local PNG export without losing the challenge link.
    }

    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = file.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000)
    try { await navigator.clipboard.writeText(text) } catch { /* PNG export still succeeded */ }
    setShareState('Proof card exported; challenge text copied when permitted')
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-400/15 bg-[#07130f] text-white shadow-[0_24px_80px_rgba(0,0,0,.18)]">
      <div className="relative p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-emerald-300">
                <IconSparkle size={14} /> Panacea Clinical Duel
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">{sharedDuel ? 'A friend challenged you.' : 'One case. Sixty seconds. No spoilers.'}</h2>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/55 sm:text-sm">
                A product-led learning loop: solve a short educational case, then share a spoiler-free Panacea Proof Card or challenge link.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[.05] px-3 py-2 text-center">
                <div className="text-[9px] font-black uppercase tracking-wide text-white/35">Streak</div>
                <div className="mt-1 text-lg font-black text-emerald-300">{progress.streak}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.05] px-3 py-2 text-center">
                <div className="text-[9px] font-black uppercase tracking-wide text-white/35">Timer</div>
                <div className="mt-1 flex items-center gap-1 text-lg font-black"><IconTimer size={15} /> {secondsLeft}s</div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wide text-white/40">
              <span>{duel.category}</span><span>·</span><span>{duel.difficulty}</span><span>·</span><span>Educational only</span>
            </div>
            <h3 className="mt-2 text-base font-black sm:text-lg">{duel.title}</h3>

            {!started ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button onClick={() => setStarted(true)} className="rounded-full bg-emerald-400 px-5 py-2.5 text-xs font-black text-emerald-950 transition hover:bg-emerald-300">Start 60-second duel</button>
                <button onClick={copyChallenge} className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-black text-white/75 transition hover:bg-white/5"><span className="inline-flex items-center gap-1.5"><IconUsers size={14} /> Challenge a friend</span></button>
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm leading-relaxed text-white/75">{duel.stem}</p>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {duel.choices.map((choice, index) => {
                    const chosen = selected === index
                    const isCorrect = resolved && index === duel.correctIndex
                    const className = isCorrect
                      ? 'border-emerald-300/50 bg-emerald-300/12 text-emerald-100'
                      : chosen && resolved
                        ? 'border-amber-300/40 bg-amber-300/10 text-amber-100'
                        : 'border-white/10 bg-white/[.035] text-white/75 hover:bg-white/[.07]'
                    return (
                      <button key={choice.label} disabled={resolved} onClick={() => choose(index)} className={`rounded-2xl border p-3 text-left text-xs font-bold leading-relaxed transition ${className}`}>
                        <span className="mr-2 text-white/35">{String.fromCharCode(65 + index)}.</span>{choice.label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {resolved && (
            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_.72fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
                <div className={`text-xs font-black uppercase tracking-wide ${correct ? 'text-emerald-300' : 'text-amber-300'}`}>{correct ? `Solved in ${elapsed}s` : secondsLeft <= 0 ? 'Time expired' : 'Not this time'}</div>
                <p className="mt-2 text-xs leading-relaxed text-white/65">{duel.rationale}</p>
                <div className="mt-3 rounded-xl border border-emerald-300/10 bg-emerald-300/[.05] p-3 text-xs leading-relaxed text-emerald-100/80"><strong>Clinical pearl:</strong> {duel.pearl}</div>
                <p className="mt-3 text-[10px] leading-relaxed text-white/35">{duel.nextStep}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-300">Panacea Proof Card</div>
                <p className="mt-2 text-xs leading-relaxed text-white/55">The share image reveals your result, time and streak—but never the answer. The recipient opens this exact case inside PanaceaMed.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={shareProof} className="rounded-full bg-white px-4 py-2.5 text-xs font-black text-neutral-950">Share proof card</button>
                  <button onClick={copyChallenge} className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-black text-white/75">Challenge link</button>
                  <button onClick={reset} className="rounded-full border border-white/10 px-4 py-2.5 text-xs font-black text-white/45">Replay</button>
                </div>
                {shareState && <div className="mt-3 text-[10px] font-bold text-emerald-300">{shareState}</div>}
                <div className="mt-4 border-t border-white/10 pt-3 text-[9px] leading-relaxed text-white/30">No patient data is placed in the share payload. This is an educational growth feature, not a patient diagnostic tool.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
