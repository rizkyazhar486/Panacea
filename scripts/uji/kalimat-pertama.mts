import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { kalimatPertama } from '../../src/domains/body-exposure/engine/kalimatPertama.ts'

const duaDuaPuluh = `${'a'.repeat(219)}.`
const duaDuaSatu = `${'b'.repeat(221)}`

assert.equal(kalimatPertama('**Femur** is a bone. More detail follows.'), 'Femur is a bone.', 'the first sentence is the viewport fact')
assert.equal(kalimatPertama(''), '', 'empty text stays empty and is not replaced with a guess')
assert.equal(kalimatPertama('   \n\t '), '', 'whitespace is not a fact')
assert.equal(kalimatPertama(duaDuaPuluh), duaDuaPuluh, 'a 220-character sentence is kept whole')
assert.equal(kalimatPertama(duaDuaSatu).length, 220, 'one character past the limit is cut to 220 including the ellipsis')
assert.equal(kalimatPertama(duaDuaSatu).endsWith('…'), true)

const tertulis = readFileSync(new URL('../../src/lib/explainFallback.ts', import.meta.url), 'utf8')
assert.match(tertulis, /export \{ kalimatPertama \}/, 'the written explainer re-exports the one-sentence fact')
const shell = readFileSync(new URL('../../src/components/Shell.tsx', import.meta.url), 'utf8')
assert.match(shell, /pathname === '\/body-explorer'/, 'the reference atlas is reachable before sign-in')
const explorer = readFileSync(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
assert.match(explorer, /id="fakta-atlas"/, 'the one fact sits on the atlas viewport')
assert.match(explorer, /stageClassName=/, 'the atlas stage leaves room for search and one fact')
assert.match(explorer, /id="laboratorium-atlas"/, 'the dense laboratory stays behind one disclosure')
assert.match(explorer, /upstream cut is not pinned/, 'the missing source revision stays visible')

console.log('kalimat-pertama: one atlas fact, public body explorer, unpinned source stays stated')
