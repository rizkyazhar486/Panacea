import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = new URL('../../', import.meta.url).pathname
const sourceRoots = ['src', 'server/src']

async function walk(dir) {
  const out = []
  try {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) out.push(...await walk(path))
      else if (/\.(?:js|jsx|mjs|cjs|ts|tsx)$/.test(entry.name)) out.push(path)
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  return out
}

test('security baseline: application source avoids high-risk browser execution sinks', async () => {
  const files = (await Promise.all(sourceRoots.map((dir) => walk(join(root, dir))))).flat()
  const violations = []
  const rules = [
    ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML\s*=/],
    ['eval', /\beval\s*\(/],
    ['Function constructor', /\bnew\s+Function\s*\(/],
    ['javascript URL', /(?:href|src)\s*=\s*["'`]javascript:/i],
    ['document.write', /\bdocument\.write\s*\(/],
  ]
  for (const file of files) {
    const text = await readFile(file, 'utf8')
    for (const [label, pattern] of rules) {
      if (pattern.test(text)) violations.push(`${relative(root, file)}: ${label}`)
    }
  }
  assert.deepEqual(violations, [], `High-risk execution sinks found:\n${violations.join('\n')}`)
})

test('security baseline: CI validation uses least-privilege read-only contents permission', async () => {
  const workflow = await readFile(join(root, '.github/workflows/validate-pr.yml'), 'utf8')
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read\b/)
  assert.doesNotMatch(workflow, /permissions:\s*write-all\b/)
})

test('security baseline: production dependencies do not use wildcard or latest versions', async () => {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  const unsafe = Object.entries(pkg.dependencies ?? {}).filter(([, version]) =>
    version === '*' || version === 'latest' || String(version).trim() === '',
  )
  assert.deepEqual(unsafe, [], `Unpinned production dependency ranges: ${unsafe.map(([name]) => name).join(', ')}`)
})
