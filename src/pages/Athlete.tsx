import { DailyTrainingModes } from '../components/DailyTrainingModes'
import { Athlete as AthleteCore } from './AthleteCore'

export function Athlete() {
  return (
    <>
      <AthleteCore />
      <div className="mx-auto -mt-16 max-w-2xl px-0 pb-24 sm:-mt-12">
        <DailyTrainingModes />
      </div>
    </>
  )
}

export default Athlete
