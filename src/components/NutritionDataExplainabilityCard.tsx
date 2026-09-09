import {
  NUTRITION_DATA_EXPLAINABILITY_STEPS,
  NUTRITION_PLAIN_LANGUAGE_GUIDE,
} from '../lib/nutritionDataExplainability'

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

      <details className="mt-4 rounded-2xl border border-emerald-300/40 bg-emerald-50/50 p-3 dark:border-emerald-300/20 dark:bg-emerald-400/[0.04]">
        <summary className="cursor-pointer text-[10px] font-black text-emerald-800 dark:text-emerald-100">In simple words</summary>
        <ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-emerald-800 dark:text-emerald-100" aria-label="Plain-language nutrition data guide">
          {NUTRITION_PLAIN_LANGUAGE_GUIDE.map((item) => (
            <li key={item.id}>• {item.text}</li>
          ))}
        </ul>
      </details>

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