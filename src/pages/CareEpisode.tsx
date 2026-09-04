import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { api, backendEnabled, type FacilityPriceSubmission } from '../lib/api'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconPlan, IconPlus } from '../components/icons'
import {
  CARE_EPISODE_STAGES,
  STAGE_LABEL,
  STATUS_LABEL,
  newCareEpisode,
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
  COST_ITEM_PRESETS,
  addCostItem,
  updateCostItem,
  removeCostItem,
  type CandidateView,
} from '../lib/careEpisode'
import type { CareEpisode, CareEpisodeStageId, CareEpisodeStageStatus, CostItem } from '../lib/types'

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
      <Card className="mx-auto max-w-md text-center">
        <IconPlan size={40} className="mx-auto text-brand" />
        <h3 className="mt-3 text-lg font-bold">No care episode yet</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Draft a plan in the <b>AI Chatbot</b> first, then track it here as a full care journey.
        </p>
        <Link to="/chatbot" className="mt-4 inline-block">
          <Button>Open AI Chatbot</Button>
        </Link>
      </Card>
    )
  }

  const episodes = record.careEpisodes ?? []

  function update(episodes: CareEpisode[]) {
    saveRecord({ ...record!, careEpisodes: episodes, updatedAt: new Date().toISOString() })
  }

  function addEpisode() {
    if (!newTitle.trim()) return
    update([...episodes, newCareEpisode(newTitle.trim())])
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
      <SectionTitle
        icon={<IconPlan size={18} />}
        title="Care journey"
        subtitle="Problem to prevention — everything a plan item triggers in the real world."
      />

      <Card>
        <Field label="New care episode">
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="e.g. Gallstone — surgical evaluation"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addEpisode()}
            />
            <Button onClick={addEpisode} className="shrink-0">
              <IconPlus size={16} /> Start
            </Button>
          </div>
        </Field>
      </Card>

      {episodes.length === 0 && (
        <p className="text-center text-sm text-neutral-500">No care episodes tracked yet.</p>
      )}

      {episodes.map((ep) => (
        <EpisodeCard
          key={ep.id}
          episode={ep}
          onChange={(next) => updateEpisode(ep.id, next)}
          onRemove={() => removeEpisode(ep.id)}
        />
      ))}
    </div>
  )
}

function EpisodeCard({
  episode,
  onChange,
  onRemove,
}: {
  episode: CareEpisode
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
    const blockedReason =
      status === 'blocked' ? window.prompt('What is blocking this stage?') ?? undefined : undefined
    onChange(setStageStatus(episode, stage, status, { blockedReason }))
  }

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">{episode.title}</h3>
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
        <div className="mt-3 space-y-1 rounded-xl bg-accent/5 p-3">
          {blockedStages.map((s) => (
            <p key={s.stage} className="text-xs text-accent">
              <b>{STAGE_LABEL[s.stage]} blocked</b>
              {s.blockedReason ? ` — ${s.blockedReason}` : ' — no reason given yet.'}
            </p>
          ))}
          {stalls.map((s) => (
            <p key={s.stage} className={`text-xs ${s.severity === 'stalled' ? 'text-accent' : 'text-amber-700'}`}>
              {stallReason(s)}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <ProviderComparison episode={episode} onChange={onChange} />
      </div>

      {episode.facilityId && (
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <CostEstimateField episode={episode} onChange={onChange} />
        </div>
      )}
    </Card>
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

      <div className="mt-2 flex items-center gap-2">
        {availablePresets.length > 0 && (
          <select
            className={`${inputClass} min-w-0 flex-1`}
            value=""
            onChange={(e) => {
              if (!e.target.value) return
              if (e.target.value === '__other__') {
                const label = window.prompt('Name this cost component:')?.trim()
                if (label) onChange(addCostItem(episode, label))
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
        )}
      </div>

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
            onClick={() => onChange(addCostItem(episode, COST_ITEM_PRESETS[0]))}
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
          myPrice={{
            low: low ? Number(low) : undefined,
            high: high ? Number(high) : undefined,
            confidence: episode.costConfidence ?? 'estimated',
            source: source.trim() || undefined,
          }}
        />
      )}
    </Field>
  )
}
