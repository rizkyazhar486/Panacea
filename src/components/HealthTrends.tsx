import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// 7-day trend of BMI, BMR & VO₂Max. A real snapshot is appended to localStorage
// once per day, so the chart fills in honestly as the user keeps visiting.
interface Snapshot { date: string; bmi: number; bmr: number; vo2: number }

function bmiOf(w: number, h: number) { return w / ((h / 100) ** 2) }
function bmrOf(w: number, h: number, age: number, g: 'M' | 'F') {
  return g === 'M' ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161
}
// Jackson non-exercise estimate (needs resting HR). Falls back to an age/BMI proxy.
function vo2Of(age: number, bmi: number, g: 'M' | 'F', hrRest?: number) {
  if (hrRest && hrRest > 30) return (g === 'M' ? 15.3 * (220 - age) / hrRest : 15.3 * (226 - age) / hrRest)
  const base = g === 'M' ? 50 : 44
  return Math.max(20, base - 0.3 * Math.max(0, age - 20) - 0.6 * Math.max(0, bmi - 22))
}

const KEY = 'pm_health_history'
function loadHistory(): Snapshot[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function HealthTrends({ weight, height, age, gender, hrRest }: {
  weight: number; height: number; age: number; gender: 'M' | 'F'; hrRest?: number
}) {
  const [history, setHistory] = useState<Snapshot[]>([])

  // Record today's snapshot (one per calendar day) whenever inputs change.
  useEffect(() => {
    if (!weight || !height || !age) return
    const today = new Date().toISOString().slice(0, 10)
    const bmi = +bmiOf(weight, height).toFixed(1)
    const bmr = Math.round(bmrOf(weight, height, age, gender))
    const vo2 = +vo2Of(age, bmi, gender, hrRest).toFixed(1)
    const list = loadHistory().filter((s) => s.date !== today)
    const next = [...list, { date: today, bmi, bmr, vo2 }].slice(-30)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
    setHistory(next)
  }, [weight, height, age, gender, hrRest])

  const data = useMemo(() => history.slice(-7).map((s) => ({
    ...s,
    label: new Date(s.date).toLocaleDateString('id-ID', { weekday: 'short' }),
  })), [history])

  const latest = data[data.length - 1]

  const metrics = [
    { key: 'bmi', name: 'BMI', color: '#00BF63', unit: '', val: latest?.bmi },
    { key: 'bmr', name: 'BMR', color: '#6366f1', unit: ' kkal', val: latest?.bmr },
    { key: 'vo2', name: 'VO₂Max', color: '#f59e0b', unit: '', val: latest?.vo2 },
  ] as const

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-ink">📈 Tren Kesehatan 7 Hari</h3>
          <p className="text-[11px] text-neutral-500">BMI · BMR · VO₂Max — tercatat otomatis tiap kunjungan</p>
        </div>
      </div>

      {/* latest values */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div key={m.key} className="rounded-xl border border-neutral-100 p-2.5 text-center">
            <div className="text-lg font-extrabold" style={{ color: m.color }}>{m.val ?? '—'}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{m.name}</div>
          </div>
        ))}
      </div>

      {data.length < 2 ? (
        <p className="mt-4 rounded-xl bg-neutral-50 px-3 py-4 text-center text-[12px] text-neutral-400">
          Grafik tren akan terisi setiap hari Anda berkunjung. Data hari ini sudah tercatat ✓
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {metrics.map((m) => (
            <div key={m.key}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-bold" style={{ color: m.color }}>{m.name}</span>
                <span className="text-neutral-400">Terbaru: <b style={{ color: m.color }}>{m.val}{m.unit}</b></span>
              </div>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={36} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #eee' }} />
                  <Line type="monotone" dataKey={m.key} name={m.name} stroke={m.color} strokeWidth={2.5} dot={{ r: 3, fill: m.color }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HealthTrends
