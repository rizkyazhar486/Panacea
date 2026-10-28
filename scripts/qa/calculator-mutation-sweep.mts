// ENG-C6-01: per-engine mutation sweep. For every numeric literal in a registry engine, replace it with value+1 (an off-by-one
// coefficient) and run the independent-reference suites that invoke that engine. A mutant is KILLED only when a suite fails with an
// AssertionError; any other failure (syntax error, thrown TypeError, timeout) is reported as CRASHED and never counted as proof.
// SURVIVORS are the evidence: a literal the reference suites cannot see. Some survivors are equivalent mutants (an index, a rounding
// digit, a default never reached); this tool lists them, it does not decide which are harmless.
// Usage (Node 26+): node --import=./scripts/uji/typescript-resolver.mjs scripts/qa/calculator-mutation-sweep.mts
//   ENGINES=a,b  limit to engines;  OUT=file.json  write the full report;  MAX_PER_ENGINE=n  cap literals per engine.
import { spawn } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { executableCode, exportedCalculators, invokes } from '../uji/calculator-reference-coverage.mts'
import { typeScriptRunnerArgs } from '../uji/node-runtime-flags.mjs'

const ROOT = new URL('../../', import.meta.url)
const ENGINE_DIR = new URL('src/domains/clinical-calculators/engine/', ROOT)
const UJI_DIR = new URL('scripts/uji/', ROOT)
const registry = JSON.parse(readFileSync(new URL('governance/CALCULATOR_REVIEW_REGISTRY.json', ROOT), 'utf8')) as { entries: Array<{ id: string }> }
const only = (process.env.ENGINES ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const maxPer = Number(process.env.MAX_PER_ENGINE ?? Infinity)

/** Same length as `src`, with comment and string/template contents replaced by spaces, so literal offsets stay valid. */
export function maskNonCode(src: string): string {
  const out = src.split('')
  const blank = (a: number, b: number) => { for (let k = a; k < b && k < out.length; k++) if (out[k] !== '\n') out[k] = ' ' }
  let i = 0
  while (i < src.length) {
    const c = src[i]!, n = src[i + 1]
    if (c === '/' && n === '/') { const e = src.indexOf('\n', i); const end = e < 0 ? src.length : e; blank(i, end); i = end; continue }
    if (c === '/' && n === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? src.length : e + 2; blank(i, end); i = end; continue }
    if (c === "'" || c === '"') { let j = i + 1; while (j < src.length && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1; blank(i, j + 1); i = j + 1; continue }
    if (c === '`') { let j = i + 1; while (j < src.length && src[j] !== '`') j += src[j] === '\\' ? 2 : 1; blank(i, j + 1); i = j + 1; continue }
    i++
  }
  return out.join('')
}

export interface Literal { start: number; text: string; line: number }
/** Decimal numeric literals in code (not identifiers, not hex, not part of a longer token). */
export function numericLiterals(src: string): Literal[] {
  const mask = maskNonCode(src)
  const found: Literal[] = []
  for (const m of mask.matchAll(/(?<![A-Za-z0-9_.$])\d+(?:\.\d+)?(?![A-Za-z0-9_])/g)) {
    const start = m.index ?? 0
    if (/^0[xXbBoO]/.test(mask.slice(start, start + 2))) continue
    found.push({ start, text: m[0], line: src.slice(0, start).split('\n').length })
  }
  return found
}
export const mutate = (text: string) => String(Number(text) + 1)

const runSuite = (file: string): Promise<{ code: number | null; stderr: string }> => new Promise((resolve) => {
  const child = spawn(process.execPath, [...typeScriptRunnerArgs(process.versions.node), `--import=${new URL('typescript-resolver.mjs', UJI_DIR).href}`, new URL(file, UJI_DIR).pathname], { cwd: ROOT.pathname, stdio: ['ignore', 'ignore', 'pipe'] })
  let stderr = ''
  child.stderr.on('data', (b: Buffer) => { stderr += b.toString() })
  const timer = setTimeout(() => child.kill('SIGKILL'), 60_000)
  child.on('close', (code) => { clearTimeout(timer); resolve({ code, stderr }) })
})

const suites = readdirSync(UJI_DIR).filter((f) => /^calculator-independent-reference.*\.mts$/.test(f))
const suiteCode = new Map(suites.map((f) => [f, executableCode(readFileSync(new URL(f, UJI_DIR), 'utf8'))]))
// A suite that exercises every engine without calling its functions (it pins exported range tables by importing the package index)
// declares `sweep:all-engines` in its first 25 lines; it then counts for every engine. Without this the sweep would only run suites
// that call an engine and would miss mutants such a suite really kills.
const allEngineSuites = suites.filter((f) => /sweep:all-engines/.test(readFileSync(new URL(f, UJI_DIR), 'utf8').split('\n').slice(0, 25).join('\n')))

interface Report { engine: string; suites: string[]; mutants: number; killed: number; crashed: number; survived: number; survivors: Array<{ line: number; from: string; to: string; context: string }> }
const reports: Report[] = []
const originals = new Map<string, string>()
const restoreAll = () => { for (const [path, text] of originals) writeFileSync(path, text) }
process.on('SIGINT', () => { restoreAll(); process.exit(130) })

try {
  for (const { id } of registry.entries) {
    if (only.length && !only.includes(id)) continue
    const path = new URL(`${id}.ts`, ENGINE_DIR).pathname
    const source = readFileSync(path, 'utf8')
    originals.set(path, source)
    const names = exportedCalculators(source)
    const relevant = suites.filter((f) => allEngineSuites.includes(f) || names.some((n) => invokes(suiteCode.get(f)!, n)))
    const report: Report = { engine: id, suites: relevant, mutants: 0, killed: 0, crashed: 0, survived: 0, survivors: [] }
    if (relevant.length === 0) { reports.push(report); continue }
    const baseline = await Promise.all(relevant.map(runSuite))
    if (baseline.some((r) => r.code !== 0)) throw new Error(`baseline failed for ${id}: sweep results would be meaningless`)
    const literals = numericLiterals(source).slice(0, maxPer)
    for (const lit of literals) {
      const mutated = source.slice(0, lit.start) + mutate(lit.text) + source.slice(lit.start + lit.text.length)
      writeFileSync(path, mutated)
      const results = await Promise.all(relevant.map(runSuite))
      report.mutants++
      if (results.some((r) => r.code !== 0 && /AssertionError/.test(r.stderr))) report.killed++
      else if (results.some((r) => r.code !== 0)) report.crashed++
      else {
        report.survived++
        report.survivors.push({ line: lit.line, from: lit.text, to: mutate(lit.text), context: source.split('\n')[lit.line - 1]!.trim().slice(0, 110) })
      }
    }
    writeFileSync(path, source)
    reports.push(report)
    console.log(`${id}: ${report.mutants} mutants, killed ${report.killed}, crashed ${report.crashed}, survived ${report.survived} (suites: ${relevant.length})`)
  }
} finally {
  restoreAll()
}

const sum = (k: 'mutants' | 'killed' | 'crashed' | 'survived') => reports.reduce((a, r) => a + r[k], 0)
console.log(`TOTAL: ${reports.length} engines, ${sum('mutants')} mutants, killed ${sum('killed')}, crashed ${sum('crashed')}, survived ${sum('survived')}`)
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify({ totals: { engines: reports.length, mutants: sum('mutants'), killed: sum('killed'), crashed: sum('crashed'), survived: sum('survived') }, reports }, null, 1) + '\n')
