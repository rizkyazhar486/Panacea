import { useEffect, useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  BODY_DRUG_MECHANISM_BOUNDARY,
  BODY_DRUG_MECHANISM_NETWORK,
  getBodyDrugMechanism,
  listBodyDrugMechanismsForAtlasSystem,
  type DrugMechanismId,
  type DrugMechanismStepKind,
} from '../../lib/bodyDrugMechanismNetwork'
import { getBodyPathophysiologyScenario } from '../../lib/bodyPathophysiologyNetwork'
import { getWholeBodySystem } from '../../lib/wholeBodyPhysiologyOS'

const STEP_LABEL: Record<DrugMechanismStepKind, string> = {
  'molecular-target': 'Molecular target',
  pathway: 'Pathway',
  'physiologic-effect': 'Physiologic effect',
  'disease-context': 'Disease context',
}

const STEP_CLASS: Record<DrugMechanismStepKind, string> = {
  'molecular-target': 'border-cyan-300/15 bg-cyan-300/[.045]',
  pathway: 'border-violet-300/15 bg-violet-300/[.045]',
  'physiologic-effect': 'border-emerald-300/15 bg-emerald-300/[.045]',
  'disease-context': 'border-amber-300/15 bg-amber-300/[.045]',
}

interface DrugMechanismNetworkPanelProps {
  selectedAtlasSystemId?: BodySystemId
}

export default function DrugMechanismNetworkPanel({ selectedAtlasSystemId }: DrugMechanismNetworkPanelProps) {
  const related = useMemo(
    () => selectedAtlasSystemId ? listBodyDrugMechanismsForAtlasSystem(selectedAtlasSystemId) : BODY_DRUG_MECHANISM_NETWORK,
    [selectedAtlasSystemId],
  )
  const visible = related.length > 0 ? related : BODY_DRUG_MECHANISM_NETWORK
  const [drugId, setDrugId] = useState<DrugMechanismId>(visible[0]?.id ?? 'atorvastatin')

  useEffect(() => {
    if (!visible.some((item) => item.id === drugId)) setDrugId(visible[0].id)
  }, [visible, drugId])

  const drug = getBodyDrugMechanism(drugId)
  const directlyRelated = !selectedAtlasSystemId || drug.atlasSystemIds.includes(selectedAtlasSystemId)

  return (
    <section data-body-drug-mechanism-network="v1" data-drug-mechanism={drug.id} className="overflow-hidden rounded-[28px] border border-white/[.09] bg-[linear-gradient(145deg,rgba(34,211,238,.04),rgba(2,6,12,.95)_42%,rgba(16,185,129,.045))] text-white shadow-[0_24px_80px_rgba(0,0,0,.26)]">
      <div className="relative overflow-hidden border-b border-white/[.08] p-4 sm:p-5">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,.11),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,.09),transparent_28%)]" />
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-emerald-200/80">Body Exposure · drug mechanism network</div>
            <h3 className="mt-1.5 text-lg font-black tracking-[-.02em] sm:text-xl">Target → pathway → physiology → disease context</h3>
            <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/45 sm:text-[11px]">Four representative drug mechanisms are traced from official DailyMed mechanism-of-action sections into the same whole-body physiology and pathophysiology graph. No dosing or prescribing logic is included.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em]">
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.055] px-2.5 py-1 text-emerald-100/75">4 representative agents</span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.05] px-2.5 py-1 text-cyan-100/75">DailyMed anchored</span>
            <span className="rounded-full border border-amber-300/15 bg-amber-300/[.05] px-2.5 py-1 text-amber-100/75">no prescribing</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {selectedAtlasSystemId && related.length > 0 && (
          <div className="mb-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[.035] px-3 py-2 text-[9px] leading-relaxed text-cyan-50/55">
            Showing drug mechanisms explicitly mapped to the selected atlas system. <span className="font-black text-cyan-100/80">{related.length} of {BODY_DRUG_MECHANISM_NETWORK.length}</span> representative mechanisms are directly connected.
          </div>
        )}

        {selectedAtlasSystemId && related.length === 0 && (
          <div className="mb-3 rounded-2xl border border-amber-300/10 bg-amber-300/[.035] px-3 py-2 text-[9px] leading-relaxed text-amber-50/55">
            No representative drug mechanism in this initial wave is directly mapped to the selected atlas system. The full mechanism set is shown without inventing a connection.
          </div>
        )}

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Drug mechanisms">
          {visible.map((item) => {
            const active = item.id === drug.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDrugId(item.id)}
                className={`min-h-10 shrink-0 rounded-full border px-3 text-[9px] font-black transition ${active ? 'border-emerald-300/30 bg-emerald-300/[.11] text-white' : 'border-white/[.07] bg-white/[.025] text-white/45 hover:bg-white/[.05] hover:text-white/75'}`}
              >
                {item.genericName}
              </button>
            )
          })}
        </div>

        {!directlyRelated && selectedAtlasSystemId && (
          <div className="mt-2 text-[9px] text-amber-100/55">This mechanism is not directly linked to the selected atlas system; its card remains visible only because this system has no mechanism entry in the initial wave.</div>
        )}

        <div className="mt-3 grid gap-3 2xl:grid-cols-[minmax(0,1.22fr)_minmax(330px,.78fr)]">
          <div className="space-y-3">
            <article className="rounded-[22px] border border-white/[.08] bg-white/[.025] p-3.5 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-emerald-200/65">Representative mechanism</div>
                  <h4 className="mt-1 text-base font-black text-white">{drug.genericName} <span className="text-white/35">· {drug.representativeBrand}</span></h4>
                  <div className="mt-1 text-[10px] font-bold text-cyan-100/60">{drug.drugClass}</div>
                  <p className="mt-2 text-[10px] leading-relaxed text-white/45">{drug.targetSummary}</p>
                </div>
                <div className="flex max-w-sm flex-wrap justify-end gap-1.5">
                  {drug.physiologySystemIds.map((id) => (
                    <span key={id} className="rounded-full border border-white/[.07] bg-black/20 px-2 py-1 text-[8px] font-black text-white/50">{getWholeBodySystem(id).shortLabel}</span>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-cyan-300/12 bg-cyan-300/[.035] p-3">
                <div className="text-[8px] font-black uppercase tracking-[.14em] text-cyan-200/60">Pathway notation</div>
                <div className="mt-1 font-mono text-[10px] font-black leading-relaxed text-white/75 sm:text-[11px]">{drug.pathwayNotation}</div>
              </div>
            </article>

            <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Mechanism chain</div>
                  <h4 className="mt-1 text-sm font-black text-white">Follow the pharmacology without prescribing</h4>
                </div>
                <span className="text-[8px] font-bold text-white/25">{drug.mechanism.length} steps</span>
              </div>

              <div className="mt-3 space-y-2">
                {drug.mechanism.map((step, index) => (
                  <div key={step.id} className="grid grid-cols-[30px_minmax(0,1fr)] gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className="grid h-7 w-7 place-items-center rounded-full border border-white/[.09] bg-white/[.04] text-[9px] font-black text-white/60">{index + 1}</div>
                      {index < drug.mechanism.length - 1 && <div aria-hidden className="mt-1 min-h-8 w-px flex-1 bg-gradient-to-b from-white/15 to-white/[.03]" />}
                    </div>
                    <div className={`rounded-[18px] border p-3 ${STEP_CLASS[step.kind]}`}>
                      <div className="text-[8px] font-black uppercase tracking-[.13em] text-white/40">{STEP_LABEL[step.kind]}</div>
                      <div className="mt-1 text-[10px] font-black text-white/82">{step.label}</div>
                      <p className="mt-1.5 text-[9px] leading-relaxed text-white/42">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-3">
            <article className="rounded-[22px] border border-violet-300/10 bg-violet-300/[.025] p-3.5">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Linked pathophysiology</div>
              <div className="mt-2 space-y-2">
                {drug.linkedScenarioIds.map((id) => {
                  const scenario = getBodyPathophysiologyScenario(id)
                  return (
                    <div key={id} className="rounded-2xl border border-white/[.07] bg-black/20 p-3">
                      <div className="text-[9px] font-black text-white/70">{scenario.shortLabel}</div>
                      <p className="mt-1 text-[8px] leading-relaxed text-white/30">{scenario.summary}</p>
                    </div>
                  )
                })}
              </div>
            </article>

            <article className="rounded-[22px] border border-emerald-300/10 bg-emerald-300/[.025] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-emerald-200/65">Official mechanism source</div>
                <span className="rounded-full border border-white/[.07] bg-black/20 px-2 py-1 text-[7px] font-black text-white/35">v{drug.labelSource.version}</span>
              </div>
              <div className="mt-2 rounded-2xl border border-white/[.07] bg-black/20 p-3">
                <div className="text-[9px] font-black leading-snug text-white/70">{drug.labelSource.labelName}</div>
                <div className="mt-1 text-[8px] text-white/35">{drug.labelSource.labeler}</div>
                <div className="mt-2 grid gap-1 text-[8px] text-white/35">
                  <div><span className="font-black text-white/50">Section</span> · {drug.labelSource.sectionTitle}</div>
                  <div><span className="font-black text-white/50">SPL code</span> · {drug.labelSource.sectionCode}</div>
                  <div><span className="font-black text-white/50">Effective</span> · {drug.labelSource.effectiveDate}</div>
                  <div className="break-all"><span className="font-black text-white/50">Set ID</span> · {drug.labelSource.setId}</div>
                </div>
                <a href={drug.labelSource.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-9 items-center rounded-xl border border-emerald-300/15 bg-emerald-300/[.055] px-3 text-[8px] font-black text-emerald-100/70 hover:bg-emerald-300/[.09]">Open DailyMed label ↗</a>
              </div>
            </article>
          </aside>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_1.1fr]">
          <p className="rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3 text-[8px] leading-relaxed text-amber-50/45"><span className="font-black text-amber-100/65">Agent boundary:</span> {drug.educationalNote}</p>
          <p className="rounded-2xl border border-rose-300/10 bg-rose-300/[.025] p-3 text-[8px] leading-relaxed text-rose-50/45"><span className="font-black text-rose-100/65">Network boundary:</span> {BODY_DRUG_MECHANISM_BOUNDARY}</p>
        </div>
      </div>
    </section>
  )
}
