import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'
import { CopyNote } from '../components/CopyNote'
import { ScoreTrend } from '../components/ScoreTrend'

// ─────────────────────────────────────────────────────────────────────────────
// Maddrey's Discriminant Function — Maddrey, W.C., et al. (1978),
// Gastroenterology, 75(2):193-199. Identifies severe alcoholic hepatitis and
// is the classic trigger for the "start corticosteroids or not" decision —
// the actual clinical fork MELD-Na and Child-Pugh (elsewhere in this app)
// don't directly answer. Formula uses the PT in seconds above the lab's
// control value, not an INR-derived estimate, since that's how it was
// originally validated and is still used at the bedside.
//   DF = 4.6 × (patient PT − control PT) + total bilirubin (mg/dL)
// Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

export function MaddreyScore() {
  const [bilirubin, setBilirubin] = useState(8.0)
  const [patientPt, setPatientPt] = useState(22)
  const [controlPt, setControlPt] = useState(12)

  const ptDiff = patientPt - controlPt
  const df = 4.6 * ptDiff + bilirubin
  const severe = df >= 32

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Maddrey's Discriminant Function" subtitle="Severe alcoholic hepatitis — the corticosteroid decision (Maddrey et al. 1978)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          The classic bedside trigger for considering corticosteroid therapy in alcoholic hepatitis —
          a distinct clinical fork from MELD-Na or Child-Pugh. Uses prothrombin time in seconds above
          your lab's control value, exactly as originally validated.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Total bilirubin (mg/dL)">
            <input className={inputClass} type="number" step="0.1" min={0} value={bilirubin || ''} onChange={(e) => setBilirubin(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Patient PT (seconds)">
            <input className={inputClass} type="number" step="0.1" min={0} value={patientPt || ''} onChange={(e) => setPatientPt(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Control PT (seconds)">
            <input className={inputClass} type="number" step="0.1" min={0} value={controlPt || ''} onChange={(e) => setControlPt(Number(e.target.value) || 0)} />
          </Field>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Discriminant Function</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-brand-dark">{df.toFixed(1)}</span>
          <Badge tone={severe ? 'critical' : 'brand'}>{severe ? 'Severe (≥32)' : 'Not severe (<32)'}</Badge>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
          {severe
            ? 'DF ≥32 indicates severe alcoholic hepatitis, historically associated with ~30-50% 30-day mortality untreated — corticosteroids (e.g. prednisolone) are commonly considered, weighed against infection risk and contraindications (active GI bleed, sepsis, renal failure).'
            : 'DF <32 suggests milder disease where corticosteroids have not shown clear benefit — supportive care and alcohol cessation support remain the priority.'}
        </p>
        <p className="mt-2 text-[11px] text-neutral-400">PT − control: {ptDiff.toFixed(1)} seconds.</p>
        <CopyNote text={`Maddrey DF ${df.toFixed(1)} (bilirubin ${bilirubin} mg/dL, PT ${patientPt}s vs control ${controlPt}s) — ${severe ? 'severe alcoholic hepatitis (≥32)' : 'not severe (<32)'} [Maddrey 1978]`} />
      </Card>

      <ScoreTrend
        storageKey="pmd_maddrey_trend_v1"
        scoreName="Maddrey DF"
        total={Math.round(df)}
        maxScore={100}
        detail={`Bili ${bilirubin}, PT ${patientPt}s (control ${controlPt}s)`}
      />

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Maddrey, W.C., et al. (1978). Corticosteroid therapy of alcoholic hepatitis. <i>Gastroenterology</i>,
        75(2), 193-199. Decision-support estimate — the corticosteroid decision should weigh
        infection screening (Lille score response at day 7 is often used to guide continuation) and
        contraindications; discuss with a hepatologist.
      </div>
    </div>
  )
}

export default MaddreyScore
