import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { transformWithEsbuild } from 'vite'

/**
 * Minify comment and redundant whitespace in built static `ui-iterations/*.css`
 * artifacts without altering authored files under `public/ui-iterations/`.
 */
export async function minifyUiIterationCssDir(dir) {
  if (!existsSync(dir)) {
    return { files: 0, bytesBefore: 0, bytesAfter: 0 }
  }

  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.css'))
    .map((entry) => entry.name)
    .sort()

  let files = 0
  let bytesBefore = 0
  let bytesAfter = 0

  for (const name of entries) {
    const filePath = join(dir, name)
    const source = readFileSync(filePath, 'utf8')
    const rawBefore = Buffer.byteLength(source, 'utf8')
    const result = await transformWithEsbuild(source, filePath, {
      loader: 'css',
      minifyWhitespace: true,
      legalComments: 'none',
    })
    const codeBefore = rawBefore
    const rawAfter = Buffer.byteLength(result.code, 'utf8')

    bytesBefore += codeBefore
    if (result.code.length > 0 && rawAfter < codeBefore) {
      writeFileSync(filePath, result.code, 'utf8')
      bytesAfter += rawAfter
    } else {
      bytesAfter += codeBefore
    }
    files += 1
  }

  return { files, bytesBefore, bytesAfter }
}

/**
 * Vite build plugin that minifies static `ui-iterations/*.css` copied from
 * `public/` into the configured `outDir`.
 */
export function minifyStaticUiCss() {
  let outDir = resolve('dist')

  return {
    name: 'panacea-minify-static-ui-css',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      await minifyUiIterationCssDir(join(outDir, 'ui-iterations'))
    },
  }
}
