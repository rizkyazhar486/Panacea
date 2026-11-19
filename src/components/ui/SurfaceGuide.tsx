interface SurfaceGuideProps {
  summary: string
  steps: readonly string[]
  label?: string
}

/**
 * Compact (i) corner info chip replacing verbose multi-sentence "How to use" boxes.
 */
export function SurfaceGuide({ summary, steps, label = 'Guide' }: SurfaceGuideProps) {
  return (
    <details className="pmd-surface-guide relative inline-block">
      <summary
        aria-label={`${label}: ${summary}`}
        className="inline-flex min-h-[44px] lg:min-h-[30px] cursor-pointer list-none items-center gap-1.5 rounded-full border border-neutral-300 bg-neutral-100 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-800 transition hover:text-ink dark:border-white/15 dark:bg-white/[0.08] dark:text-slate-100 dark:hover:text-white"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[9px] font-black"
        >
          i
        </span>
        <span>{label}</span>
      </summary>
      <div className="mt-2 max-w-md rounded-2xl border border-neutral-200 bg-white/95 p-3 text-ink shadow-lg dark:border-white/15 dark:bg-[#090d14]/95 dark:text-white">
        <p className="text-[11px] font-bold text-ink dark:text-cyan-200">{summary}</p>
        <ol className="mt-1.5 space-y-1 text-[11px] leading-snug text-neutral-600 dark:text-slate-300">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-2">
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </details>
  )
}

export default SurfaceGuide
