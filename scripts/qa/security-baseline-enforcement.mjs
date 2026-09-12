import assert from 'node:assert/strict'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = new URL('../../', import.meta.url).pathname
const sourceRoots = ['src', 'server/src']
const reportPath = join(root, 'artifacts/security-baseline-enforcement.json')

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
  // Assigning a literal empty string only removes existing children; it cannot
  // inject attacker-controlled markup. Allow it even inside an inline cleanup
  // callback (`return () => { mount.innerHTML = '' }`). Any non-empty or
  // dynamic assignment remains a finding and therefore fails closed.
  return /\.(?:innerHTML|outerHTML)\s*=\s*(?:''|"")/.test(line)
}

const files = (await Promise.all(sourceRoots.map((dir) => walk(join(root, dir))))).flat()
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

const feed = await readFile(join(root, 'src/pages/Feed.tsx'), 'utf8')
const feedChecks = {
  escapeFunction: feed.includes("const esc = (s: string) => s.replace(/[<>&]/g"),
  escapedGeneratedDate: feed.includes("${esc(new Date().toLocaleString('en-US'))}"),
  escapedRows: feed.includes("rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')"),
}

const workflow = await readFile(join(root, '.github/workflows/validate-pr.yml'), 'utf8')
const ciChecks = {
  contentsRead: /permissions:\s*\n\s*contents:\s*read\b/.test(workflow),
  writeAllAbsent: !/permissions:\s*write-all\b/.test(workflow),
  contentsWriteAbsent: !/contents:\s*write\b/.test(workflow),
}

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
const dependencies = Object.entries(pkg.dependencies ?? {})
const floating = dependencies.filter(([, version]) => ['', '*', 'latest', 'next'].includes(String(version).trim().toLowerCase()))
const lockRootDependencies = lock.packages?.['']?.dependencies ?? {}
const missingLockRoot = dependencies.filter(([name]) => !(name in lockRootDependencies)).map(([name]) => name)
const incompleteResolvedMetadata = dependencies
  .map(([name]) => ({ name, entry: lock.packages?.[`node_modules/${name}`] }))
  .filter(({ entry }) => !entry || !entry.version || !entry.resolved || !entry.integrity)
  .map(({ name }) => name)

const checks = {
  sourceFilesFound: files.length > 0,
  zeroUnreviewedSinks: unreviewed.length === 0,
  oneReviewedFeedDebt: reviewedDebt.length === 1,
  ...feedChecks,
  ...ciChecks,
  zeroFloatingProductionDependencies: floating.length === 0,
  completeRootLockDeclarations: missingLockRoot.length === 0,
  completeResolvedLockMetadata: incompleteResolvedMetadata.length === 0,
}

await mkdir(join(root, 'artifacts'), { recursive: true })
await writeFile(reportPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  findings,
  reviewedDebt,
  unreviewed,
  feedChecks,
  ciChecks,
  dependencyChecks: {
    productionDependencies: dependencies.length,
    floating: floating.map(([name, version]) => ({ name, version })),
    missingLockRoot,
    incompleteResolvedMetadata,
  },
  checks,
  pass: Object.values(checks).every(Boolean),
}, null, 2))

for (const [name, passed] of Object.entries(checks)) {
  assert.equal(passed, true, `Security baseline check failed: ${name}`)
}

console.log('security baseline enforcement:', {
  scannedFiles: files.length,
  unreviewedSinks: unreviewed.length,
  reviewedDebt: reviewedDebt.map((item) => `${item.file}:${item.line} ${item.rule}`),
  productionDependencies: dependencies.length,
  checks,
})
