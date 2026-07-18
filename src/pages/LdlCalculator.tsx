import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart } from '../components/icons'
import { CopyNote } from '../components/CopyNote'

// ─────────────────────────────────────────────────────────────────────────────
// LDL Cholesterol (calculated) — Friedewald, W.T., et al. (1972), Clin Chem,
// 18(6):499-502:  LDL = Total cholesterol − HDL − Triglycerides/5  (mg/dL)
// The TG/5 term estimates VLDL cholesterol and is INVALID when TG ≥400 mg/dL
// (and increasingly inaccurate above ~200, or at very low LDL) — in those
// cases a direct LDL measurement or the Martin-Hopkins method is preferred.
// Non-HDL cholesterol (Total − HDL) is also shown: it needs no fasting, stays
// valid at high TG, and is an established secondary treatment target.
// Pure arithmetic, no external API.
// ─────────────────────────────────────────────────────────────────────────────

function ldlBand(v: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (v < 100) return { label: 'Optimal (<100)', tone: 'brand' }
  if (v < 130) return { label: 'Near optimal (100-129)', tone: 'brand' }
  if (v < 160) return { label: 'Borderline high (130-159)', tone: 'low' }
  if (v < 190) return { label: 'High (160-189)', tone: 'critical' }
  return { label: 'Very high (≥190)', tone: 'critical' }
}

export function LdlCalculator() {
  const [totalChol, setTotalChol] = useState(200)
  const [hdl, setHdl] = useState(50)
  const [tg, setTg] = useState(150)

  const tgTooHigh = tg >= 400
  const ldl = totalChol - hdl - tg / 5
  const nonHdl = totalChol - hdl
  const band = ldlBand(ldl)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="LDL Cholesterol (Friedewald)" subtitle="Calculated LDL + non-HDL cholesterol (Friedewald et al. 1972)" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Most labs report LDL calculated with this formula rather than measuring it directly:
          LDL = Total − HDL − Triglycerides/5. The TG/5 term estimates VLDL and breaks down at high
          triglycerides.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Field label="Total cholesterol (mg/dL)">
            <input className={inputClass} type="number" min={0} value={totalChol || ''} onChange={(e) => setTotalChol(Number(e.target.value) || 0)} />
          </Field>
          <Field label="HDL (mg/dL)">
            <input className={inputClass} type="number" min={0} value={hdl || ''} onChange={(e) => setHdl(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Triglycerides (mg/dL)">
            <input className={inputClass} type="number" min={0} value={tg || ''} onChange={(e) => setTg(Number(e.target.value) || 0)} />
          </Field>
        </div>
        {tgTooHigh && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Triglycerides ≥400 mg/dL — the Friedewald formula is not valid here. Request a direct LDL
            measurement (or Martin-Hopkins calculation); the non-HDL value below remains valid.
          </p>
        )}
      </Card>

      <Card className="!p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Calculated LDL</div>
            {tgTooHigh ? (
              <p className="mt-1 text-[12px] font-semibold text-neutral-400">Not valid at TG ≥400</p>
            ) : (
              <>
                <div className="mt-1 text-2xl font-black text-brand-dark">{ldl.toFixed(0)}</div>
                <div className="text-[11px] text-neutral-400">mg/dL</div>
                <Badge tone={band.tone}>{band.label}</Badge>
              </>
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Non-HDL cholesterol</div>
            <div className="mt-1 text-2xl font-black text-ink dark:text-white">{nonHdl.toFixed(0)}</div>
            <div className="text-[11px] text-neutral-400">mg/dL</div>
            <p className="mt-1 text-[11px] text-neutral-400">Valid at any TG level; secondary target is usually LDL goal + 30.</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">
          Treatment targets depend on overall cardiovascular risk, not the population bands alone —
          e.g. {'<'}70 mg/dL (or lower) is commonly targeted after a cardiovascular event. Discuss
          individual goals with the treating clinician.
        </p>
        <CopyNote text={tgTooHigh ? `Non-HDL ${nonHdl.toFixed(0)} mg/dL (TC ${totalChol}, HDL ${hdl}; TG ${tg} >=400 so Friedewald LDL not valid — direct LDL advised)` : `LDL ${ldl.toFixed(0)} mg/dL by Friedewald (TC ${totalChol}, HDL ${hdl}, TG ${tg}) — ${band.label}; non-HDL ${nonHdl.toFixed(0)} mg/dL [Friedewald 1972]`} />
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Friedewald, W.T., et al. (1972). Estimation of the concentration of LDL cholesterol without
        use of the preparative ultracentrifuge. <i>Clin Chem</i>, 18(6), 499-502. Decision-support
        estimate — classification bands per NCEP ATP III; individual targets are risk-based.
      </div>
    </div>
  )
}

export default LdlCalculator
