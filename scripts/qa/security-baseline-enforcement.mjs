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

const rules = [
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML\s*=/],
  ['eval', /\beval\s*\(/],
  ['Function constructor', /\bnew\s+Function\s*\(/],
  ['javascript URL', /(?:href|src)\s*=\s*["'`]\s*javascript:/i],
  ['document.write', /\bdocument\.write\s*\(/],
  ['innerHTML assignment', /\.innerHTML\s*=/],
  ['outerHTML assignment', /\.outerHTML\s*=/],
  ['insertAdjacentHTML', /\.insertAdjacentHTML\s*\(/],
]

function isNonInjectionCleanup(rule, line) {
  if (rule !== 'innerHTML assignment' && rule !== 'outerHTML assignment') return false
  return /\.(?:innerHTML|outerHTML)\s*=\s*(?:''|"")\s*;?\s*$/.test(line.trim())
}

const files = (await Promise.all(sourceRoots.map((dir) => walk(join(root, dir))))).flat()
assert.ok(files.length > 0, 'security baseline found no application source files')

const findings = []
for (const file of files) {
  const text = await readFile(file, 'utf8')
  text.split(/\r?\n/).forEach((line, index) => {
    for (const [rule, pattern] of rules) {
      if (!pattern.test(line) || isNonInjectionCleanup(rule, line)) continue
      findings.push({ file: relative(root, file), line: index + 1, rule })
    }
  })
}

const reviewedDebt = findings.filter((item) => item.file === 'src/pages/Feed.tsx' && item.rule === 'document.write')
const unreviewed = findings.filter((item) => !(item.file === 'src/pages/Feed.tsx' && item.rule === 'document.write'))
assert.deepEqual(unreviewed, [], `Unreviewed browser execution/HTML injection sinks:\n${unreviewed.map((item) => `${item.file}:${item.line} ${item.rule}`).join('\n')}`)
assert.equal(reviewedDebt.length, 1, `Expected exactly one reviewed Feed document.write debt; found ${reviewedDebt.length}`)

const feed = await readFile(join(root, 'src/pages/Feed.tsx'), 'utf8')
assert.match(feed, /const esc = \(s: string\) => s\.replace\(\/\[<>&\]\//, 'Reviewed Feed print debt must preserve HTML escaping')
assert.match(feed, /\$\{esc\(new Date\(\)\.toLocaleString\('en-US'\)\)\}/, 'Reviewed Feed print debt must escape generated date text')
assert.match(feed, /rows\.map\(\(r\) => `<tr><td>\$\{esc\(r\[0\]\)\}<\/td><td>\$\{esc\(r\[1\]\)\}<\/td><\/tr>`\)\.join\(''\)/, 'Reviewed Feed print debt must escape every report row cell')

const workflow = await readFile(join(root, '.github/workflows/validate-pr.yml'), 'utf8')
assert.match(workflow, /permissions:\s*\n\s*contents:\s*read\b/)
assert.doesNotMatch(workflow, /permissions:\s*write-all\b/)
assert.doesNotMatch(workflow, /contents:\s*write\b/)

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
const dependencies = Object.entries(pkg.dependencies ?? {})
const floating = dependencies.filter(([, version]) => ['', '*', 'latest', 'next'].includes(String(version).trim().toLowerCase()))
assert.deepEqual(floating, [], `Floating production dependency declarations: ${floating.map(([name]) => name).join(', ')}`)
const lockRootDependencies = lock.packages?.['']?.dependencies ?? {}
assert.deepEqual(dependencies.filter(([name]) => !(name in lockRootDependencies)).map(([name]) => name), [], 'Production dependency missing from lockfile root')
assert.deepEqual(
  dependencies
    .map(([name]) => ({ name, entry: lock.packages?.[`node_modules/${name}`] }))
    .filter(({ entry }) => !entry || !entry.version || !entry.resolved || !entry.integrity)
    .map(({ name }) => name),
  [],
  'Production dependency missing resolved version/integrity metadata',
)

console.log('security baseline enforcement:', {
  scannedFiles: files.length,
  unreviewedSinks: unreviewed.length,
  reviewedDebt: reviewedDebt.map((item) => `${item.file}:${item.line} ${item.rule}`),
  productionDependencies: dependencies.length,
  ciPermissions: 'contents:read',
})
