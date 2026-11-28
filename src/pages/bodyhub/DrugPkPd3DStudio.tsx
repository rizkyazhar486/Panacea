import { useEffect, useMemo, useState } from 'react'
import {
  BUNDLED_RDKIT_DRUGS,
  PKPD_STUDIO_BOUNDARY,
  resolveDrugForMechanism,
  simulateMultiDosePkPd,
} from '../../domains/body-exposure/engine/pkPdCompartmentEngine'
import { DrugMolecule3DViewer, type DrugMoleculeMeta, type DrugRenderMode } from './DrugMolecule3DViewer'

export default function DrugPkPd3DStudio({ selectedMechanismId }: { selectedMechanismId?: string | null }) {
  const initialDrug = useMemo(() => resolveDrugForMechanism(selectedMechanismId), [selectedMechanismId])
  const [slug, setSlug] = useState<string>(initialDrug.slug)
  const [mode, setMode] = useState<DrugRenderMode>('ball-and-stick')
  const [meta, setMeta] = useState<DrugMoleculeMeta | null>(null)
  const [doseMultiplier, setDoseMultiplier] = useState<number>(1.0)
  const [intervalHours, setIntervalHours] = useState<number>(initialDrug.intervalHours)
  const [renalClFactor, setRenalClFactor] = useState<number>(1.0)

  useEffect(() => {
    setSlug(initialDrug.slug)
    setIntervalHours(initialDrug.intervalHours)
    setDoseMultiplier(1.0)
  }, [initialDrug])

  const drug = useMemo(
    () => BUNDLED_RDKIT_DRUGS.find((d) => d.slug === slug) ?? BUNDLED_RDKIT_DRUGS[0]!,
    [slug],
  )
  const doseMg = Math.round(drug.defaultDoseMg * doseMultiplier * 10) / 10
  const sim = useMemo(
    () => simulateMultiDosePkPd({ drug, doseMg, intervalHours, renalClFactor, totalHours: 72, stepHours: 0.5 }),
    [drug, doseMg, intervalHours, renalClFactor],
  )

  const maxY = Math.max(drug.mtcMgL * 1.15, sim.peakMgL * 1.12, 1e-4)
  const concLine = useMemo(
    () => sim.points.map((p, i) => `${((i / Math.max(1, sim.points.length - 1)) * 240).toFixed(1)},${(74 - (p.concMgL / maxY) * 66).toFixed(1)}`).join(' '),
    [sim.points, maxY],
  )
  const effLine = useMemo(
    () => sim.points.map((p, i) => `${((i / Math.max(1, sim.points.length - 1)) * 240).toFixed(1)},${(74 - (p.effectPct / 100) * 66).toFixed(1)}`).join(' '),
    [sim.points],
  )
  const mecY = 74 - (drug.mecMgL / maxY) * 66
  const mtcY = 74 - (drug.mtcMgL / maxY) * 66

  return (
    <section
      data-drug-pkpd-studio="v1"
      data-clinical-prescribing-authorized="false"
      aria-label="34 RDKit 3D Drug Conformers and Bateman Multi-Dose PK-PD Studio"
      className="dark space-y-3 rounded-2xl border border-fuchsia-400/25 bg-slate-950 p-3.5 text-slate-100 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-fuchsia-300">
            34 RDKit ETKDG v3 / MMFF94 3D Drugs · Bateman Multi-Dose PK &amp; Hill Emax PD
          </p>
          <p className="text-xs text-slate-300">
            {drug.name} ({drug.drugClass}) · Target: {drug.target}
          </p>
        </div>
        <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-200">
          {PKPD_STUDIO_BOUNDARY.truthClass}
        </span>
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Choose bundled 3D drug conformer">
        {BUNDLED_RDKIT_DRUGS.map((item) => (
          <button
            key={item.slug}
            type="button"
            aria-pressed={item.slug === drug.slug}
            onClick={() => {
              setSlug(item.slug)
              setIntervalHours(item.intervalHours)
              setDoseMultiplier(1.0)
              setMeta(null)
            }}
            className={`min-h-9 shrink-0 rounded-full border px-3 text-xs font-bold transition ${
              item.slug === drug.slug
                ? 'border-fuchsia-300/75 bg-fuchsia-500/25 text-white'
                : 'border-white/12 bg-white/[.04] text-slate-300 hover:text-white'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="relative h-64 overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_45%,rgba(232,121,249,.11),transparent_65%)] lg:col-span-5">
          <DrugMolecule3DViewer slug={drug.slug} label={drug.name} mode={mode} onMeta={setMeta} />
          <div className="pointer-events-none absolute left-2.5 top-2 rounded-full bg-black/60 px-2.5 py-0.5 font-mono text-[10px] font-bold text-fuchsia-200 backdrop-blur-md">
            {drug.name}{meta ? ` · ${meta.formula} (${meta.atomCount}a/${meta.bondCount}b)` : ''}
          </div>
          <div className="absolute bottom-2 right-2 flex gap-1" role="group" aria-label="Drug 3D representation">
            {([
              ['ball-and-stick', 'Ball & stick'],
              ['space-filling', 'vdW'],
              ['polarity-shell', 'Polarity'],
            ] as const).map(([m, lbl]) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-7 rounded-full border px-2 text-[9px] font-black backdrop-blur-md ${
                  mode === m ? 'border-fuchsia-300 bg-fuchsia-500/25 text-white' : 'border-white/15 bg-black/55 text-white/65 hover:text-white'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/35 p-3 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
            <span className="font-bold text-cyan-200">72h Plasma C(t) vs Therapeutic Window &amp; Hill Emax %</span>
            <span className={sim.supraToxicFlag ? 'font-black text-rose-300' : 'font-bold text-emerald-300'}>
              {sim.supraToxicFlag ? 'ABOVE MTC THRESHOLD' : `In Window ${sim.timeInTherapeuticWindowPct}%`}
            </span>
          </div>

          <svg viewBox="0 0 240 80" className="h-24 w-full rounded-xl bg-slate-950/90 p-1" role="img" aria-label="72-hour Bateman PK concentration and Hill Emax curve">
            <rect x="0" y={Math.max(2, mtcY)} width="240" height={Math.max(2, mecY - mtcY)} fill="rgba(16,185,129,0.12)" />
            <line x1="0" y1={mtcY} x2="240" y2={mtcY} stroke="#fb7185" strokeWidth="0.9" strokeDasharray="3 2" />
            <line x1="0" y1={mecY} x2="240" y2={mecY} stroke="#34d399" strokeWidth="0.9" strokeDasharray="3 2" />
            <polyline fill="none" stroke="#e879f9" strokeWidth="1.3" strokeOpacity="0.65" points={effLine} />
            <polyline fill="none" stroke="#38bdf8" strokeWidth="1.9" points={concLine} />
          </svg>

          <div className="grid gap-2 font-mono text-[10px] sm:grid-cols-3">
            <label className="block">
              <span className="flex justify-between"><span>Dose</span><strong>{doseMg} mg</strong></span>
              <input type="range" min={0.25} max={2.5} step={0.25} value={doseMultiplier} onChange={(e) => setDoseMultiplier(Number(e.target.value))} className="w-full accent-cyan-400" />
            </label>
            <label className="block">
              <span className="flex justify-between"><span>Interval</span><strong>q{intervalHours}h</strong></span>
              <input type="range" min={4} max={24} step={2} value={intervalHours} onChange={(e) => setIntervalHours(Number(e.target.value))} className="w-full accent-cyan-400" />
            </label>
            <label className="block">
              <span className="flex justify-between"><span>Renal Cl (eGFR)</span><strong>{Math.round(renalClFactor * 100)}%</strong></span>
              <input type="range" min={0.2} max={1.5} step={0.05} value={renalClFactor} onChange={(e) => setRenalClFactor(Number(e.target.value))} className="w-full accent-fuchsia-400" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] sm:grid-cols-4">
            <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Eff. t½</span><div className="font-black text-white">{sim.effectiveHalfLifeHours} h</div></div>
            <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Peak Cmax</span><div className="font-black text-cyan-200">{sim.peakMgL} mg/L</div></div>
            <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">72h Trough</span><div className="font-black text-white">{sim.troughLastMgL} mg/L</div></div>
            <div className="rounded-lg bg-white/5 p-1.5"><span className="text-slate-400">Hill Emax</span><div className="font-black text-fuchsia-200">{sim.meanEffectLastIntervalPct}%</div></div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400">{PKPD_STUDIO_BOUNDARY.note}</p>
    </section>
  )
}
