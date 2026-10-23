import { useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconActivity } from '../../../components/icons'
import { getDemoTersimpan } from '../../../lib/profile'
import { CopyNote } from '../../../components/CopyNote'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { glasgowBlatchford, parseNumberField } from '../../../domains/clinical-calculators'

// ─────────────────────────────────────────────────────────────────────────────
// Glasgow-Blatchford Score (GBS) — Blatchford, O., et al. (2000), Lancet,
// 356(9238):1318-1323. Pre-endoscopy risk stratification for upper GI
// bleeding — a score of 0 identifies patients low-risk enough that some
// guidelines support outpatient management without admission. Pure checklist
// scoring, no external API. BUN cutoffs below use mg/dL (US units); original
// UK study used mmol/L urea (≈ mg/dL / 2.8).
// ─────────────────────────────────────────────────────────────────────────────

export function GlasgowBlatchfordScore() {
  // Ini yang paling tajam di antara semuanya.
  //
  // Nilai awalnya -- ureum 15, Hb 14 pada laki-laki, TD sistolik 120 --
  // ketiganya bernilai NOL poin. Skor nol pada Glasgow-Blatchford bukan
  // sekadar "rendah": ia ambang yang dipakai sebagian panduan untuk
  // MEMULANGKAN pasien perdarahan saluran cerna atas tanpa rawat inap dan
  // tanpa endoskopi. Halaman ini dahulu menampilkan kesimpulan itu, beserta
  // kalimat siap salin, sebelum seorang pun memasukkan apa pun.
  //
  // Kotak centangnya (melena, sinkop, gagal jantung, penyakit hati) tetap
  // seperti semula: tidak dicentang berarti "tidak ada", dan itu jawaban.
  // Yang dihapus hanya ketiga pengukurannya.
  // Teks mentah: kolom kosong = NaN ("belum diisi"), bukan 0.
  const [bun, setBun] = useState('')
  const [hgb, setHgb] = useState('')
  const [sex, setSex] = useState<'M' | 'F'>(() => (getDemoTersimpan().sex === 'F' ? 'F' : 'M'))
  const [sbp, setSbp] = useState('')
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setFlags((c) => ({ ...c, [key]: !c[key] }))

  const hasil = glasgowBlatchford({ bun: parseNumberField(bun), hgb: parseNumberField(hgb), sbp: parseNumberField(sbp), sex, flags })
  const belum = hasil.missing
  const lengkap = hasil.score !== null
  const score = hasil.score ?? 0
  const lowRisk = lengkap && score === 0

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Glasgow-Blatchford Score" subtitle="Pre-endoscopy upper GI bleed risk (Blatchford et al. 2000)" />
        <BatasKlaimSkorTerbit />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Calculated before endoscopy, from clinical and laboratory data alone. A score of 0 marks patients low-risk enough that some guidelines support outpatient management without admission or urgent endoscopy.</Prosa>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="BUN (mg/dL)">
            <input className={inputClass} type="number" min={0} value={bun} onChange={(e) => setBun(e.target.value)} />
          </Field>
          <Field label="Hemoglobin (g/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={hgb} onChange={(e) => setHgb(e.target.value)} />
          </Field>
          <Field label="Sex">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
          <Field label="Systolic BP (mmHg)">
            <input className={inputClass} type="number" min={0} value={sbp} onChange={(e) => setSbp(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Other findings</div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
            <input type="checkbox" className="h-4 w-4 rounded" checked={!!flags.hr} onChange={() => toggle('hr')} />
            Heart rate ≥ 100 bpm
          </label>
          <label className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
            <input type="checkbox" className="h-4 w-4 rounded" checked={!!flags.melena} onChange={() => toggle('melena')} />
            Melena present
          </label>
          <label className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
            <input type="checkbox" className="h-4 w-4 rounded" checked={!!flags.syncope} onChange={() => toggle('syncope')} />
            Syncope
          </label>
          <label className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
            <input type="checkbox" className="h-4 w-4 rounded" checked={!!flags.hepatic} onChange={() => toggle('hepatic')} />
            Known hepatic disease (history or exam)
          </label>
          <label className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-ink dark:bg-white/5 dark:text-white">
            <input type="checkbox" className="h-4 w-4 rounded" checked={!!flags.cardiac} onChange={() => toggle('cardiac')} />
            Known cardiac failure (history or exam)
          </label>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Glasgow-Blatchford Score</div>
        {hasil.invalid.length > 0 && (
          <p role="alert" className="mt-2 text-[12.5px] font-semibold text-red-600">{hasil.invalid.join('; ')}.</p>
        )}
        {lengkap ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-dark">{score}</span>
              <Badge tone={lowRisk ? 'brand' : score <= 5 ? 'low' : 'critical'}>
                {lowRisk ? 'Very low risk' : score <= 5 ? 'Low-moderate risk' : 'High risk'}
              </Badge>
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">
              {lowRisk
                ? 'Score of 0: some guidelines support safe outpatient management without hospital admission.'
                : 'A score ≥1 generally warrants admission and inpatient endoscopy per most guidelines; higher scores correlate with need for transfusion, endoscopic intervention, or surgery.'}
            </p>
            <CopyNote text={`Glasgow-Blatchford ${score} (BUN ${bun}, Hgb ${hgb} ${sex}, SBP ${sbp}) — ${lowRisk ? 'very low risk: outpatient management may be appropriate' : 'admission and inpatient endoscopy warranted'} [Blatchford 2000]`} />
          </>
        ) : hasil.invalid.length > 0 ? null : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            No score yet. Still needed: {belum.join(', ')}.
            {' '}A score of zero here is not a mild result — it is the threshold some guidelines use to send a patient
            with an upper GI bleed home without endoscopy. Blood urea 15, haemoglobin 14 and a systolic of 120 each
            score zero, so leaving them in place would have shown exactly that conclusion for a patient nobody
            has worked up.
          </p>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Blatchford, O., et al. (2000). A risk score to predict need for treatment for upper-
        gastrointestinal haemorrhage. <i>Lancet</i>, 356(9238), 1318-1323. Decision-support estimate —
        clinical judgment and local protocols should guide final admission decisions.
      </div>
    </div>
  )
}

export default GlasgowBlatchfordScore
