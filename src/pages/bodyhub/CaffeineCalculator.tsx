import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'
import { BatasKlaimKesehatan } from '../components/BatasKlaimKesehatan'
import { IconMoon } from '../components/icons'
import { caffeineAtBedtime, CAFFEINE_DRINKS as DRINKS, parseNumberField } from '../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// Caffeine Half-Life & Sleep Impact Calculator — pure first-order elimination
// kinetics, no external API. Caffeine's plasma half-life in a healthy adult
// averages ~5 hours, but varies widely (roughly 1.5-9.5h) by genetics
// (CYP1A2 enzyme activity), pregnancy, hormonal contraceptives, smoking, and
// liver function — commonly cited ranges from FDA consumer guidance and
// pharmacology references (e.g. Goodman & Gilman's). This tool lets the user
// pick their own half-life within that range rather than assuming one value.
// ─────────────────────────────────────────────────────────────────────────────

export function CaffeineCalculator() {
  // Teks mentah: kosong = tidak minum (0), tetapi nilai tak masuk akal ditolak oleh mesin, bukan diubah diam-diam jadi 0.
  const [customText, setCustomText] = useState('')
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [consumedAt, setConsumedAt] = useState(() => {
    const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:00`
  })
  const [bedtime, setBedtime] = useState('22:30')
  const [halfLife, setHalfLife] = useState(5)

  const hasil = useMemo(() => caffeineAtBedtime({
    servings: Object.fromEntries(Object.entries(picked).map(([k, v]) => [k, parseNumberField(v)])),
    customMg: parseNumberField(customText), consumedAt, bedtime, halfLifeH: halfLife,
  }), [picked, customText, consumedAt, bedtime, halfLife])
  const totalDose = hasil.totalDoseMg ?? 0
  const remainingAtBed = hasil.remainingMg ?? 0
  const pctAtBed = hasil.pctAtBed ?? 0
  const hoursTo12pct = hasil.hoursTo12pct ?? halfLife * 3
  const curve = hasil.curve

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Caffeine & Sleep Calculator" subtitle="Educational half-life estimate of caffeine remaining at bedtime" />
        <BatasKlaimKesehatan permukaan="wellness.caffeine-sleep" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Caffeine clears the body by first-order kinetics (a fixed <i>fraction</i> per hour, not a fixed
          amount) with a plasma half-life that averages ~5 hours but genuinely varies — roughly
          1.5–9.5 hours depending on genetics (CYP1A2 enzyme activity), pregnancy, hormonal
          contraceptive use, smoking, and liver function. Adjust the half-life slider if you know
          you're a fast or slow metabolizer.
        </p>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">What did you drink?</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DRINKS.map((d) => (
            <Field key={d.label} label={`${d.icon} ${d.label}`}>
              <input
                className={inputClass}
                type="number" min={0} inputMode="numeric"
                value={picked[d.label] ?? ''}
                onChange={(e) => { const v = e.target.value; setPicked((s) => ({ ...s, [d.label]: v })) }}
                placeholder="0 servings"
              />
            </Field>
          ))}
        </div>
        <div className="mt-2">
          <Field label="Extra caffeine — custom (mg)">
            <input className={inputClass} type="number" min={0} value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="0" />
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

      {hasil.invalid.length > 0 && (
        <p role="alert" className="text-[12.5px] font-semibold text-red-600">{hasil.invalid.join('; ')}.</p>
      )}

      {hasil.invalid.length === 0 && totalDose > 0 && (
        <>
          <Card className="!p-5">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-500">At your bedtime</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-dark">{remainingAtBed.toFixed(0)}</span>
              <span className="text-sm font-semibold text-neutral-500">mg still active ({pctAtBed.toFixed(0)}% of {totalDose}mg consumed)</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
              {hasil.band === 'high'
                ? `That's likely enough residual caffeine to disrupt sleep onset and deep-sleep quality for many people. A common rule of thumb is to stop caffeine roughly ${hoursTo12pct.toFixed(1)}h before bed (~3 half-lives) so under 12.5% remains.`
                : hasil.band === 'near'
                  ? 'Getting close to a level unlikely to meaningfully affect most people\'s sleep, but sensitive individuals may still notice lighter sleep.'
                  : 'Low enough that most people won\'t notice a sleep effect from this alone — though everyone\'s sensitivity differs.'}
            </p>
          </Card>

          <Card className="!p-5">
            <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Decay over the next 16 hours</div>
            <div className="mt-3 flex h-24 items-end gap-1">
              {curve.map((v, h) => (
                <div key={h} className="flex-1 rounded-t bg-amber-400/70" style={{ height: `${Math.max(2, (v / totalDose) * 100)}%` }} title={`+${h}h: ${v.toFixed(0)}mg`} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-neutral-500"><span>0h</span><span>8h</span><span>16h</span></div>
          </Card>
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Educational estimate only — individual caffeine metabolism varies substantially. Not medical advice;
        talk to a clinician about caffeine if you're pregnant or have a heart or anxiety condition.
      </div>
    </div>
  )
}

export default CaffeineCalculator
