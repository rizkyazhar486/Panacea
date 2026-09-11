import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/lib/mesinCari.ts', import.meta.url), 'utf8')

assert.match(source, /import \{ WIDGETS \} from '\.\/homeWidgets'/)
assert.doesNotMatch(source, /import\('\.\/homeWidgets'\)/)
assert.match(source, /for \(const w of WIDGETS\)/)

console.log('Global search reuses the already-eager Home widget catalogue without a fake dynamic-import split boundary.')
