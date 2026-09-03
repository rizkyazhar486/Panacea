import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
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
  formatCostRange,
} from '../lib/careEpisode'
import type { CareEpisode, CareEpisodeStageId, CareEpisodeStageStatus } from '../lib/types'

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
    </Card>
  )
}
