import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { Card } from './ui'
import type { GpsActivity } from '../lib/types'

function BarChart({ data, color, unit }: { data: { label: string; value: number }[]; color: string; unit: string }) {
  if (data.length === 0) return <p className="text-[11px] text-neutral-500">No data yet.</p>
  const max = Math.max(...data.map((d) => d.value)) || 1
  return (
    <div className="flex items-end gap-1.5" style={{ height: 90 }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-bold text-neutral-500">{d.value}</span>
          <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(6, (d.value / max) * 64)}px`, background: color }} />
          <span className="truncate text-[10px] text-neutral-500">{d.label}</span>
        </div>
      ))}
      <span className="ml-1 self-end text-[10px] font-semibold text-neutral-300">{unit}</span>
    </div>
  )
}

function fmtDur(sec: number): string {
  const m = Math.round(sec / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

// Leaderboard and trends consume already-recorded GPS activities. Distance,
// duration and speed are derived from accepted route fixes. Calories are shown
// only for legacy/synced activities that actually provide a positive value;
// the browser GPS recorder never invents energy expenditure from distance.
export function GpsCompetition() {
  const { state } = useStore()
  const acts = state.gpsActivities
  const [sport, setSport] = useState<string>('all')

  const sportTypes = useMemo(() => {
    const map = new Map<string, { type: string; emoji: string; name: string }>()
    for (const a of acts) if (!map.has(a.sportType)) map.set(a.sportType, { type: a.sportType, emoji: a.emoji, name: a.sport })
    return [...map.values()]
  }, [acts])

  const filtered = sport === 'all' ? acts : acts.filter((a) => a.sportType === sport)

  const leaderboard = useMemo(() => {
    const by = new Map<string, { name: string; km: number; runs: number }>()
    for (const a of filtered) {
      const cur = by.get(a.email) ?? { name: a.name, km: 0, runs: 0 }
      cur.km += a.distKm; cur.runs += 1
      by.set(a.email, cur)
    }
    return [...by.values()].sort((x, y) => y.km - x.km)
  }, [filtered])

  const totalKm = filtered.reduce((s, a) => s + a.distKm, 0)
  const totalDur = filtered.reduce((s, a) => s + a.durSec, 0)
  const calorieActivities = filtered.filter((a) => Number.isFinite(a.kcal) && a.kcal > 0)
  const totalKcal = calorieActivities.reduce((s, a) => s + a.kcal, 0)
  const recent = [...filtered].slice(0, 8).reverse()
  const label = (a: GpsActivity) => new Date(a.at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  const medal = ['🥇', '🥈', '🥉']

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-black text-ink dark:text-white">🏆 GPS Activity History</div>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-dark">Recorded data</span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setSport('all')} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${sport === 'all' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>All</button>
        {sportTypes.map((s) => (
          <button key={s.type} onClick={() => setSport(s.type)} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${sport === s.type ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>
            {s.emoji} {s.name}
          </button>
        ))}
      </div>

      {acts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 p-5 text-center text-xs text-neutral-500 dark:border-white/10">
          No GPS activities yet. Open <b className="text-brand-dark">Training → GPS</b>, record a real route, and the derived distance, moving time, speed and splits will appear here.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-500 dark:border-white/10">No activities for this sport yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-neutral-50 p-2 dark:bg-white/5"><div className="text-sm font-black text-brand-dark">{totalKm.toFixed(1)}</div><div className="text-[10px] text-neutral-500">km · derived</div></div>
            <div className="rounded-xl bg-neutral-50 p-2 dark:bg-white/5"><div className="text-sm font-black text-indigo-600 dark:text-indigo-300">{fmtDur(totalDur)}</div><div className="text-[10px] text-neutral-500">moving time</div></div>
            {calorieActivities.length > 0 ? (
              <div className="rounded-xl bg-neutral-50 p-2 dark:bg-white/5"><div className="text-sm font-black text-amber-600 dark:text-amber-300">{Math.round(totalKcal)}</div><div className="text-[10px] text-neutral-500">kcal · sourced</div></div>
            ) : (
              <div className="rounded-xl bg-neutral-50 p-2 dark:bg-white/5"><div className="text-sm font-black text-neutral-700 dark:text-white">{filtered.length}</div><div className="text-[10px] text-neutral-500">sessions</div></div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold text-neutral-500">Leaderboard (distance)</div>
            {leaderboard.map((p, i) => (
              <div key={p.name + i} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-[11px] dark:bg-white/5">
                <span className="w-5 text-center">{medal[i] ?? `${i + 1}.`}</span>
                <span className="flex-1 truncate font-semibold text-neutral-700 dark:text-neutral-200">{p.name}</span>
                <span className="font-bold text-brand-dark">{p.km.toFixed(1)} km</span>
                <span className="text-neutral-500">· {p.runs}×</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-neutral-100 pt-3 dark:border-white/10">
            <div><div className="mb-1 text-[11px] font-bold text-neutral-500">📏 Distance per activity (km)</div><BarChart data={recent.map((a) => ({ label: label(a), value: a.distKm }))} color="#00BF63" unit="km" /></div>
            <div><div className="mb-1 text-[11px] font-bold text-neutral-500">⚡ Average moving speed (km/h)</div><BarChart data={recent.map((a) => ({ label: label(a), value: a.avgSpeedKmh }))} color="#3b82f6" unit="km/h" /></div>
            <div><div className="mb-1 text-[11px] font-bold text-neutral-500">⏱️ Moving time (minutes)</div><BarChart data={recent.map((a) => ({ label: label(a), value: Math.round(a.durSec / 60) }))} color="#8b5cf6" unit="min" /></div>
          </div>
        </>
      )}
    </Card>
  )
}
