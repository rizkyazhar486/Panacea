import React from 'react'
import type { ResultClosureResult } from '../model/resultClosure'
import type { CareAccessOrchestrationResult } from '../model/careAccessOrchestrator'
import type { ClinicalEpisodeResilienceResult } from '../model/clinicalEpisodeResilience'
import type { OneOsProofResult } from '../model/oneOsCareProof'
import type { CareJourneyContinuityResult } from '../model/careContinuityProjection'

function IconHospital({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 6v4" /><path d="M14 8h-4" /><path d="M18 18V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2Z" />
    </svg>
  )
}

function IconAlertTriangle({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconCheck({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconShield({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconClock({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export interface CareContinuityPanelProps {
  patientName: string
  closure?: ResultClosureResult | null
  careAccess?: CareAccessOrchestrationResult | null
  episodeResilience?: ClinicalEpisodeResilienceResult | null
  oneOsProof?: OneOsProofResult | null
  careJourneys?: CareJourneyContinuityResult | null
  className?: string
}

function formatRate(rate: number | null): string {
  if (rate === null) return 'Unmeasured'
  return `${Math.round(rate * 100)}%`
}

export function CareContinuityPanel({
  patientName,
  closure,
  careAccess,
  episodeResilience,
  oneOsProof,
  careJourneys,
  className = '',
}: CareContinuityPanelProps) {
  const hasOverdue = closure ? closure.overdueIds.length > 0 : false
  const hasDiagnosticGap = careAccess ? careAccess.diagnosticContinuity.state === 'gap' : false
  const isTransportDegraded = episodeResilience ? episodeResilience.state !== 'ready' : false

  return (
    <section
      data-care-continuity-panel="v1"
      aria-label={`Care continuity and result closure for ${patientName}`}
      className={`dark rounded-2xl border border-white/10 bg-[#06101e] p-4 text-white shadow-xl sm:p-5 ${className}`}
    >
      <header className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <IconHospital size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white sm:text-base">
              Care Continuity &amp; Result Closure
            </h3>
            <p className="text-[11px] text-white/55">
              Protocol follow-up and multi-facility coordination for <span className="text-white/80 font-medium">{patientName}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasOverdue ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-400/10 px-2.5 py-0.5 text-[10px] font-bold text-red-200">
              <IconAlertTriangle size={12} /> Overdue results
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
              <IconCheck size={12} /> Results up to date
            </span>
          )}

          {episodeResilience && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                isTransportDegraded
                  ? 'border-amber-300/40 bg-amber-300/10 text-amber-200'
                  : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              }`}
            >
              {episodeResilience.safeToContinueOffline ? 'Offline ready' : 'Sync attention'}
            </span>
          )}

          {careJourneys && careJourneys.hasBlockedStages && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-400/10 px-2.5 py-0.5 text-[10px] font-bold text-red-200">
              <IconAlertTriangle size={12} /> Journey stalled ({careJourneys.stalledCount})
            </span>
          )}

          {careJourneys && careJourneys.totalEscalationsCount > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-200"
              data-care-escalations-badge="v1"
            >
              <IconAlertTriangle size={12} /> Escalations ({careJourneys.totalEscalationsCount})
            </span>
          )}

          {careJourneys && careJourneys.completedWithVerifiedOutcomeCount > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200"
              data-care-outcomes-badge="v1"
            >
              <IconCheck size={12} /> Outcomes verified ({careJourneys.completedWithVerifiedOutcomeCount})
            </span>
          )}

          {careJourneys && careJourneys.totalTimelineEventsCount > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-indigo-400/40 bg-indigo-400/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-200"
              data-care-timeline-badge="v1"
            >
              <IconClock size={12} /> Audit events ({careJourneys.totalTimelineEventsCount})
            </span>
          )}
        </div>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Section 1: Result Follow-Up Closure (PRD §8.5) */}
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
              PRD §8.5 Result Closure
            </span>
            <span className="text-xs font-bold text-emerald-300">
              {closure ? formatRate(closure.closureRate) : '—'}
            </span>
          </div>

          {closure ? (
            <div className="mt-2.5 space-y-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Due in window:</span>
                <span className="font-semibold text-white">{closure.dueCount}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Clinician-closed:</span>
                <span className="font-semibold text-emerald-300">{closure.closedCount}</span>
              </div>
              {closure.overdueIds.length > 0 && (
                <div className="flex justify-between text-red-300">
                  <span>Overdue:</span>
                  <span className="font-bold">{closure.overdueIds.length}</span>
                </div>
              )}
              {closure.unmeasuredReason && (
                <p className="mt-1 text-[11px] text-amber-200/80 leading-relaxed">
                  Notice: {closure.unmeasuredReason}
                </p>
              )}

              {closure.items.length > 0 && (
                <div className="mt-3 border-t border-white/8 pt-2">
                  <div className="text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">
                    Recent records ({closure.items.length})
                  </div>
                  <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {closure.items.map((item) => (
                      <li
                        key={item.resultId}
                        className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1.5 text-[11px]"
                      >
                        <span className="font-mono text-white/80 truncate max-w-[120px]">
                          {item.resultId}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            item.state === 'closed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.state === 'overdue'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-sky-500/20 text-sky-300'
                          }`}
                        >
                          {item.state}
                          {item.closedLate ? ' (late)' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-white/40">No result closure records in scope.</p>
          )}

          <p className="mt-3 text-[10px] leading-tight text-white/40 border-t border-white/5 pt-2">
            Human accountability: automated system notes cannot close result follow-up tasks.
          </p>
        </div>

        {/* Section 2: Diagnostic Routing & Chain of Custody */}
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
              Diagnostic Continuity
            </span>
            <span
              className={`text-xs font-bold ${
                hasDiagnosticGap ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {careAccess ? careAccess.diagnosticContinuity.state.toUpperCase() : '—'}
            </span>
          </div>

          {careAccess ? (
            <div className="mt-2.5 space-y-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Administrative status:</span>
                <span
                  className={`font-semibold ${
                    careAccess.financialWorkflow.state === 'ready'
                      ? 'text-emerald-300'
                      : careAccess.financialWorkflow.state === 'attention'
                      ? 'text-amber-300'
                      : 'text-red-300'
                  }`}
                >
                  {careAccess.financialWorkflow.state}
                </span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Claim packet ready:</span>
                <span className="font-semibold text-white">
                  {careAccess.financialWorkflow.claimSubmissionReady ? 'Yes' : 'Pending evidence'}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-white/65">
                {careAccess.financialWorkflow.nextAdministrativeAction}
              </p>

              {careAccess.financialWorkflow.missingClaimEvidence.length > 0 && (
                <div className="mt-2 rounded-lg bg-amber-400/5 p-2 text-[10px] text-amber-200/90">
                  <span className="font-bold">Missing packet items:</span>{' '}
                  {careAccess.financialWorkflow.missingClaimEvidence.join(', ')}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-white/40">No care access orchestration attached.</p>
          )}

          <p className="mt-3 text-[10px] leading-tight text-white/40 border-t border-white/5 pt-2">
            Chain of custody: remote referrals preserve specimen identity and destination links.
          </p>
        </div>

        {/* Section 3: Episode Transport & Offline Durability */}
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
              Offline Transport
            </span>
            <span
              className={`text-xs font-bold ${
                isTransportDegraded ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {episodeResilience ? episodeResilience.state.toUpperCase() : 'READY'}
            </span>
          </div>

          {episodeResilience ? (
            <div className="mt-2.5 space-y-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Pending events:</span>
                <span className="font-semibold text-white">{episodeResilience.pendingCount}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Acknowledged events:</span>
                <span className="font-semibold text-emerald-300">
                  {episodeResilience.acknowledgedCount}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-white/65">
                {episodeResilience.nextOperationalAction}
              </p>

              {episodeResilience.warnings.length > 0 && (
                <div className="mt-2 rounded-lg bg-amber-400/5 p-2 text-[10px] text-amber-200/90">
                  {episodeResilience.warnings[0]}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2.5 space-y-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Local storage:</span>
                <span className="font-semibold text-emerald-300">Encrypted / Durable</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Replay protection:</span>
                <span className="font-semibold text-emerald-300">Digest-verified</span>
              </div>
              <p className="text-[11px] text-white/65">
                Clinical records persist to local encrypted storage with tamper-evident digests.
              </p>
            </div>
          )}

          <p className="mt-3 text-[10px] leading-tight text-white/40 border-t border-white/5 pt-2">
            Resilience: idempotent transport prevents duplicate encounter orders and lab dispatches.
          </p>
        </div>

        {/* Section 4: One OS Clinical Evidence & Completeness Proof */}
        <div data-one-os-proof="v1" className="rounded-xl border border-white/8 bg-white/[0.025] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
              One OS Care Proof
            </span>
            <span className="text-xs font-bold text-emerald-300">
              {oneOsProof ? formatRate(oneOsProof.completenessCoverage) : '—'}
            </span>
          </div>

          {oneOsProof ? (
            <div className="mt-2.5 space-y-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Trust coverage:</span>
                <span className="font-semibold text-emerald-300">
                  {formatRate(oneOsProof.trustCoverage)}
                </span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Trustworthy fragments:</span>
                <span className="font-semibold text-white">
                  {oneOsProof.trustworthyFragmentCount} / {oneOsProof.fragmentCount}
                </span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Core data classes:</span>
                <span className="font-semibold text-white">
                  {oneOsProof.presentRequiredDataClassCount} / {oneOsProof.requiredDataClassCount}
                </span>
              </div>

              {oneOsProof.unresolvedFragmentCount > 0 && (
                <div className="mt-2 rounded-lg bg-amber-400/5 p-2 text-[10px] text-amber-200/90">
                  <span className="font-bold">Review needed:</span> {oneOsProof.unresolvedFragmentCount} unverified fragment(s)
                </div>
              )}

              {oneOsProof.missingRequiredDataClasses.length > 0 && (
                <div className="mt-2 rounded-lg bg-white/[0.03] p-2 text-[10px] text-white/50">
                  <span className="font-semibold text-white/70">Missing classes:</span>{' '}
                  {oneOsProof.missingRequiredDataClasses.join(', ')}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-white/40">No One OS evidence fragments recorded.</p>
          )}

          <p className="mt-3 text-[10px] leading-tight text-white/40 border-t border-white/5 pt-2">
            Auditable proof: structural measures verify data provenance and completeness without fabricated claims.
          </p>
        </div>

        {/* Section 5: Active Care Journey Continuity (T-CLIN-07, T-CLIN-09) */}
        <div data-care-journey-continuity="v1" className="rounded-xl border border-white/8 bg-white/[0.025] p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
              Care Journey
            </span>
            <span
              className={`text-xs font-bold ${
                careJourneys?.hasBlockedStages
                  ? 'text-red-300'
                  : (careJourneys && careJourneys.atRiskCount > 0
                      ? 'text-amber-300'
                      : (careJourneys && careJourneys.activeJourneys > 0 ? 'text-sky-300' : 'text-emerald-300'))
              }`}
            >
              {careJourneys
                ? (careJourneys.hasBlockedStages
                    ? `${careJourneys.stalledCount} STALLED`
                    : (careJourneys.atRiskCount > 0
                        ? `${careJourneys.atRiskCount} AT RISK`
                        : `${careJourneys.activeJourneys} ACTIVE`))
                : 'NO JOURNEY'}
            </span>
          </div>

          {careJourneys && careJourneys.totalJourneys > 0 ? (
            <div className="mt-2.5 space-y-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Total journeys:</span>
                <span className="font-semibold text-white">{careJourneys.totalJourneys}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Active journeys:</span>
                <span className="font-semibold text-sky-300">{careJourneys.activeJourneys}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Completed:</span>
                <span className="font-semibold text-emerald-300">
                  {careJourneys.completedJourneys}
                  {careJourneys.completedWithVerifiedOutcomeCount > 0
                    ? ` (${careJourneys.completedWithVerifiedOutcomeCount} verified outcome)`
                    : ''}
                </span>
              </div>
              {careJourneys.totalActionItemsCount > 0 && (
                <div className="flex justify-between text-white/70">
                  <span>Plan action items:</span>
                  <span className="font-semibold text-emerald-300">
                    {careJourneys.totalCompletedMilestonesCount > 0
                      ? `${careJourneys.totalCompletedMilestonesCount} fulfilled · ${careJourneys.totalVerifiedActionItemsCount}/${careJourneys.totalActionItemsCount} verified`
                      : `${careJourneys.totalVerifiedActionItemsCount} / ${careJourneys.totalActionItemsCount} verified`}
                  </span>
                </div>
              )}
              {careJourneys.atRiskCount > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>At risk:</span>
                  <span className="font-bold">{careJourneys.atRiskCount}</span>
                </div>
              )}
              {careJourneys.hasBlockedStages && (
                <div className="flex justify-between text-red-300">
                  <span>Stalled / blocked:</span>
                  <span className="font-bold">{careJourneys.stalledCount}</span>
                </div>
              )}
              {careJourneys.totalEscalationsCount > 0 && (
                <div className="flex justify-between text-amber-300" data-care-escalation-metrics="v1">
                  <span>Auto-routed escalations:</span>
                  <span className="font-bold">
                    {careJourneys.totalEscalationsCount} ({careJourneys.clinicianInTrayCount} clinician · {careJourneys.careCoordinatorCount} coord)
                  </span>
                </div>
              )}
              {careJourneys.totalTimelineEventsCount > 0 && (
                <div className="flex justify-between text-indigo-300" data-care-timeline-metrics="v1">
                  <span>Audit trail events:</span>
                  <span className="font-bold">
                    {careJourneys.totalTimelineEventsCount} recorded
                  </span>
                </div>
              )}
              {careJourneys.activeComorbiditiesCount > 0 && (
                <div className="flex justify-between text-teal-300" data-patient-comorbidities="v1">
                  <span>Linked comorbidities:</span>
                  <span className="font-bold">{careJourneys.activeComorbiditiesCount} diagnoses</span>
                </div>
              )}
              {careJourneys.totalPatientTimelineEventsCount > 0 && (
                <div className="flex justify-between text-indigo-300" data-patient-timeline="v1">
                  <span>Patient timeline:</span>
                  <span className="font-bold">
                    {careJourneys.totalPatientTimelineEventsCount} cross-episode events
                  </span>
                </div>
              )}
              {careJourneys.exportableJourneysCount > 0 && (
                <div className="flex justify-between text-cyan-300" data-care-export-ready="v1">
                  <span>Continuity handoff:</span>
                  <span className="font-bold">
                    {careJourneys.exportableJourneysCount} FHIR packet(s) ready
                  </span>
                </div>
              )}
              {(careJourneys.costVerifiedJourneysCount > 0 || careJourneys.costEstimatedJourneysCount > 0) && (
                <div className="flex justify-between text-emerald-300" data-care-cost-rollup="v1">
                  <span>Cost transparency:</span>
                  <span className="font-bold">
                    {careJourneys.costVerifiedJourneysCount > 0
                      ? `${careJourneys.costVerifiedJourneysCount} verified`
                      : `${careJourneys.costEstimatedJourneysCount} est.`}
                    {' · IDR '}
                    {(careJourneys.totalEstimatedCostLow / 1_000_000).toFixed(1)}M–{(careJourneys.totalEstimatedCostHigh / 1_000_000).toFixed(1)}M
                  </span>
                </div>
              )}
              {(careJourneys.highReadmissionRiskCount > 0 || careJourneys.moderateReadmissionRiskCount > 0 || careJourneys.followUpWindowClosedCount > 0) && (
                <div
                  className={`flex justify-between ${
                    careJourneys.highReadmissionRiskCount > 0
                      ? 'text-rose-300'
                      : careJourneys.moderateReadmissionRiskCount > 0
                      ? 'text-amber-300'
                      : 'text-emerald-300'
                  }`}
                  data-care-readmission-surveillance="v1"
                >
                  <span>Post-discharge surveillance:</span>
                  <span className="font-bold">
                    {careJourneys.highReadmissionRiskCount > 0
                      ? `${careJourneys.highReadmissionRiskCount} HIGH RISK`
                      : careJourneys.moderateReadmissionRiskCount > 0
                      ? `${careJourneys.moderateReadmissionRiskCount} MODERATE RISK`
                      : `${careJourneys.followUpWindowClosedCount} closed`}
                  </span>
                </div>
              )}
              {careJourneys.activeReferralsCount > 0 && (
                <div
                  className={`flex justify-between ${
                    careJourneys.emergencyReferralsCount > 0
                      ? 'text-red-300 font-semibold'
                      : 'text-violet-300'
                  }`}
                  data-care-referral-handshake="v1"
                >
                  <span>Referral handshake:</span>
                  <span className="font-bold">
                    {careJourneys.emergencyReferralsCount > 0
                      ? `EMERGENCY (${careJourneys.acknowledgedReferralsCount}/${careJourneys.activeReferralsCount} ack)`
                      : `${careJourneys.activeReferralsCount} active (${careJourneys.acknowledgedReferralsCount} ack)`}
                  </span>
                </div>
              )}
              {careJourneys.edenReadyJourneysCount > 0 && (
                <div className="flex justify-between text-emerald-200" data-eden-calm-companion="v1">
                  <span>Eden 3-depth companion:</span>
                  <span className="font-bold">
                    {careJourneys.edenReadyJourneysCount} active (Simple · Explore · Deep)
                  </span>
                </div>
              )}
              {careJourneys.edenLifeBalance && (
                <div
                  className="flex justify-between text-teal-200"
                  data-eden-life-balance="v1"
                  data-eden-calm-state={careJourneys.edenLifeBalance.calmState}
                >
                  <span>Eden life balance:</span>
                  <span className="font-bold">{careJourneys.edenLifeBalance.calmStateLabel}</span>
                </div>
              )}
              {careJourneys.edenLifeStoryAlignedCount > 0 && (
                <div
                  className="flex justify-between text-cyan-200"
                  data-eden-life-story-bridge="v1"
                >
                  <span>Life story threads:</span>
                  <span className="font-bold">
                    {careJourneys.edenLifeStoryAlignedCount} linked (self-authored)
                  </span>
                </div>
              )}
              {careJourneys.edenPhysiologyLinkedCount > 0 && (
                <div
                  className="flex justify-between text-indigo-200"
                  data-eden-physiology-bridge="v1"
                >
                  <span>Living physiology:</span>
                  <span className="font-bold">
                    {careJourneys.edenPhysiologyLinkedCount} organ-coupled
                  </span>
                </div>
              )}
              {careJourneys.edenLongevityReadyCount > 0 && (
                <div
                  className="flex justify-between text-amber-200"
                  data-eden-longevity-rhythm="v1"
                >
                  <span>Daily longevity rhythm:</span>
                  <span className="font-bold">
                    {careJourneys.edenLongevityReadyCount} 4-pillar active
                  </span>
                </div>
              )}
              {careJourneys.edenSupportCircleReadyCount > 0 && (
                <div
                  className="flex justify-between text-pink-200"
                  data-eden-support-circle="v1"
                >
                  <span>Circle of care:</span>
                  <span className="font-bold">
                    {careJourneys.edenSupportCircleReadyCount} opt-in ready
                  </span>
                </div>
              )}
              {careJourneys.edenVisitPrepReadyCount > 0 && (
                <div
                  className="flex justify-between text-violet-200"
                  data-eden-visit-prep="v1"
                >
                  <span>Visit prep questions:</span>
                  <span className="font-bold">
                    {careJourneys.edenVisitPrepReadyCount} 3-question guide(s)
                  </span>
                </div>
              )}
              {careJourneys.edenReflectionSanctuaryReadyCount > 0 && (
                <div
                  className="flex justify-between text-sky-200"
                  data-eden-reflection-sanctuary="v1"
                >
                  <span>Reflection sanctuary:</span>
                  <span className="font-bold">
                    {careJourneys.edenReflectionSanctuaryReadyCount} 4-lens pluralistic
                  </span>
                </div>
              )}
              {careJourneys.edenUniversalAcceptanceReadyCount > 0 && (
                <div
                  className="flex justify-between text-lime-200"
                  data-eden-universal-acceptance="v1"
                >
                  <span>Universal acceptance:</span>
                  <span className="font-bold">
                    {careJourneys.edenUniversalAcceptanceReadyCount} ID/EN adaptive
                  </span>
                </div>
              )}
              {careJourneys.edenRestorativeReadyCount > 0 && (
                <div
                  className="flex justify-between text-emerald-300"
                  data-eden-restorative-environment="v1"
                >
                  <span>Restorative & bio-harmony:</span>
                  <span className="font-bold">
                    {careJourneys.edenRestorativeReadyCount} nature & sunlight aligned
                  </span>
                </div>
              )}
              {careJourneys.edenMultiModelRegenerationReadyCount > 0 && (
                <div
                  className="flex justify-between text-fuchsia-300"
                  data-eden-multi-model-regeneration="v1"
                >
                  <span>Multi-model frontier R&D:</span>
                  <span className="font-bold">
                    {careJourneys.edenMultiModelRegenerationReadyCount} 4-model collective
                  </span>
                </div>
              )}
              {careJourneys.edenQuantumBioPhotonicReadyCount > 0 && (
                <div
                  className="flex justify-between text-cyan-300"
                  data-eden-quantum-biophotonic="v1"
                >
                  <span>Resonansi biofotonik kuantum:</span>
                  <span className="font-bold">
                    {careJourneys.edenQuantumBioPhotonicReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenMultidimensionalConsciousnessReadyCount > 0 && (
                <div
                  className="flex justify-between text-indigo-300"
                  data-eden-multidimensional-consciousness="v1"
                >
                  <span>Kesadaran biologis multidimensi:</span>
                  <span className="font-bold">
                    {careJourneys.edenMultidimensionalConsciousnessReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenBioCosmicSymphonyReadyCount > 0 && (
                <div
                  className="flex justify-between text-violet-300"
                  data-eden-bio-cosmic-symphony="v1"
                >
                  <span>Simfoni bio-kosmis & lattice realitas:</span>
                  <span className="font-bold">
                    {careJourneys.edenBioCosmicSymphonyReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenMultiAgentHealingCouncilReadyCount > 0 && (
                <div
                  className="flex justify-between text-emerald-300"
                  data-eden-multi-agent-council="v1"
                >
                  <span>Dewan penyembuhan multi-model AI:</span>
                  <span className="font-bold">
                    {careJourneys.edenMultiAgentHealingCouncilReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenBioHarmonicWaveformReadyCount > 0 && (
                <div
                  className="flex justify-between text-cyan-300"
                  data-eden-bio-harmonic-waveform="v1"
                >
                  <span>Resonansi bio-harmonik & jam epigenetik:</span>
                  <span className="font-bold">
                    {careJourneys.edenBioHarmonicWaveformReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenCircadianMitochondrialHarmonizerReadyCount > 0 && (
                <div
                  className="flex justify-between text-amber-300"
                  data-eden-circadian-mitochondrial="v1"
                >
                  <span>Kronobiologi sirkadian & vitalitas mitokondria:</span>
                  <span className="font-bold">
                    {careJourneys.edenCircadianMitochondrialHarmonizerReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenProteostasisAutophagicFluxReadyCount > 0 && (
                <div
                  className="flex justify-between text-teal-300"
                  data-eden-proteostasis-flux="v1"
                >
                  <span>Proteostasis regeneratif & fluks autofagi:</span>
                  <span className="font-bold">
                    {careJourneys.edenProteostasisAutophagicFluxReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenTelomericGenomicIntegrityReadyCount > 0 && (
                <div
                  className="flex justify-between text-indigo-300"
                  data-eden-telomeric-genomic="v1"
                >
                  <span>Integritas genomik & pemeliharaan telomer:</span>
                  <span className="font-bold">
                    {careJourneys.edenTelomericGenomicIntegrityReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenSenescentInflammagingReadyCount > 0 && (
                <div
                  className="flex justify-between text-rose-300"
                  data-eden-senescent-inflammaging="v1"
                >
                  <span>Atenuasi senesen & secretome inflammaging:</span>
                  <span className="font-bold">
                    {careJourneys.edenSenescentInflammagingReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenRegenerativePlasticityReadyCount > 0 && (
                <div
                  className="flex justify-between text-emerald-300"
                  data-eden-regenerative-plasticity="v1"
                >
                  <span>Niche sel punca & plastisitas regeneratif:</span>
                  <span className="font-bold">
                    {careJourneys.edenRegenerativePlasticityReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenEpigeneticAgeReversalReadyCount > 0 && (
                <div
                  className="flex justify-between text-purple-300"
                  data-eden-epigenetic-reversal="v1"
                >
                  <span>Pembalikan usia epigenetik & harmoni RNA:</span>
                  <span className="font-bold">
                    {careJourneys.edenEpigeneticAgeReversalReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenMitochondrialHeteroplasmyReadyCount > 0 && (
                <div
                  className="flex justify-between text-amber-300"
                  data-eden-mitochondrial-heteroplasmy="v1"
                >
                  <span>Heteroplasmi & fusi retikular mitokondria:</span>
                  <span className="font-bold">
                    {careJourneys.edenMitochondrialHeteroplasmyReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenCircadianAutophagyPulseReadyCount > 0 && (
                <div
                  className="flex justify-between text-emerald-300"
                  data-eden-circadian-autophagy="v1"
                >
                  <span>Autofagi pulsatil & xenohormesis sirkadian:</span>
                  <span className="font-bold">
                    {careJourneys.edenCircadianAutophagyPulseReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenRetrotransposonSilencingReadyCount > 0 && (
                <div
                  className="flex justify-between text-indigo-300"
                  data-eden-retrotransposon-silencing="v1"
                >
                  <span>Peredaman retrotransposon & vigilansi LINE-1:</span>
                  <span className="font-bold">
                    {careJourneys.edenRetrotransposonSilencingReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenSirtuinNadParp1ReadyCount > 0 && (
                <div
                  className="flex justify-between text-cyan-300"
                  data-eden-sirtuin-nad="v1"
                >
                  <span>Resonansi Sirtuin-NAD+ & reparasi PARP1:</span>
                  <span className="font-bold">
                    {careJourneys.edenSirtuinNadParp1ReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenShelterinCapProtectionReadyCount > 0 && (
                <div
                  className="flex justify-between text-emerald-300"
                  data-eden-shelterin-cap="v1"
                >
                  <span>Kompleks Shelterin & proteksi dekap telomerik:</span>
                  <span className="font-bold">
                    {careJourneys.edenShelterinCapProtectionReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenMitophagicPrimingReadyCount > 0 && (
                <div
                  className="flex justify-between text-teal-300"
                  data-eden-mitophagy="v1"
                >
                  <span>Fisi mitokondria & priming mitofagi:</span>
                  <span className="font-bold">
                    {careJourneys.edenMitophagicPrimingReadyCount} episode terhubung
                  </span>
                </div>
              )}
              {careJourneys.edenMicrovascularResilienceReadyCount > 0 && (
                <div
                  className="flex justify-between text-sky-300"
                  data-eden-glycocalyx="v1"
                >
                  <span>Glikokaliks endotel & perfusi mikrovaskular:</span>
                  <span className="font-bold">
                    {careJourneys.edenMicrovascularResilienceReadyCount} episode terhubung
                  </span>
                </div>
              )}

              {careJourneys.episodes.length > 0 && (
                <div className="mt-3 border-t border-white/8 pt-2">
                  <div className="text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">
                    Trajectory stages ({careJourneys.episodes.length})
                  </div>
                  <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {careJourneys.episodes.map((ep) => (
                      <li
                        key={ep.id}
                        className="rounded-lg bg-black/20 px-2 py-1.5 text-[11px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white/85 truncate max-w-[130px]" title={ep.title}>
                            {ep.title}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              ep.health === 'stalled'
                                ? 'bg-red-500/20 text-red-300'
                                : ep.health === 'at_risk'
                                ? 'bg-amber-500/20 text-amber-300'
                                : ep.stageStatus === 'done'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-sky-500/20 text-sky-300'
                            }`}
                          >
                            {ep.activeStage} ({ep.health === 'stalled' ? 'stalled' : (ep.health === 'at_risk' ? 'at risk' : ep.stageStatus)})
                          </span>
                        </div>
                        {ep.stalledReason && (
                          <div
                            className={`mt-1 text-[10px] italic ${
                              ep.health === 'stalled' ? 'text-red-300/80' : 'text-amber-300/80'
                            }`}
                          >
                            {ep.health === 'stalled' ? 'Stall: ' : 'Risk: '}
                            {ep.stalledReason}
                          </div>
                        )}
                        {ep.outcomeRecord && (
                          <div
                            className="mt-1.5 flex items-center justify-between rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px]"
                            data-outcome-record="v1"
                            data-outcome-status={ep.outcomeRecord.status}
                          >
                            <span className="text-emerald-300 font-semibold flex items-center gap-1">
                              ✓ Outcome: {ep.outcomeRecord.status.replace('_', ' ')}
                            </span>
                            <span className="text-emerald-400/80 truncate max-w-[130px]" title={ep.outcomeRecord.summary}>
                              {ep.outcomeRecord.summary}
                            </span>
                          </div>
                        )}
                        {ep.escalation && (
                          <div
                            className="mt-1.5 flex items-center justify-between rounded bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-[10px]"
                            data-escalation-routing="v1"
                            data-escalation-target={ep.escalation.target}
                            data-escalation-action={ep.escalation.action}
                          >
                            <span className="text-amber-200 font-semibold flex items-center gap-1">
                              ⚡ {ep.escalation.target}: {ep.escalation.actionLabel}
                            </span>
                            <span className="text-amber-300/80 font-mono">
                              {ep.escalation.daysOverdue > 0 ? `+${ep.escalation.daysOverdue}d overdue` : 'at risk'}
                            </span>
                          </div>
                        )}
                        {ep.milestones && ep.milestones.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1" data-care-milestones="v1">
                            {ep.milestones.slice(0, 3).map((ms) => (
                              <span
                                key={ms.id}
                                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium ${
                                  ms.completed
                                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                                    : ms.verified
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : ms.status === 'cancelled'
                                    ? 'bg-neutral-500/15 text-neutral-400 line-through'
                                    : 'bg-amber-500/15 text-amber-300'
                                }`}
                                title={`${ms.title}${ms.resultValue ? ` [Result: ${ms.resultValue}]` : ''} (target stage: ${ms.targetStage})`}
                              >
                                {ms.completed ? '✓ ' : ms.verified ? '✓ ' : '⏳ '}
                                {ms.category}: {ms.title.slice(0, 16)}
                                {ms.resultValue ? ` (${ms.resultValue})` : ms.title.length > 16 ? '…' : ''}
                              </span>
                            ))}
                            {ep.milestones.length > 3 && (
                              <span className="self-center text-[9px] text-white/40">
                                +{ep.milestones.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        {ep.timelineEvents && ep.timelineEvents.length > 0 && (
                          <div
                            className="mt-1.5 rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 text-[10px]"
                            data-care-timeline-audit="v1"
                          >
                            <div className="flex items-center justify-between text-indigo-200 font-semibold mb-0.5">
                              <span>Audit: {ep.timelineEvents.length} events</span>
                              <span className="text-[9px] text-indigo-300/80 font-mono">
                                {ep.timelineEvents[0].timestamp.replace('T', ' ').slice(0, 10)}
                              </span>
                            </div>
                            <div className="text-indigo-300/90 truncate" title={ep.timelineEvents[0].title}>
                              Latest: {ep.timelineEvents[0].title}
                            </div>
                          </div>
                        )}
                        <div className="mt-1 flex items-center justify-between text-[10px] text-white/45">
                          <span>Progress: {ep.completedStagesCount}/{ep.totalStagesCount} stages</span>
                          {ep.elapsedDaysInCurrentStage != null ? (
                            <span className="text-[9px] text-white/60">{ep.elapsedDaysInCurrentStage}d in stage</span>
                          ) : ep.diagnosisCode ? (
                            <span className="font-mono text-[9px] text-white/60">ICD-10: {ep.diagnosisCode}</span>
                          ) : null}
                        </div>
                        {ep.edenCompanion && (
                          <div
                            className="mt-1 text-[10px] text-emerald-200/85 truncate"
                            data-eden-next-step="v1"
                            title={ep.edenCompanion.nextBeautifulStep.invitation}
                          >
                            Next step: {ep.edenCompanion.nextBeautifulStep.invitation}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2.5 space-y-2 text-xs">
              <p className="text-white/40">No care episodes seeded for this encounter.</p>
              <p className="text-[11px] text-white/55">
                Care journeys track diagnosis through treatment, provider selection, and recovery.
              </p>
            </div>
          )}

          <div className="mt-3 border-t border-white/5 pt-2 flex items-center justify-between">
            <a
              href="#/care-episode"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Open Care Journey &rarr;
            </a>
            <span className="text-[10px] text-white/40">Longitudinal</span>
          </div>
        </div>
      </div>

      {/* Safety & Clinical Care Boundary Footnote */}
      <footer className="mt-4 flex items-start gap-2 rounded-xl border border-white/5 bg-black/20 p-2.5 text-[11px] leading-relaxed text-white/50">
        <IconShield size={14} className="mt-0.5 shrink-0 text-[#f0d68a]" />
        <span>
          <strong className="text-white/75">Clinical Safety Boundary:</strong> Financial or administrative workflow state may never deny emergency or vital clinical care. Diagnostic continuity and referral tracking assist coordination but do not substitute for authorized clinician medical decision-making.
        </span>
      </footer>
    </section>
  )
}
