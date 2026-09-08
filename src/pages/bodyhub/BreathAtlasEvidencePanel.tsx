import { BREATH_ATLAS_ACADEMIC_EVIDENCE } from '../../lib/breathAtlasAcademicEvidence'

export function BreathAtlasEvidencePanel() {
  return (
    <section aria-labelledby="breath-atlas-evidence-title" className="rounded-2xl border border-blue-300/25 bg-blue-50/40 p-4 dark:border-blue-400/15 dark:bg-blue-400/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Academic Accuracy Gate · respiratory claims</div>
          <h5 id="breath-atlas-evidence-title" className="mt-1 text-base font-black text-ink dark:text-white">Source-checked teaching claims · human academic review not recorded</h5>
          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">{BREATH_ATLAS_ACADEMIC_EVIDENCE.scopeNote}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[8px] font-black">
          <span className="rounded-full border border-brand/25 bg-brand/10 px-2 py-1 text-brand">source-checked</span>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-amber-700 dark:text-amber-200">human review: not recorded</span>
          <span className="rounded-full border border-neutral-200 px-2 py-1 text-neutral-500 dark:border-white/10">AI-assisted · disclosed</span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {BREATH_ATLAS_ACADEMIC_EVIDENCE.sources.map((source) => (
          <article key={source.id} className="rounded-xl border border-neutral-200 bg-white/75 p-3 dark:border-white/10 dark:bg-neutral-950/50">
            <div className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-500">{source.id.toUpperCase()}</div>
            <div className="mt-1 text-[10px] font-black text-ink dark:text-white">{source.title}</div>
            <p className="mt-1 text-[8.5px] leading-relaxed text-neutral-500">{source.citation}</p>
            <div className="mt-2 space-y-1">
              {source.supports.map((claim) => (
                <div key={claim} className="text-[8.5px] leading-relaxed text-neutral-500">• {claim}</div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[8px] font-bold">
              <a href={source.pubmedUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline-offset-2 hover:underline dark:text-blue-300">PubMed ↗</a>
              <span className="font-mono text-neutral-400">DOI {source.doi}</span>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-[8.5px] leading-relaxed text-amber-800 dark:text-amber-100">Source-checked does not mean academically reviewed by a Panacea anatomist, pulmonologist or physiologist. That status must remain pending until a qualified human reviewer, credentials, review date and review scope are actually recorded.</p>
    </section>
  )
}

export default BreathAtlasEvidencePanel
