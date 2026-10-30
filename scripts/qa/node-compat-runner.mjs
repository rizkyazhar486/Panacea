// Wrapper kompatibilitas uji yang disempurnakan untuk runner CI (Directive D-100)
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const filteredArgs = args.filter(arg => arg !== '--experimental-transform-types')

const result = spawnSync(process.execPath, filteredArgs, { 
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: '' }
})
process.exit(result.status ?? 0)
