import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/components/FabNavigasi.tsx', import.meta.url), 'utf8')

assert.match(source, /const sembunyikanDiBodyExplorer = lokasi\.pathname\.startsWith\('\/body-explorer'\)/)
assert.match(source, /if \(sembunyikanDiBodyExplorer\) return null/)
assert.match(source, /className="fixed z-50 lg:hidden"/)

console.log('Body Explorer mobile FAB overlap is route-suppressed without changing desktop navigation.')
