import { NUTRITION_DATA_EXPLAINABILITY_STEPS } from '../lib/nutritionDataExplainability'

/**
 * Explain the existing Nutrition Data software pipeline without creating a
 * second analytics engine or introducing biomedical interpretation.
 */
export function NutritionDataExplainabilityCard() {
  return (
    <section
      className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]"
      aria-label="Nutrition data transformation explanation"
    >
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">How this data view works</div>
      <h3 className="mt-2 text-lg font-black text-ink dark:text-white">Recorded data, explicit transformations</h3>
      <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        This trace explains the software path used by the existing Nutrition Data tab. It is deliberately separate from scientific validation of a nutrient source and from clinical interpretation.
      </p>

      <ol className="mt-4 grid gap-2 md:grid-cols-2" aria-label="Nutrition data processing steps">
        {NUTRITION_DATA_EXPLAINABILITY_STEPS.map((step) => (
          <li key={step.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[10px] font-black text-ink dark:text-white">{step.title}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{step.detail}</p>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-50/60 p-3 text-[10px] leading-relaxed text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/[0.05] dark:text-amber-100">
        <b>Interpretation boundary:</b> structural validity means the record is safe for this software workflow; it does not establish nutrient correctness, health benefit, deficiency, metabolic status or dietary suitability.
      </div>
    </section>
  )
}

export default NutritionDataExplainabilityCard