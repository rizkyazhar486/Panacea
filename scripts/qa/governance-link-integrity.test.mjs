import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Case-sensitive git-index link integrity test for governance documents.
 * Prevents macOS case-insensitive APFS paths (e.g. docs/ vs DOCS/) from causing
 * 404s on GitHub or Linux runners.
 */
test('docs/governance markdown relative links resolve to exact case-matching git index paths', () => {
  const tracked = new Set(
    execFileSync('git', ['ls-files'], { encoding: 'utf8' })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  )

  const govFiles = ['docs/governance/EXTERNAL_GATES.md', 'docs/governance/README.md', 'docs/governance/TASK_BOARD.md']
  const linkRe = /\[[^\]]+\]\(([^)#?\s]+)(?:#[^)]*)?\)/g

  for (const relFile of govFiles) {
    assert.ok(tracked.has(relFile), `Expected ${relFile} to be tracked in git index`)
    const content = fs.readFileSync(relFile, 'utf8')
    const baseDir = path.posix.dirname(relFile)
    let match
    while ((match = linkRe.exec(content)) !== null) {
      const target = match[1]
      if (/^(https?:|mailto:|conversation:|file:)/.test(target)) continue
      const resolved = path.posix.normalize(path.posix.join(baseDir, target))
      assert.ok(
        tracked.has(resolved),
        `Broken or case-mismatched relative link in ${relFile}: (${target}) -> "${resolved}" is not in git ls-files`
      )
    }
  }
})
