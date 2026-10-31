import { useState } from 'react'
import { deadSpacePanel, shuntPanel, type PanelView } from '../engine/gasIdentityPanel'

const pubmed = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`

function Field({ label, unit, value, onChange }: { label: string; unit: string; value: string; onChange: (next: string) => void }) {
  return <label className="block min-w-0 text-[11px] text-white/70">
    <span>{label} · {unit}</span>
    <input type="text" inputMode="decimal" autoComplete="off" aria-label={`Gas identity: ${label}`} value={value} onChange={(event) => onChange(event.target.value)} placeholder="not entered" className="mt-1 block min-h-11 w-full rounded-xl border border-white/20 bg-transparent px-3 font-mono text-sm text-white placeholder:text-white/30" />
  </label>
}

/** Two labelled shares that add to 100%: text carries the meaning, the bar only shows proportion. */
function ShareBar({ view }: { view: Extract<PanelView, { status: 'ok' }> }) {
  const [first, second] = view.segments
  return <figure className="mt-3 min-w-0">
    <div role="img" aria-label={`${first.label} ${(first.fraction * 100).toFixed(1)} percent; ${second.label} ${(second.fraction * 100).toFixed(1)} percent`} className="flex h-5 w-full overflow-hidden rounded-full border border-white/20">
      <div data-share="first" style={{ width: `${first.fraction * 100}%` }} className="bg-amber-300/70" />
      <div data-share="second" style={{ width: `${second.fraction * 100}%` }} className="bg-cyan-300/40" />
    </div>
    <figcaption className="mt-2 grid gap-1.5 text-[11px] sm:grid-cols-2 sm:gap-x-4">
      <span><span aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-300/70" />{first.label}: <b className="font-mono">{(first.fraction * 100).toFixed(1)}%</b></span>
      <span><span aria-hidden="true" className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-300/40" />{second.label}: <b className="font-mono">{(second.fraction * 100).toFixed(1)}%</b></span>
    </figcaption>
  </figure>
}

function Result({ view, pmids }: { view: PanelView; pmids: readonly string[] }) {
  if (view.status === 'incomplete') return <p role="status" data-identity-state="incomplete" className="mt-3 rounded-xl border border-white/15 p-3 text-xs text-white/70">Not computed: enter {view.missing.join(', ')}. A blank field is treated as missing, never as zero.</p>
  if (view.status === 'invalid-field') return <p role="status" data-identity-state="invalid-field" className="mt-3 rounded-xl border border-amber-200/30 p-3 text-xs text-amber-100">Not computed: {view.fields.join(', ')} must be a plain number (for example 40 or 5.3).</p>
  if (view.status === 'rejected') return <p role="status" data-identity-state="rejected" className="mt-3 rounded-xl border border-amber-200/30 p-3 text-xs text-amber-100">Not computed: {view.detail}</p>
  return <div data-identity-state="ok" aria-live="polite">
    <p className="mt-3 text-sm">Result <span className="ml-1 font-mono text-base text-cyan-100">{view.fraction.toFixed(3)}</span> <span className="text-[10px] text-amber-200">derived from your entered values</span></p>
    <ShareBar view={view} />
    <p className="mt-2 break-words font-mono text-[10px] text-cyan-100/80">{view.result.formula}</p>
    <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-white/60">{view.result.limitations.map((line) => <li key={line}>{line}</li>)}</ul>
    <p className="mt-2 text-[11px] text-white/60">Sources read from PubMed abstracts only (full text not read):{' '}
      {pmids.map((pmid) => <a key={pmid} href={pubmed(pmid)} target="_blank" rel="noopener noreferrer" className="mr-2 text-cyan-200 underline">PMID {pmid}</a>)}</p>
  </div>
}

/**
 * Two algebraic identities for the person who has the measurements: nothing is prefilled, nothing is stored, nothing is
 * estimated. This panel does not interpret a value and applies no normal range.
 */
export function GasExchangeIdentitiesLab() {
  const [paco2, setPaco2] = useState('')
  const [pecco2, setPecco2] = useState('')
  const [cc, setCc] = useState('')
  const [ca, setCa] = useState('')
  const [cv, setCv] = useState('')
  const dead = deadSpacePanel(paco2, pecco2)
  const shunt = shuntPanel(cc, ca, cv)
  return <details data-gas-exchange-identities="v1" className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/[.025] p-3">
    <summary className="cursor-pointer text-xs font-bold text-amber-100">Dead-space and shunt identities · enter your own measured values</summary>
    <p className="mt-3 text-[11px] leading-relaxed text-white/60">Derived from values you type; nothing is prefilled, stored or sent.</p>
    <p className="mt-1 text-[11px] leading-relaxed text-white/60">Not a diagnosis or a target, and no normal range is applied.</p>
    <p className="mt-1 text-[11px] leading-relaxed text-amber-100/90">Use one unit for every pressure (or every content): mixed units cannot be detected.</p>
    <section aria-label="Dead-space fraction" className="mt-4">
      <h5 className="text-[11px] font-black uppercase text-white/60">Dead-space fraction · VD/VT (Enghoff)</h5>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <Field label="PaCO₂" unit="mmHg or kPa" value={paco2} onChange={setPaco2} />
        <Field label="Mixed expired PCO₂" unit="same unit" value={pecco2} onChange={setPecco2} />
      </div>
      <Result view={dead} pmids={['28223465', '16126784']} />
    </section>
    <section aria-label="Shunt fraction" className="mt-5">
      <h5 className="text-[11px] font-black uppercase text-white/60">Shunt fraction · Qs/Qt</h5>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <Field label="CcO₂" unit="mL O₂/dL" value={cc} onChange={setCc} />
        <Field label="CaO₂" unit="mL O₂/dL" value={ca} onChange={setCa} />
        <Field label="CvO₂" unit="mL O₂/dL" value={cv} onChange={setCv} />
      </div>
      <Result view={shunt} pmids={['8599295', '964271']} />
    </section>
    <button type="button" onClick={() => { setPaco2(''); setPecco2(''); setCc(''); setCa(''); setCv('') }} className="mt-4 min-h-11 rounded-xl border border-white/20 px-3 text-xs">Clear entered values</button>
  </details>
}
