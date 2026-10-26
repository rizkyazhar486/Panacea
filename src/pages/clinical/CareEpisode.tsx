import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { api, backendEnabled, type FacilityPriceSubmission } from '../../lib/api'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../../components/ui'
import { IconPlan, IconPlus } from '../../components/icons'
import {
  deriveCareJourneyTimelineEvents,
  exportCareJourneySummary,
  evaluateEpisodeReadmissionRisk,
  deriveEdenCareCompanion,
  deriveEdenLifeBalanceSynthesis,
  deriveEdenLifeStoryBridge,
  deriveEdenPhysiologyAppreciation,
  deriveEdenPreventionLongevityRhythm,
  deriveEdenSupportCircleBridge,
  deriveEdenVisitPreparationCompanion,
  deriveEdenReflectionSanctuaryBridge,
  deriveEdenUniversalAcceptanceBridge,
  deriveEdenRestorativeEnvironmentBridge,
  deriveEdenMultiModelRegenerationBridge,
  deriveEdenQuantumBioPhotonicBridge,
  deriveEdenMultidimensionalConsciousnessBridge,
  deriveEdenBioCosmicSymphonyBridge,
  deriveEdenMultiAgentHealingCouncilBridge,
  deriveEdenBioHarmonicWaveformBridge,
  deriveEdenCircadianMitochondrialHarmonizerBridge,
  deriveEdenProteostasisAutophagicFluxBridge,
  deriveEdenTelomericGenomicIntegrityBridge,
  deriveEdenSenescentInflammagingBridge,
  deriveEdenRegenerativePlasticityBridge,
  deriveEdenEpigeneticAgeReversalBridge,
  deriveEdenMitochondrialHeteroplasmyBridge,
  deriveEdenCircadianAutophagyPulseBridge,
} from '../../domains/clinical-operations'
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
  CareJourneyReferralRecord,
  EdenDisclosureDepth,
  LifeEvent,
  Quest,
  Circle,
  SupportMessage,
  GratitudeNote,
  MoodEntry,
  EdenLanguageCode,
  EdenLiteracyAdaptationMode,
  EdenAstralResonanceDimension,
  EdenAiModelContributorKind,
  WellnessDay,
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

      {episodes.length > 0 && (
        <EdenOneControlHeader
          episodes={episodes}
          supportiveResults={state.supportive[activePatient.id]}
        />
      )}

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
          lifeEvents={state.lifeEvents[activePatient.id]}
          quests={state.quests[activePatient.id]}
          patientDob={activePatient.dob}
          buddyName={state.buddyName}
          circles={state.circles}
          supportMessages={state.supportMessages}
          gratitudes={state.gratitudes}
          moods={state.moods}
          wellness={state.wellness}
          onChange={(next) => updateEpisode(ep.id, next)}
          onRemove={() => removeEpisode(ep.id)}
        />
      ))}
    </div>
  )
}

function EdenOneControlHeader({
  episodes,
  supportiveResults,
}: {
  episodes: readonly CareEpisode[]
  supportiveResults?: readonly SupportiveResult[]
}) {
  const synthesis = useMemo(
    () => deriveEdenLifeBalanceSynthesis(episodes, supportiveResults),
    [episodes, supportiveResults]
  )

  return (
    <Card
      className="border border-emerald-200 dark:border-white/10 bg-emerald-50/30 dark:bg-white/[0.02]"
      data-eden-one-control="v1"
      data-eden-calm-state={synthesis.calmState}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Eden One Control — Whole-Person Life & Care Balance
            </h3>
            <Badge
              tone={
                synthesis.calmState === 'timely_clinical_care'
                  ? 'high'
                  : synthesis.calmState === 'gentle_attention'
                  ? 'low'
                  : 'normal'
              }
            >
              {synthesis.calmStateLabel}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-neutral-700 dark:text-white/80">
            {synthesis.harmonyHeadline}
          </p>
          <p className="mt-0.5 text-[11px] italic text-emerald-800 dark:text-emerald-300">
            {synthesis.biologicalAppreciation}
          </p>
        </div>
      </div>

      <div
        className="mt-3 rounded-xl bg-white/80 dark:bg-white/[0.03] border border-emerald-200/70 dark:border-white/10 p-3"
        data-eden-unified-focus="v1"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          One Unified Focus Today
        </span>
        <p className="mt-0.5 text-xs font-semibold text-neutral-900 dark:text-white">
          {synthesis.oneUnifiedFocus}
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        {synthesis.dimensions.map((dim) => (
          <div
            key={dim.dimension}
            className="rounded-lg bg-white/70 dark:bg-white/[0.02] border border-neutral-200/70 dark:border-white/5 p-2.5"
            data-eden-dimension={dim.dimension}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-white/55">
              {dim.label}
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-800 dark:text-white/85">
              {dim.plainSummary}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function EpisodeCard({
  episode,
  recordPlan,
  supportiveResults,
  lifeEvents,
  quests,
  patientDob,
  buddyName,
  circles,
  supportMessages,
  gratitudes,
  moods,
  wellness,
  onChange,
  onRemove,
}: {
  episode: CareEpisode
  recordPlan?: readonly PlanItem[]
  supportiveResults?: readonly SupportiveResult[]
  lifeEvents?: readonly LifeEvent[]
  quests?: readonly Quest[]
  patientDob?: string
  buddyName?: string
  circles?: readonly Circle[]
  supportMessages?: readonly SupportMessage[]
  gratitudes?: readonly GratitudeNote[]
  moods?: readonly MoodEntry[]
  wellness?: Record<string, WellnessDay>
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
        <div
          className="mt-4 border-t border-neutral-100 dark:border-white/10 pt-4"
          data-care-cost-transparency="v1"
        >
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

      {/* Care Journey Continuity Handoff & FHIR-Aligned Summary Export (T-CLIN-17) */}
      <CareJourneyExportSection episode={episode} />

      {/* Post-Discharge Follow-Up & Readmission Risk Surveillance (T-CLIN-19) */}
      <ReadmissionSurveillanceSection episode={episode} supportiveResults={supportiveResults} />

      {/* Inter-Facility Referral Handshake & Diagnostic Continuity (T-CLIN-20) */}
      {episode.referralRecord && (
        <ReferralHandshakeSection referral={episode.referralRecord} />
      )}

      {/* Eden Three-Depth Progressive Disclosure & Plain-Language Clinical Companion (T-CLIN-21 / EDEN-01) */}
      <EdenCareCompanionSection episode={episode} onChange={onChange} />

      {/* Eden Personal Life Story & Turning-Point Continuity Bridge (T-CLIN-23 / EDEN-03) */}
      <EdenLifeStorySection
        episode={episode}
        lifeEvents={lifeEvents}
        quests={quests}
        patientDob={patientDob}
      />

      {/* Eden Living Physiology Appreciation & Organ System Connection Bridge (T-CLIN-24 / EDEN-04) */}
      <EdenPhysiologyAppreciationSection episode={episode} />

      {/* Eden Daily Prevention, Longevity Rhythm & Restorative Habit Continuity Bridge (T-CLIN-25 / EDEN-05) */}
      <EdenLongevityRhythmSection episode={episode} recordPlan={recordPlan} />

      {/* Eden Trusted Support Circle & Family/Caregiver Encouragement Bridge (T-CLIN-26 / EDEN-06) */}
      <EdenSupportCircleSection
        episode={episode}
        buddyName={buddyName}
        circles={circles}
        supportMessages={supportMessages}
        gratitudes={gratitudes}
      />

      {/* Eden Clinician Visit Preparation & Empowering Questions Companion (T-CLIN-27 / EDEN-07) */}
      <EdenVisitPrepSection episode={episode} supportiveResults={supportiveResults} />

      {/* Eden Multi-Perspective Reflection, Epistemic Humility & Peace Sanctuary Bridge (T-CLIN-28 / EDEN-08) */}
      <EdenReflectionSanctuarySection episode={episode} moods={moods} />

      {/* Eden Universal Human Acceptance & Multilingual Plain-Language Continuity Bridge (T-CLIN-29 / EDEN-09) */}
      <EdenUniversalAcceptanceSection episode={episode} onChange={onChange} />

      {/* Eden Restorative Environment, Bio-Photonic Exposure & Cosmic Wonder Synthesis Bridge (T-CLIN-30 / EDEN-10) */}
      <EdenRestorativeEnvironmentSection episode={episode} wellness={wellness} />

      {/* Eden Multi-Model Frontier Scientific Imagination & Collective Cellular Regeneration Synthesis Bridge (T-CLIN-31 / EDEN-11) */}
      <EdenMultiModelRegenerationSection episode={episode} />

      {/* Eden Quantum Bio-Photonic Field & Transcendent Cellular Longevity Bridge (T-CLIN-32 / EDEN-12) */}
      <EdenQuantumBioPhotonicSection episode={episode} />

      {/* Eden Astral Holographic Projection & Multidimensional Biological Consciousness Bridge (T-CLIN-33 / EDEN-13) */}
      <EdenMultidimensionalConsciousnessSection episode={episode} />

      {/* Eden Bio-Cosmic Symphony & Multi-Scale Reality Lattice Bridge (T-CLIN-35 / EDEN-15) */}
      <EdenBioCosmicSymphonySection episode={episode} />

      {/* Eden Universal Biological Flourishing & Multi-Agent Collaborative Healing Council Bridge (T-CLIN-36 / EDEN-16) */}
      <EdenMultiAgentHealingCouncilSection episode={episode} />

      {/* Eden Bio-Harmonic Epigenetic Resonance & Cellular Longevity Waveform Engine (T-CLIN-37 / EDEN-17) */}
      <EdenBioHarmonicWaveformSection episode={episode} />

      {/* Eden Circadian-Metabolic Neuro-Synchrony & Mitochondrial Vitality Harmonizer (T-CLIN-38 / EDEN-18) */}
      <EdenCircadianMitochondrialSection episode={episode} />

      {/* Eden Regenerative Proteostasis & Autophagic Flux Clearance Synthesizer (T-CLIN-39 / EDEN-19) */}
      <EdenProteostasisAutophagicFluxSection episode={episode} />

      {/* Eden Telomeric Maintenance & Genomic Integrity Synthesizer (T-CLIN-40 / EDEN-20) */}
      <EdenTelomericGenomicIntegritySection episode={episode} />

      {/* Eden Senescent Secretome & Inflammaging Attenuation Synthesizer (T-CLIN-41 / EDEN-21) */}
      <EdenSenescentInflammagingSection episode={episode} />

      {/* Eden Stem Cell Niches & Regenerative Tissue Plasticity Synthesizer (T-CLIN-42 / EDEN-22) */}
      <EdenRegenerativePlasticitySection episode={episode} />

      {/* Eden Epigenetic Biological Age Reversal & Transcriptomic Harmony Synthesizer (T-CLIN-43 / EDEN-23) */}
      <EdenEpigeneticAgeReversalSection episode={episode} />

      {/* Eden Mitochondrial Heteroplasmy & Bioenergetic Fusion Synthesizer (T-CLIN-44 / EDEN-24) */}
      <EdenMitochondrialHeteroplasmySection episode={episode} />

      {/* Eden Circadian Autophagy & Xenohormetic Longevity Pulse Synthesizer (T-CLIN-45 / EDEN-25) */}
      <EdenCircadianAutophagyPulseSection episode={episode} />
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

function ReadmissionSurveillanceSection({
  episode,
  supportiveResults,
}: {
  episode: CareEpisode
  supportiveResults?: readonly SupportiveResult[]
}) {
  const surveillance = useMemo(
    () => evaluateEpisodeReadmissionRisk(episode, supportiveResults),
    [episode, supportiveResults]
  )

  return (
    <div
      className="mt-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] p-3.5"
      data-care-followup-surveillance="v1"
      data-readmission-risk={surveillance.riskLevel}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Post-Discharge Follow-Up & Readmission Surveillance
            </h4>
            <Badge
              tone={
                surveillance.riskLevel === 'high'
                  ? 'high'
                  : surveillance.riskLevel === 'moderate'
                  ? 'low'
                  : 'normal'
              }
            >
              {surveillance.riskLevel.toUpperCase()} RISK
            </Badge>
            {surveillance.followUpWindowClosed && (
              <Badge tone="normal">Follow-Up Closed</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-600 dark:text-white/75">
            {surveillance.recommendedAction}
          </p>
        </div>
      </div>

      {surveillance.riskFactors.length > 0 && (
        <ul className="mt-2 space-y-1 text-[11px] text-neutral-600 dark:text-white/70 list-disc list-inside">
          {surveillance.riskFactors.map((rf, idx) => (
            <li key={idx}>{rf}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReferralHandshakeSection({ referral }: { referral: CareJourneyReferralRecord }) {
  return (
    <div
      className="mt-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] p-3.5"
      data-care-referral-section="v1"
      data-referral-urgency={referral.urgency}
      data-referral-status={referral.status}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Inter-Facility Referral Handshake
            </h4>
            <Badge
              tone={
                referral.urgency === 'emergency'
                  ? 'high'
                  : referral.urgency === 'urgent'
                  ? 'low'
                  : 'neutral'
              }
            >
              {referral.urgency.toUpperCase()}
            </Badge>
            <Badge
              tone={
                referral.status === 'acknowledged' || referral.status === 'completed'
                  ? 'normal'
                  : 'brand'
              }
            >
              {referral.status.toUpperCase()}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-neutral-700 dark:text-white/80">
            <strong>{referral.specialty}</strong> referral: {referral.clinicalIndication}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-white/60">
            Route: {referral.sourceFacilityName} → {referral.destinationFacilityName || 'Pending destination match'}
          </p>
        </div>
      </div>
      <div className="mt-2 text-[10px] font-mono text-neutral-400 dark:text-white/40 truncate">
        Digest: {referral.auditDigest}
      </div>
    </div>
  )
}

function EdenCareCompanionSection({
  episode,
  onChange,
}: {
  episode: CareEpisode
  onChange: (next: CareEpisode) => void
}) {
  const [depth, setDepth] = useState<EdenDisclosureDepth>(episode.edenDepthPreference ?? 'simple')
  const companion = useMemo(() => deriveEdenCareCompanion(episode, depth), [episode, depth])

  function selectDepth(nextDepth: EdenDisclosureDepth) {
    setDepth(nextDepth)
    onChange({ ...episode, edenDepthPreference: nextDepth })
  }

  return (
    <div
      className="mt-4 rounded-xl border border-emerald-200 dark:border-white/10 bg-emerald-50/40 dark:bg-white/[0.02] p-3.5"
      data-eden-companion-card="v1"
      data-eden-depth={depth}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Care Companion — Wonder & Plain-Language Clarity
            </h4>
            <Badge tone="normal">{companion.depthLabel}</Badge>
          </div>
          <p className="mt-0.5 text-[11px] italic text-emerald-800 dark:text-emerald-300">
            {companion.wonderReflection}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap" data-eden-depth-selector="v1">
          {(['simple', 'explore', 'deep'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => selectDepth(d)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                depth === d
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-white/75 hover:bg-neutral-300 dark:hover:bg-white/20'
              }`}
            >
              {d === 'simple' ? 'Simple' : d === 'explore' ? 'Explore' : 'Deep'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
        <div className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-emerald-100 dark:border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">
            What is happening
          </span>
          <p className="mt-0.5 text-neutral-800 dark:text-white/85">{companion.whatIsHappening}</p>
        </div>
        <div className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-emerald-100 dark:border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">
            Why it matters
          </span>
          <p className="mt-0.5 text-neutral-800 dark:text-white/85">{companion.whyItMatters}</p>
        </div>
        <div
          className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-emerald-100 dark:border-white/5"
          data-eden-beautiful-next-step="v1"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            One Beautiful Next Step ({companion.nextBeautifulStep.stageLabel})
          </span>
          <p className="mt-0.5 font-medium text-neutral-900 dark:text-white">{companion.whatYouCanDo}</p>
        </div>
        <div className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-emerald-100 dark:border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">
            What remains uncertain
          </span>
          <p className="mt-0.5 text-neutral-700 dark:text-white/75">{companion.whatRemainsUncertain}</p>
        </div>
      </div>

      {depth !== 'simple' && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-emerald-200/60 dark:border-white/10" data-eden-glossary="v1">
          {companion.plainLanguageGlossary.map((term) => (
            <span
              key={term.technicalTerm}
              className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-white/5 px-2 py-0.5 text-[10px] text-neutral-600 dark:text-white/70"
            >
              <strong className="text-neutral-900 dark:text-white">{term.technicalTerm}:</strong>{' '}
              {term.humanTranslation}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function EdenLifeStorySection({
  episode,
  lifeEvents,
  quests,
  patientDob,
}: {
  episode: CareEpisode
  lifeEvents?: readonly LifeEvent[]
  quests?: readonly Quest[]
  patientDob?: string
}) {
  const bridge = useMemo(
    () => deriveEdenLifeStoryBridge(episode, lifeEvents, quests, patientDob),
    [episode, lifeEvents, quests, patientDob]
  )

  return (
    <div
      className="mt-3 rounded-xl border border-cyan-200 dark:border-white/10 bg-cyan-50/35 dark:bg-white/[0.02] p-3.5"
      data-eden-life-story-card="v1"
      data-life-chapter={bridge.lifeChapterName}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Personal Life Story Continuity — One Unified Life Thread
            </h4>
            <Badge tone="brand">
              Chapter: {bridge.lifeChapterName} ({bridge.lifeChapterAgeRange})
            </Badge>
            <Badge tone="neutral">Self-Authored · Never Inferred</Badge>
          </div>
          <p className="mt-1 text-xs text-neutral-700 dark:text-white/80">
            {bridge.storyContinuityNarrative}
          </p>
        </div>
        <Link
          to="/mental/life-story"
          className="inline-flex items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 shrink-0"
        >
          Open Life Story →
        </Link>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5" data-eden-life-domains="v1">
        {bridge.activeLifeDomains.map((d) => (
          <span
            key={d.domain}
            className="inline-flex items-center gap-1 rounded-md bg-white/80 dark:bg-white/5 px-2 py-0.5 text-[10px] text-neutral-700 dark:text-white/75 border border-cyan-100 dark:border-white/5"
          >
            <strong>{d.label}:</strong> {d.count} thread{d.count === 1 ? '' : 's'}
          </span>
        ))}
      </div>

      {(bridge.selfAuthoredTurningPoints.length > 0 || bridge.activeQuests.length > 0) && (
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2 text-xs">
          {bridge.selfAuthoredTurningPoints.length > 0 && (
            <div className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-cyan-100 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">
                Your Self-Marked Turning Points ({bridge.selfAuthoredTurningPoints.length})
              </span>
              <ul className="mt-1 space-y-1">
                {bridge.selfAuthoredTurningPoints.slice(0, 2).map((tp) => (
                  <li key={tp.id} className="text-[11px] text-neutral-800 dark:text-white/85">
                    ★ <strong>{tp.title}</strong>{' '}
                    <span className="text-[10px] text-neutral-500 dark:text-white/50">
                      ({tp.at.slice(0, 10)} · self-rated {tp.impact})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {bridge.activeQuests.length > 0 && (
            <div className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-cyan-100 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">
                Your Active Life Quests ({bridge.activeQuests.length})
              </span>
              <ul className="mt-1 space-y-1">
                {bridge.activeQuests.slice(0, 2).map((q) => (
                  <li key={q.id} className="text-[11px] text-neutral-800 dark:text-white/85">
                    🧭 <strong>{q.title}</strong>{' '}
                    <span className="text-[10px] text-neutral-500 dark:text-white/50">
                      ({q.progressCurrent}/{q.progressTarget} {q.unit})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-[11px] italic text-cyan-800 dark:text-cyan-300">
        {bridge.gentleReflectionPrompt}
      </p>
    </div>
  )
}

function EdenPhysiologyAppreciationSection({ episode }: { episode: CareEpisode }) {
  const appreciation = useMemo(() => deriveEdenPhysiologyAppreciation(episode), [episode])

  return (
    <div
      className="mt-3 rounded-xl border border-indigo-200 dark:border-white/10 bg-indigo-50/35 dark:bg-white/[0.02] p-3.5"
      data-eden-physiology-card="v1"
      data-organ-system={appreciation.primarySystem.id}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Living Physiology Appreciation — How Your Body Sustains Balance
            </h4>
            <Badge tone="brand">{appreciation.primarySystem.label}</Badge>
            <Badge tone="neutral">Educational Reference · Never Fabricates Vitals</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-indigo-900 dark:text-indigo-200">
            {appreciation.livingWonderHeadline}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-600 dark:text-white/70">
            {appreciation.homeostaticMechanismSummary}
          </p>
        </div>
        <Link
          to={appreciation.primarySystem.bodyTwinRoute}
          className="inline-flex items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 shrink-0"
        >
          Explore 3D Body Twin →
        </Link>
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-2 text-xs" data-eden-coupled-systems="v1">
        {appreciation.coupledSystems.map((cs) => (
          <div
            key={cs.id}
            className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-indigo-100 dark:border-white/5"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Coupled System: {cs.label}
            </span>
            <p className="mt-0.5 text-[11px] text-neutral-700 dark:text-white/80">
              {cs.couplingExplanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EdenLongevityRhythmSection({
  episode,
  recordPlan,
}: {
  episode: CareEpisode
  recordPlan?: readonly PlanItem[]
}) {
  const rhythm = useMemo(
    () => deriveEdenPreventionLongevityRhythm(episode, recordPlan),
    [episode, recordPlan]
  )

  return (
    <div
      className="mt-3 rounded-xl border border-amber-200 dark:border-white/10 bg-amber-50/35 dark:bg-white/[0.02] p-3.5"
      data-eden-longevity-card="v1"
      data-longevity-phase={rhythm.rhythmPhase}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Daily Prevention & Longevity Rhythm — Sustainable Flourishing
            </h4>
            <Badge tone="normal">{rhythm.rhythmPhaseLabel}</Badge>
            <Badge tone="neutral">Non-Prescriptive · Educational Rhythm</Badge>
          </div>
          <p className="mt-1 text-xs text-neutral-700 dark:text-white/80">
            {rhythm.compassionateHeadline}
          </p>
        </div>
      </div>

      <div className="mt-2.5 rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-amber-100 dark:border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
          One Gentle Daily Habit
        </span>
        <p className="mt-0.5 text-xs font-medium text-neutral-900 dark:text-white">
          {rhythm.oneGentleDailyHabit}
        </p>
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs" data-eden-longevity-pillars="v1">
        {rhythm.pillars.map((p) => (
          <div
            key={p.pillar}
            className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-amber-100 dark:border-white/5 flex flex-col justify-between gap-1.5"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                {p.label}
              </span>
              <p className="mt-0.5 text-[11px] font-medium text-neutral-800 dark:text-white/85">
                {p.gentlePractice}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-white/55">
                {p.physiologicalRationale}
              </p>
            </div>
            <Link
              to={p.workspaceRoute}
              className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:underline self-start"
            >
              Open {p.label.split(' ')[0]} →
            </Link>
          </div>
        ))}
      </div>

      {rhythm.projectedTrajectory?.status === 'valid' && (
        <div
          className="mt-2.5 rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-amber-100 dark:border-white/5"
          data-eden-trajectory-preview="v1"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-800 dark:text-white/85">
            <span>Proyeksi Ketahanan Fisiologis & Usia Biologis</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
              Faktor dominan: {rhythm.projectedTrajectory.dominantVelocityFactor}
            </span>
          </div>
          <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {rhythm.projectedTrajectory.trajectory.slice(0, 4).map((pt) => (
              <div key={pt.yearsAhead} className="rounded-md bg-amber-50/50 dark:bg-white/[0.02] p-1.5 border border-amber-200/30">
                <div className="text-[10px] font-bold text-neutral-600 dark:text-white/60">+{pt.yearsAhead} Tahun</div>
                <div className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                  {pt.projectedBiologicalAge} thn
                </div>
                <div className="text-[9px] text-neutral-500 dark:text-white/40">
                  Buffer: {pt.accumulatedResilienceBuffer}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 text-[9px] text-neutral-400 dark:text-white/40 text-right italic">
            {rhythm.projectedTrajectory.recommendationProvenance}
          </div>
        </div>
      )}
    </div>
  )
}

function EdenSupportCircleSection({
  episode,
  buddyName,
  circles,
  supportMessages,
  gratitudes,
}: {
  episode: CareEpisode
  buddyName?: string
  circles?: readonly Circle[]
  supportMessages?: readonly SupportMessage[]
  gratitudes?: readonly GratitudeNote[]
}) {
  const supportBridge = useMemo(
    () =>
      deriveEdenSupportCircleBridge(episode, {
        buddyName,
        circles,
        supportMessages,
        gratitudes,
      }),
    [episode, buddyName, circles, supportMessages, gratitudes]
  )

  return (
    <div
      className="mt-3 rounded-xl border border-pink-200 dark:border-white/10 bg-pink-50/35 dark:bg-white/[0.02] p-3.5"
      data-eden-support-circle-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Trusted Circle of Care — Shared Encouragement & Family Update
            </h4>
            <Badge tone="brand">Opt-In Privacy Preserved</Badge>
            <Badge tone="neutral">Real Connections · Never Fabricated</Badge>
          </div>
          <p className="mt-1 text-xs text-neutral-700 dark:text-white/80">
            {supportBridge.connectionHeadline}
          </p>
        </div>
        <Link
          to="/social/komunitas"
          className="inline-flex items-center rounded-lg border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-[11px] font-semibold text-pink-700 dark:text-pink-300 hover:bg-pink-500/20 shrink-0"
        >
          Open Circle of Care →
        </Link>
      </div>

      <div
        className="mt-2.5 rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-pink-100 dark:border-white/5"
        data-eden-shareable-update="v1"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-pink-800 dark:text-pink-300">
          Plain-Language Family & Caregiver Update (Opt-In Share)
        </span>
        <p className="mt-0.5 text-xs text-neutral-800 dark:text-white/85">
          {supportBridge.shareablePlainUpdate}
        </p>
      </div>

      {(supportBridge.trustedCircles.length > 0 || supportBridge.recentEncouragements.length > 0) && (
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2 text-xs">
          {supportBridge.trustedCircles.length > 0 && (
            <div className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-pink-100 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">
                Your Trusted Circles ({supportBridge.trustedCircles.length})
              </span>
              <ul className="mt-1 space-y-1">
                {supportBridge.trustedCircles.map((c) => (
                  <li key={c.id} className="text-[11px] text-neutral-800 dark:text-white/85">
                    🫂 <strong>{c.name}</strong> ({c.memberCount} member{c.memberCount === 1 ? '' : 's'})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {supportBridge.recentEncouragements.length > 0 && (
            <div className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-pink-100 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">
                Recent Encouragement & Gratitude
              </span>
              <ul className="mt-1 space-y-1">
                {supportBridge.recentEncouragements.slice(0, 2).map((enc) => (
                  <li key={enc.id} className="text-[11px] text-neutral-800 dark:text-white/85">
                    💌 <strong>{enc.fromName}:</strong> “{enc.text}”
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EdenVisitPrepSection({
  episode,
  supportiveResults,
}: {
  episode: CareEpisode
  supportiveResults?: readonly SupportiveResult[]
}) {
  const prep = useMemo(
    () => deriveEdenVisitPreparationCompanion(episode, supportiveResults),
    [episode, supportiveResults]
  )

  return (
    <div
      className="mt-3 rounded-xl border border-violet-200 dark:border-white/10 bg-violet-50/35 dark:bg-white/[0.02] p-3.5"
      data-eden-visit-prep-card="v1"
      data-visit-focus-stage={prep.currentFocusStage}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Clinician Visit Preparation — Empowering Questions for Your Next Conversation
            </h4>
            <Badge tone="brand">Focus: {prep.currentFocusStageLabel}</Badge>
            <Badge tone="neutral">Supports Clinician Partnership</Badge>
          </div>
          <p className="mt-1 text-xs text-neutral-700 dark:text-white/80">
            {prep.reassuringHeadline}
          </p>
        </div>
        <Link
          to="/consult"
          className="inline-flex items-center rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 shrink-0"
        >
          Open Clinician Consult →
        </Link>
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-3 text-xs" data-eden-visit-questions="v1">
        {prep.questionsToBring.map((q) => (
          <div
            key={q.id}
            className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-violet-100 dark:border-white/5 flex flex-col justify-between gap-1"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                {q.categoryLabel}
              </span>
              <p className="mt-0.5 text-[11px] font-medium text-neutral-900 dark:text-white">
                “{q.question}”
              </p>
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-white/55">
              {q.whyAskThis}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-2.5 rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-violet-100 dark:border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">
          Helpful Context to Share With Your Clinician
        </span>
        <ul className="mt-1 space-y-0.5 text-[11px] text-neutral-700 dark:text-white/80 list-disc list-inside">
          {prep.whatToShareWithClinician.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function EdenReflectionSanctuarySection({
  episode,
  moods,
}: {
  episode: CareEpisode
  moods?: readonly MoodEntry[]
}) {
  const sanctuary = useMemo(
    () => deriveEdenReflectionSanctuaryBridge(episode, moods),
    [episode, moods]
  )

  return (
    <div
      className="mt-3 rounded-xl border border-sky-200 dark:border-white/10 bg-sky-50/35 dark:bg-white/[0.02] p-3.5"
      data-eden-reflection-sanctuary-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Peace & Multi-Perspective Reflection Sanctuary — Epistemic Humility
            </h4>
            <Badge tone="brand">4 Pluralistic Lenses</Badge>
            <Badge tone="neutral">Non-Dogmatic · Respects Every Belief</Badge>
          </div>
          <p className="mt-1 text-xs text-neutral-700 dark:text-white/80">
            {sanctuary.peaceHeadline}
          </p>
        </div>
        <Link
          to="/mental"
          className="inline-flex items-center rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 shrink-0"
        >
          Open Peace Sanctuary →
        </Link>
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs" data-eden-perspective-lenses="v1">
        {sanctuary.lenses.map((lens) => (
          <div
            key={lens.id}
            className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-sky-100 dark:border-white/5 flex flex-col justify-between gap-1.5"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                {lens.label}
              </span>
              <p className="mt-0.5 text-[11px] font-medium text-neutral-800 dark:text-white/85">
                {lens.reflection}
              </p>
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-white/55 italic">
              {lens.humilityBoundary}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[11px] italic text-sky-800 dark:text-sky-300">
        {sanctuary.openReflectionInvitation}
      </p>
    </div>
  )
}

function EdenUniversalAcceptanceSection({
  episode,
  onChange,
}: {
  episode: CareEpisode
  onChange: (next: CareEpisode) => void
}) {
  const [language, setLanguage] = useState<EdenLanguageCode>(episode.edenLanguagePreference ?? 'id')
  const [literacyMode, setLiteracyMode] = useState<EdenLiteracyAdaptationMode>('everyday_warm')

  const acceptance = useMemo(
    () => deriveEdenUniversalAcceptanceBridge(episode, language, literacyMode),
    [episode, language, literacyMode]
  )

  function selectLanguage(nextLang: EdenLanguageCode) {
    setLanguage(nextLang)
    onChange({ ...episode, edenLanguagePreference: nextLang })
  }

  return (
    <div
      className="mt-3 rounded-xl border border-lime-200 dark:border-white/10 bg-lime-50/35 dark:bg-white/[0.02] p-3.5"
      data-eden-universal-acceptance-card="v1"
      data-eden-lang={language}
      data-eden-literacy={literacyMode}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Universal Human Acceptance — Multilingual & Literacy-Adaptive Continuity
            </h4>
            <Badge tone="normal">{acceptance.languageLabel}</Badge>
            <Badge tone="neutral">Canonical Truth Preserved</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {acceptance.localizedHeadline}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap" data-eden-language-switcher="v1">
          {(['id', 'en'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => selectLanguage(lang)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                language === lang
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-white/75 hover:bg-neutral-300 dark:hover:bg-white/20'
              }`}
            >
              {lang === 'id' ? 'Bahasa Indonesia' : 'English'}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              setLiteracyMode((m) =>
                m === 'everyday_warm' ? 'clinical_structured' : 'everyday_warm'
              )
            }
            className="rounded-lg bg-neutral-200 dark:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-neutral-700 dark:text-white/75 hover:bg-neutral-300 dark:hover:bg-white/20"
          >
            {literacyMode === 'everyday_warm' ? 'Mode: Hangat/Warm' : 'Mode: Klinis/Clinical'}
          </button>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-2 text-xs">
        <div className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-lime-100 dark:border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-white/50">
            {language === 'id' ? 'Status Perjalanan Saat Ini' : 'Current Journey Status'}
          </span>
          <p className="mt-0.5 text-neutral-800 dark:text-white/85">
            {acceptance.localizedWhatIsHappening}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 dark:bg-white/[0.03] p-2.5 border border-lime-100 dark:border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            {language === 'id' ? 'Langkah Tenang Berikutnya' : 'Next Calm Step'}
          </span>
          <p className="mt-0.5 font-medium text-neutral-900 dark:text-white">
            {acceptance.localizedNextStep}
          </p>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-neutral-500 dark:text-white/55">
        {acceptance.localizedSafetyAssurance}
      </p>
    </div>
  )
}

function EdenRestorativeEnvironmentSection({
  episode,
  wellness,
}: {
  episode: CareEpisode
  wellness?: Record<string, WellnessDay>
}) {
  const [selectedDimension, setSelectedDimension] = useState<EdenAstralResonanceDimension>('cellular_light')

  const bridge = useMemo(
    () => deriveEdenRestorativeEnvironmentBridge(episode, wellness),
    [episode, wellness]
  )

  const activePerspective = useMemo(
    () => bridge.astralPerspectives.find((p) => p.dimension === selectedDimension) ?? bridge.astralPerspectives[0],
    [bridge.astralPerspectives, selectedDimension]
  )

  return (
    <div
      className="mt-3 rounded-xl border border-emerald-200 dark:border-white/10 bg-emerald-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-restorative-environment-card="v1"
      data-eden-circadian-stage={bridge.circadianAlignmentStage}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Restorative Environment & Cosmic Bio-Harmony — Living Earth Resonance
            </h4>
            <Badge tone="normal">
              {bridge.totalLoggedExposureDays > 0
                ? `${bridge.totalLoggedExposureDays} Days Logged`
                : 'Restorative Sanctuary Open'}
            </Badge>
            <Badge tone="neutral">Bio-Photonic & Circadian</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {bridge.cosmicBioHarmonyNarrative}
          </p>
        </div>
      </div>

      {/* Exposure Summaries */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {bridge.exposures.map((exp) => (
          <div
            key={exp.kind}
            className="rounded-lg border border-neutral-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5 text-xs"
            data-eden-exposure-item={exp.kind}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800 dark:text-white/90">{exp.label}</span>
              <Badge
                tone={
                  exp.restorativeState === 'active'
                    ? 'normal'
                    : exp.restorativeState === 'nurturing'
                    ? 'brand'
                    : 'neutral'
                }
              >
                {exp.loggedDaysCount > 0 ? `${exp.loggedDaysCount} Hari` : 'Belum Dicatat'}
              </Badge>
            </div>
            <p className="mt-1 text-neutral-600 dark:text-white/60 text-[11px]">
              {exp.latestValueLabel}
            </p>
          </div>
        ))}
      </div>

      {/* Astral & Cosmic Wonder Perspectives */}
      <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-white/10" data-eden-astral-perspectives="v1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-neutral-700 dark:text-white/80">
            Dimensi Keajaiban Alam Semesta & Resonansi Fisiologis:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {bridge.astralPerspectives.map((p) => (
            <button
              key={p.dimension}
              type="button"
              onClick={() => setSelectedDimension(p.dimension)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedDimension === p.dimension
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-emerald-100/50'
              }`}
            >
              {p.title.split('&')[0].trim()}
            </button>
          ))}
        </div>
        {activePerspective && (
          <div className="rounded-lg border border-emerald-300/40 dark:border-white/10 bg-emerald-100/40 dark:bg-white/[0.04] p-3 text-xs space-y-1.5">
            <div className="font-bold text-emerald-950 dark:text-emerald-200">
              {activePerspective.title}
            </div>
            <p className="text-neutral-800 dark:text-white/85 leading-relaxed">
              {activePerspective.wonderDescription}
            </p>
            <div className="text-[11px] text-neutral-600 dark:text-white/60 italic pt-1 border-t border-emerald-200/40 dark:border-white/5">
              <b>Grounded Science:</b> {activePerspective.scientificGrounding}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §8 · Non-prescriptive restorative wonder · Never fabricates unlogged exposures
      </div>
    </div>
  )
}

function EdenMultiModelRegenerationSection({ episode }: { episode: CareEpisode }) {
  const [selectedModel, setSelectedModel] = useState<EdenAiModelContributorKind>('gemini_argon')

  const bridge = useMemo(
    () => deriveEdenMultiModelRegenerationBridge(episode),
    [episode]
  )

  const activeHypothesis = useMemo(
    () => bridge.hypotheses.find((h) => h.contributorModel === selectedModel) ?? bridge.hypotheses[0],
    [bridge.hypotheses, selectedModel]
  )

  return (
    <div
      className="mt-3 rounded-xl border border-fuchsia-200 dark:border-white/10 bg-fuchsia-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-multi-model-regeneration-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Multi-Model Frontier Scientific Imagination — Collective Human Regeneration
            </h4>
            <Badge tone="brand">4-Model Consensus Synthesis</Badge>
            <Badge tone="neutral">Frontier Research Horizon</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {bridge.collectiveSynthesisNarrative}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-fuchsia-100 dark:border-white/10" data-eden-frontier-hypotheses="v1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-neutral-700 dark:text-white/80">
            Kontributor Inteligensi & Domain Hipotesis Terdepan:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {bridge.hypotheses.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setSelectedModel(h.contributorModel)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedModel === h.contributorModel
                  ? 'bg-fuchsia-600 text-white font-bold'
                  : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-fuchsia-100/50'
              }`}
            >
              {h.contributorName.split('·')[0].trim()}
            </button>
          ))}
        </div>

        {activeHypothesis && (
          <div className="rounded-lg border border-fuchsia-300/40 dark:border-white/10 bg-fuchsia-100/40 dark:bg-white/[0.04] p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-fuchsia-950 dark:text-fuchsia-200">
                {activeHypothesis.contributorName}
              </span>
              <Badge tone="normal">{activeHypothesis.domainLabel}</Badge>
            </div>
            <p className="text-neutral-800 dark:text-white/85 leading-relaxed">
              <b>Visi Terobosan:</b> {activeHypothesis.transcendentVision}
            </p>
            <div className="text-[11px] text-neutral-700 dark:text-white/75 pt-1 border-t border-fuchsia-200/40 dark:border-white/5">
              <b>Mekanisme Molekuler/Fisiologis:</b> {activeHypothesis.mechanisticGrounding}
            </div>
            <div className="text-[10px] text-neutral-500 dark:text-white/50 italic">
              <b>Batas Keselamatan:</b> {activeHypothesis.clinicalSafetyBoundary}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2.5 rounded-lg bg-white/60 dark:bg-white/[0.02] p-2 text-[11px] text-neutral-700 dark:text-white/70 border border-fuchsia-100 dark:border-white/5">
        <b>Trajektori Masa Depan Bersama:</b> {bridge.transcendentFutureTrajectory}
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        PANACEA CONSTITUTION §0 · Separate research hypothesis truth class · No autonomous clinical intervention
      </div>
    </div>
  )
}

function EdenQuantumBioPhotonicSection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenQuantumBioPhotonicBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.quantumBiophotonicNarrativeId : bridge.quantumBiophotonicNarrativeEn
  const mechanistic = lang === 'id' ? bridge.mechanisticGroundingId : bridge.mechanisticGroundingEn

  return (
    <div
      className="mt-3 rounded-xl border border-cyan-200 dark:border-white/10 bg-cyan-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-quantum-biophotonic-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Quantum Bio-Photonic Field & Transcendent Cellular Longevity
            </h4>
            <Badge tone="brand">{bridge.dimensionLabel}</Badge>
            <Badge tone="normal">{bridge.photonicTrajectoryLabel}</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-cyan-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-cyan-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2" data-eden-quantum-metrics="v1">
        <div className="rounded-lg border border-cyan-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-700 dark:text-white/80">
              Mitochondrial Coherence Index
            </span>
            <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300">
              {bridge.mitochondrialCoherenceScore}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-cyan-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
              style={{ width: `${bridge.mitochondrialCoherenceScore}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-cyan-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-700 dark:text-white/80">
              Cellular Resonance Field
            </span>
            <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300">
              {bridge.cellularResonanceIndex}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-blue-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              style={{ width: `${bridge.cellularResonanceIndex}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-2.5 rounded-lg border border-cyan-200/40 dark:border-white/10 bg-cyan-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1.5">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Landasan Fisiologis & Mekanistik:' : 'Physiological & Mechanistic Grounding:'}</b> {mechanistic}
        </div>
        <div className="text-[11px] text-neutral-700 dark:text-white/75 pt-1 border-t border-cyan-200/40 dark:border-white/5">
          <b>{lang === 'id' ? 'Trajektori Umur Panjang Transenden:' : 'Transcendent Longevity Trajectory:'}</b> {bridge.transcendentLongevityTrajectory}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §11 · Quantum bio-photonic simulation · Never fabricates biomarkers · Non-interventional boundary
      </div>
    </div>
  )
}

function EdenMultidimensionalConsciousnessSection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenMultidimensionalConsciousnessBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.astralHolographicNarrativeId : bridge.astralHolographicNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-indigo-200 dark:border-white/10 bg-indigo-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-multidimensional-consciousness-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Astral Holographic Projection & Multidimensional Biological Consciousness
            </h4>
            <Badge tone="brand">{bridge.equilibriumStateLabel}</Badge>
            <Badge tone="normal">Harmony {bridge.overallConsciousnessHarmonyScore}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-indigo-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-indigo-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2" data-eden-consciousness-scales="v1">
        {bridge.scales.map((s) => {
          const insight = lang === 'id' ? s.holographicInsightId : s.holographicInsightEn
          return (
            <div
              key={s.scale}
              className="rounded-lg border border-indigo-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-700 dark:text-white/80">
                  {s.scaleLabel}
                </span>
                <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                  {s.biopsychosocialIndex}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-indigo-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${s.biopsychosocialIndex}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-neutral-600 dark:text-neutral-300">
                {insight}
              </p>
              <div className="mt-1 text-[9px] text-neutral-400 dark:text-white/40 italic">
                {s.mechanisticGrounding}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-indigo-200/40 dark:border-white/10 bg-indigo-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Trajektori Pengalaman Transenden:' : 'Transcendent Human Experience Trajectory:'}</b>{' '}
          {bridge.transcendentHumanExperienceTrajectory}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §12 · Multidimensional consciousness projection · No autonomous neurological diagnosis · Phenomenological experience preserved
      </div>
    </div>
  )
}

function EdenBioCosmicSymphonySection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenBioCosmicSymphonyBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.bioCosmicNarrativeId : bridge.bioCosmicNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-violet-200 dark:border-white/10 bg-violet-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-bio-cosmic-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Bio-Cosmic Symphony & Multi-Scale Reality Lattice Bridge
            </h4>
            <Badge tone="brand">{bridge.resonanceStateLabel}</Badge>
            <Badge tone="normal">Harmony {bridge.symphonyHarmonyScore}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-violet-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-violet-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-violet-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-violet-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" data-eden-reality-lattice="v1">
        {bridge.layers.map((l) => {
          const summary = lang === 'id' ? l.groundingSummaryId : l.groundingSummaryEn
          return (
            <div
              key={l.layer}
              className="rounded-lg border border-violet-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-neutral-700 dark:text-white/80 truncate">
                  {l.layerLabel}
                </span>
                <span className="text-[10px] uppercase font-semibold text-violet-700 dark:text-violet-300 shrink-0">
                  {l.truthClass}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-neutral-500 dark:text-white/50">Koherensi</span>
                <span className="font-extrabold text-violet-700 dark:text-violet-300">{l.coherenceIndex}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-violet-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  style={{ width: `${l.coherenceIndex}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-neutral-600 dark:text-neutral-300">
                {summary}
              </p>
              <div className="mt-1 text-[9px] text-neutral-400 dark:text-white/40 italic truncate">
                {l.scientificOrExperientialSource}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-violet-200/40 dark:border-white/10 bg-violet-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Trajektori Kemakmuran Universal:' : 'Universal Flourishing Trajectory:'}</b>{' '}
          {bridge.universalFlourishingTrajectory}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §13-14 · Governed Multi-Scale Reality Lattice · Patient Truth Uncompromised · Epistemic Humility Preserved
      </div>
    </div>
  )
}

function EdenMultiAgentHealingCouncilSection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenMultiAgentHealingCouncilBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.collectiveHealingNarrativeId : bridge.collectiveHealingNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-emerald-200 dark:border-white/10 bg-emerald-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-healing-council-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Universal Biological Flourishing & Multi-Agent Collaborative Healing Council
            </h4>
            <Badge tone="brand">{bridge.consensusStateLabel}</Badge>
            <Badge tone="normal">Flourishing {bridge.collectiveFlourishingScore}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-emerald-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-emerald-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2" data-eden-agent-perspectives="v1">
        {bridge.agentPerspectives.map((a) => {
          const synthesis = lang === 'id' ? a.creativeWonderSynthesisId : a.creativeWonderSynthesisEn
          return (
            <div
              key={a.agentModel}
              className="rounded-lg border border-emerald-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  {a.agentName}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                  Resilience {a.bioEnergeticResilienceScore}%
                </span>
              </div>
              <div className="text-[10px] text-emerald-800/80 dark:text-emerald-400 font-medium">
                {a.councilRole}
              </div>
              <p className="mt-1 text-[10px] italic text-neutral-600 dark:text-neutral-300">
                "{a.philosophicalPerspective}"
              </p>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-emerald-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${a.bioEnergeticResilienceScore}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-neutral-700 dark:text-neutral-200">
                {synthesis}
              </p>
              <div className="mt-1 text-[9px] text-neutral-500 dark:text-white/45">
                <span className="font-semibold">{lang === 'id' ? 'Hipotesis:' : 'Hypothesis:'}</span> {a.suggestedExploratoryHypothesis}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-emerald-200/40 dark:border-white/10 bg-emerald-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Trajektori Kebijaksanaan Multi-Model:' : 'Multi-Agent Wisdom Trajectory:'}</b>{' '}
          {bridge.multiAgentWisdomTrajectory}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §00-02 · Multi-Agent Collective Synthesis · Patient Truth Uncompromised · No Autonomous Clinical Intervention
      </div>
    </div>
  )
}

function EdenBioHarmonicWaveformSection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenBioHarmonicWaveformBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.waveformNarrativeId : bridge.waveformNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-cyan-200 dark:border-white/10 bg-cyan-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-bio-harmonic-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Bio-Harmonic Epigenetic Resonance & Cellular Longevity Waveform
            </h4>
            <Badge tone="brand">{bridge.waveformStateLabel}</Badge>
            <Badge tone="normal">Resonance {bridge.cellularResonanceIndex}%</Badge>
            <Badge tone="normal">Circadian {bridge.circadianSynchronizationScore}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-cyan-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-cyan-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" data-eden-epigenetic-layers="v1">
        {bridge.epigeneticLayers.map((l) => {
          const accel = l.epigeneticAgeAccelerationYears
          const isDecel = accel <= 0
          return (
            <div
              key={l.clockModel}
              className="rounded-lg border border-cyan-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                {l.clockLabel}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-cyan-800 dark:text-cyan-300">
                  {l.biologicalAgeEstimateYears} <span className="text-[10px] font-normal text-neutral-500 dark:text-white/50">{lang === 'id' ? 'tahun bio' : 'bio years'}</span>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isDecel ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {accel > 0 ? `+${accel}` : accel}y
                </span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-500 dark:text-white/50">
                {lang === 'id' ? 'Usia Kronologis:' : 'Chronological Age:'} {l.chronologicalAgeYears} {lang === 'id' ? 'tahun' : 'years'}
              </div>
              <div className="mt-1 text-[9px] text-neutral-400 dark:text-white/40 italic truncate">
                {l.calibrationSource}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-cyan-200/40 dark:border-white/10 bg-cyan-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Trajektori Gelombang Longevity Seluler:' : 'Cellular Longevity Waveform Trajectory:'}</b>{' '}
          {bridge.longevityWaveformTrajectory}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §07 · Epigenetic Clock & Mitohormetic Waveform Engine · Patient Truth Uncompromised · Never Manufactures Methylation Arrays
      </div>
    </div>
  )
}

function EdenCircadianMitochondrialSection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenCircadianMitochondrialHarmonizerBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.circadianNarrativeId : bridge.circadianNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-amber-200 dark:border-white/10 bg-amber-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-circadian-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Circadian-Metabolic Neuro-Synchrony & Mitochondrial Vitality Harmonizer
            </h4>
            <Badge tone="brand">{bridge.masterPhaseLabel}</Badge>
            <Badge tone="normal">{bridge.mitochondrialDynamicsLabel}</Badge>
            <Badge tone="normal">Resonance {bridge.systemChronobiologicalResonance}%</Badge>
            <Badge tone="normal">SCN {bridge.suprachiasmaticEntrainmentScore}%</Badge>
            <Badge tone="normal">Mito {bridge.mitochondrialVitalityIndex}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-amber-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-amber-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" data-eden-peripheral-clocks="v1">
        {bridge.peripheralClocks.map((c) => {
          const alignmentPct = Math.round(c.phaseAlignment * 100)
          const mitoCouplingPct = Math.round(c.mitochondrialCouplingIndex * 100)
          return (
            <div
              key={c.clockKind}
              className="rounded-lg border border-amber-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                {c.clockLabel}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-amber-800 dark:text-amber-300">
                  {alignmentPct}% <span className="text-[10px] font-normal text-neutral-500 dark:text-white/50">{lang === 'id' ? 'selaras' : 'aligned'}</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Mito {mitoCouplingPct}%
                </span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-600 dark:text-white/60">
                {lang === 'id' ? 'Jendela Puncak:' : 'Peak Window:'} {c.peakEfficiencyWindow}
              </div>
              <div className="mt-1 text-[9px] text-neutral-500 dark:text-white/50 italic line-clamp-2">
                {c.mechanisticNote}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-amber-200/40 dark:border-white/10 bg-amber-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Strategi Longevity Kronobiologis & Mitokondria:' : 'Chronobiological & Mitochondrial Longevity Strategy:'}</b>{' '}
          {bridge.chronobiologicalLongevityStrategy}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §08 · Circadian-Metabolic Neuro-Synchrony & Mitochondrial Vitality Harmonizer · Patient Truth Uncompromised · Never Manufactures Biomarkers
      </div>
    </div>
  )
}

function EdenProteostasisAutophagicFluxSection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenProteostasisAutophagicFluxBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.proteostasisNarrativeId : bridge.proteostasisNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-teal-200 dark:border-white/10 bg-teal-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-proteostasis-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Regenerative Proteostasis & Autophagic Flux Clearance Synthesizer
            </h4>
            <Badge tone="brand">{bridge.proteostasisStateLabel}</Badge>
            <Badge tone="normal">{bridge.autophagicFluxRateLabel}</Badge>
            <Badge tone="normal">Clearance {bridge.cellularClearanceIndex}%</Badge>
            <Badge tone="normal">Chaperone {bridge.chaperoneBufferingCapacityScore}%</Badge>
            <Badge tone="normal">Lysosome {bridge.lysosomalResilienceScore}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-teal-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-teal-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-teal-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-teal-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" data-eden-proteostasis-nodes="v1">
        {bridge.proteostasisNodes.map((n) => {
          const effPct = Math.round(n.efficiencyScore * 100)
          return (
            <div
              key={n.nodeKind}
              className="rounded-lg border border-teal-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                {n.nodeLabel}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-teal-800 dark:text-teal-300">
                  {effPct}% <span className="text-[10px] font-normal text-neutral-500 dark:text-white/50">{lang === 'id' ? 'efisien' : 'efficient'}</span>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  n.capacityStatus === 'optimal_throughput'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : n.capacityStatus === 'impaired_clearance'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {n.clearanceLatencyHours}h lat
                </span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-600 dark:text-white/60">
                {lang === 'id' ? 'Status Kapasitas:' : 'Capacity Status:'} {n.capacityStatus}
              </div>
              <div className="mt-1 text-[9px] text-neutral-500 dark:text-white/50 italic line-clamp-2">
                {n.mechanisticNote}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-teal-200/40 dark:border-white/10 bg-teal-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Strategi Regenerasi Proteostasis & Autofagi:' : 'Proteostasis & Autophagy Regeneration Strategy:'}</b>{' '}
          {bridge.proteostaticRegenerativeStrategy}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §07 · Regenerative Proteostasis & Autophagic Flux Synthesizer · Patient Truth Uncompromised · Never Manufactures Biomarkers
      </div>
    </div>
  )
}

function EdenTelomericGenomicIntegritySection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenTelomericGenomicIntegrityBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.genomicNarrativeId : bridge.genomicNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-indigo-200 dark:border-white/10 bg-indigo-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-telomeric-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Telomeric Maintenance & Genomic Integrity Synthesizer
            </h4>
            <Badge tone="brand">{bridge.telomericStateLabel}</Badge>
            <Badge tone="normal">{bridge.dnaRepairFidelityLabel}</Badge>
            <Badge tone="normal">Genomic {bridge.genomicResilienceIndex}%</Badge>
            <Badge tone="normal">Shelterin {bridge.shelterinCappingScore}%</Badge>
            <Badge tone="normal">Repair {bridge.dnaRepairCapacityScore}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-indigo-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-indigo-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" data-eden-genomic-clusters="v1">
        {bridge.genomicClusters.map((c) => {
          const integPct = Math.round(c.integrityScore * 100)
          const repairPct = Math.round(c.repairCapacityIndex * 100)
          return (
            <div
              key={c.clusterKind}
              className="rounded-lg border border-indigo-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                {c.clusterLabel}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-indigo-800 dark:text-indigo-300">
                  {integPct}% <span className="text-[10px] font-normal text-neutral-500 dark:text-white/50">{lang === 'id' ? 'integritas' : 'integrity'}</span>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  c.maintenanceStatus === 'resilient_capping'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : c.maintenanceStatus === 'checkpoint_surveillance'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  Repair {repairPct}%
                </span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-600 dark:text-white/60">
                {lang === 'id' ? 'Status Pemeliharaan:' : 'Maintenance Status:'} {c.maintenanceStatus}
              </div>
              <div className="mt-1 text-[9px] text-neutral-500 dark:text-white/50 italic line-clamp-2">
                {c.mechanisticNote}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-indigo-200/40 dark:border-white/10 bg-indigo-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Strategi Pemeliharaan Telomer & Genomik:' : 'Telomeric & Genomic Maintenance Strategy:'}</b>{' '}
          {bridge.telomericLongevityStrategy}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §07 · Telomeric Maintenance & Genomic Integrity Synthesizer · Patient Truth Uncompromised · Never Manufactures Biomarkers
      </div>
    </div>
  )
}

function EdenSenescentInflammagingSection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenSenescentInflammagingBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.senescentNarrativeId : bridge.senescentNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-rose-200 dark:border-white/10 bg-rose-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-senescent-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Senescent Secretome & Inflammaging Attenuation Synthesizer
            </h4>
            <Badge tone="brand">{bridge.senescenceBurdenLabel}</Badge>
            <Badge tone="normal">{bridge.inflammagingLevelLabel}</Badge>
            <Badge tone="normal">Inflammaging: {bridge.systemicInflammagingScore}</Badge>
            <Badge tone="normal">Senolytic: {bridge.senolyticResilienceIndex}%</Badge>
            <Badge tone="normal">Suppression: {bridge.secretomeSuppressionCapacity}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-rose-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-rose-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" data-eden-surveillance-nodes="v1">
        {bridge.surveillanceNodes.map((n) => {
          const clearancePct = Math.round(n.clearanceCapacityScore * 100)
          const suppressionPct = Math.round(n.secretomeSuppressionIndex * 100)
          return (
            <div
              key={n.nodeKind}
              className="rounded-lg border border-rose-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                {n.nodeLabel}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-rose-800 dark:text-rose-300">
                  {clearancePct}% <span className="text-[10px] font-normal text-neutral-500 dark:text-white/50">{lang === 'id' ? 'pembersihan' : 'clearance'}</span>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  n.surveillanceStatus === 'optimal_resolution'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : n.surveillanceStatus === 'sasp_propagation'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  Suppression {suppressionPct}%
                </span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-600 dark:text-white/60">
                {lang === 'id' ? 'Status Pengawasan:' : 'Surveillance Status:'} {n.surveillanceStatus}
              </div>
              <div className="mt-1 text-[9px] text-neutral-500 dark:text-white/50 italic line-clamp-2">
                {n.mechanisticNote}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-rose-200/40 dark:border-white/10 bg-rose-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Strategi Atenuasi Senesen & Inflammaging:' : 'Senescent & Inflammaging Attenuation Strategy:'}</b>{' '}
          {bridge.senolyticInflammagingStrategy}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §07 · Senescent Secretome & Inflammaging Attenuation Synthesizer · Patient Truth Uncompromised · Never Manufactures Biomarkers
      </div>
    </div>
  )
}

function EdenRegenerativePlasticitySection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenRegenerativePlasticityBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.regenerativeNarrativeId : bridge.regenerativeNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-emerald-200 dark:border-white/10 bg-emerald-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-regenerative-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Stem Cell Niches & Regenerative Tissue Plasticity Synthesizer
            </h4>
            <Badge tone="brand">{bridge.stemCellNicheStateLabel}</Badge>
            <Badge tone="normal">{bridge.plasticityLevelLabel}</Badge>
            <Badge tone="normal">Plasticity: {bridge.regenerativePlasticityScore}%</Badge>
            <Badge tone="normal">Niche Vitality: {bridge.stemNicheVitalityIndex}%</Badge>
            <Badge tone="normal">Commitment: {bridge.lineageCommitmentCapacity}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-emerald-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-emerald-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" data-eden-stem-niche-nodes="v1">
        {bridge.nicheNodes.map((n) => {
          const renewalPct = Math.round(n.renewalCapacityScore * 100)
          const fidelityPct = Math.round(n.lineageFidelityIndex * 100)
          return (
            <div
              key={n.nicheKind}
              className="rounded-lg border border-emerald-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                {n.nicheLabel}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-300">
                  {renewalPct}% <span className="text-[10px] font-normal text-neutral-500 dark:text-white/50">{lang === 'id' ? 'pembaruan' : 'renewal'}</span>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  n.nicheHomeostasisStatus === 'optimal_asymmetric_balance'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : n.nicheHomeostasisStatus === 'stress_accelerated_differentiation'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  Fidelity {fidelityPct}%
                </span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-600 dark:text-white/60">
                {lang === 'id' ? 'Status Homeostasis:' : 'Homeostasis Status:'} {n.nicheHomeostasisStatus}
              </div>
              <div className="mt-1 text-[9px] text-neutral-500 dark:text-white/50 italic line-clamp-2">
                {n.mechanisticNote}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-emerald-200/40 dark:border-white/10 bg-emerald-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Strategi Niche Sel Punca & Plastisitas Jaringan:' : 'Stem Cell Niche & Tissue Plasticity Strategy:'}</b>{' '}
          {bridge.stemCellRegenerativeStrategy}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §07 · Stem Cell Niches & Regenerative Tissue Plasticity Synthesizer · Patient Truth Uncompromised · Never Manufactures Biomarkers
      </div>
    </div>
  )
}

function EdenEpigeneticAgeReversalSection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenEpigeneticAgeReversalBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.epigeneticNarrativeId : bridge.epigeneticNarrativeEn
  const deltaFormatted = bridge.biologicalAgeDeltaYears > 0 ? `+${bridge.biologicalAgeDeltaYears}` : `${bridge.biologicalAgeDeltaYears}`

  return (
    <div
      className="mt-3 rounded-xl border border-purple-200 dark:border-white/10 bg-purple-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-epigenetic-reversal-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Epigenetic Biological Age Reversal & Transcriptomic Harmony Synthesizer
            </h4>
            <Badge tone="brand">{bridge.epigeneticStateLabel}</Badge>
            <Badge tone="normal">{bridge.transcriptomicPurityLabel}</Badge>
            <Badge tone="normal">Bio-Age: {deltaFormatted} yrs</Badge>
            <Badge tone="normal">Harmony: {bridge.epigeneticHarmonyIndex}%</Badge>
            <Badge tone="normal">Fidelity: {bridge.transcriptomicFidelityScore}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-purple-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-purple-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" data-eden-epigenetic-clusters="v1">
        {bridge.harmonyClusters.map((c) => {
          const harmonyPct = Math.round(c.harmonyScore * 100)
          const reversalPct = Math.round(c.reversalPotentialIndex * 100)
          return (
            <div
              key={c.clusterKind}
              className="rounded-lg border border-purple-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                {c.clusterLabel}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-purple-800 dark:text-purple-300">
                  {harmonyPct}% <span className="text-[10px] font-normal text-neutral-500 dark:text-white/50">{lang === 'id' ? 'harmoni' : 'harmony'}</span>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  c.clusterStatus === 'optimal_epigenetic_youth'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : c.clusterStatus === 'drift_attenuation_required'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  Reversal {reversalPct}%
                </span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-600 dark:text-white/60">
                {lang === 'id' ? 'Status Klaster:' : 'Cluster Status:'} {c.clusterStatus}
              </div>
              <div className="mt-1 text-[9px] text-neutral-500 dark:text-white/50 italic line-clamp-2">
                {c.mechanisticNote}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-purple-200/40 dark:border-white/10 bg-purple-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Strategi Pembalikan Epigenetik & Harmoni Transkriptomik:' : 'Epigenetic Reversal & Transcriptomic Strategy:'}</b>{' '}
          {bridge.epigeneticReversalStrategy}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §07 · Epigenetic Biological Age Reversal & Transcriptomic Harmony Synthesizer · Patient Truth Uncompromised · Never Manufactures Biomarkers
      </div>
    </div>
  )
}

function EdenMitochondrialHeteroplasmySection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenMitochondrialHeteroplasmyBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.mitochondrialNarrativeId : bridge.mitochondrialNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-amber-200 dark:border-white/10 bg-amber-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-mitochondrial-heteroplasmy-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              Eden Mitochondrial Heteroplasmy & Bioenergetic Fusion Synthesizer
            </h4>
            <Badge tone="brand">{bridge.heteroplasmyStateLabel}</Badge>
            <Badge tone="normal">{bridge.fusionRateLevelLabel}</Badge>
            <Badge tone="normal">Vitality: {bridge.mitochondrialVitalityScore}%</Badge>
            <Badge tone="normal">OXPHOS: {bridge.oxphosEfficiencyIndex}%</Badge>
            <Badge tone="normal">ATP Synthesis: {bridge.atpSynthesisCapacity}%</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-800 dark:text-white/85">
            {narrative}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'id'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-amber-100/50'
            }`}
          >
            Bahasa
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              lang === 'en'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-white/70 hover:bg-amber-100/50'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" data-eden-mitochondrial-fusion-nodes="v1">
        {bridge.fusionNodes.map((n) => {
          const fusionPct = Math.round(n.fusionEfficiencyScore * 100)
          const reticularPct = Math.round(n.reticularIntegrityIndex * 100)
          return (
            <div
              key={n.nodeKind}
              className="rounded-lg border border-amber-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-2.5"
            >
              <div className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                {n.nodeLabel}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-amber-800 dark:text-amber-300">
                  {fusionPct}% <span className="text-[10px] font-normal text-neutral-500 dark:text-white/50">{lang === 'id' ? 'fusi' : 'fusion'}</span>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  n.networkDynamicsStatus === 'optimal_reticular_network'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : n.networkDynamicsStatus === 'fragmentation_strain'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  Reticular {reticularPct}%
                </span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-600 dark:text-white/60">
                {lang === 'id' ? 'Status Dinamika:' : 'Dynamics Status:'} {n.networkDynamicsStatus}
              </div>
              <div className="mt-1 text-[9px] text-neutral-500 dark:text-white/50 italic line-clamp-2">
                {n.mechanisticNote}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 rounded-lg border border-amber-200/40 dark:border-white/10 bg-amber-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Strategi Fusi Bioenergetik & Kebugaran Mitokondria:' : 'Bioenergetic Fusion & Mitochondrial Strategy:'}</b>{' '}
          {bridge.mitochondrialLongevityStrategy}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §07 · Mitochondrial Heteroplasmy & Bioenergetic Fusion Synthesizer · Patient Truth Uncompromised · Never Manufactures Biomarkers
      </div>
    </div>
  )
}

function EdenCircadianAutophagyPulseSection({ episode }: { episode: CareEpisode }) {
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const bridge = useMemo(
    () => deriveEdenCircadianAutophagyPulseBridge(episode),
    [episode]
  )

  const narrative = lang === 'id' ? bridge.autophagyNarrativeId : bridge.autophagyNarrativeEn

  return (
    <div
      className="mt-3 rounded-xl border border-emerald-200 dark:border-white/10 bg-emerald-50/30 dark:bg-white/[0.02] p-3.5"
      data-eden-circadian-autophagy-card="v1"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              {lang === 'id'
                ? 'Autofagi Pulsatil Sirkadian & Klirens Lisosomal Xenohormesis'
                : 'Circadian Pulsatile Autophagy & Xenohormetic Lysosomal Clearance'}
            </h4>
            <span className="rounded-full bg-emerald-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              {bridge.autophagyStateLabel}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-600 dark:text-white/70">
            {bridge.pulseTierLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-md border border-emerald-200 dark:border-white/10 p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setLang('id')}
              className={`px-1.5 py-0.5 rounded ${lang === 'id' ? 'bg-emerald-600 text-white font-bold' : 'text-neutral-600 dark:text-white/60'}`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-1.5 py-0.5 rounded ${lang === 'en' ? 'bg-emerald-600 text-white font-bold' : 'text-neutral-600 dark:text-white/60'}`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="rounded-lg bg-emerald-100/40 dark:bg-white/[0.03] p-2 text-center">
          <span className="text-[10px] text-neutral-500 dark:text-white/60 block">
            {lang === 'id' ? 'Sinkroni Sirkadian' : 'Circadian Synchrony'}
          </span>
          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
            {bridge.circadianSynchronyIndex}%
          </span>
        </div>
        <div className="rounded-lg bg-emerald-100/40 dark:bg-white/[0.03] p-2 text-center">
          <span className="text-[10px] text-neutral-500 dark:text-white/60 block">
            {lang === 'id' ? 'Kapasitas Fluks Autofagi' : 'Autophagic Flux'}
          </span>
          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
            {bridge.autophagicFluxCapacity}%
          </span>
        </div>
        <div className="rounded-lg bg-emerald-100/40 dark:bg-white/[0.03] p-2 text-center">
          <span className="text-[10px] text-neutral-500 dark:text-white/60 block">
            {lang === 'id' ? 'Resiliensi Xenohormesis' : 'Xenohormetic Resilience'}
          </span>
          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
            {bridge.xenohormeticResilienceScore}%
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs text-neutral-700 dark:text-white/80 leading-relaxed">
        {narrative}
      </p>

      <div className="mt-2.5 space-y-1.5" data-eden-xenohormetic-pulse-nodes="v1">
        <div className="text-[10px] font-bold text-neutral-500 dark:text-white/60 uppercase tracking-wider">
          {lang === 'id' ? 'Nodus Sinyal Xenohormesis & Autofagi (4 Nodus)' : 'Xenohormesis & Autophagy Signaling Nodes (4 Nodes)'}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {bridge.pulseNodes.map((node) => (
            <div
              key={node.nodeKind}
              className="rounded-lg border border-emerald-200/50 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] p-2 text-xs"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-neutral-800 dark:text-white truncate">
                  {node.nodeLabel}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {Math.round(node.activationIndex * 100)}%
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-neutral-500 dark:text-white/60">
                {node.mechanisticNote}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2.5 rounded-lg border border-emerald-200/40 dark:border-white/10 bg-emerald-100/30 dark:bg-white/[0.02] p-2.5 text-xs space-y-1">
        <div className="text-[11px] text-neutral-800 dark:text-white/85">
          <b>{lang === 'id' ? 'Strategi Longevity & Ritme Sirkadian Xenohormesis:' : 'Circadian Longevity & Xenohormesis Strategy:'}</b>{' '}
          {bridge.xenohormeticLongevityStrategy}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-neutral-500 dark:text-white/50 text-right">
        ARGON EDEN ∞ §07 · Circadian Autophagy & Xenohormetic Longevity Pulse Synthesizer · Patient Truth Uncompromised · Never Manufactures Biomarkers
      </div>
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
