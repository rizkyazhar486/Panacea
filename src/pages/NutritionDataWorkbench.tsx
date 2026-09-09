import { NutritionDataExplainabilityCard } from '../components/NutritionDataExplainabilityCard'
import { NutritionEvidenceLineageCard } from '../components/NutritionEvidenceLineageCard'
import { NutritionJournalCalculatorCard } from '../components/NutritionJournalCalculatorCard'
import { NutritionRecordedReportCard } from '../components/NutritionRecordedReportCard'
import { useStore } from '../lib/store'
import { NutritionDataControls } from './NutritionDataControls'

/**
 * One lazy Nutrition Data tab, composed from bounded local-first controls.
 * Evidence lineage and the explainability trace are static; calculator/report
 * outputs remain recorded-journal arithmetic only. None adds a second route,
 * background sync, direct upstream request, or dietary recommendation engine.
 */
export function NutritionDataWorkbench() {
  const { state } = useStore()

  return (
    <div className="space-y-4">
      <NutritionDataControls />
      <NutritionDataExplainabilityCard />
      <NutritionEvidenceLineageCard />
      <NutritionJournalCalculatorCard entries={state.foods} />
      <NutritionRecordedReportCard entries={state.foods} />
    </div>
  )
}

export default NutritionDataWorkbench
