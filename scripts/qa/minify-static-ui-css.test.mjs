import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { minifyUiIterationCssDir } from '../vite/minifyStaticUiCss.mjs'

test('minifyUiIterationCssDir strips comments and whitespace while preserving CSS semantics and JS files', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'panacea-minify-ui-css-'))
  try {
    const cssPath = join(dir, 'sample-v46.css')
    const jsPath = join(dir, 'sample-v46.js')
    const cssSource = `
      /* verbose header comment that should be removed */
      :root {
        --surface-token: #0b1116;
      }

      @media (min-width: 1024px) {
        .panacea-panel > .card {
          color: var(--surface-token) !important;
          margin: 12px 16px;
        }
      }
    `
    const jsSource = '/* keep js verbatim */\nwindow.__panacea = 1;\n'

    writeFileSync(cssPath, cssSource, 'utf8')
    writeFileSync(jsPath, jsSource, 'utf8')

    const stats = await minifyUiIterationCssDir(dir)
    const minifiedCss = readFileSync(cssPath, 'utf8')
    const untouchedJs = readFileSync(jsPath, 'utf8')

    assert.equal(stats.files, 1)
    assert.ok(stats.bytesAfter < stats.bytesBefore, 'expected minified CSS byte size to shrink')
    assert.ok(!minifiedCss.includes('verbose header comment'), 'expected CSS comments to be stripped')
    assert.ok(minifiedCss.includes('--surface-token: #0b1116'), 'expected CSS custom properties to be preserved')
    assert.ok(minifiedCss.includes('@media(min-width:1024px)'), 'expected media queries to be preserved')
    assert.ok(minifiedCss.includes('!important'), 'expected !important rules to be preserved')
    assert.ok(minifiedCss.includes('.panacea-panel>.card'), 'expected selectors to be preserved')
    assert.equal(untouchedJs, jsSource, 'expected .js files to remain byte-identical')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('minifyUiIterationCssDir returns zero counts when directory does not exist', async () => {
  const missingDir = join(tmpdir(), 'panacea-missing-ui-iterations-' + Date.now())
  const stats = await minifyUiIterationCssDir(missingDir)
  assert.deepEqual(stats, { files: 0, bytesBefore: 0, bytesAfter: 0 })
})
