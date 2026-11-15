// Every body system's physiology on the Physiology stage: the list of systems, then one system's card. Loaded
// on demand (the catalog carries the text of every education graph, ~20 kB gzip), so the stage itself stays light.
//
// The plans come from the engine; this component only chooses which one to show. A catalog that cannot describe
// every system is shown as an error, never as a partial list that looks complete.

import { useEffect, useMemo, useRef } from 'react'
import type { BodySystemId } from '../../data/bodySystems'
import { defaultPhysiologyCatalog } from '../../engine/system-physiology/physiologyCatalog'
import { planSystemIndex, planSystemPhysiology } from '../../engine/system-physiology/systemPhysiology'
import { simulationsFor, type StageSimulation } from '../../engine/system-physiology/systemSimulations'
import { TONE, subtleButton } from '../atlas-stage/stageTokens'
import { SystemCard } from './SystemCard'
import { SystemIndex, systemRowId } from './SystemIndex'

export interface SystemPhysiologyExplorerProps {
  /** The open system, or null for the list of all systems. */
  systemId: BodySystemId | null
  onSystem: (id: BodySystemId | null) => void
  onSimulate: (simulation: StageSimulation) => void
}

function Failure({ message, onBack }: { message: string; onBack?: () => void }) {
  return (
    <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1px solid ${TONE.gate}`, color: TONE.gate, fontSize: 13, lineHeight: 1.5 }}>
      {message}
      {onBack && <button type="button" onClick={onBack} className="as-focus as-hover as-fade" style={{ ...subtleButton, alignSelf: 'flex-start' }}>← All body systems</button>}
    </div>
  )
}

export function SystemPhysiologyExplorer({ systemId, onSystem, onSimulate }: SystemPhysiologyExplorerProps) {
  const catalog = defaultPhysiologyCatalog()
  const index = useMemo(() => planSystemIndex(catalog), [catalog])
  const plan = useMemo(() => (systemId === null ? null : planSystemPhysiology(systemId, catalog)), [systemId, catalog])
  const labels = useMemo(() => new Map(catalog.systems.map((system) => [system.id, system.label] as const)), [catalog])

  // The button a person pressed disappears when the list turns into a card (or back), so focus would fall to the
  // page. Moving between systems from here sends it to the new card's title, and back to the row just left; a
  // system opened from outside (a structure picked in 3D) leaves focus where the person put it.
  const focusTarget = useRef<string | null>(null)
  const go = (id: BodySystemId | null) => {
    focusTarget.current = id === null ? (systemId === null ? null : systemRowId(systemId)) : `system-card-${id}`
    onSystem(id)
  }
  useEffect(() => {
    const target = focusTarget.current
    focusTarget.current = null
    if (target) document.getElementById(target)?.focus()
  }, [systemId])

  if (!index.ok) return <Failure message="Body-system physiology could not be assembled, so none is shown rather than an incomplete list." />
  if (plan === null) return <SystemIndex rows={index.rows} onOpen={go} />
  if (!plan.ok) return <Failure message="This body system is not in the atlas." onBack={() => go(null)} />
  return (
    <SystemCard
      view={plan.view}
      simulations={simulationsFor(plan.view.id)}
      labels={labels}
      onBack={() => go(null)}
      onSystem={go}
      onSimulate={onSimulate}
    />
  )
}

export default SystemPhysiologyExplorer
