interface SurfaceGuideProps {
  summary: string
  steps: readonly string[]
  label?: string
}

export function SurfaceGuide({ summary, steps, label = 'How to use' }: SurfaceGuideProps) {
  return (
    <details className="pmd-surface-guide rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-ink dark:border-white/10 dark:bg-white/[.035] dark:text-white">
      <summary className="cursor-pointer list-none text-[11px] font-black text-ink dark:text-white/90">
        {label} · <span className="font-semibold text-neutral-600 dark:text-white/70">{summary}</span>
      </summary>
      <ol className="mt-2 grid gap-1.5 text-[11px] leading-relaxed text-neutral-600 dark:text-white/75 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="font-black text-brand-dark dark:text-cyan-200/90">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}

export default SurfaceGuide
