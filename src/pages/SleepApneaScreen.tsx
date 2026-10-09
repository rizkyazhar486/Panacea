import { useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Badge, Field, inputClass } from '../components/ui'
import { IconMoon } from '../components/icons'
import { getDemoTersimpan } from '../lib/profile'
import { BatasKlaimSkorTerbit } from '../components/BatasKlaimSkorTerbit'
import { stopBang, parseNumberField, STOP_KEYS } from '../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// STOP-BANG — published obstructive sleep apnea (OSA) risk screening tool
// (Chung et al., 2008, Anesthesiology 108(5):812-821), one of the most widely
// used pre-operative and primary-care OSA screens. 8 yes/no items, 1 point
// each, total 0-8. Standard risk bands: 0-2 low, 3-4 intermediate, 5-8 high.
// Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS: { key: string; letter: string; label: string }[] = [
  { key: 'snoring', letter: 'S', label: 'Do you Snore loudly (louder than talking or loud enough to be heard through closed doors)?' },
  { key: 'tired', letter: 'T', label: 'Do you often feel Tired, fatigued, or sleepy during daytime?' },
  { key: 'observed', letter: 'O', label: 'Has anyone Observed you stop breathing during your sleep?' },
  { key: 'pressure', letter: 'P', label: 'Do you have, or are you being treated for, high blood Pressure?' },
]

export function SleepApneaScreen() {
  // Halaman ini sudah sebagian besar jujur: IMT, usia dan lingkar leher
  // dimulai nol, dan ambangnya `> 0`, jadi nol tidak menghasilkan poin.
  //
  // Satu yang tidak: jenis kelamin. `demo.sex === 'M'` dengan getDemo()
  // SELALU benar, karena DEMO_DEFAULT menjawab 'M' untuk profil kosong. Satu
  // poin BANG karena itu diberikan diam-diam kepada semua orang -- dan pada
  // STOP-BANG satu poin memindahkan ambang 3 dan 5.
  const demo = getDemoTersimpan()
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  // Teks mentah: kolom kosong = NaN ("belum diisi"), bukan 0.
  const [bmiText, setBmi] = useState(() => (demo.weightKg && demo.weightKg > 0 && demo.heightCm && demo.heightCm > 0
    ? (demo.weightKg / Math.pow(demo.heightCm / 100, 2)).toFixed(1) : ''))
  const [ageText, setAge] = useState(demo.age && demo.age > 0 ? String(demo.age) : '')
  const [neckText, setNeckCm] = useState('')
  const [sex, setSex] = useState<'M' | 'F' | ''>(demo.sex === 'M' || demo.sex === 'F' ? demo.sex : '')

  const hasil = stopBang({
    age: parseNumberField(ageText), bmi: parseNumberField(bmiText), neckCm: parseNumberField(neckText), sex,
    stop: Object.fromEntries(STOP_KEYS.map((k) => [k, !!answers[k]])) as Record<(typeof STOP_KEYS)[number], boolean>,
  })
  const belum = hasil.missing
  const lengkap = hasil.total !== null
  const total = hasil.total ?? 0
  const band = hasil.band

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Sleep Apnea Screening (STOP-BANG)" subtitle="Published obstructive sleep apnea risk screen (Chung et al., 2008) — not a clinically validated Panacea decision" />
        <BatasKlaimSkorTerbit />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">A widely used obstructive sleep apnea screen before surgery and in primary care. Answer each item honestly — it helps decide whether a sleep study may be worth discussing, not a diagnosis.</Prosa>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">STOP</div>
        <div className="mt-3 space-y-2">
          {ITEMS.map((it) => (
            <label key={it.key} className="flex items-start gap-3 rounded-xl border border-neutral-200 px-3.5 py-2.5 dark:border-white/10">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand" checked={!!answers[it.key]} onChange={(e) => setAnswers((a) => ({ ...a, [it.key]: e.target.checked }))} />
              <span className="text-sm text-neutral-700 dark:text-neutral-200"><b className="text-brand-dark">{it.letter}</b> — {it.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">BANG</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="B — BMI (kg/m²)">
            <input className={inputClass} type="number" step="0.1" value={bmiText} onChange={(e) => setBmi(e.target.value)} placeholder="e.g. 24.5" />
          </Field>
          <Field label="A — Age (years)">
            <input className={inputClass} type="number" value={ageText} onChange={(e) => setAge(e.target.value)} />
          </Field>
          <Field label="N — Neck circumference (cm)">
            <input className={inputClass} type="number" value={neckText} onChange={(e) => setNeckCm(e.target.value)} placeholder="measure around the neck" />
          </Field>
          <Field label="G — Gender">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F' | '')}>
              <option value="">Not answered</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
        </div>
        {hasil.invalid.length > 0 && (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-red-600">{hasil.invalid.join('; ')}.</p>
        )}
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Result</div>
        {lengkap && band !== null ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{total}/8</span>
              <div>
                <Badge tone={band.tone}>{band.label}</Badge>
                <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{band.desc}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-neutral-500">
              <span>STOP: {hasil.stopScore}/4</span>
              <span>BANG: {hasil.bangScore}/4</span>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No score yet. {belum.length > 0 ? `Still needed: ${belum.join(', ')}.` : 'Check the highlighted values above.'}
            {' '}The four STOP questions above are already answered — unticked means no, worth zero. Sex is different:
            it carries a BANG point on its own, and an unanswered profile used to default to male, quietly handing
            everyone that point.
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Chung, F., et al. (2008). STOP questionnaire: a tool to screen patients for obstructive sleep
        apnea. <i>Anesthesiology</i>, 108(5), 812-821. Screening tool only — a positive result warrants
        clinical evaluation and, if indicated, a sleep study; it does not diagnose OSA on its own.
      </div>
    </div>
  )
}

export default SleepApneaScreen
