import { assertFeatureFactory, generateFeatureCandidates } from './lib/feature-factory.mjs'

const factory = await generateFeatureCandidates()
const errors = assertFeatureFactory(factory)

if (errors.length > 0) {
  console.error(`Feature Factory validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exitCode = 1
} else {
  const autoEligible = factory.candidates.filter((candidate) => candidate.autoEligible).length
  const clinical = factory.candidates.filter((candidate) => candidate.risk === 'clinical').length
  console.log(`Feature Factory validation passed (${factory.candidates.length} candidates; ${autoEligible} auto-eligible; ${clinical} clinical-gated).`)
}
