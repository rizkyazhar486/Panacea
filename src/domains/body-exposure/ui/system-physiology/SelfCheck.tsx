// Self-check on the Physiology stage: explain a sourced mechanism from memory, reveal what its sources say, then
// rate your own recall. Presentational: the session's mechanisms, the rating handler and what the browser can keep
// are handed in by SystemPhysiologyExplorer; the schedule is the learning domain's (prometheus-learning/recall).
// Nothing is graded and nothing new is claimed — the answer shown is the mechanism's own sourced text.

import { useEffect, useRef, useState } from 'react'
import type { RecallDeckPlan } from '../../../prometheus-learning/index.ts'
import type { BodySystemId } from '../../data/bodySystems'
import type { PhysiologyMechanism } from '../../engine/system-physiology/physiologySources'
import { Note } from '../atlas-stage/StagePieces'
import { TONE, eyebrow, paragraph, primaryButton, subtleButton } from '../atlas-stage/stageTokens'
import { MechanismBody } from './MechanismBody'

/** What became of one rating: kept in this browser, kept only for this visit, or refused by the schedule. */
export type RateOutcome = 'kept' | 'visit-only' | 'refused'
/** Where ratings live: this browser's storage, or nowhere beyond this visit when the browser refuses storage. */
export type RecallPersistence = 'device' | 'visit-only'

export const LEITNER_NOTE = 'You rate yourself; a miss comes back tomorrow and each recall waits longer — 1, 2, 4, 8, then 16 days (a simple Leitner schedule). Not a graded test or a certificate of competence.'

export function relativeDay(days: number): string {
  if (days <= 0) return 'today'
  return days === 1 ? 'tomorrow' : `in ${days} days`
}

/** The one line a system card shows about its self-check. */
export function selfCheckStatus(plan: RecallDeckPlan, day: number | null): string {
  if (!plan.ok || day === null) return 'Self-check is unavailable: this device did not give a usable date.'
  if (plan.studied === 0) return `Recall each of the ${plan.total} sourced mechanism${plan.total === 1 ? '' : 's'} from memory, then check it against its sources.`
  const parts = [`Studied ${plan.studied} of ${plan.total}`]
  if (plan.due.length > 0) parts.push(`${plan.due.length} due today`)
  if (plan.queue.length === 0 && plan.nextDueDay !== null) parts.push(`next review ${relativeDay(plan.nextDueDay - day)}`)
  return parts.join(' · ')
}

/** The start button's label, or null when nothing is due and everything has been studied. */
export function selfCheckAction(plan: RecallDeckPlan): string | null {
  if (!plan.ok || plan.queue.length === 0) return null
  return `${plan.studied === 0 ? 'Start' : 'Continue'} self-check · ${plan.queue.length}`
}

export function persistenceLine(persistence: RecallPersistence): string {
  return persistence === 'device'
    ? 'Your ratings stay in this browser only.'
    : 'This browser cannot keep your ratings, so they last only until you leave this page.'
}

/** What a finished session reports: recalls among the ratings that were recorded, and what was not recorded or kept. */
export function selfCheckSummary(results: readonly { recalled: boolean; outcome: RateOutcome }[]) {
  const recorded = results.filter((result) => result.outcome !== 'refused')
  return {
    recalled: recorded.filter((result) => result.recalled).length,
    recorded: recorded.length,
    refused: results.length - recorded.length,
    visitOnly: recorded.some((result) => result.outcome === 'visit-only'),
  }
}

export interface SelfCheckProps {
  systemId: BodySystemId
  systemLabel: string
  /** The session's mechanisms in order, fixed when the session starts. */
  items: readonly PhysiologyMechanism[]
  labels: ReadonlyMap<BodySystemId, string>
  onRate: (itemId: string, recalled: boolean) => RateOutcome
  onClose: () => void
  /** When the next review falls, from the live plan; shown with the summary. */
  nextReview: string | null
}

export function SelfCheck({ systemId, systemLabel, items, labels, onRate, onClose, nextReview }: SelfCheckProps) {
  const [position, setPosition] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<readonly { recalled: boolean; outcome: RateOutcome }[]>([])
  const rated = useRef(new Set<string>())
  const focusRef = useRef<HTMLHeadingElement>(null)

  // Each step replaces the control just pressed, so focus goes to the new step's heading instead of the page.
  useEffect(() => { focusRef.current?.focus() }, [position, revealed])

  const item = items[position]
  const rate = (recalled: boolean) => {
    if (!item || rated.current.has(item.id)) return
    rated.current.add(item.id)
    // Recorded once, here in the event — never inside a state updater, which React may run twice (StrictMode) and
    // which must not update the explorer while this component renders.
    const outcome = onRate(item.id, recalled)
    setResults((prev) => [...prev, { recalled, outcome }])
    setRevealed(false)
    setPosition((prev) => prev + 1)
  }

  const back = <button type="button" onClick={onClose} className="as-focus as-hover as-fade" style={{ ...subtleButton, alignSelf: 'flex-start' }}>← {systemLabel}</button>
  const headingStyle = { margin: 0, fontSize: 18, lineHeight: 1.25, fontWeight: 800, color: TONE.text, outline: 'none' } as const

  if (!item) {
    const { recalled, recorded, refused, visitOnly } = selfCheckSummary(results)
    return (
      <section aria-labelledby={`self-check-done-${systemId}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {back}
        <div style={{ ...eyebrow, color: TONE.liveText }}>Self-check · done</div>
        <h4 id={`self-check-done-${systemId}`} ref={focusRef} tabIndex={-1} style={headingStyle}>
          You recalled {recalled} of {recorded}.
        </h4>
        {nextReview && <p style={{ ...paragraph, margin: 0 }}>Next review: {nextReview}.</p>}
        {refused > 0 && <Note color={TONE.gate}>{refused} rating{refused === 1 ? ' was' : 's were'} not recorded: this device’s date is earlier than a previous rating, or the item was already rated today.</Note>}
        {visitOnly && <Note color={TONE.sim}>{persistenceLine('visit-only')}</Note>}
        <Note color={TONE.ref}>{LEITNER_NOTE}</Note>
        <button type="button" onClick={onClose} className="as-focus as-fade" style={primaryButton}>Back to {systemLabel}</button>
      </section>
    )
  }

  const promptId = `self-check-item-${systemId}`
  const answerId = `self-check-answer-${systemId}`
  const askId = `self-check-ask-${systemId}`
  return (
    <section aria-labelledby={promptId} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {back}
      <div style={{ ...eyebrow, color: TONE.liveText }}>Self-check · {position + 1} of {items.length}</div>
      <h4 id={promptId} ref={revealed ? undefined : focusRef} tabIndex={-1} style={headingStyle}>
        {item.label}
        {item.organ && <span style={{ color: TONE.dim, fontWeight: 600 }}> · {item.organ}</span>}
      </h4>
      {!revealed ? (
        <>
          <p style={{ ...paragraph, margin: 0 }}>Explain how it works from memory, in your own words. Then compare with what its sources say.</p>
          <button type="button" onClick={() => setRevealed(true)} className="as-focus as-fade" style={primaryButton}>Show what the sources say</button>
        </>
      ) : (
        <>
          <section aria-labelledby={answerId} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 12, border: `1px solid ${TONE.line}`, background: TONE.raised }}>
            <h5 id={answerId} ref={focusRef} tabIndex={-1} style={{ ...eyebrow, margin: 0, color: TONE.ref, outline: 'none' }}>What the sources say</h5>
            <MechanismBody mechanism={item} labels={labels} current={systemId} />
          </section>
          <div role="group" aria-labelledby={askId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div id={askId} style={{ fontSize: 14, fontWeight: 800, color: TONE.text }}>Did you recall it?</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              <button type="button" onClick={() => rate(true)} className="as-focus as-fade" style={primaryButton}>Yes, I recalled it</button>
              <button type="button" onClick={() => rate(false)} className="as-focus as-hover as-fade" style={{ ...subtleButton, width: '100%' }}>Not yet</button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
