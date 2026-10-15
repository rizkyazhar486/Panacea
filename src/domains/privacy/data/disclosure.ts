// Shared factual descriptions; not legal approval or deployment certification.
export const PRIVACY_DISCLOSURE = {
  reviewedAt: '2026-10-15',
  draftReview: 'AI content remains a draft until an authorized clinician explicitly approves it.',
  requests: 'Use Support to request access, correction, withdrawal of consent or server-data deletion.',
  localReset: 'Settings → Reset Saved App State resets the app state saved on this device; it does not erase other local caches or server-held records.',
  sharing: 'Revoking a lab-sharing permission ends access through that permission. Revocation does not itself erase stored records.',
  retention: 'Deployment-specific retention periods and the server-deletion process must be confirmed with the service operator; this page does not specify an approved retention schedule.',
  deployment: 'Hosting region, transport security and encryption at rest depend on the deployed infrastructure. This page does not verify those settings. Ask the service operator for current deployment evidence.',
  integration: 'A SATUSEHAT adapter is available in the codebase. Its presence is not evidence of a configured live connection or successful exchange for your record.',
  clinicalAuthority: 'Examination entries and clinical signatures require an authorized clinician. Account verification and content review are separate controls.',
} as const
