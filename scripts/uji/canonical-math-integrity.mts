import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const canonical = [
  'PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md',
  'PANACEA_PRODUCT_MATURITY_OS.md',
  'PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md',
]

for (const path of canonical) {
  const text = readFileSync(path, 'utf8')
  const forbidden = [...text].filter((ch) => {
    const code = ch.charCodeAt(0)
    return code < 0x20 && ch !== '\n' && ch !== '\t'
  })
  assert.deepEqual(
    forbidden,
    [],
    `${path} contains control characters that can corrupt mathematical notation`,
  )
}

const maturity = readFileSync('PANACEA_PRODUCT_MATURITY_OS.md', 'utf8')
assert.match(maturity, /S_\{compound\}[\s\S]*?\\times[\s\S]*?D_\{personalization\}/)
assert.match(maturity, /V\s*=\s*[\s\S]*?\\frac\{D\s*\\times\s*R/)
assert.match(maturity, /Data\s*\\rightarrow\s*PatientState/)

const platform = readFileSync('PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md', 'utf8')
assert.match(platform, /\\boldsymbol\{\\theta\}/)
assert.match(platform, /\\boldsymbol\{\\epsilon\}/)

console.log('canonical-math-integrity: lulus')
