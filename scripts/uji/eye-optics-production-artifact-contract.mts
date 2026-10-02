import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const di = dirname(fileURLToPath(import.meta.url))
const sumber = readFileSync(join(di, '..', 'qa', 'eye-optics-smoke.mjs'), 'utf8')

const larangan: Array<[string, RegExp]> = [
  ['detached browser page creation', /\bnewPage\s*\(/],
  ['replacement markup injection', /\.setContent\s*\(/],
  ['DOM cloning for artifact capture', /\.cloneNode\s*\(/],
  ['hiding the production canvas', /\.style\.visibility\s*=\s*['"]hidden['"]/],
]

for (const [label, pola] of larangan) {
  assert.doesNotMatch(
    sumber,
    pola,
    `Eye production artifact contract forbids ${label}; capture the original production-styled page instead`,
  )
}

assert.match(
  sumber,
  /aria-label=["']Educational ocular optics schematic["']/,
  'Eye artifact QA must remain anchored to the shipped ocular optics lesson',
)

console.log('✓ Eye optics artifact capture remains on the original production-styled page without hidden canvas or detached/restyled markup')
