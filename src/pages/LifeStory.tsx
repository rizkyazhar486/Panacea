import { StoryReflectionStudio } from '../components/StoryReflectionStudio'
import { LifeStory as LifeStoryBase } from './LifeStoryBase'

export function LifeStory() {
  return (
    <div className="space-y-5 pb-8">
      <StoryReflectionStudio />
      <LifeStoryBase />
    </div>
  )
}

export default LifeStory
