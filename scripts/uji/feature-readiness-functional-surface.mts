import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FEATURE_READINESS, functionalFeatures } from '../../src/lib/featureReadiness.ts'

const root = process.cwd()
const main = readFileSync(join(root, 'src/main.tsx'), 'utf8')

const expected = [
  { id: 'health-profile', route: '/health-data', file: 'src/pages/HealthProfile.tsx', markers: ['api.getHealthProfile', 'parseHealthFile', 'mergeVitals'] },
  { id: 'readiness', route: '/readiness', file: 'src/pages/Readiness.tsx', markers: ['buildRecoveryRecordedChecklist', 'averagePrevious', 'localStorage.setItem'] },
  { id: 'clinical-calculators', route: '/clinical-calculators', file: 'src/pages/ClinicalCalculators.tsx', markers: ['ApgarCalc', 'GcsCalc', 'ALAT_DI_HALAMAN'] },
  { id: 'calculator-hub', route: '/calculator-hub', file: 'src/pages/CalculatorHub.tsx', markers: ['ALAT_DI_HALAMAN', 'tautanAlat', 'useMemo'] },
  { id: 'self-assessment-toolkit', route: '/self-assessment-toolkit', file: 'src/pages/SelfAssessmentToolkit.tsx', markers: ['TelomereQuiz', 'InflammationScore', 'useState'] },
  { id: 'sports-scores', route: '/sports-scores', file: 'src/pages/SportsScores.tsx', markers: ['api.getSportsScores', 'saveSportsFavorites', 'backendEnabled'] },
  { id: 'osce-ukmppd', route: '/osce-ukmppd', file: 'src/pages/OsceUkmppd.tsx', markers: ['hitungKasus', 'sinonimUntuk', 'RIWAYAT_OSCE'] },
] as const

for (const item of expected) {
  const entry = FEATURE_READINESS.find((feature) => feature.id === item.id)
  assert(entry, `Missing readiness entry: ${item.id}`)
  assert.equal(entry.status, 'FUNCTIONAL-BUT-INCOMPLETE')
  assert.equal(entry.productionReady, false)
  assert.equal(entry.route, item.route)
  assert(
    main.includes(`path="${item.route}"`),
    `Functional readiness route is not mounted in src/main.tsx: ${item.route}`,
  )

  const source = readFileSync(join(root, item.file), 'utf8')
  for (const marker of item.markers) {
    assert(
      source.includes(marker),
      `${item.id} is missing implementation marker ${marker} in ${item.file}`,
    )
  }
}

const functional = functionalFeatures()
assert(
  functional.length >= 21,
  `Expected at least 21 functional features after audit, found ${functional.length}`,
)

const ids = new Set(FEATURE_READINESS.map((feature) => feature.id))
assert.equal(ids.size, FEATURE_READINESS.length, 'Feature readiness IDs must remain unique')

console.log(`Functional readiness audit passed: ${functional.length} functional features`)
