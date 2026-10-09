import { useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { getDemoTersimpan } from '../../../lib/profile'
import { CopyNote } from '../../../components/CopyNote'
import { BatasKlaimKesehatan } from '../../../components/BatasKlaimKesehatan'
import { findrisc as hitungFindrisc, parseNumberField } from '../../../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// FINDRISC — Finnish Diabetes Risk Score. Lindström, J. & Tuomilehto, J.
// (2003), Diabetes Care, 26(3):725-731. Predicts 10-year risk of developing
// type 2 diabetes from 8 questions and NO blood tests — one of the most
// widely used, validated diabetes-prevention screening tools worldwide.
// Pure checklist scoring, no external API.
// ─────────────────────────────────────────────────────────────────────────────

export function Findrisc() {
  // Usia 45, IMT 24 dan lingkar pinggang 90 adalah tiga PENGUKURAN, bukan
  // jawaban -- dan ketiganya dahulu terisi sendiri, sehingga halaman ini
  // terbuka dengan sebuah persentase risiko diabetes 10 tahun untuk orang
  // yang belum mengukur apa pun. IMT lebih halus lagi: ia dihitung dari
  // berat dan tinggi sulih getDemo(), lalu tampil sebagai angka desimal yang
  // terlihat seperti hasil pengukuran.
  //
  // "Cukup bergerak" dan "makan sayur tiap hari" TETAP bernilai awal benar:
  // keduanya pertanyaan ya/tidak yang jawabannya bernilai nol poin, sama
  // seperti kotak centang yang tidak dicentang.
  const demo = getDemoTersimpan()
  // Teks mentah: kolom kosong = NaN ("belum diisi"), bukan 0.
  const [ageText, setAge] = useState(demo.age && demo.age > 0 ? String(demo.age) : '')
  const [bmiText, setBmi] = useState(() => {
    const w = demo.weightKg, h = demo.heightCm
    return w && w > 0 && h && h > 0 ? (w / ((h / 100) ** 2)).toFixed(1) : ''
  })
  const [waistText, setWaist] = useState('')
  const [sex, setSex] = useState<'M' | 'F'>(demo.sex === 'F' ? 'F' : 'M')
  const [active, setActive] = useState(true)
  const [veg, setVeg] = useState(true)
  const [bpMed, setBpMed] = useState(false)
  const [highGlucose, setHighGlucose] = useState(false)
  const [family, setFamily] = useState<0 | 3 | 5>(0)

  const hasil = hitungFindrisc({
    age: parseNumberField(ageText), bmi: parseNumberField(bmiText), waist: parseNumberField(waistText),
    sex, active, veg, bpMed, highGlucose, family,
  })
  const belum = hasil.missing
  const lengkap = hasil.score !== null
  const score = hasil.score ?? 0
  const result = hasil.band

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Diabetes Risk (FINDRISC)" subtitle="Published 10-year type-2 diabetes screen — no blood test (Lindström & Tuomilehto 2003)" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Eight short questions estimate your 10-year type-2 diabetes risk without a blood test — a prevention screen, not a diagnosis.</Prosa>
        <BatasKlaimKesehatan permukaan="screening.findrisc" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Age (years)">
            <input className={inputClass} type="number" value={ageText} onChange={(e) => setAge(e.target.value)} />
          </Field>
          <Field label="Sex">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
          <Field label="BMI (kg/m²)">
            <input className={inputClass} type="number" step="0.1" value={bmiText} onChange={(e) => setBmi(e.target.value)} />
          </Field>
          <Field label="Waist circumference (cm)">
            <input className={inputClass} type="number" value={waistText} onChange={(e) => setWaist(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={active} onChange={(e) => setActive(e.target.checked)} /> I get ≥30 min of physical activity most days
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={veg} onChange={(e) => setVeg(e.target.checked)} /> I eat vegetables/fruit every day
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={bpMed} onChange={(e) => setBpMed(e.target.checked)} /> I take blood-pressure medication
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" className="h-4 w-4 rounded" checked={highGlucose} onChange={(e) => setHighGlucose(e.target.checked)} /> I've had high blood glucose before (e.g. in pregnancy or a check-up)
          </label>
          <Field label="Family history of diabetes">
            <select className={inputClass} value={family} onChange={(e) => setFamily(Number(e.target.value) as 0 | 3 | 5)}>
              <option value={0}>None</option>
              <option value={3}>Grandparent, aunt/uncle, or cousin</option>
              <option value={5}>Parent, sibling, or own child</option>
            </select>
          </Field>
        </div>
        {hasil.invalid.length > 0 && (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-red-600">{hasil.invalid.join('; ')}.</p>
        )}
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">FINDRISC Score</div>
        {lengkap && result !== null ? (
          <>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{score} / 26</span>
          <Badge tone={result.tone}>{result.label} risk</Badge>
        </div>
        <p className="mt-2 text-[12px] text-neutral-500">{result.risk}.</p>
        {score >= 12 && (
          <Prosa kelas="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">Skor ≥12 layak ditindaklanjuti — tanyakan kepada tenaga medis tentang pemeriksaan glukosa puasa atau HbA1c; pengungkit terbesarnya adalah penurunan berat badan, gerak harian, dan mengurangi karbohidrat olahan (uji Finlandia &amp; DPP menurunkan perkembangan menjadi diabetes sekitar 58% lewat perubahan gaya hidup).</Prosa>
        )}
        <CopyNote text={`FINDRISC ${score}/26 — ${result.label.toLowerCase()} 10-year type-2 diabetes risk (${result.risk}) [Lindström & Tuomilehto 2003]`} />
          </>
        ) : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No score yet. {belum.length > 0 ? `Still needed: ${belum.join(', ')}.` : 'Check the highlighted values above.'}
            {' '}The lifestyle questions above are already answered and worth zero points, but age, BMI and waist are
            measurements — filling them in would produce a ten-year diabetes percentage for a body nobody measured.
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Lindström, J. &amp; Tuomilehto, J. (2003). The Diabetes Risk Score. <i>Diabetes Care</i>, 26(3),
        725-731. Decision-support screen — a raised score is a prompt for prevention and testing, not
        a diagnosis.
      </div>
    </div>
  )
}

export default Findrisc
