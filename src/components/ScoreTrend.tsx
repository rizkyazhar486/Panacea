import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card } from './ui'

// Serial score tracking for severity scores that are meant to be TRENDED
// rather than read once (SOFA, NEWS2): save the currently-entered score with
// a timestamp, plot the series, and allow deleting mistaken entries.
// localStorage-persisted per score via `storageKey`.

interface Reading { t: number; total: number; note: string }

function load(key: string): Reading[] {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as Reading[]
  } catch { /* ignore */ }
  return []
}

export function ScoreTrend({ storageKey, scoreName, total, maxScore, detail }: {
  storageKey: string
  scoreName: string
  total: number
  maxScore: number
  detail: string // compact summary of the inputs behind this total, stored with the reading
}) {
  const [readings, setReadings] = useState<Reading[]>(() => load(storageKey))

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(readings)) } catch { /* ignore */ }
  }, [readings, storageKey])

  const save = () => setReadings((r) => [...r, { t: Date.now(), total, note: detail }].sort((a, b) => a.t - b.t))
  const remove = (t: number) => setReadings((r) => r.filter((x) => x.t !== t))

  const chartData = readings.map((r) => ({
    label: new Date(r.t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    total: r.total,
  }))

  const delta = readings.length >= 2 ? readings[readings.length - 1].total - readings[readings.length - 2].total : null

  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Trend — serial {scoreName}</div>
          <p className="mt-1 text-[12px] text-neutral-500">
            {scoreName} is designed to be trended: the direction of change carries as much information
            as any single value.
          </p>
        </div>
        <button onClick={save} className="shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">
          Save reading ({total})
        </button>
      </div>

      {readings.length === 0 && (
        <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2.5 text-center text-[12px] text-neutral-400 dark:bg-white/5">
          No saved readings yet — enter the current values above and tap "Save reading".
        </p>
      )}

      {readings.length >= 2 && (
        <div className="mt-3 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={[0, maxScore]} tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#00BF63" strokeWidth={2.5} dot={{ r: 3.5 }} name={scoreName} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {delta != null && (
        <p className={`mt-2 text-center text-[12px] font-bold ${delta > 0 ? 'text-red-600 dark:text-red-300' : delta < 0 ? 'text-brand-dark' : 'text-neutral-400'}`}>
          {delta > 0 ? `▲ Worsening: +${delta} since previous reading` : delta < 0 ? `▼ Improving: ${delta} since previous reading` : '— Unchanged since previous reading'}
        </p>
      )}

      {readings.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {[...readings].reverse().slice(0, 8).map((r) => (
            <div key={r.t} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-[12px] dark:bg-white/5">
              <span className="font-black text-ink dark:text-white">{r.total}</span>
              <span className="flex-1 truncate text-neutral-500">
                {new Date(r.t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {r.note}
              </span>
              <button onClick={() => remove(r.t)} aria-label="Delete reading" className="font-bold text-neutral-400 hover:text-red-500">✕</button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
