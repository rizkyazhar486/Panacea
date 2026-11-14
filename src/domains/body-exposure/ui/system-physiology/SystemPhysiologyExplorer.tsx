// Every body system's physiology on the Physiology stage: the list of systems, then one system's card, and on that
// card a self-check of its sourced mechanisms. Loaded on demand (the catalog carries the text of every education
// graph, ~20 kB gzip), so the stage itself stays light.
//
// The plans come from the engines; this component only chooses which one to show and owns the self-check session.
// A catalog that cannot describe every system is shown as an error, never as a partial list that looks complete.
// Self-ratings are the learner's own, kept in this browser only (or only for the visit when the browser refuses).

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  browserRecallStore,
  calendarDayOf,
  newRecallLog,
  planRecallDeck,
  recordRecall,
  restoreRecallLog,
  serializeRecallLog,
  type RecallDeckPlan,
  type RecallLog,
  type RecallStore,
} from '../../../prometheus-learning/index.ts'
import type { BodySystemId } from '../../data/bodySystems'
import { defaultPhysiologyCatalog } from '../../engine/system-physiology/physiologyCatalog'
import { planSystemIndex, planSystemPhysiology } from '../../engine/system-physiology/systemPhysiology'
import { simulationsFor, type StageSimulation } from '../../engine/system-physiology/systemSimulations'
import { TONE, subtleButton } from '../atlas-stage/stageTokens'
import { SelfCheck, relativeDay, type RateOutcome, type RecallPersistence } from './SelfCheck'
import { SystemCard, selfCheckStartId } from './SystemCard'
import { SystemIndex, systemRowId } from './SystemIndex'

/** This browser's key for the stage's self-ratings; the version follows the recall log's schema. */
export const PHYSIOLOGY_RECALL_KEY = 'panacea.atlas.physiology-recall.v1'

export interface SystemPhysiologyExplorerProps {
  /** The open system, or null for the list of all systems. */
  systemId: BodySystemId | null
  onSystem: (id: BodySystemId | null) => void
  onSimulate: (simulation: StageSimulation) => void
  /** Injected for tests; the page's localStorage by default. */
  recallStore?: RecallStore
  /** Injected for tests; the learner's calendar day from this device's clock by default. */
  today?: () => number | null
  /** Told when a self-check opens or closes, so the stage can keep one main action on screen. */
  onSessionChange?: (open: boolean) => void
}

const deviceToday = () => calendarDayOf(Date.now(), new Date().getTimezoneOffset())

interface RecallState { log: RecallLog; persistence: RecallPersistence; notice: string | null }

/** What the browser kept, read back fail-closed: unreadable ratings start fresh and say so, never guessed. */
function openRecall(store: RecallStore, known: ReadonlySet<string>): RecallState {
  const loaded = store.load()
  if (!loaded.ok) return { log: newRecallLog(), persistence: 'visit-only', notice: null }
  const restored = restoreRecallLog(loaded.raw, known)
  if (!restored.ok) return { log: newRecallLog(), persistence: 'device', notice: 'Self-check ratings saved earlier in this browser could not be read, so the self-check starts fresh.' }
  return { log: restored.log, persistence: 'device', notice: null }
}

function Failure({ message, onBack }: { message: string; onBack?: () => void }) {
  return (
    <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1px solid ${TONE.gate}`, color: TONE.gate, fontSize: 13, lineHeight: 1.5 }}>
      {message}
      {onBack && <button type="button" onClick={onBack} className="as-focus as-hover as-fade" style={{ ...subtleButton, alignSelf: 'flex-start' }}>← All body systems</button>}
    </div>
  )
}

export function SystemPhysiologyExplorer({ systemId, onSystem, onSimulate, recallStore, today = deviceToday, onSessionChange }: SystemPhysiologyExplorerProps) {
  const catalog = defaultPhysiologyCatalog()
  const index = useMemo(() => planSystemIndex(catalog), [catalog])
  const plan = useMemo(() => (systemId === null ? null : planSystemPhysiology(systemId, catalog)), [systemId, catalog])
  const labels = useMemo(() => new Map(catalog.systems.map((system) => [system.id, system.label] as const)), [catalog])

  const known = useMemo(() => new Set(catalog.mechanisms.map((mechanism) => mechanism.id)), [catalog])
  const store = useMemo(() => recallStore ?? browserRecallStore(PHYSIOLOGY_RECALL_KEY), [recallStore])
  const [recall, setRecall] = useState(() => openRecall(store, known))
  const latest = useRef(recall.log)
  const [day, setDay] = useState(today)
  /** The open self-check: its system and the mechanisms it goes through, fixed when it starts. */
  const [session, setSession] = useState<{ systemId: BodySystemId; itemIds: readonly string[]; day: number } | null>(null)

  // The button a person pressed disappears when the list turns into a card (or back), so focus would fall to the
  // page. Moving between systems from here sends it to the new card's title, and back to the row just left; a
  // system opened from outside (a structure picked in 3D) leaves focus where the person put it.
  // Closing a self-check returns focus to its start button, or to the card title when nothing is left to start.
  const focusTarget = useRef<readonly string[]>([])
  const go = (id: BodySystemId | null) => {
    focusTarget.current = id === null ? (systemId === null ? [] : [systemRowId(systemId)]) : [`system-card-${id}`]
    setSession(null)
    onSystem(id)
  }
  const sessionOpen = session !== null && session.systemId === systemId
  useEffect(() => {
    const targets = focusTarget.current
    focusTarget.current = []
    for (const target of targets) {
      const element = document.getElementById(target)
      if (element) { element.focus(); break }
    }
  }, [systemId, sessionOpen])
  useEffect(() => { onSessionChange?.(sessionOpen) }, [sessionOpen, onSessionChange])
  useEffect(() => () => onSessionChange?.(false), [onSessionChange])
  // A system opened from elsewhere (a structure picked in 3D) ends a self-check left open on another system, so
  // returning to it starts from its current plan rather than resuming items already rated today.
  useEffect(() => { setSession((open) => (open && open.systemId !== systemId ? null : open)) }, [systemId])

  const dueBySystem = useMemo(() => {
    const counts = new Map<BodySystemId, number>()
    if (!index.ok || day === null) return counts
    for (const row of index.rows) {
      const deck = planRecallDeck(recall.log, row.mechanismIds, day)
      if (deck.ok && deck.due.length > 0) counts.set(row.id, deck.due.length)
    }
    return counts
  }, [index, recall.log, day])

  if (!index.ok) return <Failure message="Body-system physiology could not be assembled, so none is shown rather than an incomplete list." />
  if (plan === null) return <SystemIndex rows={index.rows} onOpen={go} due={dueBySystem} />
  if (!plan.ok) return <Failure message="This body system is not in the atlas." onBack={() => go(null)} />

  const view = plan.view
  const deckIds = view.mechanisms.map((mechanism) => mechanism.id)
  const deck: RecallDeckPlan = day === null ? { ok: false, reason: 'bad_day' } : planRecallDeck(recall.log, deckIds, day)

  const rate = (itemId: string, recalled: boolean): RateOutcome => {
    if (!session) return 'refused'
    const result = recordRecall(latest.current, known, { itemId, recalled, day: session.day })
    if (!result.ok) return 'refused'
    latest.current = result.log
    const saved = store.save(serializeRecallLog(result.log))
    setRecall((prev) => ({ ...prev, log: result.log, persistence: saved.ok ? 'device' : 'visit-only' }))
    return saved.ok ? 'kept' : 'visit-only'
  }
  const start = () => {
    const now = today()
    setDay(now)
    if (now === null) return
    const fresh = planRecallDeck(latest.current, deckIds, now)
    if (!fresh.ok || fresh.queue.length === 0) return
    setSession({ systemId: view.id, itemIds: fresh.queue, day: now })
  }
  const close = () => {
    focusTarget.current = [selfCheckStartId(view.id), `system-card-${view.id}`]
    setDay(today())
    setSession(null)
  }

  if (sessionOpen) {
    const live = planRecallDeck(recall.log, deckIds, session.day)
    const nextReview = live.ok && live.queue.length === 0 && live.nextDueDay !== null ? relativeDay(live.nextDueDay - session.day) : null
    const byId = new Map(view.mechanisms.map((mechanism) => [mechanism.id, mechanism] as const))
    return (
      <SelfCheck
        key={`${session.systemId}-${session.day}`}
        systemId={view.id}
        systemLabel={view.label}
        items={session.itemIds.flatMap((id) => byId.get(id) ?? [])}
        labels={labels}
        onRate={rate}
        onClose={close}
        nextReview={nextReview}
      />
    )
  }

  return (
    <SystemCard
      view={view}
      simulations={simulationsFor(view.id)}
      labels={labels}
      onBack={() => go(null)}
      onSystem={go}
      onSimulate={onSimulate}
      selfCheck={{ plan: deck, day, persistence: recall.persistence, notice: recall.notice, onStart: start }}
    />
  )
}

export default SystemPhysiologyExplorer
