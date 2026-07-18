import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'
import { IconMoon } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Caffeine Half-Life & Sleep Impact Calculator — pure first-order elimination
// kinetics, no external API. Caffeine's plasma half-life in a healthy adult
// averages ~5 hours, but varies widely (roughly 1.5-9.5h) by genetics
// (CYP1A2 enzyme activity), pregnancy, hormonal contraceptives, smoking, and
// liver function — commonly cited ranges from FDA consumer guidance and
// pharmacology references (e.g. Goodman & Gilman's). This tool lets the user
// pick their own half-life within that range rather than assuming one value.
// ─────────────────────────────────────────────────────────────────────────────

interface Drink { label: string; icon: string; mg: number }
const DRINKS: Drink[] = [
  { label: 'Brewed coffee (240 ml)', icon: '☕', mg: 95 },
  { label: 'Espresso shot', icon: '☕', mg: 63 },
  { label: 'Black tea (240 ml)', icon: '🍵', mg: 47 },
  { label: 'Green tea (240 ml)', icon: '🍵', mg: 28 },
  { label: 'Energy drink (250 ml can)', icon: '🥤', mg: 80 },
  { label: 'Cola (330 ml can)', icon: '🥤', mg: 34 },
]

function decayCurve(doseMg: number, halfLifeH: number, hoursOut: number): number[] {
  const points: number[] = []
  for (let h = 0; h <= hoursOut; h++) points.push(doseMg * Math.pow(0.5, h / halfLifeH))
  return points
}

export function CaffeineCalculator() {
  const [customMg, setCustomMg] = useState(0)
  const [picked, setPicked] = useState<Record<string, number>>({})
  const [consumedAt, setConsumedAt] = useState(() => {
    const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:00`
  })
  const [bedtime, setBedtime] = useState('22:30')
  const [halfLife, setHalfLife] = useState(5)

  const totalDose = useMemo(
    () => Object.entries(picked).reduce((s, [k, n]) => s + n * (DRINKS.find((d) => d.label === k)?.mg ?? 0), 0) + customMg,
    [picked, customMg],
  )

  const hoursUntilBed = useMemo(() => {
    const [ch, cm] = consumedAt.split(':').map(Number)
    const [bh, bm] = bedtime.split(':').map(Number)
    let diff = (bh * 60 + bm - (ch * 60 + cm)) / 60
    if (diff < 0) diff += 24
    return diff
  }, [consumedAt, bedtime])

  const remainingAtBed = totalDose * Math.pow(0.5, hoursUntilBed / halfLife)
  const pctAtBed = totalDose > 0 ? (remainingAtBed / totalDose) * 100 : 0
  // Rough, commonly-cited rule of thumb: aim for <~12.5% of peak dose (roughly
  // 3 half-lives) remaining at bedtime for minimal sleep-architecture impact.
  const hoursTo12pct = halfLife * 3
  const curve = decayCurve(totalDose, halfLife, 16)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Caffeine & Sleep Calculator" subtitle="How much caffeine is still in your system at bedtime" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Caffeine clears the body by first-order kinetics (a fixed <i>fraction</i> per hour, not a fixed
          amount) with a plasma half-life that averages ~5 hours but genuinely varies — roughly
          1.5–9.5 hours depending on genetics (CYP1A2 enzyme activity), pregnancy, hormonal
          contraceptive use, smoking, and liver function. Adjust the half-life slider if you know
          you're a fast or slow metabolizer.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">What did you drink?</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DRINKS.map((d) => (
            <Field key={d.label} label={`${d.icon} ${d.label}`}>
              <input
                className={inputClass}
                type="number" min={0} inputMode="numeric"
                value={picked[d.label] ?? ''}
                onChange={(e) => setPicked((s) => ({ ...s, [d.label]: Number(e.target.value) || 0 }))}
                placeholder="0 servings"
              />
            </Field>
          ))}
        </div>
        <div className="mt-2">
          <Field label="Extra caffeine — custom (mg)">
            <input className={inputClass} type="number" min={0} value={customMg || ''} onChange={(e) => setCustomMg(Number(e.target.value) || 0)} placeholder="0" />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Time consumed"><input className={inputClass} type="time" value={consumedAt} onChange={(e) => setConsumedAt(e.target.value)} /></Field>
          <Field label="Planned bedtime"><input className={inputClass} type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} /></Field>
          <Field label={`Your half-life: ${halfLife}h`}>
            <input className="w-full accent-brand" type="range" min={1.5} max={9.5} step={0.5} value={halfLife} onChange={(e) => setHalfLife(Number(e.target.value))} />
          </Field>
        </div>
      </Card>

      {totalDose > 0 && (
        <>
          <Card className="!p-5">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">At your bedtime</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-dark">{remainingAtBed.toFixed(0)}</span>
              <span className="text-sm font-semibold text-neutral-500">mg still active ({pctAtBed.toFixed(0)}% of {totalDose}mg consumed)</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
              {pctAtBed > 25
                ? `That's likely enough residual caffeine to disrupt sleep onset and deep-sleep quality for many people. A common rule of thumb is to stop caffeine roughly ${hoursTo12pct.toFixed(1)}h before bed (~3 half-lives) so under 12.5% remains.`
                : pctAtBed > 12.5
                  ? 'Getting close to a level unlikely to meaningfully affect most people\'s sleep, but sensitive individuals may still notice lighter sleep.'
                  : 'Low enough that most people won\'t notice a sleep effect from this alone — though everyone\'s sensitivity differs.'}
            </p>
          </Card>

          <Card className="!p-5">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Decay over the next 16 hours</div>
            <div className="mt-3 flex h-24 items-end gap-1">
              {curve.map((v, h) => (
                <div key={h} className="flex-1 rounded-t bg-amber-400/70" style={{ height: `${Math.max(2, (v / totalDose) * 100)}%` }} title={`+${h}h: ${v.toFixed(0)}mg`} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-neutral-400"><span>0h</span><span>8h</span><span>16h</span></div>
          </Card>
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational estimate only — individual caffeine metabolism varies substantially. Not medical advice;
        talk to a clinician about caffeine if you're pregnant or have a heart or anxiety condition.
      </div>
    </div>
  )
}

export default CaffeineCalculator
