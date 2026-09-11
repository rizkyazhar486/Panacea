import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/components/Body3D.tsx', import.meta.url), 'utf8')

assert.match(source, /const \[retryNonce, setRetryNonce\] = useState\(0\)/)
assert.match(source, /\}, \[layers, retryNonce\]\)/)
assert.match(source, /modelCache\.delete\(def\.file\)/)
assert.match(source, /onClick=\{\(\) => setRetryNonce\(\(n\) => n \+ 1\)\}/)
assert.match(source, />\s*\{isLoading \? 'Retrying…' : 'Retry'\}\s*<\/button>/)
assert.doesNotMatch(source, /toggle the layer off and on to retry/i)

console.log('Body3D failed-layer retry is explicit, cache-safe, and regression-guarded.')
