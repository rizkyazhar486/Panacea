// One body system's physiology on the Physiology stage. Presentational: the view is planned by the engine
// (engine/system-physiology), and every handler is handed in. Interpretation and sources sit behind disclosures;
// the first screen says what the system does, what it works with, and what can be simulated.

import type { ReactNode } from 'react'
import type { BodySystemId } from '../../data/bodySystems'
import type { SystemPhysiologyView } from '../../engine/system-physiology/systemPhysiology'
import type { StageSimulation } from '../../engine/system-physiology/systemSimulations'
import type { PhysiologyCitation, PhysiologyMechanism } from '../../engine/system-physiology/physiologySources'
import { Note, Tag } from '../atlas-stage/StagePieces'
import { TONE, TOUCH, eyebrow, paragraph, primaryButton, subtleButton } from '../atlas-stage/stageTokens'

const FIDELITY_LABEL: Record<SystemPhysiologyView['fidelity'], string> = {
  direct: 'Direct physiology',
  compound: 'Spans two domains',
  contextual: 'Context only',
}

const disclosure = { border: `1px solid ${TONE.line}`, borderRadius: 12, background: TONE.raised } as const
const summaryRow = { minHeight: TOUCH, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: TONE.text, fontSize: 13, fontWeight: 700 } as const

function Section({ title, color = TONE.ref, children }: { title: string; color?: string; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h5 style={{ ...eyebrow, margin: 0, color }}>{title}</h5>
      {children}
    </section>
  )
}

export function citationLabel(citation: PhysiologyCitation): string {
  return citation.kind === 'pubmed' ? `PubMed ${citation.id}` : `NCBI Bookshelf ${citation.id}`
}

function Mechanism({ mechanism, labels, current }: { mechanism: PhysiologyMechanism; labels: ReadonlyMap<BodySystemId, string>; current: BodySystemId }) {
  const sharedWith = mechanism.systems.filter((id) => id !== current).map((id) => labels.get(id) ?? id)
  return (
    <details style={disclosure}>
      <summary className="as-focus" style={summaryRow}>
        <span style={{ flex: 1, minWidth: 0 }}>
          {mechanism.label}
          {mechanism.organ && <span style={{ color: TONE.dim, fontWeight: 600 }}> · {mechanism.organ}</span>}
        </span>
        <span style={{ flex: 'none', color: TONE.liveText, fontSize: 11, fontWeight: 800 }}>{mechanism.citations.length} source{mechanism.citations.length === 1 ? '' : 's'}</span>
      </summary>
      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sharedWith.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: TONE.ref }}>Shared with {sharedWith.join(', ')}</div>}
        {mechanism.summary.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, lineHeight: 1.5, color: TONE.dim }}>
            {mechanism.summary.map((line) => <li key={line}>{line}</li>)}
          </ul>
        )}
        <ul aria-label={`Sources for ${mechanism.label}`} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mechanism.citations.map((citation) => (
            <li key={`${citation.kind}-${citation.id}`} style={{ fontSize: 12, lineHeight: 1.45, color: TONE.dim }}>
              <a href={citation.url} target="_blank" rel="noopener noreferrer" className="as-focus" style={{ color: TONE.ref, fontWeight: 800 }}>{citationLabel(citation)}</a>
              <span> — {citation.note}</span>
            </li>
          ))}
        </ul>
        <Note color={TONE.ref}>{mechanism.boundary}</Note>
      </div>
    </details>
  )
}

export interface SystemCardProps {
  view: SystemPhysiologyView
  simulations: readonly StageSimulation[]
  labels: ReadonlyMap<BodySystemId, string>
  onBack: () => void
  onSystem: (id: BodySystemId) => void
  onSimulate: (simulation: StageSimulation) => void
}

export function SystemCard({ view, simulations, labels, onBack, onSystem, onSimulate }: SystemCardProps) {
  const titleId = `system-card-${view.id}`
  return (
    <article aria-labelledby={titleId} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button type="button" onClick={onBack} className="as-focus as-hover as-fade" style={{ ...subtleButton, alignSelf: 'flex-start' }}>← All body systems</button>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h4 id={titleId} tabIndex={-1} style={{ margin: 0, fontSize: 20, lineHeight: 1.2, fontWeight: 800, color: TONE.text, outline: 'none' }}>{view.label}</h4>
        <div><Tag color={view.fidelity === 'contextual' ? TONE.faint : TONE.ref}>{FIDELITY_LABEL[view.fidelity]}</Tag></div>
      </header>

      {view.fidelity === 'contextual' && <Note color={TONE.ref}>{view.bridgeNote}</Note>}

      {view.domains.map((domain) => (
        <Section key={domain.id} title={view.domains.length > 1 || view.fidelity === 'contextual' ? domain.label : 'What it does'}>
          <p style={{ ...paragraph, margin: 0, color: TONE.text }}>{domain.role}</p>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(0, 0, 0, 0.35)', border: `1px solid ${TONE.line}` }}>
            <div style={{ ...eyebrow, color: TONE.faint }}>Teaching relation</div>
            <div style={{ marginTop: 4, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, lineHeight: 1.5, color: TONE.text, overflowWrap: 'anywhere' }}>{domain.equation}</div>
            <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: TONE.faint }}>{domain.equationNote}</div>
          </div>
        </Section>
      ))}

      {simulations.length > 0 && (
        <Section title="Simulate on this stage" color={TONE.sim}>
          {simulations.map((simulation, index) => (
            <button
              key={simulation.id}
              type="button"
              onClick={() => onSimulate(simulation)}
              className="as-focus as-hover as-fade"
              style={index === 0 ? primaryButton : { ...subtleButton, width: '100%' }}
            >
              {simulation.label}
            </button>
          ))}
        </Section>
      )}

      {view.couplings.length > 0 && (
        <Section title="Works with">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {view.couplings.map((coupling) => (
              <button
                key={coupling.id}
                type="button"
                onClick={() => onSystem(coupling.id)}
                className="as-focus as-hover as-fade"
                style={{ minHeight: 36, padding: '0 12px', borderRadius: 999, border: `1px solid ${TONE.line}`, background: TONE.raised, color: TONE.text, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                {coupling.label}
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title={`Sourced mechanisms · ${view.mechanisms.length}`} color={TONE.liveText}>
        {view.mechanisms.length === 0 ? (
          <Note color={TONE.faint}>No sourced mechanism for this system is in the atlas yet. It stays a visible gap rather than being filled in.</Note>
        ) : (
          view.mechanisms.map((mechanism) => <Mechanism key={mechanism.id} mechanism={mechanism} labels={labels} current={view.id} />)
        )}
      </Section>

      {view.organGaps.length > 0 && (
        <Section title={`Not yet sourced · ${view.organGaps.length}`} color={TONE.faint}>
          {view.organGaps.map((gap) => (
            <details key={gap.id} style={{ ...disclosure, borderStyle: 'dashed' }}>
              <summary className="as-focus" style={summaryRow}>
                <span style={{ flex: 1, minWidth: 0 }}>{gap.subject}</span>
                {gap.partial && <span style={{ flex: 'none', color: TONE.dim, fontSize: 11, fontWeight: 800 }}>partly sourced above</span>}
              </summary>
              <div style={{ padding: '0 12px 12px' }}><Note color={TONE.faint}>{gap.boundary}</Note></div>
            </details>
          ))}
        </Section>
      )}

      {view.loops.length > 0 && (
        <details style={disclosure}>
          <summary className="as-focus" style={summaryRow}>Coupling loops · {view.loops.length}</summary>
          <ul style={{ listStyle: 'none', margin: 0, padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {view.loops.map((loop) => (
              <li key={loop.id}>
                <div style={{ fontSize: 13, fontWeight: 800, color: TONE.text }}>{loop.label}</div>
                <div style={{ marginTop: 2, fontSize: 12, fontWeight: 700, color: TONE.ref }}>{loop.path.join(' → ')}</div>
                <div style={{ marginTop: 2, fontSize: 12, lineHeight: 1.45, color: TONE.dim }}>{loop.teachingPoint}</div>
              </li>
            ))}
          </ul>
        </details>
      )}

      <Note color={TONE.ref}>
        <b>Reference physiology:</b> generic, from the cited sources. Not a measurement of a person, a diagnosis or treatment guidance.
      </Note>
    </article>
  )
}
