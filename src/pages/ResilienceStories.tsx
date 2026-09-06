import { ResilienceActionLab } from '../components/ResilienceActionLab'
import { ResilienceStories as ResilienceStoriesBase } from './ResilienceStoriesBase'

export function ResilienceStories() {
  return (
    <div className="space-y-5 pb-8">
      <ResilienceActionLab />
      <ResilienceStoriesBase />
    </div>
  )
}

export default ResilienceStories
