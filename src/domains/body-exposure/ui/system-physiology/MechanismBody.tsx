// What a sourced mechanism's sources say — its statements, the sources themselves and its boundary — rendered the
// same way on a system card and in the self-check. Presentational only.

import type { BodySystemId } from '../../data/bodySystems'
import type { PhysiologyCitation, PhysiologyMechanism } from '../../engine/system-physiology/physiologySources'
import { Note } from '../atlas-stage/StagePieces'
import { TONE } from '../atlas-stage/stageTokens'

export function citationLabel(citation: PhysiologyCitation): string {
  return citation.kind === 'pubmed' ? `PubMed ${citation.id}` : `NCBI Bookshelf ${citation.id}`
}

/** What a mechanism's sources say: its statements, the sources themselves and its boundary. Shared with the self-check. */
export function MechanismBody({ mechanism, labels, current }: { mechanism: PhysiologyMechanism; labels: ReadonlyMap<BodySystemId, string>; current: BodySystemId }) {
  const sharedWith = mechanism.systems.filter((id) => id !== current).map((id) => labels.get(id) ?? id)
  return (
    <>
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
    </>
  )
}
