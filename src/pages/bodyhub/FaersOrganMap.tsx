import { useMemo, useState } from 'react'

type DrugKey = 'metformin' | 'atorvastatin'
type OrganKey = 'gastrointestinal' | 'metabolic' | 'renal' | 'respiratory' | 'neurologic' | 'systemic'
type Reaction = { term: string; count: number; organ: OrganKey }

const DATA: Record<DrugKey, { label: string; source: string; reactions: Reaction[] }> = {
  metformin: { label: 'Metformin', source: 'openFDA FAERS · updated 2026-07-30', reactions: [
    { term: 'NAUSEA', count: 30192, organ: 'gastrointestinal' }, { term: 'DIARRHOEA', count: 28014, organ: 'gastrointestinal' }, { term: 'BLOOD GLUCOSE INCREASED', count: 27174, organ: 'metabolic' }, { term: 'FATIGUE', count: 21323, organ: 'systemic' }, { term: 'LACTIC ACIDOSIS', count: 20130, organ: 'metabolic' }, { term: 'VOMITING', count: 19624, organ: 'gastrointestinal' }, { term: 'ACUTE KIDNEY INJURY', count: 18364, organ: 'renal' }, { term: 'WEIGHT DECREASED', count: 17303, organ: 'metabolic' }, { term: 'DYSPNOEA', count: 16774, organ: 'respiratory' }, { term: 'DIZZINESS', count: 15727, organ: 'neurologic' },
  ] },
  atorvastatin: { label: 'Atorvastatin', source: 'openFDA FAERS · updated 2026-07-30', reactions: [
    { term: 'FATIGUE', count: 20167, organ: 'systemic' }, { term: 'DIARRHOEA', count: 18214, organ: 'gastrointestinal' }, { term: 'DYSPNOEA', count: 16895, organ: 'respiratory' }, { term: 'NAUSEA', count: 16885, organ: 'gastrointestinal' }, { term: 'DIZZINESS', count: 13948, organ: 'neurologic' }, { term: 'HEADACHE', count: 12523, organ: 'neurologic' }, { term: 'ACUTE KIDNEY INJURY', count: 11350, organ: 'renal' }, { term: 'ASTHENIA', count: 11350, organ: 'systemic' }, { term: 'PAIN', count: 11293, organ: 'systemic' },
  ] },
}

const META: Record<OrganKey, string> = { gastrointestinal: 'GI', metabolic: 'Metabolic', renal: 'Renal', respiratory: 'Respiratory', neurologic: 'Neuro', systemic: 'Systemic' }

export function FaersOrganMap() {
  const [drug, setDrug] = useState<DrugKey>('metformin')
  const [organ, setOrgan] = useState<OrganKey>('gastrointestinal')
  const current = DATA[drug]
  const grouped = useMemo(() => {
    const out = { gastrointestinal: 0, metabolic: 0, renal: 0, respiratory: 0, neurologic: 0, systemic: 0 } as Record<OrganKey, number>
    current.reactions.forEach((r) => { out[r.organ] += r.count })
    return out
  }, [current])
  const max = Math.max(...Object.values(grouped), 1)
  const selected = current.reactions.filter((r) => r.organ === organ)
  return <section className="rounded-[28px] border border-emerald-300/20 bg-gradient-to-br from-emerald-50/70 via-white to-white p-3 shadow-sm dark:from-emerald-300/[.06] dark:via-[#07100c] dark:to-[#090c0b] sm:p-4" data-faers-organ-map="v1">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">FDA adverse-event reports · organ lens</div><h3 className="mt-1 text-base font-black text-ink dark:text-white">Reported reactions grouped for anatomy learning</h3><p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500">Panacea groups displayed MedDRA terms into teaching systems. This grouping is not an FDA organ classification.</p></div><span className="rounded-full border border-amber-300/40 bg-amber-50 px-2.5 py-1 text-[8px] font-black text-amber-800 dark:bg-amber-300/10 dark:text-amber-200">REPORTS ≠ INCIDENCE · ASSOCIATION ≠ CAUSALITY</span></div>
    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">{(Object.keys(DATA) as DrugKey[]).map((key) => <button key={key} type="button" onClick={() => setDrug(key)} className={`min-h-9 shrink-0 rounded-full border px-3 text-[9px] font-black transition motion-reduce:transition-none ${drug === key ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-200 bg-white/70 text-neutral-500 dark:border-white/10 dark:bg-white/[.03]'}`}>{DATA[key].label}</button>)}</div>
    <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,.85fr)]"><div className="rounded-2xl border border-emerald-300/15 bg-[#06100c] p-3 text-white"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{(Object.keys(META) as OrganKey[]).map((key) => <button key={key} type="button" onClick={() => setOrgan(key)} className={`min-h-24 rounded-2xl border p-3 text-left transition motion-reduce:transition-none ${organ === key ? 'border-emerald-300 bg-emerald-300/15 shadow-[0_16px_40px_rgba(0,191,99,.14)]' : 'border-white/10 bg-white/[.035]'}`}><div className="flex justify-between gap-2"><span className="text-[10px] font-black">{META[key]}</span><span className="text-[8px] font-black text-emerald-300">{grouped[key].toLocaleString()}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${Math.max(5, grouped[key] / max * 100)}%` }} /></div></button>)}</div><div className="mt-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[8px] leading-relaxed text-white/45">Group totals sum only displayed terms. They are not risk estimates and must not be compared as incidence between organs or drugs.</div></div>
    <div className="rounded-2xl border border-neutral-200 bg-white/75 p-3 backdrop-blur dark:border-white/10 dark:bg-white/[.035]"><div className="text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{META[organ]} · {current.label}</div><div className="mt-2 space-y-2">{selected.length ? selected.map((r) => <div key={r.term} className="rounded-xl border border-neutral-200/80 p-2.5 dark:border-white/10"><div className="flex justify-between gap-3"><span className="text-[9px] font-black text-ink dark:text-white">{r.term}</span><span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">{r.count.toLocaleString()}</span></div></div>) : <div className="text-[9px] text-neutral-400">No displayed term in this group.</div>}</div><div className="mt-3 border-t border-neutral-200 pt-3 text-[8px] leading-relaxed text-neutral-500 dark:border-white/10"><strong>{current.source}.</strong> FAERS spontaneous reports can contain duplicates, missing information and reporting bias. Counts provide no denominator, incidence, causal attribution, comparative safety ranking or patient-specific prediction.</div></div></div>
  </section>
}

export default FaersOrganMap
