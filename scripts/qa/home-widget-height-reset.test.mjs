import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const tumpukan = readFileSync(new URL('../../src/components/Tumpukan.tsx', import.meta.url), 'utf8')

test('Living Instrument resets stale stage height before the next widget paints', () => {
  assert.match(tumpukan, /import \{ Suspense, useEffect, useLayoutEffect, useRef, useState/)
  assert.match(
    tumpukan,
    /useLayoutEffect\(\(\) => \{\s*setTinggi\(TINGGI_MIN\)\s*\}, \[aktifItem\?\.i\]\)/,
  )
})
