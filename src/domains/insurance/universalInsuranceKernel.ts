/**
 * PanaceaMed One Canonical Insurance Kernel (Directive 025)
 * Unifies BPJS, PNS, TNI/POLRI (ASABRI), and Correctional Inmates (Kemenimipas & Kemenkes).
 */

export type BeneficiaryCategory = 'GENERAL_PUBLIC' | 'PNS' | 'TNI_POLRI' | 'CORRECTIONAL_INMATE';

export type CoverageTier = 'CLASS_1' | 'CLASS_2' | 'CLASS_3' | 'SPECIAL_CORRECTIONAL_CARE';

export interface InsuranceProfile {
  beneficiaryId: string;
  category: BeneficiaryCategory;
  institutionCode: string;
  coverageTier: CoverageTier;
  activeStatus: boolean;
  verifiedTimestamp: string;
}

export interface ClaimEvaluationResult {
  eligible: boolean;
  reimbursementPercentage: number;
  coveredAmountIdr: number;
  patientOutOfPocketIdr: number;
  routingAgency: 'BPJS_KESEHATAN' | 'ASABRI_SERVICE' | 'CORRECTIONAL_HEALTH_DIVISION';
  canonicalPolicyRef: string;
  notes: string;
}

export function evaluateCanonicalInsurance(profile: InsuranceProfile, estimatedCostIdr: number): ClaimEvaluationResult {
  if (!profile.activeStatus || estimatedCostIdr < 0) {
    return {
      eligible: false,
      reimbursementPercentage: 0,
      coveredAmountIdr: 0,
      patientOutOfPocketIdr: Math.max(0, estimatedCostIdr),
      routingAgency: 'BPJS_KESEHATAN',
      canonicalPolicyRef: 'REJECTED-INACTIVE-OR-INVALID',
      notes: 'Coverage inactive or invalid cost parameter. Fails closed.'
    };
  }

  let pct = 80.0;
  let agency: ClaimEvaluationResult['routingAgency'] = 'BPJS_KESEHATAN';
  let ref = 'JKN-BPJS-STANDARD';
  let notes = 'Standard National Health Insurance (JKN / BPJS) routing.';

  switch (profile.category) {
    case 'CORRECTIONAL_INMATE':
      pct = 100.0;
      agency = 'CORRECTIONAL_HEALTH_DIVISION';
      ref = 'KEMENKES-KEMENIMIPAS-JOINT-PAS';
      notes = 'Warga Binaan / Narapidana: 100% state-covered under Kemenkes & Kemenimipas correctional health protocol.';
      break;
    case 'TNI_POLRI':
      pct = 100.0;
      agency = 'ASABRI_SERVICE';
      ref = 'ASABRI-DEFENSE-JKN';
      notes = 'Instansi TNI/POLRI: 100% covered under defense/police health security scheme.';
      break;
    case 'PNS':
      pct = 100.0;
      agency = 'BPJS_KESEHATAN';
      ref = 'ASN-PNS-JKN';
      notes = 'Pegawai Negeri Sipil (PNS/ASN): 100% covered under civil servant JKN scheme.';
      break;
    case 'GENERAL_PUBLIC':
    default:
      pct = profile.institutionCode === 'BPJS_PBI' ? 100.0 : 85.0;
      agency = 'BPJS_KESEHATAN';
      ref = profile.institutionCode === 'BPJS_PBI' ? 'JKN-PBI-APBN' : 'JKN-PBPU-MANDIRI';
      notes = profile.institutionCode === 'BPJS_PBI'
        ? 'Rakyat Biasa (PBI): 100% subsidized by central government.'
        : 'Rakyat Biasa (Mandiri): Standard JKN coverage tier.';
      break;
  }

  const coveredAmountIdr = Math.round(estimatedCostIdr * (pct / 100));
  const patientOutOfPocketIdr = estimatedCostIdr - coveredAmountIdr;

  return {
    eligible: true,
    reimbursementPercentage: pct,
    coveredAmountIdr,
    patientOutOfPocketIdr,
    routingAgency: agency,
    canonicalPolicyRef: ref,
    notes
  };
}
