import { NutritionEvidenceLineageCard } from '../components/NutritionEvidenceLineageCard'
import { NutritionJournalCalculatorCard } from '../components/NutritionJournalCalculatorCard'
import { useStore } from '../lib/store'
import { NutritionDataControls } from './NutritionDataControls'

/**
 * One lazy Nutrition Data tab, composed from bounded local-first controls.
 * Evidence lineage is registry-backed and static; the calculator remains
 * recorded-journal arithmetic only. Neither adds a second route, background
 * sync, direct upstream request, or dietary recommendation engine.
 */
export function NutritionDataWorkbench() {
  const { state } = useStore()

  return (
    <div className="space-y-4">
      <NutritionDataControls />
      <NutritionEvidenceLineageCard />
      <NutritionJournalCalculatorCard entries={state.foods} />
    </div>
  )
}

export default NutritionDataWorkbench
