// Skrip triase deterministik untuk 68 komit yang direvert berdasarkan isi diff dan claim-guard nyata (WP-3 D-101/D-102).
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { loadPolicy, scanText } from './claim-guard.mjs'

export const DEFAULT_RANGE = '3e3f9471..59f9a87f'

export function parsePatchAddedByFile(patchText) {
  // Ekstrak hanya baris yang ditambahkan (+) per berkas dari keluaran git show patch.
  const byFile = new Map()
  let currentFile = null
  for (const rawLine of patchText.split('\n')) {
    if (rawLine.startsWith('+++ b/')) {
      currentFile = rawLine.slice(6).trim()
      if (!byFile.has(currentFile)) byFile.set(currentFile, [])
      continue
    }
    if (rawLine.startsWith('+++ /dev/null')) {
      currentFile = null
      continue
    }
    if (currentFile && rawLine.startsWith('+') && !rawLine.startsWith('+++')) {
      byFile.get(currentFile).push(rawLine.slice(1))
    }
  }
  return byFile
}

export function classifyCommitDiff({ statText, filesTouched, linesAdded, patchText, testStatus }, policy = loadPolicy()) {
  if (typeof statText !== 'string' || !Array.isArray(filesTouched)) {
    throw new Error('reland-triage: invalid diff input (statText and filesTouched required)')
  }

  const addedByFile = parsePatchAddedByFile(patchText || '')
  const rawHits = []
  for (const [file, addedLines] of addedByFile.entries()) {
    const hits = scanText(addedLines.join('\n'), file, policy)
    for (const h of hits) {
      rawHits.push(`${h.file}:${h.term}`)
    }
  }
  const claimHits = Array.from(new Set(rawHits)).sort()

  const onlyBuildOrDist =
    filesTouched.length > 0 &&
    filesTouched.every(
      (f) =>
        f.startsWith('dist/') ||
        f.includes('/dist/') ||
        f.startsWith('build/') ||
        f.includes('/build/') ||
        f.endsWith('.log') ||
        f.endsWith('.tsbuildinfo')
    )

  let classification = 'legit-candidate'
  if (claimHits.length > 0) {
    classification = 'reject-claims'
  } else if (onlyBuildOrDist || filesTouched.length === 0) {
    classification = 'reject-noise'
  } else if (filesTouched.length > 25 || linesAdded > 800) {
    classification = 'needs-rework'
  }

  return { claimHits, classification }
}

// Tes milik komit TIDAK dijalankan di sini: berkas tes komit yang direvert tidak ada di tree saat ini, sehingga menjalankannya akan menguji
// berkas lain atau tidak menguji apa pun. Status jujur: 'not-run' bila komit menyentuh tes, 'no-tests-in-commit' bila tidak.
function testStatusOf(testFiles) {
  return testFiles.length > 0 ? 'not-run' : 'no-tests-in-commit'
}

export function evaluateRange(range = DEFAULT_RANGE, policy = loadPolicy()) {
  if (!range || typeof range !== 'string' || !range.includes('..')) {
    throw new Error(`reland-triage: invalid git range "${range}"`)
  }

  const logOut = execFileSync('git', ['log', '--format=%H|%s', range], { encoding: 'utf8' })
  const lines = logOut.split('\n').filter(Boolean)
  if (lines.length === 0) {
    throw new Error(`reland-triage: zero commits resolved for range "${range}"`)
  }

  const entries = []
  for (const line of lines) {
    const [sha, ...subjectParts] = line.split('|')
    const subject = subjectParts.join('|')

    const statText = execFileSync('git', ['show', '--stat', '--format=', sha], { encoding: 'utf8' })
    const nameOut = execFileSync('git', ['show', '--name-only', '--format=', sha], { encoding: 'utf8' })
    const filesTouched = nameOut.split('\n').map((s) => s.trim()).filter(Boolean)

    let linesAdded = 0
    let linesDeleted = 0
    const numStatOut = execFileSync('git', ['show', '--numstat', '--format=', sha], { encoding: 'utf8' })
    for (const statLine of numStatOut.split('\n')) {
      const parts = statLine.split('\t')
      if (parts[0] !== '-' && !Number.isNaN(Number(parts[0]))) linesAdded += Number(parts[0])
      if (parts[1] !== '-' && !Number.isNaN(Number(parts[1]))) linesDeleted += Number(parts[1])
    }

    const patchText = execFileSync('git', ['show', '--format=', '--unified=0', sha], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024
    })

    const testFiles = filesTouched.filter((f) => f.includes('.test.') || f.includes('.spec.'))
    const testStatus = testStatusOf(testFiles)

    const { claimHits, classification } = classifyCommitDiff(
      { statText, filesTouched, linesAdded, patchText, testStatus },
      policy
    )

    entries.push({
      sha,
      subject,
      filesTouchedCount: filesTouched.length,
      linesAdded,
      linesDeleted,
      hasTests: testFiles.length > 0,
      testStatus,
      claimHits,
      classification
    })
  }

  return {
    rangeEvaluated: range,
    totalCommits: entries.length,
    commits: entries
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const targetRange = process.argv[2] || DEFAULT_RANGE
  const report = evaluateRange(targetRange)
  writeFileSync('governance/RELAND_TRIAGE.json', JSON.stringify(report, null, 2) + '\n')
  console.log(`reland-triage: wrote deterministic governance/RELAND_TRIAGE.json (${report.totalCommits} commits)`)
}
