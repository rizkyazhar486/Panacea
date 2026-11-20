interface SurfaceGuideProps {
  summary: string
  steps: readonly string[]
  label?: string
}

/**
 * Icon-only SVG compass-guide logo chip replacing verbose "Guide" text bubbles.
 */
export function SurfaceGuide({ summary, steps, label = 'Guide' }: SurfaceGuideProps) {
  return (
    <details className="pmd-surface-guide relative inline-block">
      <summary
        aria-label={`${label}: ${summary}`}
        title={`${label}: ${summary}`}
        className="inline-flex min-h-[44px] min-w-[44px] lg:min-h-[30px] lg:min-w-[30px] cursor-pointer list-none items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 p-1.5 text-neutral-800 transition hover:text-ink dark:border-white/15 dark:bg-white/[0.08] dark:text-slate-100 dark:hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <polygon points="15.5,8.5 13.5,13.5 8.5,15.5 10.5,10.5" />
        </svg>
        <span className="sr-only">{label}</span>
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
