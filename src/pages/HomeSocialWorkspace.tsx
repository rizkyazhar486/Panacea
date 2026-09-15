import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { HomeCommandDeck } from '../components/HomeCommandDeck'
import { ForYouWorkspace } from './ForYouWorkspace'
import '../styles/home-health-spectrum.css'
import '../styles/home-mobile-shell-repair-v45.css'

export function HomeSocialWorkspace() {
  const [params] = useSearchParams()
  const legacyForYou = params.has('t')
  const activeSpace = params.get('space')
  const showForYou = activeSpace === 'for-you' || legacyForYou

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-4 pb-10">
      <PanaceaZoneNav />
      {showForYou ? <ForYouWorkspace /> : <HomeCommandDeck />}
    </div>
  )
}

export default HomeSocialWorkspace
