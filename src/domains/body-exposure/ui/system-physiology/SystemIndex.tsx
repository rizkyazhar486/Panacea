// The list of the atlas's body systems on the Physiology stage. Presentational: every row, count and handler is
// handed in by SystemPhysiologyExplorer.

import type { BodySystemId } from '../../data/bodySystems'
import type { SystemIndexRow } from '../../engine/system-physiology/systemPhysiology'
import { TONE, eyebrow, paragraph } from '../atlas-stage/stageTokens'

export const systemRowId = (id: BodySystemId) => `system-row-${id}`

/** One line under the label: how much of the system's physiology carries a source here. */
export function evidenceLine(row: Pick<SystemIndexRow, 'fidelity' | 'mechanismCount' | 'gapCount'>): string {
  if (row.fidelity === 'contextual') return 'Context only · no physiology model of its own yet'
  const sourced = row.mechanismCount === 0 ? 'No sourced mechanism yet' : `${row.mechanismCount} sourced mechanism${row.mechanismCount === 1 ? '' : 's'}`
  return row.gapCount === 0 ? sourced : `${sourced} · ${row.gapCount} organ${row.gapCount === 1 ? '' : 's'} not yet sourced`
}

export function SystemIndex({ rows, onOpen }: { rows: readonly SystemIndexRow[]; onOpen: (id: BodySystemId) => void }) {
  return (
    <section aria-labelledby="system-index-title" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <h4 id="system-index-title" style={{ ...eyebrow, margin: 0, color: TONE.ref }}>Body systems · {rows.length}</h4>
        <p style={paragraph}>What each organ system does, how it works with the others, and the sources behind it.</p>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((row) => (
          <li key={row.id}>
            <button
              id={systemRowId(row.id)}
              type="button"
              onClick={() => onOpen(row.id)}
              className="as-focus as-hover as-fade"
              style={{
                width: '100%', minHeight: 56, padding: '9px 12px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 10,
                border: `1px solid ${TONE.line}`, borderRadius: 14, background: TONE.raised, color: TONE.text, textAlign: 'left', cursor: 'pointer',
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 800 }}>{row.label}</span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 12, lineHeight: 1.4, color: TONE.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.role}</span>
                <span style={{ display: 'block', marginTop: 3, fontSize: 11, fontWeight: 700, color: row.sourced ? TONE.liveText : TONE.faint }}>{evidenceLine(row)}</span>
              </span>
              <span aria-hidden style={{ color: TONE.faint, fontSize: 18, lineHeight: 1 }}>›</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
