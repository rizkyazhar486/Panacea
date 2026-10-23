import test from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

test('mandatory lab-review browser fixture resolves its real page dependency graph', async () => {
  await build({
    absWorkingDir: fileURLToPath(new URL('../../', import.meta.url)),
    entryPoints: ['qa/lab-result-review.tsx'],
    bundle: true,
    write: false,
    packages: 'external',
    loader: { '.css': 'empty' },
    format: 'esm',
    logLevel: 'silent',
  })
})
