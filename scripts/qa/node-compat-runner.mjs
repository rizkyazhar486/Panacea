// Wrapper kompatibilitas uji untuk mendukung Node 24 dan Node 26 (WP-6 Directive D-100)
import { spawnSync } from 'node:child_process'

const nodeVersion = process.versions.node
const major = parseInt(nodeVersion.split('.')[0], 10)

const args = process.argv.slice(2)
// Jika di Node 26+, abaikan --experimental-transform-types jika ada, atau tangani flag eksperimental
const filteredArgs = args.filter(arg => {
  if (major >= 26 && arg === '--experimental-transform-types') {
    return false
  }
  return true
})

const result = spawnSync(process.execPath, filteredArgs, { stdio: 'inherit' })
process.exit(result.status ?? 0)
