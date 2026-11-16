import { useLongitudinalState } from '../../../lib/useLongitudinalState'
import { sinyalPerSistem } from '../../../lib/sinyalPribadiSistem'
import { labelMetrik } from '../../../lib/perubahanLongitudinal'
import { buildSystemBoard } from '../engine/systemBoard'
import type { BodySystemId } from '../data/bodySystems'
import { SystemBoardView } from './SystemBoardView'

export function YourSystemsBoard({ selected, onSelect }: { selected: BodySystemId | null; onSelect: (id: BodySystemId) => void }) {
  const { state, labels } = useLongitudinalState()
  if (!state) {
    return <p role="status" className="px-1 text-[12px] text-neutral-500">Loading your systems…</p>
  }
  return <SystemBoardView rows={buildSystemBoard(sinyalPerSistem(state), new Date())} metricLabel={(m) => labelMetrik(m, labels)} selected={selected} onSelect={onSelect} />
}

export default YourSystemsBoard
