import { IconActivity, IconBook, IconEMR, IconHeart, IconSparkle, IconStethoscope, IconUser } from '../icons'
import type { SuperPageId } from '../../lib/superPages'
import FeatureMapOrbit from './FeatureMapOrbit'

const ASSISTED_MAP_ICONS = {
  human: IconActivity,
  health: IconHeart,
  clinical: IconStethoscope,
  explore: IconBook,
  simulate: IconSparkle,
  records: IconEMR,
  'for-you': IconUser,
} satisfies Record<SuperPageId, typeof IconHeart>

export default function AssistedMapDrawer() {
  return <FeatureMapOrbit icons={ASSISTED_MAP_ICONS} />
}
