import {
  clinicalClaimDisclosure,
  clinicalClaimLabel,
  klaimPermukaanKesehatan,
  type ClinicalClaimEvidence,
  type PermukaanKlaimKesehatan,
} from '../lib/clinicalClaimMaturity'

/** One fail-closed sentence beside a healthcare number. Evidence is never assumed. */
export function BatasKlaimKesehatan({
  permukaan,
  evidence,
  className = 'mt-2 text-[11px] leading-snug text-neutral-500',
}: {
  permukaan: PermukaanKlaimKesehatan
  evidence?: ClinicalClaimEvidence
  className?: string
}) {
  const maturity = klaimPermukaanKesehatan(permukaan, evidence)
  return (
    <p className={className} data-clinical-claim-surface={permukaan} data-clinical-claim-maturity={maturity}>
      {clinicalClaimLabel(maturity)}. {clinicalClaimDisclosure(maturity)}
    </p>
  )
}
