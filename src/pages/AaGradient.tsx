import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Alveolar-arterial (A-a) Oxygen Gradient — standard pulmonary physiology:
//   Alveolar gas equation: PAO2 = FiO2 × (Patm − PH2O) − PaCO2 / RQ
//     with PH2O = 47 mmHg at body temperature and RQ ≈ 0.8.
//   A-a gradient = PAO2 − PaO2.
//   Age-adjusted expected gradient ≈ (age/4) + 4 (common bedside rule).
// Distinguishes hypoxemia WITH a normal gradient (hypoventilation, low FiO2 —
// lungs fine, drive/altitude problem) from hypoxemia with an ELEVATED
// gradient (V/Q mismatch, shunt, diffusion limitation — a lung problem).
// Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

export function AaGradient() {
  const [fio2, setFio2] = useState(21)
  const [pao2, setPao2] = useState(90)
  const [paco2, setPaco2] = useState(40)
  const [age, setAge] = useState(40)
  const [patm, setPatm] = useState(760)

  const PH2O = 47
  const RQ = 0.8
  const alveolar = (fio2 / 100) * (patm - PH2O) - paco2 / RQ
  const gradient = alveolar - pao2
  const expectedForAge = age / 4 + 4
  const elevated = gradient > expectedForAge

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="A-a Oxygen Gradient" subtitle="Alveolar gas equation — localizes the cause of hypoxemia" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          A normal gradient with hypoxemia points to hypoventilation or low inspired oxygen (the lungs
          themselves are fine); an elevated gradient points to a lung problem — V/Q mismatch, shunt,
          or diffusion limitation. Needs an arterial blood gas.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="FiO₂ (%)">
            <input className={inputClass} type="number" min={21} max={100} value={fio2 || ''} onChange={(e) => setFio2(Number(e.target.value) || 0)} />
          </Field>
          <Field label="PaO₂ (mmHg)">
            <input className={inputClass} type="number" min={0} value={pao2 || ''} onChange={(e) => setPao2(Number(e.target.value) || 0)} />
          </Field>
          <Field label="PaCO₂ (mmHg)">
            <input className={inputClass} type="number" min={0} value={paco2 || ''} onChange={(e) => setPaco2(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Age (years)">
            <input className={inputClass} type="number" min={0} value={age || ''} onChange={(e) => setAge(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Atmospheric pressure (mmHg)">
            <input className={inputClass} type="number" min={400} max={800} value={patm || ''} onChange={(e) => setPatm(Number(e.target.value) || 0)} />
          </Field>
        </div>
        <p className="mt-2 text-[11px] text-neutral-400">Atmospheric pressure defaults to sea level (760 mmHg) — lower it for altitude (e.g. ~630 at 1,600 m).</p>
      </Card>

      <Card className="!p-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">PAO₂ (alveolar)</div>
            <div className="mt-1 text-2xl font-black text-ink dark:text-white">{alveolar.toFixed(0)}</div>
            <div className="text-[11px] text-neutral-400">mmHg</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">A-a gradient</div>
            <div className="mt-1 text-2xl font-black text-brand-dark">{gradient.toFixed(0)}</div>
            <div className="text-[11px] text-neutral-400">mmHg</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Expected for age</div>
            <div className="mt-1 text-2xl font-black text-ink dark:text-white">≤{expectedForAge.toFixed(0)}</div>
            <div className="text-[11px] text-neutral-400">mmHg (≈ age/4 + 4)</div>
          </div>
        </div>
        <div className="mt-3">
          <Badge tone={elevated ? 'critical' : 'brand'}>{elevated ? 'Elevated gradient' : 'Normal gradient'}</Badge>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
          {elevated
            ? 'Elevated for age — suggests a pulmonary cause: V/Q mismatch (PE, pneumonia, COPD), shunt (severe consolidation, intracardiac), or diffusion limitation (fibrosis, emphysema). A shunt classically fails to correct with 100% oxygen.'
            : 'Within the age-expected range — if the patient is hypoxemic, think hypoventilation (sedatives, neuromuscular weakness, CO₂ retention) or low inspired oxygen (altitude) rather than an intrinsic lung problem.'}
        </p>
        {fio2 > 30 && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            The age/4 + 4 expected-gradient rule was derived on room air — on supplemental oxygen the
            normal gradient widens substantially, so interpret cautiously (some references allow
            roughly 5-7 mmHg per 10% FiO₂ increase).
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Alveolar gas equation with PH₂O = 47 mmHg, RQ = 0.8 (standard physiology; see Sarkar et al.,
        <i> Lung India</i> 2017 for review). Decision-support estimate — interpret with the full ABG,
        clinical picture, and imaging.
      </div>
    </div>
  )
}

export default AaGradient
