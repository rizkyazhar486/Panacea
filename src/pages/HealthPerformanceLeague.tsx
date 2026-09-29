import { useEffect, useMemo, useState } from 'react'
import { Card, Badge } from '../components/ui'
import { getWorkouts } from '../lib/workoutStore'
import {
  RANK_TIERS,
  calculateSeasonalRank,
  daysUntilSeasonReset,
  type RankedHealthEvidence,
  type RankedMode,
  type RankedWorkoutEvidence,
} from '../lib/seasonalHealthSportRank'

const HEALTH_PROFILE_KEY = 'pmd_health_profile'

type StoredHealth = {
  recoveryPct?: number
  sleepH?: number
  updatedAt?: string
  history?: Array<{ date: string; recoveryPct?: number; sleepH?: number }>
}

function readHealthEvidence(): RankedHealthEvidence | undefined {
  try {
    const raw = localStorage.getItem(HEALTH_PROFILE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as StoredHealth
    return {
      recoveryPct: typeof parsed.recoveryPct === 'number' ? parsed.recoveryPct : undefined,
      sleepHours: typeof parsed.sleepH === 'number' ? parsed.sleepH : undefined,
      updatedAt: parsed.updatedAt,
      history: Array.isArray(parsed.history)
        ? parsed.history.map((x) => ({
            date: x.date,
            recoveryPct: typeof x.recoveryPct === 'number' ? x.recoveryPct : undefined,
            sleepH: typeof x.sleepH === 'number' ? x.sleepH : undefined,
          }))
        : [],
    }
  } catch {
    return undefined
  }
}

function readWorkoutEvidence(): RankedWorkoutEvidence[] {
  return getWorkouts().map((workout) => ({
    id: workout.id,
    startedAt: workout.mulai,
    durationMinutes: Math.max(0, (Number(workout.durasi) || 0) / 60),
    paceSecondsPerKm: typeof workout.paceSec === 'number' ? workout.paceSec : undefined,
    speedKmh: typeof workout.kecepatanKmh === 'number' ? workout.kecepatanKmh : undefined,
    rpe: typeof workout.rpe === 'number' ? workout.rpe : undefined,
  }))
}

const COMPONENT_META = [
  ['consistency', 'Consistency', 'Repeatable active days, capped so grinding extra sessions cannot dominate.'],
  ['activity', 'Activity', 'Weekly recorded workout duration referenced to the 150 min adult activity baseline; intensity equivalence is not assumed.'],
  ['recovery', 'Recovery', 'Recovery/sleep context protects planned rest instead of treating it as a loss.'],
  ['progression', 'Progression', 'Comparable pace/speed sessions across the season; trend matters more than one peak workout.'],
  ['evidence', 'Evidence', 'Source coverage and longitudinal depth. Weak evidence suppresses RP rather than inventing certainty.'],
] as const

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

function pct(value: number) {
  return Math.round(Math.max(0, Math.min(100, value)))
}

export function HealthPerformanceLeague() {
  const [mode, setMode] = useState<RankedMode>('health')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const refresh = () => setRevision((x) => x + 1)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const evidence = useMemo(() => ({
    workouts: readWorkoutEvidence(),
    health: readHealthEvidence(),
  }), [revision])

  const result = useMemo(
    () => calculateSeasonalRank(evidence, mode, new Date()),
    [evidence, mode],
  )

  const daysLeft = daysUntilSeasonReset(new Date())
  const tierLabel = result.division ? `${result.currentTier.label} ${result.division}` : result.currentTier.label

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-10">
      <section className="relative overflow-hidden rounded-[30px] border border-cyan-300/15 bg-[#030509] p-4 text-white shadow-[0_24px_90px_rgba(0,0,0,.42)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(34,211,238,.14),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(168,85,247,.13),transparent_30%),radial-gradient(circle_at_50%_120%,rgba(16,185,129,.14),transparent_42%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-200/65">
                Panacea Ranked Season · {result.season.id}
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-[-.035em] sm:text-3xl">Health & Performance League</h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-white/55 sm:text-sm">
                A 90-day competitive ladder built from your observed training, recovery and longitudinal data.
                Visible rank resets every three months; illness, injury and planned recovery are never treated as moral failure.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.045] px-3 py-2 text-right">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/45">Season reset</div>
              <div className="text-sm font-black">{daysLeft} days</div>
              <div className="text-[10px] text-white/45">{formatDate(result.season.resetAt)}</div>
            </div>
          </div>

          <div className="mt-5 inline-flex rounded-full border border-white/10 bg-black/30 p-1">
            {([
              ['health', 'Health Rank'],
              ['sport', 'Sport Rank'],
            ] as [RankedMode, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`min-h-9 rounded-full px-4 text-[11px] font-black transition ${
                  mode === value ? 'bg-white text-black' : 'text-white/55 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/35 p-5 text-center">
              <div className={`mx-auto grid h-28 w-28 place-items-center rounded-[30px] border border-white/15 bg-gradient-to-br ${result.currentTier.accent} text-5xl text-black shadow-[0_18px_50px_rgba(34,211,238,.18)]`}>
                <span className="drop-shadow">{result.currentTier.glyph}</span>
              </div>
              <div className="mt-4 text-[10px] font-black uppercase tracking-[.22em] text-white/40">Current rank</div>
              <div className="mt-1 text-2xl font-black tracking-[-.03em]">{tierLabel}</div>
              <div className="mt-1 text-xs font-bold text-cyan-200">{result.points.toLocaleString()} RP</div>
              <div className="mt-3">
                <Badge tone={result.evidenceLabel === 'strong' ? 'normal' : 'neutral'}>
                  {result.evidenceLabel} evidence
                </Badge>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[.035] p-4 sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.18em] text-white/40">Season performance score</div>
                  <div className="mt-1 text-4xl font-black tabular-nums">{result.score}<span className="text-base text-white/35">/100</span></div>
                </div>
                <div className="text-right text-[11px] text-white/45">
                  <div>{result.workoutCount} verified workouts</div>
                  <div>{result.eligibleWeeks} season weeks scored</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.12em] text-white/45">
                  <span>{result.currentTier.label}</span>
                  <span>{result.nextTier ? result.nextTier.label : 'Season cap'}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full border border-white/10 bg-black/45">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-300 to-violet-400 transition-all"
                    style={{ width: `${result.progressToNext}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-white/45">
                  {result.nextTier ? `${result.pointsToNext} RP to promotion` : 'Mythic Immortal reached for this season.'}
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-5">
                {COMPONENT_META.map(([key, label]) => {
                  const value = pct(result.components[key])
                  return (
                    <div key={key} className="rounded-2xl border border-white/[.07] bg-black/25 p-3">
                      <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/40">{label}</div>
                      <div className="mt-1 text-xl font-black">{value}</div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-white/75" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="!border-white/10 !bg-[#07090c] text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">Rank ladder</div>
            <h3 className="mt-1 text-lg font-black">Master → Mythic Immortal</h3>
          </div>
          <span className="text-[10px] font-bold text-white/40">Resets every 3 months</span>
        </div>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {RANK_TIERS.map((tier) => {
            const active = tier.id === result.currentTier.id
            const reached = result.points >= tier.minPoints
            return (
              <div
                key={tier.id}
                className={`min-w-[145px] flex-1 rounded-2xl border p-3 transition ${
                  active
                    ? 'border-cyan-300/45 bg-cyan-300/[.08]'
                    : reached
                      ? 'border-white/15 bg-white/[.045]'
                      : 'border-white/[.06] bg-white/[.02] opacity-55'
                }`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${tier.accent} font-black text-black`}>{tier.glyph}</div>
                <div className="mt-3 text-[12px] font-black">{tier.label}</div>
                <div className="mt-0.5 text-[10px] text-white/40">{tier.minPoints.toLocaleString()} RP</div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="!border-white/10 !bg-[#07090c] text-white">
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">Promotion objectives</div>
          <h3 className="mt-1 text-lg font-black">What raises your rank next</h3>
          <div className="mt-4 space-y-2">
            {result.promotionFocus.map((focus, index) => (
              <div key={focus} className="flex gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-[11px] font-black text-cyan-200">{index + 1}</span>
                <p className="text-[12px] leading-relaxed text-white/65">{focus}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.055] p-3 text-[11px] leading-relaxed text-emerald-100/75">
            Recovery protection: rest days, injury recovery and medically necessary activity modification do not create a punitive losing streak.
            The system caps activity credit and suppresses confidence when evidence is weak.
          </div>
        </Card>

        <Card className="!border-white/10 !bg-[#07090c] text-white">
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">Scoring model</div>
          <h3 className="mt-1 text-lg font-black">Competitive, but clinically sane</h3>
          <div className="mt-4 rounded-2xl border border-white/[.07] bg-black/35 p-3 font-mono text-[11px] leading-relaxed text-cyan-100/80">
            {mode === 'health'
              ? 'S = 0.30C + 0.25A + 0.25R + 0.10P + 0.10E'
              : 'S = 0.25C + 0.20A + 0.15R + 0.30P + 0.10E'}
            <br />
            RP = S × elapsed season weeks × 2.5 × evidence multiplier
          </div>
          <div className="mt-3 space-y-2">
            {COMPONENT_META.map(([key, label, description]) => (
              <div key={key} className="grid grid-cols-[88px_1fr] gap-3 text-[11px]">
                <span className="font-black text-white/70">{label}</span>
                <span className="leading-relaxed text-white/45">{description}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-white/35">
            Activity credit uses the WHO adult baseline of at least 150 minutes/week only as a reference point; imported workout duration is not automatically equivalent to moderate-intensity minutes.
            This is a gamification layer, not a diagnosis, prognosis, medical clearance or substitute for clinician/coach judgement.
          </p>
        </Card>
      </div>

      <Card className="!border-white/10 !bg-[#07090c] text-white">
        <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/40">Game systems preserved</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['90-day seasons', 'Quarterly hard reset of visible rank so each season becomes a new campaign.'],
            ['Hidden MMR ready', 'A separate soft-reset rating can later power fair matchmaking without contaminating health rank.'],
            ['Promotion divisions', 'Master through Mythic use V → I progression before the next major tier.'],
            ['Leaderboard-safe', 'Friends/global boards should only activate after opt-in identity, anti-cheat and source verification exist.'],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
              <div className="text-[12px] font-black">{title}</div>
              <div className="mt-1 text-[10px] leading-relaxed text-white/45">{copy}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default HealthPerformanceLeague
