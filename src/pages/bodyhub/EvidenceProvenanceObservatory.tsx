import { useMemo, useState } from 'react'
import {
  BODY_EVIDENCE_CLAIM_LEDGER,
  BODY_EVIDENCE_PROVENANCE_BOUNDARY,
  BODY_EVIDENCE_SOURCE_LEDGER,
  getBodyEvidenceCoverageStats,
  getBodyEvidenceSource,
  listBodyEvidenceClaimsByKind,
  type BodyEvidenceClaimKind,
} from '../../lib/bodyEvidenceProvenance'

const KIND_LABELS: Record<BodyEvidenceClaimKind, string> = {
  pathophysiology: 'Pathophysiology',
  pharmacology: 'Pharmacology',
  'causal-intersection': 'Causal intersections',
}

const KIND_CLASS: Record<BodyEvidenceClaimKind, string> = {
  pathophysiology: 'border-rose-300/18 bg-rose-300/[.055] text-rose-100',
  pharmacology: 'border-cyan-300/18 bg-cyan-300/[.055] text-cyan-100',
  'causal-intersection': 'border-violet-300/18 bg-violet-300/[.055] text-violet-100',
}

export function EvidenceProvenanceObservatory() {
  const stats = useMemo(() => getBodyEvidenceCoverageStats(), [])
  const [kind, setKind] = useState<BodyEvidenceClaimKind>('pathophysiology')
  const claims = useMemo(() => listBodyEvidenceClaimsByKind(kind), [kind])
  const [selectedIdByKind, setSelectedIdByKind] = useState<Record<BodyEvidenceClaimKind, string>>({
    pathophysiology: 'pathophysiology:atherosclerosis',
    pharmacology: 'pharmacology:statin-hmgcr',
    'causal-intersection': 'causal-intersection:atherosclerosis-statin-lipid-axis',
  })
  const selectedId = selectedIdByKind[kind]
  const selected = claims.find((claim) => claim.id === selectedId) ?? claims[0]
  const sources = selected?.evidencePmids.map((pmid) => getBodyEvidenceSource(pmid)) ?? []
  const latestYear = BODY_EVIDENCE_SOURCE_LEDGER.reduce((latest, source) => Math.max(latest, source.year), 0)
  const coveragePercent = Math.round(stats.coverageFraction * 100)

  function selectClaim(id: string) {
    setSelectedIdByKind((current) => ({ ...current, [kind]: id }))
  }

  return (
    <section
      className="relative overflow-hidden rounded-[30px] border border-white/[.08] bg-black/60 p-3 shadow-[0_28px_100px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:p-4 lg:p-5"
      aria-labelledby="evidence-provenance-title"
    >
      <div className="pointer-events-none absolute -right-14 top-0 h-48 w-48 rounded-full bg-cyan-400/[.045] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-[20%] h-40 w-40 rounded-full bg-violet-500/[.04] blur-3xl" aria-hidden />

      <header className="relative grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,.8fr)] xl:items-end">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-100/80">Evidence Provenance Observatory</span>
            <span className="rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-white/45">PMID traceability</span>
            <span className="rounded-full border border-amber-200/10 bg-amber-200/[.035] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-amber-50/55">metadata ≠ evidence grade</span>
          </div>
          <h3 id="evidence-provenance-title" className="mt-2 text-xl font-black tracking-[-.03em] text-white sm:text-2xl lg:text-3xl">
            Every biomedical mechanism should be inspectable back to its evidence anchors.
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/52">
            This observatory audits the provenance already embedded in Body Exposure. It deduplicates PubMed anchors, shows where each source is reused and makes inherited evidence on causal-bridge interpretations explicit rather than silently implying certainty.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/[.065] bg-white/[.022] px-3 py-2.5">
            <div className="text-xl font-black text-white">{stats.totalClaims}</div>
            <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/30">claim records</div>
          </div>
          <div className="rounded-2xl border border-white/[.065] bg-white/[.022] px-3 py-2.5">
            <div className="text-xl font-black text-white">{stats.uniquePubMedSources}</div>
            <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/30">unique PMIDs</div>
          </div>
          <div className="rounded-2xl border border-white/[.065] bg-white/[.022] px-3 py-2.5">
            <div className="text-xl font-black text-emerald-100">{coveragePercent}%</div>
            <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/30">anchored metadata</div>
          </div>
          <div className="rounded-2xl border border-white/[.065] bg-white/[.022] px-3 py-2.5">
            <div className="text-xl font-black text-white">{latestYear}</div>
            <div className="text-[8px] font-black uppercase tracking-[.1em] text-white/30">latest source year</div>
          </div>
        </div>
      </header>

      <div className="relative mt-4 rounded-[22px] border border-white/[.07] bg-white/[.02] p-2">
        <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Evidence claim families">
          {(Object.keys(KIND_LABELS) as BodyEvidenceClaimKind[]).map((candidate) => {
            const active = candidate === kind
            return (
              <button
                key={candidate}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setKind(candidate)}
                className={`min-h-[44px] rounded-[16px] border px-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${active ? KIND_CLASS[candidate] : 'border-transparent bg-transparent text-white/35 hover:border-white/[.06] hover:bg-white/[.03] hover:text-white/65'}`}
              >
                <span className="block">{KIND_LABELS[candidate]}</span>
                <span className="mt-0.5 block text-[8px] font-bold opacity-50">{stats.claimCounts[candidate]} records</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(280px,.7fr)_minmax(0,1.3fr)]">
        <aside className="rounded-[24px] border border-white/[.07] bg-black/30 p-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[9px] font-black uppercase tracking-[.14em] text-white/32">Claim ledger</span>
            <span className="text-[8px] font-bold text-white/24">{claims.length} visible</span>
          </div>
          <div className="mt-2 grid max-h-[440px] gap-1.5 overflow-y-auto pr-1">
            {claims.map((claim) => {
              const active = claim.id === selected?.id
              return (
                <button
                  key={claim.id}
                  type="button"
                  onClick={() => selectClaim(claim.id)}
                  className={`rounded-[16px] border p-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/45 ${active ? 'border-cyan-300/16 bg-cyan-300/[.055]' : 'border-white/[.055] bg-white/[.018] hover:border-white/[.1] hover:bg-white/[.035]'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[10px] font-black leading-snug text-white/70">{claim.label}</div>
                    <span className="shrink-0 rounded-full border border-white/[.07] bg-black/25 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[.08em] text-white/30">
                      {claim.evidencePmids.length} PMID
                    </span>
                  </div>
                  <div className="mt-1 text-[8px] font-bold uppercase tracking-[.08em] text-white/24">{claim.provenanceMode}</div>
                </button>
              )
            })}
          </div>
        </aside>

        {selected && (
          <article className="rounded-[24px] border border-white/[.07] bg-white/[.022] p-3.5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[.1em] ${KIND_CLASS[selected.kind]}`}>
                  {KIND_LABELS[selected.kind]}
                </span>
                <h4 className="mt-2 text-lg font-black leading-tight text-white/85">{selected.label}</h4>
                <p className="mt-1.5 max-w-4xl text-xs font-medium leading-relaxed text-white/44">{selected.summary}</p>
              </div>
              <div className="shrink-0 rounded-2xl border border-white/[.07] bg-black/25 px-3 py-2 text-center">
                <div className="text-lg font-black text-white/80">{sources.length}</div>
                <div className="text-[8px] font-black uppercase tracking-[.09em] text-white/28">evidence anchors</div>
              </div>
            </div>

            <div className="mt-3 rounded-[18px] border border-violet-300/10 bg-violet-300/[.025] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.13em] text-violet-100/52">Provenance derivation</div>
              <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/40">{selected.derivation}</p>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {sources.map((source) => (
                <a
                  key={source.pmid}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[18px] border border-white/[.065] bg-black/25 p-3 transition hover:border-cyan-300/15 hover:bg-cyan-300/[.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/45"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[8px] font-black uppercase tracking-[.11em] text-cyan-100/55">PMID {source.pmid}</span>
                    <span className="text-[8px] font-black text-white/28">{source.year}</span>
                  </div>
                  <div className="mt-1.5 text-[10px] font-black leading-snug text-white/68">{source.title}</div>
                  <div className="mt-2 text-[8px] font-bold uppercase tracking-[.08em] text-white/25">reused by {source.usedByClaimIds.length} claim records</div>
                </a>
              ))}
            </div>

            <details className="mt-3 rounded-[18px] border border-white/[.06] bg-black/20 p-3">
              <summary className="cursor-pointer text-[9px] font-black uppercase tracking-[.12em] text-white/38">Evidence-role notes</summary>
              <div className="mt-2 grid gap-2">
                {sources.flatMap((source) => source.roles.map((role, index) => (
                  <div key={`${source.pmid}-${index}`} className="rounded-xl border border-white/[.05] bg-white/[.018] p-2.5">
                    <div className="text-[8px] font-black uppercase tracking-[.09em] text-cyan-100/42">PMID {source.pmid}</div>
                    <p className="mt-1 text-[9px] font-medium leading-relaxed text-white/32">{role}</p>
                  </div>
                )))}
              </div>
            </details>

            <div className="mt-3 rounded-[18px] border border-amber-200/10 bg-amber-200/[.025] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.13em] text-amber-100/52">Interpretation boundary</div>
              <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-amber-50/42">{selected.boundary}</p>
            </div>
          </article>
        )}
      </div>

      <div className="relative mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-[18px] border border-white/[.06] bg-white/[.018] p-3">
          <div className="text-[8px] font-black uppercase tracking-[.11em] text-white/28">Coverage formula</div>
          <div className="mt-1 font-mono text-[10px] font-black text-emerald-100/65">coverage = anchored claims / total claims</div>
          <div className="mt-1 text-[8px] font-medium leading-relaxed text-white/25">QA completeness metric only; not scientific certainty.</div>
        </div>
        <div className="rounded-[18px] border border-white/[.06] bg-white/[.018] p-3">
          <div className="text-[8px] font-black uppercase tracking-[.11em] text-white/28">Current numerator</div>
          <div className="mt-1 font-mono text-[10px] font-black text-cyan-100/65">{stats.evidenceAnchoredClaims} anchored</div>
          <div className="mt-1 text-[8px] font-medium leading-relaxed text-white/25">At least one PMID is present on each counted record.</div>
        </div>
        <div className="rounded-[18px] border border-white/[.06] bg-white/[.018] p-3">
          <div className="text-[8px] font-black uppercase tracking-[.11em] text-white/28">Source deduplication</div>
          <div className="mt-1 font-mono text-[10px] font-black text-violet-100/65">unique(PMID)</div>
          <div className="mt-1 text-[8px] font-medium leading-relaxed text-white/25">Citation reuse is visible instead of inflating the source count.</div>
        </div>
      </div>

      <p className="relative mt-3 rounded-[20px] border border-amber-200/10 bg-amber-200/[.03] px-3 py-2.5 text-[9px] font-semibold leading-relaxed text-amber-50/45">
        {BODY_EVIDENCE_PROVENANCE_BOUNDARY}
      </p>

      <div className="sr-only">{BODY_EVIDENCE_CLAIM_LEDGER.length} evidence claim records audited.</div>
    </section>
  )
}

export default EvidenceProvenanceObservatory
