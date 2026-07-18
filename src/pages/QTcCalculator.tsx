import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'
import { getDemo } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// QTc Calculator — corrected QT interval, essential for drug safety (many
// medications — antipsychotics, some antibiotics/antiemetics, methadone,
// class Ia/III antiarrhythmics — prolong QT and raise Torsades de Pointes
// risk). Four standard correction formulas, all well established:
//   Bazett (1920):    QTc = QT / sqrt(RR)        — most common, overcorrects at high HR
//   Fridericia (1920): QTc = QT / RR^(1/3)       — more accurate at HR extremes
//   Framingham (Sagie 1992): QTc = QT + 154(1-RR)
//   Hodges (1983):    QTc = QT + 1.75(HR-60)
// RR interval (seconds) = 60 / heart rate (bpm). Pure arithmetic, no API.
// ─────────────────────────────────────────────────────────────────────────────

function band(qtcMs: number, sex: 'M' | 'F'): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (qtcMs >= 500) return { label: 'High risk — markedly prolonged', tone: 'critical' }
  const prolongedCutoff = sex === 'M' ? 450 : 470
  const borderlineCutoff = sex === 'M' ? 430 : 450
  if (qtcMs >= prolongedCutoff) return { label: 'Prolonged', tone: 'critical' }
  if (qtcMs >= borderlineCutoff) return { label: 'Borderline', tone: 'low' }
  return { label: 'Normal', tone: 'brand' }
}

export function QTcCalculator() {
  const [qtMs, setQtMs] = useState(400)
  const [hr, setHr] = useState(60)
  const [sex, setSex] = useState<'M' | 'F'>(() => getDemo().sex || 'M')

  const rrSec = 60 / hr
  const qtSec = qtMs / 1000

  const bazett = qtSec / Math.sqrt(rrSec) * 1000
  const fridericia = qtSec / Math.cbrt(rrSec) * 1000
  const framingham = (qtSec + 0.154 * (1 - rrSec)) * 1000
  const hodges = qtMs + 1.75 * (hr - 60)

  const primary = bazett // Bazett is the most widely used in routine practice
  const primaryBand = band(primary, sex)

  const rows = [
    { name: 'Bazett', value: bazett, note: 'Most widely used; overcorrects at high heart rates' },
    { name: 'Fridericia', value: fridericia, note: 'More accurate at heart-rate extremes' },
    { name: 'Framingham', value: framingham, note: 'Linear correction, population-derived' },
    { name: 'Hodges', value: hodges, note: 'Linear correction based on heart rate directly' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="QTc Calculator" subtitle="Corrected QT interval — drug-safety screening for Torsades de Pointes risk" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Many medications (antipsychotics, some antibiotics/antiemetics, methadone,
          class Ia/III antiarrhythmics) prolong the QT interval and raise Torsades de Pointes risk.
          Enter the measured QT interval and heart rate from an ECG.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Field label="QT interval (ms)">
            <input className={inputClass} type="number" min={200} max={700} value={qtMs} onChange={(e) => setQtMs(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Heart rate (bpm)">
            <input className={inputClass} type="number" min={30} max={200} value={hr} onChange={(e) => setHr(Number(e.target.value) || 1)} />
          </Field>
          <Field label="Sex">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Bazett QTc (most commonly used clinically)</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{primary.toFixed(0)} ms</span>
          <Badge tone={primaryBand.tone}>{primaryBand.label}</Badge>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
          {primary >= 500
            ? 'QTc ≥500ms is a high-risk threshold for Torsades de Pointes regardless of sex — review QT-prolonging medications urgently and correct electrolytes (K, Mg, Ca).'
            : `Normal reference: <430ms (men) / <450ms (women); borderline 430-450 (men)/450-470 (women); prolonged >450ms (men) />470ms (women).`}
        </p>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Compare correction formulas</div>
        <div className="mt-3 space-y-2">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <div>
                <div className="text-sm font-bold text-ink dark:text-white">{r.name}</div>
                <div className="text-[11px] text-neutral-400">{r.note}</div>
              </div>
              <div className="text-lg font-black text-brand-dark">{r.value.toFixed(0)} ms</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">
          Formulas diverge most at heart rates far from 60 bpm — Fridericia or Framingham are generally
          preferred over Bazett at tachycardia or bradycardia.
        </p>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Bazett (1920); Fridericia (1920); Sagie et al., Framingham Heart Study (1992); Hodges et al.
        (1983). Decision-support only — always correlate with the actual ECG tracing and clinical context.
      </div>
    </div>
  )
}

export default QTcCalculator
