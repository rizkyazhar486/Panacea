import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const di = dirname(fileURLToPath(import.meta.url))
const sumber = readFileSync(join(di, '..', '..', 'src', 'pages', 'bodyhub', 'DrugSection.tsx'), 'utf8')

assert.match(
  sumber,
  /aria-label=["']Search drug, vaccine or serum["']/,
  'Drug search must keep an accessible name',
)
assert.match(
  sumber,
  /<button\s+type=["']button["']\s+onClick=\{\(\) => pilih\(s\.nama\)\}/,
  'Drug suggestions must remain explicit non-submit buttons',
)
assert.match(
  sumber,
  /\{loading && <p role=["']status["']/,
  'Drug lookup progress must remain exposed as status',
)
assert.match(
  sumber,
  /\{error && <p role=["']alert["']/,
  'Drug lookup failures must remain exposed as alerts',
)

console.log('✓ DrugSection keeps deterministic search, suggestion, progress, and failure accessibility semantics')
