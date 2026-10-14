import { execFileSync } from 'node:child_process'
import { mkdirSync, realpathSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SHA = /^[0-9a-f]{40}$/

export function frontendBuildInfo(state, expectedCommit = '') {
  const expected = expectedCommit.trim().toLowerCase()
  if (expected && !SHA.test(expected)) throw new Error('Configured build revision is not a full Git SHA')
  if (!state) {
    if (expected) throw new Error('Cannot confirm configured build revision from Git')
    return { schema: 'panacea-frontend-build/v1', commitSha: null, treeSha: null, dirty: null }
  }
  if (!SHA.test(state.commitSha) || !SHA.test(state.treeSha) || typeof state.dirty !== 'boolean') {
    throw new Error('Invalid Git source state')
  }
  if (expected && expected !== state.commitSha) throw new Error('Checkout differs from configured build revision')
  if (expected && state.dirty) throw new Error('Configured release checkout contains uncommitted changes')
  return { schema: 'panacea-frontend-build/v1', commitSha: state.commitSha, treeSha: state.treeSha, dirty: state.dirty }
}

export function readFrontendGitState(root) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', timeout: 5_000, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  try {
    if (realpathSync(git('rev-parse', '--show-toplevel')) !== realpathSync(root)) return null
    return { commitSha: git('rev-parse', 'HEAD'), treeSha: git('rev-parse', 'HEAD^{tree}'), dirty: git('status', '--porcelain', '--untracked-files=normal') !== '' }
  } catch {
    return null
  }
}

export function writeFrontendBuildInfo(root, expectedCommit = '') {
  const info = frontendBuildInfo(readFrontendGitState(root), expectedCommit)
  const directory = resolve(root, 'public')
  mkdirSync(directory, { recursive: true })
  const target = resolve(directory, 'build-info.json')
  writeFileSync(`${target}.tmp`, `${JSON.stringify(info, null, 2)}\n`)
  renameSync(`${target}.tmp`, target)
  return info
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const info = writeFrontendBuildInfo(root, process.env.GITHUB_SHA ?? '')
  console.log(`Frontend build revision: ${info.commitSha ?? 'unknown'}; dirty=${info.dirty ?? 'unknown'}`)
}
