import {
  NUTRITION_EVIDENCE_BOUNDARIES,
  NUTRITION_EVIDENCE_SOURCE_POINTERS,
} from '../lib/nutritionEvidenceLineage'

function layerLabel(layer: 'food-reference' | 'literature-index') {
  return layer === 'food-reference' ? 'Food reference' : 'Literature index'
}

export function NutritionEvidenceLineageCard() {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]" aria-labelledby="nutrition-evidence-lineage-title">
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">Evidence lineage</div>
      <h3 id="nutrition-evidence-lineage-title" className="mt-2 text-lg font-black text-ink dark:text-white">Know what kind of source you are looking at</h3>
      <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        Panacea keeps food-reference provenance separate from literature evidence. This panel reads fixed Source Registry identities only; it makes no upstream request from the browser and does not turn a citation pointer into a verified nutrition claim.
      </p>

      <div className="mt-4 grid gap-2 lg:grid-cols-3" aria-label="Nutrition evidence source lineage">
        {NUTRITION_EVIDENCE_SOURCE_POINTERS.map((source) => (
          <div key={source.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{layerLabel(source.layer)}</div>
            <div className="mt-1 font-mono text-[11px] font-black text-ink dark:text-white">{source.id}</div>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{source.purpose}</p>
            <div className="mt-2 break-all text-[9px] text-neutral-400">Registry: {source.registryPath}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-blue-300/40 bg-blue-50/60 p-4 dark:border-blue-300/20 dark:bg-blue-400/[0.05]">
        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-200">Verification boundary</div>
        <ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-blue-800 dark:text-blue-100">
          {NUTRITION_EVIDENCE_BOUNDARIES.map((boundary) => <li key={boundary}>• {boundary}</li>)}
        </ul>
      </div>

      <div className="mt-3 text-[10px] leading-relaxed text-neutral-400">
        Registry metadata remains authoritative for current adapter, licence, provenance and validation status. Full-text or figure reuse rights must never be inferred from indexing alone.
      </div>
    </section>
  )
}

export default NutritionEvidenceLineageCard
