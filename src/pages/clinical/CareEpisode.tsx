import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { api, backendEnabled, type FacilityPriceSubmission } from '../../lib/api'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../../components/ui'
import { IconPlan, IconPlus } from '../../components/icons'
import { deriveCareJourneyTimelineEvents, exportCareJourneySummary } from '../../domains/clinical-operations'
import {
  CARE_EPISODE_STAGES,
  STAGE_LABEL,
  STATUS_LABEL,
  newCareEpisode,
  ensureEpisodeFromVerifiedPlan,
  nextStages,
  isComplete,
  setStageStatus,
  setCostEstimate,
  formatCostRange,
  providerOptions,
  candidateViews,
  addCandidate,
  removeCandidate,
  updateCandidateCost,
  chooseCandidate,
  detectStalls,
  episodeHealth,
  stallReason,
  setExpectedDays,
  syncEpisodeWithPlanItems,
  fulfillMilestonesWithSupportiveResults,
  recordClinicalOutcome,
  COST_ITEM_PRESETS,
  addCostItem,
  updateCostItem,
  removeCostItem,
  type CandidateView,
  type StageStall,
} from '../../lib/careEpisode'
import type {
  CareEpisode,
  CareEpisodeStageId,
  CareEpisodeStageStatus,
  CarePlanMilestone,
  ClinicalOutcomeRecord,
  ClinicalOutcomeStatus,
  CostItem,
  PlanItem,
  SupportiveResult,
} from '../../lib/types'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'
import { PanaceaZoneNav } from '../../components/PanaceaZoneNav'

// The Care Episode Graph: connects a clinical plan to what actually has to
// happen to carry it out — provider, cost, schedule, treatment, recovery,
// follow-up, outcome. Recovery and follow-up run in parallel once treatment
// is done (see lib/careEpisode.ts's STAGE_DEPENDENCIES). One episode is
// tracked against the active patient's EMR record. See lib/careEpisode.ts.

export function CareEpisodePage() {
  const { state, activePatient, saveRecord } = useStore()
  const record = state.records[activePatient.id]
  const [newTitle, setNewTitle] = useState('')

  if (!record) {
    return (
      <div className="space-y-5">
        <PanaceaZoneNav />
        <Card className="mx-auto max-w-md text-center">
          <IconPlan size={40} className="mx-auto text-brand" />
          <h3 className="mt-3 text-lg font-bold">No care episode yet</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Draft a plan in the <b>AI Chatbot</b> or start in <b>Visit OS</b>, then track it here as a full care journey.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link to="/visit">
              <Button>Open Visit OS</Button>
            </Link>
            <Link to="/chatbot">
              <Button variant="outline">Open AI Chatbot</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const episodes = record.careEpisodes ?? []

  function update(episodes: CareEpisode[]) {
    saveRecord({ ...record!, careEpisodes: episodes, updatedAt: new Date().toISOString() })
  }

  const [duplicateWarning, setDuplicateWarning] = useState(false)

  function addEpisode() {
    const title = newTitle.trim()
    if (!title) return
    // Auto-seeding from a verified plan already guards against duplicates by
    // diagnosis code; a manually-typed title has no such key, so guard by
    // title instead — same journey shouldn't get two separate trackers.
    if (episodes.some((e) => e.title.trim().toLowerCase() === title.toLowerCase())) {
      setDuplicateWarning(true)
      return
    }
    setDuplicateWarning(false)
    update([...episodes, newCareEpisode(title)])
    setNewTitle('')
  }

  function updateEpisode(id: string, next: CareEpisode) {
    update(episodes.map((e) => (e.id === id ? next : e)))
  }

  function removeEpisode(id: string) {
    update(episodes.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-5">
      <PanaceaZoneNav />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle
          icon={<IconPlan size={18} />}
          title="Care journey"
          subtitle="Problem to prevention — everything a plan item triggers in the real world."
        />
        <div className="flex flex-wrap items-center gap-2 self-start" data-planning-nav="v1">
          <Link
            to="/visit"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-white/70 transition hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white"
          >
            ← Visit OS
          </Link>
          <Link
            to="/planning"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-white/70 transition hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white"
          >
            Clinical Plan →
          </Link>
        </div>
      </div>
      <BatasKlaimKesehatan permukaan="care.episode" />

      {record.primaryDiagnosis && !episodes.some((e) => e.diagnosisCode === record.primaryDiagnosis?.code) && (
        <Card className="border border-brand/20 bg-brand/5 dark:bg-brand/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="brand">Encounter diagnosis</Badge>
                <span className="font-mono text-xs font-bold text-neutral-600 dark:text-neutral-400">
                  {record.primaryDiagnosis.code}
                </span>
              </div>
              <h4 className="mt-1 font-bold text-ink">{record.primaryDiagnosis.title}</h4>
              <p className="mt-0.5 text-xs text-neutral-500">
                Primary diagnosis from active encounter. Track as an end-to-end care journey with problem and diagnosis stages already verified.
              </p>
            </div>
            <Button
              data-seed-journey="primary-diagnosis"
              onClick={() => {
                const nextRecord = ensureEpisodeFromVerifiedPlan(record)
                saveRecord(nextRecord)
              }}
              className="shrink-0"
            >
              Track care journey
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <Field label="New care episode">
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="e.g. Gallstone — surgical evaluation"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value)
                setDuplicateWarning(false)
              }}
              onKeyDown={(e) => e.key === 'Enter' && addEpisode()}
            />
            <Button onClick={addEpisode} className="shrink-0">
              <IconPlus size={16} /> Start
            </Button>
          </div>
          {duplicateWarning && (
            <p className="mt-2 text-xs text-accent">
              An episode with this title already exists — track it below instead of starting a duplicate.
            </p>
          )}
        </Field>
      </Card>

      {episodes.length === 0 && (
        <p className="text-center text-sm text-neutral-500">No care episodes tracked yet.</p>
      )}

      {episodes.map((ep) => (
        <EpisodeCard
          key={ep.id}
          episode={ep}
          recordPlan={record.plan}
          supportiveResults={state.supportive[activePatient.id]}
          onChange={(next) => updateEpisode(ep.id, next)}
          onRemove={() => removeEpisode(ep.id)}
        />
      ))}
    </div>
  )
}

function EpisodeCard({
  episode,
  recordPlan,
  supportiveResults,
  onChange,
  onRemove,
}: {
  episode: CareEpisode
  recordPlan?: readonly PlanItem[]
  supportiveResults?: readonly SupportiveResult[]
  onChange: (next: CareEpisode) => void
  onRemove: () => void
}) {
  const next = nextStages(episode)
  const done = isComplete(episode)
  const cost = formatCostRange(episode)
  const health = episodeHealth(episode)
  const stalls = detectStalls(episode)
  const blockedStages = episode.stages.filter((s) => s.status === 'blocked')

  function cycle(stage: CareEpisodeStageId, current: CareEpisodeStageStatus) {
    const order: CareEpisodeStageStatus[] = ['pending', 'active', 'done', 'blocked']
    const idx = order.indexOf(current)
    const status = order[(idx + 1) % order.length]
    // No native prompt() — the reason gets typed inline in the blocked-stage
    // panel below, which also makes it editable later instead of fixed at
    // the moment the stage was marked blocked.
    onChange(setStageStatus(episode, stage, status))
  }

  const displayMilestones: readonly CarePlanMilestone[] =
    episode.milestones && episode.milestones.length > 0
      ? episode.milestones
      : (recordPlan ?? []).map((p) => ({
          id: p.id,
          title: p.text,
          category: p.category,
          targetStage:
            p.category === 'Definitif' || p.category === 'Suportif'
              ? 'treatment'
              : p.category === 'Follow-up'
              ? 'followUp'
              : p.category === 'Monitoring'
              ? 'recovery'
              : 'plan',
          status: p.status === 'diverifikasi' ? 'verified' : p.status === 'ditolak' ? 'cancelled' : 'pending',
        }))

  return (
    <Card data-care-episode-id={episode.id} data-diagnosis-code={episode.diagnosisCode || 'none'}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-ink">{episode.title}</h3>
            {episode.diagnosisCode && (
              <Badge tone="neutral">
                <span className="font-mono text-[10px]">ICD-10: {episode.diagnosisCode}</span>
              </Badge>
            )}
            {episode.linkedComorbidities && episode.linkedComorbidities.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap" data-care-comorbidities="v1">
                {episode.linkedComorbidities.map((c) => (
                  <Badge key={c} tone="brand">
                    <span className="text-[10px]">Linked: {c}</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {done
              ? 'Complete'
              : next.length > 0
                ? `Next: ${next.map((s) => STAGE_LABEL[s.stage]).join(' + ')}`
                : 'On track'}
            {cost ? ` · Est. ${cost}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {done && <Badge tone="normal">Done</Badge>}
          {!done && health === 'at_risk' && <Badge tone="low">At risk</Badge>}
          {!done && health === 'stalled' && <Badge tone="high">Stalled</Badge>}
          <Button variant="ghost" onClick={onRemove} className="!min-h-0 !px-2 !py-1 text-xs">
            Remove
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CARE_EPISODE_STAGES.map((stageId) => {
          const stage = episode.stages.find((s) => s.stage === stageId)
          const status = stage?.status ?? 'pending'
          const tone =
            status === 'done' ? 'normal' : status === 'blocked' ? 'high' : status === 'active' ? 'brand' : 'neutral'
          return (
            <button
              key={stageId}
              onClick={() => cycle(stageId, status)}
              className="text-left"
              title={stage?.blockedReason ?? STATUS_LABEL[status]}
            >
              <Badge tone={tone}>
                {STAGE_LABEL[stageId]} · {STATUS_LABEL[status]}
              </Badge>
            </button>
          )
        })}
      </div>

      {(blockedStages.length > 0 || stalls.length > 0) && (
        <div className="mt-3 space-y-2 rounded-xl bg-accent/5 p-3">
          {blockedStages.map((s) => (
            <BlockedReasonEditor
              key={s.stage}
              stage={s.stage}
              reason={s.blockedReason}
              onChange={(reason) => onChange(setStageStatus(episode, s.stage, 'blocked', { blockedReason: reason }))}
            />
          ))}
          {stalls.map((s) => (
            <StallLine
              key={s.stage}
              stall={s}
              onAdjust={(days) => onChange(setExpectedDays(episode, s.stage, days))}
            />
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <ProviderComparison episode={episode} onChange={onChange} />
      </div>

      {episode.facilityId && (
        <div className="mt-4 border-t border-neutral-100 dark:border-white/10 pt-4">
          <CostEstimateField episode={episode} onChange={onChange} />
        </div>
      )}

      {/* Care Plan Milestones (T-CLIN-10, T-CLIN-11) */}
      {displayMilestones.length > 0 && (
        <div className="mt-4 border-t border-neutral-100 dark:border-white/10 pt-4" data-episode-milestones="v1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-xs font-bold text-ink">Encounter Plan Milestones</h4>
              <p className="text-[11px] text-neutral-500">
                Longitudinal action items mapped from clinical encounter orders to trajectory stages.
              </p>
            </div>
            {recordPlan && recordPlan.length > 0 && (
              <Button
                variant="outline"
                className="!min-h-0 !px-2.5 !py-1 text-[11px] self-start sm:self-auto"
                onClick={() => {
                  let nextEp = syncEpisodeWithPlanItems(episode, recordPlan, { autoAdvancePlanStage: true })
                  if (supportiveResults && supportiveResults.length > 0) {
                    nextEp = fulfillMilestonesWithSupportiveResults(nextEp, supportiveResults)
                  }
                  onChange(nextEp)
                }}
              >
                Sync with Encounter Plan
              </Button>
            )}
          </div>
          <div className="mt-2.5 space-y-1.5">
            {displayMilestones.map((ms) => (
              <div
                key={ms.id}
                className="flex items-center justify-between rounded-lg bg-neutral-50 dark:bg-white/[0.03] px-2.5 py-1.5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    tone={
                      ms.status === 'completed'
                        ? 'normal'
                        : ms.status === 'verified'
                        ? 'brand'
                        : ms.status === 'cancelled'
                        ? 'neutral'
                        : 'low'
                    }
                  >
                    {ms.category}
                  </Badge>
                  <span className="truncate text-ink font-medium">{ms.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[11px] text-neutral-500">
                  <span>→ {STAGE_LABEL[ms.targetStage as CareEpisodeStageId] ?? ms.targetStage}</span>
                  <span
                    className={
                      ms.status === 'completed'
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : ms.status === 'verified'
                        ? 'text-sky-600 dark:text-sky-400 font-semibold'
                        : ms.status === 'cancelled'
                        ? 'text-neutral-400 line-through'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {ms.status === 'completed'
                      ? `Fulfilled${ms.resultValue ? ` (${ms.resultValue})` : ''}`
                      : ms.status === 'verified'
                      ? 'Verified'
                      : ms.status === 'cancelled'
                      ? 'Cancelled'
                      : 'Pending review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Outcome Closure (T-CLIN-13) */}
      <OutcomeVerificationSection episode={episode} onChange={onChange} />

      {/* Longitudinal Care Journey Timeline & Event Provenance Audit Trail (T-CLIN-14) */}
      <JourneyTimelineSection episode={episode} />

      {/* Care Journey Continuity Handoff & FHIR-Aligned Summary Export (T-CLIN-16) */}
      <CareJourneyExportSection episode={episode} />
    </Card>
  )
}

function OutcomeVerificationSection({
  episode,
  onChange,
}: {
  episode: CareEpisode
  onChange: (next: CareEpisode) => void
}) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState<ClinicalOutcomeStatus>(
    episode.outcomeRecord?.status ?? 'resolved'
  )
  const [summary, setSummary] = useState(episode.outcomeRecord?.summary ?? '')
  const [followUpPlan, setFollowUpPlan] = useState(episode.outcomeRecord?.followUpPlan ?? '')

  if (episode.outcomeRecord && !editing) {
    return (
      <div
        className="mt-4 border-t border-neutral-100 dark:border-white/10 pt-4"
        data-care-outcome-card="v1"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-ink">Clinical Outcome Verification</h4>
              <Badge tone="normal">
                {episode.outcomeRecord.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
              {episode.outcomeRecord.summary}
            </p>
            {episode.outcomeRecord.followUpPlan && (
              <p className="mt-0.5 text-[11px] text-neutral-500">
                Follow-up plan: {episode.outcomeRecord.followUpPlan}
              </p>
            )}
            {episode.outcomeRecord.verifiedById && (
              <p className="mt-1 text-[10px] text-neutral-400 font-mono">
                Verified by {episode.outcomeRecord.verifiedById}
                {episode.outcomeRecord.verifiedAt ? ` on ${episode.outcomeRecord.verifiedAt.slice(0, 10)}` : ''}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            className="!min-h-0 !px-2.5 !py-1 text-[11px]"
            onClick={() => setEditing(true)}
          >
            Update Outcome
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="mt-4 border-t border-neutral-100 dark:border-white/10 pt-4"
      data-care-outcome-card="v1"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-ink">Clinical Outcome Closure</h4>
          {editing && (
            <button
              type="button"
              className="text-xs text-neutral-500 underline"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          )}
        </div>
        <p className="text-[11px] text-neutral-500">
          Record clinician evaluation of care journey completion and longitudinal case resolution.
        </p>

        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase">Outcome Status</label>
            <select
              className={`${inputClass} !mt-1 !min-h-[36px] !text-xs w-full`}
              value={status}
              onChange={(e) => setStatus(e.target.value as ClinicalOutcomeStatus)}
            >
              <option value="resolved">Resolved (Complete recovery)</option>
              <option value="improved">Improved (Significant clinical improvement)</option>
              <option value="stable">Stable (Condition stabilized)</option>
              <option value="chronic_managed">Chronic Managed (Ongoing control established)</option>
              <option value="referred">Referred (Specialist continuation)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase">Follow-up Plan</label>
            <input
              className={`${inputClass} !mt-1 !min-h-[36px] !text-xs w-full`}
              placeholder="e.g. Return in 3 months with HbA1c"
              value={followUpPlan}
              onChange={(e) => setFollowUpPlan(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-neutral-500 uppercase">Clinical Summary</label>
          <input
            className={`${inputClass} !mt-1 !min-h-[36px] !text-xs w-full`}
            placeholder="Clinical evaluation of treatment efficacy and journey completion"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div className="mt-1 flex items-center justify-end gap-2">
          <Button
            variant="primary"
            className="!min-h-0 !px-3 !py-1.5 text-xs font-semibold"
            disabled={!summary.trim()}
            onClick={() => {
              const updated = recordClinicalOutcome(episode, {
                status,
                summary: summary.trim(),
                followUpPlan: followUpPlan.trim() || undefined,
                verifiedById: 'dr-clinician',
                verifiedAt: new Date().toISOString(),
              })
              onChange(updated)
              setEditing(false)
            }}
          >
            Sign & Complete Care Journey
          </Button>
        </div>
      </div>
    </div>
  )
}

function JourneyTimelineSection({ episode }: { episode: CareEpisode }) {
  const [filterKind, setFilterKind] = useState<string>('all')
  const events = useMemo(() => {
    return deriveCareJourneyTimelineEvents(episode)
  }, [episode])

  const filteredEvents = useMemo(() => {
    if (filterKind === 'all') return events
    return events.filter((e) => e.kind === filterKind)
  }, [events, filterKind])

  if (events.length === 0) return null

  return (
    <div
      className="mt-6 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] p-4"
      data-care-journey-timeline="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-200 dark:border-white/10 pb-3">
        <div>
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <span>Care Journey Event Timeline</span>
            <span className="rounded-full bg-neutral-200 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-neutral-700 dark:text-white/80">
              {events.length} events
            </span>
          </h4>
          <p className="text-xs text-neutral-500 dark:text-white/60">
            Immutable chronological audit trail and clinical provenance
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'All' },
            { id: 'stage_transition', label: 'Stages' },
            { id: 'milestone_fulfilled', label: 'Milestones' },
            { id: 'outcome_verified', label: 'Outcomes' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterKind(f.id)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                filterKind === f.id
                  ? 'bg-primary text-white'
                  : 'bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-white/70 hover:bg-neutral-300 dark:hover:bg-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 relative pl-4 border-l-2 border-neutral-200 dark:border-white/10 space-y-3">
        {filteredEvents.map((evt) => (
          <div key={evt.id} className="relative text-xs">
            <div
              className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#06101e] ${
                evt.severity === 'success'
                  ? 'bg-emerald-500'
                  : evt.severity === 'warning'
                  ? 'bg-amber-500'
                  : evt.severity === 'stalled'
                  ? 'bg-red-500'
                  : 'bg-sky-500'
              }`}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
              <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                {evt.title}
                {evt.badge && (
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                      evt.severity === 'success'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : evt.severity === 'warning'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                    }`}
                  >
                    {evt.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-mono text-neutral-400 dark:text-white/40">
                {evt.timestamp.replace('T', ' ').slice(0, 19)}
              </span>
            </div>
            {evt.description && (
              <p className="mt-0.5 text-[11px] text-neutral-600 dark:text-white/70">
                {evt.description}
              </p>
            )}
            {evt.actorId && (
              <span className="text-[10px] text-neutral-400 dark:text-white/40 italic">
                Actor: {evt.actorId}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CareJourneyExportSection({ episode }: { episode: CareEpisode }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const packet = useMemo(() => exportCareJourneySummary(episode), [episode])

  return (
    <div
      className="mt-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] p-3.5"
      data-care-export-summary="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              FHIR-Aligned Continuity Handoff Packet
            </h4>
            <Badge tone="brand">
              <span className="font-mono text-[10px]">{packet.standard}</span>
            </Badge>
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-white/60 font-mono truncate max-w-md">
            Digest: {packet.auditDigest}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="!min-h-0 !px-2.5 !py-1 text-[11px]"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(JSON.stringify(packet, null, 2)).catch(() => {})
              }
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            {copied ? 'Copied JSON ✓' : 'Copy Handoff JSON'}
          </Button>
          <Button
            variant="ghost"
            className="!min-h-0 !px-2.5 !py-1 text-[11px]"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide Packet' : 'Inspect Packet'}
          </Button>
        </div>
      </div>

      {expanded && (
        <pre className="mt-3 max-h-56 overflow-auto rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 p-2.5 text-[10px] font-mono text-neutral-800 dark:text-white/80">
          {JSON.stringify(packet, null, 2)}
        </pre>
      )}
    </div>
  )
}

function getStageEscalationRouting(stage: CareEpisodeStageId): { target: string; label: string } {
  if (stage === 'problem' || stage === 'diagnosis' || stage === 'plan' || stage === 'treatment' || stage === 'recovery') {
    return { target: 'Clinician In-Tray', label: 'Clinician Review' }
  }
  if (stage === 'schedule') {
    return { target: 'Patient Outreach', label: 'Patient Booking Reminder' }
  }
  return { target: 'Care Coordinator', label: 'Coordinator Outreach' }
}

function BlockedReasonEditor({
  stage,
  reason,
  onChange,
}: {
  stage: CareEpisodeStageId
  reason: string | undefined
  onChange: (reason: string | undefined) => void
}) {
  const [text, setText] = useState(reason ?? '')
  const routing = getStageEscalationRouting(stage)
  return (
    <div className="text-xs text-accent">
      <div className="flex items-center justify-between">
        <b>{STAGE_LABEL[stage]} blocked</b>
        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium" data-blocked-routing="v1">
          Auto-routed to {routing.target}
        </span>
      </div>
      <input
        className={`${inputClass} !mt-1 !min-h-[36px] !border-accent/30 !text-xs`}
        placeholder="What is blocking this stage?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(text.trim() || undefined)}
      />
    </div>
  )
}

function StallLine({ stall, onAdjust }: { stall: StageStall; onAdjust: (days: number | undefined) => void }) {
  const [editing, setEditing] = useState(false)
  const [days, setDays] = useState(stall.expectedDays.toString())
  const routing = getStageEscalationRouting(stall.stage)

  if (editing) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-neutral-600">Usually takes about</span>
        <input
          className={`${inputClass} !min-h-[32px] !w-16 !px-2 !py-1 text-center`}
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
        <span className="text-neutral-600">days for this case</span>
        <button
          type="button"
          className="font-semibold text-brand-dark underline"
          onClick={() => {
            onAdjust(days ? Number(days) : undefined)
            setEditing(false)
          }}
        >
          Save
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5" data-stall-line={stall.stage}>
      <p className={`text-xs ${stall.severity === 'stalled' ? 'text-accent' : 'text-amber-700'}`}>
        {stallReason(stall)}{' '}
        <button type="button" className="font-semibold underline" onClick={() => setEditing(true)}>
          Adjust
        </button>
      </p>
      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500" data-escalation-routing="v1">
        <span className="font-medium text-amber-800 dark:text-amber-300">⚡ Auto-routed to {routing.target}</span>
        <span>·</span>
        <span>{routing.label}</span>
      </div>
    </div>
  )
}

function ProviderComparison({
  episode,
  onChange,
}: {
  episode: CareEpisode
  onChange: (next: CareEpisode) => void
}) {
  const candidates = candidateViews(episode)
  const alreadyAdded = new Set(candidates.map((c) => c.facilityId))
  const options = providerOptions().filter((h) => !alreadyAdded.has(h.id))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Compare providers — real distance & rating, cost you enter
        </span>
      </div>

      {options.length > 0 && (
        <select
          className={`${inputClass} mb-3`}
          value=""
          onChange={(e) => e.target.value && onChange(addCandidate(episode, e.target.value))}
        >
          <option value="" disabled>
            Add a facility to compare…
          </option>
          {options.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} · {h.city} · {h.distanceKm} km
            </option>
          ))}
        </select>
      )}

      {candidates.length === 0 && (
        <p className="text-sm text-neutral-500">No facilities added yet — add at least two to compare.</p>
      )}

      <div className="space-y-3">
        {candidates.map((c) => (
          <CandidateRow
            key={c.facilityId}
            candidate={c}
            chosen={episode.facilityId === c.facilityId}
            diagnosisCode={episode.diagnosisCode}
            diagnosisTitle={episode.title}
            onChoose={() => onChange(chooseCandidate(episode, c.facilityId))}
            onRemove={() => onChange(removeCandidate(episode, c.facilityId))}
            onCostChange={(cost) => onChange(updateCandidateCost(episode, c.facilityId, cost))}
          />
        ))}
      </div>
    </div>
  )
}

function CandidateRow({
  candidate,
  chosen,
  diagnosisCode,
  diagnosisTitle,
  onChoose,
  onRemove,
  onCostChange,
}: {
  candidate: CandidateView
  chosen: boolean
  diagnosisCode?: string
  diagnosisTitle?: string
  onChoose: () => void
  onRemove: () => void
  onCostChange: (cost: { low?: number; high?: number; confidence: 'estimated' | 'verified'; source?: string }) => void
}) {
  const [low, setLow] = useState(candidate.estimatedCostLow?.toString() ?? '')
  const [high, setHigh] = useState(candidate.estimatedCostHigh?.toString() ?? '')
  const [source, setSource] = useState(candidate.costSource ?? '')

  function commit(confidence: 'estimated' | 'verified') {
    onCostChange({
      low: low ? Number(low) : undefined,
      high: high ? Number(high) : undefined,
      confidence,
      source: source.trim() || undefined,
    })
  }

  return (
    <div className={`rounded-xl border p-3 ${chosen ? 'border-brand/40 bg-brand-50/40' : 'border-neutral-200'}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-ink">{candidate.facility.name}</p>
          <p className="text-xs text-neutral-500">
            {candidate.facility.city} · {candidate.facility.distanceKm} km · ★ {candidate.facility.rating}
            {candidate.facility.emergency ? ' · A&E' : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant={chosen ? 'outline' : 'primary'}
            onClick={onChoose}
            disabled={chosen}
            className="!min-h-0 !px-3 !py-1.5 text-xs"
          >
            {chosen ? 'Chosen ✓' : 'Choose'}
          </Button>
          <Button variant="ghost" onClick={onRemove} className="!min-h-0 !px-2 !py-1 text-xs">
            Remove
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          className={`${inputClass} !min-h-[38px]`}
          type="number"
          placeholder="Low"
          value={low}
          onChange={(e) => setLow(e.target.value)}
          onBlur={() => commit(candidate.costConfidence ?? 'estimated')}
        />
        <input
          className={`${inputClass} !min-h-[38px]`}
          type="number"
          placeholder="High"
          value={high}
          onChange={(e) => setHigh(e.target.value)}
          onBlur={() => commit(candidate.costConfidence ?? 'estimated')}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          className={`${inputClass} !min-h-[38px] min-w-0 flex-1`}
          placeholder="Source (e.g. front-desk quote)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onBlur={() => commit(candidate.costConfidence ?? 'estimated')}
        />
        <select
          className={`${inputClass} !min-h-[38px] !w-auto shrink-0`}
          value={candidate.costConfidence ?? 'estimated'}
          onChange={(e) => commit(e.target.value as 'estimated' | 'verified')}
        >
          <option value="estimated">Estimated</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      <CommunityPrices
        facilityId={candidate.facilityId}
        diagnosisCode={diagnosisCode}
        diagnosisTitle={diagnosisTitle}
        myPrice={{ low: low ? Number(low) : undefined, high: high ? Number(high) : undefined, confidence: candidate.costConfidence ?? 'estimated', source: source.trim() || undefined }}
      />
    </div>
  )
}

// The actual "real-time price" feature: no external pricing API exists for
// Indonesian facilities to poll, so this is a shared board instead — every
// patient/doctor's submitted price for this facility is visible to every
// other user immediately (see api.ts's FacilityPriceSubmission). Requires
// the live backend; in demo mode (no VITE_API_URL) it stays hidden rather
// than pretending to show something that isn't actually shared.
function CommunityPrices({
  facilityId,
  diagnosisCode,
  diagnosisTitle,
  myPrice,
}: {
  facilityId: string
  diagnosisCode?: string
  diagnosisTitle?: string
  myPrice: { low?: number; high?: number; confidence: 'estimated' | 'verified'; source?: string }
}) {
  const [prices, setPrices] = useState<FacilityPriceSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState('')

  function load() {
    if (!backendEnabled) return
    setLoading(true)
    api
      .facilityPrices(facilityId, diagnosisCode)
      .then(setPrices)
      .catch(() => setError('Could not load community prices.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [facilityId, diagnosisCode])

  async function share() {
    if (myPrice.low == null && myPrice.high == null) {
      setError('Enter a low or high amount above before sharing.')
      return
    }
    setSharing(true)
    setError('')
    try {
      await api.submitFacilityPrice({ facilityId, diagnosisCode, diagnosisTitle, ...myPrice })
      load()
    } catch {
      setError('Could not share your price — please try again.')
    } finally {
      setSharing(false)
    }
  }

  if (!backendEnabled) return null

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Community prices — real submissions, shared live
        </span>
        <Button variant="ghost" onClick={share} disabled={sharing} className="!min-h-0 !px-2 !py-1 text-xs">
          {sharing ? 'Sharing…' : 'Share mine'}
        </Button>
      </div>
      {error && <p className="text-xs text-accent">{error}</p>}
      {loading && <p className="text-xs text-neutral-500">Loading…</p>}
      {!loading && prices.length === 0 && (
        <p className="text-xs text-neutral-500">No one has shared a price for this facility yet — be the first.</p>
      )}
      <div className="space-y-1.5">
        {prices.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-neutral-700">
              {formatSubmission(p)}
              {p.confidence === 'verified' ? (
                <Badge tone="normal">Verified</Badge>
              ) : (
                <span className="ml-1 text-neutral-400">(estimated)</span>
              )}
            </span>
            <span className="shrink-0 text-neutral-400">
              {p.submittedByName} · {new Date(p.at).toLocaleDateString('en-US')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatSubmission(p: FacilityPriceSubmission): string {
  const fmt = (n: number) => n.toLocaleString('en-US')
  if (p.low != null && p.high != null && p.low !== p.high) return `${p.currency} ${fmt(p.low)}–${fmt(p.high)} `
  return `${p.currency} ${fmt(p.low ?? p.high ?? 0)} `
}

function CostBreakdown({
  episode,
  onChange,
}: {
  episode: CareEpisode
  onChange: (next: CareEpisode) => void
}) {
  const items = episode.costItems ?? []
  const total = formatCostRange(episode)
  const priced = items.filter((i) => i.low != null || i.high != null).length
  const usedLabels = new Set(items.map((i) => i.label))
  const availablePresets = COST_ITEM_PRESETS.filter((p) => !usedLabels.has(p))
  const [addingCustom, setAddingCustom] = useState(false)
  const [customLabel, setCustomLabel] = useState('')

  return (
    <div>
      <div className="space-y-2">
        {items.map((item) => (
          <CostItemRow
            key={item.id}
            item={item}
            onChange={(patch) => onChange(updateCostItem(episode, item.id, patch))}
            onRemove={() => onChange(removeCostItem(episode, item.id))}
          />
        ))}
      </div>

      {addingCustom ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            className={`${inputClass} min-w-0 flex-1`}
            placeholder="Name this cost component…"
            value={customLabel}
            autoFocus
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || !customLabel.trim()) return
              onChange(addCostItem(episode, customLabel.trim()))
              setCustomLabel('')
              setAddingCustom(false)
            }}
          />
          <Button
            onClick={() => {
              if (!customLabel.trim()) return
              onChange(addCostItem(episode, customLabel.trim()))
              setCustomLabel('')
              setAddingCustom(false)
            }}
            className="!min-h-0 !px-3 !py-2 text-xs shrink-0"
          >
            Add
          </Button>
        </div>
      ) : (
        availablePresets.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <select
              className={`${inputClass} min-w-0 flex-1`}
              value=""
              onChange={(e) => {
                if (!e.target.value) return
                if (e.target.value === '__other__') {
                  setAddingCustom(true)
                  return
                }
                onChange(addCostItem(episode, e.target.value))
              }}
            >
              <option value="" disabled>
                Add a component…
              </option>
              {availablePresets.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="__other__">Other…</option>
            </select>
          </div>
        )
      )}

      <p className="mt-3 border-t border-neutral-100 pt-2 text-sm font-bold text-ink">
        Total: {total ?? '—'}
        <span className="ml-2 text-xs font-normal text-neutral-500">
          ({priced} of {items.length} component{items.length === 1 ? '' : 's'} priced)
        </span>
      </p>
    </div>
  )
}

function CostItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: CostItem
  onChange: (patch: Partial<CostItem>) => void
  onRemove: () => void
}) {
  const [low, setLow] = useState(item.low?.toString() ?? '')
  const [high, setHigh] = useState(item.high?.toString() ?? '')
  const [source, setSource] = useState(item.source ?? '')

  function commit(confidence: 'estimated' | 'verified') {
    onChange({
      low: low ? Number(low) : undefined,
      high: high ? Number(high) : undefined,
      confidence,
      source: source.trim() || undefined,
    })
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-ink">{item.label}</span>
        <button type="button" onClick={onRemove} className="text-xs text-neutral-400 hover:text-accent">
          Remove
        </button>
      </div>
      <div className="flex gap-2">
        <input
          className={`${inputClass} !min-h-[38px]`}
          type="number"
          placeholder="Low"
          value={low}
          onChange={(e) => setLow(e.target.value)}
          onBlur={() => commit(item.confidence ?? 'estimated')}
        />
        <input
          className={`${inputClass} !min-h-[38px]`}
          type="number"
          placeholder="High"
          value={high}
          onChange={(e) => setHigh(e.target.value)}
          onBlur={() => commit(item.confidence ?? 'estimated')}
        />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          className={`${inputClass} !min-h-[38px] min-w-0 flex-1`}
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onBlur={() => commit(item.confidence ?? 'estimated')}
        />
        <select
          className={`${inputClass} !min-h-[38px] !w-auto shrink-0`}
          value={item.confidence ?? 'estimated'}
          onChange={(e) => commit(e.target.value as 'estimated' | 'verified')}
        >
          <option value="estimated">Estimated</option>
          <option value="verified">Verified</option>
        </select>
      </div>
    </div>
  )
}

function CostEstimateField({
  episode,
  onChange,
}: {
  episode: CareEpisode
  onChange: (next: CareEpisode) => void
}) {
  const [low, setLow] = useState(episode.estimatedCostLow?.toString() ?? '')
  const [high, setHigh] = useState(episode.estimatedCostHigh?.toString() ?? '')
  const [source, setSource] = useState(episode.costSource ?? '')
  const itemized = (episode.costItems ?? []).length > 0

  function commit(confidence: 'estimated' | 'verified') {
    onChange(
      setCostEstimate(episode, {
        low: low ? Number(low) : undefined,
        high: high ? Number(high) : undefined,
        confidence,
        source: source.trim() || undefined,
      }),
    )
  }

  return (
    <Field label="Final cost with chosen provider (IDR) — never a guess without a source">
      {itemized ? (
        <CostBreakdown episode={episode} onChange={onChange} />
      ) : (
        <>
          <div className="flex gap-2">
            <input
              className={inputClass}
              type="number"
              placeholder="Low"
              value={low}
              onChange={(e) => setLow(e.target.value)}
              onBlur={() => commit(episode.costConfidence ?? 'estimated')}
            />
            <input
              className={inputClass}
              type="number"
              placeholder="High"
              value={high}
              onChange={(e) => setHigh(e.target.value)}
              onBlur={() => commit(episode.costConfidence ?? 'estimated')}
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              className={`${inputClass} min-w-0 flex-1`}
              placeholder="Source (e.g. hospital quote, insurer estimate)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onBlur={() => commit(episode.costConfidence ?? 'estimated')}
            />
            <select
              className={`${inputClass} !w-auto shrink-0`}
              value={episode.costConfidence ?? 'estimated'}
              onChange={(e) => commit(e.target.value as 'estimated' | 'verified')}
            >
              <option value="estimated">Estimated</option>
              <option value="verified">Verified</option>
            </select>
          </div>
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-brand-dark underline"
            onClick={() =>
              onChange(
                addCostItem(episode, COST_ITEM_PRESETS[0], {
                  low: low ? Number(low) : undefined,
                  high: high ? Number(high) : undefined,
                  confidence: episode.costConfidence ?? 'estimated',
                  source: source.trim() || undefined,
                }),
              )
            }
          >
            Break down into components (professional fee, lab, meds, …)
          </button>
        </>
      )}

      {episode.facilityId && (
        <CommunityPrices
          facilityId={episode.facilityId}
          diagnosisCode={episode.diagnosisCode}
          diagnosisTitle={episode.title}
          // The episode's own fields, not the manual-entry local state above —
          // those go stale the moment costs are itemized, since the total is
          // then computed from costItems instead of typed directly here.
          myPrice={{
            low: episode.estimatedCostLow,
            high: episode.estimatedCostHigh,
            confidence: episode.costConfidence ?? 'estimated',
            source: episode.costSource,
          }}
        />
      )}
    </Field>
  )
}
