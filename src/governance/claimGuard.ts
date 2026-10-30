/**
 * WP-3 Claim Guard Engine
 * Menerapkan audit klasifikasi isi diff secara deterministik dengan perilaku fail-closed.
 * Tanpa timestamp, tanpa placeholder claimHits.
 */
export interface ClaimAuditResult {
  passed: boolean;
  violations: string[];
}

export function auditClaimDiff(diffContent: string): ClaimAuditResult {
  if (typeof diffContent !== 'string') {
    return { passed: false, violations: ['Invalid diff payload: must be a string'] };
  }

  const violations: string[] = [];
  
  if (diffContent.includes('placeholder') || diffContent.includes('TODO-CLAIM')) {
    violations.push('Placeholder or unverified claim detected');
  }

  return {
    passed: violations.length === 0,
    violations
  };
}
