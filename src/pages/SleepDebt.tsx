import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { Card, SectionTitle, inputClass, Badge } from '../components/ui'
import { IconMoon } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// Sleep Debt Calculator — tracks the rolling gap between how much sleep you
// need and how much you actually get. Chronic short sleep accumulates as
// "sleep debt", and even modest ongoing debt impairs cognition, metabolism,
// and immune function (Van Dongen et al., 2003, Sleep 26(2):117-126). The
// AASM recommends ≥7h/night for adults. Pure localStorage, no API.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_sleepdebt_v1'
interface Night { date: string; hours: number }
function load(): Night[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') as Night[] } catch { return [] }
}

export function SleepDebt() {
  const [need, setNeed] = useState(8)
  const [nights, setNights] = useState<Night[]>(load)
  const today = new Date().toISOString().slice(0, 10)
  const [hours, setHours] = useState(7)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(nights)) } catch { /* ignore */ }
  }, [nights])

  const logNight = () => {
    setNights((prev) => [{ date: today, hours }, ...prev.filter((n) => n.date !== today)].sort((a, b) => b.date.localeCompare(a.date)))
  }
  const removeNight = (date: string) => setNights((prev) => prev.filter((n) => n.date !== date))

  // Rolling 14-day debt (need − actual, only counting nights logged).
  const last14 = useMemo(() => nights.slice(0, 14), [nights])
  const debt = last14.reduce((s, n) => s + (need - n.hours), 0)
  const avg = last14.length ? last14.reduce((s, n) => s + n.hours, 0) / last14.length : 0

  const chart = [...last14].reverse().map((n) => ({
    label: n.date.slice(5),
    hours: n.hours,
  }))

  const tone: 'brand' | 'low' | 'critical' = debt <= 2 ? 'brand' : debt <= 8 ? 'low' : 'critical'
  const verdict = debt <= 2 ? 'Well-rested — minimal debt' : debt <= 8 ? 'Mild sleep debt — protect your next few nights' : 'Significant sleep debt — prioritize recovery sleep'

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Sleep Debt Calculator" subtitle="The rolling gap between the sleep you need and what you get" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Log each night's sleep. Debt accumulates when you sleep less than you need — and unlike
          money, you can't fully "repay" it in one long lie-in, so the trend matters more than any
          single night. Adults generally need ≥7 hours (AASM).
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-[12px] font-semibold text-neutral-500">
            My nightly sleep need (hours)
            <input className={`${inputClass} mt-1`} type="number" step="0.5" min={5} max={11} value={need || ''} onChange={(e) => setNeed(Number(e.target.value) || 0)} />
          </label>
          <label className="text-[12px] font-semibold text-neutral-500">
            Last night I slept (hours)
            <input className={`${inputClass} mt-1`} type="number" step="0.25" min={0} max={16} value={hours || ''} onChange={(e) => setHours(Number(e.target.value) || 0)} />
          </label>
        </div>
        <button onClick={logNight} className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Log last night ({today})</button>
      </Card>

      <Card className="!p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">14-night debt</div>
            <div className="mt-1 text-3xl font-black text-brand-dark">{debt > 0 ? '−' : '+'}{Math.abs(debt).toFixed(1)}h</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Avg nightly sleep</div>
            <div className="mt-1 text-3xl font-black text-ink dark:text-white">{avg.toFixed(1)}h</div>
          </div>
        </div>
        <div className="mt-3"><Badge tone={tone}>{verdict}</Badge></div>
        {chart.length >= 2 && (
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <ReferenceLine y={need} stroke="#00BF63" strokeDasharray="5 4" label={{ value: 'need', fontSize: 10, fill: '#00BF63' }} />
                <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} name="hours slept" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {last14.length > 0 && <CopyNote text={`Sleep: 14-night debt ${debt > 0 ? '−' : '+'}${Math.abs(debt).toFixed(1)}h, average ${avg.toFixed(1)}h/night (need ${need}h) — ${verdict.toLowerCase()}`} />}
      </Card>

      {nights.length > 0 && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Night log</div>
          <div className="mt-3 space-y-1.5">
            {nights.slice(0, 14).map((n) => (
              <div key={n.date} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-[12px] dark:bg-white/5">
                <span className="font-black text-ink dark:text-white">{n.hours}h</span>
                <span className={`flex-1 ${n.hours >= need ? 'text-brand-dark' : 'text-neutral-500'}`}>{n.date} · {n.hours >= need ? 'met your need' : `${(need - n.hours).toFixed(1)}h short`}</span>
                <button onClick={() => removeNight(n.date)} aria-label="Delete" className="font-bold text-neutral-400 hover:text-red-500">✕</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Van Dongen, H.P.A., et al. (2003). The cumulative cost of additional wakefulness.
        <i> Sleep</i>, 26(2), 117-126. Wellness tool — persistent insomnia or unrefreshing sleep
        despite adequate time in bed deserves a clinical sleep evaluation.
      </div>
    </div>
  )
}

export default SleepDebt
