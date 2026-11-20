import {
  clinicalClaimDisclosure,
  clinicalClaimLabel,
  klaimPermukaanKesehatan,
  type ClinicalClaimEvidence,
  type PermukaanKlaimKesehatan,
} from '../../lib/clinicalClaimMaturity'

/**
 * Icon-only SVG shield-pulse logo badge for the fail-closed clinical evidence
 * boundary. Hides the verbose text pill on primary surfaces while preserving
 * exact machine-readable data attributes, sr-only label, and 1-tap popover.
 */
export function BatasKlaimKesehatan({
  permukaan,
  evidence,
  className = 'mt-1 inline-block',
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
        title={`${label}: ${disclosure}`}
        className="inline-flex min-h-[44px] min-w-[44px] lg:min-h-[30px] lg:min-w-[30px] cursor-pointer list-none items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 p-1.5 text-neutral-800 transition hover:text-ink dark:border-white/15 dark:bg-white/[0.08] dark:text-slate-100 dark:hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3 19 6v5.4c0 4.5-3 8.2-7 9.6-4-1.4-7-5.1-7-9.6V6l7-3Z" />
          <path d="M8 12h2l1.2-2.2 1.8 4.4 1.2-2.2H16" />
        </svg>
        <span className="sr-only">{label}</span>
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
