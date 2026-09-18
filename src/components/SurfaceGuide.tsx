interface SurfaceGuideProps {
  summary: string
  steps: readonly string[]
  label?: string
}

export function SurfaceGuide({ summary, steps, label = 'How to use' }: SurfaceGuideProps) {
  return (
    <details className="pmd-surface-guide rounded-2xl border border-white/10 bg-white/[.035] px-3 py-2.5 text-white">
      <summary className="cursor-pointer list-none text-[11px] font-black text-white/85">
        {label} · <span className="font-semibold text-white/65">{summary}</span>
      </summary>
      <ol className="mt-2 grid gap-1.5 text-[11px] leading-relaxed text-white/70 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="font-black text-cyan-200/90">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}

export default SurfaceGuide
