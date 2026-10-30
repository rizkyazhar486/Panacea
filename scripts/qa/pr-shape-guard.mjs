// scripts/qa/pr-shape-guard.mjs
// Penjaga ukuran PR dan bentuk komit (WP-2 Directive D-100): mencegah giant-drop dan komit bergaya directive tanpa ID TASK_BOARD.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export function loadShapePolicy(file = 'governance/PR_SHAPE_POLICY.json') {
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function isGeneratedPathExcluded(filePath, policy, repoRoot = '.') {
  const normalized = filePath.replace(/\\/g, '/')
  for (const entry of policy.generatedPaths || []) {
    if (normalized === entry.pathPrefix || normalized.startsWith(entry.pathPrefix)) {
      const genExists = Boolean(entry.generatorScript) && existsSync(join(repoRoot, entry.generatorScript))
      if (genExists) return true
    }
  }
  return false
}

export function evaluatePrShape({
  numstatEntries = [],
  commitMessages = [],
  prBody = '',
  policy = loadShapePolicy(),
  repoRoot = '.'
}) {
  let nonGeneratedFiles = 0
  let nonGeneratedLines = 0

  for (const item of numstatEntries) {
    if (!item || !item.file) continue
    if (isGeneratedPathExcluded(item.file, policy, repoRoot)) continue
    nonGeneratedFiles += 1
    const added = Number.isFinite(item.added) ? item.added : 0
    const deleted = Number.isFinite(item.deleted) ? item.deleted : 0
    nonGeneratedLines += added + deleted
  }

  const linesLimit = policy.maxChangedLines ?? 1500
  const filesLimit = policy.maxChangedFiles ?? 60
  const directiveRegex = /directive\s*\d{3}/i
  const taskIdRegex = new RegExp(policy.taskBoardIdPattern || '\\b(?:WP-\\d+|ENG-[A-Z0-9-]+|D-100)\\b')

  const directiveCommits = commitMessages.filter((msg) => directiveRegex.test(msg))
  const hasTaskBoardId = taskIdRegex.test(prBody || '')
  const unmarkedDirectiveCommits = directiveCommits.length > 0 && !hasTaskBoardId ? directiveCommits.length : 0

  const violations = []
  if (nonGeneratedLines > linesLimit) {
    violations.push({
      rule: 'non-generated-lines',
      value: nonGeneratedLines,
      limit: linesLimit,
      message: `pr-shape-guard: non-generated-lines ${nonGeneratedLines}/${linesLimit} (FAIL)`
    })
  }
  if (nonGeneratedFiles > filesLimit) {
    violations.push({
      rule: 'changed-files',
      value: nonGeneratedFiles,
      limit: filesLimit,
      message: `pr-shape-guard: changed-files ${nonGeneratedFiles}/${filesLimit} (FAIL)`
    })
  }
  if (unmarkedDirectiveCommits > 0) {
    violations.push({
      rule: 'untracked-directive-commits',
      value: unmarkedDirectiveCommits,
      limit: 0,
      message: `pr-shape-guard: untracked-directive-commits ${unmarkedDirectiveCommits}/0 (FAIL)`
    })
  }

  return {
    nonGeneratedLines,
    linesLimit,
    nonGeneratedFiles,
    filesLimit,
    unmarkedDirectiveCommits,
    violations
  }
}

export function collectGitRangeData(rangeSpec, repoRoot = '.') {
  const numstatOut = execFileSync('git', ['diff', '--numstat', rangeSpec], {
    cwd: repoRoot,
    encoding: 'utf8'
  })
  const numstatEntries = []
  for (const line of numstatOut.split('\n')) {
    if (!line.trim()) continue
    const parts = line.split('\t')
    if (parts.length < 3) continue
    const added = parts[0] === '-' ? 0 : Number(parts[0])
    const deleted = parts[1] === '-' ? 0 : Number(parts[1])
    const file = parts.slice(2).join('\t').trim()
    numstatEntries.push({ added, deleted, file })
  }

  const logOut = execFileSync('git', ['log', '--format=%s', rangeSpec], {
    cwd: repoRoot,
    encoding: 'utf8'
  })
  const commitMessages = logOut
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  return { numstatEntries, commitMessages }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rangeArg = process.argv[2] || process.env.PR_SHAPE_RANGE || 'origin/main...HEAD'
  const prBody = process.env.PR_BODY || ''
  const policy = loadShapePolicy()
  const { numstatEntries, commitMessages } = collectGitRangeData(rangeArg)
  const report = evaluatePrShape({ numstatEntries, commitMessages, prBody, policy })

  console.log(`pr-shape-guard: non-generated-lines ${report.nonGeneratedLines}/${report.linesLimit}`)
  console.log(`pr-shape-guard: changed-files ${report.nonGeneratedFiles}/${report.filesLimit}`)
  console.log(`pr-shape-guard: untracked-directive-commits ${report.unmarkedDirectiveCommits}/0`)

  for (const v of report.violations) {
    console.error(v.message)
  }
  process.exit(report.violations.length > 0 ? 1 : 0)
}
