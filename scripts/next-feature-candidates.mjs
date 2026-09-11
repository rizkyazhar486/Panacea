import process from 'node:process'
import { assertFeatureFactory, generateFeatureCandidates, rankCandidates } from './lib/feature-factory.mjs'

function argValue(name) {
  const prefix = `${name}=`
  const direct = process.argv.find((arg) => arg.startsWith(prefix))
  if (direct) return direct.slice(prefix.length)
  const index = process.argv.indexOf(name)
  if (index >= 0) return process.argv[index + 1]
  return null
}

function asPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

const limit = asPositiveInt(argValue('--limit'), 12)
const domain = argValue('--domain')
const includeReview = process.argv.includes('--include-review')
const asJson = process.argv.includes('--json')

const factory = await generateFeatureCandidates()
const errors = assertFeatureFactory(factory)
if (errors.length > 0) {
  console.error(`Feature Factory invalid (${errors.length} issue${errors.length === 1 ? '' : 's'}):`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

const active = factory.candidates.filter((candidate) =>
  !['done', 'skipped', 'in_progress'].includes(candidate.status) &&
  (!domain || candidate.domain === domain),
)

const safe = rankCandidates(active.filter((candidate) => candidate.autoEligible))
const review = rankCandidates(active.filter((candidate) => !candidate.autoEligible))
const selected = includeReview
  ? [...safe, ...review].slice(0, limit)
  : safe.slice(0, limit)

if (asJson) {
  console.log(JSON.stringify({
    target: factory.target,
    counts: {
      total: factory.candidates.length,
      done: factory.candidates.filter((candidate) => candidate.status === 'done').length,
      inProgress: factory.candidates.filter((candidate) => candidate.status === 'in_progress').length,
      blocked: factory.candidates.filter((candidate) => candidate.status === 'blocked').length,
      remaining: active.length,
      autoEligible: safe.length,
      reviewRequired: review.length,
    },
    selected,
  }, null, 2))
  process.exit(0)
}

const done = factory.candidates.filter((candidate) => candidate.status === 'done').length
console.log(`Feature Factory: ${done}/${factory.target} done; ${active.length} remaining; ${safe.length} auto-eligible.`)

if (selected.length === 0) {
  console.log('No auto-eligible candidate is available. Re-run with --include-review to inspect gated work.')
  process.exit(0)
}

selected.forEach((candidate, index) => {
  console.log(`${index + 1}. [P${candidate.metrics.priority}] ${candidate.id}`)
  console.log(`   ${candidate.title}`)
  console.log(`   risk=${candidate.risk} mode=${candidate.mode} complexity=${candidate.metrics.complexity} perf=${candidate.metrics.performance}`)
  console.log(`   sources=${candidate.sourceIds.join(', ')}`)
  if (candidate.blockers.length > 0) console.log(`   blockers=${candidate.blockers.join(' | ')}`)
})
