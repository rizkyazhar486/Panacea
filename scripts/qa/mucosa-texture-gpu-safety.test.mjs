import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

test('mucosaTexture avoids GPU ctx.filter readback crash and enables willReadFrequently', () => {
  const src = readFileSync(
    new URL('../../src/components/bodyhub/endoscopy/mucosaTexture.ts', import.meta.url),
    'utf8',
  )
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  assert.doesNotMatch(code, /\.\s*filter\s*=/, 'ctx.filter causes Chrome Metal GPU process crash when followed by getImageData')
  const matches = code.match(/getContext\(\s*['"]2d['"]\s*,\s*\{\s*willReadFrequently:\s*true\s*\}\s*\)/g) ?? []
  assert.equal(matches.length, 2, 'both 2D canvases in mucosaTexture.ts must pass { willReadFrequently: true }')
})

test('endoscopy modules contain zero TEMP-BISECT debug markers', () => {
  const dirs = [
    new URL('../../src/components/bodyhub/endoscopy/', import.meta.url),
    new URL('../../src/domains/body-exposure/engine/endoscopy/', import.meta.url),
  ]
  for (const dirUrl of dirs) {
    for (const file of readdirSync(dirUrl)) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue
      const content = readFileSync(join(dirUrl.pathname, file), 'utf8')
      assert.doesNotMatch(content, /TEMP-BISECT/, `${file} still contains TEMP-BISECT debug markers`)
    }
  }
  const workbench = readFileSync(new URL('../../src/pages/bodyhub/VirtualEndoscopyWorkbench.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(workbench, /TEMP-BISECT/, 'VirtualEndoscopyWorkbench.tsx still contains TEMP-BISECT debug markers')
})
