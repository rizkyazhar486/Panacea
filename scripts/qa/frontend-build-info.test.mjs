import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { frontendBuildInfo, readFrontendGitState, writeFrontendBuildInfo } from '../write-frontend-build-info.mjs'

const state = { commitSha: 'a'.repeat(40), treeSha: 'b'.repeat(40), dirty: false }

test('build metadata contains only deterministic source identifiers and cleanliness', () => {
  assert.deepEqual(frontendBuildInfo(state, state.commitSha.toUpperCase()), { schema: 'panacea-frontend-build/v1', ...state })
  assert.deepEqual(frontendBuildInfo({ ...state, dirty: true }), { schema: 'panacea-frontend-build/v1', ...state, dirty: true })
})

test('unknown source is explicit and cannot substitute a configured commit', () => {
  assert.deepEqual(frontendBuildInfo(null), { schema: 'panacea-frontend-build/v1', commitSha: null, treeSha: null, dirty: null })
  assert.throws(() => frontendBuildInfo(null, state.commitSha), /Cannot confirm/)
})

test('release revision mismatch and dirty release checkout fail before publication', () => {
  assert.throws(() => frontendBuildInfo(state, 'c'.repeat(40)), /Checkout differs/)
  assert.throws(() => frontendBuildInfo({ ...state, dirty: true }, state.commitSha), /uncommitted/)
})

test('malformed identifiers and incomplete source states are rejected', () => {
  for (const expected of ['main', 'a'.repeat(7), '../main']) assert.throws(() => frontendBuildInfo(state, expected), /full Git SHA/)
  for (const broken of [{ ...state, commitSha: 'main' }, { ...state, treeSha: null }, { ...state, dirty: null }]) {
    assert.throws(() => frontendBuildInfo(broken), /Invalid Git source/)
  }
})

test('real Git fixture records exact checkout, ignored output, edits and untracked inputs', () => {
  const root = mkdtempSync(join(tmpdir(), 'panacea-frontend-source-'))
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  try {
    git('init', '-q')
    writeFileSync(join(root, '.gitignore'), '/public/build-info.json\n/public/build-info.json.tmp\n')
    writeFileSync(join(root, 'input.txt'), 'original\n')
    git('add', '.')
    git('-c', 'user.name=Build fixture', '-c', 'user.email=build@localhost.test', 'commit', '-qm', 'fixture')
    const commitSha = git('rev-parse', 'HEAD'), treeSha = git('rev-parse', 'HEAD^{tree}')
    const info = writeFrontendBuildInfo(root, commitSha)
    assert.deepEqual(info, { schema: 'panacea-frontend-build/v1', commitSha, treeSha, dirty: false })
    assert.deepEqual(JSON.parse(readFileSync(join(root, 'public/build-info.json'), 'utf8')), info)
    assert.equal(readFrontendGitState(root).dirty, false, 'generated manifest must not dirty its own source')
    assert.equal(readFrontendGitState(join(root, 'public')), null, 'a parent repository is not evidence for a different source root')
    writeFileSync(join(root, 'input.txt'), 'changed\n')
    assert.equal(readFrontendGitState(root).dirty, true)
    assert.throws(() => writeFrontendBuildInfo(root, commitSha), /uncommitted/)
    assert.deepEqual(JSON.parse(readFileSync(join(root, 'public/build-info.json'), 'utf8')), info, 'failed release must not overwrite earlier output')
    writeFileSync(join(root, 'input.txt'), 'original\n')
    writeFileSync(join(root, 'unexpected.txt'), 'untracked input\n')
    assert.equal(readFrontendGitState(root).dirty, true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('Vercel link and environment output leave a committed release source clean', () => {
  const root = mkdtempSync(join(tmpdir(), 'panacea-vercel-source-'))
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  try {
    git('init', '-q')
    const target = join(root, '.gitignore')
    writeFileSync(target, readFileSync(new URL('../../.gitignore', import.meta.url)))
    git('add', '.')
    git('-c', 'user.name=Build fixture', '-c', 'user.email=build@localhost.test', 'commit', '-qm', 'fixture')
    const commit = git('rev-parse', 'HEAD')
    // Vercel CLI 59.11.7 addToGitIgnore checks exact lines, not Git's pattern
    // semantics. Link adds .vercel; its environment download adds .env.local.
    for (const name of ['.vercel', '.env.local']) {
      const before = readFileSync(target, 'utf8')
      if (!before.split('\n').includes(name)) writeFileSync(target, `${before}${name}\n`)
    }
    mkdirSync(join(root, '.vercel'))
    writeFileSync(join(root, '.vercel/project.json'), '{}\n')
    writeFileSync(join(root, '.env.local'), 'FIXTURE_ONLY=synthetic\n')
    assert.equal(git('check-ignore', '.vercel/project.json', '.env.local'), '.vercel/project.json\n.env.local')
    assert.equal(readFrontendGitState(root).dirty, false, 'CLI setup must not change committed ignore rules')
    assert.equal(writeFrontendBuildInfo(root, commit).commitSha, commit, 'the clean configured release must still pass')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
