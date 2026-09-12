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

const browserExecutionRules = [
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML\s*=/],
  ['eval', /\beval\s*\(/],
  ['Function constructor', /\bnew\s+Function\s*\(/],
  ['javascript URL', /(?:href|src)\s*=\s*["'`]\s*javascript:/i],
  ['document.write', /\bdocument\.write\s*\(/],
  ['innerHTML assignment', /\.innerHTML\s*=/],
  ['outerHTML assignment', /\.outerHTML\s*=/],
  ['insertAdjacentHTML', /\.insertAdjacentHTML\s*\(/],
]

test('security baseline: application source avoids high-risk browser execution and HTML injection sinks', async () => {
  const files = (await Promise.all(sourceRoots.map((dir) => walk(join(root, dir))))).flat()
  assert.ok(files.length > 0, 'security scan found no application source files')

  const violations = []
  for (const file of files) {
    const text = await readFile(file, 'utf8')
    for (const [label, pattern] of browserExecutionRules) {
      if (pattern.test(text)) violations.push(`${relative(root, file)}: ${label}`)
    }
  }

  assert.deepEqual(violations, [], `High-risk execution/HTML sinks found:\n${violations.join('\n')}`)
})

test('security baseline: PR validation remains least-privilege for repository contents', async () => {
  const workflow = await readFile(join(root, '.github/workflows/validate-pr.yml'), 'utf8')
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read\b/)
  assert.doesNotMatch(workflow, /permissions:\s*write-all\b/)
  assert.doesNotMatch(workflow, /contents:\s*write\b/)
})

test('security baseline: production dependencies avoid floating aliases and are represented in npm lockfile', async () => {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
  const dependencies = Object.entries(pkg.dependencies ?? {})

  const floating = dependencies.filter(([, version]) => {
    const value = String(version).trim().toLowerCase()
    return value === '' || value === '*' || value === 'latest' || value === 'next'
  })
  assert.deepEqual(floating, [], `Floating production dependency declarations: ${floating.map(([name]) => name).join(', ')}`)

  const lockRootDependencies = lock.packages?.['']?.dependencies ?? {}
  const missingRoot = dependencies.filter(([name]) => !(name in lockRootDependencies)).map(([name]) => name)
  assert.deepEqual(missingRoot, [], `Production dependencies missing from lockfile root: ${missingRoot.join(', ')}`)

  const incompleteResolved = dependencies
    .map(([name]) => ({ name, entry: lock.packages?.[`node_modules/${name}`] }))
    .filter(({ entry }) => !entry || !entry.version || !entry.resolved || !entry.integrity)
    .map(({ name }) => name)
  assert.deepEqual(incompleteResolved, [], `Production dependencies missing resolved lock metadata: ${incompleteResolved.join(', ')}`)
})
