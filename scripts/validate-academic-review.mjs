import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const REVIEW_STATUSES = new Set([
  'not-applicable-no-material-claim',
  'source-checked',
  'human-reviewed',
])
const AI_USE_VALUES = new Set(['none-recorded', 'ai-assisted', 'ai-generated'])

export function validateAcademicReview(progress, domains) {
  const errors = []
  const domainList = [...(domains ?? [])].sort((a, b) => b.id.length - a.id.length)

  for (const [id, entry] of Object.entries(progress?.items ?? {})) {
    if (entry?.status !== 'done') continue

    const domain = domainList.find((item) => id.startsWith(`ff-${item.id}-`))
    if (!domain) {
      errors.push(`${id}: cannot resolve domain for academic review gate`)
      continue
    }

    const review = entry.academicReview
    if (!review || typeof review !== 'object' || Array.isArray(review)) {
      errors.push(`${id}: done feature requires academicReview metadata`)
      continue
    }

    if (!REVIEW_STATUSES.has(review.status)) {
      errors.push(`${id}: invalid academicReview.status ${review.status}`)
    }
    if (!AI_USE_VALUES.has(review.aiUse)) {
      errors.push(`${id}: academicReview.aiUse must disclose none-recorded, ai-assisted, or ai-generated`)
    }
    if (typeof review.note !== 'string' || review.note.trim().length === 0) {
      errors.push(`${id}: academicReview.note is required`)
    }

    const sourceBasis = Array.isArray(review.sourceBasis) ? review.sourceBasis : []
    if ((review.status === 'source-checked' || review.status === 'human-reviewed') && sourceBasis.length === 0) {
      errors.push(`${id}: ${review.status} requires non-empty sourceBasis`)
    }
    if (sourceBasis.some((value) => typeof value !== 'string' || value.trim().length === 0)) {
      errors.push(`${id}: academicReview.sourceBasis must contain non-empty strings`)
    }

    const humanReview = review.humanReview
    if (!humanReview || typeof humanReview !== 'object' || Array.isArray(humanReview)) {
      errors.push(`${id}: academicReview.humanReview metadata is required`)
    } else if (review.status === 'human-reviewed') {
      if (humanReview.status !== 'completed') errors.push(`${id}: human-reviewed requires humanReview.status=completed`)
      if (typeof humanReview.reviewer !== 'string' || humanReview.reviewer.trim().length === 0) {
        errors.push(`${id}: human-reviewed requires named reviewer`)
      }
      if (typeof humanReview.credentials !== 'string' || humanReview.credentials.trim().length === 0) {
        errors.push(`${id}: human-reviewed requires reviewer credentials`)
      }
      if (typeof humanReview.reviewedAt !== 'string' || !Number.isFinite(Date.parse(humanReview.reviewedAt))) {
        errors.push(`${id}: human-reviewed requires valid reviewedAt timestamp`)
      }
    } else if (humanReview.status !== 'not-recorded') {
      errors.push(`${id}: non-human-reviewed feature must use humanReview.status=not-recorded`)
    }

    if ((domain.risk === 'high' || domain.risk === 'clinical') && review.status !== 'human-reviewed') {
      errors.push(`${id}: ${domain.risk}-risk done feature requires qualified human academic/clinical review`)
    }
  }

  return errors
}

async function runCli() {
  const [progressRaw, domainsRaw] = await Promise.all([
    readFile(new URL('../data/feature-factory/progress.json', import.meta.url), 'utf8'),
    readFile(new URL('../data/feature-factory/domains.json', import.meta.url), 'utf8'),
  ])
  const progress = JSON.parse(progressRaw)
  const domainConfig = JSON.parse(domainsRaw)
  const errors = validateAcademicReview(progress, domainConfig.domains)

  if (errors.length > 0) {
    console.error(`Academic Accuracy Gate failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`)
    errors.forEach((error) => console.error(`- ${error}`))
    process.exitCode = 1
    return
  }

  const done = Object.values(progress.items ?? {}).filter((entry) => entry?.status === 'done').length
  console.log(`Academic Accuracy Gate passed for ${done} completed Feature Factory candidate${done === 1 ? '' : 's'}.`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await runCli()
}
