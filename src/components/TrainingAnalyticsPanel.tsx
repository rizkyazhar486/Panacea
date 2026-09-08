import { useMemo } from 'react'
import { getWorkouts } from '../lib/workoutStore'
import { buildTrainingAnalytics } from '../lib/trainingAnalytics'
import { fmtPace } from '../lib/workoutImport'

interface Props {
  untukKemarin: boolean
  versi: number
}

function coveragePct(n: number, total: number): number {
  if (!(total > 0)) return 0
  return Math.max(0, Math.min(100, Math.round((n / total) * 100)))
}

export function TrainingAnalyticsPanel({ untukKemarin, versi }: Props) {
  const anchorKey = untukKemarin ? 'yesterday' : 'today'
  const analytics = useMemo(() => {
    const anchor = new Date()
    anchor.setHours(12, 0, 0, 0)
    if (untukKemarin) anchor.setDate(anchor.getDate() - 1)
    return buildTrainingAnalytics(getWorkouts(), anchor)
    // versi memaksa pembacaan ulang localStorage setelah manual save/import.
  }, [untukKemarin, versi])

  const { minggu, total28, blok28, paceAktivitas, hrrAktivitas } = analytics
  const maxKm = Math.max(1, ...blok28.map((b) => b.km))

  const pacePoints = paceAktivitas?.titik ?? []
  const paceValues = pacePoints.map((p) => p.paceSec)
  const paceMin = paceValues.length ? Math.min(...paceValues) : 0
  const paceMax = paceValues.length ? Math.max(...paceValues) : 0
  const paceRange = Math.max(1, paceMax - paceMin)
  const linePoints = pacePoints.map((p, i) => {
    const x = pacePoints.length <= 1 ? 50 : 4 + (i / (pacePoints.length - 1)) * 92
    // Pace lebih kecil = lebih cepat. Visual dibuat lebih tinggi untuk nilai yang lebih cepat.
    const y = 34 - ((paceMax - p.paceSec) / paceRange) * 28
    return { ...p, x, y }
  })

  const hrrPoints = hrrAktivitas?.titik ?? []
  const hrrValues = hrrPoints.map((p) => p.hrr1)
  const hrrMin = hrrValues.length ? Math.min(...hrrValues) : 0
  const hrrMax = hrrValues.length ? Math.max(...hrrValues) : 0
  const hrrRange = Math.max(1, hrrMax - hrrMin)
  const hrrLinePoints = hrrPoints.map((p, i) => {
    const x = hrrPoints.length <= 1 ? 50 : 4 + (i / (hrrPoints.length - 1)) * 92
    const y = 34 - ((p.hrr1 - hrrMin) / hrrRange) * 28
    return { ...p, x, y }
  })

  if (total28.sesi === 0) return null

  const coverage = [
    { label: 'Duration', n: total28.sesiDurasi },
    { label: 'Distance', n: total28.sesiJarak },
    { label: 'HR series', n: total28.sesiHr },
    { label: 'RPE', n: total28.sesiRpe },
    { label: 'Recovery HR', n: total28.sesiRecovery },
  ]

  return (
    <>
      <div className="mt-3 rounded-2xl border border-brand/15 bg-brand-50/35 p-3 dark:border-brand/20 dark:bg-brand/[0.03]" aria-label={`Automatic seven-day training summary ending ${anchorKey}`}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Automatic summary</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Last 7 recorded days</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black tabular-nums text-brand-dark">{minggu.sesi}</div>
            <div className="t-mikro text-neutral-500">sessions</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <div className="rounded-xl bg-white/80 p-2.5 dark:bg-white/5">
            <div className="text-[8px] font-black uppercase tracking-wide text-neutral-500">Time</div>
            <div className="mt-1 text-sm font-black tabular-nums text-ink dark:text-white">{minggu.menit} min</div>
          </div>
          <div className="rounded-xl bg-white/80 p-2.5 dark:bg-white/5">
            <div className="text-[8px] font-black uppercase tracking-wide text-neutral-500">Distance</div>
            <div className="mt-1 text-sm font-black tabular-nums text-ink dark:text-white">{minggu.km > 0 ? `${minggu.km.toFixed(1)} km` : '—'}</div>
          </div>
          <div className="rounded-xl bg-white/80 p-2.5 dark:bg-white/5">
            <div className="text-[8px] font-black uppercase tracking-wide text-neutral-500">Distance pace</div>
            <div className="mt-1 text-sm font-black tabular-nums text-ink dark:text-white">{minggu.paceSec ? `${fmtPace(minggu.paceSec)}/km` : '—'}</div>
          </div>
          <div className="rounded-xl bg-white/80 p-2.5 dark:bg-white/5">
            <div className="text-[8px] font-black uppercase tracking-wide text-neutral-500">Recorded kcal</div>
            <div className="mt-1 text-sm font-black tabular-nums text-ink dark:text-white">{minggu.kcal > 0 ? minggu.kcal : '—'}</div>
          </div>
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          Distance pace uses only sessions that contain both valid duration and distance. Non-distance sessions do not change it. Calories are shown only when a source recorded them; manual sessions do not invent calorie estimates.
        </p>
      </div>

      <div className="mt-3 rounded-2xl border border-neutral-100 p-3 dark:border-white/10" aria-label="Twenty-eight-day training data coverage">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Data coverage</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-white">What the last 28 days actually contain</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black tabular-nums text-sky-700 dark:text-sky-300">{total28.sesi}</div>
            <div className="t-mikro text-neutral-500">sessions</div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {coverage.map((item) => {
            const pct = coveragePct(item.n, total28.sesi)
            return (
              <div key={item.label} aria-label={`${item.label}: ${item.n} of ${total28.sesi} sessions`}>
                <div className="mb-1 flex items-center justify-between text-[9px]">
                  <span className="font-bold text-neutral-500">{item.label}</span>
                  <span className="font-black tabular-nums text-ink dark:text-white">{item.n}/{total28.sesi} · {pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/5">
                  <div className="h-full rounded-full bg-sky-500/75" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          Coverage describes which fields were actually captured. Missing HR, recovery, distance, or RPE stays missing; the app does not back-fill physiological data from another metric.
        </p>
      </div>

      {total28.km > 0 && (
        <div className="mt-3 rounded-2xl border border-emerald-100/80 p-3 dark:border-emerald-400/15" aria-label="Distance across four consecutive seven-day blocks">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Distance rhythm</div>
              <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Four × 7-day blocks</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black tabular-nums text-emerald-700 dark:text-emerald-300">{total28.km.toFixed(1)}<span className="ml-1 text-xs text-neutral-500">km</span></div>
              <div className="t-mikro text-neutral-500">recorded distance</div>
            </div>
          </div>
          <div className="mt-3 space-y-2.5">
            {blok28.map((blok) => (
              <div key={blok.label} aria-label={`${blok.label}: ${blok.km.toFixed(2)} kilometres across ${blok.sesiJarak} distance sessions`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-[10px]">
                  <span className="font-bold text-neutral-500">{blok.label}</span>
                  <span className="font-black tabular-nums text-ink dark:text-white">{blok.km.toFixed(1)} km · {blok.sesiJarak} distance sessions</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-emerald-50 dark:bg-emerald-400/10">
                  <div className="h-full rounded-full bg-emerald-500/75" style={{ width: blok.km > 0 ? `${Math.max(3, (blok.km / maxKm) * 100)}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Distance is summed only where a positive recorded distance exists. This chart does not compare running, walking, cycling, or other modalities as equivalent workload.
          </p>
        </div>
      )}

      {paceAktivitas && linePoints.length >= 2 && (
        <div className="mt-3 rounded-2xl border border-sky-100/80 p-3 dark:border-sky-400/15" aria-label={`Recorded pace trend for ${paceAktivitas.nama}`}>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Same-activity pace trend</div>
              <div className="mt-0.5 truncate text-sm font-black text-ink dark:text-white">{paceAktivitas.nama}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black tabular-nums text-sky-700 dark:text-sky-300">{linePoints.length}</div>
              <div className="t-mikro text-neutral-500">recent paced sessions</div>
            </div>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl bg-sky-50/60 p-2 dark:bg-sky-400/[0.04]">
            <svg viewBox="0 0 100 40" className="h-24 w-full text-sky-600 dark:text-sky-300" role="img" aria-label={`Pace series from ${fmtPace(pacePoints[0].paceSec)} to ${fmtPace(pacePoints[pacePoints.length - 1].paceSec)} minutes per kilometre`}>
              <polyline points={linePoints.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              {linePoints.map((p) => <circle key={p.id} cx={p.x} cy={p.y} r="1.8" fill="currentColor" />)}
            </svg>
            <div className="mt-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${linePoints.length}, minmax(0, 1fr))` }}>
              {linePoints.map((p) => (
                <div key={p.id} className="min-w-0 text-center">
                  <div className="truncate text-[8px] font-bold text-neutral-500">{p.label}</div>
                  <div className="truncate text-[8px] font-black tabular-nums text-ink dark:text-white">{fmtPace(p.paceSec)}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Lower min/km is plotted higher so faster recorded pace is visually upward. Only the exact normalized activity name is grouped; route, terrain, weather, duration, and session purpose can still differ, so this is a descriptive trend rather than a performance grade.
          </p>
        </div>
      )}

      {hrrAktivitas && hrrLinePoints.length >= 2 && (
        <div className="mt-3 rounded-2xl border border-indigo-100/80 p-3 dark:border-indigo-400/15" aria-label={`Recorded one-minute heart-rate recovery observations for ${hrrAktivitas.nama}`}>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Same-activity HRR1</div>
              <div className="mt-0.5 truncate text-sm font-black text-ink dark:text-white">{hrrAktivitas.nama}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black tabular-nums text-indigo-700 dark:text-indigo-300">{hrrLinePoints.length}</div>
              <div className="t-mikro text-neutral-500">validated observations</div>
            </div>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl bg-indigo-50/60 p-2 dark:bg-indigo-400/[0.04]">
            <svg viewBox="0 0 100 40" className="h-24 w-full text-indigo-600 dark:text-indigo-300" role="img" aria-label={`Recorded one-minute heart-rate recovery values from ${hrrPoints[0].hrr1} to ${hrrPoints[hrrPoints.length - 1].hrr1} beats per minute`}>
              <polyline points={hrrLinePoints.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              {hrrLinePoints.map((p) => <circle key={p.id} cx={p.x} cy={p.y} r="1.8" fill="currentColor" />)}
            </svg>
            <div className="mt-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${hrrLinePoints.length}, minmax(0, 1fr))` }}>
              {hrrLinePoints.map((p) => (
                <div key={p.id} className="min-w-0 text-center">
                  <div className="truncate text-[8px] font-bold text-neutral-500">{p.label}</div>
                  <div className="truncate text-[8px] font-black tabular-nums text-ink dark:text-white">−{p.hrr1} bpm</div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Only sessions with an actual recovery sample around 45–75 seconds are included. Posture and active versus passive cool-down can materially change HRR1, so these are recorded observations—not a fitness grade, diagnosis, or recovery score.
          </p>
        </div>
      )}
    </>
  )
}

export default TrainingAnalyticsPanel
