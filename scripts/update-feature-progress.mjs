import process from 'node:process'
import { generateFeatureCandidates, loadProgress, writeProgress } from './lib/feature-factory.mjs'

const id = process.argv[2]
const status = process.argv[3]
const allowed = new Set(['candidate', 'in_progress', 'done', 'blocked', 'skipped'])

if (!id || !status || !allowed.has(status)) {
  console.error('Usage: node scripts/update-feature-progress.mjs <candidate-id> <candidate|in_progress|done|blocked|skipped> [--commit=SHA] [--paths=a,b] [--note=text]')
  process.exit(2)
}

function argValue(name) {
  const prefix = `${name}=`
  const arg = process.argv.find((value) => value.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : null
}

const factory = await generateFeatureCandidates()
if (!factory.candidates.some((candidate) => candidate.id === id)) {
  console.error(`Unknown candidate: ${id}`)
  process.exit(2)
}

const progress = await loadProgress()
const previous = progress.items?.[id] ?? {}
const paths = argValue('--paths')
progress.items ??= {}
progress.items[id] = {
  ...previous,
  status,
  commit: argValue('--commit') ?? previous.commit ?? null,
  paths: paths ? paths.split(',').map((value) => value.trim()).filter(Boolean) : (previous.paths ?? []),
  note: argValue('--note') ?? previous.note ?? '',
  updatedAt: new Date().toISOString(),
}

await writeProgress(progress)
console.log(`${id} -> ${status}`)
