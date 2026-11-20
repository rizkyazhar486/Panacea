import {
  clinicalClaimDisclosure,
  clinicalClaimLabel,
  klaimPermukaanKesehatan,
  type ClinicalClaimEvidence,
  type PermukaanKlaimKesehatan,
} from '../../lib/clinicalClaimMaturity'

/**
 * Compact (i) info-icon containment for the fail-closed clinical evidence boundary.
 * Preserves exact machine-readable data attributes and ARIA disclosure text
 * without dumping multi-line banner clutter onto the primary canvas.
 */
export function BatasKlaimKesehatan({
  permukaan,
  evidence,
  className = 'mt-1.5 inline-block',
}: {
  permukaan: PermukaanKlaimKesehatan
  evidence?: ClinicalClaimEvidence
  className?: string
}) {
  const maturity = klaimPermukaanKesehatan(permukaan, evidence)
  const label = clinicalClaimLabel(maturity)
  const disclosure = clinicalClaimDisclosure(maturity)

  return (
    <details
      className={`relative inline-block ${className}`}
      data-clinical-claim-surface={permukaan}
      data-clinical-claim-maturity={maturity}
    >
      <summary
        aria-label={`${label} — clinical evidence notice`}
        className="inline-flex min-h-[44px] lg:min-h-[28px] cursor-pointer list-none items-center gap-1.5 rounded-full border border-neutral-300 bg-neutral-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-neutral-800 transition hover:text-ink dark:border-white/15 dark:bg-white/[0.08] dark:text-slate-100 dark:hover:text-white"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[9px] font-black"
        >
          i
        </span>
        <span>{label}</span>
      </summary>
      <p
        role="note"
        className="mt-1.5 max-w-md rounded-xl border border-neutral-200 bg-white/95 px-3 py-2 text-[11px] leading-snug text-neutral-800 shadow-lg dark:border-white/15 dark:bg-[#090d14]/95 dark:text-slate-100"
      >
        {label}. {disclosure}
      </p>
    </details>
  )
}
