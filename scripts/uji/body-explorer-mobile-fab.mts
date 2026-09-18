import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/components/FabNavigasi.tsx', import.meta.url), 'utf8')

assert.match(source, /const sembunyikanDiBodyExplorer = lokasi\.pathname\.startsWith\('\/body-explorer'\)/)
assert.match(source, /if \(sembunyikanDiBodyExplorer\) return null/)
assert.doesNotMatch(source, /className="fixed z-50 lg:hidden"/,
  'Assistive Touch must remain available on wider viewports outside Body Explorer')
assert.match(source, /className="fixed z-50"/,
  'Assistive Touch must retain one fixed global positioning root')

console.log('Body Explorer Assistive Touch is route-suppressed for WebGL pointer ownership and otherwise remains globally available.')
