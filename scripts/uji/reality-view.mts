import { readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { typeScriptRunnerArgs } from './node-runtime-flags.mjs'

const suite = new URL('../../tests/reality-view/', import.meta.url)
const tests = readdirSync(suite, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.test.mjs'))
  .map((entry) => fileURLToPath(new URL(entry.name, suite)))
  .sort()

if (tests.length === 0) throw new Error('No Reality View tests found')

execFileSync(process.execPath, [
  ...typeScriptRunnerArgs(process.versions.node),
  '--import=' + new URL('./typescript-resolver.mjs', import.meta.url).href,
  '--test',
  ...tests,
], { stdio: 'inherit' })
