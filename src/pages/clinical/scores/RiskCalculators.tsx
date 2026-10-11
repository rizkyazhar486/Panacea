import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconHeart, IconActivity, IconShield } from '../../../components/icons'
import { getDemoTersimpan } from '../../../lib/profile'
import { cvdRisk, fib4 as hitungFib4, ostIndex as hitungOst, parseNumberField } from '../../../domains/clinical-calculators'
import { BatasKlaimKesehatan } from '../../../components/BatasKlaimKesehatan'

// ─────────────────────────────────────────────────────────────────────────────
// Clinical Risk Calculators — validated, published scores implemented with
// their real coefficients (not black boxes):
//   • 10-year cardiovascular risk — Framingham General CVD (D'Agostino 2008)
//   • FIB-4 — liver fibrosis index (Sterling 2006)
//   • OST — Osteoporosis Self-assessment Tool index
// Demographics prefill from the shared profile; labs entered manually. These
// are decision-support estimates for discussion with a clinician, not a
// diagnosis, and each score has its own validated population & caveats.
// ─────────────────────────────────────────────────────────────────────────────

export function RiskCalculators() {
  // Bacaan TERSIMPAN, bukan getDemo(): getDemo() memadukan usia 30 / 70 kg bawaan sehingga OST terbuka dengan
  // "Lower risk" untuk orang yang belum mengisi apa pun. Teks mentah: kolom kosong = belum diisi, bukan 0.
  const d0 = getDemoTersimpan()
  const dariProfil = (n: number | undefined) => (n && n > 0 ? String(n) : '')
  const [ageText, setAge] = useState(dariProfil(d0.age))
  const [sex, setSex] = useState<'M' | 'F'>(d0.sex === 'F' ? 'F' : 'M')
  const [weightText, setWeight] = useState(dariProfil(d0.weightKg))
  // CVD
  const [totCholText, setTotChol] = useState('')
  const [hdlText, setHdl] = useState('')
  const [sbpText, setSbp] = useState('')
  const [treatedBP, setTreatedBP] = useState(false)
  const [smoker, setSmoker] = useState(false)
  const [diabetic, setDiabetic] = useState(false)
  // FIB-4
  const [astText, setAst] = useState('')
  const [altText, setAlt] = useState('')
  const [pltText, setPlt] = useState('')

  const age = parseNumberField(ageText)
  const cvdHasil = useMemo(() => cvdRisk({ age, sex, totChol: parseNumberField(totCholText), hdl: parseNumberField(hdlText), sbp: parseNumberField(sbpText), treatedBP, smoker, diabetic }), [age, sex, totCholText, hdlText, sbpText, treatedBP, smoker, diabetic])
  const fibHasil = useMemo(() => hitungFib4({ age, ast: parseNumberField(astText), alt: parseNumberField(altText), platelets: parseNumberField(pltText) }), [age, astText, altText, pltText])
  const ostHasil = useMemo(() => hitungOst({ age, weightKg: parseNumberField(weightText) }), [age, weightText])
  const cvd = cvdHasil.riskPct
  const fib = fibHasil.value
  const ost = ostHasil.value
  const alasan = (h: { invalid: readonly string[] }) => h.invalid.length > 0 && (
    <p role="alert" className="mt-3 text-[12.5px] font-semibold text-red-600">{h.invalid.join('; ')}.</p>
  )

  const numField = (label: string, val: string, set: (t: string) => void, step = 1) => (
    <Field label={label}><input className={inputClass} type="number" step={step} value={val} onChange={(e) => set(e.target.value)} /></Field>
  )
  const toggle = (label: string, val: boolean, set: (b: boolean) => void) => (
    <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-ink dark:border-white/10 dark:text-ink">
      <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} /> {label}
    </label>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Clinical Risk Calculators" subtitle="Published scores with their actual formulas — to discuss with your doctor, not a clinically validated Panacea decision" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          {numField('Age', ageText, setAge)}
          <Field label="Sex">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
          {numField('Weight (kg)', weightText, setWeight, 0.1)}
        </div>
      </Card>

      {/* Cardiovascular */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="10-Year Cardiovascular Risk" subtitle="Framingham General CVD (D'Agostino 2008)" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          {numField('Total chol (mg/dL)', totCholText, setTotChol)}
          {numField('HDL (mg/dL)', hdlText, setHdl)}
          {numField('Systolic BP', sbpText, setSbp)}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {toggle('On BP treatment', treatedBP, setTreatedBP)}
          {toggle('Smoker', smoker, setSmoker)}
          {toggle('Diabetic', diabetic, setDiabetic)}
        </div>
        {alasan(cvdHasil)}
        {cvd != null ? (
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
            <div className="text-4xl font-black" style={{ color: cvd < 7.5 ? '#00BF63' : cvd < 20 ? '#f59e0b' : '#ef4444' }}>{cvd}%</div>
            <div>
              <Badge tone={cvdHasil.band!.tone}>{cvdHasil.band!.label}</Badge>
              <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-500">Estimated risk of a cardiovascular event in the next 10 years. &lt;7.5% low · 7.5–20% intermediate · ≥20% high.</p>
            </div>
          </div>
        ) : <p className="mt-3 text-[12px] text-neutral-500">Enter total cholesterol, HDL, and systolic BP to calculate.</p>}
      </Card>

      {/* FIB-4 */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="FIB-4 Liver Fibrosis Index" subtitle="Sterling 2006 — screens for advanced liver fibrosis" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          {numField('AST (U/L)', astText, setAst)}
          {numField('ALT (U/L)', altText, setAlt)}
          {numField('Platelets (×10⁹/L)', pltText, setPlt)}
        </div>
        {alasan(fibHasil)}
        {fib != null ? (
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
            <div className="text-4xl font-black" style={{ color: fibHasil.band!.tone === 'brand' ? '#00BF63' : fibHasil.band!.tone === 'low' ? '#f59e0b' : '#ef4444' }}>{fib}</div>
            <div>
              <Badge tone={fibHasil.band!.tone}>{fibHasil.band!.label}</Badge>
              <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-500">{fibHasil.band!.note}</p>
            </div>
          </div>
        ) : <p className="mt-3 text-[12px] text-neutral-500">Enter AST, ALT, and platelet count to calculate.</p>}
      </Card>

      {/* OST */}
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Osteoporosis Risk (OST)" subtitle="Osteoporosis Self-assessment Tool index — from age & body weight" />
        {alasan(ostHasil)}
        {ost != null ? (
          <div className="mt-3 flex items-center gap-4 rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
            <div className="text-4xl font-black" style={{ color: ostHasil.band!.tone === 'brand' ? '#00BF63' : ostHasil.band!.tone === 'low' ? '#f59e0b' : '#ef4444' }}>{ost}</div>
            <div>
              <Badge tone={ostHasil.band!.tone}>{ostHasil.band!.label}</Badge>
              <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-500">A simple screen (originally validated in postmenopausal women) — higher risk suggests discussing a bone-density (DEXA) scan.</p>
            </div>
          </div>
        ) : <p className="mt-3 text-[12px] text-neutral-500">Enter age and weight above to calculate.</p>}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Decision-support estimates using each score's published formula. Every tool has its own published population, units, and caveats (e.g. Framingham is a US-cohort general estimate; region-specific tools may differ). Not a diagnosis — review results with the clinician who knows your full history.
        <BatasKlaimKesehatan permukaan="calculators.risk" />
      </div>
    </div>
  )
}

export default RiskCalculators
