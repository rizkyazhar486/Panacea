import { useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Card, SectionTitle, Field, inputClass, Badge } from '../../../components/ui'
import { IconHeart } from '../../../components/icons'
import { CopyNote } from '../../../components/CopyNote'
import { BatasKlaimSkorTerbit } from '../../../components/BatasKlaimSkorTerbit'
import { ldlFriedewald, parseNumberField } from '../../../domains/clinical-calculators'

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

export function LdlCalculator() {
  // Kolesterol total 200, HDL 50 dan trigliserida 150 memberi LDL 120 --
  // sebuah hasil lipid lengkap dengan pitanya, di layar yang belum menerima
  // satu pun nilai. Ketiganya hasil laboratorium.
  // Teks mentah: kolom kosong = NaN ("belum diisi"), bukan 0.
  const [totalText, setTotalChol] = useState('')
  const [hdlText, setHdl] = useState('')
  const [tgText, setTg] = useState('')

  const totalChol = parseNumberField(totalText)
  const hdl = parseNumberField(hdlText)
  const tg = parseNumberField(tgText)
  const hasil = ldlFriedewald({ totalChol, hdl, tg })
  const belum = hasil.missing
  const lengkap = hasil.complete
  const tgTooHigh = hasil.tgTooHigh === true
  const ldl = hasil.ldl
  const nonHdl = hasil.nonHdl ?? 0
  const band = hasil.band

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="LDL Cholesterol (Friedewald)" subtitle="Calculated LDL + non-HDL cholesterol (Friedewald et al. 1972)" />
        <BatasKlaimSkorTerbit />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Most laboratories report LDL calculated with this formula, not measured directly: LDL = Total − HDL − Triglycerides/5. The TG/5 term estimates VLDL and no longer holds at high triglycerides.</Prosa>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Field label="Total cholesterol (mg/dL)">
            <input className={inputClass} type="number" min={0} value={totalText} onChange={(e) => setTotalChol(e.target.value)} />
          </Field>
          <Field label="HDL (mg/dL)">
            <input className={inputClass} type="number" min={0} value={hdlText} onChange={(e) => setHdl(e.target.value)} />
          </Field>
          <Field label="Triglycerides (mg/dL)">
            <input className={inputClass} type="number" min={0} value={tgText} onChange={(e) => setTg(e.target.value)} />
          </Field>
        </div>
        {hasil.invalid.length > 0 && (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-red-600">{hasil.invalid.join('; ')}.</p>
        )}
        {tgTooHigh && (
          <Prosa kelas="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">Triglycerides ≥400 mg/dL — the Friedewald formula does not apply here. Request a direct LDL measurement (or the Martin-Hopkins calculation); the non-HDL value below remains valid.</Prosa>
        )}
      </Card>

      <Card className="!p-5">
        {!lengkap ? (
          hasil.invalid.length > 0 ? null : <p className="text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            Nothing calculated yet. Still needed: {belum.join(', ')}.
            {' '}All three come off a lipid panel. Total cholesterol 200 with HDL 50 and triglycerides 150 gives an
            LDL of 120 — a complete lipid result, with its band, on a screen that had received no values at all.
          </p>
        ) : (
        <>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Calculated LDL</div>
            {tgTooHigh ? (
              <p className="mt-1 text-[12px] font-semibold text-neutral-500">Not valid at TG ≥400</p>
            ) : ldl === null ? (
              <p className="mt-1 text-[12px] font-semibold text-neutral-500">Not valid: TG/5 is not below total − HDL. Request a direct LDL.</p>
            ) : (
              <>
                <div className="mt-1 text-2xl font-black text-brand-dark">{ldl.toFixed(0)}</div>
                <div className="text-[11px] text-neutral-500">mg/dL</div>
                {band !== null && <Badge tone={band.tone}>{band.label}</Badge>}
              </>
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Non-HDL cholesterol</div>
            <div className="mt-1 text-2xl font-black text-ink dark:text-ink">{nonHdl.toFixed(0)}</div>
            <div className="text-[11px] text-neutral-500">mg/dL</div>
            <p className="mt-1 text-[11px] text-neutral-500">Valid at any TG level; secondary target is usually LDL goal + 30.</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">
          Treatment targets depend on overall cardiovascular risk, not the population bands alone —
          e.g. {'<'}70 mg/dL (or lower) is commonly targeted after a cardiovascular event. Discuss
          individual goals with the treating clinician.
        </p>
        <CopyNote text={tgTooHigh || ldl === null ? `Non-HDL ${nonHdl.toFixed(0)} mg/dL (TC ${totalChol}, HDL ${hdl}; TG ${tg}: Friedewald LDL not valid — direct LDL advised)` : `LDL ${(ldl ?? 0).toFixed(0)} mg/dL by Friedewald (TC ${totalChol}, HDL ${hdl}, TG ${tg}) — ${band ? band.label : ''}; non-HDL ${nonHdl.toFixed(0)} mg/dL [Friedewald 1972]`} />
        </>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Friedewald, W.T., et al. (1972). Estimation of the concentration of LDL cholesterol without
        use of the preparative ultracentrifuge. <i>Clin Chem</i>, 18(6), 499-502. Decision-support
        estimate — classification bands per NCEP ATP III; individual targets are risk-based.
      </div>
    </div>
  )
}

export default LdlCalculator
