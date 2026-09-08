import type { ComponentProps } from 'react'
import BreathAtlasCoreLab from './BreathAtlasCoreLab'
import BreathAtlasEvidencePanel from './BreathAtlasEvidencePanel'

type Props = ComponentProps<typeof BreathAtlasCoreLab>

/**
 * Canonical Breath Atlas surface: preserve the source-aware core unchanged and
 * append the claim-level Academic Accuracy Gate in the same user-facing mode.
 */
export function BreathAtlasLab(props: Props) {
  return (
    <div className="space-y-4">
      <BreathAtlasCoreLab {...props} />
      <BreathAtlasEvidencePanel />
    </div>
  )
}

export default BreathAtlasLab
