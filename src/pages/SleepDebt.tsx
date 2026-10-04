import { useEffect, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { hariIni } from '../lib/tanggal'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { Card, SectionTitle, inputClass, Badge } from '../components/ui'
import { IconMoon } from '../components/icons'
import { CopyNote } from '../components/CopyNote'
import { BatasKlaimKesehatan } from '../components/BatasKlaimKesehatan'
import { getHealthCache, hasHealth } from '../lib/profile'
import { parseNumberField, sanitizeNights, sleepDebt, validateHours, type Night } from '../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// Sleep Debt Calculator — tracks the rolling gap between how much sleep you
// need and how much you actually get. Chronic short sleep accumulates as
// "sleep debt", and even modest ongoing debt impairs cognition, metabolism,
// and immune function (Van Dongen et al., 2003, Sleep 26(2):117-126). The
// AASM recommends ≥7h/night for adults. Pure localStorage, no API.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_sleepdebt_v1'
function load(): Night[] {
  // Catatan tersimpan yang rusak dibuang (bukan dihitung); lihat sanitizeNights.
  try { return sanitizeNights(JSON.parse(localStorage.getItem(LS_KEY) || '[]')).nights } catch { return [] }
}

export function SleepDebt() {
  // Teks mentah: kolom kosong tetap "belum diisi" (NaN), bukan 0 jam yang sah.
  const [need, setNeed] = useState('8')
  const [nights, setNights] = useState<Night[]>(load)
  const today = hariIni()
  const [hours, setHours] = useState(() => {
    const v = getHealthCache().sleepH
    return String(typeof v === 'number' && v > 0 ? v : 7)
  })
  const sleepFromDevice = hasHealth('sleepH')

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(nights)) } catch { /* ignore */ }
  }, [nights])

  const hoursChecked = validateHours(parseNumberField(hours))
  const logNight = () => {
    if (!hoursChecked.ok) return
    const h = parseNumberField(hours)
    setNights((prev) => [{ date: today, hours: h }, ...prev.filter((n) => n.date !== today)].sort((a, b) => b.date.localeCompare(a.date)))
  }
  const removeNight = (date: string) => setNights((prev) => prev.filter((n) => n.date !== date))

  // Rolling 14-day debt (need − actual, only counting nights logged).
  const res = sleepDebt(parseNumberField(need), nights)
  const last14 = nights.slice(0, 14)
  const needH = parseNumberField(need)

  const chart = [...last14].reverse().map((n) => ({
    label: n.date.slice(5),
    hours: n.hours,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Sleep Debt Calculator" subtitle="Selisih berjalan antara tidur yang Anda butuhkan dan yang benar-benar Anda dapatkan" />
        <BatasKlaimKesehatan permukaan="wellness.sleep-debt" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Catat tidur tiap malam. Utang menumpuk ketika Anda tidur kurang dari kebutuhan — dan tidak seperti uang, ia tidak dapat "dilunasi" penuh dengan sekali tidur panjang, sehingga trennya lebih penting daripada malam mana pun. Orang dewasa umumnya membutuhkan ≥7 jam (AASM). This rolling sum is a self-tracking aid, not a sleep diagnosis.</Prosa>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-[12px] font-semibold text-neutral-500">
            My nightly sleep need (hours)
            <input className={`${inputClass} mt-1`} type="number" step="0.5" min={5} max={11} value={need} onChange={(e) => setNeed(e.target.value)} />
          </label>
          <label className="text-[12px] font-semibold text-neutral-500">
            Last night I slept (hours){sleepFromDevice && ' — from your device'}
            <input className={`${inputClass} mt-1`} type="number" step="0.25" min={0} max={16} value={hours} onChange={(e) => setHours(e.target.value)} />
          </label>
        </div>
        {sleepFromDevice && (
          <p className="mt-2 text-[11px] text-neutral-500">Prefilled from your synced sleep data — adjust it if last night was different from what synced.</p>
        )}
        {!hoursChecked.ok && <p role="alert" className="mt-2 text-[12px] font-semibold text-amber-700 dark:text-amber-300">{hoursChecked.reason}</p>}
        <button onClick={logNight} disabled={!hoursChecked.ok} className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Log last night ({today})</button>
      </Card>

      <Card className="!p-5">
        {!res.ok ? (
          <p role="alert" className="text-sm font-semibold text-amber-700 dark:text-amber-300">{res.reason}</p>
        ) : (
          <>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">14-night debt</div>
            <div className="mt-1 text-3xl font-black text-brand-dark">{res.data.debt > 0 ? '−' : '+'}{Math.abs(res.data.debt).toFixed(1)}h</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Avg nightly sleep</div>
            <div className="mt-1 text-3xl font-black text-ink dark:text-ink">{res.data.avg.toFixed(1)}h</div>
          </div>
        </div>
        <div className="mt-3"><Badge tone={res.data.tone}>{res.data.verdict}</Badge></div>
        {chart.length >= 2 && (
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <ReferenceLine y={needH} stroke="#00BF63" strokeDasharray="5 4" label={{ value: 'need', fontSize: 10, fill: '#00BF63' }} />
                <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} name="hours slept" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {last14.length > 0 && <CopyNote text={`Sleep: 14-night debt ${res.data.debt > 0 ? '−' : '+'}${Math.abs(res.data.debt).toFixed(1)}h, average ${res.data.avg.toFixed(1)}h/night (need ${needH}h) — ${res.data.verdict.toLowerCase()}`} />}
          </>
        )}
      </Card>

      {nights.length > 0 && (
        <Card className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Night log</div>
          <div className="mt-3 space-y-1.5">
            {nights.slice(0, 14).map((n) => (
              <div key={n.date} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-[12px] dark:bg-white/5">
                <span className="font-black text-ink dark:text-ink">{n.hours}h</span>
                <span className={`flex-1 ${res.ok && n.hours >= needH ? 'text-brand-dark' : 'text-neutral-500'}`}>{n.date}{res.ok && ` · ${n.hours >= needH ? 'met your need' : `${(needH - n.hours).toFixed(1)}h short`}`}</span>
                <button onClick={() => removeNight(n.date)} aria-label="Delete" className="font-bold text-neutral-500 hover:text-red-500">✕</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Van Dongen, H.P.A., et al. (2003). The cumulative cost of additional wakefulness.
        <i> Sleep</i>, 26(2), 117-126. Wellness tool — persistent insomnia or unrefreshing sleep
        despite adequate time in bed deserves a clinical sleep evaluation.
      </div>
    </div>
  )
}

export default SleepDebt
