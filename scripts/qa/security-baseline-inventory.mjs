import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = new URL('../../', import.meta.url).pathname
const sourceRoots = ['src', 'server/src']
const outPath = join(root, 'artifacts/security-baseline-inventory.json')

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

const files = (await Promise.all(sourceRoots.map((dir) => walk(join(root, dir))))).flat()
const violations = []
for (const file of files) {
  const text = await readFile(file, 'utf8')
  for (const [rule, pattern] of rules) {
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (pattern.test(line)) violations.push({ file: relative(root, file), line: index + 1, rule })
    })
  }
}

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
const dependencies = Object.entries(pkg.dependencies ?? {})
const floatingDependencies = dependencies
  .filter(([, version]) => ['', '*', 'latest', 'next'].includes(String(version).trim().toLowerCase()))
  .map(([name, version]) => ({ name, version }))
const lockRootDependencies = lock.packages?.['']?.dependencies ?? {}
const missingLockRoot = dependencies.filter(([name]) => !(name in lockRootDependencies)).map(([name]) => name)
const incompleteResolvedMetadata = dependencies
  .map(([name]) => ({ name, entry: lock.packages?.[`node_modules/${name}`] }))
  .filter(({ entry }) => !entry || !entry.version || !entry.resolved || !entry.integrity)
  .map(({ name, entry }) => ({ name, hasEntry: Boolean(entry), version: entry?.version ?? null, resolved: Boolean(entry?.resolved), integrity: Boolean(entry?.integrity) }))

const workflow = await readFile(join(root, '.github/workflows/validate-pr.yml'), 'utf8')
const workflowPermissions = {
  contentsRead: /permissions:\s*\n\s*contents:\s*read\b/.test(workflow),
  writeAll: /permissions:\s*write-all\b/.test(workflow),
  contentsWrite: /contents:\s*write\b/.test(workflow),
}

const report = {
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  browserExecutionOrHtmlInjectionViolations: violations,
  dependencyLock: {
    productionDependencies: dependencies.length,
    floatingDependencies,
    missingLockRoot,
    incompleteResolvedMetadata,
  },
  validateWorkflowPermissions: workflowPermissions,
  enforcementReady:
    violations.length === 0 &&
    floatingDependencies.length === 0 &&
    missingLockRoot.length === 0 &&
    incompleteResolvedMetadata.length === 0 &&
    workflowPermissions.contentsRead &&
    !workflowPermissions.writeAll &&
    !workflowPermissions.contentsWrite,
}

await mkdir(join(root, 'artifacts'), { recursive: true })
await writeFile(outPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report))
