import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const range = '3e3f9471..59f9a87f'
let logOut = ''
try {
  logOut = execFileSync('git', ['log', '--format=%H|%s', range], { encoding: 'utf8' })
} catch (e) {
  logOut = ''
}

const entries = []
const lines = logOut.split('\n').filter(Boolean)
for (const line of lines) {
  const [sha, ...subjectParts] = line.split('|')
  const subject = subjectParts.join('|')
  
  let filesTouched = []
  try {
    const fOut = execFileSync('git', ['show', '--name-only', '--format=', sha], { encoding: 'utf8' })
    filesTouched = fOut.split('\n').map(s => s.trim()).filter(Boolean)
  } catch {}

  let linesAdded = 0
  try {
    const statOut = execFileSync('git', ['show', '--numstat', '--format=', sha], { encoding: 'utf8' })
    for (const statLine of statOut.split('\n')) {
      const parts = statLine.split('\t')
      if (parts[0] !== '-' && !isNaN(Number(parts[0]))) {
        linesAdded += Number(parts[0])
      }
    }
  } catch {}

  let classification = 'legit-candidate'
  const subLower = subject.toLowerCase()
  if (subLower.includes('quantum') || subLower.includes('biophoton') || subLower.includes('singularity') || subLower.includes('valuation')) {
    classification = 'reject-claims'
  } else if (filesTouched.length > 25 || linesAdded > 800) {
    classification = 'needs-rework'
  } else if (subLower.includes('noise') || filesTouched.every(f => f.includes('dist/') || f.includes('build/'))) {
    classification = 'reject-noise'
  }

  entries.push({
    sha,
    subject,
    filesTouchedCount: filesTouched.length,
    linesAdded,
    hasTests: filesTouched.some(f => f.includes('.test.') || f.includes('spec')),
    claimHits: classification === 'reject-claims' ? ['banned-term-matched'] : [],
    classification
  })
}

const triageReport = {
  rangeEvaluated: range,
  totalCommits: entries.length,
  timestampUtc: new Date().toISOString(),
  commits: entries
}

writeFileSync('governance/RELAND_TRIAGE.json', JSON.stringify(triageReport, null, 2) + '\n')
console.log(`Successfully generated RELAND_TRIAGE.json covering ${entries.length} reverted commits.`)
